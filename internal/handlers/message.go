package handlers

import (
	"context"
	"encoding/base64"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"whatsmiau2/internal/database"
	"whatsmiau2/internal/models"
	"whatsmiau2/internal/whatsapp"

	"github.com/gin-gonic/gin"
	"go.mau.fi/whatsmeow"
	waproto "go.mau.fi/whatsmeow/proto/waE2E"
	"go.mau.fi/whatsmeow/types"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

// MessageHandler handles message-related requests
type MessageHandler struct {
	manager *whatsapp.Manager
	db      *database.Database
}

// NewMessageHandler creates a new message handler
func NewMessageHandler(manager *whatsapp.Manager, db *database.Database) *MessageHandler {
	return &MessageHandler{
		manager: manager,
		db:      db,
	}
}

// getClient gets the WhatsApp client for an instance
func (h *MessageHandler) getClient(instanceID string) (*whatsapp.Client, error) {
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

// formatJID formats a phone number to JID
func formatJID(number string) types.JID {
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

// SendText sends a text message
// POST /v1/instance/:instance/message/text or POST /v1/message/sendText/:instance
func (h *MessageHandler) SendText(c *gin.Context) {
	instanceID := c.Param("instance")

	var req models.SendTextRequest
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

	// Apply delay if specified
	if req.Options != nil && req.Options.Delay > 0 {
		time.Sleep(time.Duration(req.Options.Delay) * time.Millisecond)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Send presence if specified
	if req.Options != nil && req.Options.Presence != "" {
		jid := formatJID(req.Number)
		_ = client.WA.SendChatPresence(ctx, jid, types.ChatPresenceComposing, types.ChatPresenceMediaText)
		time.Sleep(500 * time.Millisecond)
	}

	// Send message
	jid := formatJID(req.Number)
	text := req.TextMessage.Text

	msg := &waproto.Message{
		ExtendedTextMessage: &waproto.ExtendedTextMessage{
			Text: proto.String(text),
		},
	}

	resp, err := client.WA.SendMessage(ctx, jid, msg)
	if err != nil {
		zap.L().Error("Failed to send text message", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to send message: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{
		Key: models.MessageKey{
			RemoteJID: jid.String(),
			FromMe:    true,
			ID:        resp.ID,
		},
		Message: gin.H{
			"conversation": text,
		},
		Status:    "SENT",
		Timestamp: resp.Timestamp,
	})
}

// SendMedia sends a media message (image, video, document)
// POST /v1/instance/:instance/message/image or POST /v1/message/sendMedia/:instance
func (h *MessageHandler) SendMedia(c *gin.Context) {
	instanceID := c.Param("instance")

	var req models.SendMediaRequest
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

	// Get media data
	var mediaData []byte
	var mimeType string

	if strings.HasPrefix(req.MediaMessage.Media, "http://") || strings.HasPrefix(req.MediaMessage.Media, "https://") {
		// Download from URL
		mediaData, mimeType, err = downloadMedia(req.MediaMessage.Media)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Bad Request",
				"message": "Failed to download media: " + err.Error(),
			})
			return
		}
	} else {
		// Base64 encoded
		mediaData, err = base64.StdEncoding.DecodeString(req.MediaMessage.Media)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Bad Request",
				"message": "Invalid base64 data",
			})
			return
		}
		mimeType = req.MediaMessage.MimeType
	}

	if mimeType == "" && req.MediaMessage.MimeType != "" {
		mimeType = req.MediaMessage.MimeType
	}

	// Upload media to WhatsApp
	jid := formatJID(req.Number)
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	var msg *waproto.Message

	switch strings.ToLower(req.MediaMessage.MediaType) {
	case "image":
		uploaded, err := client.WA.Upload(ctx, mediaData, whatsmeow.MediaImage)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Internal Server Error",
				"message": "Failed to upload image: " + err.Error(),
			})
			return
		}

		msg = &waproto.Message{
			ImageMessage: &waproto.ImageMessage{
				Caption:       proto.String(req.MediaMessage.Caption),
				Mimetype:      proto.String(mimeType),
				URL:           proto.String(uploaded.URL),
				DirectPath:    proto.String(uploaded.DirectPath),
				MediaKey:      uploaded.MediaKey,
				FileEncSHA256: uploaded.FileEncSHA256,
				FileSHA256:    uploaded.FileSHA256,
				FileLength:    proto.Uint64(uint64(len(mediaData))),
			},
		}

	case "video":
		uploaded, err := client.WA.Upload(ctx, mediaData, whatsmeow.MediaVideo)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Internal Server Error",
				"message": "Failed to upload video: " + err.Error(),
			})
			return
		}

		msg = &waproto.Message{
			VideoMessage: &waproto.VideoMessage{
				Caption:       proto.String(req.MediaMessage.Caption),
				Mimetype:      proto.String(mimeType),
				URL:           proto.String(uploaded.URL),
				DirectPath:    proto.String(uploaded.DirectPath),
				MediaKey:      uploaded.MediaKey,
				FileEncSHA256: uploaded.FileEncSHA256,
				FileSHA256:    uploaded.FileSHA256,
				FileLength:    proto.Uint64(uint64(len(mediaData))),
			},
		}

	case "document":
		uploaded, err := client.WA.Upload(ctx, mediaData, whatsmeow.MediaDocument)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Internal Server Error",
				"message": "Failed to upload document: " + err.Error(),
			})
			return
		}

		fileName := req.MediaMessage.FileName
		if fileName == "" {
			fileName = "document"
		}

		msg = &waproto.Message{
			DocumentMessage: &waproto.DocumentMessage{
				Title:         proto.String(fileName),
				FileName:      proto.String(fileName),
				Mimetype:      proto.String(mimeType),
				URL:           proto.String(uploaded.URL),
				DirectPath:    proto.String(uploaded.DirectPath),
				MediaKey:      uploaded.MediaKey,
				FileEncSHA256: uploaded.FileEncSHA256,
				FileSHA256:    uploaded.FileSHA256,
				FileLength:    proto.Uint64(uint64(len(mediaData))),
			},
		}

	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Invalid media type. Use: image, video, or document",
		})
		return
	}

	resp, err := client.WA.SendMessage(ctx, jid, msg)
	if err != nil {
		zap.L().Error("Failed to send media message", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to send message: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{
		Key: models.MessageKey{
			RemoteJID: jid.String(),
			FromMe:    true,
			ID:        resp.ID,
		},
		Message:   msg,
		Status:    "SENT",
		Timestamp: resp.Timestamp,
	})
}

