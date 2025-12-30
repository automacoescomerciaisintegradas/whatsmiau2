-- Migration: Create email_campaigns table
-- Created: 2025-12-28
-- Description: Campanhas de email marketing via Resend

CREATE TABLE IF NOT EXISTS email_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    recipients TEXT NOT NULL, -- JSON array de emails
    status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, sending, sent, failed
    sent_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    scheduled_at DATETIME,
    sent_at DATETIME,
    resend_batch_id VARCHAR(100),
    metadata TEXT, -- JSON com dados adicionais
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at);

-- Trigger
CREATE TRIGGER IF NOT EXISTS update_email_campaigns_timestamp 
AFTER UPDATE ON email_campaigns
BEGIN
    UPDATE email_campaigns SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
