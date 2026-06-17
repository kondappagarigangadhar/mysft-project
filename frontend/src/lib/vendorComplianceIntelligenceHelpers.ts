import type {
    VendorCategory,
    VendorComplianceRecord,
    VendorComplianceRiskLevel,
    VendorComplianceStatus,
} from './vendorComplianceIntelligenceStore';

export type VendorComplianceIntelDatePreset = 'today' | 'week' | 'month' | 'all';

export type VendorComplianceIntelFilters = {
    datePreset: VendorComplianceIntelDatePreset;
    categoryFilter: 'All' | VendorCategory;
    complianceStatusFilter: 'All' | VendorComplianceStatus;
    riskLevelFilter: 'All' | VendorComplianceRiskLevel;
};

export function defaultVendorComplianceIntelFilters(): VendorComplianceIntelFilters {
    return {
        datePreset: 'month',
        categoryFilter: 'All',
        complianceStatusFilter: 'All',
        riskLevelFilter: 'All',
    };
}

export function complianceStatusClass(status: VendorComplianceStatus): string {
    if (status === 'Compliant') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (status === 'Non-Compliant') return 'bg-rose-50 text-rose-800 border-rose-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
}

export function kycStatusClass(status: string): string {
    if (status === 'Verified') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (status === 'Expired' || status === 'Missing') return 'bg-rose-50 text-rose-800 border-rose-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
}

export function docStatusClass(status: string): string {
    if (status === 'Verified') return 'text-emerald-700';
    if (status === 'Expired' || status === 'Missing') return 'text-rose-700';
    return 'text-amber-700';
}

export function riskLevelClass(risk: VendorComplianceRiskLevel): string {
    if (risk === 'High') return 'bg-rose-50 text-rose-800 border-rose-200';
    if (risk === 'Medium') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
}

export function riskScoreTone(score: number): string {
    if (score >= 70) return 'text-rose-700 bg-rose-50 border-rose-200';
    if (score >= 45) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
}

export function riskScoreLabel(score: number): string {
    if (score >= 70) return 'High Risk';
    if (score >= 45) return 'Medium Risk';
    return 'Low Risk';
}

export function priorityClass(priority: string): string {
    if (priority === 'Critical') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (priority === 'High') return 'bg-amber-100 text-amber-800 border-amber-200';
    if (priority === 'Medium') return 'bg-violet-100 text-violet-800 border-violet-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
}

export function impactClass(impact: string): string {
    if (impact === 'High') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    if (impact === 'Medium') return 'border-amber-200 bg-amber-50 text-amber-800';
    return 'border-slate-200 bg-slate-50 text-slate-700';
}

export function filterVendors(
    vendors: VendorComplianceRecord[],
    filters: VendorComplianceIntelFilters,
): VendorComplianceRecord[] {
    return vendors.filter((v) => {
        if (filters.categoryFilter !== 'All' && v.category !== filters.categoryFilter) return false;
        if (filters.complianceStatusFilter !== 'All' && v.complianceStatus !== filters.complianceStatusFilter) return false;
        if (filters.riskLevelFilter !== 'All' && v.riskLevel !== filters.riskLevelFilter) return false;
        return true;
    });
}
