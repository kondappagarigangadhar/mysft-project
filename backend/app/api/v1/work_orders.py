from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_work_order(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("work_orders", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_work_order(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("work_orders", "create")),
):
    return {}


@router.get("/{work_order_id}")
async def get_work_order(
    work_order_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("work_orders", "read")),
):
    return {}


@router.patch("/{work_order_id}")
async def update_work_order(
    work_order_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("work_orders", "update")),
):
    return {}


@router.delete("/{work_order_id}", status_code=204)
async def delete_work_order(
    work_order_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("work_orders", "delete")),
):
    pass
