from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.trip import Trip
from app.schemas.trip import TripWithSeatsResponse

router = APIRouter()


@router.get(
    "/{trip_id}",
    response_model=TripWithSeatsResponse,
    summary="Get trip details and seat map",
)
async def get_trip(
    trip_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Fetches a trip and its associated seats.
    This endpoint is called by the Go Gateway when it experiences a cache miss in Redis.
    """
    stmt = (
        select(Trip)
        .options(selectinload(Trip.seats))
        .where(Trip.id == trip_id)
    )
    result = await db.execute(stmt)
    trip = result.scalar_one_or_none()
    
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Trip not found"
        )
        
    return trip
