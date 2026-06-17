from __future__ import annotations

from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime

BusinessType = Literal["Developer", "Broker", "PropertyManager", "Consultant"]


class OrganizationCreate(BaseModel):
    organization_name: str
    organization_code: str
    business_type: BusinessType
    contact_email: EmailStr
    contact_phone: str
    city: str
    state: str
    country: str = "India"
    address: Optional[str] = None
    timezone: str = "Asia/Kolkata"
    currency: str = "INR"


class OrganizationUpdate(BaseModel):
    organization_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    portal_domain: Optional[str] = None
    status: Optional[Literal["Active", "Inactive", "Suspended"]] = None


class OrganizationResponse(BaseModel):
    id: UUID
    organization_name: str
    organization_code: str
    business_type: str
    contact_email: str
    contact_phone: str
    city: str
    state: str
    country: str
    timezone: str
    currency: str
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    portal_domain: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TenantResponse(BaseModel):
    id: UUID
    organization_id: UUID
    tenant_status: str
    db_schema: str
    created_at: datetime

    model_config = {"from_attributes": True}
