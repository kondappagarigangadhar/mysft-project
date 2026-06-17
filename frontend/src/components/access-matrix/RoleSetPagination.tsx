'use client';

import { cn } from '@/lib/utils';
import { CTA_PAGINATION_EMPHASIS, CTA_PAGINATION_NAV_BTN } from '@/lib/theme/ctaThemeClasses';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

type Props = {
    pageIndex: number;
    pageCount: number;
    onPageChange: (index: number) => void;
    className?: string;
};

export function RoleSetPagination({ pageIndex, pageCount, onPageChange, className }: Props) {
    if (pageCount <= 1) return null;

    const safePage = Math.min(Math.max(0, pageIndex), pageCount - 1);
    const canPrev = safePage > 0;
    const canNext = safePage < pageCount - 1;

    return (
        <div className={cn('flex items-center gap-1.5', className)}>
            <button
                type="button"
                aria-label="Previous page"
                disabled={!canPrev}
                onClick={() => onPageChange(safePage - 1)}
                className={cn(CTA_PAGINATION_NAV_BTN, 'h-8 w-8')}
            >
                <LuChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <span className="min-w-[6rem] text-center text-sm font-semibold tabular-nums text-slate-600">
                Page <span className={CTA_PAGINATION_EMPHASIS}>{safePage + 1}</span> of{' '}
                <span className={CTA_PAGINATION_EMPHASIS}>{pageCount}</span>
            </span>
            <button
                type="button"
                aria-label="Next page"
                disabled={!canNext}
                onClick={() => onPageChange(safePage + 1)}
                className={cn(CTA_PAGINATION_NAV_BTN, 'h-8 w-8')}
            >
                <LuChevronRight className="h-4 w-4" aria-hidden />
            </button>
        </div>
    );
}
