from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_vendor(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("vendors", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_vendor(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("vendors", "create")),
):
    return {}


@router.get("/{vendor_id}")
async def get_vendor(
    vendor_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("vendors", "read")),
):
    return {}


@router.patch("/{vendor_id}")
async def update_vendor(
    vendor_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("vendors", "update")),
):
    return {}


@router.delete("/{vendor_id}", status_code=204)
async def delete_vendor(
    vendor_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("vendors", "delete")),
):
    pass
