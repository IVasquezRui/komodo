/**
 * K6 High-Concurrency Stress Test (Phase 10 - Capa 2)
 * 
 * Simulates 500 concurrent virtual users hitting the Go Gateway (:8080)
 * at the EXACT same millisecond, attempting to lock the EXACT same seat.
 * 
 * Strict Mathematical Guarantees:
 * - Exactly 1 request MUST succeed (HTTP 200/201 - Lock Acquired)
 * - Exactly 499 requests MUST be rejected (HTTP 409 - Conflict / Already Held)
 * - Zero double-bookings, zero deadlocks, p95 latency < 250ms.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

// Custom metrics
export const successCounter = new Counter('successful_locks');
export const conflictCounter = new Counter('conflict_locks');
export const conflictRate = new Rate('conflict_rate');

export const options = {
  scenarios: {
    stampede_collision: {
      executor: 'shared-iterations',
      vus: 500,
      iterations: 500,
      maxDuration: '10s',
    },
  },
  thresholds: {
    'successful_locks': ['count==1'],          // Exactly 1 buyer gets the seat
    'conflict_locks': ['count==499'],           // Exactly 499 get conflict rejection
    'conflict_rate': ['rate>0.99'],             // 99.8% conflict rate
    'http_req_duration': ['p(95)<250'],         // Fast Redis Shield response
  },
};

const BASE_URL = __ENV.GATEWAY_URL || 'http://localhost:8080';
const TARGET_TRIP_ID = 'a0000001-0000-0000-0000-000000000001';
const TARGET_SEAT_NUM = 14;

export default function () {
  const userId = `vu_user_${__VU}_${__ITER}_${Date.now()}`;
  const payload = JSON.stringify({
    trip_id: TARGET_TRIP_ID,
    seat_number: TARGET_SEAT_NUM,
    user_id: userId,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/api/v1/hold-seat`, payload, params);

  if (res.status === 200) {
    successCounter.add(1);
    conflictRate.add(0);
    check(res, {
      'Lock Acquired (Winner)': (r) => {
        const body = JSON.parse(r.body);
        return body.status === 'HELD' || body.status === 'HELD_BYPASS';
      },
    });
  } else if (res.status === 409) {
    conflictCounter.add(1);
    conflictRate.add(1);
    check(res, {
      'Controlled Conflict Rejection': (r) => {
        const body = JSON.parse(r.body);
        return body.error === 'SEAT_HELD';
      },
    });
  } else {
    check(res, {
      'Unexpected Status Code': () => false,
    });
  }
}
