'use client';

import React from 'react';
import Link from 'next/link';
import { LuChevronRight, LuTriangleAlert } from 'react-icons/lu';
import type { ExecutiveAttentionAlert } from '@/lib/leadsIntelligenceDecisionHelpers';
import { leadProfileHref } from '@/lib/leadRoutes';
import { cn } from '@/lib/utils';

function CompactAlertCard({ alert }: { alert: ExecutiveAttentionAlert }) {
    const isCritical = alert.severity === 'critical';
    const content = (
        <div
            className={cn(
                'rounded-lg border px-2.5 py-2 transition-colors',
                isCritical ? 'border-rose-200 bg-rose-50/70' : 'border-amber-200 bg-amber-50/60',
                alert.leadSlug && 'hover:bg-white',
            )}
        >
            <p className="text-xs font-bold leading-snug text-slate-900">{alert.headline}</p>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-600">{alert.detail}</p>
            {alert.leadSlug ? (
                <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-700">
                    View lead
                    <LuChevronRight size={12} aria-hidden />
                </span>
            ) : null}
        </div>
    );

    if (alert.leadSlug) {
        return (
            <Link href={leadProfileHref(alert.leadSlug)} className="block">
                {content}
            </Link>
        );
    }
    return content;
}

export function ExecutiveAttentionRequired({ alerts }: { alerts: ExecutiveAttentionAlert[] }) {
    if (alerts.length === 0) return null;

    const critical = alerts.filter((a) => a.severity === 'critical');
    const warnings = alerts.filter((a) => a.severity === 'warning');

    return (
        <section
            aria-label="Executive attention required"
            className="overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/80 via-white to-amber-50/40 shadow-sm ring-1 ring-rose-100/60"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-100/80 px-4 py-2.5">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white shadow-sm">
                        <LuTriangleAlert size={16} aria-hidden />
                    </span>
                    <div>
                        <h2 className="text-sm font-bold text-rose-950">Executive Attention Required</h2>
                        <p className="text-[11px] text-rose-800/90">Critical business risks — act before revenue leaks.</p>
                    </div>
                </div>
                <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {alerts.length}
                </span>
            </div>

            <div className="grid gap-3 p-3 sm:grid-cols-2">
                {critical.length > 0 ? (
                    <div>
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">Critical</p>
                        <ul className="space-y-1.5">
                            {critical.map((alert) => (
                                <li key={alert.id}>
                                    <CompactAlertCard alert={alert} />
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
                {warnings.length > 0 ? (
                    <div>
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">Warnings</p>
                        <ul className="space-y-1.5">
                            {warnings.map((alert) => (
                                <li key={alert.id}>
                                    <CompactAlertCard alert={alert} />
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </div>
        </section>
    );
}
