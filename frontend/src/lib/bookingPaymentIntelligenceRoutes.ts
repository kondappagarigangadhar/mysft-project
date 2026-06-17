export type BookingIntelTab = 'overview' | 'payments' | 'payment-links';

export const BP_INTEL_SECTION_IDS = {
    attention: 'bp-attention',
    actions: 'bp-actions',
    collection: 'bp-collection',
    paymentRisk: 'bp-payment-risk',
    ranking: 'bp-ranking',
    table: 'bp-table',
} as const;

export function getBookingIntelHref(bookingSlug: string, tab: BookingIntelTab = 'overview'): string {
    if (tab === 'payments') {
        return `/company-admin/booking-payment/payments?booking=${encodeURIComponent(bookingSlug)}`;
    }
    if (tab === 'payment-links') {
        return `/company-admin/booking-payment/payment-links?booking=${encodeURIComponent(bookingSlug)}`;
    }
    return `/company-admin/booking-payment/booking/view/${encodeURIComponent(bookingSlug)}`;
}

export function getPaymentIntelHref(paymentSlug: string): string {
    return `/company-admin/booking-payment/payments/view/${encodeURIComponent(paymentSlug)}`;
}

export function getBookingIntelActionHref(bookingSlug: string, title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('link') || lower.includes('whatsapp') || lower.includes('reminder')) {
        return getBookingIntelHref(bookingSlug, 'payment-links');
    }
    if (lower.includes('payment') || lower.includes('installment') || lower.includes('collect')) {
        return getBookingIntelHref(bookingSlug, 'payments');
    }
    return getBookingIntelHref(bookingSlug, 'overview');
}
