'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { WorkOrderRowActionsMenu } from '@/components/work-orders/WorkOrderRowActionsMenu';
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
import { archiveWorkOrder, getWorkOrders, type WorkOrder } from '@/lib/workOrderStore';
import { buildVendorAssignmentsListBreadcrumbs } from '@/lib/workOrderBreadcrumbs';
import { MOCK_VENDORS } from '@/lib/vendors/mockData';
import { workOrderMatchesVendor } from '@/lib/vendors/vendorWorkOrders';
import { useConsumePendingSavedView } from '@/hooks/useConsumePendingSavedView';
import { useGlobalSavedViewsSync } from '@/hooks/useGlobalSavedViewsSync';
import {
    LuBookmark,
    LuChevronDown,
    LuColumns3,
    LuDownload,
    LuFileText,
    LuFilter,
    LuPlus,
    LuSearch,
    LuUpload,
    LuX,
} from 'react-icons/lu';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['All', 'Draft', 'Open', 'Assigned', 'In Progress', 'On Hold', 'Completed', 'Verified', 'Cancelled'] as const;
const PRIORITY_OPTIONS = ['All', 'Low', 'Medium', 'High', 'Critical'] as const;
const SLA_OPTIONS = ['All', 'On Track', 'At Risk', 'Delayed'] as const;

const TABLE_STORAGE_KEY = 'work-orders-list-table-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-work-orders-saved-views';
const ITEMS_PER_PAGE = 10;

const WORK_ORDER_TABLE_DATA_COLUMN_IDS = [
    'workOrderId',
    'title',
    'projectOrProperty',
    'vendor',
    'priority',
    'slaStatus',
    'status',
    'updatedAt',
] as const;

const WORK_ORDER_TABLE_DEFAULT_ON = new Set<string>([
    'workOrderId',
    'title',
    'projectOrProperty',
    'vendor',
    'priority',
    'slaStatus',
    'status',
    'updatedAt',
    'actions',
]);

type WorkOrdersFilterPayload = {
    search: string;
    status: string;
    priority: string;
    slaStatus: string;
};

type SavedWorkOrdersView = { id: string; name: string; payload: WorkOrdersFilterPayload };

function defaultFilters(): WorkOrdersFilterPayload {
    return { search: '', status: 'All', priority: 'All', slaStatus: 'All' };
}

function statusBadge(status: string) {
    const s = status.toLowerCase();
    const base = 'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold';
    if (s === 'completed' || s === 'verified') return cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-800');
    if (s === 'cancelled') return cn(base, 'border-rose-200 bg-rose-50 text-rose-800');
    if (s === 'on hold') return cn(base, 'border-amber-200 bg-amber-50 text-amber-900');
    if (s === 'in progress') return cn(base, 'border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] text-slate-800');
    if (s === 'assigned' || s === 'open') return cn(base, 'border-slate-200 bg-white text-slate-700');
    return cn(base, 'border-slate-200 bg-slate-50 text-slate-700');
}

