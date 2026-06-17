/**
 * Mock booking & payment intelligence — aligned with bookingPaymentMockStore slugs.
 */

import { getBookingAssigneeOptions, getBookings, getProjectOptions } from '@/lib/bookingPaymentMockStore';

export type BookingPaymentStatusFilter = 'All' | 'Overdue' | 'On track' | 'Pending';
export type BookingIntelRiskLevel = 'High' | 'Medium' | 'Low';
export type BookingActionPriority = 'High' | 'Medium' | 'Low';
export type BookingAttentionKind =
    | 'overdue_installment'
    | 'pending_booking'
    | 'link_expiring'
    | 'failed_payment'
    | 'low_collection';

export interface BookingIntelExecutiveKpis {
    totalOutstanding: number;
    collectionEfficiencyPct: number;
    overdueInstallments: number;
    pendingPaymentLinks: number;
    bookingsAtRisk: number;
    expectedCollectionsThisMonth: number;
    narrative: string;
}

export interface BookingAttentionItem {
    id: string;
    kind: BookingAttentionKind;
    headline: string;
    customerName: string;
    bookingSlug: string;
    projectName: string;
    detail: string;
    metricLabel?: string;
    metricValue?: string;
    recommendedAction: string;
    severity: 'critical' | 'warning';
}

export interface BookingRecommendedAction {
    id: string;
    title: string;
    bookingSlug: string;
    expectedAmount: number;
    priority: BookingActionPriority;
    confidence: number;
}

export interface BookingCollectionOpportunity {
    id: string;
    bookingSlug: string;
    customerName: string;
    projectName: string;
    likelyCollectionAmount: number;
    dueWithinDays: number;
    collectionScore: number;
}

export interface BookingPaymentRiskRow {
    id: string;
    bookingSlug: string;
    customerName: string;
    projectName: string;
    assignedTo: string;
    milestone: string;
    daysOverdue: number;
    overdueAmount: number;
    riskLevel: BookingIntelRiskLevel;
    recommendedAction: string;
}

export interface BookingIntelRecord {
    id: string;
    bookingSlug: string;
    customerName: string;
    projectName: string;
    assignedTo: string;
    bookingDate: string;
    bookingStatus: 'Confirmed' | 'Pending' | 'Cancelled';
    unitConfiguration: string;
    unitPrice: number;
    paidAmount: number;
    outstanding: number;
    paidPct: number;
    collectionScore: number;
    daysOverdue: number;
    nextDueDate: string;
    nextDueAmount: number;
    riskLevel: BookingIntelRiskLevel;
    aiRecommendation: string;
}

const EXECUTIVE: BookingIntelExecutiveKpis = {
    totalOutstanding: 4_82_00_000,
    collectionEfficiencyPct: 78,
    overdueInstallments: 6,
    pendingPaymentLinks: 3,
    bookingsAtRisk: 4,
    expectedCollectionsThisMonth: 1_24_00_000,
    narrative:
        '₹4.82 Cr outstanding across active bookings. Summit Woods and Green Valley have overdue milestones — send reminders today. Urban Flux booking advance is pending; payment link is active. Skyline Residency collections are on track with 92% efficiency on confirmed units.',
};

