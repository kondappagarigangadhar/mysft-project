import { getProjects, getProjectInventoryUnitHref } from '@/lib/projectsInventoryStore';
import type { DemandAttentionKind } from './demandIntelligenceStore';

export type DemandProjectTab = 'overview' | 'inventory' | 'pricing';

export const DEMAND_SECTION_IDS = {
    attention: 'demand-attention',
    revenue: 'demand-revenue',
    inventoryRisk: 'demand-inventory-risk',
    ranking: 'demand-ranking',
    actions: 'demand-actions',
    projectsTable: 'demand-projects-table',
} as const;

export function demandProjectExists(projectSlug: string): boolean {
    return getProjects().some((p) => p.slug === projectSlug);
}

/** Project record in inventory — only returns href when the project exists. */
export function getDemandProjectHref(
    projectSlug: string,
    tab: DemandProjectTab = 'overview',
): string | null {
    if (!demandProjectExists(projectSlug)) return null;
    return `/projects-inventory/projects/view/${encodeURIComponent(projectSlug)}?tab=${tab}`;
}

export function getDemandUnitHref(projectSlug: string, unitSlug: string): string | null {
    if (!demandProjectExists(projectSlug)) return null;
    return getProjectInventoryUnitHref(projectSlug, unitSlug);
}

export function getDemandInventoryListHref(): string {
    return '/projects-inventory/inventory';
}

export function getDemandTabForRecommendation(recommendation: string): DemandProjectTab {
    const lower = recommendation.toLowerCase();
    if (lower.includes('pricing') || lower.includes('price')) return 'pricing';
    if (lower.includes('discount') || lower.includes('inventory') || lower.includes('campaign') || lower.includes('promotion')) {
        return 'inventory';
    }
    return 'overview';
}

export function getDemandAttentionHref(
    projectSlug: string,
    kind: DemandAttentionKind,
    unitSlug?: string,
): string | null {
    if (unitSlug) {
        const unitHref = getDemandUnitHref(projectSlug, unitSlug);
        if (unitHref) return unitHref;
    }
    switch (kind) {
        case 'pricing_opportunity':
            return getDemandProjectHref(projectSlug, 'pricing');
        case 'inventory_aging':
        case 'inventory_risk':
            return getDemandProjectHref(projectSlug, 'inventory');
        case 'demand_falling':
            return getDemandProjectHref(projectSlug, 'overview');
        default:
            return getDemandProjectHref(projectSlug, 'overview');
    }
}

export function getDemandActionHref(projectSlug: string, title: string): string | null {
    const lower = title.toLowerCase();
    if (lower.includes('pricing') || lower.includes('price')) {
        return getDemandProjectHref(projectSlug, 'pricing');
    }
    if (lower.includes('inventory') || lower.includes('discount') || lower.includes('campaign') || lower.includes('promotion') || lower.includes('2 bhk')) {
        return getDemandProjectHref(projectSlug, 'inventory');
    }
    return getDemandProjectHref(projectSlug, 'overview');
}
