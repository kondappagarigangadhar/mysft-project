'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { ComplianceBadge, ContractStatusBadge, RatingPill, VendorStatusBadge } from '@/components/vendors/VendorShared';
import { VendorRowActionsMenu } from '@/components/vendors/VendorRowActionsMenu';
import { VENDOR_CATEGORIES, VENDOR_CITIES } from '@/lib/vendors/mockData';
import type { Vendor } from '@/lib/vendors/types';
import { cloneVendorRecord, deleteVendorRecord, getAllVendorRecords, updateVendorStatus, VENDOR_STORE_UPDATED_EVENT } from '@/lib/vendors/vendorStore';
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
    LuBuilding2,
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

const STATUS_OPTIONS = ['All', 'Active', 'Inactive', 'Blacklisted', 'Pending'] as const;
const TYPE_OPTIONS = ['All', 'Contractor', 'Supplier'] as const;
const TABLE_STORAGE_KEY = 'vendors-list-table-v2';
const LEGACY_SAVED_VIEWS_KEY = 'arris-vendors-saved-views';
const ITEMS_PER_PAGE = 10;
const VENDOR_TABLE_DATA_COLUMN_IDS = [
    'id',
    'name',
    'type',
    'category',
    'contactPerson',
    'phone',
    'city',
    'primaryProject',
    'status',
    'rating',
    'compliance',
    'contractStatus',
] as const;

/**
 * Default visible columns (same idea as Leads): a compact scan view.
 * Other data columns start unchecked in the column menu; user can turn them on anytime. `actions` always on (not in picker).
 */
const VENDOR_TABLE_DEFAULT_ON = new Set<string>(['id', 'name', 'type', 'category', 'primaryProject', 'city', 'status', 'actions']);

type VendorFilterPayload = {
    search: string;
    status: string;
    type: string;
    category: string;
    city: string;
    ratingMin: string;
    risk: string;
};

type SavedVendorView = { id: string; name: string; payload: VendorFilterPayload };

function defaultFilters(): VendorFilterPayload {
    return {
        search: '',
        status: 'All',
        type: 'All',
        category: 'All',
        city: 'All',
        ratingMin: '0',
        risk: 'All',
    };
}

