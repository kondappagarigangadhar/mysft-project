'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InputField, SelectField } from '@/components/forms/Fields';
import {
    defaultInstallmentCountForCadence,
    formatFrequencyLabel,
    formatPayCadenceLabel,
    getBookingBySlug,
    getBookingPaymentSummary,
    getBookings,
    getPaymentBySlug,
    getPaymentPlanForBooking,
    payCadenceToSchedule,
    receiptExists,
    suggestNextReceiptNumber,
    updatePayment,
    type PayCadenceOption,
    type PaymentMode,
    type PaymentRecordStatus,
} from '@/lib/bookingPaymentMockStore';
import { validatePaymentForm, type PaymentFormField } from '@/lib/bookingPaymentFormValidation';
import { LuLoader } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const PAY_CADENCE_OPTIONS: PayCadenceOption[] = ['one_time', 'weekly', 'monthly', 'bimonthly', 'half_yearly', 'yearly'];

function formatInr(n: number): string {
    return `₹${n.toLocaleString('en-IN')}`;
}

export function PaymentEditForm({
    paymentSlug,
    onCancel,
    onSuccess,
}: {
    paymentSlug: string;
    onCancel: () => void;
    onSuccess: () => void;
}) {
    const [v, setV] = useState(0);
    const bump = () => setV((x) => x + 1);

    const bookings = useMemo(() => getBookings(), [v]);
    const activePayment = useMemo(() => getPaymentBySlug(paymentSlug), [paymentSlug, v]);

    const [bookingSlug, setBookingSlug] = useState('');
    const [amount, setAmount] = useState('');
    const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
    const [mode, setMode] = useState<PaymentMode>('Bank');
    const [receipt, setReceipt] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [payStatus, setPayStatus] = useState<PaymentRecordStatus>('Completed');
    const [loading, setLoading] = useState(false);
    const [saveErr, setSaveErr] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<PaymentFormField, string>>>({});

    useEffect(() => {
        const p = getPaymentBySlug(paymentSlug);
        if (!p) return;
        setBookingSlug(p.bookingSlug);
        setAmount(String(p.amount));
        setPayDate(p.date);
        setMode(p.mode);
        setReceipt(p.receiptNumber);
        setTransactionId(p.transactionId?.trim() ?? '');
        setPayStatus(p.status);
        setFieldErrors({});
    }, [paymentSlug]);

    const planForForm = useMemo(() => (bookingSlug ? getPaymentPlanForBooking(bookingSlug) : null), [bookingSlug, v]);

    const resolvedMilestoneId = useMemo(() => {
        const first = planForForm?.milestones?.[0]?.id?.trim();
        return first || 'm1';
    }, [planForForm]);

    const bookingForForm = useMemo(
        () => (bookingSlug.trim() ? getBookingBySlug(bookingSlug.trim()) ?? null : null),
        [bookingSlug, v]
    );

    const bookingMoneySummary = useMemo(() => {
        const slug = bookingSlug.trim();
        if (!slug) return null;
        return getBookingPaymentSummary(slug);
    }, [bookingSlug, v]);

    const clearPayField = (key: PaymentFormField) => {
        setFieldErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const validateBeforeSave = useCallback((): boolean => {
        const e: Partial<Record<PaymentFormField, string>> = {};
        const hasMilestones = Boolean(planForForm?.milestones?.length);
        if (!bookingSlug.trim()) e.bookingSlug = 'Select a booking.';
        if (!hasMilestones) e.plan = 'No payment plan found for this booking.';
        const amt = Number(amount);
        if (!Number.isFinite(amt) || amt <= 0) e.amount = 'Enter an amount greater than zero.';

        const base = validatePaymentForm({
            bookingSlug,
            milestoneId: resolvedMilestoneId,
            amount,
            payDate,
            receipt,
            hasMilestoneOptions: hasMilestones,
            transactionId,
            payStatus,
        });
        Object.assign(e, base);

        setFieldErrors(e);
        return Object.keys(e).length === 0;
    }, [bookingSlug, resolvedMilestoneId, amount, payDate, receipt, transactionId, payStatus, planForForm?.milestones?.length]);

    const onSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaveErr(null);
        if (!validateBeforeSave()) {
            setSaveErr('Please fix the highlighted fields.');
            return;
        }

        const amt = Number(amount);
        const cur = getPaymentBySlug(paymentSlug);
        if (cur && receipt.trim() !== cur.receiptNumber && receiptExists(receipt.trim())) {
            setFieldErrors({ receipt: 'This receipt number is already in use.' });
            setSaveErr('Receipt number must be unique.');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            const cur2 = getPaymentBySlug(paymentSlug);
            const tx = transactionId.trim();
            const res = updatePayment(paymentSlug, {
                bookingSlug,
                milestoneId: resolvedMilestoneId,
                amount: amt,
                date: payDate,
                mode,
                receiptNumber: receipt.trim(),
                status: payStatus,
                transactionId: tx || cur2?.transactionId,
            });
            if (!res.ok) {
                setLoading(false);
                setSaveErr(res.error ?? 'Could not save payment.');
                return;
            }
            bump();
            setLoading(false);
            onSuccess();
        }, 300);
    };

    const fieldDense = 'space-y-1';
    const controlDense = 'h-9 rounded-lg text-sm py-0';

    if (!activePayment) {
        return <p className="text-sm text-slate-500">Loading payment…</p>;
    }

    const isInstallment = (activePayment.scheduleType ?? 'full') === 'installment';

    return (
        <Card className="border border-slate-200/80 shadow-md shadow-slate-200/30 overflow-visible" contentClassName="p-0">
            <div className="border-b border-slate-100 bg-slate-50/60 px-3 py-2 sm:px-4 sm:flex sm:items-center sm:justify-between sm:gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] text-slate-500 leading-snug truncate">
                        {bookingForForm
                            ? `${bookingForForm.customerName} · ${bookingForForm.projectName}`
                            : 'Booking & collection'}
                    </p>
                </div>
                <div className="mt-1.5 sm:mt-0 shrink-0 text-left sm:text-right">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Payment ID</p>
                    <p className="text-[10px] font-mono text-slate-600">{activePayment.slug}</p>
                </div>
            </div>

            {bookingMoneySummary ? (
                <div className="border-b border-slate-100 bg-white px-3 py-3 sm:px-4">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total amount</p>
                            <p className="mt-1 text-base font-black tabular-nums text-slate-900">{formatInr(bookingMoneySummary.unitPrice)}</p>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">Paid amount</p>
                            <p className="mt-1 text-base font-black tabular-nums text-emerald-950">{formatInr(bookingMoneySummary.paidCompleted)}</p>
                        </div>
                        <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-900">Remaining amount</p>
                            <p className="mt-1 text-base font-black tabular-nums text-amber-950">{formatInr(bookingMoneySummary.outstanding)}</p>
                        </div>
                    </div>
                </div>
            ) : bookingSlug.trim() ? (
                <div className="border-b border-amber-100 bg-amber-50/50 px-3 py-2 sm:px-4">
                    <p className="text-xs font-medium text-amber-900">Could not load booking totals for this selection.</p>
                </div>
            ) : null}

            {saveErr ? (
                <p className="mx-3 sm:mx-4 mt-2 rounded-md border border-red-100 bg-red-50 px-2 py-1.5 text-xs text-red-800">{saveErr}</p>
            ) : null}

            <form onSubmit={onSave} className="relative">
                <div className="p-3 sm:p-4 pb-2 space-y-3">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start lg:gap-5">
                        <div className="min-w-0 max-w-full space-y-2.5 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100/80">
                            <div className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-3 py-2 sm:px-4">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Booking &amp; payment</p>
                                <p className="mt-0.5 text-[11px] text-slate-500">Total amount and how you collected.</p>
                            </div>
                            <div className="space-y-2.5 px-2.5 pb-3 pt-2 sm:px-3">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:gap-x-2">
                                    <div className="sm:col-span-12">
                                        <SelectField
                                            label="Booking ID"
                                            placeholder="Select booking"
                                            required
                                            className={fieldDense}
                                            selectClassName={cn('font-mono', controlDense)}
                                            value={bookingSlug}
                                            error={fieldErrors.bookingSlug}
                                            onChange={(e) => {
                                                setBookingSlug(e.target.value);
                                                clearPayField('bookingSlug');
                                                clearPayField('plan');
                                            }}
                                            options={bookings.map((b) => ({
                                                value: b.slug,
                                                label: `${b.customerName} — ${b.slug}`,
                                            }))}
                                        />
                                    </div>
                                    <div className="sm:col-span-12">
                                        <InputField
                                            label="Total amount"
                                            type="number"
                                            min={1}
                                            step={1}
                                            required
                                            className={fieldDense}
                                            inputClassName={controlDense}
                                            value={amount}
                                            error={fieldErrors.amount}
                                            onChange={(e) => {
                                                setAmount(e.target.value);
                                                clearPayField('amount');
                                            }}
                                        />
                                    </div>
                                </div>
                                {fieldErrors.plan ? (
                                    <p className="text-[11px] font-medium text-red-600 -mt-1">{fieldErrors.plan}</p>
                                ) : null}

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <InputField
                                        label="Payment Date"
                                        type="date"
                                        max={new Date().toISOString().slice(0, 10)}
                                        required
                                        className={fieldDense}
                                        inputClassName={controlDense}
                                        value={payDate}
                                        error={fieldErrors.payDate}
                                        onChange={(e) => {
                                            setPayDate(e.target.value);
                                            clearPayField('payDate');
                                        }}
                                    />
                                    <SelectField
                                        label="Payment Status"
                                        className={fieldDense}
                                        selectClassName={controlDense}
                                        value={payStatus}
                                        onChange={(e) => setPayStatus(e.target.value as PaymentRecordStatus)}
                                        options={[
                                            { value: 'Completed', label: 'Completed' },
                                            { value: 'Pending', label: 'Pending' },
                                            { value: 'Failed', label: 'Failed' },
                                        ]}
                                    />
                                    <SelectField
                                        label="Payment Mode"
                                        className={fieldDense}
                                        selectClassName={controlDense}
                                        value={mode}
                                        onChange={(e) => setMode(e.target.value as PaymentMode)}
                                        options={[
                                            { value: 'Cash', label: 'Cash' },
                                            { value: 'Bank', label: 'Bank' },
                                            { value: 'UPI', label: 'UPI' },
                                        ]}
                                    />
                                    <div className="sm:col-span-2">
                                        <InputField
                                            label="Transaction ID"
                                            type="text"
                                            placeholder="e.g. NEFT ref, UPI txn ID, cash voucher"
                                            className={fieldDense}
                                            inputClassName={cn(controlDense, 'font-mono')}
                                            value={transactionId}
                                            error={fieldErrors.transactionId}
                                            onChange={(e) => {
                                                setTransactionId(e.target.value);
                                                clearPayField('transactionId');
                                            }}
                                        />
                                        <p className="mt-1 text-[10px] leading-snug text-slate-500">
                                            Optional for bank, UPI, or cash. Leave blank to keep the existing reference.
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Receipt</p>
                                    <div className="mt-1.5 space-y-1">
                                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                            Receipt Number <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="flex gap-1.5">
                                            <input
                                                readOnly
                                                value={receipt}
                                                className={cn(
                                                    'h-9 min-w-0 flex-1 rounded-lg border px-2.5 text-xs font-mono',
                                                    fieldErrors.receipt ? 'border-red-500 bg-red-50/40' : 'border-slate-200 bg-slate-50 text-slate-900'
                                                )}
                                                aria-invalid={Boolean(fieldErrors.receipt)}
                                            />
                                            <Button
                                                type="button"
                                                variant="companyOutline"
                                                size="cta"
                                                className="h-9 shrink-0 px-3 text-xs"
                                                onClick={() => {
                                                    setReceipt(suggestNextReceiptNumber(bookingSlug));
                                                    clearPayField('receipt');
                                                }}
                                            >
                                                Regenerate
                                            </Button>
                                        </div>
                                        {fieldErrors.receipt ? (
                                            <p className="text-[11px] font-medium text-red-600">{fieldErrors.receipt}</p>
                                        ) : null}
                                        <p className="text-[10px] leading-snug text-slate-500">
                                            Suggested for project{bookingForForm ? `: ${bookingForForm.projectName}` : ''}. Regenerate if
                                            duplicate.
                                        </p>
                                    </div>
                                </div>

                                <p className="text-[11px] text-slate-500">
                                    Source:{' '}
                                    <span className="font-medium text-slate-700">
                                        {activePayment.source === 'Payment Link' ? 'Payment link' : 'Manual'}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="min-w-0 lg:sticky lg:top-4 lg:z-1 lg:self-start">
                            <div
                                className={cn(
                                    'overflow-hidden rounded-xl border-2 border-amber-200/70 bg-linear-to-br from-amber-50/90 via-white to-amber-50/40',
                                    'shadow-md shadow-amber-900/5 ring-1 ring-amber-100/80',
                                    'max-h-screen overflow-y-auto p-4 sm:p-5'
                                )}
                            >
                                <div className="flex items-start justify-between gap-2 border-b border-amber-200/50 pb-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Collection schedule</p>
                                        <p className="mt-1 text-xs leading-snug text-slate-600">
                                            {isInstallment
                                                ? 'This payment was saved with an installment schedule. Lines are read-only here.'
                                                : 'One-time payment — same structure as add payment.'}
                                        </p>
                                    </div>
                                    <div
                                        className="hidden h-10 w-10 shrink-0 rounded-lg bg-amber-500/15 text-amber-800 ring-1 ring-amber-300/40 sm:flex sm:items-center sm:justify-center"
                                        aria-hidden
                                    >
                                        <span className="text-lg font-black tabular-nums">{isInstallment ? '∞' : '1'}</span>
                                    </div>
                                </div>

                                {!isInstallment ? (
                                    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                                        {PAY_CADENCE_OPTIONS.map((c) => {
                                            const selected = c === 'one_time';
                                            return (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    disabled
                                                    className={cn(
                                                        'rounded-xl border px-3 py-2.5 text-left text-xs font-semibold leading-snug',
                                                        selected
                                                            ? 'border-amber-600 bg-amber-100 text-amber-950 shadow-sm ring-2 ring-amber-400/50'
                                                            : 'cursor-not-allowed border-slate-200/60 bg-slate-50/80 text-slate-400 opacity-70'
                                                    )}
                                                >
                                                    <span className="line-clamp-2">{formatPayCadenceLabel(c)}</span>
                                                    {c === 'one_time' ? (
                                                        <span className="mt-1 block text-[11px] font-normal text-slate-600">Single receipt</span>
                                                    ) : (
                                                        <span className="mt-1 block text-[11px] font-normal text-slate-500">
                                                            Default {defaultInstallmentCountForCadence(c)} payments
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="mt-4 space-y-3 border-t border-amber-200/40 pt-4">
                                        <div className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm">
                                            <span className="font-semibold text-slate-900">Active plan:</span>{' '}
                                            {formatFrequencyLabel(activePayment.frequency ?? undefined)} · Start{' '}
                                            {activePayment.scheduleStartDate ?? '—'}
                                        </div>
                                        {activePayment.installmentLines?.length ? (
                                            <div className="rounded-lg border border-slate-200/90 bg-slate-50/95 p-3 shadow-inner">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Schedule lines</p>
                                                <div className="mt-2 max-h-52 overflow-auto text-xs space-y-1">
                                                    {activePayment.installmentLines.slice(0, 24).map((line) => (
                                                        <div
                                                            key={line.installmentNo}
                                                            className="flex justify-between gap-2 rounded-md border-b border-slate-200/70 bg-white/70 px-2 py-1.5 text-slate-800 last:border-b-0"
                                                        >
                                                            <span className="font-semibold text-slate-700">#{line.installmentNo}</span>
                                                            <span className="tabular-nums font-medium">
                                                                ₹{line.expectedAmount.toLocaleString('en-IN')}
                                                            </span>
                                                            <span className="text-slate-500">{line.dueDate}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="rounded-lg border border-amber-200/60 bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-950">
                                                No installment lines stored on this row.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className={cn(
                        ' flex flex-col-reverse gap-2 border-t border-slate-200/90 bg-white/95 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-end sm:px-4',
                        'shadow-[0_-6px_16px_-4px_rgba(15,23,42,0.08)] backdrop-blur-sm supports-backdrop-filter:bg-white/80'
                    )}
                >
                    <Button
                        type="button"
                        variant="companyOutline"
                        size="cta"
                        onClick={onCancel}
                        disabled={loading}
                        className="h-9 text-sm sm:min-w-[100px]"
                    >
                        Cancel
                    </Button>
                    <Button type="submit" variant="company" size="cta" disabled={loading} className="h-9 text-sm sm:min-w-[140px]">
                        {loading ? <LuLoader className="mr-2 animate-spin" size={16} /> : null}
                        {loading ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
