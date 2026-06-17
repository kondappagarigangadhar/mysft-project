'use client';

import { getLeads, getLeadBySlug, type Lead } from '@/lib/leadStore';
import { getDemoTenantId } from '@/lib/ai-sales-intelligence/aiSalesTenant';
import {
    runHybridAISalesPipeline,
    type ExtractedLeadFeatures,
    type HybridAISalesResult,
    type LeadScoreContributions,
    type LeadTemperature,
    type AISalesNextBestAction,
    AI_MODEL_VERSION,
} from '@/lib/ai-sales-intelligence/aiSalesEngine';

const STORAGE_KEY = 'arris-lead-ai-insights-v1';
const CACHE_PREFIX = 'arris-ai-sales-cache-';

export type EngagementTrend = 'rising' | 'stable' | 'declining';
export type FunnelStageKey = 'leads' | 'qualified' | 'site_visit' | 'proposal' | 'negotiation' | 'booking';
export type AIStatus = 'Ready' | 'Updated' | 'Recalculating' | 'Stale';
export type AIRecommendationType =
    | 'Contact Today'
    | 'Schedule Visit'
    | 'Send Proposal'
    | 'Manager Intervention'
    | 'Pricing Review'
    | 'Negotiation Follow-up';

/** Mirrors LeadAIInsights DB table. */
export interface LeadAIInsightsRecord {
    id: string;
    leadId: string;
    tenantId: string;
    leadScore: number;
    conversionProbability: number;
    leadTemperature: LeadTemperature;
    nextBestAction: AISalesNextBestAction;
    nextBestActionReason: string;
    modelVersion: string;
    calculatedAt: string;
    featureRows: LeadFeatureRow[];
    contributions: LeadScoreContributions;
    engagementScore: number;
    predictedRevenueLakhs: number;
    expectedRevenueImpactLakhs: number;
    confidenceScore: number;
    aiStatus: AIStatus;
    pipelineStage: FunnelStageKey;
    daysSinceFollowUp: number;
    responseDelayHours: number;
    hasSiteVisit: boolean;
    engagementTrend: EngagementTrend;
    isStuckInStage: boolean;
    queueRecommendation: AIRecommendationType;
    queuePriority: 'Critical' | 'High' | 'Medium' | 'Low';
    queueExpectedOutcome: string;
    behaviorFlags: string[];
    riskFactors: string[];
    behaviorRecommendation: string;
    leadName: string;
    project: string;
    leadSource: string;
}

/** Mirrors LeadFeatureStore DB rows. */
export interface LeadFeatureRow {
    id: string;
    leadId: string;
    tenantId: string;
    featureName: keyof ExtractedLeadFeatures | string;
    featureValue: string;
    createdDate: string;
    lastUpdated: string;
}

export interface LeadAIInsights {
    behaviorFlags: string[];
    riskFactors: string[];
    behaviorRecommendation: string;
    confidenceScore: number;
}

/** UI alias — score driver bars. */
export type LeadFeatureStore = LeadScoreContributions;

