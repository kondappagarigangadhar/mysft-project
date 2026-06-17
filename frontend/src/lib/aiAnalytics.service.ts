import { aiAxios } from '@/lib/aiApi';

/** Mirrors backend contract for GET /api/ai/analytics-detailed */
export type AnalyticsDetailedMetrics = {
    overduePayments: number;
    inactiveLeads: number;
    highRiskBookings: number;
    opportunities: number;
};

export type AnalyticsDetailedMetricTrend = 'up' | 'down';

export type AnalyticsDetailedMetricTrends = Partial<Record<keyof AnalyticsDetailedMetrics, AnalyticsDetailedMetricTrend>>;

export type AnalyticsDetailedRiskBreakdown = {
    low: number;
    medium: number;
    high: number;
};

export type AnalyticsDetailedIssue = {
    type: string;
    name: string;
    issue: string;
    severity: string;
    action: string;
    /** Deep link when row is clicked (optional; backend-driven) */
    href?: string;
};

export type AnalyticsDetailedOpportunities = {
    warmLeadsWithoutSiteVisit?: number;
    headline?: string;
    viewLeadsHref?: string;
};

/** Optional deep links — backend can omit; UI falls back to ANALYTICS_DEFAULT_HREFS */
export type AnalyticsDetailedNavigation = {
    summaryHref?: string;
    metricHrefs?: Partial<Record<keyof AnalyticsDetailedMetrics, string>>;
    riskCardHref?: string;
    riskSegmentHrefs?: {
        low?: string;
        medium?: string;
        high?: string;
    };
};

export type AnalyticsDetailedPayload = {
    summary: string;
    confidence: number;
    updatedAt?: string;
    metrics: AnalyticsDetailedMetrics;
    metricTrends?: AnalyticsDetailedMetricTrends;
    riskBreakdown: AnalyticsDetailedRiskBreakdown;
    issues: AnalyticsDetailedIssue[];
    opportunities: AnalyticsDetailedOpportunities;
} & AnalyticsDetailedNavigation;

/** Client + demo defaults when API omits hrefs */
export const ANALYTICS_DEFAULT_HREFS = {
    summary: '/leads/analytics',
    metrics: {
        overduePayments: '/company-admin/booking-payment/payments',
        inactiveLeads: '/leads',
        highRiskBookings: '/company-admin/booking-payment/booking',
        opportunities: '/leads',
    } satisfies Record<keyof AnalyticsDetailedMetrics, string>,
    riskCard: '/leads/analytics',
    riskSegment: {
        low: '/leads',
        medium: '/company-admin/booking-payment/payments',
        high: '/company-admin/booking-payment/payments',
    },
} as const;

/** Demo payload — same shape the real backend should return */
export const MOCK_ANALYTICS_DETAILED_PAYLOAD: AnalyticsDetailedPayload = {
    summary:
        'Top concern: payment delays on milestone-linked plans. Prioritize collections on high-value units and re-engage warm leads without a logged site visit.',
    confidence: 82,
    metrics: {
        overduePayments: 18,
        inactiveLeads: 12,
        highRiskBookings: 6,
        opportunities: 9,
    },
    metricTrends: {
        overduePayments: 'up',
        inactiveLeads: 'down',
        highRiskBookings: 'up',
        opportunities: 'up',
    },
    riskBreakdown: {
        low: 40,
        medium: 35,
        high: 25,
    },
    opportunities: {
        warmLeadsWithoutSiteVisit: 7,
        headline: 'Warm leads without site visit',
        viewLeadsHref: '/leads',
    },
    summaryHref: '/leads/analytics',
    metricHrefs: {
        overduePayments: '/company-admin/booking-payment/payments',
        inactiveLeads: '/leads',
        highRiskBookings: '/company-admin/booking-payment/booking',
        opportunities: '/leads',
    },
    riskCardHref: '/leads/analytics',
    riskSegmentHrefs: {
        low: '/leads',
        medium: '/company-admin/booking-payment/payments',
        high: '/company-admin/booking-payment/payments',
    },
    issues: [
        {
            type: 'Payment',
            name: 'Unit A-101',
            issue: 'Overdue by 10 days',
            severity: 'High',
            action: 'Send reminder',
            href: '/company-admin/booking-payment/payments',
        },
        {
            type: 'Lead',
            name: 'Ravi Kumar',
            issue: 'No follow-up for 8 days',
            severity: 'Medium',
            action: 'Schedule call',
            href: '/leads',
        },
    ],
};

