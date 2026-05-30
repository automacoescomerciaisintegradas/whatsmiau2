package handlers

import (
	"net/http"
	"strconv"

	"whatsmiau2/internal/services"
	"whatsmiau2/internal/whatsapp"

	"github.com/gin-gonic/gin"
)

// DashboardHandler gerencia endpoints do dashboard de monitoramento
type DashboardHandler struct {
	monitoring *services.MonitoringService
	manager    *whatsapp.Manager
}

// NewDashboardHandler cria uma nova instância do DashboardHandler
func NewDashboardHandler(monitoring *services.MonitoringService, manager *whatsapp.Manager) *DashboardHandler {
	return &DashboardHandler{
		monitoring: monitoring,
		manager:    manager,
	}
}

// GetSummary retorna um resumo geral do dashboard
// GET /v1/dashboard/summary
func (h *DashboardHandler) GetSummary(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "error": "User not authenticated"})
		return
	}

	summary, err := h.monitoring.GetDashboardSummary(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    summary,
	})
}

// GetActiveSessions retorna todas as sessões ativas
// GET /v1/dashboard/sessions/active
func (h *DashboardHandler) GetActiveSessions(c *gin.Context) {
	sessions := h.monitoring.GetAllActiveSessions()

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(sessions),
		"data":    sessions,
	})
}

// GetInstanceStats retorna estatísticas de uma instância específica
// GET /v1/dashboard/instances/:instance/stats
func (h *DashboardHandler) GetInstanceStats(c *gin.Context) {
	instanceID := c.Param("instance")

	stats, err := h.monitoring.GetInstanceStats(instanceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	if stats == nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Stats not found for instance"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
	})
}

// GetDailyStats retorna estatísticas diárias de uma instância
// GET /v1/dashboard/instances/:instance/daily?days=7
func (h *DashboardHandler) GetDailyStats(c *gin.Context) {
	instanceID := c.Param("instance")
	daysStr := c.DefaultQuery("days", "7")

	days, err := strconv.Atoi(daysStr)
	if err != nil || days < 1 || days > 90 {
		days = 7
	}

	stats, err := h.monitoring.GetDailyStats(instanceID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(stats),
		"data":    stats,
	})
}

// GetHourlyStats retorna estatísticas por hora de uma instância
// GET /v1/dashboard/instances/:instance/hourly?hours=24
func (h *DashboardHandler) GetHourlyStats(c *gin.Context) {
	instanceID := c.Param("instance")
	hoursStr := c.DefaultQuery("hours", "24")

	hours, err := strconv.Atoi(hoursStr)
	if err != nil || hours < 1 || hours > 168 {
		hours = 24
	}

	stats, err := h.monitoring.GetHourlyStats(instanceID, hours)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(stats),
		"data":    stats,
	})
}

// GetRealtimeStatus retorna o status em tempo real de todas as instâncias
// GET /v1/dashboard/realtime
func (h *DashboardHandler) GetRealtimeStatus(c *gin.Context) {
	clients := h.manager.GetAllClients()

	instances := make([]map[string]interface{}, 0, len(clients))

	for id, client := range clients {
		session := h.monitoring.GetActiveSession(id)

		instanceData := map[string]interface{}{
			"instance_id": id,
			"connected":   client.IsConnected(),
			"jid":         "",
		}

		if client.IsConnected() {
			jid := client.GetJID()
			instanceData["jid"] = jid.User
			instanceData["platform"] = client.Store.Platform
		}

		if session != nil {
			instanceData["session_start"] = session.SessionStart
			instanceData["messages_sent"] = session.MessagesSent
			instanceData["messages_received"] = session.MessagesReceived
			instanceData["error_count"] = session.ErrorCount
		}

		instances = append(instances, instanceData)
	}

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"active_count":  h.monitoring.GetActiveSessionCount(),
		"total_clients": len(clients),
		"instances":     instances,
	})
}

// GetSystemHealth retorna informações de saúde do sistema
// GET /v1/dashboard/health
func (h *DashboardHandler) GetSystemHealth(c *gin.Context) {
	clients := h.manager.GetAllClients()

	connectedCount := 0
	for _, client := range clients {
		if client.IsConnected() {
			connectedCount++
		}
	}

	health := map[string]interface{}{
		"status":              "healthy",
		"total_instances":     len(clients),
		"connected_instances": connectedCount,
		"active_sessions":     h.monitoring.GetActiveSessionCount(),
	}

	// Determinar status baseado nas conexões
	if len(clients) > 0 && connectedCount == 0 {
		health["status"] = "degraded"
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    health,
	})
}

// GetMessagesChart retorna dados para gráficos de mensagens
// GET /v1/dashboard/charts/messages?instance=xxx&period=7d
func (h *DashboardHandler) GetMessagesChart(c *gin.Context) {
	instanceID := c.Query("instance")
	period := c.DefaultQuery("period", "7d")

	days := 7
	switch period {
	case "24h":
		days = 1
	case "7d":
		days = 7
	case "30d":
		days = 30
	}

	if instanceID == "" {
		// Retornar dados agregados de todas as instâncias do usuário
		userID, _ := c.Get("userId")
		stats, err := h.monitoring.GetUserStats(userID.(uint))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
			return
		}

		var totalSent, totalReceived int64
		for _, s := range stats {
			totalSent += s.TotalMessagesSent
			totalReceived += s.TotalMessagesReceived
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"period":         period,
				"total_sent":     totalSent,
				"total_received": totalReceived,
				"instance_count": len(stats),
			},
		})
		return
	}

	// Buscar dados diários para o gráfico
	dailyStats, err := h.monitoring.GetDailyStats(instanceID, days)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": err.Error()})
		return
	}

	chartData := make([]map[string]interface{}, len(dailyStats))
	for i, stat := range dailyStats {
		chartData[i] = map[string]interface{}{
			"date":     stat.Date.Format("2006-01-02"),
			"sent":     stat.MessagesSent,
			"received": stat.MessagesReceived,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    chartData,
	})
}
