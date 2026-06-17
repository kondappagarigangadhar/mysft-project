/**
 * Mock invoice intelligence — aligned with invoices and procurement.
 */

export type InvoiceIntelStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'Paid';
export type InvoiceIntelValidationStatus = 'Validated' | 'Needs Review' | 'Duplicate Suspect' | 'Fraud Alert';
export type InvoiceIntelRiskLevel = 'High' | 'Medium' | 'Low';
export type InvoiceIntelPaymentStatus = 'Due' | 'Overdue' | 'Blocked' | 'Paid' | 'Pending';
export type InvoiceActionPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type InvoiceActionImpact = 'High' | 'Medium' | 'Low';
export type PoMatchResult = 'Exact Match' | 'Partial Match' | 'Mismatch' | 'Missing Reference';

export interface InvoiceIntelRecord {
    id: string;
    slug: string;
    invoiceNumber: string;
    vendor: string;
    vendorSlug: string;
    poNumber: string;
    workOrderRef: string;
    invoiceAmount: number;
    poAmount: number;
    variance: number;
    variancePercent: number;
    status: InvoiceIntelStatus;
    validationStatus: InvoiceIntelValidationStatus;
    paymentStatus: InvoiceIntelPaymentStatus;
    riskScore: number;
    riskLevel: InvoiceIntelRiskLevel;
    duplicateScore: number;
    createdDate: string;
    dueDate: string;
    recommendedAction: string;
    priority: InvoiceActionPriority;
    gstNumber: string;
}

export interface InvoiceIntelExecutiveKpis {
    totalInvoices: number;
    pendingApproval: number;
    approved: number;
    rejected: number;
    duplicateSuspects: number;
    paymentsDue: number;
    narrative: string;
}

export interface InvoiceHealthSnapshot {
    validated: number;
    needsReview: number;
    duplicatesDetected: number;
    fraudAlerts: number;
    pendingApproval: number;
    paymentDue: number;
}

export interface InvoiceAttentionItem {
    id: string;
    headline: string;
    invoiceNumber?: string;
    vendor?: string;
    detail?: string;
    metricLabel?: string;
    metricValue?: string;
    recommendedAction: string;
    invoiceSlug: string;
    severity: 'critical' | 'warning';
}

export interface InvoiceExtractionSample {
    vendorName: string;
    invoiceNumber: string;
    invoiceDate: string;
    gstNumber: string;
    taxAmount: number;
    subtotal: number;
    totalAmount: number;
    paymentTerms: string;
    poReference: string;
    workOrderReference: string;
    invoiceAmount: number;
    poAmount: number;
    variance: number;
    validationStatus: string;
}

export interface PoMatchHighlight {
    id: string;
    invoiceNumber: string;
    poNumber: string;
    workOrderRef: string;
    vendor: string;
    matchResult: PoMatchResult;
    poAmount: number;
    invoiceAmount: number;
    variancePercent: number;
    recommendation: string;
}

export interface DuplicateSuspectRow {
    id: string;
    invoiceNumber: string;
    possibleMatch: string;
    vendor: string;
    amount: number;
    confidence: number;
    status: string;
    recommendedAction: string;
    invoiceSlug: string;
}

export interface FraudRiskCategory {
    id: string;
    label: string;
    count: number;
}

export interface FraudAlertRow {
    id: string;
    vendor: string;
    invoiceNumber: string;
    issue: string;
    risk: InvoiceIntelRiskLevel;
    action: string;
    invoiceSlug: string;
}

export interface PaymentDueRow {
    id: string;
    vendor: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    status: InvoiceIntelPaymentStatus;
    priority: InvoiceActionPriority;
    recommendedAction: string;
    invoiceSlug: string;
}

export interface InvoiceRecommendedAction {
    id: string;
    title: string;
    invoiceSlug: string;
    impact: InvoiceActionImpact;
    priority: InvoiceActionPriority;
    confidence: number;
}

export interface InvoiceForecastPeriod {
    id: 'week' | 'month' | 'quarter';
    label: string;
    awaitingApproval?: number;
    expectedPayments?: number;
    fraudReviews?: number;
    invoiceVolume?: number;
    paymentVolume?: number;
    duplicateCases?: number;
    approvalLoad?: number;
    invoiceGrowth?: number;
    vendorBillingTrends?: string;
    paymentForecast?: string;
    riskTrend: string;
}

