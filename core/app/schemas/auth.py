from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class UserRegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=200)
    phone_number: str = Field(min_length=7, max_length=20)
    email: str | None = Field(default=None, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    role: str = Field(default="passenger", pattern="^(passenger|driver|admin)$")

    model_config = ConfigDict(strict=False)


class UserLoginRequest(BaseModel):
    phone_or_email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1)

    model_config = ConfigDict(strict=False)


class UserResponse(BaseModel):
    id: UUID
    full_name: str
    phone_number: str
    email: str | None = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str
