from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_resident(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("residents", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_resident(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("residents", "create")),
):
    return {}


@router.get("/{resident_id}")
async def get_resident(
    resident_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("residents", "read")),
):
    return {}


@router.patch("/{resident_id}")
async def update_resident(
    resident_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("residents", "update")),
):
    return {}


@router.delete("/{resident_id}", status_code=204)
async def delete_resident(
    resident_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("residents", "delete")),
):
    pass
