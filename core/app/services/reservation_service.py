from datetime import datetime, timezone
import json
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.models.reservation import Reservation
from app.models.seat import Seat
from app.models.trip import Trip
from app.schemas.reservation import ReservationCreateRequest
from app.exceptions import SeatNotAvailableError, IdempotencyConflictError, TripNotFoundError


class ReservationService:
    @staticmethod
    async def confirm_reservation(
        session: AsyncSession, request: ReservationCreateRequest
    ) -> Reservation:
        """
        Processes a ticket purchase with absolute ACID guarantees.
        
        RESILIENCE MECHANISMS:
        1. Idempotency Check: If the same idempotency_key is sent twice (e.g. 
           due to a 3G network drop where the client didn't get the first response),
           we return the existing reservation instead of charging again.
        2. Row-Level Locking: We lock the specific seat row with FOR UPDATE NOWAIT.
           If two users try to buy the exact same seat at the exact same millisecond,
           one will get the lock, and the other will immediately fail (no deadlocks).
        """
        
        # 1. Check idempotency first
        stmt = select(Reservation).where(Reservation.idempotency_key == request.idempotency_key)
        result = await session.execute(stmt)
        existing_reservation = result.scalar_one_or_none()
        
        if existing_reservation:
            # Client retried a successful request. Raise the custom exception
            # which our global handler turns into a 200 OK.
            # We serialize to dict for the exception handler
            raise IdempotencyConflictError({
                "id": str(existing_reservation.id),
                "idempotency_key": str(existing_reservation.idempotency_key),
                "status": existing_reservation.status,
                "amount_paid": float(existing_reservation.amount_paid),
                "seat_id": str(existing_reservation.seat_id),
            })

        # 2. Lock the seat (FOR UPDATE NOWAIT)
        # If the seat is already locked by another transaction, this immediately raises an error
        try:
            seat_stmt = (
                select(Seat)
                .where(Seat.id == request.seat_id)
                .with_for_update(nowait=True)
            )
            seat_result = await session.execute(seat_stmt)
            seat = seat_result.scalar_one_or_none()
        except Exception as e:
            # OperationalError (could not obtain lock)
            raise SeatNotAvailableError(str(request.seat_id), "LOCKED_BY_OTHER_TX")

        if not seat:
            raise SeatNotAvailableError(str(request.seat_id), "NOT_FOUND")

        if seat.status != "AVAILABLE":
            raise SeatNotAvailableError(str(request.seat_id), seat.status)
            
        if seat.trip_id != request.trip_id:
            raise SeatNotAvailableError(str(request.seat_id), "BELONGS_TO_DIFFERENT_TRIP")

        # 3. Decrement available seats in trip
        trip_stmt = (
            select(Trip)
            .where(Trip.id == request.trip_id)
            .with_for_update()
        )
        trip_result = await session.execute(trip_stmt)
        trip = trip_result.scalar_one_or_none()
        
        if not trip:
            raise TripNotFoundError(str(request.trip_id))
            
        if trip.available_seats <= 0:
            raise SeatNotAvailableError(str(request.seat_id), "TRIP_FULL")

        # 4. Apply changes
        seat.status = "SOLD"
        trip.available_seats -= 1
        
        # Generate QR code payload (this allows the mobile app to show it offline)
        qr_payload = {
            "r_id": str(request.idempotency_key),
            "t_id": str(request.trip_id),
            "s": seat.seat_number,
        }

        reservation = Reservation(
            idempotency_key=request.idempotency_key,
            user_id=request.user_id,
            seat_id=request.seat_id,
            trip_id=request.trip_id,
            status="CONFIRMED",
            sync_status="SYNCED",
            amount_paid=request.amount_paid,
            currency=request.currency,
            payment_method=request.payment_method,
            payment_reference=request.payment_reference,
            offline_metadata=request.offline_metadata,
            qr_code_data=json.dumps(qr_payload),
            purchased_at=datetime.now(timezone.utc),
            synced_at=datetime.now(timezone.utc),
        )

        session.add(reservation)
        
        try:
            # We don't commit here, the dependency injection `yield session; await session.commit()` handles it
            await session.flush()
        except IntegrityError:
            # Belt and suspenders: if the DB unique constraint on idempotency_key triggers
            raise IdempotencyConflictError({"idempotency_key": str(request.idempotency_key)})

        return reservation
