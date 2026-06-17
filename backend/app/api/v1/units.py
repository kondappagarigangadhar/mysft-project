from __future__ import annotations

from typing import Optional

import asyncpg
from fastapi import APIRouter, Depends, Query

from app.core.auth import require_permission
from app.core.pagination import PaginatedResponse, PaginationParams
from app.db.session import get_db
from app.schemas.units import UnitCreate, UnitResponse, UnitUpdate, UnitAvailabilityUpdate
from app.services.units import UnitService

router = APIRouter()


def _svc(db: asyncpg.Connection, current_user: dict) -> UnitService:
    return UnitService(db, current_user)


# ── Collection ──────────────────────────────────────────────

@router.get("", response_model=PaginatedResponse[UnitResponse])
async def list_units(
    pagination: PaginationParams = Depends(),
    project_id: Optional[str] = Query(None),
    availability_status: Optional[str] = Query(None),
    unit_type: Optional[str] = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("units", "read")),
):
    return await _svc(db, current_user).list(
        pagination,
        project_id=project_id,
        availability_status=availability_status,
        unit_type=unit_type,
    )


@router.post("", response_model=UnitResponse, status_code=201)
async def create_unit(
    body: UnitCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("units", "create")),
):
    return await _svc(db, current_user).create(body)


# ── Single record ────────────────────────────────────────────

@router.get("/{unit_id}", response_model=UnitResponse)
async def get_unit(
    unit_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("units", "read")),
):
    return await _svc(db, current_user).get(unit_id)


@router.patch("/{unit_id}", response_model=UnitResponse)
async def update_unit(
    unit_id: str,
    body: UnitUpdate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("units", "update")),
):
    return await _svc(db, current_user).update(unit_id, body)


@router.delete("/{unit_id}", status_code=204)
async def delete_unit(
    unit_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("units", "delete")),
):
    await _svc(db, current_user).delete(unit_id)


# ── Availability ─────────────────────────────────────────────

@router.patch("/{unit_id}/availability", response_model=UnitResponse)
async def update_unit_availability(
    unit_id: str,
    body: UnitAvailabilityUpdate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("units", "update")),
):
    return await _svc(db, current_user).update_availability(unit_id, body)
