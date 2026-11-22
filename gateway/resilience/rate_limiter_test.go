package resilience

import (
	"testing"
)

func TestRateLimiter_TieredAllow(t *testing.T) {
	// 5 requests allowed for auth, 2 requests for anon
	rl := NewRateLimiter(5, 2)

	anonKey := "ip:192.168.1.100"
	authKey := "auth:Bearer token_123"

	// Anonymous client: 2 allowed, 3rd blocked
	if !rl.Allow(anonKey, false) {
		t.Fatal("anon request 1 should be allowed")
	}
	if !rl.Allow(anonKey, false) {
		t.Fatal("anon request 2 should be allowed")
	}
	if rl.Allow(anonKey, false) {
		t.Fatal("anon request 3 should be blocked")
	}

	// Authenticated client has higher tier: 5 allowed
	for i := 1; i <= 5; i++ {
		if !rl.Allow(authKey, true) {
			t.Fatalf("auth request %d should be allowed", i)
		}
	}
	// 6th blocked
	if rl.Allow(authKey, true) {
		t.Fatal("auth request 6 should be blocked")
	}
}
