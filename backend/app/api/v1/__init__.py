from fastapi import APIRouter
from app.api.v1 import (
    health, auth, tenants, users, roles,
    leads, projects, units, bookings, payments,
    vendors, work_orders, suppliers, materials,
    purchase_requests, purchase_orders, invoices,
    residents, service_tickets, documents, notifications, ai_insights,
)

router = APIRouter()

router.include_router(health.router, tags=["health"])
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(roles.router, prefix="/roles", tags=["roles"])
router.include_router(leads.router, prefix="/leads", tags=["leads"])
router.include_router(projects.router, prefix="/projects", tags=["projects"])
router.include_router(units.router, prefix="/units", tags=["units"])
router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
router.include_router(payments.router, prefix="/payments", tags=["payments"])
router.include_router(vendors.router, prefix="/vendors", tags=["vendors"])
router.include_router(work_orders.router, prefix="/work-orders", tags=["work-orders"])
router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
router.include_router(materials.router, prefix="/materials", tags=["materials"])
router.include_router(purchase_requests.router, prefix="/purchase-requests", tags=["purchase-requests"])
router.include_router(purchase_orders.router, prefix="/purchase-orders", tags=["purchase-orders"])
router.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
router.include_router(residents.router, prefix="/residents", tags=["residents"])
router.include_router(service_tickets.router, prefix="/service-tickets", tags=["service-tickets"])
router.include_router(documents.router, prefix="/documents", tags=["documents"])
router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
router.include_router(ai_insights.router, prefix="/ai", tags=["ai-insights"])
