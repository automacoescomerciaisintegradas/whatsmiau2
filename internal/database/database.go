package database

import (
	"fmt"
	"strings"

	"whatsmiau2/internal/config"
	"whatsmiau2/internal/models"

	"github.com/glebarez/sqlite"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Database holds the database connection
type Database struct {
	DB     *gorm.DB
	Config *config.Config
}

// New creates a new database connection
func New(cfg *config.Config) (*Database, error) {
	var db *gorm.DB
	var err error

	// Configure GORM logger
	logMode := logger.Silent
	if cfg.DebugMode {
		logMode = logger.Info
	}

	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logMode),
	}

	// Connect based on dialect
	switch strings.ToLower(cfg.DialectDB) {
	case "sqlite3", "sqlite":
		db, err = gorm.Open(sqlite.Open(cfg.DBURL), gormConfig)
	case "postgres", "postgresql":
		db, err = gorm.Open(postgres.Open(cfg.DBURL), gormConfig)
	default:
		return nil, fmt.Errorf("unsupported database dialect: %s", cfg.DialectDB)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	zap.L().Info("Connected to database",
		zap.String("dialect", cfg.DialectDB),
	)

	// Auto migrate models
	if err := db.AutoMigrate(
		&models.Instance{},
		&models.User{},
		&models.Plan{},
		&models.Subscription{},
		&models.Payment{},
		&models.EnterpriseLead{},
		// Novos modelos de métricas
		&models.SessionMetrics{},
		&models.InstanceStats{},
		&models.DailyStats{},
		&models.HourlyStats{},
	); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	zap.L().Info("Database migrations completed")

	// Initialize Database struct to call methods
	dbInstance := &Database{
		DB:     db,
		Config: cfg,
	}

	// Seed Plans
	if err := dbInstance.SeedPlans(); err != nil {
		zap.L().Error("Failed to seed plans", zap.Error(err))
	} else {
		zap.L().Info("Plans seeded successfully")
	}

	return dbInstance, nil
}

// Close closes the database connection
func (d *Database) Close() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// CreateInstance creates a new instance in the database
func (d *Database) CreateInstance(instance *models.Instance) error {
	return d.DB.Create(instance).Error
}

// GetInstance gets an instance by ID
func (d *Database) GetInstance(id string) (*models.Instance, error) {
	var instance models.Instance
	if err := d.DB.First(&instance, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &instance, nil
}

// GetInstanceByName gets an instance by name
func (d *Database) GetInstanceByName(name string) (*models.Instance, error) {
	var instance models.Instance
	if err := d.DB.First(&instance, "name = ?", name).Error; err != nil {
		return nil, err
	}
	return &instance, nil
}

// GetAllInstances returns all instances
func (d *Database) GetAllInstances() ([]models.Instance, error) {
	var instances []models.Instance
	if err := d.DB.Find(&instances).Error; err != nil {
		return nil, err
	}
	return instances, nil
}

// UpdateInstance updates an instance
func (d *Database) UpdateInstance(instance *models.Instance) error {
	return d.DB.Save(instance).Error
}

// DeleteInstance deletes an instance by ID
func (d *Database) DeleteInstance(id string) error {
	return d.DB.Delete(&models.Instance{}, "id = ?", id).Error
}

// UpdateInstanceStatus updates only the status of an instance
func (d *Database) UpdateInstanceStatus(id string, status models.InstanceStatus) error {
	return d.DB.Model(&models.Instance{}).
		Where("id = ?", id).
		Update("status", status).Error
}

// UpdateInstanceProfile updates the profile information of an instance
func (d *Database) UpdateInstanceProfile(id, phoneNumber, profileName, profilePic string) error {
	return d.DB.Model(&models.Instance{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"phone_number": phoneNumber,
			"profile_name": profileName,
			"profile_pic":  profilePic,
		}).Error
}
