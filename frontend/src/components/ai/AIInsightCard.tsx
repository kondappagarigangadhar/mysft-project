'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function AIInsightCard({
    title,
    subtitle,
    children,
    className,
    action,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
}) {
    return (
        <section
            className={cn(
                'rounded-xl border border-slate-200/90 bg-white p-4 shadow-md',
                className,
            )}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">{title}</h3>
                    {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </div>
            <div className="mt-4">{children}</div>
        </section>
    );
}
