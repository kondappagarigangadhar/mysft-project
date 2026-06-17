from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_invoice(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("invoices", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_invoice(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("invoices", "create")),
):
    return {}


@router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("invoices", "read")),
):
    return {}


@router.patch("/{invoice_id}")
async def update_invoice(
    invoice_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("invoices", "update")),
):
    return {}


@router.delete("/{invoice_id}", status_code=204)
async def delete_invoice(
    invoice_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("invoices", "delete")),
):
    pass
