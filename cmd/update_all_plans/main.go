package main

import (
	"fmt"
	"log"

	"whatsmiau2/internal/config"
	"whatsmiau2/internal/database"
	"whatsmiau2/internal/models"
)

func main() {
	// Criar uma configuração básica para acessar o banco de dados
	cfg := &config.Config{
		DBURL:     "data.db",
		DialectDB: "sqlite",
		DebugMode: true,
	}

	// Inicializar banco de dados
	db, err := database.New(cfg)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	fmt.Println("=== Atualizando todos os planos com documentação ===")
	
	// Atualizar todos os planos para incluir a documentação
	plansToUpdate := []struct {
		name    string
		features string
	}{
		{
			name: "Starter",
			features: `["1 Instância WhatsApp", "Envios Manuais Ilimitados", "Suporte por Email", "Acesso à Comunidade", "Webhooks Básicos", "Documentação da Minha API", "Acesso Swagger", "Documentação Whatsmeow"]`,
		},
		{
			name: "Professional",
			features: `["3 Instâncias WhatsApp", "Chatbot Inteligente (Simples)", "Disparador em Massa", "Suporte Prioritário", "Webhooks Avançados", "Documentação da Minha API"]`,
		},
		{
			name: "Scale",
			features: `["10 Instâncias WhatsApp", "Chatbot com IA (Gemini)", "Múltiplos Usuários", "API White Label", "Gerente de Contas", "Documentação da Minha API"]`,
		},
		{
			name: "Enterprise",
			features: `["Instâncias Ilimitadas", "Infraestrutura Dedicada", "SLA Garantido", "Personalização Total", "Consultoria Mensal", "Documentação da Minha API"]`,
		},
	}

	for _, planData := range plansToUpdate {
		var plan models.Plan
		if err := db.DB.Where("name = ?", planData.name).First(&plan).Error; err != nil {
			fmt.Printf("Erro ao encontrar plano %s: %v\n", planData.name, err)
			continue
		}

		// Atualizar as features do plano
		plan.Features = planData.features
		
		if err := db.DB.Save(&plan).Error; err != nil {
			fmt.Printf("Erro ao atualizar plano %s: %v\n", planData.name, err)
			continue
		}

		fmt.Printf("Plano %s atualizado com sucesso!\n", planData.name)
	}
	
	// Mostrar os planos atualizados
	var allPlans []models.Plan
	db.DB.Where("active = ?", true).Find(&allPlans)
	
	fmt.Println("\nPlanos atualizados:")
	for _, plan := range allPlans {
		fmt.Printf("ID: %d | Nome: %s | Preço: R$%.2f | Ativo: %t\n", 
			plan.ID, plan.Name, plan.Price, plan.Active)
		fmt.Printf("  Features: %s\n", plan.Features)
	}
}