from __future__ import annotations

import uuid
import asyncpg

from app.core.exceptions import NotFoundError
from app.core.pagination import PaginationParams, PaginatedResponse
from app.schemas.payments import (
    PaymentCreate, PaymentUpdate, PaymentResponse,
    PaymentLinkCreate, PaymentLinkResponse,
)


class PaymentService:
    def __init__(self, db: asyncpg.Connection, current_user: dict):
        self.db = db
        self.org_id = uuid.UUID(str(current_user["organization_id"]))
        self.user_id = uuid.UUID(str(current_user["id"]))

    async def _get_or_404(self, payment_id: str) -> dict:
        row = await self.db.fetchrow(
            "SELECT * FROM payments WHERE id=$1 AND organization_id=$2",
            uuid.UUID(payment_id), self.org_id,
        )
        if not row:
            raise NotFoundError("Payment")
        return dict(row)

    async def _recalculate_installment(self, installment_id: uuid.UUID) -> None:
        total_paid = await self.db.fetchval(
            "SELECT COALESCE(SUM(payment_amount),0) FROM payments WHERE installment_id=$1 AND payment_status='Completed'",
            installment_id,
        )
        inst = await self.db.fetchrow("SELECT amount FROM payment_installments WHERE id=$1", installment_id)
        if not inst:
            return
        amount = inst["amount"]
        if total_paid >= amount:
            new_status = "Completed"
        elif total_paid > 0:
            new_status = "Partial"
        else:
            new_status = "Pending"
        await self.db.execute(
            "UPDATE payment_installments SET paid_amount=$2, payment_status=$3::payment_status WHERE id=$1",
            installment_id, total_paid, new_status,
        )

    async def list(
        self,
        pagination: PaginationParams,
        booking_id: str | None = None,
        payment_status: str | None = None,
    ) -> PaginatedResponse[PaymentResponse]:
        params: list = [self.org_id]
        conditions: list[str] = ["organization_id=$1"]

        if booking_id:
            params.append(uuid.UUID(booking_id))
            conditions.append(f"booking_id=${len(params)}")

        if payment_status:
            params.append(payment_status)
            conditions.append(f"payment_status=${len(params)}::payment_status")

        where = " AND ".join(conditions)
        sort_col = pagination.sort_by or "created_at"
        if sort_col not in {"created_at", "payment_date", "payment_amount", "payment_status"}:
            sort_col = "created_at"
        sort_order = pagination.sort_order.upper()

        total: int = await self.db.fetchval(f"SELECT COUNT(*) FROM payments WHERE {where}", *params)

        params += [pagination.page_size, pagination.offset]
        rows = await self.db.fetch(
            f"SELECT * FROM payments WHERE {where} ORDER BY {sort_col} {sort_order} LIMIT ${len(params)-1} OFFSET ${len(params)}",
            *params,
        )

        return PaginatedResponse.build(
            data=[PaymentResponse(**dict(r)) for r in rows],
            total=total,
            params=pagination,
        )

    async def get(self, payment_id: str) -> PaymentResponse:
        return PaymentResponse(**await self._get_or_404(payment_id))

    async def create(self, body: PaymentCreate) -> PaymentResponse:
        new_id = uuid.uuid4()
        await self.db.execute(
            """
            INSERT INTO payments (
                id, organization_id, booking_id, installment_id,
                payment_amount, payment_date, payment_mode,
                receipt_number, payment_status, transaction_id, recorded_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7::payment_mode,$8,$9::payment_status,$10,$11)
            """,
            new_id, self.org_id, body.booking_id, body.installment_id,
            body.payment_amount, body.payment_date, body.payment_mode,
            body.receipt_number, body.payment_status, body.transaction_id, self.user_id,
        )
        if body.installment_id and body.payment_status == "Completed":
            await self._recalculate_installment(body.installment_id)
        row = await self.db.fetchrow("SELECT * FROM payments WHERE id=$1", new_id)
        return PaymentResponse(**dict(row))

    async def update(self, payment_id: str, body: PaymentUpdate) -> PaymentResponse:
        row = await self._get_or_404(payment_id)
        data = body.model_dump(exclude_unset=True)
        if not data:
            return PaymentResponse(**row)

        enum_casts = {"payment_mode": "payment_mode", "payment_status": "payment_status"}
        keys = list(data.keys())
        set_clauses = []
        for i, k in enumerate(keys, start=2):
            cast = f"::{enum_casts[k]}" if k in enum_casts else ""
            set_clauses.append(f"{k}=${i}{cast}")

        set_sql = ", ".join(set_clauses)
        await self.db.execute(
            f"UPDATE payments SET {set_sql} WHERE id=$1",
            uuid.UUID(payment_id), *[data[k] for k in keys],
        )
        updated = await self.db.fetchrow("SELECT * FROM payments WHERE id=$1", uuid.UUID(payment_id))
        if updated["installment_id"]:
            await self._recalculate_installment(updated["installment_id"])
        return PaymentResponse(**dict(updated))

    async def list_links(self, booking_id: str | None = None) -> list[PaymentLinkResponse]:
        if booking_id:
            rows = await self.db.fetch(
                "SELECT pl.* FROM payment_links pl JOIN bookings b ON b.id=pl.booking_id WHERE b.organization_id=$1 AND pl.booking_id=$2 ORDER BY pl.created_at DESC",
                self.org_id, uuid.UUID(booking_id),
            )
        else:
            rows = await self.db.fetch(
                "SELECT pl.* FROM payment_links pl JOIN bookings b ON b.id=pl.booking_id WHERE b.organization_id=$1 ORDER BY pl.created_at DESC",
                self.org_id,
            )
        return [PaymentLinkResponse(**dict(r)) for r in rows]

    async def create_link(self, body: PaymentLinkCreate) -> PaymentLinkResponse:
        new_id = uuid.uuid4()
        mock_url = f"https://pay.arris.dev/link/{new_id}"
        await self.db.execute(
            """
            INSERT INTO payment_links (
                id, booking_id, payment_amount, payment_purpose,
                payment_link_url, send_via, customer_contact, expiry_date, created_by
            ) VALUES ($1,$2,$3,$4::payment_purpose,$5,'SMS',$6,$7,$8)
            """,
            new_id, body.booking_id, body.payment_amount, body.payment_purpose,
            mock_url, body.customer_contact, body.expiry_date, self.user_id,
        )
        row = await self.db.fetchrow("SELECT * FROM payment_links WHERE id=$1", new_id)
        return PaymentLinkResponse(**dict(row))
