'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function vendorDocumentInputClass(errored: boolean) {
    return cn(
        'h-11 w-full rounded-xl border bg-white px-3 text-sm shadow-sm outline-none transition focus:ring-4 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]',
        errored
            ? 'border-red-300 focus:border-red-400'
            : 'border-slate-200 focus:border-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)]',
    );
}

export function VendorDocumentFormField({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
            {children}
        </div>
    );
}
