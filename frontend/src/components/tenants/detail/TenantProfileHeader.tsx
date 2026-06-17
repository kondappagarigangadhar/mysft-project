'use client';

import React from 'react';
import type { Company } from '@/data/mockData';
import { CTA_EDITING_BADGE } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
    const short = name.trim().slice(0, 2).toUpperCase();
    return short || '?';
}

type TenantProfileHeaderProps = {
    company: Company;
    isEditing?: boolean;
    className?: string;
};

/** Embedded record header — mirrors `ProfileHeader` layout for Leads overview card. */
export function TenantProfileHeader({ company, isEditing = false, className }: TenantProfileHeaderProps) {
    const displayName = company.name?.trim() ? company.name : 'New tenant';

    return (
        <div className={cn('flex min-w-0 gap-4', className)}>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-gray-100 to-gray-50 text-lg font-semibold text-gray-700 ring-1 ring-gray-200/80">
                {initials(displayName)}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-2xl font-semibold tracking-tight text-gray-900">{displayName}</h2>
                    {isEditing ? <span className={CTA_EDITING_BADGE}>Editing Mode</span> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <span className="font-mono text-xs font-semibold uppercase tracking-wide text-slate-500">{company.tenantCode?.trim() || '—'}</span>
                    {!isEditing ? (
                        <>
                            <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
                            <StatusBadge status={company.status} />
                            <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-800">{company.plan}</span>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
