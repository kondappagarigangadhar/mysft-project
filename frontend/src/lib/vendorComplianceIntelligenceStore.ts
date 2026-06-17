/**
 * Mock vendor compliance intelligence — aligned with procurement and vendor management.
 */

export type VendorCategory =
    | 'Electrical'
    | 'Plumbing'
    | 'Civil'
    | 'Security'
    | 'Housekeeping'
    | 'Mechanical';

export type VendorComplianceStatus = 'Compliant' | 'Non-Compliant' | 'Under Review';
export type VendorComplianceRiskLevel = 'High' | 'Medium' | 'Low';
export type VendorKycStatus = 'Verified' | 'Pending' | 'Expired' | 'Missing';
export type VendorDocStatus = 'Verified' | 'Pending' | 'Expired' | 'Missing';
export type VendorActionPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type VendorActionImpact = 'High' | 'Medium' | 'Low';

export interface VendorComplianceRecord {
    id: string;
    slug: string;
    name: string;
    category: VendorCategory;
    complianceStatus: VendorComplianceStatus;
    compliancePercent: number;
    riskScore: number;
    riskLevel: VendorComplianceRiskLevel;
    kycStatus: VendorKycStatus;
    insuranceStatus: VendorDocStatus;
    licenseStatus: VendorDocStatus;
    missingDocuments: number;
    expiringDocuments: number;
    lastVerified: string;
    recommendedAction: string;
    priority: VendorActionPriority;
    gstNumber: string;
    panNumber: string;
    address: string;
    contactPerson: string;
    phone: string;
    email: string;
    registrationDate: string;
}

export interface VendorComplianceExecutiveKpis {
    activeVendors: number;
    compliantVendors: number;
    nonCompliantVendors: number;
    expiredDocuments: number;
    upcomingExpirations: number;
    highRiskVendors: number;
    narrative: string;
}

export interface VendorComplianceHealthSnapshot {
    fullyCompliant: number;
    pendingVerification: number;
    missingDocuments: number;
    expiringSoon: number;
    highRiskVendors: number;
    blockedVendors: number;
}

export interface VendorComplianceAttentionItem {
    id: string;
    headline: string;
    vendorName: string;
    vendorSlug: string;
    detail?: string;
    metricLabel?: string;
    metricValue?: string;
    recommendedAction: string;
    severity: 'critical' | 'warning';
}

export interface VendorComplianceDocument {
    id: string;
    name: string;
    status: VendorDocStatus;
}

export interface VendorKycProfile {
    vendorSlug: string;
    vendorName: string;
    gstNumber: string;
    panNumber: string;
    address: string;
    contactPerson: string;
    phone: string;
    email: string;
    registrationDate: string;
    category: VendorCategory;
    documents: VendorComplianceDocument[];
}

export interface VendorValidationFinding {
    id: string;
    label: string;
    status: 'pass' | 'warn' | 'fail';
    detail: string;
}

export interface VendorRiskFactor {
    id: string;
    label: string;
    count: number;
}

export interface VendorHighRiskRow {
    id: string;
    vendorName: string;
    vendorSlug: string;
    category: VendorCategory;
    riskScore: number;
    primaryRisk: string;
    recommendedAction: string;
}

export interface VendorExpiryRow {
    id: string;
    vendorName: string;
    vendorSlug: string;
    documentType: string;
    expiryDate: string;
    daysRemaining: number;
    priority: VendorActionPriority;
    suggestedAction: string;
}

export interface VendorComplianceRecommendedAction {
    id: string;
    title: string;
    vendorSlug: string;
    impact: VendorActionImpact;
    priority: VendorActionPriority;
    confidence: number;
}

export interface VendorComplianceForecastPeriod {
    id: 'month' | 'next_month' | 'quarter';
    label: string;
    expectedVerifications?: number;
    upcomingExpirations?: number;
    complianceReviews?: number;
    renewalsDue?: number;
    vendorReviews?: number;
    complianceAudits?: number;
    vendorGrowth?: number;
    complianceLoad?: number;
    riskTrend: string;
}

export interface VendorCategoryPerformance {
    id: string;
    category: VendorCategory;
    vendorCount: number;
    compliancePercent: number;
    riskPercent: number;
    expiringDocuments: number;
}

export const VENDOR_CATEGORY_OPTIONS: VendorCategory[] = [
    'Electrical',
    'Plumbing',
    'Civil',
    'Security',
    'Housekeeping',
    'Mechanical',
];

