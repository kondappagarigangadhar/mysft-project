'use client';

import React from 'react';
import { LuArrowRight, LuZap } from 'react-icons/lu';
import { LeadsIntelAiPanel, LeadsIntelAiSectionHeader } from '@/components/leads-intelligence/leadsIntelligenceUi';
import { DemandClickableCard, DemandClickableLink } from '@/components/demand-intelligence/DemandClickableLink';
import type {
    DemandInventoryRiskRow,
    DemandProjectRecord,
    DemandRecommendedAction,
} from '@/lib/demandIntelligenceStore';
import {
    demandScoreTone,
    formatDemandRevenueLakhs,
    riskLevelClass,
    velocityClass,
} from '@/lib/demandIntelligenceHelpers';
import {
    DEMAND_SECTION_IDS,
    getDemandActionHref,
    getDemandProjectHref,
    getDemandTabForRecommendation,
    getDemandUnitHref,
} from '@/lib/demandIntelligenceRoutes';
import { cn } from '@/lib/utils';

const th = 'px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500';
const td = 'px-4 py-3 text-sm text-slate-800';

export function DemandRevenueOpportunityCenter({ projects }: { projects: DemandProjectRecord[] }) {
    return (
        <div id={DEMAND_SECTION_IDS.revenue} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="emerald" aria-label="Revenue opportunity center">
                <LeadsIntelAiSectionHeader
                    title="Revenue Opportunity Center"
                    subtitle="Where revenue will come from — likely closures and fast-moving projects."
                    variant="emerald"
                />
                {projects.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">No revenue opportunities in this view.</p>
                ) : (
                    <div className="grid gap-3 p-4 sm:grid-cols-2">
                        {projects.map((p) => {
                            const href = getDemandProjectHref(p.slug, 'inventory');
                            return (
                                <DemandClickableCard
                                    key={p.id}
                                    href={href}
                                    className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-sm"
                                >
                                    <p className="font-bold text-slate-900">{p.name}</p>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <p className="font-bold uppercase tracking-wide text-slate-500">Likely closures</p>
                                            <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-800">{p.likelyClosures} units</p>
                                        </div>
                                        <div>
                                            <p className="font-bold uppercase tracking-wide text-slate-500">Potential revenue</p>
                                            <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-800">
                                                {formatDemandRevenueLakhs(p.potentialRevenueLakhs)}
                                            </p>
                                        </div>
                                    </div>
                                    {p.bookingVelocity === 'High' ? (
                                        <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700">
                                            <LuZap size={12} aria-hidden />
                                            Fast moving
                                        </p>
                                    ) : null}
                                    {href ? (
                                        <p className="mt-2 text-[10px] font-semibold text-violet-700">View project inventory →</p>
                                    ) : null}
                                </DemandClickableCard>
                            );
                        })}
                    </div>
                )}
            </LeadsIntelAiPanel>
        </div>
    );
}

