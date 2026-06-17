from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_purchase_order(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("purchase_orders", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_purchase_order(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("purchase_orders", "create")),
):
    return {}


@router.get("/{purchase_order_id}")
async def get_purchase_order(
    purchase_order_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("purchase_orders", "read")),
):
    return {}


@router.patch("/{purchase_order_id}")
async def update_purchase_order(
    purchase_order_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("purchase_orders", "update")),
):
    return {}


@router.delete("/{purchase_order_id}", status_code=204)
async def delete_purchase_order(
    purchase_order_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("purchase_orders", "delete")),
):
    pass
