/**
 * Mock contract intelligence — aligned with documents-compliance and vendor contracts.
 */

export type ContractType =
    | 'Sale Agreement'
    | 'Vendor Contract'
    | 'Lease Agreement'
    | 'Service Contract'
    | 'Procurement Contract';

export type ContractStatus = 'Active' | 'Expiring' | 'Under Review' | 'Expired';
export type ContractRiskLevel = 'High' | 'Medium' | 'Low';
export type ContractAiReviewStatus = 'Reviewed' | 'Pending' | 'In Progress' | 'Not Started';
export type ContractActionPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type ContractActionImpact = 'High' | 'Medium' | 'Low';
export type ContractAttentionKind =
    | 'high_risk_vendor'
    | 'lease_risk'
    | 'service_expiry'
    | 'missing_clause'
    | 'renewal_due';

export type ContractRenewalStatus = 'Pending Approval' | 'Auto Renewal' | 'Not Started' | 'Approved';
export type ContractRenewalAction = 'Renew' | 'Renegotiate' | 'Replace Vendor';

export type ClauseCategory =
    | 'Termination Clauses'
    | 'Penalty Clauses'
    | 'SLA Clauses'
    | 'Insurance Clauses'
    | 'Payment Clauses'
    | 'Liability Clauses'
    | 'Compliance Clauses'
    | 'Confidentiality Clauses';

export interface ContractRecord {
    id: string;
    contractId: string;
    slug: string;
    name: string;
    vendor: string;
    vendorSlug: string;
    type: ContractType;
    startDate: string;
    expiryDate: string;
    status: ContractStatus;
    riskScore: number;
    riskLevel: ContractRiskLevel;
    aiReviewStatus: ContractAiReviewStatus;
    aiRecommendation: string;
    priority: ContractActionPriority;
    lastReview: string;
    owner: string;
    missingClauses: string[];
    aiFindings: string[];
}

export interface ContractAttentionItem {
    id: string;
    kind: ContractAttentionKind;
    headline: string;
    contractName: string;
    contractSlug: string;
    vendor?: string;
    detail: string;
    metricLabel?: string;
    metricValue?: string;
    recommendedAction: string;
    severity: 'critical' | 'warning';
}

export interface ContractExecutiveKpis {
    totalContracts: number;
    expiringContracts: number;
    highRiskContracts: number;
    missingClauses: number;
    underReview: number;
    renewalsDueThisMonth: number;
    narrative: string;
}

export interface ContractRepositorySnapshot {
    active: number;
    underReview: number;
    expiringSoon: number;
    expired: number;
    recentlyUploaded: number;
    highRisk: number;
}

export interface ContractRenewalRow {
    id: string;
    contractName: string;
    contractSlug: string;
    vendor: string;
    expiryDate: string;
    renewalStatus: ContractRenewalStatus;
    riskLevel: ContractRiskLevel;
    suggestedAction: ContractRenewalAction;
    daysUntilExpiry: number;
}

export interface ContractRecommendedAction {
    id: string;
    title: string;
    contractSlug: string;
    impact: ContractActionImpact;
    priority: ContractActionPriority;
    confidence: number;
}

export interface ContractForecastPeriod {
    id: 'month' | 'next_month' | 'quarter';
    label: string;
    contractsExpiring: number;
    expectedReviews: number;
    riskEscalations: number;
    renewals?: number;
    contractUploads?: number;
    legalReviews?: number;
    contractVolume?: number;
    renewalLoad?: number;
    riskTrend: string;
}

export interface ClauseLibraryItem {
    id: string;
    name: string;
    category: ClauseCategory;
    usageCount: number;
    riskLevel: ContractRiskLevel;
}

export interface ContractComparisonHighlight {
    id: string;
    label: string;
    contractA: string;
    contractB: string;
    detail: string;
    tone: 'rose' | 'amber' | 'emerald' | 'slate';
}

export interface ContractExtractionSample {
    contractName: string;
    parties: string;
    effectiveDate: string;
    expiryDate: string;
    paymentTerms: string;
    slaTerms: string;
    terminationClause: string;
    penaltyClause: string;
    liabilityTerms: string;
    insuranceRequirements: string;
    renewalTerms: string;
    riskScore: number;
    findings: string[];
}

export const CONTRACT_TYPE_OPTIONS: ContractType[] = [
    'Sale Agreement',
    'Vendor Contract',
    'Lease Agreement',
    'Service Contract',
    'Procurement Contract',
];

