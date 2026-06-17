'use client';

import React from 'react';
import { LuSparkles } from 'react-icons/lu';
import { cn } from '@/lib/utils';

export type LeadsIntelPanelVariant = 'violet' | 'cyan' | 'indigo' | 'emerald' | 'amber' | 'rose';

const panelRing: Record<LeadsIntelPanelVariant, string> = {
    violet: 'ring-violet-100/80',
    cyan: 'ring-cyan-100/80',
    indigo: 'ring-indigo-100/80',
    emerald: 'ring-emerald-100/80',
    amber: 'ring-amber-100/80',
    rose: 'ring-rose-100/80',
};

const headerGradients: Record<LeadsIntelPanelVariant, string> = {
    violet: 'from-violet-50/90 via-white to-blue-50/80 border-violet-100/80',
    cyan: 'from-cyan-50/90 via-white to-teal-50/80 border-cyan-100/80',
    indigo: 'from-indigo-50/90 via-white to-sky-50/80 border-indigo-100/80',
    emerald: 'from-emerald-50/90 via-white to-green-50/80 border-emerald-100/80',
    amber: 'from-amber-50/90 via-white to-orange-50/80 border-amber-100/80',
    rose: 'from-rose-50/90 via-white to-red-50/80 border-rose-100/80',
};

const iconGradients: Record<LeadsIntelPanelVariant, string> = {
    violet: 'from-violet-600 to-blue-600',
    cyan: 'from-cyan-600 to-teal-600',
    indigo: 'from-indigo-600 to-sky-600',
    emerald: 'from-emerald-600 to-green-600',
    amber: 'from-amber-600 to-orange-600',
    rose: 'from-rose-600 to-red-600',
};

export function LeadsIntelAiPanel({
    children,
    variant = 'violet',
    className,
    'aria-label': ariaLabel,
}: {
    children: React.ReactNode;
    variant?: LeadsIntelPanelVariant;
    className?: string;
    'aria-label'?: string;
}) {
    return (
        <section
            aria-label={ariaLabel}
            className={cn(
                'overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1',
                panelRing[variant],
                className,
            )}
        >
            {children}
        </section>
    );
}

export function LeadsIntelAiSectionHeader({
    title,
    subtitle,
    variant = 'violet',
    badge,
}: {
    title: string;
    subtitle: string;
    variant?: LeadsIntelPanelVariant;
    badge?: string;
}) {
    return (
        <div className={cn('flex flex-wrap items-start justify-between gap-2 border-b px-4 py-3.5 bg-gradient-to-r', headerGradients[variant])}>
            <div className="flex min-w-0 items-start gap-2.5">
                <span
                    className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                        iconGradients[variant],
                    )}
                >
                    <LuSparkles size={16} aria-hidden />
                </span>
                <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-900">{title}</h2>
                    <p className="text-xs text-slate-600">{subtitle}</p>
                </div>
            </div>
            {badge ? (
                <span className="shrink-0 rounded-full bg-slate-900/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {badge}
                </span>
            ) : null}
        </div>
    );
}

/** Explains why some leads have richer AI (bookings / payments / docs on lead view). */
export function DealDataCoverageBar({ withDeal, total }: { withDeal: number; total: number }) {
    if (total === 0) return null;
    const pct = Math.round((withDeal / total) * 100);
    return (
        <div
            className="rounded-xl border border-violet-200/80 bg-gradient-to-r from-violet-50/90 via-white to-blue-50/70 px-4 py-3 text-sm text-slate-700"
            role="status"
        >
            <p>
                <span className="font-bold text-violet-900">{withDeal} of {total}</span> leads in this view have linked{' '}
                <span className="font-semibold">bookings, payments, and documents</span> on their profile — AI actions use that
                deal data (pending ₹, booking status, compliance docs). The rest rely on follow-up and funnel signals only.
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/80">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-600 transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

export function MetricPill({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'slate' | 'emerald' | 'rose' | 'violet' }) {
    const tones = {
        slate: 'border-slate-200 bg-slate-50 text-slate-800',
        emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        rose: 'border-rose-200 bg-rose-50 text-rose-800',
        violet: 'border-violet-200 bg-violet-50 text-violet-800',
    };
    return (
        <div className={cn('rounded-xl border px-3 py-2', tones[tone])}>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums">{value}</p>
        </div>
    );
}
