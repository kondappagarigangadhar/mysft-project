'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { CTA_SHADOW_SOFT } from '@/lib/theme/ctaThemeClasses';

export function DocumentFormStickyStatusFooter({
    formStatus,
    onCancel,
    onSaveDraft,
    formId,
    submitLabel,
    submitShakeKey,
    saveDraftDisabled,
    isLoading,
}: {
    formStatus: { complete: boolean; summary: string };
    onCancel: () => void;
    /** When set, shows “Save draft” (lead-style) between Cancel and primary submit. */
    onSaveDraft?: () => void;
    formId: string;
    submitLabel: string;
    submitShakeKey: number;
    saveDraftDisabled?: boolean;
    /** Primary action in progress — shows spinner and avoids double submit. */
    isLoading?: boolean;
}) {
    return (
        <div className=" flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Document status</p>
                <p className={cn('text-sm font-semibold', formStatus.complete ? 'text-emerald-800' : 'text-amber-900')}>
                    {formStatus.complete ? 'Complete' : 'Missing fields'}
                </p>
                <p className="text-[11px] text-slate-600">{formStatus.summary}</p>
            </div>
            <div className="flex flex-col-reverse flex-wrap gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Button
                    type="button"
                    variant="companyGhost"
                    size="cta"
                    className="h-12 text-sm"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                {onSaveDraft ? (
                    <Button
                        type="button"
                        variant="companyOutline"
                        size="cta"
                        className="h-12 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 shadow-sm hover:border-[color-mix(in_srgb,var(--cta-button-bg)_32%,transparent)]"
                        onClick={onSaveDraft}
                        disabled={saveDraftDisabled || isLoading}
                    >
                        Save draft
                    </Button>
                ) : null}
                <Button
                    key={submitShakeKey}
                    type="submit"
                    form={formId}
                    variant="company"
                    size="cta"
                    disabled={isLoading}
                    isLoading={isLoading}
                    className={cn(
                        'h-12 min-w-[160px] rounded-xl text-sm font-semibold',
                        CTA_SHADOW_SOFT,
                        submitShakeKey > 0 && 'animate-lead-form-shake',
                    )}
                >
                    {isLoading ? 'Saving…' : submitLabel}
                </Button>
            </div>
        </div>
    );
}
