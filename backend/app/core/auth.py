from datetime import datetime, timedelta, timezone
from uuid import UUID
from typing import Optional

import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings
from app.db.session import get_db
import asyncpg

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload["type"] = "access"
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload["type"] = "refresh"
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: asyncpg.Connection = Depends(get_db),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = await db.fetchrow(
        "SELECT id, organization_id, email, status FROM users WHERE id=$1 AND status != 'Inactive'",
        UUID(user_id),
    )
    if not user or user["status"] != "Active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return dict(user) | {"token_payload": payload}


def require_permission(module: str, action: str):
    """FastAPI dependency factory for RBAC checks."""
    async def _check(
        current_user: dict = Depends(get_current_user),
        db: asyncpg.Connection = Depends(get_db),
    ) -> dict:
        role_ids = await db.fetch(
            "SELECT role_id FROM user_roles WHERE user_id=$1",
            current_user["id"],
        )

        # Super admin bypasses all permission checks (no role needed either)
        if role_ids:
            is_super = await db.fetchval(
                "SELECT 1 FROM roles WHERE id = ANY($1::uuid[]) AND role_name='Super Admin'",
                [r["role_id"] for r in role_ids],
            )
            if is_super:
                return current_user

            has_perm = await db.fetchval(
                """
                SELECT 1 FROM role_permissions rp
                JOIN permissions p ON p.id = rp.permission_id
                WHERE rp.role_id = ANY($1::uuid[])
                  AND p.module_name = $2 AND p.action = $3
                """,
                [r["role_id"] for r in role_ids],
                module,
                action,
            )
            if has_perm:
                return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: {module}:{action}",
        )

    return _check
