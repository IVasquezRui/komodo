import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.payment import Payment
from app.models.user import User
from app.dependencies import get_current_user
from app.schemas.payment import (
    PaymentCreateRequest,
    PaymentRefundRequest,
    PaymentResponse,
    PaymentWebhookRequest,
)
from app.services.payment_service import PaymentService

router = APIRouter()


@router.post(
    "/create",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Process or register a commercial payment",
)
async def create_payment(
    request: PaymentCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Processes a payment (Stripe, Pago Móvil, Transfer, Cash).
    Confirms the associated reservation if reservation_id is provided.
    """
    payment = await PaymentService.create_or_verify_payment(request, user_id=None, db=db)
    return PaymentResponse.model_validate(payment)


@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
    status_code=status.HTTP_200_OK,
    summary="Get payment details by ID",
)
async def get_payment(
    payment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Retrieves payment details."""
    stmt = select(Payment).where(Payment.id == payment_id)
    result = await db.execute(stmt)
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with ID {payment_id} not found",
        )

    return PaymentResponse.model_validate(payment)


@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
    summary="Handle external payment gateway webhook",
)
async def payment_webhook(
    request: PaymentWebhookRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Webhook receiver for asynchronous payment confirmations (e.g. Stripe, bank reconciliation).
    """
    stmt = select(Payment).where(Payment.reference == request.reference)
    result = await db.execute(stmt)
    payment = result.scalar_one_or_none()

    if payment:
        payment.status = request.status
        meta = dict(payment.payment_metadata or {})
        meta["webhook_event"] = request.event
        if request.raw_payload:
            meta["webhook_payload"] = request.raw_payload
        payment.payment_metadata = meta
        await db.commit()
        return {"status": "success", "message": f"Payment {payment.id} updated to {request.status}"}

    return {"status": "ignored", "message": f"Reference {request.reference} not found"}


@router.post(
    "/{payment_id}/refund",
    response_model=PaymentResponse,
    status_code=status.HTTP_200_OK,
    summary="Refund a confirmed payment and release associated seat",
)
async def refund_payment(
    payment_id: uuid.UUID,
    request: PaymentRefundRequest,
    db: AsyncSession = Depends(get_db),
):
    """Refunds payment and returns the seat to AVAILABLE status."""
    try:
        payment = await PaymentService.refund_payment(payment_id, request.reason, db)
        return PaymentResponse.model_validate(payment)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