// SendAudio sends an audio message
// POST /v1/instance/:instance/message/audio or POST /v1/message/sendWhatsAppAudio/:instance
func (h *MessageHandler) SendAudio(c *gin.Context) {
	instanceID := c.Param("instance")

	var req models.SendAudioRequest
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

	// Get audio data
	var audioData []byte
	var mimeType string

	if strings.HasPrefix(req.AudioMessage.Audio, "http://") || strings.HasPrefix(req.AudioMessage.Audio, "https://") {
		// Download from URL
		audioData, mimeType, err = downloadMedia(req.AudioMessage.Audio)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Bad Request",
				"message": "Failed to download audio: " + err.Error(),
			})
			return
		}
	} else {
		// Base64 encoded
		audioData, err = base64.StdEncoding.DecodeString(req.AudioMessage.Audio)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Bad Request",
				"message": "Invalid base64 data",
			})
			return
		}
	}

	// Convert audio to OGG Opus format for PTT compatibility
	if req.AudioMessage.PTT {
		zap.L().Info("Converting audio to Opus format for PTT")
		convertedData, err := convertToOpus(audioData)
		if err != nil {
			zap.L().Warn("Audio conversion failed, using original", zap.Error(err))
			// If conversion fails, try with original data
		} else {
			audioData = convertedData
		}
	}
	mimeType = "audio/ogg; codecs=opus"

	// Upload audio to WhatsApp
	jid := formatJID(req.Number)
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	uploaded, err := client.WA.Upload(ctx, audioData, whatsmeow.MediaAudio)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to upload audio: " + err.Error(),
		})
		return
	}

	msg := &waproto.Message{
		AudioMessage: &waproto.AudioMessage{
			PTT:           proto.Bool(req.AudioMessage.PTT),
			Mimetype:      proto.String(mimeType),
			URL:           proto.String(uploaded.URL),
			DirectPath:    proto.String(uploaded.DirectPath),
			MediaKey:      uploaded.MediaKey,
			FileEncSHA256: uploaded.FileEncSHA256,
			FileSHA256:    uploaded.FileSHA256,
			FileLength:    proto.Uint64(uint64(len(audioData))),
		},
	}

	resp, err := client.WA.SendMessage(ctx, jid, msg)
	if err != nil {
		zap.L().Error("Failed to send audio message", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to send message: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{
		Key: models.MessageKey{
			RemoteJID: jid.String(),
			FromMe:    true,
			ID:        resp.ID,
		},
		Message:   msg,
		Status:    "SENT",
		Timestamp: resp.Timestamp,
	})
}

