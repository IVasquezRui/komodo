"""
Pydantic Schemas and DTOs for Admin & Backoffice (Phase 8)
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class AdminStatsResponse(BaseModel):
    total_revenue: float
    currency: str = "USD"
    occupancy_rate: float
    total_passengers: int
    active_trips: int
    fleet_total: int
    fleet_active: int
    tickets_sold_today: int


class BusCreateRequest(BaseModel):
    plate: str = Field(..., example="ABC-123")
    model: str = Field(..., example="Marcopolo Paradiso G8 1800 DD")
    brand: str = Field(default="Marcopolo")
    decks: int = Field(default=1, ge=1, le=2)
    capacity: int = Field(default=40, ge=10, le=90)
    amenities: Optional[dict] = Field(
        default_factory=lambda: {"wifi": True, "ac": True, "bath": True, "usb": True}
    )
    status: str = Field(default="ACTIVE")


class BusResponse(BaseModel):
    id: str
    plate: str
    model: str
    brand: str
    decks: int
    capacity: int = 40
    amenities: dict
    status: str
    created_at: Optional[str] = None


class RouteCreateRequest(BaseModel):
    origin: str = Field(..., example="Caracas")
    destination: str = Field(..., example="Maracaibo")
    distance_km: float = Field(..., example=680.5)
    estimated_hours: float = Field(..., example=9.5)
    base_price: float = Field(..., example=35.0)


class RouteResponse(BaseModel):
    id: str
    origin: str
    destination: str
    distance_km: float
    estimated_hours: float
    base_price: float
    active_trips: int = 0


class TripCreateRequest(BaseModel):
    route_id: str
    bus_plate: str
    driver_name: str
    departure_time: str
    arrival_time: str
    base_price: float = 35.0


class TripAdminResponse(BaseModel):
    id: str
    route_name: str
    origin: str
    destination: str
    bus_plate: str
    bus_model: str
    driver_name: str
    departure_time: str
    arrival_time: str
    status: str
    total_seats: int
    booked_seats: int
    occupancy_pct: int
    base_price: float


# ---- In-Memory / Default Seed Data for Resilient Standalone Mode ----
DEFAULT_BUSES = [
    {
        "id": "b0000001-0000-0000-0000-000000000001",
        "plate": "ABC-123",
        "model": "Marcopolo Paradiso G8 1800 DD",
        "brand": "Marcopolo",
        "decks": 2,
        "capacity": 52,
        "amenities": {"wifi": True, "ac": True, "bath": True, "usb": True, "recline_180": True},
        "status": "ACTIVE",
        "created_at": "2026-01-10T08:00:00Z",
    },
    {
        "id": "b0000001-0000-0000-0000-000000000002",
        "plate": "XYZ-789",
        "model": "Irizar i8 High-End",
        "brand": "Irizar",
        "decks": 1,
        "capacity": 44,
        "amenities": {"wifi": True, "ac": True, "bath": True, "usb": True},
        "status": "ACTIVE",
        "created_at": "2026-01-15T09:30:00Z",
    },
    {
        "id": "b0000001-0000-0000-0000-000000000003",
        "plate": "VNZ-554",
        "model": "Yutong ZK6129H Executive",
        "brand": "Yutong",
        "decks": 1,
        "capacity": 42,
        "amenities": {"wifi": False, "ac": True, "bath": True, "usb": True},
        "status": "MAINTENANCE",
        "created_at": "2026-02-01T11:00:00Z",
    },
]

DEFAULT_ROUTES = [
    {
        "id": "r0000001-0000-0000-0000-000000000001",
        "origin": "Caracas (Terminal La Bandera)",
        "destination": "Maracaibo (Terminal Central)",
        "distance_km": 685.0,
        "estimated_hours": 9.5,
        "base_price": 35.0,
        "active_trips": 4,
    },
    {
        "id": "r0000001-0000-0000-0000-000000000002",
        "origin": "Caracas (Terminal Oriente)",
        "destination": "Puerto La Cruz (Terminal Rodoviario)",
        "distance_km": 320.0,
        "estimated_hours": 4.5,
        "base_price": 20.0,
        "active_trips": 6,
    },
    {
        "id": "r0000001-0000-0000-0000-000000000003",
        "origin": "Valencia (Terminal Big Low)",
        "destination": "San Cristóbal (Terminal La Concordia)",
        "distance_km": 640.0,
        "estimated_hours": 10.0,
        "base_price": 40.0,
        "active_trips": 2,
    },
]

DEFAULT_TRIPS = [
    {
        "id": "a0000001-0000-0000-0000-000000000001",
        "route_name": "Caracas → Maracaibo",
        "origin": "Caracas",
        "destination": "Maracaibo",
        "bus_plate": "ABC-123",
        "bus_model": "Marcopolo G8 DD",
        "driver_name": "Ramón Gómez",
        "departure_time": "2026-11-22T20:00:00Z",
        "arrival_time": "2026-11-23T05:30:00Z",
        "status": "SCHEDULED",
        "total_seats": 52,
        "booked_seats": 44,
        "occupancy_pct": 85,
        "base_price": 35.0,
    },
    {
        "id": "a0000001-0000-0000-0000-000000000002",
        "route_name": "Caracas → Puerto La Cruz",
        "origin": "Caracas",
        "destination": "Puerto La Cruz",
        "bus_plate": "XYZ-789",
        "bus_model": "Irizar i8",
        "driver_name": "Franklin Mendoza",
        "departure_time": "2026-11-22T18:30:00Z",
        "arrival_time": "2026-11-22T23:00:00Z",
        "status": "BOARDING",
        "total_seats": 44,
        "booked_seats": 41,
        "occupancy_pct": 93,
        "base_price": 20.0,
    },
]