const ATTENTION: BookingAttentionItem[] = [
    {
        id: 'at1',
        kind: 'overdue_installment',
        headline: 'Overdue installment',
        customerName: 'Suresh Raina',
        bookingSlug: 'summit-woods-suresh-v7',
        projectName: 'Summit Woods',
        detail: 'Milestone 2 unpaid — 18 days past due date',
        metricLabel: 'Overdue',
        metricValue: '₹18L',
        recommendedAction: 'Send payment reminder + assign sales follow-up',
        severity: 'critical',
    },
    {
        id: 'at2',
        kind: 'pending_booking',
        headline: 'Booking advance pending',
        customerName: 'Anita Sharma',
        bookingSlug: 'urban-flux-apartments-102',
        projectName: 'Urban Flux Apartments',
        detail: 'Booking status Pending — advance payment not received',
        metricLabel: 'Due',
        metricValue: '₹1.5L',
        recommendedAction: 'Resend active payment link via WhatsApp',
        severity: 'critical',
    },
    {
        id: 'at3',
        kind: 'overdue_installment',
        headline: 'Installment overdue',
        customerName: 'Arjun Verma',
        bookingSlug: 'green-valley-arjun-1204',
        projectName: 'Green Valley Phase 2',
        detail: 'First milestone overdue — buyer unresponsive for 12 days',
        metricLabel: 'Outstanding',
        metricValue: '₹8.4L',
        recommendedAction: 'Schedule call + offer payment plan review',
        severity: 'warning',
    },
    {
        id: 'at4',
        kind: 'link_expiring',
        headline: 'Payment link expiring',
        customerName: 'Deepak Nair',
        bookingSlug: 'skyline-residency-deepak-508',
        projectName: 'Skyline Residency',
        detail: 'Installment link expires in 2 days without payment',
        metricLabel: 'Amount',
        metricValue: '₹2.2L',
        recommendedAction: 'Extend link + send SMS reminder',
        severity: 'warning',
    },
    {
        id: 'at5',
        kind: 'low_collection',
        headline: 'Low collection progress',
        customerName: 'Rohit Khanna',
        bookingSlug: 'metro-heights-rohit-804',
        projectName: 'Metro Heights',
        detail: 'Only 12% collected — booking pending confirmation',
        metricLabel: 'Paid',
        metricValue: '12%',
        recommendedAction: 'Confirm booking after advance receipt',
        severity: 'warning',
    },
];

const ACTIONS: BookingRecommendedAction[] = [
    {
        id: 'a1',
        title: 'Send payment reminder to Suresh Raina — Summit Woods',
        bookingSlug: 'summit-woods-suresh-v7',
        expectedAmount: 18_00_000,
        priority: 'High',
        confidence: 91,
    },
    {
        id: 'a2',
        title: 'Resend WhatsApp payment link to Anita Sharma',
        bookingSlug: 'urban-flux-apartments-102',
        expectedAmount: 1_50_000,
        priority: 'High',
        confidence: 88,
    },
    {
        id: 'a3',
        title: 'Collect overdue milestone from Arjun Verma',
        bookingSlug: 'green-valley-arjun-1204',
        expectedAmount: 8_40_000,
        priority: 'High',
        confidence: 84,
    },
    {
        id: 'a4',
        title: 'Extend installment link for Deepak Nair',
        bookingSlug: 'skyline-residency-deepak-508',
        expectedAmount: 2_20_000,
        priority: 'Medium',
        confidence: 79,
    },
    {
        id: 'a5',
        title: 'Follow up booking advance for Karan Mehta',
        bookingSlug: 'metro-heights-karan-512',
        expectedAmount: 4_80_000,
        priority: 'Medium',
        confidence: 76,
    },
    {
        id: 'a6',
        title: 'Record pending installment for Pallavi Joshi',
        bookingSlug: 'phoenix-retail-pallavi-14',
        expectedAmount: 32_00_000,
        priority: 'Low',
        confidence: 72,
    },
];

const COLLECTION_OPPS: BookingCollectionOpportunity[] = [
    {
        id: 'co1',
        bookingSlug: 'skyline-residency-rahul-902',
        customerName: 'Rahul Desai',
        projectName: 'Skyline Residency',
        likelyCollectionAmount: 22_40_000,
        dueWithinDays: 5,
        collectionScore: 94,
    },
    {
        id: 'co2',
        bookingSlug: 'summit-woods-kavita-v3',
        customerName: 'Kavita Menon',
        projectName: 'Summit Woods',
        likelyCollectionAmount: 42_00_000,
        dueWithinDays: 7,
        collectionScore: 89,
    },
    {
        id: 'co3',
        bookingSlug: 'skyline-residency-101',
        customerName: 'Ramesh Kumar',
        projectName: 'Skyline Residency',
        likelyCollectionAmount: 12_50_000,
        dueWithinDays: 3,
        collectionScore: 92,
    },
    {
        id: 'co4',
        bookingSlug: 'phoenix-retail-pallavi-14',
        customerName: 'Pallavi Joshi',
        projectName: 'Phoenix MarketCity Retail',
        likelyCollectionAmount: 64_00_000,
        dueWithinDays: 10,
        collectionScore: 86,
    },
];

