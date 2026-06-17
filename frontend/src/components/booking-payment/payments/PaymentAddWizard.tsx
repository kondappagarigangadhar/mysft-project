'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InputField, SelectField } from '@/components/forms/Fields';
import {
    addPayment,
    defaultInstallmentCountForCadence,
    formatFrequencyLabel,
    formatPayCadenceLabel,
    generateInstallmentSchedule,
    getBookingBySlug,
    getBookingPaymentSummary,
    getBookings,
    getPaymentPlanForBooking,
    payCadenceToSchedule,
    receiptExists,
    suggestNextReceiptNumber,
    type PayCadenceOption,
    type PaymentMode,
    type PaymentRecordStatus,
} from '@/lib/bookingPaymentMockStore';
import { validatePaymentForm, type PaymentFormField } from '@/lib/bookingPaymentFormValidation';
import { cn } from '@/lib/utils';
import { LuBanknote, LuCalendarClock, LuLoader } from 'react-icons/lu';

/** Shown only after user picks EMI — excludes one-time. */
const EMI_CADENCE_OPTIONS: PayCadenceOption[] = ['weekly', 'monthly', 'bimonthly', 'half_yearly', 'yearly'];

function formatInr(n: number): string {
    return `₹${n.toLocaleString('en-IN')}`;
}

