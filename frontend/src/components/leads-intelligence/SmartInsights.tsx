'use client';

import React from 'react';
import { LuCalendarClock, LuMapPin } from 'react-icons/lu';
import type { IntelligenceLead } from '@/lib/leadsIntelligenceStore';
import { cn } from '@/lib/utils';

function CardShell({
    title,
    icon: Icon,
    children,
    className,
}: {
    title: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm', className)}>
            <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                    <Icon size={18} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            </div>
            <div className="mt-3">{children}</div>
        </div>
    );
}

/** Decision-layer cards: visit pushes and best call windows (mock / API-ready fields). */
export function SmartInsights({
    visitLeads,
    followUpLeads,
}: {
    visitLeads: IntelligenceLead[];
    followUpLeads: IntelligenceLead[];
}) {
    return (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-label="Smart recommendations">
            <CardShell title="Smart visit recommendation" icon={LuMapPin}>
                {visitLeads.length === 0 ? (
                    <p className="text-sm text-slate-500">No visit pushes for this view. Widen filters or check back after new scoring.</p>
                ) : (
                    <ul className="space-y-2">
                        {visitLeads.map((l) => (
                            <li
                                key={l.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900">{l.name}</p>
                                    <p className="truncate text-xs text-slate-500">
                                        {l.projectInterest} · Score {l.leadScore}
                                    </p>
                                </div>
                                <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                                    Push for Visit
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardShell>

            <CardShell title="Optimal follow-up time" icon={LuCalendarClock}>
                {followUpLeads.length === 0 ? (
                    <p className="text-sm text-slate-500">No scheduled windows in this view.</p>
                ) : (
                    <ul className="space-y-2">
                        {followUpLeads.map((l) => (
                            <li
                                key={l.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
                            >
                                <span className="text-sm font-semibold text-slate-900">{l.name}</span>
                                <span className="text-xs font-medium text-slate-600">→ {l.bestCallTimeLabel}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardShell>
        </section>
    );
}
