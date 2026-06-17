'use client';

import Link from 'next/link';
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { BookingRowActionsMenu } from '@/components/booking-payment/BookingRowActionsMenu';
import { BpStatusBadge, statusToTone } from '@/components/booking-payment/BpStatusBadge';
import type { DataTableSortState } from '@/components/data-table/types';
import type { BookingRecord } from '@/lib/bookingPaymentMockStore';
import { formatShortDate } from '@/lib/formatDate';
import { cn } from '@/lib/utils';
import { CTA_CHECKBOX_SM, CTA_FLOW_LINK_SEMIBOLD, CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';
import { LuArrowRight, LuBuilding2, LuCalendar, LuPlus, LuUser } from 'react-icons/lu';

export type PaymentsBookingGridRow = BookingRecord & { paidCompleted: number; total: number; outstanding: number };

/** Mirrors `PaymentsBookingListBookingAdminActions` (defined separately to avoid circular imports). */
export type PaymentsBookingsGridBookingAdminActions = {
    onView: (slug: string) => void;
    onEdit: (slug: string) => void;
    onDelete: (slug: string) => void;
};

type SortOption = { value: string; label: string };

const GRID_SORT_OPTIONS_PAYMENTS: SortOption[] = [
    { value: 'customer|asc', label: 'Customer (A–Z)' },
    { value: 'customer|desc', label: 'Customer (Z–A)' },
    { value: 'booked|desc', label: 'Booking date (newest)' },
    { value: 'booked|asc', label: 'Booking date (oldest)' },
    { value: 'total|desc', label: 'Total amount (high)' },
    { value: 'total|asc', label: 'Total amount (low)' },
    { value: 'paid|desc', label: 'Paid (high)' },
    { value: 'outstanding|desc', label: 'Outstanding (high)' },
    { value: 'status|asc', label: 'Status (A–Z)' },
    { value: 'status|desc', label: 'Status (Z–A)' },
];

const BOOKING_VIEW_PATH = '/company-admin/booking-payment/booking/view';

const GRID_SORT_OPTIONS_HUB: SortOption[] = [
    { value: 'customer|asc', label: 'Customer (A–Z)' },
    { value: 'customer|desc', label: 'Customer (Z–A)' },
    { value: 'booked|desc', label: 'Booking date (newest)' },
    { value: 'booked|asc', label: 'Booking date (oldest)' },
    { value: 'lead_id|asc', label: 'Lead ID (A–Z)' },
    { value: 'lead_id|desc', label: 'Lead ID (Z–A)' },
    { value: 'assigned_to|asc', label: 'Assigned to (A–Z)' },
    { value: 'assigned_to|desc', label: 'Assigned to (Z–A)' },
    { value: 'project_name|asc', label: 'Project (A–Z)' },
    { value: 'project_name|desc', label: 'Project (Z–A)' },
    { value: 'total|desc', label: 'Total amount (high)' },
    { value: 'total|asc', label: 'Total amount (low)' },
    { value: 'status|asc', label: 'Status (A–Z)' },
    { value: 'status|desc', label: 'Status (Z–A)' },
];

export function PaymentsBookingsGridView({
    rows,
    selectedIds,
    onSelectedIdsChange,
    sort,
    onSortChange,
    goToBooking,
    goToAddPayment,
    columnLayout = 'payments',
    exportVariant = 'payments',
    bookingAdminActions,
}: {
    rows: PaymentsBookingGridRow[];
    selectedIds: Set<string>;
    onSelectedIdsChange: (next: Set<string>) => void;
    sort: DataTableSortState;
    onSortChange: (next: DataTableSortState) => void;
    goToBooking: (slug: string) => void;
    goToAddPayment: (slug: string) => void;
    columnLayout?: 'payments' | 'bookingHub';
    /** On the Payments hub, payment actions stay on the card buttons — omit from the overflow menu. */
    exportVariant?: 'payments' | 'bookings';
    bookingAdminActions?: PaymentsBookingsGridBookingAdminActions;
}) {
    const sortOptions = useMemo(
        () => (columnLayout === 'bookingHub' ? GRID_SORT_OPTIONS_HUB : GRID_SORT_OPTIONS_PAYMENTS),
        [columnLayout],
    );

    const sortValue = useMemo(() => {
        const v = `${sort.columnId ?? 'customer'}|${sort.direction}`;
        return sortOptions.some((o) => o.value === v) ? v : 'customer|asc';
    }, [sort.columnId, sort.direction, sortOptions]);

    const onSortSelect = (raw: string) => {
        const [columnId, direction] = raw.split('|') as [string, 'asc' | 'desc'];
        onSortChange({ columnId, direction });
    };

    const toggleRow = (slug: string, selectable: boolean) => {
        if (!selectable) return;
        const next = new Set(selectedIds);
        if (next.has(slug)) next.delete(slug);
        else next.add(slug);
        onSelectedIdsChange(next);
    };

    const sortSelectId = columnLayout === 'bookingHub' ? 'booking-hub-grid-sort' : 'payments-grid-sort';

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="text-sm font-medium text-slate-600 shrink-0" htmlFor={sortSelectId}>
                    Sort cards by
                </label>
                <select
                    id={sortSelectId}
                    value={sortValue}
                    onChange={(e) => onSortSelect(e.target.value)}
                    className={cn(
                        'h-11 w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm sm:ml-auto',
                        CTA_INPUT_FOCUS,
                    )}
                >
                    {sortOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </div>

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 list-none p-0 m-0">
                {rows.map((row) => {
                    const checked = selectedIds.has(row.slug);
                    return (
                        <li
                            key={row.slug}
                            className={cn(
                                'flex flex-col rounded-2xl border bg-white p-4 shadow-sm ring-1 transition-shadow hover:shadow-md',
                                checked ? 'border-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]' : 'border-slate-200/90 ring-slate-900/5',
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    className={cn('mt-1', CTA_CHECKBOX_SM)}
                                    checked={checked}
                                    onChange={() => toggleRow(row.slug, true)}
                                    aria-label={`Select ${row.customerName}`}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 gap-y-1">
                                        <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">{row.customerName}</h3>
                                        <BpStatusBadge tone={statusToTone(row.status)}>{row.status}</BpStatusBadge>
                                    </div>
                                    <p className="mt-1 truncate font-mono text-[11px]" title={row.slug}>
                                        <Link
                                            href={`${BOOKING_VIEW_PATH}/${encodeURIComponent(row.slug)}`}
                                            className={cn('font-mono', CTA_FLOW_LINK_SEMIBOLD)}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {row.slug}
                                        </Link>
                                    </p>
                                </div>
                            </div>

                            {columnLayout === 'bookingHub' ? (
                                <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50/80 px-3 py-2.5 text-xs ring-1 ring-slate-100">
                                    <div className="min-w-0">
                                        <p className="font-semibold uppercase tracking-wide text-slate-400">Lead ID</p>
                                        <p className="mt-0.5 font-mono text-slate-800 truncate" title={row.leadId}>
                                            {row.leadId}
                                        </p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold uppercase tracking-wide text-slate-400">Assigned to</p>
                                        <p className="mt-0.5 flex items-center gap-1 text-slate-800 truncate" title={row.assignedTo}>
                                            <LuUser size={12} className="shrink-0 text-slate-400" aria-hidden />
                                            <span className="truncate">{row.assignedTo}</span>
                                        </p>
                                    </div>
                                </div>
                            ) : null}

                            <div className="mt-3 flex items-start gap-2 text-sm text-slate-600">
                                <LuBuilding2 size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden />
                                <div className="min-w-0">
                                    <p className="font-medium text-slate-800">{row.projectName}</p>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">Unit {row.unitId}</p>
                                    {row.unitConfiguration?.trim() ? (
                                        <p className="text-xs text-slate-600 mt-0.5">{row.unitConfiguration}</p>
                                    ) : null}
                                </div>
                            </div>

                            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                                <LuCalendar size={12} className="shrink-0 opacity-70" aria-hidden />
                                Booked {formatShortDate(row.bookingDate)}
                            </p>

                            <div
                                className={cn(
                                    'mt-4 rounded-xl bg-slate-50/90 p-3 ring-1 ring-slate-100',
                                    columnLayout === 'bookingHub' ? '' : 'grid grid-cols-3 gap-2',
                                )}
                            >
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total</p>
                                    <p className="mt-0.5 text-xs font-bold tabular-nums text-slate-900">
                                        ₹{row.total.toLocaleString('en-IN')}
                                    </p>
                                </div>
                                {columnLayout === 'payments' ? (
                                    <>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Paid</p>
                                            <p className="mt-0.5 text-xs font-bold tabular-nums text-emerald-800">
                                                ₹{row.paidCompleted.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Due</p>
                                            <p className="mt-0.5 text-xs font-bold tabular-nums text-orange-800">
                                                ₹{row.outstanding.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                    </>
                                ) : null}
                            </div>

                            <div className="mt-auto flex w-full flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                                <Button
                                    type="button"
                                    variant="company"
                                    size="sm"
                                    className="inline-flex gap-1.5 font-semibold shadow-sm"
                                    onClick={() => goToBooking(row.slug)}
                                >
                                    <LuArrowRight size={14} aria-hidden />
                                    Open ledger
                                </Button>
                                <Button
                                    type="button"
                                    variant="companyOutline"
                                    size="sm"
                                    className="inline-flex gap-1.5 font-semibold border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                                    onClick={() => goToAddPayment(row.slug)}
                                >
                                    <LuPlus size={14} aria-hidden />
                                    Add payment
                                </Button>
                                {exportVariant === 'bookings' || bookingAdminActions ? (
                                    <div className="ml-auto">
                                        <BookingRowActionsMenu
                                            slug={row.slug}
                                            paymentActions={
                                                exportVariant === 'bookings'
                                                    ? {
                                                          onAddPayment: goToAddPayment,
                                                          onOpenLedger: goToBooking,
                                                      }
                                                    : undefined
                                            }
                                            bookingActions={
                                                bookingAdminActions
                                                    ? {
                                                          onView: bookingAdminActions.onView,
                                                          onEdit: bookingAdminActions.onEdit,
                                                          onDelete: bookingAdminActions.onDelete,
                                                      }
                                                    : undefined
                                            }
                                        />
                                    </div>
                                ) : null}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
