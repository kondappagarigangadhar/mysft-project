/**
 * Hybrid AI Sales Intelligence — MVP engine (rule-based scoring + statistical prediction).
 * Upgrade path: swap scoring/prediction functions with ML endpoints (Azure ML).
 */
import type { Lead, LeadSiteVisit, LeadSource } from '@/lib/leadStore';

export const AI_MODEL_VERSION = 'ARRIS-LeadAI-MVP-1.0.0';

/** MVP weighted scoring — Source 25%, Budget 25%, Site Visit 30%, Engagement 20% */
export const SCORE_WEIGHTS = {
    leadSource: 0.25,
    budgetFit: 0.25,
    siteVisit: 0.3,
    engagement: 0.2,
} as const;

export type LeadTemperature = 'Hot' | 'Warm' | 'Cold';

export type AISalesNextBestAction =
    | 'Schedule Site Visit'
    | 'Call Lead'
    | 'Send Pricing'
    | 'Send Offer Details'
    | 'Arrange Project Tour'
    | 'Escalate Manager Review'
    | 'Send Proposal'
    | 'Pricing Review'
    | 'Negotiation Follow-up';

/** Raw feature vector (maps to LeadFeatureStore DB rows). */
export interface ExtractedLeadFeatures {
    LeadSource: string;
    BudgetRange: string;
    PropertyType: string;
    ProjectInterest: string;
    FollowUpCount: number;
    SiteVisitCompleted: boolean;
    DaysSinceLastInteraction: number;
    BrokerInvolved: boolean;
    LeadResponseTime: number;
}

/** Weighted score driver contributions for UI (0–100 per component before weighting). */
export interface LeadScoreContributions {
    leadSourceContribution: number;
    budgetMatchContribution: number;
    siteVisitContribution: number;
    engagementContribution: number;
}

export interface HybridAISalesResult {
    leadScore: number;
    conversionProbability: number;
    leadTemperature: LeadTemperature;
    nextBestAction: AISalesNextBestAction;
    nextBestActionReason: string;
    engagementScore: number;
    features: ExtractedLeadFeatures;
    contributions: LeadScoreContributions;
    modelVersion: string;
    calculatedAt: string;
}

const SOURCE_SCORES: Record<LeadSource, number> = {
    Referral: 92,
    'Walk-in': 85,
    Website: 78,
    Broker: 72,
    'Google Ads': 65,
    'Facebook Ads': 60,
};

function parseBudgetMidLakhs(budgetRange: string): number {
    const nums = budgetRange.match(/[\d.]+/g)?.map(Number) ?? [];
    if (nums.length >= 2) return (nums[0]! + nums[1]!) / 2;
    if (nums.length === 1) return nums[0]!;
    return 50;
}

