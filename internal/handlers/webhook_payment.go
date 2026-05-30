package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"whatsmiau2/internal/config"
	"whatsmiau2/internal/crm"
	"whatsmiau2/internal/services"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type PaymentWebhookHandler struct {
	cfg            *config.Config
	subscriptionSv *crm.SubscriptionService
	notifierSv     *services.NotifierService
	mpSv           *services.MercadoPagoService
}

func NewPaymentWebhookHandler(cfg *config.Config, subSv *crm.SubscriptionService, notSv *services.NotifierService) *PaymentWebhookHandler {
	return &PaymentWebhookHandler{
		cfg:            cfg,
		subscriptionSv: subSv,
		notifierSv:     notSv,
	}
}

// MercadoPagoPayload represents a basic MP notification
type MercadoPagoPayload struct {
	Action string `json:"action"`
	Type   string `json:"type"`
	Data   struct {
		ID string `json:"id"`
	} `json:"data"`
	// For simulation purposes, we might accept extra fields directly if simulating
	Status         string  `json:"simulated_status"`
	SubscriptionID uint    `json:"simulated_subscription_id"`
	UserPhone      string  `json:"simulated_user_phone"`
	UserName       string  `json:"simulated_user_name"`
	Amount         float64 `json:"simulated_amount"`
	// Real fields
	Resource string `json:"resource"`
	Topic    string `json:"topic"`
}

// Handle handles incoming payment webhooks
func (h *PaymentWebhookHandler) Handle(c *gin.Context) {
	// Log all headers for debugging
	zap.L().Info("Webhook received",
		zap.String("path", c.Request.URL.Path),
		zap.String("method", c.Request.Method),
		zap.Any("headers", c.Request.Header),
	)

	// 1. Read Payload
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		zap.L().Error("Failed to read webhook body", zap.Error(err))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body"})
		return
	}

	// Log raw body for debugging
	zap.L().Info("Webhook body received", zap.String("body", string(body)))

	var payload MercadoPagoPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		zap.L().Error("Failed to parse webhook JSON", zap.Error(err), zap.String("body", string(body)))
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	zap.L().Info("Received payment webhook", zap.Any("payload", payload))

	// 2. Logic for "Simulation" and Real MP events
	if payload.Action == "payment.succeeded" || (payload.Type == "payment" && payload.Status == "approved") {
		subID := payload.SubscriptionID
		if subID != 0 {
			zap.L().Info("Processing simulated payment", zap.Uint("subscription_id", subID))
			h.activateSubscription(subID, payload.Amount, payload.UserPhone)
		}
	} else if payload.Topic == "payment" || payload.Type == "payment" {
		// Real Mercado Pago Payment (Preferences API)
		if payload.Data.ID != "" {
			zap.L().Info("Processing real Mercado Pago payment", zap.String("payment_id", payload.Data.ID))
			h.handlePayment(payload.Data.ID)
		} else {
			zap.L().Warn("Payment webhook received but no payment ID found", zap.Any("payload", payload))
		}
	} else {
		zap.L().Warn("Unknown webhook type received", zap.Any("payload", payload))
	}

	c.JSON(http.StatusOK, gin.H{"status": "received"})
}

func (h *PaymentWebhookHandler) handlePayment(id string) {
	details, err := h.mpSv.GetSubscriptionDetails(id)
	if err != nil {
		zap.L().Error("Failed to fetch MP payment details", zap.Error(err), zap.String("id", id))
		return
	}

	status, _ := details["status"].(string)
	extRef, _ := details["external_reference"].(string)

	zap.L().Info("MP Payment Webhook", zap.String("id", id), zap.String("status", status), zap.String("extRef", extRef))

	if status == "approved" && extRef != "" {
		// Extract SubID from extRef "SUB_123"
		var subID uint
		fmt.Sscanf(extRef, "SUB_%d", &subID)

		if subID != 0 {
			err := h.subscriptionSv.ActivateSubscription(subID)
			if err != nil {
				zap.L().Error("Failed to activate subscription from MP webhook", zap.Error(err))
				return
			}
			zap.L().Info("Subscription activated via MP Payment", zap.Uint("sub_id", subID))
		}
	}
}

func (h *PaymentWebhookHandler) activateSubscription(id uint, amount float64, phone string) {
	err := h.subscriptionSv.ActivateSubscription(id)
	if err != nil {
		zap.L().Error("Activation failed", zap.Error(err))
		return
	}
	if phone != "" {
		go h.notifierSv.NotifyPaymentReceived(phone, amount)
	}
}

// HandleManualCancel allows admin to manually cancel
func (h *PaymentWebhookHandler) HandleManualCancel(c *gin.Context) {
	userIDStr := c.Param("id") // user id
	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid User ID"})
		return
	}

	err = h.subscriptionSv.CancelSubscription(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Notify
	phone := c.Query("phone") // Pass phone as query param for simplicity in admin action
	if phone != "" {
		go h.notifierSv.NotifyAccessRevoked(phone, "Cancelamento manual pelo administrador")
	}

	c.JSON(http.StatusOK, gin.H{"status": "cancelled"})
}
