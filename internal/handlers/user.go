package handlers

import (
	"net/http"

	"whatsmiau2/internal/database"
	"whatsmiau2/internal/whatsapp"

	"github.com/gin-gonic/gin"
)

// UserHandler implements endpoints related to the logged-in user (profile, avatar, contacts, etc.).
type UserHandler struct {
	manager *whatsapp.Manager
	db      *database.Database
}

func NewUserHandler(manager *whatsapp.Manager, db *database.Database) *UserHandler {
	return &UserHandler{manager: manager, db: db}
}

// GetInfo returns basic user information (JID, push name, etc.).
// GET /v1/user/info/:instance
func (h *UserHandler) GetInfo(c *gin.Context) {
	instanceID := c.Param("instance")

	// Get instance from database
	instance, err := h.db.GetInstance(instanceID)
	if err != nil {
		instance, err = h.db.GetInstanceByName(instanceID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "instance not found"})
			return
		}
	}

	// Get client
	client, ok := h.manager.GetClient(instance.ID)
	if !ok || !client.IsConnected() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "instance not connected"})
		return
	}

	// Return basic info
	info := map[string]interface{}{
		"jid":         client.WA.Store.ID.String(),
		"pushName":    instance.ProfileName,
		"phoneNumber": instance.PhoneNumber,
		"connected":   true,
	}
	c.JSON(http.StatusOK, info)
}

// GetAvatar fetches the user's avatar URL.
// GET /v1/user/avatar/:instance
func (h *UserHandler) GetAvatar(c *gin.Context) {
	instanceID := c.Param("instance")

	// Get instance from database
	instance, err := h.db.GetInstance(instanceID)
	if err != nil {
		instance, err = h.db.GetInstanceByName(instanceID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "instance not found"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"url": instance.ProfilePic,
	})
}

// ChangeAvatar is a stub for future implementation
// POST /v1/user/avatar/:instance
func (h *UserHandler) ChangeAvatar(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented yet"})
}

// ChangePushName is a stub for future implementation
// POST /v1/user/pushname/:instance
func (h *UserHandler) ChangePushName(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented yet"})
}
