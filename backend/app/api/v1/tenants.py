from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_tenant(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("tenants", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_tenant(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("tenants", "create")),
):
    return {}


@router.get("/{tenant_id}")
async def get_tenant(
    tenant_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("tenants", "read")),
):
    return {}


@router.patch("/{tenant_id}")
async def update_tenant(
    tenant_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("tenants", "update")),
):
    return {}


@router.delete("/{tenant_id}", status_code=204)
async def delete_tenant(
    tenant_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("tenants", "delete")),
):
    pass
