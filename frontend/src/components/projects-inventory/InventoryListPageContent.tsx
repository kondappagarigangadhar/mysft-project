'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { InventoryRowActionsMenu } from '@/components/projects-inventory/InventoryRowActionsMenu';
import { cn } from '@/lib/utils';
import {
    CTA_BULK_BAR,
    CTA_CHECKBOX_SM,
    CTA_INPUT_FOCUS,
    CTA_SHADOW_SOFT,
} from '@/lib/theme/ctaThemeClasses';
import { downloadInventoryCsv } from '@/lib/exportProjectsInventoryCsv';
import { InventoryImportModal } from '@/components/projects-inventory/InventoryImportModal';
import { InventoryExportMenu } from '@/components/projects-inventory/InventoryExportMenu';
import { getProjectInventoryUnitHref, getProjects, getUnits, updateUnit, type InventoryUnit, type Project, type UnitAvailabilityStatus, type UnitType } from '@/lib/projectsInventoryStore';
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
    LuColumns3,
    LuDownload,
    LuExternalLink,
    LuFilter,
    LuLock,
    LuPackage,
    LuPlus,
    LuRotateCcw,
    LuSearch,
    LuUpload,
    LuX,
} from 'react-icons/lu';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const TABLE_STORAGE_KEY = 'arris-inventory-table-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-inventory-saved-views';

export type InventoryFilterPayload = {
    searchTerm: string;
    projectSlug: string;
    statusFilter: 'all' | UnitAvailabilityStatus;
    unitTypeFilter: 'all' | UnitType;
    lockFilter: 'all' | 'locked' | 'unlocked';
    pageSize: number;
    priceMin: string;
    priceMax: string;
    locationFilter: string;
};

type SavedView = { id: string; name: string; payload: InventoryFilterPayload };

const defaultFilters = (): InventoryFilterPayload => ({
    searchTerm: '',
    projectSlug: 'all',
    statusFilter: 'all',
    unitTypeFilter: 'all',
    lockFilter: 'all',
    pageSize: 10,
    priceMin: '',
    priceMax: '',
    locationFilter: 'all',
});

function sortInventoryList(rows: InventoryUnit[], sort: DataTableSortState, projectName: (slug: string) => string): InventoryUnit[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'unit_id':
                va = a.unit_id.toLowerCase();
                vb = b.unit_id.toLowerCase();
                break;
            case 'unit_number':
                va = a.unit_number.toLowerCase();
                vb = b.unit_number.toLowerCase();
                break;
            case 'project':
                va = projectName(a.projectSlug).toLowerCase();
                vb = projectName(b.projectSlug).toLowerCase();
                break;
            case 'unit_type':
                va = a.unit_type;
                vb = b.unit_type;
                break;
            case 'configuration':
                va = a.configuration.toLowerCase();
                vb = b.configuration.toLowerCase();
                break;
            case 'unit_size':
                va = a.unit_size;
                vb = b.unit_size;
                break;
            case 'price':
                va = a.price;
                vb = b.price;
                break;
            case 'availability_status':
                va = a.availability_status;
                vb = b.availability_status;
                break;
            case 'lock':
                va = a.inventory_lock_status ? 1 : 0;
                vb = b.inventory_lock_status ? 1 : 0;
                break;
            default:
                return 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

function InventoryTableSkeleton() {
    return (
        <div className="animate-pulse space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-10 rounded-lg bg-slate-100" />
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-slate-50" />
            ))}
        </div>
    );
}

