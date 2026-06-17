import type { AISalesIntelligenceLead } from '@/lib/aiSalesIntelligenceStore';
import {
    computeBehaviorAnalysis,
    computeConversionFunnel,
    computeOpportunityPrioritization,
    type AISalesFunnelStep,
    type AISalesOpportunityRow,
} from '@/lib/aiSalesIntelligenceHelpers';
import { getLeadDealContext } from '@/lib/leadsIntelligenceDealContext';
import {
    daysSinceActivity,
    formatRevenueLakhs,
    getConversionConfidence,
    getKpiSummary,
    getLeadRevenuePotentialLakhs,
    getRecommendedActionLabel,
    getRiskReason,
    getLastActivityDate,
    type RecommendedActionLabel,
} from '@/lib/leadsIntelligenceHelpers';
import {
    getAiActionRowsWithMeta,
    getPipelineHealthScore,
    getPriorityActionProblem,
    getSalesTeamPerformance,
    type SalesRepPerformance,
} from '@/lib/leadsIntelligenceDecisionHelpers';
import type { IntelligenceLead } from '@/lib/leadsIntelligenceStore';

export function formatRevenueDisplay(lakhs: number): string {
    if (lakhs <= 0) return '₹0';
    if (lakhs >= 100) return `₹${(lakhs / 100).toFixed(1)} Cr`;
    return formatRevenueLakhs(lakhs);
}

export type RevenueSummaryPayload = {
    forecastRevenueLakhs: number;
    revenueAtRiskLakhs: number;
    expectedClosures: number;
    hotOpportunities: number;
    pipelineHealth: number;
    salesProductivity: number;
    narrative: string;
};

export function buildRevenueSummary(leads: IntelligenceLead[]): RevenueSummaryPayload {
    const kpis = getKpiSummary(leads);
    const pipelineHealth = getPipelineHealthScore(leads);
    const highProb = leads.filter(
        (l) => l.conversionProbability >= 70 && l.status !== 'Converted' && l.status !== 'Lost',
    ).length;

    const forecastCr = formatRevenueDisplay(kpis.forecastRevenueLakhs);
    const riskDisplay = formatRevenueDisplay(kpis.revenueAtRiskLakhs);

    return {
        forecastRevenueLakhs: kpis.forecastRevenueLakhs,
        revenueAtRiskLakhs: kpis.revenueAtRiskLakhs,
        expectedClosures: kpis.expectedBookings,
        hotOpportunities: kpis.hotLeadsRequiringAction,
        pipelineHealth,
        salesProductivity: kpis.salesProductivityScore,
        narrative: `${forecastCr} forecasted revenue. ${riskDisplay} at risk. ${highProb} high probability opportunit${highProb === 1 ? 'y' : 'ies'} require action today.`,
    };
}

export type RevenueRiskRow = {
    id: string;
    leadName: string;
    leadSlug: string;
    riskReason: string;
    revenueImpactLakhs: number;
    daysInactive: number;
    suggestedAction: RecommendedActionLabel | string;
};

function activePipeline(leads: IntelligenceLead[]): IntelligenceLead[] {
    return leads.filter((l) => l.status !== 'Converted' && l.status !== 'Lost');
}

export function buildRevenueRiskRows(
    intelLeads: IntelligenceLead[],
    aiLeads: AISalesIntelligenceLead[],
    limit = 10,
): RevenueRiskRow[] {
    const slugSet = new Set(intelLeads.map((l) => l.leadSlug));
    const rows: RevenueRiskRow[] = [];
    const seen = new Set<string>();

    for (const lead of activePipeline(intelLeads)) {
        const idle = daysSinceActivity(getLastActivityDate(lead));
        let riskReason = getRiskReason(lead);
        if (lead.visitRecommendation && !lead.activity.some((a) => a.type === 'Meeting')) {
            riskReason = 'No site visit recorded';
        } else if (
            (lead.nextAction === 'Offer' || lead.conversionProbability >= 68) &&
            !lead.activity.some((a) => a.type === 'Email')
        ) {
            riskReason = 'Proposal pending';
        } else if (idle >= 7) {
            riskReason = 'Follow-up overdue';
        } else if (idle >= 14) {
            riskReason = 'Lead inactive';
        }
        const deal = getLeadDealContext(lead.leadSlug);
        if (deal?.pendingPaymentLakhs) riskReason = 'Payment concern';

        rows.push({
            id: `risk-${lead.id}`,
            leadName: lead.name,
            leadSlug: lead.leadSlug,
            riskReason,
            revenueImpactLakhs: getLeadRevenuePotentialLakhs(lead),
            daysInactive: idle,
            suggestedAction: getRecommendedActionLabel(lead),
        });
        seen.add(lead.leadSlug);
    }

    for (const row of computeBehaviorAnalysis(aiLeads.filter((l) => slugSet.has(l.leadSlug)))) {
        if (seen.has(row.leadSlug)) continue;
        const intel = intelLeads.find((l) => l.leadSlug === row.leadSlug);
        rows.push({
            id: row.id,
            leadName: row.leadName,
            leadSlug: row.leadSlug,
            riskReason: row.issue,
            revenueImpactLakhs: intel ? getLeadRevenuePotentialLakhs(intel) : 0,
            daysInactive: intel ? daysSinceActivity(getLastActivityDate(intel)) : 0,
            suggestedAction: row.recommendation,
        });
    }

    return rows.sort((a, b) => b.revenueImpactLakhs - a.revenueImpactLakhs).slice(0, limit);
}

