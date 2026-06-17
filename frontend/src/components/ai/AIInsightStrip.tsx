'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LuZap } from 'react-icons/lu';
import { AISkeletonShimmer } from '@/components/ai/AISkeletonShimmer';

export function AIInsightStrip({
    text,
    loading,
    className,
}: {
    text: string;
    loading?: boolean;
    className?: string;
}) {
    if (loading) {
        return (
            <div
                className={cn(
                    'rounded-xl border border-violet-200/60 bg-gradient-to-r from-violet-50/90 via-white to-blue-50/80 px-4 py-2.5 shadow-sm',
                    className,
                )}
            >
                <AISkeletonShimmer className="h-4 w-[85%] max-w-xl" />
            </div>
        );
    }
    if (!text?.trim()) return null;
    return (
        <div
            className={cn(
                'flex items-start gap-2 rounded-xl border border-violet-200/60 bg-gradient-to-r from-violet-50/90 via-white to-blue-50/80 px-3 py-2.5 text-sm text-slate-800 shadow-sm sm:px-4',
                className,
            )}
        >
            <LuZap className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden />
            <p className="min-w-0 leading-snug">{text}</p>
        </div>
    );
}
