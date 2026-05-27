package accesspolicy

import (
	"net"
	"strconv"
	"strings"
)

// ParseAdminEmails normalizes, deduplicates and validates admin emails from env.
// If raw is empty, fallback is used.
func ParseAdminEmails(raw string, fallback []string) []string {
	source := raw
	if strings.TrimSpace(source) == "" {
		source = strings.Join(fallback, ",")
	}

	result := make([]string, 0)
	seen := make(map[string]struct{})
	for _, item := range strings.Split(source, ",") {
		email := strings.ToLower(strings.TrimSpace(item))
		if email == "" || !strings.Contains(email, "@") {
			continue
		}
		if _, exists := seen[email]; exists {
			continue
		}
		seen[email] = struct{}{}
		result = append(result, email)
	}
	return result
}

// IsAdminEmail checks if a user email belongs to the configured admin list.
func IsAdminEmail(email string, adminEmails []string) bool {
	target := strings.ToLower(strings.TrimSpace(email))
	if target == "" {
		return false
	}
	for _, admin := range adminEmails {
		if target == strings.ToLower(strings.TrimSpace(admin)) {
			return true
		}
	}
	return false
}

// ParseTrustedAccessIPs keeps only valid IPs/CIDRs, normalized and unique.
func ParseTrustedAccessIPs(raw string) []string {
	result := make([]string, 0)
	seen := make(map[string]struct{})
	for _, item := range strings.Split(raw, ",") {
		entry := strings.TrimSpace(item)
		if entry == "" {
			continue
		}

		normalized := normalizeIPOrCIDR(entry)
		if normalized == "" {
			continue
		}

		if _, exists := seen[normalized]; exists {
			continue
		}
		seen[normalized] = struct{}{}
		result = append(result, normalized)
	}
	return result
}

// ParseFreeTrialBlockHours parses and clamps the block-hours value.
func ParseFreeTrialBlockHours(raw string, defaultHours, minHours, maxHours int) int {
	if minHours <= 0 {
		minHours = 1
	}
	if maxHours < minHours {
		maxHours = minHours
	}

	value := defaultHours
	trimmed := strings.TrimSpace(raw)
	if trimmed != "" {
		if parsed, err := strconv.Atoi(trimmed); err == nil {
			value = parsed
		}
	}

	if value < minHours {
		return minHours
	}
	if value > maxHours {
		return maxHours
	}
	return value
}

func normalizeIPOrCIDR(value string) string {
	if strings.Contains(value, "/") {
		ip, cidr, err := net.ParseCIDR(value)
		if err != nil || ip == nil || cidr == nil {
			return ""
		}
		return cidr.String()
	}

	parsed := net.ParseIP(value)
	if parsed == nil {
		return ""
	}
	return parsed.String()
}
