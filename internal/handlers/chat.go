package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"

	"whatsmiau2/internal/database"
	"whatsmiau2/internal/models"
	"whatsmiau2/internal/whatsapp"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/types"
	"go.uber.org/zap"
)

// ChatHandler handles chat-related requests
type ChatHandler struct {
	manager *whatsapp.Manager
	db      *database.Database
}

// NewChatHandler creates a new chat handler
func NewChatHandler(manager *whatsapp.Manager, db *database.Database) *ChatHandler {
	return &ChatHandler{
		manager: manager,
		db:      db,
	}
}

// getClient gets the WhatsApp client for an instance
func (h *ChatHandler) getClient(instanceID string) (*whatsapp.Client, error) {
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

// formatJIDChat formats a phone number to JID
func formatJIDChat(number string) types.JID {
	// Remove any non-numeric characters except @
	number = strings.TrimSpace(number)

	// If already has @, try to parse
	if strings.Contains(number, "@") {
		jid, err := types.ParseJID(number)
		if err == nil {
			return jid
		}
	}

	// Remove + and other special characters
	number = strings.ReplaceAll(number, "+", "")
	number = strings.ReplaceAll(number, "-", "")
	number = strings.ReplaceAll(number, " ", "")
	number = strings.ReplaceAll(number, "(", "")
	number = strings.ReplaceAll(number, ")", "")

	return types.NewJID(number, types.DefaultUserServer)
}

// SendPresence sends presence to a chat
// POST /v1/instance/:instance/chat/presence or POST /v1/chat/sendPresence/:instance
func (h *ChatHandler) SendPresence(c *gin.Context) {
	instanceID := c.Param("instance")

	var req models.SendPresenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
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

	// Format JID
	jid := formatJIDChat(req.Number)

	// Determine presence type
	var presence types.ChatPresence
	var media types.ChatPresenceMedia

	switch req.Presence {
	case "composing":
		presence = types.ChatPresenceComposing
		media = types.ChatPresenceMediaText
	case "recording":
		presence = types.ChatPresenceComposing
		media = types.ChatPresenceMediaAudio
	case "paused":
		presence = types.ChatPresencePaused
		media = types.ChatPresenceMediaText
	case "unavailable":
		presence = types.ChatPresencePaused
		media = types.ChatPresenceMediaText
	default:
		presence = types.ChatPresencePaused
		media = types.ChatPresenceMediaText
	}

	ctx := context.Background()
	err = client.WA.SendChatPresence(ctx, jid, presence, media)
	if err != nil {
		zap.L().Error("Failed to send presence", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to send presence: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"chat":   jid.String(),
	})
}

// MarkAsRead marks messages as read
// POST /v1/instance/:instance/chat/read-messages or POST /v1/chat/markMessageAsRead/:instance
func (h *ChatHandler) MarkAsRead(c *gin.Context) {
	instanceID := c.Param("instance")

	var req models.MarkAsReadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
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

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	for _, msgKey := range req.ReadMessages {
		jid, err := types.ParseJID(msgKey.RemoteJID)
		if err != nil {
			continue
		}

		// Mark as read - convert string IDs to MessageID type
		msgIDs := []types.MessageID{types.MessageID(msgKey.ID)}
		err = client.WA.MarkRead(ctx, msgIDs, time.Now(), jid, jid)
		if err != nil {
			zap.L().Error("Failed to mark message as read",
				zap.String("messageId", msgKey.ID),
				zap.Error(err),
			)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
	})
}

// CheckWhatsAppNumbers checks if numbers are registered on WhatsApp
// POST /v1/instance/:instance/chat/whatsapp-numbers or POST /v1/chat/whatsappNumbers/:instance
func (h *ChatHandler) CheckWhatsAppNumbers(c *gin.Context) {
	instanceID := c.Param("instance")

	var req models.CheckNumberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
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

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Check each number
	var results []models.CheckNumberResponse
	for _, number := range req.Numbers {
		// Clean number
		cleanNumber := number
		cleanNumber = strings.ReplaceAll(cleanNumber, "+", "")
		cleanNumber = strings.ReplaceAll(cleanNumber, "-", "")
		cleanNumber = strings.ReplaceAll(cleanNumber, " ", "")

		// Check if on WhatsApp
		result, err := client.WA.IsOnWhatsApp(ctx, []string{cleanNumber})
		if err != nil {
			results = append(results, models.CheckNumberResponse{
				Number: number,
				Exists: false,
			})
			continue
		}

		for _, r := range result {
			results = append(results, models.CheckNumberResponse{
				Number: number,
				Exists: r.IsIn,
				JID:    r.JID.String(),
			})
		}
	}

	c.JSON(http.StatusOK, results)
}

// GetProfilePicture gets the profile picture of a user
// POST /v1/chat/getProfilePic/:instance or GET /v1/chat/getProfilePic/:instance
func (h *ChatHandler) GetProfilePicture(c *gin.Context) {
	instanceID := c.Param("instance")

	var req struct {
		Number  string `json:"number" form:"number"`
		Preview bool   `json:"preview" form:"preview"`
	}

	// Support both JSON and Query params
	if c.Request.Method == "GET" {
		req.Number = c.Query("number")
		req.Preview = c.Query("preview") == "true"
	} else {
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Bad Request",
				"message": err.Error(),
			})
			return
		}
	}

	if req.Number == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Number is required",
		})
		return
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

	jid := formatJIDChat(req.Number)
	ctx := context.Background()

	// Get profile picture info
	// Params: Existing ID (nil), Preview (bool)
	pic, err := client.WA.GetProfilePictureInfo(ctx, jid, &whatsmeow.GetProfilePictureParams{
		Preview: req.Preview,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get profile picture",
			"message": err.Error(),
		})
		return
	}

	if pic == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Profile picture not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url":         pic.URL,
		"id":          pic.ID,
		"type":        pic.Type,
		"direct_path": pic.DirectPath,
	})
}

// GetUserStatus gets the status (about) of a user
// POST /v1/chat/fetchStatus/:instance
func (h *ChatHandler) GetUserStatus(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented yet"})
}
