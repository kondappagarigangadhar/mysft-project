'use client';

import React from 'react';
import { LuArrowRight, LuFilter } from 'react-icons/lu';
import type { LeadsIntelFunnelStep } from '@/lib/leadsIntelligenceDecisionHelpers';
import { LeadsIntelAiPanel } from '@/components/leads-intelligence/leadsIntelligenceUi';
import { cn } from '@/lib/utils';

const stepThemes = [
    { bg: 'from-blue-50 to-white border-blue-200/70', label: 'text-blue-700', count: 'text-blue-900' },
    { bg: 'from-violet-50 to-white border-violet-200/70', label: 'text-violet-700', count: 'text-violet-900' },
    { bg: 'from-amber-50 to-white border-amber-200/70', label: 'text-amber-700', count: 'text-amber-900' },
    { bg: 'from-emerald-50 to-white border-emerald-200/70', label: 'text-emerald-700', count: 'text-emerald-900' },
];

export function FunnelSection({ steps, className }: { steps: LeadsIntelFunnelStep[]; className?: string }) {
    return (
        <LeadsIntelAiPanel variant="indigo" className={cn('h-full', className)} aria-label="Pipeline funnel">
            <div className="flex items-center gap-2 border-b border-indigo-100/80 bg-gradient-to-r from-indigo-50/90 via-white to-sky-50/80 px-4 py-3.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white shadow-sm">
                    <LuFilter size={16} aria-hidden />
                </span>
                <div>
                    <h2 className="text-sm font-bold text-slate-900">Pipeline funnel</h2>
                    <p className="text-xs text-slate-600">AI pipeline health monitoring — step-through rates for manager review</p>
                </div>
            </div>
            <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-stretch">
                {steps.map((step, i) => {
                    const theme = stepThemes[i] ?? stepThemes[0];
                    return (
                        <React.Fragment key={step.key}>
                            <div
                                className={cn(
                                    'flex min-h-[92px] min-w-0 flex-1 flex-col justify-center rounded-xl border bg-gradient-to-br px-3 py-2.5',
                                    theme.bg,
                                )}
                            >
                                <p className={cn('text-[10px] font-bold uppercase tracking-wider', theme.label)}>
                                    {step.label}
                                </p>
                                <p className={cn('mt-1 text-2xl font-bold tabular-nums', theme.count)}>{step.count}</p>
                                {step.conversionFromPrev != null ? (
                                    <p className="mt-0.5 text-xs font-semibold text-emerald-700">
                                        {step.conversionFromPrev}% conversion
                                    </p>
                                ) : (
                                    <p className="mt-0.5 text-xs text-slate-400">Entry</p>
                                )}
                            </div>
                            {i < steps.length - 1 ? (
                                <div className="flex shrink-0 items-center justify-center sm:px-0.5" aria-hidden>
                                    <LuArrowRight className="h-4 w-4 rotate-90 text-slate-300 sm:rotate-0" />
                                </div>
                            ) : null}
                        </React.Fragment>
                    );
                })}
            </div>
        </LeadsIntelAiPanel>
    );
}
