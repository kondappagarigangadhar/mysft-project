'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { cn } from '@/lib/utils';
import {
    CTA_BULK_BAR,
    CTA_CHECKBOX_SM,
    CTA_INPUT_FOCUS,
    CTA_SHADOW_SOFT,
} from '@/lib/theme/ctaThemeClasses';
import {
    LuBookmark,
    LuCheck,
    LuChevronDown,
    LuColumns3,
    LuDownload,
    LuFileText,
    LuFilter,
    LuLayoutGrid,
    LuPlus,
    LuSearch,
    LuTable2,
    LuTrash2,
    LuUpload,
    LuX,
} from 'react-icons/lu';
import type { Company } from '@/data/mockData';
import {
    getCompanies,
    toggleCompanyStatus as storeToggleStatus,
    updateCompany,
    removeCompany,
} from '@/lib/companyStore';
import { tenantCreateHref, tenantViewHref } from '@/lib/tenantRoutes';
import { downloadTenantsCsv, openTenantsPrintReport } from '@/lib/exportTenantsCsv';
import { TenantRowActionsMenu } from '@/components/tenants/TenantRowActionsMenu';
import { TenantsKanbanBoard } from '@/components/tenants/TenantsKanbanBoard';
import { ImportTenantsModal } from '@/components/tenants/ImportTenantsModal';
import {
    DEFAULT_SAVED_VIEW_AUTHOR,
    importLegacyLocalSavedViewsOnce,
    loadGlobalSavedViews,
    normalizeSavedViewRoute,
    replaceViewsForRoute,
} from '@/lib/globalSavedViewsStore';
import { useConsumePendingSavedView } from '@/hooks/useConsumePendingSavedView';
import { useGlobalSavedViewsSync } from '@/hooks/useGlobalSavedViewsSync';
import StatusBadge from '@/components/ui/StatusBadge';

const ITEMS_PER_PAGE = 10;
const TABLE_STORAGE_KEY = 'arris-tenants-table-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-tenants-saved-views';

const TENANT_TABLE_DATA_COLUMN_IDS = ['company', 'plan', 'users', 'location', 'type', 'status', 'createdDate'] as const;
const TENANT_TABLE_DEFAULT_ON = new Set<string>([...TENANT_TABLE_DATA_COLUMN_IDS, 'actions']);

export type TenantsFilterPayload = {
    searchTerm: string;
    statusFilter: 'All' | Company['status'];
    planFilter: 'All' | Company['plan'];
    businessTypeFilter: 'All' | Company['businessType'];
    dateFrom: string;
    dateTo: string;
};

type SavedView = { id: string; name: string; payload: TenantsFilterPayload };

function defaultFilters(): TenantsFilterPayload {
    return {
        searchTerm: '',
        statusFilter: 'All',
        planFilter: 'All',
        businessTypeFilter: 'All',
        dateFrom: '',
        dateTo: '',
    };
}

