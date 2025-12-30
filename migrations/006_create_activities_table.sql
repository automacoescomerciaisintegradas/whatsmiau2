-- Migration: Create activities table
-- Created: 2025-12-28
-- Description: Log de atividades e histórico de interações com leads

CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- message_sent, payment_created, status_changed, note_added, etc
    description TEXT,
    metadata TEXT, -- JSON com dados adicionais
    user_id INTEGER, -- ID do usuário que realizou a ação (futuro)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
