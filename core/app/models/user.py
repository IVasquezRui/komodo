import uuid
from datetime import datetime
from typing import Annotated

from sqlalchemy import String, Boolean, DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


# Custom types for reusability
uuid_pk = Annotated[
    uuid.UUID,
    mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("uuid_generate_v4()"),
    ),
]
timestamp = Annotated[
    datetime,
    mapped_column(DateTime(timezone=True), server_default=text("NOW()")),
]


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid_pk]
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="passenger", server_default="passenger", index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"))
    
    created_at: Mapped[timestamp]
    updated_at: Mapped[timestamp]