function sortTenantsList(rows: Company[], sort: DataTableSortState): Company[] {
    const col = sort.columnId;
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    const val = (c: Company): string | number => {
        switch (col) {
            case 'company':
                return c.name.toLowerCase();
            case 'plan':
                return c.plan;
            case 'users':
                return c.usersCount;
            case 'location':
                return `${c.city} ${c.state}`.toLowerCase();
            case 'type':
                return c.businessType;
            case 'status':
                return c.status;
            case 'createdDate':
                return c.createdAt;
            default:
                return c.name.toLowerCase();
        }
    };
    copy.sort((a, b) => {
        const va = val(a);
        const vb = val(b);
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

function planBadgeClass(plan: Company['plan']) {
    if (plan === 'Enterprise') return 'bg-purple-100 text-purple-800';
    if (plan === 'Pro') return 'bg-blue-100 text-blue-800';
    return 'bg-slate-100 text-slate-700';
}

function typeBadgeClass(t: Company['businessType']) {
    if (t === 'Builder') return 'bg-orange-100 text-orange-800';
    if (t === 'Developer') return 'bg-cyan-100 text-cyan-800';
    return 'bg-violet-100 text-violet-800';
}

export function TenantsListPageContent() {
    const pathname = usePathname() ?? '';
    const router = useRouter();
    const searchParams = useSearchParams();
    const globalViewsTick = useGlobalSavedViewsSync();
    const [listVersion, setListVersion] = useState(0);
    const allTenants = useMemo(() => {
        void listVersion;
        return getCompanies();
    }, [listVersion]);

    const [filters, setFilters] = useState<TenantsFilterPayload>(() => defaultFilters());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [searchDraft, setSearchDraft] = useState('');

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Tenants', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedView[] => {
        void globalViewsTick;
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as TenantsFilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const p = f as Partial<TenantsFilterPayload>;
        setFilters({ ...defaultFilters(), ...p });
        setSearchDraft(String(p.searchTerm ?? ''));
    });

    useEffect(() => {
        const t = window.setTimeout(() => {
            setFilters((f) => (f.searchTerm === searchDraft ? f : { ...f, searchTerm: searchDraft }));
        }, 320);
        return () => window.clearTimeout(t);
    }, [searchDraft]);

    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'createdDate', direction: 'desc' });
    const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
    const [importOpen, setImportOpen] = useState(false);
    useEffect(() => {
        if (searchParams.get('import') !== '1') return;
        setImportOpen(true);
        const next = new URLSearchParams(searchParams.toString());
        next.delete('import');
        const q = next.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }, [searchParams, router, pathname]);

    const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const allIds = [...TENANT_TABLE_DATA_COLUMN_IDS, 'actions' as const];
        return Object.fromEntries(allIds.map((id) => [id, TENANT_TABLE_DEFAULT_ON.has(id)])) as Record<string, boolean>;
    });
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        company: 280,
        plan: 120,
        users: 120,
        location: 160,
        type: 120,
        status: 140,
        createdDate: 120,
        actions: 128,
    });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [previewId, setPreviewId] = useState<number | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, listVersion, sort]);

    useEffect(() => {
        if (!exportMenuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setExportMenuOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [exportMenuOpen]);

    useEffect(() => {
        if (!columnMenuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) setColumnMenuOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [columnMenuOpen]);

    const bump = useCallback(() => {
        setListVersion((v) => v + 1);
        setSelectedIds(new Set());
    }, []);

    const handleArchive = useCallback(
        (c: Company) => {
            updateCompany(c.id, { status: 'Suspended' });
            bump();
        },
        [bump],
    );

    const toggleStatus = useCallback(
        (id: number) => {
            storeToggleStatus(id);
            bump();
        },
        [bump],
    );

    const filtered = useMemo(() => {
        const st = filters.searchTerm.trim().toLowerCase();
        return allTenants.filter((c) => {
            const matchSearch =
                !st ||
                c.name.toLowerCase().includes(st) ||
                c.tenantCode.toLowerCase().includes(st) ||
                c.owner.toLowerCase().includes(st) ||
                c.city.toLowerCase().includes(st) ||
                c.state.toLowerCase().includes(st) ||
                c.email.toLowerCase().includes(st);
            const matchStatus = filters.statusFilter === 'All' || c.status === filters.statusFilter;
            const matchPlan = filters.planFilter === 'All' || c.plan === filters.planFilter;
            const matchType = filters.businessTypeFilter === 'All' || c.businessType === filters.businessTypeFilter;
            const ymd = c.createdAt.slice(0, 10);
            const matchFrom = !filters.dateFrom || ymd >= filters.dateFrom;
            const matchTo = !filters.dateTo || ymd <= filters.dateTo;
            return matchSearch && matchStatus && matchPlan && matchType && matchFrom && matchTo;
        });
    }, [allTenants, filters]);

    const sorted = useMemo(() => sortTenantsList(filtered, sort), [filtered, sort]);
    const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
    const pageRows = useMemo(
        () => sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sorted, currentPage],
    );

    const selectClass = cn('h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800', CTA_INPUT_FOCUS);

    const hasActiveFilters =
        filters.searchTerm.trim() !== '' ||
        filters.statusFilter !== 'All' ||
        filters.planFilter !== 'All' ||
        filters.businessTypeFilter !== 'All' ||
        filters.dateFrom !== '' ||
        filters.dateTo !== '';

    const persistSavedViews = (views: SavedView[]) => {
        replaceViewsForRoute(
            pathname,
            'Tenants',
            views.map((v) => ({ id: v.id, name: v.name, payload: v.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((v) => v.id !== id));
    };

    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name) return;
        const id = `v-${Date.now()}`;
        persistSavedViews([...savedViews, { id, name, payload: { ...filters } }]);
        setSaveViewName('');
        setSaveModalOpen(false);
    };

    const applySavedView = (v: SavedView) => {
        setFilters({ ...defaultFilters(), ...v.payload });
        setSearchDraft(v.payload.searchTerm ?? '');
        setDrawerOpen(false);
    };

    const resetFilters = () => {
        setFilters(defaultFilters());
        setSearchDraft('');
        setCurrentPage(1);
    };

    const selectedRows = useMemo(() => sorted.filter((c) => selectedIds.has(String(c.id))), [sorted, selectedIds]);

    const exportScope = () => (selectedIds.size ? selectedRows : sorted);

    const confirmDelete = () => {
        if (!deleteTarget) return;
        removeCompany(deleteTarget.id);
        setDeleteTarget(null);
        bump();
    };

    const columns: DataTableColumn<Company>[] = useMemo(
        () => [
            {
                id: 'company',
                header: 'Organization Name',
                sticky: true,
                sortable: true,
                sortValue: (row) => row.name.toLowerCase(),
                minWidth: 240,
                render: (row) => (
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 text-sm font-bold text-slate-700 ring-1 ring-slate-200/80">
                            {row.name.charAt(0).toUpperCase()}
                        </div>
                        <Link
                            href={tenantViewHref(row.id)}
                            className="min-w-0 truncate font-semibold text-slate-900 hover:text-[var(--cta-button-bg)] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {row.name}
                        </Link>
                    </div>
                ),
            },
            {
                id: 'plan',
                header: 'Plan',
                sortable: true,
                sortValue: (row) => row.plan,
                minWidth: 100,
                render: (row) => (
                    <span className={cn('rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide', planBadgeClass(row.plan))}>
                        {row.plan}
                    </span>
                ),
            },
            {
                id: 'users',
                header: 'Users',
                sortable: true,
                sortValue: (row) => row.usersCount,
                minWidth: 100,
                render: (row) => (
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 max-w-[56px] flex-1 rounded-full bg-slate-100">
                            <div
                                className="h-1.5 rounded-full bg-[var(--cta-button-bg)]"
                                style={{ width: `${Math.min((row.usersCount / 250) * 100, 100)}%` }}
                            />
                        </div>
                        <span className="tabular-nums text-sm text-slate-700">{row.usersCount}</span>
                    </div>
                ),
            },
            {
                id: 'location',
                header: 'Location',
                sortable: true,
                sortValue: (row) => `${row.city} ${row.state}`.toLowerCase(),
                minWidth: 140,
                render: (row) => (
                    <span className="text-slate-700">
                        {row.city}, {row.state}
                    </span>
                ),
            },
            {
                id: 'type',
                header: 'Type',
                sortable: true,
                sortValue: (row) => row.businessType,
                minWidth: 110,
                render: (row) => (
                    <span className={cn('rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide', typeBadgeClass(row.businessType))}>
                        {row.businessType}
                    </span>
                ),
            },
            {
                id: 'status',
                header: 'Status',
                sortable: true,
                sortValue: (row) => row.status,
                minWidth: 130,
                render: (row) => (
                    <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <StatusBadge status={row.status} />
                        <button
                            type="button"
                            className={cn(
                                'relative h-5 w-10 rounded-full p-0.5 transition-colors',
                                row.status === 'Active' ? 'bg-[var(--cta-button-bg)]' : 'bg-slate-300',
                            )}
                            title="Toggle active / inactive (demo)"
                            onClick={() => toggleStatus(row.id)}
                        >
                            <span
                                className={cn(
                                    'block h-4 w-4 rounded-full bg-white shadow transition-transform',
                                    row.status === 'Active' ? 'translate-x-5' : 'translate-x-0',
                                )}
                            />
                        </button>
                    </div>
                ),
            },
            {
                id: 'createdDate',
                header: 'Created',
                sortable: true,
                sortValue: (row) => row.createdAt,
                minWidth: 110,
                render: (row) => <span className="tabular-nums text-slate-600">{row.createdAt}</span>,
            },
            {
                id: 'actions',
                header: '',
                sortable: false,
                minWidth: 100,
                headerClassName: 'w-[128px]',
                cellClassName: 'text-right',
                render: (row) => (
                    <TenantRowActionsMenu
                        company={row}
                        onArchive={handleArchive}
                        onDelete={setDeleteTarget}
                        onCloseParent={() => setSelectedIds(new Set())}
                    />
                ),
            },
        ],
        [handleArchive, toggleStatus],
    );

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Platform', href: '/platform/tenants' },
                    { label: 'Tenants' },
                ]}
            />

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tenants</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Platform organizations — same enterprise record workspace as Leads &amp; Operations.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Link href={tenantCreateHref()}>
                        <Button variant="company" size="cta" className={cn('gap-2', CTA_SHADOW_SOFT)}>
                            <LuPlus size={18} />
                            Create tenant
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="order-2 flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:order-1">
                    <div className="relative min-w-[200px] flex-1 max-w-xl">
                        <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Search organization, code, owner, location…"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') setFilters((f) => ({ ...f, searchTerm: searchDraft }));
                            }}
                            className={cn(
                                'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white',
                                CTA_INPUT_FOCUS,
                            )}
                            aria-label="Search tenants"
                        />
                    </div>
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50/80 p-0.5">
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide',
                                viewMode === 'table'
                                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                                    : 'text-slate-500 hover:text-slate-800',
                            )}
                            aria-pressed={viewMode === 'table'}
                        >
                            <LuTable2 size={16} />
                            Table
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('kanban')}
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide',
                                viewMode === 'kanban'
                                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                                    : 'text-slate-500 hover:text-slate-800',
                            )}
                            aria-pressed={viewMode === 'kanban'}
                        >
                            <LuLayoutGrid size={16} />
                            Pipeline
                        </button>
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
                            <div className="absolute right-0 top-[calc(100%+6px)] z-[300] w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</p>
                                {TENANT_TABLE_DATA_COLUMN_IDS.map((id) => {
                                    const label =
                                        id === 'company'
                                            ? 'Organization Name'
                                            : id === 'createdDate'
                                              ? 'Created date'
                                              : id.charAt(0).toUpperCase() + id.slice(1);
                                    return (
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
                                    );
                                })}
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
                            <div className="absolute right-0 top-[calc(100%+6px)] z-[300] w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() => {
                                        downloadTenantsCsv(exportScope(), selectedIds.size ? 'tenants-selected.csv' : 'tenants-export.csv');
                                        setExportMenuOpen(false);
                                    }}
                                >
                                    <LuDownload size={16} className="text-slate-400" />
                                    CSV
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() => {
                                        downloadTenantsCsv(exportScope(), 'tenants-excel.csv');
                                        setExportMenuOpen(false);
                                    }}
                                >
                                    <LuFileText size={16} className="text-slate-400" />
                                    Excel (UTF-8 CSV)
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() => {
                                        openTenantsPrintReport(exportScope(), 'Tenants export');
                                        setExportMenuOpen(false);
                                    }}
                                >
                                    <LuFileText size={16} className="text-slate-400" />
                                    PDF / Print
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {selectedIds.size > 0 ? (
                <div className={cn('mb-4 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between', CTA_BULK_BAR)}>
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
                            onClick={() => downloadTenantsCsv(selectedRows, 'tenants-selected.csv')}
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

            {viewMode === 'kanban' ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                    <TenantsKanbanBoard rows={sorted} />
                </div>
            ) : (
                <>
                    <DataTable<Company>
                        columns={columns}
                        data={pageRows}
                        getRowId={(row) => String(row.id)}
                        sort={sort}
                        onSortChange={setSort}
                        columnVisibility={columnVisibility}
                        columnWidths={columnWidths}
                        onColumnWidthsChange={setColumnWidths}
                        storageKey={TABLE_STORAGE_KEY}
                        stickyColumnId="company"
                        enableClientSort={false}
                        emptyMessage="No tenants match your filters. Adjust search or filters, or create a new tenant."
                        selection={{
                            rowKey: 'id',
                            selectedIds,
                            onSelectedIdsChange: setSelectedIds,
                        }}
                    />
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={sorted.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            label="tenants"
                        />
                    </div>
                </>
            )}

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
                        aria-label="Tenant filters"
                    >
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
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.statusFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, statusFilter: e.target.value as TenantsFilterPayload['statusFilter'] }))}
                                >
                                    <option value="All">All statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Suspended">Suspended</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.planFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, planFilter: e.target.value as TenantsFilterPayload['planFilter'] }))}
                                >
                                    <option value="All">All plans</option>
                                    <option value="Basic">Basic</option>
                                    <option value="Pro">Pro</option>
                                    <option value="Enterprise">Enterprise</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Business Type</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.businessTypeFilter}
                                    onChange={(e) =>
                                        setFilters((f) => ({
                                            ...f,
                                            businessTypeFilter: e.target.value as TenantsFilterPayload['businessTypeFilter'],
                                        }))
                                    }
                                >
                                    <option value="All">All types</option>
                                    <option value="Builder">Builder</option>
                                    <option value="Developer">Developer</option>
                                    <option value="Association">Association</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created from</label>
                                    <input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                                        className={`mt-1.5 ${selectClass}`}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created to</label>
                                    <input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                                        className={`mt-1.5 ${selectClass}`}
                                    />
                                </div>
                            </div>
                            {savedViews.length > 0 ? (
                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved views</p>
                                    <ul className="mt-2 space-y-1">
                                        {savedViews.map((v) => (
                                            <li key={v.id} className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-[var(--cta-button-bg)] hover:bg-white"
                                                    onClick={() => applySavedView(v)}
                                                >
                                                    {v.name}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600"
                                                    aria-label={`Delete saved view ${v.name}`}
                                                    onClick={() => deleteSavedView(v.id)}
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
                <p className="mb-3 text-sm text-slate-600">Save the current tenant list filters for quick recall.</p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className={cn('mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)}
                    placeholder="e.g. Enterprise · Pending review"
                />
            </Modal>

            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Delete tenant"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" className="bg-rose-600 hover:bg-rose-700" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Remove <span className="font-semibold text-slate-900">{deleteTarget?.name}</span> from the platform list? Demo store will
                    drop this record until refresh resets mock data.
                </p>
            </Modal>

            <ImportTenantsModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImported={bump} />
        </CompanyAdminDashboardLayout>
    );
}
