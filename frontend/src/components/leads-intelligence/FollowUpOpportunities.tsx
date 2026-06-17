'use client';

import React from 'react';
import Link from 'next/link';
import { LuCalendar, LuClock3, LuMessageCircle } from 'react-icons/lu';
import type { FollowUpPlannerRow } from '@/lib/leadsIntelligenceDecisionHelpers';
import { getRecommendedActionLabel, actionPillClass } from '@/lib/leadsIntelligenceHelpers';
import { leadProfileHref } from '@/lib/leadRoutes';
import { LeadsIntelAiPanel, LeadsIntelAiSectionHeader } from '@/components/leads-intelligence/leadsIntelligenceUi';
import { cn } from '@/lib/utils';

const thClass =
    'px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-gradient-to-r from-cyan-50/80 to-teal-50/50';
const tdClass = 'px-4 py-3 text-sm text-slate-800';

const priorityClass = {
    High: 'text-rose-700 font-bold',
    Medium: 'text-amber-700 font-semibold',
    Low: 'text-slate-600',
};

/** Automated follow-up planner — date, priority, channel (less manual planning). */
export function FollowUpOpportunities({ rows }: { rows: FollowUpPlannerRow[] }) {
    return (
        <LeadsIntelAiPanel variant="cyan" className="h-full" aria-label="Automated follow-up planner">
            <LeadsIntelAiSectionHeader
                title="Automated follow-up planner"
                subtitle="Suggested date, priority, and channel — reduces manual CRM planning."
                variant="cyan"
                badge="Less manual work"
            />
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="border-b border-cyan-100/80">
                            <th className={thClass}>Lead</th>
                            <th className={thClass}>Follow-up date</th>
                            <th className={thClass}>Priority</th>
                            <th className={thClass}>Channel</th>
                            <th className={thClass}>Next action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                    No follow-ups planned for this view.
                                </td>
                            </tr>
                        ) : (
                            rows.map(({ lead, suggestedDate, priority, channel, reason }, i) => (
                                <tr
                                    key={lead.id}
                                    className={cn(
                                        'border-b border-slate-100/80 transition-colors last:border-0 hover:bg-cyan-50/30',
                                        i % 2 === 1 && 'bg-slate-50/40',
                                    )}
                                >
                                    <td className={tdClass}>
                                        <Link href={leadProfileHref(lead.leadSlug)} className="font-semibold text-slate-900 hover:text-cyan-700 hover:underline">
                                            {lead.name}
                                        </Link>
                                        <p className="mt-0.5 text-xs text-slate-500">{reason}</p>
                                    </td>
                                    <td className={tdClass}>
                                        <span className="inline-flex items-center gap-1.5 font-medium text-cyan-900">
                                            <LuCalendar size={14} className="text-cyan-600" aria-hidden />
                                            {suggestedDate}
                                        </span>
                                    </td>
                                    <td className={cn(tdClass, priorityClass[priority])}>{priority}</td>
                                    <td className={tdClass}>
                                        <span className="inline-flex items-center gap-1 text-slate-700">
                                            <LuMessageCircle size={14} aria-hidden />
                                            {channel}
                                        </span>
                                        {lead.bestCallTimeLabel !== '—' ? (
                                            <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                                <LuClock3 size={12} aria-hidden />
                                                {lead.bestCallTimeLabel}
                                            </span>
                                        ) : null}
                                    </td>
                                    <td className={tdClass}>
                                        <span
                                            className={cn(
                                                'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold',
                                                actionPillClass(getRecommendedActionLabel(lead)),
                                            )}
                                        >
                                            {getRecommendedActionLabel(lead)}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </LeadsIntelAiPanel>
    );
}
