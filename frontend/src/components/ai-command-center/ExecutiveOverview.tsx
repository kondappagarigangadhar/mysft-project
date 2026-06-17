'use client';

import React from 'react';
import {
    ResponsiveContainer,
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
} from 'recharts';
import { LuTriangleAlert, LuFileText, LuShield, LuSparkles, LuTrendingUp } from 'react-icons/lu';
import { Button } from '@/components/ui/Button';
import { BUSINESS_HEALTH, EXECUTIVE_BRIEFING } from '@/lib/aiCommandCenter/mockData';
import { ACC } from '@/lib/aiCommandCenter/constants';
import { GlassCard, SectionHeader, TrendBadge } from './shared';

export function ExecutiveOverview() {
    const healthData = [{ name: 'Score', value: BUSINESS_HEALTH.overall, fill: ACC.primary }];
    const delta = BUSINESS_HEALTH.overall - BUSINESS_HEALTH.previousMonth;

    return (
        <section className="space-y-4">
            <SectionHeader
                title="Executive Intelligence Overview"
                subtitle="What happened, what is happening, and what needs your attention today."
                badge="Zone 1"
            />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
                {/* Left — AI Executive Briefing */}
                <GlassCard className="relative overflow-hidden">
                    <div
                        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-[0.06]"
                        style={{ background: `radial-gradient(circle, ${ACC.primary}, transparent)` }}
                        aria-hidden
                    />

                    <div className="relative">
                        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {EXECUTIVE_BRIEFING.greeting} <span aria-hidden>👋</span>
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-500">AI Business Summary · Today&apos;s Overview</p>

                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {EXECUTIVE_BRIEFING.metrics.map((m) => (
                                <div
                                    key={m.label}
                                    className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50"
                                >
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{m.label}</p>
                                    <div className="mt-1 flex items-center gap-1.5">
                                        <LuTrendingUp className="text-emerald-500" size={14} />
                                        <span className="text-lg font-bold text-slate-900 dark:text-white">{m.change}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 space-y-2">
                            {EXECUTIVE_BRIEFING.alerts.map((a) => (
                                <div
                                    key={a.text}
                                    className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200"
                                >
                                    <LuTriangleAlert size={14} className="shrink-0 text-amber-500" />
                                    {a.text}
                                </div>
                            ))}
                        </div>

                        <div
                            className="mt-5 rounded-xl border p-4"
                            style={{
                                borderColor: `${ACC.primary}20`,
                                background: `linear-gradient(135deg, ${ACC.primary}08, ${ACC.accent}05)`,
                            }}
                        >
                            <div className="mb-2 flex items-center gap-2">
                                <LuSparkles size={14} style={{ color: ACC.primary }} />
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: ACC.primary }}>
                                    AI Summary
                                </span>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{EXECUTIVE_BRIEFING.aiSummary}</p>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                            <Button variant="company" size="sm" className="gap-1.5">
                                <LuSparkles size={14} /> Open AI Copilot
                            </Button>
                            <Button variant="companyOutline" size="sm" className="gap-1.5">
                                <LuFileText size={14} /> View Executive Report
                            </Button>
                            <Button variant="companyOutline" size="sm" className="gap-1.5">
                                <LuShield size={14} /> Review Risks
                            </Button>
                            <Button variant="companyGhost" size="sm">Generate Board Report</Button>
                        </div>
                    </div>
                </GlassCard>

                {/* Right — Business Health Score */}
                <GlassCard>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Business Health Score</p>
                    <div className="relative mx-auto mt-2 h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                                cx="50%"
                                cy="50%"
                                innerRadius="70%"
                                outerRadius="100%"
                                barSize={12}
                                data={healthData}
                                startAngle={90}
                                endAngle={-270}
                            >
                                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                                <RadialBar background={{ fill: '#E2E8F0' }} dataKey="value" cornerRadius={8} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold" style={{ color: ACC.primary }}>
                                {BUSINESS_HEALTH.overall}
                            </span>
                            <span className="text-xs text-slate-500">/ 100</span>
                        </div>
                    </div>

                    <div className="mt-1 flex items-center justify-center gap-2">
                        <TrendBadge change={`+${delta} pts`} trend="up" />
                        <span className="text-xs text-slate-500">vs last month ({BUSINESS_HEALTH.previousMonth})</span>
                    </div>

                    <div className="mt-5 space-y-3">
                        {BUSINESS_HEALTH.breakdown.map((b) => (
                            <div key={b.name}>
                                <div className="mb-1 flex items-center justify-between text-xs">
                                    <span className="font-medium text-slate-600 dark:text-slate-300">{b.name} Health</span>
                                    <span className="font-bold text-slate-800 dark:text-white">{b.score}</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${b.score}%`, backgroundColor: b.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </section>
    );
}
