'use client';

import React from 'react';
import type { VendorInvoiceApprovalStatus } from '@/lib/vendorInvoiceStore';
import { cn } from '@/lib/utils';

const FLOW: VendorInvoiceApprovalStatus[] = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Paid'];

export function VendorInvoiceApprovalStepper({ status }: { status: VendorInvoiceApprovalStatus }) {
    const activeIdx = status === 'Rejected' ? 1 : FLOW.indexOf(status === 'Paid' ? 'Paid' : status);
    const rejected = status === 'Rejected';

    return (
        <div className="mt-3 rounded-lg border border-gray-200/80 bg-white/60 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Approval workflow</p>
            <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] font-semibold">
                {FLOW.map((step, i) => {
                    const done = !rejected && i < activeIdx;
                    const active = !rejected && i === activeIdx;
                    return (
                        <React.Fragment key={step}>
                            {i > 0 ? <span className="text-slate-300" aria-hidden>→</span> : null}
                            <span
                                className={cn(
                                    'rounded-full px-2 py-0.5',
                                    active
                                        ? 'bg-[color-mix(in_srgb,var(--cta-button-bg)_14%,white)] text-[var(--cta-button-bg)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]'
                                        : done
                                          ? 'bg-emerald-50 text-emerald-800'
                                          : 'text-slate-500',
                                )}
                            >
                                {step}
                            </span>
                        </React.Fragment>
                    );
                })}
                {rejected ? (
                    <>
                        <span className="text-slate-300" aria-hidden>→</span>
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-rose-800 ring-1 ring-rose-200">Rejected</span>
                    </>
                ) : null}
            </div>
        </div>
    );
}
