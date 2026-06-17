'use client';

import React from 'react';
import { LuCheck } from 'react-icons/lu';
import { cn } from '@/lib/utils';

export type ESignStepDef = { id: string; label: string; /** Narrow screens */ shortLabel?: string };

type ESignStepHeaderProps = {
    steps: readonly ESignStepDef[];
    activeIndex: number;
    /** Same length as `steps`; true when that step has been fully completed in the flow. */
    stepDone: boolean[];
};

export function ESignStepHeader({ steps, activeIndex, stepDone }: ESignStepHeaderProps) {
    return (
        <nav aria-label="eSign progress" className="border-b border-slate-100 bg-linear-to-b from-slate-50/95 to-white px-2 py-4 sm:px-4">
            <ol className="flex w-full items-start justify-between gap-0">
                {steps.map((step, i) => {
                    const done = !!stepDone[i];
                    const active = i === activeIndex;
                    const short = step.shortLabel ?? step.label;
                    return (
                        <li key={step.id} className="flex min-w-0 flex-1 flex-col items-center">
                            <div className="flex w-full items-center">
                                <div
                                    className={cn(
                                        'h-0.5 min-h-[2px] flex-1 rounded-full transition-colors',
                                        i === 0 ? 'pointer-events-none opacity-0' : stepDone[i - 1] ? 'bg-emerald-400' : 'bg-slate-200',
                                    )}
                                    aria-hidden={i === 0}
                                />
                                <span
                                    className={cn(
                                        'relative z-10 mx-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold shadow-sm transition-all sm:h-9 sm:w-9 sm:text-xs',
                                        done && 'bg-emerald-500 text-white ring-2 ring-emerald-100',
                                        active &&
                                            !done &&
                                            'bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] ring-2 ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)] ring-offset-2 ring-offset-white',
                                        !active && !done && 'border border-slate-200 bg-white text-slate-400',
                                    )}
                                >
                                    {done ? <LuCheck className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.5} /> : i + 1}
                                </span>
                                <div
                                    className={cn(
                                        'h-0.5 min-h-[2px] flex-1 rounded-full transition-colors',
                                        i === steps.length - 1 ? 'pointer-events-none opacity-0' : stepDone[i] ? 'bg-emerald-400' : 'bg-slate-200',
                                    )}
                                    aria-hidden={i === steps.length - 1}
                                />
                            </div>
                            <span
                                className={cn(
                                    'mt-2 max-w-20 truncate text-center text-[10px] font-semibold leading-tight sm:max-w-none sm:text-xs',
                                    done && 'text-emerald-800',
                                    active && !done && 'text-[var(--cta-button-bg)]',
                                    !active && !done && 'text-slate-400',
                                )}
                                title={step.label}
                            >
                                <span className="sm:hidden">{short}</span>
                                <span className="hidden sm:inline">{step.label}</span>
                            </span>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
