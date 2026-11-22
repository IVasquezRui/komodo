package models

import "time"

// HealthResponse is returned by the /health endpoint.
type HealthResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Timestamp string `json:"ts"`
	Redis     string `json:"redis"`
	Postgres  string `json:"postgres"`
}

// APIError is the standard error response format across the platform.
type APIError struct {
	Error      string `json:"error"`
	Message    string `json:"message"`
	RequestID  string `json:"request_id,omitempty"`
	RetryAfter int    `json:"retry_after,omitempty"`
}

// SearchResult represents a single trip in search results.
type SearchResult struct {
	TripID        string    `json:"tid"`           // Short key: trip ID
	RouteCode     string    `json:"rc"`            // Short key: route code
	Origin        string    `json:"org"`           // Short key: origin terminal
	Destination   string    `json:"dst"`           // Short key: destination terminal
	DepartureAt   time.Time `json:"dep"`           // Short key: departure
	ArrivalAt     time.Time `json:"arr"`           // Short key: arrival
	AvailSeats    int       `json:"avl"`           // Short key: available seats
	PriceUSD      float64   `json:"prc"`           // Short key: price
	BusPlate      string    `json:"bp,omitempty"`  // Short key: bus plate
	DriverName    string    `json:"dn,omitempty"`  // Short key: driver name
}

// SearchResponse wraps search results with metadata.
type SearchResponse struct {
	Results []SearchResult `json:"r"`        // Short key: results
	Count   int            `json:"c"`        // Short key: count
	CacheHit bool         `json:"ch"`       // Short key: was this from cache?
}

// HoldSeatRequest is the payload for POST /api/v1/hold-seat.
type HoldSeatRequest struct {
	TripID     string `json:"trip_id"`
	SeatNumber int    `json:"seat_number"`
	UserID     string `json:"user_id"`
}

// HoldSeatResponse confirms a seat hold with expiry info.
type HoldSeatResponse struct {
	Status    string `json:"status"`     // "HELD" or "ALREADY_HELD"
	TripID    string `json:"tid"`
	SeatNum   int    `json:"sn"`
	ExpiresIn int    `json:"exp_s"`      // Seconds until hold expires
	HeldBy    string `json:"hb,omitempty"` // User who holds it (only if same user)
}

// ReleaseSeatRequest is the payload for POST /api/v1/release-seat.
type ReleaseSeatRequest struct {
	TripID     string `json:"trip_id"`
	SeatNumber int    `json:"seat_number"`
	UserID     string `json:"user_id"`
}

// ReleaseSeatResponse confirms a seat release.
type ReleaseSeatResponse struct {
	Status     string `json:"status"` // "RELEASED" or "NOT_HELD"
	TripID     string `json:"tid"`
	SeatNumber int    `json:"sn"`
}
