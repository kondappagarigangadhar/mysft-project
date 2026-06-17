from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel
from fastapi import Query

T = TypeVar("T")


class PaginationParams:
    def __init__(
        self,
        page: int = Query(1, ge=1),
        page_size: int = Query(25, ge=1, le=200),
        sort_by: Optional[str] = Query(None),
        sort_order: str = Query("desc", pattern="^(asc|desc)$"),
        search: Optional[str] = Query(None),
    ):
        self.page = page
        self.page_size = page_size
        self.sort_by = sort_by
        self.sort_order = sort_order
        self.search = search

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int


class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    pagination: PaginationMeta

    @classmethod
    def build(cls, data: List[Any], total: int, params: PaginationParams):
        import math
        return cls(
            data=data,
            pagination=PaginationMeta(
                page=params.page,
                page_size=params.page_size,
                total=total,
                total_pages=max(1, math.ceil(total / params.page_size)),
            ),
        )
