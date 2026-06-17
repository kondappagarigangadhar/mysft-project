'use client';

import {
    getAllLeadAIInsights,
    getLeadAIInsights,
    type LeadAIInsightsRecord,
    type LeadFeatureStore,
} from '@/lib/ai-sales-intelligence/aiInsightsRepository';
import { seedLeadAIInsightsIfEmpty } from '@/lib/ai-sales-intelligence/aiInsightsRepository';
import type { AISalesNextBestAction, LeadTemperature } from '@/lib/ai-sales-intelligence/aiSalesEngine';
import type {
    AIRecommendationType,
    AIStatus,
    EngagementTrend,
    FunnelStageKey,
} from '@/lib/ai-sales-intelligence/aiInsightsRepository';

export type {
    LeadTemperature,
    AISalesNextBestAction,
    AIRecommendationType,
    AIStatus,
    EngagementTrend,
    FunnelStageKey,
};

export interface LeadAIInsights {
    behaviorFlags: string[];
    riskFactors: string[];
    behaviorRecommendation: string;
    confidenceScore: number;
}

export type { LeadFeatureStore };

export interface AISalesIntelligenceLead {
    id: string;
    leadSlug: string;
    name: string;
    project: string;
    leadSource: string;
    leadScore: number;
    conversionProbability: number;
    leadTemperature: LeadTemperature;
    predictedRevenueLakhs: number;
    nextBestAction: AISalesNextBestAction;
    nextBestActionReason: string;
    expectedRevenueImpactLakhs: number;
    confidenceScore: number;
    aiStatus: AIStatus;
    modelVersion: string;
    calculatedAt: string;
    featureStore: LeadFeatureStore;
    insights: LeadAIInsights;
    pipelineStage: FunnelStageKey;
    daysSinceFollowUp: number;
    responseDelayHours: number;
    hasSiteVisit: boolean;
    engagementTrend: EngagementTrend;
    isStuckInStage: boolean;
    queueRecommendation: AIRecommendationType;
    queuePriority: 'Critical' | 'High' | 'Medium' | 'Low';
    queueExpectedOutcome: string;
    featureRows: LeadAIInsightsRecord['featureRows'];
}

function mapRecord(record: LeadAIInsightsRecord): AISalesIntelligenceLead {
    return {
        id: record.id,
        leadSlug: record.leadId,
        name: record.leadName,
        project: record.project,
        leadSource: record.leadSource,
        leadScore: record.leadScore,
        conversionProbability: record.conversionProbability,
        leadTemperature: record.leadTemperature,
        predictedRevenueLakhs: record.predictedRevenueLakhs,
        nextBestAction: record.nextBestAction,
        nextBestActionReason: record.nextBestActionReason,
        expectedRevenueImpactLakhs: record.expectedRevenueImpactLakhs,
        confidenceScore: record.confidenceScore,
        aiStatus: record.aiStatus,
        modelVersion: record.modelVersion,
        calculatedAt: record.calculatedAt,
        featureStore: record.contributions,
        insights: {
            behaviorFlags: record.behaviorFlags,
            riskFactors: record.riskFactors,
            behaviorRecommendation: record.behaviorRecommendation,
            confidenceScore: record.confidenceScore,
        },
        pipelineStage: record.pipelineStage,
        daysSinceFollowUp: record.daysSinceFollowUp,
        responseDelayHours: record.responseDelayHours,
        hasSiteVisit: record.hasSiteVisit,
        engagementTrend: record.engagementTrend,
        isStuckInStage: record.isStuckInStage,
        queueRecommendation: record.queueRecommendation,
        queuePriority: record.queuePriority,
        queueExpectedOutcome: record.queueExpectedOutcome,
        featureRows: record.featureRows,
    };
}

export function getAISalesIntelligenceLeads(): AISalesIntelligenceLead[] {
    if (typeof window !== 'undefined') {
        seedLeadAIInsightsIfEmpty();
    }
    return getAllLeadAIInsights()
        .filter((r) => r.leadTemperature !== undefined)
        .map(mapRecord);
}

export function getAISalesIntelligenceLeadBySlug(slug: string): AISalesIntelligenceLead | undefined {
    const record = getLeadAIInsights(slug);
    return record ? mapRecord(record) : undefined;
}

export function refreshAISalesIntelligenceLeads(): AISalesIntelligenceLead[] {
    return getAISalesIntelligenceLeads();
}
