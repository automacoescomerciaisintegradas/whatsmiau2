package main

import (
	"fmt"
	"whatsmiau2/internal/config"
	"whatsmiau2/internal/services"
)

func main() {
	// Load config
	cfg, err := config.Load()
	if err != nil {
		fmt.Printf("Failed to load config: %v\n", err)
		return
	}

	fmt.Printf("MercadoPago Access Token configured: %t\n", cfg.MercadoPagoAccessToken != "")
	if cfg.MercadoPagoAccessToken != "" {
		tokenLen := len(cfg.MercadoPagoAccessToken)
		showLen := 20
		if tokenLen < 20 {
			showLen = tokenLen
		}
		fmt.Printf("Token (first 20 chars): %s...\n", cfg.MercadoPagoAccessToken[:showLen])
	}

	// Create service
	mpSv := services.NewMercadoPagoService(cfg)

	// Test creating a preference
	fmt.Println("\nTesting Mercado Pago preference creation...")
	checkoutURL, err := mpSv.CreateSubscription(
		"Plano Teste",
		99.90,
		"test@example.com",
		"TEST_REF_123",
	)

	if err != nil {
		fmt.Printf("❌ Error: %v\n", err)
		return
	}

	fmt.Printf("✅ Success! Checkout URL: %s\n", checkoutURL)
}
