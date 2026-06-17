'use client';

import React from 'react';
import { LuArrowDown, LuArrowUp, LuSparkles } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { ACC } from '@/lib/aiCommandCenter/constants';

export function SectionHeader({
    id,
    title,
    subtitle,
    badge,
}: {
    id?: string;
    title: string;
    subtitle?: string;
    badge?: string;
}) {
    return (
        <div id={id} className="scroll-mt-24">
            <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
                {badge ? (
                    <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                        style={{ background: `linear-gradient(135deg, ${ACC.primary}, ${ACC.accent})` }}
                    >
                        <LuSparkles size={10} aria-hidden />
                        {badge}
                    </span>
                ) : null}
            </div>
            {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
    );
}

export function TrendBadge({ change, trend }: { change: string; trend: 'up' | 'down' }) {
    const isUp = trend === 'up';
    return (
        <span
            className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                isUp ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
            )}
        >
            {isUp ? <LuArrowUp size={12} /> : <LuArrowDown size={12} />}
            {change}
        </span>
    );
}

export function GlassCard({
    children,
    className,
    id,
}: {
    children: React.ReactNode;
    className?: string;
    id?: string;
}) {
    return (
        <div
            id={id}
            className={cn(
                'rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/80 sm:p-6',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function MetricKpi({
    label,
    value,
    change,
    trend,
    insight,
    action,
}: {
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
    insight: string;
    action: string;
}) {
    return (
        <div className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all duration-200 hover:border-blue-100 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-blue-900">
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                <TrendBadge change={change} trend={trend} />
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                <span className="font-medium text-[#2563EB]">AI:</span> {insight}
            </p>
            <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                → {action}
            </p>
        </div>
    );
}
