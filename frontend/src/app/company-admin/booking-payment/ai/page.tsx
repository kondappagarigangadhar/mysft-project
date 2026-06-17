'use client';

import React, { useMemo, useState } from 'react';
import { LuSparkles } from 'react-icons/lu';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { BookingPaymentFiltersBar } from '@/components/booking-payment-intelligence/BookingPaymentFiltersBar';
import { BookingPaymentExecutiveSummary } from '@/components/booking-payment-intelligence/BookingPaymentExecutiveSummary';
import { BookingPaymentAttentionToday } from '@/components/booking-payment-intelligence/BookingPaymentAttentionToday';
import {
    BookingCollectionOpportunityCenter,
    BookingCollectionRanking,
    BookingPaymentInsightsTable,
    BookingPaymentRiskCenter,
    BookingRecommendedActions,
} from '@/components/booking-payment-intelligence/BookingPaymentIntelSections';
import { useBookingPaymentIntelDashboard } from '@/hooks/useBookingPaymentIntelDashboard';
import {
    defaultBookingIntelFilters,
    type BookingIntelFilters,
} from '@/lib/bookingPaymentIntelligenceHelpers';

export default function BookingPaymentAiRoutePage() {
    const [filters, setFilters] = useState<BookingIntelFilters>(() => defaultBookingIntelFilters());

    const patchFilters = (patch: Partial<BookingIntelFilters>) => {
        setFilters((f) => ({ ...f, ...patch }));
    };

    const dashboard = useBookingPaymentIntelDashboard(filters);

    const hasFilteredBookings = dashboard.bookingCount > 0;
    const filterActive = useMemo(() => {
        const d = defaultBookingIntelFilters();
        return (
            filters.projectFilter !== d.projectFilter ||
            filters.bookingStatusFilter !== d.bookingStatusFilter ||
            filters.paymentStatusFilter !== d.paymentStatusFilter ||
            filters.assignedFilter !== d.assignedFilter ||
            filters.datePreset !== d.datePreset
        );
    }, [filters]);

    return (
        
            <div className="space-y-4 pb-10">
                <Breadcrumb
                    items={[
                        { label: 'Booking & Payment', href: '/company-admin/booking-payment/booking' },
                        { label: 'Booking & Payment AI Intelligence' },
                    ]}
                />

                <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Booking & Payment AI Intelligence</h1>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                            <LuSparkles size={12} aria-hidden />
                            Collections & payments
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">
                        Command center for collections, overdue installments, and payment recovery — what needs attention and what to do today.
                    </p>
                </div>

                <BookingPaymentFiltersBar filters={filters} onChange={patchFilters} />

                {filterActive && hasFilteredBookings ? (
                    <p className="text-xs font-medium text-slate-500">
                        Showing {dashboard.bookingCount} of {dashboard.allBookingCount} booking
                        {dashboard.allBookingCount === 1 ? '' : 's'}
                    </p>
                ) : null}

                <div className="space-y-4">
                    <BookingPaymentExecutiveSummary executive={dashboard.executive} />

                    {hasFilteredBookings ? (
                        <>
                            {dashboard.attention.length > 0 ? (
                                <BookingPaymentAttentionToday items={dashboard.attention} />
                            ) : null}
                            <BookingRecommendedActions actions={dashboard.actions} />
                            <BookingCollectionOpportunityCenter opportunities={dashboard.collectionOpportunities} />
                            <BookingPaymentRiskCenter rows={dashboard.paymentRisks} />
                            <BookingCollectionRanking bookings={dashboard.rankedBookings} />
                            <BookingPaymentInsightsTable bookings={dashboard.rankedBookings} />
                        </>
                    ) : (
                        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                            No bookings match your filters. Adjust project, status, or payment filters to see the command center.
                        </p>
                    )}
                </div>
            </div>
        
    );
}
