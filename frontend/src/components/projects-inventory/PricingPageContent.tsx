'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { PricingRowActionsMenu } from '@/components/projects-inventory/PricingRowActionsMenu';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import type { Company } from '@/data/mockData';
import { downloadPricingCsv, type PricingCsvRow } from '@/lib/exportProjectsInventoryCsv';
import { getCompanies } from '@/lib/companyStore';
import {
    bulkDeleteProjects,
    deleteProject,
    getPriceApprovals,
    getProjects,
    getUnits,
    type Project,
} from '@/lib/projectsInventoryStore';
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
    CTA_BULK_BAR,
    CTA_CHECKBOX_SM,
    CTA_FOCUS_VISIBLE_RING,
    CTA_INPUT_FOCUS,
} from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';
import {
    LuBookmark,
    LuBuilding2,
    LuCheck,
    LuColumns3,
    LuDollarSign,
    LuDownload,
    LuFilter,
    LuFolderKanban,
    LuLayers,
    LuPencil,
    LuSearch,
    LuTrash2,
    LuX,
} from 'react-icons/lu';

const ITEMS_PER_PAGE = 12;
const TABLE_STORAGE_KEY = 'arris-pricing-table-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-pricing-saved-views';

export type PricingFilterPayload = {
    searchTerm: string;
    companyId: string;
};

type SavedView = { id: string; name: string; payload: PricingFilterPayload };

type Row = {
    company: Company;
    project: Project;
    tableRowId: string;
    units: number;
    pending: number;
};

const defaultFilters = (): PricingFilterPayload => ({ searchTerm: '', companyId: 'all' });

/** Demo grouping: projects have no companyId in store — assign by stable index. */
function projectsForCompany(company: Company, companies: Company[], projects: Project[]): Project[] {
    const idx = companies.findIndex((c) => c.id === company.id);
    if (idx < 0) return [];
    return projects.filter((_, i) => i % companies.length === idx);
}

function buildAllRows(companies: Company[], projects: Project[]): Row[] {
    const out: Row[] = [];
    for (const c of companies) {
        for (const p of projectsForCompany(c, companies, projects)) {
            out.push({
                company: c,
                project: p,
                tableRowId: `${c.id}-${p.slug}`,
                units: 0,
                pending: 0,
            });
        }
    }
    return out;
}

