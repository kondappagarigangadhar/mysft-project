'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/** Compact label + value cell for customer header grid (view + edit). */
export function CustomerOverviewEditableCell({
    label,
    isEditing,
    children,
    className,
}: {
    label: string;
    isEditing?: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'min-w-0',
                isEditing && 'rounded-lg border border-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_6%,white)] px-2 py-1.5',
                className,
            )}
        >
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <div className="mt-0.5 min-w-0 text-sm font-semibold text-slate-900 [&_input]:text-sm [&_input]:font-medium">
                {children}
            </div>
        </div>
    );
}
