package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"whatsmiau2/internal/crm/models"
)

// CRMRepository interface para acesso a dados do CRM
type CRMRepository interface {
	// Leads
	CreateLead(lead *models.Lead) error
	GetLead(id int64) (*models.Lead, error)
	UpdateLead(id int64, updates *models.UpdateLeadRequest) error
	DeleteLead(id int64) error
	ListLeads(filters *models.LeadFilters) ([]*models.Lead, error)
	GetLeadStats() (*models.LeadStats, error)

	// Messages
	CreateMessage(msg *models.Message) error
	GetMessagesByLead(leadID int64, limit int) ([]*models.Message, error)
	GetMessageStats(leadID int64) (*models.MessageStats, error)

	// Payments
	CreatePayment(payment *models.Payment) error
	GetPayment(id int64) (*models.Payment, error)
	UpdatePaymentStatus(id int64, status string, paidAt *string) error
	GetPaymentByMPID(mpPaymentID string) (*models.Payment, error)
	GetPaymentStats() (*models.PaymentStats, error)

	// Tickets
	CreateTicket(ticket *models.Ticket) error
	ListTickets() ([]*models.Ticket, error)
	UpdateTicketStatus(id int64, status string) error
	DeleteTicket(id int64) error
}

// SQLiteCRMRepository implementação SQLite do CRMRepository
type SQLiteCRMRepository struct {
	db *sql.DB
}

// NewSQLiteCRMRepository cria novo repository
func NewSQLiteCRMRepository(db *sql.DB) *SQLiteCRMRepository {
	return &SQLiteCRMRepository{db: db}
}

