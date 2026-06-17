'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FormCollapsibleSection } from '@/components/forms/FormCollapsibleSection';
import { CrmFieldProvider, InputField, SelectField } from '@/components/forms/Fields';
import { Button } from '@/components/ui/Button';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import {
    addPaymentLink,
    getBookings,
    getPaymentLinkBySlug,
    getPaymentLinkBookingParty,
    getPaymentPlanForBooking,
    updatePaymentLink,
    type PaymentLinkSendVia,
} from '@/lib/bookingPaymentMockStore';
import { validatePaymentLinkForm, type PaymentLinkFormField } from '@/lib/bookingPaymentFormValidation';
import { PaymentLinkSendViaContact } from '@/components/booking-payment/payment-links/PaymentLinkSendViaContact';
import { cn } from '@/lib/utils';
import { CTA_LINK_UNDERLINE, CTA_SHADOW_SOFT } from '@/lib/theme/ctaThemeClasses';
import { LuCalendar, LuCreditCard, LuLink2, LuSend, LuTag, LuUser } from 'react-icons/lu';

const DEFAULT_LINK_PURPOSE = 'Installment' as const;
export const ARRIS_PAYMENT_LINK_FORM_DRAFT_KEY = 'arris-payment-link-form-draft-v1';

const SEND_VIA_OPTIONS: { value: PaymentLinkSendVia; label: string }[] = [
    { value: 'Email', label: 'Email' },
    { value: 'SMS', label: 'SMS' },
    { value: 'WhatsApp', label: 'WhatsApp' },
    { value: 'Email & SMS', label: 'Email & SMS' },
    { value: 'All channels', label: 'All channels' },
];

const SCROLL_OFFSET_PX = 96;
const FORM_ID = 'payment-link-standard-form';

const FIELD_IDS: Record<PaymentLinkFormField, string> = {
    bookingSlug: 'payment-link-booking',
    amount: 'payment-link-amount',
    expiryDate: 'payment-link-expiry',
    milestoneId: 'payment-link-milestone',
};

const VALIDATION_ORDER: PaymentLinkFormField[] = ['bookingSlug', 'amount', 'expiryDate', 'milestoneId'];

const HUMAN_LABEL: Record<PaymentLinkFormField, string> = {
    bookingSlug: 'Booking',
    amount: 'Payment amount',
    expiryDate: 'Expiry date',
    milestoneId: 'Milestone',
};

const BOOKING_KEYS: PaymentLinkFormField[] = ['bookingSlug'];
const PAYMENT_KEYS: PaymentLinkFormField[] = ['amount', 'expiryDate', 'milestoneId'];

type FormErrors = Partial<Record<PaymentLinkFormField, string>>;

function focusField(key: PaymentLinkFormField) {
    const id = FIELD_IDS[key];
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_PX;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    window.setTimeout(() => {
        const again = document.getElementById(id);
        if (again && 'focus' in again && typeof (again as HTMLInputElement).focus === 'function') {
            (again as HTMLInputElement | HTMLSelectElement).focus({ preventScroll: true });
        }
    }, 400);
}

