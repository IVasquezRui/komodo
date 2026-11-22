import uuid
from sqlalchemy import String, SmallInteger
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import uuid_pk, timestamp


class Bus(Base):
    __tablename__ = "buses"

    id: Mapped[uuid_pk]
    plate: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    brand: Mapped[str] = mapped_column(String(100), default="Marcopolo", server_default="Marcopolo")
    decks: Mapped[int] = mapped_column(SmallInteger, default=1, server_default="1")
    amenities: Mapped[dict] = mapped_column(
        JSONB,
        default=lambda: {"wifi": True, "ac": True, "bath": True, "usb": True},
        server_default='{"wifi": true, "ac": true, "bath": true, "usb": true}',
    )
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE", server_default="ACTIVE", index=True)

    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]

    # Relationships
    trips = relationship("Trip", back_populates="bus")
