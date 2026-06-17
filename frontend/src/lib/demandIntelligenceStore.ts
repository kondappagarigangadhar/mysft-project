/**
 * Mock demand & inventory intelligence — aligned with demo project names where possible.
 */

import { getProjects } from '@/lib/projectsInventoryStore';

export type DemandRiskLevel = 'High' | 'Medium' | 'Low';
export type DemandVelocity = 'High' | 'Medium' | 'Low';
export type DemandMarketTrend = 'Rising' | 'Stable' | 'Declining';
export type DemandUnitType = '2 BHK' | '3 BHK' | '4 BHK' | 'Villa' | 'Commercial';
export type DemandActionPriority = 'High' | 'Medium' | 'Low';
export type DemandAttentionKind = 'inventory_aging' | 'demand_falling' | 'pricing_opportunity' | 'inventory_risk';

export interface DemandProjectRecord {
    id: string;
    name: string;
    slug: string;
    location: string;
    demandScore: number;
    availableUnits: number;
    bookedUnits: number;
    bookingVelocity: DemandVelocity;
    leadInterest: number;
    marketTrend: DemandMarketTrend;
    pricingOpportunityPct: number;
    riskLevel: DemandRiskLevel;
    aiRecommendation: string;
    likelyClosures: number;
    potentialRevenueLakhs: number;
}

export interface DemandInventoryRiskRow {
    id: string;
    project: string;
    projectSlug: string;
    unit: string;
    unitSlug: string;
    inventoryType: string;
    daysUnsold: number;
    riskLevel: DemandRiskLevel;
    recommendedAction: string;
}

export interface DemandUnitTypeMetric {
    unitType: DemandUnitType;
    demandPct: number;
    conversionPct: number;
    salesVelocity: DemandVelocity;
}

export interface DemandPricingRow {
    id: string;
    project: string;
    projectSlug: string;
    currentPriceLakhs: number;
    recommendedPriceLakhs: number;
    increasePct: number;
    revenueGainLakhs: number;
    confidence: number;
    reason: string;
}

export interface DemandRecommendedAction {
    id: string;
    title: string;
    projectSlug: string;
    expectedRevenueLakhs: number;
    priority: DemandActionPriority;
    confidence: number;
}

export interface DemandAttentionItem {
    id: string;
    kind: DemandAttentionKind;
    headline: string;
    project: string;
    projectSlug: string;
    unitSlug?: string;
    detail: string;
    metricLabel?: string;
    metricValue?: string;
    recommendedAction: string;
    severity: 'critical' | 'warning';
}

export interface DemandForecastPeriod {
    id: 'week' | 'month' | 'next_month';
    label: string;
    expectedBookings: number;
    expectedRevenueLakhs: number;
    expectedDemandScore: number;
    inventoryConsumption: number;
}

export interface DemandExecutiveKpis {
    forecastRevenueLakhs: number;
    demandScore: number;
    revenueOpportunityLakhs: number;
    inventoryRiskUnits: number;
    projectsRequiringAttention: number;
    pricingOpportunities: number;
    narrative: string;
}

const PROJECTS: DemandProjectRecord[] = [
    {
        id: 'p1',
        name: 'Skyline Residency',
        slug: 'skyline-residency',
        location: 'Mumbai',
        demandScore: 95,
        availableUnits: 48,
        bookedUnits: 122,
        bookingVelocity: 'High',
        leadInterest: 92,
        marketTrend: 'Rising',
        pricingOpportunityPct: 5,
        riskLevel: 'Low',
        aiRecommendation: 'Increase Pricing',
        likelyClosures: 8,
        potentialRevenueLakhs: 180,
    },
    {
        id: 'p2',
        name: 'Urban Flux Apartments',
        slug: 'urban-flux-apartments',
        location: 'Pune',
        demandScore: 89,
        availableUnits: 34,
        bookedUnits: 86,
        bookingVelocity: 'High',
        leadInterest: 84,
        marketTrend: 'Rising',
        pricingOpportunityPct: 3,
        riskLevel: 'Low',
        aiRecommendation: 'Maintain momentum',
        likelyClosures: 5,
        potentialRevenueLakhs: 120,
    },
    {
        id: 'p3',
        name: 'Summit Woods',
        slug: 'summit-woods',
        location: 'Hyderabad',
        demandScore: 61,
        availableUnits: 76,
        bookedUnits: 28,
        bookingVelocity: 'Low',
        leadInterest: 48,
        marketTrend: 'Declining',
        pricingOpportunityPct: 0,
        riskLevel: 'High',
        aiRecommendation: 'Generate Demand',
        likelyClosures: 2,
        potentialRevenueLakhs: 45,
    },
];