export type AIInsightsLabels = {
    summaryTitle: string;
    summarySubtitle: string;
    confidenceLabel: string;
    lastUpdatedLabel: string;
    metrics: {
        overduePayments: string;
        inactiveLeads: string;
        highRiskBookings: string;
        opportunities: string;
    };
    riskBreakdownTitle: string;
    riskLegendLow: string;
    riskLegendMedium: string;
    riskLegendHigh: string;
    tableTitle: string;
    columns: {
        type: string;
        name: string;
        issue: string;
        severity: string;
        action: string;
    };
    opportunitiesTitle: string;
    opportunitiesSubtext: string;
    viewLeads: string;
    riskSubtitle: string;
    metricTrendLabel: string;
    loadingMessage: string;
    emptyTitle: string;
    emptySubtitle: string;
};

export const AI_INSIGHTS_DEFAULT_LABELS: AIInsightsLabels = {
    summaryTitle: 'AI Insights Summary',
    summarySubtitle: 'Cross-signal view of revenue risk and pipeline health',
    confidenceLabel: 'Confidence',
    lastUpdatedLabel: 'Last updated',
    metrics: {
        overduePayments: 'Overdue Payments',
        inactiveLeads: 'Leads Without Follow-up (7+ days)',
        highRiskBookings: 'High Risk Bookings',
        opportunities: 'Conversion Opportunities',
    },
    riskBreakdownTitle: 'Risk breakdown',
    riskLegendLow: 'Low',
    riskLegendMedium: 'Medium',
    riskLegendHigh: 'High',
    tableTitle: 'Top issues',
    columns: {
        type: 'Type',
        name: 'Name',
        issue: 'Issue',
        severity: 'Severity',
        action: 'Suggested action',
    },
    opportunitiesTitle: 'Opportunity highlights',
    opportunitiesSubtext: 'Warm leads without site visit',
    viewLeads: 'View Leads',
    riskSubtitle: 'Portfolio mix by AI-assessed exposure',
    metricTrendLabel: 'vs last period',
    loadingMessage: 'Loading AI insights…',
    emptyTitle: 'No insights yet',
    emptySubtitle: 'Connect your data source or try again later.',
};

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function num(v: unknown, fallback: number): number {
    return typeof v === 'number' && !Number.isNaN(v) ? v : fallback;
}

