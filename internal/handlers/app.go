package handlers

import (
	"context"
	"net/http"
	"time"

	"whatsmiau2/internal/database"
	"whatsmiau2/internal/whatsapp"

	"github.com/gin-gonic/gin"
)

// AppHandler implements high‑level app operations such as login, logout, reconnect and device listing.
type AppHandler struct {
	manager *whatsapp.Manager
	db      *database.Database
}

func NewAppHandler(manager *whatsapp.Manager, db *database.Database) *AppHandler {
	return &AppHandler{manager: manager, db: db}
}

// Login to WhatsApp server (creates a new instance if needed and starts the client).
// Returns QR code info if not yet logged in.
// GET /v1/app/login/:instance
func (h *AppHandler) Login(c *gin.Context) {
	instanceID := c.Param("instance")

	client, err := h.manager.GetOrCreateClient(instanceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "INTERNAL_SERVER_ERROR",
			"message": err.Error(),
			"results": gin.H{},
		})
		return
	}

	if client.IsConnected() {
		c.JSON(http.StatusOK, gin.H{
			"code":    "SUCCESS",
			"message": "Already connected",
			"results": gin.H{
				"status": "connected",
			},
		})
		return
	}

	// Trigger connection
	if err := client.Connect(context.Background()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "INTERNAL_SERVER_ERROR",
			"message": err.Error(),
			"results": gin.H{},
		})
		return
	}

	// Wait for QR code
	select {
	case qrCode := <-client.QRChannel:
		qrBase64, _ := client.GetQRCodeBase64(qrCode)
		c.JSON(http.StatusOK, gin.H{
			"code":    "SUCCESS",
			"message": "Success",
			"results": gin.H{
				"qr_duration": 30,
				"qr_code":     qrCode,
				"qr_base64":   qrBase64,
			},
		})
	case <-time.After(10 * time.Second):
		if client.IsConnected() {
			c.JSON(http.StatusOK, gin.H{
				"code":    "SUCCESS",
				"message": "Connected",
				"results": gin.H{"status": "connected"},
			})
		} else {
			c.JSON(http.StatusOK, gin.H{
				"code":    "PENDING",
				"message": "Waiting for connection",
				"results": gin.H{"status": "connecting"},
			})
		}
	}
}

// LoginWithCode requests a pairing code for phone number login.
// POST /v1/app/login-with-code/:instance
func (h *AppHandler) LoginWithCode(c *gin.Context) {
	instanceID := c.Param("instance")

	var req struct {
		PhoneNumber string `json:"phone_number" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    "BAD_REQUEST",
			"message": "phone_number is required",
			"results": gin.H{},
		})
		return
	}

	client, err := h.manager.GetOrCreateClient(instanceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "INTERNAL_SERVER_ERROR",
			"message": err.Error(),
			"results": gin.H{},
		})
		return
	}

	// Request pairing code
	code, err := client.PairPhone(req.PhoneNumber)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    "INTERNAL_SERVER_ERROR",
			"message": "Failed to request pairing code: " + err.Error(),
			"results": gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    "SUCCESS",
		"message": "Pairing code generated",
		"results": gin.H{
			"code": code,
		},
	})
}

// Logout – removes session and clears DB (already exists in InstanceHandler, but expose here for symmetry).
// GET /v1/app/logout/:instance
func (h *AppHandler) Logout(c *gin.Context) {
	instanceID := c.Param("instance")
	// reuse existing logout logic via InstanceHandler – here we just call manager.RemoveClient
	h.manager.RemoveClient(instanceID)
	c.JSON(http.StatusOK, gin.H{"status": "logged_out"})
}

// Reconnect – forces a reconnection to WhatsApp server.
// GET /v1/app/reconnect/:instance
func (h *AppHandler) Reconnect(c *gin.Context) {
	instanceID := c.Param("instance")
	client, ok := h.manager.GetClient(instanceID)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "instance not found"})
		return
	}
	// Disconnect first if needed
	client.Disconnect()
	// Connect again
	if err := client.Connect(context.Background()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "reconnected"})
}

// List connected devices (clients) for the current instance.
// GET /v1/app/devices/:instance
func (h *AppHandler) ListDevices(c *gin.Context) {
	instanceID := c.Param("instance")
	client, ok := h.manager.GetClient(instanceID)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "instance not found"})
		return
	}
	// The client stores its own JID; we can also expose other devices via client.WA.GetDevices if needed.
	devices := []string{client.WA.Store.ID.String()}
	c.JSON(http.StatusOK, gin.H{"devices": devices})
}