function sortWorkOrders(rows: WorkOrder[], sort: DataTableSortState): WorkOrder[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'workOrderId':
                va = a.workOrderId || '';
                vb = b.workOrderId || '';
                break;
            case 'title':
                va = (a.title || '').toLowerCase();
                vb = (b.title || '').toLowerCase();
                break;
            case 'projectOrProperty':
                va = (a.projectOrProperty || '').toLowerCase();
                vb = (b.projectOrProperty || '').toLowerCase();
                break;
            case 'vendor':
                va = (a.vendor?.vendorName || '').toLowerCase();
                vb = (b.vendor?.vendorName || '').toLowerCase();
                break;
            case 'priority':
                va = a.priority || '';
                vb = b.priority || '';
                break;
            case 'slaStatus':
                va = a.scheduling?.slaStatus || '';
                vb = b.scheduling?.slaStatus || '';
                break;
            case 'status':
                va = a.lifecycle?.status || '';
                vb = b.lifecycle?.status || '';
                break;
            case 'updatedAt':
                va = a.updatedAt || '';
                vb = b.updatedAt || '';
                break;
            default:
                return 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

export function WorkOrdersListPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const vendorFilterId = searchParams.get('vendor')?.trim() ?? '';
    const vendorFilter = useMemo(
        () => (vendorFilterId ? MOCK_VENDORS.find((v) => v.id === vendorFilterId) : undefined),
        [vendorFilterId],
    );
    const globalViewsTick = useGlobalSavedViewsSync();
    const pathname = '/work-orders';

    const [refresh, setRefresh] = useState(0);
    const [filters, setFilters] = useState<WorkOrdersFilterPayload>(defaultFilters());
    const [searchDraft, setSearchDraft] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [importOpen, setImportOpen] = useState(false);
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'updatedAt', direction: 'desc' });
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [banner, setBanner] = useState<string | null>(null);

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        workOrderId: 120,
        title: 320,
        projectOrProperty: 200,
        vendor: 200,
        priority: 120,
        slaStatus: 120,
        status: 130,
        updatedAt: 170,
        actions: 120,
    });

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const allIds = [...WORK_ORDER_TABLE_DATA_COLUMN_IDS, 'actions' as const];
        return Object.fromEntries(allIds.map((id) => [id, WORK_ORDER_TABLE_DEFAULT_ON.has(id)])) as Record<string, boolean>;
    });

    const columnMenuRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Work Orders', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, []);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key && e.key.startsWith('arris-work-orders-v')) setRefresh((x) => x + 1);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const workOrders = useMemo(() => getWorkOrders(), [refresh]);

    const savedViews = useMemo((): SavedWorkOrdersView[] => {
        return loadGlobalSavedViews()
            .filter((view) => normalizeSavedViewRoute(view.route) === normalizeSavedViewRoute(pathname))
            .map((view) => ({ id: view.id, name: view.name, payload: view.filters as WorkOrdersFilterPayload }));
    }, [globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const payload = { ...defaultFilters(), ...(f as WorkOrdersFilterPayload) };
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
        return workOrders.filter((w) => {
            if (vendorFilter) {
                if (!workOrderMatchesVendor(w, vendorFilter.id, vendorFilter.name)) return false;
                const project = vendorFilter.primaryProject?.trim();
                if (project && w.projectOrProperty !== project) return false;
            }
            if (q) {
                const hay = `${w.workOrderId} ${w.title} ${w.projectOrProperty} ${w.vendor?.vendorName ?? ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (filters.status !== 'All' && (w.lifecycle?.status ?? 'Draft') !== filters.status) return false;
            if (filters.priority !== 'All' && (w.priority || '') !== filters.priority) return false;
            if (filters.slaStatus !== 'All' && (w.scheduling?.slaStatus || '') !== filters.slaStatus) return false;
            return true;
        });
    }, [filters, workOrders, vendorFilter]);

    const sorted = useMemo(() => sortWorkOrders(filtered, sort), [filtered, sort]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sort]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
    const paginated = useMemo(
        () => sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sorted, currentPage],
    );

    const hasActiveFilters =
        filters.search.trim() !== '' || filters.status !== 'All' || filters.priority !== 'All' || filters.slaStatus !== 'All';

    const persistSavedViews = (views: SavedWorkOrdersView[]) => {
        replaceViewsForRoute(
            pathname,
            'Work Orders',
            views.map((view) => ({ id: view.id, name: view.name, payload: view.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((view) => view.id !== id));
    };

    const applySavedView = (view: SavedWorkOrdersView) => {
        setFilters({ ...defaultFilters(), ...view.payload });
        setSearchDraft(view.payload.search ?? '');
        setDrawerOpen(false);
    };

    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name) return;
        persistSavedViews([...savedViews, { id: `wo-${Date.now()}`, name, payload: { ...filters } }]);
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
        setBanner(`Exported ${exportRows.length} work order record(s).`);
    };

    const onArchiveRow = (row: WorkOrder) => {
        const ok = window.confirm(`Archive work order “${row.workOrderId}”? You can restore it later.`);
        if (!ok) return;
        if (archiveWorkOrder(row.slug)) {
            setRefresh((x) => x + 1);
            setSelected((prev) => {
                const next = new Set(prev);
                next.delete(row.slug);
                return next;
            });
            setBanner(`Archived ${row.workOrderId}.`);
        } else {
            setBanner(`Could not archive ${row.workOrderId}.`);
        }
    };

    const columns: DataTableColumn<WorkOrder>[] = [
        {
            id: 'workOrderId',
            header: 'Work Order ID',
            sortable: true,
            sortValue: (r) => r.workOrderId,
            minWidth: 120,
            render: (r) => (
                <Link
                    href={`/work-orders/view/${encodeURIComponent(r.slug)}?tab=overview`}
                    className="font-mono text-xs font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {r.workOrderId}
                </Link>
            ),
        },
        {
            id: 'title',
            header: 'Work Order',
            sortable: true,
            sortValue: (r) => r.title,
            sticky: true,
            minWidth: 320,
            render: (r) => (
                <div className="min-w-0">
                    <Link
                        href={`/work-orders/view/${encodeURIComponent(r.slug)}?tab=overview`}
                        className="block truncate font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline"
                    >
                        {r.title?.trim() ? r.title : 'Untitled'}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
                        <span>{r.projectOrProperty?.trim() ? r.projectOrProperty : '—'}</span>
                        <span className="text-slate-300">•</span>
                        <span>{r.workType?.trim() ? r.workType : '—'}</span>
                    </div>
                </div>
            ),
        },
        {
            id: 'projectOrProperty',
            header: 'Project / Property',
            sortable: true,
            sortValue: (r) => r.projectOrProperty,
            minWidth: 200,
            render: (r) => <span className="text-sm font-medium text-slate-700">{r.projectOrProperty?.trim() ? r.projectOrProperty : '—'}</span>,
        },
        {
            id: 'vendor',
            header: 'Vendor',
            sortable: true,
            sortValue: (r) => r.vendor?.vendorName ?? '',
            minWidth: 200,
            render: (r) => {
                const name = r.vendor?.vendorName?.trim();
                const vid = r.vendor?.vendorId?.trim();
                if (name && vid) {
                    return (
                        <Link
                            href={`/company-admin/vendors/${encodeURIComponent(vid)}`}
                            className="text-sm font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {name}
                        </Link>
                    );
                }
                return <span className="text-sm font-medium text-slate-700">{name || '—'}</span>;
            },
        },
        {
            id: 'priority',
            header: 'Priority',
            sortable: true,
            sortValue: (r) => r.priority ?? '',
            minWidth: 120,
            render: (r) => <span className="text-sm font-medium text-slate-700">{r.priority?.trim() ? r.priority : '—'}</span>,
        },
        {
            id: 'slaStatus',
            header: 'SLA',
            sortable: true,
            sortValue: (r) => r.scheduling?.slaStatus ?? '',
            minWidth: 120,
            render: (r) => <span className="text-sm font-medium text-slate-700">{r.scheduling?.slaStatus ?? '—'}</span>,
        },
        {
            id: 'status',
            header: 'Status',
            sortable: true,
            sortValue: (r) => r.lifecycle?.status ?? 'Draft',
            minWidth: 130,
            render: (r) => <span className={statusBadge(r.lifecycle?.status ?? 'Draft')}>{r.lifecycle?.status ?? 'Draft'}</span>,
        },
        {
            id: 'updatedAt',
            header: 'Last Updated',
            sortable: true,
            sortValue: (r) => r.updatedAt ?? '',
            minWidth: 170,
            render: (r) => (
                <span className="text-sm font-medium text-slate-700 tabular-nums">
                    {r.updatedAt ? new Date(r.updatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: '',
            minWidth: 120,
            stickyEnd: true,
            cellClassName: 'text-right',
            render: (r) => (
                <WorkOrderRowActionsMenu
                    workOrder={r}
                    onArchived={onArchiveRow}
                    onDuplicated={(created) => setBanner(`Duplicated ${r.workOrderId} → ${created.workOrderId}.`)}
                />
            ),
        },
    ];

    return (
        <CompanyAdminDashboardLayout mainClassName="max-w-none">
            <div className="mx-auto w-full px-2 pb-10 sm:px-4">
                <Breadcrumb items={buildVendorAssignmentsListBreadcrumbs()} />

                <div className="mb-6 mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Assignments</h1>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                            Browse vendor assignments, open records, and manage vendor execution — aligned with the vendor registry and project assignments.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <Link href="/work-orders/drafts">
                            <Button variant="companyOutline" size="cta" className="gap-2">
                                Drafts
                            </Button>
                        </Link>
                        <Link href="/work-orders/view/new?tab=overview">
                            <Button variant="company" size="cta" className="gap-2">
                                <LuPlus size={16} />
                                Create Vendor Assignment
                            </Button>
                        </Link>
                    </div>
                </div>

                {vendorFilter ? (
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] px-4 py-3 text-sm text-slate-800">
                        <p>
                            Showing vendor assignments for{' '}
                            <span className="font-semibold">{vendorFilter.name}</span>
                            {vendorFilter.primaryProject ? (
                                <>
                                    {' '}
                                    on <span className="font-semibold">{vendorFilter.primaryProject}</span>
                                </>
                            ) : null}
                            .
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href={`/company-admin/vendors/${encodeURIComponent(vendorFilter.id)}`}
                                className="font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline"
                            >
                                Open vendor
                            </Link>
                            <Link href="/work-orders" className="font-semibold text-slate-600 hover:text-slate-900 hover:underline">
                                Clear filter
                            </Link>
                        </div>
                    </div>
                ) : null}

                <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="order-2 flex min-w-0 flex-1 items-center gap-2 sm:order-1">
                        <div className="relative min-w-[200px] max-w-xl flex-1">
                            <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="search"
                                placeholder="Search title, ID, project, vendor…"
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
                                    {WORK_ORDER_TABLE_DATA_COLUMN_IDS.map((id) => (
                                        <label
                                            key={id}
                                            className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                        >
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-[var(--cta-button-bg)]"
                                                checked={columnVisibility[id] !== false}
                                                onChange={() => setColumnVisibility((m) => ({ ...m, [id]: m[id] === false }))}
                                            />
                                            {id === 'workOrderId'
                                                ? 'Work order ID'
                                                : id === 'projectOrProperty'
                                                    ? 'Project / property'
                                                    : id === 'slaStatus'
                                                        ? 'SLA'
                                                        : id === 'updatedAt'
                                                            ? 'Last updated'
                                                            : id.charAt(0).toUpperCase() + id.slice(1)}
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
                                        onClick={() => downloadJson('work-orders-export.json')}
                                    >
                                        <LuDownload size={16} className="text-slate-400" />
                                        JSON
                                    </button>
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                        onClick={() => downloadJson('work-orders-export-excel.json')}
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
                            <Button
                                type="button"
                                variant="companyOutline"
                                size="sm"
                                className="bg-white"
                                onClick={() => downloadJson('work-orders-selected.json')}
                            >
                                Export
                            </Button>
                            <Button type="button" variant="companyGhost" size="sm" onClick={() => setSelected(new Set())}>
                                Clear
                            </Button>
                        </div>
                    </div>
                ) : null}

                <DataTable<WorkOrder>
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
                    stickyColumnId="title"
                    emptyMessage="No work orders found."
                    enableClientSort={false}
                    onRowClick={(row) => router.push(`/work-orders/view/${encodeURIComponent(row.slug)}?tab=overview`)}
                />

                <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={sorted.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        label="work orders"
                    />
                </div>

                {drawerOpen ? (
                    <>
                        <button
                            type="button"
                            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
                            onClick={() => setDrawerOpen(false)}
                            aria-label="Close filters"
                        />
                        <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <h2 className="text-lg font-bold text-slate-900">Filters</h2>
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
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                                    <select
                                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                        value={filters.status}
                                        onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                                    >
                                        {STATUS_OPTIONS.map((opt) => (
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
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">SLA status</label>
                                    <select
                                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                        value={filters.slaStatus}
                                        onChange={(e) => setFilters((f) => ({ ...f, slaStatus: e.target.value }))}
                                    >
                                        {SLA_OPTIONS.map((opt) => (
                                            <option key={opt}>{opt}</option>
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
                        placeholder="e.g. In Progress · High Priority"
                    />
                </Modal>

                <Modal
                    isOpen={importOpen}
                    onClose={() => setImportOpen(false)}
                    title="Import work orders"
                    footer={
                        <Button type="button" variant="company" size="cta" onClick={() => setImportOpen(false)}>
                            Done
                        </Button>
                    }
                >
                    <p className="text-sm text-slate-600">CSV import is ready to wire to your API. Column mapping can plug in without changing this table UI.</p>
                </Modal>
            </div>
        </CompanyAdminDashboardLayout>
    );
}

