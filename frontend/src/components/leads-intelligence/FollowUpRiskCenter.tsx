'use client';

import React from 'react';
import Link from 'next/link';
import { LuTriangleAlert, LuDroplet } from 'react-icons/lu';
import type { IntelligenceLead } from '@/lib/leadsIntelligenceStore';
import { formatRiskLevel, getRecommendedActionLabel, riskClassMap, actionPillClass } from '@/lib/leadsIntelligenceHelpers';
import { leadProfileHref } from '@/lib/leadRoutes';
import { LeadsIntelAiPanel, LeadsIntelAiSectionHeader } from '@/components/leads-intelligence/leadsIntelligenceUi';
import { cn } from '@/lib/utils';

export function FollowUpRiskCenter({
    riskLeads,
    leakageLeads,
}: {
    riskLeads: IntelligenceLead[];
    leakageLeads: IntelligenceLead[];
}) {
    return (
        <LeadsIntelAiPanel variant="rose" className="h-full" aria-label="Follow-up risk center">
            <LeadsIntelAiSectionHeader
                title="Follow-up risk & lead leakage"
                subtitle="Overdue and inactive leads — act today to stop revenue walking out."
                variant="rose"
                badge="Reduce leakage"
            />
            <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <LuTriangleAlert size={14} className="text-rose-600" aria-hidden />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Follow-up risk center</h3>
                    </div>
                    {riskLeads.length === 0 ? (
                        <p className="text-sm text-slate-500">No high-risk follow-ups in this view.</p>
                    ) : (
                        <ul className="space-y-2">
                            {riskLeads.map((l) => (
                                <li key={l.id} className="rounded-xl border border-rose-100 bg-rose-50/40 px-3 py-2">
                                    <Link href={leadProfileHref(l.leadSlug)} className="font-semibold text-slate-900 hover:text-rose-700 hover:underline">
                                        {l.name}
                                    </Link>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold', riskClassMap[l.followUpRisk])}>
                                            {formatRiskLevel(l.followUpRisk)}
                                        </span>
                                        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', actionPillClass(getRecommendedActionLabel(l)))}>
                                            {getRecommendedActionLabel(l)}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <LuDroplet size={14} className="text-rose-600" aria-hidden />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Lead leakage alerts</h3>
                    </div>
                    {leakageLeads.length === 0 ? (
                        <p className="text-sm text-slate-500">No leakage detected — keep follow-up cadence.</p>
                    ) : (
                        <ul className="space-y-2">
                            {leakageLeads.map((l) => (
                                <li key={l.id} className="rounded-xl border border-orange-100 bg-orange-50/50 px-3 py-2">
                                    <Link href={leadProfileHref(l.leadSlug)} className="text-sm font-semibold text-slate-900 hover:underline">
                                        {l.name}
                                    </Link>
                                    <p className="mt-0.5 text-xs text-slate-600">
                                        Inactive · engagement {l.engagementScore}% — assign follow-up today
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </LeadsIntelAiPanel>
    );
}
