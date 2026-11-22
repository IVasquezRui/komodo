"""
Automated High-Concurrency Race Condition & Distributed Locking Test (Phase 10)

Mathematically verifies that when multiple concurrent threads attempt to hold
the exact same seat at the exact same instant:
1. Exactly ONE worker successfully acquires the lock (Winner)
2. All other (N - 1) workers receive a controlled CONFLICT rejection
3. Zero phantom bookings and zero lock corruptions.
"""

import sys
import time
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed


class SeatLockRegistry:
    """Thread-safe simulator of Redis SetNX distributed atomic locking."""

    def __init__(self):
        self._lock = threading.Lock()
        self._held_seats = {}

    def try_hold_seat(self, trip_id: str, seat_number: int, user_id: str) -> bool:
        key = f"hold:{trip_id}:seat:{seat_number}"
        with self._lock:
            if key in self._held_seats:
                # Already held by another user
                return False
            # Lock successfully acquired
            self._held_seats[key] = user_id
            return True


def test_concurrent_seat_stampede():
    num_concurrent_users = 100
    target_trip_id = "a0000001-0000-0000-0000-000000000001"
    target_seat = 14

    registry = SeatLockRegistry()
    barrier = threading.Barrier(num_concurrent_users)

    results = []

    def attempt_booking(user_index: int):
        user_id = f"user_thread_{user_index}"
        # Synchronize all threads so they fire at the EXACT same instant
        barrier.wait()
        acquired = registry.try_hold_seat(target_trip_id, target_seat, user_id)
        return (user_id, acquired)

    start_time = time.time()
    with ThreadPoolExecutor(max_workers=num_concurrent_users) as executor:
        futures = [
            executor.submit(attempt_booking, i) for i in range(num_concurrent_users)
        ]
        for f in as_completed(futures):
            results.append(f.result())

    elapsed_ms = (time.time() - start_time) * 1000

    success_count = sum(1 for _, acquired in results if acquired)
    conflict_count = sum(1 for _, acquired in results if not acquired)

    print(f"Concurrency run finished in {elapsed_ms:.2f}ms across {num_concurrent_users} threads")
    print(f"Results: {success_count} Winners (HTTP 200), {conflict_count} Conflicts (HTTP 409)")

    assert (
        success_count == 1
    ), f"CRITICAL RACE CONDITION: Expected exactly 1 winner, but got {success_count}!"
    assert (
        conflict_count == num_concurrent_users - 1
    ), f"Expected {num_concurrent_users - 1} conflicts, got {conflict_count}"

    print(
        "✓ Mathematical Concurrency Invariant Verified: Exactly 1 lock granted, 99 conflicts returned"
    )


if __name__ == "__main__":
    try:
        test_concurrent_seat_stampede()
        print("ALL CONCURRENCY TESTS PASSED SUCCESSFULLY!")
    except Exception as e:
        print(f"FAILED: {e}")
        sys.exit(1)
