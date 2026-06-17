'use client';

import React from 'react';
import type { User } from '@/data/mockData';
import { CTA_EDITING_BADGE } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';

function initials(user: User) {
    const a = user.firstName?.trim().charAt(0) ?? '';
    const b = user.lastName?.trim().charAt(0) ?? '';
    if (a && b) return (a + b).toUpperCase();
    return user.name?.trim().slice(0, 2).toUpperCase() || '?';
}

type UserProfileHeaderProps = {
    user: User;
    isEditing?: boolean;
    className?: string;
};

/** Record header — matches Tenant/Leads embedded profile row. */
export function UserProfileHeader({ user, isEditing = false, className }: UserProfileHeaderProps) {
    const displayName = user.name?.trim() ? user.name : 'New user';

    return (
        <div className={cn('flex min-w-0 gap-4', className)}>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-gray-100 to-gray-50 text-lg font-semibold text-gray-700 ring-1 ring-gray-200/80">
                {initials(user)}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-2xl font-semibold tracking-tight text-gray-900">{displayName}</h2>
                    {isEditing ? <span className={CTA_EDITING_BADGE}>Editing Mode</span> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <span className="font-mono text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {user.employeeId?.trim() || `USR-${String(user.id).padStart(4, '0')}`}
                    </span>
                    {!isEditing ? (
                        <>
                            <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
                            <StatusBadge status={user.status} />
                            <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-800">
                                {user.role}
                            </span>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
