'use client';

import React from 'react';
import { LuCheck } from 'react-icons/lu';
import { cn } from '@/lib/utils';

export type ESignAuditPhase = 'created' | 'otp' | 'placed' | 'signed' | 'locked';

const MILESTONES: { id: ESignAuditPhase; label: string }[] = [
    { id: 'created', label: 'Request created' },
    { id: 'otp', label: 'OTP verified' },
    { id: 'placed', label: 'Signature placed' },
    { id: 'signed', label: 'Signed' },
    { id: 'locked', label: 'Document locked' },
];

type ESignAuditTimelineProps = {
    /** Phases that are complete (in order). */
    completedPhases: Set<ESignAuditPhase>;
};

export function ESignAuditTimeline({ completedPhases }: ESignAuditTimelineProps) {
    return (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Audit trail (preview)</p>
            <ul className="mt-3 space-y-0">
                {MILESTONES.map((m, i) => {
                    const done = completedPhases.has(m.id);
                    return (
                        <li key={m.id} className="relative flex gap-3 pb-4 last:pb-0">
                            {i < MILESTONES.length - 1 ? (
                                <span
                                    className={cn(
                                        'absolute left-[11px] top-6 h-[calc(100%-0.5rem)] w-px',
                                        done ? 'bg-emerald-200' : 'bg-slate-200',
                                    )}
                                    aria-hidden
                                />
                            ) : null}
                            <span
                                className={cn(
                                    'relative z-[1] mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                                    done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white text-slate-300',
                                )}
                            >
                                {done ? <LuCheck className="h-3 w-3" strokeWidth={3} /> : i + 1}
                            </span>
                            <div className="min-w-0 pt-0.5">
                                <p className={cn('text-xs font-semibold', done ? 'text-emerald-900' : 'text-slate-400')}>{m.label}</p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
