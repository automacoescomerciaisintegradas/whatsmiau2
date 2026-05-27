package accesspolicy

import (
	"testing"
)

func TestParseAdminEmails_UsesFallbackWhenEnvEmpty(t *testing.T) {
	fallback := []string{"admin@exemplo.com", "suporte@exemplo.com"}
	got := ParseAdminEmails("", fallback)

	if len(got) != 2 {
		t.Fatalf("expected 2 fallback emails, got %d", len(got))
	}
	if got[0] != "admin@exemplo.com" || got[1] != "suporte@exemplo.com" {
		t.Fatalf("unexpected fallback result: %#v", got)
	}
}

func TestParseAdminEmails_NormalizesAndDeduplicates(t *testing.T) {
	raw := " Admin@Example.com,admin@example.com, ,SUPORTE@example.com "
	got := ParseAdminEmails(raw, nil)

	if len(got) != 2 {
		t.Fatalf("expected 2 normalized emails, got %d (%#v)", len(got), got)
	}
	if got[0] != "admin@example.com" || got[1] != "suporte@example.com" {
		t.Fatalf("unexpected normalized result: %#v", got)
	}
}

func TestIsAdminEmail_MatchesCaseInsensitive(t *testing.T) {
	admins := []string{"automacoescomerciais@gmail.com", "contato@automacoescomerciais.com.br"}
	if !IsAdminEmail("Contato@AutomacoesComerciais.com.br", admins) {
		t.Fatalf("expected email to be recognized as admin")
	}
	if IsAdminEmail("cliente@exemplo.com", admins) {
		t.Fatalf("did not expect regular email to be admin")
	}
}

func TestParseTrustedAccessIPs_ValidAndUniqueOnly(t *testing.T) {
	raw := " 192.168.0.1,invalid,10.0.0.0/24,192.168.0.1, 2001:db8::1 "
	got := ParseTrustedAccessIPs(raw)

	if len(got) != 3 {
		t.Fatalf("expected 3 valid unique entries, got %d (%#v)", len(got), got)
	}
}

func TestParseFreeTrialBlockHours_DefaultAndBounds(t *testing.T) {
	if got := ParseFreeTrialBlockHours("", 240, 1, 87600); got != 240 {
		t.Fatalf("expected default 240, got %d", got)
	}
	if got := ParseFreeTrialBlockHours("0", 240, 1, 87600); got != 1 {
		t.Fatalf("expected clamped min 1, got %d", got)
	}
	if got := ParseFreeTrialBlockHours("999999", 240, 1, 87600); got != 87600 {
		t.Fatalf("expected clamped max 87600, got %d", got)
	}
}
