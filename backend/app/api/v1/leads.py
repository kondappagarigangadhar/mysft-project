from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db.session import get_db
from app.core.auth import get_current_user, require_permission
from app.core.pagination import PaginationParams, PaginatedResponse
from app.schemas.leads import LeadCreate, LeadUpdate, LeadResponse
from app.services.leads import LeadService

router = APIRouter()


@router.get("", response_model=PaginatedResponse[LeadResponse])
async def list_leads(
    pagination: PaginationParams = Depends(),
    search: str | None = Query(None),
    status: str | None = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("leads", "read")),
):
    return await LeadService(db, current_user).list(pagination, search=search, status=status)


@router.post("", response_model=LeadResponse, status_code=201)
async def create_lead(
    body: LeadCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("leads", "create")),
):
    return await LeadService(db, current_user).create(body)


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("leads", "read")),
):
    return await LeadService(db, current_user).get(lead_id)


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    body: LeadUpdate,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("leads", "update")),
):
    return await LeadService(db, current_user).update(lead_id, body)


@router.delete("/{lead_id}", status_code=204)
async def delete_lead(
    lead_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user=Depends(require_permission("leads", "delete")),
):
    await LeadService(db, current_user).delete(lead_id)
