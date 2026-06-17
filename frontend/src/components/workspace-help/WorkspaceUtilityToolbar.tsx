'use client';

import React from 'react';
import { LuDownload, LuEllipsis, LuMail, LuPrinter } from 'react-icons/lu';
import { WorkspaceHelp } from '@/components/workspace-help/ContextualHelpPopover';
import type { WorkspaceHelpContent } from '@/components/workspace-help/types';
import { CTA_UTILITY_BTN } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';

export type WorkspaceUtilityToolbarProps = {
    help: WorkspaceHelpContent;
    triggerLabel: string;
    disabled?: boolean;
    isInlineEditing?: boolean;
    saving?: boolean;
    /** Direct mailto address, or use `emailHref` for custom links. */
    email?: string | null;
    emailHref?: string | null;
    onExport?: () => void;
    showExport?: boolean;
    showPrint?: boolean;
    className?: string;
};

/** Standard Email / Export / Print + contextual help — reuse on workspace detail pages. */
export function WorkspaceUtilityToolbar({
    help,
    triggerLabel,
    disabled = false,
    isInlineEditing = false,
    saving = false,
    email,
    emailHref,
    onExport,
    showExport = true,
    showPrint = true,
    className,
}: WorkspaceUtilityToolbarProps) {
    const mailHref = emailHref ?? (email?.trim() ? `mailto:${email.trim()}` : null);
    const printDisabled = saving || isInlineEditing || disabled;

    return (
        <div className={cn('flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3', className)}>
            <div className="hidden items-center gap-3 sm:flex">
                {(mailHref || onExport || showPrint) && <div className="h-6 w-px bg-gray-300" aria-hidden />}
                {mailHref ? (
                    <a href={mailHref} className={CTA_UTILITY_BTN}>
                        <LuMail size={16} className="shrink-0" aria-hidden />
                        <span className="whitespace-nowrap">Email</span>
                    </a>
                ) : null}
                {showExport && onExport ? (
                    <button type="button" onClick={onExport} disabled={disabled} className={CTA_UTILITY_BTN}>
                        <LuDownload size={16} className="shrink-0" aria-hidden />
                        <span className="whitespace-nowrap">Export</span>
                    </button>
                ) : null}
                {showPrint ? (
                    <button
                        type="button"
                        onClick={() => window.print()}
                        disabled={printDisabled}
                        className={cn(CTA_UTILITY_BTN, 'disabled:opacity-60')}
                    >
                        <LuPrinter size={16} className="shrink-0" aria-hidden />
                        <span className="whitespace-nowrap">Print</span>
                    </button>
                ) : null}
            </div>
            <WorkspaceHelp {...help} triggerLabel={triggerLabel} disabled={disabled || saving} />
            {(mailHref || (showExport && onExport) || showPrint) && (
                <details className="relative sm:hidden">
                    <summary className={cn(CTA_UTILITY_BTN, 'list-none [&::-webkit-details-marker]:hidden')}>
                        <LuEllipsis size={16} className="shrink-0" aria-hidden />
                        <span className="whitespace-nowrap">More</span>
                    </summary>
                    <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                        {mailHref ? (
                            <a
                                href={mailHref}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <LuMail size={16} aria-hidden />
                                Email
                            </a>
                        ) : null}
                        {showExport && onExport ? (
                            <button
                                type="button"
                                onClick={onExport}
                                disabled={disabled}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                                <LuDownload size={16} aria-hidden />
                                Export
                            </button>
                        ) : null}
                        {showPrint ? (
                            <button
                                type="button"
                                onClick={() => window.print()}
                                disabled={printDisabled}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                                <LuPrinter size={16} aria-hidden />
                                Print
                            </button>
                        ) : null}
                    </div>
                </details>
            )}
        </div>
    );
}
