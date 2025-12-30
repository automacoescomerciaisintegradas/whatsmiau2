package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"time"

	"whatsmiau2/internal/database"
	"whatsmiau2/internal/models"
	"whatsmiau2/internal/whatsapp"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// InstanceHandler handles instance-related requests
type InstanceHandler struct {
	manager *whatsapp.Manager
	db      *database.Database
}

// NewInstanceHandler creates a new instance handler
func NewInstanceHandler(manager *whatsapp.Manager, db *database.Database) *InstanceHandler {
	return &InstanceHandler{
		manager: manager,
		db:      db,
	}
}

// CreateInstance creates a new WhatsApp instance
// POST /v1/instance or POST /v1/instance/create
func (h *InstanceHandler) CreateInstance(c *gin.Context) {
	var req models.CreateInstanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	// Generate instance ID if not provided
	instanceID := req.Token
	if instanceID == "" {
		instanceID = uuid.New().String()
	}

	// Check if instance already exists
	if existingInstance, _ := h.db.GetInstanceByName(req.InstanceName); existingInstance != nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "Conflict",
			"message": "Instance with this name already exists",
		})
		return
	}

	// Create instance in database
	instance := &models.Instance{
		ID:           instanceID,
		Name:         req.InstanceName,
		Status:       models.StatusDisconnected,
		WebhookURL:   req.Webhook,
		WebhookToken: req.WebhookToken,
	}

	if err := h.db.CreateInstance(instance); err != nil {
		zap.L().Error("Failed to create instance in database", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to create instance",
		})
		return
	}

	// Create WhatsApp client
	client, err := h.manager.GetOrCreateClient(instanceID)
	if err != nil {
		zap.L().Error("Failed to create WhatsApp client", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to create WhatsApp client",
		})
		return
	}

	response := models.InstanceResponse{
		Instance: models.InstanceData{
			InstanceName: req.InstanceName,
			InstanceID:   instanceID,
			Status:       string(models.StatusDisconnected),
			Integration:  "WHATSAPP-BAILEYS",
		},
		Hash: instanceID,
	}

	// If QR code is requested, connect and return QR
	if req.QRCode {
		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer cancel()

		if err := client.Connect(ctx); err != nil {
			zap.L().Error("Failed to connect", zap.Error(err))
		}

		// Wait for QR code
		select {
		case qrCode := <-client.QRChannel:
			qrBase64, _ := client.GetQRCodeBase64(qrCode)
			response.QRCode = &models.QRCodeData{
				Code:   qrCode,
				Base64: qrBase64,
				Count:  1,
			}
			h.db.UpdateInstanceStatus(instanceID, models.StatusQRCode)
		case <-time.After(10 * time.Second):
			// No QR code received yet
		case <-ctx.Done():
			// Timeout
		}
	}

	c.JSON(http.StatusCreated, response)
}

// ListInstances lists all instances
// GET /v1/instance or GET /v1/instance/fetchInstances
func (h *InstanceHandler) ListInstances(c *gin.Context) {
	instances, err := h.db.GetAllInstances()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to fetch instances",
		})
		return
	}

	response := make([]models.InstanceResponse, 0)
	for _, inst := range instances {
		response = append(response, models.InstanceResponse{
			Instance: models.InstanceData{
				InstanceName: inst.Name,
				InstanceID:   inst.ID,
				Owner:        inst.PhoneNumber,
				ProfileName:  inst.ProfileName,
				ProfilePic:   inst.ProfilePic,
				Status:       string(inst.Status),
				Integration:  "WHATSAPP-BAILEYS",
			},
		})
	}

	c.JSON(http.StatusOK, response)
}

// ConnectInstance connects an instance
// POST /v1/instance/:id/connect or GET /v1/instance/connect/:id
func (h *InstanceHandler) ConnectInstance(c *gin.Context) {
	instanceID := c.Param("id")

	// Get instance from database
	instance, err := h.db.GetInstance(instanceID)
	if err != nil {
		// Try to find by name
		instance, err = h.db.GetInstanceByName(instanceID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Not Found",
				"message": "Instance not found",
			})
			return
		}
		instanceID = instance.ID
	}

	// Get or create client
	client, err := h.manager.GetOrCreateClient(instanceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to get WhatsApp client",
		})
		return
	}

	// Check if already connected
	if client.IsConnected() {
		c.JSON(http.StatusOK, gin.H{
			"instance": instanceID,
			"state":    "open",
			"message":  "Already connected",
		})
		return
	}

	// Connect
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	if err := client.Connect(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to connect: " + err.Error(),
		})
		return
	}

	// Wait for QR code or connection - increased timeout for Business API
	select {
	case qrCode := <-client.QRChannel:
		qrBase64, _ := client.GetQRCodeBase64(qrCode)
		h.db.UpdateInstanceStatus(instanceID, models.StatusQRCode)
		c.JSON(http.StatusOK, gin.H{
			"instance": instanceID,
			"state":    "qrcode",
			"qrcode": gin.H{
				"code":   qrCode,
				"base64": qrBase64,
			},
		})
	case <-time.After(30 * time.Second):
		// Give more time for WhatsApp Business to connect after QR scan
		if client.IsConnected() {
			c.JSON(http.StatusOK, gin.H{
				"instance": instanceID,
				"state":    "open",
				"message":  "Connected successfully",
			})
		} else {
			c.JSON(http.StatusOK, gin.H{
				"instance": instanceID,
				"state":    "connecting",
				"message":  "Connecting... Please wait for QR scan or check status later",
			})
		}
	}
}

