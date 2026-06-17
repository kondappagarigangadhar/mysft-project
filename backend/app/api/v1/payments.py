from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from typing import Optional
import asyncpg

from app.db.session import get_db
from app.core.auth import require_permission
from app.core.pagination import PaginationParams, PaginatedResponse
from app.schemas.payments import (
    PaymentCreate,
    PaymentUpdate,
    PaymentResponse,
    PaymentLinkCreate,
    PaymentLinkResponse,
)
from app.services.payments import PaymentService

router = APIRouter()


def _svc(db: asyncpg.Connection, current_user: dict) -> PaymentService:
    return PaymentService(db, current_user)


# ── Static routes first (BEFORE parameterized) ───────────────────

@router.get("/links", response_model=PaginatedResponse[PaymentLinkResponse])
async def list_payment_links(
    pagination: PaginationParams = Depends(),
    booking_id: Optional[str] = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("payments", "read")),
):
    return await _svc(db, current_user).list_links(pagination, booking_id=booking_id)


@router.post("/links", response_model=PaymentLinkResponse, status_code=201)
async def create_payment_link(
    body: PaymentLinkCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("payments", "create")),
):
    return await _svc(db, current_user).create_link(body)


@router.post("/webhook")
async def payment_webhook():
    """Webhook stub — acknowledges receipt without processing."""
    return {"status": "received"}


# ── Collection ───────────────────────────────────────────────────

@router.get("", response_model=PaginatedResponse[PaymentResponse])
async def list_payments(
    pagination: PaginationParams = Depends(),
    booking_id: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("payments", "read")),
):
    return await _svc(db, current_user).list(
        pagination,
        booking_id=booking_id,
        payment_status=payment_status,
    )


@router.post("", response_model=PaymentResponse, status_code=201)
async def create_payment(
    body: PaymentCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("payments", "create")),
):
    return await _svc(db, current_user).create(body)


# ── Parameterized routes (AFTER static) ─────────────────────────

@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("payments", "read")),
):
    return await _svc(db, current_user).get(payment_id)


@router.patch("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: str,
    body: PaymentUpdate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(require_permission("payments", "update")),
):
    return await _svc(db, current_user).update(payment_id, body)
