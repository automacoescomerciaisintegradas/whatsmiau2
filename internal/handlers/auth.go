package handlers

import (
	"net/http"
	"time"

	"whatsmiau2/internal/database"
	"whatsmiau2/internal/models"
	"whatsmiau2/internal/whatsapp"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// AuthHandler implements authentication endpoints (login, register, etc.).
type AuthHandler struct {
	manager *whatsapp.Manager
	db      *database.Database
}

func NewAuthHandler(manager *whatsapp.Manager, db *database.Database) *AuthHandler {
	return &AuthHandler{manager: manager, db: db}
}

// Register creates a new user account
// POST /v1/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.UserRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	// Check if user already exists
	var existingUser models.User
	result := h.db.DB.Where("email = ?", req.Email).First(&existingUser)
	if result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error":   "Conflict",
			"message": "User with this email already exists",
		})
		return
	} else if result.Error != gorm.ErrRecordNotFound {
		zap.L().Error("Database error when checking for existing user", zap.Error(result.Error))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to check for existing user",
		})
		return
	}

	// Create new user
	user := &models.User{
		Name:  req.Name,
		Email: req.Email,
	}

	if err := user.HashPassword(req.Password); err != nil {
		zap.L().Error("Failed to hash password", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to create user",
		})
		return
	}

	if err := h.db.DB.Create(user).Error; err != nil {
		zap.L().Error("Failed to create user in database", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to create user",
		})
		return
	}

	// Generate JWT token for auto-login after registration
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
	})

	// Sign the token with the secret
	tokenString, err := token.SignedString([]byte(h.manager.GetConfig().JWTSecret))
	if err != nil {
		zap.L().Error("Failed to generate JWT token", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to generate authentication token",
		})
		return
	}

	// Return success response without password
	response := models.UserResponse{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
		"user":    response,
		"token":   tokenString,
	})
}

// Login authenticates a user and returns a token/session
// POST /v1/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.UserLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": err.Error(),
		})
		return
	}

	// Find user by email
	var user models.User
	result := h.db.DB.Where("email = ?", req.Email).First(&user)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"message": "Invalid email or password",
			})
			return
		}

		zap.L().Error("Database error when finding user", zap.Error(result.Error))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to authenticate user",
		})
		return
	}

	// Check password
	if !user.CheckPassword(req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "Invalid email or password",
		})
		return
	}

	// Generate JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
	})

	// Sign the token with the secret
	tokenString, err := token.SignedString([]byte(h.manager.GetConfig().JWTSecret))
	if err != nil {
		zap.L().Error("Failed to generate JWT token", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to generate authentication token",
		})
		return
	}

	response := models.UserResponse{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"user":    response,
		"token":   tokenString,
	})
}

// GetCurrentUser returns information about the currently authenticated user
// GET /v1/auth/me
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	// Extract user info from context (set by JWT middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	// Fetch user from database
	var user models.User
	result := h.db.DB.First(&user, userID)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "User not found",
			})
			return
		}

		zap.L().Error("Database error when fetching user", zap.Error(result.Error))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch user information",
		})
		return
	}

	// Return user information
	response := models.UserResponse{
		ID:                 user.ID,
		Name:               user.Name,
		Email:              user.Email,
		AvatarURL:          user.AvatarURL,
		Provider:           user.Provider,
		IsSubscriber:       user.IsSubscriber,
		SubscriptionStatus: user.SubscriptionStatus,
	}

	c.JSON(http.StatusOK, gin.H{
		"user": response,
	})
}

// DeleteAccount deletes the currently authenticated user's account
// DELETE /v1/auth/me
func (h *AuthHandler) DeleteAccount(c *gin.Context) {
	// Extract user info from context (set by JWT middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	// Delete user from database
	result := h.db.DB.Delete(&models.User{}, userID)
	if result.Error != nil {
		zap.L().Error("Failed to delete user", zap.Error(result.Error))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Internal Server Error",
			"message": "Failed to delete account",
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Account deleted successfully",
	})
}
