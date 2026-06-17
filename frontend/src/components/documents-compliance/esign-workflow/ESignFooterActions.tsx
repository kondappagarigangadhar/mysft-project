'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

type ESignFooterActionsProps = {
    showBack: boolean;
    onBack: () => void;
    primaryLabel: string;
    onPrimary: () => void;
    primaryDisabled?: boolean;
    primaryLoading?: boolean;
    /** When set, primary renders as company variant (solid) for final CTA. */
    primaryVariant?: 'company' | 'companyOutline';
};

export function ESignFooterActions({
    showBack,
    onBack,
    primaryLabel,
    onPrimary,
    primaryDisabled,
    primaryLoading,
    primaryVariant = 'company',
}: ESignFooterActionsProps) {
    return (
        <div
            className={cn(
                'flex shrink-0 items-center gap-3 border-t border-slate-200 bg-slate-50/90 px-4 py-3.5 sm:px-6',
                showBack ? 'justify-between' : 'justify-end',
            )}
        >
            {showBack ? (
                <Button type="button" variant="companyOutline" size="cta" className="shrink-0 gap-1.5" onClick={onBack}>
                    <LuChevronLeft className="h-4 w-4 shrink-0" />
                    Back
                </Button>
            ) : null}
            <Button
                type="button"
                variant={primaryVariant === 'company' ? 'company' : 'companyOutline'}
                size="cta"
                className="min-w-34 shrink-0 gap-1.5 shadow-sm"
                onClick={onPrimary}
                disabled={primaryDisabled || primaryLoading}
                isLoading={primaryLoading}
            >
                {primaryLabel}
                {primaryVariant === 'companyOutline' ? <LuChevronRight className="h-4 w-4 shrink-0" aria-hidden /> : null}
            </Button>
        </div>
    );
}
