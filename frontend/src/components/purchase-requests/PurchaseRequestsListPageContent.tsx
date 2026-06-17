'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { PurchaseRequestRowActionsMenu } from '@/components/purchase-requests/PurchaseRequestRowActionsMenu';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import {
    DEFAULT_SAVED_VIEW_AUTHOR,
    importLegacyLocalSavedViewsOnce,
    loadGlobalSavedViews,
    normalizeSavedViewRoute,
    replaceViewsForRoute,
} from '@/lib/globalSavedViewsStore';
import { getPurchaseRequests, getActiveProjectNames, type PurchaseRequest } from '@/lib/purchaseRequestStore';
import { useConsumePendingSavedView } from '@/hooks/useConsumePendingSavedView';
import { useGlobalSavedViewsSync } from '@/hooks/useGlobalSavedViewsSync';
import { LuBookmark, LuChevronDown, LuColumns3, LuDownload, LuFileText, LuFilter, LuPlus, LuSearch, LuUpload, LuX } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const APPROVAL_OPTIONS = ['All', 'Pending', 'Approved', 'Rejected'] as const;
const PRIORITY_OPTIONS = ['All', 'High', 'Medium', 'Low'] as const;

const TABLE_STORAGE_KEY = 'purchase-requests-list-table-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-purchase-requests-saved-views';
const ITEMS_PER_PAGE = 10;

const PR_TABLE_DATA_COLUMN_IDS = [
    'requestId',
    'project',
    'material',
    'quantity',
    'requiredDate',
    'priority',
    'approval',
    'requestedBy',
] as const;

const PR_TABLE_DEFAULT_ON = new Set<string>([...PR_TABLE_DATA_COLUMN_IDS, 'actions']);

type PrFilterPayload = {
    search: string;
    approval: string;
    priority: string;
    project: string;
};

type SavedPrView = { id: string; name: string; payload: PrFilterPayload };

function defaultFilters(): PrFilterPayload {
    return { search: '', approval: 'All', priority: 'All', project: 'All' };
}

function approvalBadge(status: string) {
    const s = status.toLowerCase();
    const base = 'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold';
    if (s === 'approved') return cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-800');
    if (s === 'rejected') return cn(base, 'border-rose-200 bg-rose-50 text-rose-800');
    return cn(base, 'border-amber-200 bg-amber-50 text-amber-900');
}

function priorityBadge(p: string) {
    const s = p.toLowerCase();
    const base = 'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold';
    if (s === 'high') return cn(base, 'border-rose-200 bg-rose-50 text-rose-900');
    if (s === 'low') return cn(base, 'border-slate-200 bg-slate-50 text-slate-700');
    return cn(base, 'border-amber-200 bg-amber-50 text-amber-900');
}

