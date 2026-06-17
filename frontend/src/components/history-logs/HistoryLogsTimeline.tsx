'use client';

import React, { useMemo } from 'react';
import type { HistoryLogEntry } from '@/lib/historyLogs/types';
import { MODULE_LABEL } from '@/lib/historyLogs/mockHistoryLogs';
import { HistoryLogActionBadge } from '@/components/history-logs/HistoryLogActionBadge';
import { HistoryTimeCell } from '@/components/history-logs/HistoryTimeCell';
import { cn } from '@/lib/utils';
import { CTA_FOCUS_VISIBLE_RING } from '@/lib/theme/ctaThemeClasses';

function dayKey(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
        return iso;
    }
}

export function HistoryLogsTimeline({
    entries,
    onEntryClick,
    showModuleBadge = true,
    showRecordLine = true,
    emptyMessage,
}: {
    entries: HistoryLogEntry[];
    onEntryClick: (e: HistoryLogEntry) => void;
    /** When false, hides the module chip (single-module / record-scoped timelines). */
    showModuleBadge?: boolean;
    /** When false, hides the record title line (redundant when every row is the same record). */
    showRecordLine?: boolean;
    emptyMessage?: string;
}) {
    const groups = useMemo(() => {
        const m = new Map<string, HistoryLogEntry[]>();
        entries.forEach((e) => {
            const k = dayKey(e.at);
            if (!m.has(k)) m.set(k, []);
            m.get(k)!.push(e);
        });
        return Array.from(m.entries());
    }, [entries]);

    if (entries.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-16 text-center text-sm text-slate-500 shadow-sm sm:px-6">
                {emptyMessage ??
                    'No entries match your filters. Try clearing search or expanding the date range.'}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {groups.map(([day, items]) => (
                <div key={day}>
                    <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">{day}</p>
                    <div className="relative pl-6 sm:pl-8">
                        <div
                            className="absolute top-0 bottom-0 left-[7px] w-px bg-slate-200 sm:left-[9px]"
                            aria-hidden
                        />
                        <ul className="space-y-4">
                            {items.map((e) => (
                                <li key={e.id} className="relative">
                                    <span
                                        className="absolute top-2.5 -left-6 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-[var(--cta-button-bg)] ring-1 ring-slate-200 sm:-left-7"
                                        aria-hidden
                                    />
                                    <button
                                        type="button"
                                        onClick={() => onEntryClick(e)}
                                        className={cn(
                                            'w-full rounded-2xl border border-slate-200/90 bg-white p-4 text-left shadow-sm transition-all',
                                            'hover:border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] hover:shadow-md',
                                            'focus-visible:outline-none focus-visible:ring-2',
                                            CTA_FOCUS_VISIBLE_RING,
                                        )}
                                    >
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                            <div className="min-w-0 flex-1 space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-semibold text-slate-900">{e.user.name}</span>
                                                    {showModuleBadge ? (
                                                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-200/80">
                                                            {MODULE_LABEL[e.module]}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                {showRecordLine ? (
                                                    <p className="truncate text-sm text-slate-800" title={e.recordLabel}>
                                                        {e.recordLabel}
                                                    </p>
                                                ) : null}
                                                <div className="flex flex-wrap gap-1.5">
                                                    <HistoryLogActionBadge entry={e} />
                                                </div>
                                            </div>
                                            <div className="shrink-0 sm:min-w-[200px] sm:text-right">
                                                <HistoryTimeCell iso={e.at} />
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ))}
        </div>
    );
}