function daysSince(isoOrYmd: string): number {
    const d = new Date(isoOrYmd);
    if (Number.isNaN(d.getTime())) return 30;
    return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

function lastInteractionDate(lead: Lead): string {
    const dates: string[] = [lead.updatedAt, lead.createdAt, lead.createdDate];
    for (const fu of lead.followUps) dates.push(fu.followUpDate);
    for (const sv of lead.siteVisits) dates.push(sv.visitDate);
    for (const a of lead.activityLog) dates.push(a.at);
    const sorted = dates
        .map((d) => new Date(d))
        .filter((d) => !Number.isNaN(d.getTime()))
        .sort((a, b) => b.getTime() - a.getTime());
    return sorted[0]?.toISOString() ?? lead.createdAt;
}

export function extractLeadFeatures(lead: Lead): ExtractedLeadFeatures {
    const siteVisitCompleted = lead.siteVisits.some((v) => v.visitStatus === 'Completed');
    const lastAt = lastInteractionDate(lead);
    return {
        LeadSource: lead.source,
        BudgetRange: lead.budgetRange || '—',
        PropertyType: lead.preferredUnitType,
        ProjectInterest: lead.project || '—',
        FollowUpCount: lead.followUps.length,
        SiteVisitCompleted: siteVisitCompleted,
        DaysSinceLastInteraction: daysSince(lastAt),
        BrokerInvolved: Boolean(lead.brokerAgent?.trim() || lead.broker?.brokerName?.trim()),
        LeadResponseTime: Math.min(72, lead.followUps.length > 0 ? 12 : 36),
    };
}

function scoreLeadSource(source: LeadSource): number {
    return SOURCE_SCORES[source] ?? 65;
}

function scoreBudgetFit(budgetRange: string, project: string): number {
    const mid = parseBudgetMidLakhs(budgetRange);
    let score = 55;
    if (mid >= 80) score = 88;
    else if (mid >= 50) score = 78;
    else if (mid >= 30) score = 68;
    else score = 52;
    if (project?.trim()) score = Math.min(100, score + 8);
    return score;
}

function scoreSiteVisit(visits: LeadSiteVisit[]): number {
    if (visits.some((v) => v.visitStatus === 'Completed')) return 100;
    if (visits.some((v) => v.visitStatus === 'Scheduled')) return 60;
    return 0;
}

function scoreEngagement(lead: Lead, daysSinceInteraction: number): number {
    const followUpPts = Math.min(40, lead.followUps.length * 10);
    const activityPts = Math.min(25, lead.activityLog.length * 5);
    const recencyPts = daysSinceInteraction <= 2 ? 25 : daysSinceInteraction <= 7 ? 15 : daysSinceInteraction <= 14 ? 8 : 0;
    const threadPts = Math.min(10, lead.threadNotes.length * 3);
    return Math.min(100, followUpPts + activityPts + recencyPts + threadPts);
}

export function calculateLeadScore(contributions: LeadScoreContributions): number {
    const weighted =
        contributions.leadSourceContribution * SCORE_WEIGHTS.leadSource +
        contributions.budgetMatchContribution * SCORE_WEIGHTS.budgetFit +
        contributions.siteVisitContribution * SCORE_WEIGHTS.siteVisit +
        contributions.engagementContribution * SCORE_WEIGHTS.engagement;
    return Math.min(100, Math.max(0, Math.round(weighted)));
}

/** MVP: ConversionProbability = (LeadScore × 0.6) + (EngagementScore × 0.4), normalized 0–100 */
export function calculateConversionProbability(leadScore: number, engagementScore: number): number {
    const raw = leadScore * 0.6 + engagementScore * 0.4;
    return Math.min(100, Math.max(0, Math.round(raw)));
}

export function classifyLeadTemperature(leadScore: number): LeadTemperature {
    if (leadScore > 75) return 'Hot';
    if (leadScore >= 40) return 'Warm';
    return 'Cold';
}

function isNegotiationStage(lead: Lead): boolean {
    return lead.pipeline.leadStage === 'Proposal' || lead.kanbanColumn === 'proposal';
}

export function determineNextBestAction(
    lead: Lead,
    leadScore: number,
    features: ExtractedLeadFeatures,
): { action: AISalesNextBestAction; reason: string } {
    if (isNegotiationStage(lead)) {
        return {
            action: 'Send Offer Details',
            reason: 'Lead is in negotiation — share formal offer and payment milestones.',
        };
    }
    if (leadScore > 70 && !features.SiteVisitCompleted) {
        return {
            action: 'Schedule Site Visit',
            reason: 'High score without completed site visit — visit is the primary conversion driver.',
        };
    }
    if (features.DaysSinceLastInteraction > 3) {
        return {
            action: 'Call Lead',
            reason: `No interaction in ${features.DaysSinceLastInteraction} days — immediate call recommended.`,
        };
    }
    if (lead.pipeline.leadStage === 'Qualified' && features.SiteVisitCompleted) {
        return {
            action: 'Send Proposal',
            reason: 'Qualified lead with site visit done — move to proposal stage.',
        };
    }
    if (features.BrokerInvolved && leadScore >= 60) {
        return {
            action: 'Arrange Project Tour',
            reason: 'Broker-involved lead — coordinate joint tour for faster decision.',
        };
    }
    if (leadScore < 45) {
        return {
            action: 'Send Pricing',
            reason: 'Lower intent band — validate budget with pricing sheet before deeper investment.',
        };
    }
    return {
        action: 'Call Lead',
        reason: 'Maintain engagement cadence and confirm next milestone.',
    };
}

export function runHybridAISalesPipeline(lead: Lead): HybridAISalesResult {
    const features = extractLeadFeatures(lead);
    const contributions: LeadScoreContributions = {
        leadSourceContribution: scoreLeadSource(lead.source),
        budgetMatchContribution: scoreBudgetFit(lead.budgetRange, lead.project),
        siteVisitContribution: scoreSiteVisit(lead.siteVisits),
        engagementContribution: scoreEngagement(lead, features.DaysSinceLastInteraction),
    };

    let leadScore = calculateLeadScore(contributions);
    if (features.SiteVisitCompleted) {
        leadScore = Math.min(100, leadScore + 5);
    }

    const engagementScore = contributions.engagementContribution;
    const conversionProbability = calculateConversionProbability(leadScore, engagementScore);
    const leadTemperature = classifyLeadTemperature(leadScore);
    const { action, reason } = determineNextBestAction(lead, leadScore, features);

    return {
        leadScore,
        conversionProbability,
        leadTemperature,
        nextBestAction: action,
        nextBestActionReason: reason,
        engagementScore,
        features,
        contributions,
        modelVersion: AI_MODEL_VERSION,
        calculatedAt: new Date().toISOString(),
    };
}
