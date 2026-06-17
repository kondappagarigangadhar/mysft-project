'use client';

import { cn } from '@/lib/utils';

export function SupplierKpiCard({
    label,
    value,
    hint,
    tone = 'neutral',
}: {
    label: string;
    value: string;
    hint?: string;
    tone?: 'good' | 'warn' | 'risk' | 'neutral';
}) {
    const ring =
        tone === 'good'
            ? 'border-emerald-200/90 bg-emerald-50/40'
            : tone === 'warn'
              ? 'border-amber-200/90 bg-amber-50/40'
              : tone === 'risk'
                ? 'border-rose-200/90 bg-rose-50/40'
                : 'border-slate-200/90 bg-white';
    return (
        <div className={cn('rounded-xl border p-4 shadow-sm', ring)}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
            {hint ? <p className="mt-1 text-xs text-slate-600">{hint}</p> : null}
        </div>
    );
}
