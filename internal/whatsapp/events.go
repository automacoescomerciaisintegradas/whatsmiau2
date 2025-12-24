package whatsapp

import (
	"context"
	"fmt"

	"whatsmiau2/internal/models"

	"go.mau.fi/whatsmeow/types/events"
	"go.uber.org/zap"
)

// eventHandler handles WhatsApp events
func (c *Client) eventHandler(evt interface{}) {
	switch v := evt.(type) {
	case *events.Connected:
		c.handleConnected(v)
	case *events.Disconnected:
		c.handleDisconnected(v)
	case *events.Message:
		c.handleMessage(v)
	case *events.Receipt:
		c.handleReceipt(v)
	case *events.PushName:
		c.handlePushName(v)
	case *events.HistorySync:
		c.handleHistorySync(v)
	case *events.QR:
		c.handleQR(v)
	case *events.PairSuccess:
		c.handlePairSuccess(v)
	case *events.LoggedOut:
		c.handleLoggedOut(v)
	default:
		if c.manager.config.DebugWhatsmeow {
			zap.L().Debug("Unhandled event",
				zap.String("instanceId", c.InstanceID),
				zap.String("type", fmt.Sprintf("%T", evt)),
			)
		}
	}
}

// handleConnected handles the connected event
func (c *Client) handleConnected(evt *events.Connected) {
	c.Connected = true
	zap.L().Info("WhatsApp connected",
		zap.String("instanceId", c.InstanceID),
	)

	// Update instance status in database
	if c.manager.db != nil {
		c.manager.db.UpdateInstanceStatus(c.InstanceID, models.StatusConnected)

		// Get profile info
		if c.WA.Store.ID != nil {
			jid := *c.WA.Store.ID
			phoneNumber := jid.User

			// Try to get push name
			pushName := ""
			if c.WA.Store.PushName != "" {
				pushName = c.WA.Store.PushName
			}

			// Try to get profile picture
			profilePic := ""
			ctx := context.Background()
			pic, err := c.WA.GetProfilePictureInfo(ctx, jid, nil)
			if err == nil && pic != nil {
				profilePic = pic.URL
			}

			c.manager.db.UpdateInstanceProfile(c.InstanceID, phoneNumber, pushName, profilePic)
		}
	}

	// Emit webhook event
	c.emitWebhook("instance.open", map[string]interface{}{
		"instance": c.InstanceID,
		"state":    "open",
	})
}

// handleDisconnected handles the disconnected event
func (c *Client) handleDisconnected(evt *events.Disconnected) {
	c.Connected = false
	zap.L().Info("WhatsApp disconnected",
		zap.String("instanceId", c.InstanceID),
	)

	// Update instance status in database
	if c.manager.db != nil {
		c.manager.db.UpdateInstanceStatus(c.InstanceID, models.StatusDisconnected)
	}

	// Emit webhook event
	c.emitWebhook("instance.close", map[string]interface{}{
		"instance": c.InstanceID,
		"state":    "close",
	})
}

// handleMessage handles incoming messages
func (c *Client) handleMessage(evt *events.Message) {
	zap.L().Info("Message received",
		zap.String("instanceId", c.InstanceID),
		zap.String("from", evt.Info.Sender.String()),
		zap.String("chat", evt.Info.Chat.String()),
	)

	// Build the message event
	messageData := map[string]interface{}{
		"key": map[string]interface{}{
			"remoteJid": evt.Info.Chat.String(),
			"fromMe":    evt.Info.IsFromMe,
			"id":        evt.Info.ID,
		},
		"pushName":         evt.Info.PushName,
		"messageTimestamp": evt.Info.Timestamp.Unix(),
		"messageType":      getMessageType(evt.Message),
	}

	// Add message content based on type
	if evt.Message.GetConversation() != "" {
		messageData["message"] = map[string]interface{}{
			"conversation": evt.Message.GetConversation(),
		}
	} else if evt.Message.GetExtendedTextMessage() != nil {
		messageData["message"] = map[string]interface{}{
			"extendedTextMessage": map[string]interface{}{
				"text": evt.Message.GetExtendedTextMessage().GetText(),
			},
		}
	} else if evt.Message.GetImageMessage() != nil {
		img := evt.Message.GetImageMessage()
		messageData["message"] = map[string]interface{}{
			"imageMessage": map[string]interface{}{
				"caption":  img.GetCaption(),
				"mimetype": img.GetMimetype(),
				"url":      img.GetURL(),
			},
		}
	} else if evt.Message.GetAudioMessage() != nil {
		audio := evt.Message.GetAudioMessage()
		messageData["message"] = map[string]interface{}{
			"audioMessage": map[string]interface{}{
				"ptt":      audio.GetPTT(),
				"seconds":  audio.GetSeconds(),
				"mimetype": audio.GetMimetype(),
				"url":      audio.GetURL(),
			},
		}
	} else if evt.Message.GetDocumentMessage() != nil {
		doc := evt.Message.GetDocumentMessage()
		messageData["message"] = map[string]interface{}{
			"documentMessage": map[string]interface{}{
				"title":    doc.GetTitle(),
				"fileName": doc.GetFileName(),
				"mimetype": doc.GetMimetype(),
				"url":      doc.GetURL(),
			},
		}
	} else if evt.Message.GetVideoMessage() != nil {
		video := evt.Message.GetVideoMessage()
		messageData["message"] = map[string]interface{}{
			"videoMessage": map[string]interface{}{
				"caption":  video.GetCaption(),
				"seconds":  video.GetSeconds(),
				"mimetype": video.GetMimetype(),
				"url":      video.GetURL(),
			},
		}
	}

	// Emit webhook event
	c.emitWebhook("message.received", messageData)
}

