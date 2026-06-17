'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { HistoryFilters, historyFiltersAreActive } from '@/components/history-logs/HistoryFilters';
import { HistoryLogTabs } from '@/components/history-logs/HistoryLogTabs';
import { HistoryLogsTimeline } from '@/components/history-logs/HistoryLogsTimeline';
import { HistoryLogDetailDrawer } from '@/components/history-logs/HistoryLogDetailDrawer';
import { defaultHistoryFilters, useHistoryLogs } from '@/hooks/useHistoryLogs';
import { parseHistoryModuleParam } from '@/lib/historyLogs/urlModule';
import {
    downloadHistoryLogsCsv,
    downloadHistoryLogsExcelHtml,
    openHistoryLogsPrintReport,
} from '@/lib/historyLogs/historyExport';
import { getHistoryLogDataTableColumns } from '@/lib/historyLogs/historyLogDataTableColumns';
import { sortHistoryEntries } from '@/lib/historyLogs/sortHistoryEntries';
import { mergeHistoryViewPayload } from '@/lib/historyLogs/savedViewPayload';
import {
    DEFAULT_SAVED_VIEW_AUTHOR,
    importLegacyLocalSavedViewsOnce,
    loadGlobalSavedViews,
    normalizeSavedViewRoute,
    replaceViewsForRoute,
} from '@/lib/globalSavedViewsStore';
import { useConsumePendingSavedView } from '@/hooks/useConsumePendingSavedView';
import { useGlobalSavedViewsSync } from '@/hooks/useGlobalSavedViewsSync';
import type { HistoryLogEntry, HistoryLogFilterState } from '@/lib/historyLogs/types';
import {
    LuBookmark,
    LuCheck,
    LuChevronDown,
    LuColumns3,
    LuDownload,
    LuFileText,
    LuFilter,
    LuHistory,
    LuSearch,
    LuTable2,
    LuTimer,
} from 'react-icons/lu';
import { cn } from '@/lib/utils';
import {
    CTA_BULK_BAR,
    CTA_CHECKBOX_SM,
    CTA_INPUT_FOCUS,
    CTA_NAV_PILL_ACTIVE,
} from '@/lib/theme/ctaThemeClasses';

const PAGE_SIZE = 25;
const TABLE_STORAGE_KEY = 'arris-history-logs-table-v1';
const SAVED_VIEWS_MODULE = 'History logs';
const LEGACY_SAVED_VIEWS_KEY = 'arris-history-logs-saved-views';

const TABLE_DATA_COLUMN_IDS = ['time', 'user', 'module', 'record', 'action', 'changes'] as const;
const DEFAULT_COLUMNS_ON = new Set<string>([...TABLE_DATA_COLUMN_IDS]);

type HistorySavedView = { id: string; name: string; payload: HistoryLogFilterState };

