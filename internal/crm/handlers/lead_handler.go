package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"whatsmiau2/internal/crm/models"
	"whatsmiau2/internal/crm/repository"
)

// LeadHandler gerencia requisições de leads
type LeadHandler struct {
	repo repository.CRMRepository
}

// NewLeadHandler cria novo handler
func NewLeadHandler(repo repository.CRMRepository) *LeadHandler {
	return &LeadHandler{repo: repo}
}

// CreateLead cria novo lead
// POST /api/crm/leads
func (h *LeadHandler) CreateLead(w http.ResponseWriter, r *http.Request) {
	var req models.CreateLeadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validações básicas
	if req.Nome == "" || req.WhatsApp == "" {
		respondError(w, http.StatusBadRequest, "Nome and WhatsApp are required")
		return
	}

	// Criar lead
	lead := &models.Lead{
		Nome:        req.Nome,
		WhatsApp:    req.WhatsApp,
		Email:       req.Email,
		Empresa:     req.Empresa,
		Site:        req.Site,
		Instagram:   req.Instagram,
		LinkedIn:    req.LinkedIn,
		Localizacao: req.Localizacao,
		Valor:       req.Valor,
		Fonte:       req.Fonte,
		Status:      req.Status,
		Temperatura: req.Temperatura,
		Observacoes: req.Observacoes,
	}

	// Defaults
	if lead.Fonte == "" {
		lead.Fonte = "outro"
	}
	if lead.Status == "" {
		lead.Status = "novo"
	}
	if lead.Temperatura == "" {
		lead.Temperatura = "morno"
	}

	if err := h.repo.CreateLead(lead); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to create lead: "+err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"message": "Lead created successfully",
		"lead":    lead,
	})
}

// GetLead busca lead por ID
// GET /api/crm/leads/:id
func (h *LeadHandler) GetLead(w http.ResponseWriter, r *http.Request) {
	// Extrair ID da URL (assumindo que você está usando um router que suporta params)
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		respondError(w, http.StatusBadRequest, "Lead ID is required")
		return
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid lead ID")
		return
	}

	lead, err := h.repo.GetLead(id)
	if err != nil {
		respondError(w, http.StatusNotFound, "Lead not found")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"lead":    lead,
	})
}

// ListLeads lista leads com filtros
// GET /api/crm/leads
func (h *LeadHandler) ListLeads(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	filters := &models.LeadFilters{
		Status:      r.URL.Query().Get("status"),
		Temperatura: r.URL.Query().Get("temperatura"),
		Fonte:       r.URL.Query().Get("fonte"),
		Search:      r.URL.Query().Get("search"),
		Limit:       100, // default
		Offset:      0,
	}

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			filters.Limit = limit
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil {
			filters.Offset = offset
		}
	}

	leads, err := h.repo.ListLeads(filters)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to list leads: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"count":   len(leads),
		"leads":   leads,
	})
}

// UpdateLead atualiza lead
// PUT /api/crm/leads/:id
func (h *LeadHandler) UpdateLead(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		respondError(w, http.StatusBadRequest, "Lead ID is required")
		return
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid lead ID")
		return
	}

	var updates models.UpdateLeadRequest
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if err := h.repo.UpdateLead(id, &updates); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to update lead: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Lead updated successfully",
	})
}

// DeleteLead deleta lead
// DELETE /api/crm/leads/:id
func (h *LeadHandler) DeleteLead(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		respondError(w, http.StatusBadRequest, "Lead ID is required")
		return
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid lead ID")
		return
	}

	if err := h.repo.DeleteLead(id); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to delete lead: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Lead deleted successfully",
	})
}

// GetLeadStats retorna estatísticas de leads
// GET /api/crm/leads/stats
func (h *LeadHandler) GetLeadStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.repo.GetLeadStats()
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to get stats: "+err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"stats":   stats,
	})
}

// Helper functions
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]interface{}{
		"success": false,
		"error":   message,
	})
}
