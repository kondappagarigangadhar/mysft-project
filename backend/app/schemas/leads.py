from pydantic import BaseModel, EmailStr
from typing import Literal, Optional
from uuid import UUID
from datetime import datetime, date


LeadStatus = Literal["New", "Contacted", "Qualified", "VisitPlanned", "VisitDone", "Negotiation", "Converted", "Lost"]
LeadSource = Literal["Website", "Referral", "Broker", "SocialMedia", "Advertisement", "WalkIn", "Other"]
PropertyType = Literal["Plot", "Apartment", "Villa", "Commercial"]
FollowupType = Literal["Call", "Visit", "Meeting", "Email", "WhatsApp"]
VisitStatus = Literal["Planned", "Completed", "Cancelled", "NoShow"]


class LeadCreate(BaseModel):
    customer_name: str
    phone_number: str
    email: Optional[EmailStr] = None
    lead_source: LeadSource
    project_interest_id: Optional[UUID] = None
    property_type: Optional[PropertyType] = None
    budget_range: Optional[str] = None
    preferred_unit_type: Optional[PropertyType] = None
    lead_status: LeadStatus = "New"
    lead_stage: Optional[str] = None
    assigned_to: Optional[UUID] = None
    broker_id: Optional[UUID] = None
    notes: Optional[str] = None
    reminder_flag: bool = False


class LeadUpdate(BaseModel):
    customer_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    lead_source: Optional[LeadSource] = None
    project_interest_id: Optional[UUID] = None
    property_type: Optional[PropertyType] = None
    budget_range: Optional[str] = None
    preferred_unit_type: Optional[PropertyType] = None
    lead_status: Optional[LeadStatus] = None
    lead_stage: Optional[str] = None
    assigned_to: Optional[UUID] = None
    broker_id: Optional[UUID] = None
    notes: Optional[str] = None
    reminder_flag: Optional[bool] = None
    conversion_probability: Optional[float] = None


class LeadResponse(BaseModel):
    id: UUID
    organization_id: UUID
    lead_number: int
    customer_name: str
    phone_number: str
    email: Optional[str] = None
    lead_source: str
    project_interest_id: Optional[UUID] = None
    property_type: Optional[str] = None
    budget_range: Optional[str] = None
    preferred_unit_type: Optional[str] = None
    lead_status: str
    lead_stage: Optional[str] = None
    conversion_probability: Optional[float] = None
    assigned_to: Optional[UUID] = None
    broker_id: Optional[UUID] = None
    notes: Optional[str] = None
    reminder_flag: bool
    is_converted: bool
    converted_at: Optional[datetime] = None
    booking_id: Optional[UUID] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LeadAssignRequest(BaseModel):
    assigned_to: UUID
    note: Optional[str] = None


class FollowupCreate(BaseModel):
    followup_date: datetime
    followup_type: FollowupType
    notes: Optional[str] = None
    next_action: Optional[str] = None


class FollowupResponse(BaseModel):
    id: UUID
    lead_id: UUID
    followup_date: datetime
    followup_type: str
    notes: Optional[str] = None
    next_action: Optional[str] = None
    conducted_by: Optional[UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SiteVisitCreate(BaseModel):
    visit_date: datetime
    remarks: Optional[str] = None


class SiteVisitResponse(BaseModel):
    id: UUID
    lead_id: UUID
    visit_date: datetime
    visit_status: str
    remarks: Optional[str] = None
    conducted_by: Optional[UUID] = None
    created_at: datetime

    model_config = {"from_attributes": True}
