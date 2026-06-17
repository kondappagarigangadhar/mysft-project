-- ============================================================
-- ARRIS AI Real Estate SaaS Platform — Seed Data
-- Run after database_schema.sql
-- ============================================================

BEGIN;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

INSERT INTO organizations (id, organization_name, organization_code, business_type, industry_type, company_size, contact_email, contact_phone, address, city, state, country, timezone, currency, default_language, status) VALUES
('a1000000-0000-0000-0000-000000000001', 'Prestige Builders Pvt Ltd',    'PRESTIGE',  'Builder',     'RealEstate',         '201-500', 'admin@prestigebuilders.in',  '+91-9800000001', '12, MG Road, Indiranagar',          'Bengaluru',  'Karnataka',     'India', 'Asia/Kolkata', 'INR', 'en', 'Active'),
('a1000000-0000-0000-0000-000000000002', 'Godrej Properties Ltd',         'GODREJ',    'Developer',   'RealEstate',         '500+',    'admin@godrejproperties.com', '+91-9800000002', '5, BKC, Bandra East',              'Mumbai',     'Maharashtra',   'India', 'Asia/Kolkata', 'INR', 'en', 'Active'),
('a1000000-0000-0000-0000-000000000003', 'Sunrise Housing Association',   'SUNRISE',   'Association', 'PropertyManagement', '1-10',    'info@sunrisehousing.in',     '+91-9800000003', 'Block A, Whitefield',               'Bengaluru',  'Karnataka',     'India', 'Asia/Kolkata', 'INR', 'en', 'Active');

-- ============================================================
-- TENANTS
-- ============================================================

