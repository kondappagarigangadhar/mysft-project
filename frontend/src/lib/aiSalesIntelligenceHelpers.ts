import type {
    AISalesIntelligenceLead,
    FunnelStageKey,
    LeadFeatureStore,
    LeadTemperature,
} from '@/lib/aiSalesIntelligenceStore';

export const AI_SALES_TEMPERATURE_CLASS: Record<LeadTemperature, string> = {
    Hot: 'bg-red-50 text-red-700 border-red-200',
    Warm: 'bg-amber-50 text-amber-700 border-amber-200',
    Cold: 'bg-blue-50 text-blue-700 border-blue-200',
};

export const AI_SALES_PRIORITY_CLASS: Record<AISalesIntelligenceLead['queuePriority'], string> = {
    Critical: 'bg-red-50 text-red-700 border-red-200',
    High: 'bg-orange-50 text-orange-700 border-orange-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const AI_SALES_STATUS_CLASS: Record<AISalesIntelligenceLead['aiStatus'], string> = {
    Ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Updated: 'bg-sky-50 text-sky-700 border-sky-200',
    Recalculating: 'bg-violet-50 text-violet-700 border-violet-200',
    Stale: 'bg-slate-100 text-slate-600 border-slate-200',
};

export type AISalesModelPerformance = {
    totalLeadsAnalyzed: number;
    averageLeadScore: number;
    averageConversionProbability: number;
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
    highPriorityOpportunities: number;
    leadsRequiringImmediateAttention: number;
};

export type AISalesTemperatureBucket = {
    temperature: LeadTemperature;
    count: number;
    percentage: number;
};

export type AISalesFunnelStep = {
    key: FunnelStageKey;
    label: string;
    count: number;
    conversionPct: number | null;
    dropOffPct: number | null;
    revenueImpactLakhs: number;
};

export type AISalesBehaviorRow = {
    id: string;
    leadSlug: string;
    leadName: string;
    issue: string;
    recommendation: string;
    severity: 'High' | 'Medium' | 'Low';
};

export type AISalesOpportunityRow = AISalesIntelligenceLead & {
    priorityRank: number;
    expectedRevenueLakhs: number;
};

/** MVP weighted score drivers (25% / 25% / 30% / 20%). */
export const FEATURE_STORE_LABELS: { key: keyof LeadFeatureStore; label: string; weight: string }[] = [
    { key: 'leadSourceContribution', label: 'Lead Source', weight: '25%' },
    { key: 'budgetMatchContribution', label: 'Budget Fit', weight: '25%' },
    { key: 'siteVisitContribution', label: 'Site Visit', weight: '30%' },
    { key: 'engagementContribution', label: 'Engagement', weight: '20%' },
];

export function formatAISalesRevenue(lakhs: number): string {
    if (lakhs <= 0) return '₹0';
    return `₹${lakhs.toLocaleString('en-IN')}L`;
}

export function formatAISalesPercent(n: number): string {
    return `${Math.round(n)}%`;
}

