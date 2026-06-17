import type { ComplianceDemoRole } from '@/lib/complianceRbac';

/** Sales Manager + Admin — per developer security notes. */
export function canViewAISalesIntelligence(role: ComplianceDemoRole): boolean {
    return role === 'super_admin' || role === 'company_admin';
}

export function canRecalculateAISalesIntelligence(role: ComplianceDemoRole): boolean {
    return role === 'super_admin' || role === 'company_admin';
}
