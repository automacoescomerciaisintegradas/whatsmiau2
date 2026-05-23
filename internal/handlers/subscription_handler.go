package handlers

import (
	"fmt"
	"net/http"
	"strings"

	"whatsmiau2/internal/config"
	"whatsmiau2/internal/crm"
	"whatsmiau2/internal/database"
	"whatsmiau2/internal/models"
	"whatsmiau2/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SubscriptionHandler struct {
	cfg            *config.Config
	db             *database.Database
	subscriptionSv *crm.SubscriptionService
	mpSv           *services.MercadoPagoService
}

func NewSubscriptionHandler(cfg *config.Config, db *database.Database, subSv *crm.SubscriptionService, mpSv *services.MercadoPagoService) *SubscriptionHandler {
	return &SubscriptionHandler{
		cfg:            cfg,
		db:             db,
		subscriptionSv: subSv,
		mpSv:           mpSv,
	}
}

// ListPlans returns all active plans
func (h *SubscriptionHandler) ListPlans(c *gin.Context) {
	var plans []models.Plan
	if err := h.db.DB.Where("active = ?", true).Find(&plans).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch plans"})
		return
	}

	// Log the plans being returned for debugging
	for _, plan := range plans {
		fmt.Printf("Returning plan: ID=%d, Name=%s, Active=%t\n", plan.ID, plan.Name, plan.Active)
	}

	c.JSON(http.StatusOK, plans)
}

// GetMySubscription returns the current user's subscription
func (h *SubscriptionHandler) GetMySubscription(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	sub, err := h.subscriptionSv.GetUserSubscription(userID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"status": "none", "subscription": nil})
		return
	}

	c.JSON(http.StatusOK, sub)
}

// CreateCheckout creates a checkout link/preference
func (h *SubscriptionHandler) CreateCheckout(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	var req struct {
		PlanID uint `json:"plan_id"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Validate that the plan exists and is active before creating subscription
	var plan models.Plan
	fmt.Printf("Tentando encontrar plano com ID: %d\n", req.PlanID) // Debug log
	if err := h.db.DB.First(&plan, req.PlanID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			fmt.Printf("Plano com ID %d não encontrado no banco de dados\n", req.PlanID) // Debug log
			// Listar todos os planos ativos para depuração
			var allPlans []models.Plan
			h.db.DB.Where("active = ?", true).Find(&allPlans)
			fmt.Printf("Planos ativos no banco de dados: ")
			for _, p := range allPlans {
				fmt.Printf("ID: %d, Nome: %s; ", p.ID, p.Name)
			}
			fmt.Println()

			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Plano não encontrado: %d", req.PlanID)})
			return
		}
		fmt.Printf("Erro ao buscar plano: %v\n", err) // Debug log
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Erro ao verificar plano %d", req.PlanID)})
		return
	}

	fmt.Printf("Plano encontrado: ID %d, Nome: %s, Ativo: %t\n", plan.ID, plan.Name, plan.Active) // Debug log

	// Ensure the plan is active
	if !plan.Active {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Plano não está ativo"})
		return
	}

	// Create Pending Subscription
	provider := "mercadopago"
	if plan.Price <= 0 {
		provider = "free_trial"
	}

	sub, err := h.subscriptionSv.CreateSubscription(userID, req.PlanID, provider)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Free plans do not require checkout at Mercado Pago
	if plan.Price <= 0 {
		c.JSON(http.StatusOK, gin.H{
			"subscription_id": sub.ID,
			"status":          sub.Status,
			"checkout_url":    "#",
			"message":         "Plano grátis ativado com sucesso por 3 horas.",
		})
		return
	}

	// Fetch user details for email
	var user models.User
	if err := h.db.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar usuário"})
		return
	}

	// Create real Mercado Pago Checkout
	checkoutURL, err := h.mpSv.CreateSubscription(plan.Name, plan.Price, user.Email, fmt.Sprintf("SUB_%d", sub.ID))
	if err != nil {
		// Cleanup pending subscription if payment provider failed
		_ = h.db.DB.Delete(&models.Subscription{}, sub.ID).Error

		errMsg := err.Error()
		if strings.Contains(strings.ToLower(errMsg), "invalid access token") {
			c.JSON(http.StatusBadGateway, gin.H{
				"error":   "Mercado Pago não autenticou. Verifique a variável ML_ACCESS_TOKEN do backend Go.",
				"details": errMsg,
			})
			return
		}

		c.JSON(http.StatusBadGateway, gin.H{"error": "Falha ao gerar link Mercado Pago: " + errMsg})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"subscription_id": sub.ID,
		"status":          "pending",
		"checkout_url":    checkoutURL,
		"message":         "Link de pagamento gerado com sucesso.",
	})
}

// ChangePlan handles plan changes
func (h *SubscriptionHandler) ChangePlan(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := userIDVal.(uint)

	var req struct {
		PlanID uint `json:"plan_id"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	sub, err := h.subscriptionSv.ChangePlan(userID, req.PlanID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Plano alterado com sucesso",
		"subscription": sub,
	})
}

// CreateEnterpriseLead handles enterprise lead requests
func (h *SubscriptionHandler) CreateEnterpriseLead(c *gin.Context) {
	var lead models.EnterpriseLead
	if err := c.BindJSON(&lead); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if err := h.subscriptionSv.CreateEnterpriseLead(&lead); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save lead"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Enviado com sucesso! Entraremos em contato em breve.",
		"success": true,
	})
}
