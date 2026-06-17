'use client';

import type { WorkflowStep, WorkflowStepState } from '@/lib/workflow/workflowStepTypes';
import { cn } from '@/lib/utils';
import { LuCheck, LuCircle, LuLoader } from 'react-icons/lu';

function StepIcon({ state }: { state: WorkflowStepState }) {
    if (state === 'completed') {
        return (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                <LuCheck className="h-3.5 w-3.5" aria-hidden />
            </span>
        );
    }
    if (state === 'active') {
        return (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] text-[var(--cta-button-bg)]">
                <LuLoader className="h-3.5 w-3.5 animate-spin" aria-hidden />
            </span>
        );
    }
    return (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
            <LuCircle className="h-3 w-3" aria-hidden />
        </span>
    );
}

export type RecordWorkflowStepperProps = {
    steps: WorkflowStep[];
    /** Accessible name for the workflow nav landmark. */
    ariaLabel?: string;
    className?: string;
    onStepNavigate?: (step: WorkflowStep) => void;
};

export function RecordWorkflowStepper({ steps, ariaLabel = 'Record workflow', className, onStepNavigate }: RecordWorkflowStepperProps) {
    return (
        <nav
            aria-label={ariaLabel}
            className={cn('rounded-xl border border-slate-200/90 bg-white px-3 py-3 shadow-sm sm:px-4', className)}
        >
            <ol className="flex flex-wrap items-center gap-y-3">
                {steps.map((step, idx) => {
                    const clickable = Boolean(onStepNavigate && (step.nav?.sectionId || step.nav?.tab));
                    return (
                        <li key={step.id} className="flex min-w-0 items-center">
                            {clickable ? (
                                <button
                                    type="button"
                                    onClick={() => onStepNavigate?.(step)}
                                    className={cn(
                                        'flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-0.5 text-left transition',
                                        'cursor-pointer hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)]',
                                        step.state === 'active' && 'bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]',
                                    )}
                                    title={`Go to ${step.label}`}
                                >
                                    <StepIcon state={step.state} />
                                    <span
                                        className={cn(
                                            'whitespace-nowrap text-[11px] font-semibold sm:text-xs',
                                            step.state === 'completed' && 'text-emerald-800',
                                            step.state === 'active' && 'text-slate-900',
                                            step.state === 'pending' && 'text-slate-500',
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                </button>
                            ) : (
                                <div
                                    className={cn(
                                        'flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-0.5',
                                        step.state === 'active' && 'bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]',
                                    )}
                                >
                                    <StepIcon state={step.state} />
                                    <span
                                        className={cn(
                                            'whitespace-nowrap text-[11px] font-semibold sm:text-xs',
                                            step.state === 'completed' && 'text-emerald-800',
                                            step.state === 'active' && 'text-slate-900',
                                            step.state === 'pending' && 'text-slate-500',
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                            )}
                            {idx < steps.length - 1 ? (
                                <span
                                    className={cn(
                                        'mx-1.5 hidden h-px w-4 shrink-0 sm:block sm:w-6 md:w-8',
                                        step.state === 'completed' ? 'bg-emerald-300' : 'bg-slate-200',
                                    )}
                                    aria-hidden
                                />
                            ) : null}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
