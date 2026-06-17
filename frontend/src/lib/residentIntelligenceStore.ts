import { getResidents } from '@/lib/residentStore';
import { propertyBuildingFromUnit, type ResidentHealthStatusFilter } from '@/lib/residentIntelligenceHelpers';

export type ResidentIntelRiskLevel = 'High' | 'Medium' | 'Low';

export type ResidentIntelExecutiveKpis = {
    activeResidents: number;
    occupancyHealthPct: number;
    portalIssues: number;
    openServiceTickets: number;
    defaulterCount: number;
    leaseCompliancePct: number;
    narrative: string;
};

export type ResidentAttentionItem = {
    id: string;
    residentSlug: string;
    fullName: string;
    propertyName: string;
    severity: 'critical' | 'warning';
    headline: string;
    detail: string;
    metricLabel?: string;
    metricValue?: string;
    recommendedAction: string;
    serviceTicketSlug?: string;
};

export type ResidentRecommendedAction = {
    id: string;
    residentSlug: string;
    title: string;
    expectedImpact: string;
    priority: 'High' | 'Medium' | 'Low';
    confidence: number;
    serviceTicketSlug?: string;
};

export type ResidentEngagementOpportunity = {
    id: string;
    residentSlug: string;
    fullName: string;
    propertyName: string;
    opportunityType: string;
    likelyEngagementScore: number;
    dueWithinDays: number;
};

export type ResidentRiskRow = {
    id: string;
    residentSlug: string;
    fullName: string;
    propertyName: string;
    residentStatus: string;
    riskCategory: string;
    severityDays: number;
    detail: string;
    riskLevel: ResidentIntelRiskLevel;
    recommendedAction: string;
    serviceTicketSlug?: string;
};

export type ResidentIntelRecord = {
    id: string;
    residentSlug: string;
    fullName: string;
    propertyUnit: string;
    propertyName: string;
    residentStatus: string;
    residentType: string;
    portalAccessEnabled: boolean;
    accessExpiryDate: string;
    communityScore: number;
    openTickets: number;
    unreadNotices: number;
    tags: string[];
    riskLevel: ResidentIntelRiskLevel;
    aiRecommendation: string;
    moveInDate: string;
};

const EXECUTIVE: ResidentIntelExecutiveKpis = {
    activeResidents: 4,
    occupancyHealthPct: 86,
    portalIssues: 3,
    openServiceTickets: 2,
    defaulterCount: 1,
    leaseCompliancePct: 92,
    narrative:
        'Two critical service SLAs need assignment today — James Nguyen AC ticket is unassigned and Priya Mehta plumbing is nearing resolution window. Portal access for Ananya Iyer remains disabled with a Defaulter tag; re-enable only after finance clearance. VIP residents Ramesh Kumar and Priya Mehta show strong community engagement — route committee notices through them first.',
};

const ATTENTION: ResidentAttentionItem[] = [
    {
        id: 'ra1',
        residentSlug: 'james-nguyen',
        fullName: 'James Nguyen',
        propertyName: 'Skyline Courts',
        severity: 'critical',
        headline: 'SLA breach risk',
        detail: 'Critical HVAC ticket open with no vendor assigned.',
        metricLabel: 'SLA window',
        metricValue: '6 hours left',
        recommendedAction: 'Auto-assign vendor and notify resident',
        serviceTicketSlug: 'ac-not-cooling-apt-902',
    },
    {
        id: 'ra2',
        residentSlug: 'ananya-iyer',
        fullName: 'Ananya Iyer',
        propertyName: 'Garden Plaza',
        severity: 'critical',
        headline: 'Defaulter · portal off',
        detail: 'Inactive resident with Defaulter tag and portal access disabled.',
        metricLabel: 'Outstanding dues',
        metricValue: '₹42,500',
        recommendedAction: 'Finance follow-up before portal re-enable',
    },
    {
        id: 'ra3',
        residentSlug: 'priya-mehta',
        fullName: 'Priya Mehta',
        propertyName: 'Riverfront Tower',
        severity: 'warning',
        headline: 'High-priority plumbing',
        detail: 'Kitchen sink leak in progress — confirm vendor ETA with VIP resident.',
        metricLabel: 'Ticket',
        metricValue: 'In Progress',
        recommendedAction: 'Send ETA update via portal notice',
        serviceTicketSlug: 'leaking-kitchen-sink-unit-1204',
    },
    {
        id: 'ra4',
        residentSlug: 'oliver-schmidt',
        fullName: 'Oliver Schmidt',
        propertyName: 'Marina Views',
        severity: 'warning',
        headline: 'Vacated unit turnover',
        detail: 'Keys returned — unit marked vacant; schedule pre-handover inspection.',
        recommendedAction: 'Trigger move-out checklist and access revocation audit',
    },
    {
        id: 'ra5',
        residentSlug: 'ramesh-kumar',
        fullName: 'Ramesh Kumar',
        propertyName: 'Skyline Residency',
        severity: 'warning',
        headline: 'Unread community notices',
        detail: 'Three AGM notices unread — resident is committee liaison.',
        metricLabel: 'Unread',
        metricValue: '3 notices',
        recommendedAction: 'Send WhatsApp digest with portal deep link',
    },
];

