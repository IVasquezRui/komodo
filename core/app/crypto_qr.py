import base64
import hashlib
import hmac
import json
import logging
import os
import time

try:
    from app.config import settings
    SECRET_KEY = settings.secret_key
except Exception:
    SECRET_KEY = os.getenv("SECRET_KEY", "komodo-secret-key-change-me-in-production-64bytes")

logger = logging.getLogger("komodo.crypto_qr")


def generate_secure_qr_payload(
    reservation_id: str,
    trip_id: str,
    seat_number: int,
    doc_number: str = "N/A",
    passenger_name: str = "Passenger",
    secret_key: str | None = None,
) -> str:
    """
    Generates a cryptographically signed QR code payload with HMAC-SHA256.
    Allows offline validation by drivers in remote areas without internet access.
    """
    key = (secret_key or SECRET_KEY).encode("utf-8")

    data = {
        "r": str(reservation_id),
        "t": str(trip_id),
        "s": seat_number,
        "d": doc_number,
        "p": passenger_name,
        "iat": int(time.time()),
    }

    # Deterministic message string for signature
    msg = f"{data['r']}|{data['t']}|{data['s']}|{data['d']}|{data['p']}|{data['iat']}".encode("utf-8")
    signature = hmac.new(key, msg, hashlib.sha256).hexdigest()[:16]

    data["sig"] = signature
    return json.dumps(data, separators=(",", ":"))


def verify_qr_signature(
    qr_data: str | dict,
    secret_key: str | None = None,
) -> tuple[bool, dict]:
    """
    Verifies the cryptographic signature of a QR payload.
    Returns (is_valid, parsed_payload).
    """
    try:
        if isinstance(qr_data, str):
            payload = json.loads(qr_data)
        else:
            payload = dict(qr_data)
    except Exception as e:
        logger.warning("Failed to parse QR payload: %s", e)
        return False, {}

    sig = payload.get("sig")
    if not sig:
        return False, payload

    r = payload.get("r", "")
    t = payload.get("t", "")
    s = payload.get("s", 0)
    d = payload.get("d", "")
    p = payload.get("p", "")
    iat = payload.get("iat", 0)

    key = (secret_key or SECRET_KEY).encode("utf-8")
    msg = f"{r}|{t}|{s}|{d}|{p}|{iat}".encode("utf-8")
    expected_sig = hmac.new(key, msg, hashlib.sha256).hexdigest()[:16]

    if hmac.compare_digest(sig, expected_sig):
        return True, payload

    return False, payload
