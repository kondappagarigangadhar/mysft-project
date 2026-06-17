'use client';

import { useMemo } from 'react';
import { countLeadsWithDealData } from '@/lib/leadsIntelligenceDealContext';
import { getKpiSummary } from '@/lib/leadsIntelligenceHelpers';
import {
    buildExecutiveSummary,
    getExecutiveAttentionAlerts,
    getLikelyClosures,
    getPriorityActionRows,
    getSalesTeamPerformance,
    getSiteVisitConversionAnalytics,
} from '@/lib/leadsIntelligenceDecisionHelpers';
import type { IntelligenceLead } from '@/lib/leadsIntelligenceStore';

const PRIORITY_LIMIT = 6;
const ALERT_LIMIT = 6;
const HOT_CLOSE_LIMIT = 4;

/** Single memo bundle for the simplified Leads Intelligence command view. */
export function useLeadsIntelDashboard(leads: IntelligenceLead[]) {
    const kpis = useMemo(() => getKpiSummary(leads), [leads]);
    const dealCoverage = useMemo(() => countLeadsWithDealData(leads.map((l) => l.leadSlug)), [leads]);

    const summary = useMemo(
        () => buildExecutiveSummary(leads, kpis, dealCoverage),
        [leads, kpis, dealCoverage],
    );

    const alerts = useMemo(
        () => getExecutiveAttentionAlerts(leads, kpis).slice(0, ALERT_LIMIT),
        [leads, kpis],
    );

    const priorityActions = useMemo(() => getPriorityActionRows(leads, PRIORITY_LIMIT), [leads]);

    const hotClosures = useMemo(() => getLikelyClosures(leads, HOT_CLOSE_LIMIT), [leads]);

    const siteVisitStats = useMemo(() => getSiteVisitConversionAnalytics(leads), [leads]);

    const team = useMemo(() => getSalesTeamPerformance(leads).slice(0, 5), [leads]);

    return {
        kpis,
        summary,
        alerts,
        priorityActions,
        hotClosures,
        siteVisitStats,
        team,
        leadCount: leads.length,
    };
}
