'use client';

import React, { useEffect, useState } from 'react';
import { type Lead } from '@/lib/leadStore';
import { LuBuilding2, LuUser } from 'react-icons/lu';
import { CTA_EDITING_BADGE, CTA_SELECT_BG_TINT, CTA_SELECT_DEFAULT_BORDER } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';
import { LEAD_INLINE_FIELD_IDS } from '@/components/leads/LeadInlineOverviewEditor';

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
    const short = name.trim().slice(0, 2).toUpperCase();
    return short || '?';
}

type ProfileHeaderProps = {
    lead: Lead;
    /** When true, no outer card chrome — use inside a parent card. */
    embedded?: boolean;
    className?: string;
    isEditing?: boolean;
    assignedToOptions?: string[];
    assignedToValue?: string;
    assignedToError?: string;
    assignedToChanged?: boolean;
    onAssignedToChange?: (next: string) => void;
    projectOptions?: string[];
    projectValue?: string;
    projectError?: string;
    projectChanged?: boolean;
    onProjectChange?: (next: string) => void;
    statusOptions?: Lead['status'][];
    statusValue?: Lead['status'];
    statusError?: string;
    statusChanged?: boolean;
    onStatusChange?: (next: Lead['status']) => void;
};

export function ProfileHeader({
    lead,
    embedded,
    className,
    isEditing = false,
    assignedToOptions = [],
    assignedToValue,
    assignedToError,
    assignedToChanged = false,
    onAssignedToChange,
    projectOptions = [],
    projectValue,
    projectError,
    projectChanged = false,
    onProjectChange,
    statusOptions = ['New', 'Qualified', 'Lost'],
    statusValue,
    statusError,
    statusChanged = false,
    onStatusChange,
}: ProfileHeaderProps) {
    const assignedToEffective = assignedToValue ?? lead.assignedTo;
    const projectEffective = projectValue ?? lead.project;
    const statusEffective = statusValue ?? lead.status;
    const displayName = lead.name?.trim() ? lead.name : 'New lead';

    const [entered, setEntered] = useState(false);
    useEffect(() => {
        if (!isEditing) return;
        const t = window.requestAnimationFrame(() => setEntered(true));
        return () => window.cancelAnimationFrame(t);
    }, [isEditing]);

    const assignedBorderClass = assignedToError
        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/20'
        : assignedToChanged
          ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-500/20'
          : CTA_SELECT_DEFAULT_BORDER;

    const projectBorderClass = projectError
        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/20'
        : projectChanged
          ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-500/20'
          : CTA_SELECT_DEFAULT_BORDER;

    const statusBorderClass = statusError
        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/20'
        : statusChanged
          ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-500/20'
          : CTA_SELECT_DEFAULT_BORDER;

    return (
        <div
            className={cn(
                'flex min-w-0 gap-4',
                !embedded && 'rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm',
                className
            )}
        >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-gray-100 to-gray-50 text-lg font-semibold text-gray-700 ring-1 ring-gray-200/80">
                {initials(displayName)}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-2xl font-semibold tracking-tight text-gray-900">{displayName}</h2>
                    {isEditing ? (
                        <span className={CTA_EDITING_BADGE}>Editing Mode</span>
                    ) : null}
                    {isEditing ? (
                        <div className={cn('min-w-0 transition-[opacity,transform] duration-200 ease-out', entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1')}>
                            <select
                                id={LEAD_INLINE_FIELD_IDS.status}
                                value={statusEffective}
                                onChange={(e) => onStatusChange?.(e.target.value as Lead['status'])}
                                aria-invalid={Boolean(statusError)}
                                className={cn(
                                    'h-7 max-w-48 rounded-md border-2 px-2 text-sm font-medium text-gray-900 shadow-sm focus:outline-none focus:ring-2',
                                    CTA_SELECT_BG_TINT,
                                    statusBorderClass,
                                )}
                            >
                                {statusOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1.5">
                        <LuUser size={14} className="shrink-0 text-gray-400" aria-hidden />
                        <span className="text-gray-500">Assigned</span>
                        {isEditing ? (
                            <div className={cn('min-w-0 transition-[opacity,transform] duration-200 ease-out', entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1')}>
                                <select
                                    id={LEAD_INLINE_FIELD_IDS.assignedTo}
                                    value={assignedToEffective}
                                    onChange={(e) => onAssignedToChange?.(e.target.value)}
                                    aria-invalid={Boolean(assignedToError)}
                                    className={cn(
                                        'h-7 max-w-56 rounded-md border-2 px-2 text-sm font-medium text-gray-800 shadow-sm focus:outline-none focus:ring-2',
                                        CTA_SELECT_BG_TINT,
                                        assignedBorderClass,
                                    )}
                                >
                                    {assignedToOptions.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                                {assignedToError ? <p className="mt-1 text-xs font-medium text-rose-600">{assignedToError}</p> : null}
                            </div>
                        ) : (
                            <span className="font-medium text-gray-800">{lead.assignedTo?.trim() || 'Unassigned'}</span>
                        )}
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                        <LuBuilding2 size={14} className="shrink-0 text-gray-400" aria-hidden />
                        <span className="text-gray-500">Project Interest</span>
                        {isEditing ? (
                            <div className={cn('min-w-0 transition-[opacity,transform] duration-200 ease-out', entered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1')}>
                                <select
                                    id={LEAD_INLINE_FIELD_IDS.project}
                                    value={projectEffective}
                                    onChange={(e) => onProjectChange?.(e.target.value)}
                                    aria-invalid={Boolean(projectError)}
                                    className={cn(
                                        'h-7 max-w-56 truncate rounded-md border-2 px-2 text-sm font-medium text-gray-800 shadow-sm focus:outline-none focus:ring-2',
                                        CTA_SELECT_BG_TINT,
                                        projectBorderClass,
                                    )}
                                >
                                    {projectOptions.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <span className="truncate font-medium text-gray-800">{lead.project?.trim() || '—'}</span>
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}
