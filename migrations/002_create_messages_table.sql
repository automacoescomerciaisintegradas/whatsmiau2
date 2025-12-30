-- Migration: Create messages table
-- Created: 2025-12-28
-- Description: Histórico de mensagens trocadas com leads

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text', -- text, image, audio, video, document
    direction VARCHAR(10) DEFAULT 'sent', -- sent, received
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, delivered, read, failed
    media_url VARCHAR(500),
    media_type VARCHAR(50),
    metadata TEXT, -- JSON com dados adicionais
    whatsapp_message_id VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);
