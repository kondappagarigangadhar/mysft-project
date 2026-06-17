'use client';

import React, { useCallback, useState } from 'react';
import { AIInsightCard } from '@/components/ai/AIInsightCard';
import { AIGenerateButton } from '@/components/ai/AIGenerateButton';
import { AIRiskBadge } from '@/components/ai/AIRiskBadge';
import { getAiErrorMessage, postAi } from '@/lib/aiApi';
import { InlineToast } from '@/components/booking-payment/InlineToast';

type CompliancePayload = {
    missingDocuments?: string[];
    expiringSoon?: string[];
};

export function ComplianceAICard({ scope }: { scope: 'documents' | 'project' }) {
    const [missing, setMissing] = useState<string[]>([]);
    const [expiring, setExpiring] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const dismissToast = useCallback(() => setToast(null), []);

    const run = async () => {
        setLoading(true);
        try {
            const res = await postAi<CompliancePayload>('/api/ai/compliance-check', { scope });
            setMissing(Array.isArray(res.missingDocuments) ? res.missingDocuments : []);
            setExpiring(Array.isArray(res.expiringSoon) ? res.expiringSoon : []);
            setToast({ msg: 'Compliance check complete.' });
        } catch (e) {
            setToast({ msg: getAiErrorMessage(e), err: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}
            <AIInsightCard
                title="AI Compliance Check"
                action={
                    <AIGenerateButton type="button" variant="primary" onClick={run} loading={loading}>
                        Run check
                    </AIGenerateButton>
                }
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase text-slate-500">Missing documents</span>
                            <AIRiskBadge tone="missing">Missing</AIRiskBadge>
                        </div>
                        {missing.length ? (
                            <ul className="list-disc space-y-1 pl-4 text-sm text-slate-800">
                                {missing.map((x, i) => (
                                    <li key={i}>{x}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500">Run the check to see gaps.</p>
                        )}
                    </div>
                    <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase text-slate-500">Expiring soon</span>
                            <AIRiskBadge tone="expiring">Expiring</AIRiskBadge>
                        </div>
                        {expiring.length ? (
                            <ul className="list-disc space-y-1 pl-4 text-sm text-slate-800">
                                {expiring.map((x, i) => (
                                    <li key={i}>{x}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500">Run the check to see upcoming expiries.</p>
                        )}
                    </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                    <AIRiskBadge tone="valid" className="mr-2">
                        Valid
                    </AIRiskBadge>
                    indicates items confirmed OK when returned by your API.
                </p>
            </AIInsightCard>
        </>
    );
}
