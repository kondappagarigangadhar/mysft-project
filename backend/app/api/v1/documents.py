from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_document(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("documents", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_document(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("documents", "create")),
):
    return {}


@router.get("/{document_id}")
async def get_document(
    document_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("documents", "read")),
):
    return {}


@router.patch("/{document_id}")
async def update_document(
    document_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("documents", "update")),
):
    return {}


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("documents", "delete")),
):
    pass
