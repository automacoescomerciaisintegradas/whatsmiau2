-- Migration: Create message_templates table
-- Created: 2025-12-28
-- Description: Templates de mensagens reutilizáveis

CREATE TABLE IF NOT EXISTS message_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'geral', -- geral, vendas, suporte, cobranca
    variables TEXT, -- JSON array de variáveis disponíveis
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_templates_category ON message_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON message_templates(is_active);

-- Trigger
CREATE TRIGGER IF NOT EXISTS update_templates_timestamp 
AFTER UPDATE ON message_templates
BEGIN
    UPDATE message_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
