package crm

import (
	"database/sql"
	"log"
)

// CreateTables cria as tabelas do CRM no banco de dados
func CreateTables(db *sql.DB) error {
	log.Println("🔄 Creating CRM tables...")

	// Create leads table
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS leads (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			nome VARCHAR(255) NOT NULL,
			whatsapp VARCHAR(20) NOT NULL UNIQUE,
			email VARCHAR(255),
			empresa VARCHAR(255),
			site VARCHAR(255),
			instagram VARCHAR(100),
			linkedin VARCHAR(255),
			localizacao VARCHAR(255),
			valor DECIMAL(10,2) DEFAULT 0,
			fonte VARCHAR(50) DEFAULT 'outro',
			status VARCHAR(50) DEFAULT 'novo',
			temperatura VARCHAR(20) DEFAULT 'morno',
			observacoes TEXT,
			tags TEXT,
			avatar_url VARCHAR(500),
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	log.Println("✅ CRM tables created successfully")
	return nil
}
