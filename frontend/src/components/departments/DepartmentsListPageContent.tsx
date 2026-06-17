'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { DepartmentRowActionsMenu } from '@/components/departments/DepartmentRowActionsMenu';
import { ImportDepartmentsModal } from '@/components/departments/ImportDepartmentsModal';
import StatusBadge from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import {
    CTA_BULK_BAR,
    CTA_CHECKBOX_SM,
    CTA_INPUT_FOCUS,
    CTA_SHADOW_SOFT,
} from '@/lib/theme/ctaThemeClasses';
import { downloadDepartmentsCsv, openDepartmentsPrintReport } from '@/lib/exportDepartmentsCsv';
import {
    DEFAULT_SAVED_VIEW_AUTHOR,
    importLegacyLocalSavedViewsOnce,
    loadGlobalSavedViews,
    normalizeSavedViewRoute,
    replaceViewsForRoute,
} from '@/lib/globalSavedViewsStore';
import { useConsumePendingSavedView } from '@/hooks/useConsumePendingSavedView';
import { useGlobalSavedViewsSync } from '@/hooks/useGlobalSavedViewsSync';
import type { Department } from '@/data/mockData';
import { getBusinessUnits, getUsers } from '@/data/mockData';
import {
    createDepartment,
    deleteDepartmentById,
    getDepartmentsList,
    updateDepartment,
} from '@/lib/departmentStore';
import { departmentProfileHref } from '@/lib/departmentRoutes';
import {
    LuBookmark,
    LuBuilding2,
    LuCheck,
    LuChevronDown,
    LuColumns3,
    LuDownload,
    LuFileText,
    LuFilter,
    LuPlus,
    LuPower,
    LuSearch,
    LuTrash2,
    LuUpload,
    LuX,
} from 'react-icons/lu';

const ITEMS_PER_PAGE = 10;
const TABLE_STORAGE_KEY = 'arris-departments-table-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-departments-saved-views';

const DEPARTMENTS_TABLE_DATA_COLUMN_IDS = [
    'name',
    'code',
    'businessUnit',
    'departmentHead',
    'usersCount',
    'status',
    'createdDate',
] as const;

const DEPARTMENTS_TABLE_DEFAULT_ON = new Set<string>([
    'name',
    'code',
    'businessUnit',
    'status',
    'usersCount',
    'actions',
]);

type SavedView = { id: string; name: string; payload: DepartmentsFilterPayload };

export type DepartmentsFilterPayload = {
    searchTerm: string;
    businessUnitFilter: string;
    departmentHeadFilter: string;
    statusFilter: 'All' | 'Active' | 'Inactive';
    dateFrom: string;
    dateTo: string;
};

const defaultFilters = (): DepartmentsFilterPayload => ({
    searchTerm: '',
    businessUnitFilter: 'All',
    departmentHeadFilter: 'All',
    statusFilter: 'All',
    dateFrom: '',
    dateTo: '',
});

function sortDepartmentsList(departments: Department[], sort: DataTableSortState): Department[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...departments];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...departments];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'name':
                va = a.name.toLowerCase();
                vb = b.name.toLowerCase();
                break;
            case 'code':
                va = a.code.toLowerCase();
                vb = b.code.toLowerCase();
                break;
            case 'businessUnit':
                va = a.businessUnitName.toLowerCase();
                vb = b.businessUnitName.toLowerCase();
                break;
            case 'departmentHead':
                va = (a.departmentHeadName || '').toLowerCase();
                vb = (b.departmentHeadName || '').toLowerCase();
                break;
            case 'usersCount':
                va = a.usersCount;
                vb = b.usersCount;
                break;
            case 'status':
                va = a.status;
                vb = b.status;
                break;
            case 'createdDate':
                va = a.createdDate;
                vb = b.createdDate;
                break;
            default:
                return 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

function formatYmdDisplay(ymd: string) {
    if (!ymd || ymd.length < 10) return ymd;
    const [y, m, d] = ymd.slice(0, 10).split('-');
    if (!y || !m || !d) return ymd;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mi = Number(m) - 1;
    return `${months[mi] || m} ${Number(d)}, ${y}`;
}

const COLUMN_LABELS: Record<string, string> = {
    name: 'Department name',
    code: 'Department code',
    businessUnit: 'Business unit',
    departmentHead: 'Department head',
    usersCount: 'Users count',
    status: 'Status',
    createdDate: 'Created date',
};

