'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { LuPencil } from 'react-icons/lu';

/**
 * Shared chrome for Leads Intelligence / Demand Intelligence record views,
 * aligned with `BookingDetailView` (booking payment): hero card, list breadcrumb, optional tab strip, footer edit.
 */
const editLinkClass =
    'inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-blue-200/90 bg-white px-3 text-sm font-semibold text-blue-900 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 sm:h-10 sm:px-4';

const editLinkFooterClass =
    'inline-flex h-[42px] min-h-[42px] w-full items-center justify-center rounded-xl border border-blue-200/90 bg-white px-4 text-sm font-semibold text-blue-900 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35';

export function IntelligenceRecordDetailShell({
    listHref,
    listLabel,
    title,
    recordId,
    recordIdLabel = 'Record ID',
    tabStrip,
    children,
    editHref,
    editLabel,
    footerExtra,
    /** When `header`, primary edit is shown in the title row (top right). Footer still shows `footerExtra` if set. */
    editPlacement = 'footer',
    /** When false, no outer Card — use for split-card layouts; children control their own surfaces. */
    contained = true,
}: {
    listHref: string;
    listLabel: string;
    title: string;
    recordId: string;
    recordIdLabel?: string;
    /** Booking-style pill tabs (optional). */
    tabStrip?: React.ReactNode;
    children: React.ReactNode;
    /** When omitted, no edit link is shown (e.g. parent page provides its own edit control). */
    editHref?: string;
    editLabel?: string;
    /** e.g. secondary link row above the primary Edit action */
    footerExtra?: React.ReactNode;
    editPlacement?: 'footer' | 'header';
    contained?: boolean;
}) {
    const headerBlock = (
        <div
            className={cn(
                'border-b border-slate-100 bg-linear-to-r from-slate-50/90 to-white px-4 py-4 sm:px-6 sm:py-5',
                editPlacement === 'header' && 'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
            )}
        >
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <Link href={listHref} className="min-w-0 truncate font-semibold text-slate-900 hover:text-[var(--cta-button-bg)] hover:underline">
                        {listLabel}
                    </Link>
                    <span className="mx-1.5 text-slate-300">/</span>
                    <span className="text-slate-600">Details</span>
                </p>
                <h2 className="mt-2 text-lg font-bold text-slate-900">{title}</h2>
                <p className="mt-1 font-mono text-sm text-slate-500">
                    {recordIdLabel}: {recordId}
                </p>
            </div>
            {editPlacement === 'header' && editHref ? (
                <Link href={editHref} className={editLinkClass} aria-label={editLabel ?? 'Edit record'}>
                    <LuPencil size={16} aria-hidden />
                    Edit
                </Link>
            ) : null}
        </div>
    );

    const tabBlock =
        tabStrip != null ? (
            <div className={cn('border-b border-slate-100', contained ? '' : 'rounded-t-xl border-x border-t border-slate-200/80 bg-white')}>
                <div className={cn('px-4 pt-4 sm:px-6', !contained && 'pb-2')}>{tabStrip}</div>
            </div>
        ) : null;

    const body = <div className={cn('text-sm', contained && 'px-4 pb-6 pt-4 sm:px-6')}>{children}</div>;

    const showFooterEdit = editPlacement === 'footer' && Boolean(editHref);
    const footer = (showFooterEdit || footerExtra) && (
        <div
            className={cn(
                'space-y-3 border-t border-slate-100 bg-slate-50/40 px-4 py-4 sm:px-6',
                !contained && 'rounded-xl border border-slate-200/80',
            )}
        >
            {footerExtra}
            {showFooterEdit && editHref ? (
                <Link href={editHref} className={editLinkFooterClass} aria-label={editLabel ?? 'Edit record'}>
                    <LuPencil className="mr-2" size={16} aria-hidden />
                    {editLabel ?? 'Edit'}
                </Link>
            ) : null}
        </div>
    );

    if (!contained) {
        return (
            <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-md shadow-slate-200/30">
                    {headerBlock}
                </div>
                {tabBlock}
                {body}
                {footer}
            </div>
        );
    }

    return (
        <Card className="overflow-hidden border border-slate-200/80 bg-white p-0 shadow-lg shadow-slate-200/40" contentClassName="p-0">
            {headerBlock}
            {tabBlock}
            {body}
            {footer}
        </Card>
    );
}
