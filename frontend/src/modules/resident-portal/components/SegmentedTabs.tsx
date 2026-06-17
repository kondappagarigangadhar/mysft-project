'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type SegmentedTab<T extends string> = {
    key: T;
    label: string;
};

export function SegmentedTabs<T extends string>({
    value,
    onChange,
    tabs,
    className,
}: {
    value: T;
    onChange: (next: T) => void;
    tabs: SegmentedTab<T>[];
    className?: string;
}) {
    return (
        <div className={cn('inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1', className)}>
            {tabs.map((t) => {
                const active = t.key === value;
                return (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => onChange(t.key)}
                        className={cn(
                            'px-3.5 py-2 text-sm font-semibold rounded-[14px] transition-all',
                            active
                                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        )}
                    >
                        {t.label}
                    </button>
                );
            })}
        </div>
    );
}

