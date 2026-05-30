package config

import (
	"os"
	"strconv"
	"strings"
	"whatsmiau2/internal/security/accesspolicy"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

// Config holds all configuration for the application
type Config struct {
	// Server
	Port           string
	DebugMode      bool
	DebugWhatsmeow bool

	// Redis
	RedisURL      string
	RedisPassword string
	RedisTLS      bool

	// Database
	DialectDB string
	DBURL     string

	// Authentication
	APIKey            string
	BasicAuthUsername string
	BasicAuthPassword string
	JWTSecret         string

	// Google Cloud Storage
	GCSEnabled bool
	GCSBucket  string
	GCSURL     string

	// Google Cloud Logging
	GCLAppName   string
	GCLEnabled   bool
	GCLProjectID string

	// Performance
	EmitterBufferSize    int
	HandlerSemaphoreSize int

	// Proxy
	ProxyAddresses []string
	ProxyStrategy  string
	ProxyNoMedia   bool

	// Session Phone Config
	SessionPhoneVersion string
	SessionPhoneClient  string
	SessionPhoneName    string

	// Mercado Pago
	MercadoPagoAppID       string
	MercadoPagoSecret      string
	MercadoPagoAccessToken string

	// Evolution API
	EvolutionAPIURL   string
	EvolutionAPIKey   string
	EvolutionInstance string

	// Free trial abuse guard
	TrustedAccessIPs      []string
	FreeTrialIPBlockHours int
}

// Load reads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		zap.L().Warn("No .env file found, using environment variables")
	}

	cfg := &Config{
		// Server - Use GO_PORT first, then PORT, then default 8085
		Port:           getEnvWithFallback("GO_PORT", "PORT", "8085"),
		DebugMode:      getEnvBool("DEBUG_MODE", false),
		DebugWhatsmeow: getEnvBool("DEBUG_WHATSMEOW", false),

		// Redis
		RedisURL:      getEnv("REDIS_URL", "localhost:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisTLS:      getEnvBool("REDIS_TLS", false),

		// Database
		DialectDB: getEnv("DIALECT_DB", "sqlite3"),
		DBURL:     getEnv("DB_URL", "file:data.db?_foreign_keys=on"),

		// Authentication
		APIKey:            getEnv("API_KEY", ""),
		BasicAuthUsername: getEnv("BASIC_AUTH_USERNAME", ""),
		BasicAuthPassword: getEnv("BASIC_AUTH_PASSWORD", ""),
		JWTSecret:         getEnv("JWT_SECRET", "default_secret_key_for_development_please_change_in_production"),

		// Google Cloud Storage
		GCSEnabled: getEnvBool("GCS_ENABLED", false),
		GCSBucket:  getEnv("GCS_BUCKET", "whatsmiau2"),
		GCSURL:     getEnv("GCS_URL", "https://storage.googleapis.com"),

		// Google Cloud Logging
		GCLAppName:   getEnv("GCL_APP_NAME", "whatsmiau2"),
		GCLEnabled:   getEnvBool("GCL_ENABLED", false),
		GCLProjectID: getEnv("GCL_PROJECT_ID", ""),

		// Performance
		EmitterBufferSize:    getEnvInt("EMITTER_BUFFER_SIZE", 2048),
		HandlerSemaphoreSize: getEnvInt("HANDLER_SEMAPHORE_SIZE", 512),

		// Proxy
		ProxyAddresses: getEnvSlice("PROXY_ADDRESSES", []string{}),
		ProxyStrategy:  getEnv("PROXY_STRATEGY", "RANDOM"),
		ProxyNoMedia:   getEnvBool("PROXY_NO_MEDIA", false),

		// Session Phone Config
		SessionPhoneVersion: getEnv("CONFIG_SESSION_PHONE_VERSION", "2.3000.2.2413.51"),
		SessionPhoneClient:  getEnv("CONFIG_SESSION_PHONE_CLIENT", "Chrome"),
		SessionPhoneName:    getEnv("CONFIG_SESSION_PHONE_NAME", "Chrome (Windows)"),

		// Mercado Pago
		MercadoPagoAppID:       getEnv("ML_APP_ID", ""),
		MercadoPagoSecret:      getEnv("ML_CLIENT_SECRET", ""),
		MercadoPagoAccessToken: getEnv("ML_ACCESS_TOKEN", ""),

		// Evolution API
		EvolutionAPIURL:   getEnv("EVOLUTION_API_URL", ""),
		EvolutionAPIKey:   getEnv("EVOLUTION_API_KEY", ""),
		EvolutionInstance: getEnv("EVOLUTION_INSTANCE", "pagamentos"),

		// Free trial abuse guard
		TrustedAccessIPs:      accesspolicy.ParseTrustedAccessIPs(os.Getenv("TRUSTED_ACCESS_IPS")),
		FreeTrialIPBlockHours: accesspolicy.ParseFreeTrialBlockHours(os.Getenv("FREE_TRIAL_IP_BLOCK_HOURS"), 24*365*10, 1, 24*365*10),
	}

	return cfg, nil
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvWithFallback tries primary key first, then fallback key, then default
func getEnvWithFallback(primaryKey, fallbackKey, defaultValue string) string {
	if value := os.Getenv(primaryKey); value != "" {
		return value
	}
	if value := os.Getenv(fallbackKey); value != "" {
		return value
	}
	return defaultValue
}

// getEnvBool gets an environment variable as boolean
func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		parsed, err := strconv.ParseBool(value)
		if err != nil {
			return defaultValue
		}
		return parsed
	}
	return defaultValue
}

// getEnvInt gets an environment variable as integer
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil {
			return defaultValue
		}
		return parsed
	}
	return defaultValue
}

// getEnvSlice gets an environment variable as a slice of strings
func getEnvSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		return strings.Split(value, ",")
	}
	return defaultValue
}
