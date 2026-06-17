'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { ConfirmModal } from '@/components/booking-payment/ConfirmModal';
import { ComplianceDemoRoleSelect } from '@/components/documents-compliance/ComplianceDemoRoleSelect';
import { ComplianceNotificationsBell } from '@/components/documents-compliance/ComplianceNotificationsBell';
import { COMPLIANCE_SELECT_FILTER_CLASS, COMPLIANCE_SEARCH_INPUT_CLASS } from '@/components/documents-compliance/complianceFilterStyles';
import { cn } from '@/lib/utils';
import { CTA_BULK_BAR, CTA_CHECKBOX_SM, CTA_FLOW_LINK_SEMIBOLD, CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';
import { useComplianceRole } from '@/hooks/useComplianceRole';
import { useComplianceStoreBump } from '@/hooks/useComplianceStoreBump';
import { canDelete } from '@/lib/complianceRbac';
import {
    getComplianceStatus,
    getCurrentVersion,
    listDeletedDocuments,
    restoreDocument,
    type ComplianceDocumentRecord,
} from '@/lib/complianceDocumentsMockStore';
import { formatShortDate } from '@/lib/formatDate';
import { downloadComplianceDocumentsCsv } from '@/lib/exportComplianceDocumentsCsv';
import {
    DEFAULT_SAVED_VIEW_AUTHOR,
    importLegacyLocalSavedViewsOnce,
    loadGlobalSavedViews,
    normalizeSavedViewRoute,
    replaceViewsForRoute,
} from '@/lib/globalSavedViewsStore';
import { useConsumePendingSavedView } from '@/hooks/useConsumePendingSavedView';
import { useGlobalSavedViewsSync } from '@/hooks/useGlobalSavedViewsSync';
import {
    LuBookmark,
    LuCheck,
    LuChevronDown,
    LuColumns3,
    LuDownload,
    LuFileText,
    LuFilter,
    LuRotateCcw,
    LuSearch,
    LuTrash2,
    LuX,
} from 'react-icons/lu';

const ACTOR_NAME = 'Company Admin User';

const ITEMS_PER_PAGE = 10;
const TABLE_STORAGE_KEY = 'arris-deleted-records-datatable-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-compliance-deleted-saved-views';
const DELETED_HUB = '/company-admin/documents-compliance/deleted';

type DeletedFilterPayload = {
    searchTerm: string;
    statusFilter: 'All' | 'Active' | 'Expired';
};

type SavedDeletedView = { id: string; name: string; payload: DeletedFilterPayload };

function defaultDeletedFilters(): DeletedFilterPayload {
    return { searchTerm: '', statusFilter: 'All' };
}

function sortDeletedList(rows: ComplianceDocumentRecord[], sort: DataTableSortState): ComplianceDocumentRecord[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        const vaVer = getCurrentVersion(a);
        const vbVer = getCurrentVersion(b);
        switch (col) {
            case 'name':
                va = a.name.toLowerCase();
                vb = b.name.toLowerCase();
                break;
            case 'doc_id':
                va = a.id.toLowerCase();
                vb = b.id.toLowerCase();
                break;
            case 'deletedAt':
                va = a.deletedAt ?? '';
                vb = b.deletedAt ?? '';
                break;
            case 'version':
                va = vaVer?.version ?? 0;
                vb = vbVer?.version ?? 0;
                break;
            case 'complianceStatus':
                va = getComplianceStatus(a.expiryDate);
                vb = getComplianceStatus(b.expiryDate);
                break;
            default:
                return 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

export function DeletedRecordsPanel() {
    const pathname = usePathname() ?? DELETED_HUB;
    const globalViewsTick = useGlobalSavedViewsSync();
    const bump = useComplianceStoreBump();
    const { role } = useComplianceRole();
    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchDraft, setSearchDraft] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Expired'>('All');

    const [drawerOpen, setDrawerOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');

    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'deletedAt', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkRestoreOpen, setBulkRestoreOpen] = useState(false);

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const ids = ['doc_id', 'name', 'deletedAt', 'version', 'complianceStatus', 'actions'];
        return Object.fromEntries(ids.map((id) => [id, true])) as Record<string, boolean>;
    });

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        doc_id: 140,
        name: 220,
        deletedAt: 130,
        version: 90,
        complianceStatus: 120,
        actions: 120,
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
        importLegacyLocalSavedViewsOnce(pathname, 'Deleted docs', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedDeletedView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as DeletedFilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const p = { ...defaultDeletedFilters(), ...(f as DeletedFilterPayload) };
        setSearchTerm(p.searchTerm ?? '');
        setSearchDraft(p.searchTerm ?? '');
        setStatusFilter(p.statusFilter);
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

    const allRows = useMemo(() => listDeletedDocuments(), [bump]);

    const filteredRows = useMemo(() => {
        let list = allRows;
        const q = searchTerm.trim().toLowerCase();
        if (q) {
            list = list.filter((d) => d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
        }
        if (statusFilter !== 'All') {
            list = list.filter((d) => getComplianceStatus(d.expiryDate) === statusFilter);
        }
        return list;
    }, [allRows, searchTerm, statusFilter]);

    const sortedFilteredDocs = useMemo(() => sortDeletedList(filteredRows, sort), [filteredRows, sort]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, sort, bump]);

    const totalPages = Math.max(1, Math.ceil(sortedFilteredDocs.length / ITEMS_PER_PAGE));
    const paginatedDocs = useMemo(
        () => sortedFilteredDocs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sortedFilteredDocs, currentPage],
    );

    const hasAdvancedFilters = statusFilter !== 'All';
    const hasActiveFilters = searchTerm.trim() !== '' || hasAdvancedFilters;

    const persistSavedViews = (views: SavedDeletedView[]) => {
        replaceViewsForRoute(
            pathname,
            'Deleted docs',
            views.map((x) => ({ id: x.id, name: x.name, payload: x.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
    };

    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name) return;
        const payload: DeletedFilterPayload = { searchTerm: searchDraft, statusFilter };
        persistSavedViews([...savedViews, { id: `v-${Date.now()}`, name, payload }]);
        setSaveViewName('');
        setSaveModalOpen(false);
    };

    const applySavedView = (v: SavedDeletedView) => {
        const p = { ...defaultDeletedFilters(), ...v.payload };
        setSearchTerm(p.searchTerm ?? '');
        setSearchDraft(p.searchTerm ?? '');
        setStatusFilter(p.statusFilter);
        setDrawerOpen(false);
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((x) => x.id !== id));
    };

    const resetListFilters = () => {
        setSearchDraft('');
        setSearchTerm('');
        setStatusFilter('All');
    };

    const selectedRows = useMemo(
        () => sortedFilteredDocs.filter((d) => selectedIds.has(d.id)),
        [sortedFilteredDocs, selectedIds],
    );

    const exportRowsForScope = () => (selectedIds.size ? selectedRows : sortedFilteredDocs);

    const runExportCsv = (filename: string) => {
        downloadComplianceDocumentsCsv(exportRowsForScope(), filename);
        setExportMenuOpen(false);
    };

    const runExportExcelCsv = () => {
        downloadComplianceDocumentsCsv(exportRowsForScope(), 'deleted-documents-excel.csv');
        setExportMenuOpen(false);
    };

    const bulkExportCsv = () => {
        downloadComplianceDocumentsCsv(
            exportRowsForScope(),
            selectedIds.size ? 'deleted-documents-selected.csv' : 'deleted-documents-export.csv',
        );
    };

    const onRestore = (id: string) => {
        if (!canDelete(role)) {
            setToast({ msg: 'Only admins can restore.', err: true });
            return;
        }
        restoreDocument(id, { name: ACTOR_NAME, role });
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        setToast({ msg: 'Document restored to the active library.' });
    };

    const runBulkRestore = () => {
        if (!canDelete(role)) return;
        const ids = [...selectedIds];
        if (!ids.length) return;
        ids.forEach((id) => restoreDocument(id, { name: ACTOR_NAME, role }));
        setSelectedIds(new Set());
        setBulkRestoreOpen(false);
        setToast({ msg: `${ids.length} document(s) restored to the active library.` });
    };

    const columns: DataTableColumn<ComplianceDocumentRecord>[] = useMemo(
        () => [
            {
                id: 'doc_id',
                header: 'Document ID',
                sortable: true,
                sortValue: (row) => row.id.toLowerCase(),
                minWidth: 140,
                render: (row) => <span className="font-mono text-xs text-slate-600">{row.id}</span>,
            },
            {
                id: 'name',
                header: 'Name',
                sticky: true,
                sortable: true,
                sortValue: (row) => row.name.toLowerCase(),
                minWidth: 220,
                render: (row) => <span className="font-semibold text-slate-900">{row.name}</span>,
            },
            {
                id: 'deletedAt',
                header: 'Deleted at',
                sortable: true,
                sortValue: (row) => row.deletedAt ?? '',
                minWidth: 130,
                render: (row) => (
                    <span className="text-slate-600">
                        {row.deletedAt ? formatShortDate(row.deletedAt.slice(0, 10)) : '—'}
                    </span>
                ),
            },
            {
                id: 'version',
                header: 'Version',
                sortable: true,
                sortValue: (row) => getCurrentVersion(row)?.version ?? 0,
                minWidth: 90,
                render: (row) => {
                    const v = getCurrentVersion(row);
                    return <span className="font-mono text-xs">{v?.version ?? '—'}</span>;
                },
            },
            {
                id: 'complianceStatus',
                header: 'Status',
                sortable: true,
                sortValue: (row) => getComplianceStatus(row.expiryDate),
                minWidth: 120,
                render: (row) => {
                    const st = getComplianceStatus(row.expiryDate);
                    return (
                        <span
                            className={
                                st === 'Expired'
                                    ? 'rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800'
                                    : 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800'
                            }
                        >
                            {st}
                        </span>
                    );
                },
            },
            {
                id: 'actions',
                header: '',
                sortable: false,
                minWidth: 120,
                cellClassName: 'text-right',
                render: (row) =>
                    canDelete(role) ? (
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="sm"
                            className="gap-1"
                            onClick={() => onRestore(row.id)}
                        >
                            <LuRotateCcw className="h-3.5 w-3.5" />
                            Restore
                        </Button>
                    ) : (
                        <span className="text-xs text-slate-400">—</span>
                    ),
            },
        ],
        [role],
    );

    return (
        <div className="space-y-6">
            <Breadcrumb
                items={[
                    { label: 'Documents & Compliance', href: '/company-admin/documents-compliance' },
                    { label: 'Deleted records' },
                ]}
            />
            {toast ? (
                <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={() => setToast(null)} />
            ) : null}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Deleted records</h1>
                        <p className="mt-1 max-w-2xl text-sm text-slate-600">
                            Use the table below; filter soft-deleted items. Restore returns them to the main library.
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
                            placeholder="Search name or document ID…"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') setSearchTerm(searchDraft);
                            }}
                            className={COMPLIANCE_SEARCH_INPUT_CLASS}
                            aria-label="Search deleted documents"
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
                                    ['doc_id', 'Document ID'],
                                    ['name', 'Name'],
                                    ['deletedAt', 'Deleted at'],
                                    ['version', 'Version'],
                                    ['complianceStatus', 'Status'],
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
                                        runExportCsv(selectedIds.size ? 'deleted-documents-selected.csv' : 'deleted-documents-export.csv')
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

            {hasActiveFilters && allRows.length > 0 ? (
                <p className="text-xs font-medium text-slate-500">
                    Filtered table: {filteredRows.length} of {allRows.length} deleted document{allRows.length === 1 ? '' : 's'}
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
                        {canDelete(role) ? (
                            <Button
                                type="button"
                                variant="companyOutline"
                                size="sm"
                                className="gap-1.5 border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
                                onClick={() => setBulkRestoreOpen(true)}
                            >
                                <LuRotateCcw size={16} />
                                Restore
                            </Button>
                        ) : null}
                        <Button type="button" variant="companyGhost" size="sm" onClick={() => setSelectedIds(new Set())}>
                            Clear
                        </Button>
                    </div>
                </div>
            ) : null}

            <DataTable<ComplianceDocumentRecord>
                columns={columns}
                data={paginatedDocs}
                getRowId={(row) => row.id}
                sort={sort}
                onSortChange={setSort}
                columnVisibility={columnVisibility}
                columnWidths={columnWidths}
                onColumnWidthsChange={setColumnWidths}
                storageKey={TABLE_STORAGE_KEY}
                stickyColumnId="name"
                enableClientSort={false}
                selection={{
                    rowKey: 'id',
                    selectedIds,
                    onSelectedIdsChange: setSelectedIds,
                }}
                emptyMessage={allRows.length === 0 ? 'No deleted documents.' : 'No rows match your filters.'}
            />

            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={sortedFilteredDocs.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    label="documents"
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
                                <label htmlFor="deleted-filter-status" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Compliance status
                                </label>
                                <select
                                    id="deleted-filter-status"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                                    className={cn('mt-1.5', COMPLIANCE_SELECT_FILTER_CLASS)}
                                >
                                    <option value="All">All statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Expired">Expired</option>
                                </select>
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

            <ConfirmModal
                open={bulkRestoreOpen}
                title="Restore selected documents?"
                message={`${selectedIds.size} document(s) will return to the active library.`}
                confirmLabel="Restore"
                onCancel={() => setBulkRestoreOpen(false)}
                onConfirm={runBulkRestore}
            />

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
                    Save the current search and compliance status filter for quick access from the Filters panel.
                </p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className={cn('mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)}
                    placeholder="e.g. Expired · Review queue"
                />
            </Modal>
        </div>
    );
}
