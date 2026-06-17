from __future__ import annotations

import uuid
import asyncpg

from app.core.exceptions import NotFoundError
from app.core.pagination import PaginationParams, PaginatedResponse
from app.schemas.bookings import (
    BookingCreate, BookingUpdate, BookingCancelRequest,
    BookingResponse, PaymentPlanCreate, PaymentPlanResponse, InstallmentResponse,
)


class BookingService:
    def __init__(self, db: asyncpg.Connection, current_user: dict):
        self.db = db
        self.org_id = uuid.UUID(str(current_user["organization_id"]))
        self.user_id = uuid.UUID(str(current_user["id"]))

    async def _get_or_404(self, booking_id: str) -> dict:
        row = await self.db.fetchrow(
            """
            SELECT b.*,
                   (SELECT COUNT(*) FROM payment_installments pi WHERE pi.booking_id=b.id) AS installments_count
            FROM bookings b
            WHERE b.id=$1 AND b.organization_id=$2
            """,
            uuid.UUID(booking_id), self.org_id,
        )
        if not row:
            raise NotFoundError("Booking")
        return dict(row)

    async def list(
        self,
        pagination: PaginationParams,
        search: str | None = None,
        booking_status: str | None = None,
        project_id: str | None = None,
    ) -> PaginatedResponse[BookingResponse]:
        params: list = [self.org_id]
        conditions: list[str] = ["organization_id=$1"]

        if search:
            params.append(f"%{search}%")
            conditions.append(f"customer_name ILIKE ${len(params)}")

        if booking_status:
            params.append(booking_status)
            conditions.append(f"booking_status=${len(params)}::booking_status")

        if project_id:
            params.append(uuid.UUID(project_id))
            conditions.append(f"project_id=${len(params)}")

        where = " AND ".join(conditions)
        sort_col = pagination.sort_by or "created_at"
        if sort_col not in {"created_at", "updated_at", "customer_name", "booking_status", "booking_date"}:
            sort_col = "created_at"
        sort_order = pagination.sort_order.upper()

        total: int = await self.db.fetchval(f"SELECT COUNT(*) FROM bookings WHERE {where}", *params)

        params += [pagination.page_size, pagination.offset]
        rows = await self.db.fetch(
            f"""
            SELECT b.*,
                   (SELECT COUNT(*) FROM payment_installments pi WHERE pi.booking_id=b.id) AS installments_count
            FROM bookings b
            WHERE {where}
            ORDER BY {sort_col} {sort_order}
            LIMIT ${len(params)-1} OFFSET ${len(params)}
            """,
            *params,
        )

        return PaginatedResponse.build(
            data=[BookingResponse(**dict(r)) for r in rows],
            total=total,
            params=pagination,
        )

    async def get(self, booking_id: str) -> BookingResponse:
        return BookingResponse(**await self._get_or_404(booking_id))

    async def create(self, body: BookingCreate) -> BookingResponse:
        new_id = uuid.uuid4()
        await self.db.execute(
            """
            INSERT INTO bookings (
                id, organization_id, lead_id, project_id, unit_id,
                customer_name, phone_number, email,
                unit_price, booking_status, created_by
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::booking_status,$11)
            """,
            new_id, self.org_id, body.lead_id, body.project_id, body.unit_id,
            body.customer_name, body.phone_number, body.email,
            body.unit_price, body.booking_status, self.user_id,
        )
        await self.db.execute(
            "UPDATE units SET availability_status='Reserved'::unit_availability, updated_at=NOW() WHERE id=$1",
            body.unit_id,
        )
        return await self.get(str(new_id))

    async def update(self, booking_id: str, body: BookingUpdate) -> BookingResponse:
        await self._get_or_404(booking_id)
        data = body.model_dump(exclude_unset=True)
        if not data:
            return await self.get(booking_id)

        enum_casts = {"booking_status": "booking_status"}
        keys = list(data.keys())
        set_clauses = []
        for i, k in enumerate(keys, start=2):
            cast = f"::{enum_casts[k]}" if k in enum_casts else ""
            set_clauses.append(f"{k}=${i}{cast}")

        set_sql = ", ".join(set_clauses) + ", updated_at=NOW()"
        await self.db.execute(
            f"UPDATE bookings SET {set_sql} WHERE id=$1",
            uuid.UUID(booking_id), *[data[k] for k in keys],
        )
        return await self.get(booking_id)

    async def cancel(self, booking_id: str, body: BookingCancelRequest) -> BookingResponse:
        row = await self._get_or_404(booking_id)
        bid = uuid.UUID(booking_id)
        await self.db.execute(
            "UPDATE bookings SET booking_status='Cancelled'::booking_status, updated_at=NOW() WHERE id=$1",
            bid,
        )
        await self.db.execute(
            "UPDATE units SET availability_status='Available'::unit_availability, updated_at=NOW() WHERE id=$1",
            row["unit_id"],
        )
        return await self.get(booking_id)

    async def create_payment_plan(self, booking_id: str, body: PaymentPlanCreate) -> PaymentPlanResponse:
        await self._get_or_404(booking_id)
        bid = uuid.UUID(booking_id)
        plan_id = uuid.uuid4()

        await self.db.execute(
            "INSERT INTO payment_plans (id, booking_id, plan_name, installment_count, total_amount, payment_milestones) VALUES ($1,$2,$3,$4,$5,$6)",
            plan_id, bid, body.plan_name, body.installment_count, body.total_amount, body.payment_milestones,
        )

        installment_rows: list[InstallmentResponse] = []
        for inst in body.installments:
            inst_id = uuid.uuid4()
            row = await self.db.fetchrow(
                "INSERT INTO payment_installments (id, plan_id, booking_id, installment_number, due_date, amount) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
                inst_id, plan_id, bid, inst.installment_number, inst.due_date, inst.amount,
            )
            installment_rows.append(InstallmentResponse(**dict(row)))

        plan_row = await self.db.fetchrow("SELECT * FROM payment_plans WHERE id=$1", plan_id)
        result = PaymentPlanResponse(**dict(plan_row))
        result.installments = installment_rows
        return result

    async def list_installments(self, booking_id: str) -> list[InstallmentResponse]:
        await self._get_or_404(booking_id)
        rows = await self.db.fetch(
            "SELECT * FROM payment_installments WHERE booking_id=$1 ORDER BY installment_number",
            uuid.UUID(booking_id),
        )
        return [InstallmentResponse(**dict(r)) for r in rows]
