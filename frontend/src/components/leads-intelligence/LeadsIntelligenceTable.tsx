'use client';

import React from 'react';
import { LuCalendarPlus, LuPhone, LuTrash2, LuUserPlus } from 'react-icons/lu';
import type { DataTableColumn } from '@/components/data-table/types';
import type { IntelligenceLead, IntelligenceNextAction } from '@/lib/leadsIntelligenceStore';
import { riskClassMap, statusClassMap, temperatureClassMap } from '@/lib/leadsIntelligenceHelpers';
import { cn } from '@/lib/utils';

const nextActionBadge: Record<IntelligenceNextAction, string> = {
    Call: 'border-sky-200 bg-sky-50 text-sky-800',
    Visit: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    Offer: 'border-amber-200 bg-amber-50 text-amber-800',
};

export const LEADS_INTEL_COLUMN_MENU: { id: string; label: string }[] = [
    { id: 'name', label: 'Lead name' },
    { id: 'phone', label: 'Phone' },
    { id: 'email', label: 'Email' },
    { id: 'source', label: 'Source' },
    /** Column 5 in the picker — default off (see `LEADS_INTEL_DEFAULT_ON`). */
    { id: 'lead_score', label: 'Lead score' },
    { id: 'status', label: 'Status' },
    { id: 'assigned', label: 'Assigned' },
    { id: 'temperature', label: 'Temperature' },
    { id: 'conversion', label: 'Conv. %' },
    { id: 'engagement', label: 'Engagement' },
    { id: 'risk', label: 'Risk' },
    { id: 'created', label: 'Created' },
    { id: 'next_action', label: 'Next action' },
    { id: 'best_time', label: 'Best time' },
    { id: 'visit_rec', label: 'Visit' },
    { id: 'quick_actions', label: 'Actions' },
];

/** Default visible data columns; others (incl. 5th picker item `lead_score`) stay off until enabled. */
export const LEADS_INTEL_DEFAULT_ON = new Set<string>([
    'name',
    'status',
    'assigned',
    'conversion',
    'engagement',
    'risk',
    'next_action',
    'best_time',
    'visit_rec',
    'quick_actions',
]);

export type LeadsIntelligenceTableHandlers = {
    removeLead: (lead: IntelligenceLead) => void;
    onQuickCall?: (lead: IntelligenceLead) => void;
    onQuickScheduleVisit?: (lead: IntelligenceLead) => void;
    onQuickAssign?: (lead: IntelligenceLead) => void;
};

