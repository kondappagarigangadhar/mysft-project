'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ResidentCard } from './ResidentCard';

export const residentPageContainerClass =
    'mx-auto w-full space-y-2 sm:space-y-3 lg:max-w-[680px] xl:max-w-[800px]';

export const residentWidePageContainerClass =
    'mx-auto w-full space-y-2 sm:space-y-3 lg:max-w-[680px] xl:max-w-[1128px]';

export const residentInputClass =
    'h-9 w-full rounded-md border border-[#e0dfdc] bg-[#eef3f8] pl-9 pr-3 text-sm text-[rgba(0,0,0,0.9)] placeholder:text-[rgba(0,0,0,0.45)] focus:border-[#0a66c2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0a66c2]';

export const residentTextareaClass =
    'min-h-[100px] w-full resize-y rounded-md border border-[#e0dfdc] bg-white px-3 py-2.5 text-sm text-[rgba(0,0,0,0.9)] placeholder:text-[rgba(0,0,0,0.45)] focus:border-[#0a66c2] focus:outline-none focus:ring-1 focus:ring-[#0a66c2]';

export const residentTagClass =
    'inline-flex items-center rounded-sm bg-[#f3f2ef] px-2 py-0.5 text-xs font-medium text-[rgba(0,0,0,0.6)]';

export const residentChipActiveClass =
    'border-[#0a66c2] bg-[#eef3f8] text-[rgba(0,0,0,0.9)] ring-1 ring-[#0a66c2]/20';

export const residentChipInactiveClass =
    'border-[#e0dfdc] bg-white text-[rgba(0,0,0,0.6)] hover:border-[#d0cfcc] hover:bg-[#f3f2ef]';

export function ResidentPageShell({
    children,
    wide = false,
    className,
}: {
    children: React.ReactNode;
    wide?: boolean;
    className?: string;
}) {
    return (
        <div className={cn(wide ? residentWidePageContainerClass : residentPageContainerClass, className)}>
            {children}
        </div>
    );
}

export function ResidentPageHeader({
    icon,
    title,
    subtitle,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
}) {
    return (
        <ResidentCard padding="md">
            <div className="flex items-start gap-3 sm:gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eef3f8] text-[#0a66c2] sm:h-11 sm:w-11">
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <h1 className="text-base font-semibold text-[rgba(0,0,0,0.9)] sm:text-lg">{title}</h1>
                    {subtitle ? <p className="mt-1 text-sm text-[rgba(0,0,0,0.6)]">{subtitle}</p> : null}
                    {children}
                </div>
            </div>
        </ResidentCard>
    );
}

export function ResidentStatCard({
    label,
    value,
    helper,
    icon,
}: {
    label: string;
    value: string | number;
    helper?: string;
    icon?: React.ReactNode;
}) {
    return (
        <ResidentCard padding="md" hover>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[rgba(0,0,0,0.6)]">{label}</p>
                    <p className="mt-1 text-xl font-semibold text-[rgba(0,0,0,0.9)] sm:text-2xl">{value}</p>
                    {helper ? <p className="mt-0.5 text-xs text-[rgba(0,0,0,0.6)]">{helper}</p> : null}
                </div>
                {icon ? <div className="shrink-0 text-[#0a66c2]">{icon}</div> : null}
            </div>
        </ResidentCard>
    );
}
