import type { HistoryLogEntry } from '@/lib/historyLogs/types';

const KEY = 'arris-supplier-activity-log-v1';

/** Fired when a new supplier-scoped activity entry is appended (for History tab refresh). */
export const SUPPLIER_RECORD_ACTIVITY_EVENT = 'arris-supplier-record-activity';

function canUseStorage() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function loadAll(): HistoryLogEntry[] {
    if (!canUseStorage()) return [];
    try {
        const raw = window.localStorage.getItem(KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? (parsed as HistoryLogEntry[]) : [];
    } catch {
        return [];
    }
}

function persist(entries: HistoryLogEntry[]) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(KEY, JSON.stringify(entries));
}

export function appendSupplierRecordActivity(
    partial: Omit<HistoryLogEntry, 'id' | 'at' | 'module'> & { id?: string },
): HistoryLogEntry {
    const entry: HistoryLogEntry = {
        id: partial.id ?? `sa-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        at: new Date().toISOString(),
        user: partial.user,
        module: 'suppliers',
        recordId: partial.recordId,
        recordLabel: partial.recordLabel,
        action: partial.action,
        changes: partial.changes,
        beforeValue: partial.beforeValue,
        afterValue: partial.afterValue,
        severity: partial.severity,
        actionType: partial.actionType,
    };
    const next = [entry, ...loadAll()].slice(0, 500);
    persist(next);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(SUPPLIER_RECORD_ACTIVITY_EVENT));
    return entry;
}

export function getSupplierRecordActivityLogs(recordId: string): HistoryLogEntry[] {
    const id = recordId.trim();
    return loadAll().filter((e) => e.module === 'suppliers' && e.recordId === id);
}
