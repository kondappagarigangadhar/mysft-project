'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type AIInlineBadgeVariant = 'intent' | 'risk' | 'neutral';

const styles: Record<AIInlineBadgeVariant, string> = {
    intent: 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950 ring-amber-200/80',
    risk: 'bg-gradient-to-r from-red-50 to-rose-50 text-red-900 ring-red-200/80',
    neutral: 'bg-slate-100 text-slate-700 ring-slate-200/80',
};

export function AIInlineBadge({
    children,
    variant,
    className,
    title,
}: {
    children: React.ReactNode;
    variant: AIInlineBadgeVariant;
    className?: string;
    title?: string;
}) {
    return (
        <span
            title={title}
            className={cn(
                'inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1',
                styles[variant],
                className,
            )}
        >
            {children}
        </span>
    );
}
