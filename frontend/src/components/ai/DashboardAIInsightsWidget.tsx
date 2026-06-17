'use client';

import React, { useCallback, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { AIGenerateButton } from '@/components/ai/AIGenerateButton';
import { AIInsightsEnhanced } from '@/components/ai/AIInsightsEnhanced';
import { getAiErrorMessage, postAi } from '@/lib/aiApi';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { LuSparkles } from 'react-icons/lu';

type AnalyticsPayload = {
    summary?: string;
    insights?: string[];
    bullets?: string[];
};

/** Dashboard-sized AI block: structured insights + optional quick ask (POST /api/ai/analytics). */
export function DashboardAIInsightsWidget() {
    const [q, setQ] = useState('');
    const [summary, setSummary] = useState('');
    const [bullets, setBullets] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const dismissToast = useCallback(() => setToast(null), []);

    const ask = async () => {
        const query = q.trim();
        if (!query) return;
        setLoading(true);
        try {
            const res = await postAi<AnalyticsPayload>('/api/ai/analytics', { query });
            setSummary(res.summary?.trim() || '');
            const list = res.insights ?? res.bullets ?? [];
            setBullets(Array.isArray(list) ? list : []);
            setToast({ msg: 'Insights ready.' });
        } catch (e) {
            setToast({ msg: getAiErrorMessage(e), err: true });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}
            <div className="space-y-4">
                <AIInsightsEnhanced />

                <Card className="border border-blue-100 bg-gradient-to-br from-white to-blue-50/40 p-5 shadow-md">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
                                <LuSparkles size={18} aria-hidden />
                            </span>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Quick ask</h3>
                                <p className="text-xs text-slate-500">Natural language follow-up (same backend as /api/ai/analytics)</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Ask your data… e.g. payment delays, top leads"
                            className="min-h-[44px] flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                        />
                        <AIGenerateButton type="button" variant="primary" onClick={ask} loading={loading} className="shrink-0">
                            Ask AI
                        </AIGenerateButton>
                    </div>
                    {summary || bullets.length ? (
                        <div className="mt-4 space-y-3 rounded-xl border border-slate-200/80 bg-white/80 p-4">
                            {summary ? (
                                <div>
                                    <p className="text-xs font-bold uppercase text-slate-500">Summary</p>
                                    <p className="mt-1 text-sm text-slate-800">{summary}</p>
                                </div>
                            ) : null}
                            {bullets.length ? (
                                <div>
                                    <p className="text-xs font-bold uppercase text-slate-500">Insights</p>
                                    <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-800">
                                        {bullets.map((b, i) => (
                                            <li key={i}>{b}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </Card>
            </div>
        </>
    );
}