function readStorage(): LeadAIInsightsRecord[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as LeadAIInsightsRecord[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeStorage(rows: LeadAIInsightsRecord[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function cacheKey(leadSlug: string, tenantId: string): string {
    return `${CACHE_PREFIX}${tenantId}:${leadSlug}`;
}

function readCache(leadSlug: string, tenantId: string): LeadAIInsightsRecord | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(cacheKey(leadSlug, tenantId));
        if (!raw) return null;
        return JSON.parse(raw) as LeadAIInsightsRecord;
    } catch {
        return null;
    }
}

function writeCache(record: LeadAIInsightsRecord): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(cacheKey(record.leadId, record.tenantId), JSON.stringify(record));
}

function invalidateCache(leadSlug: string, tenantId: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(cacheKey(leadSlug, tenantId));
}

function parseBudgetLakhs(budgetRange: string): number {
    const nums = budgetRange.match(/[\d.]+/g)?.map(Number) ?? [];
    if (nums.length >= 2) return (nums[0]! + nums[1]!) / 2;
    if (nums.length === 1) return nums[0]!;
    return 45;
}

function mapPipelineStage(lead: Lead): FunnelStageKey {
    if (lead.conversion.conversionStatus === 'Won') return 'booking';
    if (lead.status === 'Lost') return 'leads';
    if (lead.pipeline.leadStage === 'Proposal') return 'negotiation';
    if (lead.pipeline.leadStage === 'Qualified' && lead.siteVisits.some((v) => v.visitStatus === 'Completed')) {
        return 'proposal';
    }
    if (lead.siteVisits.some((v) => v.visitStatus === 'Completed' || v.visitStatus === 'Scheduled')) {
        return 'site_visit';
    }
    if (lead.status === 'Qualified' || lead.pipeline.leadStage === 'Qualified') return 'qualified';
    return 'leads';
}

function mapQueueRecommendation(action: AISalesNextBestAction): AIRecommendationType {
    if (action === 'Schedule Site Visit' || action === 'Arrange Project Tour') return 'Schedule Visit';
    if (action === 'Send Proposal') return 'Send Proposal';
    if (action === 'Escalate Manager Review') return 'Manager Intervention';
    if (action === 'Send Pricing' || action === 'Pricing Review') return 'Pricing Review';
    if (action === 'Send Offer Details' || action === 'Negotiation Follow-up') return 'Negotiation Follow-up';
    return 'Contact Today';
}

function buildExtendedRecord(lead: Lead, hybrid: HybridAISalesResult, tenantId: string): LeadAIInsightsRecord {
    const features = hybrid.features;
    const daysSinceFollowUp = features.DaysSinceLastInteraction;
    const hasSiteVisit = features.SiteVisitCompleted;
    const temp = hybrid.leadTemperature;
    const engagementTrend: EngagementTrend =
        hybrid.engagementScore >= 75 ? 'rising' : hybrid.engagementScore >= 45 ? 'stable' : 'declining';
    const isStuckInStage = daysSinceFollowUp >= 10 && lead.pipeline.leadStage === 'Qualified';

    const behaviorFlags: string[] = [];
    const riskFactors: string[] = [];
    if (daysSinceFollowUp >= 5) behaviorFlags.push('No follow-up in 5+ days');
    if (!hasSiteVisit && temp !== 'Cold') behaviorFlags.push('Site visit not completed');
    if (engagementTrend === 'declining') behaviorFlags.push('Declining engagement signals');
    if (isStuckInStage) behaviorFlags.push('Stuck in current pipeline stage');
    if (temp === 'Cold') riskFactors.push('Low conversion probability band');
    if (daysSinceFollowUp >= 7) riskFactors.push('Extended response gap');
    if (!hasSiteVisit && temp === 'Hot') riskFactors.push('High intent without site visit');

    let behaviorRecommendation = 'Maintain regular cadence and monitor engagement.';
    if (daysSinceFollowUp >= 5) behaviorRecommendation = 'Immediate outreach recommended — follow-up gap detected.';
    else if (!hasSiteVisit && temp === 'Hot') behaviorRecommendation = 'Prioritize site visit scheduling to convert intent.';
    else if (engagementTrend === 'declining') behaviorRecommendation = 'Re-engage with personalized offer or manager touchpoint.';

    const confidenceScore = Math.min(
        97,
        Math.max(58, 62 + (temp === 'Hot' ? 18 : temp === 'Warm' ? 10 : 0) - daysSinceFollowUp * 2),
    );

    const predictedRevenueLakhs = Math.round(parseBudgetLakhs(lead.budgetRange) * 0.85 + hybrid.leadScore * 0.15);
    const expectedRevenueImpactLakhs = Math.round(predictedRevenueLakhs * (hybrid.conversionProbability / 100));

    const queueRecommendation = mapQueueRecommendation(hybrid.nextBestAction);
    const queuePriority: LeadAIInsightsRecord['queuePriority'] =
        temp === 'Hot' && daysSinceFollowUp >= 3 ? 'Critical' : temp === 'Hot' ? 'High' : temp === 'Warm' ? 'Medium' : 'Low';

    const now = hybrid.calculatedAt;
    const featureRows: LeadFeatureRow[] = Object.entries(features).map(([featureName, featureValue], i) => ({
        id: `feat-${lead.slug}-${i}`,
        leadId: lead.slug,
        tenantId,
        featureName,
        featureValue: String(featureValue),
        createdDate: now,
        lastUpdated: now,
    }));

    return {
        id: `ai-${lead.slug}`,
        leadId: lead.slug,
        tenantId,
        leadScore: hybrid.leadScore,
        conversionProbability: hybrid.conversionProbability,
        leadTemperature: hybrid.leadTemperature,
        nextBestAction: hybrid.nextBestAction,
        nextBestActionReason: hybrid.nextBestActionReason,
        modelVersion: hybrid.modelVersion,
        calculatedAt: hybrid.calculatedAt,
        featureRows,
        contributions: hybrid.contributions,
        engagementScore: hybrid.engagementScore,
        predictedRevenueLakhs,
        expectedRevenueImpactLakhs,
        confidenceScore,
        aiStatus: 'Ready',
        pipelineStage: mapPipelineStage(lead),
        daysSinceFollowUp,
        responseDelayHours: features.LeadResponseTime,
        hasSiteVisit,
        engagementTrend,
        isStuckInStage,
        queueRecommendation,
        queuePriority,
        queueExpectedOutcome:
            temp === 'Hot'
                ? `High probability booking — est. ₹${Math.round(expectedRevenueImpactLakhs * 0.5)}L`
                : `Pipeline nurture — est. ₹${Math.round(expectedRevenueImpactLakhs * 0.2)}L`,
        behaviorFlags,
        riskFactors,
        behaviorRecommendation,
        leadName: lead.name,
        project: lead.project,
        leadSource: lead.source,
    };
}

let memoryIndex: LeadAIInsightsRecord[] | null = null;

function getIndex(): LeadAIInsightsRecord[] {
    if (memoryIndex) return memoryIndex;
    memoryIndex = readStorage();
    return memoryIndex;
}

function setIndex(rows: LeadAIInsightsRecord[]): void {
    memoryIndex = rows;
    writeStorage(rows);
}

export function recalculateLeadAIInsights(leadSlug: string, tenantId = getDemoTenantId()): LeadAIInsightsRecord | null {
    const lead = getLeadBySlug(leadSlug);
    if (!lead || lead.deletedAt) return null;

    invalidateCache(leadSlug, tenantId);
    const hybrid = runHybridAISalesPipeline(lead);
    const record = buildExtendedRecord(lead, hybrid, tenantId);

    const rows = getIndex().filter((r) => !(r.leadId === leadSlug && r.tenantId === tenantId));
    rows.push(record);
    setIndex(rows);
    writeCache(record);

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('arris-ai-sales-updated', { detail: { leadSlug, tenantId } }));
    }

    return record;
}

