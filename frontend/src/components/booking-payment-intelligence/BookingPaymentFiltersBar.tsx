'use client';

import React from 'react';
import type { BookingIntelFilters } from '@/lib/bookingPaymentIntelligenceHelpers';
import {
    BP_INTEL_ASSIGNEE_OPTIONS,
    BP_INTEL_BOOKING_STATUS_OPTIONS,
    BP_INTEL_PAYMENT_STATUS_OPTIONS,
    BP_INTEL_PROJECT_OPTIONS,
    type BookingPaymentStatusFilter,
} from '@/lib/bookingPaymentIntelligenceStore';
import type { BookingIntelDatePreset } from '@/lib/bookingPaymentIntelligenceHelpers';
import { cn } from '@/lib/utils';
import { CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';

const selectClass = cn(
    'h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 sm:flex-none sm:min-w-[130px]',
    CTA_INPUT_FOCUS,
);

export function BookingPaymentFiltersBar({
    filters,
    onChange,
}: {
    filters: BookingIntelFilters;
    onChange: (patch: Partial<BookingIntelFilters>) => void;
}) {
    const presetBtn = (preset: BookingIntelDatePreset, label: string) => (
        <button
            key={preset}
            type="button"
            onClick={() => onChange({ datePreset: preset })}
            className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                filters.datePreset === preset
                    ? 'bg-white text-[var(--cta-button-bg)] shadow-sm ring-1 ring-slate-200/80'
                    : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
            )}
        >
            {label}
        </button>
    );

    return (
        <div className="sticky top-0 z-20 rounded-2xl border border-slate-200/90 bg-slate-100/95 px-3 py-3 shadow-sm backdrop-blur-sm sm:px-4">
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</span>
                    <div className="flex flex-wrap gap-1 rounded-xl bg-slate-200/60 p-1">
                        {presetBtn('today', 'Today')}
                        {presetBtn('week', 'This Week')}
                        {presetBtn('month', 'This Month')}
                        {presetBtn('all', 'All')}
                    </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Project</span>
                        <select
                            className={selectClass}
                            value={filters.projectFilter}
                            onChange={(e) => onChange({ projectFilter: e.target.value })}
                        >
                            <option value="All">All projects</option>
                            {BP_INTEL_PROJECT_OPTIONS.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Booking status</span>
                        <select
                            className={selectClass}
                            value={filters.bookingStatusFilter}
                            onChange={(e) => onChange({ bookingStatusFilter: e.target.value })}
                        >
                            <option value="All">All statuses</option>
                            {BP_INTEL_BOOKING_STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Payment status</span>
                        <select
                            className={selectClass}
                            value={filters.paymentStatusFilter}
                            onChange={(e) => onChange({ paymentStatusFilter: e.target.value as BookingPaymentStatusFilter })}
                        >
                            {BP_INTEL_PAYMENT_STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                    {s === 'All' ? 'All payments' : s}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Salesperson</span>
                        <select
                            className={selectClass}
                            value={filters.assignedFilter}
                            onChange={(e) => onChange({ assignedFilter: e.target.value })}
                        >
                            <option value="All">All assignees</option>
                            {BP_INTEL_ASSIGNEE_OPTIONS.map((a) => (
                                <option key={a} value={a}>
                                    {a}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>
        </div>
    );
}
