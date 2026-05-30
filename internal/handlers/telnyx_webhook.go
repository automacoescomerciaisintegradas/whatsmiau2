package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"time"

	"whatsmiau2/internal/services"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// TelnyxWebhookHandler processa os eventos do Call Control
type TelnyxWebhookHandler struct {
	callManager   *services.CallManager
	telnyxService *services.TelnyxService
}

// NewTelnyxWebhookHandler inicializa o handler de webhook
func NewTelnyxWebhookHandler(cm *services.CallManager, ts *services.TelnyxService) *TelnyxWebhookHandler {
	return &TelnyxWebhookHandler{
		callManager:   cm,
		telnyxService: ts,
	}
}

// PayloadType define a estrutura interna do payload
type PayloadType struct {
	CallControlID string `json:"call_control_id"`
	ConnectionID  string `json:"connection_id"`
	CallLegID     string `json:"call_leg_id"`
	CallSessionID string `json:"call_session_id"`
	ClientState   string `json:"client_state"`
	Direction     string `json:"direction"`
	From          string `json:"from"`
	To            string `json:"to"`
	State         string `json:"state"`
}

// TelnyxEvent representa a estrutura base do webhook da Telnyx
type TelnyxEvent struct {
	Data struct {
		EventType string      `json:"event_type"`
		ID        string      `json:"id"`
		Payload   PayloadType `json:"payload"`
	} `json:"data"`
}

// HandleEvent é a rota principal para receber os eventos via POST
func (h *TelnyxWebhookHandler) HandleEvent(c *gin.Context) {
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		zap.L().Error("Failed to read webhook body", zap.Error(err))
		c.Status(http.StatusBadRequest)
		return
	}

	var event TelnyxEvent
	if err := json.Unmarshal(bodyBytes, &event); err != nil {
		zap.L().Error("Failed to parse Telnyx webhook JSON", zap.Error(err))
		c.Status(http.StatusBadRequest)
		return
	}

	eventType := event.Data.EventType
	payload := event.Data.Payload
	zap.L().Info("Received Telnyx Webhook",
		zap.String("event_type", eventType),
		zap.String("call_control_id", payload.CallControlID),
		zap.String("from", payload.From),
		zap.String("to", payload.To),
	)

	// Route based on event type
	switch eventType {
	case "call.initiated":
		h.handleCallInitiated(payload)
	case "call.answered":
		h.handleCallAnswered(payload)
	case "call.playback.ended":
		h.handleCallPlaybackEnded(payload)
	case "call.hangup":
		h.handleCallHangup(payload)
	default:
		zap.L().Debug("Unhandled Telnyx event", zap.String("event_type", eventType))
	}

	// Always return 200 OK so Telnyx knows we received it
	c.Status(http.StatusOK)
}

func (h *TelnyxWebhookHandler) handleCallInitiated(payload PayloadType) {
	zap.L().Info("Processing call.initiated", zap.String("call_control_id", payload.CallControlID))
	
	// Registra no CallManager
	h.callManager.AddCall(&services.CallSession{
		CallControlID: payload.CallControlID,
		ConnectionID:  payload.ConnectionID,
		Destination:   payload.To,
		Status:        "initiated",
		CreatedAt:     time.Now(),
	})

	// Na prática: responder para o PABX chamando o endpoint Answer da Telnyx
	err := h.telnyxService.AnswerCall(payload.CallControlID)
	if err != nil {
		zap.L().Error("Failed to answer incoming SIP call", zap.Error(err))
	}
}

func (h *TelnyxWebhookHandler) handleCallAnswered(payload PayloadType) {
	zap.L().Info("Processing call.answered", zap.String("call_control_id", payload.CallControlID))
	h.callManager.UpdateCallStatus(payload.CallControlID, "answered")

	// 1. Tentar pegar o audioUrl do ClientState (enviado via CallPBX)
	audioURL := payload.ClientState

	// 2. Fallback para tentar buscar no CallManager
	if audioURL == "" {
		if session, exists := h.callManager.GetCall(payload.CallControlID); exists && session.AudioToPlay != "" {
			audioURL = session.AudioToPlay
		}
	}

	if audioURL != "" {
		zap.L().Info("Playing audio on answered call", zap.String("audio_url", audioURL))
		err := h.telnyxService.PlayAudio(payload.CallControlID, audioURL)
		if err != nil {
			zap.L().Error("Failed to play audio on call", zap.Error(err))
		}
	}
}

func (h *TelnyxWebhookHandler) handleCallPlaybackEnded(payload PayloadType) {
	zap.L().Info("Playback ended, hanging up call", zap.String("call_control_id", payload.CallControlID))
	err := h.telnyxService.HangupCall(payload.CallControlID)
	if err != nil {
		zap.L().Error("Failed to hang up call after playback", zap.Error(err))
	}
}

func (h *TelnyxWebhookHandler) handleCallHangup(payload PayloadType) {
	zap.L().Info("Processing call.hangup", zap.String("call_control_id", payload.CallControlID))
	h.callManager.RemoveCall(payload.CallControlID)
}
