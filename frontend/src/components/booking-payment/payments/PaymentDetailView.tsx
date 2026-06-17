'use client';

import React from 'react';
import { BpStatusBadge, paymentRecordStatusTone } from '@/components/booking-payment/BpStatusBadge';
import { PaymentReceiptCard } from '@/components/booking-payment/payments/PaymentReceiptCard';
import {
    formatFrequencyLabel,
    getPaymentPlanForBooking,
    isPaymentReceiptReady,
    type BookingRecord,
    type PaymentRecord,
} from '@/lib/bookingPaymentMockStore';
import { PaymentAIInsightsSection } from '@/components/ai/PaymentAIInsightsSection';

export function PaymentDetailView({
    payment,
    pendingAmount,
    booking,
}: {
    payment: PaymentRecord;
    pendingAmount: number;
    booking: BookingRecord | null;
}) {
    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:items-start lg:gap-8">
            <div className="min-w-0 space-y-6">
                {isPaymentReceiptReady(payment) ? (
                    <PaymentReceiptCard payment={payment} pendingAmount={pendingAmount} booking={booking} />
                ) : null}

                <div className="rounded-xl border border-slate-200/90 bg-slate-50/40 p-4 ring-1 ring-slate-900/5">
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Payment details</p>
                    <dl className="grid gap-0 divide-y divide-slate-200/80 overflow-hidden rounded-lg border border-slate-200/80 bg-white text-sm">
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 px-3 py-2.5 sm:px-4">
                        <dt className="text-slate-500">Payment ID</dt>
                        <dd className="font-mono text-xs font-semibold text-slate-900 text-right break-all">{payment.slug}</dd>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 px-3 py-2.5 sm:px-4">
                        <dt className="text-slate-500">Booking ID</dt>
                        <dd className="font-mono text-xs text-slate-800 text-right break-all">{payment.bookingSlug}</dd>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 px-3 py-2.5 sm:px-4">
                        <dt className="text-slate-500">Milestone</dt>
                        <dd className="font-medium text-slate-900 text-right">
                            {getPaymentPlanForBooking(payment.bookingSlug)?.milestones.find((m) => m.id === payment.milestoneId)?.name ??
                                payment.milestoneId}
                        </dd>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 px-3 py-2.5 sm:px-4">
                        <dt className="text-slate-500">Source</dt>
                        <dd className="text-slate-900 text-right">{payment.source === 'Payment Link' ? 'Payment link' : 'Manual'}</dd>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 px-3 py-2.5 sm:px-4">
                        <dt className="text-slate-500">Amount</dt>
                        <dd className="font-bold tabular-nums text-slate-900 text-right">₹{payment.amount.toLocaleString('en-IN')}</dd>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 px-3 py-2.5 sm:px-4">
                        <dt className="text-slate-500">Date</dt>
                        <dd className="text-slate-900 text-right">{payment.date}</dd>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 px-3 py-2.5 sm:px-4">
                        <dt className="text-slate-500">Receipt #</dt>
                        <dd className="font-mono text-xs text-slate-800 text-right">{payment.receiptNumber}</dd>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 px-3 py-2.5 sm:px-4 items-center">
                        <dt className="text-slate-500">Status</dt>
                        <dd className="flex justify-end">
                            <BpStatusBadge tone={paymentRecordStatusTone(payment.status)}>{payment.status}</BpStatusBadge>
                        </dd>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 px-3 py-2.5 sm:px-4">
                        <dt className="text-slate-500">Type</dt>
                        <dd className="font-medium text-slate-900 text-right">
                            {(payment.scheduleType ?? 'full') === 'installment' ? 'Installment' : 'Full'}
                        </dd>
                    </div>
                    {(payment.scheduleType ?? 'full') === 'installment' ? (
                        <>
                            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 px-3 py-2.5 sm:px-4">
                                <dt className="text-slate-500">Frequency</dt>
                                <dd className="text-right text-slate-900">{formatFrequencyLabel(payment.frequency ?? undefined)}</dd>
                            </div>
                            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2 px-3 py-2.5 sm:px-4">
                                <dt className="text-slate-500">Schedule start</dt>
                                <dd className="text-right text-slate-900">{payment.scheduleStartDate ?? '—'}</dd>
                            </div>
                        </>
                    ) : null}
                    </dl>
                </div>
            </div>

            <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start" aria-label="AI payment insights">
                <div className="rounded-2xl border border-violet-200/45 bg-linear-to-b from-violet-50/35 via-white to-slate-50/40 p-3 shadow-sm ring-1 ring-violet-100/50">
                    <PaymentAIInsightsSection payment={payment} booking={booking} />
                </div>
            </aside>
        </div>
    );
}

