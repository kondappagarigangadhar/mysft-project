'use client';

import React from 'react';
import { LuCalendarClock, LuIndianRupee, LuLayers } from 'react-icons/lu';
import type { PaymentPlan } from '@/lib/bookingPaymentMockStore';

export function PaymentPlanSummaryCard({ plan, loading }: { plan: PaymentPlan | null; loading?: boolean }) {
    if (loading) {
        return (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 animate-pulse">
                <div className="h-14 bg-slate-100 rounded-lg" />
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500">
                No payment plan linked to this booking.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/90 px-4 py-4 sm:px-5 shadow-sm ring-1 ring-slate-900/5">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
                <div className="flex items-start gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] text-[var(--cta-button-bg)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]">
                        <LuLayers size={20} aria-hidden />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Plan name</p>
                        <p className="font-semibold text-slate-900 truncate">{plan.planName}</p>
                    </div>
                </div>
                <div className="hidden sm:block h-10 w-px bg-slate-200 shrink-0" aria-hidden />
                <div className="flex flex-wrap gap-6 sm:gap-8">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                            <LuIndianRupee size={12} className="opacity-70" aria-hidden />
                            Total amount
                        </p>
                        <p className="text-lg font-bold tabular-nums text-slate-900">₹{plan.totalPlanAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                            <LuCalendarClock size={12} className="opacity-70" aria-hidden />
                            Installments
                        </p>
                        <p className="text-lg font-bold tabular-nums text-slate-900">{plan.installmentCount}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
