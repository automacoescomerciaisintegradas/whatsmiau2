-- Migration: Create leads table
-- Created: 2025-12-28
-- Description: Tabela principal de leads/contatos do CRM

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
    tags TEXT, -- JSON array de tags
    avatar_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads(whatsapp);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_temperatura ON leads(temperatura);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Trigger para atualizar updated_at
CREATE TRIGGER IF NOT EXISTS update_leads_timestamp 
AFTER UPDATE ON leads
BEGIN
    UPDATE leads SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
