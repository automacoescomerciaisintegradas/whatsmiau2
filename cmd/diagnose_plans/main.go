package main

import (
	"fmt"
	"log"

	"whatsmiau2/internal/config"
	"whatsmiau2/internal/database"
	"whatsmiau2/internal/models"
)

func main() {
	// Carregar configuração
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load configuration:", err)
	}

	// Inicializar banco de dados
	db, err := database.New(cfg)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// Verificar se os planos existem
	fmt.Println("=== Verificando Planos ===")
	var plans []models.Plan
	if err := db.DB.Where("active = ?", true).Find(&plans).Error; err != nil {
		log.Fatal("Erro ao buscar planos:", err)
	}

	if len(plans) == 0 {
		fmt.Println("Nenhum plano encontrado!")
	} else {
		fmt.Printf("Encontrados %d planos:\n", len(plans))
		for _, plan := range plans {
			fmt.Printf("- ID: %d, Nome: %s, Preço: %.2f\n", plan.ID, plan.Name, plan.Price)
		}
	}

	// Verificar se há problemas com a estrutura da tabela
	fmt.Println("\n=== Verificando Estrutura da Tabela Plans ===")
	var count int64
	if err := db.DB.Model(&models.Plan{}).Count(&count).Error; err != nil {
		fmt.Println("Erro ao contar registros:", err)
	} else {
		fmt.Printf("Total de registros na tabela plans: %d\n", count)
	}

	// Tentar buscar um plano específico para testar
	if len(plans) > 0 {
		var testPlan models.Plan
		testID := plans[0].ID
		fmt.Printf("\n=== Testando busca pelo plano ID %d ===\n", testID)
		
		if err := db.DB.First(&testPlan, testID).Error; err != nil {
			fmt.Printf("Erro ao buscar plano ID %d: %v\n", testID, err)
		} else {
			fmt.Printf("Plano encontrado: ID=%d, Nome=%s\n", testPlan.ID, testPlan.Name)
		}
	}
}