'use client';

import React from 'react';
import Link from 'next/link';
import {
    LuActivity,
    LuArrowRight,
    LuFlame,
    LuIndianRupee,
    LuShieldAlert,
    LuTrendingUp,
} from 'react-icons/lu';
import type { LeadsIntelKpiSummary } from '@/lib/leadsIntelligenceHelpers';
import { formatPipelineValue } from '@/lib/leadsIntelligenceHelpers';
import type { ExecutiveSummaryPayload, LikelyClosureRow, SiteVisitConversionStats } from '@/lib/leadsIntelligenceDecisionHelpers';
import { leadProfileHref } from '@/lib/leadRoutes';
import { cn } from '@/lib/utils';

export function RevenueCommandCenter({
    kpis,
    leadCount,
    summary,
    hotClosures,
    siteVisitStats,
}: {
    kpis: LeadsIntelKpiSummary;
    leadCount: number;
    summary: ExecutiveSummaryPayload;
    hotClosures: LikelyClosureRow[];
    siteVisitStats: SiteVisitConversionStats;
}) {
    const empty = leadCount === 0;

    const cards = [
        {
            title: 'Forecast revenue',
            value: empty ? '—' : formatPipelineValue(kpis.forecastRevenueLakhs),
            icon: LuIndianRupee,
            tone: 'text-emerald-900 bg-emerald-50 border-emerald-200',
            emphasize: false,
        },
        {
            title: 'Revenue at risk',
            value: empty ? '—' : formatPipelineValue(kpis.revenueAtRiskLakhs),
            icon: LuShieldAlert,
            tone: 'text-rose-900 bg-rose-50 border-rose-300',
            emphasize: true,
        },
        {
            title: 'Hot leads',
            value: String(kpis.hotLeadsRequiringAction),
            icon: LuFlame,
            tone: 'text-orange-900 bg-orange-50 border-orange-200',
            emphasize: false,
        },
        {
            title: 'Team productivity',
            value: empty ? '—' : `${kpis.salesProductivityScore}`,
            icon: LuActivity,
            tone: 'text-amber-900 bg-amber-50 border-amber-200',
            emphasize: false,
        },
    ] as const;

    return (
        <section
            aria-label="Revenue command center"
            className="rounded-2xl border border-violet-200/60 bg-white p-5 ring-1 ring-violet-100/50 shadow-sm"
        >
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">AI executive summary</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-base">{summary.narrative}</p>
            <p className="mt-0.5 text-xs text-slate-600">{summary.focusLine}</p>

            <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.title}
                            className={cn(
                                'flex min-h-[92px] flex-col rounded-xl border p-3',
                                card.tone,
                                card.emphasize && 'ring-2 ring-rose-400/50 shadow-md',
                            )}
                        >
                            <div className="flex items-center justify-between gap-1">
                                <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">{card.title}</p>
                                <Icon size={14} aria-hidden className={card.emphasize ? 'text-rose-700' : undefined} />
                            </div>
                            <p
                                className={cn(
                                    'mt-auto pt-2 font-bold tabular-nums',
                                    card.emphasize ? 'text-2xl' : 'text-xl',
                                )}
                            >
                                {card.value}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="flex min-h-[72px] flex-col rounded-lg border border-emerald-100 bg-emerald-50/40 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-emerald-800">Close this week</p>
                    {hotClosures.length === 0 ? (
                        <p className="mt-auto text-xs text-slate-500">None in view</p>
                    ) : (
                        <ul className="mt-1 space-y-1">
                            {hotClosures.map((row) => (
                                <li key={row.lead.id} className="flex justify-between gap-2 text-xs">
                                    <Link
                                        href={leadProfileHref(row.lead.leadSlug)}
                                        className="truncate font-semibold text-slate-900 hover:underline"
                                    >
                                        {row.lead.name}
                                    </Link>
                                    <span className="shrink-0 font-bold text-emerald-700">{row.conversionProbability}%</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="flex min-h-[72px] flex-col rounded-lg border border-cyan-100 bg-cyan-50/40 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase text-cyan-800">Site visits → bookings</p>
                    <div className="mt-auto flex items-center gap-2 pt-1 text-xs font-semibold text-slate-800">
                        <span>{siteVisitStats.siteVisits} visits</span>
                        <LuArrowRight size={12} className="text-slate-400" aria-hidden />
                        <span>{siteVisitStats.bookings} booked</span>
                        <span className="ml-auto inline-flex items-center gap-0.5 text-violet-800">
                            <LuTrendingUp size={12} aria-hidden />
                            {siteVisitStats.conversionPct}%
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
