'use client';

import React from 'react';
import {
    LuActivity,
    LuArrowDown,
    LuBrain,
    LuCircleCheck,
    LuClock,
    LuGitBranch,
    LuSparkles,
    LuZap,
} from 'react-icons/lu';
import { AI_AGENTS, DEPENDENCY_CHAIN, ROOT_CAUSE_EXPLANATION } from '@/lib/aiCommandCenter/mockData';
import { ACC } from '@/lib/aiCommandCenter/constants';
import { cn } from '@/lib/utils';
import { GlassCard, SectionHeader } from './shared';

const STATUS_STYLES = {
    active: { label: 'Active', color: ACC.success, bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    warning: { label: 'Warning', color: ACC.warning, bg: 'bg-amber-50 dark:bg-amber-950/30' },
    idle: { label: 'Idle', color: '#94A3B8', bg: 'bg-slate-50 dark:bg-slate-800/50' },
};

export function OperationsCenter() {
    return (
        <section id="agents" className="scroll-mt-24 space-y-4">
            <SectionHeader
                title="AI Operations Center"
                subtitle="Monitor AI agents and cross-module business dependency intelligence."
                badge="Zone 6"
            />

            <div className="space-y-5">
                {/* AI Agents Monitoring */}
                <GlassCard>
                    <div className="flex items-center gap-2">
                        <LuBrain size={18} style={{ color: ACC.primary }} />
                        <p className="text-sm font-bold text-slate-900 dark:text-white">AI Agents Monitoring</p>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {AI_AGENTS.map((agent) => {
                            const status = STATUS_STYLES[agent.status];
                            return (
                                <div
                                    key={agent.name}
                                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-blue-100 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/40"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{agent.name}</p>
                                        <span
                                            className={cn('shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase', status.bg)}
                                            style={{ color: status.color }}
                                        >
                                            {status.label}
                                        </span>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <LuClock size={10} /> Last: {agent.lastRun}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <LuZap size={10} /> Next: {agent.nextRun}
                                        </span>
                                        <span>Records: {agent.records.toLocaleString()}</span>
                                        <span>Exec: {agent.execTime}</span>
                                    </div>

                                    <div className="mt-3">
                                        <div className="mb-1 flex justify-between text-[10px]">
                                            <span className="text-slate-500">Health</span>
                                            <span className="font-bold text-slate-700 dark:text-slate-200">{agent.health}%</span>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${agent.health}%`,
                                                    backgroundColor: agent.health >= 95 ? ACC.success : agent.health >= 90 ? ACC.accent : ACC.warning,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                        <LuCircleCheck size={10} />
                                        {agent.successRate}% success rate
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </GlassCard>

                {/* Cross Module Intelligence */}
                <GlassCard
                    className="relative overflow-hidden"
                    id="cross-module"
                >
                    <div
                        className="pointer-events-none absolute -left-10 -bottom-10 h-48 w-48 rounded-full opacity-[0.05]"
                        style={{ background: `radial-gradient(circle, ${ACC.secondary}, transparent)` }}
                        aria-hidden
                    />

                    <div className="relative">
                        <div className="flex items-center gap-2">
                            <LuGitBranch size={18} style={{ color: ACC.secondary }} />
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Cross Module Intelligence</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Root cause analysis · Business dependency graph</p>

                        <div className="mt-6 flex flex-col items-center gap-0 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-2">
                            {DEPENDENCY_CHAIN.map((node, i) => (
                                <React.Fragment key={node.step}>
                                    <div
                                        className="flex w-full max-w-[200px] flex-col items-center rounded-xl border px-4 py-3 text-center transition-all hover:shadow-md sm:w-auto"
                                        style={{
                                            borderColor: `${ACC.primary}25`,
                                            background: `linear-gradient(180deg, white, ${ACC.primary}06)`,
                                        }}
                                    >
                                        <LuActivity size={16} style={{ color: ACC.primary }} className="mb-1" />
                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{node.step}</span>
                                    </div>
                                    {i < DEPENDENCY_CHAIN.length - 1 ? (
                                        <LuArrowDown size={20} className="my-1 shrink-0 text-slate-300 sm:rotate-[-90deg]" />
                                    ) : null}
                                </React.Fragment>
                            ))}
                        </div>

                        <div
                            className="mt-6 rounded-xl border p-5"
                            style={{
                                borderColor: `${ACC.primary}20`,
                                background: `linear-gradient(135deg, ${ACC.secondary}08, ${ACC.primary}05)`,
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <LuSparkles size={14} style={{ color: ACC.primary }} />
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: ACC.primary }}>
                                    AI Root Cause Analysis
                                </span>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{ROOT_CAUSE_EXPLANATION}</p>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </section>
    );
}