const PAYMENT_RISKS: BookingPaymentRiskRow[] = [
    {
        id: 'pr1',
        bookingSlug: 'summit-woods-suresh-v7',
        customerName: 'Suresh Raina',
        projectName: 'Summit Woods',
        assignedTo: 'Vikram Singh',
        milestone: 'Milestone 2',
        daysOverdue: 18,
        overdueAmount: 18_00_000,
        riskLevel: 'High',
        recommendedAction: 'Escalate to sales head + legal notice prep',
    },
    {
        id: 'pr2',
        bookingSlug: 'green-valley-arjun-1204',
        customerName: 'Arjun Verma',
        projectName: 'Green Valley Phase 2',
        assignedTo: 'Amit Sales',
        milestone: 'Milestone 1',
        daysOverdue: 12,
        overdueAmount: 8_40_000,
        riskLevel: 'High',
        recommendedAction: 'Call buyer + offer split installment',
    },
    {
        id: 'pr3',
        bookingSlug: 'urban-flux-apartments-102',
        customerName: 'Anita Sharma',
        projectName: 'Urban Flux Apartments',
        assignedTo: 'Priya Reddy',
        milestone: 'Booking advance',
        daysOverdue: 8,
        overdueAmount: 1_50_000,
        riskLevel: 'Medium',
        recommendedAction: 'Resend payment link + WhatsApp follow-up',
    },
    {
        id: 'pr4',
        bookingSlug: 'metro-heights-rohit-804',
        customerName: 'Rohit Khanna',
        projectName: 'Metro Heights',
        assignedTo: 'Vikram Singh',
        milestone: 'Token amount',
        daysOverdue: 5,
        overdueAmount: 3_60_000,
        riskLevel: 'Medium',
        recommendedAction: 'Confirm booking or release unit hold',
    },
    {
        id: 'pr5',
        bookingSlug: 'skyline-residency-deepak-508',
        customerName: 'Deepak Nair',
        projectName: 'Skyline Residency',
        assignedTo: 'Sneha Reddy',
        milestone: 'Milestone 1',
        daysOverdue: 3,
        overdueAmount: 2_20_000,
        riskLevel: 'Low',
        recommendedAction: 'Extend payment link validity',
    },
];

