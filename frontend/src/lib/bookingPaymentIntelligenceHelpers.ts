import type {
    BookingIntelRecord,
    BookingPaymentRiskRow,
    BookingPaymentStatusFilter,
} from './bookingPaymentIntelligenceStore';

export type BookingIntelDatePreset = 'today' | 'week' | 'month' | 'all';

export type BookingIntelFilters = {
    datePreset: BookingIntelDatePreset;
    projectFilter: string;
    bookingStatusFilter: string;
    paymentStatusFilter: BookingPaymentStatusFilter;
    assignedFilter: string;
};

export function defaultBookingIntelFilters(): BookingIntelFilters {
    return {
        datePreset: 'all',
        projectFilter: 'All',
        bookingStatusFilter: 'All',
        paymentStatusFilter: 'All',
        assignedFilter: 'All',
    };
}

export function formatBookingAmount(amount: number): string {
    if (amount <= 0) return '₹0';
    if (amount >= 10_000_000) {
        const cr = amount / 10_000_000;
        return `₹${cr >= 10 ? cr.toFixed(1) : cr.toFixed(2).replace(/\.?0+$/, '')} Cr`;
    }
    const lakhs = amount / 100_000;
    if (lakhs >= 1) return `₹${Math.round(lakhs).toLocaleString('en-IN')}L`;
    return `₹${amount.toLocaleString('en-IN')}`;
}

export function collectionScoreTone(score: number): string {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
}

export function paymentRiskClass(risk: 'High' | 'Medium' | 'Low'): string {
    if (risk === 'High') return 'bg-rose-50 text-rose-800 border-rose-200';
    if (risk === 'Medium') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
}

function dateInPreset(isoDate: string, preset: BookingIntelDatePreset): boolean {
    if (preset === 'all') return true;
    const d = new Date(isoDate.slice(0, 10));
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (preset === 'today') return d >= start;
    if (preset === 'week') {
        const weekStart = new Date(start);
        weekStart.setDate(weekStart.getDate() - 7);
        return d >= weekStart;
    }
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return d >= monthStart;
}

export function filterBookingIntelRecords(
    records: BookingIntelRecord[],
    filters: BookingIntelFilters,
): BookingIntelRecord[] {
    return records.filter((r) => {
        if (filters.projectFilter !== 'All' && r.projectName !== filters.projectFilter) return false;
        if (filters.bookingStatusFilter !== 'All' && r.bookingStatus !== filters.bookingStatusFilter) return false;
        if (filters.assignedFilter !== 'All' && r.assignedTo !== filters.assignedFilter) return false;
        if (!dateInPreset(r.bookingDate, filters.datePreset)) return false;
        if (filters.paymentStatusFilter === 'Overdue' && r.daysOverdue <= 0) return false;
        if (filters.paymentStatusFilter === 'On track' && (r.daysOverdue > 0 || r.riskLevel === 'High')) return false;
        if (filters.paymentStatusFilter === 'Pending' && r.bookingStatus !== 'Pending') return false;
        return true;
    });
}

export function filterPaymentRisks(
    rows: BookingPaymentRiskRow[],
    filters: BookingIntelFilters,
): BookingPaymentRiskRow[] {
    return rows.filter((r) => {
        if (filters.projectFilter !== 'All' && r.projectName !== filters.projectFilter) return false;
        if (filters.assignedFilter !== 'All' && r.assignedTo !== filters.assignedFilter) return false;
        return true;
    });
}
