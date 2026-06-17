from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_booking(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("bookings", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_booking(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("bookings", "create")),
):
    return {}


@router.get("/{booking_id}")
async def get_booking(
    booking_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("bookings", "read")),
):
    return {}


@router.patch("/{booking_id}")
async def update_booking(
    booking_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("bookings", "update")),
):
    return {}


@router.delete("/{booking_id}", status_code=204)
async def delete_booking(
    booking_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("bookings", "delete")),
):
    pass
