'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { LuSave } from 'react-icons/lu';

export function PlatformFoundationStickySaveBar({
    onDiscard,
    onSave,
    saving,
}: {
    onDiscard: () => void;
    onSave: () => void;
    saving?: boolean;
}) {
    return (
        <div className="sticky bottom-0 z-30 mt-6 pb-1">
            <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur supports-backdrop-filter:bg-white/90 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                <p className="text-sm font-medium text-slate-700">
                    <span className="font-semibold text-slate-900">Unsaved changes</span>
                    <span className="hidden sm:inline"> — review and save your platform settings.</span>
                </p>
                <div className="mt-3 flex shrink-0 items-center gap-2 sm:mt-0">
                    <Button type="button" variant="companyOutline" size="cta" onClick={onDiscard} disabled={saving}>
                        Discard
                    </Button>
                    <Button type="button" variant="company" size="cta" className="gap-2" onClick={onSave} disabled={saving}>
                        <LuSave size={18} aria-hidden />
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
