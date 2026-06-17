'use client';

import React from 'react';
import { AIRiskBadge } from '@/components/ai/AIRiskBadge';
import { cn } from '@/lib/utils';

export type AILeadThermal = 'Hot' | 'Warm' | 'Cold';

export function scoreToAILeadThermal(score: number): AILeadThermal {
    const s = Math.max(0, Math.min(100, Math.round(score)));
    if (s >= 70) return 'Hot';
    if (s >= 40) return 'Warm';
    return 'Cold';
}

const thermalTone = {
    Hot: 'hot' as const,
    Warm: 'warm' as const,
    Cold: 'cold' as const,
};

export function AILeadScoreBadge({
    score,
    className,
}: {
    score: number;
    className?: string;
}) {
    const thermal = scoreToAILeadThermal(score);
    return (
        <span className={cn('inline-flex items-center gap-1.5', className)} title="AI lead score band">
            <AIRiskBadge tone={thermalTone[thermal]}>{thermal}</AIRiskBadge>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">AI</span>
        </span>
    );
}
