from __future__ import annotations

import uuid
import re
import asyncpg

from app.core.exceptions import NotFoundError, ConflictError
from app.core.pagination import PaginationParams, PaginatedResponse
from app.schemas.tenants import OrganizationCreate, OrganizationUpdate, OrganizationResponse, TenantResponse


class TenantService:
    def __init__(self, db: asyncpg.Connection, current_user: dict):
        self.db = db
        self.org_id = current_user["organization_id"]

    async def _get_org_or_404(self, org_id: str) -> dict:
        row = await self.db.fetchrow(
            "SELECT * FROM organizations WHERE id=$1", uuid.UUID(org_id),
        )
        if not row:
            raise NotFoundError("Organization")
        return dict(row)

    # ── Organizations ──────────────────────────────────────────

    async def list_organizations(self, pagination: PaginationParams) -> PaginatedResponse[OrganizationResponse]:
        params: list = []
        where = "1=1"

        if pagination.search:
            params.append(f"%{pagination.search}%")
            where += f" AND (organization_name ILIKE ${len(params)} OR organization_code ILIKE ${len(params)})"

        total: int = await self.db.fetchval(f"SELECT COUNT(*) FROM organizations WHERE {where}", *params)
        params += [pagination.page_size, pagination.offset]
        rows = await self.db.fetch(
            f"SELECT * FROM organizations WHERE {where} ORDER BY created_at DESC "
            f"LIMIT ${len(params)-1} OFFSET ${len(params)}",
            *params,
        )
        return PaginatedResponse.build(
            data=[OrganizationResponse(**dict(r)) for r in rows],
            total=total,
            params=pagination,
        )

    async def get_organization(self, org_id: str) -> OrganizationResponse:
        return OrganizationResponse(**await self._get_org_or_404(org_id))

    async def create_organization(self, body: OrganizationCreate) -> OrganizationResponse:
        existing = await self.db.fetchrow(
            "SELECT id FROM organizations WHERE organization_code=$1", body.organization_code,
        )
        if existing:
            raise ConflictError(f"Organization code '{body.organization_code}' already taken")

        new_id = uuid.uuid4()
        row = await self.db.fetchrow(
            """
            INSERT INTO organizations (
                id, organization_name, organization_code, business_type,
                contact_email, contact_phone, city, state, country,
                address, timezone, currency
            ) VALUES ($1,$2,$3,$4::business_type,$5,$6,$7,$8,$9,$10,$11,$12)
            RETURNING *
            """,
            new_id, body.organization_name, body.organization_code, body.business_type,
            body.contact_email, body.contact_phone, body.city, body.state, body.country,
            body.address, body.timezone, body.currency,
        )

        # Auto-create a tenant record with a safe schema name
        schema = re.sub(r"[^a-z0-9]", "_", body.organization_code.lower())
        await self.db.execute(
            "INSERT INTO tenants (id, organization_id, db_schema) VALUES ($1,$2,$3)",
            uuid.uuid4(), new_id, schema,
        )

        return OrganizationResponse(**dict(row))

    async def update_organization(self, org_id: str, body: OrganizationUpdate) -> OrganizationResponse:
        await self._get_org_or_404(org_id)
        data = body.model_dump(exclude_unset=True)
        if not data:
            return await self.get_organization(org_id)

        keys = list(data.keys())
        enum_casts = {"status": "user_status"}
        set_clauses = []
        for i, k in enumerate(keys, start=2):
            cast = f"::{enum_casts[k]}" if k in enum_casts else ""
            set_clauses.append(f"{k}=${i}{cast}")

        await self.db.execute(
            f"UPDATE organizations SET {', '.join(set_clauses)}, updated_at=NOW() WHERE id=$1",
            uuid.UUID(org_id), *[data[k] for k in keys],
        )
        return await self.get_organization(org_id)

    # ── Tenants ────────────────────────────────────────────────

    async def list_tenants(self, pagination: PaginationParams) -> PaginatedResponse[TenantResponse]:
        total: int = await self.db.fetchval("SELECT COUNT(*) FROM tenants")
        rows = await self.db.fetch(
            "SELECT * FROM tenants ORDER BY created_at DESC LIMIT $1 OFFSET $2",
            pagination.page_size, pagination.offset,
        )
        return PaginatedResponse.build(
            data=[TenantResponse(**dict(r)) for r in rows],
            total=total,
            params=pagination,
        )

    async def get_tenant(self, tenant_id: str) -> TenantResponse:
        row = await self.db.fetchrow("SELECT * FROM tenants WHERE id=$1", uuid.UUID(tenant_id))
        if not row:
            raise NotFoundError("Tenant")
        return TenantResponse(**dict(row))

    async def get_current_org(self) -> OrganizationResponse:
        return await self.get_organization(str(self.org_id))
