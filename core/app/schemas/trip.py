from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class TripResponse(BaseModel):
    id: UUID
    route_id: UUID
    departure_at: datetime
    arrival_at: datetime
    bus_plate: str | None = None
    driver_name: str | None = None
    status: str
    total_seats: int
    available_seats: int

    model_config = ConfigDict(from_attributes=True)


class SeatResponse(BaseModel):
    id: UUID
    trip_id: UUID
    seat_number: int
    seat_type: str
    status: str
    price_override: float | None = None

    model_config = ConfigDict(from_attributes=True)


class TripWithSeatsResponse(TripResponse):
    seats: list[SeatResponse] = Field(default_factory=list)
