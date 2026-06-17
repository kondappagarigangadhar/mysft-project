'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { UnitAvailabilityStatus } from '@/lib/projectsInventoryStore';

function statusLabel(status: UnitAvailabilityStatus | string): string {
    const s = status as UnitAvailabilityStatus;
    if (s === 'reserved') return 'Blocked';
    if (s === 'available') return 'Available';
    if (s === 'sold') return 'Sold';
    if (s === 'pending') return 'Pending';
    return String(status);
}

export function InventoryStatusBadge({ status }: { status: UnitAvailabilityStatus | string }) {
    const s = status as UnitAvailabilityStatus;

    const styles =
        s === 'available'
            ? 'bg-green-50 text-green-700 border-green-200'
            : s === 'reserved'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : s === 'sold'
                ? 'bg-red-50 text-red-700 border-red-200'
                : s === 'pending'
                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200';

    return (
        <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', styles)}>
            {statusLabel(s)}
        </span>
    );
}

