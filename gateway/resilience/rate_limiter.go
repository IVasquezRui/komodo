package resilience

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type clientBucket struct {
	tokens     float64
	lastRefill time.Time
}

// RateLimiter implements an in-memory token bucket rate limiter with tiered limits.
type RateLimiter struct {
	mu           sync.Mutex
	buckets      map[string]*clientBucket
	authCapacity float64
	anonCapacity float64
	authRefill   float64 // tokens per second
	anonRefill   float64 // tokens per second
}

// NewRateLimiter creates a RateLimiter with differentiated rates for auth vs anon clients.
// authRpm: requests per minute for authenticated users (with Bearer token)
// anonRpm: requests per minute for anonymous users (by IP)
func NewRateLimiter(authRpm, anonRpm int) *RateLimiter {
	rl := &RateLimiter{
		buckets:      make(map[string]*clientBucket),
		authCapacity: float64(authRpm),
		anonCapacity: float64(anonRpm),
		authRefill:   float64(authRpm) / 60.0,
		anonRefill:   float64(anonRpm) / 60.0,
	}

	// Periodic garbage collection for idle clients
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		for range ticker.C {
			rl.cleanup(10 * time.Minute)
		}
	}()

	return rl
}

func (rl *RateLimiter) cleanup(maxIdle time.Duration) {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	cutoff := time.Now().Add(-maxIdle)
	for key, b := range rl.buckets {
		if b.lastRefill.Before(cutoff) {
			delete(rl.buckets, key)
		}
	}
}

// Allow checks whether a request for clientKey is within limit.
func (rl *RateLimiter) Allow(clientKey string, isAuthenticated bool) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	capacity := rl.anonCapacity
	refillRate := rl.anonRefill

	if isAuthenticated {
		capacity = rl.authCapacity
		refillRate = rl.authRefill
	}

	b, exists := rl.buckets[clientKey]
	if !exists {
		rl.buckets[clientKey] = &clientBucket{
			tokens:     capacity - 1,
			lastRefill: now,
		}
		return true
	}

	// Refill tokens according to elapsed time
	elapsed := now.Sub(b.lastRefill).Seconds()
	b.tokens += elapsed * refillRate
	if b.tokens > capacity {
		b.tokens = capacity
	}
	b.lastRefill = now

	if b.tokens >= 1.0 {
		b.tokens -= 1.0
		return true
	}

	return false
}

// Middleware returns a Gin HandlerFunc enforcing differentiated rate limits.
func (rl *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		isAuthenticated := authHeader != ""

		var clientKey string
		if isAuthenticated {
			clientKey = "auth:" + authHeader
		} else {
			clientKey = "ip:" + c.ClientIP()
		}

		if !rl.Allow(clientKey, isAuthenticated) {
			c.Header("Retry-After", "60")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":   "RATE_LIMIT_EXCEEDED",
				"message": "Too many requests. Please slow down and try again.",
			})
			return
		}

		c.Next()
	}
}
