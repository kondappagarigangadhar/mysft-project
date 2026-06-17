'use client';

import { supplierComplianceDateExpired, supplierComplianceDaysUntil } from '@/lib/suppliers/supplierComplianceUtils';
import { cn } from '@/lib/utils';
import type { SupplierComplianceRow, SupplierStatus } from '@/lib/suppliers/types';

export function SupplierStatusBadge({ status }: { status: SupplierStatus }) {
    const tone =
        status === 'Active'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : status === 'Inactive'
              ? 'bg-slate-100 text-slate-700 border-slate-200'
              : status === 'Suspended'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-800 border-amber-200';
    return <span className={cn('rounded-full border px-2.5 py-1 text-xs font-semibold', tone)}>{status}</span>;
}

export function SupplierRatingBadge({ rating }: { rating: number }) {
    const tone =
        rating >= 4.2 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : rating >= 3.4 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-800 border-rose-200';
    return (
        <span className={cn('inline-flex rounded-md border px-2 py-1 text-xs font-semibold', tone)}>{rating.toFixed(1)}</span>
    );
}

export function SupplierComplianceDocBadge({
    status,
    expiryDate,
}: {
    status: SupplierComplianceRow['verificationStatus'];
    /** When the calendar date is past, shows Expired regardless of workflow status. */
    expiryDate?: string;
}) {
    const dateExpired = expiryDate ? supplierComplianceDateExpired(expiryDate) : false;
    const label = dateExpired ? 'Expired' : status;
    const tone =
        label === 'Verified'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : label === 'Pending'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : label === 'Rejected'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : label === 'Expired'
                  ? 'bg-orange-50 text-orange-800 border-orange-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200';
    return <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', tone)}>{label}</span>;
}

/** Shows when a dated document is expiring within the next N days (and not yet expired). */
export function SupplierComplianceExpiryHint({ expiryDate, withinDays = 30 }: { expiryDate: string; withinDays?: number }) {
    const du = supplierComplianceDaysUntil(expiryDate);
    if (du === null || du < 0) return null;
    if (du > withinDays) return null;
    const tone = du <= 7 ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-700';
    return (
        <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', tone)}>
            {du === 0 ? 'Expires today' : `Expires in ${du}d`}
        </span>
    );
}
