'use client';

import type { PrAiProcurementInsights } from '@/lib/procurement/prProcurementWorkflow';
import { cn } from '@/lib/utils';
import { LuBrain, LuShieldAlert, LuSparkles, LuTruck } from 'react-icons/lu';

function InsightCard({
    label,
    value,
    sub,
    icon: Icon,
}: {
    label: string;
    value: string;
    sub?: string;
    icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <div className="rounded-lg border border-slate-200/90 bg-slate-50/50 px-2.5 py-2">
            <div className="flex items-start gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600">
                    <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-0.5 text-xs font-semibold leading-snug text-slate-900">{value}</p>
                    {sub ? <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{sub}</p> : null}
                </div>
            </div>
        </div>
    );
}

export function PrAiProcurementInsightsPanel({ insights }: { insights: PrAiProcurementInsights }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] text-[var(--cta-button-bg)]">
                        <LuBrain className="h-4 w-4" />
                    </span>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI procurement insights</p>
                        <p className="text-[11px] text-slate-500">Decision support for this request</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold tabular-nums text-slate-900">{insights.healthScore}%</p>
                    <p className="text-[10px] font-semibold uppercase text-slate-500">{insights.healthLabel}</p>
                </div>
            </div>

            <div className="mb-2 rounded-lg border border-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_6%,white)] px-2.5 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Recommended supplier</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{insights.recommendedSupplier}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{insights.recommendationNote}</p>
            </div>

            <div className="grid gap-2">
                <InsightCard label="Procurement risk" value={insights.procurementRisk} icon={LuShieldAlert} />
                <InsightCard label="Delivery risk" value={insights.deliveryRisk} icon={LuTruck} />
                {insights.slaAlert ? (
                    <p className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-2.5 py-2 text-[11px] font-medium text-amber-950">{insights.slaAlert}</p>
                ) : null}
                <InsightCard label="Best decision" value={insights.bestDecision} icon={LuSparkles} />
            </div>
        </div>
    );
}
