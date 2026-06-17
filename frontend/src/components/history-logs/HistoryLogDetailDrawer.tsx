'use client';

import React, { useEffect } from 'react';
import type { HistoryLogEntry } from '@/lib/historyLogs/types';
import { getBeforeAfterForEntry } from '@/lib/historyLogs/beforeAfter';
import { formatHistoryExactLong } from '@/lib/historyLogs/historyTime';
import { MODULE_LABEL } from '@/lib/historyLogs/mockHistoryLogs';
import { LuX } from 'react-icons/lu';
import { Button } from '@/components/ui/Button';

type Props = {
    entry: HistoryLogEntry | null;
    onClose: () => void;
};

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="border-b border-slate-100 py-3 last:border-0">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-900">{value}</dd>
        </div>
    );
}

export function HistoryLogDetailDrawer({ entry, onClose }: Props) {
    const open = entry != null;

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    if (!entry) return null;

    const { before, after } = getBeforeAfterForEntry(entry);
    const exact = formatHistoryExactLong(entry.at);

    return (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="hist-detail-title">
            <button
                type="button"
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
                onClick={onClose}
                aria-label="Close detail"
            />
            <aside className="absolute top-0 right-0 flex h-full w-full max-w-lg flex-col border-l border-slate-200/90 bg-white shadow-2xl animate-in slide-in-from-right duration-200">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/90 px-5 py-4">
                    <h2 id="hist-detail-title" className="text-lg font-semibold text-slate-900">
                        Activity detail
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                        aria-label="Close"
                    >
                        <LuX className="h-5 w-5" />
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
                    <dl>
                        <Row label="User" value={entry.user.role ? `${entry.user.name} (${entry.user.role})` : entry.user.name} />
                        <Row label="Module" value={MODULE_LABEL[entry.module]} />
                        <Row label="Record" value={`${entry.recordLabel} · ${entry.recordId}`} />
                        <Row label="Action" value={entry.action} />
                        <Row label="Before value" value={before} />
                        <Row label="After value" value={after} />
                        <Row label="Exact timestamp" value={exact} />
                    </dl>
                </div>
                <div className="shrink-0 border-t border-slate-200/90 bg-slate-50/50 px-5 py-4">
                    <Button type="button" variant="company" className="h-10 w-full rounded-xl" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </aside>
        </div>
    );
}
