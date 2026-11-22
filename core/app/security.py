import base64
import hashlib
import hmac
import json
import logging
import os
import time
from datetime import datetime, timedelta, timezone

try:
    from app.config import settings
    SECRET_KEY = settings.secret_key
except Exception:
    SECRET_KEY = os.getenv("SECRET_KEY", "komodo-secret-key-change-me-in-production-64bytes")

logger = logging.getLogger("komodo.security")

# Algorithm and Token Expiry
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS = 30


# ---------------------------------------------------------------------------
# Password Hashing & Verification
# ---------------------------------------------------------------------------
def get_password_hash(password: str) -> str:
    """
    Hash a plaintext password using bcrypt (via passlib) if available,
    otherwise securely fall back to PBKDF2-HMAC-SHA256 with dynamic salt.
    """
    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.hash(password)
    except Exception:
        # Robust fallback using Python stdlib hashlib PBKDF2
        import os
        salt = os.urandom(16)
        kdf = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100_000)
        return f"pbkdf2:sha256:100000${salt.hex()}${kdf.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against its stored hash."""
    if not hashed_password or not plain_password:
        return False

    if hashed_password.startswith("pbkdf2:sha256:"):
        try:
            parts = hashed_password.split("$")
            salt = bytes.fromhex(parts[1])
            expected_kdf = bytes.fromhex(parts[2])
            actual_kdf = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100_000)
            return hmac.compare_digest(actual_kdf, expected_kdf)
        except Exception as e:
            logger.error("PBKDF2 verification error: %s", e)
            return False

    try:
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error("Password verification error: %s", e)
        return False


# ---------------------------------------------------------------------------
# JWT Token Generation & Verification
# ---------------------------------------------------------------------------
def _b64_url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64_url_decode(data: str) -> bytes:
    padding = "=" * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": int(expire.timestamp()), "type": "access"})

    try:
        from jose import jwt
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    except Exception:
        # Fallback stdlib JWT encoder
        header = {"alg": ALGORITHM, "typ": "JWT"}
        header_b64 = _b64_url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
        payload_b64 = _b64_url_encode(json.dumps(to_encode, separators=(",", ":")).encode("utf-8"))
        signature_raw = hmac.new(
            SECRET_KEY.encode("utf-8"),
            f"{header_b64}.{payload_b64}".encode("utf-8"),
            hashlib.sha256,
        ).digest()
        signature_b64 = _b64_url_encode(signature_raw)
        return f"{header_b64}.{payload_b64}.{signature_b64}"


def create_refresh_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": int(expire.timestamp()), "type": "refresh"})

    try:
        from jose import jwt
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    except Exception:
        header = {"alg": ALGORITHM, "typ": "JWT"}
        header_b64 = _b64_url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
        payload_b64 = _b64_url_encode(json.dumps(to_encode, separators=(",", ":")).encode("utf-8"))
        signature_raw = hmac.new(
            SECRET_KEY.encode("utf-8"),
            f"{header_b64}.{payload_b64}".encode("utf-8"),
            hashlib.sha256,
        ).digest()
        signature_b64 = _b64_url_encode(signature_raw)
        return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_token(token: str) -> dict:
    """Decode and verify a signed JWT token."""
    try:
        from jose import jwt
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except Exception:
        # Fallback stdlib JWT decoder
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid token format")

        header_b64, payload_b64, signature_b64 = parts
        expected_sig = _b64_url_encode(
            hmac.new(
                SECRET_KEY.encode("utf-8"),
                f"{header_b64}.{payload_b64}".encode("utf-8"),
                hashlib.sha256,
            ).digest()
        )
        if not hmac.compare_digest(expected_sig, signature_b64):
            raise ValueError("Token signature verification failed")

        payload = json.loads(_b64_url_decode(payload_b64).decode("utf-8"))
        if "exp" in payload and time.time() > payload["exp"]:
            raise ValueError("Token has expired")

        return payload
