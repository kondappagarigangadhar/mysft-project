'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function FormField({
    label,
    required,
    hint,
    children,
    className,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        {label} {required ? <span className="text-rose-500">*</span> : null}
                    </label>
                </div>
                {hint ? <span className="text-[11px] text-slate-500 font-medium">{hint}</span> : null}
            </div>
            {children}
        </div>
    );
}

