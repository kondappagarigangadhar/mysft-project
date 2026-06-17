'use client';

import React, { useMemo, useState } from 'react';
import { LuSparkles } from 'react-icons/lu';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { DemandFiltersBar } from '@/components/demand-intelligence/DemandFiltersBar';
import { DemandExecutiveSummary } from '@/components/demand-intelligence/DemandExecutiveSummary';
import { DemandAttentionToday } from '@/components/demand-intelligence/DemandAttentionToday';
import {
    DemandInventoryRiskCenter,
    DemandProjectIntelligenceTable,
    DemandProjectRanking,
    DemandRecommendedActions,
    DemandRevenueOpportunityCenter,
} from '@/components/demand-intelligence/DemandIntelSections';
import { useDemandIntelDashboard } from '@/hooks/useDemandIntelDashboard';
import {
    defaultDemandIntelFilters,
    type DemandIntelFilters,
} from '@/lib/demandIntelligenceHelpers';
import {
    DEMAND_INVENTORY_TYPE_OPTIONS,
    DEMAND_LOCATION_OPTIONS,
    DEMAND_PROJECT_OPTIONS,
    DEMAND_UNIT_TYPE_OPTIONS,
} from '@/lib/demandIntelligenceStore';

export default function DemandIntelligencePage() {
    const [filters, setFilters] = useState<DemandIntelFilters>(() => defaultDemandIntelFilters());

    const patchFilters = (patch: Partial<DemandIntelFilters>) => {
        setFilters((f) => ({ ...f, ...patch }));
    };

    const dashboard = useDemandIntelDashboard(filters);

    const hasFilteredProjects = dashboard.projectCount > 0;
    const filterActive = useMemo(() => {
        const d = defaultDemandIntelFilters();
        return (
            filters.projectFilter !== d.projectFilter ||
            filters.locationFilter !== d.locationFilter ||
            filters.inventoryTypeFilter !== d.inventoryTypeFilter ||
            filters.unitTypeFilter !== d.unitTypeFilter ||
            filters.demandMin !== d.demandMin ||
            filters.demandMax !== d.demandMax
        );
    }, [filters]);

    return (
        <CompanyAdminDashboardLayout>
            <div className="space-y-4 pb-10">
                <Breadcrumb
                    items={[
                        { label: 'Projects & Inventory', href: '/projects-inventory' },
                        { label: 'AI Demand Intelligence' },
                    ]}
                />

                <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">AI Demand Intelligence</h1>
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                            <LuSparkles size={12} aria-hidden />
                            Revenue & demand
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">
                        Command center for demand, revenue, and inventory velocity — what needs attention and what to do today.
                    </p>
                </div>

                <DemandFiltersBar
                    filters={filters}
                    projectOptions={DEMAND_PROJECT_OPTIONS}
                    locationOptions={DEMAND_LOCATION_OPTIONS}
                    inventoryTypeOptions={[...DEMAND_INVENTORY_TYPE_OPTIONS]}
                    unitTypeOptions={[...DEMAND_UNIT_TYPE_OPTIONS]}
                    onChange={patchFilters}
                />

                {filterActive && hasFilteredProjects ? (
                    <p className="text-xs font-medium text-slate-500">
                        Showing {dashboard.projectCount} of {dashboard.allProjectCount} project
                        {dashboard.allProjectCount === 1 ? '' : 's'}
                    </p>
                ) : null}

                <div className="space-y-4">
                    <DemandExecutiveSummary executive={dashboard.executive} />

                    {hasFilteredProjects ? (
                        <>
                            {dashboard.attention.length > 0 ? (
                                <DemandAttentionToday items={dashboard.attention} />
                            ) : null}
                            <DemandRecommendedActions actions={dashboard.actions} />
                            <DemandRevenueOpportunityCenter projects={dashboard.revenueOpportunities} />
                            <DemandInventoryRiskCenter rows={dashboard.inventoryRisks} />
                            <DemandProjectRanking projects={dashboard.rankedProjects} />
                            <DemandProjectIntelligenceTable projects={dashboard.rankedProjects} />
                        </>
                    ) : (
                        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                            No projects match your filters. Adjust demand range, project, or location to see the command
                            center.
                        </p>
                    )}
                </div>
            </div>
        </CompanyAdminDashboardLayout>
    );
}
