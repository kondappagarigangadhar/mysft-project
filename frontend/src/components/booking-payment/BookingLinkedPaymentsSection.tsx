'use client';

import Link from 'next/link';
import { getPaymentsForBooking } from '@/lib/bookingPaymentMockStore';

const PAY = '/company-admin/booking-payment/payments';

export function BookingLinkedPaymentsSection({ bookingSlug }: { bookingSlug: string }) {
    const payments = getPaymentsForBooking(bookingSlug);

    if (payments.length === 0) {
        return (
            <section className="mt-10 rounded-xl border border-slate-200 bg-slate-50/80 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Payments</h2>
                <p className="mt-2 text-sm text-slate-600">No payments recorded for this booking yet.</p>
                <Link
                    href={`${PAY}/add?booking=${encodeURIComponent(bookingSlug)}`}
                    className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                >
                    Add payment
                </Link>
            </section>
        );
    }

    return (
        <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Payments for this booking</h2>
                <Link href={PAY} className="text-sm font-semibold text-primary hover:underline">
                    Open payments
                </Link>
            </div>
            <ul className="mt-3 divide-y divide-slate-100">
                {payments.map((p) => (
                    <li key={p.slug} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0">
                        <div>
                            <span className="font-medium text-slate-900">{p.receiptNumber}</span>
                            <span className="ml-2 text-sm text-slate-500">
                                {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR' }).format(p.amount)}
                            </span>
                            <span className="ml-2 text-xs text-slate-400">{p.status}</span>
                        </div>
                        <div className="flex gap-3 text-sm">
                            <Link href={`${PAY}/view/${encodeURIComponent(p.slug)}`} className="font-semibold text-primary hover:underline">
                                View
                            </Link>
                            <Link href={`${PAY}/edit/${encodeURIComponent(p.slug)}`} className="font-semibold text-slate-600 hover:underline">
                                Edit
                            </Link>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
