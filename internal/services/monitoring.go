package services

import (
	"sync"
	"time"

	"whatsmiau2/internal/models"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

// MonitoringService gerencia o monitoramento de sessões e métricas
type MonitoringService struct {
	db             *gorm.DB
	mu             sync.RWMutex
	activeSessions map[string]*models.SessionMetrics
}

// NewMonitoringService cria uma nova instância do serviço de monitoramento
func NewMonitoringService(db *gorm.DB) *MonitoringService {
	return &MonitoringService{
		db:             db,
		activeSessions: make(map[string]*models.SessionMetrics),
	}
}

// StartSession inicia o rastreamento de uma nova sessão
func (s *MonitoringService) StartSession(instanceID string, userID uint) (*models.SessionMetrics, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Verifica se já existe uma sessão ativa
	if existing, ok := s.activeSessions[instanceID]; ok {
		return existing, nil
	}

	session := &models.SessionMetrics{
		InstanceID:   instanceID,
		UserID:       userID,
		SessionStart: time.Now(),
		Status:       "connected",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.db.Create(session).Error; err != nil {
		return nil, err
	}

	s.activeSessions[instanceID] = session

	zap.L().Info("Session started",
		zap.String("instanceId", instanceID),
		zap.Uint("userId", userID),
	)

	return session, nil
}

// EndSession termina uma sessão ativa
func (s *MonitoringService) EndSession(instanceID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	session, ok := s.activeSessions[instanceID]
	if !ok {
		return nil
	}

	now := time.Now()
	session.SessionEnd = &now
	session.Status = "disconnected"
	session.UpdatedAt = now

	if err := s.db.Save(session).Error; err != nil {
		return err
	}

	// Atualizar estatísticas agregadas
	go s.updateInstanceStats(instanceID, session)

	delete(s.activeSessions, instanceID)

	zap.L().Info("Session ended",
		zap.String("instanceId", instanceID),
		zap.Duration("duration", now.Sub(session.SessionStart)),
	)

	return nil
}

// RecordMessage registra uma mensagem enviada ou recebida
func (s *MonitoringService) RecordMessage(instanceID string, sent bool, isMedia bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	session, ok := s.activeSessions[instanceID]
	if !ok {
		return
	}

	if sent {
		session.MessagesSent++
		if isMedia {
			session.MediaSent++
		}
	} else {
		session.MessagesReceived++
		if isMedia {
			session.MediaReceived++
		}
	}
	session.UpdatedAt = time.Now()
}

// RecordError registra um erro na sessão
func (s *MonitoringService) RecordError(instanceID string, errorMsg string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	session, ok := s.activeSessions[instanceID]
	if !ok {
		return
	}

	now := time.Now()
	session.ErrorCount++
	session.LastError = errorMsg
	session.LastErrorAt = &now
	session.UpdatedAt = now
}

// RecordReconnect registra uma reconexão
func (s *MonitoringService) RecordReconnect(instanceID string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	session, ok := s.activeSessions[instanceID]
	if !ok {
		return
	}

	now := time.Now()
	session.ReconnectCount++
	session.LastReconnectAt = &now
	session.UpdatedAt = now
}

// GetActiveSession retorna a sessão ativa de uma instância
func (s *MonitoringService) GetActiveSession(instanceID string) *models.SessionMetrics {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.activeSessions[instanceID]
}

// GetAllActiveSessions retorna todas as sessões ativas
func (s *MonitoringService) GetAllActiveSessions() []*models.SessionMetrics {
	s.mu.RLock()
	defer s.mu.RUnlock()

	sessions := make([]*models.SessionMetrics, 0, len(s.activeSessions))
	for _, session := range s.activeSessions {
		sessions = append(sessions, session)
	}
	return sessions
}

// GetActiveSessionCount retorna o número de sessões ativas
func (s *MonitoringService) GetActiveSessionCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.activeSessions)
}

// GetInstanceStats retorna as estatísticas de uma instância
func (s *MonitoringService) GetInstanceStats(instanceID string) (*models.InstanceStats, error) {
	var stats models.InstanceStats
	if err := s.db.Where("instance_id = ?", instanceID).First(&stats).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &stats, nil
}

// GetUserStats retorna as estatísticas agregadas de um usuário
func (s *MonitoringService) GetUserStats(userID uint) ([]models.InstanceStats, error) {
	var stats []models.InstanceStats
	if err := s.db.Where("user_id = ?", userID).Find(&stats).Error; err != nil {
		return nil, err
	}
	return stats, nil
}

// GetDailyStats retorna estatísticas diárias de uma instância
func (s *MonitoringService) GetDailyStats(instanceID string, days int) ([]models.DailyStats, error) {
	var stats []models.DailyStats
	startDate := time.Now().AddDate(0, 0, -days)

	if err := s.db.Where("instance_id = ? AND date >= ?", instanceID, startDate).
		Order("date DESC").
		Find(&stats).Error; err != nil {
		return nil, err
	}
	return stats, nil
}

