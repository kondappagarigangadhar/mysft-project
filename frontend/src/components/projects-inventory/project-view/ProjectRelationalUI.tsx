'use client';

import React from 'react';
import Link from 'next/link';
import { LuArrowRight, LuSearch, LuExternalLink } from 'react-icons/lu';
import { BpStatusBadge } from '@/components/booking-payment/BpStatusBadge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/utils';
import { CTA_FLOW_LINK, CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';

/**
 * Shared UI primitives for Project 360 relational tabs
 * (Customers / Bookings / Payments / Vendors / Work Orders).
 *
 * Goals:
 *  - Keep enterprise SaaS table layouts consistent across every tab.
 *  - Avoid the heavy `DataTable` framework for these read-mostly views
 *    (the inventory/documents tabs already use lightweight tables).
 *  - Single source of truth for search, summary cards, badges, pagination,
 *    and empty/error states.
 */

/* ---------- Section Header (sticky summary header) ---------- */

export function ProjectTabSection({
    title,
    description,
    actions,
    children,
    className,
}: {
    title?: string;
    description?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={cn('rounded-xl border border-gray-200/80 bg-white shadow-sm', className)}>
            {title || description || actions ? (
                <div className="sticky top-30 z-10 flex flex-col gap-3 rounded-t-xl border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-white/80 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="min-w-0">
                        {title ? <h3 className="truncate text-base font-semibold text-gray-900">{title}</h3> : null}
                        {description ? <p className="mt-0.5 truncate text-sm text-gray-500">{description}</p> : null}
                    </div>
                    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
                </div>
            ) : null}
            <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
        </section>
    );
}

/* ---------- Summary KPI cards ---------- */

export type SummaryCardTone = 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'violet';

const summaryToneClasses: Record<SummaryCardTone, { bg: string; ring: string; text: string; icon: string }> = {
    blue: {
        bg: 'bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)]',
        ring: 'ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]',
        text: 'text-slate-900',
        icon: 'text-[var(--cta-button-bg)]',
    },
    emerald: { bg: 'bg-emerald-50/70', ring: 'ring-emerald-100', text: 'text-emerald-900', icon: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50/70', ring: 'ring-amber-100', text: 'text-amber-900', icon: 'text-amber-600' },
    rose: { bg: 'bg-rose-50/70', ring: 'ring-rose-100', text: 'text-rose-900', icon: 'text-rose-600' },
    slate: { bg: 'bg-slate-50/70', ring: 'ring-slate-200', text: 'text-slate-900', icon: 'text-slate-600' },
    violet: { bg: 'bg-violet-50/70', ring: 'ring-violet-100', text: 'text-violet-900', icon: 'text-violet-600' },
};

export function SummaryCard({
    label,
    value,
    sublabel,
    tone = 'slate',
    icon,
}: {
    label: string;
    value: React.ReactNode;
    sublabel?: React.ReactNode;
    tone?: SummaryCardTone;
    icon?: React.ReactNode;
}) {
    const t = summaryToneClasses[tone];
    return (
        <div
            className={cn(
                'min-w-0 rounded-xl border border-gray-200/80 bg-white p-4 ring-1 ring-transparent shadow-sm transition hover:shadow',
                'flex items-start gap-3',
            )}
        >
            {icon ? (
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', t.bg, 'ring-1', t.ring, t.icon)}>
                    {icon}
                </div>
            ) : null}
            <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
                <p className={cn('mt-1 truncate text-xl font-semibold tabular-nums', t.text)}>{value}</p>
                {sublabel ? <p className="mt-1 truncate text-xs text-gray-500">{sublabel}</p> : null}
            </div>
        </div>
    );
}

export function SummaryCardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
                className,
            )}
        >
            {children}
        </div>
    );
}

/* ---------- Toolbar (search + filter + actions) ---------- */

export function ProjectTabToolbar({
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Search…',
    leftAdornment,
    rightAdornment,
}: {
    searchValue: string;
    onSearchChange: (next: string) => void;
    searchPlaceholder?: string;
    leftAdornment?: React.ReactNode;
    rightAdornment?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-72">
                    <LuSearch
                        className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-gray-400"
                        aria-hidden
                    />
                    <input
                        type="search"
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className={cn(
                            'h-10 w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400',
                            CTA_INPUT_FOCUS,
                        )}
                    />
                </div>
                {leftAdornment}
            </div>
            {rightAdornment ? <div className="flex flex-wrap items-center gap-2">{rightAdornment}</div> : null}
        </div>
    );
}

export function FilterSelect<T extends string>({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: T;
    onChange: (next: T) => void;
    options: Array<{ value: T; label: string }>;
}) {
    return (
        <label className="inline-flex items-center gap-2 text-sm text-gray-600">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as T)}
                className={cn('h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900', CTA_INPUT_FOCUS)}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

/* ---------- Status tone helpers ---------- */

type Tone = React.ComponentProps<typeof BpStatusBadge>['tone'];

export function bookingStatusTone(status: string): Tone {
    if (status === 'Confirmed') return 'success';
    if (status === 'Pending') return 'warning';
    if (status === 'Cancelled') return 'danger';
    return 'neutral';
}

export function workOrderStatusTone(status: string): Tone {
    switch (status) {
        case 'Completed':
        case 'Verified':
            return 'success';
        case 'In Progress':
        case 'Assigned':
            return 'warning';
        case 'On Hold':
        case 'Cancelled':
            return 'danger';
        default:
            return 'neutral';
    }
}