export type NextBestActionRow = {
    id: string;
    leadName: string;
    leadSlug: string;
    reason: string;
    suggestedAction: RecommendedActionLabel;
    expectedOutcome: string;
    confidence: number;
};

export function buildNextBestActionQueue(leads: IntelligenceLead[], limit = 10): NextBestActionRow[] {
    return getAiActionRowsWithMeta(leads, limit).map((row) => ({
        id: `nba-${row.lead.id}`,
        leadName: row.lead.name,
        leadSlug: row.lead.leadSlug,
        reason: getPriorityActionProblem(row.lead, row.action),
        suggestedAction: row.action,
        expectedOutcome: row.businessImpact,
        confidence: row.confidence,
    }));
}

export type SalespersonIntelCard = SalesRepPerformance & {
    pipelineHealth: number;
    followUpQuality: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    badge: 'Top Performer' | 'Needs Attention' | null;
};

export function buildSalespersonIntelligence(leads: IntelligenceLead[]): SalespersonIntelCard[] {
    const reps = getSalesTeamPerformance(leads);
    if (!reps.length) return [];

    const topConv = Math.max(...reps.map((r) => r.conversionPct));
    const cards = reps.map((rep) => {
        const repLeads = leads.filter((l) => (l.assignedTo.trim() || 'Unassigned') === rep.name);
        const pipelineHealth = getPipelineHealthScore(repLeads);
        const followUpQuality = rep.followUpCompliancePct;
        const riskLevel: SalespersonIntelCard['riskLevel'] =
            followUpQuality < 65 || rep.conversionPct < 55
                ? 'High'
                : followUpQuality < 80 || rep.conversionPct < 68
                  ? 'Medium'
                  : 'Low';
        let badge: SalespersonIntelCard['badge'] = null;
        if (rep.conversionPct === topConv && rep.assignedLeads >= 2) badge = 'Top Performer';
        if (riskLevel === 'High' && rep.assignedLeads >= 2) badge = 'Needs Attention';
        return {
            ...rep,
            pipelineHealth,
            followUpQuality,
            riskLevel,
            badge,
        };
    });

    return cards.sort((a, b) => b.conversionPct - a.conversionPct);
}

export type FunnelBottleneck = {
    fromStage: string;
    toStage: string;
    dropOffPct: number;
    message: string;
};

export function identifyFunnelBottleneck(steps: AISalesFunnelStep[]): FunnelBottleneck | null {
    let worst: FunnelBottleneck | null = null;
    for (let i = 1; i < steps.length; i++) {
        const prev = steps[i - 1];
        const cur = steps[i];
        if (cur.dropOffPct == null || cur.dropOffPct < 25) continue;
        const candidate: FunnelBottleneck = {
            fromStage: prev.label,
            toStage: cur.label,
            dropOffPct: cur.dropOffPct,
            message: `${cur.dropOffPct}% drop between ${prev.label} and ${cur.label}.`,
        };
        if (!worst || candidate.dropOffPct > worst.dropOffPct) worst = candidate;
    }
    return worst;
}

export type RevenueLeakageBucket = {
    key: string;
    label: string;
    valueLakhs: number;
    leadCount: number;
};

export function buildRevenueLeakageMonitor(leads: IntelligenceLead[]): RevenueLeakageBucket[] {
    const pipeline = activePipeline(leads);

    const proposalLeads = pipeline.filter(
        (l) =>
            (l.nextAction === 'Offer' || l.conversionProbability >= 68) &&
            !l.activity.some((a) => a.type === 'Email'),
    );
    const visitLeads = pipeline.filter(
        (l) => l.visitRecommendation && !l.activity.some((a) => a.type === 'Meeting'),
    );
    const inactiveLeads = pipeline.filter((l) => daysSinceActivity(getLastActivityDate(l)) >= 14);
    const negotiationLeads = pipeline.filter(
        (l) => l.status === 'Qualified' && l.conversionProbability >= 60 && daysSinceActivity(getLastActivityDate(l)) >= 10,
    );
    const paymentLeads = pipeline.filter((l) => {
        const deal = getLeadDealContext(l.leadSlug);
        return (deal?.pendingPaymentLakhs ?? 0) > 0;
    });

    const sumRev = (rows: IntelligenceLead[]) => rows.reduce((s, l) => s + getLeadRevenuePotentialLakhs(l), 0);
    const paymentLakhs = paymentLeads.reduce((s, l) => {
        const deal = getLeadDealContext(l.leadSlug);
        return s + (deal?.pendingPaymentLakhs ?? getLeadRevenuePotentialLakhs(l));
    }, 0);

    return [
        { key: 'proposal', label: 'Pending Proposal Value', valueLakhs: sumRev(proposalLeads), leadCount: proposalLeads.length },
        { key: 'visit', label: 'Pending Site Visit Value', valueLakhs: sumRev(visitLeads), leadCount: visitLeads.length },
        { key: 'inactive', label: 'Inactive Lead Value', valueLakhs: sumRev(inactiveLeads), leadCount: inactiveLeads.length },
        { key: 'negotiation', label: 'Delayed Negotiation Value', valueLakhs: sumRev(negotiationLeads), leadCount: negotiationLeads.length },
        { key: 'payment', label: 'Payment Pending Value', valueLakhs: paymentLakhs, leadCount: paymentLeads.length },
    ];
}

