package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/busplatform/gateway/models"
	redisclient "github.com/busplatform/gateway/redis"
	"github.com/gin-gonic/gin"
)

// ReleaseSeatHandler releases a distributed lock on a seat in Redis
func ReleaseSeatHandler(rdb *redisclient.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.ReleaseSeatRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, models.APIError{
				Error:   "INVALID_REQUEST",
				Message: err.Error(),
			})
			return
		}

		if rdb == nil {
			c.JSON(http.StatusOK, models.ReleaseSeatResponse{
				Status:     "RELEASED_BYPASS",
				TripID:     req.TripID,
				SeatNumber: req.SeatNumber,
			})
			return
		}

		key := fmt.Sprintf("hold:%s:seat:%d", req.TripID, req.SeatNumber)
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()

		heldBy, err := rdb.Get(ctx, key)
		if err == nil && (heldBy == req.UserID || req.UserID == "") {
			_ = rdb.Del(ctx, key)
			// Broadcast real-time SSE event via Redis Pub/Sub
			channel := fmt.Sprintf("trip:%s:seat_updates", req.TripID)
			eventPayload := fmt.Sprintf(`{"seat_number":%d,"status":"AVAILABLE","user_id":"%s"}`, req.SeatNumber, req.UserID)
			_ = rdb.Publish(ctx, channel, eventPayload)
		}

		c.JSON(http.StatusOK, models.ReleaseSeatResponse{
			Status:     "RELEASED",
			TripID:     req.TripID,
			SeatNumber: req.SeatNumber,
		})
	}
}