// CreateLead cria novo lead
func (r *SQLiteCRMRepository) CreateLead(lead *models.Lead) error {
	query := `
		INSERT INTO leads (
			nome, whatsapp, email, empresa, site, instagram, linkedin,
			localizacao, valor, fonte, status, temperatura, observacoes, tags
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := r.db.Exec(query,
		lead.Nome, lead.WhatsApp, lead.Email, lead.Empresa, lead.Site,
		lead.Instagram, lead.LinkedIn, lead.Localizacao, lead.Valor,
		lead.Fonte, lead.Status, lead.Temperatura, lead.Observacoes, lead.Tags,
	)

	if err != nil {
		return fmt.Errorf("failed to create lead: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("failed to get last insert id: %w", err)
	}

	lead.ID = id
	return nil
}

// GetLead busca lead por ID
func (r *SQLiteCRMRepository) GetLead(id int64) (*models.Lead, error) {
	query := `SELECT * FROM leads WHERE id = ?`

	lead := &models.Lead{}
	err := r.db.QueryRow(query, id).Scan(
		&lead.ID, &lead.Nome, &lead.WhatsApp, &lead.Email, &lead.Empresa,
		&lead.Site, &lead.Instagram, &lead.LinkedIn, &lead.Localizacao,
		&lead.Valor, &lead.Fonte, &lead.Status, &lead.Temperatura,
		&lead.Observacoes, &lead.Tags, &lead.AvatarURL,
		&lead.CreatedAt, &lead.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("lead not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get lead: %w", err)
	}

	return lead, nil
}

// UpdateLead atualiza lead
func (r *SQLiteCRMRepository) UpdateLead(id int64, updates *models.UpdateLeadRequest) error {
	setParts := []string{}
	args := []interface{}{}

	if updates.Nome != nil {
		setParts = append(setParts, "nome = ?")
		args = append(args, *updates.Nome)
	}
	if updates.Email != nil {
		setParts = append(setParts, "email = ?")
		args = append(args, *updates.Email)
	}
	if updates.Empresa != nil {
		setParts = append(setParts, "empresa = ?")
		args = append(args, *updates.Empresa)
	}
	if updates.Status != nil {
		setParts = append(setParts, "status = ?")
		args = append(args, *updates.Status)
	}
	if updates.Temperatura != nil {
		setParts = append(setParts, "temperatura = ?")
		args = append(args, *updates.Temperatura)
	}
	if updates.Valor != nil {
		setParts = append(setParts, "valor = ?")
		args = append(args, *updates.Valor)
	}
	if updates.Observacoes != nil {
		setParts = append(setParts, "observacoes = ?")
		args = append(args, *updates.Observacoes)
	}

	if len(setParts) == 0 {
		return fmt.Errorf("no fields to update")
	}

	args = append(args, id)
	query := fmt.Sprintf("UPDATE leads SET %s WHERE id = ?", strings.Join(setParts, ", "))

	_, err := r.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("failed to update lead: %w", err)
	}

	return nil
}

// DeleteLead deleta lead
func (r *SQLiteCRMRepository) DeleteLead(id int64) error {
	query := `DELETE FROM leads WHERE id = ?`
	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete lead: %w", err)
	}
	return nil
}

// ListLeads lista leads com filtros
func (r *SQLiteCRMRepository) ListLeads(filters *models.LeadFilters) ([]*models.Lead, error) {
	query := `SELECT * FROM leads WHERE 1=1`
	args := []interface{}{}

	if filters.Status != "" {
		query += " AND status = ?"
		args = append(args, filters.Status)
	}
	if filters.Temperatura != "" {
		query += " AND temperatura = ?"
		args = append(args, filters.Temperatura)
	}
	if filters.Fonte != "" {
		query += " AND fonte = ?"
		args = append(args, filters.Fonte)
	}
	if filters.Search != "" {
		query += " AND (nome LIKE ? OR email LIKE ? OR empresa LIKE ? OR whatsapp LIKE ?)"
		searchTerm := "%" + filters.Search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm, searchTerm)
	}

	query += " ORDER BY created_at DESC"

	if filters.Limit > 0 {
		query += " LIMIT ?"
		args = append(args, filters.Limit)
	}
	if filters.Offset > 0 {
		query += " OFFSET ?"
		args = append(args, filters.Offset)
	}

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list leads: %w", err)
	}
	defer rows.Close()

	leads := []*models.Lead{}
	for rows.Next() {
		lead := &models.Lead{}
		err := rows.Scan(
			&lead.ID, &lead.Nome, &lead.WhatsApp, &lead.Email, &lead.Empresa,
			&lead.Site, &lead.Instagram, &lead.LinkedIn, &lead.Localizacao,
			&lead.Valor, &lead.Fonte, &lead.Status, &lead.Temperatura,
			&lead.Observacoes, &lead.Tags, &lead.AvatarURL,
			&lead.CreatedAt, &lead.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan lead: %w", err)
		}
		leads = append(leads, lead)
	}

	return leads, nil
}

// GetLeadStats retorna estatísticas de leads
func (r *SQLiteCRMRepository) GetLeadStats() (*models.LeadStats, error) {
	stats := &models.LeadStats{}

	// Total de leads
	err := r.db.QueryRow("SELECT COUNT(*) FROM leads").Scan(&stats.Total)
	if err != nil {
		return nil, err
	}

	// Por status
	r.db.QueryRow("SELECT COUNT(*) FROM leads WHERE status = 'novo'").Scan(&stats.Novos)
	r.db.QueryRow("SELECT COUNT(*) FROM leads WHERE status = 'contato'").Scan(&stats.EmContato)
	r.db.QueryRow("SELECT COUNT(*) FROM leads WHERE status = 'negociacao'").Scan(&stats.Negociacao)
	r.db.QueryRow("SELECT COUNT(*) FROM leads WHERE status = 'fechado'").Scan(&stats.Fechados)
	r.db.QueryRow("SELECT COUNT(*) FROM leads WHERE status = 'perdido'").Scan(&stats.Perdidos)

	// Valor total
	r.db.QueryRow("SELECT COALESCE(SUM(valor), 0) FROM leads").Scan(&stats.ValorTotal)

	// Taxa de conversão
	if stats.Total > 0 {
		stats.Conversao = float64(stats.Fechados) / float64(stats.Total) * 100
	}

	return stats, nil
}

// CreateMessage cria nova mensagem
func (r *SQLiteCRMRepository) CreateMessage(msg *models.Message) error {
	query := `
		INSERT INTO messages (
			lead_id, content, type, direction, status, media_url, media_type, metadata, whatsapp_message_id
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := r.db.Exec(query,
		msg.LeadID, msg.Content, msg.Type, msg.Direction, msg.Status,
		msg.MediaURL, msg.MediaType, msg.Metadata, msg.WhatsAppMessageID,
	)

	if err != nil {
		return fmt.Errorf("failed to create message: %w", err)
	}

	id, _ := result.LastInsertId()
	msg.ID = id
	return nil
}

// GetMessagesByLead busca mensagens de um lead
func (r *SQLiteCRMRepository) GetMessagesByLead(leadID int64, limit int) ([]*models.Message, error) {
	query := `SELECT * FROM messages WHERE lead_id = ? ORDER BY created_at DESC LIMIT ?`

	rows, err := r.db.Query(query, leadID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get messages: %w", err)
	}
	defer rows.Close()

	messages := []*models.Message{}
	for rows.Next() {
		msg := &models.Message{}
		err := rows.Scan(
			&msg.ID, &msg.LeadID, &msg.Content, &msg.Type, &msg.Direction,
			&msg.Status, &msg.MediaURL, &msg.MediaType, &msg.Metadata,
			&msg.WhatsAppMessageID, &msg.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	return messages, nil
}

// GetMessageStats retorna estatísticas de mensagens
func (r *SQLiteCRMRepository) GetMessageStats(leadID int64) (*models.MessageStats, error) {
	stats := &models.MessageStats{}

	r.db.QueryRow("SELECT COUNT(*) FROM messages WHERE lead_id = ?", leadID).Scan(&stats.Total)
	r.db.QueryRow("SELECT COUNT(*) FROM messages WHERE lead_id = ? AND direction = 'sent'", leadID).Scan(&stats.Sent)
	r.db.QueryRow("SELECT COUNT(*) FROM messages WHERE lead_id = ? AND direction = 'received'", leadID).Scan(&stats.Received)

	return stats, nil
}

// CreatePayment cria novo pagamento
func (r *SQLiteCRMRepository) CreatePayment(payment *models.Payment) error {
	query := `
		INSERT INTO payments (
			lead_id, amount, description, status, pix_code, pix_qr_code,
			mp_payment_id, mp_preference_id, expires_at, metadata
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := r.db.Exec(query,
		payment.LeadID, payment.Amount, payment.Description, payment.Status,
		payment.PixCode, payment.PixQRCode, payment.MPPaymentID,
		payment.MPPreferenceID, payment.ExpiresAt, payment.Metadata,
	)

	if err != nil {
		return fmt.Errorf("failed to create payment: %w", err)
	}

	id, _ := result.LastInsertId()
	payment.ID = id
	return nil
}

// GetPayment busca pagamento por ID
func (r *SQLiteCRMRepository) GetPayment(id int64) (*models.Payment, error) {
	query := `SELECT * FROM payments WHERE id = ?`

	payment := &models.Payment{}
	err := r.db.QueryRow(query, id).Scan(
		&payment.ID, &payment.LeadID, &payment.Amount, &payment.Description,
		&payment.Status, &payment.PixCode, &payment.PixQRCode,
		&payment.MPPaymentID, &payment.MPPreferenceID,
		&payment.ExpiresAt, &payment.PaidAt, &payment.Metadata,
		&payment.CreatedAt, &payment.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("payment not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get payment: %w", err)
	}

	return payment, nil
}

// UpdatePaymentStatus atualiza status do pagamento
func (r *SQLiteCRMRepository) UpdatePaymentStatus(id int64, status string, paidAt *string) error {
	query := `UPDATE payments SET status = ?, paid_at = ? WHERE id = ?`
	_, err := r.db.Exec(query, status, paidAt, id)
	return err
}

// GetPaymentByMPID busca pagamento por ID do Mercado Pago
func (r *SQLiteCRMRepository) GetPaymentByMPID(mpPaymentID string) (*models.Payment, error) {
	query := `SELECT * FROM payments WHERE mp_payment_id = ?`

	payment := &models.Payment{}
	err := r.db.QueryRow(query, mpPaymentID).Scan(
		&payment.ID, &payment.LeadID, &payment.Amount, &payment.Description,
		&payment.Status, &payment.PixCode, &payment.PixQRCode,
		&payment.MPPaymentID, &payment.MPPreferenceID,
		&payment.ExpiresAt, &payment.PaidAt, &payment.Metadata,
		&payment.CreatedAt, &payment.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return payment, nil
}

// GetPaymentStats retorna estatísticas de pagamentos
func (r *SQLiteCRMRepository) GetPaymentStats() (*models.PaymentStats, error) {
	stats := &models.PaymentStats{}

	r.db.QueryRow("SELECT COUNT(*) FROM payments").Scan(&stats.Total)
	r.db.QueryRow("SELECT COUNT(*) FROM payments WHERE status = 'pending'").Scan(&stats.Pending)
	r.db.QueryRow("SELECT COUNT(*) FROM payments WHERE status = 'approved'").Scan(&stats.Approved)
	r.db.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM payments").Scan(&stats.TotalAmount)
	r.db.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'approved'").Scan(&stats.ApprovedAmount)
	r.db.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'pending'").Scan(&stats.PendingAmount)

	return stats, nil
}

// CreateTicket cria novo ticket
func (r *SQLiteCRMRepository) CreateTicket(ticket *models.Ticket) error {
	query := `
		INSERT INTO tickets (customer_name, customer_phone, subject, status, priority)
		VALUES (?, ?, ?, ?, ?)
	`
	result, err := r.db.Exec(query, ticket.CustomerName, ticket.CustomerPhone, ticket.Subject, ticket.Status, ticket.Priority)
	if err != nil {
		return err
	}
	id, _ := result.LastInsertId()
	ticket.ID = id
	return nil
}

// ListTickets lista todos os tickets
func (r *SQLiteCRMRepository) ListTickets() ([]*models.Ticket, error) {
	query := `SELECT * FROM tickets ORDER BY updated_at DESC`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tickets := []*models.Ticket{}
	for rows.Next() {
		t := &models.Ticket{}
		err := rows.Scan(
			&t.ID, &t.CustomerName, &t.CustomerPhone, &t.Subject,
			&t.Status, &t.Priority, &t.LastActivity, &t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		tickets = append(tickets, t)
	}
	return tickets, nil
}

// UpdateTicketStatus atualiza status do ticket
func (r *SQLiteCRMRepository) UpdateTicketStatus(id int64, status string) error {
	query := `UPDATE tickets SET status = ?, updated_at = CURRENT_TIMESTAMP, last_activity = CURRENT_TIMESTAMP WHERE id = ?`
	_, err := r.db.Exec(query, status, id)
	return err
}

// DeleteTicket deleta ticket
func (r *SQLiteCRMRepository) DeleteTicket(id int64) error {
	query := `DELETE FROM tickets WHERE id = ?`
	_, err := r.db.Exec(query, id)
	return err
}
