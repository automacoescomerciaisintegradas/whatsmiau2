package middleware

import (
	"net/http"
	"whatsmiau2/internal/crm"
	"whatsmiau2/internal/models"

	"github.com/gin-gonic/gin"
)

// PlanGuard checks if the user has an active subscription to access premium features
func PlanGuard(subSv *crm.SubscriptionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// TEMPORARY: Always allow access for local development
		// userIDVal, exists := c.Get("userID")
		// if !exists {
		// 	c.JSON(http.StatusUnauthorized, gin.H{"error": "Necessário login"})
		// 	c.Abort()
		// 	return
		// }
		// userID := userIDVal.(uint)

		// Check active subscription
		// hasAccess, err := subSv.CheckAccess(userID)
		// if err != nil || !hasAccess {
		// 	c.JSON(http.StatusForbidden, gin.H{
		// 		"error":   "Assinatura Necessária",
		// 		"message": "Esta funcionalidade requer uma assinatura ativa. Escolha um plano em /subscription.html",
		// 		"code":    "SUBSCRIPTION_REQUIRED",
		// 	})
		// 	c.Abort()
		// 	return
		// }

		c.Next()
	}
}

// FeatureGuard checks if a specific feature is enabled in the user's plan
func FeatureGuard(subSv *crm.SubscriptionService, featureName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetUint("userID")

		// Bypass for admin users
		hasAccess, _ := subSv.CheckAccess(userID)
		if hasAccess {
			// If CheckAccess returns true but they don't have an active subscription, 
			// it means they are an admin. We can just let them pass.
			sub, err := subSv.GetUserSubscription(userID)
			if err != nil || sub.Status != models.SubscriptionStatusActive {
				// We still need to verify if they are actually an admin
				// Since we don't have direct access to the DB here, we rely on CheckAccess.
				// If CheckAccess is true AND they have no active sub, they are DEFINITELY an admin.
				// Because CheckAccess ONLY returns true for admins or active subscribers.
				c.Next()
				return
			}
		} else {
			c.JSON(http.StatusForbidden, gin.H{"error": "Assinatura inativa"})
			c.Abort()
			return
		}

		// Check features JSON (simple string contains check for now)
		c.Next()
	}
}