export function DemandInventoryRiskCenter({ rows }: { rows: DemandInventoryRiskRow[] }) {
    return (
        <div id={DEMAND_SECTION_IDS.inventoryRisk} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="rose" aria-label="Inventory risk center">
                <LeadsIntelAiSectionHeader
                    title="Inventory Risk Center"
                    subtitle="Units at risk of becoming dead stock — act before write-downs."
                    variant="rose"
                />
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-rose-100/80 bg-rose-50/50">
                                <th className={th}>Project</th>
                                <th className={th}>Unit</th>
                                <th className={th}>Inventory type</th>
                                <th className={th}>Days unsold</th>
                                <th className={th}>Risk level</th>
                                <th className={th}>Recommended action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No inventory risks in this view.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row, i) => {
                                    const projectHref = getDemandProjectHref(row.projectSlug, 'inventory');
                                    const unitHref = getDemandUnitHref(row.projectSlug, row.unitSlug);
                                    return (
                                        <tr key={row.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                            <td className={cn(td, 'font-semibold')}>
                                                <DemandClickableLink href={projectHref}>{row.project}</DemandClickableLink>
                                            </td>
                                            <td className={td}>
                                                <DemandClickableLink href={unitHref ?? projectHref} className="font-medium">
                                                    {row.unit}
                                                </DemandClickableLink>
                                            </td>
                                            <td className={td}>{row.inventoryType}</td>
                                            <td className={cn(td, 'tabular-nums font-semibold')}>{row.daysUnsold} days</td>
                                            <td className={td}>
                                                <span
                                                    className={cn(
                                                        'inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold',
                                                        riskLevelClass(row.riskLevel),
                                                    )}
                                                >
                                                    {row.riskLevel} risk
                                                </span>
                                            </td>
                                            <td className={cn(td, 'text-xs font-medium')}>{row.recommendedAction}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function DemandProjectRanking({ projects }: { projects: DemandProjectRecord[] }) {
    return (
        <div id={DEMAND_SECTION_IDS.ranking} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="indigo" aria-label="Project demand ranking">
                <LeadsIntelAiSectionHeader
                    title="Project Demand Ranking"
                    subtitle="Ranked by AI demand score — strongest markets first."
                    variant="indigo"
                />
                <div className="grid gap-2 p-4 sm:grid-cols-2">
                    {projects.map((p, idx) => {
                        const href = getDemandProjectHref(p.slug, 'overview');
                        return (
                            <DemandClickableCard
                                key={p.id}
                                href={href}
                                className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                            >
                                <span
                                    className={cn(
                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm font-bold tabular-nums',
                                        demandScoreTone(p.demandScore),
                                    )}
                                >
                                    #{idx + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-900">{p.name}</p>
                                    <p className={cn('text-2xl font-bold tabular-nums', demandScoreTone(p.demandScore).split(' ')[0])}>
                                        {p.demandScore}
                                    </p>
                                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600">
                                        <span>
                                            Velocity: <span className={velocityClass(p.bookingVelocity)}>{p.bookingVelocity}</span>
                                        </span>
                                        <span>Lead interest: {p.leadInterest}%</span>
                                        <span className="col-span-2">Market: {p.marketTrend}</span>
                                    </div>
                                </div>
                            </DemandClickableCard>
                        );
                    })}
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

const priorityTone: Record<DemandRecommendedAction['priority'], string> = {
    High: 'bg-rose-100 text-rose-800 border-rose-200',
    Medium: 'bg-amber-100 text-amber-800 border-amber-200',
    Low: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function DemandRecommendedActions({ actions }: { actions: DemandRecommendedAction[] }) {
    return (
        <div id={DEMAND_SECTION_IDS.actions} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="amber" aria-label="AI recommended actions">
                <LeadsIntelAiSectionHeader
                    title="AI Recommended Actions"
                    subtitle="Exact steps for management — ranked by revenue impact."
                    variant="amber"
                    badge="Do today"
                />
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                    {actions.map((a) => {
                        const href = getDemandActionHref(a.projectSlug, a.title);
                        return (
                            <DemandClickableCard
                                key={a.id}
                                href={href}
                                className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/60 to-white p-4"
                            >
                                <p className="text-sm font-bold text-slate-900">{a.title}</p>
                                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 font-semibold text-emerald-800">
                                        Impact: {formatDemandRevenueLakhs(a.expectedRevenueLakhs)}
                                    </span>
                                    <span className={cn('rounded-lg border px-2 py-1 font-semibold', priorityTone[a.priority])}>
                                        Priority: {a.priority}
                                    </span>
                                    <span className="rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 font-semibold text-violet-800">
                                        Confidence: {a.confidence}%
                                    </span>
                                </div>
                                {href ? <p className="mt-2 text-[10px] font-semibold text-violet-700">Open project →</p> : null}
                            </DemandClickableCard>
                        );
                    })}
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function DemandProjectIntelligenceTable({ projects }: { projects: DemandProjectRecord[] }) {
    return (
        <div id={DEMAND_SECTION_IDS.projectsTable} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="violet" aria-label="Project intelligence table">
                <LeadsIntelAiSectionHeader
                    title="Project Intelligence"
                    subtitle="Single management view — demand, inventory, pricing, and AI recommendation."
                    variant="violet"
                />
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-violet-100/80 bg-violet-50/50">
                                <th className={th}>Project</th>
                                <th className={th}>Demand score</th>
                                <th className={th}>Available</th>
                                <th className={th}>Booked</th>
                                <th className={th}>Sales velocity</th>
                                <th className={th}>Pricing opp.</th>
                                <th className={th}>Risk</th>
                                <th className={th}>AI recommendation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No projects match filters.
                                    </td>
                                </tr>
                            ) : (
                                projects.map((p, i) => {
                                    const overviewHref = getDemandProjectHref(p.slug, 'overview');
                                    const actionHref = getDemandProjectHref(
                                        p.slug,
                                        getDemandTabForRecommendation(p.aiRecommendation),
                                    );
                                    return (
                                        <tr key={p.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                            <td className={cn(td, 'font-semibold')}>
                                                <DemandClickableLink href={overviewHref} showArrow>
                                                    {p.name}
                                                </DemandClickableLink>
                                            </td>
                                            <td className={td}>
                                                <span
                                                    className={cn(
                                                        'inline-flex rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums',
                                                        demandScoreTone(p.demandScore),
                                                    )}
                                                >
                                                    {p.demandScore}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'tabular-nums')}>
                                                <DemandClickableLink href={getDemandProjectHref(p.slug, 'inventory')}>
                                                    {p.availableUnits}
                                                </DemandClickableLink>
                                            </td>
                                            <td className={cn(td, 'tabular-nums')}>{p.bookedUnits}</td>
                                            <td className={td}>
                                                <span className={velocityClass(p.bookingVelocity)}>{p.bookingVelocity}</span>
                                            </td>
                                            <td className={cn(td, 'tabular-nums font-semibold')}>
                                                {p.pricingOpportunityPct > 0 ? (
                                                    <DemandClickableLink href={getDemandProjectHref(p.slug, 'pricing')}>
                                                        +{p.pricingOpportunityPct}%
                                                    </DemandClickableLink>
                                                ) : (
                                                    '0%'
                                                )}
                                            </td>
                                            <td className={td}>
                                                <span
                                                    className={cn(
                                                        'inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold',
                                                        riskLevelClass(p.riskLevel),
                                                    )}
                                                >
                                                    {p.riskLevel}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'text-xs font-semibold text-violet-900')}>
                                                <DemandClickableLink href={actionHref} className="inline-flex items-center gap-1">
                                                    {p.aiRecommendation}
                                                    <LuArrowRight size={12} className="opacity-60" aria-hidden />
                                                </DemandClickableLink>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}
