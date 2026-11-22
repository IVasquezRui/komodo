from decimal import Decimal
import logging
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment
from app.models.reservation import Reservation
from app.models.seat import Seat
from app.models.trip import Trip
from app.schemas.payment import PaymentCreateRequest

logger = logging.getLogger("komodo.payments")


class PaymentService:
    @staticmethod
    async def create_or_verify_payment(
        request: PaymentCreateRequest,
        user_id: uuid.UUID | None,
        db: AsyncSession,
    ) -> Payment:
        """
        Creates and processes a payment record.
        If associated with a reservation, confirms the reservation status and assigns payment references.
        """
        # Check if reference was already registered
        stmt = select(Payment).where(Payment.reference == request.reference)
        result = await db.execute(stmt)
        existing_payment = result.scalar_one_or_none()

        if existing_payment:
            logger.info("Payment reference %s already exists. Returning existing payment.", request.reference)
            return existing_payment

        # Determine payment status based on provider
        # Stripe and Pago Móvil in this flow confirm on valid reference
        payment_status = "CONFIRMED" if request.provider in ("STRIPE", "PAGO_MOVIL", "CASH") else "PENDING"

        metadata = request.payment_metadata or {}
        if request.phone_number:
            metadata["phone_number"] = request.phone_number
        if request.bank_code:
            metadata["bank_code"] = request.bank_code

        new_payment = Payment(
            reservation_id=request.reservation_id,
            user_id=user_id,
            provider=request.provider,
            amount=Decimal(str(request.amount)),
            currency=request.currency,
            reference=request.reference,
            status=payment_status,
            payment_metadata=metadata,
        )

        db.add(new_payment)

        # Update reservation if supplied
        if request.reservation_id:
            res_stmt = select(Reservation).where(Reservation.id == request.reservation_id)
            res_res = await db.execute(res_stmt)
            reservation = res_res.scalar_one_or_none()

            if reservation:
                reservation.payment_method = request.provider
                reservation.payment_reference = request.reference
                if payment_status == "CONFIRMED":
                    reservation.status = "CONFIRMED"
                    reservation.sync_status = "SYNCED"

        await db.commit()
        await db.refresh(new_payment)
        return new_payment

    @staticmethod
    async def refund_payment(
        payment_id: uuid.UUID,
        reason: str,
        db: AsyncSession,
    ) -> Payment:
        """
        Processes a refund for a confirmed payment and frees the reserved seat.
        """
        stmt = select(Payment).where(Payment.id == payment_id)
        result = await db.execute(stmt)
        payment = result.scalar_one_or_none()

        if not payment:
            raise ValueError(f"Payment with ID {payment_id} not found")

        payment.status = "REFUNDED"
        meta = dict(payment.payment_metadata or {})
        meta["refund_reason"] = reason
        payment.payment_metadata = meta

        # Free associated reservation and seat if exists
        if payment.reservation_id:
            res_stmt = select(Reservation).where(Reservation.id == payment.reservation_id)
            res_res = await db.execute(res_stmt)
            reservation = res_res.scalar_one_or_none()

            if reservation:
                reservation.status = "REFUNDED"
                
                # Free the seat
                seat_stmt = select(Seat).where(Seat.id == reservation.seat_id)
                seat_res = await db.execute(seat_stmt)
                seat = seat_res.scalar_one_or_none()
                if seat:
                    seat.status = "AVAILABLE"

                # Increment available seats on the trip
                trip_stmt = select(Trip).where(Trip.id == reservation.trip_id)
                trip_res = await db.execute(trip_stmt)
                trip = trip_res.scalar_one_or_none()
                if trip:
                    trip.available_seats += 1

        await db.commit()
        await db.refresh(payment)
        return payment
