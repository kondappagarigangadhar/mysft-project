'use client';

import React from 'react';
import { BpStatusBadge, paymentRecordStatusTone } from '@/components/booking-payment/BpStatusBadge';
import { Button } from '@/components/ui/Button';
import { openBookingPaymentReceiptPrint } from '@/lib/openBookingPaymentReceiptPrint';
import { getPaymentTransactionId, type BookingRecord, type PaymentRecord } from '@/lib/bookingPaymentMockStore';
import { cn } from '@/lib/utils';
import { LuBadgeCheck, LuCreditCard, LuDownload, LuHash, LuIndianRupee, LuTimer } from 'react-icons/lu';

function formatInr(n: number) {
    return `₹${n.toLocaleString('en-IN')}`;
}

export function PaymentReceiptCard({
    payment,
    pendingAmount,
    booking,
    className,
}: {
    payment: PaymentRecord;
    /** Booking-level balance still to collect (after this payment is applied). */
    pendingAmount: number;
    booking?: BookingRecord | null;
    className?: string;
}) {
    const paidAmount = payment.status === 'Completed' ? payment.amount : 0;
    const txnId = getPaymentTransactionId(payment);
    const isProvisional = payment.status !== 'Completed' && Boolean(payment.receiptGeneratedAt?.trim());

    const rows: {
        label: string;
        value: React.ReactNode;
        icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>;
        accent: string;
    }[] = [
        {
            label: 'Transaction ID',
            value: <span className="font-mono text-xs sm:text-sm break-all text-slate-900">{txnId}</span>,
            icon: LuHash,
            accent: 'bg-violet-50 text-violet-800 ring-violet-100',
        },
        {
            label: 'Payment status',
            value: <BpStatusBadge tone={paymentRecordStatusTone(payment.status)}>{payment.status}</BpStatusBadge>,
            icon: LuBadgeCheck,
            accent: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
        },
        {
            label: 'Payment mode',
            value: <span className="font-medium text-slate-900">{payment.mode}</span>,
            icon: LuCreditCard,
            accent: 'bg-slate-100 text-slate-800 ring-slate-200/80',
        },
        {
            label: 'Paid amount',
            value: <span className="text-lg font-bold tabular-nums text-emerald-900">{formatInr(paidAmount)}</span>,
            icon: LuIndianRupee,
            accent: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
        },
        {
            label: 'Pending amount',
            value: <span className="text-lg font-bold tabular-nums text-amber-950">{formatInr(Math.max(0, pendingAmount))}</span>,
            icon: LuTimer,
            accent: 'bg-amber-50 text-amber-900 ring-amber-100',
        },
    ];

    return (
        <div
            className={cn(
                'rounded-2xl border p-4 sm:p-5 shadow-md ring-1',
                isProvisional
                    ? 'border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 ring-amber-900/10'
                    : 'border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 ring-emerald-900/5',
                className
            )}
        >
            <div
                className={cn(
                    'flex flex-col gap-1 pb-4 mb-4 border-b',
                    isProvisional ? 'border-amber-200/70' : 'border-emerald-200/60'
                )}
            >
                <p
                    className={cn(
                        'text-[11px] font-bold uppercase tracking-[0.08em]',
                        isProvisional ? 'text-amber-900/90' : 'text-emerald-800/90'
                    )}
                >
                    {isProvisional ? 'Provisional receipt' : 'Payment receipt'}
                </p>
                <p className="text-sm font-semibold text-slate-900">
                    {isProvisional ? 'Payment not yet confirmed — for reference only' : 'Transaction completed'}
                </p>
                <p className="text-xs text-slate-600">
                    Receipt <span className="font-mono text-slate-800">{payment.receiptNumber}</span>
                    {payment.date ? <span className="text-slate-500"> · {payment.date}</span> : null}
                </p>
                <div className="pt-2">
                    <Button
                        type="button"
                        variant="companyOutline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => openBookingPaymentReceiptPrint(payment, booking ?? null)}
                    >
                        <LuDownload size={14} aria-hidden />
                        Download PDF
                    </Button>
                    <span className="ml-2 text-[10px] text-slate-500">Opens print — choose Save as PDF</span>
                </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                {rows.map(({ label, value, icon: Icon, accent }) => (
                    <div
                        key={label}
                        className="flex gap-3 rounded-xl border border-slate-200/80 bg-white/90 px-3.5 py-3 shadow-sm ring-1 ring-slate-900/5"
                    >
                        <span
                            className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1',
                                accent
                            )}
                        >
                            <Icon size={20} aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                            <div className="text-sm">{value}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
