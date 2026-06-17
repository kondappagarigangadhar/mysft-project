'use client';

import React from 'react';
import type { DataTableColumn } from '@/components/data-table/types';
import type { IntelligenceLead } from '@/lib/leadsIntelligenceStore';
import {
    actionPillClass,
    formatRevenueLakhs,
    getLeadRevenuePotentialLakhs,
    getRecommendedActionLabel,
    riskClassMap,
    statusClassMap,
    temperatureClassMap,
} from '@/lib/leadsIntelligenceHelpers';
import { getLeadDisplayConfidence } from '@/lib/revenueIntelligenceHelpers';
import { buildLeadsIntelligenceColumns, type LeadsIntelligenceTableHandlers } from '@/components/leads-intelligence/LeadsIntelligenceTable';
import { cn } from '@/lib/utils';

export const REVENUE_INTEL_DEFAULT_ON = new Set<string>([
    'name',
    'status',
    'assigned',
    'lead_score',
    'conversion',
    'temperature',
    'revenue_potential',
    'next_action',
    'quick_actions',
]);

export const REVENUE_INTEL_COLUMN_MENU = [
    { id: 'name', label: 'Lead name' },
    { id: 'phone', label: 'Phone' },
    { id: 'email', label: 'Email' },
    { id: 'source', label: 'Source' },
    { id: 'lead_score', label: 'Lead score' },
    { id: 'status', label: 'Status' },
    { id: 'assigned', label: 'Assigned' },
    { id: 'temperature', label: 'Temperature' },
    { id: 'conversion', label: 'Conv. probability' },
    { id: 'revenue_potential', label: 'Revenue potential' },
    { id: 'engagement', label: 'Engagement' },
    { id: 'risk', label: 'Risk' },
    { id: 'created', label: 'Created' },
    { id: 'next_action', label: 'Next best action' },
    { id: 'best_time', label: 'Best time' },
    { id: 'visit_rec', label: 'Visit' },
    { id: 'quick_actions', label: 'Actions' },
];

export function buildRevenueIntelligenceColumns(handlers: LeadsIntelligenceTableHandlers): DataTableColumn<IntelligenceLead>[] {
    const base = buildLeadsIntelligenceColumns(handlers);
    const revenueCol: DataTableColumn<IntelligenceLead> = {
        id: 'revenue_potential',
        header: 'Revenue potential',
        sortable: true,
        sortValue: (row) => getLeadRevenuePotentialLakhs(row),
        minWidth: 120,
        render: (row) => (
            <span className="text-sm font-semibold tabular-nums text-emerald-800">
                {formatRevenueLakhs(getLeadRevenuePotentialLakhs(row))}
            </span>
        ),
    };

    const enhanced = base.map((col) => {
        if (col.id === 'conversion') {
            return {
                ...col,
                header: 'Conv. probability',
                render: (row: IntelligenceLead) => (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold tabular-nums text-slate-900">{row.conversionProbability}%</span>
                        <span className="text-[10px] text-slate-500">{getLeadDisplayConfidence(row)}% conf.</span>
                    </div>
                ),
            };
        }
        if (col.id === 'next_action') {
            return {
                ...col,
                header: 'Next best action',
                render: (row: IntelligenceLead) => {
                    const action = getRecommendedActionLabel(row);
                    return (
                        <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold', actionPillClass(action))}>
                            {action}
                        </span>
                    );
                },
            };
        }
        if (col.id === 'temperature') {
            return {
                ...col,
                render: (row: IntelligenceLead) => (
                    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold', temperatureClassMap[row.temperature])}>
                        {row.temperature}
                    </span>
                ),
            };
        }
        if (col.id === 'status') {
            return {
                ...col,
                render: (row: IntelligenceLead) => (
                    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold', statusClassMap[row.status])}>
                        {row.status}
                    </span>
                ),
            };
        }
        if (col.id === 'risk') {
            return {
                ...col,
                render: (row: IntelligenceLead) => (
                    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold', riskClassMap[row.followUpRisk])}>
                        {row.followUpRisk}
                    </span>
                ),
            };
        }
        return col;
    });

    const convIdx = enhanced.findIndex((c) => c.id === 'conversion');
    if (convIdx >= 0) {
        const next = [...enhanced];
        next.splice(convIdx + 1, 0, revenueCol);
        return next;
    }
    return [...enhanced, revenueCol];
}
