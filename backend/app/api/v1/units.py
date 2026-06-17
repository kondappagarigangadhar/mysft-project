from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_unit(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("units", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_unit(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("units", "create")),
):
    return {}


@router.get("/{unit_id}")
async def get_unit(
    unit_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("units", "read")),
):
    return {}


@router.patch("/{unit_id}")
async def update_unit(
    unit_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("units", "update")),
):
    return {}


@router.delete("/{unit_id}", status_code=204)
async def delete_unit(
    unit_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("units", "delete")),
):
    pass