const seedVendors: VendorComplianceRecord[] = [
    {
        id: 'vc-001',
        slug: 'metrobuild-materials',
        name: 'MetroBuild Materials',
        category: 'Civil',
        complianceStatus: 'Non-Compliant',
        compliancePercent: 62,
        riskScore: 85,
        riskLevel: 'High',
        kycStatus: 'Verified',
        insuranceStatus: 'Expired',
        licenseStatus: 'Verified',
        missingDocuments: 2,
        expiringDocuments: 1,
        lastVerified: '2026-02-18',
        recommendedAction: 'Request insurance renewal',
        priority: 'Critical',
        gstNumber: '27AABCM1234F1Z5',
        panNumber: 'AABCM1234F',
        address: 'Plot 12, MIDC, Pune',
        contactPerson: 'Rahul Mehta',
        phone: '+91 98765 43210',
        email: 'rahul@metrobuild.in',
        registrationDate: '2022-04-10',
    },
    {
        id: 'vc-002',
        slug: 'southline-electricals',
        name: 'Southline Electricals',
        category: 'Electrical',
        complianceStatus: 'Non-Compliant',
        compliancePercent: 58,
        riskScore: 78,
        riskLevel: 'High',
        kycStatus: 'Pending',
        insuranceStatus: 'Verified',
        licenseStatus: 'Missing',
        missingDocuments: 3,
        expiringDocuments: 0,
        lastVerified: '2026-01-22',
        recommendedAction: 'Block new work orders',
        priority: 'Critical',
        gstNumber: '29AADCS5678G1Z2',
        panNumber: 'AADCS5678G',
        address: 'Sector 5, Whitefield, Bengaluru',
        contactPerson: 'Anita Desai',
        phone: '+91 99887 76655',
        email: 'anita@southline.co.in',
        registrationDate: '2021-09-15',
    },
    {
        id: 'vc-003',
        slug: 'urban-facility-services',
        name: 'Urban Facility Services',
        category: 'Housekeeping',
        complianceStatus: 'Under Review',
        compliancePercent: 71,
        riskScore: 64,
        riskLevel: 'Medium',
        kycStatus: 'Verified',
        insuranceStatus: 'Verified',
        licenseStatus: 'Pending',
        missingDocuments: 1,
        expiringDocuments: 2,
        lastVerified: '2026-03-01',
        recommendedAction: 'Request GST certificate',
        priority: 'High',
        gstNumber: '07AAACU9012H1Z8',
        panNumber: 'AAACU9012H',
        address: 'Connaught Place, New Delhi',
        contactPerson: 'Vikram Singh',
        phone: '+91 98112 33445',
        email: 'vikram@urbanfacility.com',
        registrationDate: '2023-02-20',
    },
    {
        id: 'vc-004',
        slug: 'prime-maintenance',
        name: 'Prime Maintenance',
        category: 'Mechanical',
        complianceStatus: 'Non-Compliant',
        compliancePercent: 54,
        riskScore: 82,
        riskLevel: 'High',
        kycStatus: 'Verified',
        insuranceStatus: 'Verified',
        licenseStatus: 'Expired',
        missingDocuments: 2,
        expiringDocuments: 1,
        lastVerified: '2025-12-08',
        recommendedAction: 'Suspend vendor approval',
        priority: 'Critical',
        gstNumber: '24AABCP4567K1Z3',
        panNumber: 'AABCP4567K',
        address: 'GIDC, Ahmedabad',
        contactPerson: 'Kiran Patel',
        phone: '+91 98250 11223',
        email: 'kiran@primemaint.in',
        registrationDate: '2020-11-05',
    },
    {
        id: 'vc-005',
        slug: 'secureguard-solutions',
        name: 'SecureGuard Solutions',
        category: 'Security',
        complianceStatus: 'Compliant',
        compliancePercent: 94,
        riskScore: 28,
        riskLevel: 'Low',
        kycStatus: 'Verified',
        insuranceStatus: 'Verified',
        licenseStatus: 'Verified',
        missingDocuments: 0,
        expiringDocuments: 1,
        lastVerified: '2026-03-05',
        recommendedAction: 'Schedule annual review',
        priority: 'Low',
        gstNumber: '33AABCS7890L1Z1',
        panNumber: 'AABCS7890L',
        address: 'OMR, Chennai',
        contactPerson: 'Deepak Nair',
        phone: '+91 94440 55667',
        email: 'deepak@secureguard.in',
        registrationDate: '2019-06-12',
    },
    {
        id: 'vc-006',
        slug: 'flowline-plumbing',
        name: 'Flowline Plumbing',
        category: 'Plumbing',
        complianceStatus: 'Compliant',
        compliancePercent: 88,
        riskScore: 35,
        riskLevel: 'Low',
        kycStatus: 'Verified',
        insuranceStatus: 'Verified',
        licenseStatus: 'Verified',
        missingDocuments: 0,
        expiringDocuments: 0,
        lastVerified: '2026-02-28',
        recommendedAction: 'No action required',
        priority: 'Low',
        gstNumber: '36AABCF2345M1Z6',
        panNumber: 'AABCF2345M',
        address: 'HITEC City, Hyderabad',
        contactPerson: 'Sandeep Rao',
        phone: '+91 97000 88991',
        email: 'sandeep@flowline.in',
        registrationDate: '2022-08-30',
    },
    {
        id: 'vc-007',
        slug: 'buildcore-civil',
        name: 'BuildCore Civil Works',
        category: 'Civil',
        complianceStatus: 'Under Review',
        compliancePercent: 76,
        riskScore: 52,
        riskLevel: 'Medium',
        kycStatus: 'Pending',
        insuranceStatus: 'Pending',
        licenseStatus: 'Verified',
        missingDocuments: 1,
        expiringDocuments: 2,
        lastVerified: '2026-02-10',
        recommendedAction: 'Complete KYC verification',
        priority: 'Medium',
        gstNumber: '19AABCB6789N1Z4',
        panNumber: 'AABCB6789N',
        address: 'Salt Lake, Kolkata',
        contactPerson: 'Arjun Banerjee',
        phone: '+91 98300 44556',
        email: 'arjun@buildcore.in',
        registrationDate: '2021-03-18',
    },
    {
        id: 'vc-008',
        slug: 'coolair-mechanical',
        name: 'CoolAir Mechanical',
        category: 'Mechanical',
        complianceStatus: 'Compliant',
        compliancePercent: 91,
        riskScore: 31,
        riskLevel: 'Low',
        kycStatus: 'Verified',
        insuranceStatus: 'Verified',
        licenseStatus: 'Verified',
        missingDocuments: 0,
        expiringDocuments: 1,
        lastVerified: '2026-03-02',
        recommendedAction: 'Monitor insurance expiry',
        priority: 'Medium',
        gstNumber: '09AABCC3456P1Z7',
        panNumber: 'AABCC3456P',
        address: 'Noida Sector 62',
        contactPerson: 'Meera Joshi',
        phone: '+91 98100 22334',
        email: 'meera@coolair.in',
        registrationDate: '2020-05-22',
    },
];

