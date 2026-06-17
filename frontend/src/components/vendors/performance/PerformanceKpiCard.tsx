'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PerformanceKpiVariant = 'success' | 'warning' | 'danger' | 'neutral';

const variantStyles: Record<PerformanceKpiVariant, { iconBg: string; iconText: string; hover: string }> = {
    success: {
        iconBg: 'bg-emerald-50',
        iconText: 'text-emerald-600',
        hover: 'hover:border-emerald-200/80',
    },
    warning: {
        iconBg: 'bg-amber-50',
        iconText: 'text-amber-600',
        hover: 'hover:border-amber-200/80',
    },
    danger: {
        iconBg: 'bg-rose-50',
        iconText: 'text-rose-600',
        hover: 'hover:border-rose-200/80',
    },
    neutral: {
        iconBg: 'bg-[color-mix(in_srgb,var(--cta-button-bg)_14%,white)]',
        iconText: 'text-[var(--cta-button-bg)]',
        hover: 'hover:border-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)]',
    },
};

type PerformanceKpiCardProps = {
    title: string;
    value: ReactNode;
    subtitle?: string;
    icon: ReactNode;
    variant?: PerformanceKpiVariant;
    trend?: { direction: 'up' | 'down' | 'flat'; label: string };
};

export function PerformanceKpiCard({ title, value, subtitle, icon, variant = 'neutral', trend }: PerformanceKpiCardProps) {
    const v = variantStyles[variant];
    return (
        <article
            className={cn(
                'flex h-full min-h-[112px] flex-col rounded-xl border border-slate-200/90 bg-slate-50/40 p-4 transition-colors duration-150 hover:bg-white sm:p-4',
                v.hover,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{title}</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums leading-none tracking-tight text-slate-900">{value}</p>
                    {subtitle ? <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-slate-500">{subtitle}</p> : null}
                </div>
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', v.iconBg, v.iconText)}>{icon}</div>
            </div>
            {trend ? (
                <p
                    className={cn(
                        'mt-3 text-xs font-medium',
                        trend.direction === 'up' && 'text-emerald-600',
                        trend.direction === 'down' && 'text-rose-600',
                        trend.direction === 'flat' && 'text-slate-500',
                    )}
                >
                    <span aria-hidden className="mr-1 tabular-nums">
                        {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
                    </span>
                    {trend.label}
                </p>
            ) : null}
        </article>
    );
}
