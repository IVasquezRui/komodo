import uuid
from decimal import Decimal
from app.schemas.payment import (
    PaymentCreateRequest,
    PaymentResponse,
    PaymentWebhookRequest,
    PassengerCreateSchema,
)


def test_payment_schemas():
    req = PaymentCreateRequest(
        provider="STRIPE",
        amount=50.0,
        currency="USD",
        reference="ch_stripe_test_123456",
        phone_number="+58412-1234567",
        bank_code="0102",
        payment_metadata={"session_id": "sess_abc"},
    )
    assert req.provider == "STRIPE"
    assert req.amount == 50.0
    assert req.reference == "ch_stripe_test_123456"

    # Pago Movil schema validation
    pm_req = PaymentCreateRequest(
        provider="PAGO_MOVIL",
        amount=25.0,
        currency="USD",
        reference="REF-89271629",
        phone_number="+58412-7654321",
        bank_code="0105",
    )
    assert pm_req.provider == "PAGO_MOVIL"

    # Passenger Schema validation
    passenger = PassengerCreateSchema(
        full_name="Carlos Rodríguez",
        doc_type="V",
        doc_number="18293847",
        passenger_type="ADULT",
        seat_number=14,
        emergency_contact="+58414-9999999",
    )
    assert passenger.seat_number == 14
    assert passenger.doc_type == "V"

    # Webhook Request
    webhook = PaymentWebhookRequest(
        provider="STRIPE",
        event="payment_intent.succeeded",
        reference="ch_stripe_test_123456",
        status="CONFIRMED",
    )
    assert webhook.status == "CONFIRMED"

    print("✓ All Payment and Passenger schemas validated successfully")


if __name__ == "__main__":
    test_payment_schemas()
    print("ALL PAYMENT UNIT TESTS PASSED!")
