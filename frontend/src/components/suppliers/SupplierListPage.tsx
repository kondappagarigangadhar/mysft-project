'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { SupplierRowActionsMenu } from '@/components/suppliers/SupplierRowActionsMenu';
import { SupplierRatingBadge, SupplierStatusBadge } from '@/components/suppliers/SupplierShared';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { SUPPLIER_CATEGORIES } from '@/lib/suppliers/mockData';
import type { SupplierRecord } from '@/lib/suppliers/types';
import {
    deleteSupplierRecord,
    getAllSupplierRecords,
    SUPPLIER_STORE_UPDATED_EVENT,
} from '@/lib/suppliers/supplierStore';
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
    LuChevronDown,
    LuColumns3,
    LuDownload,
    LuFileText,
    LuFilter,
    LuSearch,
    LuUpload,
    LuUserPlus,
    LuX,
} from 'react-icons/lu';

const STATUS_OPTIONS = ['All', 'Active', 'Inactive', 'Pending', 'Suspended'] as const;
const TYPE_OPTIONS = ['All', 'Manufacturer', 'Distributor', 'Trader', 'Service'] as const;
const TABLE_STORAGE_KEY = 'suppliers-list-table-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-suppliers-saved-views';
const ITEMS_PER_PAGE = 10;

const SUPPLIER_TABLE_DATA_COLUMN_IDS = [
    'id',
    'name',
    'type',
    'category',
    'contactPerson',
    'phone',
    'city',
    'status',
    'rating',
] as const;

const SUPPLIER_TABLE_DEFAULT_ON = new Set<string>([
    'id',
    'name',
    'type',
    'category',
    'contactPerson',
    'phone',
    'city',
    'status',
    'rating',
    'actions',
]);

type SupplierFilterPayload = {
    search: string;
    status: string;
    type: string;
    category: string;
};

type SavedSupplierView = { id: string; name: string; payload: SupplierFilterPayload };

function defaultFilters(): SupplierFilterPayload {
    return { search: '', status: 'All', type: 'All', category: 'All' };
}

