from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_payment(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("payments", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_payment(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("payments", "create")),
):
    return {}


@router.get("/{payment_id}")
async def get_payment(
    payment_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("payments", "read")),
):
    return {}


@router.patch("/{payment_id}")
async def update_payment(
    payment_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("payments", "update")),
):
    return {}


@router.delete("/{payment_id}", status_code=204)
async def delete_payment(
    payment_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("payments", "delete")),
):
    pass
