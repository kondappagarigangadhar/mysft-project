'use client';

import React, { useMemo, useState } from 'react';
import { LuSparkles } from 'react-icons/lu';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ResidentFiltersBar } from '@/components/resident-intelligence/ResidentFiltersBar';
import { ResidentExecutiveSummary } from '@/components/resident-intelligence/ResidentExecutiveSummary';
import { ResidentAttentionToday } from '@/components/resident-intelligence/ResidentAttentionToday';
import {
    ResidentCommunityRanking,
    ResidentEngagementOpportunityCenter,
    ResidentIntelligenceTable,
    ResidentRecommendedActions,
    ResidentRiskCenter,
} from '@/components/resident-intelligence/ResidentIntelSections';
import { useResidentIntelDashboard } from '@/hooks/useResidentIntelDashboard';
import {
    defaultResidentIntelFilters,
    type ResidentIntelFilters,
} from '@/lib/residentIntelligenceHelpers';
import { residentsListHref } from '@/lib/residentRoutes';

export default function ResidentIntelligencePage() {
    const [filters, setFilters] = useState<ResidentIntelFilters>(() => defaultResidentIntelFilters());

    const patchFilters = (patch: Partial<ResidentIntelFilters>) => {
        setFilters((f) => ({ ...f, ...patch }));
    };

    const dashboard = useResidentIntelDashboard(filters);

    const hasFilteredResidents = dashboard.residentCount > 0;
    const filterActive = useMemo(() => {
        const d = defaultResidentIntelFilters();
        return (
            filters.propertyFilter !== d.propertyFilter ||
            filters.residentStatusFilter !== d.residentStatusFilter ||
            filters.portalFilter !== d.portalFilter ||
            filters.tagFilter !== d.tagFilter ||
            filters.healthFilter !== d.healthFilter ||
            filters.datePreset !== d.datePreset
        );
    }, [filters]);

    return (
        <CompanyAdminDashboardLayout>
            <div className="space-y-4 pb-10">
                <Breadcrumb
                    items={[
                        { label: 'Resident Management', href: residentsListHref() },
                        { label: 'AI Resident Intelligence' },
                    ]}
                />

                <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">AI Resident Intelligence</h1>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                            <LuSparkles size={12} aria-hidden />
                            Community & occupancy
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">
                        Command center for resident health, portal access, service SLAs, and community engagement — what needs
                        attention and what to do today.
                    </p>
                </div>

                <ResidentFiltersBar filters={filters} onChange={patchFilters} />

                {filterActive && hasFilteredResidents ? (
                    <p className="text-xs font-medium text-slate-500">
                        Showing {dashboard.residentCount} of {dashboard.allResidentCount} resident
                        {dashboard.allResidentCount === 1 ? '' : 's'}
                    </p>
                ) : null}

                <div className="space-y-4">
                    <ResidentExecutiveSummary executive={dashboard.executive} />

                    {hasFilteredResidents ? (
                        <>
                            {dashboard.attention.length > 0 ? (
                                <ResidentAttentionToday items={dashboard.attention} />
                            ) : null}
                            <ResidentRecommendedActions actions={dashboard.actions} />
                            <ResidentEngagementOpportunityCenter opportunities={dashboard.engagementOpportunities} />
                            <ResidentRiskCenter rows={dashboard.risks} />
                            <ResidentCommunityRanking residents={dashboard.rankedResidents} />
                            <ResidentIntelligenceTable residents={dashboard.rankedResidents} />
                        </>
                    ) : (
                        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                            No residents match your filters. Adjust property, status, or health filters to see the command center.
                        </p>
                    )}
                </div>
            </div>
        </CompanyAdminDashboardLayout>
    );
}
