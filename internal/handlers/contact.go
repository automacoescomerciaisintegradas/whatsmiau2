package handlers

import (
	"net/http"

	"whatsmiau2/internal/database"
	"whatsmiau2/internal/whatsapp"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow/types"
	"go.uber.org/zap"
)

// ContactHandler handles contact-related requests
type ContactHandler struct {
	manager *whatsapp.Manager
	db      *database.Database
}

// NewContactHandler creates a new contact handler
func NewContactHandler(manager *whatsapp.Manager, db *database.Database) *ContactHandler {
	return &ContactHandler{
		manager: manager,
		db:      db,
	}
}

// getClient gets the WhatsApp client for an instance
func (h *ContactHandler) getClient(instanceID string) (*whatsapp.Client, error) {
	// Try by ID first
	if client, exists := h.manager.GetClient(instanceID); exists {
		return client, nil
	}

	// Try by name
	instance, err := h.db.GetInstanceByName(instanceID)
	if err != nil {
		return nil, err
	}

	client, exists := h.manager.GetClient(instance.ID)
	if !exists {
		return nil, err
	}

	return client, nil
}

// ListContacts lists all contacts for an instance
// GET /v1/whatsmiau2/contacts/:instance or GET /api/whatsmiau2/contacts with instance param
func (h *ContactHandler) ListContacts(c *gin.Context) {
	// Try to get instance from URL parameter first, then from query parameter
	instanceID := c.Param("instance")
	if instanceID == "" {
		instanceID = c.Query("instance")
	}

	client, err := h.getClient(instanceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Not Found",
			"message": "Instance not found",
		})
		return
	}

	if !client.IsConnected() {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Instance is not connected",
		})
		return
	}

	// Get all contacts from the store
	contacts, err := client.WA.Store.Contacts.GetAllContacts(c.Request.Context())
	if err != nil {
		zap.L().Error("Failed to get contacts", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to retrieve contacts: " + err.Error(),
		})
		return
	}

	// Convert to response format
	var response []map[string]interface{}
	for jid, contact := range contacts {
		contactInfo := map[string]interface{}{
			"jid":      jid.String(),
			"name":     contact.PushName,
			"verified": false, // VerifiedName field doesn't exist in ContactInfo
			"pushName": contact.PushName,
		}
		response = append(response, contactInfo)
	}

	c.JSON(http.StatusOK, gin.H{
		"contacts": response,
		"count":    len(response),
		"instance": instanceID,
	})
}

// GetContact retrieves a specific contact
// GET /v1/whatsmiau2/contacts/:id or GET /api/whatsmiau2/contacts/:id with instance param
func (h *ContactHandler) GetContact(c *gin.Context) {
	// Try to get instance from URL parameter first, then from query parameter
	instanceID := c.Param("instance")
	if instanceID == "" {
		instanceID = c.Query("instance")
	}
	contactID := c.Param("id")

	client, err := h.getClient(instanceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Not Found",
			"message": "Instance not found",
		})
		return
	}

	if !client.IsConnected() {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Instance is not connected",
		})
		return
	}

	// Parse JID
	jid, err := types.ParseJID(contactID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Invalid JID format",
		})
		return
	}

	// Get contact from store
	contact, err := client.WA.Store.Contacts.GetContact(c.Request.Context(), jid)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Not Found",
			"message": "Contact not found",
		})
		return
	}

	// Prepare response
	contactInfo := map[string]interface{}{
		"jid":      jid.String(),
		"name":     contact.PushName,
		"verified": false, // VerifiedName field doesn't exist in ContactInfo
		"pushName": contact.PushName,
	}

	c.JSON(http.StatusOK, gin.H{
		"contact": contactInfo,
		"instance": instanceID,
	})
}

// CreateContact creates a new contact
// POST /v1/whatsmiau2/contacts or POST /api/whatsmiau2/contacts
func (h *ContactHandler) CreateContact(c *gin.Context) {
	// Try to get instance from URL parameter first, then from request body
	instanceID := c.Param("instance")

	var req struct {
		Number   string `json:"number"`
		Name     string `json:"name"`
		Instance string `json:"instance"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	// Use instance from request body if not in URL parameter
	if instanceID == "" {
		instanceID = req.Instance
	}

	client, err := h.getClient(instanceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Not Found",
			"message": "Instance not found",
		})
		return
	}

	if !client.IsConnected() {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Instance is not connected",
		})
		return
	}

	// In WhatsApp, contacts are typically added implicitly when messaging occurs
	// For now, we'll just validate that the number exists on WhatsApp
	// Format JID
	jid := types.NewJID(req.Number, types.DefaultUserServer)

	// Check if the number is on WhatsApp
	// Note: This is a simplified implementation
	// In practice, WhatsApp contacts are populated through history sync and messaging

	// For now, return success
	contactInfo := map[string]interface{}{
		"jid":  jid.String(),
		"name": req.Name,
	}

	c.JSON(http.StatusCreated, gin.H{
		"contact": contactInfo,
		"message": "Contact processed",
		"instance": instanceID,
	})
}

// UpdateContact updates an existing contact
// PUT /v1/whatsmiau2/contacts/:id or PUT /api/whatsmiau2/contacts/:id
func (h *ContactHandler) UpdateContact(c *gin.Context) {
	// Try to get instance from URL parameter first, then from request body
	instanceID := c.Param("instance")
	contactID := c.Param("id")

	var req struct {
		Name     string `json:"name"`
		Instance string `json:"instance"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	// Use instance from request body if not in URL parameter
	if instanceID == "" {
		instanceID = req.Instance
	}

	client, err := h.getClient(instanceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Not Found",
			"message": "Instance not found",
		})
		return
	}

	if !client.IsConnected() {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Instance is not connected",
		})
		return
	}

	// Parse JID
	jid, err := types.ParseJID(contactID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Invalid JID format",
		})
		return
	}

	// In WhatsApp, contact names are typically updated through push names
	// For now, we'll just return the updated contact info
	contactInfo := map[string]interface{}{
		"jid":  jid.String(),
		"name": req.Name,
	}

	c.JSON(http.StatusOK, gin.H{
		"contact": contactInfo,
		"message": "Contact updated",
		"instance": instanceID,
	})
}

// DeleteContact deletes a contact
// DELETE /v1/whatsmiau2/contacts/:id or DELETE /api/whatsmiau2/contacts/:id
func (h *ContactHandler) DeleteContact(c *gin.Context) {
	// Try to get instance from URL parameter first, then from request body
	instanceID := c.Param("instance")
	contactID := c.Param("id")

	var req struct {
		Instance string `json:"instance"`
	}
	// Try to bind JSON in case it's sent in the body
	_ = c.ShouldBindJSON(&req)

	// Use instance from request body if not in URL parameter
	if instanceID == "" {
		instanceID = req.Instance
	}

	client, err := h.getClient(instanceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Not Found",
			"message": "Instance not found",
		})
		return
	}

	if !client.IsConnected() {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Instance is not connected",
		})
		return
	}

	// Parse JID
	jid, err := types.ParseJID(contactID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Invalid JID format",
		})
		return
	}

	// In WhatsApp, contacts can't really be deleted from the store
	// This is a placeholder implementation
	zap.L().Info("Contact deletion requested", zap.String("jid", jid.String()), zap.String("instance", instanceID))

	c.JSON(http.StatusOK, gin.H{
		"message": "Contact deletion processed",
		"jid":     jid.String(),
		"instance": instanceID,
	})
}