const ACTIONS: ResidentRecommendedAction[] = [
    {
        id: 'rac1',
        residentSlug: 'james-nguyen',
        title: 'Assign emergency HVAC vendor',
        expectedImpact: 'Prevent SLA breach',
        priority: 'High',
        confidence: 94,
        serviceTicketSlug: 'ac-not-cooling-apt-902',
    },
    {
        id: 'rac2',
        residentSlug: 'ananya-iyer',
        title: 'Schedule defaulter payment plan call',
        expectedImpact: 'Recover ₹42,500 dues',
        priority: 'High',
        confidence: 78,
    },
    {
        id: 'rac3',
        residentSlug: 'priya-mehta',
        title: 'VIP plumbing ETA confirmation',
        expectedImpact: 'Protect NPS for committee member',
        priority: 'Medium',
        confidence: 88,
        serviceTicketSlug: 'leaking-kitchen-sink-unit-1204',
    },
    {
        id: 'rac4',
        residentSlug: 'maria-lopez',
        title: 'Invite to amenity booking pilot',
        expectedImpact: 'Boost portal engagement +18%',
        priority: 'Medium',
        confidence: 72,
    },
    {
        id: 'rac5',
        residentSlug: 'ramesh-kumar',
        title: 'Push unread AGM notices',
        expectedImpact: 'Quorum readiness for AGM',
        priority: 'Medium',
        confidence: 85,
    },
    {
        id: 'rac6',
        residentSlug: 'oliver-schmidt',
        title: 'Complete vacated unit handover',
        expectedImpact: 'Ready unit for reletting',
        priority: 'Low',
        confidence: 90,
    },
];

const ENGAGEMENT_OPPS: ResidentEngagementOpportunity[] = [
    {
        id: 're1',
        residentSlug: 'ramesh-kumar',
        fullName: 'Ramesh Kumar',
        propertyName: 'Skyline Residency',
        opportunityType: 'Notice engagement',
        likelyEngagementScore: 91,
        dueWithinDays: 2,
    },
    {
        id: 're2',
        residentSlug: 'priya-mehta',
        fullName: 'Priya Mehta',
        propertyName: 'Riverfront Tower',
        opportunityType: 'Committee briefing',
        likelyEngagementScore: 88,
        dueWithinDays: 3,
    },
    {
        id: 're3',
        residentSlug: 'maria-lopez',
        fullName: 'Maria Lopez',
        propertyName: 'Central Annex',
        opportunityType: 'Amenity booking upsell',
        likelyEngagementScore: 76,
        dueWithinDays: 7,
    },
    {
        id: 're4',
        residentSlug: 'james-nguyen',
        fullName: 'James Nguyen',
        propertyName: 'Skyline Courts',
        opportunityType: 'Service feedback survey',
        likelyEngagementScore: 70,
        dueWithinDays: 5,
    },
];

