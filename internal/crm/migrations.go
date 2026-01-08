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

	// Create automation_rules table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS automation_rules (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			trigger_type VARCHAR(50) NOT NULL,
			trigger_data TEXT,
			actions TEXT,
			enabled BOOLEAN DEFAULT 1,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return err
	}

	// Create automation_actions table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS automation_actions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			rule_id INTEGER NOT NULL,
			action_type VARCHAR(50) NOT NULL,
			action_data TEXT,
			order_num INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (rule_id) REFERENCES automation_rules (id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		return err
	}

	// Create automation_executions table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS automation_executions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			rule_id INTEGER NOT NULL,
			lead_id INTEGER NOT NULL,
			status VARCHAR(50) NOT NULL DEFAULT 'pending',
			error TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (rule_id) REFERENCES automation_rules (id) ON DELETE CASCADE,
			FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		return err
	}

	log.Println("✅ CRM tables created successfully")
	return nil
}
