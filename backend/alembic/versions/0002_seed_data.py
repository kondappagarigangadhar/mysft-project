"""seed data

Revision ID: 0002
Revises: 0001
Create Date: 2024-01-01 00:01:00.000000

"""
from typing import Sequence, Union
from alembic import op
import pathlib

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SEED_SQL = pathlib.Path(__file__).parent.parent / "seeds" / "0001_seed.sql"


def upgrade() -> None:
    op.execute(_SEED_SQL.read_text())


def downgrade() -> None:
    # Truncate all seeded tables in reverse FK order
    op.execute("""
        TRUNCATE TABLE
            ai_lead_scores, ai_demand_insights,
            notification_schedules, notifications, notification_events, notification_preferences,
            esign_requests, document_audit_logs, compliance_rera, documents,
            vendor_invoices, procurement_invoices, po_deliveries, purchase_orders, purchase_requests,
            supplier_performance, supplier_documents, supplier_materials, materials, suppliers,
            work_order_images, work_orders, vendor_performance, vendor_contracts, vendor_documents, vendors,
            ticket_activity_logs, service_tickets, sla_definitions,
            resident_billing, visitor_entries, amenity_bookings, amenity_time_slots, amenities, notices, residents,
            autopay_mandates, payment_links, payments, payment_installments, payment_plans,
            bookings, plot_mappings, site_layouts, units, projects,
            brokers, leads,
            user_roles, role_permissions, permissions, roles,
            departments, users, tenants, organizations
        CASCADE;
    """)
