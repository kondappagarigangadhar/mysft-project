'use client';

import React from 'react';
import type { HistoryLogEntry } from '@/lib/historyLogs/types';
import {
    getHistoryActionBadgeKind,
    historyActionBadgeClass,
} from '@/lib/historyLogs/historyActionBadge';
import { cn } from '@/lib/utils';

export function HistoryLogActionBadge({ entry, className }: { entry: HistoryLogEntry; className?: string }) {
    const kind = getHistoryActionBadgeKind(entry);
    return (
        <span
            className={cn(
                'inline-flex max-w-full items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1',
                historyActionBadgeClass(kind),
                className,
            )}
        >
            {entry.action}
        </span>
    );
}
