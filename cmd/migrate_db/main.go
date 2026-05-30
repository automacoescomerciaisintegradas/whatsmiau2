package main

import (
	"fmt"
	"log"
	"whatsmiau2/internal/config"
	"whatsmiau2/internal/database"
	"whatsmiau2/internal/models"
)

func main() {
	fmt.Println("=== Migração de Banco de Dados ===")
	fmt.Println("Corrigindo constraint do campo google_id...")
	fmt.Println()

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

	fmt.Println("✓ Conectado ao banco de dados")

	// Step 1: Count users with empty google_id
	var count int64
	db.DB.Model(&models.User{}).Where("google_id = ''").Count(&count)
	fmt.Printf("✓ Encontrados %d usuários com google_id vazio\n", count)

	// Step 2: Set google_id to NULL for users with empty string
	result := db.DB.Model(&models.User{}).
		Where("google_id = ''").
		Update("google_id", nil)

	if result.Error != nil {
		log.Fatalf("Erro ao atualizar google_id: %v", result.Error)
	}

	fmt.Printf("✓ Atualizados %d registros (google_id '' → NULL)\n", result.RowsAffected)

	// Step 3: Auto-migrate to update schema
	fmt.Println("\n✓ Aplicando migração do schema...")
	if err := db.DB.AutoMigrate(&models.User{}); err != nil {
		log.Fatalf("Erro ao migrar schema: %v", err)
	}

	// Step 4: Verify the fix
	var verifyCount int64
	db.DB.Model(&models.User{}).Where("google_id IS NULL").Count(&verifyCount)
	fmt.Printf("✓ Verificação: %d usuários com google_id NULL\n", verifyCount)

	// Step 5: List all users
	fmt.Println("\n=== Usuários no Banco ===")
	var users []models.User
	db.DB.Find(&users)

	for _, user := range users {
		googleID := "NULL"
		if user.GoogleID != nil {
			googleID = *user.GoogleID
		}
		fmt.Printf("ID: %d | Email: %s | Provider: %s | GoogleID: %s\n",
			user.ID, user.Email, user.Provider, googleID)
	}

	fmt.Println("\n✅ Migração concluída com sucesso!")
	fmt.Println("\nAgora você pode criar novos usuários sem problemas:")
	fmt.Println("curl -X POST http://localhost:8085/v1/auth/register \\")
	fmt.Println("  -H 'Content-Type: application/json' \\")
	fmt.Println("  -d '{\"name\":\"Test User\",\"email\":\"test@test.com\",\"password\":\"test123\"}'")
}
