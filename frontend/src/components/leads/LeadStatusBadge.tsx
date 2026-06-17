'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { LeadStatus } from '@/lib/leadStore';

/** Minimal CRM status pill — blue / green / red / gray scale only */
export function LeadStatusBadge({ status }: { status: LeadStatus | string }) {
    const s = status as LeadStatus;

    const styles =
        s === 'New'
            ? 'border-[color-mix(in_srgb,var(--cta-button-bg)_25%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] text-[var(--cta-button-bg)]'
            : s === 'Qualified'
              ? 'border-green-200 bg-green-50 text-green-600'
              : s === 'Lost'
                ? 'border-red-200 bg-red-50 text-red-600'
                : 'border-gray-200 bg-gray-50 text-gray-700';

    return (
        <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold', styles)}>
            {status}
        </span>
    );
}
