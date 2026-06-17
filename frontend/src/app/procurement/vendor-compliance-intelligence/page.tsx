'use client';

import React, { useMemo, useState } from 'react';
import { LuSparkles } from 'react-icons/lu';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { VendorComplianceExecutiveSummary } from '@/components/vendor-compliance-intelligence/VendorComplianceExecutiveSummary';
import { VendorComplianceFiltersBar } from '@/components/vendor-compliance-intelligence/VendorComplianceFiltersBar';
import { VendorComplianceAttentionToday } from '@/components/vendor-compliance-intelligence/VendorComplianceAttentionToday';
import {
    AiValidationResults,
    CompliancePerformanceByCategory,
    ExpiryCenter,
    KycVerificationCenter,
    VendorComplianceForecastCards,
    VendorComplianceHealthOverview,
    VendorComplianceInsightsTable,
    VendorComplianceRecommendedActions,
    VendorRegistrySection,
    VendorRiskCenter,
} from '@/components/vendor-compliance-intelligence/VendorComplianceIntelSections';
import { useVendorComplianceIntelDashboard } from '@/hooks/useVendorComplianceIntelDashboard';
import {
    defaultVendorComplianceIntelFilters,
    type VendorComplianceIntelFilters,
} from '@/lib/vendorComplianceIntelligenceHelpers';

export default function VendorComplianceIntelligencePage() {
    const [filters, setFilters] = useState<VendorComplianceIntelFilters>(() => defaultVendorComplianceIntelFilters());

    const patchFilters = (patch: Partial<VendorComplianceIntelFilters>) => {
        setFilters((f) => ({ ...f, ...patch }));
    };

    const dashboard = useVendorComplianceIntelDashboard(filters);

    const hasFilteredVendors = dashboard.vendorCount > 0;
    const filterActive = useMemo(() => {
        const d = defaultVendorComplianceIntelFilters();
        return (
            filters.categoryFilter !== d.categoryFilter ||
            filters.complianceStatusFilter !== d.complianceStatusFilter ||
            filters.riskLevelFilter !== d.riskLevelFilter
        );
    }, [filters]);

    return (
        <CompanyAdminDashboardLayout>
            <div className="space-y-4 pb-10">
                <Breadcrumb
                    items={[
                        { label: 'Vendor management', href: '/company-admin/vendors' },
                        { label: 'AI Vendor Compliance Intelligence' },
                    ]}
                />

                <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">AI Vendor Compliance Intelligence</h1>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                            <LuSparkles size={12} aria-hidden />
                            Vendor compliance & risk
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">
                        AI-powered vendor compliance monitoring, KYC verification, document expiry tracking, and vendor risk management.
                    </p>
                </div>

                <VendorComplianceFiltersBar filters={filters} onChange={patchFilters} />

                {filterActive && hasFilteredVendors ? (
                    <p className="text-xs font-medium text-slate-500">
                        Showing {dashboard.vendorCount} of {dashboard.allVendorCount} vendor
                        {dashboard.allVendorCount === 1 ? '' : 's'}
                    </p>
                ) : null}

                <div className="min-w-0 space-y-4">
                    <VendorComplianceExecutiveSummary executive={dashboard.executive} />

                    {hasFilteredVendors ? (
                        <>
                            {dashboard.attention.length > 0 ? (
                                <VendorComplianceAttentionToday items={dashboard.attention} />
                            ) : null}

                            <VendorComplianceHealthOverview snapshot={dashboard.healthSnapshot} />
                            <VendorRegistrySection vendors={dashboard.rankedVendors} />
                            <KycVerificationCenter profile={dashboard.kycProfile} />
                            <AiValidationResults findings={dashboard.validationFindings} />
                            <VendorRiskCenter
                                riskScore={dashboard.sampleRiskScore}
                                riskFactors={dashboard.riskFactors}
                                highRiskVendors={dashboard.highRiskVendors}
                            />
                            <ExpiryCenter counts={dashboard.expiryCounts} expiries={dashboard.expiries} />
                            <VendorComplianceRecommendedActions actions={dashboard.actions} />
                            <VendorComplianceForecastCards periods={dashboard.forecasts} />
                            <CompliancePerformanceByCategory categories={dashboard.categoryPerformance} />
                            <VendorComplianceInsightsTable vendors={dashboard.rankedVendors} />
                        </>
                    ) : (
                        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                            No vendors match your filters. Adjust vendor category, compliance status, or risk level to see the
                            command center.
                        </p>
                    )}
                </div>
            </div>
        </CompanyAdminDashboardLayout>
    );
}
