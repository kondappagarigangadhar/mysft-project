'use client';

import React, { useState } from 'react';
import {
    LuBell,
    LuBrain,
    LuChevronDown,
    LuChevronUp,
    LuHeartPulse,
    LuListChecks,
    LuSparkles,
    LuX,
} from 'react-icons/lu';
import { Button } from '@/components/ui/Button';
import { ACC } from '@/lib/aiCommandCenter/constants';
import { cn } from '@/lib/utils';

const PANEL_ITEMS = [
    { icon: LuBrain, label: 'AI Status', value: 'Online', status: 'success' as const },
    { icon: LuBell, label: 'New Alerts', value: '7', status: 'warning' as const },
    { icon: LuListChecks, label: 'Pending Actions', value: '12', status: 'default' as const },
    { icon: LuHeartPulse, label: 'System Health', value: '98%', status: 'success' as const },
    { icon: LuSparkles, label: 'Agent Health', value: '96%', status: 'success' as const },
];

export function FloatingAssistant() {
    const [expanded, setExpanded] = useState(true);
    const [visible, setVisible] = useState(true);

    if (!visible) {
        return (
            <button
                type="button"
                onClick={() => setVisible(true)}
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${ACC.primary}, ${ACC.accent})` }}
                aria-label="Open AI Assistant"
            >
                <LuSparkles size={22} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-[280px]">
            <div
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95"
            >
                <div
                    className="flex items-center justify-between px-4 py-3 text-white"
                    style={{ background: `linear-gradient(135deg, ${ACC.primary}, ${ACC.secondary})` }}
                >
                    <div className="flex items-center gap-2">
                        <LuSparkles size={16} />
                        <span className="text-sm font-bold">AI Assistant</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setExpanded((e) => !e)}
                            className="rounded-lg p-1 transition-colors hover:bg-white/20"
                            aria-label={expanded ? 'Collapse' : 'Expand'}
                        >
                            {expanded ? <LuChevronDown size={16} /> : <LuChevronUp size={16} />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setVisible(false)}
                            className="rounded-lg p-1 transition-colors hover:bg-white/20"
                            aria-label="Close"
                        >
                            <LuX size={16} />
                        </button>
                    </div>
                </div>

                {expanded ? (
                    <div className="p-3">
                        <div className="space-y-2">
                            {PANEL_ITEMS.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60"
                                >
                                    <div className="flex items-center gap-2">
                                        <item.icon size={14} className="text-slate-400" />
                                        <span className="text-xs text-slate-600 dark:text-slate-300">{item.label}</span>
                                    </div>
                                    <span
                                        className={cn(
                                            'text-xs font-bold',
                                            item.status === 'success' && 'text-emerald-600',
                                            item.status === 'warning' && 'text-amber-600',
                                            item.status === 'default' && 'text-slate-800 dark:text-white',
                                        )}
                                    >
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <Button variant="company" size="sm" className="mt-3 w-full gap-1.5">
                            <LuSparkles size={14} /> Quick Ask AI
                        </Button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
