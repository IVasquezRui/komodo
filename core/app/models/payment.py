from decimal import Decimal
import uuid
from sqlalchemy import String, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import uuid_pk, timestamp


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid_pk]
    reservation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("reservations.id", ondelete="SET NULL"), index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    provider: Mapped[str] = mapped_column(String(30), nullable=False)  # STRIPE, PAGO_MOVIL, TRANSFER, CASH
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", server_default="USD")
    reference: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", server_default="PENDING", index=True)
    payment_metadata: Mapped[dict] = mapped_column(JSONB, default=dict, server_default="'{}'::jsonb")

    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]

    # Relationships
    reservation = relationship("Reservation", back_populates="payments")
    user = relationship("User")
