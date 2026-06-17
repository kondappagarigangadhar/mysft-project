'use client';

import React from 'react';
import Link from 'next/link';
import { LuCalendarCheck, LuIndianRupee, LuTrendingUp } from 'react-icons/lu';
import type { IntelligenceLead } from '@/lib/leadsIntelligenceStore';
import type { RevenueOpportunityInsight } from '@/lib/leadsIntelligenceDecisionHelpers';
import { formatRevenueLakhs } from '@/lib/leadsIntelligenceHelpers';
import { leadProfileHref } from '@/lib/leadRoutes';
import { LeadsIntelAiPanel, LeadsIntelAiSectionHeader, MetricPill } from '@/components/leads-intelligence/leadsIntelligenceUi';

export function RevenueOpportunityPanel({
    forecastRevenueLakhs,
    potentialClosures,
    insights,
}: {
    forecastRevenueLakhs: number;
    potentialClosures: IntelligenceLead[];
    insights: RevenueOpportunityInsight[];
}) {
    return (
        <LeadsIntelAiPanel variant="emerald" className="h-full" aria-label="Revenue opportunity">
            <LeadsIntelAiSectionHeader
                title="Revenue forecast & opportunities"
                subtitle="Weighted pipeline value and deals likely to close — focus sales on revenue, not reports."
                variant="emerald"
                badge="Revenue growth"
            />
            <div className="space-y-4 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <MetricPill
                        label="Forecast revenue (this month)"
                        value={formatRevenueLakhs(forecastRevenueLakhs)}
                        tone="emerald"
                    />
                    <MetricPill
                        label="Potential closures this week"
                        value={String(potentialClosures.length)}
                        tone="violet"
                    />
                </div>

                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <LuCalendarCheck size={14} className="text-emerald-700" aria-hidden />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Potential closures</h3>
                    </div>
                    {potentialClosures.length === 0 ? (
                        <p className="text-sm text-slate-500">No high-probability closes in this view. Widen filters or nurture warm leads.</p>
                    ) : (
                        <ul className="space-y-2">
                            {potentialClosures.map((l) => (
                                <li key={l.id}>
                                    <Link
                                        href={leadProfileHref(l.leadSlug)}
                                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2 transition-colors hover:bg-emerald-50"
                                    >
                                        <span className="text-sm font-semibold text-slate-900">{l.name}</span>
                                        <span className="text-xs font-bold text-emerald-800">{l.conversionProbability}% · book</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div>
                    <div className="mb-2 flex items-center gap-2">
                        <LuTrendingUp size={14} className="text-emerald-700" aria-hidden />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Revenue opportunity insights</h3>
                    </div>
                    {insights.length === 0 ? (
                        <p className="text-sm text-slate-500">No upsell or cross-sell signals in current filters.</p>
                    ) : (
                        <ul className="space-y-2">
                            {insights.map((ins) => (
                                <li
                                    key={ins.id}
                                    className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-900">{ins.title}</p>
                                            <p className="mt-0.5 text-xs text-slate-600">{ins.detail}</p>
                                        </div>
                                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-xs font-bold text-emerald-800">
                                            <LuIndianRupee size={12} aria-hidden />
                                            {formatRevenueLakhs(ins.impactLakhs)}
                                        </span>
                                    </div>
                                    {ins.leadSlug ? (
                                        <Link
                                            href={leadProfileHref(ins.leadSlug)}
                                            className="mt-2 inline-block text-xs font-semibold text-emerald-700 hover:underline"
                                        >
                                            Open lead →
                                        </Link>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </LeadsIntelAiPanel>
    );
}
