'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type AIRiskTone = 'hot' | 'warm' | 'cold' | 'low' | 'medium' | 'high' | 'valid' | 'missing' | 'expiring';

const toneClass: Record<AIRiskTone, string> = {
    hot: 'bg-red-100 text-red-800 ring-red-200/80',
    warm: 'bg-yellow-100 text-yellow-900 ring-yellow-200/90',
    cold: 'bg-blue-100 text-blue-900 ring-blue-200/80',
    low: 'bg-emerald-50 text-emerald-900 ring-emerald-200/80',
    medium: 'bg-amber-50 text-amber-950 ring-amber-200/80',
    high: 'bg-red-50 text-red-900 ring-red-200/80',
    valid: 'bg-emerald-100 text-emerald-800 ring-emerald-200/80',
    missing: 'bg-red-100 text-red-800 ring-red-200/80',
    expiring: 'bg-orange-100 text-orange-900 ring-orange-200/80',
};

export function AIRiskBadge({
    children,
    tone,
    className,
    title,
}: {
    children: React.ReactNode;
    tone: AIRiskTone;
    className?: string;
    title?: string;
}) {
    return (
        <span
            title={title}
            className={cn(
                'inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1',
                toneClass[tone],
                className,
            )}
        >
            {children}
        </span>
    );
}
