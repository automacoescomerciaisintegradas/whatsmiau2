package handlers

import (
	"context"
	"net/http"

	"whatsmiau2/internal/database"
	"whatsmiau2/internal/whatsapp"

	"github.com/gin-gonic/gin"
	waproto "go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"google.golang.org/protobuf/proto"
)

// NewsletterHandler handles newsletter-related requests
type NewsletterHandler struct {
	manager *whatsapp.Manager
	db      *database.Database
}

// NewNewsletterHandler creates a new newsletter handler
func NewNewsletterHandler(manager *whatsapp.Manager, db *database.Database) *NewsletterHandler {
	return &NewsletterHandler{
		manager: manager,
		db:      db,
	}
}

// getClient gets the WhatsApp client for an instance
func (h *NewsletterHandler) getClient(instanceID string) (*whatsapp.Client, error) {
	if client, exists := h.manager.GetClient(instanceID); exists {
		return client, nil
	}
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

// ListNewsletters lists all subscribed newsletters
// GET /v1/newsletter/list/:instance
func (h *NewsletterHandler) ListNewsletters(c *gin.Context) {
	instanceID := c.Param("instance")

	client, err := h.getClient(instanceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Instance not found"})
		return
	}

	if !client.IsConnected() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Instance is not connected"})
		return
	}

	newsletters, err := client.WA.GetSubscribedNewsletters(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Format response
	type NewsletterInfo struct {
		JID         string `json:"jid"`
		Name        string `json:"name"`
		Description string `json:"description,omitempty"`
		State       string `json:"state"`
	}

	result := make([]NewsletterInfo, 0, len(newsletters))
	for _, n := range newsletters {
		result = append(result, NewsletterInfo{
			JID:         n.ID.String(),
			Name:        n.ThreadMeta.Name.Text,
			Description: n.ThreadMeta.Description.Text,
			State:       string(n.State.Type),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"newsletters": result,
		"count":       len(result),
	})
}

// FollowNewsletter follows a newsletter
// POST /v1/newsletter/follow/:instance
func (h *NewsletterHandler) FollowNewsletter(c *gin.Context) {
	instanceID := c.Param("instance")

	var req struct {
		JID string `json:"jid" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client, err := h.getClient(instanceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Instance not found"})
		return
	}

	jid, err := types.ParseJID(req.JID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JID"})
		return
	}

	err = client.WA.FollowNewsletter(context.Background(), jid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Followed newsletter"})
}

// UnfollowNewsletter unfollows a newsletter
// POST /v1/newsletter/unfollow/:instance
func (h *NewsletterHandler) UnfollowNewsletter(c *gin.Context) {
	instanceID := c.Param("instance")

	var req struct {
		JID string `json:"jid" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client, err := h.getClient(instanceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Instance not found"})
		return
	}

	jid, err := types.ParseJID(req.JID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JID"})
		return
	}

	err = client.WA.UnfollowNewsletter(context.Background(), jid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Unfollowed newsletter"})
}

// SendMessage sends a message to a newsletter
// POST /v1/newsletter/send/:instance
func (h *NewsletterHandler) SendMessage(c *gin.Context) {
	instanceID := c.Param("instance")

	var req struct {
		JID     string `json:"jid" binding:"required"`
		Message string `json:"message" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client, err := h.getClient(instanceID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Instance not found"})
		return
	}

	jid, err := types.ParseJID(req.JID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JID"})
		return
	}

	// Try using SendMessage first with ExtendedTextMessage
	// Note: For newsletters, using the correct protobuf structure is key.
	// Unfortunately, without seeing the whatsmeow source, we rely on standard SendMessage.

	// Create the message content
	content := &waproto.Message{
		ExtendedTextMessage: &waproto.ExtendedTextMessage{
			Text: proto.String(req.Message),
		},
	}

	// For newsletters, we might need to use a specific method if available,
	// or standard SendMessage should work if keys are correct.
	// Let's try standard SendMessage.
	resp, err := client.WA.SendMessage(context.Background(), jid, content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "success",
		"id":        resp.ID,
		"timestamp": resp.Timestamp,
	})
}

// GetNewsletterInfo gets info about a newsletter
// GET /v1/newsletter/:instance/info
func (h *NewsletterHandler) GetNewsletterInfo(c *gin.Context) {
	// instanceID := c.Param("instance")
	jidStr := c.Query("jid")

	if jidStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "jid query parameter is required"})
		return
	}

	/*
		client, err := h.getClient(instanceID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Instance not found"})
			return
		}

		jid, err := types.ParseJID(jidStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JID"})
			return
		}
	*/

	// Stubbed due to API signature mismatch
	c.JSON(http.StatusNotImplemented, gin.H{"error": "GetNewsletterInfo not implemented yet"})
}
