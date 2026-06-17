'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const tones: Record<Tone, string> = {
    success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    warning: 'bg-amber-50 text-amber-900 ring-amber-200',
    danger: 'bg-red-50 text-red-800 ring-red-200',
    neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export function statusToTone(status: string): Tone {
    const s = status.toLowerCase();
    if (s.includes('complete') || s.includes('confirm') || s.includes('success')) return 'success';
    if (s.includes('partial')) return 'warning';
    if (s.includes('pending')) return 'warning';
    if (s.includes('fail') || s.includes('cancel')) return 'danger';
    return 'neutral';
}

/** Ledger payment row: Completed → green, Pending → amber, Failed → red */
export function paymentRecordStatusTone(status: string): Tone {
    if (status === 'Completed') return 'success';
    if (status === 'Pending') return 'warning';
    if (status === 'Failed') return 'danger';
    return statusToTone(status);
}

export type InstallmentToneStatus = 'Completed' | 'Partial' | 'Pending';

export function installmentStatusTone(s: InstallmentToneStatus): Tone {
    if (s === 'Completed') return 'success';
    if (s === 'Partial') return 'warning';
    return 'warning';
}

export function BpStatusBadge({ children, tone }: { children: React.ReactNode; tone?: Tone }) {
    const t = tone ?? 'neutral';
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset',
                tones[t]
            )}
        >
            {children}
        </span>
    );
}
