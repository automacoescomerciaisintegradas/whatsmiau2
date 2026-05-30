package services

import (
	"errors"
	"fmt"
	"strings"
	"whatsmiau2/internal/config"

	"context"

	"github.com/team-telnyx/telnyx-go/v4"
	"github.com/team-telnyx/telnyx-go/v4/option"
	"go.uber.org/zap"
)

// TelnyxService handles integration with Telnyx APIs
type TelnyxService struct {
	config *config.Config
	client *telnyx.Client
}

// SIPCredentialResult contains the generated SIP credentials
type SIPCredentialResult struct {
	ConnectionID string
	SIPHost      string
	SIPUser      string
	SIPPassword  string
}

// NewTelnyxService creates a new Telnyx integration service
func NewTelnyxService(cfg *config.Config) *TelnyxService {
	client := telnyx.NewClient(
		option.WithAPIKey(cfg.TelnyxAPIKey),
	)

	return &TelnyxService{
		config: cfg,
		client: &client,
	}
}

// CreateSIPCredential creates a new SIP Connection in Telnyx and returns the credentials
func (s *TelnyxService) CreateSIPCredential(instanceID string, instanceName string) (*SIPCredentialResult, error) {
	if s.config.TelnyxAPIKey == "" {
		return nil, errors.New("Telnyx API Key is not configured")
	}

	// Generate a unique username for the SIP trunk based on instance name and ID
	// Remove spaces and special characters for the username
	safeName := strings.ReplaceAll(strings.ToLower(instanceName), " ", "")
	if len(safeName) > 10 {
		safeName = safeName[:10]
	}
	
	// Format: w2_{safename}_{id_prefix}
	idPrefix := instanceID
	if len(idPrefix) > 5 {
		idPrefix = idPrefix[:5]
	}
	sipUser := fmt.Sprintf("w2_%s_%s", safeName, idPrefix)
	
	// Generate a random secure password for SIP
	// For simplicity in this implementation, we use a basic string, but in production
	// you might want to use a strong random password generator.
	sipPassword := fmt.Sprintf("W2pass!%s%s", safeName, instanceID[:min(8, len(instanceID))])

	connectionName := fmt.Sprintf("WhatsMiau2 - %s", instanceName)

	params := telnyx.CredentialConnectionNewParams{
		ConnectionName: connectionName,
		UserName:       sipUser,
		Password:       sipPassword,
	}

	// Create the connection using context
	ctx := context.Background()
	conn, err := s.client.CredentialConnections.New(ctx, params)
	if err != nil {
		zap.L().Error("Failed to create Telnyx SIP Connection", zap.Error(err), zap.String("instance", instanceName))
		return nil, fmt.Errorf("failed to create SIP Connection in Telnyx: %v", err)
	}

	result := &SIPCredentialResult{
		ConnectionID: conn.Data.ID,
		SIPHost:      "sip.telnyx.com", // Default Telnyx SIP domain
		SIPUser:      conn.Data.UserName,
		SIPPassword:  conn.Data.Password,
	}

	zap.L().Info("Successfully created Telnyx SIP Connection", 
		zap.String("instanceID", instanceID),
		zap.String("connectionID", conn.Data.ID),
	)

	return result, nil
}

// AnswerCall sends an answer command to a specific Call Control ID
func (s *TelnyxService) AnswerCall(callControlID string) error {
	ctx := context.Background()
	// To answer a call, we use the Call Control API 
	// The V4 SDK structure uses CallControl or Calls.
	// We'll create a new call object or use an action service.
	_, err := s.client.Calls.Actions.Answer(ctx, callControlID, telnyx.CallActionAnswerParams{})
	if err != nil {
		zap.L().Error("Telnyx Answer Call failed", zap.Error(err), zap.String("call_control_id", callControlID))
		return err
	}
	zap.L().Info("Telnyx Call answered successfully", zap.String("call_control_id", callControlID))
	return nil
}

// CallPBX initiates a call to a SIP destination and passes custom headers or client state
func (s *TelnyxService) CallPBX(sipDestination string, audioURL string, instanceID string) (string, error) {
	ctx := context.Background()

	// The Connection ID is needed to dial out, we'll assume the client configured their Outbound Voice Profile
	// or we can use the default Connection ID. For SIP, the `To` must be `sip:extension@domain`
	params := telnyx.CallCreateParams{
		To:             sipDestination,
		From:           "+10000000000", // Default from, could be configurable
		ConnectionID:   "",             // Optional if From is registered or if routing by SIP
		ClientState:    telnyx.String(audioURL), // Hack: pass the audio URL via ClientState so we know what to play
		WebhookURL:     telnyx.String(fmt.Sprintf("%s/v1/webhooks/telnyx/events", s.config.PublicURL)),
		WebhookURLMethod: telnyx.CallCreateParamsWebhookURLMethodPost,
	}

	call, err := s.client.Calls.New(ctx, params)
	if err != nil {
		zap.L().Error("Failed to initiate Telnyx Call to PBX", zap.Error(err), zap.String("destination", sipDestination))
		return "", err
	}

	zap.L().Info("Telnyx Call initiated successfully", zap.String("call_control_id", call.Data.CallControlID), zap.String("destination", sipDestination))
	return call.Data.CallControlID, nil
}

// PlayAudio plays a remote audio file on an active call
func (s *TelnyxService) PlayAudio(callControlID string, audioURL string) error {
	ctx := context.Background()
	params := telnyx.CallActionPlaybackStartParams{
		AudioURL: audioURL,
	}
	_, err := s.client.Calls.Actions.PlaybackStart(ctx, callControlID, params)
	if err != nil {
		zap.L().Error("Telnyx PlaybackStart failed", zap.Error(err), zap.String("call_control_id", callControlID))
		return err
	}
	zap.L().Info("Telnyx Playback started successfully", zap.String("call_control_id", callControlID), zap.String("audio_url", audioURL))
	return nil
}

// HangupCall hangs up a call
func (s *TelnyxService) HangupCall(callControlID string) error {
	ctx := context.Background()
	_, err := s.client.Calls.Actions.Hangup(ctx, callControlID, telnyx.CallActionHangupParams{})
	if err != nil {
		zap.L().Error("Telnyx Hangup failed", zap.Error(err), zap.String("call_control_id", callControlID))
		return err
	}
	return nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
