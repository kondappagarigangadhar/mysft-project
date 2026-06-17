from fastapi import APIRouter, Depends
import asyncpg
from app.db.session import get_db

router = APIRouter()


@router.get("/health")
async def health_check(db: asyncpg.Connection = Depends(get_db)):
    await db.fetchval("SELECT 1")
    return {"status": "ok"}
