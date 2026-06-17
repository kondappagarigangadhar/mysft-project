from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_project(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("projects", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_project(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("projects", "create")),
):
    return {}


@router.get("/{project_id}")
async def get_project(
    project_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("projects", "read")),
):
    return {}


@router.patch("/{project_id}")
async def update_project(
    project_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("projects", "update")),
):
    return {}


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("projects", "delete")),
):
    pass
