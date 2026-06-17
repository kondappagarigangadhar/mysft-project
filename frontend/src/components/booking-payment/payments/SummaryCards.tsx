'use client';

import React from 'react';
import { LuIndianRupee, LuTrendingUp } from 'react-icons/lu';
import type { BookingPaymentSummary } from '@/lib/bookingPaymentMockStore';

export function SummaryCards({
    summary,
    loading,
}: {
    summary: BookingPaymentSummary | null;
    loading?: boolean;
}) {
    return (
        <div>
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[1, 2, 3].map((k) => (
                        <div key={k} className="rounded-xl border border-slate-200 bg-white p-5 h-32 shadow-sm animate-pulse" />
                    ))}
                </div>
            ) : !summary ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-8 text-center text-sm text-slate-500">
                    Select a booking to load financial summary.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        {
                            label: 'Total amount',
                            value: summary.unitPrice,
                            sub: 'Agreed unit price',
                            icon: LuIndianRupee,
                            accent: 'from-slate-50 to-white ring-slate-200/80',
                            valueClass: 'text-slate-900',
                        },
                        {
                            label: 'Paid amount',
                            value: summary.paidCompleted,
                            sub: 'Completed collections',
                            icon: LuTrendingUp,
                            accent: 'from-emerald-50/80 to-white ring-emerald-100',
                            valueClass: 'text-emerald-800',
                        },
                        {
                            label: 'Outstanding',
                            value: summary.outstanding,
                            sub: 'Remaining to collect',
                            icon: LuIndianRupee,
                            accent: 'from-amber-50/80 to-white ring-amber-100',
                            valueClass: 'text-amber-900',
                        },
                    ].map((c) => (
                        <div
                            key={c.label}
                            className={`rounded-xl border border-slate-200/90 bg-gradient-to-br ${c.accent} p-5 shadow-sm ring-1 transition-shadow hover:shadow-md`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{c.label}</p>
                                <c.icon size={18} className="text-slate-300 shrink-0" aria-hidden />
                            </div>
                            <p className={`mt-3 text-2xl font-black tabular-nums ${c.valueClass}`}>₹{c.value.toLocaleString('en-IN')}</p>
                            <p className="text-xs text-slate-500 mt-1.5">{c.sub}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
