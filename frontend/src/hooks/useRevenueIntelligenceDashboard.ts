'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAISalesIntelligenceLeads } from '@/lib/aiSalesIntelligenceStore';
import type { IntelligenceLead } from '@/lib/leadsIntelligenceStore';
import {
    buildAIRecommendations,
    buildNextBestActionQueue,
    buildRevenueLeakageMonitor,
    buildRevenueRiskRows,
    buildRevenueSummary,
    buildSalespersonIntelligence,
    filterAiLeadsByIntelSlugs,
    getRevenueFunnel,
    getTopOpportunities,
    identifyFunnelBottleneck,
} from '@/lib/revenueIntelligenceHelpers';

export function useRevenueIntelligenceDashboard(filteredLeads: IntelligenceLead[]) {
    const [aiRevision, setAiRevision] = useState(0);

    useEffect(() => {
        const onUpdate = () => setAiRevision((n) => n + 1);
        window.addEventListener('arris-ai-sales-updated', onUpdate);
        return () => window.removeEventListener('arris-ai-sales-updated', onUpdate);
    }, []);

    return useMemo(() => {
        const allAi = getAISalesIntelligenceLeads();
        const aiLeads = filterAiLeadsByIntelSlugs(allAi, filteredLeads);
        const funnel = getRevenueFunnel(aiLeads);

        const conversionPrediction = [...aiLeads].sort(
            (a, b) => b.conversionProbability - a.conversionProbability || b.leadScore - a.leadScore,
        );

        return {
            summary: buildRevenueSummary(filteredLeads),
            conversionPrediction,
            riskRows: buildRevenueRiskRows(filteredLeads, aiLeads, 10),
            opportunities: getTopOpportunities(aiLeads, 20),
            actionQueue: buildNextBestActionQueue(filteredLeads, 7),
            salespeople: buildSalespersonIntelligence(filteredLeads),
            funnel,
            funnelBottleneck: identifyFunnelBottleneck(funnel),
            leakage: buildRevenueLeakageMonitor(filteredLeads),
            recommendations: buildAIRecommendations(filteredLeads, aiLeads, 10),
            leadCount: filteredLeads.length,
        };
    }, [filteredLeads, aiRevision]);
}
