'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { AIGenerateButton } from '@/components/ai/AIGenerateButton';
import { AIRiskBadge } from '@/components/ai/AIRiskBadge';
import { AIConfidenceBar } from '@/components/ai/AIConfidenceBar';
import { getAiErrorMessage, postAi, postAiCached } from '@/lib/aiApi';
import type { BookingRecord, PaymentRecord } from '@/lib/bookingPaymentMockStore';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { InputField } from '@/components/forms/Fields';
import { AISkeletonShimmer } from '@/components/ai/AISkeletonShimmer';

type InsightsPayload = {
    riskScore?: string | number;
    riskLabel?: string;
    delayPrediction?: string;
    delayDays?: number;
    recoveryStrategy?: string;
    recommendation?: string;
    confidence?: number;
    delayRiskHigh?: boolean;
};

type ReminderPayload = {
    message?: string;
    messages?: { soft?: string; professional?: string; strict?: string };
};

function riskTone(label: string): 'low' | 'medium' | 'high' {
    const u = label.toUpperCase();
    if (u.includes('HIGH') || u.includes('CRITICAL')) return 'high';
    if (u.includes('LOW') || u.includes('MINIMAL')) return 'low';
    return 'medium';
}

export function PaymentAIInsightsSection({
    payment,
    booking,
}: {
    payment: PaymentRecord;
    booking: BookingRecord | null;
}) {
    const [riskLabel, setRiskLabel] = useState('—');
    const [delayDays, setDelayDays] = useState<number | null>(null);
    const [delayText, setDelayText] = useState('—');
    const [recovery, setRecovery] = useState('—');
    const [recommendation, setRecommendation] = useState('—');
    const [confidence, setConfidence] = useState(0);
    const [delayRiskHigh, setDelayRiskHigh] = useState(false);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [reminderOpen, setReminderOpen] = useState(false);
    const [reminderCtx, setReminderCtx] = useState('');
    const [reminderMsgs, setReminderMsgs] = useState<{ soft: string; professional: string; strict: string } | null>(null);
    const [loadingReminder, setLoadingReminder] = useState(false);

    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const dismissToast = useCallback(() => setToast(null), []);

    const applyInsights = useCallback((res: InsightsPayload) => {
        const rs = res.riskLabel ?? res.riskScore;
        setRiskLabel(rs !== undefined && rs !== null ? String(rs) : '—');
        setDelayText(res.delayPrediction?.trim() || '—');
        setRecovery(res.recoveryStrategy?.trim() || res.recommendation?.trim() || '—');
        setRecommendation(res.recommendation?.trim() || '—');
        setConfidence(typeof res.confidence === 'number' ? res.confidence : 82);
        setDelayRiskHigh(Boolean(res.delayRiskHigh));
        setDelayDays(typeof res.delayDays === 'number' ? res.delayDays : null);
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoadingInitial(true);
        (async () => {
            try {
                const res = await postAiCached<InsightsPayload>(
                    `payment-insights:${payment.slug}`,
                    '/api/ai/payment-insights',
                    {
                        paymentSlug: payment.slug,
                        bookingSlug: payment.bookingSlug,
                        amount: payment.amount,
                        status: payment.status,
                        date: payment.date,
                        customer: booking?.customerName,
                    },
                    3 * 60_000,
                );
                if (!cancelled) applyInsights(res);
            } catch {
                if (!cancelled) {
                    setRiskLabel('Medium');
                    setDelayText('—');
                    setRecovery('Review payment schedule with the customer.');
                    setRecommendation('Keep ledger updated.');
                    setConfidence(75);
                    setDelayRiskHigh(false);
                }
            } finally {
                if (!cancelled) setLoadingInitial(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [payment.slug, payment.bookingSlug, payment.amount, payment.status, payment.date, booking?.customerName, applyInsights]);

    const refresh = async () => {
        setRefreshing(true);
        try {
            const res = await postAi<InsightsPayload>('/api/ai/payment-insights', {
                paymentSlug: payment.slug,
                bookingSlug: payment.bookingSlug,
                amount: payment.amount,
                status: payment.status,
                date: payment.date,
                customer: booking?.customerName,
                simulateDelay: true,
            });
            applyInsights(res);
            setToast({ msg: 'Insights refreshed.' });
        } catch (e) {
            setToast({ msg: getAiErrorMessage(e), err: true });
        } finally {
            setRefreshing(false);
        }
    };

    const generateReminder = async () => {
        setLoadingReminder(true);
        try {
            const res = await postAi<ReminderPayload>('/api/ai/payment-reminder', {
                paymentSlug: payment.slug,
                bookingSlug: payment.bookingSlug,
                context: reminderCtx,
            });
            const m = res.messages;
            if (m?.soft && m?.professional && m?.strict) {
                setReminderMsgs({ soft: m.soft, professional: m.professional, strict: m.strict });
            } else {
                const one = res.message ?? '';
                setReminderMsgs({ soft: one, professional: one, strict: one });
            }
            if (!res.messages && !res.message) setToast({ msg: 'No message returned.', err: true });
        } catch (e) {
            setToast({ msg: getAiErrorMessage(e), err: true });
        } finally {
            setLoadingReminder(false);
        }
    };

    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setToast({ msg: 'Copied.' });
        } catch {
            setToast({ msg: 'Could not copy.', err: true });
        }
    };

    const tone = riskTone(riskLabel);

    return (
        <>
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}

            {delayRiskHigh ? (
                <div
                    className="flex items-start gap-2 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 px-3 py-2.5 text-sm text-red-950 shadow-sm mb-2"
                    role="status"
                >
                    <span aria-hidden>⚠️</span>
                    <p className="font-semibold leading-snug">High chance of delayed payment — prioritize recovery outreach.</p>
                </div>
            ) : null}

            <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/90 via-white to-blue-50/40 p-4 shadow-sm ring-1 ring-slate-200/80">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">AI payment insights</p>
                        <p className="mt-0.5 text-xs text-slate-500">Risk, delay, recovery — refreshed for this ledger row</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <AIGenerateButton
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setReminderOpen(true);
                                setReminderMsgs(null);
                            }}
                        >
                            Smart Reminder
                        </AIGenerateButton>
                        <AIGenerateButton type="button" variant="primary" onClick={refresh} loading={refreshing || loadingInitial}>
                            Refresh AI
                        </AIGenerateButton>
                    </div>
                </div>

                {loadingInitial ? (
                    <div className="mt-4 space-y-2">
                        <AISkeletonShimmer className="h-4 w-full" />
                        <AISkeletonShimmer className="h-4 w-2/3" />
                        <AISkeletonShimmer className="h-4 w-4/5" />
                    </div>
                ) : (
                    <div className="mt-4 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Risk score</span>
                            <AIRiskBadge tone={tone}>{riskLabel}</AIRiskBadge>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-slate-500">Delay (days)</p>
                                <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
                                    {delayDays !== null ? delayDays : '—'}
                                </p>
                            </div>
                            <div className="sm:col-span-2">
                                <p className="text-[10px] font-bold uppercase text-slate-500">Delay prediction</p>
                                <p className="mt-1 text-sm text-slate-800">{delayText}</p>
                            </div>
                            <div className="sm:col-span-2">
                                <p className="text-[10px] font-bold uppercase text-slate-500">Recovery strategy</p>
                                <p className="mt-1 text-sm text-slate-800">{recovery}</p>
                            </div>
                            <div className="sm:col-span-2">
                                <p className="text-[10px] font-bold uppercase text-slate-500">Recommendation</p>
                                <p className="mt-1 text-sm text-slate-800">{recommendation}</p>
                            </div>
                        </div>
                        <AIConfidenceBar value={confidence} />
                    </div>
                )}
            </section>

            <Modal
                isOpen={reminderOpen}
                onClose={() => setReminderOpen(false)}
                title="Smart payment reminder"
                maxWidthClassName="max-w-lg"
                footer={
                    <>
                        <AIGenerateButton type="button" variant="secondary" onClick={() => setReminderOpen(false)}>
                            Close
                        </AIGenerateButton>
                        <AIGenerateButton type="button" variant="primary" onClick={generateReminder} loading={loadingReminder}>
                            Generate messages
                        </AIGenerateButton>
                    </>
                }
            >
                <div className="space-y-4">
                    <InputField
                        label="Extra context (optional)"
                        value={reminderCtx}
                        onChange={(e) => setReminderCtx(e.target.value)}
                        placeholder="e.g. Mention milestone name, due date…"
                    />
                    {reminderMsgs ? (
                        <div className="space-y-3">
                            {(
                                [
                                    ['soft', 'Soft', reminderMsgs.soft],
                                    ['professional', 'Professional', reminderMsgs.professional],
                                    ['strict', 'Strict', reminderMsgs.strict],
                                ] as const
                            ).map(([key, label, text]) => (
                                <div key={key} className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
                                        <button
                                            type="button"
                                            className="min-w-0 truncate font-semibold text-slate-900 hover:text-[var(--cta-button-bg)] hover:underline"
                                            onClick={() => copy(text)}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-800">{text}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">Generate three tone variants (soft, professional, strict).</p>
                    )}
                </div>
            </Modal>
        </>
    );
}
