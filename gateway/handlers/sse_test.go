package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestSeatStreamHandler_DegradedWithoutRedis(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	// Handler with nil Redis client
	r.GET("/api/v1/trips/:trip_id/seat-stream", SeatStreamHandler(nil))

	// Create request with cancel context to simulate client disconnect after header check
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, "/api/v1/trips/test-trip-123/seat-stream", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	// Check headers
	contentType := w.Header().Get("Content-Type")
	if contentType != "text/event-stream" {
		t.Fatalf("expected Content-Type text/event-stream, got %s", contentType)
	}

	body := w.Body.String()
	if body == "" {
		t.Fatal("expected non-empty initial SSE event stream")
	}
}
