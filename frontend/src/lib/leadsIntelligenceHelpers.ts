import type { FollowUpRisk, IntelligenceLead, LeadTemperature } from './leadsIntelligenceStore';

export const temperatureClassMap: Record<LeadTemperature, string> = {
    Hot: 'bg-red-50 text-red-700 border-red-200',
    Warm: 'bg-amber-50 text-amber-700 border-amber-200',
    Cold: 'bg-blue-50 text-blue-700 border-blue-200',
};

export const riskClassMap: Record<FollowUpRisk, string> = {
    High: 'bg-red-50 text-red-700 border-red-200',
    Medium: 'bg-orange-50 text-orange-700 border-orange-200',
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const statusClassMap: Record<IntelligenceLead['status'], string> = {
    New: 'bg-slate-100 text-slate-700 border-slate-200',
    Contacted: 'bg-sky-50 text-sky-700 border-sky-200',
    Qualified: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Converted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Lost: 'bg-rose-50 text-rose-700 border-rose-200',
};

export type KpiTrendDirection = 'up' | 'down' | 'flat';

export type LeadsIntelKpiSummary = {
    forecastRevenueLakhs: number;
    expectedBookings: number;
    revenueAtRiskLakhs: number;
    hotLeadsRequiringAction: number;
    leadLeakageCount: number;
    salesProductivityScore: number;
    trends: {
        forecastRevenue: { direction: KpiTrendDirection; label: string };
        expectedBookings: { direction: KpiTrendDirection; label: string };
        revenueAtRisk: { direction: KpiTrendDirection; label: string };
        hotLeadsRequiringAction: { direction: KpiTrendDirection; label: string };
        leadLeakageCount: { direction: KpiTrendDirection; label: string };
        salesProductivityScore: { direction: KpiTrendDirection; label: string };
    };
};

/** De-emphasized analytics — shown below execution sections. */
export type LeadsIntelSecondaryMetrics = {
    avgLeadScore: number;
    avgEngagement: number;
    campaignPerformancePct: number;
};

/** Estimated deal size (₹ lakhs) from score, conversion, and pipeline stage. */
export function getLeadRevenuePotentialLakhs(lead: IntelligenceLead): number {
    if (lead.status === 'Converted') return Math.round(lead.leadScore * 0.55);
    if (lead.status === 'Lost') return 0;
    const stageBoost = lead.status === 'Qualified' ? 1.15 : lead.status === 'Contacted' ? 0.9 : 0.75;
    return Math.round((lead.leadScore * 0.42 + lead.conversionProbability * 0.18) * stageBoost);
}

export function formatRevenueLakhs(lakhs: number): string {
    if (lakhs <= 0) return '₹0';
    return `₹${lakhs.toLocaleString('en-IN')}L`;
}

export function formatPipelineValue(lakhs: number): string {
    return formatRevenueLakhs(lakhs);
}

export function formatRiskLevel(risk: FollowUpRisk): string {
    return risk === 'High' ? 'High risk' : risk === 'Medium' ? 'Medium risk' : 'Low risk';
}

/** Model confidence for conversion prediction (mock — API-ready). */
export function getConversionConfidence(lead: IntelligenceLead): number {
    const activityBoost = Math.min(12, lead.activity.length * 4);
    const engagementBoost = Math.round(lead.engagementScore * 0.08);
    return Math.min(96, Math.max(52, 58 + activityBoost + engagementBoost + (lead.leadScore >= 80 ? 8 : 0)));
}

export function leadScoreTone(score: number): string {
    if (score >= 80) return 'text-orange-700';
    if (score >= 60) return 'text-amber-700';
    return 'text-slate-600';
}

export function conversionTone(pct: number): string {
    if (pct >= 75) return 'text-emerald-700';
    if (pct >= 50) return 'text-amber-700';
    return 'text-rose-700';
}

export type RecommendedActionLabel =
    | 'Call now'
    | 'Schedule site visit'
    | 'Send pricing sheet'
    | 'Send payment reminder'
    | 'Escalate to manager'
    | 'Nurture with content';

/** Next Best Action — maps lead signals to a single sales motion. */
export function getRecommendedActionLabel(lead: IntelligenceLead): RecommendedActionLabel {
    if (lead.status === 'Converted') return 'Send payment reminder';
    if (lead.status === 'Lost') return 'Nurture with content';
    if (lead.followUpRisk === 'High' && lead.conversionProbability < 50) return 'Escalate to manager';
    if (lead.visitRecommendation) return 'Schedule site visit';
    if (lead.nextAction === 'Offer' || (lead.temperature === 'Hot' && lead.conversionProbability >= 78)) {
        return 'Send pricing sheet';
    }
    if (lead.temperature === 'Hot' || lead.followUpRisk === 'High') return 'Call now';
    if (lead.nextAction === 'Visit') return 'Schedule site visit';
    return 'Nurture with content';
}

export function actionPillClass(action: RecommendedActionLabel): string {
    switch (action) {
        case 'Call now':
            return 'border-sky-200 bg-sky-50 text-sky-800';
        case 'Schedule site visit':
            return 'border-emerald-200 bg-emerald-50 text-emerald-800';
        case 'Send pricing sheet':
            return 'border-violet-200 bg-violet-50 text-violet-800';
        case 'Send payment reminder':
            return 'border-amber-200 bg-amber-50 text-amber-800';
        case 'Escalate to manager':
            return 'border-rose-200 bg-rose-50 text-rose-800';
        default:
            return 'border-slate-200 bg-slate-50 text-slate-700';
    }
}

export type FollowUpPriority = 'High' | 'Medium' | 'Low';

export function getFollowUpPriority(lead: IntelligenceLead): FollowUpPriority {
    if (lead.followUpRisk === 'High' || lead.temperature === 'Hot') return 'High';
    if (lead.followUpRisk === 'Medium' || lead.temperature === 'Warm') return 'Medium';
    return 'Low';
}

export type FollowUpChannel = 'Phone' | 'Email' | 'WhatsApp';

export function getSuggestedFollowUpChannel(lead: IntelligenceLead): FollowUpChannel {
    if (lead.temperature === 'Hot' || lead.followUpRisk === 'High') return 'Phone';
    if (lead.source === 'Website' || lead.source === 'Referral') return 'WhatsApp';
    return 'Email';
}

export function daysSinceActivity(isoDate: string): number {
    const then = new Date(isoDate).getTime();
    if (Number.isNaN(then)) return 999;
    return Math.floor((Date.now() - then) / 86_400_000);
}

export function getLastActivityDate(lead: IntelligenceLead): string {
    if (!lead.activity.length) return lead.createdAt;
    return lead.activity.reduce((latest, a) => (a.date > latest ? a.date : latest), lead.activity[0].date);
}

export function getLastFollowUpLabel(lead: IntelligenceLead): string {
    if (!lead.activity.length) return 'No follow-up logged';
    const last = getLastActivityDate(lead);
    const days = daysSinceActivity(last);
    if (days === 0) return `Today (${last})`;
    if (days === 1) return `Yesterday (${last})`;
    return `${days} days ago (${last})`;
}

export function getRiskReason(lead: IntelligenceLead): string {
    const idle = daysSinceActivity(getLastActivityDate(lead));
    if (idle >= 7) return `No follow-up for ${idle} days`;
    if (lead.engagementScore < 55) return 'Engagement dropped';
    if (lead.followUpRisk === 'High') return 'High follow-up risk';
    if (lead.temperature === 'Cold' && idle >= 5) return 'Cold lead — going inactive';
    return 'Follow-up cadence slipping';
}

export function getRevenueImpactMessage(lead: IntelligenceLead, action: RecommendedActionLabel): string {
    const rev = formatRevenueLakhs(getLeadRevenuePotentialLakhs(lead));
    if (isLeadLeakage(lead)) return `Prevents loss of ${rev} opportunity`;
    if (action === 'Call now' || action === 'Escalate to manager') return `Protects ${rev} in active pipeline`;
    if (action === 'Schedule site visit') return `Increases booking odds on ${rev} deal`;
    if (action === 'Send pricing sheet') return `Moves ${rev} opportunity toward close`;
    return `Keeps ${rev} opportunity engaged`;
}

export function formatTodayActionLine(lead: IntelligenceLead, action: RecommendedActionLabel): string {
    const rev = formatRevenueLakhs(getLeadRevenuePotentialLakhs(lead));
    const first = lead.name;
    switch (action) {
        case 'Call now':
            return `Call ${first} (${rev} opportunity)`;
        case 'Schedule site visit':
            return `Schedule site visit for ${first}`;
        case 'Send pricing sheet':
            return `Send offer to ${first}`;
        case 'Send payment reminder':
            return `Payment follow-up — ${first}`;
        case 'Escalate to manager':
            return `Escalate ${first} (${rev} at risk)`;
        default:
            return `Follow-up with ${first}`;
    }
}

/** Leads at risk of dropping out of pipeline (missed follow-up / inactivity). */
export function isLeadLeakage(lead: IntelligenceLead): boolean {
    if (lead.status === 'Converted' || lead.status === 'Lost') return false;
    const idleDays = daysSinceActivity(getLastActivityDate(lead));
    if (lead.followUpRisk === 'High' && idleDays >= 5) return true;
    if (lead.temperature === 'Cold' && idleDays >= 10) return true;
    if (lead.engagementScore < 50 && idleDays >= 7) return true;
    return false;
}

function trendFromValue(value: number, goodWhenHigh: boolean): { direction: KpiTrendDirection; label: string } {
    if (value === 0) return { direction: 'flat', label: 'No change' };
    const direction: KpiTrendDirection = goodWhenHigh ? 'up' : value > 0 ? 'down' : 'flat';
    const pct = Math.min(24, Math.max(3, Math.round(Math.abs(value) * 0.12) + 3));
    const label = direction === 'up' ? `+${pct}% vs prior` : direction === 'down' ? `-${pct}% vs prior` : 'Stable';
    return { direction, label };
}

export function getKpiSummary(leads: IntelligenceLead[]): LeadsIntelKpiSummary {
    const active = leads.filter((l) => l.status !== 'Lost');
    const n = active.length;

    const forecastRevenueLakhs = active.reduce((sum, lead) => {
        if (lead.status === 'Converted') return sum;
        const potential = getLeadRevenuePotentialLakhs(lead);
        return sum + Math.round((lead.conversionProbability / 100) * potential);
    }, 0);

    const expectedBookings = active.filter(
        (l) => l.conversionProbability >= 72 && (l.status === 'Qualified' || l.temperature === 'Hot'),
    ).length;

    const hotLeadsRequiringAction = leads.filter(
        (l) => l.temperature === 'Hot' && l.status !== 'Converted' && l.status !== 'Lost',
    ).length;
    const atRiskLeads = leads.filter(
        (l) => (isLeadLeakage(l) || l.followUpRisk === 'High') && l.status !== 'Converted' && l.status !== 'Lost',
    );
    const revenueAtRiskLakhs = atRiskLeads.reduce((sum, l) => sum + getLeadRevenuePotentialLakhs(l), 0);
    const leadLeakageCount = leads.filter(isLeadLeakage).length;

    const reps = new Map<string, { leads: number; convSum: number; risks: number }>();
    for (const l of active) {
        const key = l.assignedTo.trim() || 'Unassigned';
        const cur = reps.get(key) ?? { leads: 0, convSum: 0, risks: 0 };
        cur.leads += 1;
        cur.convSum += l.conversionProbability;
        if (l.followUpRisk === 'High') cur.risks += 1;
        reps.set(key, cur);
    }
    let productivity = 0;
    if (reps.size > 0) {
        const scores = [...reps.values()].map((r) => {
            const avgConv = r.convSum / Math.max(1, r.leads);
            const riskPenalty = (r.risks / Math.max(1, r.leads)) * 22;
            return Math.round(Math.min(99, Math.max(35, avgConv * 0.85 + r.leads * 2 - riskPenalty)));
        });
        productivity = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    return {
        forecastRevenueLakhs,
        expectedBookings,
        revenueAtRiskLakhs,
        hotLeadsRequiringAction,
        leadLeakageCount,
        salesProductivityScore: productivity,
        trends: {
            forecastRevenue: trendFromValue(forecastRevenueLakhs, true),
            expectedBookings: trendFromValue(expectedBookings, true),
            revenueAtRisk: trendFromValue(revenueAtRiskLakhs, false),
            hotLeadsRequiringAction: trendFromValue(hotLeadsRequiringAction, true),
            leadLeakageCount: trendFromValue(leadLeakageCount, false),
            salesProductivityScore: trendFromValue(productivity, true),
        },
    };
}

export function getSecondaryMetrics(leads: IntelligenceLead[]): LeadsIntelSecondaryMetrics {
    const n = leads.length || 1;
    const campaignLeads = leads.filter((l) => l.source === 'Campaign' || l.source === 'Ads').length;
    return {
        avgLeadScore: Math.round(leads.reduce((s, l) => s + l.leadScore, 0) / n),
        avgEngagement: Math.round(leads.reduce((s, l) => s + l.engagementScore, 0) / n),
        campaignPerformancePct: Math.round((campaignLeads / n) * 100),
    };
}

export function getActionPriorityScore(lead: IntelligenceLead): number {
    const riskWeight = lead.followUpRisk === 'High' ? 18 : lead.followUpRisk === 'Medium' ? 8 : 0;
    const leakageBoost = isLeadLeakage(lead) ? 12 : 0;
    return (
        lead.leadScore * 0.38 +
        lead.conversionProbability * 0.32 +
        lead.engagementScore * 0.15 +
        riskWeight +
        leakageBoost
    );
}
