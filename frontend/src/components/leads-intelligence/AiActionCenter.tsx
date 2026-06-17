'use client';

import React from 'react';
import Link from 'next/link';
import type { AiActionRowMeta } from '@/lib/leadsIntelligenceDecisionHelpers';
import {
    formatRevenueLakhs,
    formatRiskLevel,
    getLeadRevenuePotentialLakhs,
    riskClassMap,
    actionPillClass,
    conversionTone,
} from '@/lib/leadsIntelligenceHelpers';
import { leadProfileHref } from '@/lib/leadRoutes';
import { LeadsIntelAiPanel, LeadsIntelAiSectionHeader } from '@/components/leads-intelligence/leadsIntelligenceUi';
import { cn } from '@/lib/utils';

const thClass =
    'px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-gradient-to-r from-violet-50/80 to-blue-50/50';
const tdClass = 'px-4 py-3 text-sm text-slate-800';

export function AiActionCenter({ rows }: { rows: AiActionRowMeta[] }) {
    return (
        <LeadsIntelAiPanel variant="violet" aria-label="AI recommended actions">
            <LeadsIntelAiSectionHeader
                title="AI Recommended Actions"
                subtitle="Revenue impact, business impact, and confidence — execute, don't just read scores."
                variant="violet"
            />
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="border-b border-violet-100/80">
                            <th className={thClass}>Lead</th>
                            <th className={cn(thClass, 'text-right')}>Conversion</th>
                            <th className={thClass}>Recommended action</th>
                            <th className={thClass}>Business impact</th>
                            <th className={thClass}>Revenue impact</th>
                            <th className={cn(thClass, 'text-right')}>Confidence</th>
                            <th className={thClass}>Risk</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                                    No prioritized actions in this view.
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, i) => {
                                const { lead, action, confidence, businessImpact, revenueImpact } = row;
                                return (
                                    <tr
                                        key={lead.id}
                                        className={cn(
                                            'border-b border-slate-100/80 transition-colors last:border-0 hover:bg-violet-50/30',
                                            i % 2 === 1 && 'bg-slate-50/40',
                                        )}
                                    >
                                        <td className={tdClass}>
                                            <Link
                                                href={leadProfileHref(lead.leadSlug)}
                                                className="font-semibold text-slate-900 hover:text-violet-700 hover:underline"
                                            >
                                                {lead.name}
                                            </Link>
                                            <p className="text-xs font-semibold text-indigo-700">
                                                {formatRevenueLakhs(getLeadRevenuePotentialLakhs(lead))} opportunity
                                            </p>
                                        </td>
                                        <td className={cn(tdClass, 'text-right font-bold tabular-nums', conversionTone(lead.conversionProbability))}>
                                            {lead.conversionProbability}%
                                        </td>
                                        <td className={tdClass}>
                                            <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', actionPillClass(action))}>
                                                {action}
                                            </span>
                                        </td>
                                        <td className={cn(tdClass, 'max-w-[180px] text-xs text-slate-600')}>{businessImpact}</td>
                                        <td className={cn(tdClass, 'max-w-[200px] text-xs font-medium text-emerald-800')}>{revenueImpact}</td>
                                        <td className={cn(tdClass, 'text-right tabular-nums font-semibold text-violet-800')}>{confidence}%</td>
                                        <td className={tdClass}>
                                            <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold', riskClassMap[lead.followUpRisk])}>
                                                {formatRiskLevel(lead.followUpRisk)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </LeadsIntelAiPanel>
    );
}
