package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/busplatform/gateway/models"
	"github.com/gin-gonic/gin"
)

func TestHoldSeatHandler_BypassWhenNilRedis(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	r.POST("/api/v1/hold-seat", HoldSeatHandler(nil, 5*time.Minute))

	reqBody := models.HoldSeatRequest{
		TripID:     "trip_001",
		SeatNumber: 14,
		UserID:     "user_test_99",
	}
	bodyBytes, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest(http.MethodPost, "/api/v1/hold-seat", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	var res models.HoldSeatResponse
	if err := json.Unmarshal(w.Body.Bytes(), &res); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}

	if res.Status != "HELD_BYPASS" {
		t.Fatalf("expected HELD_BYPASS status, got %s", res.Status)
	}
	if res.SeatNum != 14 {
		t.Fatalf("expected seat number 14, got %d", res.SeatNum)
	}
}