export const CONTRACT_VENDOR_OPTIONS = [
    'MetroBuild Pvt Ltd',
    'Skyline Facilities',
    'GreenLeaf Procurement',
    'UrbanLease Partners',
    'Allied Services Co.',
    'Summit Legal Associates',
] as const;

const seedContracts: ContractRecord[] = [
    {
        id: 'ctr-001',
        contractId: 'CNT-2024-0892',
        slug: 'metrobuild-vendor-agreement',
        name: 'MetroBuild Vendor Agreement',
        vendor: 'MetroBuild Pvt Ltd',
        vendorSlug: 'metrobuild-pvt-ltd',
        type: 'Vendor Contract',
        startDate: '2024-01-15',
        expiryDate: '2026-04-30',
        status: 'Expiring',
        riskScore: 82,
        riskLevel: 'High',
        aiReviewStatus: 'Reviewed',
        aiRecommendation: 'Add termination clause immediately',
        priority: 'Critical',
        lastReview: '2026-03-10',
        owner: 'Legal Team',
        missingClauses: ['Termination Clause', 'Penalty Clause'],
        aiFindings: ['No termination clause', 'No penalty clause', 'Vendor liability unusually low'],
    },
    {
        id: 'ctr-002',
        contractId: 'CNT-2023-0441',
        slug: 'tower-b-lease-agreement',
        name: 'Tower B Lease Agreement',
        vendor: 'UrbanLease Partners',
        vendorSlug: 'urbanlease-partners',
        type: 'Lease Agreement',
        startDate: '2023-06-01',
        expiryDate: '2026-05-15',
        status: 'Expiring',
        riskScore: 74,
        riskLevel: 'High',
        aiReviewStatus: 'In Progress',
        aiRecommendation: 'Update liability coverage',
        priority: 'High',
        lastReview: '2026-03-18',
        owner: 'Compliance',
        missingClauses: ['Insurance Requirements'],
        aiFindings: ['Missing liability coverage', 'Insurance requirement missing'],
    },
    {
        id: 'ctr-003',
        contractId: 'CNT-2025-0118',
        slug: 'tower-a-lease-agreement',
        name: 'Tower A Lease Agreement',
        vendor: 'UrbanLease Partners',
        vendorSlug: 'urbanlease-partners',
        type: 'Lease Agreement',
        startDate: '2025-01-01',
        expiryDate: '2027-12-31',
        status: 'Active',
        riskScore: 38,
        riskLevel: 'Low',
        aiReviewStatus: 'Reviewed',
        aiRecommendation: 'Monitor renewal terms',
        priority: 'Medium',
        lastReview: '2026-02-20',
        owner: 'Legal Team',
        missingClauses: [],
        aiFindings: [],
    },
    {
        id: 'ctr-004',
        contractId: 'CNT-2024-0773',
        slug: 'facility-management-contract',
        name: 'Facility Management Contract',
        vendor: 'Skyline Facilities',
        vendorSlug: 'skyline-facilities',
        type: 'Service Contract',
        startDate: '2024-04-01',
        expiryDate: '2026-03-22',
        status: 'Expiring',
        riskScore: 58,
        riskLevel: 'Medium',
        aiReviewStatus: 'Pending',
        aiRecommendation: 'Renew or replace vendor',
        priority: 'High',
        lastReview: '2026-03-01',
        owner: 'Operations',
        missingClauses: [],
        aiFindings: ['SLA definition incomplete', 'Expires in 14 days'],
    },
    {
        id: 'ctr-005',
        contractId: 'CNT-2025-0330',
        slug: 'skyline-residency-sale-agreement',
        name: 'Skyline Residency Sale Agreement Template',
        vendor: 'Summit Legal Associates',
        vendorSlug: 'summit-legal-associates',
        type: 'Sale Agreement',
        startDate: '2025-02-01',
        expiryDate: '2028-02-01',
        status: 'Active',
        riskScore: 22,
        riskLevel: 'Low',
        aiReviewStatus: 'Reviewed',
        aiRecommendation: 'No action required',
        priority: 'Low',
        lastReview: '2026-01-15',
        owner: 'Sales Legal',
        missingClauses: [],
        aiFindings: [],
    },
    {
        id: 'ctr-006',
        contractId: 'CNT-2024-1205',
        slug: 'procurement-steel-supply',
        name: 'Procurement — Steel Supply Framework',
        vendor: 'GreenLeaf Procurement',
        vendorSlug: 'greenleaf-procurement',
        type: 'Procurement Contract',
        startDate: '2024-08-01',
        expiryDate: '2026-08-01',
        status: 'Under Review',
        riskScore: 61,
        riskLevel: 'Medium',
        aiReviewStatus: 'In Progress',
        aiRecommendation: 'Complete penalty clause review',
        priority: 'High',
        lastReview: '2026-03-20',
        owner: 'Procurement',
        missingClauses: ['Penalty Clause'],
        aiFindings: ['No penalty clause', 'Auto-renewal clause hidden'],
    },
    {
        id: 'ctr-007',
        contractId: 'CNT-2023-0991',
        slug: 'allied-services-maintenance',
        name: 'Allied Services — Annual Maintenance',
        vendor: 'Allied Services Co.',
        vendorSlug: 'allied-services-co',
        type: 'Service Contract',
        startDate: '2023-03-01',
        expiryDate: '2025-12-31',
        status: 'Expired',
        riskScore: 45,
        riskLevel: 'Medium',
        aiReviewStatus: 'Reviewed',
        aiRecommendation: 'Archive or renew',
        priority: 'Medium',
        lastReview: '2025-11-10',
        owner: 'Facilities',
        missingClauses: [],
        aiFindings: [],
    },
    {
        id: 'ctr-008',
        contractId: 'CNT-2025-0456',
        slug: 'metrobuild-phase-2',
        name: 'MetroBuild Phase 2 Construction',
        vendor: 'MetroBuild Pvt Ltd',
        vendorSlug: 'metrobuild-pvt-ltd',
        type: 'Vendor Contract',
        startDate: '2025-06-01',
        expiryDate: '2027-06-01',
        status: 'Under Review',
        riskScore: 68,
        riskLevel: 'Medium',
        aiReviewStatus: 'Not Started',
        aiRecommendation: 'Start AI review',
        priority: 'High',
        lastReview: '—',
        owner: 'Legal Team',
        missingClauses: ['Insurance Requirements', 'Termination Clause'],
        aiFindings: ['Insurance requirement missing'],
    },
    {
        id: 'ctr-009',
        contractId: 'CNT-2024-0550',
        slug: 'summit-woods-lease-template',
        name: 'Summit Woods Lease Template',
        vendor: 'UrbanLease Partners',
        vendorSlug: 'urbanlease-partners',
        type: 'Lease Agreement',
        startDate: '2024-01-01',
        expiryDate: '2026-06-30',
        status: 'Active',
        riskScore: 41,
        riskLevel: 'Low',
        aiReviewStatus: 'Reviewed',
        aiRecommendation: 'Standard template — OK',
        priority: 'Low',
        lastReview: '2026-02-05',
        owner: 'Legal Team',
        missingClauses: [],
        aiFindings: [],
    },
    {
        id: 'ctr-010',
        contractId: 'CNT-2025-0788',
        slug: 'security-services-contract',
        name: 'Security Services Contract',
        vendor: 'Allied Services Co.',
        vendorSlug: 'allied-services-co',
        type: 'Service Contract',
        startDate: '2025-09-01',
        expiryDate: '2026-09-01',
        status: 'Active',
        riskScore: 35,
        riskLevel: 'Low',
        aiReviewStatus: 'Reviewed',
        aiRecommendation: 'Renewal on track',
        priority: 'Low',
        lastReview: '2026-03-05',
        owner: 'Operations',
        missingClauses: [],
        aiFindings: [],
    },
];

