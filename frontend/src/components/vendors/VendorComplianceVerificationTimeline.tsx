'use client';

import { useState } from 'react';
import type { VendorDocument } from '@/lib/vendors/types';
import { buildComplianceTimelineSteps } from '@/lib/vendors/vendorComplianceVerification';
import { cn } from '@/lib/utils';
import { LuChevronDown } from 'react-icons/lu';

function StepIcon({ state }: { state: 'completed' | 'current' | 'upcoming' | 'rejected' }) {
    if (state === 'completed') {
        return <span className="text-xs font-bold text-emerald-600" aria-hidden>✓</span>;
    }
    if (state === 'current') {
        return <span className="text-sm font-bold text-[var(--cta-button-bg)]" aria-hidden>●</span>;
    }
    if (state === 'rejected') {
        return <span className="text-sm font-bold text-rose-600" aria-hidden>●</span>;
    }
    return <span className="text-sm text-slate-300" aria-hidden>○</span>;
}

export function VendorComplianceVerificationTimeline({ document: doc }: { document: VendorDocument }) {
    const steps = buildComplianceTimelineSteps(doc);
    const [open, setOpen] = useState(true);

    if (!steps.length) return null;

    const rejectionReason = doc.rejectionReason?.trim();

    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 text-left"
                aria-expanded={open}
            >
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verification timeline</span>
                <LuChevronDown
                    size={14}
                    className={cn('shrink-0 text-slate-400 transition-transform', open && 'rotate-180')}
                    aria-hidden
                />
            </button>
            {open ? (
                <div className="mt-2 space-y-1.5">
                    {steps.map((step) => (
                        <div
                            key={step.label}
                            className={cn(
                                'flex items-center gap-2 text-xs',
                                step.state === 'completed' && 'font-medium text-emerald-800',
                                step.state === 'current' && 'font-semibold text-[var(--cta-button-bg)]',
                                step.state === 'rejected' && 'font-semibold text-rose-700',
                                step.state === 'upcoming' && 'text-slate-400',
                            )}
                        >
                            <span className="inline-flex w-4 shrink-0 justify-center">
                                <StepIcon state={step.state} />
                            </span>
                            <span>{step.label}</span>
                        </div>
                    ))}
                    {rejectionReason ? (
                        <div className="mt-2 rounded-md border border-rose-100 bg-rose-50/80 px-2.5 py-2">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">Reason</p>
                            <p className="mt-0.5 text-xs text-rose-900">{rejectionReason}</p>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
