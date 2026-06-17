/**
 * RBAC for Company Admin — Documents & Compliance (demo role via localStorage).
 * Production: replace with server session + policy middleware.
 */

export type ComplianceDemoRole = 'super_admin' | 'company_admin' | 'staff' | 'viewer';

export const COMPLIANCE_ROLE_STORAGE_KEY = 'arris-compliance-demo-role';

export const COMPLIANCE_ROLE_LABELS: Record<ComplianceDemoRole, string> = {
    super_admin: 'Super Admin',
    company_admin: 'Company Admin',
    staff: 'Staff / User',
    viewer: 'Viewer',
};

export function canUpload(role: ComplianceDemoRole): boolean {
    return role !== 'viewer';
}

export function canEdit(role: ComplianceDemoRole): boolean {
    return role === 'super_admin' || role === 'company_admin';
}

export function canDelete(role: ComplianceDemoRole): boolean {
    return role === 'super_admin' || role === 'company_admin';
}

export function canESign(role: ComplianceDemoRole): boolean {
    return role === 'super_admin' || role === 'company_admin';
}

export function canView(role: ComplianceDemoRole): boolean {
    return true;
}

export function canManageAccess(role: ComplianceDemoRole): boolean {
    return role === 'super_admin' || role === 'company_admin';
}