export function PaymentLinkFormStandard({
    variant,
    editSlug,
    initialBookingSlug,
    onCancel,
    onSaved,
    enableDraftAutosave,
    draftStorageKey = ARRIS_PAYMENT_LINK_FORM_DRAFT_KEY,
}: {
    variant: 'add' | 'edit';
    editSlug?: string;
    initialBookingSlug?: string;
    onCancel: () => void;
    onSaved: (slug: string) => void;
    /** Default: enabled for new links, off when editing. */
    enableDraftAutosave?: boolean;
    draftStorageKey?: string;
}) {
    const isAdd = variant === 'add';
    const useDraft = enableDraftAutosave ?? isAdd;

    const [v, setV] = useState(0);
    const bump = useCallback(() => setV((x) => x + 1), []);
    const bookings = useMemo(() => {
        void v;
        return getBookings();
    }, [v]);

    const [bookingSlug, setBookingSlug] = useState('');
    const [amount, setAmount] = useState('');
    const [expiryDate, setExpiryDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [milestoneId, setMilestoneId] = useState('m1');
    const [sendVia, setSendVia] = useState<PaymentLinkSendVia>('Email & SMS');
    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState<FormErrors>({});
    const [showValidationSummary, setShowValidationSummary] = useState(false);
    const [validationFieldToast, setValidationFieldToast] = useState<string | null>(null);
    const [submitShakeKey, setSubmitShakeKey] = useState(0);
    const [cardOpen, setCardOpen] = useState({
        reference: true,
        booking: true,
        payment: true,
        send: true,
    });
    const [draftUi, setDraftUi] = useState<{ state: 'idle' | 'saving' | 'saved'; at: string | null }>({
        state: 'idle',
        at: null,
    });
    const dismissValidationToast = useCallback(() => setValidationFieldToast(null), []);

    const clearField = (key: PaymentLinkFormField) => {
        setErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const setBooking = (slug: string) => {
        setBookingSlug(slug);
        setMilestoneId('m1');
        clearField('bookingSlug');
        clearField('milestoneId');
    };

     
    useEffect(() => {
        if (variant !== 'add') return;
        if (getBookings().length === 0) return;
        setBookingSlug((prev) => (prev ? prev : getBookings()[0]!.slug));
    }, [variant]);

    useEffect(() => {
        if (variant !== 'add') return;
        const pre = initialBookingSlug?.trim();
        if (!pre) return;
        if (!getBookings().some((b) => b.slug === pre)) return;
        setBookingSlug(pre);
    }, [variant, initialBookingSlug]);

    useEffect(() => {
        if (variant !== 'edit' || !editSlug) return;
        const row = getPaymentLinkBySlug(editSlug);
        if (!row) return;
        setBookingSlug(row.bookingSlug);
        setAmount(String(row.amount));
        setExpiryDate(row.expiryDate.slice(0, 10));
        setMilestoneId(row.milestoneId);
        setSendVia(row.sendVia ?? 'Email & SMS');
        setErrors({});
        setShowValidationSummary(false);
    }, [variant, editSlug]);
     

    const planForForm = useMemo(() => {
        void v;
        return bookingSlug ? getPaymentPlanForBooking(bookingSlug) : null;
    }, [bookingSlug, v]);
    const activeRow = variant === 'edit' && editSlug ? getPaymentLinkBySlug(editSlug) : undefined;
    const selectedBooking = useMemo(
        () => (bookingSlug ? bookings.find((b) => b.slug === bookingSlug) : undefined),
        [bookings, bookingSlug],
    );
    const bookingParty = useMemo(() => {
        void v;
        return bookingSlug ? getPaymentLinkBookingParty(bookingSlug) : null;
    }, [bookingSlug, v]);

    const hasMilestones = Boolean(planForForm?.milestones?.length);

    useEffect(() => {
        if (Object.keys(errors).length === 0) {
             
            setShowValidationSummary(false);
            setValidationFieldToast(null);
             
        }
    }, [errors]);

    useEffect(() => {
        if (!useDraft || !draftStorageKey) return;
        const t0 = window.setTimeout(() => {
            setDraftUi((p) => ({ ...p, state: 'saving' }));
        }, 0);
        const t = window.setTimeout(() => {
            try {
                window.localStorage.setItem(
                    draftStorageKey,
                    JSON.stringify({ bookingSlug, amount, expiryDate, milestoneId, sendVia }),
                );
                setDraftUi({
                    state: 'saved',
                    at: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
                });
            } catch {
                setDraftUi({ state: 'idle', at: null });
            }
        }, 700);
        return () => {
            window.clearTimeout(t0);
            window.clearTimeout(t);
        };
    }, [useDraft, draftStorageKey, bookingSlug, amount, expiryDate, milestoneId, sendVia]);

    const runSubmit = () => {
        const nextErrors = validatePaymentLinkForm({
            bookingSlug,
            amount,
            expiryDate,
            milestoneId,
            hasMilestoneOptions: hasMilestones,
            requireFutureOrTodayExpiry: isAdd,
        });
        setErrors(nextErrors);
        const keys = Object.keys(nextErrors) as PaymentLinkFormField[];
        if (keys.length > 0) {
            setShowValidationSummary(true);
            setValidationFieldToast(
                `Please complete ${keys.length} required field${keys.length === 1 ? '' : 's'}`,
            );
            setSubmitShakeKey((k) => k + 1);
            setCardOpen((s) => ({
                ...s,
                booking: BOOKING_KEYS.some((k) => nextErrors[k]) ? true : s.booking,
                payment: PAYMENT_KEYS.some((k) => nextErrors[k]) ? true : s.payment,
            }));
            const first = VALIDATION_ORDER.find((k) => nextErrors[k]);
            if (first) window.requestAnimationFrame(() => focusField(first));
            return;
        }
        setShowValidationSummary(false);

        const amt = Number(amount);
        const purposeForSubmit =
            variant === 'edit' && editSlug
                ? getPaymentLinkBySlug(editSlug)?.purpose ?? DEFAULT_LINK_PURPOSE
                : DEFAULT_LINK_PURPOSE;

        setLoading(true);
        window.setTimeout(() => {
            if (variant === 'edit' && editSlug) {
                updatePaymentLink(editSlug, {
                    bookingSlug,
                    amount: amt,
                    purpose: purposeForSubmit,
                    expiryDate,
                    milestoneId,
                    sendVia,
                });
                bump();
                setLoading(false);
                try {
                    if (useDraft) window.localStorage.removeItem(draftStorageKey);
                } catch {
                    /* ignore */
                }
                onSaved(editSlug);
            } else {
                const row = addPaymentLink({
                    bookingSlug,
                    amount: amt,
                    purpose: purposeForSubmit,
                    expiryDate,
                    milestoneId,
                    sendVia,
                });
                bump();
                setLoading(false);
                try {
                    if (useDraft) window.localStorage.removeItem(draftStorageKey);
                } catch {
                    /* ignore */
                }
                onSaved(row.slug);
            }
        }, 320);
    };

    const saveDraftManual = () => {
        if (!useDraft || !draftStorageKey) return;
        try {
            window.localStorage.setItem(
                draftStorageKey,
                JSON.stringify({ bookingSlug, amount, expiryDate, milestoneId, sendVia }),
            );
            setDraftUi({
                state: 'saved',
                at: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
            });
        } catch {
            setDraftUi({ state: 'idle', at: null });
        }
    };

    const bookingErr = BOOKING_KEYS.filter((k) => errors[k]).length;
    const paymentErr = PAYMENT_KEYS.filter((k) => errors[k]).length;
    const summaryKeys = showValidationSummary ? VALIDATION_ORDER.filter((k) => errors[k]) : [];
    const fieldGap = 'gap-x-5 gap-y-5 sm:gap-x-6 sm:gap-y-6';
    const fid = (k: PaymentLinkFormField) => FIELD_IDS[k];

    const busyLabel = isAdd ? 'Creating…' : 'Saving…';

    const validationSummaryEl =
        showValidationSummary && summaryKeys.length > 0 ? (
            <div
                className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3.5 text-sm text-amber-950 shadow-sm"
                role="alert"
            >
                <p className="flex flex-wrap items-center gap-2 font-semibold leading-snug text-amber-950">
                    <span aria-hidden>⚠</span>
                    <span>Please complete required details before continuing.</span>
                </p>
                <p className="mt-2 text-[13px] font-medium text-amber-900/95">
                    {summaryKeys.map((k, i) => (
                        <React.Fragment key={k}>
                            {i > 0 ? <span className="mx-1 text-amber-800/40">·</span> : null}
                            <button
                                type="button"
                                className={CTA_LINK_UNDERLINE}
                                onClick={() => {
                                    if (BOOKING_KEYS.includes(k)) setCardOpen((s) => ({ ...s, booking: true }));
                                    if (PAYMENT_KEYS.includes(k)) setCardOpen((s) => ({ ...s, payment: true }));
                                    window.requestAnimationFrame(() => focusField(k));
                                }}
                            >
                                {HUMAN_LABEL[k]}
                            </button>
                        </React.Fragment>
                    ))}
                </p>
            </div>
        ) : null;

    return (
        <CrmFieldProvider>
            <>
                {validationFieldToast ? (
                    <InlineToast
                        message={validationFieldToast}
                        variant="error"
                        onDismiss={dismissValidationToast}
                    />
                ) : null}
                <form
                    id={FORM_ID}
                    onSubmit={(e) => {
                        e.preventDefault();
                        runSubmit();
                    }}
                    className="space-y-6"
                >
                    {validationSummaryEl}

                    <FormCollapsibleSection
                        layout="card"
                        title="Link reference"
                        icon={LuLink2}
                        tone="blue"
                        open={cardOpen.reference}
                        onOpenChange={(o) => setCardOpen((s) => ({ ...s, reference: o }))}
                    >
                        <InputField
                            label="Link ID"
                            readOnly
                            disabled
                            value={isAdd ? 'Assigned on save' : (activeRow?.slug ?? '—')}
                            className="opacity-90"
                            startIcon={<LuTag aria-hidden />}
                            inputClassName="font-mono"
                        />
                        <p className="text-xs font-medium text-gray-500">
                            {isAdd
                                ? "Generated when you create the link — use it in URLs, exports, and support."
                                : 'Stable ID: shareable URL does not change when you edit.'}
                        </p>
                    </FormCollapsibleSection>

                    <FormCollapsibleSection
                        layout="card"
                        title="Booking & customer"
                        icon={LuUser}
                        tone="amber"
                        open={cardOpen.booking}
                        onOpenChange={(o) => setCardOpen((s) => ({ ...s, booking: o }))}
                        headerRight={
                            bookingErr > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {bookingErr} field{bookingErr === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
                            <div className="md:col-span-2">
                                <SelectField
                                    label="Booking"
                                    id={fid('bookingSlug')}
                                    name="bookingSlug"
                                    placeholder="Select booking"
                                    required
                                    value={bookingSlug}
                                    error={errors.bookingSlug}
                                    onChange={(e) => {
                                        setBooking(e.target.value);
                                    }}
                                    selectClassName="font-mono"
                                    options={bookings.map((b) => ({
                                        value: b.slug,
                                        label: `${b.customerName} — ${b.slug}`,
                                    }))}
                                />
                            </div>
                        </div>
                        {selectedBooking && bookingParty ? (
                            <div className="rounded-xl border border-gray-200/80 bg-gray-50/50 p-4 shadow-sm sm:p-5">
                                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    {isAdd ? 'Who will receive the link — confirm before creating' : 'Booking summary'}
                                </p>
                                <dl className="grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-2 sm:gap-x-6">
                                    <div className="sm:col-span-2">
                                        <dt className="text-xs font-semibold text-gray-500">Lead (CRM)</dt>
                                        <dd className="mt-0.5 font-medium text-gray-900">{bookingParty.leadSummary}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold text-gray-500">Customer</dt>
                                        <dd className="mt-0.5 text-gray-900">{selectedBooking.customerName}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold text-gray-500">Phone</dt>
                                        <dd className="mt-0.5 tabular-nums text-gray-900">{selectedBooking.phone}</dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-xs font-semibold text-gray-500">Project & unit</dt>
                                        <dd className="mt-0.5 text-gray-900">
                                            <span className="font-medium">{selectedBooking.projectName}</span>
                                            <span className="text-gray-400"> · </span>
                                            <span className="font-mono text-xs">Unit {selectedBooking.unitId}</span>
                                            {selectedBooking.unitConfiguration ? (
                                                <span className="text-gray-600"> · {selectedBooking.unitConfiguration}</span>
                                            ) : null}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold text-gray-500">Agreed unit price</dt>
                                        <dd className="mt-0.5 font-semibold tabular-nums text-gray-900">
                                            ₹{selectedBooking.unitPrice.toLocaleString('en-IN')}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold text-gray-500">Booking status</dt>
                                        <dd className="mt-0.5 text-gray-900">{selectedBooking.status}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold text-gray-500">Assigned to</dt>
                                        <dd className="mt-0.5 text-gray-900">{selectedBooking.assignedTo}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-semibold text-gray-500">Booked on</dt>
                                        <dd className="mt-0.5 tabular-nums text-gray-900">{selectedBooking.bookingDate}</dd>
                                    </div>
                                </dl>
                            </div>
                        ) : null}
                    </FormCollapsibleSection>

                    <FormCollapsibleSection
                        layout="card"
                        title="Payment details"
                        icon={LuCreditCard}
                        tone="slate"
                        open={cardOpen.payment}
                        onOpenChange={(o) => setCardOpen((s) => ({ ...s, payment: o }))}
                        headerRight={
                            paymentErr > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {paymentErr} field{paymentErr === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
                            <InputField
                                label="Payment amount (₹)"
                                id={fid('amount')}
                                name="amount"
                                type="number"
                                min={1}
                                step={1}
                                required
                                value={amount}
                                error={errors.amount}
                                onChange={(e) => {
                                    setAmount(e.target.value);
                                    clearField('amount');
                                }}
                                startIcon={<LuCreditCard aria-hidden />}
                            />
                            <InputField
                                label="Expiry date"
                                id={fid('expiryDate')}
                                name="expiryDate"
                                type="date"
                                required
                                value={expiryDate}
                                error={errors.expiryDate}
                                onChange={(e) => {
                                    setExpiryDate(e.target.value);
                                    clearField('expiryDate');
                                }}
                                startIcon={<LuCalendar aria-hidden />}
                            />
                            <div className="md:col-span-2">
                                <SelectField
                                    label="Milestone"
                                    id={fid('milestoneId')}
                                    name="milestoneId"
                                    required
                                    value={hasMilestones ? milestoneId : ''}
                                    error={errors.milestoneId}
                                    onChange={(e) => {
                                        setMilestoneId(e.target.value);
                                        clearField('milestoneId');
                                    }}
                                    options={
                                        hasMilestones
                                            ? planForForm!.milestones.map((m) => ({
                                                  value: m.id,
                                                  label: `${m.name} — ₹${m.amount.toLocaleString('en-IN')}`,
                                              }))
                                            : [{ value: '', label: 'Select a booking with a payment plan' }]
                                    }
                                />
                            </div>
                        </div>
                    </FormCollapsibleSection>

                    <FormCollapsibleSection
                        layout="card"
                        title="How you’ll send it"
                        icon={LuSend}
                        tone="blue"
                        open={cardOpen.send}
                        onOpenChange={(o) => setCardOpen((s) => ({ ...s, send: o }))}
                    >
                        <SelectField
                            label="Send via"
                            value={sendVia}
                            onChange={(e) => setSendVia(e.target.value as PaymentLinkSendVia)}
                            options={SEND_VIA_OPTIONS}
                        />
                        <p className="text-xs text-gray-600">
                            The link URL works on any channel. This field records the preferred follow-up and drives the contact
                            panel below.
                        </p>
                        {bookingSlug ? (
                            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                                <p className="mb-2 text-xs font-semibold text-gray-500">Contact for selected channel</p>
                                <PaymentLinkSendViaContact bookingSlug={bookingSlug} sendVia={sendVia} />
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500">Select a booking to see channel contact details.</p>
                        )}
                    </FormCollapsibleSection>

                    <div className="space-y-3 border-t border-gray-200 pt-6">
                        {useDraft ? (
                            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                                <p className="min-h-5 text-xs text-gray-500">
                                    {draftUi.state === 'saving' ? (
                                        'Saving draft…'
                                    ) : draftUi.state === 'saved' && draftUi.at ? (
                                        <>
                                            Draft saved <span className="tabular-nums text-gray-700">{draftUi.at}</span> ·
                                            this browser
                                        </>
                                    ) : (
                                        'Autosave: draft updates as you type'
                                    )}
                                </p>
                            </div>
                        ) : null}
                        <div className="flex flex-col-reverse flex-wrap gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <Button
                                type="button"
                                variant="companyGhost"
                                size="cta"
                                onClick={onCancel}
                                disabled={loading}
                                className="h-12 rounded-xl px-4 text-sm font-medium text-gray-600"
                            >
                                Cancel
                            </Button>
                            {useDraft ? (
                                <Button
                                    type="button"
                                    variant="companyOutline"
                                    size="cta"
                                    onClick={saveDraftManual}
                                    disabled={loading}
                                    className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)]"
                                >
                                    Save draft
                                </Button>
                            ) : null}
                            <Button
                                key={submitShakeKey}
                                type="submit"
                                variant="company"
                                size="cta"
                                disabled={loading}
                                isLoading={loading}
                                className={cn(
                                    'h-12 min-w-48 rounded-xl font-semibold',
                                    CTA_SHADOW_SOFT,
                                    submitShakeKey > 0 && 'animate-lead-form-shake',
                                )}
                            >
                                {loading ? busyLabel : isAdd ? 'Create payment link' : 'Save changes'}
                            </Button>
                        </div>
                    </div>
                </form>
            </>
        </CrmFieldProvider>
    );
}
