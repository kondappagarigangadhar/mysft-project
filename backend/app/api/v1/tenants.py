from __future__ import annotations

from fastapi import APIRouter, Depends
import asyncpg

from app.db.session import get_db
from app.core.auth import require_permission, get_current_user
from app.core.pagination import PaginationParams, PaginatedResponse
from app.schemas.tenants import OrganizationCreate, OrganizationUpdate, OrganizationResponse, TenantResponse
from app.services.tenants import TenantService

router = APIRouter()


def _svc(db: asyncpg.Connection, current_user: dict) -> TenantService:
    return TenantService(db, current_user)


# ── Current org shortcut (any authenticated user) ────────────

@router.get("/organization/me", response_model=OrganizationResponse)
async def get_my_organization(
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return await _svc(db, current_user).get_current_org()


# ── Organizations (super-admin) ───────────────────────────────

@router.get("/organizations", response_model=PaginatedResponse[OrganizationResponse])
async def list_organizations(
    pagination: PaginationParams = Depends(),
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("tenants", "read")),
):
    return await _svc(db, current_user).list_organizations(pagination)


@router.post("/organizations", response_model=OrganizationResponse, status_code=201)
async def create_organization(
    body: OrganizationCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("tenants", "create")),
):
    return await _svc(db, current_user).create_organization(body)


@router.get("/organizations/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("tenants", "read")),
):
    return await _svc(db, current_user).get_organization(org_id)


@router.patch("/organizations/{org_id}", response_model=OrganizationResponse)
async def update_organization(
    org_id: str,
    body: OrganizationUpdate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("tenants", "update")),
):
    return await _svc(db, current_user).update_organization(org_id, body)


# ── Tenants ───────────────────────────────────────────────────

@router.get("", response_model=PaginatedResponse[TenantResponse])
async def list_tenants(
    pagination: PaginationParams = Depends(),
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("tenants", "read")),
):
    return await _svc(db, current_user).list_tenants(pagination)


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("tenants", "read")),
):
    return await _svc(db, current_user).get_tenant(tenant_id)
