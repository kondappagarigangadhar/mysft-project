from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_notification(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("notifications", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_notification(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("notifications", "create")),
):
    return {}


@router.get("/{notification_id}")
async def get_notification(
    notification_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("notifications", "read")),
):
    return {}


@router.patch("/{notification_id}")
async def update_notification(
    notification_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("notifications", "update")),
):
    return {}


@router.delete("/{notification_id}", status_code=204)
async def delete_notification(
    notification_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("notifications", "delete")),
):
    pass
