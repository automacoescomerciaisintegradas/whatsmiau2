package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"whatsmiau2/internal/config"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware creates an authentication middleware that supports both API Key and Basic Auth
func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip auth if no authentication is configured
		if cfg.APIKey == "" && cfg.BasicAuthUsername == "" {
			c.Next()
			return
		}

		// Try API key first (header: apikey, Authorization: Bearer <token>, or query param: apikey)
		apiKey := c.GetHeader("apikey")
		if apiKey == "" {
			apiKey = c.Query("apikey")
		}
		if apiKey == "" {
			auth := c.GetHeader("Authorization")
			if strings.HasPrefix(auth, "Bearer ") {
				apiKey = strings.TrimPrefix(auth, "Bearer ")
			}
		}

		// Validate API key if provided
		if apiKey != "" && cfg.APIKey != "" {
			if apiKey == cfg.APIKey {
				c.Next()
				return
			}
		}

		// Try validating as JWT
		if apiKey != "" && cfg.JWTSecret != "" {
			token, err := jwt.Parse(apiKey, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(cfg.JWTSecret), nil
			})

			if err == nil && token.Valid {
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					// Set user info in context
					if userID, ok := claims["user_id"].(float64); ok {
						c.Set("userID", uint(userID))
					}
					if email, ok := claims["email"].(string); ok {
						c.Set("email", email)
					}
					c.Next()
					return
				}
			}
		}

		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"code":    "UNAUTHORIZED",
			"message": "Invalid or missing authentication.",
		})
	}
}

// CORSMiddleware adds CORS headers
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, apikey")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// LoggerMiddleware creates a custom logger middleware
func LoggerMiddleware() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("[%s] %s %s %d %s\n",
			param.TimeStamp.Format("2006-01-02 15:04:05"),
			param.Method,
			param.Path,
			param.StatusCode,
			param.Latency,
		)
	})
}