// GetHourlyStats retorna estatísticas por hora de uma instância
func (s *MonitoringService) GetHourlyStats(instanceID string, hours int) ([]models.HourlyStats, error) {
	var stats []models.HourlyStats
	startTime := time.Now().Add(-time.Duration(hours) * time.Hour)

	if err := s.db.Where("instance_id = ? AND date_time >= ?", instanceID, startTime).
		Order("date_time DESC").
		Find(&stats).Error; err != nil {
		return nil, err
	}
	return stats, nil
}

// GetDashboardSummary retorna um resumo para o dashboard
func (s *MonitoringService) GetDashboardSummary(userID uint) (*DashboardSummary, error) {
	s.mu.RLock()
	activeCount := 0
	var totalMessagesSent, totalMessagesReceived int64
	for _, session := range s.activeSessions {
		if session.UserID == userID {
			activeCount++
			totalMessagesSent += session.MessagesSent
			totalMessagesReceived += session.MessagesReceived
		}
	}
	s.mu.RUnlock()

	// Buscar estatísticas agregadas do banco
	var stats []models.InstanceStats
	s.db.Where("user_id = ?", userID).Find(&stats)

	var totalUptime, totalDowntime int64
	var totalErrors, totalReconnects int64
	for _, stat := range stats {
		totalUptime += stat.TotalUptimeSeconds
		totalDowntime += stat.TotalDowntimeSeconds
		totalErrors += stat.TotalErrorCount
		totalReconnects += stat.TotalReconnects
		totalMessagesSent += stat.TotalMessagesSent
		totalMessagesReceived += stat.TotalMessagesReceived
	}

	uptimePercentage := float64(0)
	if totalUptime+totalDowntime > 0 {
		uptimePercentage = float64(totalUptime) / float64(totalUptime+totalDowntime) * 100
	}

	return &DashboardSummary{
		ActiveSessions:        activeCount,
		TotalInstances:        len(stats),
		TotalMessagesSent:     totalMessagesSent,
		TotalMessagesReceived: totalMessagesReceived,
		UptimePercentage:      uptimePercentage,
		TotalErrors:           totalErrors,
		TotalReconnects:       totalReconnects,
	}, nil
}

// DashboardSummary representa o resumo do dashboard
type DashboardSummary struct {
	ActiveSessions        int     `json:"active_sessions"`
	TotalInstances        int     `json:"total_instances"`
	TotalMessagesSent     int64   `json:"total_messages_sent"`
	TotalMessagesReceived int64   `json:"total_messages_received"`
	UptimePercentage      float64 `json:"uptime_percentage"`
	TotalErrors           int64   `json:"total_errors"`
	TotalReconnects       int64   `json:"total_reconnects"`
}

// updateInstanceStats atualiza as estatísticas agregadas de uma instância
func (s *MonitoringService) updateInstanceStats(instanceID string, session *models.SessionMetrics) {
	var stats models.InstanceStats
	result := s.db.Where("instance_id = ?", instanceID).First(&stats)

	if result.Error == gorm.ErrRecordNotFound {
		// Criar novo registro de estatísticas
		stats = models.InstanceStats{
			InstanceID:     instanceID,
			UserID:         session.UserID,
			StatsStartDate: session.SessionStart,
		}
	}

	// Calcular duração da sessão
	sessionDuration := time.Duration(0)
	if session.SessionEnd != nil {
		sessionDuration = session.SessionEnd.Sub(session.SessionStart)
	}

	// Atualizar estatísticas
	stats.TotalUptimeSeconds += int64(sessionDuration.Seconds())
	stats.TotalMessagesSent += session.MessagesSent
	stats.TotalMessagesReceived += session.MessagesReceived
	stats.TotalMediaSent += session.MediaSent
	stats.TotalMediaReceived += session.MediaReceived
	stats.TotalErrorCount += session.ErrorCount
	stats.TotalReconnects += session.ReconnectCount
	stats.LastUpdatedAt = time.Now()

	// Recalcular porcentagem de uptime
	if stats.TotalUptimeSeconds+stats.TotalDowntimeSeconds > 0 {
		stats.UptimePercentage = float64(stats.TotalUptimeSeconds) /
			float64(stats.TotalUptimeSeconds+stats.TotalDowntimeSeconds) * 100
	}

	s.db.Save(&stats)
}

// FlushMetrics salva todas as métricas pendentes no banco
func (s *MonitoringService) FlushMetrics() {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, session := range s.activeSessions {
		s.db.Save(session)
	}
}

// StartPeriodicFlush inicia o flush periódico de métricas
func (s *MonitoringService) StartPeriodicFlush(interval time.Duration) {
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for range ticker.C {
			s.FlushMetrics()
		}
	}()
}
