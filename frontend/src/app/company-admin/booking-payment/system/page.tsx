'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { RightCollapsePanel } from '@/components/booking-payment/RightCollapsePanel';
import {
    getAuditBySlug,
    getAuditLog,
    getMaskedRefs,
    getPaymentTokenDisplay,
    getReminderEnabled,
    getUserConsent,
    setReminderEnabled,
    setUserConsent,
} from '@/lib/bookingPaymentMockStore';
import { LuEye } from 'react-icons/lu';

export default function BookingPaymentSystemPage() {
    const [v, setV] = useState(0);
    const bump = () => setV((x) => x + 1);

    const reminder = useMemo(() => getReminderEnabled(), [v]);
    const token = useMemo(() => getPaymentTokenDisplay(), []);
    const masked = useMemo(() => getMaskedRefs(), []);
    const audit = useMemo(() => getAuditLog(), [v]);
    const consent = useMemo(() => getUserConsent(), [v]);

    const [panelOpen, setPanelOpen] = useState(false);
    const [activeSlug, setActiveSlug] = useState<string | null>(null);
    const entry = useMemo(() => (activeSlug ? getAuditBySlug(activeSlug) : undefined), [activeSlug, v]);

    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const dismissToast = useCallback(() => setToast(null), []);

    const [confirmConsent, setConfirmConsent] = useState(false);
    const [consentError, setConsentError] = useState<string | null>(null);

    const onToggleReminder = () => {
        setReminderEnabled(!reminder);
        setToast({ msg: `Reminders ${!reminder ? 'enabled' : 'disabled'}.` });
        bump();
    };

    const onSaveConsent = () => {
        if (!confirmConsent) {
            setConsentError('You must check the box to confirm consent before saving.');
            setToast({ msg: 'Please accept the consent to continue.', err: true });
            return;
        }
        setConsentError(null);
        setUserConsent(true);
        setToast({ msg: 'Consent recorded. Thank you.' });
        bump();
    };

    const openAudit = (slug: string) => {
        setActiveSlug(slug);
        setPanelOpen(true);
    };

    return (
        <div className="space-y-6">
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}

            <RightCollapsePanel open={panelOpen} onClose={() => setPanelOpen(false)} title="Audit entry" subtitle={entry ? `Slug: ${entry.slug}` : undefined}>
                {entry && (
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Slug</dt>
                            <dd className="font-mono text-xs font-semibold text-right">{entry.slug}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Time</dt>
                            <dd className="text-right">{new Date(entry.at).toLocaleString()}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Actor</dt>
                            <dd className="font-medium">{entry.actor}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Action</dt>
                            <dd className="mt-1 font-semibold">{entry.action}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Meta</dt>
                            <dd className="mt-1 text-slate-600">{entry.meta || '—'}</dd>
                        </div>
                    </dl>
                )}
            </RightCollapsePanel>

            <Breadcrumb
                items={[
                    { label: 'Booking & Payment', href: '/company-admin/booking-payment/booking' },
                    { label: 'System', href: '/company-admin/booking-payment/system' },
                ]}
            />

            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System</h1>
                <p className="text-sm text-slate-600 mt-1">Reminders, security references, audit trail (slug), and consent.</p>
            </div>

            <Card title="Reminder settings">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div>
                        <p className="font-semibold text-slate-900">Payment reminders</p>
                        <p className="text-sm text-slate-500 mt-1">Automated reminders for due installments.</p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={reminder}
                        onClick={onToggleReminder}
                        className={`relative h-8 w-14 rounded-full transition-colors ${reminder ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                        <span
                            className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${reminder ? 'translate-x-6' : ''}`}
                        />
                    </button>
                </div>
            </Card>

            <Card title="Security" subtitle="Masked tokens for display only.">
                <dl className="space-y-4 text-sm">
                    <div>
                        <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment token (system)</dt>
                        <dd className="mt-1 font-mono text-slate-800 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">{token}</dd>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <dt className="text-xs font-semibold text-slate-500">Card last 4</dt>
                            <dd className="mt-1 font-mono font-bold tracking-widest">{masked.last4}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-semibold text-slate-500">UPI reference</dt>
                            <dd className="mt-1 font-mono text-slate-700">{masked.upiRef}</dd>
                        </div>
                    </div>
                </dl>
            </Card>

            <Card title="Audit log" subtitle="Each row is keyed by slug (not numeric id).">
                <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[360px] overflow-y-auto">
                    <table className="w-full text-sm min-w-[640px]">
                        <thead className="bg-slate-50 sticky top-0">
                            <tr className="text-left text-slate-600 font-semibold border-b border-slate-200">
                                <th className="px-4 py-3">Slug</th>
                                <th className="px-4 py-3">Time</th>
                                <th className="px-4 py-3">Actor</th>
                                <th className="px-4 py-3">Action</th>
                                <th className="px-4 py-3 text-right">View</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {audit.map((a) => (
                                <tr key={a.slug} className="bg-white hover:bg-slate-50/80">
                                    <td className="px-4 py-2 font-mono text-xs font-semibold text-blue-800 max-w-[200px] truncate">{a.slug}</td>
                                    <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">{new Date(a.at).toLocaleString()}</td>
                                    <td className="px-4 py-2">{a.actor}</td>
                                    <td className="px-4 py-2 font-medium">{a.action}</td>
                                    <td className="px-4 py-2 text-right">
                                        <Button
                                            type="button"
                                            variant="companyGhost"
                                            size="cta"
                                            className="h-8 px-2.5 min-h-0"
                                            onClick={() => openAudit(a.slug)}
                                        >
                                            <LuEye size={16} className="mr-1" />
                                            View
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card title="User consent" subtitle="Mandatory before processing payments in production.">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={confirmConsent || consent}
                        disabled={consent}
                        onChange={(e) => {
                            setConfirmConsent(e.target.checked);
                            if (e.target.checked) setConsentError(null);
                        }}
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                        aria-invalid={Boolean(consentError)}
                    />
                    <span className="text-sm text-slate-700">
                        I confirm that customer data will be processed only for booking and payment operations, in line with company policy
                        and applicable regulations.
                    </span>
                </label>
                {consentError ? <p className="mt-2 text-sm text-red-600 font-medium">{consentError}</p> : null}
                {consent ? (
                    <p className="mt-3 text-sm font-semibold text-emerald-700">Consent on file — recorded in audit log.</p>
                ) : (
                    <Button type="button" variant="company" size="cta" className="mt-4" onClick={onSaveConsent}>
                        Save consent
                    </Button>
                )}
            </Card>
        </div>
    );
}
