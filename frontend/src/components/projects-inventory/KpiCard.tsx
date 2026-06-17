'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function KpiCard({
    title,
    value,
    subValue,
    className,
    icon,
}: {
    title: string;
    value: string | number;
    subValue?: string;
    className?: string;
    icon?: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                'bg-white rounded-xl shadow-md border border-slate-200 p-5 transition-all hover:shadow-lg',
                className
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-bold text-slate-500">{title}</p>
                    <p className="text-3xl font-black text-slate-900 mt-2">{value}</p>
                    {subValue ? <p className="text-xs text-slate-500 mt-2 font-semibold">{subValue}</p> : null}
                </div>
                {icon ? <div className="text-slate-400">{icon}</div> : null}
            </div>
        </div>
    );
}

