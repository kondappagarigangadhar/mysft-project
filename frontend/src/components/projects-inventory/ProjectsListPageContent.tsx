'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { ProjectRowActionsMenu } from '@/components/projects-inventory/ProjectRowActionsMenu';
import { ProjectStatusBadge } from '@/components/projects-inventory/ProjectStatusBadge';
import { ProjectsExportMenu } from '@/components/projects-inventory/ProjectsExportMenu';
import { ProjectsImportModal } from '@/components/projects-inventory/ProjectsImportModal';
import { cn } from '@/lib/utils';
import {
    CTA_BULK_BAR,
    CTA_CHECKBOX_SM,
    CTA_INPUT_FOCUS,
    CTA_SHADOW_SOFT,
} from '@/lib/theme/ctaThemeClasses';
import { downloadProjectsCsv } from '@/lib/exportProjectsInventoryCsv';
import {
    archiveProject,
    bulkDeleteProjects,
    deleteProject,
    getProjects,
    getUnits,
    unarchiveProject,
    type Project,
    type ProjectApprovalStatus,
    type ProjectStatus,
    type ProjectType,
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
    LuBookmark,
    LuBuilding2,
    LuCheck,
    LuColumns3,
    LuDownload,
    LuFilter,
    LuLayoutGrid,
    LuPlus,
    LuRotateCcw,
    LuSearch,
    LuTable2,
    LuTrash2,
    LuUpload,
    LuX,
} from 'react-icons/lu';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const TABLE_STORAGE_KEY = 'arris-projects-table-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-projects-saved-views';

type ApprovalFilter = 'All' | ProjectApprovalStatus | 'unset';
export type ArchivedFilter = 'active' | 'archived' | 'all';

export type ProjectsFilterPayload = {
    searchTerm: string;
    typeFilter: 'All' | ProjectType;
    statusFilter: 'All' | ProjectStatus;
    approvalFilter: ApprovalFilter;
    locationFilter: 'All' | string;
    managerFilter: 'All' | string;
    archivedFilter: ArchivedFilter;
    createdFrom: string;
    createdTo: string;
    viewMode: 'table' | 'cards';
    pageSize: number;
};

type SavedView = { id: string; name: string; payload: ProjectsFilterPayload };

const defaultFilters = (): ProjectsFilterPayload => ({
    searchTerm: '',
    typeFilter: 'All',
    statusFilter: 'All',
    approvalFilter: 'All',
    locationFilter: 'All',
    managerFilter: 'All',
    archivedFilter: 'active',
    createdFrom: '',
    createdTo: '',
    viewMode: 'table',
    pageSize: 10,
});

function sortProjectsList(rows: Project[], sort: DataTableSortState): Project[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'project_id':
                va = a.project_id.toLowerCase();
                vb = b.project_id.toLowerCase();
                break;
            case 'project_name':
                va = a.project_name.toLowerCase();
                vb = b.project_name.toLowerCase();
                break;
            case 'project_type':
                va = a.project_type;
                vb = b.project_type;
                break;
            case 'location':
                va = a.location.toLowerCase();
                vb = b.location.toLowerCase();
                break;
            case 'total_units':
                va = a.total_units;
                vb = b.total_units;
                break;
            case 'project_status':
                va = a.project_status;
                vb = b.project_status;
                break;
            case 'approval':
                va = a.approval_status ?? '';
                vb = b.approval_status ?? '';
                break;
            case 'created_at':
                va = a.created_at ?? '';
                vb = b.created_at ?? '';
                break;
            case 'project_manager_name':
                va = (a.project_manager_name ?? '').toLowerCase();
                vb = (b.project_manager_name ?? '').toLowerCase();
                break;
            default:
                return 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

function approvalLabel(p: Project) {
    if (p.approval_status === undefined) return '—';
    return p.approval_status === 'pending' ? 'Pending' : 'Approved';
}

function ProjectsTableSkeleton() {
    return (
        <div className="animate-pulse space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-10 rounded-lg bg-slate-100" />
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-slate-50" />
            ))}
        </div>
    );
}

