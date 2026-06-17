'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { ComplianceDemoRoleSelect } from '@/components/documents-compliance/ComplianceDemoRoleSelect';
import { ComplianceNotificationsBell } from '@/components/documents-compliance/ComplianceNotificationsBell';
import { COMPLIANCE_SELECT_FILTER_CLASS, COMPLIANCE_SEARCH_INPUT_CLASS } from '@/components/documents-compliance/complianceFilterStyles';
import { cn } from '@/lib/utils';
import { CTA_BULK_BAR, CTA_CHECKBOX_SM, CTA_FLOW_LINK_SEMIBOLD, CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';
import { useComplianceStoreBump } from '@/hooks/useComplianceStoreBump';
import { exportAuditCsv, getAuditLogs, type AuditActivityType, type AuditLogEntry } from '@/lib/complianceDocumentsMockStore';
import {
    DEFAULT_SAVED_VIEW_AUTHOR,
    importLegacyLocalSavedViewsOnce,
    loadGlobalSavedViews,
    normalizeSavedViewRoute,
    replaceViewsForRoute,
} from '@/lib/globalSavedViewsStore';
import { useConsumePendingSavedView } from '@/hooks/useConsumePendingSavedView';
import { useGlobalSavedViewsSync } from '@/hooks/useGlobalSavedViewsSync';
import { formatShortDate } from '@/lib/formatDate';
import {
    LuBookmark,
    LuCheck,
    LuChevronDown,
    LuColumns3,
    LuDownload,
    LuFileText,
    LuFilter,
    LuSearch,
    LuTrash2,
    LuX,
} from 'react-icons/lu';

const ACTIVITY_OPTIONS: (AuditActivityType | 'All')[] = [
    'All',
    'Upload',
    'Edit', 
    'Delete',
    'View',
    'Sign',
    'Restore',
    'Version',
    'Download',
];

const ITEMS_PER_PAGE = 10;
const TABLE_STORAGE_KEY = 'arris-audit-activity-datatable-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-compliance-audit-saved-views';
const AUDIT_HUB = '/company-admin/documents-compliance/audit';

type AuditFilterPayload = {
    searchTerm: string;
    activity: (typeof ACTIVITY_OPTIONS)[number];
    docIdFilter: string;
    dateFrom: string;
    dateTo: string;
};

type SavedAuditView = { id: string; name: string; payload: AuditFilterPayload };

function defaultAuditFilters(): AuditFilterPayload {
    return { searchTerm: '', activity: 'All', docIdFilter: '', dateFrom: '', dateTo: '' };
}

function sortAuditList(rows: AuditLogEntry[], sort: DataTableSortState): AuditLogEntry[] {
    const col = sort.columnId;
    if (!col) return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'timestamp':
                va = a.timestamp;
                vb = b.timestamp;
                break;
            case 'userName':
                va = a.userName.toLowerCase();
                vb = b.userName.toLowerCase();
                break;
            case 'userRole':
                va = a.userRole.toLowerCase();
                vb = b.userRole.toLowerCase();
                break;
            case 'activityType':
                va = a.activityType;
                vb = b.activityType;
                break;
            case 'documentId':
                va = a.documentId.toLowerCase();
                vb = b.documentId.toLowerCase();
                break;
            case 'ipAddress':
                va = a.ipAddress.toLowerCase();
                vb = b.ipAddress.toLowerCase();
                break;
            case 'deviceInfo':
                va = a.deviceInfo.toLowerCase();
                vb = b.deviceInfo.toLowerCase();
                break;
            case 'remarks':
                va = a.remarks.toLowerCase();
                vb = b.remarks.toLowerCase();
                break;
            default:
                return 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

function downloadAuditCsvBlob(rows: AuditLogEntry[], filename: string) {
    const csv = exportAuditCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function AuditLogPanel() {
    const pathname = usePathname() ?? AUDIT_HUB;
    const globalViewsTick = useGlobalSavedViewsSync();
    const bump = useComplianceStoreBump();

    const [searchTerm, setSearchTerm] = useState('');
    const [searchDraft, setSearchDraft] = useState('');
    const [activity, setActivity] = useState<(typeof ACTIVITY_OPTIONS)[number]>('All');
    const [docIdFilter, setDocIdFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [drawerOpen, setDrawerOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');

    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'timestamp', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const ids = ['timestamp', 'userName', 'userRole', 'activityType', 'documentId', 'ipAddress', 'deviceInfo', 'remarks'];
        return Object.fromEntries(ids.map((id) => [id, true])) as Record<string, boolean>;
    });

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        timestamp: 160,
        userName: 140,
        userRole: 120,
        activityType: 100,
        documentId: 130,
        ipAddress: 120,
        deviceInfo: 180,
        remarks: 220,
    });

    useEffect(() => {
        if (!columnMenuOpen) return;
        const onPointerDown = (e: MouseEvent | TouchEvent) => {
            const el = columnMenuRef.current;
            if (el && !el.contains(e.target as Node)) setColumnMenuOpen(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown, { passive: true });
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
        };
    }, [columnMenuOpen]);

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Audit log', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedAuditView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as AuditFilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const p = { ...defaultAuditFilters(), ...(f as AuditFilterPayload) };
        setSearchTerm(p.searchTerm ?? '');
        setSearchDraft(p.searchTerm ?? '');
        setActivity(p.activity);
        setDocIdFilter(p.docIdFilter);
        setDateFrom(p.dateFrom);
        setDateTo(p.dateTo);
    });

    useEffect(() => {
        const t = window.setTimeout(() => {
            setSearchTerm((prev) => (prev === searchDraft ? prev : searchDraft));
        }, 320);
        return () => window.clearTimeout(t);
    }, [searchDraft]);

    useEffect(() => {
        if (!exportMenuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setExportMenuOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [exportMenuOpen]);

    const allLogs = useMemo(() => getAuditLogs(), [bump]);

    const filteredRows = useMemo(() => {
        let list = allLogs;
        const qq = searchTerm.trim().toLowerCase();
        if (qq) {
            list = list.filter(
                (r) =>
                    r.userName.toLowerCase().includes(qq) ||
                    r.documentId.toLowerCase().includes(qq) ||
                    r.remarks.toLowerCase().includes(qq),
            );
        }
        if (activity !== 'All') list = list.filter((r) => r.activityType === activity);
        const di = docIdFilter.trim();
        if (di) list = list.filter((r) => r.documentId.toLowerCase().includes(di.toLowerCase()));
        if (dateFrom) list = list.filter((r) => r.timestamp.slice(0, 10) >= dateFrom);
        if (dateTo) list = list.filter((r) => r.timestamp.slice(0, 10) <= dateTo);
        return list;
    }, [allLogs, searchTerm, activity, docIdFilter, dateFrom, dateTo]);

    const sortedFilteredDocs = useMemo(() => sortAuditList(filteredRows, sort), [filteredRows, sort]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activity, docIdFilter, dateFrom, dateTo, sort, bump]);

    const totalPages = Math.max(1, Math.ceil(sortedFilteredDocs.length / ITEMS_PER_PAGE));
    const paginatedDocs = useMemo(
        () => sortedFilteredDocs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sortedFilteredDocs, currentPage],
    );

    const hasAdvancedFilters =
        activity !== 'All' || docIdFilter.trim() !== '' || dateFrom !== '' || dateTo !== '';
    const hasActiveFilters = searchTerm.trim() !== '' || hasAdvancedFilters;

    const persistSavedViews = (views: SavedAuditView[]) => {
        replaceViewsForRoute(
            pathname,
            'Audit log',
            views.map((x) => ({ id: x.id, name: x.name, payload: x.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
    };

    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name) return;
        const payload: AuditFilterPayload = {
            searchTerm: searchDraft,
            activity,
            docIdFilter,
            dateFrom,
            dateTo,
        };
        persistSavedViews([...savedViews, { id: `v-${Date.now()}`, name, payload }]);
        setSaveViewName('');
        setSaveModalOpen(false);
    };

    const applySavedView = (v: SavedAuditView) => {
        const p = { ...defaultAuditFilters(), ...v.payload };
        setSearchTerm(p.searchTerm ?? '');
        setSearchDraft(p.searchTerm ?? '');
        setActivity(p.activity);
        setDocIdFilter(p.docIdFilter);
        setDateFrom(p.dateFrom);
        setDateTo(p.dateTo);
        setDrawerOpen(false);
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((x) => x.id !== id));
    };

    const resetListFilters = () => {
        setSearchDraft('');
        setSearchTerm('');
        setActivity('All');
        setDocIdFilter('');
        setDateFrom('');
        setDateTo('');
    };

    const selectedRows = useMemo(
        () => sortedFilteredDocs.filter((d) => selectedIds.has(d.id)),
        [sortedFilteredDocs, selectedIds],
    );

    const exportRowsForScope = () => (selectedIds.size ? selectedRows : sortedFilteredDocs);

    const runExportCsv = (filename: string) => {
        downloadAuditCsvBlob(exportRowsForScope(), filename);
        setExportMenuOpen(false);
    };

    const runExportExcelCsv = () => {
        downloadAuditCsvBlob(exportRowsForScope(), 'audit-log-excel.csv');
        setExportMenuOpen(false);
    };

    const bulkExportCsv = () => {
        downloadAuditCsvBlob(
            exportRowsForScope(),
            selectedIds.size ? 'audit-selected.csv' : 'audit-export.csv',
        );
    };

    const columns: DataTableColumn<AuditLogEntry>[] = useMemo(
        () => [
            {
                id: 'timestamp',
                header: 'Timestamp',
                sticky: true,
                sortable: true,
                sortValue: (row) => row.timestamp,
                minWidth: 160,
                render: (row) => (
                    <span className="whitespace-nowrap text-xs text-slate-600">
                        {formatShortDate(row.timestamp.slice(0, 10))}{' '}
                        {new Date(row.timestamp).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                ),
            },
            {
                id: 'userName',
                header: 'User',
                sortable: true,
                sortValue: (row) => row.userName.toLowerCase(),
                minWidth: 140,
                render: (row) => <span className="font-medium text-slate-900">{row.userName}</span>,
            },
            {
                id: 'userRole',
                header: 'Role',
                sortable: true,
                sortValue: (row) => row.userRole.toLowerCase(),
                minWidth: 120,
                render: (row) => <span className="capitalize text-slate-600">{row.userRole.replace('_', ' ')}</span>,
            },
            {
                id: 'activityType',
                header: 'Activity',
                sortable: true,
                sortValue: (row) => row.activityType,
                minWidth: 100,
                render: (row) => <span className="text-slate-700">{row.activityType}</span>,
            },
            {
                id: 'documentId',
                header: 'Document',
                sortable: true,
                sortValue: (row) => row.documentId.toLowerCase(),
                minWidth: 130,
                render: (row) => <span className="font-mono text-xs text-slate-600">{row.documentId}</span>,
            },
            {
                id: 'ipAddress',
                header: 'IP',
                sortable: true,
                sortValue: (row) => row.ipAddress.toLowerCase(),
                minWidth: 120,
                render: (row) => <span className="font-mono text-xs text-slate-600">{row.ipAddress}</span>,
            },
            {
                id: 'deviceInfo',
                header: 'Device',
                sortable: true,
                sortValue: (row) => row.deviceInfo.toLowerCase(),
                minWidth: 180,
                render: (row) => (
                    <span className="max-w-[200px] truncate text-xs text-slate-500" title={row.deviceInfo}>
                        {row.deviceInfo}
                    </span>
                ),
            },
            {
                id: 'remarks',
                header: 'Remarks',
                sortable: true,
                sortValue: (row) => row.remarks.toLowerCase(),
                minWidth: 220,
                render: (row) => <span className="max-w-[220px] text-xs text-slate-600">{row.remarks}</span>,
            },
        ],
        [],
    );

    return (
        <div className="space-y-6">
            <Breadcrumb
                items={[
                    { label: 'Documents & Compliance', href: '/company-admin/documents-compliance' },
                    { label: 'Audit' },
                ]}
            />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Audit &amp; activity</h1>
                        <p className="mt-1 max-w-2xl text-sm text-slate-600">
                            Use the table below; filter logs and export CSV. Entries are immutable (no edit/delete).
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <ComplianceDemoRoleSelect className="max-w-xs" />
                    <ComplianceNotificationsBell />
                </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="order-2 flex min-w-0 flex-1 items-center gap-2 sm:order-1">
                    <div className="relative max-w-xl flex-1">
                        <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Search user, document ID, remarks…"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') setSearchTerm(searchDraft);
                            }}
                            className={COMPLIANCE_SEARCH_INPUT_CLASS}
                            aria-label="Search audit log"
                        />
                    </div>
                </div>
                <div className="order-1 flex flex-wrap items-center justify-end gap-2 sm:order-2">
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
                            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</p>
                                {[
                                    ['timestamp', 'Timestamp'],
                                    ['userName', 'User'],
                                    ['userRole', 'Role'],
                                    ['activityType', 'Activity'],
                                    ['documentId', 'Document ID'],
                                    ['ipAddress', 'IP'],
                                    ['deviceInfo', 'Device'],
                                    ['remarks', 'Remarks'],
                                ].map(([id, label]) => (
                                    <label key={id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                                        <input
                                            type="checkbox"
                                            className={CTA_CHECKBOX_SM}
                                            checked={columnVisibility[id] !== false}
                                            onChange={() =>
                                                setColumnVisibility((m) => {
                                                    const vis = m[id] !== false;
                                                    return { ...m, [id]: !vis };
                                                })
                                            }
                                        />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        ) : null}
                    </div>
                    <Button
                        type="button"
                        variant={drawerOpen ? 'company' : 'companyOutline'}
                        size="cta"
                        className="gap-2"
                        onClick={() => setDrawerOpen(true)}
                    >
                        <LuFilter size={18} />
                        Filters
                        {hasActiveFilters ? (
                            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">On</span>
                        ) : null}
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
                            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() =>
                                        runExportCsv(selectedIds.size ? 'audit-selected.csv' : `audit-log-${new Date().toISOString().slice(0, 10)}.csv`)
                                    }
                                >
                                    <LuDownload size={16} className="text-slate-400" />
                                    CSV
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={runExportExcelCsv}
                                >
                                    <LuFileText size={16} className="text-slate-400" />
                                    Excel (UTF-8 CSV)
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {hasActiveFilters && allLogs.length > 0 ? (
                <p className="text-xs font-medium text-slate-500">
                    Filtered table: {filteredRows.length} of {allLogs.length} entr{allLogs.length === 1 ? 'y' : 'ies'}
                </p>
            ) : null}

            {selectedIds.size > 0 ? (
                <div className={cn(CTA_BULK_BAR, 'mb-4 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between')}>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <LuCheck size={18} />
                        {selectedIds.size} selected
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={bulkExportCsv}>
                            <LuDownload size={16} />
                            Export
                        </Button>
                        <Button type="button" variant="companyGhost" size="sm" onClick={() => setSelectedIds(new Set())}>
                            Clear
                        </Button>
                    </div>
                </div>
            ) : null}

            <DataTable<AuditLogEntry>
                columns={columns}
                data={paginatedDocs}
                getRowId={(row) => row.id}
                sort={sort}
                onSortChange={setSort}
                columnVisibility={columnVisibility}
                columnWidths={columnWidths}
                onColumnWidthsChange={setColumnWidths}
                storageKey={TABLE_STORAGE_KEY}
                stickyColumnId="timestamp"
                enableClientSort={false}
                selection={{
                    rowKey: 'id',
                    selectedIds,
                    onSelectedIdsChange: setSelectedIds,
                }}
                emptyMessage={allLogs.length === 0 ? 'No audit entries yet.' : 'No entries match your filters.'}
            />

            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={sortedFilteredDocs.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    label="entries"
                />
            </div>

            {drawerOpen ? (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
                        aria-label="Close filters"
                        onClick={() => setDrawerOpen(false)}
                    />
                    <aside
                        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
                        role="dialog"
                        aria-label="Advanced filters"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-bold text-slate-900">Advanced filters</h2>
                            <button
                                type="button"
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                                onClick={() => setDrawerOpen(false)}
                            >
                                <LuX size={20} />
                            </button>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">

                            <div>
                                <label htmlFor="audit-filter-activity" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Activity type
                                </label>
                                <select
                                    id="audit-filter-activity"
                                    value={activity}
                                    onChange={(e) => setActivity(e.target.value as typeof activity)}
                                    className={cn('mt-1.5', COMPLIANCE_SELECT_FILTER_CLASS)}
                                >
                                    {ACTIVITY_OPTIONS.map((a) => (
                                        <option key={a} value={a}>
                                            {a === 'All' ? 'All activities' : a}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="audit-filter-doc" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Document ID contains
                                </label>
                                <input
                                    id="audit-filter-doc"
                                    type="text"
                                    value={docIdFilter}
                                    onChange={(e) => setDocIdFilter(e.target.value)}
                                    placeholder="e.g. DOC-2026"
                                    className={cn('mt-1.5', COMPLIANCE_SELECT_FILTER_CLASS)}
                                />
                            </div>
                            <div>
                                <label htmlFor="audit-filter-from" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Date from
                                </label>
                                <input
                                    id="audit-filter-from"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className={cn('mt-1.5', COMPLIANCE_SELECT_FILTER_CLASS)}
                                />
                            </div>
                            <div>
                                <label htmlFor="audit-filter-to" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Date to
                                </label>
                                <input
                                    id="audit-filter-to"
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className={cn('mt-1.5', COMPLIANCE_SELECT_FILTER_CLASS)}
                                />
                            </div>
                            {savedViews.length > 0 ? (
                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                    <p className="text-xs font-semibold uppercase text-slate-500">Saved views</p>
                                    <ul className="mt-2 space-y-1">
                                        {savedViews.map((sv) => (
                                            <li key={sv.id} className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    className={cn(
                                                        'min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm transition',
                                                        CTA_FLOW_LINK_SEMIBOLD,
                                                        'hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:no-underline',
                                                    )}
                                                    onClick={() => applySavedView(sv)}
                                                >
                                                    {sv.name}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600"
                                                    aria-label={`Delete saved view ${sv.name}`}
                                                    onClick={() => deleteSavedView(sv.id)}
                                                >
                                                    <LuTrash2 size={16} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                        <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
                            <Button type="button" variant="companyOutline" size="cta" className="flex-1" onClick={resetListFilters}>
                                Reset
                            </Button>
                            <Button type="button" variant="company" size="cta" className="flex-1" onClick={() => setDrawerOpen(false)}>
                                Apply
                            </Button>
                        </div>
                    </aside>
                </>
            ) : null}


            <Modal
                isOpen={saveModalOpen}
                onClose={() => setSaveModalOpen(false)}
                title="Save filter view"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setSaveModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={saveCurrentView} disabled={!saveViewName.trim()}>
                            Save
                        </Button>
                    </>
                }
            >
                <p className="mb-3 text-sm text-slate-600">
                    Save the current search and audit filters (activity, document ID, date range) for quick access from the Filters panel.
                </p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className={cn('mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)}
                    placeholder="e.g. Delete · Last 7 days"
                />
            </Modal>
        </div>
    );
}
