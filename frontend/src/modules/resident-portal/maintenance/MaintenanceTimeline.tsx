'use client';

import React from 'react';
import type { TicketStatus } from '../utils/types';
import { cn } from '@/lib/utils';

const STEPS: { key: TicketStatus; label: string }[] = [
    { key: 'Raised', label: 'Raised' },
    { key: 'Vendor Assigned', label: 'Vendor assigned' },
    { key: 'SLA Started', label: 'SLA started' },
    { key: 'In Progress', label: 'In progress' },
    { key: 'Resolved', label: 'Resolved' },
];

function stepIndex(status: TicketStatus) {
    const idx = STEPS.findIndex((s) => s.key === status);
    if (idx >= 0) return idx;
    if (status === 'Closed') return STEPS.length - 1;
    return 0;
}

export function MaintenanceTimeline({ status }: { status: TicketStatus }) {
    const idx = stepIndex(status);

    return (
        <ol className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-5 sm:gap-2">
            {STEPS.map((s, i) => {
                const done = i <= idx;
                const current = i === idx;
                return (
                    <li key={s.key} className="flex items-center gap-2 min-w-0 sm:flex-col sm:items-start sm:gap-1.5">
                        <span
                            className={cn(
                                'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold',
                                done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500',
                                current && 'ring-2 ring-emerald-500/30 ring-offset-1'
                            )}
                            aria-hidden
                        >
                            {i + 1}
                        </span>
                        <p
                            className={cn(
                                'text-[11px] font-semibold leading-tight sm:text-xs',
                                done ? 'text-slate-800' : 'text-slate-400'
                            )}
                        >
                            {s.label}
                        </p>
                    </li>
                );
            })}
        </ol>
    );
}