// GetInstanceStatus gets the connection status of an instance
// GET /v1/instance/:id/status or GET /v1/instance/connectionState/:id
func (h *InstanceHandler) GetInstanceStatus(c *gin.Context) {
	instanceID := c.Param("id")

	// Get instance from database
	instance, err := h.db.GetInstance(instanceID)
	if err != nil {
		// Try to find by name
		instance, err = h.db.GetInstanceByName(instanceID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Not Found",
				"message": "Instance not found",
			})
			return
		}
	}

	// Check actual connection state from the WhatsApp client
	state := string(instance.Status)
	actuallyConnected := false

	if client, exists := h.manager.GetClient(instance.ID); exists {
		actuallyConnected = client.IsConnected()
		if actuallyConnected {
			state = "open"
		} else {
			// Client exists but not connected - check if we need to sync database
			if instance.Status == models.StatusConnected {
				// Database says connected but client is not - sync database
				h.db.UpdateInstanceStatus(instance.ID, models.StatusDisconnected)
				state = "disconnected"
				zap.L().Info("Fixed connection state mismatch",
					zap.String("instanceId", instance.ID),
					zap.String("dbState", string(instance.Status)),
					zap.String("actualState", "disconnected"),
				)
			}
		}
	} else {
		// No client exists - ensure database reflects this
		if instance.Status == models.StatusConnected {
			h.db.UpdateInstanceStatus(instance.ID, models.StatusDisconnected)
			state = "disconnected"
		}
	}

	c.JSON(http.StatusOK, models.ConnectionState{
		Instance: instance.Name,
		State:    state,
	})
}

// LogoutInstance logs out from an instance
// POST /v1/instance/:id/logout or DELETE /v1/instance/logout/:id
func (h *InstanceHandler) LogoutInstance(c *gin.Context) {
	instanceID := c.Param("id")

	// Get instance from database
	instance, err := h.db.GetInstance(instanceID)
	if err != nil {
		// Try to find by name
		instance, err = h.db.GetInstanceByName(instanceID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Not Found",
				"message": "Instance not found",
			})
			return
		}
		instanceID = instance.ID
	}

	// Get client and logout
	if client, exists := h.manager.GetClient(instanceID); exists {
		// First logout from WhatsApp
		if err := client.Logout(); err != nil {
			zap.L().Error("Failed to logout from WhatsApp", zap.Error(err))
		}

		// Then disconnect and remove from manager
		client.Disconnect()
	}

	// Remove client from manager completely
	h.manager.RemoveClient(instanceID)

	// Update status
	h.db.UpdateInstanceStatus(instanceID, models.StatusDisconnected)

	c.JSON(http.StatusOK, gin.H{
		"instance": instance.Name,
		"message":  "Logged out successfully",
		"state":    "close",
	})
}

// DeleteInstance deletes an instance
// DELETE /v1/instance/:id or DELETE /v1/instance/delete/:id
func (h *InstanceHandler) DeleteInstance(c *gin.Context) {
	instanceID := c.Param("id")

	// Get instance from database
	instance, err := h.db.GetInstance(instanceID)
	if err != nil {
		// Try to find by name
		instance, err = h.db.GetInstanceByName(instanceID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Not Found",
				"message": "Instance not found",
			})
			return
		}
		instanceID = instance.ID
	}

	// Remove client
	h.manager.RemoveClient(instanceID)

	// Delete from database
	if err := h.db.DeleteInstance(instanceID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to delete instance",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"instance": instance.Name,
		"message":  "Instance deleted successfully",
	})
}

// UpdateInstance updates an instance
// PUT /v1/instance/update/:id
func (h *InstanceHandler) UpdateInstance(c *gin.Context) {
	instanceID := c.Param("id")

	var req models.UpdateInstanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	// Get instance from database
	instance, err := h.db.GetInstance(instanceID)
	if err != nil {
		// Try to find by name
		instance, err = h.db.GetInstanceByName(instanceID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Not Found",
				"message": "Instance not found",
			})
			return
		}
	}

	// Update fields
	if req.Webhook != "" {
		instance.WebhookURL = req.Webhook
	}
	if req.WebhookToken != "" {
		instance.WebhookToken = req.WebhookToken
	}

	if err := h.db.UpdateInstance(instance); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to update instance",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"instance": instance.Name,
		"message":  "Instance updated successfully",
	})
}

