'use client';

import React, { useState } from 'react';
import { LuClock, LuMessageSquare, LuSend, LuSparkles } from 'react-icons/lu';
import { Button } from '@/components/ui/Button';
import {
    CONVERSATION_HISTORY,
    INTELLIGENCE_FEED,
    SUGGESTED_QUESTIONS,
} from '@/lib/aiCommandCenter/mockData';
import { ACC } from '@/lib/aiCommandCenter/constants';
import { cn } from '@/lib/utils';
import { GlassCard, SectionHeader } from './shared';

const feedTypeStyles = {
    success: 'border-emerald-200 bg-emerald-50/60 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
    warning: 'border-amber-200 bg-amber-50/60 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300',
    danger: 'border-red-200 bg-red-50/60 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300',
};

export function CopilotWorkspace() {
    const [query, setQuery] = useState('');

    return (
        <section id="copilot" className="scroll-mt-24 space-y-4">
            <SectionHeader
                title="AI Copilot Workspace"
                subtitle="Ask anything across sales, projects, vendors, finance, and operations."
                badge="Zone 2"
            />

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
                {/* AI Conversation */}
                <GlassCard className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <div
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                            style={{ background: `linear-gradient(135deg, ${ACC.primary}, ${ACC.accent})` }}
                        >
                            <LuSparkles size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">AI Conversation</p>
                            <p className="text-xs text-slate-500">Natural language business intelligence</p>
                        </div>
                    </div>

                    <div className="relative mt-5">
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            rows={3}
                            placeholder="Ask AI anything about sales, projects, vendors, procurement, contracts, payments, inventory, residents, finance, or operations..."
                            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-24 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        />
                        <Button
                            variant="company"
                            size="sm"
                            className="absolute bottom-3 right-3 gap-1"
                        >
                            <LuSend size={14} /> Ask
                        </Button>
                    </div>

                    <div className="mt-4">
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Suggested Questions</p>
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTED_QUESTIONS.map((q) => (
                                <button
                                    key={q}
                                    type="button"
                                    onClick={() => setQuery(q)}
                                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-[#2563EB]/30 hover:bg-blue-50 hover:text-[#2563EB] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 flex-1">
                        <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            <LuMessageSquare size={12} /> Recent Conversations
                        </p>
                        <div className="space-y-2">
                            {CONVERSATION_HISTORY.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    className="group w-full rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-left transition-all hover:border-blue-100 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-blue-900"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-medium text-slate-800 group-hover:text-[#2563EB] dark:text-slate-200">
                                            {c.query}
                                        </p>
                                        <span className="flex shrink-0 items-center gap-1 text-[10px] text-slate-400">
                                            <LuClock size={10} /> {c.time}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{c.preview}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </GlassCard>

                {/* Intelligence Feed */}
                <GlassCard>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">AI Intelligence Feed</p>
                    <p className="text-xs text-slate-500">Real-time business insights</p>

                    <div className="relative mt-5">
                        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" aria-hidden />
                        <div className="space-y-4">
                            {INTELLIGENCE_FEED.map((item) => (
                                <div key={item.id} className="relative flex gap-3 pl-0">
                                    <div
                                        className="relative z-10 mt-1 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-white dark:border-slate-900"
                                        style={{
                                            backgroundColor:
                                                item.type === 'success' ? ACC.success : item.type === 'warning' ? ACC.warning : ACC.danger,
                                        }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-medium text-slate-400">{item.time}</p>
                                        <div className={cn('mt-1 rounded-lg border px-3 py-2 text-xs font-medium', feedTypeStyles[item.type])}>
                                            {item.text}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            </div>
        </section>
    );
}
