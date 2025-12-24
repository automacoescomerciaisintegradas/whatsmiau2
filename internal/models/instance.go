package models

import (
	"time"

	"gorm.io/gorm"
)

// InstanceStatus represents the connection status of an instance
type InstanceStatus string

const (
	StatusDisconnected InstanceStatus = "disconnected"
	StatusConnecting   InstanceStatus = "connecting"
	StatusConnected    InstanceStatus = "connected"
	StatusQRCode       InstanceStatus = "qrcode"
)

// Instance represents a WhatsApp instance
type Instance struct {
	gorm.Model
	ID           string         `json:"id" gorm:"primaryKey;type:varchar(100)"`
	Name         string         `json:"name" gorm:"type:varchar(255);not null"`
	Status       InstanceStatus `json:"status" gorm:"type:varchar(50);default:'disconnected'"`
	PhoneNumber  string         `json:"phoneNumber" gorm:"type:varchar(20)"`
	ProfileName  string         `json:"profileName" gorm:"type:varchar(255)"`
	ProfilePic   string         `json:"profilePic" gorm:"type:text"`
	WebhookURL   string         `json:"webhookUrl" gorm:"type:text"`
	WebhookToken string         `json:"webhookToken" gorm:"type:varchar(255)"`
	LastSeen     *time.Time     `json:"lastSeen"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
}

// CreateInstanceRequest represents the request to create a new instance
type CreateInstanceRequest struct {
	InstanceName string `json:"instanceName" binding:"required"`
	Token        string `json:"token"`
	QRCode       bool   `json:"qrcode"`
	Webhook      string `json:"webhook"`
	WebhookToken string `json:"webhookToken"`
}

// UpdateInstanceRequest represents the request to update an instance
type UpdateInstanceRequest struct {
	Webhook      string `json:"webhook"`
	WebhookToken string `json:"webhookToken"`
}

// InstanceResponse represents the API response for an instance
type InstanceResponse struct {
	Instance InstanceData `json:"instance"`
	Hash     string       `json:"hash,omitempty"`
	QRCode   *QRCodeData  `json:"qrcode,omitempty"`
	Settings interface{}  `json:"settings,omitempty"`
}

// InstanceData holds basic instance information
type InstanceData struct {
	InstanceName string `json:"instanceName"`
	InstanceID   string `json:"instanceId"`
	Owner        string `json:"owner"`
	ProfileName  string `json:"profileName"`
	ProfilePic   string `json:"profilePicUrl"`
	Integration  string `json:"integration"`
	Status       string `json:"status"`
}

// QRCodeData represents QR code information
type QRCodeData struct {
	Code   string `json:"code"`
	Base64 string `json:"base64"`
	Count  int    `json:"count"`
}

// ConnectionState represents the connection state of an instance
type ConnectionState struct {
	Instance string `json:"instance"`
	State    string `json:"state"`
}
