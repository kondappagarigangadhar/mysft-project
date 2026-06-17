import asyncpg
import uuid
from typing import Any


class BaseRepository:
    table: str = ""

    def __init__(self, db: asyncpg.Connection, org_id: uuid.UUID):
        self.db = db
        self.org_id = org_id

    async def find_by_id(self, record_id: uuid.UUID) -> dict | None:
        row = await self.db.fetchrow(
            f"SELECT * FROM {self.table} WHERE id=$1 AND organization_id=$2 AND deleted_at IS NULL",
            record_id, self.org_id,
        )
        return dict(row) if row else None

    async def soft_delete(self, record_id: uuid.UUID) -> None:
        await self.db.execute(
            f"UPDATE {self.table} SET deleted_at=NOW() WHERE id=$1 AND organization_id=$2",
            record_id, self.org_id,
        )
