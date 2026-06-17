'use client';

import React, { useMemo, useState } from 'react';
import { LuSparkles } from 'react-icons/lu';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ContractFiltersBar } from '@/components/contract-intelligence/ContractFiltersBar';
import { ContractExecutiveSummary } from '@/components/contract-intelligence/ContractExecutiveSummary';
import { ContractAttentionToday } from '@/components/contract-intelligence/ContractAttentionToday';
import {
    ContractClauseLibrary,
    ContractComparisonCenter,
    ContractForecastCards,
    ContractInsightsTable,
    ContractRecommendedActions,
    ContractRenewalTracker,
    ContractRepositorySection,
    ContractReviewCenter,
} from '@/components/contract-intelligence/ContractIntelSections';
import { useContractIntelDashboard } from '@/hooks/useContractIntelDashboard';
import { defaultContractIntelFilters, type ContractIntelFilters } from '@/lib/contractIntelligenceHelpers';

export default function ContractIntelligencePage() {
    const [filters, setFilters] = useState<ContractIntelFilters>(() => defaultContractIntelFilters());

    const patchFilters = (patch: Partial<ContractIntelFilters>) => {
        setFilters((f) => ({ ...f, ...patch }));
    };

    const dashboard = useContractIntelDashboard(filters);

    const hasFilteredContracts = dashboard.contractCount > 0;
    const filterActive = useMemo(() => {
        const d = defaultContractIntelFilters();
        return (
            filters.contractTypeFilter !== d.contractTypeFilter ||
            filters.vendorFilter !== d.vendorFilter ||
            filters.riskLevelFilter !== d.riskLevelFilter ||
            filters.statusFilter !== d.statusFilter
        );
    }, [filters]);

    return (
       
            <div className="space-y-4 pb-10">
                <Breadcrumb
                    items={[
                        { label: 'Documents & Compliance', href: '/company-admin/documents-compliance' },
                        { label: 'AI Contract Intelligence' },
                    ]}
                />

                <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">AI Contract Intelligence</h1>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                            <LuSparkles size={12} aria-hidden />
                            Contract risk & compliance
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">
                        AI-powered contract review, risk detection, clause analysis, renewal tracking, and compliance monitoring.
                    </p>
                </div>

                <ContractFiltersBar filters={filters} onChange={patchFilters} />

                {filterActive && hasFilteredContracts ? (
                    <p className="text-xs font-medium text-slate-500">
                        Showing {dashboard.contractCount} of {dashboard.allContractCount} contract
                        {dashboard.allContractCount === 1 ? '' : 's'}
                    </p>
                ) : null}

                <div className="min-w-0 space-y-4">
                    <ContractExecutiveSummary executive={dashboard.executive} />

                    {hasFilteredContracts ? (
                        <>
                            {dashboard.attention.length > 0 ? (
                                <ContractAttentionToday items={dashboard.attention} />
                            ) : null}

                            <ContractRepositorySection
                                snapshot={dashboard.repositorySnapshot}
                                contracts={dashboard.rankedContracts}
                            />
                            <ContractReviewCenter sample={dashboard.extractionSample} />
                            <ContractComparisonCenter highlights={dashboard.comparisonHighlights} />
                            <ContractRenewalTracker counts={dashboard.renewalCounts} renewals={dashboard.renewals} />
                            <ContractClauseLibrary clauses={dashboard.clauses} />
                            <ContractRecommendedActions actions={dashboard.actions} />
                            <ContractForecastCards periods={dashboard.forecasts} />
                            <ContractInsightsTable contracts={dashboard.rankedContracts} />
                        </>
                    ) : (
                        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                            No contracts match your filters. Adjust contract type, vendor, risk level, or status to see the
                            command center.
                        </p>
                    )}
                </div>
            </div>
        
    );
}
