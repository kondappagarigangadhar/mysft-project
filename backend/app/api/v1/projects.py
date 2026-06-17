from __future__ import annotations

from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, Query

from app.core.auth import require_permission
from app.core.pagination import PaginatedResponse, PaginationParams
from app.db.session import get_db
from app.schemas.projects import ProjectCreate, ProjectResponse, ProjectUpdate, SiteLayoutResponse
from app.schemas.units import UnitResponse
from app.services.projects import ProjectService

router = APIRouter()


def _svc(db: asyncpg.Connection, current_user: dict) -> ProjectService:
    return ProjectService(db, current_user)


# ── Collection ──────────────────────────────────────────────

@router.get("", response_model=PaginatedResponse[ProjectResponse])
async def list_projects(
    pagination: PaginationParams = Depends(),
    status: Optional[str] = Query(None),
    project_type: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("projects", "read")),
):
    return await _svc(db, current_user).list(
        pagination,
        search=pagination.search,
        status=status,
        project_type=project_type,
        city=city,
    )


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    body: ProjectCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("projects", "create")),
):
    return await _svc(db, current_user).create(body)


# ── Single record ────────────────────────────────────────────

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("projects", "read")),
):
    return await _svc(db, current_user).get(project_id)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("projects", "update")),
):
    return await _svc(db, current_user).update(project_id, body)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("projects", "delete")),
):
    await _svc(db, current_user).delete(project_id)


# ── Sub-resources ────────────────────────────────────────────

@router.get("/{project_id}/units", response_model=PaginatedResponse[UnitResponse])
async def list_project_units(
    project_id: str,
    pagination: PaginationParams = Depends(),
    availability_status: Optional[str] = Query(None),
    unit_type: Optional[str] = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("projects", "read")),
):
    return await _svc(db, current_user).list_units(
        project_id, pagination, availability_status=availability_status, unit_type=unit_type
    )


@router.get("/{project_id}/layout", response_model=list[SiteLayoutResponse])
async def get_project_layout(
    project_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("projects", "read")),
):
    return await _svc(db, current_user).list_layouts(project_id)
