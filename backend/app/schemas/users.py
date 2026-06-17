from __future__ import annotations

from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime, date

UserStatus = Literal["Active", "Inactive", "Suspended"]


class UserCreate(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: EmailStr
    password: str
    phone_number: Optional[str] = None
    designation: Optional[str] = None
    business_unit_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    reporting_manager_id: Optional[UUID] = None
    joining_date: Optional[date] = None
    role_ids: list[UUID] = []


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    designation: Optional[str] = None
    business_unit_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    reporting_manager_id: Optional[UUID] = None
    status: Optional[UserStatus] = None
    joining_date: Optional[date] = None
    exit_date: Optional[date] = None


class UserResponse(BaseModel):
    id: UUID
    organization_id: UUID
    first_name: str
    last_name: Optional[str] = None
    email: str
    phone_number: Optional[str] = None
    designation: Optional[str] = None
    status: str
    business_unit_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    reporting_manager_id: Optional[UUID] = None
    mfa_enabled: bool
    last_login: Optional[datetime] = None
    joining_date: Optional[date] = None
    exit_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserRoleAssign(BaseModel):
    role_ids: list[UUID]


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str


class InviteUserRequest(BaseModel):
    email: EmailStr
    role_id: UUID
