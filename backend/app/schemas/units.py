from __future__ import annotations

from typing import Literal, Optional
from uuid import UUID
from datetime import datetime

from pydantic import BaseModel

UnitType = Literal["Plot", "Apartment", "Villa", "Commercial"]
UnitAvailability = Literal["Available", "Reserved", "Sold", "Blocked"]
PlotFacing = Literal["North", "South", "East", "West", "NorthEast", "NorthWest", "SouthEast", "SouthWest"]


class UnitCreate(BaseModel):
    project_id: UUID
    unit_number: str
    unit_type: UnitType
    unit_size: float
    size_unit: str = "sqft"
    block_phase: Optional[str] = None
    floor_number: Optional[int] = None
    base_price: float
    offer_price: Optional[float] = None
    availability_status: UnitAvailability = "Available"
    facing: Optional[PlotFacing] = None
    road_size: Optional[float] = None


class UnitUpdate(BaseModel):
    unit_number: Optional[str] = None
    unit_type: Optional[UnitType] = None
    unit_size: Optional[float] = None
    size_unit: Optional[str] = None
    block_phase: Optional[str] = None
    floor_number: Optional[int] = None
    base_price: Optional[float] = None
    offer_price: Optional[float] = None
    facing: Optional[PlotFacing] = None
    road_size: Optional[float] = None


class UnitAvailabilityUpdate(BaseModel):
    availability_status: UnitAvailability


class UnitResponse(BaseModel):
    id: UUID
    project_id: UUID
    unit_number: str
    unit_type: str
    unit_size: float
    size_unit: str
    block_phase: Optional[str] = None
    floor_number: Optional[int] = None
    base_price: float
    offer_price: Optional[float] = None
    availability_status: str
    is_locked: bool = False
    facing: Optional[str] = None
    road_size: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
