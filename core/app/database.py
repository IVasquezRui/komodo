"""
Database module — Async SQLAlchemy engine and session management.

DESIGN NOTES:
- Uses asyncpg driver for non-blocking I/O (crucial for handling
  slow network conditions without blocking the event loop).
- Pool size is conservative (10 + 5 overflow) to avoid exhausting
  connections on budget PostgreSQL instances.
- Connection recycling every 30 minutes prevents stale connections
  from network interruptions.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


# ---- Engine ----
engine = create_async_engine(
    settings.database_url,
    echo=settings.core_debug,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_timeout=settings.db_pool_timeout,
    pool_recycle=settings.db_pool_recycle,
    pool_pre_ping=True,  # Verify connections are alive before use
)

# ---- Session Factory ----
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Prevent lazy-load issues after commit
)


# ---- Base Model ----
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


# ---- Dependency Injection ----
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides an async database session.
    The session is automatically committed on success and rolled back
    on any exception. Always closed at the end.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