const seedAttention: ContractAttentionItem[] = [
    {
        id: 'att-1',
        kind: 'high_risk_vendor',
        headline: 'High Risk Vendor Contract',
        contractName: 'MetroBuild Vendor Agreement',
        contractSlug: 'metrobuild-vendor-agreement',
        vendor: 'MetroBuild Pvt Ltd',
        detail: 'No termination clause — exposes company to indefinite vendor lock-in.',
        metricLabel: 'Risk',
        metricValue: 'No termination clause',
        recommendedAction: 'Immediate review',
        severity: 'critical',
    },
    {
        id: 'att-2',
        kind: 'lease_risk',
        headline: 'Lease Agreement Risk',
        contractName: 'Tower B Lease Agreement',
        contractSlug: 'tower-b-lease-agreement',
        detail: 'Liability coverage below portfolio standard for commercial lease.',
        metricLabel: 'Risk',
        metricValue: 'Missing liability coverage',
        recommendedAction: 'Update agreement',
        severity: 'critical',
    },
    {
        id: 'att-3',
        kind: 'service_expiry',
        headline: 'Service Contract Expiry',
        contractName: 'Facility Management Contract',
        contractSlug: 'facility-management-contract',
        vendor: 'Skyline Facilities',
        detail: 'Facility operations contract lapses without replacement vendor identified.',
        metricLabel: 'Expires in',
        metricValue: '14 Days',
        recommendedAction: 'Renew or replace vendor',
        severity: 'warning',
    },
];

