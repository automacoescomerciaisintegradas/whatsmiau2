package whatsapp

import (
	"bytes"
	"encoding/json"
	"net/http"
	"time"

	"whatsmiau2/internal/models"

	"go.uber.org/zap"
)

// sendWebhook sends a webhook event to the specified URL
func sendWebhook(url, token string, payload models.WebhookEvent) {
	jsonData, err := json.Marshal(payload)
	if err != nil {
		zap.L().Error("Failed to marshal webhook payload",
			zap.Error(err),
		)
		return
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		zap.L().Error("Failed to create webhook request",
			zap.Error(err),
		)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		zap.L().Error("Failed to send webhook",
			zap.String("url", url),
			zap.Error(err),
		)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		zap.L().Warn("Webhook returned error status",
			zap.String("url", url),
			zap.Int("status", resp.StatusCode),
		)
	} else {
		zap.L().Debug("Webhook sent successfully",
			zap.String("url", url),
			zap.String("event", payload.Event),
		)
	}
}