export function getLeadAIInsights(leadSlug: string, tenantId = getDemoTenantId()): LeadAIInsightsRecord | null {
    const cached = readCache(leadSlug, tenantId);
    if (cached) return cached;

    const stored = getIndex().find((r) => r.leadId === leadSlug && r.tenantId === tenantId);
    if (stored) {
        writeCache(stored);
        return stored;
    }
    return recalculateLeadAIInsights(leadSlug, tenantId);
}

export function getAllLeadAIInsights(tenantId = getDemoTenantId()): LeadAIInsightsRecord[] {
    const leads = getLeads().filter((l) => !l.deletedAt);
    const rows = getIndex().filter((r) => r.tenantId === tenantId);
    const bySlug = new Map(rows.map((r) => [r.leadId, r]));

    for (const lead of leads) {
        if (!bySlug.has(lead.slug)) {
            const rec = recalculateLeadAIInsights(lead.slug, tenantId);
            if (rec) bySlug.set(lead.slug, rec);
        }
    }

    return leads
        .map((l) => bySlug.get(l.slug))
        .filter((r): r is LeadAIInsightsRecord => Boolean(r));
}

export function runNightlyAIBatch(tenantId = getDemoTenantId()): number {
    const leads = getLeads().filter((l) => !l.deletedAt);
    let count = 0;
    for (const lead of leads) {
        recalculateLeadAIInsights(lead.slug, tenantId);
        count += 1;
    }
    if (typeof window !== 'undefined') {
        localStorage.setItem('arris-ai-sales-last-batch', new Date().toISOString());
    }
    return count;
}

export function getLastBatchRunAt(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('arris-ai-sales-last-batch');
}

export function toApiInsightsPayload(record: LeadAIInsightsRecord) {
    return {
        LeadScore: record.leadScore,
        ConversionProbability: record.conversionProbability,
        Temperature: record.leadTemperature,
        NextBestAction: record.nextBestAction,
        ModelVersion: record.modelVersion,
        CalculatedAt: record.calculatedAt,
        LeadFeatureStore: record.featureRows,
        LeadAIInsights: {
            behaviorFlags: record.behaviorFlags,
            riskFactors: record.riskFactors,
            behaviorRecommendation: record.behaviorRecommendation,
            confidenceScore: record.confidenceScore,
        },
    };
}

export function seedLeadAIInsightsIfEmpty(tenantId = getDemoTenantId()): void {
    if (getIndex().length > 0) return;
    const leads = getLeads().filter((l) => !l.deletedAt);
    for (const lead of leads) {
        recalculateLeadAIInsights(lead.slug, tenantId);
    }
}
