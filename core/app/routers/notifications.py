"""
FastAPI Core — Notifications & Reminders Router (Phase 9)

Endpoints for:
- Device Expo Push Token registration
- Push notification broadcasting
- Travel journey reminders (24h, 2h before departure, boarding calls)
"""

from uuid import UUID
from fastapi import APIRouter, HTTPException, status

from app.schemas.notification import (
    DeviceRegisterRequest,
    DeviceRegisterResponse,
    NotificationSendRequest,
    NotificationSendResponse,
    TravelReminderTriggerRequest,
    TravelReminderResponse,
)
from app.services.notification_service import (
    register_device,
    send_push_notification,
    dispatch_travel_reminder,
    get_user_device,
)

router = APIRouter()


@router.post(
    "/devices",
    response_model=DeviceRegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register Expo Push Token for user device",
)
async def register_device_endpoint(payload: DeviceRegisterRequest):
    return register_device(payload)


@router.get(
    "/devices/{user_id}",
    summary="Get registered push device for user",
)
async def get_device_endpoint(user_id: UUID):
    device = get_user_device(user_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No device registered for this user",
        )
    return {"user_id": str(user_id), **device}


@router.post(
    "/send",
    response_model=NotificationSendResponse,
    summary="Send high-priority push notification",
)
async def send_notification_endpoint(payload: NotificationSendRequest):
    return send_push_notification(payload)


@router.post(
    "/reminders",
    response_model=TravelReminderResponse,
    summary="Trigger journey reminders (24h, 2h, boarding call)",
)
async def trigger_reminders_endpoint(payload: TravelReminderTriggerRequest):
    return dispatch_travel_reminder(payload)
