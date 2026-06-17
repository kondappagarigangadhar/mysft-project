from __future__ import annotations

from typing import Literal, Optional
from uuid import UUID
from datetime import date, datetime

from pydantic import BaseModel

ProjectType = Literal["Plot", "Apartment", "Villa", "Mixed"]
ProjectStatus = Literal["Upcoming", "Active", "SoldOut", "Completed", "OnHold"]


class ProjectCreate(BaseModel):
    project_name: str
    project_type: ProjectType
    project_status: ProjectStatus = "Upcoming"
    location: str
    city: Optional[str] = None
    state: Optional[str] = None
    total_units: int = 0
    rera_number: Optional[str] = None
    rera_status: Optional[str] = None
    rera_expiry_date: Optional[date] = None
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    project_type: Optional[ProjectType] = None
    project_status: Optional[ProjectStatus] = None
    location: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    total_units: Optional[int] = None
    rera_number: Optional[str] = None
    rera_status: Optional[str] = None
    rera_expiry_date: Optional[date] = None
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: UUID
    organization_id: UUID
    project_number: Optional[int] = None
    project_name: str
    project_type: str
    project_status: str
    location: str
    city: Optional[str] = None
    state: Optional[str] = None
    total_units: int = 0
    rera_number: Optional[str] = None
    rera_status: Optional[str] = None
    rera_expiry_date: Optional[date] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SiteLayoutResponse(BaseModel):
    id: UUID
    project_id: UUID
    layout_name: str
    layout_file_url: str
    layout_type: str
    canvas_width: Optional[int] = None
    canvas_height: Optional[int] = None
    status: bool = True
    created_at: datetime

    model_config = {"from_attributes": True}
