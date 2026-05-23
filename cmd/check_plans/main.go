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
		DBURL:    "data.db",
		DialectDB: "sqlite",
		DebugMode: true,
	}

	// Inicializar banco de dados
	db, err := database.New(cfg)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	fmt.Println("=== Verificando Planos no Banco de Dados ===")
	
	// Verificar se a tabela plans existe e contar registros
	var count int64
	if err := db.DB.Model(&models.Plan{}).Count(&count).Error; err != nil {
		fmt.Printf("Erro ao contar planos: %v\n", err)
		return
	}
	
	fmt.Printf("Total de planos encontrados: %d\n", count)

	if count > 0 {
		// Buscar e exibir todos os planos
		var plans []models.Plan
		if err := db.DB.Find(&plans).Error; err != nil {
			fmt.Printf("Erro ao buscar planos: %v\n", err)
			return
		}

		fmt.Println("\nDetalhes dos Planos:")
		for _, plan := range plans {
			status := "INATIVO"
			if plan.Active {
				status = "ATIVO"
			}
			
			fmt.Printf("ID: %d | Nome: %s | Preço: R$%.2f | Status: %s\n", 
				plan.ID, plan.Name, plan.Price, status)
		}
	} else {
		fmt.Println("Nenhum plano encontrado. Verificando se a tabela existe...")
		
		// Verificar se a tabela existe consultando informações do schema
		var tableExists []struct {
			Name string `gorm:"column:name"`
		}
		
		// Para SQLite, podemos verificar as tabelas existentes
		if err := db.DB.Raw("SELECT name FROM sqlite_master WHERE type='table' AND name='plans';").Scan(&tableExists).Error; err != nil {
			fmt.Printf("Erro ao verificar existência da tabela: %v\n", err)
		} else if len(tableExists) > 0 {
			fmt.Println("Tabela 'plans' existe, mas está vazia.")
		} else {
			fmt.Println("Tabela 'plans' NÃO EXISTE no banco de dados.")
		}
	}

	// Verificar também a estrutura da tabela
	fmt.Println("\n=== Estrutura da Tabela Plans ===")
	var tableInfo []struct {
		Cid        int    `gorm:"column:cid"`
		Name       string `gorm:"column:name"`
		Type       string `gorm:"column:type"`
		NotNull    int    `gorm:"column:notnull"`
		DefaultVal *string `gorm:"column:dflt_value"`
		Pk         int    `gorm:"column:pk"`
	}
	
	if err := db.DB.Raw("PRAGMA table_info(plans);").Scan(&tableInfo).Error; err != nil {
		fmt.Printf("Erro ao obter estrutura da tabela: %v\n", err)
	} else {
		fmt.Println("Colunas da tabela 'plans':")
		for _, col := range tableInfo {
			nn := ""
			if col.NotNull == 1 {
				nn = "NOT NULL"
			}
			pk := ""
			if col.Pk == 1 {
				pk = "PK"
			}
			def := ""
			if col.DefaultVal != nil {
				def = fmt.Sprintf("(default: %s)", *col.DefaultVal)
			}
			fmt.Printf("  %s (%s) %s %s %s\n", col.Name, col.Type, nn, pk, def)
		}
	}
}