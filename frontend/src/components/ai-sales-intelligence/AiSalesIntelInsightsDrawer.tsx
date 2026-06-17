'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { LuExternalLink, LuSparkles, LuX } from 'react-icons/lu';
import { Button } from '@/components/ui/Button';
import type { AISalesIntelligenceLead } from '@/lib/aiSalesIntelligenceStore';
import {
    AI_SALES_TEMPERATURE_CLASS,
    FEATURE_STORE_LABELS,
    formatAISalesPercent,
    formatAISalesRevenue,
    formatCalculatedAt,
} from '@/lib/aiSalesIntelligenceHelpers';
import { cn } from '@/lib/utils';

type Props = {
    lead: AISalesIntelligenceLead | null;
    onClose: () => void;
};

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    return (
        <div>
            <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="tabular-nums font-semibold text-slate-900">{value}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

export function AiSalesIntelInsightsDrawer({ lead, onClose }: Props) {
    const open = lead != null;

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    if (!lead) return null;

    return (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="ai-sales-drawer-title">
            <button type="button" className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} aria-label="Close" />
            <aside className="absolute top-0 right-0 flex h-full w-full max-w-xl flex-col border-l border-slate-200/90 bg-white shadow-2xl">
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-violet-100/80 bg-gradient-to-r from-violet-50/90 via-white to-blue-50/80 px-5 py-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-sm">
                                <LuSparkles size={16} aria-hidden />
                            </span>
                            <div>
                                <h2 id="ai-sales-drawer-title" className="text-lg font-semibold text-slate-900">
                                    Lead AI Insights
                                </h2>
                                <p className="text-sm text-slate-600">{lead.name}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100"
                        aria-label="Close"
                    >
                        <LuX className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lead Score</p>
                            <p className="mt-1 text-2xl font-bold text-violet-700">{lead.leadScore}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Conversion</p>
                            <p className="mt-1 text-2xl font-bold text-blue-700">{formatAISalesPercent(lead.conversionProbability)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Temperature</p>
                            <span
                                className={cn(
                                    'mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold',
                                    AI_SALES_TEMPERATURE_CLASS[lead.leadTemperature],
                                )}
                            >
                                {lead.leadTemperature}
                            </span>
                        </div>
                    </div>

                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Score Drivers (weighted MVP)</h3>
                        <div className="mt-3 space-y-3">
                            {FEATURE_STORE_LABELS.map(({ key, label, weight }) => (
                                <ScoreBar key={key} label={`${label} (${weight})`} value={lead.featureStore[key]} />
                            ))}
                        </div>
                    </section>

                    {lead.featureRows?.length ? (
                        <section>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Feature Store</h3>
                            <dl className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200/80">
                                {lead.featureRows.map((row) => (
                                    <div key={row.id} className="flex justify-between gap-3 px-3 py-2 text-xs">
                                        <dt className="font-medium text-slate-600">{row.featureName}</dt>
                                        <dd className="font-semibold text-slate-900">{row.featureValue}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    ) : null}

                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Behavior Analysis</h3>
                        <p className="mt-2 text-sm text-slate-700">{lead.insights.behaviorRecommendation}</p>
                        {lead.insights.behaviorFlags.length > 0 ? (
                            <ul className="mt-2 space-y-1">
                                {lead.insights.behaviorFlags.map((f) => (
                                    <li key={f} className="text-xs text-amber-800">
                                        • {f}
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </section>

                    <section>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Risk Factors</h3>
                        {lead.insights.riskFactors.length > 0 ? (
                            <ul className="mt-2 space-y-1">
                                {lead.insights.riskFactors.map((r) => (
                                    <li key={r} className="text-xs text-rose-700">
                                        • {r}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-2 text-sm text-emerald-700">No elevated risk signals detected.</p>
                        )}
                    </section>

                    <section className="rounded-xl border border-violet-200/60 bg-violet-50/40 p-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-violet-800">Recommended Action</h3>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{lead.nextBestAction}</p>
                        <p className="mt-1 text-xs text-slate-600">{lead.nextBestActionReason}</p>
                        <p className="mt-2 text-xs text-slate-500">
                            Expected impact: {formatAISalesRevenue(lead.expectedRevenueImpactLakhs)} · Confidence{' '}
                            {formatAISalesPercent(lead.confidenceScore)}
                        </p>
                    </section>

                    <section className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                        <div>
                            <p className="font-bold uppercase tracking-wider text-slate-500">AI Confidence</p>
                            <p className="mt-1 font-semibold text-slate-900">{formatAISalesPercent(lead.confidenceScore)}</p>
                        </div>
                        <div>
                            <p className="font-bold uppercase tracking-wider text-slate-500">Model Version</p>
                            <p className="mt-1 font-semibold text-slate-900">{lead.modelVersion}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="font-bold uppercase tracking-wider text-slate-500">Last Calculated</p>
                            <p className="mt-1 font-semibold text-slate-900">{formatCalculatedAt(lead.calculatedAt)}</p>
                        </div>
                    </section>
                </div>

                <div className="shrink-0 border-t border-slate-200/90 bg-slate-50/50 px-5 py-4">
                    <Link href={`/leads/view/${encodeURIComponent(lead.leadSlug)}`}>
                        <Button type="button" variant="company" size="cta" className="w-full gap-2">
                            Open Lead Record
                            <LuExternalLink size={16} aria-hidden />
                        </Button>
                    </Link>
                </div>
            </aside>
        </div>
    );
}