export function VendorListPage() {
    const [vendors, setVendors] = useState<Vendor[]>(() => getAllVendorRecords());
    const globalViewsTick = useGlobalSavedViewsSync();
    const pathname = '/company-admin/vendors/list';
    const [filters, setFilters] = useState<VendorFilterPayload>(defaultFilters());
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
        id: 120, name: 220, type: 110, category: 140, contactPerson: 150, phone: 130, city: 110, status: 120, rating: 95, compliance: 110, contractStatus: 130, actions: 210,
    });
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const allIds = [...VENDOR_TABLE_DATA_COLUMN_IDS, 'actions' as const];
        return Object.fromEntries(allIds.map((id) => [id, VENDOR_TABLE_DEFAULT_ON.has(id)])) as Record<string, boolean>;
    });
    const [banner, setBanner] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Vendors', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, []);

    useEffect(() => {
        const sync = () => setVendors(getAllVendorRecords());
        window.addEventListener(VENDOR_STORE_UPDATED_EVENT, sync);
        return () => window.removeEventListener(VENDOR_STORE_UPDATED_EVENT, sync);
    }, []);

    const savedViews = useMemo((): SavedVendorView[] => {
        return loadGlobalSavedViews()
            .filter((view) => normalizeSavedViewRoute(view.route) === normalizeSavedViewRoute(pathname))
            .map((view) => ({ id: view.id, name: view.name, payload: view.filters as VendorFilterPayload }));
    }, [globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const payload = { ...defaultFilters(), ...(f as VendorFilterPayload) };
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
        return vendors.filter((vendor) => {
            if (q && !`${vendor.id} ${vendor.name} ${vendor.contactPerson}`.toLowerCase().includes(q)) return false;
            if (filters.status !== 'All' && vendor.status !== filters.status) return false;
            if (filters.type !== 'All' && vendor.type !== filters.type) return false;
            if (filters.category !== 'All' && !vendor.categories.includes(filters.category)) return false;
            if (filters.city !== 'All' && vendor.city !== filters.city) return false;
            if (vendor.rating < Number(filters.ratingMin)) return false;
            if (filters.risk !== 'All') {
                const highRisk = vendor.compliancePercent < 70 || vendor.status === 'Blacklisted' || vendor.rating < 3.4;
                if (filters.risk === 'High' && !highRisk) return false;
                if (filters.risk === 'Low' && highRisk) return false;
            }
            return true;
        });
    }, [filters, vendors]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = useMemo(
        () => filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [filtered, currentPage],
    );

    const hasActiveFilters =
        filters.search.trim() !== '' ||
        filters.status !== 'All' ||
        filters.type !== 'All' ||
        filters.category !== 'All' ||
        filters.city !== 'All' ||
        filters.ratingMin !== '0' ||
        filters.risk !== 'All';

    const persistSavedViews = (views: SavedVendorView[]) => {
        replaceViewsForRoute(
            pathname,
            'Vendors',
            views.map((view) => ({ id: view.id, name: view.name, payload: view.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((view) => view.id !== id));
    };

    const applySavedView = (view: SavedVendorView) => {
        setFilters({ ...defaultFilters(), ...view.payload });
        setSearchDraft(view.payload.search ?? '');
        setDrawerOpen(false);
    };

    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name) return;
        persistSavedViews([...savedViews, { id: `v-${Date.now()}`, name, payload: { ...filters } }]);
        setSaveViewName('');
        setSaveModalOpen(false);
    };

    const resetFilters = () => {
        setFilters(defaultFilters());
        setSearchDraft('');
        setCurrentPage(1);
    };

    const exportRows = selected.size
        ? filtered.filter((vendor) => selected.has(vendor.id))
        : filtered;

    const downloadJson = (filename: string) => {
        const blob = new Blob([JSON.stringify(exportRows, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        setExportMenuOpen(false);
        setBanner(`Exported ${exportRows.length} vendor record(s).`);
    };

    const columns: DataTableColumn<Vendor>[] = [
        {
            id: 'id',
            header: 'Vendor ID',
            sortable: true,
            sortValue: (r) => r.id,
            minWidth: 120,
            render: (r) => (
                <Link
                    href={`/company-admin/vendors/${encodeURIComponent(String(r.id))}`}
                    className="font-mono text-xs font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {r.id}
                </Link>
            ),
        },
        {
            id: 'name',
            header: 'Vendor Name',
            sortable: true,
            sortValue: (r) => r.name,
            sticky: true,
            minWidth: 220,
            render: (r) => (
                <div className="min-w-0">
                    <Link
                        href={`/company-admin/vendors/${r.id}`}
                        className="font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline"
                    >
                        {r.name}
                    </Link>
                    {r.primaryProject?.trim() ? (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                            <LuBuilding2 className="h-3 w-3 shrink-0" aria-hidden />
                            <span className="truncate">{r.primaryProject.trim()}</span>
                        </p>
                    ) : null}
                </div>
            ),
        },
        { id: 'type', header: 'Type', sortable: true, sortValue: (r) => r.type, minWidth: 110, render: (r) => r.type },
        { id: 'category', header: 'Category', sortable: true, sortValue: (r) => r.categories.join(','), minWidth: 140, render: (r) => r.categories.join(', ') },
        { id: 'contactPerson', header: 'Contact Person', sortable: true, sortValue: (r) => r.contactPerson, minWidth: 150, render: (r) => r.contactPerson },
        { id: 'phone', header: 'Phone', sortable: true, sortValue: (r) => r.phone, minWidth: 130, render: (r) => r.phone },
        { id: 'city', header: 'City', sortable: true, sortValue: (r) => r.city, minWidth: 110, render: (r) => r.city },
        {
            id: 'primaryProject',
            header: 'Project',
            sortable: true,
            sortValue: (r) => r.primaryProject ?? '',
            minWidth: 170,
            render: (r) => <span className="text-slate-700">{r.primaryProject?.trim() || '—'}</span>,
        },
        { id: 'status', header: 'Status', sortable: true, sortValue: (r) => r.status, minWidth: 120, render: (r) => <VendorStatusBadge status={r.status} /> },
        { id: 'rating', header: 'Rating', sortable: true, sortValue: (r) => r.rating, minWidth: 95, render: (r) => <RatingPill rating={r.rating} /> },
        { id: 'compliance', header: 'Compliance', sortable: true, sortValue: (r) => r.compliancePercent, minWidth: 110, render: (r) => <ComplianceBadge value={r.compliancePercent} /> },
        { id: 'contractStatus', header: 'Contract Status', sortable: true, sortValue: (r) => r.contractStatus, minWidth: 130, render: (r) => <ContractStatusBadge status={r.contractStatus} /> },
        {
            id: 'actions', header: '', minWidth: 120, stickyEnd: true, cellClassName: 'text-right', render: (r) => (
                <VendorRowActionsMenu
                    vendor={r}
                    onUpload={(vendor) => setBanner(`Upload docs opened for ${vendor.name}.`)}
                    onClone={(vendor) => {
                        const cloned = cloneVendorRecord(vendor.id);
                        if (!cloned) {
                            setBanner(`Could not clone ${vendor.name}.`);
                            return;
                        }
                        setBanner(`${vendor.name} cloned as ${cloned.name}.`);
                    }}
                    onBlacklist={(vendor) => {
                        const nextStatus = vendor.status === 'Blacklisted' ? 'Active' : 'Blacklisted';
                        const updated = updateVendorStatus(vendor.id, nextStatus);
                        if (!updated) {
                            setBanner(`Could not update status for ${vendor.name}.`);
                            return;
                        }
                        setBanner(nextStatus === 'Blacklisted' ? `${vendor.name} moved to blacklist.` : `${vendor.name} removed from blacklist.`);
                    }}
                    onDelete={(vendor) => setDeleteTarget(vendor)}
                />
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <Breadcrumb items={[{ label: 'Vendor List', href: '/company-admin/vendors' }, { label: 'Vendor List' }]} />
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Vendor List</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">Enterprise vendor registry with operational controls and compliance visibility.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Link href="/company-admin/vendors/new">
                        <Button variant="company" size="cta" className="gap-2">
                            <LuUserPlus size={16} />
                            Create Vendor
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
                            placeholder="Search vendor id, name, contact..."
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
                                {VENDOR_TABLE_DATA_COLUMN_IDS.map((id) => (
                                    <label key={id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]">
                                        <input type="checkbox" className="rounded border-slate-300 text-[var(--cta-button-bg)]" checked={columnVisibility[id] !== false} onChange={() => setColumnVisibility((m) => ({ ...m, [id]: m[id] === false }))} />
                                        {id === 'contactPerson' ? 'Contact person' : id === 'contractStatus' ? 'Contract status' : id === 'id' ? 'Vendor ID' : id.charAt(0).toUpperCase() + id.slice(1)}
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
                                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]" onClick={() => downloadJson('vendors-export.json')}>
                                    <LuDownload size={16} className="text-slate-400" />JSON
                                </button>
                                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]" onClick={() => downloadJson('vendors-export-excel.json')}>
                                    <LuFileText size={16} className="text-slate-400" />Excel-ready JSON
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
                        <Button type="button" variant="companyOutline" size="sm" className="bg-white" onClick={() => setBanner(`Activated ${selected.size} vendor(s).`)}>Activate</Button>
                        <Button type="button" variant="companyOutline" size="sm" className="bg-white" onClick={() => setBanner(`Deactivated ${selected.size} vendor(s).`)}>Deactivate</Button>
                        <Button type="button" variant="companyOutline" size="sm" className="bg-white" onClick={() => downloadJson('vendors-selected.json')}>Export</Button>
                        <Button type="button" variant="companyGhost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
                    </div>
                </div>
            ) : null}

            <DataTable<Vendor>
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
                emptyMessage="No vendors found."
            />
            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filtered.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    label="vendors"
                />
            </div>

            {drawerOpen ? (
                <>
                    <button type="button" className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setDrawerOpen(false)} aria-label="Close filters" />
                    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-bold text-slate-900">Advanced filters</h2>
                            <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" onClick={() => setDrawerOpen(false)}><LuX size={20} /></button>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                            <div><label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</label><select className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>{TYPE_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}</select></div>
                            <div><label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</label><select className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}><option>All</option>{VENDOR_CATEGORIES.map((opt) => <option key={opt}>{opt}</option>)}</select></div>
                            <div><label className="text-xs font-semibold uppercase tracking-wide text-slate-500">City</label><select className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" value={filters.city} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}><option>All</option>{VENDOR_CITIES.map((opt) => <option key={opt}>{opt}</option>)}</select></div>
                            <div><label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label><select className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>{STATUS_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}</select></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rating Min</label><select className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" value={filters.ratingMin} onChange={(e) => setFilters((f) => ({ ...f, ratingMin: e.target.value }))}><option value="0">All</option><option value="3">3+</option><option value="4">4+</option></select></div>
                                <div><label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Compliance Risk</label><select className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" value={filters.risk} onChange={(e) => setFilters((f) => ({ ...f, risk: e.target.value }))}><option>All</option><option>High</option><option>Low</option></select></div>
                            </div>
                            {savedViews.length > 0 ? (
                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved views</p>
                                    <ul className="mt-2 space-y-1">
                                        {savedViews.map((view) => (
                                            <li key={view.id} className="flex items-center gap-1">
                                                <button type="button" className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-slate-800 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]" onClick={() => applySavedView(view)}>{view.name}</button>
                                                <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600" onClick={() => deleteSavedView(view.id)}>✕</button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                        <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
                            <Button type="button" variant="companyOutline" size="cta" className="flex-1" onClick={resetFilters}>Reset</Button>
                            <Button type="button" variant="company" size="cta" className="flex-1" onClick={() => setDrawerOpen(false)}>Apply</Button>
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
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setSaveModalOpen(false)}>Cancel</Button>
                        <Button type="button" variant="company" size="cta" onClick={saveCurrentView} disabled={!saveViewName.trim()}>Save</Button>
                    </>
                }
            >
                <p className="mb-3 text-sm text-slate-600">Save the current search and advanced filters for quick reuse.</p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input value={saveViewName} onChange={(e) => setSaveViewName(e.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]" placeholder="e.g. Hyderabad · Active · 4+ Rating" />
            </Modal>

            <Modal
                isOpen={importOpen}
                onClose={() => setImportOpen(false)}
                title="Import vendors"
                footer={<Button type="button" variant="company" size="cta" onClick={() => setImportOpen(false)}>Done</Button>}
            >
                <p className="text-sm text-slate-600">CSV import shell is ready for API wiring. Dropzone/mapper can plug in without changing list UI.</p>
            </Modal>

            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Delete vendor"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            size="cta"
                            onClick={() => {
                                if (!deleteTarget) return;
                                const ok = deleteVendorRecord(deleteTarget.id);
                                if (!ok) {
                                    setBanner(`Could not delete ${deleteTarget.name}.`);
                                    setDeleteTarget(null);
                                    return;
                                }
                                setSelected((prev) => {
                                    if (!prev.has(deleteTarget.id)) return prev;
                                    const next = new Set(prev);
                                    next.delete(deleteTarget.id);
                                    return next;
                                });
                                setBanner(`${deleteTarget.name} deleted.`);
                                setDeleteTarget(null);
                            }}
                        >
                            Delete
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    This will remove <span className="font-semibold text-slate-900">{deleteTarget?.name ?? 'this vendor'}</span> from your vendor registry.
                </p>
            </Modal>
        </div>
    );
}
