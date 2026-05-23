package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

func main() {
	// Teste 1: Webhook de pagamento aprovado (formato real do Mercado Pago)
	testRealWebhook()

	time.Sleep(2 * time.Second)

	// Teste 2: Webhook de simulação
	testSimulatedWebhook()
}

func testRealWebhook() {
	fmt.Println("=== Teste 1: Webhook Real do Mercado Pago ===")

	// Este é o formato que o Mercado Pago envia
	payload := map[string]interface{}{
		"action":      "payment.created",
		"api_version": "v1",
		"data": map[string]interface{}{
			"id": "1234567890", // ID do pagamento no MP
		},
		"date_created": "2026-01-22T21:00:00Z",
		"id":           123456789,
		"live_mode":    false,
		"type":         "payment",
		"user_id":      "1035963718",
	}

	sendWebhook("http://localhost:8085/v1/webhooks/mercadopago", payload)
}

func testSimulatedWebhook() {
	fmt.Println("\n=== Teste 2: Webhook de Simulação ===")

	// Formato customizado para testes internos
	payload := map[string]interface{}{
		"action":                    "payment.succeeded",
		"simulated_status":          "approved",
		"simulated_subscription_id": 1,
		"simulated_amount":          97.0,
		"simulated_user_phone":      "5511999999999",
		"simulated_user_name":       "Test User",
	}

	sendWebhook("http://localhost:8085/v1/webhooks/mercadopago", payload)
}

func sendWebhook(url string, payload map[string]interface{}) {
	jsonData, err := json.Marshal(payload)
	if err != nil {
		fmt.Printf("❌ Erro ao criar JSON: %v\n", err)
		return
	}

	fmt.Printf("Enviando payload:\n%s\n\n", string(jsonData))

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("❌ Erro ao criar requisição: %v\n", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "MercadoPago/1.0")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("❌ Erro ao enviar webhook: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("✅ Resposta: Status=%d, Body=%s\n", resp.StatusCode, string(body))
}
