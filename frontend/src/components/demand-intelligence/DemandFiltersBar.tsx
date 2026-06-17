'use client';

import React from 'react';
import type { DemandIntelDatePreset, DemandIntelFilters } from '@/lib/demandIntelligenceHelpers';
import { cn } from '@/lib/utils';
import { CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';

const selectClass = cn(
    'h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 sm:flex-none sm:min-w-[130px]',
    CTA_INPUT_FOCUS,
);

export function DemandFiltersBar({
    filters,
    projectOptions,
    locationOptions,
    inventoryTypeOptions,
    unitTypeOptions,
    onChange,
}: {
    filters: DemandIntelFilters;
    projectOptions: string[];
    locationOptions: string[];
    inventoryTypeOptions: string[];
    unitTypeOptions: string[];
    onChange: (patch: Partial<DemandIntelFilters>) => void;
}) {
    const presetBtn = (preset: DemandIntelDatePreset, label: string) => (
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

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Project</span>
                        <select
                            className={selectClass}
                            value={filters.projectFilter}
                            onChange={(e) => onChange({ projectFilter: e.target.value })}
                        >
                            <option value="All">All projects</option>
                            {projectOptions.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Inventory type</span>
                        <select
                            className={selectClass}
                            value={filters.inventoryTypeFilter}
                            onChange={(e) => onChange({ inventoryTypeFilter: e.target.value })}
                        >
                            <option value="All">All types</option>
                            {inventoryTypeOptions.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location</span>
                        <select
                            className={selectClass}
                            value={filters.locationFilter}
                            onChange={(e) => onChange({ locationFilter: e.target.value })}
                        >
                            <option value="All">All locations</option>
                            {locationOptions.map((l) => (
                                <option key={l} value={l}>
                                    {l}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Unit type</span>
                        <select
                            className={selectClass}
                            value={filters.unitTypeFilter}
                            onChange={(e) => onChange({ unitTypeFilter: e.target.value })}
                        >
                            <option value="All">All unit types</option>
                            {unitTypeOptions.map((u) => (
                                <option key={u} value={u}>
                                    {u}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1 sm:col-span-2 xl:col-span-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Demand score {filters.demandMin}–{filters.demandMax}
                        </span>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={filters.demandMin}
                                onChange={(e) =>
                                    onChange({
                                        demandMin: Math.min(Number(e.target.value), filters.demandMax - 5),
                                    })
                                }
                                className="h-2 flex-1 accent-violet-600"
                                aria-label="Minimum demand score"
                            />
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={filters.demandMax}
                                onChange={(e) =>
                                    onChange({
                                        demandMax: Math.max(Number(e.target.value), filters.demandMin + 5),
                                    })
                                }
                                className="h-2 flex-1 accent-violet-600"
                                aria-label="Maximum demand score"
                            />
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
}
