package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/busplatform/gateway/models"
	redisclient "github.com/busplatform/gateway/redis"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SearchRequest represents query parameters for GET /api/v1/search
type SearchRequest struct {
	Origin      string `form:"origin" binding:"required"`
	Destination string `form:"destination" binding:"required"`
	Date        string `form:"date" binding:"required"`
}

// SearchHandler implements the cache-aside pattern for finding trips
func SearchHandler(rdb *redisclient.Client, db *pgxpool.Pool, cacheTTL time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req SearchRequest
		if err := c.ShouldBindQuery(&req); err != nil {
			c.JSON(http.StatusBadRequest, models.APIError{
				Error:   "INVALID_REQUEST",
				Message: err.Error(),
			})
			return
		}

		// 1. Check Redis Cache
		cacheKey := fmt.Sprintf("search:%s:%s:%s", req.Origin, req.Destination, req.Date)

		if rdb != nil {
			ctx, cancel := context.WithTimeout(c.Request.Context(), 1*time.Second) // fast timeout for cache
			cachedData, err := rdb.Get(ctx, cacheKey)
			cancel()

			if err == nil && cachedData != "" {
				c.Data(http.StatusOK, "application/json", []byte(cachedData))
				return
			}
		}

		// 2. Cache Miss: Query PostgreSQL
		if db == nil {
			c.JSON(http.StatusInternalServerError, models.APIError{
				Error:   "DB_UNAVAILABLE",
				Message: "PostgreSQL connection pool not initialized",
			})
			return
		}

		queryCtx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		query := `
			SELECT 
				t.id, r.route_code, orig.name as origin, dest.name as destination,
				t.departure_at, t.arrival_at, t.available_seats, r.base_price_usd,
				t.bus_plate, t.driver_name
			FROM trips t
			JOIN routes r ON t.route_id = r.id
			JOIN terminals orig ON r.origin_terminal_id = orig.id
			JOIN terminals dest ON r.destination_terminal_id = dest.id
			WHERE orig.id = $1 AND dest.id = $2 
			  AND DATE(t.departure_at AT TIME ZONE 'UTC') = $3
			  AND t.status = 'SCHEDULED'
			ORDER BY t.departure_at ASC
		`
		
		rows, err := db.Query(queryCtx, query, req.Origin, req.Destination, req.Date)
		if err != nil {
			log.Printf("[gateway] DB Query Error: %v", err)
			c.JSON(http.StatusInternalServerError, models.APIError{
				Error: "INTERNAL_SERVER_ERROR",
			})
			return
		}
		defer rows.Close()

		var results []models.SearchResult
		for rows.Next() {
			var trip models.SearchResult
			var busPlate, driverName *string
			if err := rows.Scan(
				&trip.TripID, &trip.RouteCode, &trip.Origin, &trip.Destination,
				&trip.DepartureAt, &trip.ArrivalAt, &trip.AvailSeats, &trip.PriceUSD,
				&busPlate, &driverName,
			); err != nil {
				log.Printf("[gateway] Row Scan Error: %v", err)
				continue
			}
			if busPlate != nil {
				trip.BusPlate = *busPlate
			}
			if driverName != nil {
				trip.DriverName = *driverName
			}
			results = append(results, trip)
		}

		if results == nil {
			results = []models.SearchResult{}
		}

		respObj := models.SearchResponse{
			Results:  results,
			Count:    len(results),
			CacheHit: false,
		}

		// 3. Save to Redis
		responseBytes, _ := json.Marshal(respObj)
		if rdb != nil {
			go func(data []byte) {
				saveCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
				defer cancel()
				rdb.Set(saveCtx, cacheKey, data, cacheTTL)
			}(responseBytes)
		}

		c.Data(http.StatusOK, "application/json", responseBytes)
	}
}
