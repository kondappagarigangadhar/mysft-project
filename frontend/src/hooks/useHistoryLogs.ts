'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    MOCK_HISTORY_LOGS,
    actionTypesForModule,
    filterHistoryLogs,
    uniqueHistoryUsers,
    type HistoryLogEntry,
    type HistoryLogFilterState,
    type HistoryModule,
} from '@/lib/historyLogs';

export const defaultHistoryFilters = (lockedModule: HistoryModule | 'all'): HistoryLogFilterState => {
    const d: HistoryLogFilterState = {
        search: '',
        module: 'all',
        userId: 'all',
        actionType: 'all',
        severity: 'all',
        dateFrom: '',
        dateTo: '',
    };
    if (lockedModule !== 'all') d.module = lockedModule;
    return d;
};

const defaultFilters = (locked: HistoryModule | 'all') => defaultHistoryFilters(locked);

type UseHistoryLogsOptions = {
    /** When not `all`, module is fixed (e.g. from ?module=leads) and the module filter is hidden. */
    lockedModule: HistoryModule | 'all';
};

export function useHistoryLogs({ lockedModule }: UseHistoryLogsOptions) {
    const [filters, setFilters] = useState<HistoryLogFilterState>(() => defaultFilters(lockedModule));

    useEffect(() => {
        setFilters((f) => ({
            ...f,
            module: lockedModule === 'all' ? 'all' : lockedModule,
        }));
    }, [lockedModule]);

    const entries = useMemo(() => filterHistoryLogs(MOCK_HISTORY_LOGS, filters), [filters]);

    const actionTypeOptions = useMemo(
        () => actionTypesForModule(MOCK_HISTORY_LOGS, filters.module),
        [filters.module],
    );

    const userOptions = useMemo(() => uniqueHistoryUsers(MOCK_HISTORY_LOGS), []);

    const setSearch = useCallback((search: string) => setFilters((f) => ({ ...f, search })), []);
    const setUserId = useCallback((userId: string | 'all') => setFilters((f) => ({ ...f, userId })), []);
    const setModule = useCallback((module: HistoryModule | 'all') => {
        if (lockedModule !== 'all') return;
        setFilters((f) => ({ ...f, module }));
    }, [lockedModule]);
    const setActionType = useCallback(
        (actionType: string | 'all') => setFilters((f) => ({ ...f, actionType })),
        [],
    );
    const setSeverity = useCallback(
        (severity: HistoryLogFilterState['severity']) => setFilters((f) => ({ ...f, severity })),
        [],
    );
    const setDateFrom = useCallback((dateFrom: string) => setFilters((f) => ({ ...f, dateFrom })), []);
    const setDateTo = useCallback((dateTo: string) => setFilters((f) => ({ ...f, dateTo })), []);
    const resetFilters = useCallback(() => {
        setFilters(() => defaultFilters(lockedModule));
    }, [lockedModule]);

    const applyFilters = useCallback(
        (next: HistoryLogFilterState) => {
            setFilters(() => {
                if (lockedModule === 'all') return { ...next };
                return { ...next, module: lockedModule };
            });
        },
        [lockedModule],
    );

    return {
        filters,
        entries,
        actionTypeOptions,
        userOptions,
        setSearch,
        setUserId,
        setModule,
        setActionType,
        setSeverity,
        setDateFrom,
        setDateTo,
        resetFilters,
        applyFilters,
        moduleLocked: lockedModule !== 'all',
    };
}

export type { HistoryLogEntry, HistoryLogFilterState, HistoryModule };