INSERT INTO tenants (id, organization_id, tenant_status, db_schema) VALUES
('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Active', 'tenant_prestige'),
('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Active', 'tenant_godrej'),
('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'Active', 'tenant_sunrise');

-- ============================================================
-- SUBSCRIPTION PLANS
-- ============================================================

INSERT INTO subscription_plans (id, organization_id, plan, user_limit, enabled_modules, valid_from, valid_till) VALUES
('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Enterprise', 200, ARRAY['LeadManagement','Inventory','Booking','Payments','VendorManagement','WorkOrder','Documents','ResidentPortal','CustomerPortal','Procurement','AIFeatures'], '2025-01-01', '2026-12-31'),
('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Growth',     50,  ARRAY['LeadManagement','Inventory','Booking','Payments','Documents'],                                                                                               '2025-03-01', '2026-03-01'),
('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'Starter',    10,  ARRAY['ResidentPortal','ServiceRequest','Payments'],                                                                                                               '2025-06-01', '2026-06-01');

-- ============================================================
-- DEPARTMENTS
-- ============================================================

INSERT INTO departments (id, organization_id, department_name, department_code, status) VALUES
('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Sales',          'SALES',   TRUE),
('d1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Finance',        'FIN',     TRUE),
('d1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Operations',     'OPS',     TRUE),
('d1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Legal',          'LEGAL',   TRUE),
('d1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'Sales',          'SALES',   TRUE),
('d1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'Finance',        'FIN',     TRUE),
('d1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003', 'Administration', 'ADMIN',   TRUE);

-- ============================================================
-- ROLES
-- ============================================================

INSERT INTO roles (id, organization_id, role_name, role_description, is_system_role, status) VALUES
-- Prestige
('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Super Admin',        'Full platform access',              TRUE,  TRUE),
('e1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Sales Executive',    'Lead and booking management',       FALSE, TRUE),
('e1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Sales Manager',      'Team lead for sales',               FALSE, TRUE),
('e1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Finance Manager',    'Payment and invoice management',    FALSE, TRUE),
('e1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'Operations Manager', 'Vendor and work order management',  FALSE, TRUE),
('e1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 'Project Manager',    'Project and inventory management',  FALSE, TRUE),
('e1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', 'Customer',           'Buyer portal access',               FALSE, TRUE),
('e1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001', 'Resident',           'Resident portal access',            FALSE, TRUE),
-- Godrej
('e1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000002', 'Super Admin',        'Full platform access',              TRUE,  TRUE),
('e1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000002', 'Sales Executive',    'Lead and booking management',       FALSE, TRUE),
-- Sunrise
('e1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000003', 'Admin',              'Community admin',                   TRUE,  TRUE),
('e1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000003', 'Resident',           'Resident portal access',            FALSE, TRUE);

-- ============================================================
-- PERMISSIONS
-- ============================================================

INSERT INTO permissions (id, module_name, action, description) VALUES
('f1000000-0000-0000-0000-000000000001', 'Leads',        'create', 'Create new lead'),
('f1000000-0000-0000-0000-000000000002', 'Leads',        'read',   'View leads'),
('f1000000-0000-0000-0000-000000000003', 'Leads',        'update', 'Update lead details'),
('f1000000-0000-0000-0000-000000000004', 'Leads',        'delete', 'Delete lead'),
('f1000000-0000-0000-0000-000000000005', 'Inventory',    'create', 'Create project/unit'),
('f1000000-0000-0000-0000-000000000006', 'Inventory',    'read',   'View inventory'),
('f1000000-0000-0000-0000-000000000007', 'Inventory',    'update', 'Update inventory'),
('f1000000-0000-0000-0000-000000000008', 'Bookings',     'create', 'Create booking'),
('f1000000-0000-0000-0000-000000000009', 'Bookings',     'read',   'View bookings'),
('f1000000-0000-0000-0000-000000000010', 'Bookings',     'update', 'Update booking'),
('f1000000-0000-0000-0000-000000000011', 'Payments',     'create', 'Record payment'),
('f1000000-0000-0000-0000-000000000012', 'Payments',     'read',   'View payments'),
('f1000000-0000-0000-0000-000000000013', 'Vendors',      'create', 'Add vendor'),
('f1000000-0000-0000-0000-000000000014', 'Vendors',      'read',   'View vendors'),
('f1000000-0000-0000-0000-000000000015', 'WorkOrders',   'create', 'Create work order'),
('f1000000-0000-0000-0000-000000000016', 'WorkOrders',   'read',   'View work orders'),
('f1000000-0000-0000-0000-000000000017', 'WorkOrders',   'update', 'Update work order'),
('f1000000-0000-0000-0000-000000000018', 'Documents',    'create', 'Upload document'),
('f1000000-0000-0000-0000-000000000019', 'Documents',    'read',   'View documents'),
('f1000000-0000-0000-0000-000000000020', 'ServiceTickets','create','Create service ticket'),
('f1000000-0000-0000-0000-000000000021', 'ServiceTickets','read',  'View service tickets'),
('f1000000-0000-0000-0000-000000000022', 'ServiceTickets','update','Update service ticket'),
('f1000000-0000-0000-0000-000000000023', 'Procurement',  'create', 'Create purchase request'),
('f1000000-0000-0000-0000-000000000024', 'Procurement',  'read',   'View procurement'),
('f1000000-0000-0000-0000-000000000025', 'Reports',      'read',   'View reports and analytics');

-- Role → Permissions (Super Admin gets all, Sales Executive gets leads+bookings, etc.)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'e1000000-0000-0000-0000-000000000001', id FROM permissions;  -- Super Admin (Prestige) - all

INSERT INTO role_permissions (role_id, permission_id) VALUES
('e1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000001'),  -- Sales Exec: leads create
('e1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000002'),  -- leads read
('e1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000003'),  -- leads update
('e1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000006'),  -- inventory read
('e1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000008'),  -- bookings create
('e1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000009'),  -- bookings read
('e1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000011'),  -- Finance: payments create
('e1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000012'),  -- payments read
('e1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000018'),  -- documents create
('e1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000019'),  -- documents read
('e1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000025'),  -- reports
('e1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000013'),  -- Ops: vendors create
('e1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000014'),  -- vendors read
('e1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000015'),  -- wo create
('e1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000016'),  -- wo read
('e1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000017'),  -- wo update
('e1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000023'),  -- procurement create
('e1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000024'); -- procurement read

-- ============================================================
-- USERS  (passwords are bcrypt of "Password@123")
-- ============================================================

INSERT INTO users (id, organization_id, department_id, first_name, last_name, email, phone_number, password_hash, designation, status, joining_date) VALUES
-- Prestige
('a2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Arjun',   'Sharma',    'arjun.sharma@prestigebuilders.in',    '+91-9811000001', '$2b$12$demohashdemohashdemohashdemohashdemohashdemoha01', 'Super Admin',        'Active', '2023-01-01'),
('a2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Priya',   'Nair',      'priya.nair@prestigebuilders.in',      '+91-9811000002', '$2b$12$demohashdemohashdemohashdemohashdemohashdemoha02', 'Sales Manager',      'Active', '2023-03-15'),
('a2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Rahul',   'Mehta',     'rahul.mehta@prestigebuilders.in',     '+91-9811000003', '$2b$12$demohashdemohashdemohashdemohashdemohashdemoha03', 'Sales Executive',    'Active', '2023-06-01'),
('a2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Sneha',   'Reddy',     'sneha.reddy@prestigebuilders.in',     '+91-9811000004', '$2b$12$demohashdemohashdemohashdemohashdemohashdemoha04', 'Sales Executive',    'Active', '2023-09-01'),
('a2000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'Vikram',  'Iyer',      'vikram.iyer@prestigebuilders.in',     '+91-9811000005', '$2b$12$demohashdemohashdemohashdemohashdemohashdemoha05', 'Finance Manager',    'Active', '2022-11-01'),
('a2000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000003', 'Deepak',  'Joshi',     'deepak.joshi@prestigebuilders.in',    '+91-9811000006', '$2b$12$demohashdemohashdemohashdemohashdemohashdemoha06', 'Operations Manager', 'Active', '2022-08-15'),
('a2000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000003', 'Kavya',   'Singh',     'kavya.singh@prestigebuilders.in',     '+91-9811000007', '$2b$12$demohashdemohashdemohashdemohashdemohashdemoha07', 'Project Manager',    'Active', '2023-01-10'),
-- Godrej
('a2000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000005', 'Amit',    'Desai',     'amit.desai@godrejproperties.com',     '+91-9822000001', '$2b$12$demohashdemohashdemohashdemohashdemohashdemoha08', 'Super Admin',        'Active', '2022-05-01'),
('a2000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000005', 'Pooja',   'Kulkarni',  'pooja.kulkarni@godrejproperties.com', '+91-9822000002', '$2b$12$demohashdemohashdemohashdemohashdemohashdemoha09', 'Sales Executive',    'Active', '2023-07-01'),
-- Sunrise
('a2000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000007', 'Suresh',  'Babu',      'suresh.babu@sunrisehousing.in',       '+91-9833000001', '$2b$12$demohashdemohashdemohashdemohashdemohashdemoha10', 'Admin',              'Active', '2024-01-01');

-- Update department heads
UPDATE departments SET department_head_id = 'a2000000-0000-0000-0000-000000000002' WHERE id = 'd1000000-0000-0000-0000-000000000001';
UPDATE departments SET department_head_id = 'a2000000-0000-0000-0000-000000000005' WHERE id = 'd1000000-0000-0000-0000-000000000002';
UPDATE departments SET department_head_id = 'a2000000-0000-0000-0000-000000000006' WHERE id = 'd1000000-0000-0000-0000-000000000003';

-- User Roles
INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES
('a2000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001'),
('a2000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000001'),
('a2000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001'),
('a2000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001'),
('a2000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000001'),
('a2000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000001'),
('a2000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000006', 'a2000000-0000-0000-0000-000000000001'),
('a2000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000009', 'a2000000-0000-0000-0000-000000000008'),
('a2000000-0000-0000-0000-000000000009', 'e1000000-0000-0000-0000-000000000010', 'a2000000-0000-0000-0000-000000000008'),
('a2000000-0000-0000-0000-000000000010', 'e1000000-0000-0000-0000-000000000011', 'a2000000-0000-0000-0000-000000000010');

-- ============================================================
-- PROJECTS
-- ============================================================

INSERT INTO projects (id, organization_id, project_name, project_type, location, city, state, total_units, project_status, rera_number, rera_status, rera_expiry_date, description, created_by) VALUES
('b2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Prestige Green Valley',   'Plot',      'Sarjapur Road, Outer Ring Road',     'Bengaluru', 'Karnataka',   200, 'Active',    'PRM/KA/RERA/1251/309/PR/201228/003245', 'Active', '2026-12-31', 'Premium plotted development with world-class amenities', 'a2000000-0000-0000-0000-000000000007'),
('b2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Prestige Silver Heights', 'Apartment', 'Hebbal, Near Airport Road',          'Bengaluru', 'Karnataka',   120, 'Active',    'PRM/KA/RERA/1251/310/PR/201228/003300', 'Active', '2027-06-30', '2 & 3 BHK luxury apartments with skyline views',        'a2000000-0000-0000-0000-000000000007'),
('b2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Prestige Palm Villas',    'Villa',     'Devanahalli, North Bengaluru',        'Bengaluru', 'Karnataka',    60, 'Upcoming',  NULL, NULL, NULL,                                                    'Independent villa township with private gardens',        'a2000000-0000-0000-0000-000000000007'),
('b2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'Godrej Horizon',          'Apartment', 'Chembur, Eastern Express Highway',   'Mumbai',    'Maharashtra', 300, 'Active',    'P51800046440',                         'Active', '2027-03-31', 'Ultra-luxury high-rise apartments',                      'a2000000-0000-0000-0000-000000000008');

-- ============================================================
-- UNITS
-- ============================================================

INSERT INTO units (id, project_id, unit_number, unit_type, unit_size, size_unit, block_phase, base_price, offer_price, availability_status, facing) VALUES
-- Prestige Green Valley (Plots)
('c2000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'PLT-001', 'Plot', 1200, 'sqft', 'Phase 1', 4800000,  4500000,  'Available', 'East'),
('c2000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001', 'PLT-002', 'Plot', 1500, 'sqft', 'Phase 1', 6000000,  NULL,     'Reserved',  'North'),
('c2000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000001', 'PLT-003', 'Plot', 1800, 'sqft', 'Phase 1', 7200000,  NULL,     'Sold',      'West'),
('c2000000-0000-0000-0000-000000000004', 'b2000000-0000-0000-0000-000000000001', 'PLT-004', 'Plot', 1000, 'sqft', 'Phase 1', 4000000,  3800000,  'Available', 'South'),
('c2000000-0000-0000-0000-000000000005', 'b2000000-0000-0000-0000-000000000001', 'PLT-005', 'Plot', 2400, 'sqft', 'Phase 2', 9600000,  9000000,  'Available', 'NorthEast'),
-- Prestige Silver Heights (Apartments)
('c2000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000002', 'A-101',  'Apartment', 950,  'sqft', 'Block A', 7125000,  NULL,     'Sold',      'East'),
('c2000000-0000-0000-0000-000000000007', 'b2000000-0000-0000-0000-000000000002', 'A-102',  'Apartment', 950,  'sqft', 'Block A', 7125000,  6900000,  'Available', 'West'),
('c2000000-0000-0000-0000-000000000008', 'b2000000-0000-0000-0000-000000000002', 'A-201',  'Apartment', 1350, 'sqft', 'Block A', 10125000, NULL,     'Reserved',  'North'),
('c2000000-0000-0000-0000-000000000009', 'b2000000-0000-0000-0000-000000000002', 'B-101',  'Apartment', 1350, 'sqft', 'Block B', 10125000, 9800000,  'Available', 'East'),
('c2000000-0000-0000-0000-000000000010', 'b2000000-0000-0000-0000-000000000002', 'B-301',  'Apartment', 1600, 'sqft', 'Block B', 12000000, NULL,     'Available', 'NorthEast'),
-- Godrej Horizon (Apartments)
('c2000000-0000-0000-0000-000000000011', 'b2000000-0000-0000-0000-000000000004', 'T1-1201','Apartment', 1800, 'sqft', 'Tower 1', 27000000, 25000000, 'Available', 'East'),
('c2000000-0000-0000-0000-000000000012', 'b2000000-0000-0000-0000-000000000004', 'T1-1202','Apartment', 2200, 'sqft', 'Tower 1', 33000000, NULL,     'Reserved',  'West');

-- ============================================================
-- BROKERS
-- ============================================================

INSERT INTO brokers (id, organization_id, broker_name, phone_number, email, commission_percentage, status) VALUES
('d2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Ramesh Properties',    '+91-9900000001', 'ramesh@rameshprop.com',    2.00, TRUE),
('d2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Cityscape Realtors',   '+91-9900000002', 'info@cityscaperealtor.in', 1.75, TRUE),
('d2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'Prime Estate Brokers', '+91-9900000003', 'prime@primeestate.com',    2.50, TRUE);

-- ============================================================
-- LEADS
-- ============================================================

INSERT INTO leads (id, organization_id, customer_name, phone_number, email, lead_source, project_interest_id, property_type, budget_range, lead_status, assigned_to, broker_id, notes, created_by) VALUES
('e2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Aditya Kumar',    '+91-9710000001', 'aditya.kumar@gmail.com',    'Website',       'b2000000-0000-0000-0000-000000000001', 'Plot',      '40L-60L',   'Qualified',     'a2000000-0000-0000-0000-000000000003', NULL,                                     'Interested in east-facing plots, ready to invest in 2 months', 'a2000000-0000-0000-0000-000000000003'),
('e2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Meera Patel',     '+91-9710000002', 'meera.patel@yahoo.com',     'Referral',      'b2000000-0000-0000-0000-000000000002', 'Apartment', '60L-1Cr',   'VisitPlanned',  'a2000000-0000-0000-0000-000000000003', NULL,                                     'Looking for 2BHK, family of 4',                               'a2000000-0000-0000-0000-000000000003'),
('e2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Sunil Verma',     '+91-9710000003', 'sunil.verma@hotmail.com',   'Broker',        'b2000000-0000-0000-0000-000000000001', 'Plot',      '40L-60L',   'Contacted',     'a2000000-0000-0000-0000-000000000004', 'd2000000-0000-0000-0000-000000000001', 'Broker referred, wants corner plot',                          'a2000000-0000-0000-0000-000000000004'),
('e2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Divya Krishnan',  '+91-9710000004', 'divya.k@gmail.com',         'SocialMedia',   'b2000000-0000-0000-0000-000000000002', 'Apartment', '1Cr-1.5Cr', 'VisitDone',     'a2000000-0000-0000-0000-000000000004', NULL,                                     'Visited site, very interested in 3BHK',                       'a2000000-0000-0000-0000-000000000004'),
('e2000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'Rajesh Gupta',    '+91-9710000005', 'rajesh.gupta@gmail.com',    'Advertisement', 'b2000000-0000-0000-0000-000000000001', 'Plot',      '80L-1Cr',   'Converted',     'a2000000-0000-0000-0000-000000000003', 'd2000000-0000-0000-0000-000000000002', 'Booking completed for PLT-003',                               'a2000000-0000-0000-0000-000000000003'),
('e2000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', 'Anita Sharma',    '+91-9710000006', NULL,                        'WalkIn',        'b2000000-0000-0000-0000-000000000002', 'Apartment', '60L-1Cr',   'New',           'a2000000-0000-0000-0000-000000000003', NULL,                                     'Walk-in inquiry, gave brochure',                              'a2000000-0000-0000-0000-000000000003'),
('e2000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000002', 'Nikhil Jain',     '+91-9720000001', 'nikhil.jain@gmail.com',     'Website',       'b2000000-0000-0000-0000-000000000004', 'Apartment', '2Cr-3Cr',   'Qualified',     'a2000000-0000-0000-0000-000000000009', NULL,                                     'NRI investor looking for premium 3BHK',                       'a2000000-0000-0000-0000-000000000009'),
('e2000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000002', 'Preethi Rajan',   '+91-9720000002', 'preethi.r@outlook.com',     'Broker',        'b2000000-0000-0000-0000-000000000004', 'Apartment', '3Cr+',      'VisitPlanned',  'a2000000-0000-0000-0000-000000000009', 'd2000000-0000-0000-0000-000000000003', 'Referred by Prime Estate, wants high floor',                  'a2000000-0000-0000-0000-000000000009');

-- Lead Follow-ups
INSERT INTO lead_followups (id, lead_id, followup_date, followup_type, notes, next_action, conducted_by) VALUES
('f2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000001', '2025-11-05 10:30:00+05:30', 'Call',    'Spoke to Aditya, interested in Phase 1 east-facing plots. Budget confirmed 50L.',     'ScheduleVisit', 'a2000000-0000-0000-0000-000000000003'),
('f2000000-0000-0000-0000-000000000002', 'e2000000-0000-0000-0000-000000000001', '2025-11-12 11:00:00+05:30', 'Visit',   'Site visit completed. Liked PLT-001. Needs spouse approval.',                        'Negotiation',   'a2000000-0000-0000-0000-000000000003'),
('f2000000-0000-0000-0000-000000000003', 'e2000000-0000-0000-0000-000000000002', '2025-11-08 14:00:00+05:30', 'Call',    'Confirmed visit for next Saturday. Interested in A or B block.',                    'ScheduleVisit', 'a2000000-0000-0000-0000-000000000003'),
('f2000000-0000-0000-0000-000000000004', 'e2000000-0000-0000-0000-000000000004', '2025-11-10 16:00:00+05:30', 'Meeting', 'Met at office. Presented B-301 (3BHK). Very interested. Wants payment plan details.', 'Negotiation',   'a2000000-0000-0000-0000-000000000004');

-- Lead Site Visits
INSERT INTO lead_site_visits (id, lead_id, visit_date, visit_status, remarks, conducted_by) VALUES
('a3000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000001', '2025-11-12 10:00:00+05:30', 'Completed', 'Toured Phase 1. Client happy with infrastructure. Prefers east-facing PLT-001.',  'a2000000-0000-0000-0000-000000000003'),
('a3000000-0000-0000-0000-000000000002', 'e2000000-0000-0000-0000-000000000002', '2025-11-15 10:00:00+05:30', 'Planned',   NULL,                                                                            'a2000000-0000-0000-0000-000000000003'),
('a3000000-0000-0000-0000-000000000003', 'e2000000-0000-0000-0000-000000000004', '2025-11-09 11:00:00+05:30', 'Completed', 'Toured B block. Impressed with amenities and view from 3rd floor.',              'a2000000-0000-0000-0000-000000000004');

-- ============================================================
-- BOOKINGS
-- ============================================================

INSERT INTO bookings (id, organization_id, lead_id, customer_name, phone_number, email, project_id, unit_id, unit_price, booking_date, booking_status, created_by) VALUES
('b3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000005', 'Rajesh Gupta',   '+91-9710000005', 'rajesh.gupta@gmail.com', 'b2000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000003', 7200000,  '2025-10-15 11:00:00+05:30', 'Confirmed', 'a2000000-0000-0000-0000-000000000003'),
('b3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000002', 'Meera Patel',    '+91-9710000002', 'meera.patel@yahoo.com',  'b2000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000008', 10125000, '2025-11-01 10:00:00+05:30', 'Pending',   'a2000000-0000-0000-0000-000000000003'),
('b3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'e2000000-0000-0000-0000-000000000007', 'Nikhil Jain',    '+91-9720000001', 'nikhil.jain@gmail.com',  'b2000000-0000-0000-0000-000000000004', 'c2000000-0000-0000-0000-000000000012', 33000000, '2025-11-20 09:30:00+05:30', 'Confirmed', 'a2000000-0000-0000-0000-000000000009');

-- Update lead booking references
UPDATE leads SET is_converted = TRUE, converted_at = '2025-10-15 11:00:00+05:30', booking_id = 'b3000000-0000-0000-0000-000000000001' WHERE id = 'e2000000-0000-0000-0000-000000000005';

-- Payment Plans
INSERT INTO payment_plans (id, booking_id, plan_name, installment_count, total_amount, payment_milestones) VALUES
('c3000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001', 'Construction Linked Plan', 5, 7200000,  'Booking 10% → Foundation 20% → Structure 30% → Possession 30% → Registry 10%'),
('c3000000-0000-0000-0000-000000000002', 'b3000000-0000-0000-0000-000000000002', 'Down Payment Plan',        3, 10125000, 'Down Payment 30% → Mid 40% → Possession 30%'),
('c3000000-0000-0000-0000-000000000003', 'b3000000-0000-0000-0000-000000000003', 'Flexi Pay Plan',           4, 33000000, 'Booking 20% → Slab 30% → Finishing 30% → Handover 20%');

-- Payment Installments
INSERT INTO payment_installments (id, plan_id, booking_id, installment_number, due_date, amount, paid_amount, payment_status) VALUES
('d3000000-0000-0000-0000-000000000001', 'c3000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001', 1, '2025-10-15', 720000,  720000,  'Completed'),
('d3000000-0000-0000-0000-000000000002', 'c3000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001', 2, '2026-02-01', 1440000, 0,       'Pending'),
('d3000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001', 3, '2026-07-01', 2160000, 0,       'Pending'),
('d3000000-0000-0000-0000-000000000004', 'c3000000-0000-0000-0000-000000000002', 'b3000000-0000-0000-0000-000000000002', 1, '2025-11-01', 3037500, 3037500, 'Completed'),
('d3000000-0000-0000-0000-000000000005', 'c3000000-0000-0000-0000-000000000002', 'b3000000-0000-0000-0000-000000000002', 2, '2026-05-01', 4050000, 0,       'Pending'),
('d3000000-0000-0000-0000-000000000006', 'c3000000-0000-0000-0000-000000000003', 'b3000000-0000-0000-0000-000000000003', 1, '2025-11-20', 6600000, 6600000, 'Completed'),
('d3000000-0000-0000-0000-000000000007', 'c3000000-0000-0000-0000-000000000003', 'b3000000-0000-0000-0000-000000000003', 2, '2026-04-01', 9900000, 0,       'Pending');

-- Payments
INSERT INTO payments (id, organization_id, booking_id, installment_id, payment_amount, payment_date, payment_mode, receipt_number, payment_status, transaction_id, recorded_by) VALUES
('e3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001', 720000,  '2025-10-15', 'BankTransfer', 'RCP-2025-0001', 'Completed', 'TXN240001928374', 'a2000000-0000-0000-0000-000000000005'),
('e3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'b3000000-0000-0000-0000-000000000002', 'd3000000-0000-0000-0000-000000000004', 3037500, '2025-11-01', 'NetBanking',   'RCP-2025-0002', 'Completed', 'TXN240009123456', 'a2000000-0000-0000-0000-000000000005'),
('e3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'b3000000-0000-0000-0000-000000000003', 'd3000000-0000-0000-0000-000000000006', 6600000, '2025-11-20', 'BankTransfer', 'RCP-2025-0003', 'Completed', 'TXN240009876543', 'a2000000-0000-0000-0000-000000000008');

-- ============================================================
-- VENDORS
-- ============================================================

INSERT INTO vendors (id, organization_id, vendor_name, vendor_type, categories, contact_person, phone_number, email, address, city, status, avg_rating) VALUES
('f3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'SparkElec Services',        'ServiceProvider', ARRAY['Electrical','Lighting'],          'Ramakrishnan V', '+91-9500000001', 'sparkv@sparkv.com',       '45 Industrial Estate, Peenya',   'Bengaluru', 'Active',    4.2),
('f3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'AquaFix Plumbing',          'ServiceProvider', ARRAY['Plumbing','Sanitation'],          'Suresh Pillai',  '+91-9500000002', 'aquafix@aquafix.in',      '12 Service Lane, Rajajinagar',   'Bengaluru', 'Active',    4.5),
('f3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'BuildRight Civil Works',    'Contractor',      ARRAY['Civil','Construction','Masonry'], 'Mohan Das',      '+91-9500000003', 'info@buildright.co.in',   '88 Contractor Colony, Tumkur Rd','Bengaluru', 'Active',    4.0),
('f3000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'CoolAir HVAC Solutions',    'ServiceProvider', ARRAY['HVAC','AirConditioning'],         'Ajay Mathur',    '+91-9500000004', 'coolair@coolair.in',      '67 Tech Park, Whitefield',       'Bengaluru', 'Active',    3.8),
('f3000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'GreenScape Landscaping',    'ServiceProvider', ARRAY['Landscaping','Gardening'],        'Pradeep Kumar',  '+91-9500000005', NULL,                      'Nursery Road, Banashankari',     'Bengaluru', 'Active',    4.6),
('f3000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'MetroClean Facility Mgmt',  'ServiceProvider', ARRAY['Cleaning','Housekeeping'],        'Santosh Hegde',  '+91-9500000006', 'metroclean@metroclean.in','Plot 5, MIDC, Andheri East',     'Mumbai',    'Active',    4.3);

-- ============================================================
-- SLA DEFINITIONS
-- ============================================================

INSERT INTO sla_definitions (id, organization_id, sla_name, category, response_time_hours, resolution_time_hours) VALUES
('a4000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Critical Electrical',  'Electrical', 1,  4),
('a4000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Plumbing Standard',    'Plumbing',   2,  8),
('a4000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Civil Works',          'Civil',      4,  48),
('a4000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Cleaning',             'Cleaning',   2,  6),
('a4000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'General Maintenance',  'General',    4,  24);

-- ============================================================
-- SERVICE TICKETS
-- ============================================================

INSERT INTO service_tickets (id, organization_id, request_title, issue_category, priority, description, unit_id, project_id, ticket_status, source_channel, sla_id, sla_status, sla_start_time, sla_due_time, assigned_vendor_id, assignment_date, created_by) VALUES
('b4000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Power trip in Block A lobby',          'Electrical', 'High',     'Main MCB tripping every 2 hours since morning. Affects entire lobby lighting.',       'c2000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000002', 'InProgress', 'App',    'a4000000-0000-0000-0000-000000000001', 'OnTrack',  '2025-11-10 08:00:00+05:30', '2025-11-10 12:00:00+05:30', 'f3000000-0000-0000-0000-000000000001', '2025-11-10 08:30:00+05:30', 'a2000000-0000-0000-0000-000000000006'),
('b4000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Water leakage in bathroom',            'Plumbing',   'Medium',   'Pipe leaking near shower area in flat A-201. Minor drip but causing damp walls.',    'c2000000-0000-0000-0000-000000000008', 'b2000000-0000-0000-0000-000000000002', 'Open',       'Portal', 'a4000000-0000-0000-0000-000000000002', 'OnTrack',  '2025-11-11 09:00:00+05:30', '2025-11-11 17:00:00+05:30', NULL,                                      NULL,                          'a2000000-0000-0000-0000-000000000006'),
('b4000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Boundary wall crack in Phase 1',       'Civil',      'Low',      'Small crack visible in boundary wall between PLT-002 and PLT-003. Needs inspection.',NULL,                                    'b2000000-0000-0000-0000-000000000001', 'Open',       'Portal', 'a4000000-0000-0000-0000-000000000003', 'OnTrack',  '2025-11-12 10:00:00+05:30', '2025-11-14 10:00:00+05:30', 'f3000000-0000-0000-0000-000000000003', '2025-11-12 11:00:00+05:30', 'a2000000-0000-0000-0000-000000000006'),
('b4000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Common area cleaning not done',        'Cleaning',   'Medium',   'Lobby and staircase in Block B not cleaned since 2 days.',                           NULL,                                    'b2000000-0000-0000-0000-000000000002', 'Resolved',   'WhatsApp','a4000000-0000-0000-0000-000000000004', 'OnTrack',  '2025-11-08 07:00:00+05:30', '2025-11-08 13:00:00+05:30', 'f3000000-0000-0000-0000-000000000001', '2025-11-08 07:30:00+05:30', 'a2000000-0000-0000-0000-000000000006');

-- ============================================================
-- WORK ORDERS
-- ============================================================

INSERT INTO work_orders (id, organization_id, title, description, work_type, project_id, priority, requested_by, requested_date, vendor_id, assigned_date, assigned_by, estimated_cost, estimated_duration_days, planned_start_date, planned_end_date, sla_status, status, completion_percentage) VALUES
('c4000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Phase 1 Road Laying Work',         'Lay 40ft wide internal roads for Phase 1 plots including drainage and lighting setup.',    'Construction', 'b2000000-0000-0000-0000-000000000001', 'High',   'a2000000-0000-0000-0000-000000000007', '2025-10-01 10:00:00+05:30', 'f3000000-0000-0000-0000-000000000003', '2025-10-05', 'a2000000-0000-0000-0000-000000000006', 850000,  45, '2025-10-05', '2025-11-20', 'OnTrack',  'InProgress', 65),
('c4000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Block A Electrical Wiring',        'Complete electrical wiring and panel installation for Block A apartments floors 1-5.',     'Maintenance',  'b2000000-0000-0000-0000-000000000002', 'High',   'a2000000-0000-0000-0000-000000000007', '2025-10-10 09:00:00+05:30', 'f3000000-0000-0000-0000-000000000001', '2025-10-12', 'a2000000-0000-0000-0000-000000000006', 320000,  30, '2025-10-12', '2025-11-10', 'Breached',  'InProgress', 80),
('c4000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Landscaping Phase 2 Entry Gate',   'Landscaping and beautification work at Phase 2 main entry including fountain and garden.',   'Maintenance',  'b2000000-0000-0000-0000-000000000001', 'Medium', 'a2000000-0000-0000-0000-000000000007', '2025-11-01 11:00:00+05:30', 'f3000000-0000-0000-0000-000000000005', '2025-11-03', 'a2000000-0000-0000-0000-000000000006', 150000,  14, '2025-11-03', '2025-11-17', 'OnTrack',  'Open',       0),
('c4000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Water Tank Cleaning',              'Quarterly cleaning of overhead and underground water storage tanks for Silver Heights.',   'Maintenance',  'b2000000-0000-0000-0000-000000000002', 'Low',    'a2000000-0000-0000-0000-000000000006', '2025-11-10 10:00:00+05:30', 'f3000000-0000-0000-0000-000000000002', '2025-11-11', 'a2000000-0000-0000-0000-000000000006', 18000,   2,  '2025-11-11', '2025-11-12', 'OnTrack',  'Completed',  100);

-- ============================================================
-- SUPPLIERS
-- ============================================================

INSERT INTO suppliers (id, organization_id, supplier_name, supplier_type, material_categories, contact_person, phone_number, email, address, city, status, avg_rating, on_time_delivery_pct) VALUES
('d4000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Ultratech Cement Distributors', 'Material',   ARRAY['Cement','Concrete'],          'Harish Shetty',  '+91-9600000001', 'ultratech.dist@gmail.com', '23 Industrial Area, Peenya',    'Bengaluru', 'Active', 4.5, 92.00),
('d4000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'TATA Steel Authorized Dealer',  'Material',   ARRAY['Steel','TMT Bars','Rebar'],   'Prashant Rao',   '+91-9600000002', 'tata.steel.blr@gmail.com',  '56 Steel Market, Nagarbhavi',   'Bengaluru', 'Active', 4.7, 96.00),
('d4000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Agg-Rock Sand & Gravel',        'Material',   ARRAY['Sand','Gravel','Aggregate'],  'Venkat Reddy',   '+91-9600000003', NULL,                        'Quarry Road, Tumkur Highway',   'Bengaluru', 'Active', 3.9, 78.00),
('d4000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Kajaria Tiles & Ceramics',      'Material',   ARRAY['Tiles','Ceramics','Flooring'],'Deepa Menon',    '+91-9600000004', 'kajaria.blr@gmail.com',     'Showroom Lane, Koramangala',    'Bengaluru', 'Active', 4.4, 88.00);

-- Materials
INSERT INTO materials (id, organization_id, material_name, category, unit_of_measure, description) VALUES
('e4000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'OPC 53 Grade Cement',    'Cement',   'Bag',  '50kg bags, Ordinary Portland Cement grade 53'),
('e4000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'TMT Fe500 Steel 12mm',   'Steel',    'Ton',  'TATA TISCON Fe500 grade 12mm TMT rebars'),
('e4000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'River Sand',             'Sand',     'CFT',  'Washed river sand for plastering and construction'),
('e4000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', '20mm Crushed Aggregate', 'Aggregate','CFT',  '20mm machine crushed granite aggregate'),
('e4000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'Vitrified Floor Tiles',  'Tiles',    'SqFt', '600x600mm double charged vitrified tiles');

-- Supplier Materials (Pricing)
INSERT INTO supplier_materials (id, supplier_id, material_id, price_per_unit, effective_date, valid_till, daily_capacity, lead_time_days, availability_status, is_best_price, status) VALUES
('f4000000-0000-0000-0000-000000000001', 'd4000000-0000-0000-0000-000000000001', 'e4000000-0000-0000-0000-000000000001', 380,    '2025-10-01', '2026-03-31', 500,  1, 'Available', TRUE,  TRUE),
('f4000000-0000-0000-0000-000000000002', 'd4000000-0000-0000-0000-000000000002', 'e4000000-0000-0000-0000-000000000002', 68000,  '2025-10-01', '2026-03-31', 50,   3, 'Available', TRUE,  TRUE),
('f4000000-0000-0000-0000-000000000003', 'd4000000-0000-0000-0000-000000000003', 'e4000000-0000-0000-0000-000000000003', 55,     '2025-10-01', NULL,          2000, 1, 'Available', TRUE,  TRUE),
('f4000000-0000-0000-0000-000000000004', 'd4000000-0000-0000-0000-000000000003', 'e4000000-0000-0000-0000-000000000004', 42,     '2025-10-01', NULL,          3000, 1, 'Available', TRUE,  TRUE),
('f4000000-0000-0000-0000-000000000005', 'd4000000-0000-0000-0000-000000000004', 'e4000000-0000-0000-0000-000000000005', 85,     '2025-10-01', '2026-06-30', 5000, 7, 'Available', TRUE,  TRUE);

-- ============================================================
-- PURCHASE REQUESTS & ORDERS
-- ============================================================

INSERT INTO purchase_requests (id, organization_id, requested_by, project_id, material_id, quantity, required_date, priority, notes, approval_status, approved_by, approval_date) VALUES
('a5000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000001', 'e4000000-0000-0000-0000-000000000001', 500,  '2025-11-20', 'High',   'For road laying foundation work Phase 1',      'Approved', 'a2000000-0000-0000-0000-000000000001', '2025-11-06'),
('a5000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000002', 'e4000000-0000-0000-0000-000000000002', 15,   '2025-11-25', 'High',   'Steel for floor slabs Block B floors 6-8',     'Approved', 'a2000000-0000-0000-0000-000000000001', '2025-11-07'),
('a5000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000006', 'b2000000-0000-0000-0000-000000000002', 'e4000000-0000-0000-0000-000000000005', 3000, '2025-12-10', 'Medium', 'Flooring tiles for Block A units ground floor', 'Draft',    NULL,                                          NULL);

INSERT INTO purchase_orders (id, organization_id, pr_id, supplier_id, material_id, quantity, unit_price, delivery_date, status, is_best_price, created_by) VALUES
('b5000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000001', 'd4000000-0000-0000-0000-000000000001', 'e4000000-0000-0000-0000-000000000001', 500,  380,   '2025-11-19', 'Delivered', TRUE, 'a2000000-0000-0000-0000-000000000006'),
('b5000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000002', 'd4000000-0000-0000-0000-000000000002', 'e4000000-0000-0000-0000-000000000002', 15,   68000, '2025-11-24', 'Sent',      TRUE, 'a2000000-0000-0000-0000-000000000006');

INSERT INTO po_deliveries (id, po_id, delivery_status, received_quantity, received_date, quality_check, received_by) VALUES
('c5000000-0000-0000-0000-000000000001', 'b5000000-0000-0000-0000-000000000001', 'Completed', 500,  '2025-11-18', 'Passed', 'a2000000-0000-0000-0000-000000000006'),
('c5000000-0000-0000-0000-000000000002', 'b5000000-0000-0000-0000-000000000002', 'Pending',   NULL, NULL,         'Pending', NULL);

-- ============================================================
-- VENDOR INVOICES
-- ============================================================

INSERT INTO vendor_invoices (id, organization_id, vendor_id, work_order_id, po_id, project_id, vendor_invoice_number, invoice_date, invoice_amount, tax_amount, invoice_file_url, validation_status, validated_by, validation_date, payment_status, paid_amount) VALUES
('d5000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'f3000000-0000-0000-0000-000000000003', 'c4000000-0000-0000-0000-000000000001', NULL,                                      'b2000000-0000-0000-0000-000000000001', 'BR/2025/INV/0234', '2025-11-10', 552500,  99450,  'https://docs.arris.in/inv/BR-0234.pdf', 'Approved',  'a2000000-0000-0000-0000-000000000005', '2025-11-12', 'Partial', 400000),
('d5000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'f3000000-0000-0000-0000-000000000001', 'c4000000-0000-0000-0000-000000000002', NULL,                                      'b2000000-0000-0000-0000-000000000002', 'SE/2025/INV/0089', '2025-11-08', 256000,  46080,  'https://docs.arris.in/inv/SE-0089.pdf', 'Pending',   NULL,                                       NULL,          'Pending', 0),
('d5000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'f3000000-0000-0000-0000-000000000003', NULL,                                      'b5000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'UT/2025/0567',    '2025-11-18', 190000,  34200,  'https://docs.arris.in/inv/UT-0567.pdf', 'Approved',  'a2000000-0000-0000-0000-000000000005', '2025-11-19', 'Paid',    224200);

-- ============================================================
-- RESIDENTS
-- ============================================================

INSERT INTO residents (id, organization_id, resident_type, full_name, phone_number, email, unit_id, move_in_date, resident_status, portal_access, login_username, resident_tags, current_occupancy) VALUES
('e5000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Owner',  'Rajesh Gupta',   '+91-9710000005', 'rajesh.gupta@gmail.com',  'c2000000-0000-0000-0000-000000000003', '2025-08-01', 'Active',   TRUE, 'rajesh.gupta',   ARRAY['VIP'],           'Occupied'),
('e5000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Tenant', 'Kavitha Srinivas','+91-9710000010', 'kavitha.s@gmail.com',    'c2000000-0000-0000-0000-000000000006', '2025-09-01', 'Active',   TRUE, 'kavitha.srinivas',ARRAY[]::text[],        'Occupied'),
('e5000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Owner',  'Meera Patel',    '+91-9710000002', 'meera.patel@yahoo.com',   'c2000000-0000-0000-0000-000000000008', '2025-11-01', 'Active',   TRUE, 'meera.patel',    ARRAY[]::text[],        'Occupied'),
('e5000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Tenant', 'Arun Babu',      '+91-9710000011', 'arun.b@outlook.com',      'c2000000-0000-0000-0000-000000000007', '2025-07-15', 'Active',   FALSE, NULL,             ARRAY['Defaulter'],     'Occupied');

-- Notices
INSERT INTO notices (id, organization_id, project_id, notice_title, notice_category, notice_description, publish_date, expiry_date, audience_type, send_push, created_by) VALUES
('f5000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 'Water Supply Interruption – Nov 15',    'Maintenance', 'Due to overhead tank cleaning, water supply will be interrupted on 15 Nov from 9 AM to 1 PM. Please store water in advance.',                                          '2025-11-12 08:00:00+05:30', '2025-11-15 14:00:00+05:30', 'All',    TRUE,  'a2000000-0000-0000-0000-000000000006'),
('f5000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 'Community Diwali Celebrations 2025',    'Event',       'Dear residents, we are delighted to invite you all to our community Diwali celebration on 20 Nov 2025 at 6 PM in the Clubhouse. Please bring sweets to share!', '2025-11-10 09:00:00+05:30', '2025-11-21 00:00:00+05:30', 'All',    TRUE,  'a2000000-0000-0000-0000-000000000006'),
('f5000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'November Maintenance Dues Reminder',    'Financial',   'This is a friendly reminder that November 2025 maintenance charges of ₹3,500/- are due by 30th November. Please pay via the resident portal.',                    '2025-11-01 07:00:00+05:30', '2025-11-30 23:59:00+05:30', 'Owners', FALSE, 'a2000000-0000-0000-0000-000000000006');

-- Amenities
INSERT INTO amenities (id, organization_id, project_id, amenity_type, amenity_name, max_occupancy, status) VALUES
('a6000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 'Gym',          'Fitness Center',     30,  TRUE),
('a6000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 'Clubhouse',    'Community Hall',     100, TRUE),
('a6000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000002', 'SwimmingPool', 'Rooftop Pool',       50,  TRUE),
('a6000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'Playground',   'Kids Play Area',     NULL,TRUE);

INSERT INTO amenity_time_slots (id, amenity_id, slot_label, start_time, end_time, is_active) VALUES
('b6000000-0000-0000-0000-000000000001', 'a6000000-0000-0000-0000-000000000001', '6 AM – 8 AM',   '06:00', '08:00', TRUE),
('b6000000-0000-0000-0000-000000000002', 'a6000000-0000-0000-0000-000000000001', '5 PM – 7 PM',   '17:00', '19:00', TRUE),
('b6000000-0000-0000-0000-000000000003', 'a6000000-0000-0000-0000-000000000002', '9 AM – 12 PM',  '09:00', '12:00', TRUE),
('b6000000-0000-0000-0000-000000000004', 'a6000000-0000-0000-0000-000000000002', '5 PM – 9 PM',   '17:00', '21:00', TRUE),
('b6000000-0000-0000-0000-000000000005', 'a6000000-0000-0000-0000-000000000003', '6 AM – 10 AM',  '06:00', '10:00', TRUE),
('b6000000-0000-0000-0000-000000000006', 'a6000000-0000-0000-0000-000000000003', '4 PM – 8 PM',   '16:00', '20:00', TRUE);

-- Visitor Entries
INSERT INTO visitor_entries (id, resident_id, unit_id, visitor_name, mobile_number, vehicle_number, visit_datetime, approval_status, check_in_time, check_out_time) VALUES
('c6000000-0000-0000-0000-000000000001', 'e5000000-0000-0000-0000-000000000001', 'c2000000-0000-0000-0000-000000000003', 'Ritu Sharma',    '+91-9711111001', 'KA-01-AB-1234', '2025-11-12 11:00:00+05:30', 'Approved', '2025-11-12 11:05:00+05:30', '2025-11-12 12:30:00+05:30'),
('c6000000-0000-0000-0000-000000000002', 'e5000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000006', 'Delivery - Zepto','+91-9000000001', NULL,            '2025-11-12 14:00:00+05:30', 'Approved', '2025-11-12 14:02:00+05:30', '2025-11-12 14:10:00+05:30'),
('c6000000-0000-0000-0000-000000000003', 'e5000000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000008', 'Rohan Mehta',    '+91-9711111003', 'KA-03-CD-5678', '2025-11-13 18:00:00+05:30', 'Pending',  NULL,                         NULL);

-- ============================================================
-- DOCUMENTS
-- ============================================================

INSERT INTO documents (id, organization_id, document_name, document_type, file_url, file_size_mb, uploaded_by, booking_id, project_id, version_number, access_level) VALUES
('dc100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Prestige Green Valley RERA Certificate',    'RERA',      'https://docs.arris.in/doc/rera-green-valley.pdf',      2.1,  'a2000000-0000-0000-0000-000000000001', NULL,                                       'b2000000-0000-0000-0000-000000000001', 1, 'Public'),
('dc100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Sale Agreement - Rajesh Gupta PLT-003',      'Agreement', 'https://docs.arris.in/doc/sa-rajesh-plt003.pdf',       1.8,  'a2000000-0000-0000-0000-000000000005', 'b3000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 1, 'Restricted'),
('dc100000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'Payment Receipt BK-001 Installment 1',       'Receipt',   'https://docs.arris.in/doc/receipt-bk001-i1.pdf',      0.3,  'a2000000-0000-0000-0000-000000000005', 'b3000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 1, 'Restricted'),
('dc100000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'Silver Heights RERA Certificate',             'RERA',      'https://docs.arris.in/doc/rera-silver-heights.pdf',    2.4,  'a2000000-0000-0000-0000-000000000001', NULL,                                       'b2000000-0000-0000-0000-000000000002', 1, 'Public'),
('dc100000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'Sale Agreement - Meera Patel A-201',          'Agreement', 'https://docs.arris.in/doc/sa-meera-a201.pdf',          2.0,  'a2000000-0000-0000-0000-000000000005', 'b3000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 1, 'Restricted');

-- RERA Compliance
INSERT INTO compliance_rera (id, project_id, rera_number, rera_status, expiry_date, expiry_alert, document_id) VALUES
('d6000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 'PRM/KA/RERA/1251/309/PR/201228/003245', 'Active', '2026-12-31', TRUE, 'dc100000-0000-0000-0000-000000000001'),
('d6000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 'PRM/KA/RERA/1251/310/PR/201228/003300', 'Active', '2027-06-30', TRUE, 'dc100000-0000-0000-0000-000000000004');

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

INSERT INTO notification_preferences (id, user_id, email_notifications, sms_notifications, in_app_notifications, notification_types) VALUES
('e6000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', TRUE,  TRUE,  TRUE,  ARRAY['LeadAssigned','BookingCreated','PaymentReceived','WorkOrderUpdate','TicketUpdate']),
('e6000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', TRUE,  TRUE,  TRUE,  ARRAY['LeadAssigned','SiteVisitScheduled','ConversionAlert']),
('e6000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000003', TRUE,  FALSE, TRUE,  ARRAY['LeadAssigned','FollowUpReminder','SiteVisitScheduled']),
('e6000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000005', TRUE,  FALSE, TRUE,  ARRAY['PaymentReceived','InvoiceApproved','DueReminder']),
('e6000000-0000-0000-0000-000000000005', 'a2000000-0000-0000-0000-000000000006', TRUE,  TRUE,  TRUE,  ARRAY['TicketCreated','WorkOrderUpdate','VendorAssigned','SLABreach']);

INSERT INTO notification_events (id, event_type, trigger_source, reference_id, reference_type, trigger_time) VALUES
('f6000000-0000-0000-0000-000000000001', 'BookingCreated',    'Bookings',      'b3000000-0000-0000-0000-000000000001', 'Booking',      '2025-10-15 11:00:00+05:30'),
('f6000000-0000-0000-0000-000000000002', 'PaymentReceived',   'Payments',      'e3000000-0000-0000-0000-000000000001', 'Payment',      '2025-10-15 11:15:00+05:30'),
('f6000000-0000-0000-0000-000000000003', 'TicketCreated',     'ServiceTickets','b4000000-0000-0000-0000-000000000001', 'Ticket',       '2025-11-10 08:00:00+05:30'),
('f6000000-0000-0000-0000-000000000004', 'WorkOrderAssigned', 'WorkOrders',    'c4000000-0000-0000-0000-000000000002', 'WorkOrder',    '2025-10-12 09:00:00+05:30');

INSERT INTO notifications (id, organization_id, event_id, recipient_id, channel, title, message_body, redirect_url, read_status, status, sent_at) VALUES
('a7000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'f6000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 'InApp',  'New Booking Created',            'Booking BK-001 for PLT-003 by Rajesh Gupta has been confirmed for ₹72,00,000.',         '/bookings/bk100000-0000-0000-0000-000000000001', TRUE,  'Sent', '2025-10-15 11:01:00+05:30'),
('a7000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'f6000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000005', 'Email',  'Payment Received – ₹7,20,000',   'Payment of ₹7,20,000 received for Booking BK-001 (Rajesh Gupta). Receipt: RCP-2025-0001.', '/payments/py100000-0000-0000-0000-000000000001',  TRUE,  'Sent', '2025-10-15 11:16:00+05:30'),
('a7000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'f6000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000006', 'InApp',  'New Service Ticket #TK-001',     'High priority electrical ticket raised for Block A lobby. Please review and assign.',      '/tickets/tk100000-0000-0000-0000-000000000001',   FALSE, 'Sent', '2025-11-10 08:01:00+05:30'),
('a7000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'f6000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000006', 'InApp',  'Work Order Assigned to SparkElec','WO-002 (Block A Electrical Wiring) has been assigned to SparkElec Services.',             '/work-orders/wo100000-0000-0000-0000-000000000002',FALSE, 'Sent', '2025-10-12 09:05:00+05:30');

-- ============================================================
-- AI FEATURES SEED DATA
-- ============================================================

INSERT INTO ai_lead_scores (id, lead_id, lead_score, conversion_probability, lead_temperature, next_best_action, score_updated_at) VALUES
('b7000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000001', 78, 68.50, 'Hot',  'ScheduleNegotiation', '2025-11-12 12:00:00+05:30'),
('b7000000-0000-0000-0000-000000000002', 'e2000000-0000-0000-0000-000000000002', 65, 52.00, 'Warm', 'ScheduleVisit',       '2025-11-11 10:00:00+05:30'),
('b7000000-0000-0000-0000-000000000003', 'e2000000-0000-0000-0000-000000000003', 42, 28.00, 'Cold', 'Call',                '2025-11-10 09:00:00+05:30'),
('b7000000-0000-0000-0000-000000000004', 'e2000000-0000-0000-0000-000000000004', 88, 81.00, 'Hot',  'CloseBooking',        '2025-11-10 16:30:00+05:30'),
('b7000000-0000-0000-0000-000000000005', 'e2000000-0000-0000-0000-000000000007', 82, 73.00, 'Hot',  'ScheduleVisit',       '2025-11-12 14:00:00+05:30'),
('b7000000-0000-0000-0000-000000000006', 'e2000000-0000-0000-0000-000000000008', 70, 60.00, 'Warm', 'SendOffer',           '2025-11-12 15:00:00+05:30');

INSERT INTO ai_demand_insights (id, project_id, demand_score, predicted_sales_velocity, high_demand_unit_type, price_sensitivity_index, lead_demand_count, calculated_at) VALUES
('c7000000-0000-0000-0000-000000000001', 'b2000000-0000-0000-0000-000000000001', 82.5, 4,  'Plot',     35.00, 12, '2025-11-12 00:00:00+05:30'),
('c7000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 75.0, 3,  'Apartment', 42.00, 9, '2025-11-12 00:00:00+05:30'),
('c7000000-0000-0000-0000-000000000003', 'b2000000-0000-0000-0000-000000000004', 91.0, 5,  'Apartment', 28.00, 7, '2025-11-12 00:00:00+05:30');

COMMIT;
