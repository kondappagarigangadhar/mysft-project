'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    AI_INSIGHTS_DEFAULT_LABELS,
    type AIInsightsLabels,
    type AnalyticsDetailedIssue,
    type AnalyticsDetailedMetrics,
    type AnalyticsDetailedPayload,
    fetchAnalyticsDetailed,
    resolveIssueHref,
    resolveMetricHref,
    resolveOpportunityHref,
    resolveRiskCardHref,
    resolveRiskSegmentHref,
    resolveSummaryHref,
} from '@/lib/aiAnalytics.service';
import { cn } from '@/lib/utils';
import { AISkeletonShimmer } from '@/components/ai/AISkeletonShimmer';
import { LuArrowDownRight, LuArrowRight, LuArrowUpRight, LuExternalLink, LuSparkles } from 'react-icons/lu';

const METRIC_ORDER: (keyof AnalyticsDetailedMetrics)[] = [
    'overduePayments',
    'inactiveLeads',
    'highRiskBookings',
    'opportunities',
];

function mergeLabels(partial?: Partial<AIInsightsLabels>): AIInsightsLabels {
    return {
        ...AI_INSIGHTS_DEFAULT_LABELS,
        ...partial,
        metrics: { ...AI_INSIGHTS_DEFAULT_LABELS.metrics, ...partial?.metrics },
        columns: { ...AI_INSIGHTS_DEFAULT_LABELS.columns, ...partial?.columns },
    };
}

function severityTone(severity: string): 'red' | 'amber' | 'emerald' | 'slate' {
    const s = severity.toLowerCase();
    if (s.includes('high') || s.includes('critical')) return 'red';
    if (s.includes('medium') || s.includes('moderate')) return 'amber';
    if (s.includes('low')) return 'emerald';
    return 'slate';
}

function severityBadgeClass(tone: ReturnType<typeof severityTone>): string {
    switch (tone) {
        case 'red':
            return 'bg-red-50 text-red-800 ring-red-200/80';
        case 'amber':
            return 'bg-amber-50 text-amber-900 ring-amber-200/80';
        case 'emerald':
            return 'bg-emerald-50 text-emerald-900 ring-emerald-200/80';
        default:
            return 'bg-slate-100 text-slate-700 ring-slate-200/80';
    }
}

function formatUpdated(iso?: string): string {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        return new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(d);
    } catch {
        return '—';
    }
}

function RiskStackedBar({
    low,
    medium,
    high,
    labels,
    segmentHrefs,
}: {
    low: number;
    medium: number;
    high: number;
    labels: AIInsightsLabels;
    segmentHrefs: { low: string; medium: string; high: string };
}) {
    const total = low + medium + high || 1;
    const pLow = (low / total) * 100;
    const pMed = (medium / total) * 100;
    const pHigh = (high / total) * 100;

    return (
        <div className="space-y-3">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80">
                <Link
                    href={segmentHrefs.low}
                    className="group/seg relative h-full min-w-0 bg-emerald-500 transition-[width,filter] duration-500 ease-out hover:brightness-110 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/50"
                    style={{ width: `${pLow}%` }}
                    title={`${labels.riskLegendLow}: ${low}%`}
                    prefetch={false}
                />
                <Link
                    href={segmentHrefs.medium}
                    className="group/seg relative h-full min-w-0 bg-amber-400 transition-[width,filter] duration-500 ease-out hover:brightness-110 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                    style={{ width: `${pMed}%` }}
                    title={`${labels.riskLegendMedium}: ${medium}%`}
                    prefetch={false}
                />
                <Link
                    href={segmentHrefs.high}
                    className="group/seg relative h-full min-w-0 bg-red-500 transition-[width,filter] duration-500 ease-out hover:brightness-110 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/50"
                    style={{ width: `${pHigh}%` }}
                    title={`${labels.riskLegendHigh}: ${high}%`}
                    prefetch={false}
                />
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                    {labels.riskLegendLow} <span className="font-semibold text-slate-900">{low}%</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
                    {labels.riskLegendMedium} <span className="font-semibold text-slate-900">{medium}%</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
                    {labels.riskLegendHigh} <span className="font-semibold text-slate-900">{high}%</span>
                </span>
            </div>
        </div>
    );
}

