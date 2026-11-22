"""
Pydantic Schemas for Push Notifications and Travel Reminders (Phase 9)
"""

from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class DeviceRegisterRequest(BaseModel):
    user_id: UUID = Field(..., example="a0000001-0000-0000-0000-000000000001")
    push_token: str = Field(..., example="ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]")
    device_os: str = Field(default="android", example="android")  # ios, android, web
    device_name: Optional[str] = Field(default="Mobile Device")


class DeviceRegisterResponse(BaseModel):
    status: str = "REGISTERED"
    user_id: str
    push_token: str
    device_os: str
    registered_at: str


class NotificationSendRequest(BaseModel):
    user_id: Optional[UUID] = None
    push_token: Optional[str] = Field(None, example="ExponentPushToken[xxxxxxxxxxxxxx]")
    title: str = Field(..., example="¡Tu viaje está próximo!")
    body: str = Field(..., example="Tu autobús a Maracaibo sale en 2 horas desde el Andén 4.")
    data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    priority: str = Field(default="high")
    channel: str = Field(default="EXPO_PUSH")  # EXPO_PUSH, SMS_BACKUP, WHATSAPP


class NotificationSendResponse(BaseModel):
    status: str
    recipient: str
    title: str
    channel: str
    sent_at: str
    ticket_id: Optional[str] = None


class TravelReminderTriggerRequest(BaseModel):
    trip_id: UUID = Field(..., example="a0000001-0000-0000-0000-000000000001")
    reminder_type: str = Field(
        ..., example="2H_BEFORE"
    )  # 24H_BEFORE, 2H_BEFORE, BOARDING_NOW, GATE_CHANGE, DELAY_ALERT


class TravelReminderResponse(BaseModel):
    trip_id: str
    reminder_type: str
    title: str
    message_template: str
    notifications_dispatched: int
    timestamp: str
