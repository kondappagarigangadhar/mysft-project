'use client';

import React from 'react';
import type { Department } from '@/data/mockData';
import StatusBadge from '@/components/ui/StatusBadge';
import { LuBuilding2 } from 'react-icons/lu';
import { cn } from '@/lib/utils';

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
    return name.trim().slice(0, 2).toUpperCase() || '?';
}

export function DepartmentProfileHeader({
    department,
    embedded,
    className,
}: {
    department: Department;
    embedded?: boolean;
    className?: string;
}) {
    const displayName = department.name?.trim() || 'New department';

    return (
        <div
            className={cn(
                'flex min-w-0 gap-4',
                !embedded && 'rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm',
                className,
            )}
        >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 text-lg font-semibold text-gray-700 ring-1 ring-gray-200/80">
                {department.id > 0 ? initials(displayName) : <LuBuilding2 className="h-7 w-7 text-gray-500" />}
            </div>
            <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{displayName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {department.code ? (
                        <code className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
                            {department.code}
                        </code>
                    ) : null}
                    {department.id > 0 ? (
                        <StatusBadge status={department.status} />
                    ) : (
                        <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2.5 py-0.5 text-xs font-semibold text-[var(--cta-button-bg)]">
                            Draft
                        </span>
                    )}
                    {department.businessUnitName ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
                            <LuBuilding2 size={14} className="text-slate-400" aria-hidden />
                            {department.businessUnitName}
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
