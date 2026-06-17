'use client';

import React, { useEffect, useState } from 'react';
import { LuSparkles } from 'react-icons/lu';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ExecutiveOverview } from '@/components/ai-command-center/ExecutiveOverview';
import { CopilotWorkspace } from '@/components/ai-command-center/CopilotWorkspace';
import { IntelligenceHub } from '@/components/ai-command-center/IntelligenceHub';
import { RiskRecommendations } from '@/components/ai-command-center/RiskRecommendations';
import { PredictiveIntelligence } from '@/components/ai-command-center/PredictiveIntelligence';
import { OperationsCenter } from '@/components/ai-command-center/OperationsCenter';
import { FloatingAssistant } from '@/components/ai-command-center/FloatingAssistant';

function CommandCenterSkeleton() {
    return (
        <div className="animate-pulse space-y-8">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60" />
            ))}
        </div>
    );
}

export default function AICommandCenterPage() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 600);
        return () => clearTimeout(t);
    }, []);

    return (
        <>
            <div className="space-y-10 pb-24">
                <Breadcrumb items={[{ label: 'AI Command Center' }]} />

                <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                            AI Command Center
                        </h1>
                        <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #2563EB, #3B82F6)' }}
                        >
                            <LuSparkles size={12} aria-hidden />
                            Enterprise AI
                        </span>
                    </div>
                    <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
                        Central intelligence hub for your organization — business health, risks, predictions, and AI-powered actions in one executive view.
                    </p>
                </div>

                {loading ? (
                    <CommandCenterSkeleton />
                ) : (
                    <div className="space-y-12">
                        <ExecutiveOverview />
                        <CopilotWorkspace />
                        <IntelligenceHub />
                        <RiskRecommendations />
                        <PredictiveIntelligence />
                        <OperationsCenter />
                    </div>
                )}
            </div>

            <FloatingAssistant />
        </>
    );
}
