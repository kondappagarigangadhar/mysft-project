'use client';

import React, { useCallback, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { AIGenerateButton } from '@/components/ai/AIGenerateButton';
import { getAiErrorMessage, postAi } from '@/lib/aiApi';
import { InlineToast } from '@/components/booking-payment/InlineToast';

type UpdatePayload = { update?: string; text?: string; summary?: string; content?: string };

export function ProjectAIUpdateSection({ projectSlug, projectName }: { projectSlug: string; projectName: string }) {
    const [open, setOpen] = useState(false);
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const dismissToast = useCallback(() => setToast(null), []);

    const generate = async () => {
        setLoading(true);
        try {
            const res = await postAi<UpdatePayload>('/api/ai/project-update', {
                projectSlug,
                projectName,
            });
            const t = res.update ?? res.text ?? res.summary ?? res.content ?? '';
            setBody(t);
            setOpen(true);
            if (!t) setToast({ msg: 'No update text returned.', err: true });
        } catch (e) {
            setToast({ msg: getAiErrorMessage(e), err: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}
            <AIGenerateButton type="button" variant="secondary" onClick={generate} loading={loading}>
                Generate AI Update
            </AIGenerateButton>
            <Modal isOpen={open} onClose={() => setOpen(false)} title="AI project update" maxWidthClassName="max-w-lg">
                <div className="max-h-[min(400px,55vh)] overflow-y-auto whitespace-pre-wrap text-sm text-slate-800">
                    {body || '—'}
                </div>
            </Modal>
        </>
    );
}
