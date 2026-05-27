package handlers

import (
	"testing"
	"time"

	"whatsmiau2/internal/config"
	"whatsmiau2/internal/database"
	"whatsmiau2/internal/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func newTrialGuardTestHandler(t *testing.T, cfg *config.Config) *SubscriptionHandler {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}

	if err := db.AutoMigrate(&models.User{}, &models.FreeTrialUsage{}); err != nil {
		t.Fatalf("failed to migrate test models: %v", err)
	}

	return &SubscriptionHandler{
		cfg: cfg,
		db:  &database.Database{DB: db, Config: cfg},
	}
}

func TestShouldBypassTrialGuardForAdminEmail(t *testing.T) {
	handler := newTrialGuardTestHandler(t, &config.Config{})

	admin := &models.User{
		Name:  "Admin",
		Email: "automacoescomerciais@gmail.com",
	}
	if err := admin.HashPassword("123456"); err != nil {
		t.Fatalf("failed to hash admin password: %v", err)
	}
	if err := handler.db.DB.Create(admin).Error; err != nil {
		t.Fatalf("failed to insert admin user: %v", err)
	}

	bypass, err := handler.shouldBypassTrialIPGuard(admin.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !bypass {
		t.Fatalf("expected admin email to bypass trial IP guard")
	}
}

func TestShouldNotBypassTrialGuardForRegularUser(t *testing.T) {
	handler := newTrialGuardTestHandler(t, &config.Config{})

	user := &models.User{
		Name:  "Regular",
		Email: "cliente.normal@example.com",
	}
	if err := user.HashPassword("123456"); err != nil {
		t.Fatalf("failed to hash user password: %v", err)
	}
	if err := handler.db.DB.Create(user).Error; err != nil {
		t.Fatalf("failed to insert regular user: %v", err)
	}

	bypass, err := handler.shouldBypassTrialIPGuard(user.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if bypass {
		t.Fatalf("expected regular user to not bypass trial IP guard")
	}
}

func TestIsTrustedAccessIP(t *testing.T) {
	handler := newTrialGuardTestHandler(t, &config.Config{
		TrustedAccessIPs: []string{
			"187.19.141.223",
			"2804:29b8:5014:a17::/64",
		},
	})

	if !handler.isTrustedAccessIP("187.19.141.223") {
		t.Fatalf("expected exact IPv4 to be trusted")
	}

	if !handler.isTrustedAccessIP("2804:29b8:5014:a17:d188:f006:9dad:d379") {
		t.Fatalf("expected IPv6 inside trusted CIDR to be trusted")
	}

	if handler.isTrustedAccessIP("177.54.1.9") {
		t.Fatalf("unexpected trusted result for unknown IPv4")
	}
}

func TestHasRecentTrialUsageByIP_WithBlockHours(t *testing.T) {
	handler := newTrialGuardTestHandler(t, &config.Config{
		FreeTrialIPBlockHours: 3,
	})

	if err := handler.db.DB.Create(&models.FreeTrialUsage{
		UserID:   100,
		PlanID:   1,
		ClientIP: "187.19.141.223",
	}).Error; err != nil {
		t.Fatalf("failed to insert recent usage: %v", err)
	}

	recentBlocked, err := handler.hasRecentTrialUsageByIP("187.19.141.223")
	if err != nil {
		t.Fatalf("unexpected error for recent usage check: %v", err)
	}
	if !recentBlocked {
		t.Fatalf("expected recent trial usage to be blocked")
	}

	if err := handler.db.DB.Create(&models.FreeTrialUsage{
		UserID:    200,
		PlanID:    1,
		ClientIP:  "2804:29b8:5014:a17:d188:f006:9dad:d379",
		CreatedAt: time.Now().Add(-4 * time.Hour),
	}).Error; err != nil {
		t.Fatalf("failed to insert old usage: %v", err)
	}

	oldBlocked, err := handler.hasRecentTrialUsageByIP("2804:29b8:5014:a17:d188:f006:9dad:d379")
	if err != nil {
		t.Fatalf("unexpected error for old usage check: %v", err)
	}
	if oldBlocked {
		t.Fatalf("expected old trial usage to be allowed outside block window")
	}
}
