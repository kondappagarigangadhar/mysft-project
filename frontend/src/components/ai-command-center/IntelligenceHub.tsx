'use client';

import React, { useState } from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line,
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import { LuCircleAlert, LuLightbulb, LuTarget } from 'react-icons/lu';
import { HEATMAP_DATA, INTELLIGENCE_TABS, TAB_KPIS, TREND_DATA } from '@/lib/aiCommandCenter/mockData';
import { ACC, CHART_COLORS } from '@/lib/aiCommandCenter/constants';
import { cn } from '@/lib/utils';
import { GlassCard, MetricKpi, SectionHeader } from './shared';

function HeatmapGrid() {
    const metrics = ['sales', 'finance', 'vendor', 'project'] as const;
    const labels = { sales: 'Sales', finance: 'Finance', vendor: 'Vendor', project: 'Project' };

    const getColor = (v: number) => {
        if (v >= 90) return ACC.success;
        if (v >= 80) return ACC.accent;
        if (v >= 70) return ACC.warning;
        return ACC.danger;
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] border-collapse text-xs">
                <thead>
                    <tr>
                        <th className="p-2 text-left font-semibold text-slate-500">Region</th>
                        {metrics.map((m) => (
                            <th key={m} className="p-2 text-center font-semibold text-slate-500">
                                {labels[m]}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {HEATMAP_DATA.map((row) => (
                        <tr key={row.region}>
                            <td className="p-2 font-medium text-slate-700 dark:text-slate-300">{row.region}</td>
                            {metrics.map((m) => {
                                const v = row[m];
                                return (
                                    <td key={m} className="p-1.5">
                                        <div
                                            className="rounded-lg py-2 text-center font-bold text-white"
                                            style={{ backgroundColor: getColor(v), opacity: 0.85 + v / 1000 }}
                                        >
                                            {v}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function IntelligenceHub() {
    const [activeTab, setActiveTab] = useState<(typeof INTELLIGENCE_TABS)[number]>('Sales');
    const kpis = TAB_KPIS[activeTab] ?? [];

    return (
        <section id="intelligence" className="scroll-mt-24 space-y-4">
            <SectionHeader
                title="Intelligence Hub"
                subtitle="Cross-module analytics with AI insights, forecasts, and recommended actions."
                badge="Zone 3"
            />

            <GlassCard>
                <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-4 dark:border-slate-700">
                    {INTELLIGENCE_TABS.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                'rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200',
                                activeTab === tab
                                    ? 'text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                            )}
                            style={
                                activeTab === tab
                                    ? { background: `linear-gradient(135deg, ${ACC.primary}, ${ACC.accent})` }
                                    : undefined
                            }
                        >
                            {tab} Intelligence
                        </button>
                    ))}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {kpis.map((k) => (
                        <MetricKpi key={k.label} {...k} />
                    ))}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-700">
                        <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Revenue & Forecast Trends</p>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={TREND_DATA.revenue}>
                                    <defs>
                                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={ACC.primary} stopOpacity={0.3} />
                                            <stop offset="100%" stopColor={ACC.primary} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                                    <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="value" stroke={ACC.primary} fill="url(#revGrad)" strokeWidth={2} name="Revenue (₹Cr)" />
                                    <Line type="monotone" dataKey="forecast" stroke={ACC.accent} strokeDasharray="4 4" strokeWidth={2} name="Forecast" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-700">
                        <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Conversion Trends</p>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={TREND_DATA.conversion}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                                    <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" unit="%" />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="value" stroke={ACC.success} strokeWidth={2.5} dot={{ r: 4, fill: ACC.success }} name="Conversion %" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-700 lg:col-span-2">
                        <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Regional Performance Heatmap</p>
                        <HeatmapGrid />
                    </div>

                    <div className="space-y-3">
                        <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
                            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                <LuCircleAlert size={16} />
                                <p className="text-sm font-bold">Top Risks</p>
                            </div>
                            <ul className="mt-2 space-y-1.5 text-xs text-red-800 dark:text-red-300">
                                <li>• Vendor compliance gaps (3)</li>
                                <li>• Green Valley inventory shortage</li>
                                <li>• Hyderabad collections below target</li>
                            </ul>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                <LuTarget size={16} />
                                <p className="text-sm font-bold">Top Opportunities</p>
                            </div>
                            <ul className="mt-2 space-y-1.5 text-xs text-emerald-800 dark:text-emerald-300">
                                <li>• ₹18Cr weighted pipeline value</li>
                                <li>• Premium unit demand spike (+14%)</li>
                                <li>• 3 high-value leads ready to close</li>
                            </ul>
                        </div>
                        <div
                            className="rounded-xl border p-4"
                            style={{ borderColor: `${ACC.primary}25`, background: `${ACC.primary}06` }}
                        >
                            <div className="flex items-center gap-2" style={{ color: ACC.primary }}>
                                <LuLightbulb size={16} />
                                <p className="text-sm font-bold">AI Recommendation</p>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                Focus on Hyderabad collections and Green Valley inventory allocation to protect Q2 revenue targets.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-5 rounded-xl border border-slate-100 p-4 dark:border-slate-700">
                    <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Category Distribution</p>
                    <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={[
                                    { name: 'Sales', value: 94 },
                                    { name: 'Finance', value: 91 },
                                    { name: 'Vendor', value: 87 },
                                    { name: 'Project', value: 92 },
                                    { name: 'Community', value: 95 },
                                ]}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" domain={[0, 100]} />
                                <Tooltip />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </GlassCard>
        </section>
    );
}
