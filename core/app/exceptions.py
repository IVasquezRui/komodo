"""
Global Exception Handlers — Ensures the server NEVER returns raw 500 errors.

Every exception type maps to a clean, structured JSON response.
The server process survives all errors — no unhandled crashes.
"""

import logging
import traceback
import uuid

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import DBAPIError, IntegrityError, OperationalError

logger = logging.getLogger("komodo.exceptions")


# ---- Custom Business Exceptions ----

class SeatNotAvailableError(Exception):
    """Raised when a seat is already sold or held by another user."""

    def __init__(self, seat_id: str, current_status: str = "unknown"):
        self.seat_id = seat_id
        self.current_status = current_status
        super().__init__(f"Seat {seat_id} is {current_status}")


class IdempotencyConflictError(Exception):
    """Raised when a duplicate idempotency_key is detected.
    This is NOT an error — it means the client is retrying a successful request.
    """

    def __init__(self, existing_reservation: dict):
        self.existing_reservation = existing_reservation
        super().__init__("Idempotency key already exists")


class TripNotFoundError(Exception):
    """Raised when a trip ID doesn't exist or is not available."""

    def __init__(self, trip_id: str):
        self.trip_id = trip_id
        super().__init__(f"Trip {trip_id} not found")


class InsufficientFundsError(Exception):
    """Raised when payment cannot be processed."""
    pass


class InvalidCredentialsError(Exception):
    """Raised when login credentials do not match."""
    pass


class UserAlreadyExistsError(Exception):
    """Raised when registering a phone number or email that already exists."""
    pass


class UnauthorizedError(Exception):
    """Raised when authentication token is missing, invalid or expired."""
    def __init__(self, message: str = "Authentication required"):
        self.message = message
        super().__init__(message)


class ForbiddenError(Exception):
    """Raised when user lacks required role or permissions."""
    def __init__(self, message: str = "Access forbidden"):
        self.message = message
        super().__init__(message)


# ---- Standard Error Response ----

def _error_response(
    status_code: int,
    error_code: str,
    message: str,
    details: list | dict | None = None,
    request_id: str | None = None,
    retry_after: int | None = None,
) -> JSONResponse:
    """Build a standardized error JSON response."""
    body: dict = {
        "error": error_code,
        "message": message,
    }
    if details is not None:
        body["details"] = details
    if request_id:
        body["request_id"] = request_id
    if retry_after is not None:
        body["retry_after"] = retry_after

    return JSONResponse(status_code=status_code, content=body)


# ---- Register All Handlers ----

def register_exception_handlers(app: FastAPI) -> None:
    """Register all global exception handlers on the FastAPI application."""

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Pydantic/FastAPI validation errors → 422 with field-level details."""
        return _error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            message="The request payload contains invalid data.",
            details=[
                {
                    "field": " → ".join(str(loc) for loc in err["loc"]),
                    "message": err["msg"],
                    "type": err["type"],
                }
                for err in exc.errors()
            ],
        )

    @app.exception_handler(ValidationError)
    async def pydantic_validation_handler(
        request: Request, exc: ValidationError
    ) -> JSONResponse:
        """Raw Pydantic v2 validation errors (not from FastAPI)."""
        return _error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            message="Data validation failed.",
            details=[
                {
                    "field": " → ".join(str(loc) for loc in err["loc"]),
                    "message": err["msg"],
                }
                for err in exc.errors()
            ],
        )

    @app.exception_handler(SeatNotAvailableError)
    async def seat_conflict_handler(
        request: Request, exc: SeatNotAvailableError
    ) -> JSONResponse:
        """Seat already sold or held → 409 Conflict."""
        return _error_response(
            status_code=status.HTTP_409_CONFLICT,
            error_code="SEAT_CONFLICT",
            message=f"Seat is currently {exc.current_status} and cannot be reserved.",
            details={"seat_id": exc.seat_id, "current_status": exc.current_status},
        )

    @app.exception_handler(IdempotencyConflictError)
    async def idempotency_handler(
        request: Request, exc: IdempotencyConflictError
    ) -> JSONResponse:
        """Duplicate request detected → return the existing reservation (200 OK).
        This is the KEY resilience mechanism for network retries.
        """
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "already_processed",
                "message": "This request was already processed successfully.",
                "reservation": exc.existing_reservation,
            },
        )

    @app.exception_handler(TripNotFoundError)
    async def trip_not_found_handler(
        request: Request, exc: TripNotFoundError
    ) -> JSONResponse:
        return _error_response(
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="TRIP_NOT_FOUND",
            message=f"Trip {exc.trip_id} does not exist or is no longer available.",
        )

    @app.exception_handler(InvalidCredentialsError)
    async def invalid_credentials_handler(
        request: Request, exc: InvalidCredentialsError
    ) -> JSONResponse:
        return _error_response(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="INVALID_CREDENTIALS",
            message="Invalid phone/email or password.",
        )

    @app.exception_handler(UserAlreadyExistsError)
    async def user_exists_handler(
        request: Request, exc: UserAlreadyExistsError
    ) -> JSONResponse:
        return _error_response(
            status_code=status.HTTP_409_CONFLICT,
            error_code="USER_ALREADY_EXISTS",
            message=str(exc) or "User with this phone number or email already exists.",
        )

    @app.exception_handler(UnauthorizedError)
    async def unauthorized_handler(
        request: Request, exc: UnauthorizedError
    ) -> JSONResponse:
        return _error_response(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED",
            message=exc.message,
        )

    @app.exception_handler(ForbiddenError)
    async def forbidden_handler(
        request: Request, exc: ForbiddenError
    ) -> JSONResponse:
        return _error_response(
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="FORBIDDEN",
            message=exc.message,
        )

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(
        request: Request, exc: IntegrityError
    ) -> JSONResponse:
        """Database constraint violation (unique, FK, check)."""
        logger.warning("IntegrityError: %s", exc.orig)
        return _error_response(
            status_code=status.HTTP_409_CONFLICT,
            error_code="DATA_CONFLICT",
            message="The operation conflicts with existing data.",
        )

    @app.exception_handler(OperationalError)
    async def operational_error_handler(
        request: Request, exc: OperationalError
    ) -> JSONResponse:
        """Database connection issues → 503 with retry hint."""
        logger.error("Database operational error: %s", exc.orig)
        return _error_response(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="DB_UNAVAILABLE",
            message="Database is temporarily unavailable. Please retry.",
            retry_after=3,
        )

    @app.exception_handler(DBAPIError)
    async def dbapi_error_handler(
        request: Request, exc: DBAPIError
    ) -> JSONResponse:
        """Generic DB errors (deadlock, timeout, etc.) → 503."""
        logger.error("DBAPI error: %s", exc.orig)
        return _error_response(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="DB_BUSY",
            message="The database is under heavy load. Please retry shortly.",
            retry_after=2,
        )

    @app.exception_handler(Exception)
    async def catch_all_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """
        CATCH-ALL: Every unhandled exception is caught here.
        - Logs the full traceback internally (for debugging)
        - Returns a clean JSON with a request_id (for support tickets)
        - The server process NEVER crashes from this
        """
        request_id = str(uuid.uuid4())[:8]
        logger.critical(
            "Unhandled exception [request_id=%s]: %s\n%s",
            request_id,
            str(exc),
            traceback.format_exc(),
        )
        return _error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="INTERNAL_ERROR",
            message="An unexpected error occurred. Please contact support with the request_id.",
            request_id=request_id,
        )