const INTEL_RECORDS: BookingIntelRecord[] = [
    {
        id: 'bi1',
        bookingSlug: 'skyline-residency-101',
        customerName: 'Ramesh Kumar',
        projectName: 'Skyline Residency',
        assignedTo: 'Amit Sales',
        bookingDate: '2026-03-01',
        bookingStatus: 'Confirmed',
        unitConfiguration: '2 BHK',
        unitPrice: 62_00_000,
        paidAmount: 18_60_000,
        outstanding: 43_40_000,
        paidPct: 30,
        collectionScore: 88,
        daysOverdue: 0,
        nextDueDate: '2026-04-10',
        nextDueAmount: 12_50_000,
        riskLevel: 'Low',
        aiRecommendation: 'On track — send upcoming due reminder',
    },
    {
        id: 'bi2',
        bookingSlug: 'urban-flux-apartments-102',
        customerName: 'Anita Sharma',
        projectName: 'Urban Flux Apartments',
        assignedTo: 'Priya Reddy',
        bookingDate: '2026-03-18',
        bookingStatus: 'Pending',
        unitConfiguration: '2 BHK',
        unitPrice: 66_50_000,
        paidAmount: 0,
        outstanding: 66_50_000,
        paidPct: 0,
        collectionScore: 42,
        daysOverdue: 8,
        nextDueDate: '2026-03-20',
        nextDueAmount: 1_50_000,
        riskLevel: 'High',
        aiRecommendation: 'Collect booking advance immediately',
    },
    {
        id: 'bi3',
        bookingSlug: 'summit-woods-suresh-v7',
        customerName: 'Suresh Raina',
        projectName: 'Summit Woods',
        assignedTo: 'Vikram Singh',
        bookingDate: '2026-03-06',
        bookingStatus: 'Pending',
        unitConfiguration: 'Villa',
        unitPrice: 2_50_00_000,
        paidAmount: 25_00_000,
        outstanding: 2_25_00_000,
        paidPct: 10,
        collectionScore: 38,
        daysOverdue: 18,
        nextDueDate: '2026-03-15',
        nextDueAmount: 18_00_000,
        riskLevel: 'High',
        aiRecommendation: 'Escalate overdue milestone',
    },
    {
        id: 'bi4',
        bookingSlug: 'phoenix-retail-pallavi-14',
        customerName: 'Pallavi Joshi',
        projectName: 'Phoenix MarketCity Retail',
        assignedTo: 'Rajesh Kumar',
        bookingDate: '2026-03-11',
        bookingStatus: 'Confirmed',
        unitConfiguration: 'Retail',
        unitPrice: 3_20_00_000,
        paidAmount: 96_00_000,
        outstanding: 2_24_00_000,
        paidPct: 30,
        collectionScore: 82,
        daysOverdue: 0,
        nextDueDate: '2026-04-15',
        nextDueAmount: 64_00_000,
        riskLevel: 'Low',
        aiRecommendation: 'Schedule milestone collection call',
    },
    {
        id: 'bi5',
        bookingSlug: 'skyline-residency-rahul-902',
        customerName: 'Rahul Desai',
        projectName: 'Skyline Residency',
        assignedTo: 'Rajesh Kumar',
        bookingDate: '2026-02-20',
        bookingStatus: 'Confirmed',
        unitConfiguration: '3 BHK',
        unitPrice: 1_12_00_000,
        paidAmount: 44_80_000,
        outstanding: 67_20_000,
        paidPct: 40,
        collectionScore: 94,
        daysOverdue: 0,
        nextDueDate: '2026-04-05',
        nextDueAmount: 22_40_000,
        riskLevel: 'Low',
        aiRecommendation: 'High confidence collection this week',
    },
    {
        id: 'bi6',
        bookingSlug: 'summit-woods-kavita-v3',
        customerName: 'Kavita Menon',
        projectName: 'Summit Woods',
        assignedTo: 'Vikram Singh',
        bookingDate: '2026-03-07',
        bookingStatus: 'Confirmed',
        unitConfiguration: 'Villa',
        unitPrice: 2_10_00_000,
        paidAmount: 63_00_000,
        outstanding: 1_47_00_000,
        paidPct: 30,
        collectionScore: 89,
        daysOverdue: 0,
        nextDueDate: '2026-04-08',
        nextDueAmount: 42_00_000,
        riskLevel: 'Low',
        aiRecommendation: 'Send pre-due WhatsApp reminder',
    },
    {
        id: 'bi7',
        bookingSlug: 'green-valley-arjun-1204',
        customerName: 'Arjun Verma',
        projectName: 'Green Valley Phase 2',
        assignedTo: 'Amit Sales',
        bookingDate: '2026-02-28',
        bookingStatus: 'Pending',
        unitConfiguration: '3 BHK',
        unitPrice: 72_00_000,
        paidAmount: 7_20_000,
        outstanding: 64_80_000,
        paidPct: 10,
        collectionScore: 45,
        daysOverdue: 12,
        nextDueDate: '2026-03-10',
        nextDueAmount: 8_40_000,
        riskLevel: 'High',
        aiRecommendation: 'Assign recovery call today',
    },
    {
        id: 'bi8',
        bookingSlug: 'skyline-residency-deepak-508',
        customerName: 'Deepak Nair',
        projectName: 'Skyline Residency',
        assignedTo: 'Sneha Reddy',
        bookingDate: '2026-03-19',
        bookingStatus: 'Pending',
        unitConfiguration: '2 BHK',
        unitPrice: 55_00_000,
        paidAmount: 5_50_000,
        outstanding: 49_50_000,
        paidPct: 10,
        collectionScore: 58,
        daysOverdue: 3,
        nextDueDate: '2026-03-25',
        nextDueAmount: 2_20_000,
        riskLevel: 'Medium',
        aiRecommendation: 'Extend payment link + reminder',
    },
    {
        id: 'bi9',
        bookingSlug: 'metro-heights-rohit-804',
        customerName: 'Rohit Khanna',
        projectName: 'Metro Heights',
        assignedTo: 'Vikram Singh',
        bookingDate: '2026-03-14',
        bookingStatus: 'Pending',
        unitConfiguration: '3 BHK',
        unitPrice: 78_00_000,
        paidAmount: 9_36_000,
        outstanding: 68_64_000,
        paidPct: 12,
        collectionScore: 52,
        daysOverdue: 5,
        nextDueDate: '2026-03-18',
        nextDueAmount: 3_60_000,
        riskLevel: 'Medium',
        aiRecommendation: 'Confirm booking or release hold',
    },
    {
        id: 'bi10',
        bookingSlug: 'metro-heights-karan-512',
        customerName: 'Karan Mehta',
        projectName: 'Metro Heights',
        assignedTo: 'Sneha Reddy',
        bookingDate: '2026-03-21',
        bookingStatus: 'Pending',
        unitConfiguration: '2 BHK',
        unitPrice: 48_00_000,
        paidAmount: 0,
        outstanding: 48_00_000,
        paidPct: 0,
        collectionScore: 48,
        daysOverdue: 0,
        nextDueDate: '2026-03-28',
        nextDueAmount: 4_80_000,
        riskLevel: 'Medium',
        aiRecommendation: 'Send booking advance link',
    },
];

