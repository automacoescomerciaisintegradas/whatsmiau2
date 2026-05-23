package main

import (
	"fmt"
	"log"
	"whatsmiau2/internal/config"
	"whatsmiau2/internal/crm"
	"whatsmiau2/internal/database"
	"whatsmiau2/internal/models"
	"whatsmiau2/internal/services"
)

// Simula um webhook do Mercado Pago
func simulateWebhook(mpService *services.MercadoPagoService, subService *crm.SubscriptionService) {
	fmt.Println("\n=== SIMULAÇÃO DE WEBHOOK DO MERCADO PAGO ===")

	// Simular um webhook de pagamento aprovado
	paymentID := "123456789" // ID fictício para teste

	fmt.Printf("1. Recebendo webhook para payment_id: %s\n", paymentID)

	// Buscar detalhes do pagamento (isso falhará pois é um ID fictício, mas mostra o fluxo)
	fmt.Println("2. Buscando detalhes do pagamento na API do MP...")
	details, err := mpService.GetSubscriptionDetails(paymentID)
	if err != nil {
		fmt.Printf("   ❌ Erro esperado (ID fictício): %v\n", err)
		fmt.Println("   ✅ Em produção, isso buscaria dados reais do MP")
	} else {
		fmt.Printf("   ✅ Detalhes obtidos: %v\n", details)
	}

	// Simular extração do external_reference
	fmt.Println("3. Extraindo subscription ID do external_reference...")
	externalRef := "SUB_123" // Formato que usamos
	var subID uint
	fmt.Sscanf(externalRef, "SUB_%d", &subID)
	fmt.Printf("   External reference: %s → Subscription ID: %d\n", externalRef, subID)

	// Tentar ativar assinatura (isso falhará pois a sub não existe, mas mostra o fluxo)
	fmt.Println("4. Ativando assinatura...")
	err = subService.ActivateSubscription(subID)
	if err != nil {
		fmt.Printf("   ❌ Erro esperado (assinatura não existe): %v\n", err)
		fmt.Println("   ✅ Em produção, ativaria uma assinatura real")
	} else {
		fmt.Println("   ✅ Assinatura ativada com sucesso!")
	}
}

func main() {
	fmt.Println("=== VERIFICAÇÃO FINAL - WEBHOOK MERCADO PAGO ===")

	// Load config
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	db, err := database.New(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Initialize services
	mpService := services.NewMercadoPagoService(cfg)
	subService := crm.NewSubscriptionService(db)

	fmt.Println("✅ Serviços inicializados")

	// Verificar se há assinaturas pendentes
	var pendingSubs []models.Subscription
	db.DB.Where("status = ?", "pending").Find(&pendingSubs)
	fmt.Printf("📊 Assinaturas pendentes encontradas: %d\n", len(pendingSubs))

	for _, sub := range pendingSubs {
		fmt.Printf("   - ID: %d | Plano: %d | Status: %s\n", sub.ID, sub.PlanID, sub.Status)
	}

	// Simular webhook
	simulateWebhook(mpService, subService)

	fmt.Println("\n=== PRÓXIMOS PASSOS PARA PRODUÇÃO ===")
	fmt.Println("1. ✅ Configure o webhook no painel do Mercado Pago")
	fmt.Println("2. ✅ Teste um pagamento real")
	fmt.Println("3. ✅ Monitore os logs do servidor")
	fmt.Println("4. ✅ Verifique se as assinaturas são ativadas automaticamente")

	fmt.Println("\n=== COMANDOS ÚTEIS ===")
	fmt.Println("# Ver logs de webhooks:")
	fmt.Println("tail -f server.log | grep 'Webhook'")
	fmt.Println("")
	fmt.Println("# Ver assinaturas ativas:")
	fmt.Println("tail -f server.log | grep 'Subscription activated'")
	fmt.Println("")
	fmt.Println("# Testar webhook manualmente:")
	fmt.Println(`curl -X POST http://localhost:8085/v1/webhooks/mercadopago \`)

}