function IssuesTable({ issues, labels }: { issues: AnalyticsDetailedIssue[]; labels: AIInsightsLabels }) {
    const router = useRouter();
    const { columns } = labels;

    const go = (row: AnalyticsDetailedIssue) => {
        router.push(resolveIssueHref(row));
    };

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-sm">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/90">
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{columns.type}</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{columns.name}</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{columns.issue}</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{columns.severity}</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{columns.action}</th>
                        <th className="w-10 px-2 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400" aria-hidden />
                    </tr>
                </thead>
                <tbody>
                    {issues.map((row, i) => {
                        const tone = severityTone(row.severity);
                        return (
                            <tr
                                key={`${row.name}-${i}`}
                                role="link"
                                tabIndex={0}
                                className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/90"
                                onClick={() => go(row)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        go(row);
                                    }
                                }}
                            >
                                <td className="px-4 py-3 font-medium text-slate-800">{row.type}</td>
                                <td className="px-4 py-3 text-slate-800">{row.name}</td>
                                <td className="px-4 py-3 text-slate-600">{row.issue}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={cn(
                                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                                            severityBadgeClass(tone),
                                        )}
                                    >
                                        {row.severity}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-slate-700">{row.action}</td>
                                <td className="px-2 py-3 text-slate-300">
                                    <LuArrowRight className="ml-auto h-4 w-4" aria-hidden />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function InsightsSkeleton({ label }: { label: string }) {
    return (
        <div className="space-y-4" aria-busy aria-label={label}>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                <AISkeletonShimmer className="h-5 w-48" />
                <AISkeletonShimmer className="mt-3 h-16 w-full" />
                <div className="mt-4 flex gap-4">
                    <AISkeletonShimmer className="h-4 w-24" />
                    <AISkeletonShimmer className="h-4 w-40" />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                        <AISkeletonShimmer className="h-8 w-16" />
                        <AISkeletonShimmer className="mt-2 h-4 w-28" />
                    </div>
                ))}
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                <AISkeletonShimmer className="h-4 w-40" />
                <AISkeletonShimmer className="mt-4 h-3 w-full rounded-full" />
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                <AISkeletonShimmer className="h-4 w-32" />
                <AISkeletonShimmer className="mt-3 h-24 w-full" />
            </div>
        </div>
    );
}

export type AIInsightsEnhancedProps = {
    labels?: Partial<AIInsightsLabels>;
    className?: string;
    /** When set, skips network fetch (tests / Storybook) */
    embeddedData?: AnalyticsDetailedPayload | null;
};

