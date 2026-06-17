'use client';

import React from 'react';
import type { InvoiceIntelRiskLevel, InvoiceIntelStatus } from '@/lib/invoiceIntelligenceStore';
import { INVOICE_VENDOR_OPTIONS } from '@/lib/invoiceIntelligenceStore';
import type { InvoiceIntelDatePreset, InvoiceIntelFilters } from '@/lib/invoiceIntelligenceHelpers';
import { cn } from '@/lib/utils';
import { CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';

const selectClass = cn(
    'h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 sm:flex-none sm:min-w-[130px]',
    CTA_INPUT_FOCUS,
);

export function InvoiceFiltersBar({
    filters,
    onChange,
}: {
    filters: InvoiceIntelFilters;
    onChange: (patch: Partial<InvoiceIntelFilters>) => void;
}) {
    const presetBtn = (preset: InvoiceIntelDatePreset, label: string) => (
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
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date range</span>
                    <div className="flex flex-wrap gap-1 rounded-xl bg-slate-200/60 p-1">
                        {presetBtn('today', 'Today')}
                        {presetBtn('week', 'This Week')}
                        {presetBtn('month', 'This Month')}
                        {presetBtn('all', 'All')}
                    </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Vendor</span>
                        <select
                            className={selectClass}
                            value={filters.vendorFilter}
                            onChange={(e) => onChange({ vendorFilter: e.target.value })}
                        >
                            <option value="All">All vendors</option>
                            {INVOICE_VENDOR_OPTIONS.map((v) => (
                                <option key={v} value={v}>
                                    {v}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</span>
                        <select
                            className={selectClass}
                            value={filters.statusFilter}
                            onChange={(e) => onChange({ statusFilter: e.target.value as 'All' | InvoiceIntelStatus })}
                        >
                            <option value="All">All</option>
                            <option value="Pending Approval">Pending Approval</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Paid">Paid</option>
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Risk level</span>
                        <select
                            className={selectClass}
                            value={filters.riskLevelFilter}
                            onChange={(e) => onChange({ riskLevelFilter: e.target.value as 'All' | InvoiceIntelRiskLevel })}
                        >
                            <option value="All">All</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </label>
                </div>
            </div>
        </div>
    );
}
