package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/busplatform/gateway/config"
	"github.com/busplatform/gateway/db"
	"github.com/busplatform/gateway/handlers"
	"github.com/busplatform/gateway/models"
	redisclient "github.com/busplatform/gateway/redis"
	"github.com/busplatform/gateway/resilience"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	// ---- Load configuration ----
	cfg := config.Load()

	// ---- Connect to Redis (with retries) ----
	rdb, err := redisclient.New(cfg.RedisURL)
	if err != nil {
		log.Printf("[gateway] WARNING: Redis unavailable: %v — running in degraded mode", err)
		// Gateway continues without Redis (all requests bypass to Core/PostgreSQL)
	}

	// ---- Connect to PostgreSQL (for cache misses) ----
	dbPool, err := db.NewPostgresPool(cfg.DatabaseURL)
	if err != nil {
		log.Printf("[gateway] WARNING: PostgreSQL unavailable: %v", err)
		// Usually we'd fatal here, but we allow degraded startup for resilience
	}
	defer ifNotNilClose(dbPool)

	// ---- Setup Router ----
	// Use ReleaseMode in production. Setting it explicitly to avoid debug logs if not needed.
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()

	// Middleware stack
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(gzip.Gzip(gzip.DefaultCompression)) // gzip level 6 equivalent

	r.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Split(cfg.AllowedOrigins, ","),
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type", "X-Idempotency-Key", "Origin"},
		ExposeHeaders:    []string{"X-Request-ID", "Content-Length"},
		AllowCredentials: true,
		MaxAge:           300 * time.Second,
	}))

	// ---- Routes ----
	r.GET("/health", healthHandler(rdb, dbPool))

	// Circuit breaker protecting downstream Core requests
	cb := resilience.NewCircuitBreaker(resilience.Settings{
		Name:        "core-backend",
		MaxRequests: 3,
		Timeout:     5 * time.Second,
		ReadyToTrip: func(counts resilience.Counts) bool {
			return counts.ConsecutiveFailures >= 5
		},
		OnStateChange: func(name string, from resilience.State, to resilience.State) {
			log.Printf("[circuit-breaker] %s state transition: %s -> %s", name, from, to)
		},
	})

	// Differentiated Rate Limiting: 120 rpm for auth, 30 rpm for anonymous
	rateLimiter := resilience.NewRateLimiter(120, 30)

	coreProxy := createCoreReverseProxy(cfg.CoreURL, cb)
	r.GET("/docs", coreProxy)
	r.GET("/openapi.json", coreProxy)
	r.GET("/redoc", coreProxy)

	v1 := r.Group("/api/v1")
	v1.Use(rateLimiter.Middleware())
	{
		// High-performance local handlers (Redis Shield & DB read pool)
		v1.GET("/search", handlers.SearchHandler(rdb, dbPool, cfg.SearchCacheTTL))
		v1.POST("/hold-seat", handlers.HoldSeatHandler(rdb, cfg.SeatHoldTTL))
		v1.POST("/release-seat", handlers.ReleaseSeatHandler(rdb))

		// Real-time seat updates stream (SSE + Redis Pub/Sub)
		v1.GET("/trips/:trip_id/seat-stream", handlers.SeatStreamHandler(rdb))

		v1.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":  "ok",
				"service": "gateway",
				"version": "0.3.0",
			})
		})

		// Reverse Proxy endpoints delegated to FastAPI Core (with Circuit Breaker)
		v1.Any("/auth/*action", coreProxy)
		v1.Any("/auth", coreProxy)
		v1.Any("/admin/*action", coreProxy)
		v1.Any("/admin", coreProxy)
		v1.Any("/notifications/*action", coreProxy)
		v1.Any("/notifications", coreProxy)
		v1.Any("/tickets/*action", coreProxy)
		v1.Any("/tickets", coreProxy)
		v1.Any("/reservations/*action", coreProxy)
		v1.Any("/reservations", coreProxy)
		v1.Any("/trips/*action", coreProxy)
		v1.Any("/trips", coreProxy)
		v1.Any("/payments/*action", coreProxy)
		v1.Any("/payments", coreProxy)
	}

	// ---- Start Server with Graceful Shutdown ----
	addr := fmt.Sprintf("%s:%s", cfg.Host, cfg.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
		IdleTimeout:  60 * time.Second,
	}

	// Channel for shutdown signals
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Printf("[gateway] Starting on %s", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[gateway] Fatal: %v", err)
		}
	}()

	// Wait for shutdown signal
	<-done
	log.Println("[gateway] Shutting down gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("[gateway] Forced shutdown: %v", err)
	}

	if rdb != nil {
		rdb.Close()
	}

	log.Println("[gateway] Stopped")
}

func ifNotNilClose(p *pgxpool.Pool) {
	if p != nil {
		p.Close()
	}
}

// createCoreReverseProxy sets up a reverse proxy forwarding to the FastAPI Core service,
// wrapped with Circuit Breaker fast-failure protection.
func createCoreReverseProxy(coreURL string, cb *resilience.CircuitBreaker) gin.HandlerFunc {
	target, err := url.Parse(coreURL)
	if err != nil {
		log.Fatalf("[gateway] Fatal: Invalid Core URL: %v", err)
	}
	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ErrorHandler = func(w http.ResponseWriter, req *http.Request, err error) {
		log.Printf("[gateway-proxy] Error proxying to Core (%s): %v", req.URL.Path, err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		w.Write([]byte(`{"error":"CORE_UNAVAILABLE","message":"Backend Core service is temporarily unreachable"}`))
	}

	return func(c *gin.Context) {
		if cb != nil && cb.State() == resilience.StateOpen {
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{
				"error":   "CIRCUIT_BREAKER_OPEN",
				"message": "Backend Core is temporarily degraded. Shedding traffic to prevent cascade.",
				"state":   cb.State().String(),
			})
			return
		}
		c.Request.Host = target.Host
		proxy.ServeHTTP(c.Writer, c.Request)
	}
}

// healthHandler returns the health status of the gateway and its dependencies.
func healthHandler(rdb *redisclient.Client, dbPool *pgxpool.Pool) gin.HandlerFunc {
	return func(c *gin.Context) {
		redisStatus := "disconnected"
		if rdb != nil {
			ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
			defer cancel()
			if err := rdb.Ping(ctx); err == nil {
				redisStatus = "connected"
			}
		}

		postgresStatus := "disconnected"
		if dbPool != nil {
			ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
			defer cancel()
			if err := dbPool.Ping(ctx); err == nil {
				postgresStatus = "connected"
			}
		}

		resp := models.HealthResponse{
			Status:    "ok",
			Service:   "gateway",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			Redis:     redisStatus,
			Postgres:  postgresStatus,
		}

		c.JSON(http.StatusOK, resp)
	}
}
