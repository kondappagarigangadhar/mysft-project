'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { Company } from '@/data/mockData';
import { AICopilotPanel } from '@/components/ai/AICopilotPanel';
import { AIConfidenceBar } from '@/components/ai/AIConfidenceBar';
import { AIGenerateButton } from '@/components/ai/AIGenerateButton';
import { AISkeletonShimmer } from '@/components/ai/AISkeletonShimmer';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { getAiErrorMessage, postAi, postAiCached } from '@/lib/aiApi';

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

/** Right-rail AI panel for tenant records — same shell and behavior pattern as `LeadAICopilotPanel`. */
export function TenantAICopilotPanel({ company, disabled }: { company: Company; disabled?: boolean }) {
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
                    `tenant-copilot:${company.id}`,
                    '/api/ai/lead-copilot',
                    { tenantId: company.id, name: company.name, plan: company.plan, kind: 'tenant' },
                    5 * 60_000,
                );
                if (cancelled) return;
                setNextAction(res.nextAction?.trim() || 'Review subscription usage and seat allocation.');
                setBestTime(res.bestTimeToContact?.trim() || 'Weekdays 09:00–11:00 IST');
                setPitch(
                    res.suggestedPitch?.trim() ||
                        `Highlight ${company.plan} plan value, storage limits, and onboarding checklist for ${company.name || 'this tenant'}.`,
                );
                setConfidence(typeof res.confidence === 'number' ? res.confidence : 80);
            } catch {
                if (!cancelled) {
                    setNextAction('Schedule a quarterly tenant health review.');
                    setBestTime('Weekdays 09:00–11:00 IST');
                    setPitch('Confirm domain setup, admin contacts, and project rollout milestones.');
                    setConfidence(76);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [company.id, company.name, company.plan]);

    const improve = async () => {
        if (disabled) return;
        setImproveLoading(true);
        try {
            const res = await postAi<ImprovePayload>('/api/ai/improve-conversion', {
                tenantId: company.id,
                name: company.name,
                plan: company.plan,
            });
            if (res.insight) setPitch((p) => `${res.insight}\n\n${p}`);
            if (typeof res.confidence === 'number') setConfidence(res.confidence);
            if (res.action) setNextAction(res.action);
            setToast({ msg: 'Recommendations refreshed.' });
        } catch (e) {
            setToast({ msg: getAiErrorMessage(e), err: true });
        } finally {
            setImproveLoading(false);
        }
    };

    return (
        <>
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}
            <AICopilotPanel title="AI Copilot">
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
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Best time to engage</p>
                            <p className="mt-1 text-slate-800">{bestTime}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Suggested focus</p>
                            <p className="mt-1 leading-relaxed text-slate-700">{pitch}</p>
                        </div>
                        <AIConfidenceBar value={confidence} />
                        <AIGenerateButton
                            type="button"
                            variant="primary"
                            className="w-full"
                            onClick={() => void improve()}
                            loading={improveLoading}
                            disabled={disabled}
                        >
                            Refresh recommendations
                        </AIGenerateButton>
                    </>
                )}
            </AICopilotPanel>
        </>
    );
}
