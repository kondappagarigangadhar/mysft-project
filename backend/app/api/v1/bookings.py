from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from typing import Optional
import asyncpg

from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse
from app.schemas.bookings import (
    BookingCreate,
    BookingUpdate,
    BookingResponse,
    BookingCancelRequest,
    PaymentPlanCreate,
    PaymentPlanResponse,
    InstallmentResponse,
)
from app.services.bookings import BookingService

router = APIRouter()


def _svc(db: asyncpg.Connection, current_user: dict) -> BookingService:
    return BookingService(db, current_user)


# ── Collection ───────────────────────────────────────────────────

@router.get("", response_model=PaginatedResponse[BookingResponse])
async def list_bookings(
    pagination: PaginationParams = Depends(),
    booking_status: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("bookings", "read")),
):
    return await _svc(db, current_user).list(
        pagination,
        search=pagination.search,
        booking_status=booking_status,
        project_id=project_id,
    )


@router.post("", response_model=BookingResponse, status_code=201)
async def create_booking(
    body: BookingCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("bookings", "create")),
):
    return await _svc(db, current_user).create(body)


# ── Single record ─────────────────────────────────────────────────

@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("bookings", "read")),
):
    return await _svc(db, current_user).get(booking_id)


@router.patch("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: str,
    body: BookingUpdate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("bookings", "update")),
):
    return await _svc(db, current_user).update(booking_id, body)


@router.delete("/{booking_id}", status_code=204)
async def delete_booking(
    booking_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("bookings", "delete")),
):
    await _svc(db, current_user).delete(booking_id)


# ── Cancel ────────────────────────────────────────────────────────

@router.post("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(
    booking_id: str,
    body: BookingCancelRequest,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("bookings", "update")),
):
    return await _svc(db, current_user).cancel(booking_id, body)


# ── Payment Plan ──────────────────────────────────────────────────

@router.post("/{booking_id}/payment-plan", response_model=PaymentPlanResponse, status_code=201)
async def create_payment_plan(
    booking_id: str,
    body: PaymentPlanCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("bookings", "update")),
):
    return await _svc(db, current_user).create_payment_plan(booking_id, body)


# ── Installments ──────────────────────────────────────────────────

@router.get("/{booking_id}/installments", response_model=list[InstallmentResponse])
async def list_installments(
    booking_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("bookings", "read")),
):
    return await _svc(db, current_user).list_installments(booking_id)
