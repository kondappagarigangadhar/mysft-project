'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LuRefreshCw, LuSparkles } from 'react-icons/lu';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { AiSalesIntelFiltersBar } from '@/components/ai-sales-intelligence/AiSalesIntelFiltersBar';
import { AiSalesIntelInsightsDrawer } from '@/components/ai-sales-intelligence/AiSalesIntelInsightsDrawer';
import {
    AiSalesBehaviorAnalysis,
    AiSalesConversionFunnel,
    AiSalesConversionPredictionCenter,
    AiSalesModelPerformanceDashboard,
    AiSalesNextBestActionCenter,
    AiSalesOpportunityPrioritization,
    AiSalesRecommendationQueue,
    AiSalesScoringBreakdown,
    AiSalesTemperatureDistribution,
} from '@/components/ai-sales-intelligence/AiSalesIntelSections';
import {
    defaultAISalesIntelFilters,
    useAiSalesIntelDashboard,
} from '@/hooks/useAiSalesIntelDashboard';
import { getLastBatchRunAt, runNightlyAIBatch } from '@/lib/ai-sales-intelligence/aiInsightsRepository';
import { AI_MODEL_VERSION } from '@/lib/ai-sales-intelligence/aiSalesEngine';
import {
    canRecalculateAISalesIntelligence,
    canViewAISalesIntelligence,
} from '@/lib/ai-sales-intelligence/aiSalesIntelligenceRbac';
import type { AISalesIntelligenceLead } from '@/lib/aiSalesIntelligenceStore';
import { formatCalculatedAt, getAISalesProjectOptions } from '@/lib/aiSalesIntelligenceHelpers';
import {
    COMPLIANCE_ROLE_STORAGE_KEY,
    type ComplianceDemoRole,
} from '@/lib/complianceRbac';

function readDemoRole(): ComplianceDemoRole {
    if (typeof window === 'undefined') return 'company_admin';
    const raw = localStorage.getItem(COMPLIANCE_ROLE_STORAGE_KEY);
    if (raw === 'super_admin' || raw === 'company_admin' || raw === 'staff' || raw === 'viewer') return raw;
    return 'company_admin';
}

export default function AISalesIntelligencePage() {
    const [filters, setFilters] = useState(defaultAISalesIntelFilters);
    const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
    const [drawerLead, setDrawerLead] = useState<AISalesIntelligenceLead | null>(null);
    const [role, setRole] = useState<ComplianceDemoRole>('company_admin');
    const [batchRunning, setBatchRunning] = useState(false);
    const [lastBatch, setLastBatch] = useState<string | null>(null);

    useEffect(() => {
        setRole(readDemoRole());
        setLastBatch(getLastBatchRunAt());
    }, []);

    const dashboard = useAiSalesIntelDashboard(filters);
    const projectOptions = useMemo(() => getAISalesProjectOptions(dashboard.allLeads), [dashboard.allLeads]);

    const selectedLead = useMemo(
        () => dashboard.filteredLeads.find((l) => l.leadSlug === selectedSlug) ?? null,
        [dashboard.filteredLeads, selectedSlug],
    );

    const patchFilters = (patch: Partial<typeof filters>) => {
        setFilters((f) => ({ ...f, ...patch }));
    };

    const runBatch = useCallback(async () => {
        setBatchRunning(true);
        try {
            const count = runNightlyAIBatch();
            setLastBatch(getLastBatchRunAt());
            window.dispatchEvent(new CustomEvent('arris-ai-sales-updated', { detail: { batch: count } }));
        } finally {
            setBatchRunning(false);
        }
    }, []);

    if (!canViewAISalesIntelligence(role)) {
        return (
            <CompanyAdminDashboardLayout>
                <div className="mx-auto max-w-lg space-y-3 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <h1 className="text-lg font-semibold text-slate-900">Access restricted</h1>
                    <p className="text-sm text-slate-600">
                        AI Sales Intelligence analytics are available to Sales Managers and Administrators only.
                    </p>
                </div>
            </CompanyAdminDashboardLayout>
        );
    }

    return (
        <CompanyAdminDashboardLayout>
            <div className="space-y-4 pb-10">
                <Breadcrumb
                    items={[
                        { label: 'Leads', href: '/leads' },
                        { label: 'AI Sales Intelligence' },
                    ]}
                />

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-800">AI Sales Intelligence</h1>
                            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                                <LuSparkles size={12} aria-hidden />
                                Hybrid AI · MVP
                            </span>
                        </div>
                        <p className="text-sm text-slate-500">
                            AI-powered lead scoring, conversion prediction, opportunity prioritization, and sales recommendations.
                        </p>
                        <p className="text-[11px] text-slate-400">
                            Model {AI_MODEL_VERSION}
                            {lastBatch ? ` · Last batch ${formatCalculatedAt(lastBatch)}` : ' · Scores recalculate on lead updates'}
                        </p>
                    </div>
                    {canRecalculateAISalesIntelligence(role) ? (
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="cta"
                            className="shrink-0 gap-2"
                            onClick={() => void runBatch()}
                            isLoading={batchRunning}
                        >
                            <LuRefreshCw size={16} aria-hidden />
                            Recalculate all leads
                        </Button>
                    ) : null}
                </div>

                <AiSalesIntelFiltersBar filters={filters} projectOptions={projectOptions} onChange={patchFilters} />

                {filters.search || filters.temperature !== 'All' || filters.project !== 'All' ? (
                    <p className="text-xs font-medium text-slate-500">
                        Showing {dashboard.filteredLeads.length} of {dashboard.allLeads.length} analyzed leads
                    </p>
                ) : null}

                <div className="space-y-4">
                    <AiSalesModelPerformanceDashboard kpis={dashboard.modelPerformance} />

                    <div className="grid gap-4 xl:grid-cols-3">
                        <div className="xl:col-span-2">
                            <AiSalesConversionPredictionCenter
                                leads={dashboard.conversionPrediction}
                                selectedSlug={selectedSlug}
                                onSelectLead={setSelectedSlug}
                                onOpenInsights={setDrawerLead}
                            />
                        </div>
                        <AiSalesScoringBreakdown lead={selectedLead} />
                    </div>

                    <AiSalesOpportunityPrioritization rows={dashboard.opportunityPrioritization} />

                    <div className="grid gap-4 lg:grid-cols-2">
                        <AiSalesTemperatureDistribution buckets={dashboard.temperatureDistribution} />
                        <AiSalesNextBestActionCenter leads={dashboard.nextBestActions} />
                    </div>

                    <AiSalesBehaviorAnalysis rows={dashboard.behaviorAnalysis} />

                    <div className="grid gap-4 lg:grid-cols-2">
                        <AiSalesConversionFunnel steps={dashboard.conversionFunnel} />
                        <AiSalesRecommendationQueue leads={dashboard.recommendationQueue} />
                    </div>
                </div>
            </div>

            <AiSalesIntelInsightsDrawer lead={drawerLead} onClose={() => setDrawerLead(null)} />
        </CompanyAdminDashboardLayout>
    );
}
