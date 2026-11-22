from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class PassengerCreateSchema(BaseModel):
    full_name: str = Field(min_length=2, max_length=200)
    doc_type: str = Field(default="V", pattern="^(V|E|J|P|DNI)$")
    doc_number: str = Field(min_length=3, max_length=50)
    passenger_type: str = Field(default="ADULT", pattern="^(ADULT|CHILD|SENIOR)$")
    seat_number: int = Field(ge=1, le=100)
    emergency_contact: str | None = Field(default=None, max_length=100)

    model_config = ConfigDict(strict=False)


class PassengerResponse(BaseModel):
    id: UUID
    reservation_id: UUID
    full_name: str
    doc_type: str
    doc_number: str
    passenger_type: str
    seat_number: int
    emergency_contact: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentCreateRequest(BaseModel):
    reservation_id: UUID | None = None
    provider: str = Field(pattern="^(STRIPE|PAGO_MOVIL|TRANSFER|CASH)$")
    amount: float = Field(gt=0)
    currency: str = Field(default="USD", max_length=3)
    reference: str = Field(min_length=4, max_length=100)
    phone_number: str | None = Field(default=None, max_length=20)
    bank_code: str | None = Field(default=None, max_length=10)
    payment_metadata: dict | None = None

    model_config = ConfigDict(strict=False)


class PaymentResponse(BaseModel):
    id: UUID
    reservation_id: UUID | None = None
    user_id: UUID | None = None
    provider: str
    amount: float
    currency: str
    reference: str
    status: str
    payment_metadata: dict | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentWebhookRequest(BaseModel):
    provider: str = Field(pattern="^(STRIPE|PAGO_MOVIL|TRANSFER)$")
    event: str
    reference: str
    status: str = Field(default="CONFIRMED", pattern="^(CONFIRMED|FAILED|REFUNDED)$")
    raw_payload: dict | None = None


class PaymentRefundRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=255)
