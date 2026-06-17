import type {
    InvoiceIntelRecord,
    InvoiceIntelRiskLevel,
    InvoiceIntelStatus,
} from './invoiceIntelligenceStore';

export type InvoiceIntelDatePreset = 'today' | 'week' | 'month' | 'all';

export type InvoiceIntelFilters = {
    datePreset: InvoiceIntelDatePreset;
    vendorFilter: string;
    statusFilter: 'All' | InvoiceIntelStatus;
    riskLevelFilter: 'All' | InvoiceIntelRiskLevel;
};

export function defaultInvoiceIntelFilters(): InvoiceIntelFilters {
    return {
        datePreset: 'month',
        vendorFilter: 'All',
        statusFilter: 'All',
        riskLevelFilter: 'All',
    };
}

export function invoiceStatusClass(status: InvoiceIntelStatus): string {
    if (status === 'Approved') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (status === 'Paid') return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    if (status === 'Rejected') return 'bg-rose-50 text-rose-800 border-rose-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
}

export function validationStatusClass(status: string): string {
    if (status === 'Validated') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (status === 'Duplicate Suspect' || status === 'Fraud Alert') return 'bg-rose-50 text-rose-800 border-rose-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
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

export function formatInr(amount: number): string {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
    return `₹${amount.toLocaleString('en-IN')}`;
}

export function filterInvoices(
    invoices: InvoiceIntelRecord[],
    filters: InvoiceIntelFilters,
): InvoiceIntelRecord[] {
    return invoices.filter((inv) => {
        if (filters.vendorFilter !== 'All' && inv.vendor !== filters.vendorFilter) return false;
        if (filters.statusFilter !== 'All' && inv.status !== filters.statusFilter) return false;
        if (filters.riskLevelFilter !== 'All' && inv.riskLevel !== filters.riskLevelFilter) return false;
        return true;
    });
}