// handleReceipt handles message receipts (read, delivered, etc.)
func (c *Client) handleReceipt(evt *events.Receipt) {
	zap.L().Debug("Receipt received",
		zap.String("instanceId", c.InstanceID),
		zap.String("type", string(evt.Type)),
		zap.Strings("ids", evt.MessageIDs),
	)

	// Emit webhook event
	c.emitWebhook("MESSAGES_UPDATE", map[string]interface{}{
		"key": map[string]interface{}{
			"remoteJid": evt.Chat.String(),
			"id":        evt.MessageIDs,
		},
		"update": map[string]interface{}{
			"status": string(evt.Type),
		},
	})
}

// handlePushName handles push name updates
func (c *Client) handlePushName(evt *events.PushName) {
	zap.L().Debug("Push name received",
		zap.String("instanceId", c.InstanceID),
		zap.String("jid", evt.JID.String()),
		zap.String("name", evt.NewPushName),
	)

	// Emit webhook event
	c.emitWebhook("CONTACTS_UPSERT", map[string]interface{}{
		"jid":      evt.JID.String(),
		"pushName": evt.NewPushName,
	})
}

// handleHistorySync handles history sync events
func (c *Client) handleHistorySync(evt *events.HistorySync) {
	zap.L().Debug("History sync received",
		zap.String("instanceId", c.InstanceID),
	)
}

// handleQR handles QR code events
func (c *Client) handleQR(evt *events.QR) {
	if len(evt.Codes) > 0 {
		c.QRChannel <- evt.Codes[0]
		zap.L().Info("QR code received via event",
			zap.String("instanceId", c.InstanceID),
		)

		// Update instance status
		if c.manager.db != nil {
			c.manager.db.UpdateInstanceStatus(c.InstanceID, models.StatusQRCode)
		}

		// Generate QR code base64
		qrBase64, err := c.GetQRCodeBase64(evt.Codes[0])
		if err == nil {
			c.emitWebhook("instance.qrcode", map[string]interface{}{
				"instance": c.InstanceID,
				"qrcode": map[string]interface{}{
					"code":   evt.Codes[0],
					"base64": qrBase64,
				},
			})
		}
	}
}

// handlePairSuccess handles successful pairing
func (c *Client) handlePairSuccess(evt *events.PairSuccess) {
	zap.L().Info("Pairing successful",
		zap.String("instanceId", c.InstanceID),
		zap.String("jid", evt.ID.String()),
	)

	c.Connected = true

	// Update instance status
	if c.manager.db != nil {
		c.manager.db.UpdateInstanceStatus(c.InstanceID, models.StatusConnected)
	}

	// Emit webhook event
	c.emitWebhook("instance.pairing_code", map[string]interface{}{
		"instance": c.InstanceID,
		"jid":      evt.ID.String(),
		"status":   "paired",
	})
}

// handleLoggedOut handles logout events
func (c *Client) handleLoggedOut(evt *events.LoggedOut) {
	zap.L().Info("Logged out",
		zap.String("instanceId", c.InstanceID),
		zap.String("reason", evt.Reason.String()),
	)

	c.Connected = false

	// Update instance status
	if c.manager.db != nil {
		c.manager.db.UpdateInstanceStatus(c.InstanceID, models.StatusDisconnected)
	}
}

// getMessageType returns the type of message
func getMessageType(msg interface{}) string {
	if msg == nil {
		return "unknown"
	}

	// Type assertion to check message type
	switch m := msg.(type) {
	case interface{ GetConversation() string }:
		if m.GetConversation() != "" {
			return "conversation"
		}
	}

	// Check for extended text message
	if m, ok := msg.(interface{ GetExtendedTextMessage() interface{} }); ok {
		if m.GetExtendedTextMessage() != nil {
			return "extendedTextMessage"
		}
	}

	// Add more type checks as needed
	return "unknown"
}

// emitWebhook sends a webhook event
func (c *Client) emitWebhook(event string, data interface{}) {
	// Get instance from database
	instance, err := c.manager.db.GetInstance(c.InstanceID)
	if err != nil || instance.WebhookURL == "" {
		return
	}

	// Create webhook payload
	payload := models.WebhookEvent{
		Event:    event,
		Instance: c.InstanceID,
		Data:     data,
	}

	// Send webhook asynchronously
	go sendWebhook(instance.WebhookURL, instance.WebhookToken, payload)
}
