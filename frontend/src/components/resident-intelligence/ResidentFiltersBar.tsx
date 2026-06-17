'use client';

import React from 'react';
import type { ResidentHealthStatusFilter, ResidentIntelFilters } from '@/lib/residentIntelligenceHelpers';
import type { ResidentIntelDatePreset } from '@/lib/residentIntelligenceHelpers';
import {
    RESIDENT_INTEL_HEALTH_OPTIONS,
    RESIDENT_INTEL_PORTAL_OPTIONS,
    RESIDENT_INTEL_PROPERTY_OPTIONS,
    RESIDENT_INTEL_STATUS_OPTIONS,
    RESIDENT_INTEL_TAG_OPTIONS,
} from '@/lib/residentIntelligenceStore';
import { cn } from '@/lib/utils';
import { CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';

const selectClass = cn(
    'h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 sm:flex-none sm:min-w-[130px]',
    CTA_INPUT_FOCUS,
);

export function ResidentFiltersBar({
    filters,
    onChange,
}: {
    filters: ResidentIntelFilters;
    onChange: (patch: Partial<ResidentIntelFilters>) => void;
}) {
    const presetBtn = (preset: ResidentIntelDatePreset, label: string) => (
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
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Move-in date</span>
                    <div className="flex flex-wrap gap-1 rounded-xl bg-slate-200/60 p-1">
                        {presetBtn('today', 'Today')}
                        {presetBtn('week', 'This Week')}
                        {presetBtn('month', 'This Month')}
                        {presetBtn('all', 'All')}
                    </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Property</span>
                        <select
                            className={selectClass}
                            value={filters.propertyFilter}
                            onChange={(e) => onChange({ propertyFilter: e.target.value })}
                        >
                            <option value="All">All properties</option>
                            {RESIDENT_INTEL_PROPERTY_OPTIONS.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Resident status</span>
                        <select
                            className={selectClass}
                            value={filters.residentStatusFilter}
                            onChange={(e) => onChange({ residentStatusFilter: e.target.value })}
                        >
                            <option value="All">All statuses</option>
                            {RESIDENT_INTEL_STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Portal access</span>
                        <select
                            className={selectClass}
                            value={filters.portalFilter}
                            onChange={(e) => onChange({ portalFilter: e.target.value })}
                        >
                            {RESIDENT_INTEL_PORTAL_OPTIONS.map((p) => (
                                <option key={p} value={p}>
                                    {p === 'All' ? 'All portal states' : p}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Community tag</span>
                        <select
                            className={selectClass}
                            value={filters.tagFilter}
                            onChange={(e) => onChange({ tagFilter: e.target.value })}
                        >
                            {RESIDENT_INTEL_TAG_OPTIONS.map((t) => (
                                <option key={t} value={t}>
                                    {t === 'All' ? 'All tags' : t}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Health</span>
                        <select
                            className={selectClass}
                            value={filters.healthFilter}
                            onChange={(e) => onChange({ healthFilter: e.target.value as ResidentHealthStatusFilter })}
                        >
                            {RESIDENT_INTEL_HEALTH_OPTIONS.map((h) => (
                                <option key={h} value={h}>
                                    {h === 'All' ? 'All health' : h}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>
        </div>
    );
}
