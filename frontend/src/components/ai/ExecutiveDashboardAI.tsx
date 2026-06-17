'use client';

import React, { useCallback, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { AIGenerateButton } from '@/components/ai/AIGenerateButton';
import { AIInsightsEnhanced } from '@/components/ai/AIInsightsEnhanced';
import { getAiErrorMessage, postAi } from '@/lib/aiApi';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { cn } from '@/lib/utils';

type AnalyticsPayload = {
    summary?: string;
    insights?: string[];
    bullets?: string[];
};

export function ExecutiveDashboardAI() {
    const [q, setQ] = useState('');
    const [answerSummary, setAnswerSummary] = useState('');
    const [answerBullets, setAnswerBullets] = useState<string[]>([]);
    const [askLoading, setAskLoading] = useState(false);

    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const dismissToast = useCallback(() => setToast(null), []);

    const ask = async () => {
        const query = q.trim();
        if (!query) return;
        setAskLoading(true);
        try {
            const res = await postAi<AnalyticsPayload>('/api/ai/analytics', { query });
            setAnswerSummary(res.summary?.trim() || '');
            const list = res.insights ?? res.bullets ?? [];
            setAnswerBullets(Array.isArray(list) ? list : []);
            setToast({ msg: 'Response ready.' });
        } catch (e) {
            setToast({ msg: getAiErrorMessage(e), err: true });
        } finally {
            setAskLoading(false);
        }
    };

    return (
        <>
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}
            <div className="mb-10 space-y-6">
                <div
                    className={cn(
                        'rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-md transition-all duration-200 sm:p-6',
                    )}
                >
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#0092ff]/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#0092ff]">
                                Copilot
                            </span>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">AI workspace</p>
                        </div>
                        <AIInsightsEnhanced />
                    </div>
                </div>

                <Card className="border-blue-100 bg-gradient-to-br from-blue-50/80 to-white shadow-md" contentClassName="p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ask your workspace</p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') void ask();
                            }}
                            placeholder="Ask anything… payment delays, top leads, project risk…"
                            className="min-h-[48px] flex-1 rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 transition-all duration-200 placeholder:text-gray-400 focus:border-[#0092ff] focus:outline-none focus:ring-2 focus:ring-[#0092ff]/25"
                        />
                        <AIGenerateButton
                            type="button"
                            variant="primary"
                            onClick={() => void ask()}
                            loading={askLoading}
                            className="shrink-0 rounded-lg px-6"
                        >
                            Ask AI
                        </AIGenerateButton>
                    </div>
                    {answerSummary || answerBullets.length ? (
                        <div className="mt-5 rounded-xl border border-gray-100 bg-white/90 p-4 text-sm leading-relaxed text-gray-800 shadow-sm">
                            {answerSummary ? <p className="font-medium text-gray-900">{answerSummary}</p> : null}
                            {answerBullets.length ? (
                                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-gray-700">
                                    {answerBullets.map((b, i) => (
                                        <li key={i}>{b}</li>
                                    ))}
                                </ul>
                            ) : null}
                        </div>
                    ) : null}
                </Card>
            </div>
        </>
    );
}
