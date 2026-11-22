import json
from app.crypto_qr import generate_secure_qr_payload, verify_qr_signature
from app.schemas.ticket import (
    TicketValidationRequest,
    TicketValidationResponse,
    TripManifestResponse,
    TripManifestPassenger,
)


def test_crypto_qr_signing():
    qr_str = generate_secure_qr_payload(
        reservation_id="res_12345678",
        trip_id="trip_98765432",
        seat_number=14,
        doc_number="V-18293847",
        passenger_name="Carlos Rodríguez",
    )
    assert "sig" in qr_str

    # Valid verification
    is_valid, payload = verify_qr_signature(qr_str)
    assert is_valid is True
    assert payload["s"] == 14
    assert payload["d"] == "V-18293847"
    assert payload["p"] == "Carlos Rodríguez"

    # Tampered verification (someone changed seat number from 14 to 1)
    tampered_data = json.loads(qr_str)
    tampered_data["s"] = 1
    tampered_str = json.dumps(tampered_data)
    is_valid_tampered, _ = verify_qr_signature(tampered_str)
    assert is_valid_tampered is False, "Tampered QR payload MUST fail signature check!"

    print("✓ Cryptographic QR HMAC-SHA256 signature and anti-tamper tests passed")


def test_manifest_schemas():
    manifest = TripManifestResponse(
        trip_id="a0000001-0000-0000-0000-000000000001",
        route_code="CCS-MCB-001",
        origin="Caracas",
        destination="Maracaibo",
        departure_at="2026-11-25T08:00:00Z",
        total_seats=40,
        boarded_count=25,
        pending_count=15,
        passengers=[
            TripManifestPassenger(
                seat_number=1,
                full_name="María García",
                doc_type="V",
                doc_number="12345678",
                status="BOARDED",
            )
        ],
    )
    assert manifest.boarded_count == 25
    assert len(manifest.passengers) == 1
    print("✓ Trip Manifest schemas validated successfully")


if __name__ == "__main__":
    test_crypto_qr_signing()
    test_manifest_schemas()
    print("ALL CRYPTO QR AND MANIFEST TESTS PASSED!")
