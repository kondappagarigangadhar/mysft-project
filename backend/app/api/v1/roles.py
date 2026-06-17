from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_role(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("roles", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_role(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("roles", "create")),
):
    return {}


@router.get("/{role_id}")
async def get_role(
    role_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("roles", "read")),
):
    return {}


@router.patch("/{role_id}")
async def update_role(
    role_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("roles", "update")),
):
    return {}


@router.delete("/{role_id}", status_code=204)
async def delete_role(
    role_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("roles", "delete")),
):
    pass
