package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"whatsmiau2/internal/config"

	"go.uber.org/zap"
)

type NotifierService struct {
	Config *config.Config
}

func NewNotifierService(cfg *config.Config) *NotifierService {
	return &NotifierService{Config: cfg}
}

// SendMessage sends a text message using the Evolution API
func (n *NotifierService) SendMessage(phone string, text string) error {
	if n.Config.EvolutionAPIURL == "" || n.Config.EvolutionAPIKey == "" {
		zap.L().Warn("Evolution API not configured, skipping notification")
		return nil
	}

	// Remove leading '+' if present and ensure numbers are clean?
	// The API usually takes numbers with country code. Assuming phone comes correctly formatted.

	url := fmt.Sprintf("%s/message/sendText/%s", n.Config.EvolutionAPIURL, n.Config.EvolutionInstance)

	payload := map[string]interface{}{
		"number": phone, // Expecting full number like 5511999999999
		"options": map[string]interface{}{
			"delay":       1200,
			"presence":    "composing",
			"linkPreview": false,
		},
		"textMessage": map[string]string{
			"text": text,
		},
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", n.Config.EvolutionAPIKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		return fmt.Errorf("failed to send message, status: %d", resp.StatusCode)
	}

	return nil
}

func (n *NotifierService) NotifyWelcome(phone, name string) error {
	msg := fmt.Sprintf("Olá %s! 👋\n\nObrigado por assinar o WhatsMiau2. Sua conta agora é Premium! 🚀\n\nAproveite todos os recursos de automação.", name)
	return n.SendMessage(phone, msg)
}

func (n *NotifierService) NotifyPaymentReceived(phone string, amount float64) error {
	msg := fmt.Sprintf("Pagamento confirmado! ✅\n\nRecebemos o valor de R$ %.2f referente à sua assinatura.\n\nSeu acesso continua liberado.", amount)
	return n.SendMessage(phone, msg)
}

func (n *NotifierService) NotifyAccessRevoked(phone, reason string) error {
	msg := fmt.Sprintf("⚠️ Sua assinatura está inativa.\n\nMotivo: %s\n\nPor favor, regularize seu pagamento para continuar usando os recursos Premium.", reason)
	return n.SendMessage(phone, msg)
}
