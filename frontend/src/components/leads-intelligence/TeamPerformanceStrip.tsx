'use client';

import React from 'react';
import type { SalesRepPerformance } from '@/lib/leadsIntelligenceDecisionHelpers';
import { formatRevenueLakhs } from '@/lib/leadsIntelligenceHelpers';
import { cn } from '@/lib/utils';

export function TeamPerformanceStrip({ reps }: { reps: SalesRepPerformance[] }) {
    if (reps.length === 0) return null;

    return (
        <section aria-label="Team performance" className="rounded-2xl border border-indigo-200/80 bg-indigo-50/30 p-4">
            <h2 className="text-xs font-bold uppercase tracking-wide text-indigo-900">Team performance</h2>
            <p className="text-[11px] text-slate-600">Who needs coaching — conversion, follow-up, and revenue closed.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {reps.map((rep) => {
                    const needsHelp = rep.followUpCompliancePct < 72 || rep.conversionPct < 55;
                    return (
                        <div
                            key={rep.name}
                            className={cn(
                                'rounded-lg border bg-white px-3 py-2.5',
                                needsHelp ? 'border-amber-300 ring-1 ring-amber-200/80' : 'border-slate-200',
                            )}
                        >
                            <p className="text-sm font-semibold text-slate-900">{rep.name}</p>
                            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                                <div>
                                    <dt className="font-medium text-slate-500">Conversion</dt>
                                    <dd className="font-bold tabular-nums text-slate-900">{rep.conversionPct}%</dd>
                                </div>
                                <div>
                                    <dt className="font-medium text-slate-500">Follow-up</dt>
                                    <dd className="font-bold tabular-nums text-slate-900">{rep.followUpCompliancePct}%</dd>
                                </div>
                                <div className="col-span-2">
                                    <dt className="font-medium text-slate-500">Revenue closed</dt>
                                    <dd className="font-bold tabular-nums text-emerald-800">{formatRevenueLakhs(rep.revenueClosedLakhs)}</dd>
                                </div>
                            </dl>
                            {needsHelp ? (
                                <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">Needs attention</p>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