export function formatCalculatedAt(iso: string): string {
    try {
        return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

export function computeModelPerformance(leads: AISalesIntelligenceLead[]): AISalesModelPerformance {
    const n = leads.length;
    if (n === 0) {
        return {
            totalLeadsAnalyzed: 0,
            averageLeadScore: 0,
            averageConversionProbability: 0,
            hotLeads: 0,
            warmLeads: 0,
            coldLeads: 0,
            highPriorityOpportunities: 0,
            leadsRequiringImmediateAttention: 0,
        };
    }
    const hot = leads.filter((l) => l.leadTemperature === 'Hot').length;
    const warm = leads.filter((l) => l.leadTemperature === 'Warm').length;
    const cold = leads.filter((l) => l.leadTemperature === 'Cold').length;
    return {
        totalLeadsAnalyzed: n,
        averageLeadScore: Math.round(leads.reduce((s, l) => s + l.leadScore, 0) / n),
        averageConversionProbability: Math.round(leads.reduce((s, l) => s + l.conversionProbability, 0) / n),
        hotLeads: hot,
        warmLeads: warm,
        coldLeads: cold,
        highPriorityOpportunities: leads.filter((l) => l.leadTemperature === 'Hot' && l.conversionProbability >= 70).length,
        leadsRequiringImmediateAttention: leads.filter(
            (l) => l.leadTemperature === 'Hot' && (l.daysSinceFollowUp >= 3 || l.insights.riskFactors.length > 0),
        ).length,
    };
}

export function computeTemperatureDistribution(leads: AISalesIntelligenceLead[]): AISalesTemperatureBucket[] {
    const total = leads.length || 1;
    const temps: LeadTemperature[] = ['Hot', 'Warm', 'Cold'];
    return temps.map((temperature) => {
        const count = leads.filter((l) => l.leadTemperature === temperature).length;
        return { temperature, count, percentage: Math.round((count / total) * 100) };
    });
}

const FUNNEL_LABELS: Record<FunnelStageKey, string> = {
    leads: 'Leads',
    qualified: 'Qualified',
    site_visit: 'Site Visit',
    proposal: 'Proposal',
    negotiation: 'Negotiation',
    booking: 'Booking',
};

const FUNNEL_ORDER: FunnelStageKey[] = ['leads', 'qualified', 'site_visit', 'proposal', 'negotiation', 'booking'];

export function computeConversionFunnel(leads: AISalesIntelligenceLead[]): AISalesFunnelStep[] {
    const counts = FUNNEL_ORDER.map((key) => ({
        key,
        count: leads.filter((l) => {
            const stageIdx = FUNNEL_ORDER.indexOf(l.pipelineStage);
            const keyIdx = FUNNEL_ORDER.indexOf(key);
            return stageIdx >= keyIdx;
        }).length,
    }));

    const entryCount = counts[0]?.count || 1;
    return counts.map((step, i) => {
        const prev = i > 0 ? counts[i - 1].count : null;
        const conversionPct = prev != null && prev > 0 ? Math.round((step.count / prev) * 100) : null;
        const dropOffPct = prev != null && prev > 0 ? Math.round(((prev - step.count) / prev) * 100) : null;
        const stageLeads = leads.filter((l) => l.pipelineStage === step.key);
        const revenueImpactLakhs = stageLeads.reduce((s, l) => s + l.expectedRevenueImpactLakhs, 0);
        return {
            key: step.key,
            label: FUNNEL_LABELS[step.key],
            count: step.count,
            conversionPct,
            dropOffPct,
            revenueImpactLakhs,
        };
    });
}

export function computeOpportunityPrioritization(leads: AISalesIntelligenceLead[]): AISalesOpportunityRow[] {
    return [...leads]
        .map((lead) => ({
            ...lead,
            expectedRevenueLakhs: lead.expectedRevenueImpactLakhs,
        }))
        .sort((a, b) => b.expectedRevenueLakhs - a.expectedRevenueLakhs || b.leadScore - a.leadScore)
        .map((row, i) => ({ ...row, priorityRank: i + 1 }));
}

export function computeBehaviorAnalysis(leads: AISalesIntelligenceLead[]): AISalesBehaviorRow[] {
    const rows: AISalesBehaviorRow[] = [];
    for (const lead of leads) {
        if (lead.daysSinceFollowUp >= 5) {
            rows.push({
                id: `${lead.id}-no-followup`,
                leadSlug: lead.leadSlug,
                leadName: lead.name,
                issue: `No follow-up for ${lead.daysSinceFollowUp} days`,
                recommendation: 'Schedule immediate call or manager outreach',
                severity: lead.leadTemperature === 'Hot' ? 'High' : 'Medium',
            });
        }
        if (lead.responseDelayHours >= 36) {
            rows.push({
                id: `${lead.id}-delay`,
                leadSlug: lead.leadSlug,
                leadName: lead.name,
                issue: `Delayed response — avg ${lead.responseDelayHours}h gap`,
                recommendation: 'Reduce response time with SLA alert to assigned rep',
                severity: 'Medium',
            });
        }
        if (lead.isStuckInStage) {
            rows.push({
                id: `${lead.id}-stuck`,
                leadSlug: lead.leadSlug,
                leadName: lead.name,
                issue: 'Stuck in current pipeline stage',
                recommendation: 'Escalate for stage advancement or disqualify',
                severity: 'High',
            });
        }
        if (!lead.hasSiteVisit && lead.leadTemperature !== 'Cold') {
            rows.push({
                id: `${lead.id}-no-visit`,
                leadSlug: lead.leadSlug,
                leadName: lead.name,
                issue: 'No site visit recorded',
                recommendation: 'Book site visit to validate purchase intent',
                severity: lead.leadTemperature === 'Hot' ? 'High' : 'Medium',
            });
        }
        if (lead.engagementTrend === 'declining') {
            rows.push({
                id: `${lead.id}-decline`,
                leadSlug: lead.leadSlug,
                leadName: lead.name,
                issue: 'Declining engagement trend',
                recommendation: lead.insights.behaviorRecommendation,
                severity: 'Medium',
            });
        }
    }
    const severityOrder = { High: 0, Medium: 1, Low: 2 };
    return rows.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export function filterAISalesLeads(
    leads: AISalesIntelligenceLead[],
    search: string,
    temperature: 'All' | LeadTemperature,
    project: string,
): AISalesIntelligenceLead[] {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
        if (temperature !== 'All' && l.leadTemperature !== temperature) return false;
        if (project !== 'All' && l.project !== project) return false;
        if (!q) return true;
        return (
            l.name.toLowerCase().includes(q) ||
            l.project.toLowerCase().includes(q) ||
            l.leadSource.toLowerCase().includes(q) ||
            l.nextBestAction.toLowerCase().includes(q)
        );
    });
}

export function getAISalesProjectOptions(leads: AISalesIntelligenceLead[]): string[] {
    const set = new Set(leads.map((l) => l.project).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
}
