package handlers

import (
	"errors"
	"net/http"

	"whatsmiau2/internal/database"
	"whatsmiau2/internal/models"
	"whatsmiau2/internal/services"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type SIPHandler struct {
	telnyxService *services.TelnyxService
	db            *database.Database
}

func NewSIPHandler(telnyxService *services.TelnyxService, db *database.Database) *SIPHandler {
	return &SIPHandler{
		telnyxService: telnyxService,
		db:            db,
	}
}

// SetupSIPConnection handles the request to provision a Telnyx SIP connection
func (h *SIPHandler) SetupSIPConnection(c *gin.Context) {
	instanceID := c.Param("instance")
	if instanceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Instance ID is required"})
		return
	}

	// Fetch instance from DB
	var instance models.Instance
	if err := h.db.DB.Where("id = ?", instanceID).First(&instance).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Instance not found"})
			return
		}
		zap.L().Error("Database error fetching instance", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Check if already provisioned
	if instance.SIPConnectionID != "" {
		c.JSON(http.StatusOK, gin.H{
			"message": "SIP Connection already exists",
			"sipConfig": gin.H{
				"host":     instance.SIPHost,
				"username": instance.SIPUser,
				"password": instance.SIPPassword,
			},
		})
		return
	}

	// Provision new credential in Telnyx
	cred, err := h.telnyxService.CreateSIPCredential(instance.ID, instance.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Save to DB
	instance.SIPConnectionID = cred.ConnectionID
	instance.SIPHost = cred.SIPHost
	instance.SIPUser = cred.SIPUser
	instance.SIPPassword = cred.SIPPassword

	if err := h.db.DB.Save(&instance).Error; err != nil {
		zap.L().Error("Failed to save SIP credentials to DB", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save to database"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "SIP Connection provisioned successfully",
		"sipConfig": gin.H{
			"host":     instance.SIPHost,
			"username": instance.SIPUser,
			"password": instance.SIPPassword,
		},
	})
}

// GetSIPConfig returns the existing SIP config for an instance
func (h *SIPHandler) GetSIPConfig(c *gin.Context) {
	instanceID := c.Param("instance")
	if instanceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Instance ID is required"})
		return
	}

	var instance models.Instance
	if err := h.db.DB.Where("id = ?", instanceID).First(&instance).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Instance not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if instance.SIPConnectionID == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "SIP not configured for this instance"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sipConfig": gin.H{
			"host":     instance.SIPHost,
			"username": instance.SIPUser,
			"password": instance.SIPPassword,
		},
	})
}
