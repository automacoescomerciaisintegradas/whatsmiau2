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

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