const seedAttention: VendorComplianceAttentionItem[] = [
    {
        id: 'att-1',
        headline: 'Insurance Expiring',
        vendorName: 'MetroBuild Materials',
        vendorSlug: 'metrobuild-materials',
        metricLabel: 'Expires',
        metricValue: '21 Days',
        recommendedAction: 'Request renewal',
        severity: 'critical',
    },
    {
        id: 'att-2',
        headline: 'Trade License Missing',
        vendorName: 'Southline Electricals',
        vendorSlug: 'southline-electricals',
        recommendedAction: 'Block new work orders',
        severity: 'critical',
    },
    {
        id: 'att-3',
        headline: 'GST Certificate Missing',
        vendorName: 'Urban Facility Services',
        vendorSlug: 'urban-facility-services',
        recommendedAction: 'Request compliance documents',
        severity: 'warning',
    },
    {
        id: 'att-4',
        headline: 'Labor License Expired',
        vendorName: 'Prime Maintenance',
        vendorSlug: 'prime-maintenance',
        recommendedAction: 'Suspend vendor approval',
        severity: 'critical',
    },
];

const seedKycDocuments: VendorComplianceDocument[] = [
    { id: 'doc-1', name: 'GST Certificate', status: 'Verified' },
    { id: 'doc-2', name: 'Trade License', status: 'Missing' },
    { id: 'doc-3', name: 'Insurance Certificate', status: 'Expired' },
    { id: 'doc-4', name: 'Labor License', status: 'Expired' },
    { id: 'doc-5', name: 'MSME Certificate', status: 'Verified' },
    { id: 'doc-6', name: 'Bank Verification', status: 'Verified' },
    { id: 'doc-7', name: 'PAN Card', status: 'Verified' },
    { id: 'doc-8', name: 'Address Proof', status: 'Pending' },
    { id: 'doc-9', name: 'Agreement Copy', status: 'Verified' },
];