export function InventoryListPageContent() {
    const pathname = usePathname() ?? '';
    const globalViewsTick = useGlobalSavedViewsSync();
    const [listVersion, setListVersion] = useState(0);
    const [tableReady, setTableReady] = useState(false);
    const [importOpen, setImportOpen] = useState(false);

    useEffect(() => {
        const t = window.setTimeout(() => setTableReady(true), 300);
        return () => window.clearTimeout(t);
    }, []);
    const projects = useMemo(() => getProjects(), [listVersion]);
    const units = useMemo(() => getUnits(), [listVersion]);

    const projectsBySlug = useMemo(() => {
        const map: Record<string, Project> = {};
        projects.forEach((p) => {
            map[p.slug] = p;
        });
        return map;
    }, [projects]);

    const projectName = (slug: string) => projectsBySlug[slug]?.project_name ?? slug;

    const [filters, setFilters] = useState<InventoryFilterPayload>(() => defaultFilters());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [searchDraft, setSearchDraft] = useState('');
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Inventory', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as InventoryFilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const p = f as Partial<InventoryFilterPayload>;
        setFilters({ ...defaultFilters(), ...p });
        setSearchDraft(String(p.searchTerm ?? ''));
    });
    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'unit_number', direction: 'asc' });

    /** Debounced sync: list filters as you type without clicking Search */
    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            searchDebounceRef.current = null;
            setFilters((f) => {
                if (f.searchTerm === searchDraft) return f;
                return { ...f, searchTerm: searchDraft };
            });
        }, 300);
        return () => {
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        };
    }, [searchDraft]);

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const ids = [
            'unit_number',
            'unit_id',
            'project',
            'unit_type',
            'configuration',
            'unit_size',
            'price',
            'availability_status',
            'lock',
            'actions',
        ];
        return Object.fromEntries(ids.map((id) => [id, true])) as Record<string, boolean>;
    });

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        unit_number: 140,
        unit_id: 100,
        project: 200,
        unit_type: 110,
        configuration: 100,
        unit_size: 88,
        price: 120,
        availability_status: 120,
        lock: 100,
        actions: 132,
    });

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!columnMenuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) setColumnMenuOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [columnMenuOpen]);

    const bump = () => {
        setListVersion((v) => v + 1);
        setSelectedIds(new Set());
    };

    const locationOptions = useMemo(() => {
        const set = new Set<string>();
        projects.forEach((p) => {
            if (p.location?.trim()) set.add(p.location.trim());
        });
        return Array.from(set).sort();
    }, [projects]);

    const filtered = useMemo(() => {
        const q = filters.searchTerm.trim().toLowerCase();
        const minP = filters.priceMin.trim() ? Number(filters.priceMin.replace(/,/g, '')) : NaN;
        const maxP = filters.priceMax.trim() ? Number(filters.priceMax.replace(/,/g, '')) : NaN;
        return units.filter((u) => {
            const matchesProject = filters.projectSlug === 'all' ? true : u.projectSlug === filters.projectSlug;
            const pn = projectName(u.projectSlug).toLowerCase();
            const loc = projectsBySlug[u.projectSlug]?.location ?? '';
            const matchesSearch =
                !q ||
                u.unit_number.toLowerCase().includes(q) ||
                u.unit_id.toLowerCase().includes(q) ||
                pn.includes(q) ||
                u.configuration.toLowerCase().includes(q) ||
                String(u.unit_size).includes(q);
            const matchesStatus = filters.statusFilter === 'all' ? true : u.availability_status === filters.statusFilter;
            const matchesUnitType = filters.unitTypeFilter === 'all' ? true : u.unit_type === filters.unitTypeFilter;
            const matchesLock =
                filters.lockFilter === 'all'
                    ? true
                    : filters.lockFilter === 'locked'
                      ? u.inventory_lock_status
                      : !u.inventory_lock_status;
            const matchesPrice =
                (!Number.isFinite(minP) || u.price >= minP) && (!Number.isFinite(maxP) || u.price <= maxP);
            const matchesLocation =
                filters.locationFilter === 'all' ? true : loc === filters.locationFilter;
            return (
                matchesProject &&
                matchesSearch &&
                matchesStatus &&
                matchesUnitType &&
                matchesLock &&
                matchesPrice &&
                matchesLocation
            );
        });
    }, [units, filters, projectsBySlug]);

    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, listVersion, sort]);

    const sortedFiltered = useMemo(
        () => sortInventoryList(filtered, sort, projectName),
        [filtered, sort, projectsBySlug],
    );

    const pageSize = filters.pageSize;
    const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / pageSize));

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const paginated = useMemo(
        () => sortedFiltered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [sortedFiltered, currentPage, pageSize],
    );

    const selectClass = cn(
        'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800',
        CTA_INPUT_FOCUS,
    );

    const hasActiveFilters =
        filters.searchTerm.trim() !== '' ||
        filters.projectSlug !== 'all' ||
        filters.statusFilter !== 'all' ||
        filters.unitTypeFilter !== 'all' ||
        filters.lockFilter !== 'all' ||
        filters.pageSize !== 10 ||
        filters.priceMin.trim() !== '' ||
        filters.priceMax.trim() !== '' ||
        filters.locationFilter !== 'all';

    const persistSavedViews = (views: SavedView[]) => {
        replaceViewsForRoute(
            pathname,
            'Inventory',
            views.map((v) => ({ id: v.id, name: v.name, payload: v.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
    };

    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name) return;
        persistSavedViews([...savedViews, { id: `v-${Date.now()}`, name, payload: { ...filters } }]);
        setSaveViewName('');
        setSaveModalOpen(false);
    };

    const applySavedView = (v: SavedView) => {
        setFilters(v.payload);
        setSearchDraft(v.payload.searchTerm);
        setDrawerOpen(false);
    };

    const resetFilters = () => {
        setFilters(defaultFilters());
        setSearchDraft('');
        setCurrentPage(1);
    };

    const flushSearchNow = () => {
        setFilters((f) => ({ ...f, searchTerm: searchDraft }));
    };

    const unitViewHref = (u: InventoryUnit) => getProjectInventoryUnitHref(u.projectSlug, u.slug);
    const unitEditHref = (u: InventoryUnit) => getProjectInventoryUnitHref(u.projectSlug, u.slug, { startInlineEdit: true });

    const columns: DataTableColumn<InventoryUnit>[] = useMemo(
        () => [
            {
                id: 'unit_number',
                header: 'Unit',
                sticky: true,
                sortable: true,
                sortValue: (row) => row.unit_number.toLowerCase(),
                minWidth: 130,
                render: (row) => (
                    <Link
                        href={unitViewHref(row)}
                        className="inline-flex max-w-fit items-center gap-1.5 rounded-md font-semibold text-slate-900 transition-colors hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)] hover:underline"
                    >
                        {row.unit_number}
                        <LuExternalLink size={14} className="shrink-0 text-slate-400" />
                    </Link>
                ),
            },
            {
                id: 'unit_id',
                header: 'Unit ID',
                sortable: true,
                sortValue: (row) => row.unit_id.toLowerCase(),
                minWidth: 90,
                render: (row) => <span className="font-mono text-xs text-slate-700">{row.unit_id}</span>,
            },
            {
                id: 'project',
                header: 'Project',
                sortable: true,
                sortValue: (row) => projectName(row.projectSlug).toLowerCase(),
                minWidth: 180,
                render: (row) => <span className="font-medium text-slate-800">{projectName(row.projectSlug)}</span>,
            },
            {
                id: 'unit_type',
                header: 'Unit type',
                sortable: true,
                sortValue: (row) => row.unit_type,
                minWidth: 100,
                render: (row) => (
                    <span className="text-slate-700">
                        {row.unit_type.charAt(0).toUpperCase()}
                        {row.unit_type.slice(1)}
                    </span>
                ),
            },
            {
                id: 'configuration',
                header: 'Configuration',
                sortable: true,
                sortValue: (row) => row.configuration.toLowerCase(),
                minWidth: 100,
                render: (row) => <span className="font-medium text-slate-800">{row.configuration}</span>,
            },
            {
                id: 'unit_size',
                header: 'Size',
                sortable: true,
                sortValue: (row) => row.unit_size,
                minWidth: 80,
                render: (row) => <span className="tabular-nums text-slate-700">{row.unit_size}</span>,
            },
            {
                id: 'price',
                header: 'Price',
                sortable: true,
                sortValue: (row) => row.price,
                minWidth: 130,
                render: (row) => (
                    <input
                        type="number"
                        min={0}
                        step={1000}
                        key={`${row.slug}-${row.price}-${listVersion}`}
                        defaultValue={row.price}
                        onBlur={(e) => {
                            const v = Number(e.target.value);
                            if (!Number.isFinite(v) || v < 0 || v === row.price) return;
                            updateUnit(row.slug, { price: v });
                            bump();
                        }}
                        className={cn(
                            'w-full min-w-[6.5rem] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold tabular-nums text-slate-900',
                            CTA_INPUT_FOCUS,
                        )}
                        title="Edit price — save on blur"
                        aria-label={`Price for unit ${row.unit_number}`}
                    />
                ),
            },
            {
                id: 'availability_status',
                header: 'Status',
                sortable: true,
                sortValue: (row) => row.availability_status,
                minWidth: 140,
                render: (row) => (
                    <select
                        value={row.availability_status}
                        onChange={(e) => {
                            const v = e.target.value as UnitAvailabilityStatus;
                            updateUnit(row.slug, { availability_status: v });
                            bump();
                        }}
                        className={cn(
                            'h-9 w-full min-w-[7rem] rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-800',
                            CTA_INPUT_FOCUS,
                        )}
                        aria-label={`Status for unit ${row.unit_number}`}
                    >
                        <option value="available">Available</option>
                        <option value="reserved">Blocked</option>
                        <option value="sold">Sold</option>
                        <option value="pending">Pending</option>
                    </select>
                ),
            },
            {
                id: 'lock',
                header: 'Lock',
                sortable: true,
                sortValue: (row) => (row.inventory_lock_status ? 1 : 0),
                minWidth: 90,
                render: (row) => (
                    <span
                        className={cn(
                            'inline-flex items-center gap-1.5 text-xs font-semibold',
                            row.inventory_lock_status ? 'text-amber-700' : 'text-slate-500',
                        )}
                    >
                        {row.inventory_lock_status ? (
                            <>
                                <LuLock size={14} />
                                Locked
                            </>
                        ) : (
                            'Open'
                        )}
                    </span>
                ),
            },
            {
                id: 'actions',
                header: '',
                sortable: false,
                cellClassName: 'text-right',
                render: (row) => (
                    <InventoryRowActionsMenu unit={row} viewHref={unitViewHref(row)} editHref={unitEditHref(row)} />
                ),
            },
        ],
        [projectsBySlug, listVersion],
    );

    const selectedRows = useMemo(() => sortedFiltered.filter((u) => selectedIds.has(u.slug)), [sortedFiltered, selectedIds]);

    const bulkExport = () => {
        const rows = selectedIds.size ? selectedRows : sortedFiltered;
        downloadInventoryCsv(rows, projectName, selectedIds.size ? 'inventory-selected.csv' : 'inventory-export.csv');
    };

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Projects & Inventory', href: '/projects-inventory/projects' },
                    { label: 'Inventory', href: '/projects-inventory/inventory' },
                ]}
            />

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">Units across projects — filter, sort, resize columns, and bulk export like the Leads workspace.</p>
                </div>
                <Link href="/projects-inventory/inventory/create">
                    <Button variant="company" size="cta" className={cn('gap-2', CTA_SHADOW_SOFT)}>
                        <LuPlus size={18} />
                        Add inventory
                    </Button>
                </Link>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="order-2 flex min-w-0 flex-1 items-center gap-2 sm:order-1">
                    <div className="relative flex-1 max-w-xl">
                        <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Search units (auto) — ID, number, project, size…"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    flushSearchNow();
                                }
                            }}
                            className={cn(
                                'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm focus:bg-white',
                                CTA_INPUT_FOCUS,
                            )}
                            aria-label="Search inventory — filters as you type"
                        />
                    </div>
                </div>

                <div className="order-1 flex flex-wrap items-center justify-end gap-2 sm:order-2">
                    <Button
                        type="button"
                        variant="companyOutline"
                        size="cta"
                        className="gap-2"
                        onClick={() => setImportOpen(true)}
                    >
                        <LuUpload size={18} />
                        Import
                    </Button>
                    <InventoryExportMenu rows={sortedFiltered} projectName={projectName} />
                
                    <div className="relative" ref={columnMenuRef}>
                        <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setColumnMenuOpen((o) => !o)}>
                            <LuColumns3 size={18} />
                            Columns
                        </Button>
                        {columnMenuOpen ? (
                            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</p>
                                {[
                                    'unit_number',
                                    'unit_id',
                                    'project',
                                    'unit_type',
                                    'configuration',
                                    'unit_size',
                                    'price',
                                    'availability_status',
                                    'lock',
                                ].map((id) => {
                                    const label =
                                        id === 'unit_id'
                                            ? 'Unit ID'
                                            : id === 'unit_number'
                                              ? 'Unit'
                                              : id === 'unit_type'
                                                ? 'Unit type'
                                                : id === 'configuration'
                                                  ? 'Configuration'
                                                  : id === 'unit_size'
                                                    ? 'Size'
                                                    : id === 'availability_status'
                                                      ? 'Status'
                                                      : id.charAt(0).toUpperCase() + id.slice(1);
                                    return (
                                        <label key={id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50">
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
                                    );
                                })}
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
                </div>
            </div>

            <InventoryImportModal
                isOpen={importOpen}
                onClose={() => setImportOpen(false)}
                onImported={() => {
                    bump();
                    setImportOpen(false);
                }}
            />

            {selectedIds.size > 0 ? (
                <div className={cn('mb-4 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between', CTA_BULK_BAR)}>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <LuCheck size={18} />
                        {selectedIds.size} selected
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={bulkExport}>
                            <LuDownload size={16} />
                            Export
                        </Button>
                        <Button type="button" variant="companyGhost" size="sm" onClick={() => setSelectedIds(new Set())}>
                            Clear
                        </Button>
                    </div>
                </div>
            ) : null}

            {!tableReady ? (
                <InventoryTableSkeleton />
            ) : sortedFiltered.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm transition-shadow hover:shadow-md">
                    {units.length === 0 ? (
                        <>
                            <LuPackage className="mx-auto h-14 w-14 text-slate-300" aria-hidden />
                            <p className="mt-4 text-lg font-semibold text-slate-900">No inventory units yet</p>
                            <p className="mt-2 text-sm text-slate-600">Create a unit manually or import a CSV file.</p>
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                <Link href="/projects-inventory/inventory/create">
                                    <Button variant="company" size="cta" className="gap-2">
                                        <LuPlus size={18} />
                                        Add unit
                                    </Button>
                                </Link>
                                <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setImportOpen(true)}>
                                    <LuUpload size={18} />
                                    Import CSV
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="font-semibold text-slate-900">No units match your filters</p>
                            <p className="mt-2 text-sm text-slate-600">Try adjusting search or advanced filters.</p>
                            <Button type="button" variant="companyOutline" size="cta" className="mt-6 gap-2" onClick={resetFilters}>
                                <LuRotateCcw size={18} />
                                Clear filters
                            </Button>
                        </>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    <DataTable<InventoryUnit>
                        columns={columns}
                        data={paginated}
                        getRowId={(row) => row.slug}
                        sort={sort}
                        onSortChange={setSort}
                        columnVisibility={columnVisibility}
                        columnWidths={columnWidths}
                        onColumnWidthsChange={setColumnWidths}
                        storageKey={TABLE_STORAGE_KEY}
                        stickyColumnId="unit_number"
                        enableClientSort={false}
                        stickyHeader
                        selection={{ rowKey: 'slug', selectedIds, onSelectedIdsChange: setSelectedIds }}
                    />
                </div>
            )}

            {tableReady && sortedFiltered.length > 0 ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={sortedFiltered.length}
                        itemsPerPage={pageSize}
                        label="units"
                    />
                </div>
            ) : null}

            {drawerOpen ? (
                <>
                    <button type="button" className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]" aria-label="Close" onClick={() => setDrawerOpen(false)} />
                    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl" role="dialog" aria-label="Filters">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-bold text-slate-900">Advanced filters</h2>
                            <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setDrawerOpen(false)}>
                                <LuX size={20} />
                            </button>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500">Project</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.projectSlug}
                                    onChange={(e) => setFilters((f) => ({ ...f, projectSlug: e.target.value }))}
                                >
                                    <option value="all">All projects</option>
                                    {projects.map((p) => (
                                        <option key={p.slug} value={p.slug}>
                                            {p.project_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500">Availability</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.statusFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, statusFilter: e.target.value as InventoryFilterPayload['statusFilter'] }))}
                                >
                                    <option value="all">All statuses</option>
                                    <option value="available">Available</option>
                                    <option value="reserved">Blocked</option>
                                    <option value="sold">Sold</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500">Location</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.locationFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, locationFilter: e.target.value }))}
                                >
                                    <option value="all">All locations</option>
                                    {locationOptions.map((loc) => (
                                        <option key={loc} value={loc}>
                                            {loc}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold uppercase text-slate-500">Price min (₹)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        className={`mt-1.5 ${selectClass}`}
                                        placeholder="Min"
                                        value={filters.priceMin}
                                        onChange={(e) => setFilters((f) => ({ ...f, priceMin: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase text-slate-500">Price max (₹)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        className={`mt-1.5 ${selectClass}`}
                                        placeholder="Max"
                                        value={filters.priceMax}
                                        onChange={(e) => setFilters((f) => ({ ...f, priceMax: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500">Unit type</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.unitTypeFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, unitTypeFilter: e.target.value as 'all' | UnitType }))}
                                >
                                    <option value="all">All types</option>
                                    <option value="Apartment">Apartment</option>
                                    <option value="Villa">Villa</option>
                                    <option value="Plot">Plot</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500">Booking lock</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.lockFilter}
                                    onChange={(e) =>
                                        setFilters((f) => ({ ...f, lockFilter: e.target.value as InventoryFilterPayload['lockFilter'] }))
                                    }
                                >
                                    <option value="all">All</option>
                                    <option value="locked">Locked</option>
                                    <option value="unlocked">Unlocked</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500">Page size</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={String(filters.pageSize)}
                                    onChange={(e) => setFilters((f) => ({ ...f, pageSize: Number(e.target.value) }))}
                                >
                                    {PAGE_SIZE_OPTIONS.map((n) => (
                                        <option key={n} value={String(n)}>
                                            {n} / page
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {savedViews.length > 0 ? (
                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                    <p className="text-xs font-semibold uppercase text-slate-500">Saved views</p>
                                    <ul className="mt-2 space-y-1">
                                        {savedViews.map((v) => (
                                            <li key={v.id}>
                                                <button
                                                    type="button"
                                                    className="w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium text-[var(--cta-button-bg)] hover:bg-white"
                                                    onClick={() => applySavedView(v)}
                                                >
                                                    {v.name}
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
                <p className="mb-3 text-sm text-slate-600">
                    Save filters and page size for quick recall from the drawer or Saved views in the top bar.
                </p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className={cn('mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)}
                    placeholder="e.g. Available · Tower A"
                />
            </Modal>
        </CompanyAdminDashboardLayout>
    );
}