/** Normalize partial API responses into a safe view model */
export function mapAnalyticsDetailedPayload(raw: unknown): AnalyticsDetailedPayload | null {
    if (!isRecord(raw)) return null;
    const summary = typeof raw.summary === 'string' ? raw.summary : '';
    const confidence = num(raw.confidence, 0);
    const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined;

    const m = isRecord(raw.metrics) ? raw.metrics : {};
    const metrics: AnalyticsDetailedMetrics = {
        overduePayments: num(m.overduePayments, 0),
        inactiveLeads: num(m.inactiveLeads, 0),
        highRiskBookings: num(m.highRiskBookings, 0),
        opportunities: num(m.opportunities, 0),
    };

    const rb = isRecord(raw.riskBreakdown) ? raw.riskBreakdown : {};
    const riskBreakdown: AnalyticsDetailedRiskBreakdown = {
        low: num(rb.low, 0),
        medium: num(rb.medium, 0),
        high: num(rb.high, 0),
    };

    let issues: AnalyticsDetailedIssue[] = [];
    if (Array.isArray(raw.issues)) {
        issues = raw.issues.map((row) => {
            const r = isRecord(row) ? row : {};
            return {
                type: typeof r.type === 'string' ? r.type : '',
                name: typeof r.name === 'string' ? r.name : '',
                issue: typeof r.issue === 'string' ? r.issue : '',
                severity: typeof r.severity === 'string' ? r.severity : '',
                action: typeof r.action === 'string' ? r.action : '',
                href: typeof r.href === 'string' ? r.href : undefined,
            };
        });
    }

    const opp = isRecord(raw.opportunities) ? raw.opportunities : {};
    const opportunities: AnalyticsDetailedOpportunities = {
        warmLeadsWithoutSiteVisit:
            typeof opp.warmLeadsWithoutSiteVisit === 'number' ? opp.warmLeadsWithoutSiteVisit : undefined,
        headline: typeof opp.headline === 'string' ? opp.headline : undefined,
        viewLeadsHref: typeof opp.viewLeadsHref === 'string' ? opp.viewLeadsHref : undefined,
    };

    let metricTrends: AnalyticsDetailedMetricTrends | undefined;
    if (isRecord(raw.metricTrends)) {
        const t = raw.metricTrends;
        const pick = (k: keyof AnalyticsDetailedMetrics): AnalyticsDetailedMetricTrend | undefined => {
            const v = t[k];
            return v === 'up' || v === 'down' ? v : undefined;
        };
        metricTrends = {
            overduePayments: pick('overduePayments'),
            inactiveLeads: pick('inactiveLeads'),
            highRiskBookings: pick('highRiskBookings'),
            opportunities: pick('opportunities'),
        };
    }

    const summaryHref = typeof raw.summaryHref === 'string' ? raw.summaryHref : undefined;
    const riskCardHref = typeof raw.riskCardHref === 'string' ? raw.riskCardHref : undefined;

    let metricHrefs: Partial<Record<keyof AnalyticsDetailedMetrics, string>> | undefined;
    if (isRecord(raw.metricHrefs)) {
        const mh = raw.metricHrefs;
        metricHrefs = {
            overduePayments: typeof mh.overduePayments === 'string' ? mh.overduePayments : undefined,
            inactiveLeads: typeof mh.inactiveLeads === 'string' ? mh.inactiveLeads : undefined,
            highRiskBookings: typeof mh.highRiskBookings === 'string' ? mh.highRiskBookings : undefined,
            opportunities: typeof mh.opportunities === 'string' ? mh.opportunities : undefined,
        };
    }

    let riskSegmentHrefs: AnalyticsDetailedNavigation['riskSegmentHrefs'];
    if (isRecord(raw.riskSegmentHrefs)) {
        const rs = raw.riskSegmentHrefs;
        riskSegmentHrefs = {
            low: typeof rs.low === 'string' ? rs.low : undefined,
            medium: typeof rs.medium === 'string' ? rs.medium : undefined,
            high: typeof rs.high === 'string' ? rs.high : undefined,
        };
    }

    return {
        summary,
        confidence,
        updatedAt,
        metrics,
        metricTrends,
        riskBreakdown,
        issues,
        opportunities,
        summaryHref,
        metricHrefs,
        riskCardHref,
        riskSegmentHrefs,
    };
}

export async function fetchAnalyticsDetailed(): Promise<AnalyticsDetailedPayload> {
    const { data } = await aiAxios.get<unknown>('/api/ai/analytics-detailed');
    const mapped = mapAnalyticsDetailedPayload(data);
    if (mapped) return mapped;
    return MOCK_ANALYTICS_DETAILED_PAYLOAD;
}

export function resolveSummaryHref(data: AnalyticsDetailedPayload): string {
    return data.summaryHref ?? ANALYTICS_DEFAULT_HREFS.summary;
}

export function resolveMetricHref(key: keyof AnalyticsDetailedMetrics, data: AnalyticsDetailedPayload): string {
    return data.metricHrefs?.[key] ?? ANALYTICS_DEFAULT_HREFS.metrics[key];
}

export function resolveRiskCardHref(data: AnalyticsDetailedPayload): string {
    return data.riskCardHref ?? ANALYTICS_DEFAULT_HREFS.riskCard;
}

export function resolveRiskSegmentHref(segment: 'low' | 'medium' | 'high', data: AnalyticsDetailedPayload): string {
    return data.riskSegmentHrefs?.[segment] ?? ANALYTICS_DEFAULT_HREFS.riskSegment[segment];
}

export function resolveOpportunityHref(data: AnalyticsDetailedPayload): string {
    return data.opportunities.viewLeadsHref ?? '/leads';
}

/** Row link from API or inferred from issue type */
export function resolveIssueHref(row: AnalyticsDetailedIssue): string {
    if (row.href?.trim()) return row.href;
    const t = row.type.toLowerCase();
    if (t.includes('payment')) return ANALYTICS_DEFAULT_HREFS.metrics.overduePayments;
    if (t.includes('lead')) return ANALYTICS_DEFAULT_HREFS.metrics.inactiveLeads;
    return ANALYTICS_DEFAULT_HREFS.summary;
}
