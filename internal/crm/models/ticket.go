package models

import "time"

// Ticket representa um ticket de suporte no CRM
type Ticket struct {
	ID            int64     `json:"id" db:"id"`
	CustomerName  string    `json:"customerName" db:"customer_name"`
	CustomerPhone string    `json:"customerPhone" db:"customer_phone"`
	Subject       string    `json:"subject" db:"subject"`
	Status        string    `json:"status" db:"status"`     // NOVO, PENDENTE, ABERTO, FECHADO
	Priority      string    `json:"priority" db:"priority"` // BAIXA, MÉDIA, ALTA, CRÍTICA
	LastActivity  time.Time `json:"lastActivity" db:"last_activity"`
	CreatedAt     time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt     time.Time `json:"updatedAt" db:"updated_at"`
}

// CreateTicketRequest request para criar ticket
type CreateTicketRequest struct {
	CustomerName  string `json:"customerName" binding:"required"`
	CustomerPhone string `json:"customerPhone" binding:"required"`
	Subject       string `json:"subject" binding:"required"`
	Priority      string `json:"priority"`
}

// UpdateTicketStatusRequest request para atualizar status do ticket
type UpdateTicketStatusRequest struct {
	Status string `json:"status" binding:"required"`
}
