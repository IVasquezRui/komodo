package resilience

import (
	"errors"
	"testing"
	"time"
)

func TestCircuitBreaker_StateTransitions(t *testing.T) {
	cb := NewCircuitBreaker(Settings{
		Name:        "test-core",
		MaxRequests: 2,
		Interval:    time.Second,
		Timeout:     50 * time.Millisecond,
		ReadyToTrip: func(counts Counts) bool {
			return counts.ConsecutiveFailures >= 3
		},
	})

	if cb.State() != StateClosed {
		t.Fatalf("expected state CLOSED, got %s", cb.State())
	}

	errSample := errors.New("backend failed")

	// 2 failures, still closed
	cb.Execute(func() (interface{}, error) { return nil, errSample })
	cb.Execute(func() (interface{}, error) { return nil, errSample })
	if cb.State() != StateClosed {
		t.Fatalf("expected state CLOSED after 2 failures, got %s", cb.State())
	}

	// 3rd failure trips the breaker to OPEN
	cb.Execute(func() (interface{}, error) { return nil, errSample })
	if cb.State() != StateOpen {
		t.Fatalf("expected state OPEN after 3 failures, got %s", cb.State())
	}

	// Immediate requests are rejected with ErrCircuitOpen without executing function
	called := false
	_, err := cb.Execute(func() (interface{}, error) {
		called = true
		return "ok", nil
	})
	if !errors.Is(err, ErrCircuitOpen) {
		t.Fatalf("expected ErrCircuitOpen, got %v", err)
	}
	if called {
		t.Fatal("request was executed while circuit breaker was open")
	}

	// Wait for timeout to expire -> transitions to HALF_OPEN
	time.Sleep(60 * time.Millisecond)
	if cb.State() != StateHalfOpen {
		t.Fatalf("expected state HALF_OPEN after timeout, got %s", cb.State())
	}

	// 2 successful requests in half-open resets breaker back to CLOSED
	cb.Execute(func() (interface{}, error) { return "ok1", nil })
	cb.Execute(func() (interface{}, error) { return "ok2", nil })

	if cb.State() != StateClosed {
		t.Fatalf("expected state CLOSED after half-open successes, got %s", cb.State())
	}
}
