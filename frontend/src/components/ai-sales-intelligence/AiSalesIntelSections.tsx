'use client';

import React from 'react';
import Link from 'next/link';
import {
    LuActivity,
    LuArrowRight,
    LuBrain,
    LuFlame,
    LuSnowflake,
    LuTarget,
    LuThermometer,
    LuTrendingUp,
    LuZap,
} from 'react-icons/lu';
import { IntelligenceKpiCard } from '@/components/crm-intelligence/IntelligenceKpiCard';
import { LeadsIntelAiPanel, LeadsIntelAiSectionHeader } from '@/components/leads-intelligence/leadsIntelligenceUi';
import type { AISalesIntelligenceLead } from '@/lib/aiSalesIntelligenceStore';
import {
    AI_SALES_PRIORITY_CLASS,
    AI_SALES_STATUS_CLASS,
    AI_SALES_TEMPERATURE_CLASS,
    FEATURE_STORE_LABELS,
    type AISalesBehaviorRow,
    type AISalesFunnelStep,
    type AISalesModelPerformance,
    type AISalesOpportunityRow,
    type AISalesTemperatureBucket,
    formatAISalesPercent,
    formatAISalesRevenue,
} from '@/lib/aiSalesIntelligenceHelpers';
import { cn } from '@/lib/utils';

function TempBadge({ temp }: { temp: AISalesIntelligenceLead['leadTemperature'] }) {
    return (
        <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold', AI_SALES_TEMPERATURE_CLASS[temp])}>
            {temp}
        </span>
    );
}

function ScoreCell({ score }: { score: number }) {
    return (
        <div className="flex min-w-[88px] items-center gap-2">
            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                    style={{ width: `${Math.min(100, score)}%` }}
                />
            </div>
            <span className="text-xs font-bold tabular-nums text-slate-800">{score}</span>
        </div>
    );
}

function IntelTable({
    children,
    minWidth = 'min-w-[720px]',
}: {
    children: React.ReactNode;
    minWidth?: string;
}) {
    return (
        <div className="overflow-x-auto">
            <table className={cn('w-full text-left text-xs', minWidth)}>
                {children}
            </table>
        </div>
    );
}

const thClass = 'whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500';
const tdClass = 'border-t border-slate-100 px-3 py-2.5 text-slate-800';

// —— Section 1 ——
export function AiSalesModelPerformanceDashboard({ kpis }: { kpis: AISalesModelPerformance }) {
    const cards = [
        { title: 'Total Leads Analyzed', value: kpis.totalLeadsAnalyzed, icon: LuBrain, accent: 'violet' as const },
        { title: 'Average Lead Score', value: kpis.averageLeadScore, icon: LuTarget, accent: 'blue' as const },
        {
            title: 'Avg Conversion Probability',
            value: formatAISalesPercent(kpis.averageConversionProbability),
            icon: LuTrendingUp,
            accent: 'green' as const,
        },
        { title: 'Hot Leads', value: kpis.hotLeads, icon: LuFlame, accent: 'red' as const, sublabel: 'Score > 75' },
        { title: 'Warm Leads', value: kpis.warmLeads, icon: LuThermometer, accent: 'orange' as const, sublabel: 'Score 40–75' },
        { title: 'Cold Leads', value: kpis.coldLeads, icon: LuSnowflake, accent: 'blue' as const, sublabel: 'Score < 40' },
        {
            title: 'High Priority Opportunities',
            value: kpis.highPriorityOpportunities,
            icon: LuZap,
            accent: 'orange' as const,
        },
        {
            title: 'Immediate Attention',
            value: kpis.leadsRequiringImmediateAttention,
            icon: LuActivity,
            accent: 'red' as const,
        },
    ];

    return (
        <LeadsIntelAiPanel variant="violet" aria-label="AI model performance">
            <LeadsIntelAiSectionHeader
                title="AI Model Performance Dashboard"
                subtitle="Overall AI lead quality metrics from scoring and prediction engines"
                variant="violet"
                badge="Live model"
            />
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((c) => (
                    <IntelligenceKpiCard
                        key={c.title}
                        title={c.title}
                        value={c.value}
                        sublabel={c.sublabel}
                        icon={c.icon}
                        accent={c.accent}
                    />
                ))}
            </div>
        </LeadsIntelAiPanel>
    );
}

