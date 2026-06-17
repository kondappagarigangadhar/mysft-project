'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import {
    InstallmentPlanCard,
    type InstallmentReminderPayload,
} from '@/components/booking-payment/payments/InstallmentPlanCard';
import {
    getBookingBySlug,
    getBookings,
    getInstallmentPaymentsForBooking,
    getPaymentBySlug,
} from '@/lib/bookingPaymentMockStore';
import { LuArrowLeft } from 'react-icons/lu';

function InstallmentsPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [v, setV] = useState(0);
    const bump = () => setV((x) => x + 1);

    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const dismissToast = () => setToast(null);

    const handleInstallmentReminder = (p: InstallmentReminderPayload) => {
        const pay = getPaymentBySlug(p.paymentSlug);
        if (!pay) {
            setToast({ msg: 'Payment not found.', err: true });
            return;
        }
        const scope =
            p.installmentNo != null
                ? `Installment #${p.installmentNo} · ${p.receiptNumber}`
                : `Schedule · ${p.receiptNumber} (${p.milestoneName})`;
        const amt =
            p.pendingAmount != null
                ? `₹${p.pendingAmount.toLocaleString('en-IN')} outstanding`
                : `₹${pay.amount.toLocaleString('en-IN')} total`;
        setToast({
            msg: `Reminder queued: ${scope} — ${amt}. SMS / email simulated (demo).`,
        });
    };

    const bookings = useMemo(() => getBookings(), [v]);

    const [selectedBookingSlug, setSelectedBookingSlug] = useState('');

    useEffect(() => {
        const b = searchParams.get('booking')?.trim();
        if (b && getBookingBySlug(b)) {
            setSelectedBookingSlug(b);
        } else {
            setSelectedBookingSlug('');
        }
    }, [searchParams]);

    const onBookingChange = (slug: string) => {
        setSelectedBookingSlug(slug);
        if (slug) {
            router.replace(`/company-admin/booking-payment/payments/installments?booking=${encodeURIComponent(slug)}`, {
                scroll: false,
            });
        } else {
            router.replace('/company-admin/booking-payment/payments/installments', { scroll: false });
        }
    };

    const selectedBooking = useMemo(
        () => (selectedBookingSlug ? getBookingBySlug(selectedBookingSlug) ?? null : null),
        [selectedBookingSlug]
    );

    const installmentPlans = useMemo(
        () => (selectedBookingSlug ? getInstallmentPaymentsForBooking(selectedBookingSlug) : []),
        [selectedBookingSlug, v]
    );

    const backToPaymentsHref =
        selectedBookingSlug !== ''
            ? `/company-admin/booking-payment/payments?booking=${encodeURIComponent(selectedBookingSlug)}`
            : '/company-admin/booking-payment/payments';

    if (bookings.length === 0) {
        return (
            <>
                <Breadcrumb
                    items={[
                        { label: 'Booking & Payment', href: '/company-admin/booking-payment/booking' },
                        { label: 'Payments', href: '/company-admin/booking-payment/payments' },
                        { label: 'Installments', href: '/company-admin/booking-payment/payments/installments' },
                    ]}
                />
                <div className="space-y-6 pb-8">
                    <p className="text-sm text-slate-600">No bookings available. Create a booking first.</p>
                    <Link
                        href="/company-admin/booking-payment/booking"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900"
                    >
                        <LuArrowLeft size={16} aria-hidden />
                        Go to bookings
                    </Link>
                </div>
            </>
        );
    }

    return (
        <>
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}
            <Breadcrumb
                items={[
                    { label: 'Booking & Payment', href: '/company-admin/booking-payment/booking' },
                    { label: 'Payments', href: '/company-admin/booking-payment/payments' },
                    { label: 'Installments', href: '/company-admin/booking-payment/payments/installments' },
                ]}
            />
            <div className="space-y-8 pb-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div>
                    <Link
                        href={backToPaymentsHref}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 hover:text-violet-900 mb-2"
                    >
                        <LuArrowLeft size={16} aria-hidden />
                        Back to payments
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Installment schedules</h1>
                    <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
                        Cadence (weekly / monthly / etc.), number of installments, and line status (completed, pending, overdue). Edit due dates
                        and paid amounts when the parent payment is still pending.
                    </p>
                </div>
                <div className="min-w-[min(100%,280px)]">
                    <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Booking</label>
                    <select
                        value={selectedBookingSlug}
                        onChange={(e) => onBookingChange(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 shadow-sm"
                    >
                        <option value="">Select a booking…</option>
                        {bookings.map((b) => (
                            <option key={b.slug} value={b.slug}>
                                {b.customerName} · {b.projectName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedBooking ? (
                <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm ring-1 ring-slate-900/5">
                    <span className="font-semibold text-slate-900">{selectedBooking.customerName}</span>
                    <span className="text-slate-500"> · {selectedBooking.projectName}</span>
                    <span className="text-slate-400 font-mono text-xs ml-2">({selectedBooking.slug})</span>
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                    Choose a booking above to view installment schedules for that unit.
                </div>
            )}

            <section className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">Installment payment plans</h2>
                {!selectedBookingSlug ? (
                    <Card className="shadow-sm ring-1 ring-slate-900/5" contentClassName="p-8 text-center text-sm text-slate-600">
                        Select a booking to load installment plans.
                    </Card>
                ) : installmentPlans.length === 0 ? (
                    <Card className="shadow-sm ring-1 ring-slate-900/5" contentClassName="p-8 text-center text-sm text-slate-600">
                        No installment payment schedules for this booking yet. Record one from{' '}
                        <Link href={backToPaymentsHref} className="font-semibold text-violet-700 underline-offset-2 hover:underline">
                            Payments
                        </Link>{' '}
                        (add payment → choose installment cadence).
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {installmentPlans.map(({ payment, lines, milestoneName }) => (
                            <InstallmentPlanCard
                                key={payment.slug}
                                payment={payment}
                                lines={lines}
                                milestoneName={milestoneName}
                                onSaved={bump}
                                onSendReminder={handleInstallmentReminder}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
        </>
    );
}

export default function InstallmentsPage() {
    return (
        <Suspense
            fallback={<div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">Loading…</div>}
        >
            <InstallmentsPageInner />
        </Suspense>
    );
}
