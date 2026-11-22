"""
Unit tests for Admin schemas and fallback logic (Phase 8)
"""

import sys
from app.schemas.admin import (
    AdminStatsResponse,
    BusCreateRequest,
    BusResponse,
    RouteCreateRequest,
    RouteResponse,
    TripCreateRequest,
    TripAdminResponse,
    DEFAULT_BUSES,
    DEFAULT_ROUTES,
    DEFAULT_TRIPS,
)


def test_admin_stats_schema():
    stats = AdminStatsResponse(
        total_revenue=15000.0,
        occupancy_rate=85.0,
        total_passengers=450,
        active_trips=8,
        fleet_total=5,
        fleet_active=4,
        tickets_sold_today=65,
    )
    assert stats.total_revenue == 15000.0
    assert stats.occupancy_rate == 85.0
    assert stats.fleet_active == 4
    print("✓ AdminStatsResponse schema validated")


def test_bus_schemas():
    req = BusCreateRequest(
        plate="DEF-456",
        model="Marcopolo G8",
        brand="Marcopolo",
        decks=2,
        capacity=52,
    )
    assert req.plate == "DEF-456"
    assert req.decks == 2

    res = BusResponse(
        id="b0000001-0000-0000-0000-000000000099",
        plate=req.plate,
        model=req.model,
        brand=req.brand,
        decks=req.decks,
        capacity=req.capacity,
        amenities={"wifi": True, "ac": True},
        status="ACTIVE",
    )
    assert res.decks == 2
    assert res.amenities["wifi"] is True
    print("✓ Bus schemas validated")


def test_routes_and_trips_schemas():
    route = RouteResponse(**DEFAULT_ROUTES[0])
    assert route.origin.startswith("Caracas")
    assert route.distance_km > 0

    trip = TripAdminResponse(**DEFAULT_TRIPS[0])
    assert trip.total_seats == 52
    assert trip.occupancy_pct >= 0
    print("✓ Route and Trip admin schemas validated")


if __name__ == "__main__":
    try:
        test_admin_stats_schema()
        test_bus_schemas()
        test_routes_and_trips_schemas()
        print("ALL ADMIN UNIT TESTS PASSED!")
    except Exception as e:
        print(f"FAILED: {e}")
        sys.exit(1)