export function AIInsightsEnhanced({ labels: labelsProp, className, embeddedData }: AIInsightsEnhancedProps) {
    const labels = useMemo(() => mergeLabels(labelsProp), [labelsProp]);
    const [data, setData] = useState<AnalyticsDetailedPayload | null>(() =>
        embeddedData !== undefined ? embeddedData : null,
    );
    const [loading, setLoading] = useState(() => embeddedData === undefined);
    const [error, setError] = useState<string | null>(null);
    const [fadeIn, setFadeIn] = useState(false);

    useEffect(() => {
        if (embeddedData !== undefined) {
            setData(embeddedData);
            setLoading(false);
            setError(null);
            return;
        }
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetchAnalyticsDetailed();
                if (!cancelled) setData(res);
            } catch {
                if (!cancelled) {
                    setError('Failed to load analytics');
                    setData(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [embeddedData]);

    useEffect(() => {
        if (loading) {
            setFadeIn(false);
            return;
        }
        const id = window.requestAnimationFrame(() => setFadeIn(true));
        return () => window.cancelAnimationFrame(id);
    }, [loading]);

    const hasContent = useMemo(() => {
        if (!data) return false;
        const m = data.metrics;
        const metricTotal = m.overduePayments + m.inactiveLeads + m.highRiskBookings + m.opportunities;
        return Boolean(data.summary.trim() || data.issues.length > 0 || metricTotal > 0);
    }, [data]);

    return (
        <section className={cn('space-y-5', className)} aria-busy={loading}>
            {loading ? <InsightsSkeleton label={labels.loadingMessage} /> : null}

            {!loading && error ? (
                <div className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/80">
                    <p className="text-sm font-medium text-slate-900">{labels.emptyTitle}</p>
                    <p className="mt-1 text-sm text-slate-500">{error}</p>
                </div>
            ) : null}

            {!loading && !error && data && !hasContent ? (
                <div
                    className={cn(
                        'rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200/80 transition-opacity duration-500',
                        fadeIn ? 'opacity-100' : 'opacity-0',
                    )}
                >
                    <p className="text-sm font-medium text-slate-900">{labels.emptyTitle}</p>
                    <p className="mt-1 text-sm text-slate-500">{labels.emptySubtitle}</p>
                </div>
            ) : null}

            {!loading && !error && data && hasContent ? (
                <div
                    className={cn('space-y-5 transition-opacity duration-500 ease-out', fadeIn ? 'opacity-100' : 'opacity-0')}
                >
                    {/* Summary card */}
                    <Link
                        href={resolveSummaryHref(data)}
                        prefetch={false}
                        className="group block rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 transition-shadow hover:shadow-md hover:ring-violet-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                    >
                        <div className="flex flex-wrap items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md ring-1 ring-violet-500/20">
                                <LuSparkles size={20} aria-hidden />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-lg font-semibold tracking-tight text-slate-900 group-hover:text-violet-900">
                                        {labels.summaryTitle}
                                    </h3>
                                    <LuExternalLink
                                        className="h-4 w-4 shrink-0 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100"
                                        aria-hidden
                                    />
                                </div>
                                <p className="text-sm text-slate-500">{labels.summarySubtitle}</p>
                            </div>
                        </div>
                        <p className="mt-4 text-sm leading-relaxed text-slate-800">{data.summary}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm">
                            <span className="text-slate-500">
                                {labels.confidenceLabel}:{' '}
                                <span className="font-semibold text-slate-900">{data.confidence}%</span>
                            </span>
                            <span className="text-slate-500">
                                {labels.lastUpdatedLabel}:{' '}
                                <span className="font-medium text-slate-800">{formatUpdated(data.updatedAt)}</span>
                            </span>
                        </div>
                    </Link>

                    {/* Metrics */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {METRIC_ORDER.map((key) => {
                            const value = data.metrics[key];
                            const trend = data.metricTrends?.[key];
                            const label = labels.metrics[key];
                            const href = resolveMetricHref(key, data);
                            return (
                                <Link
                                    key={key}
                                    href={href}
                                    prefetch={false}
                                    aria-label={`${label}: ${value}. Open`}
                                    className="group block rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-violet-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                                >
                                    <p className="text-3xl font-bold tabular-nums tracking-tight text-slate-900 group-hover:text-violet-900">
                                        {value}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">{label}</p>
                                    {trend ? (
                                        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-slate-600">
                                            {trend === 'up' ? (
                                                <>
                                                    <LuArrowUpRight className="text-emerald-600" aria-hidden />
                                                    <span className="text-emerald-700">{labels.metricTrendLabel}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <LuArrowDownRight className="text-amber-600" aria-hidden />
                                                    <span className="text-amber-800">{labels.metricTrendLabel}</span>
                                                </>
                                            )}
                                        </p>
                                    ) : null}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Risk + table row on large screens */}
                    <div className="grid gap-5 lg:grid-cols-2">
                        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">{labels.riskBreakdownTitle}</h3>
                                    <p className="mt-0.5 text-sm text-slate-500">{labels.riskSubtitle}</p>
                                </div>
                                <Link
                                    href={resolveRiskCardHref(data)}
                                    prefetch={false}
                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-violet-50"
                                >
                                    <span>Analytics</span>
                                    <LuExternalLink className="h-3.5 w-3.5" aria-hidden />
                                </Link>
                            </div>
                            <div className="mt-4">
                                <RiskStackedBar
                                    low={data.riskBreakdown.low}
                                    medium={data.riskBreakdown.medium}
                                    high={data.riskBreakdown.high}
                                    labels={labels}
                                    segmentHrefs={{
                                        low: resolveRiskSegmentHref('low', data),
                                        medium: resolveRiskSegmentHref('medium', data),
                                        high: resolveRiskSegmentHref('high', data),
                                    }}
                                />
                            </div>
                        </div>

                        <Link
                            href={resolveOpportunityHref(data)}
                            prefetch={false}
                            className="group flex h-full min-h-[200px] flex-col justify-between rounded-xl bg-gradient-to-br from-violet-50/80 via-white to-blue-50/50 p-4 shadow-sm ring-1 ring-violet-100/80 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-violet-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                        >
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-violet-900">
                                    {labels.opportunitiesTitle}
                                </h3>
                                <p className="mt-3 text-sm text-slate-700">
                                    {data.opportunities.headline ?? labels.opportunitiesSubtext}:{' '}
                                    <span className="font-bold text-blue-900">
                                        {data.opportunities.warmLeadsWithoutSiteVisit ?? '—'}
                                    </span>
                                </p>
                            </div>
                            <span className="inline-flex cursor-pointer items-center justify-center focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 bg-[#0092ff] text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-blue-600 hover:shadow-md active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#0092ff]/50 focus-visible:ring-offset-2 h-[42px] min-h-[42px] rounded-xl px-4 text-sm font-semibold">
                                {labels.viewLeads}
                                <LuArrowRight className="h-4 w-4" aria-hidden />
                            </span>
                        </Link>
                    </div>

                    {/* Issues table */}
                    <div>
                        <h3 className="mb-3 text-lg font-semibold text-slate-900">{labels.tableTitle}</h3>
                        {data.issues.length > 0 ? (
                            <IssuesTable issues={data.issues} labels={labels} />
                        ) : (
                            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
                                {labels.emptySubtitle}
                            </p>
                        )}
                    </div>
                </div>
            ) : null}
        </section>
    );
}
