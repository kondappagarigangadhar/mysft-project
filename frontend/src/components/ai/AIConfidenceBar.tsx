'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function AIConfidenceBar({
    value,
    className,
    label = 'Confidence',
}: {
    value: number;
    className?: string;
    label?: string;
}) {
    const v = Math.max(0, Math.min(100, Math.round(value)));
    return (
        <div className={cn('space-y-1', className)}>
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                <span>{label}</span>
                <span className="tabular-nums text-slate-700">{v}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/90">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-[width] duration-500"
                    style={{ width: `${v}%` }}
                />
            </div>
        </div>
    );
}
