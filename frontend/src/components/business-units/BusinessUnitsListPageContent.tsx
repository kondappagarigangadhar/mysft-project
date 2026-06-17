'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { ImportBusinessUnitsModal, type BusinessUnitImportDraft } from '@/components/business-units/ImportBusinessUnitsModal';
import { BusinessUnitRowActionsMenu } from '@/components/business-units/BusinessUnitRowActionsMenu';
import StatusBadge from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import {
    CTA_BULK_BAR,
    CTA_CHECKBOX_SM,
    CTA_INPUT_FOCUS,
    CTA_SHADOW_SOFT,
} from '@/lib/theme/ctaThemeClasses';
import { downloadBusinessUnitsCsv, openBusinessUnitsPrintReport } from '@/lib/exportBusinessUnitsCsv';
import {
    DEFAULT_SAVED_VIEW_AUTHOR,
    importLegacyLocalSavedViewsOnce,
    loadGlobalSavedViews,
    normalizeSavedViewRoute,
    replaceViewsForRoute,
} from '@/lib/globalSavedViewsStore';
import { useConsumePendingSavedView } from '@/hooks/useConsumePendingSavedView';
import { useGlobalSavedViewsSync } from '@/hooks/useGlobalSavedViewsSync';
import { BusinessUnit, companies, getBusinessUnits } from '@/data/mockData';
import {
    LuBookmark,
    LuCheck,
    LuChevronDown,
    LuColumns3,
    LuDownload,
    LuFileText,
    LuFilter,
    LuPlus,
    LuSearch,
    LuTrash2,
    LuUpload,
    LuX,
} from 'react-icons/lu';

const ITEMS_PER_PAGE = 10;
const TABLE_STORAGE_KEY = 'arris-business-units-table-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-business-units-saved-views';

const BU_TABLE_DATA_COLUMN_IDS = [
    'name',
    'code',
    'parentOrganizationName',
    'defaultProjectScope',
    'createdDate',
    'status',
] as const;

const BU_TABLE_DEFAULT_ON = new Set<string>([
    'name',
    'code',
    'parentOrganizationName',
    'defaultProjectScope',
    'status',
    'createdDate',
    'actions',
]);

export type BusinessUnitsFilterPayload = {
    searchTerm: string;
    statusFilter: 'All' | 'Active' | 'Inactive';
    parentOrgFilter: 'All' | string;
};

type SavedView = { id: string; name: string; payload: BusinessUnitsFilterPayload };

const defaultFilters = (): BusinessUnitsFilterPayload => ({
    searchTerm: '',
    statusFilter: 'All',
    parentOrgFilter: 'All',
});

function cloneBusinessUnits(): BusinessUnit[] {
    return getBusinessUnits().map((b) => ({ ...b, defaultProjectScope: [...b.defaultProjectScope] }));
}

function sortBusinessUnits(rows: BusinessUnit[], sort: DataTableSortState): BusinessUnit[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
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
            case 'parentOrganizationName':
                va = a.parentOrganizationName.toLowerCase();
                vb = b.parentOrganizationName.toLowerCase();
                break;
            case 'defaultProjectScope':
                va = a.defaultProjectScope.join(',').toLowerCase();
                vb = b.defaultProjectScope.join(',').toLowerCase();
                break;
            case 'createdDate':
                va = a.createdDate;
                vb = b.createdDate;
                break;
            case 'status':
                va = a.status;
                vb = b.status;
                break;
            default:
                return 0;
        }
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

