'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LeadTemperature } from '@/lib/aiSalesIntelligenceStore';
import { getAISalesIntelligenceLeads } from '@/lib/aiSalesIntelligenceStore';
import {
    computeBehaviorAnalysis,
    computeConversionFunnel,
    computeModelPerformance,
    computeOpportunityPrioritization,
    computeTemperatureDistribution,
    filterAISalesLeads,
} from '@/lib/aiSalesIntelligenceHelpers';

export type AISalesIntelFilters = {
    search: string;
    temperature: 'All' | LeadTemperature;
    project: string;
};

export function defaultAISalesIntelFilters(): AISalesIntelFilters {
    return { search: '', temperature: 'All', project: 'All' };
}

export function useAiSalesIntelDashboard(filters: AISalesIntelFilters) {
    const [revision, setRevision] = useState(0);

    useEffect(() => {
        const onUpdate = () => setRevision((n) => n + 1);
        window.addEventListener('arris-ai-sales-updated', onUpdate);
        return () => window.removeEventListener('arris-ai-sales-updated', onUpdate);
    }, []);

    const allLeads = useMemo(() => getAISalesIntelligenceLeads(), [revision]);

    return useMemo(() => {
        const filtered = filterAISalesLeads(allLeads, filters.search, filters.temperature, filters.project);
        const conversionSorted = [...filtered].sort(
            (a, b) => b.conversionProbability - a.conversionProbability || b.leadScore - a.leadScore,
        );
        const nextBestActions = [...filtered]
            .filter((l) => l.leadTemperature !== 'Cold' || l.conversionProbability >= 25)
            .sort((a, b) => b.expectedRevenueImpactLakhs - a.expectedRevenueImpactLakhs)
            .slice(0, 8);
        const recommendationQueue = [...filtered]
            .sort((a, b) => {
                const prio = { Critical: 0, High: 1, Medium: 2, Low: 3 };
                return prio[a.queuePriority] - prio[b.queuePriority] || b.confidenceScore - a.confidenceScore;
            })
            .slice(0, 10);

        return {
            allLeads,
            filteredLeads: filtered,
            modelPerformance: computeModelPerformance(filtered),
            conversionPrediction: conversionSorted,
            opportunityPrioritization: computeOpportunityPrioritization(filtered),
            temperatureDistribution: computeTemperatureDistribution(filtered),
            nextBestActions,
            behaviorAnalysis: computeBehaviorAnalysis(filtered),
            conversionFunnel: computeConversionFunnel(filtered),
            recommendationQueue,
        };
    }, [allLeads, filters.search, filters.temperature, filters.project]);
}
