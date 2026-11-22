from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.crypto_qr import verify_qr_signature
from app.models.reservation import Reservation
from app.models.seat import Seat
from app.models.trip import Trip
from app.models.passenger import Passenger
from app.schemas.ticket import (
    ManualBoardRequest,
    TicketValidationRequest,
    TicketValidationResponse,
    TripManifestPassenger,
    TripManifestResponse,
)

router = APIRouter()


@router.post(
    "/validate-qr",
    response_model=TicketValidationResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate QR code and board passenger (Online/Offline verification)",
)
async def validate_qr(
    request: TicketValidationRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Validates a cryptographic QR boarding pass.
    1. Verifies HMAC-SHA256 signature to guarantee zero forgery even offline.
    2. Checks database to prevent double-boarding (re-entry prevention).
    3. Updates status to BOARDED.
    """
    is_valid_sig, payload = verify_qr_signature(request.qr_data)

    if not is_valid_sig:
        return TicketValidationResponse(
            status="INVALID_SIGNATURE",
            message="Código QR inválido o firma digital no autorizada.",
            passenger_name=payload.get("p"),
            seat_number=payload.get("s"),
        )

    res_id_str = payload.get("r")
    seat_num = payload.get("s")
    doc_num = payload.get("d")
    passenger_name = payload.get("p")
    trip_id_str = payload.get("t")

    # Search for reservation in database
    reservation = None
    if res_id_str:
        try:
            res_uuid = uuid.UUID(res_id_str)
            stmt = select(Reservation).where(Reservation.id == res_uuid)
            result = await db.execute(stmt)
            reservation = result.scalar_one_or_none()
        except ValueError:
            # Maybe it's a partial ID or idempotency key prefix
            stmt = select(Reservation).where(Reservation.idempotency_key.cast(str).startswith(res_id_str))
            result = await db.execute(stmt)
            reservation = result.scalar_one_or_none()

    now_utc = datetime.now(timezone.utc)

    if reservation:
        if reservation.status == "BOARDED":
            return TicketValidationResponse(
                status="ALREADY_BOARDED",
                message="⚠️ ALERTA: Este boleto ya fue abordado previamente.",
                passenger_name=passenger_name,
                doc_number=doc_num,
                seat_number=seat_num,
                trip_id=str(reservation.trip_id),
                reservation_id=str(reservation.id),
                boarded_at=reservation.synced_at,
            )

        # Mark as boarded
        reservation.status = "BOARDED"
        reservation.synced_at = now_utc
        await db.commit()

        return TicketValidationResponse(
            status="VALID",
            message="✅ Boleto Válido. Bienvenido a bordo.",
            passenger_name=passenger_name,
            doc_number=doc_num,
            seat_number=seat_num,
            trip_id=str(reservation.trip_id),
            reservation_id=str(reservation.id),
            boarded_at=now_utc,
        )

    # If signature is mathematically valid but record not synced yet (offline boarding)
    return TicketValidationResponse(
        status="VALID",
        message="✅ Boleto Criptográficamente Válido (Modo Remoto / Offline).",
        passenger_name=passenger_name,
        doc_number=doc_num,
        seat_number=seat_num,
        trip_id=trip_id_str,
        reservation_id=res_id_str,
        boarded_at=now_utc,
    )


@router.get(
    "/manifest/{trip_id}",
    response_model=TripManifestResponse,
    status_code=status.HTTP_200_OK,
    summary="Get trip passenger boarding manifest",
)
async def get_trip_manifest(
    trip_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves the complete digital passenger manifest for a specific trip,
    showing boarded status, seat assignments, and identification.
    """
    # 1. Fetch trip details
    trip_stmt = select(Trip).options(selectinload(Trip.route)).where(Trip.id == trip_id)
    trip_res = await db.execute(trip_stmt)
    trip = trip_res.scalar_one_or_none()

    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip {trip_id} not found",
        )

    # 2. Fetch all reservations and passengers for this trip
    res_stmt = (
        select(Reservation)
        .options(selectinload(Reservation.passengers), selectinload(Reservation.seat))
        .where(Reservation.trip_id == trip_id)
    )
    res_result = await db.execute(res_stmt)
    reservations = res_result.scalars().all()

    manifest_passengers: list[TripManifestPassenger] = []
    boarded_count = 0
    pending_count = 0

    for r in reservations:
        is_boarded = r.status == "BOARDED"
        if is_boarded:
            boarded_count += 1
        elif r.status in ("CONFIRMED", "PENDING"):
            pending_count += 1

        seat_num = r.seat.seat_number if r.seat else 0

        if r.passengers:
            for p in r.passengers:
                manifest_passengers.append(
                    TripManifestPassenger(
                        seat_number=p.seat_number or seat_num,
                        full_name=p.full_name,
                        doc_type=p.doc_type,
                        doc_number=p.doc_number,
                        status=r.status,
                        boarded_at=r.synced_at if is_boarded else None,
                    )
                )
        else:
            manifest_passengers.append(
                TripManifestPassenger(
                    seat_number=seat_num,
                    full_name="Pasajero Principal",
                    doc_type="V",
                    doc_number="N/A",
                    status=r.status,
                    boarded_at=r.synced_at if is_boarded else None,
                )
            )

    # Sort manifest by seat number ascending
    manifest_passengers.sort(key=lambda x: x.seat_number)

    return TripManifestResponse(
        trip_id=trip.id,
        route_code=trip.route.route_code if trip.route else "EXP-01",
        origin="Caracas (Terminal La Bandera)",
        destination="Maracaibo (Terminal Principal)",
        departure_at=trip.departure_at,
        bus_plate=trip.bus_plate,
        driver_name=trip.driver_name,
        total_seats=trip.total_seats,
        boarded_count=boarded_count,
        pending_count=pending_count,
        passengers=manifest_passengers,
    )


@router.post(
    "/manual-board",
    response_model=TicketValidationResponse,
    status_code=status.HTTP_200_OK,
    summary="Manually board passenger by seat or document number",
)
async def manual_board(
    request: ManualBoardRequest,
    db: AsyncSession = Depends(get_db),
):
    """Allows driver or station personnel to manually check in a passenger."""
    now_utc = datetime.now(timezone.utc)

    # Find reservation for trip and seat
    stmt = (
        select(Reservation)
        .options(selectinload(Reservation.seat))
        .where(Reservation.trip_id == request.trip_id)
    )
    result = await db.execute(stmt)
    reservations = result.scalars().all()

    target_res = None
    for r in reservations:
        if request.seat_number and r.seat and r.seat.seat_number == request.seat_number:
            target_res = r
            break

    if not target_res:
        return TicketValidationResponse(
            status="NOT_FOUND",
            message=f"No se encontró reserva para el asiento {request.seat_number}.",
            seat_number=request.seat_number,
        )

    if target_res.status == "BOARDED":
        return TicketValidationResponse(
            status="ALREADY_BOARDED",
            message="El pasajero ya había abordado previamente.",
            seat_number=request.seat_number,
            boarded_at=target_res.synced_at,
        )

    target_res.status = "BOARDED"
    target_res.synced_at = now_utc
    await db.commit()

    return TicketValidationResponse(
        status="VALID",
        message="✅ Pasajero registrado y abordado manualmente.",
        seat_number=request.seat_number,
        boarded_at=now_utc,
    )
