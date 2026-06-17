import { HISTORY_MODULES, type HistoryLogFilterState, type HistoryModule, type HistorySeverity } from '@/lib/historyLogs/types';

const SEVERITIES = ['all', 'info', 'success', 'warning', 'critical'] as const;

function isModule(v: unknown): v is HistoryModule | 'all' {
    return v === 'all' || (typeof v === 'string' && (HISTORY_MODULES as readonly string[]).includes(v));
}

function isSeverity(v: unknown): v is HistorySeverity | 'all' {
    return v === 'all' || (typeof v === 'string' && (SEVERITIES as readonly string[]).includes(v));
}

/** Merge a saved view payload with defaults; respect URL-locked module. */
export function mergeHistoryViewPayload(
    defaults: HistoryLogFilterState,
    raw: Record<string, unknown> | null | undefined,
    lockedModule: HistoryModule | 'all',
): HistoryLogFilterState {
    if (!raw) return defaults;
    const o = raw as Record<string, unknown>;
    const moduleId: HistoryModule | 'all' =
        lockedModule !== 'all' ? lockedModule : isModule(o.module) ? o.module : defaults.module;
    return {
        search: typeof o.search === 'string' ? o.search : defaults.search,
        userId:
            o.userId === 'all' || (typeof o.userId === 'string' && o.userId)
                ? (o.userId as HistoryLogFilterState['userId'])
                : defaults.userId,
        module: moduleId,
        actionType:
            o.actionType === 'all' || (typeof o.actionType === 'string' && o.actionType.length > 0)
                ? (o.actionType as HistoryLogFilterState['actionType'])
                : defaults.actionType,
        severity: isSeverity(o.severity) ? o.severity : defaults.severity,
        dateFrom: typeof o.dateFrom === 'string' ? o.dateFrom : defaults.dateFrom,
        dateTo: typeof o.dateTo === 'string' ? o.dateTo : defaults.dateTo,
    };
}
