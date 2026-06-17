'use client';

import React from 'react';
import {
    LuClipboardCheck,
    LuHouse,
    LuKeyRound,
    LuPercent,
    LuSparkles,
    LuTriangleAlert,
    LuWrench,
} from 'react-icons/lu';
import { DemandClickableCard } from '@/components/demand-intelligence/DemandClickableLink';
import type { ResidentIntelExecutiveKpis } from '@/lib/residentIntelligenceStore';
import { RESIDENT_INTEL_SECTION_IDS } from '@/lib/residentIntelligenceRoutes';
import { cn } from '@/lib/utils';

export function ResidentExecutiveSummary({ executive }: { executive: ResidentIntelExecutiveKpis }) {
    const metrics = [
        {
            label: 'Active residents',
            value: String(executive.activeResidents),
            sub: 'Occupied units',
            icon: LuHouse,
            tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
            href: `#${RESIDENT_INTEL_SECTION_IDS.table}`,
        },
        {
            label: 'Occupancy health',
            value: `${executive.occupancyHealthPct}%`,
            sub: 'Portfolio',
            icon: LuPercent,
            tone: 'border-cyan-200 bg-cyan-50 text-cyan-900',
            href: `#${RESIDENT_INTEL_SECTION_IDS.ranking}`,
        },
        {
            label: 'Portal issues',
            value: String(executive.portalIssues),
            sub: 'Access & expiry',
            icon: LuKeyRound,
            tone: 'border-amber-200 bg-amber-50 text-amber-900',
            href: `#${RESIDENT_INTEL_SECTION_IDS.risk}`,
        },
        {
            label: 'Open service tickets',
            value: String(executive.openServiceTickets),
            sub: 'Needs assignment',
            icon: LuWrench,
            tone: 'border-rose-200 bg-rose-50 text-rose-900',
            href: `#${RESIDENT_INTEL_SECTION_IDS.attention}`,
        },
        {
            label: 'Defaulters',
            value: String(executive.defaulterCount),
            sub: 'Payment risk',
            icon: LuTriangleAlert,
            tone: 'border-rose-200 bg-rose-50 text-rose-900',
            href: `#${RESIDENT_INTEL_SECTION_IDS.risk}`,
        },
        {
            label: 'Lease compliance',
            value: `${executive.leaseCompliancePct}%`,
            sub: 'On track',
            icon: LuClipboardCheck,
            tone: 'border-violet-200 bg-violet-50 text-violet-900',
            href: `#${RESIDENT_INTEL_SECTION_IDS.engagement}`,
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
                        Resident & community snapshot — occupancy, portal access, and service health
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