export const INVOICE_VENDOR_OPTIONS = [
    'MetroBuild Materials',
    'Southline Electricals',
    'Urban Facility Services',
    'Prime Maintenance',
    'SecureGuard Solutions',
    'Flowline Plumbing',
    'BuildCore Civil Works',
    'CoolAir Mechanical',
] as const;

const seedInvoices: InvoiceIntelRecord[] = [
    {
        id: 'inv-001',
        slug: 'inv-1001',
        invoiceNumber: 'INV-1001',
        vendor: 'MetroBuild Materials',
        vendorSlug: 'metrobuild-materials',
        poNumber: 'PO-2026-0142',
        workOrderRef: 'WO-8841',
        invoiceAmount: 450000,
        poAmount: 425000,
        variance: 25000,
        variancePercent: 5.9,
        status: 'Pending Approval',
        validationStatus: 'Needs Review',
        paymentStatus: 'Pending',
        riskScore: 78,
        riskLevel: 'High',
        duplicateScore: 12,
        createdDate: '2026-03-01',
        dueDate: '2026-03-31',
        recommendedAction: 'Review variance',
        priority: 'Critical',
        gstNumber: '27AABCM1234F1Z5',
    },
    {
        id: 'inv-002',
        slug: 'inv-1001-a',
        invoiceNumber: 'INV-1001-A',
        vendor: 'MetroBuild Materials',
        vendorSlug: 'metrobuild-materials',
        poNumber: 'PO-2026-0142',
        workOrderRef: 'WO-8841',
        invoiceAmount: 450000,
        poAmount: 425000,
        variance: 25000,
        variancePercent: 5.9,
        status: 'Pending Approval',
        validationStatus: 'Duplicate Suspect',
        paymentStatus: 'Blocked',
        riskScore: 94,
        riskLevel: 'High',
        duplicateScore: 94,
        createdDate: '2026-03-02',
        dueDate: '2026-03-31',
        recommendedAction: 'Block duplicate',
        priority: 'Critical',
        gstNumber: '27AABCM1234F1Z5',
    },
    {
        id: 'inv-003',
        slug: 'inv-2048',
        invoiceNumber: 'INV-2048',
        vendor: 'Southline Electricals',
        vendorSlug: 'southline-electricals',
        poNumber: 'PO-2026-0098',
        workOrderRef: 'WO-7720',
        invoiceAmount: 1250000,
        poAmount: 1250000,
        variance: 0,
        variancePercent: 0,
        status: 'Pending Approval',
        validationStatus: 'Needs Review',
        paymentStatus: 'Due',
        riskScore: 72,
        riskLevel: 'High',
        duplicateScore: 8,
        createdDate: '2026-02-28',
        dueDate: '2026-03-15',
        recommendedAction: 'Escalate approval',
        priority: 'Critical',
        gstNumber: 'Not found',
    },
    {
        id: 'inv-004',
        slug: 'inv-3012',
        invoiceNumber: 'INV-3012',
        vendor: 'Urban Facility Services',
        vendorSlug: 'urban-facility-services',
        poNumber: 'PO-2026-0201',
        workOrderRef: 'WO-9102',
        invoiceAmount: 186500,
        poAmount: 186500,
        variance: 0,
        variancePercent: 0,
        status: 'Approved',
        validationStatus: 'Validated',
        paymentStatus: 'Due',
        riskScore: 22,
        riskLevel: 'Low',
        duplicateScore: 0,
        createdDate: '2026-02-20',
        dueDate: '2026-03-20',
        recommendedAction: 'Release payment',
        priority: 'High',
        gstNumber: '07AAACU9012H1Z8',
    },
    {
        id: 'inv-005',
        slug: 'inv-4156',
        invoiceNumber: 'INV-4156',
        vendor: 'Prime Maintenance',
        vendorSlug: 'prime-maintenance',
        poNumber: 'PO-2026-0115',
        workOrderRef: 'WO-8055',
        invoiceAmount: 92000,
        poAmount: 98000,
        variance: -6000,
        variancePercent: -6.1,
        status: 'Rejected',
        validationStatus: 'Fraud Alert',
        paymentStatus: 'Blocked',
        riskScore: 88,
        riskLevel: 'High',
        duplicateScore: 45,
        createdDate: '2026-02-15',
        dueDate: '2026-03-15',
        recommendedAction: 'Investigate fraud',
        priority: 'Critical',
        gstNumber: '24AABCP4567K1Z3',
    },
    {
        id: 'inv-006',
        slug: 'inv-5200',
        invoiceNumber: 'INV-5200',
        vendor: 'SecureGuard Solutions',
        vendorSlug: 'secureguard-solutions',
        poNumber: 'PO-2026-0188',
        workOrderRef: 'WO-9401',
        invoiceAmount: 245000,
        poAmount: 245000,
        variance: 0,
        variancePercent: 0,
        status: 'Paid',
        validationStatus: 'Validated',
        paymentStatus: 'Paid',
        riskScore: 15,
        riskLevel: 'Low',
        duplicateScore: 0,
        createdDate: '2026-01-28',
        dueDate: '2026-02-28',
        recommendedAction: 'No action',
        priority: 'Low',
        gstNumber: '33AABCS7890L1Z1',
    },
    {
        id: 'inv-007',
        slug: 'inv-6088',
        invoiceNumber: 'INV-6088',
        vendor: 'Flowline Plumbing',
        vendorSlug: 'flowline-plumbing',
        poNumber: 'PO-2026-0220',
        workOrderRef: 'WO-9580',
        invoiceAmount: 67800,
        poAmount: 65000,
        variance: 2800,
        variancePercent: 4.3,
        status: 'Pending Approval',
        validationStatus: 'Needs Review',
        paymentStatus: 'Pending',
        riskScore: 48,
        riskLevel: 'Medium',
        duplicateScore: 5,
        createdDate: '2026-03-03',
        dueDate: '2026-04-03',
        recommendedAction: 'Validate PO match',
        priority: 'Medium',
        gstNumber: '36AABCF2345M1Z6',
    },
    {
        id: 'inv-008',
        slug: 'inv-7120',
        invoiceNumber: 'INV-7120',
        vendor: 'BuildCore Civil Works',
        vendorSlug: 'buildcore-civil',
        poNumber: 'PO-2026-0160',
        workOrderRef: 'WO-8900',
        invoiceAmount: 890000,
        poAmount: 890000,
        variance: 0,
        variancePercent: 0,
        status: 'Approved',
        validationStatus: 'Validated',
        paymentStatus: 'Due',
        riskScore: 28,
        riskLevel: 'Low',
        duplicateScore: 0,
        createdDate: '2026-02-25',
        dueDate: '2026-03-25',
        recommendedAction: 'Schedule payment',
        priority: 'High',
        gstNumber: '19AABCB6789N1Z4',
    },
];

