'use client';

import React from 'react';
import Link from 'next/link';
import type { PriorityActionRow } from '@/lib/leadsIntelligenceDecisionHelpers';
import { actionPillClass, formatRevenueLakhs } from '@/lib/leadsIntelligenceHelpers';
import { leadProfileHref } from '@/lib/leadRoutes';
import { LeadsIntelAiPanel, LeadsIntelAiSectionHeader } from '@/components/leads-intelligence/leadsIntelligenceUi';
import { cn } from '@/lib/utils';

const th = 'px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500';
const td = 'px-4 py-2.5 text-sm text-slate-800 align-middle';

export function PriorityActionsCenter({ rows }: { rows: PriorityActionRow[] }) {
    return (
        <LeadsIntelAiPanel variant="violet" aria-label="Priority actions center">
            <LeadsIntelAiSectionHeader
                title="Priority Actions Center"
                subtitle="What to do today — one list ranked by revenue impact and urgency."
                variant="violet"
                badge="Do today"
            />
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="border-b border-violet-100/80 bg-violet-50/50">
                            <th className={th}>Lead</th>
                            <th className={th}>Revenue potential</th>
                            <th className={th}>Problem</th>
                            <th className={th}>Recommended action</th>
                            <th className={th}>Business impact</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                    No priority actions in this view.
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, i) => (
                                <tr key={row.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                    <td className={td}>
                                        <Link
                                            href={leadProfileHref(row.lead.leadSlug)}
                                            className="font-semibold text-slate-900 hover:text-violet-700 hover:underline"
                                        >
                                            {row.lead.name}
                                        </Link>
                                        <p className="text-xs text-slate-500">{row.lead.projectInterest}</p>
                                    </td>
                                    <td className={cn(td, 'font-bold text-emerald-800 tabular-nums')}>
                                        {formatRevenueLakhs(row.revenuePotentialLakhs)}
                                    </td>
                                    <td className={cn(td, 'max-w-[200px] text-xs font-medium text-rose-800')}>{row.problem}</td>
                                    <td className={td}>
                                        <span
                                            className={cn(
                                                'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
                                                actionPillClass(row.recommendedAction),
                                            )}
                                        >
                                            {row.recommendedAction}
                                        </span>
                                    </td>
                                    <td className={cn(td, 'max-w-[220px] text-xs text-slate-600')}>{row.businessImpact}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </LeadsIntelAiPanel>
    );
}
