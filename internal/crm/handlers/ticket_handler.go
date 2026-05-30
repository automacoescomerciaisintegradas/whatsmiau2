package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"whatsmiau2/internal/crm/models"
	"whatsmiau2/internal/crm/repository"

	"github.com/gin-gonic/gin"
)

// TicketHandler handles ticket-related requests
type TicketHandler struct {
	repo repository.CRMRepository
}

// NewTicketHandler creates a new TicketHandler
func NewTicketHandler(repo repository.CRMRepository) *TicketHandler {
	return &TicketHandler{repo: repo}
}

// CreateTicket handles POST /v1/crm/tickets
func (h *TicketHandler) CreateTicket(c *gin.Context) {
	var req models.CreateTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid request body"})
		return
	}

	ticket := &models.Ticket{
		CustomerName:  req.CustomerName,
		CustomerPhone: req.CustomerPhone,
		Subject:       req.Subject,
		Priority:      req.Priority,
		Status:        "NOVO",
	}

	if ticket.Priority == "" {
		ticket.Priority = "MÉDIA"
	}

	if err := h.repo.CreateTicket(ticket); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Ticket created successfully",
		"ticket":  ticket,
	})
}

// ListTickets handles GET /v1/crm/tickets
func (h *TicketHandler) ListTickets(c *gin.Context) {
	tickets, err := h.repo.ListTickets()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(tickets),
		"tickets": tickets,
	})
}

// UpdateTicketStatus handles PATCH /v1/crm/tickets/:id
func (h *TicketHandler) UpdateTicketStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid ticket ID"})
		return
	}

	var req models.UpdateTicketStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid request body"})
		return
	}

	if err := h.repo.UpdateTicketStatus(id, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Ticket status updated successfully",
	})
}

// DeleteTicket handles DELETE /v1/crm/tickets/:id
func (h *TicketHandler) DeleteTicket(c *gin.Context) {
	idStr := c.Param("id")

	// Check if it's multiple IDs (bulk delete)
	if strings.Contains(idStr, ",") {
		ids := strings.Split(idStr, ",")
		for _, idS := range ids {
			id, _ := strconv.ParseInt(idS, 10, 64)
			_ = h.repo.DeleteTicket(id)
		}
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "Tickets deleted successfully"})
		return
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid ticket ID"})
		return
	}

	if err := h.repo.DeleteTicket(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Ticket deleted successfully",
	})
}
