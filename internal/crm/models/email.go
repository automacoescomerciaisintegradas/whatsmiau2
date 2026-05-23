package models

import "time"

// EmailCampaign representa uma campanha de email marketing
type EmailCampaign struct {
	ID           int64      `json:"id" db:"id"`
	Subject      string     `json:"subject" db:"subject"`
	Body         string     `json:"body" db:"body"`
	Recipients   string     `json:"recipients" db:"recipients"` // JSON array de lead IDs
	Status       string     `json:"status" db:"status"`         // draft, scheduled, sending, sent, failed
	SentCount    int        `json:"sent_count" db:"sent_count"`
	OpenedCount  int        `json:"opened_count" db:"opened_count"`
	ClickedCount int        `json:"clicked_count" db:"clicked_count"`
	FailedCount  int        `json:"failed_count" db:"failed_count"`
	ScheduledAt  *time.Time `json:"scheduled_at" db:"scheduled_at"`
	SentAt       *time.Time `json:"sent_at" db:"sent_at"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
}

// CreateEmailCampaignRequest request para criar campanha de email
type CreateEmailCampaignRequest struct {
	Subject     string  `json:"subject" binding:"required"`
	Body        string  `json:"body" binding:"required"`
	Recipients  []int64 `json:"recipients" binding:"required"`
	ScheduledAt *string `json:"scheduled_at"` // RFC3339 format
}

// EmailStats estatísticas de email
type EmailStats struct {
	Total       int     `json:"total"`
	Sent        int     `json:"sent"`
	Opened      int     `json:"opened"`
	Clicked     int     `json:"clicked"`
	Failed      int     `json:"failed"`
	OpenRate    float64 `json:"open_rate"`    // %
	ClickRate   float64 `json:"click_rate"`   // %
	FailureRate float64 `json:"failure_rate"` // %
}
