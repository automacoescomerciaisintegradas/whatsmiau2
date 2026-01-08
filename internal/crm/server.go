package crm

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"whatsmiau2/internal/crm/handlers"
	"whatsmiau2/internal/crm/models"
	"whatsmiau2/internal/crm/repository"
	"whatsmiau2/internal/crm/services"
	"whatsmiau2/internal/whatsapp"

	"github.com/gin-gonic/gin"
)

// Server representa o servidor CRM
type Server struct {
	db                *sql.DB
	leadHandler       *handlers.LeadHandler
	automationHandler *handlers.AutomationHandler
	automationService *services.AutomationService
}

// NewServer cria novo servidor CRM
func NewServer(db *sql.DB) *Server {
	// Criar tabelas
	if err := CreateTables(db); err != nil {
		log.Printf("Warning: Failed to create CRM tables: %v", err)
	}

	// Criar repositories
	crmRepo := repository.NewSQLiteCRMRepository(db)
	automationRepo := repository.NewSQLiteAutomationRepository(db)

	// Criar handlers
	leadHandler := handlers.NewLeadHandler(crmRepo)

	return &Server{
		db:          db,
		leadHandler: leadHandler,
	}
}

// NewServerWithManager cria novo servidor CRM com acesso ao gerenciador do WhatsApp
func NewServerWithManager(db *sql.DB, manager *whatsapp.Manager) *Server {
	// Criar tabelas
	if err := CreateTables(db); err != nil {
		log.Printf("Warning: Failed to create CRM tables: %v", err)
	}

	// Criar repositories
	crmRepo := repository.NewSQLiteCRMRepository(db)
	automationRepo := repository.NewSQLiteAutomationRepository(db)

	// Criar services
	automationService := services.NewAutomationService(automationRepo, manager)

	// Criar handlers
	leadHandler := handlers.NewLeadHandler(crmRepo)
	automationHandler := handlers.NewAutomationHandler(automationService)

	return &Server{
		db:                db,
		leadHandler:       leadHandler,
		automationHandler: automationHandler,
		automationService: automationService,
	}
}

// CreateAutomationRule cria nova regra de automação (Gin)
func (s *Server) CreateAutomationRule(c *gin.Context) {
	if s.automationService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Automation service not initialized"})
		return
	}

	var req models.CreateAutomationRuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid request body"})
		return
	}

	rule, err := s.automationService.CreateRule(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to create automation rule: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Automation rule created successfully",
		"rule":    rule,
	})
}

// ListAutomationRules lista regras de automação (Gin)
func (s *Server) ListAutomationRules(c *gin.Context) {
	if s.automationService == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Automation service not initialized"})
		return
	}

	enabledStr := c.Query("enabled")
	var enabled *bool
	if enabledStr != "" {
		enabledVal := enabledStr == "true"
		enabled = &enabledVal
	}

	// Obter repositório de automação
	automationRepo := repository.NewSQLiteAutomationRepository(s.db)

	// Listar regras
	rules, err := automationRepo.ListAutomationRules(enabled)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Failed to list automation rules: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(rules),
		"rules":   rules,
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
