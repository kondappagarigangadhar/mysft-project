from __future__ import annotations

from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class RoleCreate(BaseModel):
    role_name: str
    role_description: Optional[str] = None


class RoleUpdate(BaseModel):
    role_name: Optional[str] = None
    role_description: Optional[str] = None
    status: Optional[bool] = None


class RoleResponse(BaseModel):
    id: UUID
    organization_id: UUID
    role_name: str
    role_description: Optional[str] = None
    is_system_role: bool
    status: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PermissionResponse(BaseModel):
    id: UUID
    module_name: str
    action: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class RolePermissionsUpdate(BaseModel):
    permission_ids: list[UUID]
