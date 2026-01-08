package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"whatsmiau2/internal/crm/models"
)

// AutomationRepository interface para operações de automação
type AutomationRepository interface {
	CreateAutomationRule(rule *models.AutomationRule) error
	GetAutomationRule(id int64) (*models.AutomationRule, error)
	UpdateAutomationRule(id int64, updates *models.UpdateAutomationRuleRequest) error
	DeleteAutomationRule(id int64) error
	ListAutomationRules(enabled *bool) ([]*models.AutomationRule, error)
	
	CreateAutomationAction(action *models.AutomationAction) error
	GetAutomationActionsByRule(ruleID int64) ([]*models.AutomationAction, error)
	DeleteAutomationActionsByRule(ruleID int64) error
	
	CreateAutomationExecution(execution *models.AutomationExecution) error
	UpdateAutomationExecutionStatus(id int64, status string, error *string) error
	GetAutomationExecutionsByRule(ruleID int64) ([]*models.AutomationExecution, error)
	GetAutomationExecutionsByLead(leadID int64) ([]*models.AutomationExecution, error)
}

// SQLiteAutomationRepository implementação SQLite do AutomationRepository
type SQLiteAutomationRepository struct {
	db *sql.DB
}

// NewSQLiteAutomationRepository cria novo repository de automação
func NewSQLiteAutomationRepository(db *sql.DB) *SQLiteAutomationRepository {
	return &SQLiteAutomationRepository{db: db}
}

// CreateAutomationRule cria nova regra de automação
func (r *SQLiteAutomationRepository) CreateAutomationRule(rule *models.AutomationRule) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Inserir a regra
	query := `
		INSERT INTO automation_rules (
			name, description, trigger_type, trigger_data, actions, enabled
		) VALUES (?, ?, ?, ?, ?, ?)
	`

	result, err := tx.Exec(query,
		rule.Name, rule.Description, rule.TriggerType, rule.TriggerData, rule.Actions, rule.Enabled,
	)

	if err != nil {
		return fmt.Errorf("failed to create automation rule: %w", err)
	}

	ruleID, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("failed to get last insert id: %w", err)
	}

	rule.ID = ruleID

	// Commit da transação
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetAutomationRule busca regra de automação por ID
func (r *SQLiteAutomationRepository) GetAutomationRule(id int64) (*models.AutomationRule, error) {
	query := `SELECT * FROM automation_rules WHERE id = ?`

	rule := &models.AutomationRule{}
	var triggerData, actions sql.NullString
	err := r.db.QueryRow(query, id).Scan(
		&rule.ID, &rule.Name, &rule.Description, &rule.TriggerType,
		&triggerData, &actions, &rule.Enabled, &rule.CreatedAt, &rule.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("automation rule not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get automation rule: %w", err)
	}

	if triggerData.Valid {
		rule.TriggerData = triggerData.String
	}
	if actions.Valid {
		rule.Actions = actions.String
	}

	// Obter ações associadas
	actionsList, err := r.GetAutomationActionsByRule(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get automation actions: %w", err)
	}

	return rule, nil
}

// UpdateAutomationRule atualiza regra de automação
func (r *SQLiteAutomationRepository) UpdateAutomationRule(id int64, updates *models.UpdateAutomationRuleRequest) error {
	setParts := []string{}
	args := []interface{}{}

	if updates.Name != nil {
		setParts = append(setParts, "name = ?")
		args = append(args, *updates.Name)
	}
	if updates.Description != nil {
		setParts = append(setParts, "description = ?")
		args = append(args, *updates.Description)
	}
	if updates.TriggerType != nil {
		setParts = append(setParts, "trigger_type = ?")
		args = append(args, *updates.TriggerType)
	}
	if updates.TriggerData != nil {
		jsonData, err := json.Marshal(updates.TriggerData)
		if err != nil {
			return fmt.Errorf("failed to marshal trigger data: %w", err)
		}
		setParts = append(setParts, "trigger_data = ?")
		args = append(args, string(jsonData))
	}
	if updates.Enabled != nil {
		setParts = append(setParts, "enabled = ?")
		args = append(args, *updates.Enabled)
	}

	if len(setParts) == 0 {
		return fmt.Errorf("no fields to update")
	}

	args = append(args, id)
	query := fmt.Sprintf("UPDATE automation_rules SET %s WHERE id = ?", strings.Join(setParts, ", "))

	_, err := r.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("failed to update automation rule: %w", err)
	}

	// Se as ações foram atualizadas, atualizar também
	if updates.Actions != nil {
		// Primeiro, remover ações antigas
		if err := r.DeleteAutomationActionsByRule(id); err != nil {
			return fmt.Errorf("failed to delete old actions: %w", err)
		}

		// Depois, adicionar novas ações
		for _, actionReq := range *updates.Actions {
			action := &models.AutomationAction{
				RuleID:     id,
				ActionType: actionReq.ActionType,
				Order:      actionReq.Order,
			}

			jsonData, err := json.Marshal(actionReq.ActionData)
			if err != nil {
				return fmt.Errorf("failed to marshal action data: %w", err)
			}
			action.ActionData = string(jsonData)

			if err := r.CreateAutomationAction(action); err != nil {
				return fmt.Errorf("failed to create automation action: %w", err)
			}
		}
	}

	return nil
}

