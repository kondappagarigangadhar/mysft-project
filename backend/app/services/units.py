from __future__ import annotations

import uuid
import asyncpg

from app.core.exceptions import NotFoundError
from app.core.pagination import PaginationParams, PaginatedResponse
from app.schemas.units import UnitCreate, UnitUpdate, UnitAvailabilityUpdate, UnitResponse


class UnitService:
    def __init__(self, db: asyncpg.Connection, current_user: dict):
        self.db = db
        self.org_id = uuid.UUID(str(current_user["organization_id"]))

    async def _get_or_404(self, unit_id: str) -> dict:
        row = await self.db.fetchrow(
            """
            SELECT u.* FROM units u
            JOIN projects p ON p.id = u.project_id
            WHERE u.id=$1 AND p.organization_id=$2
            """,
            uuid.UUID(unit_id),
            self.org_id,
        )
        if not row:
            raise NotFoundError("Unit")
        return dict(row)

    async def list(
        self,
        pagination: PaginationParams,
        project_id: str | None = None,
        availability_status: str | None = None,
        unit_type: str | None = None,
    ) -> PaginatedResponse[UnitResponse]:
        params: list = [self.org_id]
        conditions: list[str] = ["p.organization_id=$1"]

        if project_id:
            params.append(uuid.UUID(project_id))
            conditions.append(f"u.project_id=${len(params)}")

        if availability_status:
            params.append(availability_status)
            conditions.append(f"u.availability_status=${len(params)}::unit_availability")

        if unit_type:
            params.append(unit_type)
            conditions.append(f"u.unit_type=${len(params)}::property_type")

        where = " AND ".join(conditions)
        sort_col = pagination.sort_by or "u.created_at"
        if sort_col not in {"created_at", "unit_number", "floor_number", "availability_status", "base_price"}:
            sort_col = "u.created_at"
        else:
            sort_col = f"u.{sort_col}"
        sort_order = pagination.sort_order.upper()

        total: int = await self.db.fetchval(
            f"SELECT COUNT(*) FROM units u JOIN projects p ON p.id=u.project_id WHERE {where}", *params
        )

        params += [pagination.page_size, pagination.offset]
        rows = await self.db.fetch(
            f"SELECT u.* FROM units u JOIN projects p ON p.id=u.project_id WHERE {where} ORDER BY {sort_col} {sort_order} LIMIT ${len(params)-1} OFFSET ${len(params)}",
            *params,
        )

        return PaginatedResponse.build(
            data=[UnitResponse(**dict(r)) for r in rows],
            total=total,
            params=pagination,
        )

    async def get(self, unit_id: str) -> UnitResponse:
        row = await self._get_or_404(unit_id)
        return UnitResponse(**row)

    async def create(self, body: UnitCreate) -> UnitResponse:
        new_id = uuid.uuid4()
        await self.db.execute(
            """
            INSERT INTO units (
                id, project_id, unit_number, unit_type, unit_size, size_unit,
                block_phase, floor_number, base_price, offer_price,
                availability_status, facing, road_size
            ) VALUES ($1,$2,$3,$4::property_type,$5,$6,$7,$8,$9,$10,$11::unit_availability,$12::plot_facing,$13)
            """,
            new_id, body.project_id, body.unit_number, body.unit_type, body.unit_size, body.size_unit,
            body.block_phase, body.floor_number, body.base_price, body.offer_price,
            body.availability_status, body.facing, body.road_size,
        )
        return await self.get(str(new_id))

    async def update(self, unit_id: str, body: UnitUpdate) -> UnitResponse:
        await self._get_or_404(unit_id)
        data = body.model_dump(exclude_unset=True)
        if not data:
            return await self.get(unit_id)

        enum_casts = {"unit_type": "property_type", "facing": "plot_facing"}
        keys = list(data.keys())
        set_clauses = []
        for i, k in enumerate(keys, start=2):
            cast = f"::{enum_casts[k]}" if k in enum_casts else ""
            set_clauses.append(f"{k}=${i}{cast}")

        set_sql = ", ".join(set_clauses) + ", updated_at=NOW()"
        await self.db.execute(
            f"UPDATE units SET {set_sql} WHERE id=$1",
            uuid.UUID(unit_id),
            *[data[k] for k in keys],
        )
        return await self.get(unit_id)

    async def delete(self, unit_id: str) -> None:
        await self._get_or_404(unit_id)
        await self.db.execute("DELETE FROM units WHERE id=$1", uuid.UUID(unit_id))

    async def update_availability(self, unit_id: str, body: UnitAvailabilityUpdate) -> UnitResponse:
        await self._get_or_404(unit_id)
        await self.db.execute(
            "UPDATE units SET availability_status=$2::unit_availability, updated_at=NOW() WHERE id=$1",
            uuid.UUID(unit_id),
            body.availability_status,
        )
        return await self.get(unit_id)
