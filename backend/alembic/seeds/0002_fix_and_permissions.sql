-- ============================================================
-- ARRIS Seed Patch — Run after 0001_seed.sql
-- Fixes password hashes + adds RBAC permissions for built modules
-- Password for all users: Password@123
-- ============================================================

BEGIN;

-- ============================================================
-- 1. FIX PASSWORD HASHES (real bcrypt of "Password@123")
-- ============================================================

UPDATE users SET password_hash = '$2b$12$wRtx8jYoecfapbaRFXI9buWNx1X4gKiPbjA.7TXzQb0D5Q2aAmyHi'
WHERE email IN (
    'arjun.sharma@prestigebuilders.in',
    'priya.nair@prestigebuilders.in',
    'amit.desai@godrejproperties.com',
    'suresh.babu@sunrisehousing.in',
    'test@arris.dev'
);

-- ============================================================
-- 2. PERMISSIONS FOR BUILT API MODULES
--    (module_name must match what require_permission() checks)
-- ============================================================

INSERT INTO permissions (module_name, action, description) VALUES
    ('leads',   'create', 'Create new lead'),
    ('leads',   'read',   'View leads'),
    ('leads',   'update', 'Update lead'),
    ('leads',   'delete', 'Delete lead'),
    ('users',   'create', 'Create user'),
    ('users',   'read',   'View users'),
    ('users',   'update', 'Update user'),
    ('users',   'delete', 'Deactivate user'),
    ('roles',   'create', 'Create role'),
    ('roles',   'read',   'View roles'),
    ('roles',   'update', 'Update role'),
    ('roles',   'delete', 'Delete role'),
    ('tenants', 'create', 'Create organization'),
    ('tenants', 'read',   'View organizations'),
    ('tenants', 'update', 'Update organization'),
    ('tenants', 'delete', 'Delete organization')
ON CONFLICT (module_name, action) DO NOTHING;

-- ============================================================
-- 3. GRANT ALL PERMISSIONS TO SUPER ADMIN ROLES
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name = 'Super Admin'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. GRANT LEADS READ/CREATE/UPDATE TO SALES ROLES
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_name IN ('Sales Executive', 'Sales Manager')
  AND p.module_name = 'leads'
  AND p.action IN ('create', 'read', 'update')
ON CONFLICT DO NOTHING;

COMMIT;
