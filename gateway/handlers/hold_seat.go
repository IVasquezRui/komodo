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

// HoldSeatHandler implements distributed locking for seats via Redis
func HoldSeatHandler(rdb *redisclient.Client, ttl time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.HoldSeatRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, models.APIError{
				Error:   "INVALID_REQUEST",
				Message: err.Error(),
			})
			return
		}

		// Tolerance for Redis failure: if Redis is down, we simulate success
		// and let the Core DB handle strong locking at purchase time.
		if rdb == nil {
			c.JSON(http.StatusOK, models.HoldSeatResponse{
				Status:    "HELD_BYPASS",
				TripID:    req.TripID,
				SeatNum:   req.SeatNumber,
				ExpiresIn: int(ttl.Seconds()),
			})
			return
		}

		key := fmt.Sprintf("hold:%s:seat:%d", req.TripID, req.SeatNumber)
		
		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()

		ok, err := rdb.SetNX(ctx, key, req.UserID, ttl)
		if err != nil {
			// Tolerance for runtime Redis failure: bypass to DB
			c.JSON(http.StatusOK, models.HoldSeatResponse{
				Status:    "HELD_BYPASS",
				TripID:    req.TripID,
				SeatNum:   req.SeatNumber,
				ExpiresIn: int(ttl.Seconds()),
			})
			return
		}

		if !ok {
			// Check if we hold it already
			heldBy, _ := rdb.Get(ctx, key)
			if heldBy == req.UserID {
				// We already hold it, return success
				ttlLeft, _ := rdb.Underlying().TTL(ctx, key).Result()
				c.JSON(http.StatusOK, models.HoldSeatResponse{
					Status:    "ALREADY_HELD",
					TripID:    req.TripID,
					SeatNum:   req.SeatNumber,
					ExpiresIn: int(ttlLeft.Seconds()),
					HeldBy:    req.UserID,
				})
				return
			}

			// Someone else holds it
			c.JSON(http.StatusConflict, models.APIError{
				Error:   "SEAT_HELD",
				Message: "Seat is temporarily locked by another user",
			})
			return
		}

		c.JSON(http.StatusOK, models.HoldSeatResponse{
			Status:    "HELD",
			TripID:    req.TripID,
			SeatNum:   req.SeatNumber,
			ExpiresIn: int(ttl.Seconds()),
		})
	}
}
