-- ============================================================
-- ARRIS AI Real Estate SaaS Platform — PostgreSQL Schema
-- Generated from MVP Requirements Tabs.xlsx
-- Idempotent: safe to run multiple times
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS  (DO block makes CREATE TYPE idempotent)
-- ============================================================

DO $$ BEGIN CREATE TYPE business_type AS ENUM ('Builder', 'Association', 'Developer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE user_status AS ENUM ('Active', 'Disabled', 'Inactive'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE tenant_status AS ENUM ('Active', 'Suspended', 'Inactive'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE subscription_plan AS ENUM ('Starter', 'Growth', 'Enterprise'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE mfa_method AS ENUM ('OTP', 'AuthenticatorApp'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE industry_type AS ENUM ('RealEstate', 'Construction', 'PropertyManagement', 'Other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE company_size AS ENUM ('1-10', '11-50', '51-200', '201-500', '500+'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE invitation_status AS ENUM ('Pending', 'Accepted', 'Expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE lead_status AS ENUM ('New', 'Contacted', 'Qualified', 'VisitPlanned', 'VisitDone', 'Negotiation', 'Converted', 'Lost'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE lead_source AS ENUM ('Website', 'Referral', 'Broker', 'SocialMedia', 'Advertisement', 'WalkIn', 'Other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE property_type AS ENUM ('Plot', 'Apartment', 'Villa', 'Commercial'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE followup_type AS ENUM ('Call', 'Visit', 'Meeting', 'Email', 'WhatsApp'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE visit_status AS ENUM ('Planned', 'Completed', 'Cancelled', 'NoShow'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE project_type AS ENUM ('Plot', 'Apartment', 'Villa', 'Mixed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE project_status AS ENUM ('Upcoming', 'Active', 'SoldOut', 'Completed', 'OnHold'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE unit_availability AS ENUM ('Available', 'Reserved', 'Sold', 'Blocked'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE layout_type AS ENUM ('Image', 'PDF', 'Drawn'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE plot_shape AS ENUM ('Rectangle', 'Polygon', 'Irregular'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE plot_facing AS ENUM ('North', 'South', 'East', 'West', 'NorthEast', 'NorthWest', 'SouthEast', 'SouthWest'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE booking_status AS ENUM ('Pending', 'Confirmed', 'Cancelled', 'Completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('Pending', 'Completed', 'Failed', 'Partial', 'Refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_mode AS ENUM ('Cash', 'BankTransfer', 'UPI', 'Card', 'NetBanking', 'Cheque', 'Wallet'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_purpose AS ENUM ('Booking', 'Installment', 'Maintenance', 'Other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE autopay_status AS ENUM ('Active', 'Paused', 'Cancelled', 'PendingApproval', 'Failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE mandate_status AS ENUM ('Pending', 'Approved', 'Failed', 'Cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE resident_type AS ENUM ('Owner', 'Tenant', 'FamilyMember', 'Staff'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE resident_status AS ENUM ('Active', 'Inactive', 'Vacated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notice_category AS ENUM ('General', 'Emergency', 'Event', 'Maintenance', 'Financial'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE audience_type AS ENUM ('All', 'Owners', 'Tenants', 'Committee'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE amenity_type AS ENUM ('Gym', 'Clubhouse', 'SwimmingPool', 'TennisCourt', 'Playground', 'PartyHall', 'Other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE amenity_booking_status AS ENUM ('Pending', 'Confirmed', 'Cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE occupancy_status AS ENUM ('Occupied', 'Vacant'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE ticket_status AS ENUM ('Open', 'InProgress', 'Resolved', 'Closed', 'Cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ticket_priority AS ENUM ('Low', 'Medium', 'High', 'Critical'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE ticket_source AS ENUM ('Portal', 'App', 'WhatsApp', 'Call', 'Email'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE sla_status AS ENUM ('OnTrack', 'AtRisk', 'Breached'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE escalation_level AS ENUM ('Level1', 'Level2', 'Level3'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE resolution_status AS ENUM ('Fixed', 'Temporary', 'Rejected', 'Pending'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE vendor_type AS ENUM ('Contractor', 'Supplier', 'ServiceProvider'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE vendor_status AS ENUM ('Active', 'Inactive', 'Blacklisted', 'PendingApproval'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE document_verification AS ENUM ('Pending', 'Verified', 'Rejected', 'Expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE work_order_status AS ENUM ('Open', 'Assigned', 'InProgress', 'Completed', 'Closed', 'Cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE work_type AS ENUM ('Maintenance', 'Construction', 'Procurement', 'Inspection', 'Other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE verification_status AS ENUM ('Approved', 'Rework', 'Pending'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE supplier_type AS ENUM ('Material', 'Equipment', 'Both'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE availability_status AS ENUM ('Available', 'Limited', 'NotAvailable'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE pr_status AS ENUM ('Draft', 'PendingApproval', 'Approved', 'Rejected', 'Converted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE po_status AS ENUM ('Created', 'Sent', 'Acknowledged', 'Delivered', 'Partial', 'Cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE delivery_status AS ENUM ('Pending', 'Partial', 'Completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE quality_check_status AS ENUM ('Passed', 'Failed', 'Pending'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE invoice_validation_status AS ENUM ('Pending', 'Approved', 'Rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE invoice_payment_status AS ENUM ('Pending', 'Partial', 'Paid'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE export_format AS ENUM ('Tally', 'Zoho', 'CSV', 'PDF'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE export_status AS ENUM ('Pending', 'Exported', 'Failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE doc_type AS ENUM ('Agreement', 'RERA', 'Approval', 'Receipt', 'PAN', 'GST', 'License', 'AadhaarEKYC', 'Other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE access_level AS ENUM ('Public', 'Private', 'Restricted'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE esign_status AS ENUM ('Pending', 'Signed', 'Failed', 'Expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE audit_action AS ENUM ('Upload', 'View', 'Edit', 'Delete', 'Download', 'Share'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE notification_channel AS ENUM ('Email', 'SMS', 'InApp', 'WhatsApp', 'Push'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_status AS ENUM ('Pending', 'Sent', 'Failed', 'Read'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE schedule_type AS ENUM ('Reminder', 'SLA', 'DueDate', 'Expiry', 'OneTime', 'Daily'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- PLATFORM FOUNDATION
-- ============================================================

CREATE TABLE IF NOT EXISTS organizations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_name   VARCHAR(150) NOT NULL,
    organization_code   VARCHAR(50)  NOT NULL UNIQUE,
    business_type       business_type NOT NULL,
    industry_type       industry_type,
    company_size        company_size,
    contact_email       VARCHAR(255) NOT NULL,
    contact_phone       VARCHAR(20)  NOT NULL,
    address             TEXT,
    city                VARCHAR(100) NOT NULL,
    state               VARCHAR(100) NOT NULL,
    country             VARCHAR(100) NOT NULL DEFAULT 'India',
    timezone            VARCHAR(50)  NOT NULL DEFAULT 'Asia/Kolkata',
    currency            VARCHAR(10)  NOT NULL DEFAULT 'INR',
    default_language    VARCHAR(10)  DEFAULT 'en',
    logo_url            TEXT,
    primary_color       VARCHAR(20),
    portal_domain       VARCHAR(255),
    status              user_status  NOT NULL DEFAULT 'Active',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenants (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tenant_status       tenant_status NOT NULL DEFAULT 'Active',
    db_schema           VARCHAR(100) NOT NULL UNIQUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_plans (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan                subscription_plan NOT NULL DEFAULT 'Starter',
    user_limit          INTEGER NOT NULL DEFAULT 10,
    enabled_modules     TEXT[] NOT NULL DEFAULT '{}',
    valid_from          DATE NOT NULL,
    valid_till          DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_units (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    unit_name           VARCHAR(150) NOT NULL,
    unit_code           VARCHAR(50)  NOT NULL,
    parent_unit_id      UUID REFERENCES business_units(id),
    default_project_scope UUID[],
    status              user_status NOT NULL DEFAULT 'Active',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, unit_code)
);

CREATE TABLE IF NOT EXISTS departments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    department_name     VARCHAR(150) NOT NULL,
    department_code     VARCHAR(50),
    department_head_id  UUID,
    status              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_name           VARCHAR(100) NOT NULL,
    role_description    TEXT,
    is_system_role      BOOLEAN NOT NULL DEFAULT FALSE,
    status              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, role_name)
);

CREATE TABLE IF NOT EXISTS permissions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_name         VARCHAR(100) NOT NULL,
    action              VARCHAR(50)  NOT NULL,
    description         TEXT,
    UNIQUE (module_name, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id             UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id       UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    business_unit_id    UUID REFERENCES business_units(id),
    department_id       UUID REFERENCES departments(id),
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100),
    email               VARCHAR(255) NOT NULL UNIQUE,
    phone_number        VARCHAR(20),
    password_hash       TEXT NOT NULL,
    designation         VARCHAR(100),
    status              user_status NOT NULL DEFAULT 'Active',
    mfa_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_method          mfa_method,
    reporting_manager_id UUID REFERENCES users(id),
    joining_date        DATE,
    exit_date           DATE,
    department_transfer VARCHAR(100),
    session_timeout     INTEGER DEFAULT 30,
    max_concurrent_sessions INTEGER DEFAULT 3,
    password_reset_required BOOLEAN NOT NULL DEFAULT FALSE,
    last_login          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE departments ADD CONSTRAINT fk_dept_head FOREIGN KEY (department_head_id) REFERENCES users(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS user_roles (
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id             UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by         UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS user_invitations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email               VARCHAR(255) NOT NULL,
    role_id             UUID NOT NULL REFERENCES roles(id),
    invitation_token    TEXT NOT NULL UNIQUE,
    invitation_status   invitation_status NOT NULL DEFAULT 'Pending',
    expiry_date         TIMESTAMPTZ NOT NULL,
    invited_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID REFERENCES organizations(id),
    user_id             UUID REFERENCES users(id),
    action_type         VARCHAR(100) NOT NULL,
    module_name         VARCHAR(100),
    record_id           UUID,
    old_value           JSONB,
    new_value           JSONB,
    ip_address          INET,
    device_type         VARCHAR(50),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LEAD & SALES MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_number         SERIAL,
    customer_name       VARCHAR(150) NOT NULL,
    phone_number        VARCHAR(20)  NOT NULL,
    email               VARCHAR(255),
    lead_source         lead_source  NOT NULL,
    project_interest_id UUID,
    property_type       property_type,
    budget_range        VARCHAR(100),
    preferred_unit_type property_type,
    lead_status         lead_status  NOT NULL DEFAULT 'New',
    lead_stage          VARCHAR(100),
    conversion_probability NUMERIC(5,2),
    assigned_to         UUID REFERENCES users(id),
    broker_id           UUID,
    notes               TEXT,
    reminder_flag       BOOLEAN DEFAULT FALSE,
    is_converted        BOOLEAN NOT NULL DEFAULT FALSE,
    converted_at        TIMESTAMPTZ,
    booking_id          UUID,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brokers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    broker_name         VARCHAR(150) NOT NULL,
    phone_number        VARCHAR(20),
    email               VARCHAR(255),
    commission_percentage NUMERIC(5,2),
    status              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE leads ADD CONSTRAINT fk_lead_broker FOREIGN KEY (broker_id) REFERENCES brokers(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS lead_assignments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id             UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    assigned_to         UUID NOT NULL REFERENCES users(id),
    assigned_by         UUID REFERENCES users(id),
    assignment_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    is_current          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_followups (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id             UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    followup_date       TIMESTAMPTZ NOT NULL,
    followup_type       followup_type NOT NULL,
    notes               TEXT,
    next_action         VARCHAR(100),
    conducted_by        UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_site_visits (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id             UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    visit_date          TIMESTAMPTZ NOT NULL,
    visit_status        visit_status NOT NULL DEFAULT 'Planned',
    remarks             TEXT,
    conducted_by        UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVENTORY & PROJECT MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_number      SERIAL,
    project_name        VARCHAR(200) NOT NULL,
    project_type        project_type NOT NULL,
    location            VARCHAR(200) NOT NULL,
    city                VARCHAR(100),
    state               VARCHAR(100),
    total_units         INTEGER NOT NULL DEFAULT 0,
    project_status      project_status NOT NULL DEFAULT 'Upcoming',
    rera_number         VARCHAR(100),
    rera_status         VARCHAR(50),
    rera_expiry_date    DATE,
    description         TEXT,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE leads ADD CONSTRAINT fk_lead_project FOREIGN KEY (project_interest_id) REFERENCES projects(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS units (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    unit_number         VARCHAR(50) NOT NULL,
    unit_type           property_type NOT NULL,
    unit_size           NUMERIC(10,2) NOT NULL,
    size_unit           VARCHAR(20) NOT NULL DEFAULT 'sqft',
    block_phase         VARCHAR(50),
    floor_number        INTEGER,
    base_price          NUMERIC(15,2) NOT NULL,
    offer_price         NUMERIC(15,2),
    availability_status unit_availability NOT NULL DEFAULT 'Available',
    is_locked           BOOLEAN NOT NULL DEFAULT FALSE,
    lock_timestamp      TIMESTAMPTZ,
    unlock_timestamp    TIMESTAMPTZ,
    locked_by           UUID REFERENCES users(id),
    facing              plot_facing,
    road_size           NUMERIC(6,2),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, unit_number)
);

-- ============================================================
-- VISUAL INVENTORY MAPPING
-- ============================================================

CREATE TABLE IF NOT EXISTS site_layouts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    layout_name         VARCHAR(100) NOT NULL,
    layout_file_url     TEXT NOT NULL,
    layout_type         layout_type NOT NULL,
    canvas_width        INTEGER,
    canvas_height       INTEGER,
    status              BOOLEAN NOT NULL DEFAULT TRUE,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plot_mappings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layout_id           UUID NOT NULL REFERENCES site_layouts(id) ON DELETE CASCADE,
    unit_id             UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    plot_number         VARCHAR(50) NOT NULL,
    plot_shape          plot_shape NOT NULL DEFAULT 'Rectangle',
    coordinates         JSONB NOT NULL,
    width               NUMERIC(8,2),
    length              NUMERIC(8,2),
    area                NUMERIC(10,2),
    facing              plot_facing,
    road_size           NUMERIC(6,2),
    plot_status         unit_availability NOT NULL DEFAULT 'Available',
    color_code          VARCHAR(20),
    notes               TEXT,
    assigned_sales_id   UUID REFERENCES users(id),
    lock_status         BOOLEAN NOT NULL DEFAULT FALSE,
    lock_expiry         TIMESTAMPTZ,
    locked_by           UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOOKING & PAYMENT TRACKING
-- ============================================================

CREATE TABLE IF NOT EXISTS bookings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    booking_number      SERIAL,
    lead_id             UUID REFERENCES leads(id),
    customer_name       VARCHAR(150) NOT NULL,
    phone_number        VARCHAR(20)  NOT NULL,
    email               VARCHAR(255),
    project_id          UUID NOT NULL REFERENCES projects(id),
    unit_id             UUID NOT NULL REFERENCES units(id),
    unit_price          NUMERIC(15,2) NOT NULL,
    booking_date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    booking_status      booking_status NOT NULL DEFAULT 'Pending',
    agreement_doc_url   TEXT,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE leads ADD CONSTRAINT fk_lead_booking FOREIGN KEY (booking_id) REFERENCES bookings(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS payment_plans (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    plan_name           VARCHAR(150) NOT NULL,
    installment_count   INTEGER NOT NULL,
    total_amount        NUMERIC(15,2) NOT NULL,
    payment_milestones  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_installments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id             UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
    booking_id          UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    installment_number  INTEGER NOT NULL,
    due_date            DATE NOT NULL,
    amount              NUMERIC(15,2) NOT NULL,
    paid_amount         NUMERIC(15,2) NOT NULL DEFAULT 0,
    pending_amount      NUMERIC(15,2) GENERATED ALWAYS AS (amount - paid_amount) STORED,
    is_overdue          BOOLEAN NOT NULL DEFAULT FALSE,
    payment_status      payment_status NOT NULL DEFAULT 'Pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    booking_id          UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    installment_id      UUID REFERENCES payment_installments(id),
    payment_number      SERIAL,
    payment_amount      NUMERIC(15,2) NOT NULL,
    payment_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_mode        payment_mode NOT NULL,
    receipt_number      VARCHAR(100),
    payment_status      payment_status NOT NULL DEFAULT 'Pending',
    transaction_id      VARCHAR(200),
    payment_token       TEXT,
    masked_info         VARCHAR(50),
    gateway_response    JSONB,
    receipt_url         TEXT,
    recorded_by         UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_links (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    payment_amount      NUMERIC(15,2) NOT NULL,
    payment_purpose     payment_purpose NOT NULL,
    payment_link_url    TEXT NOT NULL,
    send_via            notification_channel NOT NULL DEFAULT 'SMS',
    customer_contact    VARCHAR(255) NOT NULL,
    expiry_date         TIMESTAMPTZ NOT NULL,
    payment_status      payment_status NOT NULL DEFAULT 'Pending',
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS autopay_mandates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    customer_id         UUID REFERENCES users(id),
    auto_pay_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
    payment_frequency   VARCHAR(20),
    auto_pay_amount     NUMERIC(15,2),
    start_date          DATE,
    auto_pay_method     payment_mode,
    max_limit           NUMERIC(15,2),
    upi_id              VARCHAR(100),
    mandate_status      mandate_status NOT NULL DEFAULT 'Pending',
    auto_pay_status     autopay_status NOT NULL DEFAULT 'Paused',
    retry_count         INTEGER NOT NULL DEFAULT 0,
    user_consent        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RESIDENT & COMMUNITY MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS residents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id         UUID REFERENCES users(id),
    resident_type       resident_type NOT NULL,
    full_name           VARCHAR(150) NOT NULL,
    phone_number        VARCHAR(20)  NOT NULL,
    email               VARCHAR(255),
    unit_id             UUID REFERENCES units(id),
    move_in_date        DATE NOT NULL,
    move_out_date       DATE,
    resident_status     resident_status NOT NULL DEFAULT 'Active',
    identity_doc_url    TEXT,
    emergency_contact   VARCHAR(20),
    portal_access       BOOLEAN NOT NULL DEFAULT FALSE,
    login_username      VARCHAR(100) UNIQUE,
    password_hash       TEXT,
    access_expiry_date  DATE,
    contact_visibility  BOOLEAN NOT NULL DEFAULT TRUE,
    resident_tags       TEXT[],
    current_occupancy   occupancy_status NOT NULL DEFAULT 'Occupied',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notices (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id          UUID REFERENCES projects(id),
    notice_title        VARCHAR(200) NOT NULL,
    notice_category     notice_category NOT NULL DEFAULT 'General',
    notice_description  TEXT NOT NULL,
    attachment_url      TEXT,
    publish_date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiry_date         TIMESTAMPTZ,
    audience_type       audience_type NOT NULL DEFAULT 'All',
    send_push           BOOLEAN NOT NULL DEFAULT FALSE,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS amenities (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id),
    project_id          UUID REFERENCES projects(id),
    amenity_type        amenity_type NOT NULL,
    amenity_name        VARCHAR(100) NOT NULL,
    max_occupancy       INTEGER,
    status              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS amenity_time_slots (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amenity_id          UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
    slot_label          VARCHAR(50) NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS amenity_bookings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amenity_id          UUID NOT NULL REFERENCES amenities(id),
    resident_id         UUID NOT NULL REFERENCES residents(id),
    booking_date        DATE NOT NULL,
    time_slot_id        UUID REFERENCES amenity_time_slots(id),
    booking_status      amenity_booking_status NOT NULL DEFAULT 'Pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visitor_entries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id         UUID NOT NULL REFERENCES residents(id),
    unit_id             UUID REFERENCES units(id),
    visitor_name        VARCHAR(150) NOT NULL,
    mobile_number       VARCHAR(20)  NOT NULL,
    vehicle_number      VARCHAR(20),
    visit_datetime      TIMESTAMPTZ NOT NULL,
    visitor_pass_qr     TEXT,
    approval_status     VARCHAR(20) NOT NULL DEFAULT 'Pending',
    check_in_time       TIMESTAMPTZ,
    check_out_time      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resident_billing (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id         UUID NOT NULL REFERENCES residents(id),
    unit_id             UUID REFERENCES units(id),
    billing_month       DATE NOT NULL,
    monthly_rent        NUMERIC(12,2),
    maintenance_charges NUMERIC(12,2),
    utility_charges     NUMERIC(12,2),
    total_amount        NUMERIC(12,2) NOT NULL,
    payment_status      payment_status NOT NULL DEFAULT 'Pending',
    payment_method      payment_mode,
    autopay_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    autopay_frequency   VARCHAR(20),
    receipt_url         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SERVICE REQUEST & MAINTENANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS sla_definitions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sla_name            VARCHAR(100) NOT NULL,
    category            VARCHAR(100),
    response_time_hours INTEGER NOT NULL,
    resolution_time_hours INTEGER NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_tickets (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ticket_number       SERIAL,
    request_title       VARCHAR(200) NOT NULL,
    issue_category      VARCHAR(100) NOT NULL,
    priority            ticket_priority NOT NULL DEFAULT 'Medium',
    description         TEXT NOT NULL,
    attachment_url      TEXT,
    unit_id             UUID REFERENCES units(id),
    project_id          UUID REFERENCES projects(id),
    resident_id         UUID REFERENCES residents(id),
    preferred_visit_time TIMESTAMPTZ,
    ticket_status       ticket_status NOT NULL DEFAULT 'Open',
    source_channel      ticket_source NOT NULL DEFAULT 'Portal',
    sla_id              UUID REFERENCES sla_definitions(id),
    sla_status          sla_status,
    sla_start_time      TIMESTAMPTZ,
    sla_due_time        TIMESTAMPTZ,
    escalation_level    escalation_level,
    assigned_vendor_id  UUID,
    assignment_date     TIMESTAMPTZ,
    estimated_cost      NUMERIC(12,2),
    vendor_notes        TEXT,
    auto_assign_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    resolution_notes    TEXT,
    resolution_status   resolution_status,
    resolution_attachment_url TEXT,
    closure_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
    resident_feedback   SMALLINT CHECK (resident_feedback BETWEEN 1 AND 5),
    closure_date        TIMESTAMPTZ,
    created_by          UUID REFERENCES users(id),
    updated_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_activity_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id           UUID NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,
    action              VARCHAR(100) NOT NULL,
    old_status          ticket_status,
    new_status          ticket_status,
    notes               TEXT,
    performed_by        UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VENDOR MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS vendors (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vendor_number       SERIAL,
    vendor_name         VARCHAR(150) NOT NULL,
    vendor_type         vendor_type NOT NULL,
    categories          TEXT[] NOT NULL DEFAULT '{}',
    contact_person      VARCHAR(150) NOT NULL,
    phone_number        VARCHAR(20)  NOT NULL,
    email               VARCHAR(255),
    address             TEXT,
    city                VARCHAR(100) NOT NULL,
    status              vendor_status NOT NULL DEFAULT 'Active',
    onboarded_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    avg_rating          NUMERIC(3,2),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE service_tickets ADD CONSTRAINT fk_ticket_vendor FOREIGN KEY (assigned_vendor_id) REFERENCES vendors(id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS vendor_documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id           UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    document_type       VARCHAR(50) NOT NULL,
    document_file_url   TEXT NOT NULL,
    expiry_date         DATE,
    verification_status document_verification NOT NULL DEFAULT 'Pending',
    verified_by         UUID REFERENCES users(id),
    verified_date       DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_contracts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id           UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    contract_name       VARCHAR(150) NOT NULL,
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    contract_value      NUMERIC(15,2),
    contract_file_url   TEXT NOT NULL,
    status              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_performance (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id           UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    reference_id        UUID,
    reference_type      VARCHAR(50),
    rating              SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback            TEXT,
    tasks_completed     INTEGER DEFAULT 0,
    sla_breach_count    INTEGER DEFAULT 0,
    reviewed_by         UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- WORK ORDER MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS work_orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    work_order_number   SERIAL,
    title               VARCHAR(150) NOT NULL,
    description         TEXT NOT NULL,
    work_type           work_type NOT NULL,
    project_id          UUID REFERENCES projects(id),
    unit_id             UUID REFERENCES units(id),
    location_details    VARCHAR(200),
    priority            ticket_priority NOT NULL DEFAULT 'Medium',
    requested_by        UUID NOT NULL REFERENCES users(id),
    requested_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    vendor_id           UUID REFERENCES vendors(id),
    assigned_date       DATE,
    assigned_by         UUID REFERENCES users(id),
    estimated_cost      NUMERIC(12,2),
    estimated_duration_days INTEGER,
    planned_start_date  DATE,
    planned_end_date    DATE,
    actual_start_date   DATE,
    actual_end_date     DATE,
    sla_status          sla_status,
    delay_days          INTEGER DEFAULT 0,
    status              work_order_status NOT NULL DEFAULT 'Open',
    status_updated_by   UUID REFERENCES users(id),
    status_updated_at   TIMESTAMPTZ,
    completion_percentage NUMERIC(5,2) DEFAULT 0,
    progress_notes      TEXT,
    completion_date     DATE,
    verified_by         UUID REFERENCES users(id),
    verification_status verification_status,
    completion_remarks  TEXT,
    actual_cost         NUMERIC(12,2),
    payment_status      payment_status,
    invoice_ref         VARCHAR(100),
    notify_vendor       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_order_images (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id       UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    image_url           TEXT NOT NULL,
    uploaded_by         UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUPPLIER MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS suppliers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    supplier_number     SERIAL,
    supplier_name       VARCHAR(150) NOT NULL,
    supplier_type       supplier_type NOT NULL,
    material_categories TEXT[] NOT NULL DEFAULT '{}',
    contact_person      VARCHAR(150) NOT NULL,
    phone_number        VARCHAR(20)  NOT NULL,
    email               VARCHAR(255),
    address             TEXT,
    city                VARCHAR(100) NOT NULL,
    status              vendor_status NOT NULL DEFAULT 'Active',
    onboarded_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    avg_rating          NUMERIC(3,2),
    on_time_delivery_pct NUMERIC(5,2),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materials (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    material_number     SERIAL,
    material_name       VARCHAR(150) NOT NULL,
    category            VARCHAR(100) NOT NULL,
    unit_of_measure     VARCHAR(20)  NOT NULL,
    description         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_materials (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id         UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    material_id         UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    price_per_unit      NUMERIC(12,2) NOT NULL,
    effective_date      DATE NOT NULL,
    valid_till          DATE,
    daily_capacity      NUMERIC(10,2),
    lead_time_days      INTEGER,
    availability_status availability_status NOT NULL DEFAULT 'Available',
    is_best_price       BOOLEAN NOT NULL DEFAULT FALSE,
    status              BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id         UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    document_type       VARCHAR(50) NOT NULL,
    file_url            TEXT NOT NULL,
    expiry_date         DATE,
    verification_status document_verification NOT NULL DEFAULT 'Pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_performance (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id         UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    reference_id        UUID,
    rating              SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    delivery_delay_days INTEGER DEFAULT 0,
    reviewed_by         UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PURCHASE ORDER & PROCUREMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS purchase_requests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    request_number      SERIAL,
    requested_by        UUID NOT NULL REFERENCES users(id),
    project_id          UUID NOT NULL REFERENCES projects(id),
    material_id         UUID NOT NULL REFERENCES materials(id),
    quantity            NUMERIC(12,2) NOT NULL,
    required_date       DATE NOT NULL,
    priority            ticket_priority NOT NULL DEFAULT 'Medium',
    notes               TEXT,
    approval_status     pr_status NOT NULL DEFAULT 'Draft',
    approved_by         UUID REFERENCES users(id),
    approval_date       DATE,
    approval_remarks    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    po_number           SERIAL,
    pr_id               UUID NOT NULL REFERENCES purchase_requests(id),
    supplier_id         UUID NOT NULL REFERENCES suppliers(id),
    material_id         UUID NOT NULL REFERENCES materials(id),
    quantity            NUMERIC(12,2) NOT NULL,
    unit_price          NUMERIC(12,2) NOT NULL,
    total_amount        NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    delivery_date       DATE NOT NULL,
    status              po_status NOT NULL DEFAULT 'Created',
    is_best_price       BOOLEAN NOT NULL DEFAULT FALSE,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_deliveries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id               UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    delivery_status     delivery_status NOT NULL DEFAULT 'Pending',
    received_quantity   NUMERIC(12,2),
    received_date       DATE,
    quality_check       quality_check_status NOT NULL DEFAULT 'Pending',
    received_by         UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS procurement_invoices (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id               UUID NOT NULL REFERENCES purchase_orders(id),
    invoice_number      VARCHAR(100) NOT NULL,
    invoice_file_url    TEXT NOT NULL,
    invoice_amount      NUMERIC(15,2) NOT NULL,
    payment_status      invoice_payment_status NOT NULL DEFAULT 'Pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INVOICE & PAYMENT TRACKING (VENDOR-SIDE)
-- ============================================================

CREATE TABLE IF NOT EXISTS vendor_invoices (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invoice_number_seq  SERIAL,
    vendor_id           UUID NOT NULL REFERENCES vendors(id),
    work_order_id       UUID REFERENCES work_orders(id),
    po_id               UUID REFERENCES purchase_orders(id),
    project_id          UUID REFERENCES projects(id),
    vendor_invoice_number VARCHAR(100) NOT NULL,
    invoice_date        DATE NOT NULL,
    invoice_amount      NUMERIC(15,2) NOT NULL,
    tax_amount          NUMERIC(12,2) DEFAULT 0,
    total_payable       NUMERIC(15,2) GENERATED ALWAYS AS (invoice_amount + COALESCE(tax_amount, 0)) STORED,
    invoice_file_url    TEXT NOT NULL,
    notes               TEXT,
    validation_status   invoice_validation_status NOT NULL DEFAULT 'Pending',
    validated_by        UUID REFERENCES users(id),
    validation_date     DATE,
    validation_remarks  TEXT,
    payment_status      invoice_payment_status NOT NULL DEFAULT 'Pending',
    paid_amount         NUMERIC(15,2) DEFAULT 0,
    balance_amount      NUMERIC(15,2),
    payment_date        DATE,
    payment_mode        payment_mode,
    transaction_ref     VARCHAR(200),
    export_format       export_format,
    export_status       export_status DEFAULT 'Pending',
    export_date         DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DOCUMENT & COMPLIANCE MANAGEMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_number     SERIAL,
    document_name       VARCHAR(200) NOT NULL,
    document_type       doc_type NOT NULL,
    file_url            TEXT NOT NULL,
    file_size_mb        NUMERIC(8,2),
    upload_date         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_by         UUID REFERENCES users(id),
    booking_id          UUID REFERENCES bookings(id),
    customer_id         UUID REFERENCES users(id),
    project_id          UUID REFERENCES projects(id),
    resident_id         UUID REFERENCES residents(id),
    version_number      INTEGER NOT NULL DEFAULT 1,
    previous_version_id UUID REFERENCES documents(id),
    access_level        access_level NOT NULL DEFAULT 'Private',
    allowed_roles       TEXT[],
    secure_url          TEXT,
    secure_url_expiry   TIMESTAMPTZ,
    is_locked           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_rera (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    rera_number         VARCHAR(100) NOT NULL UNIQUE,
    rera_status         VARCHAR(50) NOT NULL DEFAULT 'Active',
    expiry_date         DATE NOT NULL,
    expiry_alert        BOOLEAN NOT NULL DEFAULT TRUE,
    document_id         UUID REFERENCES documents(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_audit_logs (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    action              audit_action NOT NULL,
    performed_by        UUID REFERENCES users(id),
    ip_address          INET,
    remarks             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS esign_requests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id         UUID NOT NULL REFERENCES documents(id),
    signer_name         VARCHAR(150) NOT NULL,
    aadhaar_number_masked VARCHAR(20),
    signer_user_id      UUID REFERENCES users(id),
    consent_given       BOOLEAN NOT NULL DEFAULT FALSE,
    signature_position  JSONB,
    esign_status        esign_status NOT NULL DEFAULT 'Pending',
    signed_file_url     TEXT,
    signed_timestamp    TIMESTAMPTZ,
    ip_address          INET,
    provider_transaction_id VARCHAR(200),
    is_locked           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    sms_notifications   BOOLEAN NOT NULL DEFAULT FALSE,
    in_app_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    notification_types  TEXT[] NOT NULL DEFAULT '{}',
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS notification_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type          VARCHAR(100) NOT NULL,
    trigger_source      VARCHAR(100) NOT NULL,
    reference_id        UUID,
    reference_type      VARCHAR(50),
    trigger_time        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID REFERENCES organizations(id),
    event_id            UUID REFERENCES notification_events(id),
    recipient_id        UUID NOT NULL REFERENCES users(id),
    channel             notification_channel NOT NULL,
    title               VARCHAR(200) NOT NULL,
    message_body        TEXT NOT NULL,
    redirect_url        TEXT,
    read_status         BOOLEAN NOT NULL DEFAULT FALSE,
    status              notification_status NOT NULL DEFAULT 'Pending',
    sent_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_schedules (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id     UUID REFERENCES organizations(id),
    schedule_type       schedule_type NOT NULL,
    trigger_date        TIMESTAMPTZ NOT NULL,
    frequency           VARCHAR(20),
    reference_id        UUID,
    reference_type      VARCHAR(50),
    message_template    TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'Pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AI FEATURES SUPPORT TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_lead_scores (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id             UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    lead_score          SMALLINT CHECK (lead_score BETWEEN 0 AND 100),
    conversion_probability NUMERIC(5,2),
    lead_temperature    VARCHAR(10) CHECK (lead_temperature IN ('Hot', 'Warm', 'Cold')),
    next_best_action    VARCHAR(100),
    score_updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_demand_insights (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    demand_score        NUMERIC(5,2),
    predicted_sales_velocity INTEGER,
    high_demand_unit_type property_type,
    price_sensitivity_index NUMERIC(5,2),
    lead_demand_count   INTEGER,
    calculated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES  (IF NOT EXISTS supported in PG 9.5+)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_organizations_code     ON organizations(organization_code);
CREATE INDEX IF NOT EXISTS idx_organizations_status   ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_users_organization     ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email            ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status           ON users(status);
CREATE INDEX IF NOT EXISTS idx_leads_organization     ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_status           ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned         ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_project          ON leads(project_interest_id);
CREATE INDEX IF NOT EXISTS idx_leads_phone            ON leads(phone_number);
CREATE INDEX IF NOT EXISTS idx_projects_organization  ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status        ON projects(project_status);
CREATE INDEX IF NOT EXISTS idx_units_project          ON units(project_id);
CREATE INDEX IF NOT EXISTS idx_units_availability     ON units(availability_status);
CREATE INDEX IF NOT EXISTS idx_bookings_organization  ON bookings(organization_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lead          ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_unit          ON bookings(unit_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status        ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_payments_booking       ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status        ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_tickets_organization   ON service_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status         ON service_tickets(ticket_status);
CREATE INDEX IF NOT EXISTS idx_tickets_vendor         ON service_tickets(assigned_vendor_id);
CREATE INDEX IF NOT EXISTS idx_tickets_resident       ON service_tickets(resident_id);
CREATE INDEX IF NOT EXISTS idx_wo_organization        ON work_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_wo_status              ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_wo_vendor              ON work_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_wo_project             ON work_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_organization ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_type         ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_project      ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_booking      ON documents(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read     ON notifications(read_status);
CREATE INDEX IF NOT EXISTS idx_notifications_status   ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user        ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created     ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_residents_organization ON residents(organization_id);
CREATE INDEX IF NOT EXISTS idx_residents_unit         ON residents(unit_id);
CREATE INDEX IF NOT EXISTS idx_residents_status       ON residents(resident_status);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN CREATE TRIGGER trg_organizations_updated_at   BEFORE UPDATE ON organizations      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_users_updated_at           BEFORE UPDATE ON users              FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_leads_updated_at           BEFORE UPDATE ON leads              FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_projects_updated_at        BEFORE UPDATE ON projects           FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_units_updated_at           BEFORE UPDATE ON units              FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_bookings_updated_at        BEFORE UPDATE ON bookings           FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_residents_updated_at       BEFORE UPDATE ON residents          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_vendors_updated_at         BEFORE UPDATE ON vendors            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_work_orders_updated_at     BEFORE UPDATE ON work_orders        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_suppliers_updated_at       BEFORE UPDATE ON suppliers          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_purchase_requests_updated_at BEFORE UPDATE ON purchase_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_vendor_invoices_updated_at BEFORE UPDATE ON vendor_invoices    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_autopay_mandates_updated_at BEFORE UPDATE ON autopay_mandates  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_plot_mappings_updated_at   BEFORE UPDATE ON plot_mappings      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TRIGGER trg_service_tickets_updated_at BEFORE UPDATE ON service_tickets    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
