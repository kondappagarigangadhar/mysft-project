'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
    HISTORY_MODULES,
    type HistoryLogFilterState,
    type HistoryModule,
    type HistorySeverity,
} from '@/lib/historyLogs/types';
import { MODULE_LABEL } from '@/lib/historyLogs/mockHistoryLogs';
import { LuFilter, LuSearch, LuTrash2, LuX } from 'react-icons/lu';
import { CTA_LINK_TEXT } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';

type SavedViewItem = { id: string; name: string; payload: HistoryLogFilterState };

type Props = {
    open: boolean;
    onClose: () => void;
    filters: HistoryLogFilterState;
    actionTypeOptions: string[];
    userOptions: { id: string; name: string; role?: string }[];
    moduleLocked: boolean;
    onSearch: (v: string) => void;
    onUserId: (v: string | 'all') => void;
    onModule: (v: HistoryModule | 'all') => void;
    onActionType: (v: string | 'all') => void;
    onSeverity: (v: HistorySeverity | 'all') => void;
    onDateFrom: (v: string) => void;
    onDateTo: (v: string) => void;
    onReset: () => void;
    savedViews?: SavedViewItem[];
    onApplySavedView?: (v: SavedViewItem) => void;
    onDeleteSavedView?: (id: string) => void;
};

/** True when any filter deviates from defaults (module lock is not treated as user “extra”). */
export function historyFiltersAreActive(filters: HistoryLogFilterState, moduleLocked: boolean): boolean {
    if (filters.search.trim() !== '') return true;
    if (filters.userId !== 'all') return true;
    if (!moduleLocked && filters.module !== 'all') return true;
    if (filters.actionType !== 'all') return true;
    if (filters.severity !== 'all') return true;
    if (filters.dateFrom !== '' || filters.dateTo !== '') return true;
    return false;
}

const fieldLabel = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500';

/** Right-side panel: all filters (opened from the header “Filters” control). */
export function HistoryFilters({
    open,
    onClose,
    filters,
    actionTypeOptions,
    userOptions,
    moduleLocked,
    onSearch,
    onUserId,
    onModule,
    onActionType,
    onSeverity,
    onDateFrom,
    onDateTo,
    onReset,
    savedViews = [],
    onApplySavedView,
    onDeleteSavedView,
}: Props) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-60"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-filters-title"
        >
            <button
                type="button"
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] transition-opacity"
                onClick={onClose}
                aria-label="Close filters"
            />
            <aside className="absolute top-0 right-0 flex h-full w-full max-w-lg flex-col border-l border-slate-200/90 bg-white shadow-2xl animate-in slide-in-from-right duration-200">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/90 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] text-[var(--cta-button-bg)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]">
                            <LuFilter className="h-4 w-4" aria-hidden />
                        </span>
                        <h2 id="history-filters-title" className="truncate text-lg font-semibold text-slate-900">
                            Filters
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                        aria-label="Close"
                    >
                        <LuX className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="history-filter-search" className={fieldLabel}>
                                Search
                            </label>
                            <div className="relative">
                                <LuSearch
                                    className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    aria-hidden
                                />
                                <input
                                    id="history-filter-search"
                                    value={filters.search}
                                    onChange={(e) => onSearch(e.target.value)}
                                    placeholder="User, record, action…"
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="history-filter-from" className={fieldLabel}>
                                    From
                                </label>
                                <input
                                    id="history-filter-from"
                                    type="date"
                                    value={filters.dateFrom}
                                    onChange={(e) => onDateFrom(e.target.value)}
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-900 focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                                />
                            </div>
                            <div>
                                <label htmlFor="history-filter-to" className={fieldLabel}>
                                    To
                                </label>
                                <input
                                    id="history-filter-to"
                                    type="date"
                                    value={filters.dateTo}
                                    onChange={(e) => onDateTo(e.target.value)}
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm text-slate-900 focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="history-filter-user" className={fieldLabel}>
                                User
                            </label>
                            <select
                                id="history-filter-user"
                                value={filters.userId}
                                onChange={(e) => onUserId(e.target.value as typeof filters.userId)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                            >
                                <option value="all">All users</option>
                                {userOptions.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                        {u.role ? ` · ${u.role}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="history-filter-module" className={fieldLabel}>
                                Module
                            </label>
                            <select
                                id="history-filter-module"
                                value={filters.module}
                                onChange={(e) => onModule(e.target.value as HistoryModule | 'all')}
                                disabled={moduleLocked}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                            >
                                <option value="all">All modules</option>
                                {HISTORY_MODULES.map((m) => (
                                    <option key={m} value={m}>
                                        {MODULE_LABEL[m]}
                                    </option>
                                ))}
                            </select>
                            {moduleLocked ? (
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Module is fixed for this view (from the link you used).
                                </p>
                            ) : null}
                        </div>

                        <div>
                            <label htmlFor="history-filter-action" className={fieldLabel}>
                                Action type
                            </label>
                            <select
                                id="history-filter-action"
                                value={filters.actionType}
                                onChange={(e) => onActionType(e.target.value as string | 'all')}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                            >
                                <option value="all">All actions</option>
                                {actionTypeOptions.map((a) => (
                                    <option key={a} value={a}>
                                        {a.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="history-filter-severity" className={fieldLabel}>
                                Severity
                            </label>
                            <select
                                id="history-filter-severity"
                                value={filters.severity}
                                onChange={(e) => onSeverity(e.target.value as typeof filters.severity)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                            >
                                <option value="all">All</option>
                                <option value="info">Info</option>
                                <option value="success">Success</option>
                                <option value="warning">Warning</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>

                        {savedViews.length > 0 && onApplySavedView ? (
                            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Saved views</p>
                                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                                    {savedViews.map((v) => (
                                        <li key={v.id} className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                className={cn('min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm font-medium hover:bg-white', CTA_LINK_TEXT)}
                                                onClick={() => onApplySavedView(v)}
                                            >
                                                {v.name}
                                            </button>
                                            {onDeleteSavedView ? (
                                                <button
                                                    type="button"
                                                    className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                                    aria-label={`Delete view ${v.name}`}
                                                    onClick={() => onDeleteSavedView(v.id)}
                                                >
                                                    <LuTrash2 className="h-3.5 w-3.5" />
                                                </button>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="shrink-0 space-y-2 border-t border-slate-200/90 bg-slate-50/50 px-5 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="md"
                            className="h-10 w-full rounded-xl sm:min-w-[100px] sm:w-auto"
                            onClick={onReset}
                        >
                            Reset
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="md"
                            className="h-10 w-full rounded-xl sm:min-w-[120px] sm:w-auto"
                            onClick={onClose}
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </aside>
        </div>
    );
}
