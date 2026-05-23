package models

import "time"

// Activity representa uma atividade/evento no histórico de um lead
type Activity struct {
	ID          int64     `json:"id" db:"id"`
	LeadID      int64     `json:"lead_id" db:"lead_id"`
	Type        string    `json:"type" db:"type"` // lead_created, status_changed, message_sent, payment_created, email_sent, note_added
	Description string    `json:"description" db:"description"`
	Metadata    string    `json:"metadata" db:"metadata"` // JSON: dados extras da atividade
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// CreateActivityRequest request para criar atividade
type CreateActivityRequest struct {
	LeadID      int64             `json:"lead_id" binding:"required"`
	Type        string            `json:"type" binding:"required"`
	Description string            `json:"description" binding:"required"`
	Metadata    map[string]string `json:"metadata"`
}

// ActivityStats estatísticas de atividades
type ActivityStats struct {
	Total        int            `json:"total"`
	ByType       map[string]int `json:"by_type"`
	LastActivity *Activity      `json:"last_activity"`
	TodayCount   int            `json:"today_count"`
	WeekCount    int            `json:"week_count"`
	MonthCount   int            `json:"month_count"`
}