export type AIRecommendationRow = {
    id: string;
    text: string;
    impactLakhs: number;
    priority: 'Critical' | 'High' | 'Medium';
};

export function buildAIRecommendations(
    intelLeads: IntelligenceLead[],
    aiLeads: AISalesIntelligenceLead[],
    limit = 10,
): AIRecommendationRow[] {
    const recs: AIRecommendationRow[] = [];
    const pipeline = activePipeline(intelLeads);

    const visitCount = pipeline.filter(
        (l) => l.visitRecommendation && !l.activity.some((a) => a.type === 'Meeting'),
    ).length;
    if (visitCount > 0) {
        recs.push({
            id: 'rec-visits',
            text: `Schedule site visits for ${visitCount} lead${visitCount === 1 ? '' : 's'}.`,
            impactLakhs: pipeline
                .filter((l) => l.visitRecommendation && !l.activity.some((a) => a.type === 'Meeting'))
                .reduce((s, l) => s + getLeadRevenuePotentialLakhs(l), 0),
            priority: 'High',
        });
    }

    const inactiveValue = pipeline
        .filter((l) => daysSinceActivity(getLastActivityDate(l)) >= 14)
        .reduce((s, l) => s + getLeadRevenuePotentialLakhs(l), 0);
    if (inactiveValue > 0) {
        recs.push({
            id: 'rec-inactive',
            text: `Follow up on ${formatRevenueDisplay(inactiveValue)} inactive opportunities.`,
            impactLakhs: inactiveValue,
            priority: 'Critical',
        });
    }

    const warmNoProposal = pipeline.filter(
        (l) =>
            (l.temperature === 'Hot' || l.temperature === 'Warm') &&
            !l.activity.some((a) => a.type === 'Email') &&
            l.conversionProbability >= 55,
    );
    if (warmNoProposal.length > 0) {
        recs.push({
            id: 'rec-proposals',
            text: `Send proposals to ${warmNoProposal.length} warm lead${warmNoProposal.length === 1 ? '' : 's'}.`,
            impactLakhs: warmNoProposal.reduce((s, l) => s + getLeadRevenuePotentialLakhs(l), 0),
            priority: 'High',
        });
    }

    const stalled = aiLeads.filter((l) => l.isStuckInStage && l.pipelineStage === 'negotiation');
    if (stalled.length > 0) {
        recs.push({
            id: 'rec-negotiation',
            text: `Escalate ${stalled.length} stalled negotiation${stalled.length === 1 ? '' : 's'}.`,
            impactLakhs: stalled.reduce((s, l) => s + l.expectedRevenueImpactLakhs, 0),
            priority: 'Critical',
        });
    }

    for (const lead of pipeline.filter((l) => l.followUpRisk === 'High').slice(0, 3)) {
        recs.push({
            id: `rec-followup-${lead.id}`,
            text: `Call ${lead.name} — ${getRiskReason(lead)}.`,
            impactLakhs: getLeadRevenuePotentialLakhs(lead),
            priority: 'High',
        });
    }

    const prio = { Critical: 0, High: 1, Medium: 2 };
    return recs
        .sort((a, b) => prio[a.priority] - prio[b.priority] || b.impactLakhs - a.impactLakhs)
        .slice(0, limit);
}

export function filterAiLeadsByIntelSlugs(
    aiLeads: AISalesIntelligenceLead[],
    intelLeads: IntelligenceLead[],
): AISalesIntelligenceLead[] {
    const slugs = new Set(intelLeads.map((l) => l.leadSlug));
    return aiLeads.filter((l) => slugs.has(l.leadSlug));
}

export function getTopOpportunities(aiLeads: AISalesIntelligenceLead[], limit = 20): AISalesOpportunityRow[] {
    return computeOpportunityPrioritization(aiLeads).slice(0, limit);
}

export function getRevenueFunnel(aiLeads: AISalesIntelligenceLead[]): AISalesFunnelStep[] {
    return computeConversionFunnel(aiLeads);
}

/** Confidence for table display — blends conversion model + engagement. */
export function getLeadDisplayConfidence(lead: IntelligenceLead): number {
    return getConversionConfidence(lead);
}
