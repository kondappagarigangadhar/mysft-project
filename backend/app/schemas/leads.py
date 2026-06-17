from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime


class LeadBase(BaseModel):
    full_name: str
    email: EmailStr | None = None
    phone: str | None = None
    source: str | None = None
    status: str = "new"
    budget_min: float | None = None
    budget_max: float | None = None
    notes: str | None = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(LeadBase):
    full_name: str | None = None
    status: str | None = None


class LeadResponse(LeadBase):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