const seedRenewals: ContractRenewalRow[] = [
    {
        id: 'ren-1',
        contractName: 'Facility Management Contract',
        contractSlug: 'facility-management-contract',
        vendor: 'Skyline Facilities',
        expiryDate: '2026-03-22',
        renewalStatus: 'Pending Approval',
        riskLevel: 'Medium',
        suggestedAction: 'Renew',
        daysUntilExpiry: 14,
    },
    {
        id: 'ren-2',
        contractName: 'MetroBuild Vendor Agreement',
        contractSlug: 'metrobuild-vendor-agreement',
        vendor: 'MetroBuild Pvt Ltd',
        expiryDate: '2026-04-30',
        renewalStatus: 'Not Started',
        riskLevel: 'High',
        suggestedAction: 'Renegotiate',
        daysUntilExpiry: 53,
    },
    {
        id: 'ren-3',
        contractName: 'Tower B Lease Agreement',
        contractSlug: 'tower-b-lease-agreement',
        vendor: 'UrbanLease Partners',
        expiryDate: '2026-05-15',
        renewalStatus: 'Pending Approval',
        riskLevel: 'High',
        suggestedAction: 'Renegotiate',
        daysUntilExpiry: 68,
    },
    {
        id: 'ren-4',
        contractName: 'Security Services Contract',
        contractSlug: 'security-services-contract',
        vendor: 'Allied Services Co.',
        expiryDate: '2026-09-01',
        renewalStatus: 'Auto Renewal',
        riskLevel: 'Low',
        suggestedAction: 'Renew',
        daysUntilExpiry: 177,
    },
];

const seedActions: ContractRecommendedAction[] = [
    {
        id: 'act-1',
        title: 'Review MetroBuild Contract',
        contractSlug: 'metrobuild-vendor-agreement',
        impact: 'High',
        priority: 'Critical',
        confidence: 96,
    },
    {
        id: 'act-2',
        title: 'Add Termination Clause',
        contractSlug: 'metrobuild-vendor-agreement',
        impact: 'Medium',
        priority: 'High',
        confidence: 91,
    },
    {
        id: 'act-3',
        title: 'Renew Tower A Lease Agreements',
        contractSlug: 'tower-a-lease-agreement',
        impact: 'High',
        priority: 'High',
        confidence: 94,
    },
    {
        id: 'act-4',
        title: 'Fix missing penalty clauses',
        contractSlug: 'procurement-steel-supply',
        impact: 'Medium',
        priority: 'High',
        confidence: 88,
    },
];

const seedClauses: ClauseLibraryItem[] = [
    { id: 'cl-1', name: 'Standard 30-Day Termination', category: 'Termination Clauses', usageCount: 142, riskLevel: 'Low' },
    { id: 'cl-2', name: 'Liquidated Damages — 2%', category: 'Penalty Clauses', usageCount: 89, riskLevel: 'Low' },
    { id: 'cl-3', name: '99.5% Uptime SLA', category: 'SLA Clauses', usageCount: 56, riskLevel: 'Medium' },
    { id: 'cl-4', name: 'Comprehensive Liability Cover', category: 'Insurance Clauses', usageCount: 73, riskLevel: 'Low' },
    { id: 'cl-5', name: 'Net-30 Payment Terms', category: 'Payment Clauses', usageCount: 201, riskLevel: 'Low' },
    { id: 'cl-6', name: 'Mutual Indemnification', category: 'Liability Clauses', usageCount: 67, riskLevel: 'Medium' },
    { id: 'cl-7', name: 'RERA Compliance Addendum', category: 'Compliance Clauses', usageCount: 38, riskLevel: 'Low' },
    { id: 'cl-8', name: 'NDA — 5 Year Term', category: 'Confidentiality Clauses', usageCount: 124, riskLevel: 'Low' },
];

