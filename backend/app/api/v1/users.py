from __future__ import annotations

from fastapi import APIRouter, Depends
import asyncpg

from app.db.session import get_db
from app.core.auth import require_permission, get_current_user
from app.core.pagination import PaginationParams, PaginatedResponse
from app.schemas.users import UserCreate, UserUpdate, UserResponse, UserRoleAssign, PasswordChangeRequest
from app.services.users import UserService

router = APIRouter()


def _svc(db: asyncpg.Connection, current_user: dict) -> UserService:
    return UserService(db, current_user)


@router.get("/me", response_model=UserResponse)
async def me(
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return await _svc(db, current_user).me()


@router.get("", response_model=PaginatedResponse[UserResponse])
async def list_users(
    pagination: PaginationParams = Depends(),
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("users", "read")),
):
    return await _svc(db, current_user).list(pagination)


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    body: UserCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("users", "create")),
):
    return await _svc(db, current_user).create(body)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("users", "read")),
):
    return await _svc(db, current_user).get(user_id)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    body: UserUpdate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("users", "update")),
):
    return await _svc(db, current_user).update(user_id, body)


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("users", "delete")),
):
    await _svc(db, current_user).delete(user_id)


@router.get("/{user_id}/roles")
async def get_user_roles(
    user_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("users", "read")),
):
    return await _svc(db, current_user).get_roles(user_id)


@router.put("/{user_id}/roles", response_model=UserResponse)
async def assign_roles(
    user_id: str,
    body: UserRoleAssign,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("users", "update")),
):
    return await _svc(db, current_user).assign_roles(user_id, body)


@router.post("/{user_id}/change-password", status_code=204)
async def change_password(
    user_id: str,
    body: PasswordChangeRequest,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    await _svc(db, current_user).change_password(user_id, body)
