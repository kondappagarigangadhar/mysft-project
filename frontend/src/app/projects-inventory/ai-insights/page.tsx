'use client';

import React, { useMemo } from 'react';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/projects-inventory/KpiCard';
import { SelectInput } from '@/components/projects-inventory/SelectInput';
import {
    computeDemandScorePercent,
    getProjects,
    getTotalLeadDemandCountAcrossProjects,
    type UnitType,
} from '@/lib/projectsInventoryStore';
import { getLeads } from '@/lib/leadStore';
import { LuSparkles, LuTarget } from 'react-icons/lu';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

function mapLeadPropertyTypeToUnitType(p: string): UnitType {
    const s = (p || '').toLowerCase();
    if (s.includes('villa')) return 'Villa';
    if (s.includes('duplex')) return 'Villa';
    return 'Apartment';
}

function labelUnitType(t: UnitType) {
    return t === 'Plot' ? 'Plot' : t === 'Villa' ? 'Villa' : 'Apartment';
}

export default function AiInsightsPage() {
    const projects = useMemo(() => getProjects(), []);
    const leads = useMemo(() => getLeads(), []);

    const insights = useMemo(() => {
        const projectNames = projects.map((p) => p.project_name);
        const leadDemandCount = getTotalLeadDemandCountAcrossProjects(projectNames);
        const demandScore = computeDemandScorePercent(
            projects.length ? Math.round(leadDemandCount / Math.max(1, projects.length)) : 0,
            projects.length
        );

        const demandPrediction = Math.max(0, Math.min(100, Math.round(demandScore * 0.9 + 6)));

        const unitTypeCounts: Record<UnitType, number> = { Plot: 0, Apartment: 0, Villa: 0 };
        leads.forEach((l) => {
            const ut = mapLeadPropertyTypeToUnitType(l.preferredUnitType) || 'Apartment';
            unitTypeCounts[ut] += 1;
        });
        const topUnitType = (Object.entries(unitTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Apartment') as UnitType;

        const totalLeads = leads.length || 1;
        const lostCount = leads.filter((l) => l.status === 'Lost').length;
        const priceSensitivityIndex = Math.max(0, Math.min(100, Math.round((lostCount / totalLeads) * 100)));

        return { leadDemandCount, demandScore, demandPrediction, topUnitType, priceSensitivityIndex };
    }, [projects, leads]);

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Projects & Inventory', href: '/projects-inventory/projects' },
                    { label: 'Inventory', href: '/projects-inventory/inventory' },
                    { label: 'AI Insights', href: '/projects-inventory/ai-insights' },
                ]}
            />
            <div className="mb-6 mt-2">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">AI Insights</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Highlights derived from demand and pricing signals.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <KpiCard title="Demand Prediction" value={`${insights.demandPrediction}%`} icon={<LuSparkles />} subValue="AI-generated demand estimate" />
                <KpiCard title="Price Sensitivity Index" value={`${insights.priceSensitivityIndex}%`} icon={<LuTarget />} subValue="Higher means customers drop with price changes" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-none shadow-md lg:col-span-2">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800">Insight Widgets</h2>
                        <p className="text-sm text-slate-500 mt-1">Quick, actionable recommendations for pricing and inventory strategy.</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="rounded-xl border border-slate-200 p-4 bg-white">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Top Interested Unit Type</p>
                            <p className="text-lg font-black text-slate-900 mt-2">{labelUnitType(insights.topUnitType)}</p>
                            <p className="text-sm text-slate-600 mt-2">
                                Focus marketing and promotions on this unit type to improve conversion likelihood.
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4 bg-white">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Suggested Pricing Approach</p>
                            <p className="text-sm text-slate-600 mt-2">
                                {insights.priceSensitivityIndex >= 60
                                    ? 'Customers are highly price-sensitive. Request smaller offer_price adjustments with tighter approvals.'
                                    : 'Customers show moderate price sensitivity. You can request larger base_price updates with approval controls.'}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="border-none shadow-md">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800">Top Unit Type</h2>
                        <p className="text-sm text-slate-500 mt-1">Derived from lead property interest.</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <SelectInput
                            value={insights.topUnitType}
                            onChange={() => {}}
                            options={[
                                { value: 'Plot', label: 'Plot' },
                                { value: 'Apartment', label: 'Apartment' },
                                { value: 'Villa', label: 'Villa' },
                            ]}
                            disabled
                        />
                        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                            <p className="text-sm font-semibold text-slate-800">Demand Score</p>
                            <p className="text-2xl font-black text-slate-900 mt-2">{insights.demandScore}%</p>
                            <p className="text-sm text-slate-600 mt-2">
                                Lead demand count: {insights.leadDemandCount}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </CompanyAdminDashboardLayout>
    );
}

