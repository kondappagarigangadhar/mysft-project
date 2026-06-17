'use client';

import React from 'react';
import { formatHistoryExactLong, formatHistoryRelative } from '@/lib/historyLogs/historyTime';

export function HistoryTimeCell({ iso }: { iso: string }) {
    const rel = formatHistoryRelative(iso);
    const exact = formatHistoryExactLong(iso);
    return (
        <div className="tabular-nums">
            <div className="text-[13px] font-medium text-slate-900">{rel}</div>
            <div className="mt-0.5 text-[11px] leading-snug text-slate-500" title={exact}>
                {exact}
            </div>
        </div>
    );
}
