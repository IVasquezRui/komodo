import uuid
from typing import Annotated

from fastapi import Depends, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.exceptions import ForbiddenError, UnauthorizedError
from app.models.user import User
from app.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)] = None,
    authorization: Annotated[str | None, Header()] = None,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate the current authenticated user from JWT token."""
    raw_token = token
    if not raw_token and authorization and authorization.lower().startswith("bearer "):
        raw_token = authorization.split(" ", 1)[1]

    if not raw_token:
        raise UnauthorizedError("No authentication token provided")

    try:
        payload = decode_token(raw_token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise UnauthorizedError("Invalid token subject")
        user_id = uuid.UUID(user_id_str)
    except Exception as e:
        raise UnauthorizedError(f"Authentication token invalid or expired: {e}")

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise UnauthorizedError("User corresponding to this token does not exist")

    if not user.is_active:
        raise ForbiddenError("User account is inactive or disabled")

    return user


def require_role(allowed_roles: list[str]):
    """Role-based access control dependency generator."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenError(f"Access denied. Requires one of roles: {', '.join(allowed_roles)}")
        return current_user

    return role_checker
