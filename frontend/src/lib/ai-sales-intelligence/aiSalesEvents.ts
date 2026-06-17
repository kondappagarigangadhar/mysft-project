'use client';

import { recalculateLeadAIInsights } from '@/lib/ai-sales-intelligence/aiInsightsRepository';

export type AISalesTriggerEvent =
    | 'LeadCreated'
    | 'LeadUpdated'
    | 'FollowUpAdded'
    | 'VisitCompleted'
    | 'StageChanged'
    | 'NightlyBatch';

const pending = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Queue hybrid AI recalculation (debounced). Triggered on lead CRM mutations.
 * Events: LeadCreated, LeadUpdated, FollowUpAdded, VisitCompleted, StageChanged.
 */
export function queueAISalesRecalculation(leadSlug: string, _event: AISalesTriggerEvent): void {
    if (typeof window === 'undefined') return;
    const existing = pending.get(leadSlug);
    if (existing) clearTimeout(existing);
    pending.set(
        leadSlug,
        setTimeout(() => {
            pending.delete(leadSlug);
            recalculateLeadAIInsights(leadSlug);
        }, 120),
    );
}
