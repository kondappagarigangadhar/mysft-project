from __future__ import annotations

import uuid
import asyncpg

from app.core.exceptions import NotFoundError, ConflictError
from app.core.pagination import PaginationParams, PaginatedResponse
from app.schemas.leads import (
    LeadCreate, LeadUpdate, LeadResponse,
    LeadAssignRequest, FollowupCreate, FollowupResponse,
    SiteVisitCreate, SiteVisitResponse,
)


class LeadService:
    def __init__(self, db: asyncpg.Connection, current_user: dict):
        self.db = db
        self.org_id = current_user["organization_id"]
        self.user_id = current_user["id"]

    # ── Helpers ────────────────────────────────────────────────

    def _build_where(self, extra_conditions: list[str], params: list) -> str:
        conditions = ["organization_id=$1", *extra_conditions]
        return " AND ".join(conditions)

    async def _get_or_404(self, lead_id: str) -> dict:
        row = await self.db.fetchrow(
            "SELECT * FROM leads WHERE id=$1 AND organization_id=$2",
            uuid.UUID(lead_id), self.org_id,
        )
        if not row:
            raise NotFoundError("Lead")
        return dict(row)

    # ── CRUD ───────────────────────────────────────────────────

    async def list(
        self,
        pagination: PaginationParams,
        search: str | None = None,
        status: str | None = None,
        source: str | None = None,
        project_id: str | None = None,
        assigned_to: str | None = None,
    ) -> PaginatedResponse[LeadResponse]:
        params: list = [self.org_id]
        conditions: list[str] = []

        if search:
            params.append(f"%{search}%")
            i = len(params)
            conditions.append(f"(customer_name ILIKE ${i} OR email ILIKE ${i} OR phone_number ILIKE ${i})")

        if status:
            params.append(status)
            conditions.append(f"lead_status=${len(params)}::lead_status")

        if source:
            params.append(source)
            conditions.append(f"lead_source=${len(params)}::lead_source")

        if project_id:
            params.append(uuid.UUID(project_id))
            conditions.append(f"project_interest_id=${len(params)}")

        if assigned_to:
            params.append(uuid.UUID(assigned_to))
            conditions.append(f"assigned_to=${len(params)}")

        where = self._build_where(conditions, params)

        sort_col = pagination.sort_by or "created_at"
        sort_order = pagination.sort_order.upper()
        allowed_sorts = {"created_at", "updated_at", "customer_name", "lead_status", "lead_number"}
        if sort_col not in allowed_sorts:
            sort_col = "created_at"

        count_q = f"SELECT COUNT(*) FROM leads WHERE {where}"
        total: int = await self.db.fetchval(count_q, *params)

        params += [pagination.page_size, pagination.offset]
        rows = await self.db.fetch(
            f"SELECT * FROM leads WHERE {where} ORDER BY {sort_col} {sort_order} "
            f"LIMIT ${len(params)-1} OFFSET ${len(params)}",
            *params,
        )

        return PaginatedResponse.build(
            data=[LeadResponse(**dict(r)) for r in rows],
            total=total,
            params=pagination,
        )

    async def get(self, lead_id: str) -> LeadResponse:
        row = await self._get_or_404(lead_id)
        return LeadResponse(**row)

    async def create(self, body: LeadCreate) -> LeadResponse:
        new_id = uuid.uuid4()
        await self.db.execute(
            """
            INSERT INTO leads (
                id, organization_id, customer_name, phone_number, email,
                lead_source, project_interest_id, property_type, budget_range,
                preferred_unit_type, lead_status, lead_stage, assigned_to,
                broker_id, notes, reminder_flag, created_by
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6::lead_source, $7, $8::property_type, $9,
                $10::property_type, $11::lead_status, $12, $13,
                $14, $15, $16, $17
            )
            """,
            new_id, self.org_id, body.customer_name, body.phone_number, body.email,
            body.lead_source, body.project_interest_id, body.property_type, body.budget_range,
            body.preferred_unit_type, body.lead_status, body.lead_stage, body.assigned_to,
            body.broker_id, body.notes, body.reminder_flag, self.user_id,
        )
        return await self.get(str(new_id))

    async def update(self, lead_id: str, body: LeadUpdate) -> LeadResponse:
        await self._get_or_404(lead_id)
        data = body.model_dump(exclude_unset=True)
        if not data:
            return await self.get(lead_id)

        # Cast enum columns explicitly
        enum_casts = {
            "lead_source": "lead_source",
            "lead_status": "lead_status",
            "property_type": "property_type",
            "preferred_unit_type": "property_type",
        }
        keys = list(data.keys())
        set_clauses = []
        for i, k in enumerate(keys, start=2):
            cast = f"::{enum_casts[k]}" if k in enum_casts else ""
            set_clauses.append(f"{k}=${i}{cast}")

        set_sql = ", ".join(set_clauses) + ", updated_at=NOW()"
        await self.db.execute(
            f"UPDATE leads SET {set_sql} WHERE id=$1",
            uuid.UUID(lead_id), *[data[k] for k in keys],
        )
        return await self.get(lead_id)

    async def delete(self, lead_id: str) -> None:
        await self._get_or_404(lead_id)
        # Leads table has no deleted_at — hard delete (FK cascades handle child rows)
        await self.db.execute("DELETE FROM leads WHERE id=$1", uuid.UUID(lead_id))

    # ── Assignment ─────────────────────────────────────────────

    async def assign(self, lead_id: str, body: LeadAssignRequest) -> LeadResponse:
        await self._get_or_404(lead_id)
        lid = uuid.UUID(lead_id)

        # Mark previous assignments inactive
        await self.db.execute(
            "UPDATE lead_assignments SET is_current=FALSE WHERE lead_id=$1", lid,
        )
        await self.db.execute(
            """
            INSERT INTO lead_assignments (id, lead_id, assigned_to, assigned_by, is_current)
            VALUES ($1, $2, $3, $4, TRUE)
            """,
            uuid.uuid4(), lid, body.assigned_to, self.user_id,
        )
        await self.db.execute(
            "UPDATE leads SET assigned_to=$1, updated_at=NOW() WHERE id=$2",
            body.assigned_to, lid,
        )
        return await self.get(lead_id)

    # ── Follow-ups ─────────────────────────────────────────────

    async def add_followup(self, lead_id: str, body: FollowupCreate) -> FollowupResponse:
        await self._get_or_404(lead_id)
        new_id = uuid.uuid4()
        row = await self.db.fetchrow(
            """
            INSERT INTO lead_followups (id, lead_id, followup_date, followup_type, notes, next_action, conducted_by)
            VALUES ($1, $2, $3, $4::followup_type, $5, $6, $7)
            RETURNING *
            """,
            new_id, uuid.UUID(lead_id), body.followup_date,
            body.followup_type, body.notes, body.next_action, self.user_id,
        )
        return FollowupResponse(**dict(row))

    async def list_followups(self, lead_id: str) -> list[FollowupResponse]:
        await self._get_or_404(lead_id)
        rows = await self.db.fetch(
            "SELECT * FROM lead_followups WHERE lead_id=$1 ORDER BY followup_date DESC",
            uuid.UUID(lead_id),
        )
        return [FollowupResponse(**dict(r)) for r in rows]

    # ── Site Visits ────────────────────────────────────────────

    async def add_site_visit(self, lead_id: str, body: SiteVisitCreate) -> SiteVisitResponse:
        await self._get_or_404(lead_id)
        new_id = uuid.uuid4()
        row = await self.db.fetchrow(
            """
            INSERT INTO lead_site_visits (id, lead_id, visit_date, visit_status, remarks, conducted_by)
            VALUES ($1, $2, $3, 'Planned'::visit_status, $4, $5)
            RETURNING *
            """,
            new_id, uuid.UUID(lead_id), body.visit_date, body.remarks, self.user_id,
        )
        return SiteVisitResponse(**dict(row))

    async def list_site_visits(self, lead_id: str) -> list[SiteVisitResponse]:
        await self._get_or_404(lead_id)
        rows = await self.db.fetch(
            "SELECT * FROM lead_site_visits WHERE lead_id=$1 ORDER BY visit_date DESC",
            uuid.UUID(lead_id),
        )
        return [SiteVisitResponse(**dict(r)) for r in rows]

    # ── Activity (combined timeline) ───────────────────────────

    async def get_activity(self, lead_id: str) -> list[dict]:
        await self._get_or_404(lead_id)
        lid = uuid.UUID(lead_id)

        followups = await self.db.fetch(
            "SELECT id, 'followup' AS type, followup_date AS event_at, followup_type AS subtype, notes "
            "FROM lead_followups WHERE lead_id=$1", lid,
        )
        visits = await self.db.fetch(
            "SELECT id, 'site_visit' AS type, visit_date AS event_at, visit_status AS subtype, remarks AS notes "
            "FROM lead_site_visits WHERE lead_id=$1", lid,
        )
        assignments = await self.db.fetch(
            "SELECT id, 'assignment' AS type, created_at AS event_at, NULL AS subtype, NULL AS notes "
            "FROM lead_assignments WHERE lead_id=$1", lid,
        )

        timeline = [dict(r) for r in [*followups, *visits, *assignments]]
        timeline.sort(key=lambda x: x["event_at"], reverse=True)
        return timeline
