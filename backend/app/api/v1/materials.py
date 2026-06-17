from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_material(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("materials", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_material(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("materials", "create")),
):
    return {}


@router.get("/{material_id}")
async def get_material(
    material_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("materials", "read")),
):
    return {}


@router.patch("/{material_id}")
async def update_material(
    material_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("materials", "update")),
):
    return {}


@router.delete("/{material_id}", status_code=204)
async def delete_material(
    material_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("materials", "delete")),
):
    pass
