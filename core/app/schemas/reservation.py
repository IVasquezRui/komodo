from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class ReservationCreateRequest(BaseModel):
    """
    Payload required to confirm a seat reservation.
    Requires an idempotency_key to protect against network retries.
    """
    idempotency_key: UUID
    user_id: UUID
    seat_id: UUID
    trip_id: UUID
    amount_paid: float = Field(gt=0)
    currency: str = Field(default="USD", max_length=3)
    payment_method: str | None = None
    payment_reference: str | None = None
    offline_metadata: dict | None = None

    model_config = ConfigDict(strict=True)


class ReservationResponse(BaseModel):
    id: UUID
    user_id: UUID
    seat_id: UUID
    trip_id: UUID
    idempotency_key: UUID
    status: str
    sync_status: str
    amount_paid: float
    currency: str
    qr_code_data: str | None = None
    purchased_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
