package models

import (
	"os"
	"testing"
)

func TestIsAdminFromEnvList(t *testing.T) {
	prev := os.Getenv("ADMIN_EMAILS")
	t.Cleanup(func() {
		_ = os.Setenv("ADMIN_EMAILS", prev)
	})

	_ = os.Setenv("ADMIN_EMAILS", "admin1@example.com,admin2@example.com")

	u := User{Email: "admin2@example.com"}
	if !u.IsAdmin() {
		t.Fatalf("expected email from ADMIN_EMAILS to be admin")
	}
}

func TestIsAdminFallbackHardcoded(t *testing.T) {
	prev := os.Getenv("ADMIN_EMAILS")
	t.Cleanup(func() {
		_ = os.Setenv("ADMIN_EMAILS", prev)
	})

	_ = os.Setenv("ADMIN_EMAILS", "")

	u := User{Email: "automacoescomerciais@gmail.com"}
	if !u.IsAdmin() {
		t.Fatalf("expected hardcoded admin email to remain admin")
	}
}

func TestIsAdminCaseInsensitiveAndTrimmed(t *testing.T) {
	prev := os.Getenv("ADMIN_EMAILS")
	t.Cleanup(func() {
		_ = os.Setenv("ADMIN_EMAILS", prev)
	})

	_ = os.Setenv("ADMIN_EMAILS", "  Admin@Example.com  ")

	u := User{Email: "admin@example.com"}
	if !u.IsAdmin() {
		t.Fatalf("expected case-insensitive and trimmed admin match")
	}
}
