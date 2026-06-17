'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function AISkeletonShimmer({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-gradient-to-r from-slate-200/80 via-slate-100/90 to-slate-200/80 bg-[length:200%_100%]',
                className,
            )}
        />
    );
}
