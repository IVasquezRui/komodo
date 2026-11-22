package handlers

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	redisclient "github.com/busplatform/gateway/redis"
	"github.com/gin-gonic/gin"
)

// SeatStreamHandler streams real-time seat lock and reservation updates using Server-Sent Events (SSE).
// It subscribes to Redis Pub/Sub channel `trip:<trip_id>:seat_updates`.
func SeatStreamHandler(rdb *redisclient.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		tripID := c.Param("trip_id")
		if tripID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "MISSING_TRIP_ID", "message": "trip_id param is required"})
			return
		}

		// Configure HTTP headers for persistent Server-Sent Events
		w := c.Writer
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache, no-transform")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("X-Accel-Buffering", "no")
		w.WriteHeader(http.StatusOK)
		w.Flush()

		// Initial greeting event
		fmt.Fprintf(w, "event: connected\ndata: {\"trip_id\":\"%s\",\"status\":\"STREAM_ACTIVE\",\"timestamp\":%d}\n\n",
			tripID, time.Now().Unix())
		w.Flush()

		// If Redis is not available, provide degraded keep-alive stream
		if rdb == nil {
			ticker := time.NewTicker(5 * time.Second)
			defer ticker.Stop()

			ctx := c.Request.Context()
			for {
				select {
				case <-ctx.Done():
					return
				case <-ticker.C:
					fmt.Fprintf(w, ": keepalive\n\n")
					w.Flush()
				}
			}
		}

		// Subscribe to Redis Pub/Sub channel
		channelName := fmt.Sprintf("trip:%s:seat_updates", tripID)
		pubsub := rdb.Subscribe(c.Request.Context(), channelName)
		defer func() {
			if err := pubsub.Close(); err != nil {
				log.Printf("[sse] Error closing pubsub for trip %s: %v", tripID, err)
			}
		}()

		ch := pubsub.Channel()
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()

		ctx := c.Request.Context()
		for {
			select {
			case <-ctx.Done():
				return

			case msg, ok := <-ch:
				if !ok {
					return
				}
				// Deliver SSE event payload to client
				fmt.Fprintf(w, "event: seat_update\ndata: %s\n\n", msg.Payload)
				w.Flush()

			case <-ticker.C:
				// Heartbeat comment ping to prevent connection timeout
				_, err := fmt.Fprintf(w, ": ping\n\n")
				if err != nil && err == io.EOF {
					return
				}
				w.Flush()
			}
		}
	}
}
