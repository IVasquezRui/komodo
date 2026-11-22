from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class TicketValidationRequest(BaseModel):
    qr_data: str = Field(min_length=5, description="Raw QR code payload string")
    trip_id: UUID | None = None
    driver_id: UUID | None = None
    offline_verified: bool = False

    model_config = ConfigDict(strict=False)


class TicketValidationResponse(BaseModel):
    status: str = Field(description="VALID | ALREADY_BOARDED | INVALID_SIGNATURE | NOT_FOUND")
    message: str
    passenger_name: str | None = None
    doc_number: str | None = None
    seat_number: int | None = None
    trip_id: str | None = None
    reservation_id: str | None = None
    boarded_at: datetime | None = None

    model_config = ConfigDict(strict=False)


class ManualBoardRequest(BaseModel):
    trip_id: UUID
    seat_number: int | None = None
    doc_number: str | None = None
    passenger_name: str | None = None


class TripManifestPassenger(BaseModel):
    seat_number: int
    full_name: str
    doc_type: str
    doc_number: str
    status: str  # CONFIRMED | BOARDED | NO_SHOW
    boarded_at: datetime | None = None

    model_config = ConfigDict(strict=False)


class TripManifestResponse(BaseModel):
    trip_id: UUID
    route_code: str
    origin: str
    destination: str
    departure_at: datetime
    bus_plate: str | None = None
    driver_name: str | None = None
    total_seats: int
    boarded_count: int
    pending_count: int
    passengers: list[TripManifestPassenger]

    model_config = ConfigDict(strict=False)
