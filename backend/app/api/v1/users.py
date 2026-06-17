from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_user(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("users", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_user(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("users", "create")),
):
    return {}


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("users", "read")),
):
    return {}


@router.patch("/{user_id}")
async def update_user(
    user_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("users", "update")),
):
    return {}


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("users", "delete")),
):
    pass
