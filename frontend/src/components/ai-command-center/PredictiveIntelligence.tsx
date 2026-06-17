'use client';

import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { LuBrain, LuSparkles } from 'react-icons/lu';
import { PREDICTIONS } from '@/lib/aiCommandCenter/mockData';
import { ACC } from '@/lib/aiCommandCenter/constants';
import { GlassCard, SectionHeader } from './shared';

export function PredictiveIntelligence() {
    return (
        <section id="predictions" className="scroll-mt-24 space-y-4">
            <SectionHeader
                title="Predictive Intelligence Center"
                subtitle="AI-powered forecasts with confidence scores and business impact analysis."
                badge="Zone 5"
            />

            <div
                className="relative overflow-hidden rounded-2xl border p-1"
                style={{
                    borderColor: `${ACC.primary}20`,
                    background: `linear-gradient(135deg, ${ACC.secondary}08, ${ACC.primary}05, ${ACC.accent}08)`,
                }}
            >
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]" aria-hidden>
                    <div
                        className="h-full w-full"
                        style={{
                            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, ${ACC.primary} 39px, ${ACC.primary} 40px),
                                repeating-linear-gradient(90deg, transparent, transparent 39px, ${ACC.primary} 39px, ${ACC.primary} 40px)`,
                        }}
                    />
                </div>

                <div className="relative grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
                    {PREDICTIONS.map((p) => {
                        const chartData = p.trend.map((v, i) => ({ period: `W${i + 1}`, value: v }));
                        return (
                            <div
                                key={p.id}
                                className="group rounded-xl border border-white/60 bg-white/90 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/60 dark:bg-slate-900/80"
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                                        style={{ background: `linear-gradient(135deg, ${ACC.primary}, ${ACC.accent})` }}
                                    >
                                        <LuBrain size={14} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.title}</p>
                                </div>

                                <p className="mt-3 text-2xl font-bold tracking-tight" style={{ color: ACC.primary }}>
                                    {p.forecast}
                                </p>

                                <div className="mt-2 flex gap-3 text-[10px]">
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                        {p.confidence}% confidence
                                    </span>
                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                        Impact {p.impact}
                                    </span>
                                </div>

                                <div className="mt-3 h-[60px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="2 2" stroke="#E2E8F0" vertical={false} />
                                            <XAxis dataKey="period" hide />
                                            <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke={ACC.accent}
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                    <LuSparkles size={10} className="mr-0.5 inline" style={{ color: ACC.primary }} />
                                    {p.explanation}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
