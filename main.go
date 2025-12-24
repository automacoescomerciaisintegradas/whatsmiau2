package main

import (
	"os"
	"os/signal"
	"syscall"

	"whatsmiau2/internal/config"
	"whatsmiau2/internal/database"
	"whatsmiau2/internal/server"
	"whatsmiau2/internal/whatsapp"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func main() {
	// Initialize logger
	logger := initLogger()
	defer logger.Sync()
	zap.ReplaceGlobals(logger)

	zap.L().Info("Starting whatsmiau2...")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		zap.L().Fatal("Failed to load configuration", zap.Error(err))
	}

	zap.L().Info("Configuration loaded",
		zap.String("port", cfg.Port),
		zap.Bool("debugMode", cfg.DebugMode),
		zap.String("database", cfg.DialectDB),
	)

	// Initialize database
	db, err := database.New(cfg)
	if err != nil {
		zap.L().Fatal("Failed to initialize database", zap.Error(err))
	}
	defer db.Close()

	// Initialize WhatsApp manager
	manager, err := whatsapp.NewManager(cfg, db)
	if err != nil {
		zap.L().Fatal("Failed to initialize WhatsApp manager", zap.Error(err))
	}
	defer manager.Close()

	// Create and start server
	srv := server.New(cfg, db, manager)

	// Handle graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan

		zap.L().Info("Shutting down...")
		manager.Close()
		db.Close()
		os.Exit(0)
	}()

	// Run server
	if err := srv.Run(); err != nil {
		zap.L().Fatal("Failed to start server", zap.Error(err))
	}
}

// initLogger initializes the Zap logger
func initLogger() *zap.Logger {
	encoderConfig := zapcore.EncoderConfig{
		TimeKey:        "timestamp",
		LevelKey:       "level",
		NameKey:        "logger",
		CallerKey:      "caller",
		FunctionKey:    zapcore.OmitKey,
		MessageKey:     "message",
		StacktraceKey:  "stacktrace",
		LineEnding:     zapcore.DefaultLineEnding,
		EncodeLevel:    zapcore.CapitalColorLevelEncoder,
		EncodeTime:     zapcore.ISO8601TimeEncoder,
		EncodeDuration: zapcore.StringDurationEncoder,
		EncodeCaller:   zapcore.ShortCallerEncoder,
	}

	config := zap.Config{
		Level:            zap.NewAtomicLevelAt(zapcore.InfoLevel),
		Development:      true,
		Encoding:         "console",
		EncoderConfig:    encoderConfig,
		OutputPaths:      []string{"stdout"},
		ErrorOutputPaths: []string{"stderr"},
	}

	// Check for debug mode
	if os.Getenv("DEBUG_MODE") == "true" {
		config.Level = zap.NewAtomicLevelAt(zapcore.DebugLevel)
	}

	logger, err := config.Build()
	if err != nil {
		panic(err)
	}

	return logger
}
