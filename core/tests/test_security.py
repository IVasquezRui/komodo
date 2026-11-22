import time
from datetime import timedelta
from app.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


def test_password_hashing():
    raw = "superSecretPassword123!"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("wrongPassword", hashed) is False
    print("✓ Password hashing & verification test passed")


def test_jwt_tokens():
    data = {"sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "role": "passenger"}
    token = create_access_token(data)
    decoded = decode_token(token)
    assert decoded["sub"] == data["sub"]
    assert decoded["role"] == data["role"]
    assert decoded["type"] == "access"
    assert "exp" in decoded

    # Refresh token
    refresh = create_refresh_token(data)
    decoded_refresh = decode_token(refresh)
    assert decoded_refresh["type"] == "refresh"
    assert decoded_refresh["sub"] == data["sub"]

    # Expired token test
    expired_token = create_access_token(data, expires_delta=timedelta(seconds=-10))
    try:
        decode_token(expired_token)
        assert False, "Should have raised ValueError on expired token"
    except ValueError as e:
        assert "expired" in str(e).lower()

    print("✓ JWT creation, decoding, and expiration test passed")


if __name__ == "__main__":
    test_password_hashing()
    test_jwt_tokens()
    print("ALL SECURITY TESTS PASSED SUCCESSFULLY!")
