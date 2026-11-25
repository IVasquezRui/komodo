package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/komodo/gateway/models"
	"github.com/gin-gonic/gin"
)

func TestReleaseSeatHandler_NilRedis(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/api/v1/release-seat", ReleaseSeatHandler(nil))

	payload := models.ReleaseSeatRequest{
		TripID:     "v0000001",
		SeatNumber: 14,
		UserID:     "user123",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest(http.MethodPost, "/api/v1/release-seat", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d", w.Code)
	}

	var resp models.ReleaseSeatResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if resp.Status != "RELEASED_BYPASS" {
		t.Fatalf("Expected status RELEASED_BYPASS, got %s", resp.Status)
	}
}
