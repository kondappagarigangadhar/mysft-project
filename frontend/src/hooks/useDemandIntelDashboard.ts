'use client';

import { useMemo } from 'react';
import {
    filterDemandProjects,
    filterInventoryRisks,
    type DemandIntelFilters,
} from '@/lib/demandIntelligenceHelpers';
import {
    getDemandAttentionItems,
    getDemandExecutiveKpis,
    getDemandInventoryRisks,
    getDemandPricingRows,
    getDemandProjects,
    getDemandRecommendedActions,
    type DemandPricingRow,
    type DemandProjectRecord,
    type DemandRecommendedAction,
} from '@/lib/demandIntelligenceStore';

const ATTENTION_LIMIT = 8;
const REVENUE_OPP_LIMIT = 6;
const INVENTORY_LIMIT = 12;
const ACTIONS_LIMIT = 8;

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 } as const;

function pricingRowToAction(row: DemandPricingRow): DemandRecommendedAction {
    return {
        id: `pricing-${row.id}`,
        title: `Increase ${row.project} pricing by ${row.increasePct}%`,
        projectSlug: row.projectSlug,
        expectedRevenueLakhs: row.revenueGainLakhs,
        priority: row.confidence >= 85 ? 'High' : row.confidence >= 75 ? 'Medium' : 'Low',
        confidence: row.confidence,
    };
}

function mergeRecommendedActions(
    projects: DemandProjectRecord[],
    limit: number,
): DemandRecommendedAction[] {
    const slugs = new Set(projects.map((p) => p.slug));
    const pricingSlugs = new Set(
        getDemandPricingRows()
            .filter((r) => slugs.has(r.projectSlug) && r.increasePct > 0)
            .map((r) => r.projectSlug),
    );

    const pricingActions = getDemandPricingRows()
        .filter((r) => slugs.has(r.projectSlug) && r.increasePct > 0)
        .map(pricingRowToAction);

    const otherActions = getDemandRecommendedActions().filter(
        (a) =>
            slugs.has(a.projectSlug) &&
            (!/pricing|price/i.test(a.title) || !pricingSlugs.has(a.projectSlug)),
    );

    return [...pricingActions, ...otherActions]
        .sort((a, b) => {
            const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
            if (p !== 0) return p;
            return b.expectedRevenueLakhs - a.expectedRevenueLakhs;
        })
        .slice(0, limit);
}

export function useDemandIntelDashboard(filters: DemandIntelFilters) {
    const allProjects = useMemo(() => getDemandProjects(), []);
    const projects = useMemo(() => filterDemandProjects(allProjects, filters), [allProjects, filters]);
    const inventoryRisks = useMemo(
        () => filterInventoryRisks(getDemandInventoryRisks(), filters).slice(0, INVENTORY_LIMIT),
        [filters],
    );

    const executive = useMemo(() => getDemandExecutiveKpis(), []);

    const attention = useMemo(() => {
        const projectNames = new Set(projects.map((p) => p.name));
        const items = getDemandAttentionItems().filter((a) => projectNames.has(a.project));
        return items.slice(0, ATTENTION_LIMIT);
    }, [projects]);

    const revenueOpportunities = useMemo(
        () =>
            [...projects]
                .filter((p) => p.likelyClosures > 0)
                .sort((a, b) => b.potentialRevenueLakhs - a.potentialRevenueLakhs)
                .slice(0, REVENUE_OPP_LIMIT),
        [projects],
    );

    const rankedProjects = useMemo(
        () => [...projects].sort((a, b) => b.demandScore - a.demandScore),
        [projects],
    );

    const actions = useMemo(() => mergeRecommendedActions(projects, ACTIONS_LIMIT), [projects]);

    return {
        executive,
        attention,
        revenueOpportunities,
        inventoryRisks,
        rankedProjects,
        actions,
        projectCount: projects.length,
        allProjectCount: allProjects.length,
    };
}

export type DemandIntelDashboard = ReturnType<typeof useDemandIntelDashboard>;
export type { DemandProjectRecord };
