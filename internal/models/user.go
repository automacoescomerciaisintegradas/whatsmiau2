package models

import (
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	gorm.Model
	ID                 uint    `json:"id" gorm:"primaryKey"`
	Name               string  `json:"name" gorm:"not null"`
	Email              string  `json:"email" gorm:"uniqueIndex;not null"`
	Password           string  `json:"-" gorm:"not null"` // "-" hides from JSON
	GoogleID           *string `json:"google_id" gorm:"unique"`
	AvatarURL          string  `json:"avatar_url"`
	Provider           string  `json:"provider" gorm:"default:'local'"` // "local" or "google"
	IsSubscriber       bool    `json:"is_subscriber" gorm:"default:false"`
	SubscriptionStatus string  `json:"subscription_status"`
}

// HashPassword hashes the user's password
func (u *User) HashPassword(password string) error {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(bytes)
	return nil
}

// CheckPassword checks if the provided password is correct
func (u *User) CheckPassword(password string) bool {
	// OAuth users have no password
	if u.Password == "" {
		return false
	}
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

// IsAdmin checks if the user is an administrator
func (u *User) IsAdmin() bool {
	admins := []string{
		"automacoescomerciais@gmail.com",
		"fcaqdequeiroz@gmail.com",
		"contato@automacoescomerciais.com.br",
	}
	for _, admin := range admins {
		if u.Email == admin {
			return true
		}
	}
	return false
}

// UserLoginRequest represents the request to login a user
type UserLoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// UserRegisterRequest represents the request to register a new user
type UserRegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// UserResponse represents the API response for a user
type UserResponse struct {
	ID                 uint   `json:"id"`
	Name               string `json:"name"`
	Email              string `json:"email"`
	AvatarURL          string `json:"avatar_url,omitempty"`
	Provider           string `json:"provider,omitempty"`
	IsSubscriber       bool   `json:"is_subscriber"`
	SubscriptionStatus string `json:"subscription_status,omitempty"`
}
