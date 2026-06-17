from __future__ import annotations

import uuid
import asyncpg

from app.core.auth import hash_password, verify_password
from app.core.exceptions import NotFoundError, ConflictError, ForbiddenError
from app.core.pagination import PaginationParams, PaginatedResponse
from app.schemas.users import UserCreate, UserUpdate, UserResponse, UserRoleAssign, PasswordChangeRequest


class UserService:
    def __init__(self, db: asyncpg.Connection, current_user: dict):
        self.db = db
        self.org_id = current_user["organization_id"]
        self.user_id = current_user["id"]

    async def _get_or_404(self, user_id: str) -> dict:
        row = await self.db.fetchrow(
            "SELECT * FROM users WHERE id=$1 AND organization_id=$2",
            uuid.UUID(user_id), self.org_id,
        )
        if not row:
            raise NotFoundError("User")
        return dict(row)

    async def list(self, pagination: PaginationParams) -> PaginatedResponse[UserResponse]:
        params: list = [self.org_id]
        conditions: list[str] = []

        if pagination.search:
            params.append(f"%{pagination.search}%")
            i = len(params)
            conditions.append(
                f"(first_name ILIKE ${i} OR last_name ILIKE ${i} OR email ILIKE ${i})"
            )

        where = "organization_id=$1" + (
            " AND " + " AND ".join(conditions) if conditions else ""
        )

        sort_col = pagination.sort_by or "created_at"
        if sort_col not in {"created_at", "updated_at", "first_name", "email", "status"}:
            sort_col = "created_at"

        total: int = await self.db.fetchval(f"SELECT COUNT(*) FROM users WHERE {where}", *params)
        params += [pagination.page_size, pagination.offset]
        rows = await self.db.fetch(
            f"SELECT * FROM users WHERE {where} ORDER BY {sort_col} {pagination.sort_order.upper()} "
            f"LIMIT ${len(params)-1} OFFSET ${len(params)}",
            *params,
        )
        return PaginatedResponse.build(
            data=[UserResponse(**dict(r)) for r in rows],
            total=total,
            params=pagination,
        )

    async def get(self, user_id: str) -> UserResponse:
        row = await self._get_or_404(user_id)
        return UserResponse(**row)

    async def create(self, body: UserCreate) -> UserResponse:
        existing = await self.db.fetchrow("SELECT id FROM users WHERE email=$1", body.email)
        if existing:
            raise ConflictError("Email already registered")

        new_id = uuid.uuid4()
        await self.db.execute(
            """
            INSERT INTO users (
                id, organization_id, first_name, last_name, email, password_hash,
                phone_number, designation, business_unit_id, department_id,
                reporting_manager_id, joining_date
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
            """,
            new_id, self.org_id, body.first_name, body.last_name, body.email,
            hash_password(body.password), body.phone_number, body.designation,
            body.business_unit_id, body.department_id,
            body.reporting_manager_id, body.joining_date,
        )

        if body.role_ids:
            await self._set_roles(new_id, body.role_ids)

        return await self.get(str(new_id))

    async def update(self, user_id: str, body: UserUpdate) -> UserResponse:
        await self._get_or_404(user_id)
        data = body.model_dump(exclude_unset=True)
        if not data:
            return await self.get(user_id)

        keys = list(data.keys())
        enum_casts = {"status": "user_status"}
        set_clauses = []
        for i, k in enumerate(keys, start=2):
            cast = f"::{enum_casts[k]}" if k in enum_casts else ""
            set_clauses.append(f"{k}=${i}{cast}")

        await self.db.execute(
            f"UPDATE users SET {', '.join(set_clauses)}, updated_at=NOW() WHERE id=$1",
            uuid.UUID(user_id), *[data[k] for k in keys],
        )
        return await self.get(user_id)

    async def delete(self, user_id: str) -> None:
        await self._get_or_404(user_id)
        await self.db.execute(
            "UPDATE users SET status='Inactive'::user_status, updated_at=NOW() WHERE id=$1",
            uuid.UUID(user_id),
        )

    async def assign_roles(self, user_id: str, body: UserRoleAssign) -> UserResponse:
        await self._get_or_404(user_id)
        uid = uuid.UUID(user_id)
        await self._set_roles(uid, body.role_ids)
        return await self.get(user_id)

    async def _set_roles(self, user_id: uuid.UUID, role_ids: list[uuid.UUID]) -> None:
        await self.db.execute("DELETE FROM user_roles WHERE user_id=$1", user_id)
        for role_id in role_ids:
            await self.db.execute(
                "INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
                user_id, role_id, self.user_id,
            )

    async def get_roles(self, user_id: str) -> list[dict]:
        await self._get_or_404(user_id)
        rows = await self.db.fetch(
            """
            SELECT r.id, r.role_name, r.role_description, r.is_system_role
            FROM roles r
            JOIN user_roles ur ON ur.role_id = r.id
            WHERE ur.user_id=$1
            """,
            uuid.UUID(user_id),
        )
        return [dict(r) for r in rows]

    async def change_password(self, user_id: str, body: PasswordChangeRequest) -> None:
        row = await self._get_or_404(user_id)
        if not verify_password(body.current_password, row["password_hash"]):
            raise ForbiddenError("Current password is incorrect")
        await self.db.execute(
            "UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2",
            hash_password(body.new_password), uuid.UUID(user_id),
        )

    async def me(self) -> UserResponse:
        return await self.get(str(self.user_id))
