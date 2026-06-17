'use client';

import { useMemo } from 'react';
import {
    filterBookingIntelRecords,
    filterPaymentRisks,
    type BookingIntelFilters,
} from '@/lib/bookingPaymentIntelligenceHelpers';
import {
    getBookingAttentionItems,
    getBookingCollectionOpportunities,
    getBookingIntelExecutiveKpis,
    getBookingIntelRecords,
    getBookingPaymentRisks,
    getBookingRecommendedActions,
} from '@/lib/bookingPaymentIntelligenceStore';

const ATTENTION_LIMIT = 8;
const ACTIONS_LIMIT = 6;
const COLLECTION_LIMIT = 6;
const RISK_LIMIT = 12;

export function useBookingPaymentIntelDashboard(filters: BookingIntelFilters) {
    const allRecords = useMemo(() => getBookingIntelRecords(), []);
    const records = useMemo(() => filterBookingIntelRecords(allRecords, filters), [allRecords, filters]);
    const bookingSlugs = useMemo(() => new Set(records.map((r) => r.bookingSlug)), [records]);

    const executive = useMemo(() => getBookingIntelExecutiveKpis(), []);

    const attention = useMemo(() => {
        const items = getBookingAttentionItems().filter((a) => bookingSlugs.has(a.bookingSlug));
        return items.slice(0, ATTENTION_LIMIT);
    }, [bookingSlugs]);

    const actions = useMemo(() => {
        return getBookingRecommendedActions()
            .filter((a) => bookingSlugs.has(a.bookingSlug))
            .slice(0, ACTIONS_LIMIT);
    }, [bookingSlugs]);

    const collectionOpportunities = useMemo(() => {
        return getBookingCollectionOpportunities()
            .filter((c) => bookingSlugs.has(c.bookingSlug))
            .sort((a, b) => b.likelyCollectionAmount - a.likelyCollectionAmount)
            .slice(0, COLLECTION_LIMIT);
    }, [bookingSlugs]);

    const paymentRisks = useMemo(() => {
        return filterPaymentRisks(getBookingPaymentRisks(), filters)
            .filter((r) => bookingSlugs.has(r.bookingSlug))
            .slice(0, RISK_LIMIT);
    }, [filters, bookingSlugs]);

    const rankedBookings = useMemo(
        () => [...records].sort((a, b) => b.collectionScore - a.collectionScore),
        [records],
    );

    return {
        executive,
        attention,
        actions,
        collectionOpportunities,
        paymentRisks,
        rankedBookings,
        bookingCount: records.length,
        allBookingCount: allRecords.length,
    };
}

export type BookingPaymentIntelDashboard = ReturnType<typeof useBookingPaymentIntelDashboard>;
