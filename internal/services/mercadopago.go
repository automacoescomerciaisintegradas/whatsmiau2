package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"whatsmiau2/internal/config"
)

type MercadoPagoService struct {
	cfg *config.Config
}

func NewMercadoPagoService(cfg *config.Config) *MercadoPagoService {
	return &MercadoPagoService{cfg: cfg}
}

// Preference API structures
type MPPreferenceRequest struct {
	Items               []MPItem   `json:"items"`
	Payer               *MPPayer   `json:"payer,omitempty"`
	BackUrls            MPBackUrls `json:"back_urls"`
	AutoReturn          string     `json:"auto_return,omitempty"`
	ExternalReference   string     `json:"external_reference,omitempty"`
	NotificationURL     string     `json:"notification_url,omitempty"`
	StatementDescriptor string     `json:"statement_descriptor,omitempty"`
}

type MPItem struct {
	Title       string  `json:"title"`
	Description string  `json:"description,omitempty"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	CurrencyID  string  `json:"currency_id"`
}

type MPPayer struct {
	Email string `json:"email,omitempty"`
	Name  string `json:"name,omitempty"`
}

type MPBackUrls struct {
	Success string `json:"success"`
	Failure string `json:"failure"`
	Pending string `json:"pending"`
}

type MPPaymentMethods struct {
	ExcludedPaymentMethods []MPExcludedPaymentMethod `json:"excluded_payment_methods,omitempty"`
	ExcludedPaymentTypes   []MPExcludedPaymentType   `json:"excluded_payment_types,omitempty"`
	Installments           int                       `json:"installments,omitempty"`
}

type MPExcludedPaymentMethod struct {
	ID string `json:"id"`
}

type MPExcludedPaymentType struct {
	ID string `json:"id"`
}

func (s *MercadoPagoService) CreateSubscription(planName string, amount float64, userEmail string, externalRef string) (string, error) {
	// Validate access token
	if s.cfg.MercadoPagoAccessToken == "" {
		return "", fmt.Errorf("mercado pago access token not configured")
	}

	// Use Preferences API for checkout (not direct payment)
	url := "https://api.mercadopago.com/checkout/preferences"

	// Minimal request body to avoid conflicts
	reqBody := MPPreferenceRequest{
		Items: []MPItem{
			{
				Title:      planName,
				Quantity:   1,
				UnitPrice:  amount,
				CurrencyID: "BRL",
			},
		},
		BackUrls: MPBackUrls{
			Success: "https://api.automacoescomerciais.com.br/subscription.html?status=success",
			Failure: "https://api.automacoescomerciais.com.br/subscription.html?status=failure",
			Pending: "https://api.automacoescomerciais.com.br/subscription.html?status=pending",
		},
		AutoReturn:        "approved",
		ExternalReference: externalRef,
		NotificationURL:   "https://api.automacoescomerciais.com.br/v1/webhooks/mercadopago",
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	// Debug: Print request body
	fmt.Printf("MercadoPago Request Body: %s\n", string(jsonData))

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.cfg.MercadoPagoAccessToken)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	// Debug: Print response
	fmt.Printf("MercadoPago Response Status: %d\n", resp.StatusCode)
	fmt.Printf("MercadoPago Response Body: %v\n", result)

	// Check for errors
	if resp.StatusCode != 200 && resp.StatusCode != 201 {
		return "", fmt.Errorf("mercado pago error (status %d): %v", resp.StatusCode, result)
	}

	if initPoint, ok := result["init_point"].(string); ok {
		return initPoint, nil
	}

	return "", fmt.Errorf("failed to get init_point from Mercado Pago: %v", result)
}

func (s *MercadoPagoService) GetSubscriptionDetails(preapprovalID string) (map[string]interface{}, error) {
	url := fmt.Sprintf("https://api.mercadopago.com/v1/payments/%s", preapprovalID)
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+s.cfg.MercadoPagoAccessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	return result, nil
}
