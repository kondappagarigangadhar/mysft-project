import type { LeadLinkedBookingRef, LeadLinkedDocumentRef, LeadLinkedPaymentRef } from '@/lib/leadStore';

/** Default CRM cross-links for demo leads (bookings + payments + documents). */
export type LeadCrossRefBundle = {
    linkedBookings: LeadLinkedBookingRef[];
    linkedPayments: LeadLinkedPaymentRef[];
    linkedDocuments: LeadLinkedDocumentRef[];
};

/**
 * Ten demo leads carry full deal data (bookings / payments / docs) — intelligence
 * is stronger when those links exist; five leads stay without deal data for contrast.
 */
export const DEFAULT_LEAD_CROSS_REFS_BY_SLUG: Record<string, LeadCrossRefBundle> = {
    'ramesh-kumar': {
        linkedBookings: [{ id: 'lb-rk-1', bookingSlug: 'skyline-residency-101' }],
        linkedPayments: [
            { id: 'lp-rk-1', paymentSlug: 'payment-bank-500k-rcp77821' },
            { id: 'lp-rk-2', paymentSlug: 'payment-upi-link-250k-rcp77823' },
            { id: 'lp-rk-3', paymentSlug: 'payment-upi-200k-rcp77822' },
        ],
        linkedDocuments: [
            { id: 'ld-rk-1', documentId: 'DOC-LEAD-RK-001' },
            { id: 'ld-rk-2', documentId: 'DOC-LEAD-RK-002' },
        ],
    },
    'anita-sharma': {
        linkedBookings: [{ id: 'lb-as-1', bookingSlug: 'urban-flux-apartments-102' }],
        linkedPayments: [
            { id: 'lp-as-1', paymentSlug: 'payment-ufa-anita-bank-800k' },
            { id: 'lp-as-2', paymentSlug: 'payment-ufa-anita-upi-350k' },
        ],
        linkedDocuments: [
            { id: 'ld-as-1', documentId: 'DOC-LEAD-AS-001' },
            { id: 'ld-as-2', documentId: 'doc-noc-003' },
        ],
    },
    'suresh-raina': {
        linkedBookings: [{ id: 'lb-sr-1', bookingSlug: 'summit-woods-suresh-v7' }],
        linkedPayments: [{ id: 'lp-sr-1', paymentSlug: 'payment-suresh-token-15l' }],
        linkedDocuments: [{ id: 'ld-sr-1', documentId: 'DOC-LEAD-SR-001' }],
    },
    'pallavi-joshi': {
        linkedBookings: [{ id: 'lb-pj-1', bookingSlug: 'phoenix-retail-pallavi-14' }],
        linkedPayments: [
            { id: 'lp-pj-1', paymentSlug: 'payment-pallavi-bank-320l' },
            { id: 'lp-pj-2', paymentSlug: 'payment-pallavi-final-50l' },
        ],
        linkedDocuments: [
            { id: 'ld-pj-1', documentId: 'DOC-LEAD-PJ-001' },
            { id: 'ld-pj-2', documentId: 'DOC-LEAD-PJ-002' },
        ],
    },
    'rahul-desai': {
        linkedBookings: [{ id: 'lb-rd-1', bookingSlug: 'skyline-residency-rahul-902' }],
        linkedPayments: [{ id: 'lp-rd-1', paymentSlug: 'payment-rahul-full-112cr' }],
        linkedDocuments: [
            { id: 'ld-rd-1', documentId: 'DOC-LEAD-RD-001' },
            { id: 'ld-rd-2', documentId: 'DOC-LEAD-RD-002' },
            { id: 'ld-rd-3', documentId: 'doc-plan-005' },
        ],
    },
    'kavita-menon': {
        linkedBookings: [{ id: 'lb-km-1', bookingSlug: 'summit-woods-kavita-v3' }],
        linkedPayments: [
            { id: 'lp-km-1', paymentSlug: 'payment-kavita-token-20pct' },
            { id: 'lp-km-2', paymentSlug: 'payment-kavita-balance-pending' },
        ],
        linkedDocuments: [
            { id: 'ld-km-1', documentId: 'DOC-LEAD-KM-001' },
            { id: 'ld-km-2', documentId: 'DOC-LEAD-KM-002' },
        ],
    },
    'arjun-verma': {
        linkedBookings: [{ id: 'lb-av-1', bookingSlug: 'green-valley-arjun-1204' }],
        linkedPayments: [{ id: 'lp-av-1', paymentSlug: 'payment-arjun-token-pending' }],
        linkedDocuments: [{ id: 'ld-av-1', documentId: 'DOC-LEAD-AV-001' }],
    },
    'deepak-nair': {
        linkedBookings: [{ id: 'lb-dn-1', bookingSlug: 'skyline-residency-deepak-508' }],
        linkedPayments: [
            { id: 'lp-dn-1', paymentSlug: 'payment-deepak-eoi-1l' },
            { id: 'lp-dn-2', paymentSlug: 'payment-deepak-token-2l-pending' },
        ],
        linkedDocuments: [
            { id: 'ld-dn-1', documentId: 'DOC-LEAD-DN-001' },
            { id: 'ld-dn-2', documentId: 'DOC-LEAD-DN-002' },
        ],
    },
    'rohit-khanna': {
        linkedBookings: [{ id: 'lb-rh-1', bookingSlug: 'metro-heights-rohit-804' }],
        linkedPayments: [
            { id: 'lp-rh-1', paymentSlug: 'payment-rohit-token-15l' },
            { id: 'lp-rh-2', paymentSlug: 'payment-rohit-loan-fee-pending' },
        ],
        linkedDocuments: [
            { id: 'ld-rh-1', documentId: 'DOC-LEAD-RH-001' },
            { id: 'ld-rh-2', documentId: 'DOC-LEAD-RH-002' },
        ],
    },
    'karan-mehta': {
        linkedBookings: [{ id: 'lb-km2-1', bookingSlug: 'metro-heights-karan-512' }],
        linkedPayments: [{ id: 'lp-km2-1', paymentSlug: 'payment-karan-token-3l-pending' }],
        linkedDocuments: [
            { id: 'ld-km2-1', documentId: 'DOC-LEAD-KM2-001' },
            { id: 'ld-km2-2', documentId: 'DOC-LEAD-KM2-002' },
        ],
    },
};

export function getSeededCrossRefSlugs(): string[] {
    return Object.keys(DEFAULT_LEAD_CROSS_REFS_BY_SLUG);
}
