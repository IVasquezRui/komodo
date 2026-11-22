import uuid
from sqlalchemy import String, SmallInteger, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import uuid_pk, timestamp


class Passenger(Base):
    __tablename__ = "passengers"

    id: Mapped[uuid_pk]
    reservation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("reservations.id", ondelete="CASCADE"), index=True
    )
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(20), default="V", server_default="V")
    doc_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    passenger_type: Mapped[str] = mapped_column(String(20), default="ADULT", server_default="ADULT")
    seat_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    emergency_contact: Mapped[str | None] = mapped_column(String(100))

    created_at: Mapped[timestamp]

    # Relationships
    reservation = relationship("Reservation", back_populates="passengers")