export function DepartmentsListPageContent() {
    const pathname = usePathname() ?? '';
    const globalViewsTick = useGlobalSavedViewsSync();
    const [listVersion, setListVersion] = useState(0);
    const localDepartments = useMemo(() => getDepartmentsList(), [listVersion]);

    const [filters, setFilters] = useState<DepartmentsFilterPayload>(() => defaultFilters());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [searchDraft, setSearchDraft] = useState('');

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Departments', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as DepartmentsFilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const p = f as Partial<DepartmentsFilterPayload>;
        setFilters({ ...defaultFilters(), ...p });
        setSearchDraft(String(p.searchTerm ?? ''));
    });

    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'createdDate', direction: 'desc' });
    const [importOpen, setImportOpen] = useState(false);
    const [deleteOneTarget, setDeleteOneTarget] = useState<Department | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const allIds = [...DEPARTMENTS_TABLE_DATA_COLUMN_IDS, 'actions' as const];
        return Object.fromEntries(allIds.map((id) => [id, DEPARTMENTS_TABLE_DEFAULT_ON.has(id)])) as Record<
            string,
            boolean
        >;
    });

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        name: 240,
        code: 120,
        businessUnit: 160,
        departmentHead: 160,
        usersCount: 100,
        status: 110,
        createdDate: 124,
        actions: 128,
    });

    const businessUnits = useMemo(() => getBusinessUnits(), []);
    const users = useMemo(() => getUsers(), []);

    useEffect(() => {
        const t = window.setTimeout(() => {
            setFilters((f) => (f.searchTerm === searchDraft ? f : { ...f, searchTerm: searchDraft }));
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

    const filteredDepartments = useMemo(() => {
        const st = filters.searchTerm.trim().toLowerCase();
        return localDepartments.filter((dept) => {
            const matchesSearch =
                !st ||
                dept.name.toLowerCase().includes(st) ||
                (dept.code && dept.code.toLowerCase().includes(st));
            const matchesBU =
                filters.businessUnitFilter === 'All' || dept.businessUnitId.toString() === filters.businessUnitFilter;
            const matchesHead =
                filters.departmentHeadFilter === 'All' ||
                (dept.departmentHeadId && dept.departmentHeadId.toString() === filters.departmentHeadFilter);
            const matchesStatus = filters.statusFilter === 'All' || dept.status === filters.statusFilter;
            const ymd = dept.createdDate.slice(0, 10);
            const matchesDateFrom = !filters.dateFrom || ymd >= filters.dateFrom;
            const matchesDateTo = !filters.dateTo || ymd <= filters.dateTo;
            return matchesSearch && matchesBU && matchesHead && matchesStatus && matchesDateFrom && matchesDateTo;
        });
    }, [localDepartments, filters]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sort]);

    const sortedFiltered = useMemo(() => sortDepartmentsList(filteredDepartments, sort), [filteredDepartments, sort]);
    const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / ITEMS_PER_PAGE));
    const paginatedDepartments = useMemo(
        () => sortedFiltered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sortedFiltered, currentPage],
    );

    const selectClass = cn(
        'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800',
        CTA_INPUT_FOCUS,
    );

    const hasActiveFilters =
        filters.searchTerm.trim() !== '' ||
        filters.businessUnitFilter !== 'All' ||
        filters.departmentHeadFilter !== 'All' ||
        filters.statusFilter !== 'All' ||
        filters.dateFrom !== '' ||
        filters.dateTo !== '';

    const persistSavedViews = (views: SavedView[]) => {
        replaceViewsForRoute(
            pathname,
            'Departments',
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

    const selectedDepartments = useMemo(
        () => sortedFiltered.filter((d) => selectedIds.has(String(d.id))),
        [sortedFiltered, selectedIds],
    );

    const exportRowsForScope = () => (selectedIds.size ? selectedDepartments : sortedFiltered);

    const runExportCsv = (filename: string) => {
        downloadDepartmentsCsv(exportRowsForScope(), filename);
        setExportMenuOpen(false);
    };

    const runExportPdf = () => {
        const rows = exportRowsForScope();
        const scope = selectedIds.size ? 'Selected departments' : 'Departments export';
        openDepartmentsPrintReport(rows, `${scope} · ${rows.length} record(s)`);
        setExportMenuOpen(false);
    };

    const toggleDepartmentStatus = (id: number) => {
        const d = localDepartments.find((x) => x.id === id);
        if (!d) return;
        updateDepartment(id, { status: d.status === 'Active' ? 'Inactive' : 'Active' });
        bump();
    };

    const deleteDepartment = (id: number) => {
        deleteDepartmentById(id);
        bump();
    };

    const confirmDeleteOne = () => {
        if (!deleteOneTarget) return;
        deleteDepartment(deleteOneTarget.id);
        setDeleteOneTarget(null);
    };

    const confirmBulkDelete = () => {
        const ids = new Set(selectedIds);
        ids.forEach((id) => deleteDepartmentById(Number(id)));
        setBulkDeleteOpen(false);
        bump();
    };

    const bulkSetStatus = (status: 'Active' | 'Inactive') => {
        const ids = new Set(selectedIds);
        ids.forEach((id) => {
            const d = localDepartments.find((x) => String(x.id) === id);
            if (d) updateDepartment(d.id, { status });
        });
        bump();
    };

    const handleImported = (rows: Department[]) => {
        rows.forEach((row) => {
            const bu = businessUnits.find((b) => b.name === row.businessUnitName);
            if (!bu) return;
            createDepartment({
                name: row.name,
                code: row.code,
                businessUnitId: bu.id,
                departmentHeadId: row.departmentHeadId,
                status: row.status,
                description: row.description,
                usersCount: row.usersCount,
                createdDate: row.createdDate,
            });
        });
        bump();
    };

    const columns: DataTableColumn<Department>[] = useMemo(
        () => [
            {
                id: 'name',
                header: 'Department Name',
                sticky: true,
                sortable: true,
                sortValue: (row) => row.name.toLowerCase(),
                minWidth: 200,
                render: (row) => (
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 text-sm font-bold text-slate-700 ring-1 ring-slate-200/80">
                            <LuBuilding2 size={18} className="text-slate-500" />
                        </div>
                        <Link
                            href={departmentProfileHref(row.id)}
                            className={cn(
                                'min-w-0 truncate font-semibold text-slate-900 hover:text-[var(--cta-button-bg)] hover:underline',
                                row.status === 'Inactive' && 'text-slate-400',
                            )}
                        >
                            {row.name}
                        </Link>
                    </div>
                ),
            },
            {
                id: 'code',
                header: 'Code',
                sortable: true,
                sortValue: (row) => row.code.toLowerCase(),
                minWidth: 100,
                render: (row) => (
                    <code className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-mono text-slate-600">{row.code}</code>
                ),
            },
            {
                id: 'businessUnit',
                header: 'Business Unit',
                sortable: true,
                sortValue: (row) => row.businessUnitName.toLowerCase(),
                minWidth: 140,
                render: (row) => <span className="font-medium text-slate-700">{row.businessUnitName}</span>,
            },
            {
                id: 'departmentHead',
                header: 'Department Head',
                sortable: true,
                sortValue: (row) => (row.departmentHeadName || '').toLowerCase(),
                minWidth: 140,
                render: (row) => <span className="text-slate-600">{row.departmentHeadName || '—'}</span>,
            },
            {
                id: 'usersCount',
                header: 'Users',
                sortable: true,
                sortValue: (row) => row.usersCount,
                minWidth: 80,
                render: (row) => <span className="font-medium tabular-nums text-slate-700">{row.usersCount}</span>,
            },
            {
                id: 'status',
                header: 'Status',
                sortable: true,
                sortValue: (row) => row.status,
                minWidth: 100,
                render: (row) => <StatusBadge status={row.status} />,
            },
            {
                id: 'createdDate',
                header: 'Created',
                sortable: true,
                sortValue: (row) => row.createdDate,
                minWidth: 110,
                render: (row) => (
                    <span className="tabular-nums text-slate-600">{formatYmdDisplay(row.createdDate)}</span>
                ),
            },
            {
                id: 'actions',
                header: '',
                sortable: false,
                minWidth: 100,
                headerClassName: 'w-[128px]',
                cellClassName: 'text-right',
                render: (row) => (
                    <DepartmentRowActionsMenu
                        department={row}
                        onToggleStatus={toggleDepartmentStatus}
                        onDelete={() => setDeleteOneTarget(row)}
                    />
                ),
            },
        ],
        [localDepartments],
    );

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Platform Foundation', href: '/platform/tenants' },
                    { label: 'Departments', href: '/departments' },
                ]}
            />

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Departments</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Manage departments within business units — search, filter, and act on records like the leads workspace.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Link href="/departments/view/new">
                        <Button variant="company" size="cta" className={cn('gap-2', CTA_SHADOW_SOFT)}>
                            <LuPlus size={18} />
                            Create department
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="relative min-w-[200px] flex-1 max-w-xl">
                    <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        placeholder="Search name or code…"
                        value={searchDraft}
                        onChange={(e) => setSearchDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') setFilters((f) => ({ ...f, searchTerm: searchDraft }));
                        }}
                        className={cn(
                            'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white',
                            CTA_INPUT_FOCUS,
                        )}
                        aria-label="Search departments"
                    />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
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
                                <p className="px-3 pb-2 text-[10px] leading-snug text-slate-500">
                                    Key columns on by default — enable more below.
                                </p>
                                {DEPARTMENTS_TABLE_DATA_COLUMN_IDS.map((id) => (
                                    <label
                                        key={id}
                                        className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                                    >
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
                                        {COLUMN_LABELS[id] ?? id}
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
                                    onClick={() =>
                                        runExportCsv(selectedIds.size ? 'departments-selected.csv' : 'departments-export.csv')
                                    }
                                >
                                    <LuDownload size={16} className="text-slate-400" />
                                    CSV
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() => {
                                        downloadDepartmentsCsv(exportRowsForScope(), 'departments-export-excel.csv');
                                        setExportMenuOpen(false);
                                    }}
                                >
                                    <LuFileText size={16} className="text-slate-400" />
                                    Excel (UTF-8 CSV)
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={runExportPdf}
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
                        <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={() => bulkSetStatus('Active')}>
                            <LuPower size={16} />
                            Activate
                        </Button>
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="sm"
                            className="gap-1.5 bg-white"
                            onClick={() => bulkSetStatus('Inactive')}
                        >
                            <LuPower size={16} />
                            Deactivate
                        </Button>
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="sm"
                            className="gap-1.5 bg-white"
                            onClick={() => downloadDepartmentsCsv(selectedDepartments, 'departments-selected.csv')}
                        >
                            <LuDownload size={16} />
                            Export
                        </Button>
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="sm"
                            className="gap-1.5 border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                            onClick={() => setBulkDeleteOpen(true)}
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

            <DataTable<Department>
                columns={columns}
                data={paginatedDepartments}
                getRowId={(row) => String(row.id)}
                sort={sort}
                onSortChange={setSort}
                columnVisibility={columnVisibility}
                columnWidths={columnWidths}
                onColumnWidthsChange={setColumnWidths}
                storageKey={TABLE_STORAGE_KEY}
                stickyColumnId="name"
                enableClientSort={false}
                emptyMessage="No departments match your filters. Adjust search or filters, or create a new department."
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
                    totalItems={sortedFiltered.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    label="departments"
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
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Business unit</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.businessUnitFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, businessUnitFilter: e.target.value }))}
                                >
                                    <option value="All">All business units</option>
                                    {businessUnits.map((bu) => (
                                        <option key={bu.id} value={String(bu.id)}>
                                            {bu.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Department head</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.departmentHeadFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, departmentHeadFilter: e.target.value }))}
                                >
                                    <option value="All">All department heads</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={String(u.id)}>
                                            {u.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.statusFilter}
                                    onChange={(e) =>
                                        setFilters((f) => ({
                                            ...f,
                                            statusFilter: e.target.value as 'All' | 'Active' | 'Inactive',
                                        }))
                                    }
                                >
                                    <option value="All">All statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
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
                <p className="text-sm text-slate-600 mb-3">
                    Save the current search and filter combination. Access it from this drawer or the Saved views menu in the top bar.
                </p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className={cn('mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)}
                    placeholder="e.g. Active · Residential"
                />
            </Modal>

            <Modal
                isOpen={!!deleteOneTarget}
                onClose={() => setDeleteOneTarget(null)}
                title="Delete department"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setDeleteOneTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            className="bg-rose-600 hover:bg-rose-700"
                            onClick={confirmDeleteOne}
                        >
                            Delete
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Delete <span className="font-semibold text-slate-900">{deleteOneTarget?.name}</span>? This cannot be undone in
                    this demo.
                </p>
            </Modal>

            <Modal
                isOpen={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                title="Delete selected departments"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setBulkDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            className="bg-rose-600 hover:bg-rose-700"
                            onClick={confirmBulkDelete}
                        >
                            Delete {selectedIds.size} department(s)
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">Delete {selectedIds.size} selected department(s)?</p>
            </Modal>

            <ImportDepartmentsModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImported={handleImported} />
        </CompanyAdminDashboardLayout>
    );
}
