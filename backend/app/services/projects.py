from __future__ import annotations

import uuid
import asyncpg

from app.core.exceptions import NotFoundError
from app.core.pagination import PaginationParams, PaginatedResponse
from app.schemas.projects import ProjectCreate, ProjectUpdate, ProjectResponse, SiteLayoutResponse
from app.schemas.units import UnitResponse


class ProjectService:
    def __init__(self, db: asyncpg.Connection, current_user: dict):
        self.db = db
        self.org_id = uuid.UUID(str(current_user["organization_id"]))
        self.user_id = uuid.UUID(str(current_user["id"]))

    async def _get_or_404(self, project_id: str) -> dict:
        row = await self.db.fetchrow(
            "SELECT * FROM projects WHERE id=$1 AND organization_id=$2",
            uuid.UUID(project_id),
            self.org_id,
        )
        if not row:
            raise NotFoundError("Project")
        return dict(row)

    async def list(
        self,
        pagination: PaginationParams,
        search: str | None = None,
        status: str | None = None,
        project_type: str | None = None,
        city: str | None = None,
    ) -> PaginatedResponse[ProjectResponse]:
        params: list = [self.org_id]
        conditions: list[str] = ["organization_id=$1"]

        if search:
            params.append(f"%{search}%")
            i = len(params)
            conditions.append(f"(project_name ILIKE ${i} OR location ILIKE ${i})")

        if status:
            params.append(status)
            conditions.append(f"project_status=${len(params)}::project_status")

        if project_type:
            params.append(project_type)
            conditions.append(f"project_type=${len(params)}::project_type")

        if city:
            params.append(f"%{city}%")
            conditions.append(f"city ILIKE ${len(params)}")

        where = " AND ".join(conditions)
        sort_col = pagination.sort_by or "created_at"
        if sort_col not in {"created_at", "updated_at", "project_name", "project_status", "city"}:
            sort_col = "created_at"
        sort_order = pagination.sort_order.upper()

        total: int = await self.db.fetchval(f"SELECT COUNT(*) FROM projects WHERE {where}", *params)

        params += [pagination.page_size, pagination.offset]
        rows = await self.db.fetch(
            f"SELECT * FROM projects WHERE {where} ORDER BY {sort_col} {sort_order} LIMIT ${len(params)-1} OFFSET ${len(params)}",
            *params,
        )

        return PaginatedResponse.build(
            data=[ProjectResponse(**dict(r)) for r in rows],
            total=total,
            params=pagination,
        )

    async def get(self, project_id: str) -> ProjectResponse:
        row = await self._get_or_404(project_id)
        return ProjectResponse(**row)

    async def create(self, body: ProjectCreate) -> ProjectResponse:
        new_id = uuid.uuid4()
        await self.db.execute(
            """
            INSERT INTO projects (
                id, organization_id, project_name, project_type, project_status,
                location, city, state, total_units,
                rera_number, rera_status, rera_expiry_date, description, created_by
            ) VALUES ($1,$2,$3,$4::project_type,$5::project_status,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            """,
            new_id, self.org_id,
            body.project_name, body.project_type, body.project_status,
            body.location, body.city, body.state, body.total_units,
            body.rera_number, body.rera_status, body.rera_expiry_date,
            body.description, self.user_id,
        )
        return await self.get(str(new_id))

    async def update(self, project_id: str, body: ProjectUpdate) -> ProjectResponse:
        await self._get_or_404(project_id)
        data = body.model_dump(exclude_unset=True)
        if not data:
            return await self.get(project_id)

        enum_casts = {"project_type": "project_type", "project_status": "project_status"}
        keys = list(data.keys())
        set_clauses = []
        for i, k in enumerate(keys, start=2):
            cast = f"::{enum_casts[k]}" if k in enum_casts else ""
            set_clauses.append(f"{k}=${i}{cast}")

        set_sql = ", ".join(set_clauses) + ", updated_at=NOW()"
        await self.db.execute(
            f"UPDATE projects SET {set_sql} WHERE id=$1",
            uuid.UUID(project_id),
            *[data[k] for k in keys],
        )
        return await self.get(project_id)

    async def delete(self, project_id: str) -> None:
        await self._get_or_404(project_id)
        # projects table has no deleted_at — mark status OnHold as soft delete alternative
        # or just hard delete; using hard delete here since schema has no deleted_at
        await self.db.execute("DELETE FROM projects WHERE id=$1", uuid.UUID(project_id))

    async def list_units(
        self,
        project_id: str,
        pagination: PaginationParams,
        availability_status: str | None = None,
        unit_type: str | None = None,
    ) -> PaginatedResponse[UnitResponse]:
        await self._get_or_404(project_id)
        pid = uuid.UUID(project_id)

        params: list = [pid]
        conditions: list[str] = ["project_id=$1"]

        if availability_status:
            params.append(availability_status)
            conditions.append(f"availability_status=${len(params)}::unit_availability")

        if unit_type:
            params.append(unit_type)
            conditions.append(f"unit_type=${len(params)}::property_type")

        where = " AND ".join(conditions)
        sort_col = pagination.sort_by or "created_at"
        if sort_col not in {"created_at", "unit_number", "floor_number", "availability_status", "base_price"}:
            sort_col = "created_at"
        sort_order = pagination.sort_order.upper()

        total: int = await self.db.fetchval(f"SELECT COUNT(*) FROM units WHERE {where}", *params)

        params += [pagination.page_size, pagination.offset]
        rows = await self.db.fetch(
            f"SELECT * FROM units WHERE {where} ORDER BY {sort_col} {sort_order} LIMIT ${len(params)-1} OFFSET ${len(params)}",
            *params,
        )

        return PaginatedResponse.build(
            data=[UnitResponse(**dict(r)) for r in rows],
            total=total,
            params=pagination,
        )

    async def list_layouts(self, project_id: str) -> list[SiteLayoutResponse]:
        await self._get_or_404(project_id)
        rows = await self.db.fetch(
            "SELECT * FROM site_layouts WHERE project_id=$1 ORDER BY created_at DESC",
            uuid.UUID(project_id),
        )
        return [SiteLayoutResponse(**dict(r)) for r in rows]
