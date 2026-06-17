-- ============================================================
-- ARRIS Seed — Module 2 & 3: Projects, Units, Bookings, Payments
-- Run after 0002_fix_and_permissions.sql
-- ============================================================

BEGIN;

-- ============================================================
-- 1. PROJECTS
-- ============================================================

INSERT INTO projects (
    id, organization_id,
    project_name, project_type, project_status,
    location, city, state,
    total_units, rera_number, description, created_by
) VALUES
(
    'b1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'Prestige Skyline', 'Apartment', 'Active',
    'Koramangala', 'Bengaluru', 'Karnataka',
    120, 'KA-REG-2024-001',
    'Premium residential towers in the heart of Koramangala with world-class amenities.',
    (SELECT id FROM users WHERE email='arjun.sharma@prestigebuilders.in' LIMIT 1)
),
(
    'b1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'Godrej Riverside', 'Villa', 'Completed',
    'Whitefield', 'Bengaluru', 'Karnataka',
    200, 'KA-REG-2021-042',
    'Completed riverside township with excellent connectivity.',
    (SELECT id FROM users WHERE email='arjun.sharma@prestigebuilders.in' LIMIT 1)
),
(
    'b1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'Sunrise Commercial Hub', 'Mixed', 'Upcoming',
    'Electronic City', 'Bengaluru', 'Karnataka',
    60, NULL,
    'Grade-A commercial office spaces in the IT corridor.',
    (SELECT id FROM users WHERE email='suresh.babu@sunrisehousing.in' LIMIT 1)
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. UNITS
-- ============================================================

INSERT INTO units (
    id, project_id,
    unit_number, unit_type, unit_size, size_unit,
    floor_number, base_price, offer_price,
    availability_status, facing
) VALUES
(
    'c1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'A-101', 'Apartment', 1050, 'sqft',
    1, 6500000, 6825000,
    'Available', 'East'
),
(
    'c1000000-0000-0000-0000-000000000002',
    'b1000000-0000-0000-0000-000000000001',
    'A-201', 'Apartment', 1450, 'sqft',
    2, 9200000, 9660000,
    'Reserved', 'North'
),
(
    'c1000000-0000-0000-0000-000000000003',
    'b1000000-0000-0000-0000-000000000001',
    'B-301', 'Apartment', 1100, 'sqft',
    3, 7000000, 7350000,
    'Sold', 'West'
),
(
    'c1000000-0000-0000-0000-000000000004',
    'b1000000-0000-0000-0000-000000000001',
    'B-401', 'Apartment', 1600, 'sqft',
    4, 10500000, 11025000,
    'Available', 'South'
),
(
    'c1000000-0000-0000-0000-000000000005',
    'b1000000-0000-0000-0000-000000000002',
    'V-001', 'Villa', 2800, 'sqft',
    1, 18000000, 18900000,
    'Sold', 'East'
),
(
    'c1000000-0000-0000-0000-000000000006',
    'b1000000-0000-0000-0000-000000000002',
    'V-012', 'Villa', 3200, 'sqft',
    1, 22000000, 23100000,
    'Available', 'North'
)
ON CONFLICT (project_id, unit_number) DO NOTHING;

-- ============================================================
-- 3. SITE LAYOUTS
-- ============================================================

INSERT INTO site_layouts (id, project_id, layout_name, layout_file_url, layout_type, canvas_width, canvas_height)
VALUES
(
    'd1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'Prestige Skyline Master Plan',
    'https://storage.arris.dev/layouts/prestige-master.pdf',
    'PDF', 1200, 800
),
(
    'd1000000-0000-0000-0000-000000000002',
    'b1000000-0000-0000-0000-000000000002',
    'Godrej Riverside Floor Plan',
    'https://storage.arris.dev/layouts/godrej-floor.pdf',
    'PDF', 1400, 900
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. BOOKINGS
-- ============================================================

INSERT INTO bookings (
    id, organization_id, lead_id, project_id, unit_id,
    customer_name, phone_number, email,
    unit_price, booking_status, created_by
) VALUES
(
    'e1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    NULL,
    'b1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000002',
    'Rahul Mehta', '+91-9876543210', 'rahul.mehta@example.com',
    9660000, 'Confirmed',
    (SELECT id FROM users WHERE email='arjun.sharma@prestigebuilders.in' LIMIT 1)
),
(
    'e1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    NULL,
    'b1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000003',
    'Sneha Reddy', '+91-8765432109', 'sneha.reddy@example.com',
    7350000, 'Completed',
    (SELECT id FROM users WHERE email='priya.nair@prestigebuilders.in' LIMIT 1)
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. PAYMENT PLANS & INSTALLMENTS
-- ============================================================

INSERT INTO payment_plans (id, booking_id, plan_name, installment_count, total_amount)
VALUES
(
    'f1000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000001',
    '20-80 Construction Linked Plan',
    4, 9660000
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO payment_installments (id, plan_id, booking_id, installment_number, due_date, amount, paid_amount, payment_status)
VALUES
(
    'a7000000-0000-0000-0000-000000000001',
    'f1000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000001',
    1, '2026-03-15', 1932000, 1932000, 'Completed'
),
(
    'a7000000-0000-0000-0000-000000000002',
    'f1000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000001',
    2, '2026-06-15', 1932000, 0, 'Pending'
),
(
    'a7000000-0000-0000-0000-000000000003',
    'f1000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000001',
    3, '2026-12-15', 3864000, 0, 'Pending'
),
(
    'a7000000-0000-0000-0000-000000000004',
    'f1000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000001',
    4, '2027-06-15', 1932000, 0, 'Pending'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. PAYMENTS
-- ============================================================

INSERT INTO payments (
    id, organization_id, booking_id, installment_id,
    payment_amount, payment_date, payment_mode,
    receipt_number, payment_status, transaction_id, recorded_by
) VALUES
(
    'a8000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'e1000000-0000-0000-0000-000000000001',
    'a7000000-0000-0000-0000-000000000001',
    1932000, '2026-03-15', 'BankTransfer',
    'RCP-2026-001', 'Completed', 'TXN20260315001',
    (SELECT id FROM users WHERE email='arjun.sharma@prestigebuilders.in' LIMIT 1)
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. PERMISSIONS FOR NEW MODULES
-- ============================================================

INSERT INTO permissions (module_name, action, description) VALUES
    ('projects',  'create', 'Create project'),
    ('projects',  'read',   'View projects'),
    ('projects',  'update', 'Update project'),
    ('projects',  'delete', 'Delete project'),
    ('units',     'create', 'Create unit'),
    ('units',     'read',   'View units'),
    ('units',     'update', 'Update unit'),
    ('units',     'delete', 'Delete unit'),
    ('bookings',  'create', 'Create booking'),
    ('bookings',  'read',   'View bookings'),
    ('bookings',  'update', 'Update booking'),
    ('bookings',  'delete', 'Delete booking'),
    ('payments',  'create', 'Record payment'),
    ('payments',  'read',   'View payments'),
    ('payments',  'update', 'Update payment'),
    ('payments',  'delete', 'Delete payment')
ON CONFLICT (module_name, action) DO NOTHING;

-- Grant all new permissions to Super Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'Super Admin'
  AND p.module_name IN ('projects','units','bookings','payments')
ON CONFLICT DO NOTHING;

-- Grant read/create/update to Sales roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name IN ('Sales Executive', 'Sales Manager')
  AND p.module_name IN ('projects','units','bookings','payments')
  AND p.action IN ('read','create','update')
ON CONFLICT DO NOTHING;

COMMIT;
