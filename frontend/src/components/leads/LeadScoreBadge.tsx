'use client';

import React from 'react';
import { leadScoreBand, type Lead } from '@/lib/leadStore';
import { cn } from '@/lib/utils';

export function LeadScoreBadge({
    score,
    className,
    showBar,
}: {
    score: number;
    className?: string;
    /** When true, show a thin progress bar under the pill (detail header). */
    showBar?: boolean;
}) {
    const s = Math.max(0, Math.min(100, Math.round(score)));
    const band = leadScoreBand(s);
    const cls =
        band === 'high'
            ? 'bg-emerald-50 text-emerald-900 ring-emerald-200/90'
            : band === 'medium'
              ? 'bg-amber-50 text-amber-950 ring-amber-200/80'
              : 'bg-rose-50 text-rose-900 ring-rose-200/80';

    return (
        <div className={cn('min-w-0', className)}>
            <div className="flex items-center gap-2">
                <span
                    className={cn(
                        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ring-1',
                        cls,
                    )}
                    title="Lead score (0–100)"
                >
                    {s}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">AI score</span>
            </div>
            {showBar ? (
                <div className="mt-1.5 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-slate-200/90">
                    <div
                        className={cn(
                            'h-full rounded-full transition-all',
                            band === 'high' && 'bg-emerald-500',
                            band === 'medium' && 'bg-amber-500',
                            band === 'low' && 'bg-rose-500',
                        )}
                        style={{ width: `${s}%` }}
                    />
                </div>
            ) : null}
        </div>
    );
}

export function leadDisplayScore(lead: Lead): number {
    return typeof lead.leadScore === 'number' ? lead.leadScore : 0;
}
