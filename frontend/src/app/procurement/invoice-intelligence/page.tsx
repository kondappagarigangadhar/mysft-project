'use client';

import React, { useMemo, useState } from 'react';
import { LuSparkles } from 'react-icons/lu';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { InvoiceExecutiveSummary } from '@/components/invoice-intelligence/InvoiceExecutiveSummary';
import { InvoiceFiltersBar } from '@/components/invoice-intelligence/InvoiceFiltersBar';
import { InvoiceAttentionToday } from '@/components/invoice-intelligence/InvoiceAttentionToday';
import {
    AiValidationCenter,
    DuplicateDetectionCenter,
    FraudDetectionCenter,
    InvoiceForecastCards,
    InvoiceHealthOverview,
    InvoiceInsightsTable,
    InvoiceRecommendedActions,
    InvoiceRepositorySection,
    PaymentTracker,
    PoMatchingCenter,
} from '@/components/invoice-intelligence/InvoiceIntelSections';
import { useInvoiceIntelDashboard } from '@/hooks/useInvoiceIntelDashboard';
import { defaultInvoiceIntelFilters, type InvoiceIntelFilters } from '@/lib/invoiceIntelligenceHelpers';

export default function InvoiceIntelligencePage() {
    const [filters, setFilters] = useState<InvoiceIntelFilters>(() => defaultInvoiceIntelFilters());

    const patchFilters = (patch: Partial<InvoiceIntelFilters>) => {
        setFilters((f) => ({ ...f, ...patch }));
    };

    const dashboard = useInvoiceIntelDashboard(filters);

    const hasFilteredInvoices = dashboard.invoiceCount > 0;
    const filterActive = useMemo(() => {
        const d = defaultInvoiceIntelFilters();
        return (
            filters.vendorFilter !== d.vendorFilter ||
            filters.statusFilter !== d.statusFilter ||
            filters.riskLevelFilter !== d.riskLevelFilter
        );
    }, [filters]);

    return (
        <CompanyAdminDashboardLayout>
            <div className="space-y-4 pb-10">
                <Breadcrumb
                    items={[
                        { label: 'Procurement Management', href: '/procurement/requests' },
                        { label: 'AI Invoice Intelligence' },
                    ]}
                />

                <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">AI Invoice Intelligence</h1>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                            <LuSparkles size={12} aria-hidden />
                            Invoice validation & finance intelligence
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">
                        AI-powered invoice validation, PO matching, duplicate detection, fraud monitoring, and payment intelligence.
                    </p>
                </div>

                <InvoiceFiltersBar filters={filters} onChange={patchFilters} />

                {filterActive && hasFilteredInvoices ? (
                    <p className="text-xs font-medium text-slate-500">
                        Showing {dashboard.invoiceCount} of {dashboard.allInvoiceCount} invoice
                        {dashboard.allInvoiceCount === 1 ? '' : 's'}
                    </p>
                ) : null}

                <div className="min-w-0 space-y-4">
                    <InvoiceExecutiveSummary executive={dashboard.executive} />

                    {hasFilteredInvoices ? (
                        <>
                            {dashboard.attention.length > 0 ? (
                                <InvoiceAttentionToday items={dashboard.attention} />
                            ) : null}

                            <InvoiceHealthOverview snapshot={dashboard.healthSnapshot} />
                            <InvoiceRepositorySection invoices={dashboard.rankedInvoices} />
                            <AiValidationCenter sample={dashboard.extractionSample} />
                            <PoMatchingCenter highlights={dashboard.poMatches} />
                            <DuplicateDetectionCenter duplicates={dashboard.duplicates} />
                            <FraudDetectionCenter
                                fraudScore={dashboard.sampleFraudScore}
                                categories={dashboard.fraudCategories}
                                alerts={dashboard.fraudAlerts}
                            />
                            <PaymentTracker counts={dashboard.paymentCounts} payments={dashboard.payments} />
                            <InvoiceRecommendedActions actions={dashboard.actions} />
                            <InvoiceForecastCards periods={dashboard.forecasts} />
                            <InvoiceInsightsTable invoices={dashboard.rankedInvoices} />
                        </>
                    ) : (
                        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                            No invoices match your filters. Adjust vendor, status, or risk level to see the command center.
                        </p>
                    )}
                </div>
            </div>
        </CompanyAdminDashboardLayout>
    );
}
