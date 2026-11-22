from datetime import datetime
import uuid
from sqlalchemy import String, Integer, SmallInteger, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import uuid_pk, timestamp


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[uuid_pk]
    route_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("routes.id", ondelete="RESTRICT"), index=True)
    
    departure_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    arrival_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    bus_plate: Mapped[str | None] = mapped_column(String(20))
    driver_name: Mapped[str | None] = mapped_column(String(200))
    
    status: Mapped[str] = mapped_column(String(20), default="SCHEDULED", server_default="SCHEDULED", index=True)
    total_seats: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    available_seats: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    
    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]
    
    # Relationships
    route = relationship("Route")
    seats = relationship("Seat", back_populates="trip", lazy="selectin")
