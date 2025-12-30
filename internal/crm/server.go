package crm

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"whatsmiau2/internal/crm/handlers"
	"whatsmiau2/internal/crm/models"
	"whatsmiau2/internal/crm/repository"

	"github.com/gin-gonic/gin"
)

// Server representa o servidor CRM
type Server struct {
	db          *sql.DB
	leadHandler *handlers.LeadHandler
}

// NewServer cria novo servidor CRM
func NewServer(db *sql.DB) *Server {
	// Criar tabelas
	if err := CreateTables(db); err != nil {
		log.Printf("Warning: Failed to create CRM tables: %v", err)
	}

	// Criar repository
	repo := repository.NewSQLiteCRMRepository(db)

	// Criar handlers
	leadHandler := handlers.NewLeadHandler(repo)

	return &Server{
		db:          db,
		leadHandler: leadHandler,
	}
}

// Gin-compatible handlers

// CreateLead cria novo lead (Gin)
func (s *Server) CreateLead(c *gin.Context) {
	var req models.CreateLeadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid request body"})
		return
	}

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

	repo := repository.NewSQLiteCRMRepository(s.db)
	if err := repo.CreateLead(lead); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Lead created successfully",
		"lead":    lead,
	})
}

// ListLeads lista leads (Gin)
func (s *Server) ListLeads(c *gin.Context) {
	filters := &models.LeadFilters{
		Status:      c.Query("status"),
		Temperatura: c.Query("temperatura"),
		Fonte:       c.Query("fonte"),
		Search:      c.Query("search"),
		Limit:       100,
		Offset:      0,
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			filters.Limit = limit
		}
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil {
			filters.Offset = offset
		}
	}

	repo := repository.NewSQLiteCRMRepository(s.db)
	leads, err := repo.ListLeads(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(leads),
		"leads":   leads,
	})
}

// GetLead busca lead por ID (Gin)
func (s *Server) GetLead(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid lead ID"})
		return
	}

	repo := repository.NewSQLiteCRMRepository(s.db)
	lead, err := repo.GetLead(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Lead not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"lead":    lead,
	})
}

// UpdateLead atualiza lead (Gin)
func (s *Server) UpdateLead(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid lead ID"})
		return
	}

	var updates models.UpdateLeadRequest
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid request body"})
		return
	}

	repo := repository.NewSQLiteCRMRepository(s.db)
	if err := repo.UpdateLead(id, &updates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Lead updated successfully",
	})
}

// DeleteLead deleta lead (Gin)
func (s *Server) DeleteLead(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid lead ID"})
		return
	}

	repo := repository.NewSQLiteCRMRepository(s.db)
	if err := repo.DeleteLead(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Lead deleted successfully",
	})
}

// GetLeadStats retorna estatísticas (Gin)
func (s *Server) GetLeadStats(c *gin.Context) {
	repo := repository.NewSQLiteCRMRepository(s.db)
	stats, err := repo.GetLeadStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"stats":   stats,
	})
}

// RegisterRoutes registra todas as rotas do CRM
func (s *Server) RegisterRoutes(mux *http.ServeMux) {
	// Leads
	mux.HandleFunc("/api/crm/leads", s.handleLeads)
	mux.HandleFunc("/api/crm/leads/stats", func(w http.ResponseWriter, r *http.Request) {
		// Converter para Gin context (não usado mais)
	})

	log.Println("✅ CRM routes registered")
}

// handleLeads roteia requisições de leads baseado no método HTTP
func (s *Server) handleLeads(w http.ResponseWriter, r *http.Request) {
	// CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {
	case http.MethodGet:
		// Se tem ID, busca um lead específico
		if r.URL.Query().Get("id") != "" {
			s.leadHandler.GetLead(w, r)
		} else {
			// Senão, lista todos
			s.leadHandler.ListLeads(w, r)
		}
	case http.MethodPost:
		s.leadHandler.CreateLead(w, r)
	case http.MethodPut:
		s.leadHandler.UpdateLead(w, r)
	case http.MethodDelete:
		s.leadHandler.DeleteLead(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// RunMigrations executa as migrations do banco
func (s *Server) RunMigrations() error {
	log.Println("🔄 Running CRM migrations...")

	migrations := []string{
		`migrations/001_create_leads_table.sql`,
		`migrations/002_create_messages_table.sql`,
		`migrations/003_create_payments_table.sql`,
		`migrations/004_create_email_campaigns_table.sql`,
		`migrations/005_create_templates_table.sql`,
		`migrations/006_create_activities_table.sql`,
	}

	for _, migration := range migrations {
		log.Printf("  Running %s...", migration)
		// Aqui você pode ler e executar cada arquivo SQL
		// Por enquanto, vamos deixar como placeholder
	}

	log.Println("✅ CRM migrations completed")
	return nil
}
