package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"

	"whatsmiau2/internal/database"
	"whatsmiau2/internal/models"
	"whatsmiau2/internal/whatsapp"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// OAuthHandler implements Google OAuth 2.0 authentication
type OAuthHandler struct {
	manager *whatsapp.Manager
	db      *database.Database
}

// GoogleTokenResponse represents the response from Google's token endpoint
type GoogleTokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
	IDToken      string `json:"id_token"`
}

// GoogleUserInfo represents user info from Google
type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
}

func NewOAuthHandler(manager *whatsapp.Manager, db *database.Database) *OAuthHandler {
	return &OAuthHandler{manager: manager, db: db}
}

// GoogleLogin redirects to Google's OAuth consent screen
// GET /v1/auth/google
func (h *OAuthHandler) GoogleLogin(c *gin.Context) {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	redirectURI := os.Getenv("GOOGLE_REDIRECT_URI")

	if clientID == "" || redirectURI == "" {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Configuration Error",
			"message": "Google OAuth not configured",
		})
		return
	}

	// Build authorization URL
	authURL := fmt.Sprintf(
		"https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=%s&access_type=offline&prompt=consent",
		url.QueryEscape(clientID),
		url.QueryEscape(redirectURI),
		url.QueryEscape("openid email profile"),
	)

	c.Redirect(http.StatusTemporaryRedirect, authURL)
}

// GoogleCallback handles the OAuth callback from Google
// GET /v1/auth/google/callback
func (h *OAuthHandler) GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	errorParam := c.Query("error")

	if errorParam != "" {
		c.Redirect(http.StatusTemporaryRedirect, "/login.html?error=oauth_denied")
		return
	}

	if code == "" {
		c.Redirect(http.StatusTemporaryRedirect, "/login.html?error=no_code")
		return
	}

	// Exchange code for tokens
	tokenResp, err := h.exchangeCodeForToken(code)
	if err != nil {
		zap.L().Error("Failed to exchange code for token", zap.Error(err))
		c.Redirect(http.StatusTemporaryRedirect, "/login.html?error=token_exchange")
		return
	}

	// Get user info from Google
	userInfo, err := h.getUserInfo(tokenResp.AccessToken)
	if err != nil {
		zap.L().Error("Failed to get user info from Google", zap.Error(err))
		c.Redirect(http.StatusTemporaryRedirect, "/login.html?error=user_info")
		return
	}

	// Find or create user
	user, err := h.findOrCreateGoogleUser(userInfo)
	if err != nil {
		zap.L().Error("Failed to find or create user", zap.Error(err))
		c.Redirect(http.StatusTemporaryRedirect, "/login.html?error=user_creation")
		return
	}

	// Generate JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString([]byte(h.manager.GetConfig().JWTSecret))
	if err != nil {
		zap.L().Error("Failed to generate JWT token", zap.Error(err))
		c.Redirect(http.StatusTemporaryRedirect, "/login.html?error=jwt_generation")
		return
	}

	// Redirect to frontend with token (via fragment for security)
	redirectURL := fmt.Sprintf("/oauth-callback.html#token=%s&user=%s",
		url.QueryEscape(tokenString),
		url.QueryEscape(user.Name),
	)
	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

// exchangeCodeForToken exchanges the authorization code for tokens
func (h *OAuthHandler) exchangeCodeForToken(code string) (*GoogleTokenResponse, error) {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	redirectURI := os.Getenv("GOOGLE_REDIRECT_URI")

	data := url.Values{}
	data.Set("code", code)
	data.Set("client_id", clientID)
	data.Set("client_secret", clientSecret)
	data.Set("redirect_uri", redirectURI)
	data.Set("grant_type", "authorization_code")

	resp, err := http.PostForm("https://oauth2.googleapis.com/token", data)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("token exchange failed: %s", string(body))
	}

	var tokenResp GoogleTokenResponse
	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return nil, err
	}

	return &tokenResp, nil
}

// getUserInfo fetches user info from Google API
func (h *OAuthHandler) getUserInfo(accessToken string) (*GoogleUserInfo, error) {
	req, err := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get user info: %s", string(body))
	}

	var userInfo GoogleUserInfo
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return nil, err
	}

	return &userInfo, nil
}

// findOrCreateGoogleUser finds an existing user or creates a new one
func (h *OAuthHandler) findOrCreateGoogleUser(info *GoogleUserInfo) (*models.User, error) {
	var user models.User

	// First, try to find by Google ID
	result := h.db.DB.Where("google_id = ?", info.ID).First(&user)
	if result.Error == nil {
		// Update avatar if changed
		if user.AvatarURL != info.Picture {
			h.db.DB.Model(&user).Update("avatar_url", info.Picture)
			user.AvatarURL = info.Picture
		}
		return &user, nil
	}

	if result.Error != gorm.ErrRecordNotFound {
		return nil, result.Error
	}

	// Try to find by email
	result = h.db.DB.Where("email = ?", info.Email).First(&user)
	if result.Error == nil {
		// Link Google account to existing user
		h.db.DB.Model(&user).Updates(map[string]interface{}{
			"google_id":  info.ID,
			"avatar_url": info.Picture,
			"provider":   "google",
		})
		googleID := info.ID
		user.GoogleID = &googleID
		user.AvatarURL = info.Picture
		user.Provider = "google"
		return &user, nil
	}

	if result.Error != gorm.ErrRecordNotFound {
		return nil, result.Error
	}

	// Create new user
	googleID := info.ID
	user = models.User{
		Name:      info.Name,
		Email:     info.Email,
		GoogleID:  &googleID,
		AvatarURL: info.Picture,
		Provider:  "google",
		Password:  "", // No password for OAuth users
	}

	if err := h.db.DB.Create(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}