export function PaymentAddWizard({
    initialBookingSlug,
    onCancel,
    onSaved,
}: {
    initialBookingSlug: string;
    onCancel: () => void;
    onSaved: (paymentSlug: string) => void;
}) {
    const [v, setV] = useState(0);
    const bump = () => setV((x) => x + 1);

    const bookings = useMemo(() => getBookings(), [v]);

    const [bookingSlug, setBookingSlug] = useState(initialBookingSlug);
    const [amount, setAmount] = useState('');
    const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
    const [mode, setMode] = useState<PaymentMode>('Bank');
    const [receipt, setReceipt] = useState('');
    /** Bank / UPI / cash reference — optional; store auto-generates if left blank. */
    const [transactionId, setTransactionId] = useState('');
    const [payStatus, setPayStatus] = useState<PaymentRecordStatus | ''>('');
    const [loading, setLoading] = useState(false);
    const [toastErr, setToastErr] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<PaymentFormField, string>>>({});

    const [payCadence, setPayCadence] = useState<PayCadenceOption>('one_time');
    const [installmentCount, setInstallmentCount] = useState('6');
    const [scheduleStartDate, setScheduleStartDate] = useState(new Date().toISOString().slice(0, 10));

    const clearPayField = (key: PaymentFormField) => {
        setFieldErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const planForForm = useMemo(() => (bookingSlug ? getPaymentPlanForBooking(bookingSlug) : null), [bookingSlug, v]);

    /** Ledger rows still require a milestone id; we map this payment to the first plan milestone. */
    const resolvedMilestoneId = useMemo(() => {
        const first = planForForm?.milestones?.[0]?.id?.trim();
        return first || 'm1';
    }, [planForForm]);

    const bookingForAddForm = useMemo(
        () => (bookingSlug.trim() ? getBookingBySlug(bookingSlug.trim()) ?? null : null),
        [bookingSlug, v]
    );

    /** Total / paid / remaining from booking + completed payments on the ledger (same rules as collection limits). */
    const bookingMoneySummary = useMemo(() => {
        const slug = bookingSlug.trim();
        if (!slug) return null;
        return getBookingPaymentSummary(slug);
    }, [bookingSlug, v]);

    const applyCadence = useCallback((c: PayCadenceOption) => {
        setPayCadence(c);
        if (c !== 'one_time') {
            setInstallmentCount(String(defaultInstallmentCountForCadence(c)));
        }
    }, []);

    useEffect(() => {
        setBookingSlug(initialBookingSlug.trim());
    }, [initialBookingSlug]);

    useEffect(() => {
        const slug = bookingSlug.trim();
        if (!slug || !getBookingBySlug(slug)) {
            setReceipt('');
            return;
        }
        setReceipt(suggestNextReceiptNumber(slug));
    }, [bookingSlug]);

    const installmentPreviewLines = useMemo(() => {
        if (payCadence === 'one_time') return [];
        const { frequency } = payCadenceToSchedule(payCadence);
        if (!frequency) return [];
        const amt = Number(amount);
        const n = Math.floor(Number(installmentCount));
        if (!Number.isFinite(amt) || amt <= 0 || !Number.isFinite(n) || n < 1 || !scheduleStartDate.trim()) return [];
        return generateInstallmentSchedule({
            totalAmount: amt,
            installmentCount: n,
            frequency,
            startDate: scheduleStartDate,
            paymentStatus: 'Pending',
        });
    }, [payCadence, amount, installmentCount, scheduleStartDate]);

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
        if (Object.keys(e).length > 0) {
            setToastErr('Please fix the highlighted fields.');
            return false;
        }

        if (payCadence !== 'one_time') {
            const n = Math.floor(Number(installmentCount));
            if (!Number.isFinite(n) || n < 1) {
                setToastErr('Enter a valid number of installments (1 or more).');
                return false;
            }
            if (!scheduleStartDate.trim()) {
                setToastErr('Select a schedule start date.');
                return false;
            }
            if (installmentPreviewLines.length === 0) {
                setToastErr('Could not build the schedule. Check amount, installment count, and start date.');
                return false;
            }
        }

        setToastErr(null);
        return true;
    }, [
        bookingSlug,
        resolvedMilestoneId,
        amount,
        payDate,
        receipt,
        transactionId,
        planForForm?.milestones?.length,
        payCadence,
        installmentCount,
        scheduleStartDate,
        installmentPreviewLines.length,
        payStatus,
    ]);

    const onSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateBeforeSave()) return;
        const statusResolved = payStatus as PaymentRecordStatus;
        const amt = Number(amount);
        if (receiptExists(receipt.trim())) {
            setFieldErrors({ receipt: 'This receipt number is already in use.' });
            setToastErr('Receipt number must be unique.');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            const { scheduleType, frequency } = payCadenceToSchedule(payCadence);
            const lines =
                scheduleType === 'installment' && frequency
                    ? generateInstallmentSchedule({
                          totalAmount: amt,
                          installmentCount: Math.floor(Number(installmentCount)),
                          frequency,
                          startDate: scheduleStartDate,
                          paymentStatus: statusResolved,
                      })
                    : undefined;
            const res = addPayment({
                bookingSlug,
                milestoneId: resolvedMilestoneId,
                amount: amt,
                date: payDate,
                mode,
                receiptNumber: receipt.trim(),
                status: statusResolved,
                source: 'Manual',
                transactionId: transactionId.trim() || undefined,
                scheduleType,
                frequency: scheduleType === 'installment' ? frequency : null,
                scheduleStartDate: scheduleType === 'installment' ? scheduleStartDate : undefined,
                installmentLines: scheduleType === 'installment' ? lines : undefined,
            });
            if (!res.ok) {
                setLoading(false);
                setToastErr(res.error ?? 'Could not save payment.');
                return;
            }
            bump();
            setLoading(false);
            onSaved(res.row.slug);
        }, 300);
    };

    const fieldDense = 'space-y-1';
    const controlDense = 'h-9 rounded-lg text-sm py-0';

    return (
        <Card
            className="border border-slate-200/80 shadow-md shadow-slate-200/30 overflow-visible"
            contentClassName="p-0"
        >
            <div className="border-b border-slate-100 bg-slate-50/60 px-3 py-2 sm:px-4 sm:flex sm:items-center sm:justify-between sm:gap-3">
                <div className="min-w-0">
                    {/* <h2 className="text-base font-bold text-slate-900">Add payment</h2> */}
                    <p className="text-[11px] text-slate-500 leading-snug truncate">
                        {bookingForAddForm
                            ? `${bookingForAddForm.customerName} · ${bookingForAddForm.projectName}`
                            : 'Booking & collection'}
                    </p>
                </div>
                <div className="mt-1.5 sm:mt-0 shrink-0 text-left sm:text-right">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Payment ID</p>
                    <p className="text-[10px] font-mono text-slate-600">On save</p>
                </div>
            </div>

            {bookingMoneySummary ? (
                <div className="border-b border-slate-100 bg-white px-3 py-3 sm:px-4">
                    {/* <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Booking amount summary</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Paid reflects completed ledger rows for this booking.</p> */}
                    <div className=" grid grid-cols-1 gap-2 sm:grid-cols-3">
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

            {toastErr ? (
                <p className="mx-3 sm:mx-4 mt-2 rounded-md border border-red-100 bg-red-50 px-2 py-1.5 text-xs text-red-800">{toastErr}</p>
            ) : null}

            <form onSubmit={onSave} className="relative">
                <div className="p-3 sm:p-4 pb-2 space-y-3">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start lg:gap-5">
                        {/* Left: booking + collection — half width on large screens */}
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
                                            const next = e.target.value;
                                            setBookingSlug(next);
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
                            {fieldErrors.plan ? <p className="text-[11px] text-red-600 font-medium -mt-1">{fieldErrors.plan}</p> : null}

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
                                    placeholder="Select status"
                                    required
                                    className={fieldDense}
                                    selectClassName={controlDense}
                                    value={payStatus}
                                    error={fieldErrors.payStatus}
                                    onChange={(e) => {
                                        const v = e.target.value as PaymentRecordStatus | '';
                                        setPayStatus(v);
                                        clearPayField('payStatus');
                                    }}
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
                                        Optional for bank, UPI, or cash. Leave blank to auto-generate a reference.
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
                                    {fieldErrors.receipt ? <p className="text-[11px] text-red-600 font-medium">{fieldErrors.receipt}</p> : null}
                                    <p className="text-[10px] text-slate-500 leading-snug">
                                        Suggested for project{bookingForAddForm ? `: ${bookingForAddForm.projectName}` : ''}. Regenerate if
                                        duplicate.
                                    </p>
                                </div>
                            </div>
                            </div>
                        </div>

                        {/* Right: collection schedule — half width on large screens, sticky */}
                        <div className="min-w-0 lg:sticky lg:top-4 lg:z-1 lg:self-start">
                            <div
                                className={cn(
                                    'overflow-hidden rounded-xl border-2 bg-linear-to-br shadow-md max-h-screen overflow-y-auto p-4 sm:p-5',
                                    payCadence === 'one_time'
                                        ? 'border-slate-200/90 from-slate-50/90 via-white to-slate-50/50 shadow-slate-900/5 ring-1 ring-slate-100/80'
                                        : 'border-amber-200/70 from-amber-50/90 via-white to-amber-50/40 shadow-amber-900/5 ring-1 ring-amber-100/80',
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex items-start justify-between gap-2 border-b pb-3',
                                        payCadence === 'one_time' ? 'border-slate-200/80' : 'border-amber-200/50',
                                    )}
                                >
                                    <div>
                                        <p
                                            className={cn(
                                                'text-xs font-bold uppercase tracking-wider',
                                                payCadence === 'one_time' ? 'text-slate-700' : 'text-amber-900',
                                            )}
                                        >
                                            Payment structure
                                        </p>
                                        <p className="mt-1 text-xs leading-snug text-slate-600">
                                            {payCadence === 'one_time'
                                                ? 'One receipt for the amount you enter on the left.'
                                                : 'EMI splits the total into equal installments with scheduled due dates.'}
                                        </p>
                                    </div>
                                    <div
                                        className={cn(
                                            'hidden h-10 w-10 shrink-0 rounded-lg sm:flex sm:items-center sm:justify-center',
                                            payCadence === 'one_time'
                                                ? 'bg-slate-500/10 text-slate-700 ring-1 ring-slate-300/40'
                                                : 'bg-amber-500/15 text-amber-800 ring-1 ring-amber-300/40',
                                        )}
                                        aria-hidden
                                    >
                                        <span className="text-lg font-black tabular-nums">{payCadence === 'one_time' ? '1' : '∞'}</span>
                                    </div>
                                </div>

                                {/* Step 1: Single vs EMI */}
                                <div className="mt-4 space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Step 1 · Payment type</p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => applyCadence('one_time')}
                                            className={cn(
                                                'rounded-xl border-2 px-4 py-4 text-left transition-all',
                                                payCadence === 'one_time'
                                                    ? 'border-[var(--cta-button-bg)] bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] shadow-sm ring-2 ring-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)]'
                                                    : 'border-slate-200 bg-white/95 hover:border-slate-300 hover:bg-slate-50/80',
                                            )}
                                        >
                                            <span className="flex items-start gap-3">
                                                <span
                                                    className={cn(
                                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                                                        payCadence === 'one_time' ? 'bg-[var(--cta-button-bg)] text-[var(--cta-button-text)]' : 'bg-slate-100 text-slate-600',
                                                    )}
                                                >
                                                    <LuBanknote size={20} aria-hidden />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block text-sm font-bold text-slate-900">Single payment</span>
                                                    <span className="mt-1 block text-[11px] font-normal leading-snug text-slate-600">
                                                        One full payment — single ledger row, no installment schedule.
                                                    </span>
                                                </span>
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (payCadence === 'one_time') {
                                                    applyCadence('monthly');
                                                }
                                            }}
                                            className={cn(
                                                'rounded-xl border-2 px-4 py-4 text-left transition-all',
                                                payCadence !== 'one_time'
                                                    ? 'border-amber-600 bg-amber-50/90 shadow-sm ring-2 ring-amber-400/45'
                                                    : 'border-slate-200 bg-white/95 hover:border-amber-200 hover:bg-amber-50/40',
                                            )}
                                        >
                                            <span className="flex items-start gap-3">
                                                <span
                                                    className={cn(
                                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                                                        payCadence !== 'one_time' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600',
                                                    )}
                                                >
                                                    <LuCalendarClock size={20} aria-hidden />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block text-sm font-bold text-slate-900">EMI / Installments</span>
                                                    <span className="mt-1 block text-[11px] font-normal leading-snug text-slate-600">
                                                        Split into multiple dues — pick frequency in the next step.
                                                    </span>
                                                </span>
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {payCadence === 'one_time' ? (
                                    <div className="mt-5 rounded-xl border border-slate-200/90 bg-slate-50/90 px-4 py-3.5 text-sm text-slate-700 shadow-sm">
                                        <p className="font-semibold text-slate-900">Simple collection</p>
                                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                                            Enter the payment amount and details on the left. No EMI schedule is created — this is one
                                            receipt for the amount you specify.
                                        </p>
                                    </div>
                                ) : null}

                                {payCadence !== 'one_time' ? (
                                    <div className="mt-5 space-y-4 border-t border-amber-200/40 pt-5">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                                                    Step 2 · EMI frequency
                                                </p>
                                                <p className="mt-1 text-[11px] text-slate-600">
                                                    How often should installments fall due? (Weekly, monthly, every 2 months, every 6 months, or
                                                    yearly.)
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                                                {EMI_CADENCE_OPTIONS.map((c) => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => applyCadence(c)}
                                                        className={cn(
                                                            'rounded-xl border px-3 py-2.5 text-left text-xs font-semibold leading-snug transition-all',
                                                            payCadence === c
                                                                ? 'border-amber-600 bg-amber-100 text-amber-950 shadow-sm ring-2 ring-amber-400/50'
                                                                : 'border-slate-200/90 bg-white/95 text-slate-800 shadow-sm hover:border-amber-200 hover:bg-amber-50/50',
                                                        )}
                                                    >
                                                        <span className="line-clamp-2">{formatPayCadenceLabel(c)}</span>
                                                        <span className="mt-1 block text-[11px] font-normal text-slate-600">
                                                            Default {defaultInstallmentCountForCadence(c)} installments
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2 text-xs text-slate-700 shadow-sm">
                                            <span className="font-semibold text-slate-900">Active plan:</span>{' '}
                                            {formatPayCadenceLabel(payCadence)} —{' '}
                                            {formatFrequencyLabel(payCadenceToSchedule(payCadence).frequency ?? undefined)} between dues.
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <InputField
                                                label="Number of installments"
                                                type="number"
                                                min={1}
                                                step={1}
                                                required
                                                className={fieldDense}
                                                inputClassName={controlDense}
                                                value={installmentCount}
                                                onChange={(e) => setInstallmentCount(e.target.value)}
                                            />
                                            <InputField
                                                label="Schedule start date"
                                                type="date"
                                                required
                                                className={fieldDense}
                                                inputClassName={controlDense}
                                                value={scheduleStartDate}
                                                onChange={(e) => setScheduleStartDate(e.target.value)}
                                            />
                                        </div>
                                        {installmentPreviewLines.length > 0 ? (
                                            <div className="rounded-lg border border-slate-200/90 bg-slate-50/95 p-3 shadow-inner">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Schedule preview</p>
                                                <div className="mt-2 max-h-52 overflow-auto text-xs space-y-1">
                                                    {installmentPreviewLines.slice(0, 16).map((line) => (
                                                        <div
                                                            key={line.installmentNo}
                                                            className="flex justify-between gap-2 rounded-md border-b border-slate-200/70 bg-white/70 px-2 py-1.5 text-slate-800 last:border-b-0"
                                                        >
                                                            <span className="font-semibold text-slate-700">#{line.installmentNo}</span>
                                                            <span className="tabular-nums font-medium">₹{line.expectedAmount.toLocaleString('en-IN')}</span>
                                                            <span className="text-slate-500">{line.dueDate}</span>
                                                        </div>
                                                    ))}
                                                    {installmentPreviewLines.length > 16 ? (
                                                        <p className="pt-1 text-xs text-slate-500">+ {installmentPreviewLines.length - 16} more…</p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="rounded-lg border border-amber-200/60 bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-950">
                                                Enter total amount, installment count, and schedule start date to preview.
                                            </p>
                                        )}
                                    </div>
                                ) : null}
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
                    <Button
                        type="button"
                        variant="companyOutline"
                        size="cta"
                        className="h-9 text-sm sm:min-w-[100px]"
                    >
                        Save draft
                    </Button>
                    <Button type="submit" variant="company" size="cta" disabled={loading} className="h-9 text-sm sm:min-w-[140px]">
                        {loading ? <LuLoader className="animate-spin mr-2" size={16} /> : null}
                        {loading ? 'Saving…' : 'Create payment'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
