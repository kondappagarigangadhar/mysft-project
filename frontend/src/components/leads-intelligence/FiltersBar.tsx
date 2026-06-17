'use client';

import React from 'react';
import type { LeadSource } from '@/lib/leadsIntelligenceStore';
import type { LeadsIntelDatePreset } from '@/lib/leadsIntelligenceDecisionHelpers';
import { cn } from '@/lib/utils';
import { CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';

const selectClass = cn(
    'h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 sm:flex-none sm:min-w-[140px]',
    CTA_INPUT_FOCUS,
);

export type FiltersBarProps = {
    datePreset: LeadsIntelDatePreset;
    onDatePresetChange: (preset: Exclude<LeadsIntelDatePreset, 'custom'>) => void;
    projectFilter: string;
    projectOptions: string[];
    onProjectChange: (value: string) => void;
    sourceFilter: 'All' | LeadSource;
    onSourceChange: (value: 'All' | LeadSource) => void;
    assignedFilter: string;
    assigneeOptions: string[];
    onAssignedChange: (value: string) => void;
    className?: string;
};

export function FiltersBar({
    datePreset,
    onDatePresetChange,
    projectFilter,
    projectOptions,
    onProjectChange,
    sourceFilter,
    onSourceChange,
    assignedFilter,
    assigneeOptions,
    onAssignedChange,
    className,
}: FiltersBarProps) {
    const presetBtn = (preset: Exclude<LeadsIntelDatePreset, 'custom'>, label: string) => (
        <button
            key={preset}
            type="button"
            onClick={() => onDatePresetChange(preset)}
            className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                datePreset === preset
                    ? 'bg-white text-[var(--cta-button-bg)] shadow-sm ring-1 ring-slate-200/80'
                    : 'text-slate-600 hover:bg-white/70 hover:text-slate-900',
            )}
        >
            {label}
        </button>
    );

    return (
        <div
            className={cn(
                'sticky top-0 z-20 rounded-2xl border border-slate-200/90 bg-slate-100/95 px-3 py-3 shadow-sm backdrop-blur-sm sm:px-4',
                className,
            )}
        >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</span>
                    <div className="flex flex-wrap gap-1 rounded-xl bg-slate-200/60 p-1">
                        {presetBtn('today', 'Today')}
                        {presetBtn('week', 'This Week')}
                        {presetBtn('month', 'This Month')}
                        {presetBtn('all', 'All')}
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col flex-wrap gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <label className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-[200px]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Project</span>
                        <select className={selectClass} value={projectFilter} onChange={(e) => onProjectChange(e.target.value)}>
                            <option value="All">All projects</option>
                            {projectOptions.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-[180px]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lead source</span>
                        <select
                            className={selectClass}
                            value={sourceFilter}
                            onChange={(e) => onSourceChange(e.target.value as 'All' | LeadSource)}
                        >
                            <option value="All">All sources</option>
                            <option value="Website">Website</option>
                            <option value="Referral">Referral</option>
                            <option value="Campaign">Campaign</option>
                            <option value="Ads">Ads</option>
                        </select>
                    </label>
                    <label className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-[200px]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Salesperson</span>
                        <select className={selectClass} value={assignedFilter} onChange={(e) => onAssignedChange(e.target.value)}>
                            <option value="All">All</option>
                            {assigneeOptions.map((a) => (
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
