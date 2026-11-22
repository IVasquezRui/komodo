from decimal import Decimal
import uuid
from sqlalchemy import String, Numeric, ForeignKey, ForeignKeyConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import uuid_pk, timestamp


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[uuid_pk]
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), index=True)
    seat_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    trip_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    
    # Core resilience mechanism
    idempotency_key: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), unique=True, index=True, nullable=False)
    
    status: Mapped[str] = mapped_column(String(20), default="PENDING", server_default="PENDING", index=True)
    sync_status: Mapped[str] = mapped_column(String(20), default="PENDING", server_default="PENDING", index=True)
    
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", server_default="USD")
    payment_method: Mapped[str | None] = mapped_column(String(50))
    payment_reference: Mapped[str | None] = mapped_column(String(255))
    
    qr_code_data: Mapped[str | None]
    offline_metadata: Mapped[dict | None] = mapped_column(JSONB)
    
    purchased_at: Mapped[timestamp | None]
    synced_at: Mapped[timestamp | None]
    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]
    
    # Relationships
    user = relationship("User")
    seat = relationship("Seat")
    trip = relationship("Trip")
    passengers = relationship("Passenger", back_populates="reservation", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="reservation")
    
    __table_args__ = (
        ForeignKeyConstraint(
            ['seat_id', 'trip_id'],
            ['seats.id', 'seats.trip_id'],
            ondelete='RESTRICT'
        ),
    )
