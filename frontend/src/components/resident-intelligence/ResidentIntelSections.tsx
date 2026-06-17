'use client';

import React from 'react';
import { LuArrowRight, LuZap } from 'react-icons/lu';
import { LeadsIntelAiPanel, LeadsIntelAiSectionHeader } from '@/components/leads-intelligence/leadsIntelligenceUi';
import { DemandClickableCard, DemandClickableLink } from '@/components/demand-intelligence/DemandClickableLink';
import type {
    ResidentEngagementOpportunity,
    ResidentIntelRecord,
    ResidentRecommendedAction,
    ResidentRiskRow,
} from '@/lib/residentIntelligenceStore';
import { communityScoreTone, residentRiskClass } from '@/lib/residentIntelligenceHelpers';
import {
    getResidentIntelActionHref,
    getResidentIntelHref,
    getResidentIntelServiceHref,
    RESIDENT_INTEL_SECTION_IDS,
} from '@/lib/residentIntelligenceRoutes';
import { cn } from '@/lib/utils';

const th = 'px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500';
const td = 'px-4 py-3 text-sm text-slate-800 align-middle';

const priorityTone: Record<ResidentRecommendedAction['priority'], string> = {
    High: 'bg-rose-100 text-rose-800 border-rose-200',
    Medium: 'bg-amber-100 text-amber-800 border-amber-200',
    Low: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function ResidentRecommendedActions({ actions }: { actions: ResidentRecommendedAction[] }) {
    return (
        <div id={RESIDENT_INTEL_SECTION_IDS.actions} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="amber" aria-label="AI recommended actions">
                <LeadsIntelAiSectionHeader
                    title="AI Recommended Actions"
                    subtitle="Exact community management steps — ranked by urgency and resident impact."
                    variant="amber"
                    badge="Do today"
                />
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                    {actions.length === 0 ? (
                        <p className="col-span-full px-4 py-8 text-center text-sm text-slate-500">No actions in this view.</p>
                    ) : (
                        actions.map((a) => {
                            const href = getResidentIntelActionHref(a.residentSlug, a.title, a.serviceTicketSlug);
                            return (
                                <DemandClickableCard
                                    key={a.id}
                                    href={href}
                                    className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/60 to-white p-4"
                                >
                                    <p className="text-sm font-bold text-slate-900">{a.title}</p>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                        <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 font-semibold text-emerald-800">
                                            Impact: {a.expectedImpact}
                                        </span>
                                        <span className={cn('rounded-lg border px-2 py-1 font-semibold', priorityTone[a.priority])}>
                                            Priority: {a.priority}
                                        </span>
                                        <span className="rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 font-semibold text-violet-800">
                                            Confidence: {a.confidence}%
                                        </span>
                                    </div>
                                    {href ? <p className="mt-2 text-[10px] font-semibold text-violet-700">Open resident →</p> : null}
                                </DemandClickableCard>
                            );
                        })
                    )}
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function ResidentEngagementOpportunityCenter({
    opportunities,
}: {
    opportunities: ResidentEngagementOpportunity[];
}) {
    return (
        <div id={RESIDENT_INTEL_SECTION_IDS.engagement} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="emerald" aria-label="Engagement opportunity center">
                <LeadsIntelAiSectionHeader
                    title="Engagement Opportunity Center"
                    subtitle="Where community participation will grow — notices, committee touchpoints, and amenity pilots."
                    variant="emerald"
                />
                {opportunities.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">No engagement opportunities in this view.</p>
                ) : (
                    <div className="grid gap-3 p-4 sm:grid-cols-2">
                        {opportunities.map((o) => {
                            const href = getResidentIntelHref(o.residentSlug, 'overview');
                            return (
                                <DemandClickableCard
                                    key={o.id}
                                    href={href}
                                    className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-sm"
                                >
                                    <p className="font-bold text-slate-900">{o.fullName}</p>
                                    <p className="text-xs text-violet-800">{o.propertyName}</p>
                                    <p className="mt-1 text-xs font-semibold text-emerald-800">{o.opportunityType}</p>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <p className="font-bold uppercase tracking-wide text-slate-500">Engagement score</p>
                                            <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-800">
                                                {o.likelyEngagementScore}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-bold uppercase tracking-wide text-slate-500">Act within</p>
                                            <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-800">{o.dueWithinDays} days</p>
                                        </div>
                                    </div>
                                    {o.likelyEngagementScore >= 85 ? (
                                        <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700">
                                            <LuZap size={12} aria-hidden />
                                            High confidence
                                        </p>
                                    ) : null}
                                    {href ? <p className="mt-2 text-[10px] font-semibold text-violet-700">View resident →</p> : null}
                                </DemandClickableCard>
                            );
                        })}
                    </div>
                )}
            </LeadsIntelAiPanel>
        </div>
    );
}

export function ResidentRiskCenter({ rows }: { rows: ResidentRiskRow[] }) {
    return (
        <div id={RESIDENT_INTEL_SECTION_IDS.risk} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="rose" aria-label="Resident risk center">
                <LeadsIntelAiSectionHeader
                    title="Resident Risk Center"
                    subtitle="Service SLAs, payment defaults, portal access, and lease compliance — act before escalation."
                    variant="rose"
                />
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-rose-100/80 bg-rose-50/50">
                                <th className={th}>Resident</th>
                                <th className={th}>Property</th>
                                <th className={th}>Category</th>
                                <th className={th}>Severity</th>
                                <th className={th}>Detail</th>
                                <th className={th}>Risk</th>
                                <th className={th}>Recommended action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No resident risks in this view.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row, i) => {
                                    const href = row.serviceTicketSlug
                                        ? getResidentIntelServiceHref(row.serviceTicketSlug)
                                        : getResidentIntelHref(row.residentSlug);
                                    return (
                                        <tr key={row.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                            <td className={cn(td, 'font-semibold')}>
                                                <DemandClickableLink href={href}>{row.fullName}</DemandClickableLink>
                                            </td>
                                            <td className={td}>{row.propertyName}</td>
                                            <td className={td}>{row.riskCategory}</td>
                                            <td className={cn(td, 'tabular-nums font-semibold text-rose-700')}>
                                                {row.severityDays > 0 ? `${row.severityDays} days` : 'Today'}
                                            </td>
                                            <td className={td}>{row.detail}</td>
                                            <td className={td}>
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold leading-none',
                                                        residentRiskClass(row.riskLevel),
                                                    )}
                                                >
                                                    {row.riskLevel}
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

export function ResidentCommunityRanking({ residents }: { residents: ResidentIntelRecord[] }) {
    return (
        <div id={RESIDENT_INTEL_SECTION_IDS.ranking} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="indigo" aria-label="Community health ranking">
                <LeadsIntelAiSectionHeader
                    title="Community Health Ranking"
                    subtitle="Ranked by AI community score — strongest engagement and compliance first."
                    variant="indigo"
                />
                <div className="grid gap-2 p-4 sm:grid-cols-2">
                    {residents.map((r, idx) => {
                        const href = getResidentIntelHref(r.residentSlug);
                        return (
                            <DemandClickableCard
                                key={r.id}
                                href={href}
                                className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                            >
                                <span
                                    className={cn(
                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm font-bold tabular-nums',
                                        communityScoreTone(r.communityScore),
                                    )}
                                >
                                    #{idx + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-900">{r.fullName}</p>
                                    <p className="text-xs text-violet-800">{r.propertyName}</p>
                                    <p
                                        className={cn(
                                            'text-2xl font-bold tabular-nums',
                                            communityScoreTone(r.communityScore).split(' ')[0],
                                        )}
                                    >
                                        {r.communityScore}
                                    </p>
                                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600">
                                        <span>
                                            Status: <span className="font-semibold text-slate-900">{r.residentStatus}</span>
                                        </span>
                                        <span>
                                            Open tickets:{' '}
                                            <span className="font-semibold tabular-nums">{r.openTickets}</span>
                                        </span>
                                        <span className="col-span-2">
                                            Portal:{' '}
                                            <span className="font-semibold">
                                                {r.portalAccessEnabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                            {r.tags.length > 0 ? (
                                                <span className="ml-2 text-violet-700">{r.tags.join(', ')}</span>
                                            ) : null}
                                        </span>
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

export function ResidentIntelligenceTable({ residents }: { residents: ResidentIntelRecord[] }) {
    return (
        <div id={RESIDENT_INTEL_SECTION_IDS.table} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="violet" aria-label="Resident intelligence table">
                <LeadsIntelAiSectionHeader
                    title="Resident & Community Intelligence"
                    subtitle="Single management view — occupancy, portal access, service load, tags, and AI recommendation."
                    variant="violet"
                />
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-violet-100/80 bg-violet-50/50">
                                <th className={th}>Resident</th>
                                <th className={th}>Property / unit</th>
                                <th className={th}>Status</th>
                                <th className={th}>Portal</th>
                                <th className={th}>Score</th>
                                <th className={th}>Open tickets</th>
                                <th className={th}>Tags</th>
                                <th className={th}>Risk</th>
                                <th className={th}>AI recommendation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {residents.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No residents match filters.
                                    </td>
                                </tr>
                            ) : (
                                residents.map((r, i) => {
                                    const overviewHref = getResidentIntelHref(r.residentSlug);
                                    const serviceHref = getResidentIntelHref(r.residentSlug, 'service');
                                    return (
                                        <tr key={r.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                            <td className={cn(td, 'font-semibold')}>
                                                <DemandClickableLink href={overviewHref} showArrow>
                                                    {r.fullName}
                                                </DemandClickableLink>
                                            </td>
                                            <td className={td}>{r.propertyUnit}</td>
                                            <td className={td}>
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold leading-none',
                                                        r.residentStatus === 'Active'
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                            : r.residentStatus === 'Inactive'
                                                              ? 'border-amber-200 bg-amber-50 text-amber-800'
                                                              : 'border-slate-200 bg-slate-50 text-slate-700',
                                                    )}
                                                >
                                                    {r.residentStatus}
                                                </span>
                                            </td>
                                            <td className={td}>
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold leading-none',
                                                        r.portalAccessEnabled
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                            : 'border-rose-200 bg-rose-50 text-rose-800',
                                                    )}
                                                >
                                                    {r.portalAccessEnabled ? 'On' : 'Off'}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'tabular-nums font-semibold')}>{r.communityScore}</td>
                                            <td className={td}>
                                                <DemandClickableLink href={serviceHref} className="tabular-nums">
                                                    {r.openTickets}
                                                </DemandClickableLink>
                                            </td>
                                            <td className={td}>
                                                {r.tags.length > 0 ? (
                                                    <span className="text-xs font-medium text-violet-800">{r.tags.join(', ')}</span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className={td}>
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold leading-none',
                                                        residentRiskClass(r.riskLevel),
                                                    )}
                                                >
                                                    {r.riskLevel}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'text-xs font-semibold text-violet-900')}>
                                                <DemandClickableLink href={overviewHref} className="inline-flex items-center gap-1">
                                                    {r.aiRecommendation}
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