// —— Section 2 ——
export function AiSalesConversionPredictionCenter({
    leads,
    selectedSlug,
    onSelectLead,
    onOpenInsights,
    maxRows,
    compact = false,
}: {
    leads: AISalesIntelligenceLead[];
    selectedSlug: string | null;
    onSelectLead: (slug: string) => void;
    onOpenInsights: (lead: AISalesIntelligenceLead) => void;
    /** When set, only the top N leads are shown (already sorted by caller). */
    maxRows?: number;
    /** Fewer columns — for executive dashboards (Revenue Intelligence). */
    compact?: boolean;
}) {
    const visibleLeads = maxRows != null ? leads.slice(0, maxRows) : leads;

    return (
        <LeadsIntelAiPanel variant="indigo" aria-label="Lead conversion prediction">
            <LeadsIntelAiSectionHeader
                title="Lead Conversion Prediction Center"
                subtitle={
                    compact
                        ? `Top ${visibleLeads.length} leads by conversion probability — click a row for score breakdown`
                        : 'Leads ranked by AI conversion probability — who is most likely to convert'
                }
                variant="indigo"
                badge={compact ? `Top ${maxRows ?? visibleLeads.length}` : undefined}
            />
            <IntelTable minWidth={compact ? 'min-w-0' : 'min-w-[1100px]'}>
                <thead className="bg-slate-50/80">
                    <tr>
                        {(compact
                            ? ['Lead', 'Score', 'Conv. %', 'Temp.', 'Revenue', 'Next action']
                            : [
                                  'Lead Name',
                                  'Project',
                                  'Lead Source',
                                  'Lead Score',
                                  'Conversion Probability',
                                  'Temperature',
                                  'Predicted Revenue',
                                  'Next Best Action',
                                  'Confidence',
                                  'AI Status',
                                  '',
                              ]
                        ).map((h) => (
                            <th key={h} className={thClass}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {visibleLeads.length === 0 ? (
                        <tr>
                            <td colSpan={compact ? 6 : 11} className="px-3 py-8 text-center text-sm text-slate-500">
                                No leads match the current filters.
                            </td>
                        </tr>
                    ) : (
                        visibleLeads.map((lead) => (
                            <tr
                                key={lead.id}
                                className={cn(
                                    'cursor-pointer transition-colors hover:bg-violet-50/50',
                                    selectedSlug === lead.leadSlug && 'bg-violet-50/80',
                                )}
                                onClick={() => onSelectLead(lead.leadSlug)}
                            >
                                <td className={cn(tdClass, 'min-w-[140px] font-semibold')}>
                                    <button
                                        type="button"
                                        className="text-left text-violet-700 hover:underline"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenInsights(lead);
                                        }}
                                    >
                                        {lead.name}
                                    </button>
                                    {compact ? (
                                        <p className="mt-0.5 truncate text-[10px] font-normal text-slate-500">{lead.project}</p>
                                    ) : null}
                                </td>
                                {!compact ? <td className={tdClass}>{lead.project}</td> : null}
                                {!compact ? <td className={tdClass}>{lead.leadSource}</td> : null}
                                <td className={tdClass}>
                                    <ScoreCell score={lead.leadScore} />
                                </td>
                                <td className={cn(tdClass, 'font-bold tabular-nums text-emerald-700')}>
                                    {formatAISalesPercent(lead.conversionProbability)}
                                </td>
                                <td className={tdClass}>
                                    <TempBadge temp={lead.leadTemperature} />
                                </td>
                                <td className={cn(tdClass, 'font-semibold tabular-nums whitespace-nowrap')}>
                                    {formatAISalesRevenue(lead.predictedRevenueLakhs)}
                                </td>
                                <td className={cn(tdClass, compact ? 'max-w-[120px] truncate' : 'max-w-[180px]')}>
                                    {lead.nextBestAction}
                                </td>
                                {!compact ? (
                                    <>
                                        <td className={cn(tdClass, 'tabular-nums')}>{formatAISalesPercent(lead.confidenceScore)}</td>
                                        <td className={tdClass}>
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold',
                                                    AI_SALES_STATUS_CLASS[lead.aiStatus],
                                                )}
                                            >
                                                {lead.aiStatus}
                                            </span>
                                        </td>
                                        <td className={tdClass}>
                                            <Link
                                                href={`/leads/view/${encodeURIComponent(lead.leadSlug)}`}
                                                className="text-[11px] font-semibold text-[#0092ff] hover:underline"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </>
                                ) : null}
                            </tr>
                        ))
                    )}
                </tbody>
            </IntelTable>
        </LeadsIntelAiPanel>
    );
}

