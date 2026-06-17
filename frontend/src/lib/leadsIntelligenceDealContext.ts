import { getBookingBySlug, getPaymentsForBooking, type PaymentRecord } from '@/lib/bookingPaymentMockStore';
import { formatLeadCode, getLeadBySlugIncludingArchived } from '@/lib/leadStore';
import { getPaymentsForLeadCode } from '@/services/relationLookupService';

export type LeadDealContext = {
    hasLinkedDeal: boolean;
    bookingCount: number;
    documentCount: number;
    pendingPaymentLakhs: number;
    completedPaymentLakhs: number;
    primaryBookingStatus: string | null;
    aiHint: string;
};

function lakhsFromRupees(amount: number): number {
    return Math.round(amount / 100_000);
}

function sumPayments(payments: PaymentRecord[], status: PaymentRecord['status']): number {
    return payments.filter((p) => p.status === status).reduce((s, p) => s + p.amount, 0);
}

/** Pull bookings / payments / docs from CRM for intelligence scoring copy. */
export function getLeadDealContext(leadSlug: string): LeadDealContext | null {
    const lead = getLeadBySlugIncludingArchived(leadSlug);
    if (!lead) return null;

    const bookingCount = lead.linkedBookings?.length ?? 0;
    const documentCount = lead.linkedDocuments?.length ?? 0;
    const hasLinkedDeal = bookingCount > 0;

    const leadCode = formatLeadCode(lead.id);
    const payments = getPaymentsForLeadCode(leadCode);
    const pendingPaymentLakhs = lakhsFromRupees(sumPayments(payments, 'Pending'));
    const completedPaymentLakhs = lakhsFromRupees(sumPayments(payments, 'Completed'));

    const primarySlug = lead.linkedBookings[0]?.bookingSlug;
    const primaryBooking = primarySlug ? getBookingBySlug(primarySlug) : undefined;
    const primaryBookingStatus = primaryBooking?.status ?? null;

    let aiHint = 'No booking linked — prioritize qualification and site visit.';
    if (hasLinkedDeal && pendingPaymentLakhs > 0) {
        aiHint = `₹${pendingPaymentLakhs}L payment pending on linked booking — follow up today.`;
    } else if (hasLinkedDeal && primaryBookingStatus === 'Pending') {
        aiHint = 'Booking pending confirmation — push token or agreement signature.';
    } else if (hasLinkedDeal && completedPaymentLakhs > 0 && pendingPaymentLakhs === 0) {
        aiHint = `Payments on track (₹${completedPaymentLakhs}L received) — focus registration handover.`;
    } else if (hasLinkedDeal && documentCount > 0) {
        aiHint = `${documentCount} compliance doc${documentCount === 1 ? '' : 's'} on file — use for faster close.`;
    } else if (hasLinkedDeal) {
        aiHint = 'Active booking linked — coordinate visit and payment plan.';
    }

    return {
        hasLinkedDeal,
        bookingCount,
        documentCount,
        pendingPaymentLakhs,
        completedPaymentLakhs,
        primaryBookingStatus,
        aiHint,
    };
}

export function countLeadsWithDealData(leadSlugs: string[]): { withDeal: number; total: number } {
    let withDeal = 0;
    for (const slug of leadSlugs) {
        const ctx = getLeadDealContext(slug);
        if (ctx?.hasLinkedDeal) withDeal += 1;
    }
    return { withDeal, total: leadSlugs.length };
}
