from __future__ import annotations

from typing import Literal, Optional
from uuid import UUID
from datetime import date, datetime

from pydantic import BaseModel

PaymentMode = Literal["Cash", "BankTransfer", "UPI", "Card", "NetBanking", "Cheque", "Wallet"]
PaymentStatus = Literal["Pending", "Completed", "Failed", "Partial", "Refunded"]
PaymentPurpose = Literal["Booking", "Installment", "Maintenance", "Other"]


class PaymentCreate(BaseModel):
    booking_id: UUID
    installment_id: Optional[UUID] = None
    payment_amount: float
    payment_date: date
    payment_mode: PaymentMode
    receipt_number: Optional[str] = None
    payment_status: PaymentStatus = "Pending"
    transaction_id: Optional[str] = None


class PaymentUpdate(BaseModel):
    payment_amount: Optional[float] = None
    payment_date: Optional[date] = None
    payment_mode: Optional[PaymentMode] = None
    receipt_number: Optional[str] = None
    payment_status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = None
    receipt_url: Optional[str] = None


class PaymentResponse(BaseModel):
    id: UUID
    organization_id: UUID
    booking_id: UUID
    installment_id: Optional[UUID] = None
    payment_number: Optional[int] = None
    payment_amount: float
    payment_date: date
    payment_mode: str
    receipt_number: Optional[str] = None
    payment_status: str
    transaction_id: Optional[str] = None
    receipt_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentLinkCreate(BaseModel):
    booking_id: UUID
    payment_amount: float
    payment_purpose: PaymentPurpose = "Booking"
    customer_contact: str
    expiry_date: datetime


class PaymentLinkResponse(BaseModel):
    id: UUID
    booking_id: UUID
    payment_amount: float
    payment_purpose: str
    payment_link_url: str
    send_via: str
    customer_contact: str
    expiry_date: datetime
    payment_status: str
    created_at: datetime

    model_config = {"from_attributes": True}