// SendReaction sends a reaction to a message
// POST /v1/message/sendReaction/:instance
// TODO: Implement reaction support with updated whatsmeow API
func (h *MessageHandler) SendReaction(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{
		"error":   "Not Implemented",
		"message": "Reaction support coming soon",
	})
}

// downloadMedia downloads media from a URL
func downloadMedia(url string) ([]byte, string, error) {
	// Convert Google Drive share links to direct download links
	url = convertGoogleDriveURL(url)

	client := &http.Client{
		Timeout: 60 * time.Second,
	}

	resp, err := client.Get(url)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}

	contentType := resp.Header.Get("Content-Type")
	return data, contentType, nil
}

// convertGoogleDriveURL converts Google Drive share links to direct download links
func convertGoogleDriveURL(url string) string {
	// Pattern: https://drive.google.com/file/d/FILE_ID/view...
	if strings.Contains(url, "drive.google.com/file/d/") {
		// Extract file ID
		parts := strings.Split(url, "/file/d/")
		if len(parts) >= 2 {
			idPart := parts[1]
			// Remove everything after the ID (like /view?usp=sharing)
			if idx := strings.Index(idPart, "/"); idx != -1 {
				idPart = idPart[:idx]
			}
			// Return direct download URL
			return "https://drive.google.com/uc?export=download&id=" + idPart
		}
	}

	// Pattern: https://drive.google.com/open?id=FILE_ID
	if strings.Contains(url, "drive.google.com/open?id=") {
		parts := strings.Split(url, "id=")
		if len(parts) >= 2 {
			fileID := strings.Split(parts[1], "&")[0]
			return "https://drive.google.com/uc?export=download&id=" + fileID
		}
	}

	return url
}

// convertToOpus converts audio data to OGG Opus format using FFmpeg
func convertToOpus(audioData []byte) ([]byte, error) {
	// Create temp files
	tmpDir := os.TempDir()
	inputPath := filepath.Join(tmpDir, "input_audio_"+time.Now().Format("20060102150405"))
	outputPath := filepath.Join(tmpDir, "output_audio_"+time.Now().Format("20060102150405")+".ogg")

	// Write input file
	if err := os.WriteFile(inputPath, audioData, 0644); err != nil {
		return nil, err
	}
	defer os.Remove(inputPath)
	defer os.Remove(outputPath)

	// Run FFmpeg conversion
	cmd := exec.Command("ffmpeg",
		"-y",            // Overwrite output
		"-i", inputPath, // Input file
		"-c:a", "libopus", // Use Opus codec
		"-b:a", "64k", // Bitrate
		"-ar", "48000", // Sample rate
		"-ac", "1", // Mono
		"-application", "voip", // Optimize for voice
		outputPath, // Output file
	)

	// Capture stderr for debugging
	output, err := cmd.CombinedOutput()
	if err != nil {
		zap.L().Error("FFmpeg conversion failed", zap.Error(err), zap.String("output", string(output)))
		return nil, err
	}

	// Read converted file
	convertedData, err := os.ReadFile(outputPath)
	if err != nil {
		return nil, err
	}

	zap.L().Info("Audio converted to Opus", zap.Int("originalSize", len(audioData)), zap.Int("convertedSize", len(convertedData)))
	return convertedData, nil
}
