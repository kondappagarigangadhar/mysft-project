'use client';

import React from 'react';
import Link from 'next/link';
import {
    LuActivity,
    LuArrowRight,
    LuIndianRupee,
    LuShieldAlert,
    LuSparkles,
    LuTarget,
    LuTrendingDown,
    LuTrendingUp,
    LuZap,
} from 'react-icons/lu';
import { LeadsIntelAiPanel, LeadsIntelAiSectionHeader } from '@/components/leads-intelligence/leadsIntelligenceUi';
import type { AISalesOpportunityRow } from '@/lib/aiSalesIntelligenceHelpers';
import { formatAISalesPercent, formatAISalesRevenue } from '@/lib/aiSalesIntelligenceHelpers';
import { leadProfileHref } from '@/lib/leadRoutes';
import {
    formatRevenueDisplay,
    type AIRecommendationRow,
    type FunnelBottleneck,
    type NextBestActionRow,
    type RevenueLeakageBucket,
    type RevenueRiskRow,
    type RevenueSummaryPayload,
    type SalespersonIntelCard,
} from '@/lib/revenueIntelligenceHelpers';
import type { AISalesFunnelStep } from '@/lib/aiSalesIntelligenceHelpers';
import { cn } from '@/lib/utils';

const thClass = 'whitespace-nowrap px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500';
const tdClass = 'border-t border-slate-100 px-2.5 py-2 text-xs text-slate-800';

function CompactTable({ children, minWidth = 'min-w-[640px]' }: { children: React.ReactNode; minWidth?: string }) {
    return (
        <div className="overflow-x-auto">
            <table className={cn('w-full text-left', minWidth)}>{children}</table>
        </div>
    );
}

function LeadLink({ name, slug }: { name: string; slug: string }) {
    return (
        <Link href={leadProfileHref(slug)} className="font-semibold text-[var(--cta-button-bg)] hover:underline">
            {name}
        </Link>
    );
}

// —— Section 1 ——
export function RevenueAiSummarySection({ summary, empty }: { summary: RevenueSummaryPayload; empty: boolean }) {
    const cards = [
        { title: 'Forecast Revenue', value: empty ? '—' : formatRevenueDisplay(summary.forecastRevenueLakhs), icon: LuIndianRupee, tone: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
        { title: 'Revenue At Risk', value: empty ? '—' : formatRevenueDisplay(summary.revenueAtRiskLakhs), icon: LuShieldAlert, tone: 'border-rose-200 bg-rose-50 text-rose-900', emphasize: true },
        { title: 'Expected Closures', value: empty ? '—' : String(summary.expectedClosures), icon: LuTarget, tone: 'border-violet-200 bg-violet-50 text-violet-900' },
        { title: 'Hot Opportunities', value: empty ? '—' : String(summary.hotOpportunities), icon: LuZap, tone: 'border-orange-200 bg-orange-50 text-orange-900' },
        { title: 'Pipeline Health', value: empty ? '—' : `${summary.pipelineHealth}%`, icon: LuActivity, tone: 'border-sky-200 bg-sky-50 text-sky-900' },
        { title: 'Sales Productivity', value: empty ? '—' : String(summary.salesProductivity), icon: LuTrendingUp, tone: 'border-amber-200 bg-amber-50 text-amber-900' },
    ];

    return (
        <section aria-label="AI revenue summary" className="rounded-2xl border border-violet-200/60 bg-white p-4 ring-1 ring-violet-100/50 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
                    <LuSparkles size={12} aria-hidden />
                    AI Revenue Summary
                </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900 sm:text-base">
                {empty ? 'No leads in this view — adjust filters to surface revenue intelligence.' : summary.narrative}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-6">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.title}
                            className={cn(
                                'flex min-h-[76px] flex-col rounded-xl border p-2.5',
                                card.tone,
                                'emphasize' in card && card.emphasize && 'ring-2 ring-rose-300/60',
                            )}
                        >
                            <div className="flex items-center justify-between gap-1">
                                <p className="text-[9px] font-bold uppercase tracking-wide opacity-80">{card.title}</p>
                                <Icon size={13} aria-hidden />
                            </div>
                            <p className="mt-auto pt-1 text-lg font-bold tabular-nums">{card.value}</p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

// —— Section 2 ——
export function RevenueRiskCenterSection({ rows }: { rows: RevenueRiskRow[] }) {
    return (
        <LeadsIntelAiPanel variant="rose" aria-label="Revenue risk center">
            <LeadsIntelAiSectionHeader
                title="Revenue Risk Center"
                subtitle="Executive attention + behavior signals — sorted by revenue impact"
                variant="rose"
                badge="At risk"
            />
            {rows.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-500">No revenue risks in the current filter view.</p>
            ) : (
                <CompactTable minWidth="min-w-[720px]">
                    <thead className="bg-slate-50/80">
                        <tr>
                            <th className={thClass}>Lead</th>
                            <th className={thClass}>Risk reason</th>
                            <th className={thClass}>Revenue impact</th>
                            <th className={thClass}>Days inactive</th>
                            <th className={thClass}>Suggested action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/60">
                                <td className={tdClass}>
                                    <LeadLink name={row.leadName} slug={row.leadSlug} />
                                </td>
                                <td className={cn(tdClass, 'max-w-[140px]')}>{row.riskReason}</td>
                                <td className={cn(tdClass, 'font-semibold tabular-nums text-rose-800')}>
                                    {formatRevenueDisplay(row.revenueImpactLakhs)}
                                </td>
                                <td className={cn(tdClass, 'tabular-nums')}>{row.daysInactive}d</td>
                                <td className={cn(tdClass, 'text-slate-600')}>{row.suggestedAction}</td>
                            </tr>
                        ))}
                    </tbody>
                </CompactTable>
            )}
        </LeadsIntelAiPanel>
    );
}

