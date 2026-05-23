package models

import "time"

// MessageTemplate representa um template de mensagem reutilizável
type MessageTemplate struct {
	ID         int64     `json:"id" db:"id"`
	Name       string    `json:"name" db:"name"`
	Content    string    `json:"content" db:"content"`
	Category   string    `json:"category" db:"category"`   // saudacao, followup, pagamento, etc
	Variables  string    `json:"variables" db:"variables"` // JSON array: ["nome", "empresa", "valor"]
	UsageCount int       `json:"usage_count" db:"usage_count"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
	UpdatedAt  time.Time `json:"updated_at" db:"updated_at"`
}

// CreateTemplateRequest request para criar template
type CreateTemplateRequest struct {
	Name      string   `json:"name" binding:"required"`
	Content   string   `json:"content" binding:"required"`
	Category  string   `json:"category"`
	Variables []string `json:"variables"`
}

// UpdateTemplateRequest request para atualizar template
type UpdateTemplateRequest struct {
	Name      *string   `json:"name"`
	Content   *string   `json:"content"`
	Category  *string   `json:"category"`
	Variables *[]string `json:"variables"`
}

// TemplateStats estatísticas de templates
type TemplateStats struct {
	Total       int    `json:"total"`
	MostUsed    string `json:"most_used"`
	MostUsedID  int64  `json:"most_used_id"`
	TotalUsages int    `json:"total_usages"`
}