export function buildLeadsIntelligenceColumns(handlers: LeadsIntelligenceTableHandlers): DataTableColumn<IntelligenceLead>[] {
    const { removeLead, onQuickCall, onQuickScheduleVisit, onQuickAssign } = handlers;

    return [
        {
            id: 'name',
            header: 'Lead name',
            sticky: true,
            sortable: true,
            sortValue: (row) => row.name.toLowerCase(),
            minWidth: 160,
            render: (row) => <span className="font-semibold text-slate-900">{row.name}</span>,
        },
        {
            id: 'phone',
            header: 'Phone',
            sortable: true,
            sortValue: (row) => row.phone.replace(/\D/g, ''),
            minWidth: 110,
            render: (row) => (
                <a href={`tel:${row.phone.replace(/\D/g, '')}`} className="tabular-nums text-sm text-slate-700 hover:text-primary hover:underline">
                    {row.phone}
                </a>
            ),
        },
        {
            id: 'email',
            header: 'Email',
            sortable: true,
            sortValue: (row) => row.email.toLowerCase(),
            minWidth: 180,
            render: (row) => (
                <a href={`mailto:${row.email}`} className="block max-w-[220px] truncate text-sm text-slate-600 hover:text-primary" title={row.email}>
                    {row.email}
                </a>
            ),
        },
        {
            id: 'source',
            header: 'Source',
            sortable: true,
            sortValue: (row) => row.source,
            minWidth: 100,
            render: (row) => <span className="text-sm text-slate-800">{row.source}</span>,
        },
        {
            id: 'lead_score',
            header: 'Lead score',
            sortable: true,
            sortValue: (row) => row.leadScore,
            minWidth: 120,
            render: (row) => (
                <div className="flex max-w-[200px] items-center gap-2">
                    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-[#116AEF] transition-all" style={{ width: `${Math.min(100, row.leadScore)}%` }} />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs font-bold tabular-nums text-slate-800">{row.leadScore}</span>
                </div>
            ),
        },
        {
            id: 'status',
            header: 'Status',
            sortable: true,
            sortValue: (row) => row.status,
            minWidth: 110,
            render: (row) => (
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold leading-none ${statusClassMap[row.status]}`}>{row.status}</span>
            ),
        },
        {
            id: 'assigned',
            header: 'Assigned',
            sortable: true,
            sortValue: (row) => row.assignedTo.toLowerCase(),
            minWidth: 120,
            render: (row) => <span className="text-sm text-slate-800">{row.assignedTo}</span>,
        },
        {
            id: 'temperature',
            header: 'Temperature',
            sortable: true,
            sortValue: (row) => row.temperature,
            minWidth: 110,
            render: (row) => (
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold leading-none ${temperatureClassMap[row.temperature]}`}>
                    {row.temperature}
                </span>
            ),
        },
        {
            id: 'conversion',
            header: 'Conv. %',
            sortable: true,
            sortValue: (row) => row.conversionProbability,
            minWidth: 90,
            render: (row) => <span className="tabular-nums text-sm font-semibold text-slate-800">{row.conversionProbability}%</span>,
        },
        {
            id: 'engagement',
            header: 'Engagement',
            sortable: true,
            sortValue: (row) => row.engagementScore,
            minWidth: 100,
            render: (row) => <span className="tabular-nums text-sm text-slate-800">{row.engagementScore}</span>,
        },
        {
            id: 'risk',
            header: 'Risk',
            sortable: true,
            sortValue: (row) => row.followUpRisk,
            minWidth: 100,
            render: (row) => (
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold leading-none ${riskClassMap[row.followUpRisk]}`}>
                    {row.followUpRisk}
                </span>
            ),
        },
        {
            id: 'created',
            header: 'Created',
            sortable: true,
            sortValue: (row) => row.createdAt,
            minWidth: 110,
            render: (row) => <span className="tabular-nums text-sm text-slate-700">{row.createdAt}</span>,
        },
        {
            id: 'next_action',
            header: 'Next action',
            sortable: true,
            sortValue: (row) => {
                const order: Record<IntelligenceNextAction, number> = { Call: 0, Visit: 1, Offer: 2 };
                return order[row.nextAction];
            },
            minWidth: 100,
            render: (row) => (
                <span
                    className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide',
                        nextActionBadge[row.nextAction],
                    )}
                >
                    {row.nextAction}
                </span>
            ),
        },
        {
            id: 'best_time',
            header: 'Best time',
            sortable: true,
            sortValue: (row) => row.bestCallTimeLabel.toLowerCase(),
            minWidth: 130,
            render: (row) => <span className="text-sm text-slate-700">{row.bestCallTimeLabel}</span>,
        },
        {
            id: 'visit_rec',
            header: 'Visit',
            sortable: true,
            sortValue: (row) => (row.visitRecommendation ? 1 : 0),
            minWidth: 120,
            render: (row) =>
                row.visitRecommendation ? (
                    <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide text-violet-800">
                        Recommended
                    </span>
                ) : (
                    <span className="text-sm text-slate-400">—</span>
                ),
        },
        {
            id: 'quick_actions',
            header: '',
            sortable: false,
            stickyEnd: true,
            minWidth: 176,
            cellClassName: 'text-right',
            render: (row) => (
                <div className="flex flex-nowrap items-center justify-end gap-1">
                    <button
                        type="button"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#116AEF]/25"
                        title="Call"
                        aria-label={`Call ${row.name}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onQuickCall?.(row);
                        }}
                    >
                        <LuPhone size={15} aria-hidden />
                    </button>
                    <button
                        type="button"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#116AEF]/25"
                        title="Schedule visit"
                        aria-label={`Schedule visit for ${row.name}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onQuickScheduleVisit?.(row);
                        }}
                    >
                        <LuCalendarPlus size={15} aria-hidden />
                    </button>
                    <button
                        type="button"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#116AEF]/25"
                        title="Assign"
                        aria-label={`Assign ${row.name}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onQuickAssign?.(row);
                        }}
                    >
                        <LuUserPlus size={15} aria-hidden />
                    </button>
                    <button
                        type="button"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-rose-200/90 bg-white text-rose-600 shadow-sm transition-colors hover:border-rose-300 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30"
                        title="Delete"
                        aria-label={`Delete lead ${row.name}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            removeLead(row);
                        }}
                    >
                        <LuTrash2 size={15} aria-hidden />
                    </button>
                </div>
            ),
        },
    ];
}
