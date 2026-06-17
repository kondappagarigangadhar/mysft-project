'use client';

import React from 'react';
import { LuChevronRight, LuTriangleAlert } from 'react-icons/lu';
import { DemandClickableLink } from '@/components/demand-intelligence/DemandClickableLink';
import type { ResidentAttentionItem } from '@/lib/residentIntelligenceStore';
import {
    getResidentIntelActionHref,
    getResidentIntelServiceHref,
    RESIDENT_INTEL_SECTION_IDS,
} from '@/lib/residentIntelligenceRoutes';
import { cn } from '@/lib/utils';

export function ResidentAttentionToday({ items }: { items: ResidentAttentionItem[] }) {
    if (items.length === 0) return null;

    return (
        <section
            id={RESIDENT_INTEL_SECTION_IDS.attention}
            aria-label="What needs attention today"
            className="scroll-mt-24 overflow-hidden rounded-2xl border-2 border-rose-300/80 bg-gradient-to-br from-rose-50 via-white to-amber-50/80 shadow-md ring-1 ring-rose-200/60"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200/80 bg-rose-100/60 px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-white shadow-sm">
                        <LuTriangleAlert size={18} aria-hidden />
                    </span>
                    <div>
                        <h2 className="text-sm font-bold text-rose-950">What Needs Attention Today</h2>
                        <p className="text-xs text-rose-800/90">SLA breaches, defaulters, portal access, and vacated units.</p>
                    </div>
                </div>
                <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {items.length} item{items.length === 1 ? '' : 's'}
                </span>
            </div>
            <ul className="divide-y divide-rose-100/90">
                {items.map((item) => {
                    const critical = item.severity === 'critical';
                    const href = item.serviceTicketSlug
                        ? getResidentIntelServiceHref(item.serviceTicketSlug)
                        : getResidentIntelActionHref(item.residentSlug, item.recommendedAction);
                    const inner = (
                        <>
                            <div className="min-w-0">
                                <span
                                    className={cn(
                                        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                                        critical ? 'bg-rose-600 text-white' : 'bg-amber-500 text-amber-950',
                                    )}
                                >
                                    {item.headline}
                                </span>
                                <p className="mt-1.5 text-sm font-bold text-slate-900">{item.fullName}</p>
                                <p className="text-xs text-slate-600">
                                    Property: <span className="font-semibold text-violet-800">{item.propertyName}</span>
                                </p>
                                <p className="text-xs text-slate-600">{item.detail}</p>
                                {item.metricLabel && item.metricValue ? (
                                    <p className="mt-1 text-xs font-semibold text-slate-800">
                                        {item.metricLabel}:{' '}
                                        <span className="tabular-nums text-rose-700">{item.metricValue}</span>
                                    </p>
                                ) : null}
                            </div>
                            <div className="rounded-lg border border-white/80 bg-white px-3 py-2 shadow-sm sm:max-w-[240px]">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Recommended action</p>
                                <p className="mt-0.5 text-sm font-semibold text-slate-900">{item.recommendedAction}</p>
                            </div>
                            {href ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
                                    View resident
                                    <LuChevronRight size={14} aria-hidden />
                                </span>
                            ) : null}
                        </>
                    );

                    return (
                        <li key={item.id}>
                            <DemandClickableLink
                                href={href}
                                block
                                className={cn(
                                    'grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center',
                                    critical ? 'bg-rose-50/80 hover:bg-rose-100/50' : 'bg-amber-50/40 hover:bg-amber-50/70',
                                )}
                            >
                                {inner}
                            </DemandClickableLink>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