const seedAttention: InvoiceAttentionItem[] = [
    {
        id: 'att-1',
        headline: 'Invoice Exceeds PO Value',
        invoiceNumber: 'INV-1001',
        metricLabel: 'Variance',
        metricValue: '₹25,000',
        recommendedAction: 'Review immediately',
        invoiceSlug: 'inv-1001',
        severity: 'critical',
    },
    {
        id: 'att-2',
        headline: 'Duplicate Invoice Suspected',
        invoiceNumber: 'INV-1001-A',
        metricLabel: 'Confidence',
        metricValue: '94%',
        recommendedAction: 'Block approval',
        invoiceSlug: 'inv-1001-a',
        severity: 'critical',
    },
    {
        id: 'att-3',
        headline: 'Missing GST Details',
        vendor: 'MetroBuild Materials',
        recommendedAction: 'Verify before payment',
        invoiceSlug: 'inv-2048',
        severity: 'warning',
    },
    {
        id: 'att-4',
        headline: 'High Value Invoice Pending',
        metricLabel: 'Amount',
        metricValue: '₹12,50,000',
        detail: 'Approval overdue',
        recommendedAction: 'Escalate',
        invoiceSlug: 'inv-2048',
        severity: 'critical',
    },
];

const seedPoMatches: PoMatchHighlight[] = [
    {
        id: 'pm-1',
        invoiceNumber: 'INV-1001',
        poNumber: 'PO-2026-0142',
        workOrderRef: 'WO-8841',
        vendor: 'MetroBuild Materials',
        matchResult: 'Mismatch',
        poAmount: 425000,
        invoiceAmount: 450000,
        variancePercent: 5.9,
        recommendation: 'Review variance before approval',
    },
    {
        id: 'pm-2',
        invoiceNumber: 'INV-3012',
        poNumber: 'PO-2026-0201',
        workOrderRef: 'WO-9102',
        vendor: 'Urban Facility Services',
        matchResult: 'Exact Match',
        poAmount: 186500,
        invoiceAmount: 186500,
        variancePercent: 0,
        recommendation: 'Approve for payment',
    },
    {
        id: 'pm-3',
        invoiceNumber: 'INV-6088',
        poNumber: 'PO-2026-0220',
        workOrderRef: 'WO-9580',
        vendor: 'Flowline Plumbing',
        matchResult: 'Partial Match',
        poAmount: 65000,
        invoiceAmount: 67800,
        variancePercent: 4.3,
        recommendation: 'Request vendor clarification',
    },
];

