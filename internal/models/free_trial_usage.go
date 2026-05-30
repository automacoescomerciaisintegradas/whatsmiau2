package models

import (
	"time"

	"gorm.io/gorm"
)

// FreeTrialUsage registra ativação de trial para antifraude por IP.
type FreeTrialUsage struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	UserID    uint           `json:"user_id" gorm:"index;not null"`
	PlanID    uint           `json:"plan_id" gorm:"index;not null"`
	ClientIP  string         `json:"client_ip" gorm:"size:64;index;not null"`
}