// —— Section 3 ——
export function OpportunityPrioritizationSection({ rows }: { rows: AISalesOpportunityRow[] }) {
    return (
        <LeadsIntelAiPanel variant="indigo" aria-label="AI opportunity prioritization">
            <LeadsIntelAiSectionHeader
                title="AI Opportunity Prioritization"
                subtitle="Top 20 opportunities by expected revenue and conversion probability"
                variant="indigo"
                badge="Top 20"
            />
            <div className="max-h-[280px] overflow-auto">
                <CompactTable minWidth="min-w-[800px]">
                    <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm">
                        <tr>
                            <th className={thClass}>Lead</th>
                            <th className={thClass}>Project</th>
                            <th className={thClass}>Score</th>
                            <th className={thClass}>Conv. %</th>
                            <th className={thClass}>Potential revenue</th>
                            <th className={thClass}>Rank</th>
                            <th className={thClass}>Next best action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/60">
                                <td className={tdClass}>
                                    <LeadLink name={row.name} slug={row.leadSlug} />
                                </td>
                                <td className={tdClass}>{row.project}</td>
                                <td className={cn(tdClass, 'font-bold tabular-nums')}>{row.leadScore}</td>
                                <td className={cn(tdClass, 'tabular-nums')}>{formatAISalesPercent(row.conversionProbability)}</td>
                                <td className={cn(tdClass, 'font-semibold tabular-nums text-emerald-800')}>
                                    {formatAISalesRevenue(row.expectedRevenueLakhs)}
                                </td>
                                <td className={cn(tdClass, 'font-bold tabular-nums text-violet-700')}>#{row.priorityRank}</td>
                                <td className={tdClass}>{row.nextBestAction}</td>
                            </tr>
                        ))}
                    </tbody>
                </CompactTable>
            </div>
        </LeadsIntelAiPanel>
    );
}

