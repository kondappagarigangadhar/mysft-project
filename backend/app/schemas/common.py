from pydantic import BaseModel
from typing import Generic, TypeVar, List
from uuid import UUID
from datetime import datetime

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int


class AuditFields(BaseModel):
    created_at: datetime | None = None
    updated_at: datetime | None = None
    created_by: UUID | None = None
