from decimal import Decimal
import uuid
from sqlalchemy import String, Boolean, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, INTERVAL
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import uuid_pk, timestamp


class Route(Base):
    __tablename__ = "routes"

    id: Mapped[uuid_pk]
    origin_terminal_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("terminals.id", ondelete="RESTRICT"), index=True)
    destination_terminal_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("terminals.id", ondelete="RESTRICT"), index=True)
    
    route_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    distance_km: Mapped[int] = mapped_column(Integer, nullable=False)
    base_price_usd: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    
    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]
    
    # Relationships
    origin_terminal = relationship("Terminal", foreign_keys=[origin_terminal_id])
    destination_terminal = relationship("Terminal", foreign_keys=[destination_terminal_id])
