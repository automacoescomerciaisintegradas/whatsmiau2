package models

import "time"

// AutomationRule representa uma regra de automação
type AutomationRule struct {
	ID          int64     `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	TriggerType string    `json:"trigger_type" db:"trigger_type"` // "new_lead", "status_change", "time_delay", "custom_event"
	TriggerData string    `json:"trigger_data" db:"trigger_data"` // JSON com dados específicos do trigger
	Actions     string    `json:"actions" db:"actions"`           // JSON com ações a serem executadas
	Enabled     bool      `json:"enabled" db:"enabled"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// AutomationAction representa uma ação dentro de uma regra de automação
type AutomationAction struct {
	ID         int64  `json:"id" db:"id"`
	RuleID     int64  `json:"rule_id" db:"rule_id"`
	ActionType string `json:"action_type" db:"action_type"` // "send_message", "update_lead", "create_task", "send_email"
	ActionData string `json:"action_data" db:"action_data"` // JSON com dados específicos da ação
	Order      int    `json:"order" db:"order"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

// AutomationExecution representa uma execução de regra de automação
type AutomationExecution struct {
	ID        int64     `json:"id" db:"id"`
	RuleID    int64     `json:"rule_id" db:"rule_id"`
	LeadID    int64     `json:"lead_id" db:"lead_id"`
	Status    string    `json:"status" db:"status"` // "pending", "processing", "completed", "failed"
	Error     *string   `json:"error,omitempty" db:"error"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// SendMessageActionData dados específicos para ação de envio de mensagem
type SendMessageActionData struct {
	InstanceID string `json:"instance_id"`
	Message    string `json:"message"`
	MediaURL   string `json:"media_url,omitempty"`
	WaitTime   int    `json:"wait_time,omitempty"` // Tempo de espera em segundos antes de enviar
}

// CreateAutomationRuleRequest request para criar regra de automação
type CreateAutomationRuleRequest struct {
	Name        string                 `json:"name" binding:"required"`
	Description string                 `json:"description"`
	TriggerType string                 `json:"trigger_type" binding:"required"`
	TriggerData map[string]interface{} `json:"trigger_data"`
	Actions     []CreateActionRequest  `json:"actions" binding:"required"`
	Enabled     bool                   `json:"enabled"`
}

// CreateActionRequest request para criar ação de automação
type CreateActionRequest struct {
	ActionType string                 `json:"action_type" binding:"required"`
	ActionData map[string]interface{} `json:"action_data" binding:"required"`
	Order      int                    `json:"order"`
}

// UpdateAutomationRuleRequest request para atualizar regra de automação
type UpdateAutomationRuleRequest struct {
	Name        *string                 `json:"name"`
	Description *string                 `json:"description"`
	TriggerType *string                 `json:"trigger_type"`
	TriggerData *map[string]interface{} `json:"trigger_data"`
	Actions     *[]CreateActionRequest  `json:"actions"`
	Enabled     *bool                   `json:"enabled"`
}

// AutomationRuleResponse resposta de regra de automação
type AutomationRuleResponse struct {
	ID          int64                  `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	TriggerType string                 `json:"trigger_type"`
	TriggerData map[string]interface{} `json:"trigger_data"`
	Actions     []AutomationAction     `json:"actions"`
	Enabled     bool                   `json:"enabled"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}