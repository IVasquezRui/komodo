"""
FastAPI Core Application — Entry Point

The transactional brain of the bus platform.
Handles business logic, ACID transactions, and data integrity.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine
from app.exceptions import register_exception_handlers

# ---- Logging ----
logging.basicConfig(
    level=getattr(logging, settings.core_log_level.upper()),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("komodo.core")


# ---- Lifespan (startup / shutdown) ----
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application lifecycle:
    - Startup: verify DB connection
    - Shutdown: dispose connection pool cleanly
    """
    logger.info("Starting BusPlatform Core...")
    logger.info("Database: %s@%s/%s", settings.postgres_user, settings.postgres_host, settings.postgres_db)

    # Verify DB connectivity on startup
    try:
        async with engine.begin() as conn:
            await conn.execute(
                __import__("sqlalchemy").text("SELECT 1")
            )
        logger.info("✓ PostgreSQL connection verified")
    except Exception as e:
        logger.error("✗ PostgreSQL connection failed: %s", e)
        # Don't crash — the app will retry on first request
        # This handles the case where PostgreSQL is still starting

    yield  # Application runs here

    # Shutdown
    logger.info("Shutting down Core...")
    await engine.dispose()
    logger.info("✓ Database connections closed")


# ---- Application Factory ----
app = FastAPI(
    title="BusPlatform Core API",
    description=(
        "Transactional core for the ultra-resilient bus ticket platform. "
        "Handles ACID transactions, seat reservations, and data integrity."
    ),
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.core_debug else None,
    redoc_url="/redoc" if settings.core_debug else None,
)

# ---- CORS ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Register Global Exception Handlers ----
register_exception_handlers(app)


# ---- Health Check ----
@app.get("/health", tags=["system"])
async def health_check():
    """
    Health endpoint for Docker healthchecks and load balancers.
    Checks PostgreSQL connectivity.
    """
    db_status = "unknown"
    try:
        async with engine.begin() as conn:
            await conn.execute(
                __import__("sqlalchemy").text("SELECT 1")
            )
            db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "service": "core",
        "database": db_status,
    }


# ---- Routers ----
from app.routers import admin, auth, payments, reservations, tickets, trips
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"])
app.include_router(tickets.router, prefix="/api/v1/tickets", tags=["tickets"])
app.include_router(reservations.router, prefix="/api/v1/reservations", tags=["reservations"])
app.include_router(trips.router, prefix="/api/v1/trips", tags=["trips"])
