'use client';

import React, { useMemo } from 'react';
import { Button } from './Button';
import { cn } from '@/lib/utils';
import {
    CTA_FOCUS_VISIBLE_RING,
    CTA_PAGINATION_EMPHASIS,
    CTA_PAGINATION_PAGE,
    CTA_PAGINATION_PAGE_ACTIVE,
} from '@/lib/theme/ctaThemeClasses';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    itemsPerPage?: number;
    label?: string;
}

type PageToken = number | 'ellipsis';

/** Compact page list with ellipses when there are many pages */
function buildPageTokens(current: number, total: number): PageToken[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const tokens: PageToken[] = [1];
    const window = 1;
    let start = Math.max(2, current - window);
    let end = Math.min(total - 1, current + window);
    if (start > 2) tokens.push('ellipsis');
    for (let p = start; p <= end; p++) tokens.push(p);
    if (end < total - 1) tokens.push('ellipsis');
    if (total > 1) tokens.push(total);
    return tokens;
}

export const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
    label = 'items',
}: PaginationProps) => {
    const pageTokens = useMemo(() => buildPageTokens(currentPage, totalPages), [currentPage, totalPages]);

    if (totalPages <= 1) return null;

    const countSpan = (n: number) => <span className={CTA_PAGINATION_EMPHASIS}>{n}</span>;

    return (
        <div className="flex flex-col items-center justify-between gap-4 transition-all duration-300 sm:flex-row">
            {totalItems !== undefined && itemsPerPage !== undefined ? (
                <div className="text-sm text-slate-500">
                    Showing {countSpan((currentPage - 1) * itemsPerPage + 1)} to{' '}
                    {countSpan(Math.min(currentPage * itemsPerPage, totalItems))} of {countSpan(totalItems)} {label}
                </div>
            ) : (
                <div className="text-sm text-slate-500">
                    Page {countSpan(currentPage)} of {countSpan(totalPages)}
                </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                    variant="companyOutline"
                    size="sm"
                    className="h-9 rounded-lg px-3"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                >
                    Previous
                </Button>

                <div className="mx-1 flex items-center gap-1">
                    {pageTokens.map((token, idx) =>
                        token === 'ellipsis' ? (
                            <span
                                key={`ellipsis-${idx}`}
                                className="inline-flex h-9 w-9 items-center justify-center text-sm text-slate-400"
                                aria-hidden
                            >
                                …
                            </span>
                        ) : (
                            <button
                                key={token}
                                type="button"
                                onClick={() => onPageChange(token)}
                                aria-label={`Page ${token}`}
                                aria-current={currentPage === token ? 'page' : undefined}
                                className={cn(
                                    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                                    CTA_FOCUS_VISIBLE_RING,
                                    currentPage === token ? CTA_PAGINATION_PAGE_ACTIVE : CTA_PAGINATION_PAGE,
                                )}
                            >
                                {token}
                            </button>
                        ),
                    )}
                </div>

                <Button
                    variant="companyOutline"
                    size="sm"
                    className="h-9 rounded-lg px-3"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};
