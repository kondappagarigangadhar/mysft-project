'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Page card for the eSign workflow (replaces overlay drawer). Use `embedded` when a parent page already has title / shell.
 */
export function ESignPageShell({
    children,
    className,
    minHeightClass = 'min-h-[min(70vh,720px)]',
}: {
    children: React.ReactNode;
    className?: string;
    /** e.g. `min-h-0` when the parent column controls height */
    minHeightClass?: string;
}) {
    return (
        <div
            className={cn(
                'overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-900/5 ring-1 ring-slate-900/5',
                className,
            )}
        >
            <div className={cn('flex flex-col overflow-hidden', minHeightClass)}>{children}</div>
        </div>
    );
}
