package models

import "time"

// Payment representa um pagamento/cobrança PIX
type Payment struct {
	ID             int64      `json:"id" db:"id"`
	LeadID         int64      `json:"lead_id" db:"lead_id"`
	Amount         float64    `json:"amount" db:"amount"`
	Description    string     `json:"description" db:"description"`
	Status         string     `json:"status" db:"status"` // pending, approved, rejected, cancelled, refunded
	PixCode        string     `json:"pix_code" db:"pix_code"`
	PixQRCode      string     `json:"pix_qr_code" db:"pix_qr_code"`
	MPPaymentID    string     `json:"mp_payment_id" db:"mp_payment_id"`
	MPPreferenceID string     `json:"mp_preference_id" db:"mp_preference_id"`
	ExpiresAt      *time.Time `json:"expires_at" db:"expires_at"`
	PaidAt         *time.Time `json:"paid_at" db:"paid_at"`
	Metadata       string     `json:"metadata" db:"metadata"` // JSON
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
}

// CreatePaymentRequest request para criar cobrança PIX
type CreatePaymentRequest struct {
	LeadID      int64   `json:"lead_id" binding:"required"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	Description string  `json:"description"`
	ExpiresIn   int     `json:"expires_in"` // minutos
}

// PaymentStats estatísticas de pagamentos
type PaymentStats struct {
	Total          int     `json:"total"`
	Pending        int     `json:"pending"`
	Approved       int     `json:"approved"`
	Rejected       int     `json:"rejected"`
	TotalAmount    float64 `json:"total_amount"`
	ApprovedAmount float64 `json:"approved_amount"`
	PendingAmount  float64 `json:"pending_amount"`
}

// MercadoPagoWebhook dados do webhook do Mercado Pago
type MercadoPagoWebhook struct {
	Action string `json:"action"`
	Data   struct {
		ID string `json:"id"`
	} `json:"data"`
	Type string `json:"type"`
}