function sortPricingRows(rows: Row[], sort: DataTableSortState): Row[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'company':
                va = a.company.name.toLowerCase();
                vb = b.company.name.toLowerCase();
                break;
            case 'tenantCode':
                va = a.company.tenantCode.toLowerCase();
                vb = b.company.tenantCode.toLowerCase();
                break;
            case 'project_name':
                va = a.project.project_name.toLowerCase();
                vb = b.project.project_name.toLowerCase();
                break;
            case 'project_id':
                va = a.project.project_id.toLowerCase();
                vb = b.project.project_id.toLowerCase();
                break;
            case 'location':
                va = a.project.location.toLowerCase();
                vb = b.project.location.toLowerCase();
                break;
            case 'units':
                va = a.units;
                vb = b.units;
                break;
            case 'pending':
                va = a.pending;
                vb = b.pending;
                break;
            default:
                return 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

export function PricingPageContent() {
    const router = useRouter();
    const pathname = usePathname() ?? '';
    const globalViewsTick = useGlobalSavedViewsSync();
    const [storeVersion, setStoreVersion] = useState(0);
    const companies = useMemo(() => getCompanies(), [storeVersion]);
    const projects = useMemo(() => getProjects(), [storeVersion]);
    const units = useMemo(() => getUnits(), [storeVersion]);
    const approvals = useMemo(() => getPriceApprovals(), [storeVersion]);

    const totalPendingApprovals = useMemo(() => approvals.filter((a) => a.status === 'pending').length, [approvals]);

    const pendingBySlug = useMemo(() => {
        const map: Record<string, number> = {};
        for (const p of projects) map[p.slug] = 0;
        for (const a of approvals) {
            if (a.status !== 'pending') continue;
            const u = units.find((x) => x.slug === a.unitSlug);
            if (u && map[u.projectSlug] !== undefined) map[u.projectSlug] += 1;
        }
        return map;
    }, [approvals, projects, units]);

    const unitsBySlug = useMemo(() => {
        const map: Record<string, number> = {};
        for (const u of units) {
            map[u.projectSlug] = (map[u.projectSlug] ?? 0) + 1;
        }
        return map;
    }, [units]);

    const baseRows = useMemo(() => {
        const raw = buildAllRows(companies, projects);
        return raw.map((r) => ({
            ...r,
            units: unitsBySlug[r.project.slug] ?? 0,
            pending: pendingBySlug[r.project.slug] ?? 0,
        }));
    }, [companies, projects, unitsBySlug, pendingBySlug]);

    const [filters, setFilters] = useState<PricingFilterPayload>(() => defaultFilters());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [saveViewSaving, setSaveViewSaving] = useState(false);
    const [searchDraft, setSearchDraft] = useState('');

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Pricing', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as PricingFilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const p = f as Partial<PricingFilterPayload>;
        setFilters({ ...defaultFilters(), ...p });
        setSearchDraft(String(p.searchTerm ?? ''));
    });
    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'company', direction: 'asc' });

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const ids = ['company', 'tenantCode', 'project_name', 'project_id', 'location', 'units', 'pending', 'actions'];
        return Object.fromEntries(ids.map((id) => [id, true])) as Record<string, boolean>;
    });

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        company: 200,
        tenantCode: 120,
        project_name: 220,
        project_id: 100,
        location: 180,
        units: 80,
        pending: 100,
        actions: 200,
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

    const filteredRows = useMemo(() => {
        const q = filters.searchTerm.trim().toLowerCase();
        const idNum = filters.companyId === 'all' ? null : Number(filters.companyId);
        return baseRows.filter(({ company, project: p }) => {
            if (idNum != null && !Number.isNaN(idNum) && company.id !== idNum) return false;
            if (!q) return true;
            const blob = [company.name, company.tenantCode, `${company.city} ${company.state}`, p.project_name, p.project_id, p.location]
                .join(' ')
                .toLowerCase();
            return blob.includes(q);
        });
    }, [baseRows, filters]);

    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, storeVersion, sort]);

    const sortedFiltered = useMemo(() => sortPricingRows(filteredRows, sort), [filteredRows, sort]);
    const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / ITEMS_PER_PAGE));
    const paginated = useMemo(
        () => sortedFiltered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sortedFiltered, currentPage],
    );

    const bump = () => {
        setStoreVersion((v) => v + 1);
        setSelectedIds(new Set());
    };

    const goToPricing = useCallback((slug: string) => {
        router.push(`/projects-inventory/projects/view/${slug}?tab=pricing`);
    }, [router]);

    const handleDeleteProject = useCallback((p: Project) => {
        if (!window.confirm(`Delete "${p.project_name}"? Units and pending price approvals for this project are removed in this demo.`)) return;
        if (deleteProject(p.slug)) {
            setStoreVersion((v) => v + 1);
            setSelectedIds(new Set());
        }
    }, []);

    const selectClass = cn(
        'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800',
        CTA_INPUT_FOCUS,
    );

    const hasActiveFilters = filters.searchTerm.trim() !== '' || filters.companyId !== 'all';

    const persistSavedViews = (views: SavedView[]) => {
        replaceViewsForRoute(
            pathname,
            'Pricing',
            views.map((v) => ({ id: v.id, name: v.name, payload: v.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
    };

    const saveCurrentView = () => {
        const name = saveViewName.trim();
        if (!name || saveViewSaving) return;
        flushSync(() => {
            setSaveViewSaving(true);
        });
        try {
            persistSavedViews([...savedViews, { id: `v-${Date.now()}`, name, payload: { ...filters } }]);
            setSaveViewName('');
            setSaveModalOpen(false);
        } finally {
            setSaveViewSaving(false);
        }
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

    const applySearchToFilters = () => {
        setFilters((f) => ({ ...f, searchTerm: searchDraft }));
        setCurrentPage(1);
    };

    const columns: DataTableColumn<Row>[] = useMemo(
        () => [
            {
                id: 'company',
                header: 'Company',
                sticky: true,
                sortable: true,
                sortValue: (row) => row.company.name.toLowerCase(),
                minWidth: 180,
                render: (row) => (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            goToPricing(row.project.slug);
                        }}
                        className={cn(
                            'flex min-w-0 max-w-full cursor-pointer items-center gap-3 rounded-lg text-left -mx-1 px-1 py-0.5 transition-colors hover:bg-slate-100/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                            CTA_FOCUS_VISIBLE_RING,
                        )}
                        title={`Open ${row.project.project_name} — Pricing tab`}
                    >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--cta-button-bg)] text-xs font-bold text-[var(--cta-button-text)]">
                            {row.company.name.trim().charAt(0).toUpperCase() || '?'}
                        </span>
                        <span className="min-w-0 truncate font-semibold text-[var(--cta-button-bg)] underline-offset-2 hover:underline decoration-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)]">
                            {row.company.name}
                        </span>
                    </button>
                ),
            },
            {
                id: 'tenantCode',
                header: 'Tenant code',
                sortable: true,
                sortValue: (row) => row.company.tenantCode.toLowerCase(),
                minWidth: 110,
                render: (row) => <span className="text-sm text-slate-600">{row.company.tenantCode}</span>,
            },
            {
                id: 'project_name',
                header: 'Project',
                sortable: true,
                sortValue: (row) => row.project.project_name.toLowerCase(),
                minWidth: 200,
                render: (row) => <span className="font-semibold text-slate-900">{row.project.project_name}</span>,
            },
            {
                id: 'project_id',
                header: 'Project ID',
                sortable: true,
                sortValue: (row) => row.project.project_id.toLowerCase(),
                minWidth: 90,
                render: (row) => <span className="font-mono text-xs text-slate-600">{row.project.project_id}</span>,
            },
            {
                id: 'location',
                header: 'Location',
                sortable: true,
                sortValue: (row) => row.project.location.toLowerCase(),
                minWidth: 160,
                render: (row) => <span className="line-clamp-2 text-sm text-slate-600">{row.project.location}</span>,
            },
            {
                id: 'units',
                header: 'Units',
                sortable: true,
                sortValue: (row) => row.units,
                minWidth: 72,
                render: (row) => <span className="tabular-nums font-medium text-slate-800">{row.units}</span>,
            },
            {
                id: 'pending',
                header: 'Pending',
                sortable: true,
                sortValue: (row) => row.pending,
                minWidth: 88,
                render: (row) =>
                    row.pending > 0 ? (
                        <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">{row.pending}</span>
                    ) : (
                        <span className="text-slate-400">—</span>
                    ),
            },
            {
                id: 'actions',
                header: '',
                sortable: false,
                cellClassName: 'text-right',
                render: (row) => (
                    <PricingRowActionsMenu project={row.project} onOpenPricing={goToPricing} onDelete={handleDeleteProject} />
                ),
            },
        ],
        [goToPricing, handleDeleteProject],
    );

    const selectedRows = useMemo(() => sortedFiltered.filter((r) => selectedIds.has(r.tableRowId)), [sortedFiltered, selectedIds]);

    const bulkDelete = () => {
        if (!selectedIds.size) return;
        if (!window.confirm(`Delete ${selectedIds.size} project(s)? Related units and approvals are removed in this demo.`)) return;
        const slugs = new Set<string>();
        sortedFiltered.forEach((r) => {
            if (selectedIds.has(r.tableRowId)) slugs.add(r.project.slug);
        });
        bulkDeleteProjects([...slugs]);
        bump();
    };

    const bulkExport = () => {
        const rows: PricingCsvRow[] = (selectedIds.size ? selectedRows : sortedFiltered).map((r) => ({
            company: r.company,
            project: r.project,
            units: r.units,
            pending: r.pending,
        }));
        downloadPricingCsv(rows, selectedIds.size ? 'pricing-selected.csv' : 'pricing-export.csv');
    };

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Projects & Inventory', href: '/projects-inventory/projects' },
                    { label: 'Pricing', href: '/projects-inventory/pricing' },
                ]}
            />

            <header className="mb-6 mt-2 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                <div className="min-w-0 lg:max-w-xl">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Pricing</h1>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        Company and project in one place — open the project <span className="font-semibold text-slate-800">Pricing</span> tab or manage rows below.
                    </p>
                </div>

                <div className="grid w-full shrink-0 grid-cols-3 gap-2 sm:gap-3 lg:w-auto lg:min-w-[280px]">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm sm:text-left">
                        <div className="mb-1 flex items-center justify-center gap-1.5 text-[var(--cta-button-bg)] sm:justify-start">
                            <LuBuilding2 size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Companies</span>
                        </div>
                        <p className="text-xl font-black tabular-nums text-slate-900 sm:text-2xl">{companies.length}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm sm:text-left">
                        <div className="mb-1 flex items-center justify-center gap-1.5 text-indigo-600 sm:justify-start">
                            <LuLayers size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Rows</span>
                        </div>
                        <p className="text-xl font-black tabular-nums text-slate-900 sm:text-2xl">{baseRows.length}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm sm:text-left">
                        <div className="mb-1 flex items-center justify-center gap-1.5 text-amber-600 sm:justify-start">
                            <LuDollarSign size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Pending</span>
                        </div>
                        <p className="text-xl font-black tabular-nums text-slate-900 sm:text-2xl">{totalPendingApprovals}</p>
                    </div>
                </div>
            </header>

            {companies.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-8 py-16 text-center">
                    <LuBuilding2 className="mx-auto text-slate-300" size={40} />
                    <p className="mt-3 font-semibold text-slate-800">No companies yet</p>
                    <p className="mt-1 text-sm text-slate-500">Add companies to see pricing entries here.</p>
                </div>
            ) : baseRows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-8 py-16 text-center">
                    <LuLayers className="mx-auto text-slate-300" size={40} />
                    <p className="mt-3 font-semibold text-slate-800">No projects yet</p>
                    <Link href="/projects-inventory/projects" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline">
                        <LuFolderKanban size={16} />
                        Create projects
                    </Link>
                </div>
            ) : (
                <>
                    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="order-2 flex min-w-0 flex-1 items-center gap-2 sm:order-1">
                            <div className="relative flex-1 max-w-xl">
                                <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    placeholder="Search company, tenant, project…"
                                    value={searchDraft}
                                    onChange={(e) => setSearchDraft(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applySearchToFilters()}
                                    className={cn(
                                        'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm focus:bg-white',
                                        CTA_INPUT_FOCUS,
                                    )}
                                    aria-label="Search pricing"
                                />
                            </div>
                            <Button type="button" variant="companyOutline" size="cta" className="shrink-0" onClick={applySearchToFilters}>
                                Search
                            </Button>
                        </div>

                        <div className="order-1 flex flex-wrap items-center justify-end gap-2 sm:order-2">
                            <div className="relative" ref={columnMenuRef}>
                                <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setColumnMenuOpen((o) => !o)}>
                                    <LuColumns3 size={18} />
                                    Columns
                                </Button>
                                {columnMenuOpen ? (
                                    <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</p>
                                        {['company', 'tenantCode', 'project_name', 'project_id', 'location', 'units', 'pending'].map((id) => {
                                            const label =
                                                id === 'project_name'
                                                    ? 'Project'
                                                    : id === 'project_id'
                                                      ? 'Project ID'
                                                      : id === 'tenantCode'
                                                        ? 'Tenant code'
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

                    {filteredRows.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-14 text-center shadow-sm">
                            <p className="font-medium text-slate-700">No projects match your filters.</p>
                            <button type="button" className="mt-3 text-sm font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline" onClick={resetFilters}>
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <>
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
                                        <Button
                                            type="button"
                                            variant="companyOutline"
                                            size="sm"
                                            className="gap-1.5 border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                                            onClick={bulkDelete}
                                        >
                                            <LuTrash2 size={16} />
                                            Delete projects
                                        </Button>
                                        <Button type="button" variant="companyGhost" size="sm" onClick={() => setSelectedIds(new Set())}>
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                            ) : null}

                            <DataTable<Row>
                                columns={columns}
                                data={paginated}
                                getRowId={(row) => row.tableRowId}
                                sort={sort}
                                onSortChange={setSort}
                                columnVisibility={columnVisibility}
                                columnWidths={columnWidths}
                                onColumnWidthsChange={setColumnWidths}
                                storageKey={TABLE_STORAGE_KEY}
                                stickyColumnId="company"
                                enableClientSort={false}
                                selection={{ rowKey: 'tableRowId', selectedIds, onSelectedIdsChange: setSelectedIds }}
                            />

                            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    totalItems={sortedFiltered.length}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                    label="projects"
                                />
                            </div>
                        </>
                    )}
                </>
            )}

            {drawerOpen ? (
                <>
                    <button type="button" className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]" aria-label="Close" onClick={() => setDrawerOpen(false)} />
                    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl" role="dialog" aria-label="Filters">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-bold text-slate-900">Filters</h2>
                            <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setDrawerOpen(false)}>
                                <LuX size={20} />
                            </button>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                            <div>
                                <label className="text-xs font-semibold uppercase text-slate-500">Company</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.companyId}
                                    onChange={(e) => setFilters((f) => ({ ...f, companyId: e.target.value }))}
                                >
                                    <option value="all">All companies</option>
                                    {companies.map((c) => (
                                        <option key={c.id} value={String(c.id)}>
                                            {c.name}
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
                onClose={() => !saveViewSaving && setSaveModalOpen(false)}
                title="Save filter view"
                footer={
                    <>
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="cta"
                            onClick={() => setSaveModalOpen(false)}
                            disabled={saveViewSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            onClick={saveCurrentView}
                            disabled={!saveViewName.trim() || saveViewSaving}
                            isLoading={saveViewSaving}
                        >
                            {saveViewSaving ? 'Saving…' : 'Save'}
                        </Button>
                    </>
                }
            >
                <p className="mb-3 text-sm text-slate-600">Save company filter and search string for quick access.</p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className={cn('mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)}
                    placeholder="e.g. Acme Corp projects"
                />
            </Modal>
        </CompanyAdminDashboardLayout>
    );
}
