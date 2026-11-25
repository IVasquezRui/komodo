package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/komodo/gateway/models"
	redisclient "github.com/komodo/gateway/redis"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SearchRequest represents query parameters for GET /api/v1/search
type SearchRequest struct {
	Origin      string `form:"origin" binding:"required"`
	Destination string `form:"destination" binding:"required"`
	Date        string `form:"date"`
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
		cacheKey := fmt.Sprintf("komodo:search:%s:%s:%s", req.Origin, req.Destination, req.Date)

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
				t.id, r.route_code, COALESCE(op.name, 'Komodo Express') as operator_name,
				COALESCE(b.model, 'Autocar Estándar') as bus_model,
				orig.name as origin, dest.name as destination,
				t.departure_at, t.arrival_at, t.available_seats,
				COALESCE(t.price_usd_cents, ROUND(r.base_price_usd * 100)::INT) as price_usd_cents,
				t.bus_plate, t.driver_name, COALESCE(b.amenities, '{}'::jsonb) as amenities
			FROM trips t
			JOIN routes r ON t.route_id = r.id
			JOIN terminals orig ON r.origin_terminal_id = orig.id
			JOIN terminals dest ON r.destination_terminal_id = dest.id
			LEFT JOIN bus_operators op ON t.operator_id = op.id
			LEFT JOIN buses b ON t.bus_id = b.id
			WHERE (orig.id::text = $1 OR LOWER(orig.terminal_code) = LOWER($1) OR LOWER(orig.city) = LOWER($1))
			  AND (dest.id::text = $2 OR LOWER(dest.terminal_code) = LOWER($2) OR LOWER(dest.city) = LOWER($2))
			  AND ($3 = '' OR DATE(t.departure_at AT TIME ZONE 'UTC')::text = $3)
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
			var amenitiesRaw []byte
			if err := rows.Scan(
				&trip.TripID, &trip.RouteCode, &trip.OperatorName, &trip.BusModel,
				&trip.Origin, &trip.Destination, &trip.DepartureAt, &trip.ArrivalAt,
				&trip.AvailSeats, &trip.PriceUSDCents, &busPlate, &driverName, &amenitiesRaw,
			); err != nil {
				log.Printf("[gateway] Row Scan Error: %v", err)
				continue
			}
			trip.PriceUSD = float64(trip.PriceUSDCents) / 100.0
			if busPlate != nil {
				trip.BusPlate = *busPlate
			}
			if driverName != nil {
				trip.DriverName = *driverName
			}
			if len(amenitiesRaw) > 0 {
				var am map[string]any
				if jsonErr := json.Unmarshal(amenitiesRaw, &am); jsonErr == nil {
					trip.Amenities = am
				}
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

		// 3. Save to Redis with CacheHit=true for subsequent hits
		responseBytes, _ := json.Marshal(respObj)
		if rdb != nil {
			cachedObj := respObj
			cachedObj.CacheHit = true
			cachedBytes, _ := json.Marshal(cachedObj)
			go func(data []byte) {
				saveCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
				defer cancel()
				rdb.Set(saveCtx, cacheKey, data, cacheTTL)
			}(cachedBytes)
		}

		c.Data(http.StatusOK, "application/json", responseBytes)
	}
}
