 package models

import (
	"time"

	"gorm.io/gorm"
)

// SessionMetrics armazena métricas de sessão para monitoramento
type SessionMetrics struct {
	ID           uint       `gorm:"primaryKey" json:"id"`
	InstanceID   string     `gorm:"index;not null" json:"instance_id"`
	UserID       uint       `gorm:"index" json:"user_id"`
	SessionStart time.Time  `json:"session_start"`
	SessionEnd   *time.Time `json:"session_end,omitempty"`
	Status       string     `gorm:"size:50" json:"status"` // connected, disconnected, error

	// Métricas de mensagens
	MessagesSent     int64 `json:"messages_sent"`
	MessagesReceived int64 `json:"messages_received"`
	MediaSent        int64 `json:"media_sent"`
	MediaReceived    int64 `json:"media_received"`

	// Métricas de erros
	ErrorCount  int64      `json:"error_count"`
	LastError   string     `gorm:"size:500" json:"last_error,omitempty"`
	LastErrorAt *time.Time `json:"last_error_at,omitempty"`

	// Métricas de reconexão
	ReconnectCount  int64      `json:"reconnect_count"`
	LastReconnectAt *time.Time `json:"last_reconnect_at,omitempty"`

	// Metadados
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// InstanceStats armazena estatísticas agregadas por instância
type InstanceStats struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	InstanceID string `gorm:"uniqueIndex;not null" json:"instance_id"`
	UserID     uint   `gorm:"index" json:"user_id"`

	// Estatísticas de uptime
	TotalUptimeSeconds   int64   `json:"total_uptime_seconds"`
	TotalDowntimeSeconds int64   `json:"total_downtime_seconds"`
	UptimePercentage     float64 `json:"uptime_percentage"`

	// Estatísticas de mensagens (totais)
	TotalMessagesSent     int64 `json:"total_messages_sent"`
	TotalMessagesReceived int64 `json:"total_messages_received"`
	TotalMediaSent        int64 `json:"total_media_sent"`
	TotalMediaReceived    int64 `json:"total_media_received"`

	// Estatísticas de grupos
	TotalGroups      int64 `json:"total_groups"`
	TotalContacts    int64 `json:"total_contacts"`
	TotalNewsletters int64 `json:"total_newsletters"`

	// Estatísticas de performance
	AvgResponseTimeMs float64 `json:"avg_response_time_ms"`
	TotalErrorCount   int64   `json:"total_error_count"`
	TotalReconnects   int64   `json:"total_reconnects"`

	// Período de estatísticas
	StatsStartDate time.Time `json:"stats_start_date"`
	LastUpdatedAt  time.Time `json:"last_updated_at"`

	// Metadados
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// DailyStats armazena estatísticas diárias para análise histórica
type DailyStats struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	InstanceID string    `gorm:"index;not null" json:"instance_id"`
	UserID     uint      `gorm:"index" json:"user_id"`
	Date       time.Time `gorm:"index;not null;type:date" json:"date"`

	// Métricas do dia
	MessagesSent     int64 `json:"messages_sent"`
	MessagesReceived int64 `json:"messages_received"`
	MediaSent        int64 `json:"media_sent"`
	MediaReceived    int64 `json:"media_received"`

	// Tempo de uptime no dia (segundos)
	UptimeSeconds   int64 `json:"uptime_seconds"`
	DowntimeSeconds int64 `json:"downtime_seconds"`

	// Erros e reconexões
	ErrorCount     int64 `json:"error_count"`
	ReconnectCount int64 `json:"reconnect_count"`

	// Atividade
	ActiveHours      int   `json:"active_hours"` // Horas com atividade
	PeakHour         int   `json:"peak_hour"`    // Hora com mais mensagens
	PeakMessageCount int64 `json:"peak_message_count"`

	// Metadados
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// HourlyStats para análise granular por hora
type HourlyStats struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	InstanceID string    `gorm:"index;not null" json:"instance_id"`
	UserID     uint      `gorm:"index" json:"user_id"`
	DateTime   time.Time `gorm:"index;not null" json:"date_time"` // Truncado para a hora

	MessagesSent     int64 `json:"messages_sent"`
	MessagesReceived int64 `json:"messages_received"`
	ErrorCount       int64 `json:"error_count"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName define o nome da tabela para SessionMetrics
func (SessionMetrics) TableName() string {
	return "session_metrics"
}

// TableName define o nome da tabela para InstanceStats
func (InstanceStats) TableName() string {
	return "instance_stats"
}

// TableName define o nome da tabela para DailyStats
func (DailyStats) TableName() string {
	return "daily_stats"
}

// TableName define o nome da tabela para HourlyStats
func (HourlyStats) TableName() string {
	return "hourly_stats"
}
