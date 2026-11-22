from datetime import timedelta
from fastapi import APIRouter, Depends, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.exceptions import InvalidCredentialsError, UnauthorizedError, UserAlreadyExistsError
from app.models.user import User
from app.schemas.auth import (
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)

router = APIRouter()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(
    request: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Registers a new user (passenger, driver, or admin).
    Verifies phone_number and email uniqueness, hashes password,
    and returns initial access & refresh tokens.
    """
    # Check if user with phone or email exists
    conditions = [User.phone_number == request.phone_number]
    if request.email:
        conditions.append(User.email == request.email)

    stmt = select(User).where(or_(*conditions))
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        if existing_user.phone_number == request.phone_number:
            raise UserAlreadyExistsError("A user with this phone number is already registered.")
        raise UserAlreadyExistsError("A user with this email address is already registered.")

    new_user = User(
        full_name=request.full_name,
        phone_number=request.phone_number,
        email=request.email,
        password_hash=get_password_hash(request.password),
        role=request.role,
        is_active=True,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token_data = {"sub": str(new_user.id), "role": new_user.role, "phone": new_user.phone_number}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(new_user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and obtain JWT tokens",
)
async def login(
    request: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticates a user via phone number or email and password.
    Returns signed access and refresh tokens.
    """
    stmt = select(User).where(
        or_(
            User.phone_number == request.phone_or_email,
            User.email == request.phone_or_email,
        )
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.password_hash):
        raise InvalidCredentialsError()

    if not user.is_active:
        raise UnauthorizedError("User account is currently inactive.")

    token_data = {"sub": str(user.id), "role": user.role, "phone": user.phone_number}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    """Returns the authenticated user's profile details."""
    return UserResponse.model_validate(current_user)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh an expired access token using a refresh token",
)
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Validates refresh token and generates a new access token pair."""
    try:
        payload = decode_token(request.refresh_token)
        if payload.get("type") != "refresh":
            raise UnauthorizedError("Invalid token type for refresh")
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise UnauthorizedError("Invalid token subject")
    except Exception as e:
        raise UnauthorizedError(f"Refresh token invalid or expired: {e}")

    stmt = select(User).where(User.id == user_id_str)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise UnauthorizedError("User is no longer active or does not exist")

    token_data = {"sub": str(user.id), "role": user.role, "phone": user.phone_number}
    new_access_token = create_access_token(token_data)
    new_refresh_token = create_refresh_token(token_data)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )
