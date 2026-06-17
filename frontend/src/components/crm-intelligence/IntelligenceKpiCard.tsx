'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type IntelligenceKpiAccent = 'blue' | 'orange' | 'green' | 'red' | 'violet';

export function IntelligenceKpiCard({
    title,
    value,
    suffix,
    sublabel,
    icon: Icon,
    accent = 'blue',
}: {
    title: string;
    value: string | number;
    suffix?: string;
    sublabel?: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    accent?: IntelligenceKpiAccent;
}) {
    const accentRing = {
        blue: 'ring-blue-500/15 bg-blue-50/80',
        orange: 'ring-orange-500/15 bg-orange-50/80',
        green: 'ring-emerald-500/15 bg-emerald-50/80',
        red: 'ring-red-500/15 bg-red-50/80',
        violet: 'ring-violet-500/15 bg-violet-50/80',
    }[accent];

    const iconBg = {
        blue: 'bg-blue-100 text-blue-700',
        orange: 'bg-orange-100 text-orange-700',
        green: 'bg-emerald-100 text-emerald-700',
        red: 'bg-red-100 text-red-700',
        violet: 'bg-violet-100 text-violet-700',
    }[accent];

    return (
        <div
            className={cn(
                'rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm ring-1 transition-shadow hover:shadow-md',
                accentRing
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
                    <p className="mt-1.5 text-xl font-bold tabular-nums text-slate-900">
                        {value}
                        {suffix ? <span className="text-base font-semibold text-slate-600">{suffix}</span> : null}
                    </p>
                    {sublabel ? <p className="mt-0.5 text-[11px] font-medium text-emerald-600">{sublabel}</p> : null}
                </div>
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconBg)}>
                    <Icon size={18} />
                </div>
            </div>
        </div>
    );
}
