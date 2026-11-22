"""
Unit tests for Push Notifications and Travel Reminders (Phase 9)
"""

import sys
import uuid
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
    DEVICE_REGISTRY,
    REMINDER_TEMPLATES,
)


def test_device_registration():
    user_id = uuid.UUID("a0000001-0000-0000-0000-000000000002")
    req = DeviceRegisterRequest(
        user_id=user_id,
        push_token="ExponentPushToken[mock_token_ios_device]",
        device_os="ios",
        device_name="iPhone 15 Pro",
    )
    res = register_device(req)

    assert res.status == "REGISTERED"
    assert res.push_token == "ExponentPushToken[mock_token_ios_device]"
    assert res.device_os == "ios"
    assert str(user_id) in DEVICE_REGISTRY
    print("✓ Device registration test passed")


def test_send_push_notification():
    req = NotificationSendRequest(
        push_token="ExponentPushToken[mock_token_ios_device]",
        title="¡Boleto Emitido!",
        body="Tu asiento 14 ha sido confirmado.",
        data={"ticket_id": "t-12345"},
    )
    res = send_push_notification(req)

    assert res.status == "DELIVERED"
    assert res.channel == "EXPO_PUSH"
    assert res.title == "¡Boleto Emitido!"
    assert res.ticket_id == "t-12345"
    print("✓ Push notification sending test passed")


def test_travel_reminders_dispatch():
    trip_id = uuid.UUID("a0000001-0000-0000-0000-000000000001")
    req = TravelReminderTriggerRequest(
        trip_id=trip_id,
        reminder_type="2H_BEFORE",
    )
    res = dispatch_travel_reminder(req)

    assert res.trip_id == str(trip_id)
    assert res.reminder_type == "2H_BEFORE"
    assert "2 horas" in res.message_template
    assert res.notifications_dispatched >= 1
    print("✓ Travel reminders dispatch test passed")


if __name__ == "__main__":
    try:
        test_device_registration()
        test_send_push_notification()
        test_travel_reminders_dispatch()
        print("ALL NOTIFICATION UNIT TESTS PASSED SUCCESSFULLY!")
    except Exception as e:
        print(f"FAILED: {e}")
        sys.exit(1)
