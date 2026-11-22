from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.reservation import ReservationCreateRequest, ReservationResponse
from app.services.reservation_service import ReservationService

router = APIRouter()


@router.post(
    "/",
    response_model=ReservationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Confirm a seat reservation",
    description="Processes a ticket purchase with ACID guarantees and idempotency checks.",
)
async def create_reservation(
    request: ReservationCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Creates a new reservation.
    If the idempotency_key already exists, returns the existing reservation (200 OK)
    via the global IdempotencyConflictError handler.
    """
    reservation = await ReservationService.confirm_reservation(db, request)
    return reservation
