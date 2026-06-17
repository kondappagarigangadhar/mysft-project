'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LuSparkles } from 'react-icons/lu';

export function AICopilotPanel({
    title = 'AI Copilot',
    children,
    className,
}: {
    title?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <aside
            className={cn(
                'rounded-2xl border border-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)] bg-gradient-to-b from-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] via-white to-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] p-4 shadow-sm ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_14%,transparent)]',
                className,
            )}
        >
            <div className="mb-3 flex items-center gap-2 border-b border-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)] pb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--cta-button-hover-bg)] to-[var(--cta-button-bg)] text-[var(--cta-button-text)] shadow-sm">
                    <LuSparkles className="h-4 w-4" aria-hidden />
                </span>
                <div>
                    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                    <p className="text-[10px] font-medium text-slate-500">Contextual suggestions</p>
                </div>
            </div>
            <div className="space-y-3 text-sm">{children}</div>
        </aside>
    );
}
