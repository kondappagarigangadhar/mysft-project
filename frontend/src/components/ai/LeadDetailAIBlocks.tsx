'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AIInsightStrip } from '@/components/ai/AIInsightStrip';
import { AICopilotPanel } from '@/components/ai/AICopilotPanel';
import { AIConfidenceBar } from '@/components/ai/AIConfidenceBar';
import { AIGenerateButton } from '@/components/ai/AIGenerateButton';
import { getAiErrorMessage, postAi, postAiCached } from '@/lib/aiApi';
import type { Lead } from '@/lib/leadStore';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { AISkeletonShimmer } from '@/components/ai/AISkeletonShimmer';

type LeadScorePayload = {
    insight?: string;
    conversionProbability?: number;
    confidence?: number;
    action?: string;
};

type CopilotPayload = {
    nextAction?: string;
    bestTimeToContact?: string;
    suggestedPitch?: string;
    confidence?: number;
    insight?: string;
    action?: string;
};

type ImprovePayload = {
    insight?: string;
    confidence?: number;
    action?: string;
};

export function LeadLeadScoreStrip({ lead }: { lead: Lead }) {
    const [line, setLine] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const res = await postAiCached<LeadScorePayload>(
                    `lead-score:${lead.slug}`,
                    '/api/ai/lead-score',
                    { leadSlug: lead.slug, leadId: lead.id, name: lead.name, status: lead.status },
                    4 * 60_000,
                );
                if (cancelled) return;
                const p = res.conversionProbability ?? lead.pipeline?.conversionProbability ?? 0;
                const insight =
                    res.insight?.trim() ||
                    `Engagement looks aligned with ${lead.project || 'the selected project'}.`;
                setLine(`This lead has ${Math.round(p)}% conversion probability. ${insight}`);
            } catch {
                if (!cancelled) {
                    const p = lead.pipeline?.conversionProbability ?? 0;
                    setLine(`This lead has ${Math.round(p)}% conversion probability (offline estimate).`);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [lead.slug, lead.id, lead.name, lead.status, lead.project, lead.pipeline?.conversionProbability]);

    return <AIInsightStrip text={line} loading={loading} />;
}

export function LeadAICopilotPanel({ lead, disabled }: { lead: Lead; disabled?: boolean }) {
    const [nextAction, setNextAction] = useState('');
    const [bestTime, setBestTime] = useState('');
    const [pitch, setPitch] = useState('');
    const [confidence, setConfidence] = useState(0);
    const [loading, setLoading] = useState(true);
    const [improveLoading, setImproveLoading] = useState(false);
    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const dismissToast = useCallback(() => setToast(null), []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const res = await postAiCached<CopilotPayload>(
                    `lead-copilot:${lead.slug}`,
                    '/api/ai/lead-copilot',
                    { leadSlug: lead.slug, leadId: lead.id },
                    5 * 60_000,
                );
                if (cancelled) return;
                setNextAction(res.nextAction?.trim() || 'Schedule a discovery call.');
                setBestTime(res.bestTimeToContact?.trim() || 'Weekdays 10:00–12:00');
                setPitch(res.suggestedPitch?.trim() || 'Lead with inventory fit and flexible payment options.');
                setConfidence(typeof res.confidence === 'number' ? res.confidence : 82);
            } catch {
                if (!cancelled) {
                    setNextAction('Schedule a follow-up call.');
                    setBestTime('Weekdays 10:00–12:00');
                    setPitch('Highlight unit availability and financing options.');
                    setConfidence(78);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [lead.slug, lead.id]);

    const improve = async () => {
        if (disabled) return;
        setImproveLoading(true);
        try {
            const res = await postAi<ImprovePayload>('/api/ai/improve-conversion', {
                leadSlug: lead.slug,
                leadId: lead.id,
            });
            if (res.insight) setPitch((p) => `${res.insight}\n\n${p}`);
            if (typeof res.confidence === 'number') setConfidence(res.confidence);
            if (res.action) setNextAction(res.action);
            setToast({ msg: 'Strategy refreshed.' });
        } catch (e) {
            setToast({ msg: getAiErrorMessage(e), err: true });
        } finally {
            setImproveLoading(false);
        }
    };

    return (
        <>
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}
            <AICopilotPanel>
                {loading ? (
                    <div className="space-y-2">
                        <AISkeletonShimmer className="h-3 w-full" />
                        <AISkeletonShimmer className="h-3 w-4/5" />
                        <AISkeletonShimmer className="h-3 w-full" />
                    </div>
                ) : (
                    <>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Next action</p>
                            <p className="mt-1 font-medium text-slate-900">{nextAction}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Best time to contact</p>
                            <p className="mt-1 text-slate-800">{bestTime}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Suggested pitch</p>
                            <p className="mt-1 text-slate-700 leading-relaxed">{pitch}</p>
                        </div>
                        <AIConfidenceBar value={confidence} />
                        <AIGenerateButton
                            type="button"
                            variant="primary"
                            className="w-full"
                            onClick={improve}
                            loading={improveLoading}
                            disabled={disabled}
                        >
                            Improve Conversion Strategy
                        </AIGenerateButton>
                    </>
                )}
            </AICopilotPanel>
        </>
    );
}