const INVENTORY_RISKS: DemandInventoryRiskRow[] = [
    {
        id: 'ir1',
        project: 'Skyline Residency',
        projectSlug: 'skyline-residency',
        unit: 'Tower B — 102',
        unitSlug: 'skyline-residency--102',
        inventoryType: '2 BHK',
        daysUnsold: 95,
        riskLevel: 'High',
        recommendedAction: 'Offer Discount',
    },
    {
        id: 'ir2',
        project: 'Urban Flux Apartments',
        projectSlug: 'urban-flux-apartments',
        unit: '103',
        unitSlug: 'urban-flux-apartments--103',
        inventoryType: '3 BHK',
        daysUnsold: 83,
        riskLevel: 'Medium',
        recommendedAction: 'Run Campaign',
    },
    {
        id: 'ir3',
        project: 'Skyline Residency',
        projectSlug: 'skyline-residency',
        unit: 'Tower B — 101',
        unitSlug: 'skyline-residency--101',
        inventoryType: '2 BHK',
        daysUnsold: 91,
        riskLevel: 'High',
        recommendedAction: 'Offer Discount',
    },
    {
        id: 'ir4',
        project: 'Summit Woods',
        projectSlug: 'summit-woods',
        unit: '103',
        unitSlug: 'summit-woods--103',
        inventoryType: '2 BHK',
        daysUnsold: 78,
        riskLevel: 'Medium',
        recommendedAction: 'Bundle with amenities',
    },
    {
        id: 'ir5',
        project: 'Skyline Residency',
        projectSlug: 'skyline-residency',
        unit: '103',
        unitSlug: 'skyline-residency--103',
        inventoryType: '3 BHK',
        daysUnsold: 72,
        riskLevel: 'Medium',
        recommendedAction: 'Premium outreach',
    },
];

const UNIT_TYPES: DemandUnitTypeMetric[] = [
    { unitType: '2 BHK', demandPct: 92, conversionPct: 38, salesVelocity: 'High' },
    { unitType: '3 BHK', demandPct: 78, conversionPct: 32, salesVelocity: 'High' },
    { unitType: '4 BHK', demandPct: 64, conversionPct: 24, salesVelocity: 'Medium' },
    { unitType: 'Villa', demandPct: 45, conversionPct: 18, salesVelocity: 'Low' },
    { unitType: 'Commercial', demandPct: 52, conversionPct: 21, salesVelocity: 'Medium' },
];

const PRICING: DemandPricingRow[] = [
    {
        id: 'pr1',
        project: 'Skyline Residency',
        projectSlug: 'skyline-residency',
        currentPriceLakhs: 58,
        recommendedPriceLakhs: 61,
        increasePct: 5,
        revenueGainLakhs: 42,
        confidence: 91,
        reason: 'Strong demand and low inventory',
    },
    {
        id: 'pr2',
        project: 'Urban Flux Apartments',
        projectSlug: 'urban-flux-apartments',
        currentPriceLakhs: 52,
        recommendedPriceLakhs: 54,
        increasePct: 4,
        revenueGainLakhs: 28,
        confidence: 86,
        reason: 'High lead interest vs available stock',
    },
    {
        id: 'pr3',
        project: 'Summit Woods',
        projectSlug: 'summit-woods',
        currentPriceLakhs: 48,
        recommendedPriceLakhs: 48,
        increasePct: 0,
        revenueGainLakhs: 0,
        confidence: 72,
        reason: 'Hold — rebuild demand before any price change',
    },
];

const ACTIONS: DemandRecommendedAction[] = [
    {
        id: 'a1',
        title: 'Increase Skyline Residency pricing by 5%',
        projectSlug: 'skyline-residency',
        expectedRevenueLakhs: 42,
        priority: 'High',
        confidence: 91,
    },
    {
        id: 'a2',
        title: 'Launch campaign for Summit Woods',
        projectSlug: 'summit-woods',
        expectedRevenueLakhs: 18,
        priority: 'Medium',
        confidence: 84,
    },
    {
        id: 'a3',
        title: 'Push 2 BHK inventory promotion',
        projectSlug: 'skyline-residency',
        expectedRevenueLakhs: 26,
        priority: 'High',
        confidence: 88,
    },
    {
        id: 'a4',
        title: 'Discount bundle for Tower B aging units',
        projectSlug: 'skyline-residency',
        expectedRevenueLakhs: 14,
        priority: 'High',
        confidence: 79,
    },
];