function sortPrRows(rows: PurchaseRequest[], sort: DataTableSortState): PurchaseRequest[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'requestId':
                va = a.prNumber;
                vb = b.prNumber;
                break;
            case 'project':
                va = a.project.toLowerCase();
                vb = b.project.toLowerCase();
                break;
            case 'material':
                va = a.material.toLowerCase();
                vb = b.material.toLowerCase();
                break;
            case 'quantity':
                va = a.quantity;
                vb = b.quantity;
                break;
            case 'requiredDate':
                va = a.requiredDate;
                vb = b.requiredDate;
                break;
            case 'priority':
                va = a.priority;
                vb = b.priority;
                break;
            case 'approval':
                va = a.approval.status;
                vb = b.approval.status;
                break;
            case 'requestedBy':
                va = a.requestedBy.toLowerCase();
                vb = b.requestedBy.toLowerCase();
                break;
            default:
                return 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

export function PurchaseRequestsListPageContent() {
    const router = useRouter();
    const globalViewsTick = useGlobalSavedViewsSync();
    const pathname = '/procurement/requests';

    const [refresh, setRefresh] = useState(0);
    const [filters, setFilters] = useState<PrFilterPayload>(defaultFilters());
    const [searchDraft, setSearchDraft] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [importOpen, setImportOpen] = useState(false);
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'requestId', direction: 'desc' });
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [banner, setBanner] = useState<string | null>(null);

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        requestId: 130,
        project: 160,
        material: 200,
        quantity: 90,
        requiredDate: 120,
        priority: 100,
        approval: 120,
        requestedBy: 130,
        actions: 120,
    });

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const allIds = [...PR_TABLE_DATA_COLUMN_IDS, 'actions' as const];
        return Object.fromEntries(allIds.map((id) => [id, PR_TABLE_DEFAULT_ON.has(id)])) as Record<string, boolean>;
    });

    const columnMenuRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const projectOptions = useMemo(() => ['All', ...getActiveProjectNames()], []);

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Purchase Requests', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, []);

    useEffect(() => {
        const onUpdated = () => setRefresh((x) => x + 1);
        window.addEventListener('arris-purchase-requests-updated', onUpdated);
        return () => window.removeEventListener('arris-purchase-requests-updated', onUpdated);
    }, []);

    const rows = useMemo(() => getPurchaseRequests(), [refresh]);

    const savedViews = useMemo((): SavedPrView[] => {
        return loadGlobalSavedViews()
            .filter((view) => normalizeSavedViewRoute(view.route) === normalizeSavedViewRoute(pathname))
            .map((view) => ({ id: view.id, name: view.name, payload: view.filters as PrFilterPayload }));
    }, [globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const payload = { ...defaultFilters(), ...(f as PrFilterPayload) };
        setFilters(payload);
        setSearchDraft(payload.search);
    });

    useEffect(() => {
        const t = window.setTimeout(() => {
            setFilters((prev) => (prev.search === searchDraft ? prev : { ...prev, search: searchDraft }));
        }, 320);
        return () => window.clearTimeout(t);
    }, [searchDraft]);

    useEffect(() => {
        if (!columnMenuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) setColumnMenuOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [columnMenuOpen]);

    useEffect(() => {
        if (!exportMenuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setExportMenuOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [exportMenuOpen]);

    const filtered = useMemo(() => {
        const q = filters.search.trim().toLowerCase();
        return rows.filter((r) => {
            if (q) {
                const hay = `${r.prNumber} ${r.project} ${r.material} ${r.requestedBy}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (filters.approval !== 'All' && r.approval.status !== filters.approval) return false;
            if (filters.priority !== 'All' && r.priority !== filters.priority) return false;
            if (filters.project !== 'All' && r.project.trim() !== filters.project) return false;
            return true;
        });
    }, [filters, rows]);

    const sorted = useMemo(() => sortPrRows(filtered, sort), [filtered, sort]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sort]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
    const paginated = useMemo(
        () => sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sorted, currentPage],
    );

    const hasActiveFilters =
        filters.search.trim() !== '' ||
        filters.approval !== 'All' ||
        filters.priority !== 'All' ||
        filters.project !== 'All';

    const persistSavedViews = (views: SavedPrView[]) => {
        replaceViewsForRoute(
            pathname,
            'Purchase Requests',
            views.map((view) => ({ id: view.id, name: view.name, payload: view.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((view) => view.id !== id));
    };

    const applySavedView = (view: SavedPrView) => {
        setFilters({ ...defaultFilters(), ...view.payload });
        setSearchDraft(view.payload.search ?? '');
        setDrawerOpen(false);
    };

    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name) return;
        persistSavedViews([...savedViews, { id: `pr-${Date.now()}`, name, payload: { ...filters } }]);
        setSaveViewName('');
        setSaveModalOpen(false);
    };

    const resetFilters = () => {
        setFilters(defaultFilters());
        setSearchDraft('');
        setCurrentPage(1);
    };

    const exportRows = selected.size ? sorted.filter((s) => selected.has(s.slug)) : sorted;

    const downloadJson = (filename: string) => {
        const blob = new Blob([JSON.stringify(exportRows, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        setExportMenuOpen(false);
        setBanner(`Exported ${exportRows.length} purchase request(s).`);
    };

    const COLUMN_LABEL: Record<string, string> = {
        requestId: 'Request ID',
        project: 'Project',
        material: 'Material',
        quantity: 'Quantity',
        requiredDate: 'Required date',
        priority: 'Priority',
        approval: 'Approval status',
        requestedBy: 'Requested by',
        actions: 'Actions',
    };

    const columns: DataTableColumn<PurchaseRequest>[] = [
        {
            id: 'requestId',
            header: 'Request ID',
            sortable: true,
            sortValue: (r) => r.prNumber,
            minWidth: 130,
            sticky: true,
            render: (r) => (
                <Link
                    href={`/procurement/requests/view/${encodeURIComponent(r.slug)}?tab=overview`}
                    className="font-mono text-xs font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline"
                >
                    {r.prNumber}
                </Link>
            ),
        },
        {
            id: 'project',
            header: 'Project',
            sortable: true,
            sortValue: (r) => r.project,
            minWidth: 160,
            render: (r) => <span className="text-sm font-medium text-slate-700">{r.project || '—'}</span>,
        },
        {
            id: 'material',
            header: 'Material',
            sortable: true,
            sortValue: (r) => r.material,
            minWidth: 200,
            render: (r) => <span className="text-sm text-slate-800">{r.material || '—'}</span>,
        },
        {
            id: 'quantity',
            header: 'Quantity',
            sortable: true,
            sortValue: (r) => r.quantity,
            minWidth: 90,
            render: (r) => <span className="tabular-nums text-sm font-medium text-slate-800">{r.quantity}</span>,
        },
        {
            id: 'requiredDate',
            header: 'Required date',
            sortable: true,
            sortValue: (r) => r.requiredDate,
            minWidth: 120,
            render: (r) => <span className="tabular-nums text-sm text-slate-700">{r.requiredDate || '—'}</span>,
        },
        {
            id: 'priority',
            header: 'Priority',
            sortable: true,
            sortValue: (r) => r.priority,
            minWidth: 100,
            render: (r) => <span className={priorityBadge(r.priority)}>{r.priority}</span>,
        },
        {
            id: 'approval',
            header: 'Approval status',
            sortable: true,
            sortValue: (r) => r.approval.status,
            minWidth: 120,
            render: (r) => <span className={approvalBadge(r.approval.status)}>{r.approval.status}</span>,
        },
        {
            id: 'requestedBy',
            header: 'Requested by',
            sortable: true,
            sortValue: (r) => r.requestedBy,
            minWidth: 130,
            render: (r) => <span className="text-sm text-slate-700">{r.requestedBy || '—'}</span>,
        },
        {
            id: 'actions',
            header: '',
            minWidth: 120,
            stickyEnd: true,
            cellClassName: 'text-right',
            render: (r) => (
                <PurchaseRequestRowActionsMenu
                    row={r}
                    onUpdated={() => {
                        setRefresh((x) => x + 1);
                        setBanner(`Updated ${r.prNumber}.`);
                    }}
                    onArchived={() => setBanner(`Archived ${r.prNumber}.`)}
                />
            ),
        },
    ];

    return (
        <CompanyAdminDashboardLayout mainClassName="max-w-none">
            <div className="mx-auto w-full px-2 pb-10 sm:px-4">
                <Breadcrumb items={[{ label: 'Procurement Management' }, { label: 'Purchase Requests' }]} />

                <div className="mb-6 mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Purchase Requests</h1>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                            Raise, track, and approve material requests — same list experience as Work Orders and vendor hubs.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <Link href="/procurement/requests/view/new?tab=overview">
                            <Button variant="company" size="cta" className="gap-2">
                                <LuPlus size={16} />
                                Create Request
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="order-2 flex min-w-0 flex-1 items-center gap-2 sm:order-1">
                        <div className="relative min-w-[200px] max-w-xl flex-1">
                            <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                placeholder="Search ID, project, material, requester…"
                                value={searchDraft}
                                onChange={(e) => setSearchDraft(e.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--cta-button-bg)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
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
                                <div className="absolute right-0 top-[calc(100%+6px)] z-300 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                    <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</p>
                                    {PR_TABLE_DATA_COLUMN_IDS.map((id) => (
                                        <label key={id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-[var(--cta-button-bg)]"
                                                checked={columnVisibility[id] !== false}
                                                onChange={() => setColumnVisibility((m) => ({ ...m, [id]: m[id] === false }))}
                                            />
                                            {COLUMN_LABEL[id] ?? id}
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
                            {hasActiveFilters ? <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">On</span> : null}
                        </Button>

                        <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setSaveModalOpen(true)}>
                            <LuBookmark size={18} />
                            Save view
                        </Button>

                        <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setImportOpen(true)}>
                            <LuUpload size={18} />
                            Import
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
                                <div className="absolute right-0 top-[calc(100%+6px)] z-300 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                        onClick={() => downloadJson('purchase-requests-export.json')}
                                    >
                                        <LuDownload size={16} className="text-slate-400" />
                                        JSON
                                    </button>
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                        onClick={() => downloadJson('purchase-requests-export-excel.json')}
                                    >
                                        <LuFileText size={16} className="text-slate-400" />
                                        Excel-ready JSON
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                {banner ? <div className="rounded-lg border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-3 py-2 text-sm font-medium text-slate-800">{banner}</div> : null}

                {selected.size > 0 ? (
                    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm font-semibold text-slate-900">{selected.size} selected</div>
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="companyOutline" size="sm" className="bg-white" onClick={() => downloadJson('purchase-requests-selected.json')}>
                                Export
                            </Button>
                            <Button type="button" variant="companyGhost" size="sm" onClick={() => setSelected(new Set())}>
                                Clear
                            </Button>
                        </div>
                    </div>
                ) : null}

                <DataTable<PurchaseRequest>
                    columns={columns}
                    data={paginated}
                    getRowId={(row) => row.slug}
                    sort={sort}
                    onSortChange={setSort}
                    columnVisibility={columnVisibility}
                    columnWidths={columnWidths}
                    onColumnWidthsChange={setColumnWidths}
                    storageKey={TABLE_STORAGE_KEY}
                    selection={{ rowKey: 'slug', selectedIds: selected, onSelectedIdsChange: setSelected }}
                    stickyColumnId="requestId"
                    emptyMessage="No purchase requests found."
                    enableClientSort={false}
                    onRowClick={(row) => router.push(`/procurement/requests/view/${encodeURIComponent(row.slug)}?tab=overview`)}
                />

                <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={sorted.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        label="purchase requests"
                    />
                </div>

                {drawerOpen ? (
                    <>
                        <button type="button" className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setDrawerOpen(false)} aria-label="Close filters" />
                        <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <h2 className="text-lg font-bold text-slate-900">Filters</h2>
                                <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" onClick={() => setDrawerOpen(false)}>
                                    <LuX size={20} />
                                </button>
                            </div>
                            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approval status</label>
                                    <select
                                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                        value={filters.approval}
                                        onChange={(e) => setFilters((f) => ({ ...f, approval: e.target.value }))}
                                    >
                                        {APPROVAL_OPTIONS.map((opt) => (
                                            <option key={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</label>
                                    <select
                                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                        value={filters.priority}
                                        onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
                                    >
                                        {PRIORITY_OPTIONS.map((opt) => (
                                            <option key={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project</label>
                                    <select
                                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                        value={filters.project}
                                        onChange={(e) => setFilters((f) => ({ ...f, project: e.target.value }))}
                                    >
                                        {projectOptions.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {savedViews.length > 0 ? (
                                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved views</p>
                                        <ul className="mt-2 space-y-1">
                                            {savedViews.map((view) => (
                                                <li key={view.id} className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-slate-800 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                                        onClick={() => applySavedView(view)}
                                                    >
                                                        {view.name}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600"
                                                        onClick={() => deleteSavedView(view.id)}
                                                    >
                                                        ✕
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}
                            </div>
                            <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
                                <Button type="button" variant="companyOutline" size="cta" className="flex-1" onClick={resetFilters}>
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
                    <p className="mb-3 text-sm text-slate-600">Save the current search and filters for quick reuse.</p>
                    <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                    <input
                        value={saveViewName}
                        onChange={(e) => setSaveViewName(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                        placeholder="e.g. Pending · High priority"
                    />
                </Modal>

                <Modal isOpen={importOpen} onClose={() => setImportOpen(false)} title="Import purchase requests" footer={<Button type="button" variant="company" size="cta" onClick={() => setImportOpen(false)}>Done</Button>}>
                    <p className="text-sm text-slate-600">CSV import can connect to your API without changing this table UI.</p>
                </Modal>
            </div>
        </CompanyAdminDashboardLayout>
    );
}
