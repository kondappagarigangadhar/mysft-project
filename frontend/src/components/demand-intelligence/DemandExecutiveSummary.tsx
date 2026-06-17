'use client';

import React from 'react';
import {
    LuBoxes,
    LuChartLine,
    LuIndianRupee,
    LuLayers,
    LuSparkles,
    LuTriangleAlert,
    LuTrendingUp,
} from 'react-icons/lu';
import { DemandClickableCard } from '@/components/demand-intelligence/DemandClickableLink';
import type { DemandExecutiveKpis } from '@/lib/demandIntelligenceStore';
import { DEMAND_SECTION_IDS } from '@/lib/demandIntelligenceRoutes';
import { formatDemandRevenueLakhs } from '@/lib/demandIntelligenceHelpers';
import { cn } from '@/lib/utils';

export function DemandExecutiveSummary({ executive }: { executive: DemandExecutiveKpis }) {
    const metrics = [
        {
            label: 'Forecast revenue',
            value: formatDemandRevenueLakhs(executive.forecastRevenueLakhs),
            sub: 'This month',
            icon: LuIndianRupee,
            tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
            href: `#${DEMAND_SECTION_IDS.revenue}`,
        },
        {
            label: 'Demand score',
            value: String(executive.demandScore),
            sub: 'Portfolio AI index',
            icon: LuChartLine,
            tone: 'border-violet-200 bg-violet-50 text-violet-900',
            href: `#${DEMAND_SECTION_IDS.ranking}`,
        },
        {
            label: 'Revenue opportunity',
            value: formatDemandRevenueLakhs(executive.revenueOpportunityLakhs),
            sub: 'Upside identified',
            icon: LuTrendingUp,
            tone: 'border-cyan-200 bg-cyan-50 text-cyan-900',
            href: `#${DEMAND_SECTION_IDS.revenue}`,
        },
        {
            label: 'Inventory risk',
            value: String(executive.inventoryRiskUnits),
            sub: 'Units aging 90+ days',
            icon: LuTriangleAlert,
            tone: 'border-rose-200 bg-rose-50 text-rose-900',
            href: `#${DEMAND_SECTION_IDS.inventoryRisk}`,
        },
        {
            label: 'Projects needing attention',
            value: String(executive.projectsRequiringAttention),
            sub: 'Declining or stuck',
            icon: LuLayers,
            tone: 'border-amber-200 bg-amber-50 text-amber-900',
            href: `#${DEMAND_SECTION_IDS.attention}`,
        },
        {
            label: 'Pricing opportunities',
            value: String(executive.pricingOpportunities),
            sub: 'AI-confirmed',
            icon: LuBoxes,
            tone: 'border-indigo-200 bg-indigo-50 text-indigo-900',
            href: `#${DEMAND_SECTION_IDS.actions}`,
        },
    ] as const;

    return (
        <section
            aria-label="AI executive summary"
            className="overflow-hidden rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/90 via-white to-blue-50/80 p-5 shadow-md ring-1 ring-violet-100/80"
        >
            <div className="flex flex-wrap items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-sm">
                    <LuSparkles size={20} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">AI executive summary</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">
                        Revenue & demand snapshot — what is happening and what to do today
                    </p>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {metrics.map((m) => {
                    const Icon = m.icon;
                    return (
                        <DemandClickableCard key={m.label} href={m.href} className={cn('rounded-xl border p-3', m.tone)}>
                            <div className="flex items-center justify-between gap-1">
                                <p className="text-[10px] font-bold uppercase tracking-wide opacity-85">{m.label}</p>
                                <Icon size={14} aria-hidden className="opacity-70" />
                            </div>
                            <p className="mt-1 text-xl font-bold tabular-nums">{m.value}</p>
                            <p className="mt-0.5 text-[10px] font-medium opacity-75">{m.sub}</p>
                        </DemandClickableCard>
                    );
                })}
            </div>

            <div className="mt-4 rounded-xl border border-violet-100/90 bg-white/80 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">AI summary</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{executive.narrative}</p>
            </div>
        </section>
    );
}