const RISKS: ResidentRiskRow[] = [
    {
        id: 'rr1',
        residentSlug: 'james-nguyen',
        fullName: 'James Nguyen',
        propertyName: 'Skyline Courts',
        residentStatus: 'Active',
        riskCategory: 'Service SLA',
        severityDays: 0,
        detail: 'Critical AC ticket unassigned',
        riskLevel: 'High',
        recommendedAction: 'Auto-assign vendor now',
        serviceTicketSlug: 'ac-not-cooling-apt-902',
    },
    {
        id: 'rr2',
        residentSlug: 'ananya-iyer',
        fullName: 'Ananya Iyer',
        propertyName: 'Garden Plaza',
        residentStatus: 'Inactive',
        riskCategory: 'Payment default',
        severityDays: 45,
        detail: 'Defaulter tag · portal disabled',
        riskLevel: 'High',
        recommendedAction: 'Finance escalation',
    },
    {
        id: 'rr3',
        residentSlug: 'priya-mehta',
        fullName: 'Priya Mehta',
        propertyName: 'Riverfront Tower',
        residentStatus: 'Active',
        riskCategory: 'Service SLA',
        severityDays: 1,
        detail: 'High-priority plumbing nearing resolution window',
        riskLevel: 'Medium',
        recommendedAction: 'Confirm vendor completion',
        serviceTicketSlug: 'leaking-kitchen-sink-unit-1204',
    },
    {
        id: 'rr4',
        residentSlug: 'oliver-schmidt',
        fullName: 'Oliver Schmidt',
        propertyName: 'Marina Views',
        residentStatus: 'Vacated',
        riskCategory: 'Lease compliance',
        severityDays: 12,
        detail: 'Vacated unit — access audit pending',
        riskLevel: 'Medium',
        recommendedAction: 'Run move-out checklist',
    },
    {
        id: 'rr5',
        residentSlug: 'ramesh-kumar',
        fullName: 'Ramesh Kumar',
        propertyName: 'Skyline Residency',
        residentStatus: 'Active',
        riskCategory: 'Notice engagement',
        severityDays: 4,
        detail: 'Unread AGM notices',
        riskLevel: 'Low',
        recommendedAction: 'Send digest reminder',
    },
];