export function BusinessUnitsListPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname() ?? '';
    const globalViewsTick = useGlobalSavedViewsSync();

    const [rows, setRows] = useState<BusinessUnit[]>(() => cloneBusinessUnits());

    const bump = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const [filters, setFilters] = useState<BusinessUnitsFilterPayload>(() => defaultFilters());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [searchDraft, setSearchDraft] = useState('');

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Business Units', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedView[] => {
        void globalViewsTick;
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as BusinessUnitsFilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const p = f as Partial<BusinessUnitsFilterPayload>;
        setFilters({ ...defaultFilters(), ...p });
        setSearchDraft(String(p.searchTerm ?? ''));
    });

    useEffect(() => {
        const t = window.setTimeout(() => {
            setFilters((f) => (f.searchTerm === searchDraft ? f : { ...f, searchTerm: searchDraft }));
        }, 320);
        return () => window.clearTimeout(t);
    }, [searchDraft]);

    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'name', direction: 'asc' });
    const [importOpen, setImportOpen] = useState(false);

    useEffect(() => {
        if (searchParams.get('import') !== '1') return;
        setImportOpen(true);
        const next = new URLSearchParams(searchParams.toString());
        next.delete('import');
        const q = next.toString();
        router.replace(q ? `/business-units?${q}` : '/business-units', { scroll: false });
    }, [searchParams, router]);

    const [deleteOneTarget, setDeleteOneTarget] = useState<BusinessUnit | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
    const [bulkStatusPick, setBulkStatusPick] = useState<'Active' | 'Inactive'>('Active');
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const allIds = [...BU_TABLE_DATA_COLUMN_IDS, 'actions' as const];
        return Object.fromEntries(allIds.map((id) => [id, BU_TABLE_DEFAULT_ON.has(id)])) as Record<string, boolean>;
    });

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        name: 260,
        code: 120,
        parentOrganizationName: 200,
        defaultProjectScope: 220,
        createdDate: 120,
        status: 112,
        actions: 128,
    });

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);

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

    const filtered = useMemo(() => {
        const st = filters.searchTerm.trim().toLowerCase();
        return rows.filter((bu) => {
            const matchesSearch =
                !st ||
                bu.name.toLowerCase().includes(st) ||
                bu.code.toLowerCase().includes(st) ||
                bu.parentOrganizationName.toLowerCase().includes(st) ||
                bu.defaultProjectScope.some((s) => s.toLowerCase().includes(st));
            const matchesStatus = filters.statusFilter === 'All' || bu.status === filters.statusFilter;
            const matchesParent =
                filters.parentOrgFilter === 'All' || bu.parentOrganizationId.toString() === filters.parentOrgFilter;
            return matchesSearch && matchesStatus && matchesParent;
        });
    }, [rows, filters]);

    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sort]);

    const sortedFiltered = useMemo(() => sortBusinessUnits(filtered, sort), [filtered, sort]);

    const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / ITEMS_PER_PAGE));
    const paginated = useMemo(
        () => sortedFiltered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sortedFiltered, currentPage],
    );

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const selectClass = cn('h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800', CTA_INPUT_FOCUS);

    const hasActiveFilters =
        filters.searchTerm.trim() !== '' ||
        filters.statusFilter !== 'All' ||
        filters.parentOrgFilter !== 'All';

    const persistSavedViews = (views: SavedView[]) => {
        replaceViewsForRoute(
            pathname,
            'Business Units',
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

    const selectedRows = useMemo(
        () => sortedFiltered.filter((b) => selectedIds.has(String(b.id))),
        [sortedFiltered, selectedIds],
    );

    const exportRowsForScope = () => {
        if (selectedIds.size) return selectedRows;
        return sortedFiltered;
    };

    const runExportCsv = (filename: string) => {
        downloadBusinessUnitsCsv(exportRowsForScope(), filename);
        setExportMenuOpen(false);
    };

    const runExportExcel = () => {
        downloadBusinessUnitsCsv(exportRowsForScope(), 'business-units-export-excel.csv');
        setExportMenuOpen(false);
    };

    const runExportPdf = () => {
        const r = exportRowsForScope();
        const scope = selectedIds.size ? 'Selected business units' : 'Business units export';
        openBusinessUnitsPrintReport(r, `${scope} · ${r.length} record(s)`);
        setExportMenuOpen(false);
    };

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingBU, setEditingBU] = useState<BusinessUnit | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        parentOrganizationId: '',
        defaultProjectScope: [] as string[],
    });

    const openCreateModal = useCallback(() => {
        setEditingBU(null);
        setFormData({ name: '', code: '', parentOrganizationId: '', defaultProjectScope: [] });
        setIsCreateModalOpen(true);
    }, []);

    const openEditModal = useCallback((bu: BusinessUnit) => {
        setEditingBU(bu);
        setFormData({
            name: bu.name,
            code: bu.code,
            parentOrganizationId: bu.parentOrganizationId.toString(),
            defaultProjectScope: [...bu.defaultProjectScope],
        });
        setIsCreateModalOpen(true);
    }, []);

    const handleSaveBU = () => {
        const name = formData.name.trim();
        const code = formData.code.trim().toUpperCase().replace(/\s/g, '');
        const pid = Number(formData.parentOrganizationId);
        const org = companies.find((c) => c.id === pid);
        if (!name || !code || !org) return;

        if (!editingBU) {
            const dup = rows.some((b) => b.code.toUpperCase() === code);
            if (dup) return;
        } else {
            const dup = rows.some((b) => b.id !== editingBU.id && b.code.toUpperCase() === code);
            if (dup) return;
        }

        if (editingBU) {
            setRows((prev) =>
                prev.map((b) =>
                    b.id === editingBU.id
                        ? {
                              ...b,
                              name,
                              code,
                              parentOrganizationId: org.id,
                              parentOrganizationName: org.name,
                              defaultProjectScope: [...formData.defaultProjectScope],
                          }
                        : b,
                ),
            );
        } else {
            const nextId = Math.max(0, ...rows.map((b) => b.id)) + 1;
            setRows((prev) => [
                ...prev,
                {
                    id: nextId,
                    name,
                    code,
                    parentOrganizationId: org.id,
                    parentOrganizationName: org.name,
                    defaultProjectScope: [...formData.defaultProjectScope],
                    status: 'Active',
                    createdDate: (() => {
                        const d = new Date();
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return `${months[d.getMonth()]} ${d.getFullYear()}`;
                    })(),
                },
            ]);
        }
        setIsCreateModalOpen(false);
        bump();
    };

    const confirmDeleteOne = () => {
        if (!deleteOneTarget) return;
        setRows((prev) => prev.filter((b) => b.id !== deleteOneTarget.id));
        setDeleteOneTarget(null);
        bump();
    };

    const handleChangeStatus = useCallback((id: number, status: 'Active' | 'Inactive') => {
        setRows((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
        bump();
    }, [bump]);

    const confirmBulkDelete = () => {
        if (!selectedIds.size) return;
        setRows((prev) => prev.filter((b) => !selectedIds.has(String(b.id))));
        setBulkDeleteOpen(false);
        bump();
    };

    const confirmBulkStatus = () => {
        if (!selectedIds.size) return;
        setRows((prev) => prev.map((b) => (selectedIds.has(String(b.id)) ? { ...b, status: bulkStatusPick } : b)));
        setBulkStatusOpen(false);
        bump();
    };

    const existingCodes = useMemo(() => new Set(rows.map((b) => b.code.toUpperCase())), [rows]);

    const onImported = (drafts: BusinessUnitImportDraft[]) => {
        let nid = Math.max(0, ...rows.map((b) => b.id));
        const added: BusinessUnit[] = drafts.map((d) => ({ ...d, id: ++nid }));
        setRows((prev) => [...prev, ...added]);
        bump();
    };

    const columns: DataTableColumn<BusinessUnit>[] = useMemo(
        () => [
            {
                id: 'name',
                header: 'Business unit',
                sticky: true,
                sortable: true,
                sortValue: (row) => row.name.toLowerCase(),
                minWidth: 220,
                render: (row) => (
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 text-sm font-bold text-slate-700 ring-1 ring-slate-200/80">
                            {row.name.charAt(0).toUpperCase()}
                        </div>
                        <button
                            type="button"
                            onClick={() => openEditModal(row)}
                            className="min-w-0 truncate text-left font-semibold text-slate-900 hover:text-[var(--cta-button-bg)] hover:underline"
                        >
                            {row.name}
                        </button>
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
                    <code className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">{row.code}</code>
                ),
            },
            {
                id: 'parentOrganizationName',
                header: 'Parent organization',
                sortable: true,
                sortValue: (row) => row.parentOrganizationName.toLowerCase(),
                minWidth: 180,
                render: (row) => <span className="text-slate-700">{row.parentOrganizationName}</span>,
            },
            {
                id: 'defaultProjectScope',
                header: 'Default project scope',
                sortable: true,
                sortValue: (row) => row.defaultProjectScope.join(',').toLowerCase(),
                minWidth: 180,
                render: (row) => (
                    <div className="flex flex-wrap gap-1">
                        {row.defaultProjectScope.map((scope) => (
                            <span
                                key={scope}
                                className="rounded-md border border-[color-mix(in_srgb,var(--cta-button-bg)_22%,#e2e8f0)] bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700"
                            >
                                {scope}
                            </span>
                        ))}
                    </div>
                ),
            },
            {
                id: 'createdDate',
                header: 'Created',
                sortable: true,
                sortValue: (row) => row.createdDate,
                minWidth: 110,
                render: (row) => <span className="tabular-nums text-slate-600">{row.createdDate}</span>,
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
                id: 'actions',
                header: '',
                sortable: false,
                minWidth: 100,
                headerClassName: 'w-[128px]',
                cellClassName: 'text-right',
                render: (row) => (
                    <BusinessUnitRowActionsMenu
                        bu={row}
                        onEdit={openEditModal}
                        onChangeStatus={handleChangeStatus}
                        onDelete={setDeleteOneTarget}
                    />
                ),
            },
        ],
        [openEditModal, handleChangeStatus],
    );

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Platform Foundation', href: '/platform/tenants' },
                    { label: 'Business Units', href: '/business-units' },
                ]}
            />

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Business units</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Enterprise directory — search, filter, saved views, import/export, same workspace patterns as Leads.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Button
                        type="button"
                        variant="company"
                        size="cta"
                        className={cn('gap-2', CTA_SHADOW_SOFT)}
                        onClick={openCreateModal}
                    >
                        <LuPlus size={18} />
                        Create business unit
                    </Button>
                </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="order-2 flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:order-1">
                    <div className="relative min-w-[200px] flex-1 max-w-xl">
                        <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Search name, code, parent, project scope…"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') setFilters((f) => ({ ...f, searchTerm: searchDraft }));
                            }}
                            className={cn(
                                'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white',
                                CTA_INPUT_FOCUS,
                            )}
                            aria-label="Search business units"
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
                            <div className="absolute right-0 top-[calc(100%+6px)] z-[300] w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</p>
                                <p className="px-3 pb-2 text-[10px] leading-snug text-slate-500">
                                    Key columns on by default — enable more below.
                                </p>
                                {BU_TABLE_DATA_COLUMN_IDS.map((id) => {
                                    const label =
                                        id === 'parentOrganizationName'
                                            ? 'Parent organization'
                                            : id === 'defaultProjectScope'
                                              ? 'Default project scope'
                                              : id === 'createdDate'
                                                ? 'Created date'
                                                : id === 'name'
                                                  ? 'Business unit'
                                                  : id.charAt(0).toUpperCase() + id.slice(1);
                                    return (
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
                                    onClick={() => runExportCsv(selectedIds.size ? 'business-units-selected.csv' : 'business-units-export.csv')}
                                >
                                    <LuDownload size={16} className="text-slate-400" />
                                    CSV
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={runExportExcel}
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
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="sm"
                            className="gap-1.5 bg-white"
                            onClick={() => setBulkStatusOpen(true)}
                        >
                            Status
                        </Button>
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="sm"
                            className="gap-1.5 bg-white"
                            onClick={() => downloadBusinessUnitsCsv(selectedRows, 'business-units-selected.csv')}
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

            <DataTable<BusinessUnit>
                columns={columns}
                data={paginated}
                getRowId={(row) => String(row.id)}
                sort={sort}
                onSortChange={setSort}
                columnVisibility={columnVisibility}
                columnWidths={columnWidths}
                onColumnWidthsChange={setColumnWidths}
                storageKey={TABLE_STORAGE_KEY}
                stickyColumnId="name"
                enableClientSort={false}
                emptyMessage="No business units match your filters. Adjust search or filters, or create a new unit."
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
                    label="business units"
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
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.statusFilter}
                                    onChange={(e) =>
                                        setFilters((f) => ({
                                            ...f,
                                            statusFilter: e.target.value as BusinessUnitsFilterPayload['statusFilter'],
                                        }))
                                    }
                                >
                                    <option value="All">All statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Parent organization</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.parentOrgFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, parentOrgFilter: e.target.value }))}
                                >
                                    <option value="All">All organizations</option>
                                    {companies.map((org) => (
                                        <option key={org.id} value={String(org.id)}>
                                            {org.name}
                                        </option>
                                    ))}
                                </select>
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
                <p className="mb-3 text-sm text-slate-600">
                    Save the current search and filter combination. Access it from this drawer or the Saved views entry in the global menu.
                </p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className={cn('mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)}
                    placeholder="e.g. Skyline · Active only"
                />
            </Modal>

            <Modal
                isOpen={!!deleteOneTarget}
                onClose={() => setDeleteOneTarget(null)}
                title="Delete business unit"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setDeleteOneTarget(null)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" className="bg-rose-600 hover:bg-rose-700" onClick={confirmDeleteOne}>
                            Delete
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Remove <span className="font-semibold text-slate-900">{deleteOneTarget?.name}</span>? This updates your local workspace
                    list only.
                </p>
            </Modal>

            <Modal
                isOpen={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                title="Delete selected business units"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setBulkDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" className="bg-rose-600 hover:bg-rose-700" onClick={confirmBulkDelete}>
                            Delete {selectedIds.size} unit(s)
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">Remove {selectedIds.size} selected unit(s) from the list?</p>
            </Modal>

            <Modal
                isOpen={bulkStatusOpen}
                onClose={() => setBulkStatusOpen(false)}
                title="Bulk status"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setBulkStatusOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={confirmBulkStatus}>
                            Update status
                        </Button>
                    </>
                }
            >
                <p className="mb-3 text-sm text-slate-600">Set status for {selectedIds.size} selected unit(s).</p>
                <label className="text-xs font-bold uppercase text-slate-400">Status</label>
                <select
                    className={`mt-1.5 ${selectClass}`}
                    value={bulkStatusPick}
                    onChange={(e) => setBulkStatusPick(e.target.value as 'Active' | 'Inactive')}
                >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </Modal>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title={editingBU ? 'Edit Business Unit' : 'Create Business Unit'}
                footer={
                    <div className="flex w-full justify-end gap-3">
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={handleSaveBU}>
                            {editingBU ? 'Update Business Unit' : 'Create Business Unit'}
                        </Button>
                    </div>
                }
            >
                <div className="custom-scrollbar max-h-[70vh] space-y-6 overflow-y-auto pr-2 transition-all duration-300">
                    <div className="space-y-4">
                        <div className="border-b border-slate-100 pb-2">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Business Unit Information</h4>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                                <label className="flex items-center justify-between text-sm font-semibold text-slate-700">
                                    Business Unit Name <span className="font-bold text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter business unit name (e.g. Hyderabad Division)"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={cn(
                                        'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm shadow-sm transition-all focus:bg-white',
                                        CTA_INPUT_FOCUS,
                                    )}
                                    maxLength={120}
                                />
                                <p className="text-[11px] text-slate-500">Division within organization. Maximum 120 characters.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex items-center justify-between text-sm font-semibold text-slate-700">
                                    Business Unit Code <span className="font-bold text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter unique code (e.g. HYD01)"
                                    value={formData.code}
                                    onChange={(e) =>
                                        setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })
                                    }
                                    className={cn(
                                        'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm tracking-wider shadow-sm transition-all focus:bg-white',
                                        CTA_INPUT_FOCUS,
                                    )}
                                />
                                <p className="text-[11px] text-slate-500">Unique identifier for business unit. No spaces allowed.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex items-center justify-between text-sm font-semibold text-slate-700">
                                    Parent Organization <span className="font-bold text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.parentOrganizationId}
                                    onChange={(e) => setFormData({ ...formData, parentOrganizationId: e.target.value })}
                                    className={cn(
                                        'w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm transition-all focus:bg-white',
                                        CTA_INPUT_FOCUS,
                                    )}
                                >
                                    <option value="">Select tenant/company</option>
                                    {companies.map((org) => (
                                        <option key={org.id} value={org.id}>
                                            {org.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-slate-500">Select tenant/company. Must exist in system.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="flex items-center justify-between text-sm font-semibold text-slate-700">
                                    Default Project Scope
                                </label>
                                <div className="space-y-2">
                                    <div className="flex min-h-[46px] flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
                                        {formData.defaultProjectScope.map((scope) => (
                                            <span
                                                key={scope}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-[var(--cta-button-bg)] transition-all"
                                            >
                                                {scope}
                                                <LuX
                                                    className="cursor-pointer hover:text-red-500"
                                                    size={12}
                                                    onClick={() =>
                                                        setFormData({
                                                            ...formData,
                                                            defaultProjectScope: formData.defaultProjectScope.filter((s) => s !== scope),
                                                        })
                                                    }
                                                />
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            placeholder="Type to add scope…"
                                            className="min-w-[120px] flex-1 border-none bg-transparent text-xs outline-none"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                                    const val = e.currentTarget.value.trim();
                                                    if (!formData.defaultProjectScope.includes(val)) {
                                                        setFormData({
                                                            ...formData,
                                                            defaultProjectScope: [...formData.defaultProjectScope, val],
                                                        });
                                                    }
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 underline decoration-slate-200 decoration-dotted">
                                        Accessible projects for the unit. Press Enter to add.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            <ImportBusinessUnitsModal
                isOpen={importOpen}
                onClose={() => setImportOpen(false)}
                onImported={onImported}
                existingCodes={existingCodes}
            />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </CompanyAdminDashboardLayout>
    );
}
