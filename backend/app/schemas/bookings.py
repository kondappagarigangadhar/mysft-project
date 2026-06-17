from __future__ import annotations

from typing import Literal, Optional
from uuid import UUID
from datetime import date, datetime

from pydantic import BaseModel

BookingStatus = Literal["Pending", "Confirmed", "Cancelled", "Completed"]


class BookingCreate(BaseModel):
    lead_id: Optional[UUID] = None
    project_id: UUID
    unit_id: UUID
    customer_name: str
    phone_number: str
    email: Optional[str] = None
    unit_price: float
    booking_status: BookingStatus = "Pending"


class BookingUpdate(BaseModel):
    customer_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    unit_price: Optional[float] = None
    booking_status: Optional[BookingStatus] = None
    agreement_doc_url: Optional[str] = None


class BookingCancelRequest(BaseModel):
    reason: Optional[str] = None


class BookingResponse(BaseModel):
    id: UUID
    organization_id: UUID
    booking_number: Optional[int] = None
    lead_id: Optional[UUID] = None
    project_id: UUID
    unit_id: UUID
    customer_name: str
    phone_number: str
    email: Optional[str] = None
    unit_price: float
    booking_date: datetime
    booking_status: str
    agreement_doc_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    installments_count: Optional[int] = None

    model_config = {"from_attributes": True}


class InstallmentInput(BaseModel):
    installment_number: int
    due_date: date
    amount: float


class PaymentPlanCreate(BaseModel):
    plan_name: str
    installment_count: int
    total_amount: float
    payment_milestones: Optional[str] = None
    installments: list[InstallmentInput]


class InstallmentResponse(BaseModel):
    id: UUID
    plan_id: UUID
    booking_id: UUID
    installment_number: int
    due_date: date
    amount: float
    paid_amount: float
    pending_amount: Optional[float] = None
    is_overdue: bool = False
    payment_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentPlanResponse(BaseModel):
    id: UUID
    booking_id: UUID
    plan_name: str
    installment_count: int
    total_amount: float
    payment_milestones: Optional[str] = None
    created_at: datetime
    installments: list[InstallmentResponse] = []

    model_config = {"from_attributes": True}
