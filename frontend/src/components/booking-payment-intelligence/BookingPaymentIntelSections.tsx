'use client';

import React from 'react';
import { LuArrowRight, LuZap } from 'react-icons/lu';
import { LeadsIntelAiPanel, LeadsIntelAiSectionHeader } from '@/components/leads-intelligence/leadsIntelligenceUi';
import { DemandClickableCard, DemandClickableLink } from '@/components/demand-intelligence/DemandClickableLink';
import type {
    BookingCollectionOpportunity,
    BookingIntelRecord,
    BookingPaymentRiskRow,
    BookingRecommendedAction,
} from '@/lib/bookingPaymentIntelligenceStore';
import {
    collectionScoreTone,
    formatBookingAmount,
    paymentRiskClass,
} from '@/lib/bookingPaymentIntelligenceHelpers';
import {
    BP_INTEL_SECTION_IDS,
    getBookingIntelActionHref,
    getBookingIntelHref,
} from '@/lib/bookingPaymentIntelligenceRoutes';
import { cn } from '@/lib/utils';

const th = 'px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500';
const td = 'px-4 py-3 text-sm text-slate-800 align-middle';

const priorityTone: Record<BookingRecommendedAction['priority'], string> = {
    High: 'bg-rose-100 text-rose-800 border-rose-200',
    Medium: 'bg-amber-100 text-amber-800 border-amber-200',
    Low: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function BookingRecommendedActions({ actions }: { actions: BookingRecommendedAction[] }) {
    return (
        <div id={BP_INTEL_SECTION_IDS.actions} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="amber" aria-label="AI recommended actions">
                <LeadsIntelAiSectionHeader
                    title="AI Recommended Actions"
                    subtitle="Exact collection steps for management — ranked by amount and urgency."
                    variant="amber"
                    badge="Do today"
                />
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                    {actions.length === 0 ? (
                        <p className="col-span-full px-4 py-8 text-center text-sm text-slate-500">No actions in this view.</p>
                    ) : (
                        actions.map((a) => {
                            const href = getBookingIntelActionHref(a.bookingSlug, a.title);
                            return (
                                <DemandClickableCard
                                    key={a.id}
                                    href={href}
                                    className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/60 to-white p-4"
                                >
                                    <p className="text-sm font-bold text-slate-900">{a.title}</p>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                        <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 font-semibold text-emerald-800">
                                            Impact: {formatBookingAmount(a.expectedAmount)}
                                        </span>
                                        <span className={cn('rounded-lg border px-2 py-1 font-semibold', priorityTone[a.priority])}>
                                            Priority: {a.priority}
                                        </span>
                                        <span className="rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 font-semibold text-violet-800">
                                            Confidence: {a.confidence}%
                                        </span>
                                    </div>
                                    {href ? <p className="mt-2 text-[10px] font-semibold text-violet-700">Open booking →</p> : null}
                                </DemandClickableCard>
                            );
                        })
                    )}
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function BookingCollectionOpportunityCenter({ opportunities }: { opportunities: BookingCollectionOpportunity[] }) {
    return (
        <div id={BP_INTEL_SECTION_IDS.collection} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="emerald" aria-label="Collection opportunity center">
                <LeadsIntelAiSectionHeader
                    title="Collection Opportunity Center"
                    subtitle="Where collections will come from — high-confidence dues due this week."
                    variant="emerald"
                />
                {opportunities.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">No collection opportunities in this view.</p>
                ) : (
                    <div className="grid gap-3 p-4 sm:grid-cols-2">
                        {opportunities.map((o) => {
                            const href = getBookingIntelHref(o.bookingSlug, 'payments');
                            return (
                                <DemandClickableCard
                                    key={o.id}
                                    href={href}
                                    className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-sm"
                                >
                                    <p className="font-bold text-slate-900">{o.customerName}</p>
                                    <p className="text-xs text-violet-800">{o.projectName}</p>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <p className="font-bold uppercase tracking-wide text-slate-500">Likely collection</p>
                                            <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-800">
                                                {formatBookingAmount(o.likelyCollectionAmount)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="font-bold uppercase tracking-wide text-slate-500">Due within</p>
                                            <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-800">{o.dueWithinDays} days</p>
                                        </div>
                                    </div>
                                    {o.collectionScore >= 85 ? (
                                        <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700">
                                            <LuZap size={12} aria-hidden />
                                            High confidence
                                        </p>
                                    ) : null}
                                    {href ? <p className="mt-2 text-[10px] font-semibold text-violet-700">View payments →</p> : null}
                                </DemandClickableCard>
                            );
                        })}
                    </div>
                )}
            </LeadsIntelAiPanel>
        </div>
    );
}

export function BookingPaymentRiskCenter({ rows }: { rows: BookingPaymentRiskRow[] }) {
    return (
        <div id={BP_INTEL_SECTION_IDS.paymentRisk} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="rose" aria-label="Payment risk center">
                <LeadsIntelAiSectionHeader
                    title="Payment Risk Center"
                    subtitle="Overdue milestones and delayed collections — act before defaults."
                    variant="rose"
                />
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-rose-100/80 bg-rose-50/50">
                                <th className={th}>Customer</th>
                                <th className={th}>Project</th>
                                <th className={th}>Milestone</th>
                                <th className={th}>Days overdue</th>
                                <th className={th}>Overdue amount</th>
                                <th className={th}>Risk</th>
                                <th className={th}>Recommended action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No payment risks in this view.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row, i) => {
                                    const href = getBookingIntelHref(row.bookingSlug, 'payments');
                                    return (
                                        <tr key={row.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                            <td className={cn(td, 'font-semibold')}>
                                                <DemandClickableLink href={href}>{row.customerName}</DemandClickableLink>
                                            </td>
                                            <td className={td}>{row.projectName}</td>
                                            <td className={td}>{row.milestone}</td>
                                            <td className={cn(td, 'tabular-nums font-semibold text-rose-700')}>{row.daysOverdue} days</td>
                                            <td className={cn(td, 'tabular-nums font-bold')}>{formatBookingAmount(row.overdueAmount)}</td>
                                            <td className={td}>
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold leading-none',
                                                        paymentRiskClass(row.riskLevel),
                                                    )}
                                                >
                                                    {row.riskLevel}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'text-xs font-medium')}>{row.recommendedAction}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function BookingCollectionRanking({ bookings }: { bookings: BookingIntelRecord[] }) {
    return (
        <div id={BP_INTEL_SECTION_IDS.ranking} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="indigo" aria-label="Booking collection ranking">
                <LeadsIntelAiSectionHeader
                    title="Booking Collection Ranking"
                    subtitle="Ranked by AI collection score — strongest payers and recoveries first."
                    variant="indigo"
                />
                <div className="grid gap-2 p-4 sm:grid-cols-2">
                    {bookings.map((b, idx) => {
                        const href = getBookingIntelHref(b.bookingSlug, 'overview');
                        return (
                            <DemandClickableCard
                                key={b.id}
                                href={href}
                                className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                            >
                                <span
                                    className={cn(
                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-sm font-bold tabular-nums',
                                        collectionScoreTone(b.collectionScore),
                                    )}
                                >
                                    #{idx + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-900">{b.customerName}</p>
                                    <p className="text-xs text-violet-800">{b.projectName}</p>
                                    <p
                                        className={cn(
                                            'text-2xl font-bold tabular-nums',
                                            collectionScoreTone(b.collectionScore).split(' ')[0],
                                        )}
                                    >
                                        {b.collectionScore}
                                    </p>
                                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600">
                                        <span>
                                            Paid: <span className="font-semibold text-slate-900">{b.paidPct}%</span>
                                        </span>
                                        <span>
                                            Outstanding:{' '}
                                            <span className="font-semibold tabular-nums">{formatBookingAmount(b.outstanding)}</span>
                                        </span>
                                        <span className="col-span-2">
                                            Status: <span className="font-semibold">{b.bookingStatus}</span>
                                            {b.daysOverdue > 0 ? (
                                                <span className="ml-2 text-rose-700">{b.daysOverdue}d overdue</span>
                                            ) : null}
                                        </span>
                                    </div>
                                </div>
                            </DemandClickableCard>
                        );
                    })}
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function BookingPaymentInsightsTable({ bookings }: { bookings: BookingIntelRecord[] }) {
    return (
        <div id={BP_INTEL_SECTION_IDS.table} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="violet" aria-label="Booking and payment intelligence table">
                <LeadsIntelAiSectionHeader
                    title="Booking & Payment Intelligence"
                    subtitle="Single management view — collection progress, risk, next due, and AI recommendation."
                    variant="violet"
                />
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-violet-100/80 bg-violet-50/50">
                                <th className={th}>Customer</th>
                                <th className={th}>Project</th>
                                <th className={th}>Status</th>
                                <th className={th}>Paid %</th>
                                <th className={th}>Outstanding</th>
                                <th className={th}>Next due</th>
                                <th className={th}>Risk</th>
                                <th className={th}>AI recommendation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No bookings match filters.
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((b, i) => {
                                    const overviewHref = getBookingIntelHref(b.bookingSlug, 'overview');
                                    const paymentsHref = getBookingIntelHref(b.bookingSlug, 'payments');
                                    return (
                                        <tr key={b.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                            <td className={cn(td, 'font-semibold')}>
                                                <DemandClickableLink href={overviewHref} showArrow>
                                                    {b.customerName}
                                                </DemandClickableLink>
                                            </td>
                                            <td className={td}>{b.projectName}</td>
                                            <td className={td}>
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold leading-none',
                                                        b.bookingStatus === 'Confirmed'
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                            : b.bookingStatus === 'Pending'
                                                              ? 'border-amber-200 bg-amber-50 text-amber-800'
                                                              : 'border-slate-200 bg-slate-50 text-slate-700',
                                                    )}
                                                >
                                                    {b.bookingStatus}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'tabular-nums font-semibold')}>{b.paidPct}%</td>
                                            <td className={cn(td, 'tabular-nums font-semibold')}>
                                                {formatBookingAmount(b.outstanding)}
                                            </td>
                                            <td className={td}>
                                                <DemandClickableLink href={paymentsHref} className="tabular-nums">
                                                    {b.nextDueDate} · {formatBookingAmount(b.nextDueAmount)}
                                                </DemandClickableLink>
                                            </td>
                                            <td className={td}>
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold leading-none',
                                                        paymentRiskClass(b.riskLevel),
                                                    )}
                                                >
                                                    {b.riskLevel}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'text-xs font-semibold text-violet-900')}>
                                                <DemandClickableLink href={paymentsHref} className="inline-flex items-center gap-1">
                                                    {b.aiRecommendation}
                                                    <LuArrowRight size={12} className="opacity-60" aria-hidden />
                                                </DemandClickableLink>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}
