from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_purchase_request(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("purchase_requests", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_purchase_request(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("purchase_requests", "create")),
):
    return {}


@router.get("/{purchase_request_id}")
async def get_purchase_request(
    purchase_request_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("purchase_requests", "read")),
):
    return {}


@router.patch("/{purchase_request_id}")
async def update_purchase_request(
    purchase_request_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("purchase_requests", "update")),
):
    return {}


@router.delete("/{purchase_request_id}", status_code=204)
async def delete_purchase_request(
    purchase_request_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("purchase_requests", "delete")),
):
    pass
