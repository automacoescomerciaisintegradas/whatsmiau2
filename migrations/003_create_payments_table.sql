-- Migration: Create payments table
-- Created: 2025-12-28
-- Description: Cobranças e pagamentos PIX via Mercado Pago

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled, refunded
    pix_code TEXT, -- Código PIX copia e cola
    pix_qr_code TEXT, -- Base64 do QR Code
    mp_payment_id VARCHAR(100), -- ID do pagamento no Mercado Pago
    mp_preference_id VARCHAR(100), -- ID da preferência no MP
    expires_at DATETIME,
    paid_at DATETIME,
    metadata TEXT, -- JSON com dados adicionais do MP
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payments_lead_id ON payments(lead_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_mp_payment_id ON payments(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Trigger para atualizar updated_at
CREATE TRIGGER IF NOT EXISTS update_payments_timestamp 
AFTER UPDATE ON payments
BEGIN
    UPDATE payments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
