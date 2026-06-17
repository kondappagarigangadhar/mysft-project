'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function TextField({
    label,
    hint,
    error,
    leftIcon,
    rightSlot,
    className,
    inputClassName,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    hint?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightSlot?: React.ReactNode;
    className?: string;
    inputClassName?: string;
}) {
    const describedBy = error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined;
    return (
        <div className={cn('space-y-2', className)}>
            <label htmlFor={props.id} className="block text-[13px] font-semibold text-slate-800">
                {label}
            </label>
            <div className="relative group">
                {leftIcon ? (
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500">
                        {leftIcon}
                    </span>
                ) : null}
                <input
                    {...props}
                    aria-invalid={Boolean(error) || undefined}
                    aria-describedby={describedBy}
                    className={cn(
                        'h-12 w-full rounded-2xl border bg-white px-4 text-[15px] text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-all placeholder:text-slate-400 focus:outline-none focus:ring-4',
                        leftIcon ? 'pl-11' : undefined,
                        rightSlot ? 'pr-11' : undefined,
                        error
                            ? 'border-red-200 focus:border-red-400 focus:ring-red-500/10'
                            : 'border-slate-200 focus:border-orange-400 focus:ring-orange-500/12',
                        inputClassName
                    )}
                />
                {rightSlot ? <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{rightSlot}</span> : null}
            </div>
            {error ? (
                <p id={`${props.id}-error`} className="text-xs font-medium text-red-600">
                    {error}
                </p>
            ) : hint ? (
                <p id={`${props.id}-hint`} className="text-xs text-slate-500">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

