'use client';

import React, { useId, useState } from 'react';
import { cn } from '@/lib/utils';

export function AISmartTooltip({
    label,
    children,
    className,
    triggerClassName,
    side = 'top',
}: {
    label: string;
    children: React.ReactNode;
    className?: string;
    /** Classes for the hover trigger (e.g. border-0 bg-transparent for inline dots). */
    triggerClassName?: string;
    side?: 'top' | 'bottom';
}) {
    const [open, setOpen] = useState(false);
    const id = useId();

    return (
        <span className={cn('relative inline-flex', className)}>
            <button
                type="button"
                className={cn(
                    'inline-flex cursor-help items-center justify-center rounded-full border border-slate-200/80 bg-white p-0.5 text-slate-500 shadow-sm transition hover:border-blue-300 hover:text-blue-700',
                    triggerClassName,
                )}
                aria-describedby={open ? id : undefined}
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
            >
                {children}
            </button>
            {open ? (
                <span
                    id={id}
                    role="tooltip"
                    className={cn(
                        'absolute z-50 w-max max-w-[min(100vw-2rem,240px)] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-[11px] font-medium leading-snug text-slate-700 shadow-lg ring-1 ring-black/5',
                        side === 'top' ? 'bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2' : 'top-[calc(100%+6px)] left-1/2 -translate-x-1/2',
                    )}
                >
                    {label}
                </span>
            ) : null}
        </span>
    );
}
