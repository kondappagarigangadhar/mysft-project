from app.core.exceptions import NotFoundError
from app.core.pagination import PaginationParams, PaginatedResponse
from app.schemas.leads import LeadCreate, LeadUpdate, LeadResponse
import asyncpg
import uuid


class LeadService:
    def __init__(self, db: asyncpg.Connection, current_user):
        self.db = db
        self.org_id = current_user["organization_id"]

    async def list(self, pagination: PaginationParams, search: str | None = None, status: str | None = None) -> PaginatedResponse[LeadResponse]:
        conditions = ["organization_id=$1", "deleted_at IS NULL"]
        params: list = [self.org_id]
        if search:
            params.append(f"%{search}%")
            conditions.append(f"(full_name ILIKE ${len(params)} OR email ILIKE ${len(params)})")
        if status:
            params.append(status)
            conditions.append(f"status=${len(params)}")
        where = " AND ".join(conditions)
        total = await self.db.fetchval(f"SELECT COUNT(*) FROM leads WHERE {where}", *params)
        rows = await self.db.fetch(
            f"SELECT * FROM leads WHERE {where} ORDER BY created_at DESC LIMIT ${ len(params)+1} OFFSET ${len(params)+2}",
            *params, pagination.size, pagination.offset,
        )
        return PaginatedResponse(
            items=[dict(r) for r in rows], total=total,
            page=pagination.page, size=pagination.size,
        )

    async def get(self, lead_id: str):
        row = await self.db.fetchrow("SELECT * FROM leads WHERE id=$1 AND organization_id=$2 AND deleted_at IS NULL", uuid.UUID(lead_id), self.org_id)
        if not row:
            raise NotFoundError(f"Lead {lead_id} not found")
        return dict(row)

    async def create(self, body: LeadCreate):
        new_id = uuid.uuid4()
        await self.db.execute(
            "INSERT INTO leads (id, organization_id, full_name, email, phone, source, status, budget_min, budget_max, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
            new_id, self.org_id, body.full_name, body.email, body.phone,
            body.source, body.status, body.budget_min, body.budget_max, body.notes,
        )
        return await self.get(str(new_id))

    async def update(self, lead_id: str, body: LeadUpdate):
        existing = await self.get(lead_id)
        data = body.model_dump(exclude_unset=True)
        if not data:
            return existing
        sets = ", ".join(f"{k}=${i+2}" for i, k in enumerate(data))
        await self.db.execute(
            f"UPDATE leads SET {sets}, updated_at=NOW() WHERE id=$1",
            uuid.UUID(lead_id), *data.values(),
        )
        return await self.get(lead_id)

    async def delete(self, lead_id: str):
        await self.get(lead_id)
        await self.db.execute("UPDATE leads SET deleted_at=NOW() WHERE id=$1", uuid.UUID(lead_id))
