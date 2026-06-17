'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/** Matches Leads `InfoGrid` section titles for scan-friendly hierarchy. */
export function DetailSectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h4 className="border-b border-gray-100 pb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">{children}</h4>
    );
}

/** Matches Leads `InfoItem` — icon in gray tile, label + value. */
export function DetailInfoItem({
    label,
    icon,
    children,
    className,
}: {
    label: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex gap-3', className)}>
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">{icon}</span>
            <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
                <div className="mt-0.5 text-sm font-medium text-gray-900">{children}</div>
            </div>
        </div>
    );
}

export const detailFieldGrid = 'grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2';

/** Lead overview–style primary record card shell. */
export function ProjectRecordCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('rounded-xl border border-gray-200/80 bg-[#7185a217] p-4 shadow-sm sm:p-5', className)}>
            {children}
        </div>
    );
}
