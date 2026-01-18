package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"whatsmiau2/internal/crm/models"
	"whatsmiau2/internal/crm/services"
)

// AutomationHandler gerencia requisições de automação
type AutomationHandler struct {
	service *services.AutomationService
}

// NewAutomationHandler cria novo handler de automação
func NewAutomationHandler(service *services.AutomationService) *AutomationHandler {
	return &AutomationHandler{service: service}
}

// CreateAutomationRule cria nova regra de automação
// POST /api/crm/automation/rules
func (h *AutomationHandler) CreateAutomationRule(w http.ResponseWriter, r *http.Request) {
	var req models.CreateAutomationRuleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	rule, err := h.service.CreateRule(&req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create automation rule: "+err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"message": "Automation rule created successfully",
		"rule":    rule,
	})
}

// GetAutomationRule busca regra de automação por ID
// GET /api/crm/automation/rules/:id
func (h *AutomationHandler) GetAutomationRule(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		respondError(w, http.StatusBadRequest, "Rule ID is required")
		return
	}

	_, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid rule ID")
		return
	}

	// Obter a regra (implementação futura)
	respondError(w, http.StatusNotImplemented, "Get automation rule not implemented yet")
}

// ListAutomationRules lista regras de automação
// GET /api/crm/automation/rules
func (h *AutomationHandler) ListAutomationRules(w http.ResponseWriter, r *http.Request) {
	// enabledStr := r.URL.Query().Get("enabled")
	/*
		var enabled *bool
		if enabledStr != "" {
			enabledVal := enabledStr == "true"
			enabled = &enabledVal
		}
	*/

	// Listar regras (implementação futura)
	respondError(w, http.StatusNotImplemented, "List automation rules not implemented yet")
}

// UpdateAutomationRule atualiza regra de automação
// PUT /api/crm/automation/rules/:id
func (h *AutomationHandler) UpdateAutomationRule(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		respondError(w, http.StatusBadRequest, "Rule ID is required")
		return
	}

	_, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid rule ID")
		return
	}

	var req models.UpdateAutomationRuleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Atualizar regra (implementação futura)
	respondError(w, http.StatusNotImplemented, "Update automation rule not implemented yet")
}

// DeleteAutomationRule deleta regra de automação
// DELETE /api/crm/automation/rules/:id
func (h *AutomationHandler) DeleteAutomationRule(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		respondError(w, http.StatusBadRequest, "Rule ID is required")
		return
	}

	_, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid rule ID")
		return
	}

	// Deletar regra (implementação futura)
	respondError(w, http.StatusNotImplemented, "Delete automation rule not implemented yet")
}

// TriggerAutomation manualmente aciona uma regra de automação
// POST /api/crm/automation/trigger
func (h *AutomationHandler) TriggerAutomation(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RuleID int64 `json:"rule_id"`
		LeadID int64 `json:"lead_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Acionar regra (implementação futura)
	respondError(w, http.StatusNotImplemented, "Manual trigger not implemented yet")
}

// Helper functions