// —— Section 4 ——
export function NextBestActionQueueSection({ rows }: { rows: NextBestActionRow[] }) {
    return (
        <LeadsIntelAiPanel variant="cyan" aria-label="Next best action queue">
            <LeadsIntelAiSectionHeader
                title="Next Best Action Queue"
                subtitle="Top 7 AI-generated daily actions for the sales team"
                variant="cyan"
                badge="Top 7"
            />
            <CompactTable minWidth="min-w-[720px]">
                <thead className="bg-slate-50/80">
                    <tr>
                        <th className={thClass}>Lead</th>
                        <th className={thClass}>Reason</th>
                        <th className={thClass}>Suggested action</th>
                        <th className={thClass}>Expected outcome</th>
                        <th className={thClass}>Confidence</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-500">
                                No actions queued for the current filters.
                            </td>
                        </tr>
                    ) : null}
                    {rows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/60">
                            <td className={tdClass}>
                                <LeadLink name={row.leadName} slug={row.leadSlug} />
                            </td>
                            <td className={cn(tdClass, 'max-w-[120px] text-slate-600')}>{row.reason}</td>
                            <td className={cn(tdClass, 'font-semibold')}>{row.suggestedAction}</td>
                            <td className={cn(tdClass, 'text-slate-600')}>{row.expectedOutcome}</td>
                            <td className={cn(tdClass, 'tabular-nums font-bold')}>{row.confidence}%</td>
                        </tr>
                    ))}
                </tbody>
            </CompactTable>
        </LeadsIntelAiPanel>
    );
}

// —— Section 5 ——
export function SalespersonIntelligenceSection({ cards }: { cards: SalespersonIntelCard[] }) {
    return (
        <LeadsIntelAiPanel variant="amber" aria-label="Salesperson intelligence">
            <LeadsIntelAiSectionHeader
                title="Salesperson Intelligence"
                subtitle="Team performance merged with AI follow-up and pipeline signals"
                variant="amber"
                badge="Team"
            />
            <div className="flex gap-3 overflow-x-auto p-4 pb-5">
                {cards.length === 0 ? (
                    <p className="text-sm text-slate-500">No assignee data in this view.</p>
                ) : (
                    cards.map((rep) => (
                        <div
                            key={rep.name}
                            className={cn(
                                'min-w-[200px] shrink-0 rounded-xl border p-3',
                                rep.badge === 'Needs Attention'
                                    ? 'border-rose-200 bg-rose-50/50'
                                    : rep.badge === 'Top Performer'
                                      ? 'border-emerald-200 bg-emerald-50/50'
                                      : 'border-slate-200 bg-slate-50/50',
                            )}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p className="font-bold text-slate-900">{rep.name}</p>
                                {rep.badge ? (
                                    <span
                                        className={cn(
                                            'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase',
                                            rep.badge === 'Top Performer'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-rose-100 text-rose-800',
                                        )}
                                    >
                                        {rep.badge}
                                    </span>
                                ) : null}
                            </div>
                            <dl className="mt-2 space-y-1.5 text-[11px]">
                                <div className="flex justify-between gap-2">
                                    <dt className="text-slate-500">Conversion</dt>
                                    <dd className="font-bold tabular-nums">{rep.conversionPct}%</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt className="text-slate-500">Revenue closed</dt>
                                    <dd className="font-semibold tabular-nums">{formatRevenueDisplay(rep.revenueClosedLakhs)}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt className="text-slate-500">Follow-up quality</dt>
                                    <dd className="font-bold tabular-nums">{rep.followUpQuality}%</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt className="text-slate-500">Pipeline health</dt>
                                    <dd className="font-bold tabular-nums">{rep.pipelineHealth}%</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <dt className="text-slate-500">Risk level</dt>
                                    <dd
                                        className={cn(
                                            'font-bold',
                                            rep.riskLevel === 'High' ? 'text-rose-700' : rep.riskLevel === 'Medium' ? 'text-amber-700' : 'text-emerald-700',
                                        )}
                                    >
                                        {rep.riskLevel}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    ))
                )}
            </div>
        </LeadsIntelAiPanel>
    );
}

