'use client';

import React, { useMemo, useState } from 'react';
import { LuArrowRight, LuShield } from 'react-icons/lu';
import { Button } from '@/components/ui/Button';
import { RECOMMENDATIONS, RISKS } from '@/lib/aiCommandCenter/mockData';
import { ACC } from '@/lib/aiCommandCenter/constants';
import { cn } from '@/lib/utils';
import { GlassCard, SectionHeader } from './shared';

const SEVERITY_STYLES = {
    critical: { bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', text: 'text-red-700 dark:text-red-400', dot: ACC.danger },
    high: { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400', dot: ACC.warning },
    medium: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', dot: '#FBBF24' },
    low: { bg: 'bg-slate-50 dark:bg-slate-800/50', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400', dot: '#94A3B8' },
};

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'] as const;

export function RiskRecommendations() {
    const [filter, setFilter] = useState<string>('all');
    const filtered = useMemo(
        () => (filter === 'all' ? RISKS : RISKS.filter((r) => r.severity === filter)),
        [filter],
    );

    return (
        <section id="risk" className="scroll-mt-24 space-y-4">
            <SectionHeader
                title="Risk & Recommendations Command Center"
                subtitle="Enterprise risks grouped by severity with AI-powered actionable recommendations."
                badge="Zone 4"
            />

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {/* Risk Center */}
                <GlassCard>
                    <div className="flex items-center gap-2">
                        <LuShield size={18} style={{ color: ACC.danger }} />
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Enterprise Risk Center</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                        {['all', ...SEVERITY_ORDER].map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setFilter(s)}
                                className={cn(
                                    'rounded-full px-3 py-1 text-xs font-semibold capitalize transition-all',
                                    filter === s
                                        ? 'text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300',
                                )}
                                style={filter === s ? { backgroundColor: ACC.primary } : undefined}
                            >
                                {s === 'all' ? 'All' : s}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 max-h-[480px] space-y-2.5 overflow-y-auto pr-1">
                        {filtered.map((risk) => {
                            const style = SEVERITY_STYLES[risk.severity];
                            return (
                                <div
                                    key={risk.id}
                                    className={cn('rounded-xl border p-3.5 transition-all hover:shadow-sm', style.bg, style.border)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: style.dot }} />
                                                <span className={cn('text-[10px] font-bold uppercase tracking-wider', style.text)}>
                                                    {risk.severity} · {risk.category}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{risk.title}</p>
                                        </div>
                                        <span className="shrink-0 rounded-lg bg-white/80 px-2 py-1 text-xs font-bold text-slate-700 dark:bg-slate-900/60 dark:text-white">
                                            {risk.score}
                                        </span>
                                    </div>
                                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                                        <span>Impact: {risk.impact}</span>
                                        <span>Owner: {risk.owner}</span>
                                        <span className="col-span-2">Due: {risk.due}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>

                {/* AI Recommendations */}
                <GlassCard>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">AI Recommendations</p>
                    <p className="text-xs text-slate-500">Actionable intelligence with confidence scores</p>

                    <div className="mt-4 space-y-3">
                        {RECOMMENDATIONS.map((rec) => (
                            <div
                                key={rec.id}
                                className="group rounded-xl border border-slate-100 bg-white p-4 transition-all hover:border-blue-100 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-blue-900"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{rec.title}</p>
                                        <p className="mt-1 text-xs text-slate-500">{rec.impact}</p>
                                    </div>
                                    <span
                                        className={cn(
                                            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                                            rec.priority === 'Critical'
                                                ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                                : rec.priority === 'High'
                                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
                                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
                                        )}
                                    >
                                        {rec.priority}
                                    </span>
                                </div>

                                <div className="mt-3 flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="mb-1 flex justify-between text-[10px] text-slate-500">
                                            <span>Confidence</span>
                                            <span className="font-bold">{rec.confidence}%</span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${rec.confidence}%`, backgroundColor: ACC.primary }}
                                            />
                                        </div>
                                    </div>
                                    <Button variant="company" size="sm" className="shrink-0 gap-1">
                                        {rec.action} <LuArrowRight size={12} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </section>
    );
}
