from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse

router = APIRouter()


@router.get("")
async def list_service_ticket(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("service_tickets", "read")),
):
    return {"items": [], "total": 0, "page": pagination.page, "size": pagination.size}


@router.post("", status_code=201)
async def create_service_ticket(
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("service_tickets", "create")),
):
    return {}


@router.get("/{service_ticket_id}")
async def get_service_ticket(
    service_ticket_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("service_tickets", "read")),
):
    return {}


@router.patch("/{service_ticket_id}")
async def update_service_ticket(
    service_ticket_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("service_tickets", "update")),
):
    return {}


@router.delete("/{service_ticket_id}", status_code=204)
async def delete_service_ticket(
    service_ticket_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("service_tickets", "delete")),
):
    pass