// DeleteAutomationRule deleta regra de automação
func (r *SQLiteAutomationRepository) DeleteAutomationRule(id int64) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Remover ações primeiro
	if err := r.DeleteAutomationActionsByRule(id); err != nil {
		return fmt.Errorf("failed to delete automation actions: %w", err)
	}

	// Remover regra
	query := `DELETE FROM automation_rules WHERE id = ?`
	_, err = tx.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete automation rule: %w", err)
	}

	// Commit da transação
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// ListAutomationRules lista regras de automação com filtro opcional por enabled
func (r *SQLiteAutomationRepository) ListAutomationRules(enabled *bool) ([]*models.AutomationRule, error) {
	query := `SELECT * FROM automation_rules WHERE 1=1`
	args := []interface{}{}

	if enabled != nil {
		query += " AND enabled = ?"
		args = append(args, *enabled)
	}

	query += " ORDER BY created_at DESC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list automation rules: %w", err)
	}
	defer rows.Close()

	rules := []*models.AutomationRule{}
	for rows.Next() {
		rule := &models.AutomationRule{}
		var triggerData, actions sql.NullString
		err := rows.Scan(
			&rule.ID, &rule.Name, &rule.Description, &rule.TriggerType,
			&triggerData, &actions, &rule.Enabled, &rule.CreatedAt, &rule.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan automation rule: %w", err)
		}

		if triggerData.Valid {
			rule.TriggerData = triggerData.String
		}
		if actions.Valid {
			rule.Actions = actions.String
		}

		rules = append(rules, rule)
	}

	return rules, nil
}

// CreateAutomationAction cria nova ação de automação
func (r *SQLiteAutomationRepository) CreateAutomationAction(action *models.AutomationAction) error {
	query := `
		INSERT INTO automation_actions (
			rule_id, action_type, action_data, order_num
		) VALUES (?, ?, ?, ?)
	`

	_, err := r.db.Exec(query,
		action.RuleID, action.ActionType, action.ActionData, action.Order,
	)

	if err != nil {
		return fmt.Errorf("failed to create automation action: %w", err)
	}

	return nil
}

// GetAutomationActionsByRule busca ações de automação por regra
func (r *SQLiteAutomationRepository) GetAutomationActionsByRule(ruleID int64) ([]*models.AutomationAction, error) {
	query := `SELECT * FROM automation_actions WHERE rule_id = ? ORDER BY order_num ASC`

	rows, err := r.db.Query(query, ruleID)
	if err != nil {
		return nil, fmt.Errorf("failed to get automation actions: %w", err)
	}
	defer rows.Close()

	actions := []*models.AutomationAction{}
	for rows.Next() {
		action := &models.AutomationAction{}
		err := rows.Scan(
			&action.ID, &action.RuleID, &action.ActionType, &action.ActionData, &action.Order, &action.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan automation action: %w", err)
		}
		actions = append(actions, action)
	}

	return actions, nil
}

// DeleteAutomationActionsByRule deleta todas as ações de uma regra
func (r *SQLiteAutomationRepository) DeleteAutomationActionsByRule(ruleID int64) error {
	query := `DELETE FROM automation_actions WHERE rule_id = ?`
	_, err := r.db.Exec(query, ruleID)
	if err != nil {
		return fmt.Errorf("failed to delete automation actions: %w", err)
	}
	return nil
}

// CreateAutomationExecution cria nova execução de automação
func (r *SQLiteAutomationRepository) CreateAutomationExecution(execution *models.AutomationExecution) error {
	query := `
		INSERT INTO automation_executions (
			rule_id, lead_id, status, error
		) VALUES (?, ?, ?, ?)
	`

	result, err := r.db.Exec(query,
		execution.RuleID, execution.LeadID, execution.Status, execution.Error,
	)

	if err != nil {
		return fmt.Errorf("failed to create automation execution: %w", err)
	}

	id, _ := result.LastInsertId()
	execution.ID = id
	return nil
}

// UpdateAutomationExecutionStatus atualiza status de execução de automação
func (r *SQLiteAutomationRepository) UpdateAutomationExecutionStatus(id int64, status string, error *string) error {
	query := `UPDATE automation_executions SET status = ?, error = ?, updated_at = ? WHERE id = ?`
	_, err := r.db.Exec(query, status, error, time.Now(), id)
	return err
}

// GetAutomationExecutionsByRule busca execuções de automação por regra
func (r *SQLiteAutomationRepository) GetAutomationExecutionsByRule(ruleID int64) ([]*models.AutomationExecution, error) {
	query := `SELECT * FROM automation_executions WHERE rule_id = ? ORDER BY created_at DESC`

	rows, err := r.db.Query(query, ruleID)
	if err != nil {
		return nil, fmt.Errorf("failed to get automation executions: %w", err)
	}
	defer rows.Close()

	executions := []*models.AutomationExecution{}
	for rows.Next() {
		execution := &models.AutomationExecution{}
		var error sql.NullString
		err := rows.Scan(
			&execution.ID, &execution.RuleID, &execution.LeadID, &execution.Status,
			&error, &execution.CreatedAt, &execution.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan automation execution: %w", err)
		}

		if error.Valid {
			execution.Error = &error.String
		}
		executions = append(executions, execution)
	}

	return executions, nil
}

// GetAutomationExecutionsByLead busca execuções de automação por lead
func (r *SQLiteAutomationRepository) GetAutomationExecutionsByLead(leadID int64) ([]*models.AutomationExecution, error) {
	query := `SELECT * FROM automation_executions WHERE lead_id = ? ORDER BY created_at DESC`

	rows, err := r.db.Query(query, leadID)
	if err != nil {
		return nil, fmt.Errorf("failed to get automation executions: %w", err)
	}
	defer rows.Close()

	executions := []*models.AutomationExecution{}
	for rows.Next() {
		execution := &models.AutomationExecution{}
		var error sql.NullString
		err := rows.Scan(
			&execution.ID, &execution.RuleID, &execution.LeadID, &execution.Status,
			&error, &execution.CreatedAt, &execution.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan automation execution: %w", err)
		}

		if error.Valid {
			execution.Error = &error.String
		}
		executions = append(executions, execution)
	}

	return executions, nil
}