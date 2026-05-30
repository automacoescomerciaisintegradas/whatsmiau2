package models

import (
	"time"

	"gorm.io/gorm"
)

// Plan represents a subscription plan
type Plan struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
	Name         string         `json:"name" gorm:"not null"`
	Price        float64        `json:"price" gorm:"not null"`
	DurationDays int            `json:"duration_days" gorm:"not null"`
	Features     string         `json:"features" gorm:"type:text"` // JSON string
	Active       bool           `json:"active" gorm:"default:true"`
	Description  string         `json:"description"`
}

// SubscriptionStatus defines the status of a subscription
type SubscriptionStatus string

const (
	SubscriptionStatusActive    SubscriptionStatus = "active"
	SubscriptionStatusPending   SubscriptionStatus = "pending"
	SubscriptionStatusCancelled SubscriptionStatus = "cancelled"
	SubscriptionStatusPastDue   SubscriptionStatus = "past_due"
)

// Subscription represents a user's subscription
type Subscription struct {
	ID                uint               `json:"id" gorm:"primaryKey"`
	CreatedAt         time.Time          `json:"created_at"`
	UpdatedAt         time.Time          `json:"updated_at"`
	DeletedAt         gorm.DeletedAt     `json:"-" gorm:"index"`
	UserID            uint               `json:"user_id" gorm:"not null"`
	User              User               `json:"user" gorm:"foreignKey:UserID"`
	PlanID            uint               `json:"plan_id" gorm:"not null"`
	Plan              Plan               `json:"plan" gorm:"foreignKey:PlanID"`
	Status            SubscriptionStatus `json:"status" gorm:"default:'pending'"`
	StartDate         time.Time          `json:"start_date"`
	NextBillingDate   time.Time          `json:"next_billing_date"`
	PaymentProviderID string             `json:"payment_provider_id"`
}

// PaymentStatus defines the status of a payment
type PaymentStatus string

const (
	PaymentStatusPending  PaymentStatus = "pending"
	PaymentStatusApproved PaymentStatus = "approved"
	PaymentStatusRejected PaymentStatus = "rejected"
)

// Payment represents a payment transaction
type Payment struct {
	ID             uint           `json:"id" gorm:"primaryKey"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
	SubscriptionID uint           `json:"subscription_id" gorm:"not null"`
	Subscription   Subscription   `json:"subscription" gorm:"foreignKey:SubscriptionID"`
	Amount         float64        `json:"amount" gorm:"not null"`
	Status         PaymentStatus  `json:"status" gorm:"default:'pending'"`
	TransactionID  string         `json:"transaction_id"`
}

// EnterpriseLead represents a lead for large scale plans
type EnterpriseLead struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index"`
	Name        string         `json:"name" gorm:"not null"`
	Email       string         `json:"email" gorm:"not null"`
	Phone       string         `json:"phone" gorm:"not null"`
	Company     string         `json:"company"`
	Connections string         `json:"connections"` // e.g. "10-20", "50+"
	Message     string         `json:"message" gorm:"type:text"`
	Status      string         `json:"status" gorm:"default:'new'"` // new, contacted, closed
}
