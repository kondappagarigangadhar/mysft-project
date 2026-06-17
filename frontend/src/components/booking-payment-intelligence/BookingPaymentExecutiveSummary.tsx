'use client';

import React from 'react';
import {
    LuCalendarClock,
    LuIndianRupee,
    LuLink,
    LuPercent,
    LuSparkles,
    LuTriangleAlert,
    LuWallet,
} from 'react-icons/lu';
import { DemandClickableCard } from '@/components/demand-intelligence/DemandClickableLink';
import type { BookingIntelExecutiveKpis } from '@/lib/bookingPaymentIntelligenceStore';
import { BP_INTEL_SECTION_IDS } from '@/lib/bookingPaymentIntelligenceRoutes';
import { formatBookingAmount } from '@/lib/bookingPaymentIntelligenceHelpers';
import { cn } from '@/lib/utils';

export function BookingPaymentExecutiveSummary({ executive }: { executive: BookingIntelExecutiveKpis }) {
    const metrics = [
        {
            label: 'Total outstanding',
            value: formatBookingAmount(executive.totalOutstanding),
            sub: 'Active bookings',
            icon: LuIndianRupee,
            tone: 'border-rose-200 bg-rose-50 text-rose-900',
            href: `#${BP_INTEL_SECTION_IDS.paymentRisk}`,
        },
        {
            label: 'Collection efficiency',
            value: `${executive.collectionEfficiencyPct}%`,
            sub: 'Portfolio',
            icon: LuPercent,
            tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
            href: `#${BP_INTEL_SECTION_IDS.ranking}`,
        },
        {
            label: 'Overdue installments',
            value: String(executive.overdueInstallments),
            sub: 'Needs follow-up',
            icon: LuTriangleAlert,
            tone: 'border-rose-200 bg-rose-50 text-rose-900',
            href: `#${BP_INTEL_SECTION_IDS.paymentRisk}`,
        },
        {
            label: 'Pending payment links',
            value: String(executive.pendingPaymentLinks),
            sub: 'Awaiting payment',
            icon: LuLink,
            tone: 'border-amber-200 bg-amber-50 text-amber-900',
            href: `#${BP_INTEL_SECTION_IDS.actions}`,
        },
        {
            label: 'Bookings at risk',
            value: String(executive.bookingsAtRisk),
            sub: 'High delay risk',
            icon: LuWallet,
            tone: 'border-rose-200 bg-rose-50 text-rose-900',
            href: `#${BP_INTEL_SECTION_IDS.table}`,
        },
        {
            label: 'Expected this month',
            value: formatBookingAmount(executive.expectedCollectionsThisMonth),
            sub: 'Likely collections',
            icon: LuCalendarClock,
            tone: 'border-cyan-200 bg-cyan-50 text-cyan-900',
            href: `#${BP_INTEL_SECTION_IDS.collection}`,
        },
    ] as const;

    return (
        <section
            aria-label="AI executive summary"
            className="overflow-hidden rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/90 via-white to-blue-50/80 p-5 shadow-md ring-1 ring-violet-100/80"
        >
            <div className="flex flex-wrap items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-sm">
                    <LuSparkles size={20} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">AI executive summary</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">
                        Collections & payment snapshot — what is overdue and what to collect today
                    </p>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {metrics.map((m) => {
                    const Icon = m.icon;
                    return (
                        <DemandClickableCard key={m.label} href={m.href} className={cn('rounded-xl border p-3', m.tone)}>
                            <div className="flex items-center justify-between gap-1">
                                <p className="text-[10px] font-bold uppercase tracking-wide opacity-85">{m.label}</p>
                                <Icon size={14} aria-hidden className="opacity-70" />
                            </div>
                            <p className="mt-1 text-xl font-bold tabular-nums">{m.value}</p>
                            <p className="mt-0.5 text-[10px] font-medium opacity-75">{m.sub}</p>
                        </DemandClickableCard>
                    );
                })}
            </div>

            <div className="mt-4 rounded-xl border border-violet-100/90 bg-white/80 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">AI summary</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{executive.narrative}</p>
            </div>
        </section>
    );
}
