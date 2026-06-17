'use client';

import React, { useEffect } from 'react';
import { LuCheck, LuX } from 'react-icons/lu';
import { cn } from '@/lib/utils';

export function InlineToast({
    message,
    variant = 'success',
    onDismiss,
    durationMs = 4200,
    className,
}: {
    message: string;
    variant?: 'success' | 'error';
    onDismiss: () => void;
    /** Auto-hide delay (default 4.2s). */
    durationMs?: number;
    className?: string;
}) {
    useEffect(() => {
        const t = setTimeout(onDismiss, durationMs);
        return () => clearTimeout(t);
    }, [message, onDismiss, durationMs]);

    return (
        <div
            className={cn(
                'fixed bottom-6 right-6 z-[130] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg',
                variant === 'success'
                    ? 'border-emerald-200 bg-white text-emerald-900'
                    : 'border-red-200 bg-white text-red-900',
                className,
            )}
            role="status"
        >
            {variant === 'success' ? (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <LuCheck size={18} />
                </span>
            ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
                    <LuX size={18} />
                </span>
            )}
            <p className="text-sm font-medium leading-snug pt-0.5">{message}</p>
            <button type="button" onClick={onDismiss} className="ml-1 text-slate-400 hover:text-slate-700" aria-label="Dismiss">
                <LuX size={16} />
            </button>
        </div>
    );
}
