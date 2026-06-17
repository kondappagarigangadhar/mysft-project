'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { CTA_UTILITY_BTN } from '@/lib/theme/ctaThemeClasses';
import { LuPlus } from 'react-icons/lu';

/** Smooth expand/collapse wrapper for inline create panels. */
export function InlineWorkspaceExpandPanel({
    open,
    children,
    className,
}: {
    open: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    if (!open) return null;
    return <div className={cn('min-w-0', className)}>{children}</div>;
}

type InlineWorkspaceSectionProps = {
    /** Primary summary line (e.g. "3 notices · resident communications"). */
    summaryLabel: string;
    /** Optional stat chips beside the add action. */
    summaryBadges?: React.ReactNode;
    /** Optional hint under the summary row (e.g. workspace edit badge). */
    editingHint?: React.ReactNode;
    /** Show the top-right add action. */
    canAdd?: boolean;
    addButtonLabel?: string;
    onAdd?: () => void;
    /** Controlled inline create panel visibility. */
    createFormOpen?: boolean;
    /** Inline create form content (rendered above the list). */
    createForm?: React.ReactNode;
    /** When true and list is empty, show emptyState (unless create form is open). */
    isEmpty?: boolean;
    emptyState?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
};

/**
 * Reusable inline workspace shell: summary header, add action, expandable create form, card list, empty state.
 * Used for Notices, Lease Agreements, Notes, Follow-ups, Documents, etc.
 */
export function InlineWorkspaceSection({
    summaryLabel,
    summaryBadges,
    editingHint,
    canAdd = false,
    addButtonLabel = 'Add',
    onAdd,
    createFormOpen = false,
    createForm,
    isEmpty = false,
    emptyState,
    children,
    className,
}: InlineWorkspaceSectionProps) {
    const showList = !isEmpty || createFormOpen;

    return (
        <div className={cn('flex min-w-0 flex-col gap-4 sm:gap-5', className)}>
            <div className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-gray-800">{summaryLabel}</p>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {summaryBadges}
                        {canAdd && onAdd ? (
                            <Button
                                type="button"
                                variant="company"
                                size="sm"
                                className={cn('shrink-0 gap-1.5', CTA_UTILITY_BTN)}
                                onClick={onAdd}
                            >
                                <LuPlus size={16} aria-hidden />
                                {addButtonLabel}
                            </Button>
                        ) : null}
                    </div>
                </div>
                {editingHint}
            </div>

            {createForm ? (
                <InlineWorkspaceExpandPanel open={createFormOpen}>{createForm}</InlineWorkspaceExpandPanel>
            ) : null}

            {isEmpty && !createFormOpen ? emptyState : null}

            {showList && !isEmpty ? <div className="space-y-4">{children}</div> : null}
        </div>
    );
}
