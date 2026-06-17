'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/projects-inventory/KpiCard';
import {
    computeDemandScorePercent,
    getInventoryAggregateCounts,
    getLeadDemandCountForProjectName,
    getProjects,
    getTotalLeadDemandCountAcrossProjects,
} from '@/lib/projectsInventoryStore';
import { LuEye, LuLock, LuTrendingUp, LuUsers } from 'react-icons/lu';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default function AnalyticsPage() {
    const projects = useMemo(() => getProjects(), []);
    const projectNames = useMemo(() => projects.map((p) => p.project_name), [projects]);

    const { leadDemandCount, demandScore, trend, inv, projectRows } = useMemo(() => {
        const invCounts = getInventoryAggregateCounts();
        const totalLeadsMatched = getTotalLeadDemandCountAcrossProjects(projectNames);
        const score = computeDemandScorePercent(
            projects.length ? Math.round(totalLeadsMatched / Math.max(1, projects.length)) : 0,
            projects.length
        );

        const byProject = projects.map((p) => {
            const count = getLeadDemandCountForProjectName(p.project_name);
            return {
                project: p.project_name,
                slug: p.slug,
                count,
                demandScore: computeDemandScorePercent(count, projects.length),
            };
        });

        const trendSeries = byProject.slice(0, 6).map((x, idx) => ({
            month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][idx] || `M${idx + 1}`,
            demand: x.count,
        }));

        return {
            leadDemandCount: totalLeadsMatched,
            demandScore: score,
            trend: trendSeries,
            inv: invCounts,
            projectRows: byProject,
        };
    }, [projects, projectNames]);

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Projects & Inventory', href: '/projects-inventory/projects' },
                    { label: 'Inventory', href: '/projects-inventory/inventory' },
                    { label: 'Analytics', href: '/projects-inventory/analytics' },
                ]}
            />
            <div className="mb-6 mt-2">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Analytics</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">
                    Lead demand count and demand score vs inventory (including booking locks).
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <KpiCard title="Lead demand count" value={leadDemandCount} icon={<LuUsers />} subValue="Leads on tracked projects" />
                <KpiCard title="Demand score" value={`${demandScore}%`} icon={<LuTrendingUp />} subValue="Portfolio interest index" />
                <KpiCard title="Units locked" value={inv.lockedForBooking} icon={<LuLock />} subValue="Booking sync active" />
                <KpiCard title="Available units" value={inv.available} icon={<LuUsers />} subValue="From inventory totals" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <Card className="border-none shadow-md">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800">Demand by Project</h2>
                        <p className="text-sm text-slate-500 mt-1">Lead demand count for each project name.</p>
                    </div>
                    <div className="p-6 h-[320px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={projectRows.map((r) => ({ project: r.project, demand: r.count }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="project" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="demand" fill="#0092ff" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="border-none shadow-md">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800">Demand Trends</h2>
                        <p className="text-sm text-slate-500 mt-1">Derived trend line from project demand signals.</p>
                    </div>
                    <div className="p-6 h-[320px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="demand" stroke="#0092ff" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="border-none shadow-md lg:col-span-2">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800">Demand score by project</h2>
                        <p className="text-sm text-slate-500 mt-1">Lead demand count and calculated demand score per project.</p>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Project</th>
                                    <th className="px-6 py-3">Lead demand</th>
                                    <th className="px-6 py-3">Demand score</th>
                                    <th className="px-6 py-3 text-right w-[1%]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {projectRows.map((r) => (
                                    <tr key={r.slug} className="bg-white hover:bg-slate-50/50">
                                        <td className="px-6 py-3 font-medium text-slate-800">{r.project}</td>
                                        <td className="px-6 py-3 tabular-nums text-slate-700">{r.count}</td>
                                        <td className="px-6 py-3 font-semibold text-primary tabular-nums">{r.demandScore}%</td>
                                        <td className="px-6 py-3 text-right whitespace-nowrap">
                                            <Link href={`/projects-inventory/projects/view/${r.slug}`}>
                                                <Button
                                                    type="button"
                                                    variant="companyGhost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg"
                                                    aria-label={`View project ${r.project}`}
                                                >
                                                    <LuEye size={18} />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </CompanyAdminDashboardLayout>
    );
}

