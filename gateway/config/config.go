package config

import (
	"os"
	"time"
)

// Config holds all gateway configuration loaded from environment variables.
type Config struct {
	// Server
	Host         string
	Port         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration

	// Redis
	RedisURL string

	// PostgreSQL (for cache misses)
	DatabaseURL string

	// Core service
	CoreURL string

	// TTLs
	SeatHoldTTL    time.Duration
	SearchCacheTTL time.Duration

	// CORS
	AllowedOrigins string
}

// Load reads configuration from environment variables with sensible defaults.
func Load() *Config {
	return &Config{
		Host:           getEnv("GATEWAY_HOST", "0.0.0.0"),
		Port:           getEnv("GATEWAY_PORT", "8080"),
		ReadTimeout:    parseDuration(getEnv("GATEWAY_READ_TIMEOUT", "10s")),
		WriteTimeout:   parseDuration(getEnv("GATEWAY_WRITE_TIMEOUT", "15s")),
		RedisURL:       getEnv("REDIS_URL", "redis://:komodo_redis_password@redis:6379/0"),
		DatabaseURL:    getEnv("DATABASE_URL_PGX", "postgres://komodo_user:komodo_secure_password@postgres:5432/komodo_db?sslmode=disable"),
		CoreURL:        getEnv("GATEWAY_CORE_URL", "http://core:8000"),
		SeatHoldTTL:    parseDuration(getEnv("SEAT_HOLD_TTL_SECONDS", "300") + "s"),
		SearchCacheTTL: parseDuration(getEnv("SEARCH_CACHE_TTL_SECONDS", "120") + "s"),
		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 10 * time.Second
	}
	return d
}