const seedDuplicates: DuplicateSuspectRow[] = [
    {
        id: 'dup-1',
        invoiceNumber: 'INV-1001',
        possibleMatch: 'INV-1001-A',
        vendor: 'MetroBuild Materials',
        amount: 450000,
        confidence: 94,
        status: 'Under Review',
        recommendedAction: 'Block Duplicate',
        invoiceSlug: 'inv-1001-a',
    },
    {
        id: 'dup-2',
        invoiceNumber: 'INV-4156',
        possibleMatch: 'INV-4150',
        vendor: 'Prime Maintenance',
        amount: 92000,
        confidence: 78,
        status: 'Flagged',
        recommendedAction: 'Investigate',
        invoiceSlug: 'inv-4156',
    },
];

const seedFraudCategories: FraudRiskCategory[] = [
    { id: 'fc-1', label: 'Duplicate Invoices', count: 18 },
    { id: 'fc-2', label: 'Suspicious Amounts', count: 11 },
    { id: 'fc-3', label: 'Missing GST', count: 9 },
    { id: 'fc-4', label: 'Repeated Billing', count: 7 },
    { id: 'fc-5', label: 'Fake Vendor Patterns', count: 3 },
    { id: 'fc-6', label: 'Invoice Splitting', count: 5 },
    { id: 'fc-7', label: 'Abnormal Frequency', count: 8 },
    { id: 'fc-8', label: 'High-Risk Vendors', count: 12 },
];

const seedFraudAlerts: FraudAlertRow[] = [
    {
        id: 'fa-1',
        vendor: 'MetroBuild Materials',
        invoiceNumber: 'INV-1001-A',
        issue: 'Duplicate invoice pattern',
        risk: 'High',
        action: 'Block approval',
        invoiceSlug: 'inv-1001-a',
    },
    {
        id: 'fa-2',
        vendor: 'Prime Maintenance',
        invoiceNumber: 'INV-4156',
        issue: 'Repeated billing anomaly',
        risk: 'High',
        action: 'Investigate vendor',
        invoiceSlug: 'inv-4156',
    },
    {
        id: 'fa-3',
        vendor: 'Southline Electricals',
        invoiceNumber: 'INV-2048',
        issue: 'Missing GST on high-value invoice',
        risk: 'Medium',
        action: 'Request GST details',
        invoiceSlug: 'inv-2048',
    },
];

const seedPayments: PaymentDueRow[] = [
    {
        id: 'pay-1',
        vendor: 'Urban Facility Services',
        invoiceNumber: 'INV-3012',
        amount: 186500,
        dueDate: '2026-03-20',
        status: 'Due',
        priority: 'High',
        recommendedAction: 'Release payment',
        invoiceSlug: 'inv-3012',
    },
    {
        id: 'pay-2',
        vendor: 'BuildCore Civil Works',
        invoiceNumber: 'INV-7120',
        amount: 890000,
        dueDate: '2026-03-25',
        status: 'Due',
        priority: 'High',
        recommendedAction: 'Schedule payment',
        invoiceSlug: 'inv-7120',
    },
    {
        id: 'pay-3',
        vendor: 'Southline Electricals',
        invoiceNumber: 'INV-2048',
        amount: 1250000,
        dueDate: '2026-03-15',
        status: 'Overdue',
        priority: 'Critical',
        recommendedAction: 'Escalate approval',
        invoiceSlug: 'inv-2048',
    },
];

