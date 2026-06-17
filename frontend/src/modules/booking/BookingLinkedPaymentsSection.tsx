'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useMemo } from 'react';
import {
    buildPaymentPlanFromBooking,
    getBookingBySlug,
    getPaymentsForBooking,
    getPaymentTransactionId,
} from '@/lib/bookingPaymentMockStore';
import { formatShortDate } from '@/lib/formatDate';
import { cn } from '@/lib/utils';
import { CTA_FOCUS_VISIBLE_RING, CTA_FLOW_LINK_SEMIBOLD, CTA_SHADOW_SOFT } from '@/lib/theme/ctaThemeClasses';
import { LuCreditCard, LuPlus } from 'react-icons/lu';

const PAY = '/company-admin/booking-payment/payments';

function withReturnTo(href: string, pathname: string) {
    if (!pathname) return href;
    const sep = href.includes('?') ? '&' : '?';
    return `${href}${sep}returnTo=${encodeURIComponent(pathname)}`;
}

function inr(n: number): string {
    return `₹${n.toLocaleString('en-IN')}`;
}

function paymentStatusClass(status: string): string {
    const s = status.toLowerCase();
    if (s === 'completed') return 'bg-emerald-50 text-emerald-900 ring-emerald-200/80';
    if (s === 'pending') return 'bg-amber-50 text-amber-900 ring-amber-200/80';
    if (s === 'failed') return 'bg-red-50 text-red-900 ring-red-200/80';
    return 'bg-slate-50 text-slate-800 ring-slate-200/80';
}

export function BookingLinkedPaymentsSection({ bookingSlug }: { bookingSlug: string }) {
    const pathname = usePathname() ?? '';
    const returnTo = pathname.startsWith('/') && !pathname.startsWith('//') ? pathname : '';
    const payments = getPaymentsForBooking(bookingSlug);

    const addPaymentHref = withReturnTo(`${PAY}/add?booking=${encodeURIComponent(bookingSlug)}`, returnTo);

    const milestoneName = useMemo(() => {
        const b = getBookingBySlug(bookingSlug);
        if (!b) return (_id: string) => '—';
        const plan = buildPaymentPlanFromBooking(b);
        return (id: string) => plan.milestones.find((m) => m.id === id)?.name ?? id;
    }, [bookingSlug]);

    const sorted = useMemo(
        () => [...payments].sort((a, b) => b.date.localeCompare(a.date) || b.receiptNumber.localeCompare(a.receiptNumber)),
        [payments]
    );

    return (
        <div className="mt-2 space-y-4 rounded-2xl border border-slate-200/90 bg-linear-to-br from-slate-50/90 via-white to-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] p-4 shadow-md shadow-slate-900/5 ring-1 ring-slate-900/5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 text-base font-bold text-slate-900">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
                            <LuCreditCard size={20} aria-hidden />
                        </span>
                        <span>Payment ledger</span>
                    </div>
                    <p className="mt-2 max-w-prose text-xs leading-relaxed text-slate-600">
                        All receipts linked to this booking. Open a row to see the full payment record, or add a new receipt from Add
                        payment.
                    </p>
                    <p className="mt-2 text-[11px] text-slate-500">
                        <span className="font-sans font-medium text-slate-400">Booking</span>{' '}
                        <Link
                            href={withReturnTo(`/company-admin/booking-payment/booking/view/${encodeURIComponent(bookingSlug)}`, returnTo)}
                            className={cn(
                                'font-mono font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                                CTA_FOCUS_VISIBLE_RING,
                                'text-[var(--cta-button-bg)] transition hover:text-[var(--cta-button-hover-bg)]',
                            )}
                        >
                            {bookingSlug}
                        </Link>
                    </p>
                </div>
                <Link
                    href={addPaymentHref}
                    className={cn(
                        'inline-flex h-[44px] min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-[var(--cta-button-text)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:w-auto',
                        'bg-[var(--cta-button-bg)] hover:bg-[var(--cta-button-hover-bg)]',
                        CTA_SHADOW_SOFT,
                        CTA_FOCUS_VISIBLE_RING,
                    )}
                >
                    <LuPlus size={18} aria-hidden />
                    Add payment
                </Link>
            </div>

            {sorted.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 px-4 py-10 text-center">
                    <p className="text-sm font-medium text-slate-700">No payments recorded yet</p>
                    <p className="mt-1 text-xs text-slate-500">When you record a payment against this booking, it will appear here.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/5">
                    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/95 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                                <th className="whitespace-nowrap px-3 py-3 pl-4 sm:px-4">Receipt</th>
                                <th className="whitespace-nowrap px-3 py-3">Payment date</th>
                                <th className="min-w-[8rem] px-3 py-3">Milestone</th>
                                <th className="whitespace-nowrap px-3 py-3 text-right">Amount</th>
                                <th className="whitespace-nowrap px-3 py-3">Mode</th>
                                <th className="whitespace-nowrap px-3 py-3">Source</th>
                                <th className="whitespace-nowrap px-3 py-3">Status</th>
                                <th className="min-w-[7rem] px-3 py-3">Transaction</th>
                                <th className="whitespace-nowrap px-3 py-3 pr-4 text-right sm:pr-5">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sorted.map((p) => {
                                const txn = getPaymentTransactionId(p);
                                return (
                                    <tr key={p.slug} className="bg-white transition-colors hover:bg-slate-50/80">
                                        <td className="whitespace-nowrap px-3 py-3 pl-4 sm:px-4">
                                            <Link
                                                href={withReturnTo(`${PAY}/view/${encodeURIComponent(p.slug)}`, returnTo)}
                                                title="View payment"
                                                className={cn(
                                                    '-mx-1 inline-flex min-h-9 min-w-0 items-center rounded-md px-1 font-mono text-xs font-bold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                                                    CTA_FOCUS_VISIBLE_RING,
                                                    CTA_FLOW_LINK_SEMIBOLD,
                                                )}
                                            >
                                                {p.receiptNumber}
                                            </Link>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 tabular-nums text-slate-700">
                                            {formatShortDate(p.date)}
                                        </td>
                                        <td className="px-3 py-3 text-slate-800">
                                            <span className="line-clamp-2 text-xs font-medium leading-snug" title={milestoneName(p.milestoneId)}>
                                                {milestoneName(p.milestoneId)}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums text-slate-900">
                                            {inr(p.amount)}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 text-slate-700">{p.mode}</td>
                                        <td className="px-3 py-3 text-xs text-slate-600">{p.source}</td>
                                        <td className="whitespace-nowrap px-3 py-3">
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1',
                                                    paymentStatusClass(p.status)
                                                )}
                                            >
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="max-w-[9rem] px-3 py-3">
                                            <span className="block truncate font-mono text-[11px] text-slate-600" title={txn}>
                                                {txn}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 pr-4 text-right sm:pr-5">
                                            <div className="inline-flex flex-wrap justify-end gap-x-3 gap-y-1 text-sm font-semibold">
                                                <Link
                                                    href={withReturnTo(`${PAY}/view/${encodeURIComponent(p.slug)}`, returnTo)}
                                                    className={CTA_FLOW_LINK_SEMIBOLD}
                                                >
                                                    View
                                                </Link>
                                                <Link
                                                    href={withReturnTo(`${PAY}/edit/${encodeURIComponent(p.slug)}`, returnTo)}
                                                    className="text-slate-600 hover:underline"
                                                >
                                                    Edit
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
