package models

import "time"

// Message representa uma mensagem trocada com um lead
type Message struct {
	ID                int64     `json:"id" db:"id"`
	LeadID            int64     `json:"lead_id" db:"lead_id"`
	Content           string    `json:"content" db:"content"`
	Type              string    `json:"type" db:"type"`           // text, image, audio, video, document
	Direction         string    `json:"direction" db:"direction"` // sent, received
	Status            string    `json:"status" db:"status"`       // pending, sent, delivered, read, failed
	MediaURL          string    `json:"media_url" db:"media_url"`
	MediaType         string    `json:"media_type" db:"media_type"`
	Metadata          string    `json:"metadata" db:"metadata"` // JSON
	WhatsAppMessageID string    `json:"whatsapp_message_id" db:"whatsapp_message_id"`
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
}

// SendMessageRequest request para enviar mensagem
type SendMessageRequest struct {
	LeadID   int64  `json:"lead_id" binding:"required"`
	Content  string `json:"content" binding:"required"`
	Type     string `json:"type"` // text, image, audio, video, document
	MediaURL string `json:"media_url"`
}

// MessageStats estatísticas de mensagens
type MessageStats struct {
	Total     int `json:"total"`
	Sent      int `json:"sent"`
	Received  int `json:"received"`
	Delivered int `json:"delivered"`
	Read      int `json:"read"`
	Failed    int `json:"failed"`
}