function sortSuppliers(rows: SupplierRecord[], sort: DataTableSortState): SupplierRecord[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'id':
                va = a.id.toLowerCase();
                vb = b.id.toLowerCase();
                break;
            case 'name':
                va = a.name.toLowerCase();
                vb = b.name.toLowerCase();
                break;
            case 'type':
                va = a.type;
                vb = b.type;
                break;
            case 'category':
                va = a.categories.join(',');
                vb = b.categories.join(',');
                break;
            case 'contactPerson':
                va = a.contactPerson.toLowerCase();
                vb = b.contactPerson.toLowerCase();
                break;
            case 'phone':
                va = a.phone;
                vb = b.phone;
                break;
            case 'city':
                va = a.city.toLowerCase();
                vb = b.city.toLowerCase();
                break;
            case 'status':
                va = a.status;
                vb = b.status;
                break;
            case 'rating':
                va = a.rating;
                vb = b.rating;
                break;
            default:
                return 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

export function SupplierListPage() {
    const [suppliers, setSuppliers] = useState<SupplierRecord[]>(() => getAllSupplierRecords());
    const globalViewsTick = useGlobalSavedViewsSync();
    const pathname = '/company-admin/suppliers/list';
    const [filters, setFilters] = useState<SupplierFilterPayload>(defaultFilters());
    const [searchDraft, setSearchDraft] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [importOpen, setImportOpen] = useState(false);
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'name', direction: 'asc' });
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        id: 120,
        name: 220,
        type: 120,
        category: 160,
        contactPerson: 150,
        phone: 130,
        city: 110,
        status: 120,
        rating: 88,
        actions: 120,
    });
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const allIds = [...SUPPLIER_TABLE_DATA_COLUMN_IDS, 'actions' as const];
        return Object.fromEntries(allIds.map((id) => [id, SUPPLIER_TABLE_DEFAULT_ON.has(id)])) as Record<string, boolean>;
    });
    const [banner, setBanner] = useState<string | null>(null);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Suppliers', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, []);

    useEffect(() => {
        const sync = () => setSuppliers(getAllSupplierRecords());
        window.addEventListener(SUPPLIER_STORE_UPDATED_EVENT, sync);
        return () => window.removeEventListener(SUPPLIER_STORE_UPDATED_EVENT, sync);
    }, []);

    const savedViews = useMemo((): SavedSupplierView[] => {
        return loadGlobalSavedViews()
            .filter((view) => normalizeSavedViewRoute(view.route) === normalizeSavedViewRoute(pathname))
            .map((view) => ({ id: view.id, name: view.name, payload: view.filters as SupplierFilterPayload }));
    }, [globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const payload = { ...defaultFilters(), ...(f as SupplierFilterPayload) };
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
        return suppliers.filter((s) => {
            if (q && !`${s.id} ${s.name} ${s.contactPerson} ${s.phone}`.toLowerCase().includes(q)) return false;
            if (filters.status !== 'All' && s.status !== filters.status) return false;
            if (filters.type !== 'All' && s.type !== filters.type) return false;
            if (filters.category !== 'All' && !s.categories.includes(filters.category)) return false;
            return true;
        });
    }, [filters, suppliers]);

    const sorted = useMemo(() => sortSuppliers(filtered, sort), [filtered, sort]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sort]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
    const paginated = useMemo(
        () => sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sorted, currentPage],
    );

    const hasActiveFilters =
        filters.search.trim() !== '' || filters.status !== 'All' || filters.type !== 'All' || filters.category !== 'All';

    const persistSavedViews = (views: SavedSupplierView[]) => {
        replaceViewsForRoute(
            pathname,
            'Suppliers',
            views.map((view) => ({ id: view.id, name: view.name, payload: view.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((view) => view.id !== id));
    };

    const applySavedView = (view: SavedSupplierView) => {
        setFilters({ ...defaultFilters(), ...view.payload });
        setSearchDraft(view.payload.search ?? '');
        setDrawerOpen(false);
    };

    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name) return;
        persistSavedViews([...savedViews, { id: `s-${Date.now()}`, name, payload: { ...filters } }]);
        setSaveViewName('');
        setSaveModalOpen(false);
    };

    const resetFilters = () => {
        setFilters(defaultFilters());
        setSearchDraft('');
        setCurrentPage(1);
    };

    const exportRows = selected.size ? sorted.filter((s) => selected.has(s.id)) : sorted;

    const downloadJson = (filename: string) => {
        const blob = new Blob([JSON.stringify(exportRows, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        setExportMenuOpen(false);
        setBanner(`Exported ${exportRows.length} supplier record(s).`);
    };

    const onDeleteRow = (row: SupplierRecord) => {
        const ok = window.confirm(`Delete supplier “${row.name}”? This cannot be undone.`);
        if (!ok) return;
        if (deleteSupplierRecord(row.id)) {
            setBanner(`Deleted ${row.name}.`);
        } else {
            setBanner(`Could not delete ${row.name}.`);
        }
    };

    const columns: DataTableColumn<SupplierRecord>[] = [
        {
            id: 'id',
            header: 'Supplier ID',
            sortable: true,
            sortValue: (r) => r.id,
            minWidth: 120,
            render: (r) => (
                <Link
                    href={`/company-admin/suppliers/${encodeURIComponent(r.id)}`}
                    className="font-mono text-xs font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {r.id}
                </Link>
            ),
        },
        {
            id: 'name',
            header: 'Supplier Name',
            sortable: true,
            sortValue: (r) => r.name,
            sticky: true,
            minWidth: 220,
            render: (r) => (
                <Link href={`/company-admin/suppliers/${encodeURIComponent(r.id)}`} className="font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline">
                    {r.name}
                </Link>
            ),
        },
        { id: 'type', header: 'Type', sortable: true, sortValue: (r) => r.type, minWidth: 120, render: (r) => r.type },
        {
            id: 'category',
            header: 'Category',
            sortable: true,
            sortValue: (r) => r.categories.join(','),
            minWidth: 160,
            render: (r) => r.categories.join(', '),
        },
        {
            id: 'contactPerson',
            header: 'Contact Person',
            sortable: true,
            sortValue: (r) => r.contactPerson,
            minWidth: 150,
            render: (r) => r.contactPerson,
        },
        { id: 'phone', header: 'Phone', sortable: true, sortValue: (r) => r.phone, minWidth: 130, render: (r) => r.phone },
        { id: 'city', header: 'City', sortable: true, sortValue: (r) => r.city, minWidth: 110, render: (r) => r.city },
        {
            id: 'status',
            header: 'Status',
            sortable: true,
            sortValue: (r) => r.status,
            minWidth: 120,
            render: (r) => <SupplierStatusBadge status={r.status} />,
        },
        {
            id: 'rating',
            header: 'Rating',
            sortable: true,
            sortValue: (r) => r.rating,
            minWidth: 88,
            render: (r) => <SupplierRatingBadge rating={r.rating} />,
        },
        {
            id: 'actions',
            header: '',
            minWidth: 120,
            stickyEnd: true,
            cellClassName: 'text-right',
            render: (r) => <SupplierRowActionsMenu supplier={r} onDelete={onDeleteRow} />,
        },
    ];

    return (
        <div className="space-y-6">
            <Breadcrumb items={[{ label: 'Supplier List', href: '/company-admin/suppliers' }, { label: 'Supplier List' }]} />
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Supplier List</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Browse suppliers, open profiles, and launch onboarding — same operational pattern as vendors and leads.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Link href="/company-admin/suppliers/new">
                        <Button variant="company" size="cta" className="gap-2">
                            <LuUserPlus size={16} />
                            Create Supplier
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
                            placeholder="Search name, ID, contact, phone…"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[var(--cta-button-bg)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                        />
                    </div>
                </div>
                <div className="order-1 flex flex-wrap items-center justify-end gap-2 sm:order-2">
                    <div className="relative" ref={columnMenuRef}>
                        <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setColumnMenuOpen((o) => !o)} aria-expanded={columnMenuOpen}>
                            <LuColumns3 size={18} />
                            Columns
                        </Button>
                        {columnMenuOpen ? (
                            <div className="absolute right-0 top-[calc(100%+6px)] z-300 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</p>
                                {SUPPLIER_TABLE_DATA_COLUMN_IDS.map((id) => (
                                    <label key={id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-[var(--cta-button-bg)]"
                                            checked={columnVisibility[id] !== false}
                                            onChange={() => setColumnVisibility((m) => ({ ...m, [id]: m[id] === false }))}
                                        />
                                        {id === 'contactPerson' ? 'Contact person' : id === 'category' ? 'Category' : id.charAt(0).toUpperCase() + id.slice(1)}
                                    </label>
                                ))}
                            </div>
                        ) : null}
                    </div>
                    <Button type="button" variant={drawerOpen ? 'company' : 'companyOutline'} size="cta" className="gap-2" onClick={() => setDrawerOpen(true)}>
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
                        <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setExportMenuOpen((o) => !o)} aria-expanded={exportMenuOpen}>
                            <LuDownload size={18} />
                            Export
                            <LuChevronDown size={16} className="opacity-70" />
                        </Button>
                        {exportMenuOpen ? (
                            <div className="absolute right-0 top-[calc(100%+6px)] z-300 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                    onClick={() => downloadJson('suppliers-export.json')}
                                >
                                    <LuDownload size={16} className="text-slate-400" />
                                    JSON
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]"
                                    onClick={() => downloadJson('suppliers-export-excel.json')}
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
                        <Button type="button" variant="companyOutline" size="sm" className="bg-white" onClick={() => downloadJson('suppliers-selected.json')}>
                            Export
                        </Button>
                        <Button type="button" variant="companyGhost" size="sm" onClick={() => setSelected(new Set())}>
                            Clear
                        </Button>
                    </div>
                </div>
            ) : null}

            <DataTable<SupplierRecord>
                columns={columns}
                data={paginated}
                getRowId={(row) => row.id}
                sort={sort}
                onSortChange={setSort}
                columnVisibility={columnVisibility}
                columnWidths={columnWidths}
                onColumnWidthsChange={setColumnWidths}
                storageKey={TABLE_STORAGE_KEY}
                selection={{ rowKey: 'id', selectedIds: selected, onSelectedIdsChange: setSelected }}
                stickyColumnId="name"
                emptyMessage="No suppliers found."
            />
            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={sorted.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    label="suppliers"
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
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</label>
                                <select
                                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                    value={filters.type}
                                    onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
                                >
                                    {TYPE_OPTIONS.map((opt) => (
                                        <option key={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label>
                                <select
                                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                    value={filters.category}
                                    onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                                >
                                    <option>All</option>
                                    {SUPPLIER_CATEGORIES.map((opt) => (
                                        <option key={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
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
                                                <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600" onClick={() => deleteSavedView(view.id)}>
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
                    placeholder="e.g. Active · Distributors"
                />
            </Modal>

            <Modal
                isOpen={importOpen}
                onClose={() => setImportOpen(false)}
                title="Import suppliers"
                footer={
                    <Button type="button" variant="company" size="cta" onClick={() => setImportOpen(false)}>
                        Done
                    </Button>
                }
            >
                <p className="text-sm text-slate-600">CSV import is ready to wire to your API. Column mapping can plug in without changing this table UI.</p>
            </Modal>
        </div>
    );
}