const INTEL_RECORDS: ResidentIntelRecord[] = [
    {
        id: 'ri1',
        residentSlug: 'ramesh-kumar',
        fullName: 'Ramesh Kumar',
        propertyUnit: 'Skyline Residency — Unit 101',
        propertyName: 'Skyline Residency',
        residentStatus: 'Active',
        residentType: 'Owner',
        portalAccessEnabled: true,
        accessExpiryDate: '2027-06-30',
        communityScore: 92,
        openTickets: 0,
        unreadNotices: 3,
        tags: ['VIP'],
        riskLevel: 'Low',
        aiRecommendation: 'Push unread AGM notices via WhatsApp',
        moveInDate: '2024-06-15',
    },
    {
        id: 'ri2',
        residentSlug: 'priya-mehta',
        fullName: 'Priya Mehta',
        propertyUnit: 'Riverfront Tower — Unit 1204',
        propertyName: 'Riverfront Tower',
        residentStatus: 'Active',
        residentType: 'Owner',
        portalAccessEnabled: true,
        accessExpiryDate: '2027-01-31',
        communityScore: 88,
        openTickets: 1,
        unreadNotices: 0,
        tags: ['VIP', 'Committee'],
        riskLevel: 'Medium',
        aiRecommendation: 'Confirm plumbing vendor ETA for VIP',
        moveInDate: '2024-02-01',
    },
    {
        id: 'ri3',
        residentSlug: 'james-nguyen',
        fullName: 'James Nguyen',
        propertyUnit: 'Skyline Courts — Apt 902',
        propertyName: 'Skyline Courts',
        residentStatus: 'Active',
        residentType: 'Tenant',
        portalAccessEnabled: true,
        accessExpiryDate: '2026-06-01',
        communityScore: 58,
        openTickets: 1,
        unreadNotices: 1,
        tags: ['VIP'],
        riskLevel: 'High',
        aiRecommendation: 'Assign emergency HVAC vendor immediately',
        moveInDate: '2025-11-18',
    },
    {
        id: 'ri4',
        residentSlug: 'ananya-iyer',
        fullName: 'Ananya Iyer',
        propertyUnit: 'Garden Plaza — Villa 07',
        propertyName: 'Garden Plaza',
        residentStatus: 'Inactive',
        residentType: 'Family Member',
        portalAccessEnabled: false,
        accessExpiryDate: '2025-12-15',
        communityScore: 34,
        openTickets: 1,
        unreadNotices: 2,
        tags: ['Defaulter'],
        riskLevel: 'High',
        aiRecommendation: 'Finance clearance before portal re-enable',
        moveInDate: '2023-08-10',
    },
    {
        id: 'ri5',
        residentSlug: 'oliver-schmidt',
        fullName: 'Oliver Schmidt',
        propertyUnit: 'Marina Views — Penthouse B',
        propertyName: 'Marina Views',
        residentStatus: 'Vacated',
        residentType: 'Owner',
        portalAccessEnabled: false,
        accessExpiryDate: '2025-03-01',
        communityScore: 45,
        openTickets: 0,
        unreadNotices: 0,
        tags: [],
        riskLevel: 'Medium',
        aiRecommendation: 'Complete vacated unit handover checklist',
        moveInDate: '2022-05-21',
    },
    {
        id: 'ri6',
        residentSlug: 'maria-lopez',
        fullName: 'Maria Lopez',
        propertyUnit: 'Central Annex — Suite 310',
        propertyName: 'Central Annex',
        residentStatus: 'Active',
        residentType: 'Tenant',
        portalAccessEnabled: true,
        accessExpiryDate: '2026-12-31',
        communityScore: 81,
        openTickets: 0,
        unreadNotices: 0,
        tags: ['Committee'],
        riskLevel: 'Low',
        aiRecommendation: 'Invite to amenity booking pilot',
        moveInDate: '2026-01-05',
    },
];

function existingResidentSlugs(): Set<string> {
    return new Set(getResidents().map((r) => r.slug));
}

function filterByExistingSlugs<T extends { residentSlug: string }>(rows: T[]): T[] {
    const slugs = existingResidentSlugs();
    return rows.filter((r) => slugs.has(r.residentSlug)).map((r) => ({ ...r }));
}

function getPropertyOptions(): string[] {
    const names = new Set<string>();
    getResidents().forEach((r) => names.add(propertyBuildingFromUnit(r.propertyUnit)));
    return [...names].sort();
}

export function getResidentIntelExecutiveKpis(): ResidentIntelExecutiveKpis {
    return { ...EXECUTIVE };
}

export function getResidentAttentionItems(): ResidentAttentionItem[] {
    return filterByExistingSlugs(ATTENTION);
}

export function getResidentRecommendedActions(): ResidentRecommendedAction[] {
    return filterByExistingSlugs(ACTIONS);
}

export function getResidentEngagementOpportunities(): ResidentEngagementOpportunity[] {
    return filterByExistingSlugs(ENGAGEMENT_OPPS);
}

export function getResidentRiskRows(): ResidentRiskRow[] {
    return filterByExistingSlugs(RISKS);
}

export function getResidentIntelRecords(): ResidentIntelRecord[] {
    return filterByExistingSlugs(INTEL_RECORDS);
}

export const RESIDENT_INTEL_PROPERTY_OPTIONS = getPropertyOptions();
export const RESIDENT_INTEL_STATUS_OPTIONS = ['Active', 'Inactive', 'Vacated'] as const;
export const RESIDENT_INTEL_PORTAL_OPTIONS = ['All', 'Enabled', 'Disabled', 'Expiring'] as const;
export const RESIDENT_INTEL_TAG_OPTIONS = ['All', 'VIP', 'Defaulter', 'Committee'] as const;
export const RESIDENT_INTEL_HEALTH_OPTIONS: ResidentHealthStatusFilter[] = [
    'All',
    'At risk',
    'On track',
    'Attention',
];