const seedActions: InvoiceRecommendedAction[] = [
    {
        id: 'act-1',
        title: 'Review Invoice Variance',
        invoiceSlug: 'inv-1001',
        impact: 'High',
        priority: 'Critical',
        confidence: 97,
    },
    {
        id: 'act-2',
        title: 'Investigate Duplicate Invoice',
        invoiceSlug: 'inv-1001-a',
        impact: 'High',
        priority: 'Critical',
        confidence: 95,
    },
    {
        id: 'act-3',
        title: 'Release Approved Payment',
        invoiceSlug: 'inv-3012',
        impact: 'Medium',
        priority: 'High',
        confidence: 91,
    },
    {
        id: 'act-4',
        title: 'Verify GST Information',
        invoiceSlug: 'inv-2048',
        impact: 'Medium',
        priority: 'Medium',
        confidence: 88,
    },
];

export function getInvoiceIntelRecords(): InvoiceIntelRecord[] {
    return [...seedInvoices];
}

export function getInvoiceIntelBySlug(slug: string): InvoiceIntelRecord | undefined {
    return seedInvoices.find((inv) => inv.slug === slug);
}

export function getInvoiceIntelExecutiveKpis(): InvoiceIntelExecutiveKpis {
    return {
        totalInvoices: 2146,
        pendingApproval: 47,
        approved: 1820,
        rejected: 36,
        duplicateSuspects: 18,
        paymentsDue: 124,
        narrative:
            '2,146 invoices analyzed. 47 invoices require validation review. 18 duplicate invoice suspects detected. ₹1.8 Cr payments due in the next 30 days.',
    };
}

export function getInvoiceHealthSnapshot(): InvoiceHealthSnapshot {
    return {
        validated: 1820,
        needsReview: 47,
        duplicatesDetected: 18,
        fraudAlerts: 11,
        pendingApproval: 47,
        paymentDue: 124,
    };
}

export function getInvoiceAttentionItems(): InvoiceAttentionItem[] {
    return [...seedAttention];
}

export function getInvoiceExtractionSample(): InvoiceExtractionSample {
    return {
        vendorName: 'MetroBuild Materials',
        invoiceNumber: 'INV-1001',
        invoiceDate: '2026-03-01',
        gstNumber: '27AABCM1234F1Z5',
        taxAmount: 68400,
        subtotal: 381600,
        totalAmount: 450000,
        paymentTerms: 'Net-30',
        poReference: 'PO-2026-0142',
        workOrderReference: 'WO-8841',
        invoiceAmount: 450000,
        poAmount: 425000,
        variance: 25000,
        validationStatus: 'Needs Review',
    };
}

export function getPoMatchHighlights(): PoMatchHighlight[] {
    return [...seedPoMatches];
}

export function getDuplicateSuspects(): DuplicateSuspectRow[] {
    return [...seedDuplicates];
}

export function getFraudRiskCategories(): FraudRiskCategory[] {
    return [...seedFraudCategories];
}

export function getFraudAlerts(): FraudAlertRow[] {
    return [...seedFraudAlerts];
}

export function getPaymentDueRows(): PaymentDueRow[] {
    return [...seedPayments];
}

export function getPaymentTrackerCounts() {
    return {
        dueThisWeek: 28,
        dueThisMonth: 124,
        overdue: 14,
        blocked: 8,
        pendingApprovals: 47,
    };
}

export function getInvoiceRecommendedActions(): InvoiceRecommendedAction[] {
    return [...seedActions];
}

export function getInvoiceForecasts(): InvoiceForecastPeriod[] {
    return [
        {
            id: 'week',
            label: 'This Week',
            awaitingApproval: 18,
            expectedPayments: 28,
            fraudReviews: 6,
            riskTrend: 'Elevated — duplicate cluster under review',
        },
        {
            id: 'month',
            label: 'This Month',
            invoiceVolume: 2146,
            paymentVolume: 18400000,
            duplicateCases: 18,
            approvalLoad: 47,
            riskTrend: 'Moderate — GST gaps on 9 invoices',
        },
        {
            id: 'quarter',
            label: 'Quarter Forecast',
            invoiceGrowth: 12,
            vendorBillingTrends: 'Civil & electrical vendors billing up 8%',
            paymentForecast: '₹5.2 Cr expected outflow',
            riskTrend: 'Trending up — fraud alerts in maintenance category',
        },
    ];
}
