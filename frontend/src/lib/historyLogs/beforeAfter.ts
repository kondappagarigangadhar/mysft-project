import type { HistoryLogEntry } from '@/lib/historyLogs/types';

/** Structured before/after for the detail drawer; falls back to parsing `changes`. */
export function getBeforeAfterForEntry(e: HistoryLogEntry): { before: string; after: string } {
    if (e.beforeValue !== undefined || e.afterValue !== undefined) {
        return { before: e.beforeValue ?? '—', after: e.afterValue ?? '—' };
    }
    const c = (e.changes ?? '').trim();
    if (c === '' || c === '—') return { before: '—', after: '—' };
    const parts = c.split(/\s*→\s*/);
    if (parts.length >= 2) {
        return {
            before: parts[0].trim() || '—',
            after: parts.slice(1).join(' → ').trim() || '—',
        };
    }
    return { before: '—', after: c };
}