// —— Section 3 ——
export function AiSalesScoringBreakdown({
    lead,
}: {
    lead: AISalesIntelligenceLead | null;
}) {
    return (
        <LeadsIntelAiPanel variant="cyan" aria-label="Lead scoring breakdown">
            <LeadsIntelAiSectionHeader
                title="Lead Scoring Breakdown"
                subtitle="AI score drivers — how the model calculated the lead score"
                variant="cyan"
            />
            {!lead ? (
                <p className="p-6 text-sm text-slate-500">Select a lead from the conversion prediction table to view score drivers.</p>
            ) : (
                <div className="space-y-4 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-200/60 bg-cyan-50/40 px-4 py-3">
                        <div>
                            <p className="text-xs font-semibold text-slate-600">{lead.name}</p>
                            <p className="text-[10px] text-slate-500">{lead.project}</p>
                        </div>
                        <p className="text-3xl font-bold text-cyan-800">
                            Lead Score = {lead.leadScore}
                        </p>
                    </div>
                    <div className="space-y-3">
                        {FEATURE_STORE_LABELS.map(({ key, label, weight }) => {
                            const value = lead.featureStore[key];
                            return (
                                <div key={key}>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-slate-700">
                                            {label} <span className="text-slate-400">({weight})</span>
                                        </span>
                                        <span className="font-bold tabular-nums text-slate-900">{value}</span>
                                    </div>
                                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500"
                                            style={{ width: `${Math.min(100, value)}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </LeadsIntelAiPanel>
    );
}

// —— Section 4 ——
export function AiSalesOpportunityPrioritization({ rows }: { rows: AISalesOpportunityRow[] }) {
    return (
        <LeadsIntelAiPanel variant="emerald" aria-label="AI opportunity prioritization">
            <LeadsIntelAiSectionHeader
                title="AI Opportunity Prioritization"
                subtitle="Leads ranked by expected business value — highest value first"
                variant="emerald"
            />
            <IntelTable>
                <thead className="bg-slate-50/80">
                    <tr>
                        {[
                            'Lead',
                            'Potential Revenue',
                            'Lead Score',
                            'Conversion Probability',
                            'Expected Revenue',
                            'Priority Rank',
                            'Recommended Action',
                        ].map((h) => (
                            <th key={h} className={thClass}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.slice(0, 12).map((row) => (
                        <tr key={row.id} className="hover:bg-emerald-50/40">
                            <td className={cn(tdClass, 'font-semibold')}>{row.name}</td>
                            <td className={cn(tdClass, 'tabular-nums font-semibold')}>
                                {formatAISalesRevenue(row.predictedRevenueLakhs)}
                            </td>
                            <td className={tdClass}>
                                <ScoreCell score={row.leadScore} />
                            </td>
                            <td className={cn(tdClass, 'tabular-nums font-semibold text-emerald-700')}>
                                {formatAISalesPercent(row.conversionProbability)}
                            </td>
                            <td className={cn(tdClass, 'tabular-nums font-bold')}>
                                {formatAISalesRevenue(row.expectedRevenueLakhs)}
                            </td>
                            <td className={cn(tdClass, 'text-center font-bold text-emerald-800')}>#{row.priorityRank}</td>
                            <td className={tdClass}>{row.nextBestAction}</td>
                        </tr>
                    ))}
                </tbody>
            </IntelTable>
        </LeadsIntelAiPanel>
    );
}

// —— Section 5 ——
export function AiSalesTemperatureDistribution({ buckets }: { buckets: AISalesTemperatureBucket[] }) {
    const colors: Record<string, string> = {
        Hot: 'from-red-500 to-orange-500',
        Warm: 'from-amber-500 to-yellow-500',
        Cold: 'from-blue-500 to-cyan-500',
    };
    const total = buckets.reduce((s, b) => s + b.count, 0) || 1;

    return (
        <LeadsIntelAiPanel variant="amber" aria-label="Lead temperature distribution">
            <LeadsIntelAiSectionHeader
                title="Lead Temperature Distribution"
                subtitle="Visual overview of hot, warm, and cold lead segments"
                variant="amber"
            />
            <div className="grid gap-4 p-4 sm:grid-cols-3">
                {buckets.map((b) => (
                    <div key={b.temperature} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                        <div className="flex items-center justify-between">
                            <TempBadge temp={b.temperature} />
                            <span className="text-2xl font-bold tabular-nums text-slate-900">{b.count}</span>
                        </div>
                        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200/80">
                            <div
                                className={cn('h-full rounded-full bg-gradient-to-r', colors[b.temperature])}
                                style={{ width: `${(b.count / total) * 100}%` }}
                            />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-600">{b.percentage}% of analyzed leads</p>
                    </div>
                ))}
            </div>
            <div className="border-t border-slate-100 px-4 pb-4">
                <div className="flex h-4 overflow-hidden rounded-full">
                    {buckets.map((b) =>
                        b.count > 0 ? (
                            <div
                                key={b.temperature}
                                className={cn('h-full bg-gradient-to-r', colors[b.temperature])}
                                style={{ width: `${(b.count / total) * 100}%` }}
                                title={`${b.temperature}: ${b.percentage}%`}
                            />
                        ) : null,
                    )}
                </div>
                <p className="mt-2 text-center text-[10px] font-medium text-slate-500">
                    Hot &gt; 75 · Warm 40–75 · Cold &lt; 40 (lead score bands)
                </p>
            </div>
        </LeadsIntelAiPanel>
    );
}

// —— Section 6 ——
export function AiSalesNextBestActionCenter({ leads }: { leads: AISalesIntelligenceLead[] }) {
    return (
        <LeadsIntelAiPanel variant="rose" aria-label="Next best action center">
            <LeadsIntelAiSectionHeader
                title="Next Best Action Center"
                subtitle="AI recommendation engine — what to do next and why"
                variant="rose"
            />
            <IntelTable>
                <thead className="bg-slate-50/80">
                    <tr>
                        {['Lead Name', 'Reason', 'Suggested Action', 'Revenue Impact', 'Confidence'].map((h) => (
                            <th key={h} className={thClass}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-rose-50/30">
                            <td className={cn(tdClass, 'font-semibold')}>{lead.name}</td>
                            <td className={cn(tdClass, 'max-w-[220px] text-slate-600')}>{lead.nextBestActionReason}</td>
                            <td className={cn(tdClass, 'font-semibold text-rose-800')}>{lead.nextBestAction}</td>
                            <td className={cn(tdClass, 'tabular-nums font-semibold')}>
                                {formatAISalesRevenue(lead.expectedRevenueImpactLakhs)}
                            </td>
                            <td className={cn(tdClass, 'tabular-nums')}>{formatAISalesPercent(lead.confidenceScore)}</td>
                        </tr>
                    ))}
                </tbody>
            </IntelTable>
        </LeadsIntelAiPanel>
    );
}

// —— Section 7 ——
export function AiSalesBehaviorAnalysis({ rows }: { rows: AISalesBehaviorRow[] }) {
    const severityClass = {
        High: 'text-red-700 bg-red-50 border-red-200',
        Medium: 'text-amber-700 bg-amber-50 border-amber-200',
        Low: 'text-slate-600 bg-slate-50 border-slate-200',
    };
    return (
        <LeadsIntelAiPanel variant="violet" aria-label="Lead behavior analysis">
            <LeadsIntelAiSectionHeader
                title="Lead Behavior Analysis"
                subtitle="Detect inactivity, response gaps, and engagement decline"
                variant="violet"
            />
            {rows.length === 0 ? (
                <p className="p-6 text-sm text-emerald-700">No behavioral risk signals in the current filter scope.</p>
            ) : (
                <IntelTable>
                    <thead className="bg-slate-50/80">
                        <tr>
                            {['Lead', 'Issue', 'AI Recommendation', 'Severity'].map((h) => (
                                <th key={h} className={thClass}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.slice(0, 15).map((row) => (
                            <tr key={row.id} className="hover:bg-violet-50/30">
                                <td className={cn(tdClass, 'font-semibold')}>
                                    <Link href={`/leads/view/${encodeURIComponent(row.leadSlug)}`} className="text-violet-700 hover:underline">
                                        {row.leadName}
                                    </Link>
                                </td>
                                <td className={tdClass}>{row.issue}</td>
                                <td className={cn(tdClass, 'text-slate-700')}>{row.recommendation}</td>
                                <td className={tdClass}>
                                    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold', severityClass[row.severity])}>
                                        {row.severity}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </IntelTable>
            )}
        </LeadsIntelAiPanel>
    );
}

// —— Section 8 ——
export function AiSalesConversionFunnel({ steps }: { steps: AISalesFunnelStep[] }) {
    return (
        <LeadsIntelAiPanel variant="indigo" aria-label="Conversion funnel intelligence">
            <LeadsIntelAiSectionHeader
                title="Lead Conversion Funnel Intelligence"
                subtitle="Stage-through rates, drop-off, and revenue impact"
                variant="indigo"
            />
            <div className="flex flex-col gap-2 p-4">
                {steps.map((step, i) => (
                    <React.Fragment key={step.key}>
                        <div className="flex flex-col gap-2 rounded-xl border border-indigo-100/80 bg-gradient-to-r from-indigo-50/50 to-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-indigo-900">{step.label}</p>
                                <p className="text-2xl font-bold tabular-nums text-slate-900">{step.count}</p>
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs">
                                {step.conversionPct != null ? (
                                    <span className="font-semibold text-emerald-700">Conversion {step.conversionPct}%</span>
                                ) : (
                                    <span className="text-slate-400">Entry</span>
                                )}
                                {step.dropOffPct != null && step.dropOffPct > 0 ? (
                                    <span className="font-semibold text-rose-600">Drop-off {step.dropOffPct}%</span>
                                ) : null}
                                <span className="font-semibold text-slate-700">
                                    Revenue impact {formatAISalesRevenue(step.revenueImpactLakhs)}
                                </span>
                            </div>
                        </div>
                        {i < steps.length - 1 ? (
                            <div className="flex justify-center py-0.5" aria-hidden>
                                <LuArrowRight className="h-4 w-4 rotate-90 text-slate-300" />
                            </div>
                        ) : null}
                    </React.Fragment>
                ))}
            </div>
        </LeadsIntelAiPanel>
    );
}

// —— Section 9 ——
export function AiSalesRecommendationQueue({ leads }: { leads: AISalesIntelligenceLead[] }) {
    return (
        <LeadsIntelAiPanel variant="emerald" aria-label="AI recommendation queue">
            <LeadsIntelAiSectionHeader
                title="AI Recommendation Queue"
                subtitle="Actionable tasks prioritized by AI — contact, visit, proposal, and escalation"
                variant="emerald"
                badge="Action queue"
            />
            <IntelTable>
                <thead className="bg-slate-50/80">
                    <tr>
                        {['Lead', 'Recommendation', 'Priority', 'Confidence', 'Expected Outcome'].map((h) => (
                            <th key={h} className={thClass}>
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-emerald-50/40">
                            <td className={cn(tdClass, 'font-semibold')}>{lead.name}</td>
                            <td className={cn(tdClass, 'font-semibold text-emerald-800')}>{lead.queueRecommendation}</td>
                            <td className={tdClass}>
                                <span
                                    className={cn(
                                        'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold',
                                        AI_SALES_PRIORITY_CLASS[lead.queuePriority],
                                    )}
                                >
                                    {lead.queuePriority}
                                </span>
                            </td>
                            <td className={cn(tdClass, 'tabular-nums')}>{formatAISalesPercent(lead.confidenceScore)}</td>
                            <td className={cn(tdClass, 'text-slate-600')}>{lead.queueExpectedOutcome}</td>
                        </tr>
                    ))}
                </tbody>
            </IntelTable>
        </LeadsIntelAiPanel>
    );
}
