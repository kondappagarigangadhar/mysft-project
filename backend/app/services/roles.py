from __future__ import annotations

import uuid
import asyncpg

from app.core.exceptions import NotFoundError, ConflictError
from app.core.pagination import PaginationParams, PaginatedResponse
from app.schemas.roles import RoleCreate, RoleUpdate, RoleResponse, PermissionResponse, RolePermissionsUpdate


class RoleService:
    def __init__(self, db: asyncpg.Connection, current_user: dict):
        self.db = db
        self.org_id = current_user["organization_id"]

    async def _get_or_404(self, role_id: str) -> dict:
        row = await self.db.fetchrow(
            "SELECT * FROM roles WHERE id=$1 AND organization_id=$2",
            uuid.UUID(role_id), self.org_id,
        )
        if not row:
            raise NotFoundError("Role")
        return dict(row)

    async def list(self, pagination: PaginationParams) -> PaginatedResponse[RoleResponse]:
        params: list = [self.org_id]
        where = "organization_id=$1"

        if pagination.search:
            params.append(f"%{pagination.search}%")
            where += f" AND role_name ILIKE ${len(params)}"

        total: int = await self.db.fetchval(f"SELECT COUNT(*) FROM roles WHERE {where}", *params)
        params += [pagination.page_size, pagination.offset]
        rows = await self.db.fetch(
            f"SELECT * FROM roles WHERE {where} ORDER BY role_name ASC "
            f"LIMIT ${len(params)-1} OFFSET ${len(params)}",
            *params,
        )
        return PaginatedResponse.build(
            data=[RoleResponse(**dict(r)) for r in rows],
            total=total,
            params=pagination,
        )

    async def get(self, role_id: str) -> RoleResponse:
        return RoleResponse(**await self._get_or_404(role_id))

    async def create(self, body: RoleCreate) -> RoleResponse:
        existing = await self.db.fetchrow(
            "SELECT id FROM roles WHERE organization_id=$1 AND role_name=$2",
            self.org_id, body.role_name,
        )
        if existing:
            raise ConflictError(f"Role '{body.role_name}' already exists")

        new_id = uuid.uuid4()
        row = await self.db.fetchrow(
            "INSERT INTO roles (id, organization_id, role_name, role_description) VALUES ($1,$2,$3,$4) RETURNING *",
            new_id, self.org_id, body.role_name, body.role_description,
        )
        return RoleResponse(**dict(row))

    async def update(self, role_id: str, body: RoleUpdate) -> RoleResponse:
        await self._get_or_404(role_id)
        data = body.model_dump(exclude_unset=True)
        if not data:
            return await self.get(role_id)

        keys = list(data.keys())
        sets = ", ".join(f"{k}=${i+2}" for i, k in enumerate(keys))
        await self.db.execute(
            f"UPDATE roles SET {sets} WHERE id=$1",
            uuid.UUID(role_id), *[data[k] for k in keys],
        )
        return await self.get(role_id)

    async def delete(self, role_id: str) -> None:
        row = await self._get_or_404(role_id)
        if row["is_system_role"]:
            from app.core.exceptions import ForbiddenError
            raise ForbiddenError("Cannot delete system roles")
        await self.db.execute("DELETE FROM roles WHERE id=$1", uuid.UUID(role_id))

    # ── Permissions ────────────────────────────────────────────

    async def list_all_permissions(self) -> list[PermissionResponse]:
        rows = await self.db.fetch("SELECT * FROM permissions ORDER BY module_name, action")
        return [PermissionResponse(**dict(r)) for r in rows]

    async def get_role_permissions(self, role_id: str) -> list[PermissionResponse]:
        await self._get_or_404(role_id)
        rows = await self.db.fetch(
            """
            SELECT p.* FROM permissions p
            JOIN role_permissions rp ON rp.permission_id = p.id
            WHERE rp.role_id=$1
            ORDER BY p.module_name, p.action
            """,
            uuid.UUID(role_id),
        )
        return [PermissionResponse(**dict(r)) for r in rows]

    async def set_role_permissions(self, role_id: str, body: RolePermissionsUpdate) -> list[PermissionResponse]:
        row = await self._get_or_404(role_id)
        if row["is_system_role"]:
            from app.core.exceptions import ForbiddenError
            raise ForbiddenError("Cannot modify system role permissions")

        rid = uuid.UUID(role_id)
        await self.db.execute("DELETE FROM role_permissions WHERE role_id=$1", rid)
        for perm_id in body.permission_ids:
            await self.db.execute(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
                rid, perm_id,
            )
        return await self.get_role_permissions(role_id)
