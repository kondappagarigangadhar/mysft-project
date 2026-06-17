'use client';

import React, { useCallback, useState } from 'react';
import { AIInsightCard } from '@/components/ai/AIInsightCard';
import { AIGenerateButton } from '@/components/ai/AIGenerateButton';
import { AIResultTabs } from '@/components/ai/AIResultTabs';
import { getAiErrorMessage, postAi } from '@/lib/aiApi';
import { InlineToast } from '@/components/booking-payment/InlineToast';

type DocAiBundle = {
    data?: string | Record<string, unknown>;
    explanation?: string;
    risks?: string[];
    importantClauses?: string[];
};

function formatData(data: DocAiBundle['data']): string {
    if (data == null) return '—';
    if (typeof data === 'string') return data;
    try {
        return JSON.stringify(data, null, 2);
    } catch {
        return String(data);
    }
}

export function DocumentsAIActions({
    documentId,
    documentName,
}: {
    documentId: string;
    documentName: string;
}) {
    const [bundle, setBundle] = useState<DocAiBundle | null>(null);
    const [loading, setLoading] = useState<'extract' | 'explain' | 'risk' | null>(null);
    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const dismissToast = useCallback(() => setToast(null), []);

    const run = async (kind: 'extract' | 'explain' | 'risk') => {
        const path =
            kind === 'extract' ? '/api/ai/extract' : kind === 'explain' ? '/api/ai/explain' : '/api/ai/risk';
        setLoading(kind);
        try {
            const res = await postAi<DocAiBundle>(path, { documentId, documentName });
            setBundle((prev) => ({ ...prev, ...res }));
            setToast({ msg: 'AI result ready.' });
        } catch (e) {
            setToast({ msg: getAiErrorMessage(e), err: true });
        } finally {
            setLoading(null);
        }
    };

    const explanationBlocks = (
        <div className="space-y-3">
            {bundle?.importantClauses?.length ? (
                <div>
                    <p className="text-xs font-bold uppercase text-amber-700">Important clauses</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-sm">
                        {bundle.importantClauses.map((x, i) => (
                            <li key={i} className="rounded-md bg-yellow-50 px-2 py-1 text-slate-900 ring-1 ring-yellow-200/80">
                                {x}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
            <div>
                <p className="text-xs font-bold uppercase text-slate-500">Full explanation</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{bundle?.explanation?.trim() || '—'}</p>
            </div>
        </div>
    );

    const riskBlocks = (
        <div className="space-y-2">
            {bundle?.risks?.length ? (
                <ul className="list-disc space-y-1 pl-4">
                    {bundle.risks.map((x, i) => (
                        <li key={i} className="rounded-md bg-red-50 px-2 py-1 text-sm text-red-950 ring-1 ring-red-200/80">
                            {x}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-slate-600">—</p>
            )}
        </div>
    );

    return (
        <>
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}
            <AIInsightCard
                title="Document AI"
                subtitle={documentName}
                action={
                    <div className="flex flex-wrap gap-2">
                        <AIGenerateButton
                            type="button"
                            variant="secondary"
                            onClick={() => run('extract')}
                            loading={loading === 'extract'}
                        >
                            Extract Data
                        </AIGenerateButton>
                        <AIGenerateButton
                            type="button"
                            variant="secondary"
                            onClick={() => run('explain')}
                            loading={loading === 'explain'}
                        >
                            Explain Clauses
                        </AIGenerateButton>
                        <AIGenerateButton type="button" variant="primary" onClick={() => run('risk')} loading={loading === 'risk'}>
                            Detect Risks
                        </AIGenerateButton>
                    </div>
                }
            >
                <AIResultTabs
                    key={documentId}
                    tabs={[
                        {
                            id: 'data',
                            label: 'Data',
                            content: (
                                <pre className="whitespace-pre-wrap font-mono text-xs text-slate-800">
                                    {formatData(bundle?.data)}
                                </pre>
                            ),
                        },
                        {
                            id: 'explanation',
                            label: 'Explanation',
                            content: explanationBlocks,
                        },
                        {
                            id: 'risks',
                            label: 'Risks',
                            content: riskBlocks,
                        },
                    ]}
                />
            </AIInsightCard>
        </>
    );
}