const seedValidationFindings: VendorValidationFinding[] = [
    { id: 'vf-1', label: 'GST Verification', status: 'pass', detail: 'GST Valid ✓' },
    { id: 'vf-2', label: 'Insurance Validity', status: 'warn', detail: 'Insurance expires in 21 days ⚠' },
    { id: 'vf-3', label: 'Trade License', status: 'fail', detail: 'Trade License Missing ❌' },
    { id: 'vf-4', label: 'Labor License', status: 'fail', detail: 'Labor License Expired ❌' },
    { id: 'vf-5', label: 'PAN Verification', status: 'pass', detail: 'PAN Verified ✓' },
    { id: 'vf-6', label: 'MSME Verification', status: 'pass', detail: 'MSME Certificate Verified ✓' },
];

const seedRiskFactors: VendorRiskFactor[] = [
    { id: 'rf-1', label: 'Missing Documents', count: 41 },
    { id: 'rf-2', label: 'Expired Licenses', count: 18 },
    { id: 'rf-3', label: 'Poor SLA Performance', count: 12 },
    { id: 'rf-4', label: 'Delayed Work Orders', count: 9 },
    { id: 'rf-5', label: 'Contract Violations', count: 7 },
    { id: 'rf-6', label: 'Repeated Compliance Issues', count: 14 },
    { id: 'rf-7', label: 'Insurance Gaps', count: 22 },
    { id: 'rf-8', label: 'Payment Disputes', count: 5 },
];

const seedExpiryRows: VendorExpiryRow[] = [
    {
        id: 'exp-1',
        vendorName: 'MetroBuild Materials',
        vendorSlug: 'metrobuild-materials',
        documentType: 'Insurance Certificate',
        expiryDate: '2026-03-29',
        daysRemaining: 21,
        priority: 'Critical',
        suggestedAction: 'Renew',
    },
    {
        id: 'exp-2',
        vendorName: 'Prime Maintenance',
        vendorSlug: 'prime-maintenance',
        documentType: 'Labor License',
        expiryDate: '2026-02-15',
        daysRemaining: -22,
        priority: 'Critical',
        suggestedAction: 'Suspend Vendor',
    },
    {
        id: 'exp-3',
        vendorName: 'Urban Facility Services',
        vendorSlug: 'urban-facility-services',
        documentType: 'GST Certificate',
        expiryDate: '2026-04-12',
        daysRemaining: 35,
        priority: 'High',
        suggestedAction: 'Request Update',
    },
    {
        id: 'exp-4',
        vendorName: 'CoolAir Mechanical',
        vendorSlug: 'coolair-mechanical',
        documentType: 'Insurance Certificate',
        expiryDate: '2026-05-01',
        daysRemaining: 54,
        priority: 'Medium',
        suggestedAction: 'Renew',
    },
    {
        id: 'exp-5',
        vendorName: 'BuildCore Civil Works',
        vendorSlug: 'buildcore-civil',
        documentType: 'Trade License',
        expiryDate: '2026-04-20',
        daysRemaining: 43,
        priority: 'High',
        suggestedAction: 'Request Update',
    },
];

const seedActions: VendorComplianceRecommendedAction[] = [
    {
        id: 'act-1',
        title: 'Renew MetroBuild Insurance',
        vendorSlug: 'metrobuild-materials',
        impact: 'High',
        priority: 'Critical',
        confidence: 96,
    },
    {
        id: 'act-2',
        title: 'Request Trade License',
        vendorSlug: 'southline-electricals',
        impact: 'Medium',
        priority: 'High',
        confidence: 92,
    },
    {
        id: 'act-3',
        title: 'Suspend Non-Compliant Vendor',
        vendorSlug: 'prime-maintenance',
        impact: 'High',
        priority: 'Critical',
        confidence: 98,
    },
    {
        id: 'act-4',
        title: 'Complete KYC Verification',
        vendorSlug: 'buildcore-civil',
        impact: 'Medium',
        priority: 'Medium',
        confidence: 88,
    },
];

