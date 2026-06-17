from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_supplier(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("suppliers", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_supplier(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("suppliers", "create")),
):
    return {}


@router.get("/{supplier_id}")
async def get_supplier(
    supplier_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("suppliers", "read")),
):
    return {}


@router.patch("/{supplier_id}")
async def update_supplier(
    supplier_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("suppliers", "update")),
):
    return {}


@router.delete("/{supplier_id}", status_code=204)
async def delete_supplier(
    supplier_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("suppliers", "delete")),
):
    pass