// PairPhoneInstance requests a pairing code for a phone number
// POST /v1/instance/:id/pairPhone
func (h *InstanceHandler) PairPhoneInstance(c *gin.Context) {
	instanceID := c.Param("id")

	var req struct {
		PhoneNumber string `json:"phoneNumber" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	// Get instance from database
	instance, err := h.db.GetInstance(instanceID)
	if err != nil {
		instance, err = h.db.GetInstanceByName(instanceID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Not Found",
				"message": "Instance not found",
			})
			return
		}
		instanceID = instance.ID
	}

	// Get or create client
	client, err := h.manager.GetOrCreateClient(instanceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to get WhatsApp client",
		})
		return
	}

	// Request pairing code
	code, err := client.PairPhone(req.PhoneNumber)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to request pairing code: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"instance": instanceID,
		"code":     code,
		"message":  "Pairing code generated successfully",
	})
}

// GetWebhookConfig gets the webhook configuration for an instance
// GET /v1/instance/webhook/:id
func (h *InstanceHandler) GetWebhookConfig(c *gin.Context) {
	instanceID := c.Param("id")

	// Get instance from database
	instance, err := h.db.GetInstance(instanceID)
	if err != nil {
		// Try to find by name
		instance, err = h.db.GetInstanceByName(instanceID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Not Found",
				"message": "Instance not found",
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"instance":     instance.Name,
		"webhookUrl":   instance.WebhookURL,
		"webhookToken": instance.WebhookToken,
	})
}

// UpdateWebhookConfig updates the webhook configuration for an instance
// PUT /v1/instance/webhook/:id
func (h *InstanceHandler) UpdateWebhookConfig(c *gin.Context) {
	instanceID := c.Param("id")

	var req struct {
		WebhookURL   string `json:"webhookUrl"`
		WebhookToken string `json:"webhookToken"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	// Get instance from database
	instance, err := h.db.GetInstance(instanceID)
	if err != nil {
		// Try to find by name
		instance, err = h.db.GetInstanceByName(instanceID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Not Found",
				"message": "Instance not found",
			})
			return
		}
	}

	// Update webhook fields
	instance.WebhookURL = req.WebhookURL
	instance.WebhookToken = req.WebhookToken

	if err := h.db.UpdateInstance(instance); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to update webhook configuration",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"instance": instance.Name,
		"message":  "Webhook configuration updated successfully",
	})
}

// TestWebhook sends a test event to the webhook URL
// POST /v1/instance/webhook/:id/test
func (h *InstanceHandler) TestWebhook(c *gin.Context) {
	instanceID := c.Param("id")

	// Get instance from database
	instance, err := h.db.GetInstance(instanceID)
	if err != nil {
		// Try to find by name
		instance, err = h.db.GetInstanceByName(instanceID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "Not Found",
				"message": "Instance not found",
			})
			return
		}
	}

	if instance.WebhookURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "No webhook URL configured for this instance",
		})
		return
	}

	// Create test payload
	testPayload := map[string]interface{}{
		"event":    "test.webhook",
		"instance": instance.Name,
		"data": map[string]interface{}{
			"message":   "This is a test webhook event from WhatsMiau2",
			"timestamp": time.Now().Unix(),
		},
	}

	payloadBytes, err := json.Marshal(testPayload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to create test payload",
		})
		return
	}

	// Create HTTP request
	req, err := http.NewRequest("POST", instance.WebhookURL, bytes.NewBuffer(payloadBytes))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to create webhook request",
		})
		return
	}

	req.Header.Set("Content-Type", "application/json")
	if instance.WebhookToken != "" {
		req.Header.Set("Authorization", instance.WebhookToken)
	}

	// Send request with timeout
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		zap.L().Error("Failed to send test webhook",
			zap.String("instance", instance.Name),
			zap.String("url", instance.WebhookURL),
			zap.Error(err),
		)
		c.JSON(http.StatusOK, gin.H{
			"instance": instance.Name,
			"message":  "Test webhook sent, but request failed: " + err.Error(),
			"success":  false,
		})
		return
	}
	defer resp.Body.Close()

	zap.L().Info("Test webhook sent successfully",
		zap.String("instance", instance.Name),
		zap.String("url", instance.WebhookURL),
		zap.Int("status", resp.StatusCode),
	)

	c.JSON(http.StatusOK, gin.H{
		"instance":   instance.Name,
		"message":    "Test webhook sent successfully",
		"success":    true,
		"statusCode": resp.StatusCode,
	})
}