const seedCategoryPerformance: VendorCategoryPerformance[] = [
    { id: 'cp-1', category: 'Electrical', vendorCount: 42, compliancePercent: 81, riskPercent: 19, expiringDocuments: 8 },
    { id: 'cp-2', category: 'Civil', vendorCount: 56, compliancePercent: 74, riskPercent: 26, expiringDocuments: 12 },
    { id: 'cp-3', category: 'Security', vendorCount: 28, compliancePercent: 92, riskPercent: 8, expiringDocuments: 3 },
    { id: 'cp-4', category: 'Housekeeping', vendorCount: 35, compliancePercent: 86, riskPercent: 14, expiringDocuments: 6 },
    { id: 'cp-5', category: 'Mechanical', vendorCount: 38, compliancePercent: 88, riskPercent: 12, expiringDocuments: 7 },
    { id: 'cp-6', category: 'Plumbing', vendorCount: 49, compliancePercent: 90, riskPercent: 10, expiringDocuments: 5 },
];

export function getVendorComplianceRecords(): VendorComplianceRecord[] {
    return [...seedVendors];
}

export function getVendorComplianceBySlug(slug: string): VendorComplianceRecord | undefined {
    return seedVendors.find((v) => v.slug === slug);
}

export function getVendorComplianceExecutiveKpis(): VendorComplianceExecutiveKpis {
    return {
        activeVendors: 248,
        compliantVendors: 192,
        nonCompliantVendors: 36,
        expiredDocuments: 18,
        upcomingExpirations: 41,
        highRiskVendors: 12,
        narrative:
            '248 vendors monitored. 36 vendors require compliance action. 18 critical document expirations detected. 12 vendors currently classified as high risk.',
    };
}

export function getVendorComplianceHealthSnapshot(): VendorComplianceHealthSnapshot {
    return {
        fullyCompliant: 192,
        pendingVerification: 28,
        missingDocuments: 47,
        expiringSoon: 41,
        highRiskVendors: 12,
        blockedVendors: 6,
    };
}

export function getVendorComplianceAttentionItems(): VendorComplianceAttentionItem[] {
    return [...seedAttention];
}

export function getVendorKycProfile(): VendorKycProfile {
    const vendor = seedVendors[0];
    return {
        vendorSlug: vendor.slug,
        vendorName: vendor.name,
        gstNumber: vendor.gstNumber,
        panNumber: vendor.panNumber,
        address: vendor.address,
        contactPerson: vendor.contactPerson,
        phone: vendor.phone,
        email: vendor.email,
        registrationDate: vendor.registrationDate,
        category: vendor.category,
        documents: [...seedKycDocuments],
    };
}

export function getVendorValidationFindings(): VendorValidationFinding[] {
    return [...seedValidationFindings];
}

export function getVendorRiskFactors(): VendorRiskFactor[] {
    return [...seedRiskFactors];
}

export function getVendorHighRiskRows(): VendorHighRiskRow[] {
    return seedVendors
        .filter((v) => v.riskLevel === 'High')
        .map((v) => ({
            id: v.id,
            vendorName: v.name,
            vendorSlug: v.slug,
            category: v.category,
            riskScore: v.riskScore,
            primaryRisk:
                v.insuranceStatus === 'Expired'
                    ? 'Expired insurance'
                    : v.licenseStatus === 'Missing'
                      ? 'Missing trade license'
                      : v.licenseStatus === 'Expired'
                        ? 'Expired labor license'
                        : 'Missing compliance documents',
            recommendedAction: v.recommendedAction,
        }));
}

export function getVendorExpiryRows(): VendorExpiryRow[] {
    return [...seedExpiryRows];
}

export function getVendorExpiryCounts() {
    return {
        expiring30: 14,
        expiring60: 28,
        expiring90: 41,
        alreadyExpired: 18,
    };
}

export function getVendorComplianceRecommendedActions(): VendorComplianceRecommendedAction[] {
    return [...seedActions];
}

export function getVendorComplianceForecasts(): VendorComplianceForecastPeriod[] {
    return [
        {
            id: 'month',
            label: 'This Month',
            expectedVerifications: 64,
            upcomingExpirations: 41,
            complianceReviews: 28,
            riskTrend: 'Elevated — insurance renewals cluster',
        },
        {
            id: 'next_month',
            label: 'Next Month',
            renewalsDue: 52,
            vendorReviews: 38,
            complianceAudits: 12,
            riskTrend: 'Moderate — KYC backlog clearing',
        },
        {
            id: 'quarter',
            label: 'Quarter Forecast',
            vendorGrowth: 18,
            complianceLoad: 142,
            riskTrend: 'Trending up — document expiry wave in Q2',
        },
    ];
}

export function getVendorCategoryPerformance(): VendorCategoryPerformance[] {
    return [...seedCategoryPerformance];
}
