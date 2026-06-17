'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export type AIResultTabItem = {
    id: string;
    label: string;
    content: React.ReactNode;
};

export function AIResultTabs({ tabs, className }: { tabs: AIResultTabItem[]; className?: string }) {
    const [active, setActive] = useState(tabs[0]?.id ?? '');
    if (!tabs.length) return null;
    const panel = tabs.find((t) => t.id === active) ?? tabs[0];

    return (
        <div className={cn('rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden', className)}>
            <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-white px-2 py-2">
                {tabs.map((t) => {
                    const on = t.id === active;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActive(t.id)}
                            className={cn(
                                'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                                on ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100',
                            )}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>
            <div className="p-4 text-sm text-slate-800">{panel?.content}</div>
        </div>
    );
}
