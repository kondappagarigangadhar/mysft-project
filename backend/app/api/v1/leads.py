from fastapi import APIRouter, Depends, Query
from typing import Optional
import asyncpg

from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse
from app.schemas.leads import (
    LeadCreate, LeadUpdate, LeadResponse,
    LeadAssignRequest, FollowupCreate, FollowupResponse,
    SiteVisitCreate, SiteVisitResponse,
)
from app.services.leads import LeadService

router = APIRouter()


def _svc(db: asyncpg.Connection, current_user: dict) -> LeadService:
    return LeadService(db, current_user)


# ── Collection ──────────────────────────────────────────────

@router.get("", response_model=PaginatedResponse[LeadResponse])
async def list_leads(
    pagination: PaginationParams = Depends(),
    status: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("leads", "read")),
):
    return await _svc(db, current_user).list(
        pagination, search=pagination.search,
        status=status, source=source,
        project_id=project_id, assigned_to=assigned_to,
    )


@router.post("", response_model=LeadResponse, status_code=201)
async def create_lead(
    body: LeadCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("leads", "create")),
):
    return await _svc(db, current_user).create(body)


# ── Single record ────────────────────────────────────────────

@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("leads", "read")),
):
    return await _svc(db, current_user).get(lead_id)


@router.patch("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: str,
    body: LeadUpdate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("leads", "update")),
):
    return await _svc(db, current_user).update(lead_id, body)


@router.delete("/{lead_id}", status_code=204)
async def delete_lead(
    lead_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("leads", "delete")),
):
    await _svc(db, current_user).delete(lead_id)


# ── Assignment ───────────────────────────────────────────────

@router.post("/{lead_id}/assign", response_model=LeadResponse)
async def assign_lead(
    lead_id: str,
    body: LeadAssignRequest,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("leads", "update")),
):
    return await _svc(db, current_user).assign(lead_id, body)


# ── Follow-ups ───────────────────────────────────────────────

@router.get("/{lead_id}/follow-ups", response_model=list[FollowupResponse])
async def list_followups(
    lead_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("leads", "read")),
):
    return await _svc(db, current_user).list_followups(lead_id)


@router.post("/{lead_id}/follow-ups", response_model=FollowupResponse, status_code=201)
async def add_followup(
    lead_id: str,
    body: FollowupCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("leads", "update")),
):
    return await _svc(db, current_user).add_followup(lead_id, body)


# ── Site Visits ──────────────────────────────────────────────

@router.get("/{lead_id}/site-visits", response_model=list[SiteVisitResponse])
async def list_site_visits(
    lead_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("leads", "read")),
):
    return await _svc(db, current_user).list_site_visits(lead_id)


@router.post("/{lead_id}/site-visits", response_model=SiteVisitResponse, status_code=201)
async def add_site_visit(
    lead_id: str,
    body: SiteVisitCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("leads", "update")),
):
    return await _svc(db, current_user).add_site_visit(lead_id, body)


# ── Activity timeline ────────────────────────────────────────

@router.get("/{lead_id}/activity")
async def get_activity(
    lead_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("leads", "read")),
):
    return await _svc(db, current_user).get_activity(lead_id)
