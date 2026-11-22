from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.user import uuid_pk, timestamp


class Terminal(Base):
    __tablename__ = "terminals"

    id: Mapped[uuid_pk]
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    city: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    state: Mapped[str | None] = mapped_column(String(100))
    country: Mapped[str] = mapped_column(String(3), default="VEN", server_default="VEN", index=True)
    address: Mapped[str | None]
    
    # We leave PostGIS location as string in ORM for simple reads, or use GeoAlchemy2 for full support
    # Since Gateway handles geospatial search, we'll keep it simple here.
    timezone: Mapped[str] = mapped_column(String(50), default="America/Caracas", server_default="America/Caracas")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))
    
    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]
