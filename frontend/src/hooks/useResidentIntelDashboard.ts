'use client';

import { useMemo } from 'react';
import {
    filterResidentIntelRecords,
    filterResidentRisks,
    type ResidentIntelFilters,
} from '@/lib/residentIntelligenceHelpers';
import {
    getResidentAttentionItems,
    getResidentEngagementOpportunities,
    getResidentIntelExecutiveKpis,
    getResidentIntelRecords,
    getResidentRecommendedActions,
    getResidentRiskRows,
} from '@/lib/residentIntelligenceStore';

const ATTENTION_LIMIT = 8;
const ACTIONS_LIMIT = 6;
const ENGAGEMENT_LIMIT = 6;
const RISK_LIMIT = 12;

export function useResidentIntelDashboard(filters: ResidentIntelFilters) {
    const allRecords = useMemo(() => getResidentIntelRecords(), []);
    const records = useMemo(() => filterResidentIntelRecords(allRecords, filters), [allRecords, filters]);
    const residentSlugs = useMemo(() => new Set(records.map((r) => r.residentSlug)), [records]);

    const executive = useMemo(() => getResidentIntelExecutiveKpis(), []);

    const attention = useMemo(() => {
        return getResidentAttentionItems()
            .filter((a) => residentSlugs.has(a.residentSlug))
            .slice(0, ATTENTION_LIMIT);
    }, [residentSlugs]);

    const actions = useMemo(() => {
        return getResidentRecommendedActions()
            .filter((a) => residentSlugs.has(a.residentSlug))
            .slice(0, ACTIONS_LIMIT);
    }, [residentSlugs]);

    const engagementOpportunities = useMemo(() => {
        return getResidentEngagementOpportunities()
            .filter((o) => residentSlugs.has(o.residentSlug))
            .sort((a, b) => b.likelyEngagementScore - a.likelyEngagementScore)
            .slice(0, ENGAGEMENT_LIMIT);
    }, [residentSlugs]);

    const risks = useMemo(() => {
        return filterResidentRisks(getResidentRiskRows(), filters)
            .filter((r) => residentSlugs.has(r.residentSlug))
            .slice(0, RISK_LIMIT);
    }, [filters, residentSlugs]);

    const rankedResidents = useMemo(
        () => [...records].sort((a, b) => b.communityScore - a.communityScore),
        [records],
    );

    return {
        executive,
        attention,
        actions,
        engagementOpportunities,
        risks,
        rankedResidents,
        residentCount: records.length,
        allResidentCount: allRecords.length,
    };
}

export type ResidentIntelDashboard = ReturnType<typeof useResidentIntelDashboard>;