// —— Section 6 ——
export function LeadFunnelIntelligenceSection({
    steps,
    bottleneck,
}: {
    steps: AISalesFunnelStep[];
    bottleneck: FunnelBottleneck | null;
}) {
    return (
        <LeadsIntelAiPanel variant="violet" aria-label="Lead funnel intelligence">
            <LeadsIntelAiSectionHeader
                title="Lead Funnel Intelligence"
                subtitle="Stage counts, conversion, drop-off, and revenue impact"
                variant="violet"
            />
            {bottleneck ? (
                <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-900">
                    <LuTrendingDown size={16} className="mt-0.5 shrink-0" aria-hidden />
                    <span>
                        <strong>AI bottleneck:</strong> {bottleneck.message}
                    </span>
                </div>
            ) : null}
            <CompactTable>
                <thead className="bg-slate-50/80">
                    <tr>
                        <th className={thClass}>Stage</th>
                        <th className={thClass}>Count</th>
                        <th className={thClass}>Conversion %</th>
                        <th className={thClass}>Drop-off %</th>
                        <th className={thClass}>Revenue impact</th>
                    </tr>
                </thead>
                <tbody>
                    {steps.map((step) => (
                        <tr key={step.key} className="hover:bg-slate-50/60">
                            <td className={cn(tdClass, 'font-semibold')}>
                                {step.key === 'leads' ? 'Lead Created' : step.label}
                            </td>
                            <td className={cn(tdClass, 'tabular-nums')}>{step.count}</td>
                            <td className={cn(tdClass, 'tabular-nums')}>{step.conversionPct != null ? `${step.conversionPct}%` : '—'}</td>
                            <td className={cn(tdClass, 'tabular-nums text-rose-700')}>
                                {step.dropOffPct != null ? `${step.dropOffPct}%` : '—'}
                            </td>
                            <td className={cn(tdClass, 'font-semibold tabular-nums')}>{formatAISalesRevenue(step.revenueImpactLakhs)}</td>
                        </tr>
                    ))}
                </tbody>
            </CompactTable>
        </LeadsIntelAiPanel>
    );
}

// —— Section 7 ——
export function RevenueLeakageMonitorSection({ buckets }: { buckets: RevenueLeakageBucket[] }) {
    const totalLoss = buckets.reduce((s, b) => s + b.valueLakhs, 0);
    return (
        <LeadsIntelAiPanel variant="rose" aria-label="Revenue leakage monitor">
            <LeadsIntelAiSectionHeader
                title="Revenue Leakage Monitor"
                subtitle="Estimated potential revenue loss by leakage type"
                variant="rose"
                badge="Leakage"
            />
            <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-600">
                AI estimates <strong className="text-rose-800">{formatRevenueDisplay(totalLoss)}</strong> at risk across pipeline gaps.
            </p>
            <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {buckets.map((b) => (
                    <div key={b.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800">{b.label}</p>
                            <p className="text-[10px] text-slate-500">{b.leadCount} lead{b.leadCount === 1 ? '' : 's'}</p>
                        </div>
                        <p className="shrink-0 text-sm font-bold tabular-nums text-rose-800">{formatRevenueDisplay(b.valueLakhs)}</p>
                    </div>
                ))}
            </div>
        </LeadsIntelAiPanel>
    );
}

// —— Section 8 ——
export function AIRecommendationsSection({ rows }: { rows: AIRecommendationRow[] }) {
    const prioClass = {
        Critical: 'border-rose-200 bg-rose-50 text-rose-900',
        High: 'border-orange-200 bg-orange-50 text-orange-900',
        Medium: 'border-slate-200 bg-slate-50 text-slate-800',
    };

    return (
        <LeadsIntelAiPanel variant="emerald" aria-label="AI recommendations">
            <LeadsIntelAiSectionHeader
                title="AI Recommendations"
                subtitle="Top actions to protect and accelerate revenue today"
                variant="emerald"
                badge="Max 10"
            />
            <ul className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                    <li className="px-4 py-6 text-sm text-slate-500">No recommendations for the current filters.</li>
                ) : (
                    rows.map((rec) => (
                        <li key={rec.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/50">
                            <span className={cn('mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase', prioClass[rec.priority])}>
                                {rec.priority}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-900">{rec.text}</p>
                                <p className="mt-0.5 text-[11px] text-slate-500">Impact: {formatRevenueDisplay(rec.impactLakhs)}</p>
                            </div>
                            <LuArrowRight size={16} className="mt-1 shrink-0 text-slate-400" aria-hidden />
                        </li>
                    ))
                )}
            </ul>
        </LeadsIntelAiPanel>
    );
}
