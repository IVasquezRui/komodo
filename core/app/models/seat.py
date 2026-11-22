from decimal import Decimal
import uuid
from sqlalchemy import String, SmallInteger, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import uuid_pk, timestamp


class Seat(Base):
    __tablename__ = "seats"

    id: Mapped[uuid_pk]
    trip_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), index=True)
    
    seat_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    deck_number: Mapped[int] = mapped_column(SmallInteger, default=1, server_default="1")
    seat_type: Mapped[str] = mapped_column(String(20), default="STANDARD", server_default="STANDARD")
    status: Mapped[str] = mapped_column(String(20), default="AVAILABLE", server_default="AVAILABLE", index=True)
    price_override: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    
    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]
    
    # Relationships
    trip = relationship("Trip", back_populates="seats")
