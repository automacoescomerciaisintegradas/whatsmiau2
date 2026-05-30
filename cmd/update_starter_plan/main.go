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

	fmt.Println("=== Atualizando plano Starter com documentação ===")
	
	// Encontrar o plano Starter
	var starterPlan models.Plan
	if err := db.DB.Where("name = ?", "Starter").First(&starterPlan).Error; err != nil {
		fmt.Println("Erro ao encontrar plano Starter:", err)
		return
	}

	// Atualizar as features do plano Starter
	newFeatures := `["1 Instância WhatsApp", "Envios Manuais Ilimitados", "Suporte por Email", "Acesso à Comunidade", "Webhooks Básicos", "Documentação da Minha API", "Acesso Swagger", "Documentação Whatsmeow"]`
	starterPlan.Features = newFeatures
	
	if err := db.DB.Save(&starterPlan).Error; err != nil {
		fmt.Println("Erro ao atualizar plano Starter:", err)
		return
	}

	fmt.Printf("Plano Starter atualizado com sucesso! Novas features: %s\n", newFeatures)
	
	// Mostrar o plano atualizado
	fmt.Printf("ID: %d | Nome: %s | Preço: R$%.2f | Ativo: %t\n", 
		starterPlan.ID, starterPlan.Name, starterPlan.Price, starterPlan.Active)
}