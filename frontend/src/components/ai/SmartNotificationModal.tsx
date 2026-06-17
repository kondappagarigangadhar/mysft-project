'use client';

import React, { useCallback, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { AIGenerateButton } from '@/components/ai/AIGenerateButton';
import { SelectField } from '@/components/forms/Fields';
import { getAiErrorMessage, postAi } from '@/lib/aiApi';
import { InlineToast } from '@/components/booking-payment/InlineToast';

type NotificationPayload = { message?: string; text?: string; preview?: string };

export function SmartNotificationModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [type, setType] = useState('payment');
    const [context, setContext] = useState('');
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const dismissToast = useCallback(() => setToast(null), []);

    const generate = async () => {
        setLoading(true);
        try {
            const res = await postAi<NotificationPayload>('/api/ai/notification', {
                type,
                context,
            });
            setPreview(res.message ?? res.text ?? res.preview ?? '');
            if (!(res.message ?? res.text ?? res.preview)?.toString().trim()) {
                setToast({ msg: 'No message in response.', err: true });
            }
        } catch (e) {
            setToast({ msg: getAiErrorMessage(e), err: true });
        } finally {
            setLoading(false);
        }
    };

    const copy = async () => {
        if (!preview.trim()) return;
        try {
            await navigator.clipboard.writeText(preview);
            setToast({ msg: 'Copied to clipboard.' });
        } catch {
            setToast({ msg: 'Could not copy.', err: true });
        }
    };

    return (
        <>
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Smart notification"
                maxWidthClassName="max-w-lg"
                footer={
                    <>
                        <AIGenerateButton type="button" variant="secondary" onClick={onClose}>
                            Close
                        </AIGenerateButton>
                        <AIGenerateButton type="button" variant="primary" onClick={generate} loading={loading}>
                            Generate
                        </AIGenerateButton>
                    </>
                }
            >
                <div className="space-y-4">
                    <SelectField
                        label="Type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        options={[
                            { value: 'payment', label: 'Payment' },
                            { value: 'offer', label: 'Offer' },
                            { value: 'reminder', label: 'Reminder' },
                        ]}
                    />
                    <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Context</label>
                        <textarea
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            rows={4}
                            placeholder="Audience, amount, deadline…"
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                        />
                    </div>
                    {preview ? (
                        <div>
                            <p className="text-xs font-bold uppercase text-slate-400">Message preview</p>
                            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
                                {preview}
                            </pre>
                            <AIGenerateButton type="button" variant="secondary" className="mt-2" onClick={copy}>
                                Copy
                            </AIGenerateButton>
                        </div>
                    ) : null}
                </div>
            </Modal>
        </>
    );
}