const ATTENTION: DemandAttentionItem[] = [
    {
        id: 'at1',
        kind: 'inventory_aging',
        headline: 'High Inventory Aging',
        project: 'Skyline Residency',
        projectSlug: 'skyline-residency',
        unitSlug: 'skyline-residency--102',
        detail: 'Tower B units sitting unsold beyond 90 days',
        metricLabel: 'Units',
        metricValue: '12',
        recommendedAction: 'Launch discount campaign',
        severity: 'critical',
    },
    {
        id: 'at2',
        kind: 'demand_falling',
        headline: 'Demand Falling',
        project: 'Summit Woods',
        projectSlug: 'summit-woods',
        detail: 'Week-over-week interest decline',
        metricLabel: 'Demand drop',
        metricValue: '14%',
        recommendedAction: 'Review project overview & campaigns',
        severity: 'critical',
    },
    {
        id: 'at3',
        kind: 'pricing_opportunity',
        headline: 'Pricing Opportunity',
        project: 'Skyline Residency',
        projectSlug: 'skyline-residency',
        detail: 'Low stock with sustained buyer interest',
        recommendedAction: 'Increase pricing by 5%',
        severity: 'warning',
    },
    {
        id: 'at4',
        kind: 'inventory_risk',
        headline: 'Dead stock risk',
        project: 'Urban Flux Apartments',
        projectSlug: 'urban-flux-apartments',
        unitSlug: 'urban-flux-apartments--103',
        detail: 'Unit aging past 80 days',
        metricLabel: 'Days unsold',
        metricValue: '83',
        recommendedAction: 'Run campaign',
        severity: 'warning',
    },
];

const FORECASTS: DemandForecastPeriod[] = [
    {
        id: 'week',
        label: 'This Week',
        expectedBookings: 12,
        expectedRevenueLakhs: 210,
        expectedDemandScore: 88,
        inventoryConsumption: 10,
    },
    {
        id: 'month',
        label: 'This Month',
        expectedBookings: 46,
        expectedRevenueLakhs: 820,
        expectedDemandScore: 91,
        inventoryConsumption: 38,
    },
    {
        id: 'next_month',
        label: 'Next Month',
        expectedBookings: 52,
        expectedRevenueLakhs: 910,
        expectedDemandScore: 89,
        inventoryConsumption: 44,
    },
];

const EXECUTIVE: DemandExecutiveKpis = {
    forecastRevenueLakhs: 820,
    demandScore: 91,
    revenueOpportunityLakhs: 140,
    inventoryRiskUnits: 12,
    projectsRequiringAttention: 3,
    pricingOpportunities: 5,
    narrative:
        'Demand remains strong in Skyline Residency. 12 Tower B units are aging and require intervention. Summit Woods shows declining demand. Expected bookings this month: 46 units.',
};

function existingProjectSlugs(): Set<string> {
    return new Set(getProjects().map((p) => p.slug));
}

export function getDemandProjects(): DemandProjectRecord[] {
    const slugs = existingProjectSlugs();
    return PROJECTS.filter((p) => slugs.has(p.slug)).map((p) => ({ ...p }));
}

export function getDemandInventoryRisks(): DemandInventoryRiskRow[] {
    const slugs = existingProjectSlugs();
    return INVENTORY_RISKS.filter((r) => slugs.has(r.projectSlug)).map((r) => ({ ...r }));
}

export function getDemandUnitTypeMetrics(): DemandUnitTypeMetric[] {
    return UNIT_TYPES.map((u) => ({ ...u }));
}

export function getDemandPricingRows(): DemandPricingRow[] {
    const slugs = existingProjectSlugs();
    return PRICING.filter((p) => slugs.has(p.projectSlug)).map((p) => ({ ...p }));
}

export function getDemandRecommendedActions(): DemandRecommendedAction[] {
    const slugs = existingProjectSlugs();
    return ACTIONS.filter((a) => slugs.has(a.projectSlug)).map((a) => ({ ...a }));
}

export function getDemandAttentionItems(): DemandAttentionItem[] {
    const slugs = existingProjectSlugs();
    return ATTENTION.filter((a) => slugs.has(a.projectSlug)).map((a) => ({ ...a }));
}

export function getDemandForecasts(): DemandForecastPeriod[] {
    return FORECASTS.map((f) => ({ ...f }));
}

export function getDemandExecutiveKpis(): DemandExecutiveKpis {
    return { ...EXECUTIVE };
}

export const DEMAND_PROJECT_OPTIONS = getDemandProjects().map((p) => p.name);
export const DEMAND_LOCATION_OPTIONS = Array.from(new Set(PROJECTS.map((p) => p.location)));
export const DEMAND_UNIT_TYPE_OPTIONS: DemandUnitType[] = ['2 BHK', '3 BHK', '4 BHK', 'Villa', 'Commercial'];
export const DEMAND_INVENTORY_TYPE_OPTIONS = ['Apartment', 'Villa', 'Commercial', 'Plot'];
