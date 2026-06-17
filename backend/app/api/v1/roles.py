from __future__ import annotations

from fastapi import APIRouter, Depends
import asyncpg

from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse
from app.schemas.roles import RoleCreate, RoleUpdate, RoleResponse, PermissionResponse, RolePermissionsUpdate
from app.services.roles import RoleService

router = APIRouter()


def _svc(db: asyncpg.Connection, current_user: dict) -> RoleService:
    return RoleService(db, current_user)


@router.get("", response_model=PaginatedResponse[RoleResponse])
async def list_roles(
    pagination: PaginationParams = Depends(),
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("roles", "read")),
):
    return await _svc(db, current_user).list(pagination)


@router.post("", response_model=RoleResponse, status_code=201)
async def create_role(
    body: RoleCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("roles", "create")),
):
    return await _svc(db, current_user).create(body)


@router.get("/permissions", response_model=list[PermissionResponse])
async def list_all_permissions(
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("roles", "read")),
):
    return await _svc(db, current_user).list_all_permissions()


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("roles", "read")),
):
    return await _svc(db, current_user).get(role_id)


@router.patch("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: str,
    body: RoleUpdate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("roles", "update")),
):
    return await _svc(db, current_user).update(role_id, body)


@router.delete("/{role_id}", status_code=204)
async def delete_role(
    role_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("roles", "delete")),
):
    await _svc(db, current_user).delete(role_id)


@router.get("/{role_id}/permissions", response_model=list[PermissionResponse])
async def get_role_permissions(
    role_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("roles", "read")),
):
    return await _svc(db, current_user).get_role_permissions(role_id)


@router.put("/{role_id}/permissions", response_model=list[PermissionResponse])
async def set_role_permissions(
    role_id: str,
    body: RolePermissionsUpdate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("roles", "update")),
):
    return await _svc(db, current_user).set_role_permissions(role_id, body)
