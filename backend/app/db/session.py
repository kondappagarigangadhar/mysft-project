import asyncpg
from typing import AsyncGenerator
from app.core.config import settings

_pool: asyncpg.Pool | None = None


async def init_db_pool() -> None:
    global _pool
    dsn = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    _pool = await asyncpg.create_pool(dsn=dsn, min_size=2, max_size=20)


async def close_db_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()


async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    if _pool is None:
        raise RuntimeError("DB pool not initialised")
    async with _pool.acquire() as conn:
        yield conn