function existingBookingSlugs(): Set<string> {
    return new Set(getBookings().map((b) => b.slug));
}

function filterByExistingSlugs<T extends { bookingSlug: string }>(rows: T[]): T[] {
    const slugs = existingBookingSlugs();
    return rows.filter((r) => slugs.has(r.bookingSlug)).map((r) => ({ ...r }));
}

export function getBookingIntelExecutiveKpis(): BookingIntelExecutiveKpis {
    return { ...EXECUTIVE };
}

export function getBookingAttentionItems(): BookingAttentionItem[] {
    return filterByExistingSlugs(ATTENTION);
}

export function getBookingRecommendedActions(): BookingRecommendedAction[] {
    return filterByExistingSlugs(ACTIONS);
}

export function getBookingCollectionOpportunities(): BookingCollectionOpportunity[] {
    return filterByExistingSlugs(COLLECTION_OPPS);
}

export function getBookingPaymentRisks(): BookingPaymentRiskRow[] {
    return filterByExistingSlugs(PAYMENT_RISKS);
}

export function getBookingIntelRecords(): BookingIntelRecord[] {
    return filterByExistingSlugs(INTEL_RECORDS);
}

export const BP_INTEL_PROJECT_OPTIONS = getProjectOptions();
export const BP_INTEL_ASSIGNEE_OPTIONS = getBookingAssigneeOptions();
export const BP_INTEL_BOOKING_STATUS_OPTIONS = ['Confirmed', 'Pending', 'Cancelled'] as const;
export const BP_INTEL_PAYMENT_STATUS_OPTIONS: BookingPaymentStatusFilter[] = ['All', 'Overdue', 'On track', 'Pending'];