export function vendorStatusTone(status: string): Tone {
    if (status === 'Active') return 'success';
    if (status === 'Pending') return 'warning';
    if (status === 'Inactive') return 'neutral';
    if (status === 'Blacklisted') return 'danger';
    return 'neutral';
}

export function paymentStatusTone(status: string): Tone {
    if (status === 'Completed' || status === 'Paid' || status === 'Success') return 'success';
    if (status === 'Pending' || status === 'Partial') return 'warning';
    if (status === 'Failed' || status === 'Overdue') return 'danger';
    return 'neutral';
}

export function documentStatusTone(label: string): Tone {
    const s = label.toLowerCase();
    if (s.includes('missing')) return 'danger';
    if (s.includes('pending') || s.includes('partial')) return 'warning';
    if (s.includes('complete') || s.includes('signed')) return 'success';
    return 'neutral';
}

/* ---------- Empty state ---------- */

export function EmptyState({
    title,
    description,
    action,
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-slate-50/50 py-12 text-center">
            <p className="text-sm font-semibold text-gray-700">{title}</p>
            {description ? <p className="mt-1 max-w-md text-xs text-gray-500">{description}</p> : null}
            {action ? <div className="mt-4">{action}</div> : null}
        </div>
    );
}

/* ---------- Simple responsive table ---------- */

export type SimpleTableColumn<T> = {
    key: string;
    header: React.ReactNode;
    /** Cell renderer. */
    render: (row: T) => React.ReactNode;
    /** Right-align (numeric). */
    align?: 'left' | 'right';
    /** Make cell hidden below this Tailwind breakpoint. */
    hideBelow?: 'sm' | 'md' | 'lg';
    className?: string;
};

export function SimpleTable<T>({
    columns,
    rows,
    getRowKey,
    onRowClick,
    emptyMessage = 'No records match your filters.',
    minWidthPx = 720,
}: {
    columns: SimpleTableColumn<T>[];
    rows: T[];
    getRowKey: (row: T, idx: number) => string;
    onRowClick?: (row: T) => void;
    emptyMessage?: string;
    minWidthPx?: number;
}) {
    if (rows.length === 0) {
        return (
            <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-slate-50/50 text-sm text-gray-500">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm" style={{ minWidth: `${minWidthPx}px` }}>
                <thead>
                    <tr className="border-b border-gray-200 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {columns.map((c) => (
                            <th
                                key={c.key}
                                className={cn(
                                    'px-4 py-3 whitespace-nowrap',
                                    c.align === 'right' && 'text-right',
                                    c.hideBelow === 'sm' && 'hidden sm:table-cell',
                                    c.hideBelow === 'md' && 'hidden md:table-cell',
                                    c.hideBelow === 'lg' && 'hidden lg:table-cell',
                                    c.className,
                                )}
                            >
                                {c.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => (
                        <tr
                            key={getRowKey(row, idx)}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                            className={cn(
                                'border-b border-gray-100 last:border-0 transition-colors',
                                onRowClick && 'cursor-pointer hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]',
                            )}
                        >
                            {columns.map((c) => (
                                <td
                                    key={c.key}
                                    className={cn(
                                        'px-4 py-3 align-middle text-gray-800',
                                        c.align === 'right' && 'text-right tabular-nums',
                                        c.hideBelow === 'sm' && 'hidden sm:table-cell',
                                        c.hideBelow === 'md' && 'hidden md:table-cell',
                                        c.hideBelow === 'lg' && 'hidden lg:table-cell',
                                        c.className,
                                    )}
                                >
                                    {c.render(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ---------- Pagination wrapper ---------- */

export const PROJECT_TAB_PAGE_SIZE = 10;

export function ProjectTabPagination({
    currentPage,
    totalItems,
    onPageChange,
    pageSize = PROJECT_TAB_PAGE_SIZE,
    label,
}: {
    currentPage: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    pageSize?: number;
    label?: string;
}) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (totalPages <= 1) return null;
    return (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Pagination
                currentPage={Math.min(currentPage, totalPages)}
                totalPages={totalPages}
                onPageChange={onPageChange}
                totalItems={totalItems}
                itemsPerPage={pageSize}
                label={label}
            />
        </div>
    );
}

/* ---------- Helpers used across tabs ---------- */

/** Format INR amount with grouping; falls back to `—` for invalid input. */
export function formatINR(amount: number | null | undefined, fallback = '—'): string {
    if (amount == null || !Number.isFinite(amount)) return fallback;
    try {
        return `₹ ${Math.round(amount).toLocaleString('en-IN')}`;
    } catch {
        return `₹ ${Math.round(amount)}`;
    }
}

/** Format a date string into a readable label (medium date, no time). */
export function formatProjectDate(value: string | null | undefined, fallback = '—'): string {
    if (!value) return fallback;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value.length > 0 ? value : fallback;
    try {
        return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return value;
    }
}

/** Render an external/internal link with an arrow icon. */
export function LinkPill({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-md border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2.5 py-1 text-xs font-medium text-[var(--cta-button-bg)] transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_16%,white)]"
        >
            {children}
            <LuArrowRight size={12} aria-hidden />
        </Link>
    );
}

export function OpenInModuleLink({ href, label = 'Open' }: { href: string; label?: string }) {
    return (
        <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', CTA_FLOW_LINK)}
        >
            {label}
            <LuExternalLink size={12} aria-hidden />
        </Link>
    );
}

/* Re-export shared badge for convenience inside relational tabs. */
export { BpStatusBadge, Button };
