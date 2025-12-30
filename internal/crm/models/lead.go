package models

import "time"

// Lead representa um lead/contato no CRM
type Lead struct {
	ID          int64     `json:"id" db:"id"`
	Nome        string    `json:"nome" db:"nome"`
	WhatsApp    string    `json:"whatsapp" db:"whatsapp"`
	Email       string    `json:"email" db:"email"`
	Empresa     string    `json:"empresa" db:"empresa"`
	Site        string    `json:"site" db:"site"`
	Instagram   string    `json:"instagram" db:"instagram"`
	LinkedIn    string    `json:"linkedin" db:"linkedin"`
	Localizacao string    `json:"localizacao" db:"localizacao"`
	Valor       float64   `json:"valor" db:"valor"`
	Fonte       string    `json:"fonte" db:"fonte"`
	Status      string    `json:"status" db:"status"`
	Temperatura string    `json:"temperatura" db:"temperatura"`
	Observacoes string    `json:"observacoes" db:"observacoes"`
	Tags        string    `json:"tags" db:"tags"` // JSON array
	AvatarURL   *string   `json:"avatar_url,omitempty" db:"avatar_url"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// LeadFilters para filtrar listagem de leads
type LeadFilters struct {
	Status      string `json:"status"`
	Temperatura string `json:"temperatura"`
	Fonte       string `json:"fonte"`
	Search      string `json:"search"`
	Limit       int    `json:"limit"`
	Offset      int    `json:"offset"`
}

// LeadStats estatísticas de leads
type LeadStats struct {
	Total      int     `json:"total"`
	Novos      int     `json:"novos"`
	EmContato  int     `json:"em_contato"`
	Negociacao int     `json:"negociacao"`
	Fechados   int     `json:"fechados"`
	Perdidos   int     `json:"perdidos"`
	ValorTotal float64 `json:"valor_total"`
	Conversao  float64 `json:"conversao"` // %
}

// CreateLeadRequest request para criar lead
type CreateLeadRequest struct {
	Nome        string  `json:"nome" binding:"required"`
	WhatsApp    string  `json:"whatsapp" binding:"required"`
	Email       string  `json:"email"`
	Empresa     string  `json:"empresa"`
	Site        string  `json:"site"`
	Instagram   string  `json:"instagram"`
	LinkedIn    string  `json:"linkedin"`
	Localizacao string  `json:"localizacao"`
	Valor       float64 `json:"valor"`
	Fonte       string  `json:"fonte"`
	Status      string  `json:"status"`
	Temperatura string  `json:"temperatura"`
	Observacoes string  `json:"observacoes"`
}

// UpdateLeadRequest request para atualizar lead
type UpdateLeadRequest struct {
	Nome        *string  `json:"nome"`
	Email       *string  `json:"email"`
	Empresa     *string  `json:"empresa"`
	Site        *string  `json:"site"`
	Instagram   *string  `json:"instagram"`
	LinkedIn    *string  `json:"linkedin"`
	Localizacao *string  `json:"localizacao"`
	Valor       *float64 `json:"valor"`
	Fonte       *string  `json:"fonte"`
	Status      *string  `json:"status"`
	Temperatura *string  `json:"temperatura"`
	Observacoes *string  `json:"observacoes"`
}
