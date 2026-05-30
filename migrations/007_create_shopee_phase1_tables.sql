-- Migration: Shopee + Disparador (Fase 1)
-- Created: 2026-05-27
-- Description: Estrutura inicial para busca de ofertas e campanhas de disparo vinculadas

CREATE TABLE IF NOT EXISTS marketplace_searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    source VARCHAR(30) NOT NULL DEFAULT 'shopee',
    keyword VARCHAR(255) NOT NULL,
    country VARCHAR(10) NOT NULL DEFAULT 'BR',
    sort VARCHAR(30) DEFAULT 'relevance',
    requested_limit INTEGER NOT NULL DEFAULT 30,
    result_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marketplace_searches_user_id ON marketplace_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_searches_source ON marketplace_searches(source);
CREATE INDEX IF NOT EXISTS idx_marketplace_searches_keyword ON marketplace_searches(keyword);
CREATE INDEX IF NOT EXISTS idx_marketplace_searches_created_at ON marketplace_searches(created_at);

CREATE TABLE IF NOT EXISTS marketplace_offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    source VARCHAR(30) NOT NULL DEFAULT 'shopee',
    source_search_id INTEGER,
    external_item_id VARCHAR(120) NOT NULL,
    title VARCHAR(500) NOT NULL,
    label VARCHAR(100),
    notes TEXT,
    currency VARCHAR(10) DEFAULT 'BRL',
    price DECIMAL(12,2) DEFAULT 0,
    original_price DECIMAL(12,2),
    sold_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2),
    shop_name VARCHAR(255),
    shop_id VARCHAR(120),
    item_url TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    raw_payload TEXT,
    captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, source, external_item_id)
);

CREATE INDEX IF NOT EXISTS idx_marketplace_offers_user_id ON marketplace_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_source ON marketplace_offers(source);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_title ON marketplace_offers(title);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_label ON marketplace_offers(label);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_is_active ON marketplace_offers(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_created_at ON marketplace_offers(created_at);

CREATE TABLE IF NOT EXISTS offer_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    offer_id INTEGER NOT NULL,
    instance_name VARCHAR(120) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    message_template TEXT NOT NULL,
    delay_seconds INTEGER NOT NULL DEFAULT 8,
    sent_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_offer_campaigns_user_id ON offer_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_campaigns_offer_id ON offer_campaigns(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_campaigns_status ON offer_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_offer_campaigns_created_at ON offer_campaigns(created_at);

CREATE TABLE IF NOT EXISTS offer_campaign_recipients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    phone_e164 VARCHAR(20) NOT NULL,
    personalization_json TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    sent_at DATETIME,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, phone_e164)
);

CREATE INDEX IF NOT EXISTS idx_offer_campaign_recipients_campaign_id ON offer_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_offer_campaign_recipients_status ON offer_campaign_recipients(status);

CREATE TABLE IF NOT EXISTS dispatch_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    campaign_id INTEGER,
    offer_id INTEGER,
    instance_name VARCHAR(120) NOT NULL,
    recipient VARCHAR(40) NOT NULL,
    payload_json TEXT,
    response_json TEXT,
    status VARCHAR(30) NOT NULL,
    error_message TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_dispatch_logs_user_id ON dispatch_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_logs_campaign_id ON dispatch_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_logs_offer_id ON dispatch_logs(offer_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_logs_status ON dispatch_logs(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_logs_sent_at ON dispatch_logs(sent_at);

-- Triggers de updated_at (SQLite)
CREATE TRIGGER IF NOT EXISTS update_marketplace_offers_timestamp
AFTER UPDATE ON marketplace_offers
BEGIN
    UPDATE marketplace_offers
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_offer_campaigns_timestamp
AFTER UPDATE ON offer_campaigns
BEGIN
    UPDATE offer_campaigns
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;
