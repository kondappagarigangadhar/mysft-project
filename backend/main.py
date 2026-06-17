"""
ARRIS AI Real Estate SaaS Platform
FastAPI application entry point
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import init_db_pool, close_db_pool
from app.core.middleware import TenantMiddleware, AuditMiddleware

from app.api.v1 import (
    health, auth, tenants, users, roles,
    leads, projects, units, bookings, payments,
    vendors, work_orders, suppliers, materials,
    purchase_requests, purchase_orders, invoices,
    residents, service_tickets, documents, notifications,
    ai_insights,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🚀 Starting {settings.APP_NAME} — provider: {settings.CLOUD_PROVIDER}")
    await init_db_pool()
    yield
    await close_db_pool()
    logger.info("🛑 Application shutdown")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="ARRIS AI Real Estate Unified SaaS Platform",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        debug=settings.DEBUG,
        lifespan=lifespan,
    )

    # ── Middleware ──────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(TenantMiddleware)
    app.add_middleware(AuditMiddleware)

    # ── Routers ─────────────────────────────────────────────────
    v1 = "/api/v1"
    app.include_router(health.router,            prefix=v1,                          tags=["Health"])
    app.include_router(auth.router,              prefix=f"{v1}/auth",                tags=["Auth"])
    app.include_router(tenants.router,           prefix=f"{v1}/tenants",             tags=["Tenants"])
    app.include_router(users.router,             prefix=f"{v1}/users",               tags=["Users"])
    app.include_router(roles.router,             prefix=f"{v1}/roles",               tags=["Roles"])
    app.include_router(leads.router,             prefix=f"{v1}/leads",               tags=["Leads"])
    app.include_router(projects.router,          prefix=f"{v1}/projects",            tags=["Projects"])
    app.include_router(units.router,             prefix=f"{v1}/units",               tags=["Units"])
    app.include_router(bookings.router,          prefix=f"{v1}/bookings",            tags=["Bookings"])
    app.include_router(payments.router,          prefix=f"{v1}/payments",            tags=["Payments"])
    app.include_router(vendors.router,           prefix=f"{v1}/vendors",             tags=["Vendors"])
    app.include_router(work_orders.router,       prefix=f"{v1}/work-orders",         tags=["Work Orders"])
    app.include_router(suppliers.router,         prefix=f"{v1}/suppliers",           tags=["Suppliers"])
    app.include_router(materials.router,         prefix=f"{v1}/materials",           tags=["Materials"])
    app.include_router(purchase_requests.router, prefix=f"{v1}/purchase-requests",   tags=["Purchase Requests"])
    app.include_router(purchase_orders.router,   prefix=f"{v1}/purchase-orders",     tags=["Purchase Orders"])
    app.include_router(invoices.router,          prefix=f"{v1}/invoices",            tags=["Invoices"])
    app.include_router(residents.router,         prefix=f"{v1}/residents",           tags=["Residents"])
    app.include_router(service_tickets.router,   prefix=f"{v1}/service-tickets",     tags=["Service Tickets"])
    app.include_router(documents.router,         prefix=f"{v1}/documents",           tags=["Documents"])
    app.include_router(notifications.router,     prefix=f"{v1}/notifications",       tags=["Notifications"])
    app.include_router(ai_insights.router,       prefix=f"{v1}/ai",                  tags=["AI Insights"])

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.API_HOST, port=settings.API_PORT, reload=settings.DEBUG)