export function ProjectsListPageContent() {
    const pathname = usePathname() ?? '';
    const globalViewsTick = useGlobalSavedViewsSync();
    const [listVersion, setListVersion] = useState(0);
    const [tableReady, setTableReady] = useState(false);
    const [importOpen, setImportOpen] = useState(false);

    useEffect(() => {
        const t = window.setTimeout(() => setTableReady(true), 300);
        return () => window.clearTimeout(t);
    }, []);

    const allProjects = useMemo(() => getProjects(), [listVersion]);
    const allUnits = useMemo(() => getUnits(), [listVersion]);

    const stats = useMemo(() => {
        const total = allProjects.length;
        const active = allProjects.filter((p) => p.project_status === 'active').length;
        const pendingApproval = allProjects.filter((p) => p.approval_status === 'pending').length;
        const totalUnits = allProjects.reduce((s, p) => s + p.total_units, 0);
        const availableUnits = allUnits.filter((u) => u.availability_status === 'available' && !u.inventory_lock_status).length;
        return { total, active, pendingApproval, totalUnits, availableUnits };
    }, [allProjects, allUnits]);

    const [filters, setFilters] = useState<ProjectsFilterPayload>(() => defaultFilters());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [searchDraft, setSearchDraft] = useState('');
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Projects', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as ProjectsFilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const p = f as Partial<ProjectsFilterPayload>;
        const ps = typeof p.pageSize === 'number' && (PAGE_SIZE_OPTIONS as readonly number[]).includes(p.pageSize) ? p.pageSize : 10;
        setFilters({ ...defaultFilters(), ...p, pageSize: ps });
        setSearchDraft(String(p.searchTerm ?? ''));
    });
    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'created_at', direction: 'desc' });
    const [sortPreset, setSortPreset] = useState<'latest' | 'name' | 'units' | 'status' | 'custom'>('latest');

    const applySortPreset = (preset: typeof sortPreset) => {
        setSortPreset(preset);
        if (preset === 'latest') setSort({ columnId: 'created_at', direction: 'desc' });
        else if (preset === 'name') setSort({ columnId: 'project_name', direction: 'asc' });
        else if (preset === 'units') setSort({ columnId: 'total_units', direction: 'desc' });
        else if (preset === 'status') setSort({ columnId: 'project_status', direction: 'asc' });
    };

    const onSortChange = (next: DataTableSortState | ((prev: DataTableSortState) => DataTableSortState)) => {
        setSortPreset('custom');
        setSort(next);
    };

    /** Debounced sync: list filters as you type (same pattern as Inventory page) */
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
            'project_id',
            'project_name',
            'project_type',
            'location',
            'total_units',
            'project_status',
            'approval',
            'created_at',
            'actions',
        ];
        const m = Object.fromEntries(ids.map((id) => [id, true])) as Record<string, boolean>;
        m.created_at = false;
        return m;
    });

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        project_id: 100,
        project_name: 240,
        project_type: 110,
        location: 180,
        total_units: 100,
        project_status: 120,
        approval: 110,
        created_at: 130,
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

    const locationOptions = useMemo(() => {
        const set = new Set<string>();
        allProjects.forEach((p) => {
            if (p.location?.trim()) set.add(p.location.trim());
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [allProjects]);

    const managerOptions = useMemo(() => {
        const set = new Set<string>();
        allProjects.forEach((p) => {
            const m = p.project_manager_name?.trim();
            if (m) set.add(m);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [allProjects]);

    const bump = useCallback(() => {
        setListVersion((v) => v + 1);
        setSelectedIds(new Set());
    }, []);

    const filtered = useMemo(() => {
        const s = filters.searchTerm.trim().toLowerCase();
        return allProjects.filter((p) => {
            const matchesSearch =
                !s ||
                p.project_name.toLowerCase().includes(s) ||
                p.location.toLowerCase().includes(s) ||
                p.project_id.toLowerCase().includes(s) ||
                p.project_type.toLowerCase().includes(s) ||
                (p.project_manager_name ?? '').toLowerCase().includes(s) ||
                (p.city ?? '').toLowerCase().includes(s);
            const matchesType = filters.typeFilter === 'All' ? true : p.project_type === filters.typeFilter;
            const matchesStatus = filters.statusFilter === 'All' ? true : p.project_status === filters.statusFilter;
            const matchesLocation = filters.locationFilter === 'All' ? true : p.location.trim() === filters.locationFilter;
            const matchesApproval =
                filters.approvalFilter === 'All'
                    ? true
                    : filters.approvalFilter === 'unset'
                      ? p.approval_status === undefined
                      : p.approval_status === filters.approvalFilter;
            const matchesManager =
                filters.managerFilter === 'All' ? true : (p.project_manager_name ?? '').trim() === filters.managerFilter;
            const matchesArchived =
                filters.archivedFilter === 'all'
                    ? true
                    : filters.archivedFilter === 'archived'
                      ? p.archived === true
                      : !p.archived;
            const day = (p.created_at ?? '').slice(0, 10);
            const matchesCreated =
                (!filters.createdFrom || !day || day >= filters.createdFrom) &&
                (!filters.createdTo || !day || day <= filters.createdTo);
            return (
                matchesSearch &&
                matchesType &&
                matchesStatus &&
                matchesLocation &&
                matchesApproval &&
                matchesManager &&
                matchesArchived &&
                matchesCreated
            );
        });
    }, [allProjects, filters]);

    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, listVersion, sort]);

    const sortedFiltered = useMemo(() => sortProjectsList(filtered, sort), [filtered, sort]);
    const pageSize = filters.pageSize;
    const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / pageSize));
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
        filters.typeFilter !== 'All' ||
        filters.statusFilter !== 'All' ||
        filters.approvalFilter !== 'All' ||
        filters.locationFilter !== 'All' ||
        filters.managerFilter !== 'All' ||
        filters.archivedFilter !== 'active' ||
        filters.createdFrom !== '' ||
        filters.createdTo !== '' ||
        filters.viewMode !== 'table' ||
        filters.pageSize !== 10;

    const persistSavedViews = (views: SavedView[]) => {
        replaceViewsForRoute(
            pathname,
            'Projects',
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
        const p = v.payload as Partial<ProjectsFilterPayload>;
        const ps = typeof p.pageSize === 'number' && (PAGE_SIZE_OPTIONS as readonly number[]).includes(p.pageSize) ? p.pageSize : 10;
        setFilters({ ...defaultFilters(), ...p, pageSize: ps });
        setSearchDraft(p.searchTerm ?? '');
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

    const handleDelete = useCallback(
        (row: Project) => {
            if (!window.confirm(`Delete project "${row.project_name}"? This removes its units and pending price approvals in this demo.`)) return;
            if (deleteProject(row.slug)) bump();
        },
        [bump],
    );

    const handleArchive = useCallback(
        (row: Project) => {
            if (row.archived) {
                unarchiveProject(row.slug);
            } else {
                archiveProject(row.slug);
            }
            bump();
        },
        [bump],
    );

    const columns: DataTableColumn<Project>[] = useMemo(
        () => [
            {
                id: 'project_id',
                header: 'Project ID',
                sortable: true,
                sortValue: (row) => row.project_id.toLowerCase(),
                minWidth: 90,
                render: (row) => (
                    <Link
                        href={`/projects-inventory/projects/view/${row.slug}`}
                        className="font-mono text-sm font-semibold text-slate-900 hover:text-[var(--cta-button-bg)] hover:underline"
                    >
                        {row.project_id}
                    </Link>
                ),
            },
            {
                id: 'project_name',
                header: 'Project name',
                sticky: true,
                sortable: true,
                sortValue: (row) => row.project_name.toLowerCase(),
                minWidth: 200,
                render: (row) => (
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700 ring-1 ring-slate-200/80">
                            {row.project_name.charAt(0).toUpperCase()}
                        </div>
                        <Link
                            href={`/projects-inventory/projects/view/${row.slug}`}
                            className="min-w-0 truncate font-semibold text-slate-900 hover:text-[var(--cta-button-bg)] hover:underline"
                        >
                            {row.project_name}
                        </Link>
                    </div>
                ),
            },
            {
                id: 'project_type',
                header: 'Type',
                sortable: true,
                sortValue: (row) => row.project_type,
                minWidth: 100,
                render: (row) => <span className="text-slate-700">{row.project_type}</span>,
            },
            {
                id: 'location',
                header: 'Location',
                sortable: true,
                sortValue: (row) => row.location.toLowerCase(),
                minWidth: 160,
                render: (row) => (
                    <span className="line-clamp-2 text-slate-700" title={row.location}>
                        {row.location}
                    </span>
                ),
            },
            {
                id: 'total_units',
                header: 'Units',
                sortable: true,
                sortValue: (row) => row.total_units,
                minWidth: 80,
                render: (row) => <span className="tabular-nums font-semibold text-slate-800">{row.total_units}</span>,
            },
            {
                id: 'project_status',
                header: 'Status',
                sortable: true,
                sortValue: (row) => row.project_status,
                minWidth: 100,
                render: (row) => <ProjectStatusBadge status={row.project_status} />,
            },
            {
                id: 'approval',
                header: 'Approval',
                sortable: true,
                sortValue: (row) => row.approval_status ?? '',
                minWidth: 100,
                render: (row) => (
                    <span
                        className={cn(
                            'text-xs font-semibold',
                            row.approval_status === 'pending' && 'text-amber-700',
                            row.approval_status === 'approved' && 'text-emerald-700',
                            row.approval_status === undefined && 'text-slate-400',
                        )}
                    >
                        {approvalLabel(row)}
                    </span>
                ),
            },
            {
                id: 'created_at',
                header: 'Created',
                sortable: true,
                sortValue: (row) => row.created_at ?? '',
                minWidth: 120,
                render: (row) => (
                    <span className="tabular-nums text-xs text-slate-600">{row.created_at ? row.created_at.slice(0, 16) : '—'}</span>
                ),
            },
            {
                id: 'actions',
                header: '',
                sortable: false,
                minWidth: 120,
                cellClassName: 'text-right',
                render: (row) => <ProjectRowActionsMenu project={row} onDelete={handleDelete} onArchive={handleArchive} />,
            },
        ],
        [handleDelete, handleArchive],
    );

    const selectedRows = useMemo(() => sortedFiltered.filter((p) => selectedIds.has(p.slug)), [sortedFiltered, selectedIds]);

    const bulkDelete = () => {
        if (!selectedIds.size) return;
        if (!window.confirm(`Delete ${selectedIds.size} project(s)?`)) return;
        bulkDeleteProjects([...selectedIds]);
        bump();
    };

    const bulkExport = () => {
        const rows = selectedIds.size ? selectedRows : sortedFiltered;
        downloadProjectsCsv(rows, selectedIds.size ? 'projects-selected.csv' : 'projects-export.csv');
    };

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Projects & Inventory', href: '/projects-inventory/projects' },
                    { label: 'Projects' },
                ]}
            />

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projects</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Premium portfolio command center — same routes, imports, and CRUD with upgraded filters and layouts.
                    </p>
                </div>
                <Link href="/projects-inventory/projects/view/new">
                    <Button variant="company" size="cta" className={cn('gap-2', CTA_SHADOW_SOFT)}>
                        <LuPlus size={18} />
                        Create project
                    </Button>
                </Link>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {[
                    { label: 'Total projects', value: stats.total },
                    { label: 'Active', value: stats.active, tone: 'text-emerald-700' },
                    { label: 'Pending approval', value: stats.pendingApproval, tone: 'text-amber-800' },
                    { label: 'Total units', value: stats.totalUnits },
                    { label: 'Available units', value: stats.availableUnits, tone: 'text-[var(--cta-button-bg)]' },
                ].map((k) => (
                    <div
                        key={k.label}
                        className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm ring-1 ring-slate-100/80 transition-shadow hover:shadow-md"
                    >
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{k.label}</p>
                        <p className={cn('mt-2 text-2xl font-bold tabular-nums text-slate-900', k.tone)}>{k.value}</p>
                    </div>
                ))}
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="order-2 flex min-w-0 flex-1 items-center gap-2 sm:order-1">
                    <div className="relative flex-1 max-w-xl">
                        <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Search name, ID, location, city, manager…"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    flushSearchNow();
                                }
                            }}
                            className={cn(
                                'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white',
                                CTA_INPUT_FOCUS,
                            )}
                            aria-label="Search projects — filters as you type"
                        />
                    </div>
                </div>

                <div className="order-1 flex flex-wrap items-center justify-end gap-2 sm:order-2">
                    <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor="projects-sort-preset">
                            Sort list
                        </label>
                        <select
                            id="projects-sort-preset"
                            className={selectClass + ' w-[148px] sm:w-auto'}
                            value={sortPreset}
                            onChange={(e) => {
                                const v = e.target.value as typeof sortPreset;
                                if (v === 'custom') setSortPreset('custom');
                                else applySortPreset(v);
                            }}
                        >
                            <option value="latest">Latest</option>
                            <option value="name">Name</option>
                            <option value="units">Units</option>
                            <option value="status">Status</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    <div className="flex rounded-xl border border-[#e5e7eb] p-0.5">
                        <button
                            type="button"
                            className={cn(
                                'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors',
                                filters.viewMode === 'table'
                                    ? 'bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50',
                            )}
                            onClick={() => setFilters((f) => ({ ...f, viewMode: 'table' }))}
                        >
                            <LuTable2 size={16} aria-hidden />
                            Table
                        </button>
                        <button
                            type="button"
                            className={cn(
                                'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors',
                                filters.viewMode === 'cards'
                                    ? 'bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50',
                            )}
                            onClick={() => setFilters((f) => ({ ...f, viewMode: 'cards' }))}
                        >
                            <LuLayoutGrid size={16} aria-hidden />
                            Cards
                        </button>
                    </div>
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
                    <ProjectsExportMenu rows={sortedFiltered} />
                   
                    <div className="relative" ref={columnMenuRef}>
                        <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setColumnMenuOpen((o) => !o)}>
                            <LuColumns3 size={18} />
                            Columns
                        </Button>
                        {columnMenuOpen ? (
                            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</p>
                                {[
                                    'project_id',
                                    'project_name',
                                    'project_type',
                                    'location',
                                    'total_units',
                                    'project_status',
                                    'approval',
                                    'created_at',
                                ].map((id) => {
                                    const label =
                                        id === 'project_id'
                                            ? 'Project ID'
                                            : id === 'project_name'
                                              ? 'Project name'
                                              : id === 'project_type'
                                                ? 'Type'
                                                : id === 'total_units'
                                                  ? 'Units'
                                                  : id === 'project_status'
                                                    ? 'Status'
                                                    : id === 'created_at'
                                                      ? 'Created'
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

            <ProjectsImportModal
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
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="sm"
                            className="gap-1.5 border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                            onClick={bulkDelete}
                        >
                            <LuTrash2 size={16} />
                            Delete
                        </Button>
                        <Button type="button" variant="companyGhost" size="sm" onClick={() => setSelectedIds(new Set())}>
                            Clear
                        </Button>
                    </div>
                </div>
            ) : null}

            {!tableReady ? (
                <ProjectsTableSkeleton />
            ) : sortedFiltered.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm transition-shadow hover:shadow-md">
                    {allProjects.length === 0 ? (
                        <>
                            <LuBuilding2 className="mx-auto h-14 w-14 text-slate-300" aria-hidden />
                            <p className="mt-4 text-lg font-semibold text-slate-900">No projects yet</p>
                            <p className="mt-2 text-sm text-slate-600">Create a project manually or import a CSV file.</p>
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                <Link href="/projects-inventory/projects/view/new">
                                    <Button variant="company" size="cta" className="gap-2">
                                        <LuPlus size={18} />
                                        Create project
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
                            <p className="font-semibold text-slate-900">No projects match your filters</p>
                            <p className="mt-2 text-sm text-slate-600">Try adjusting search or advanced filters.</p>
                            <Button type="button" variant="companyOutline" size="cta" className="mt-6 gap-2" onClick={resetFilters}>
                                <LuRotateCcw size={18} />
                                Clear filters
                            </Button>
                        </>
                    )}
                </div>
            ) : filters.viewMode === 'cards' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {paginated.map((row) => (
                        <div
                            key={row.slug}
                            className="relative overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm ring-1 ring-slate-100/80 transition-all hover:shadow-md"
                        >
                            <Link href={`/projects-inventory/projects/view/${row.slug}`} className="block p-5 pr-14">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] text-sm font-bold text-[var(--cta-button-bg)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]">
                                        {row.project_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-base font-semibold text-slate-900">{row.project_name}</p>
                                        <p className="mt-1 font-mono text-xs text-slate-500">{row.project_id}</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <ProjectStatusBadge status={row.project_status} />
                                            {row.archived ? (
                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 ring-1 ring-slate-200">
                                                    Archived
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-3 line-clamp-2 text-sm text-slate-600">{row.location}</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-800">
                                            {row.total_units} units · {row.project_type}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                            <div className="absolute top-3 right-3">
                                <ProjectRowActionsMenu project={row} onDelete={handleDelete} onArchive={handleArchive} />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                    <DataTable<Project>
                        columns={columns}
                        data={paginated}
                        getRowId={(row) => row.slug}
                        sort={sort}
                        onSortChange={onSortChange}
                        columnVisibility={columnVisibility}
                        columnWidths={columnWidths}
                        onColumnWidthsChange={setColumnWidths}
                        storageKey={TABLE_STORAGE_KEY}
                        stickyColumnId="project_name"
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
                        label="projects"
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
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project type</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.typeFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, typeFilter: e.target.value as 'All' | ProjectType }))}
                                >
                                    <option value="All">All types</option>
                                    <option value="Apartment">Apartment</option>
                                    <option value="Villa">Villa</option>
                                    <option value="Plot">Plot</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lifecycle status</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.statusFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, statusFilter: e.target.value as 'All' | ProjectStatus }))}
                                >
                                    <option value="All">All statuses</option>
                                    <option value="upcoming">Upcoming</option>
                                    <option value="active">Active</option>
                                    <option value="sold out">Sold out</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approval</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.approvalFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, approvalFilter: e.target.value as ApprovalFilter }))}
                                >
                                    <option value="All">All</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="unset">Not set</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.locationFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, locationFilter: e.target.value }))}
                                >
                                    <option value="All">All locations</option>
                                    {locationOptions.map((loc) => (
                                        <option key={loc} value={loc}>
                                            {loc}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Manager</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.managerFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, managerFilter: e.target.value }))}
                                >
                                    <option value="All">All managers</option>
                                    {managerOptions.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Archive</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.archivedFilter}
                                    onChange={(e) =>
                                        setFilters((f) => ({ ...f, archivedFilter: e.target.value as ArchivedFilter }))
                                    }
                                >
                                    <option value="active">Active only</option>
                                    <option value="archived">Archived only</option>
                                    <option value="all">All</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created from</label>
                                    <input
                                        type="date"
                                        className={`mt-1.5 ${selectClass}`}
                                        value={filters.createdFrom}
                                        onChange={(e) => setFilters((f) => ({ ...f, createdFrom: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created to</label>
                                    <input
                                        type="date"
                                        className={`mt-1.5 ${selectClass}`}
                                        value={filters.createdTo}
                                        onChange={(e) => setFilters((f) => ({ ...f, createdTo: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Page size</label>
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
                <p className="mb-3 text-sm text-slate-600">Save filters, search, and page size for quick recall from the drawer.</p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className={cn('mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)}
                    placeholder="e.g. Active · Mumbai"
                />
            </Modal>
        </CompanyAdminDashboardLayout>
    );
}