export function HistoryLogsPage() {
    const pathname = usePathname() ?? '';
    const searchParams = useSearchParams();
    const globalViewsTick = useGlobalSavedViewsSync();
    const lockedModule = parseHistoryModuleParam(searchParams.get('module'));
    const savedViewRoute = useMemo(() => {
        const q = searchParams.toString();
        if (!q) return pathname || '/company-admin/history-logs';
        return `${pathname}?${q}`;
    }, [pathname, searchParams]);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [view, setView] = useState<'table' | 'timeline'>('table');
    const [page, setPage] = useState(1);
    const [detail, setDetail] = useState<HistoryLogEntry | null>(null);
    const [searchDraft, setSearchDraft] = useState('');
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'time', direction: 'desc' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const allIds = [...TABLE_DATA_COLUMN_IDS];
        return Object.fromEntries(allIds.map((id) => [id, DEFAULT_COLUMNS_ON.has(id)])) as Record<string, boolean>;
    });
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        time: 200,
        user: 150,
        module: 120,
        record: 200,
        action: 200,
        changes: 220,
    });

    const {
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
        moduleLocked,
    } = useHistoryLogs({ lockedModule });

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(savedViewRoute, SAVED_VIEWS_MODULE, LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [savedViewRoute]);

    const savedViews = useMemo((): HistorySavedView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(savedViewRoute))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as HistoryLogFilterState }));
    }, [savedViewRoute, globalViewsTick]);

    useConsumePendingSavedView(savedViewRoute, (raw) => {
        const next = mergeHistoryViewPayload(defaultHistoryFilters(lockedModule), raw, lockedModule);
        applyFilters(next);
        setSearchDraft(String((raw as { search?: string }).search ?? ''));
    });

    useEffect(() => {
        setSearchDraft(filters.search);
    }, [filters.search]);

    const persistSavedViews = (views: HistorySavedView[]) => {
        replaceViewsForRoute(
            savedViewRoute,
            SAVED_VIEWS_MODULE,
            views.map((v) => ({ id: v.id, name: v.name, payload: v.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
    };

    const applySavedView = (v: HistorySavedView) => {
        const next = mergeHistoryViewPayload(defaultHistoryFilters(lockedModule), v.payload as Record<string, unknown>, lockedModule);
        applyFilters(next);
        setSearchDraft(next.search);
        setPage(1);
        setDrawerOpen(false);
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((s) => s.id !== id));
    };

    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name) return;
        const id = `v-${Date.now()}`;
        persistSavedViews([...savedViews, { id, name, payload: { ...filters } }]);
        setSaveViewName('');
        setSaveModalOpen(false);
    };

    const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
    useEffect(() => {
        setPage(1);
        setSelectedIds(new Set());
    }, [filtersKey]);

    const sortedEntries = useMemo(() => sortHistoryEntries(entries, sort), [entries, sort]);
    const total = sortedEntries.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
    useEffect(() => {
        setPage((p) => Math.min(p, totalPages));
    }, [totalPages, total]);
    const currentPage = Math.min(page, totalPages);
    const pagedEntries = useMemo(
        () => sortedEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
        [sortedEntries, currentPage],
    );

    const selectedRows = useMemo(
        () => sortedEntries.filter((e) => selectedIds.has(e.id)),
        [sortedEntries, selectedIds],
    );
    const exportScope = useCallback((): HistoryLogEntry[] => {
        if (selectedIds.size > 0) return selectedRows;
        return sortedEntries;
    }, [selectedIds, selectedRows, sortedEntries]);

    const runExportCsv = (filename: string) => {
        downloadHistoryLogsCsv(exportScope(), filename);
        setExportMenuOpen(false);
    };
    const runExportExcel = () => {
        const base = `arris-history-logs-${new Date().toISOString().slice(0, 10)}`;
        downloadHistoryLogsExcelHtml(exportScope(), base);
        setExportMenuOpen(false);
    };
    const runPrint = () => {
        const rows = exportScope();
        openHistoryLogsPrintReport(
            rows,
            selectedIds.size > 0 ? `History log · ${rows.length} selected` : `History log · ${rows.length} row(s)`,
        );
        setExportMenuOpen(false);
    };

    const filtersActive = historyFiltersAreActive(filters, moduleLocked);
    const hasActiveFilters = filtersActive;

    useEffect(() => {
        if (!columnMenuOpen && !exportMenuOpen) return;
        const onDoc = (e: MouseEvent) => {
            if (columnMenuOpen && columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
                setColumnMenuOpen(false);
            }
            if (exportMenuOpen && exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
                setExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [columnMenuOpen, exportMenuOpen]);

    const columns: DataTableColumn<HistoryLogEntry>[] = useMemo(() => getHistoryLogDataTableColumns(), []);

    return (
        <div className="w-full pb-12">
            <Breadcrumb
                items={[
                    { label: 'Company Admin', href: '/company-admin/dashboard' },
                    { label: 'History logs' },
                ]}
            />

            <div className="mb-4 mt-4 flex flex-col gap-4 sm:mt-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] text-[var(--cta-button-bg)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]">
                            <LuHistory className="h-5 w-5" aria-hidden />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">History logs</h1>
                            <p className="mt-0.5 text-sm text-slate-500">
                                Who changed what and when — one place for the full platform (demo data; API-ready).
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="order-2 flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:order-1">
                    <div className="relative min-w-[200px] max-w-xl flex-1">
                        <LuSearch className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setSearch(searchDraft);
                                    setPage(1);
                                }
                            }}
                            placeholder="Search user, record, action, module…"
                            className={cn(
                                'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white',
                                CTA_INPUT_FOCUS,
                            )}
                            aria-label="Search history"
                        />
                    </div>
                    <div
                        className="inline-flex rounded-xl border border-slate-200/90 bg-slate-50/80 p-0.5"
                        role="group"
                        aria-label="View mode"
                    >
                        <button
                            type="button"
                            onClick={() => setView('table')}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors',
                                view === 'table'
                                    ? CTA_NAV_PILL_ACTIVE
                                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-800',
                            )}
                            aria-pressed={view === 'table'}
                        >
                            <LuTable2 size={16} />
                            Table
                        </button>
                        <button
                            type="button"
                            onClick={() => setView('timeline')}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors',
                                view === 'timeline'
                                    ? CTA_NAV_PILL_ACTIVE
                                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-800',
                            )}
                            aria-pressed={view === 'timeline'}
                        >
                            <LuTimer size={16} />
                            Timeline
                        </button>
                    </div>
                </div>
                <div className="order-1 flex flex-wrap items-center justify-end gap-2 sm:order-2">
                    {view === 'table' ? (
                        <div className="relative" ref={columnMenuRef}>
                            <Button
                                type="button"
                                variant="companyOutline"
                                size="cta"
                                className="gap-2"
                                onClick={() => setColumnMenuOpen((o) => !o)}
                                aria-expanded={columnMenuOpen}
                            >
                                <LuColumns3 size={18} />
                                Columns
                            </Button>
                            {columnMenuOpen ? (
                                <div className="absolute right-0 top-[calc(100%+6px)] z-[300] w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                    <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</p>
                                    {TABLE_DATA_COLUMN_IDS.map((id) => {
                                        const label =
                                            id === 'time'
                                                ? 'Time'
                                                : id === 'user'
                                                  ? 'User'
                                                  : id === 'module'
                                                    ? 'Module'
                                                    : id === 'record'
                                                      ? 'Record'
                                                      : id === 'action'
                                                        ? 'Action'
                                                        : 'Changes';
                                        return (
                                            <label
                                                key={id}
                                                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className={CTA_CHECKBOX_SM}
                                                    checked={columnVisibility[id] !== false}
                                                    onChange={() =>
                                                        setColumnVisibility((m) => {
                                                            const on = m[id] !== false;
                                                            return { ...m, [id]: !on };
                                                        })
                                                    }
                                                />
                                                {label}
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    <Button
                        type="button"
                        variant={drawerOpen ? 'company' : 'companyOutline'}
                        size="cta"
                        className="gap-2"
                        onClick={() => setDrawerOpen(true)}
                    >
                        <LuFilter size={18} />
                        Filters
                        {hasActiveFilters ? <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">On</span> : null}
                    </Button>
                    <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setSaveModalOpen(true)}>
                        <LuBookmark size={18} />
                        Save view
                    </Button>
                    <div className="relative" ref={exportMenuRef}>
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="cta"
                            className="gap-2"
                            onClick={() => setExportMenuOpen((o) => !o)}
                            aria-expanded={exportMenuOpen}
                        >
                            <LuDownload size={18} />
                            Export
                            <LuChevronDown size={16} className="opacity-70" />
                        </Button>
                        {exportMenuOpen ? (
                            <div className="absolute right-0 top-[calc(100%+6px)] z-[300] w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() => runExportCsv(selectedIds.size ? 'history-logs-selected.csv' : 'history-logs-export.csv')}
                                >
                                    <LuDownload size={16} className="text-slate-400" />
                                    CSV
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={runExportExcel}
                                >
                                    <LuFileText size={16} className="text-slate-400" />
                                    Excel
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={runPrint}
                                >
                                    <LuFileText size={16} className="text-slate-400" />
                                    Print / PDF
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="mb-3">
                <HistoryLogTabs />
            </div>

            {selectedIds.size > 0 && view === 'table' ? (
                <div className={cn(CTA_BULK_BAR, 'mb-4 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between')}>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <LuCheck size={18} />
                        {selectedIds.size} selected
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="sm"
                            className="gap-1.5 bg-white"
                            onClick={() => {
                                const rows = selectedRows;
                                downloadHistoryLogsCsv(rows, 'history-logs-selected.csv');
                            }}
                        >
                            <LuDownload size={16} />
                            Export
                        </Button>
                        <Button type="button" variant="companyGhost" size="sm" onClick={() => setSelectedIds(new Set())}>
                            Clear
                        </Button>
                    </div>
                </div>
            ) : null}

            <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">{total}</span> matching event{total === 1 ? '' : 's'}
                </p>
            </div>

            <div className="mt-1">
                {view === 'table' ? (
                    <>
                        <DataTable<HistoryLogEntry>
                            columns={columns}
                            data={pagedEntries}
                            getRowId={(row) => row.id}
                            sort={sort}
                            onSortChange={setSort}
                            columnVisibility={columnVisibility}
                            columnWidths={columnWidths}
                            onColumnWidthsChange={setColumnWidths}
                            storageKey={TABLE_STORAGE_KEY}
                            stickyColumnId="time"
                            enableClientSort={false}
                            emptyMessage="No events match your filters. Adjust search or filters, or clear the date range."
                            selection={{
                                rowKey: 'id',
                                selectedIds,
                                onSelectedIdsChange: setSelectedIds,
                            }}
                            onRowClick={(row) => setDetail(row)}
                        />
                        <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setPage}
                                totalItems={total}
                                itemsPerPage={PAGE_SIZE}
                                label="events"
                            />
                        </div>
                    </>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
                            <p className="text-sm font-medium text-slate-700">Activity (timeline view)</p>
                        </div>
                        <div className="px-2 py-4 sm:px-4">
                            <HistoryLogsTimeline entries={pagedEntries} onEntryClick={setDetail} />
                        </div>
                        <div className="rounded-b-xl border-t border-slate-100 bg-white px-4 py-3">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setPage}
                                totalItems={total}
                                itemsPerPage={PAGE_SIZE}
                                label="events"
                            />
                        </div>
                    </div>
                )}
            </div>

            <HistoryFilters
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                filters={filters}
                actionTypeOptions={actionTypeOptions}
                userOptions={userOptions}
                moduleLocked={moduleLocked}
                onSearch={setSearch}
                onUserId={setUserId}
                onModule={setModule}
                onActionType={setActionType}
                onSeverity={setSeverity}
                onDateFrom={setDateFrom}
                onDateTo={setDateTo}
                onReset={resetFilters}
                savedViews={savedViews}
                onApplySavedView={applySavedView}
                onDeleteSavedView={deleteSavedView}
            />

            <Modal
                isOpen={saveModalOpen}
                onClose={() => {
                    setSaveModalOpen(false);
                    setSaveViewName('');
                }}
                title="Save view"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="companyOutline"
                            onClick={() => {
                                setSaveModalOpen(false);
                                setSaveViewName('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="button" variant="company" onClick={saveCurrentView} disabled={!saveViewName.trim()}>
                            Save
                        </Button>
                    </div>
                }
            >
                <p className="text-sm text-slate-600">Save the current search and filter settings for this page.</p>
                <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    placeholder="e.g. Payments · last 7 days"
                    className={cn('mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900', CTA_INPUT_FOCUS)}
                />
            </Modal>

            <HistoryLogDetailDrawer entry={detail} onClose={() => setDetail(null)} />
        </div>
    );
}