const seedComparisonHighlights: ContractComparisonHighlight[] = [
    { id: 'cmp-1', label: 'Changed Clauses', contractA: 'MetroBuild Vendor Agreement', contractB: 'MetroBuild Phase 2', detail: 'Liability cap reduced from ₹50L to ₹25L', tone: 'amber' },
    { id: 'cmp-2', label: 'Missing Clauses', contractA: 'Tower A Lease', contractB: 'Tower B Lease', detail: 'Insurance requirements present in A, missing in B', tone: 'rose' },
    { id: 'cmp-3', label: 'Price Changes', contractA: 'Facility Management', contractB: 'Security Services', detail: 'Annual fee +12% vs prior term', tone: 'amber' },
    { id: 'cmp-4', label: 'New Risks Introduced', contractA: 'Procurement Steel', contractB: '—', detail: 'Hidden auto-renewal clause detected', tone: 'rose' },
    { id: 'cmp-5', label: 'Overall Risk Difference', contractA: 'MetroBuild Vendor', contractB: 'MetroBuild Phase 2', detail: '+18 points higher risk in Phase 2', tone: 'rose' },
];

export function getContractRecords(): ContractRecord[] {
    return [...seedContracts];
}

export function getContractBySlug(slug: string): ContractRecord | undefined {
    return seedContracts.find((c) => c.slug === slug);
}

export function getContractAttentionItems(): ContractAttentionItem[] {
    return [...seedAttention];
}

export function getContractExecutiveKpis(): ContractExecutiveKpis {
    return {
        totalContracts: 1248,
        expiringContracts: 86,
        highRiskContracts: 23,
        missingClauses: 41,
        underReview: 58,
        renewalsDueThisMonth: 32,
        narrative:
            'AI reviewed 1,248 contracts. 23 high-risk agreements require immediate legal attention. 86 contracts will expire within the next 60 days. 41 agreements are missing mandatory clauses.',
    };
}

export function getContractRepositorySnapshot(): ContractRepositorySnapshot {
    return {
        active: 892,
        underReview: 58,
        expiringSoon: 86,
        expired: 34,
        recentlyUploaded: 12,
        highRisk: 23,
    };
}

export function getContractRenewals(): ContractRenewalRow[] {
    return [...seedRenewals];
}

export function getContractRecommendedActions(): ContractRecommendedAction[] {
    return [...seedActions];
}

export function getContractForecasts(): ContractForecastPeriod[] {
    return [
        {
            id: 'month',
            label: 'This Month',
            contractsExpiring: 32,
            expectedReviews: 58,
            riskEscalations: 7,
            riskTrend: 'Elevated — 3 critical vendor contracts',
        },
        {
            id: 'next_month',
            label: 'Next Month',
            contractsExpiring: 28,
            expectedReviews: 45,
            riskEscalations: 4,
            renewals: 18,
            contractUploads: 22,
            legalReviews: 35,
            riskTrend: 'Stable with renewal load increasing',
        },
        {
            id: 'quarter',
            label: 'Quarter Forecast',
            contractsExpiring: 86,
            expectedReviews: 142,
            riskEscalations: 15,
            contractVolume: 156,
            renewalLoad: 64,
            riskTrend: 'Trending up — missing clause backlog',
        },
    ];
}

export function getClauseLibrary(): ClauseLibraryItem[] {
    return [...seedClauses];
}

export function getContractComparisonHighlights(): ContractComparisonHighlight[] {
    return [...seedComparisonHighlights];
}

export function getContractExtractionSample(): ContractExtractionSample {
    return {
        contractName: 'MetroBuild Vendor Agreement',
        parties: 'ARRIS Realty Pvt Ltd · MetroBuild Pvt Ltd',
        effectiveDate: '2024-01-15',
        expiryDate: '2026-04-30',
        paymentTerms: 'Net-45, milestone-based',
        slaTerms: 'Completion within 180 days per phase',
        terminationClause: 'Not found',
        penaltyClause: 'Not found',
        liabilityTerms: 'Capped at ₹25L — below standard',
        insuranceRequirements: 'Partial — workers comp only',
        renewalTerms: 'Auto-renewal unless 60-day notice',
        riskScore: 72,
        findings: [
            'No termination clause',
            'No penalty clause',
            'Insurance requirement missing',
            'Vendor liability capped unusually low',
        ],
    };
}

export function getRenewalTrackerCounts() {
    return {
        expiring30: 14,
        expiring60: 28,
        expiring90: 42,
        renewalsPendingApproval: 18,
        autoRenewals: 9,
    };
}
