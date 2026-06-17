'use client';

import React from 'react';
import { LuSearch, LuX } from 'react-icons/lu';
import type { LeadTemperature } from '@/lib/aiSalesIntelligenceStore';
import type { AISalesIntelFilters } from '@/hooks/useAiSalesIntelDashboard';
import { CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';

type Props = {
    filters: AISalesIntelFilters;
    projectOptions: string[];
    onChange: (patch: Partial<AISalesIntelFilters>) => void;
};

const TEMP_OPTIONS: ('All' | LeadTemperature)[] = ['All', 'Hot', 'Warm', 'Cold'];

export function AiSalesIntelFiltersBar({ filters, projectOptions, onChange }: Props) {
    const active =
        filters.search.trim() !== '' || filters.temperature !== 'All' || filters.project !== 'All';

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm ring-1 ring-slate-100/80 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative min-w-[200px] flex-1">
                <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                <input
                    type="search"
                    placeholder="Search leads, project, source…"
                    value={filters.search}
                    onChange={(e) => onChange({ search: e.target.value })}
                    className={cn(
                        'w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400',
                        CTA_INPUT_FOCUS,
                    )}
                />
            </div>
            <select
                value={filters.temperature}
                onChange={(e) => onChange({ temperature: e.target.value as AISalesIntelFilters['temperature'] })}
                className={cn('rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800', CTA_INPUT_FOCUS)}
                aria-label="Filter by temperature"
            >
                {TEMP_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                        {t === 'All' ? 'All temperatures' : t}
                    </option>
                ))}
            </select>
            <select
                value={filters.project}
                onChange={(e) => onChange({ project: e.target.value })}
                className={cn('max-w-[220px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800', CTA_INPUT_FOCUS)}
                aria-label="Filter by project"
            >
                {projectOptions.map((p) => (
                    <option key={p} value={p}>
                        {p === 'All' ? 'All projects' : p}
                    </option>
                ))}
            </select>
            {active ? (
                <button
                    type="button"
                    onClick={() => onChange({ search: '', temperature: 'All', project: 'All' })}
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                    <LuX size={14} aria-hidden />
                    Clear
                </button>
            ) : null}
        </div>
    );
}
