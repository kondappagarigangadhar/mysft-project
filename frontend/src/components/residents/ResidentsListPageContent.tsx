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
import { ImportResidentsModal } from '@/components/residents/ImportResidentsModal';
import { ResidentRowActionsMenu } from '@/components/residents/ResidentRowActionsMenu';
import { cn } from '@/lib/utils';
import {
    CTA_BULK_BAR,
    CTA_CHECKBOX_SM,
    CTA_INPUT_FOCUS,
    CTA_SHADOW_SOFT,
} from '@/lib/theme/ctaThemeClasses';
import { downloadResidentsCsv, openResidentsPrintReport } from '@/lib/exportResidentsCsv';
import { residentCreateHref, residentViewHref } from '@/lib/residentRoutes';
import type { Resident, ResidentStatusValue, ResidentType, ResidentUserRole } from '@/lib/residentStore';
import {
    RESIDENT_USER_ROLE_OPTIONS,
    RESIDENT_TYPE_OPTIONS,
    RESIDENT_STATUS_OPTIONS,
    normalizeResidentPhoneDigits,
    getResidents,
    archiveResident,
    deleteResidentPermanent,
    bulkArchiveResidents,
    bulkDeleteResidentsPermanent,
    bulkSetResidentStatus,
} from '@/lib/residentStore';
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
    LuChevronDown,
    LuColumns3,
    LuDownload,
    LuEllipsisVertical,
    LuFileText,
    LuFilter,
    LuPlus,
    LuSearch,
    LuTrash2,
    LuUpload,
    LuX,
} from 'react-icons/lu';

const ITEMS_PER_PAGE = 10;
const TABLE_STORAGE_KEY = 'arris-residents-table-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-residents-saved-views';

const RESIDENT_TABLE_DATA_COLUMN_IDS = [
    'residentId',
    'fullName',
    'residentType',
    'phoneNumber',
    'email',
    'propertyUnit',
    'moveInDate',
    'residentStatus',
    'userRole',
    'portalAccess',
    'accessExpiry',
] as const;

const RESIDENT_TABLE_DEFAULT_ON = new Set<string>([...RESIDENT_TABLE_DATA_COLUMN_IDS, 'actions']);

export type ResidentsFilterPayload = {
    searchTerm: string;
    typeFilter: 'All' | ResidentType;
    statusFilter: 'All' | ResidentStatusValue;
    portalFilter: 'All' | 'Enabled' | 'Disabled';
    roleFilter: 'All' | ResidentUserRole;
};

type SavedView = { id: string; name: string; payload: ResidentsFilterPayload };

function defaultFilters(): ResidentsFilterPayload {
    return {
        searchTerm: '',
        typeFilter: 'All',
        statusFilter: 'All',
        portalFilter: 'All',
        roleFilter: 'All',
    };
}

function sortResidentsList(rows: Resident[], sort: DataTableSortState): Resident[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'residentId':
                va = a.residentCode.toLowerCase();
                vb = b.residentCode.toLowerCase();
                break;
            case 'fullName':
                va = a.fullName.toLowerCase();
                vb = b.fullName.toLowerCase();
                break;
            case 'residentType':
                va = a.residentType;
                vb = b.residentType;
                break;
            case 'phoneNumber':
                va = normalizeResidentPhoneDigits(a.phoneNumber);
                vb = normalizeResidentPhoneDigits(b.phoneNumber);
                break;
            case 'email':
                va = a.email.toLowerCase();
                vb = b.email.toLowerCase();
                break;
            case 'propertyUnit':
                va = (a.propertyUnit || '').toLowerCase();
                vb = (b.propertyUnit || '').toLowerCase();
                break;
            case 'moveInDate':
                va = a.moveInDate;
                vb = b.moveInDate;
                break;
            case 'residentStatus':
                va = a.residentStatus;
                vb = b.residentStatus;
                break;
            case 'userRole':
                va = a.userRole;
                vb = b.userRole;
                break;
            case 'portalAccess':
                va = a.portalAccessEnabled ? 1 : 0;
                vb = b.portalAccessEnabled ? 1 : 0;
                break;
            case 'accessExpiry':
                va = a.accessExpiryDate;
                vb = b.accessExpiryDate;
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

function typeBadgeClass(t: ResidentType) {
    if (t === 'Owner') return 'bg-orange-100 text-orange-900';
    if (t === 'Tenant') return 'bg-[color-mix(in_srgb,var(--cta-button-bg)_18%,white)] text-slate-900';
    return 'bg-violet-100 text-violet-900';
}

function statusTone(s: ResidentStatusValue) {
    if (s === 'Active') return 'bg-emerald-100 text-emerald-900';
    if (s === 'Inactive') return 'bg-slate-200 text-slate-900';
    return 'bg-amber-100 text-amber-950';
}

export function ResidentsListPageContent() {
    const pathname = usePathname() ?? '';
    const router = useRouter();
    const searchParams = useSearchParams();
    const globalViewsTick = useGlobalSavedViewsSync();
    const [listVersion, setListVersion] = useState(0);
    const allRows = useMemo(() => {
        void listVersion;
        return getResidents();
    }, [listVersion]);

    const [filters, setFilters] = useState<ResidentsFilterPayload>(() => defaultFilters());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [searchDraft, setSearchDraft] = useState('');

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Residents', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedView[] => {
        void globalViewsTick;
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as ResidentsFilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const p = f as Partial<ResidentsFilterPayload>;
        setFilters({ ...defaultFilters(), ...p });
        setSearchDraft(String(p.searchTerm ?? ''));
    });

    useEffect(() => {
        const t = window.setTimeout(() => {
            setFilters((f) => (f.searchTerm === searchDraft ? f : { ...f, searchTerm: searchDraft }));
        }, 320);
        return () => window.clearTimeout(t);
    }, [searchDraft]);

    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'moveInDate', direction: 'desc' });
    const [importOpen, setImportOpen] = useState(false);
    useEffect(() => {
        if (searchParams.get('import') !== '1') return;
        setImportOpen(true);
        const next = new URLSearchParams(searchParams.toString());
        next.delete('import');
        const q = next.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }, [searchParams, router, pathname]);

    const [deleteTarget, setDeleteTarget] = useState<Resident | null>(null);
    const [archiveTarget, setArchiveTarget] = useState<Resident | null>(null);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [bulkToolbarOpen, setBulkToolbarOpen] = useState(false);
    const bulkToolbarRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const headerExportRef = useRef<HTMLDivElement>(null);
    const [headerExportOpen, setHeaderExportOpen] = useState(false);
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const allIds = [...RESIDENT_TABLE_DATA_COLUMN_IDS, 'actions'] as string[];
        return Object.fromEntries(allIds.map((id) => [id, RESIDENT_TABLE_DEFAULT_ON.has(id)])) as Record<string, boolean>;
    });
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        residentId: 120,
        fullName: 200,
        residentType: 120,
        phoneNumber: 120,
        email: 200,
        propertyUnit: 200,
        moveInDate: 120,
        residentStatus: 120,
        userRole: 140,
        portalAccess: 130,
        accessExpiry: 120,
        actions: 128,
    });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, listVersion, sort]);

    useEffect(() => {
        if (!exportMenuOpen && !headerExportOpen) return;
        const onDown = (e: MouseEvent) => {
            const t = e.target as Node;
            if (exportMenuRef.current?.contains(t) || headerExportRef.current?.contains(t)) return;
            setExportMenuOpen(false);
            setHeaderExportOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [exportMenuOpen, headerExportOpen]);

    useEffect(() => {
        if (!columnMenuOpen) return;
        const onDown = (e: MouseEvent) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) setColumnMenuOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [columnMenuOpen]);

    useEffect(() => {
        if (!bulkToolbarOpen) return;
        const onDown = (e: MouseEvent) => {
            if (bulkToolbarRef.current && !bulkToolbarRef.current.contains(e.target as Node)) setBulkToolbarOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [bulkToolbarOpen]);

    const bump = useCallback(() => {
        setListVersion((v) => v + 1);
        setSelectedIds(new Set());
    }, []);

    const filtered = useMemo(() => {
        const st = filters.searchTerm.trim().toLowerCase();
        return allRows.filter((r) => {
            const matchSearch =
                !st ||
                r.fullName.toLowerCase().includes(st) ||
                r.email.toLowerCase().includes(st) ||
                normalizeResidentPhoneDigits(r.phoneNumber).includes(st.replace(/\D/g, '')) ||
                (r.propertyUnit || '').toLowerCase().includes(st) ||
                r.residentCode.toLowerCase().includes(st);
            const matchType = filters.typeFilter === 'All' || r.residentType === filters.typeFilter;
            const matchStatus = filters.statusFilter === 'All' || r.residentStatus === filters.statusFilter;
            const matchPortal =
                filters.portalFilter === 'All'
                    ? true
                    : filters.portalFilter === 'Enabled'
                      ? r.portalAccessEnabled
                      : !r.portalAccessEnabled;
            const matchRole = filters.roleFilter === 'All' || r.userRole === filters.roleFilter;
            return matchSearch && matchType && matchStatus && matchPortal && matchRole;
        });
    }, [allRows, filters]);

    const sorted = useMemo(() => sortResidentsList(filtered, sort), [filtered, sort]);
    const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
    const pageRows = useMemo(() => sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [sorted, currentPage]);

    const selectClass = cn('h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800', CTA_INPUT_FOCUS);

    const hasActiveFilters =
        filters.searchTerm.trim() !== '' ||
        filters.typeFilter !== 'All' ||
        filters.statusFilter !== 'All' ||
        filters.portalFilter !== 'All' ||
        filters.roleFilter !== 'All';

    const persistSavedViews = (views: SavedView[]) => {
        replaceViewsForRoute(
            pathname,
            'Residents',
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

    const selectedRows = useMemo(() => sorted.filter((r) => selectedIds.has(r.slug)), [sorted, selectedIds]);

    const exportRowsForScope = () => (selectedIds.size ? selectedRows : sorted);

    const runExportCsv = (filename: string) => {
        downloadResidentsCsv(exportRowsForScope(), filename);
        setExportMenuOpen(false);
        setHeaderExportOpen(false);
    };

    const runExportPdf = () => {
        const rows = exportRowsForScope();
        const scope = selectedIds.size ? 'Selected residents' : 'Residents export';
        openResidentsPrintReport(rows, `${scope} · ${rows.length} record(s)`);
        setExportMenuOpen(false);
        setHeaderExportOpen(false);
    };

    const columns: DataTableColumn<Resident>[] = useMemo(
        () => [
            {
                id: 'residentId',
                header: 'Resident ID',
                sticky: true,
                sortable: true,
                sortValue: (row) => row.residentCode.toLowerCase(),
                minWidth: 120,
                render: (row) => <span className="font-mono text-xs font-semibold text-slate-800">{row.residentCode}</span>,
            },
            {
                id: 'fullName',
                header: 'Full Name',
                sticky: true,
                sortable: true,
                sortValue: (row) => row.fullName.toLowerCase(),
                minWidth: 200,
                render: (row) => (
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 text-sm font-bold text-slate-700 ring-1 ring-slate-200/80">
                            {row.fullName.charAt(0).toUpperCase()}
                        </div>
                        <Link
                            href={residentViewHref(row.slug)}
                            className="min-w-0 truncate font-semibold text-slate-900 hover:text-[var(--cta-button-bg)] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {row.fullName}
                        </Link>
                    </div>
                ),
            },
            {
                id: 'residentType',
                header: 'Resident Type',
                sortable: true,
                sortValue: (row) => row.residentType,
                minWidth: 120,
                render: (row) => (
                    <span className={cn('rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide', typeBadgeClass(row.residentType))}>
                        {row.residentType}
                    </span>
                ),
            },
            {
                id: 'phoneNumber',
                header: 'Phone Number',
                sortable: true,
                sortValue: (row) => normalizeResidentPhoneDigits(row.phoneNumber),
                minWidth: 120,
                render: (row) => {
                    const d = normalizeResidentPhoneDigits(row.phoneNumber);
                    const display = d.length >= 10 ? `${d.slice(0, 5)} ${d.slice(5, 10)}` : row.phoneNumber.trim() || '—';
                    return (
                        <a
                            href={d.length >= 10 ? `tel:${d}` : undefined}
                            className={cn(
                                'tabular-nums text-sm',
                                d.length >= 10 ? 'text-slate-800 hover:text-[var(--cta-button-bg)]' : 'text-slate-500',
                            )}
                            onClick={(e) => d.length < 10 && e.preventDefault()}
                        >
                            {display}
                        </a>
                    );
                },
            },
            {
                id: 'email',
                header: 'Email',
                sortable: true,
                sortValue: (row) => row.email.toLowerCase(),
                minWidth: 190,
                render: (row) => (
                    <a href={`mailto:${row.email}`} className="block max-w-[220px] truncate text-slate-700 hover:text-[var(--cta-button-bg)]" onClick={(e) => e.stopPropagation()}>
                        {row.email || '—'}
                    </a>
                ),
            },
            {
                id: 'propertyUnit',
                header: 'Property / Unit Number',
                sortable: true,
                sortValue: (row) => (row.propertyUnit || '').toLowerCase(),
                minWidth: 200,
                render: (row) => (
                    <span className="line-clamp-2 max-w-[220px] text-slate-700" title={row.propertyUnit}>
                        {row.propertyUnit?.trim() || '—'}
                    </span>
                ),
            },
            {
                id: 'moveInDate',
                header: 'Move-in Date',
                sortable: true,
                sortValue: (row) => row.moveInDate,
                minWidth: 120,
                render: (row) => <span className="tabular-nums text-slate-700">{formatYmdDisplay(row.moveInDate)}</span>,
            },
            {
                id: 'residentStatus',
                header: 'Resident Status',
                sortable: true,
                sortValue: (row) => row.residentStatus,
                minWidth: 125,
                render: (row) => (
                    <span className={cn('rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide', statusTone(row.residentStatus))}>
                        {row.residentStatus}
                    </span>
                ),
            },
            {
                id: 'userRole',
                header: 'User Role',
                sortable: true,
                sortValue: (row) => row.userRole,
                minWidth: 135,
                render: (row) => (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {row.userRole}
                    </span>
                ),
            },
            {
                id: 'portalAccess',
                header: 'Portal Access Enabled',
                sortable: true,
                sortValue: (row) => (row.portalAccessEnabled ? 1 : 0),
                minWidth: 144,
                render: (row) => (
                    <span className={cn('text-xs font-semibold tabular-nums', row.portalAccessEnabled ? 'text-emerald-800' : 'text-slate-500')}>
                        {row.portalAccessEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                ),
            },
            {
                id: 'accessExpiry',
                header: 'Access Expiry Date',
                sortable: true,
                sortValue: (row) => row.accessExpiryDate,
                minWidth: 120,
                render: (row) => <span className="tabular-nums text-slate-700">{formatYmdDisplay(row.accessExpiryDate)}</span>,
            },
            {
                id: 'actions',
                header: '',
                sortable: false,
                stickyEnd: true,
                minWidth: 112,
                headerClassName: 'w-[128px]',
                cellClassName: 'text-right bg-white shadow-[-8px_0_12px_-8px_rgba(15,23,42,0.08)]',
                render: (row) => (
                    <ResidentRowActionsMenu
                        resident={row}
                        onArchive={(r) => setArchiveTarget(r)}
                        onDelete={(r) => setDeleteTarget(r)}
                        onCloseParent={() => setSelectedIds(new Set())}
                    />
                ),
            },
        ],
        [],
    );

    const [bulkStatusPick, setBulkStatusPick] = useState<ResidentStatusValue>('Active');
    const [bulkChangeStatusOpen, setBulkChangeStatusOpen] = useState(false);
    const [bulkArchiveOpen, setBulkArchiveOpen] = useState(false);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const confirmBulkChangeStatus = () => {
        if (!selectedIds.size) return;
        bulkSetResidentStatus([...selectedIds], bulkStatusPick);
        setBulkChangeStatusOpen(false);
        setBulkToolbarOpen(false);
        bump();
    };

    const confirmBulkArchive = () => {
        if (!selectedIds.size) return;
        bulkArchiveResidents([...selectedIds]);
        setBulkArchiveOpen(false);
        setBulkToolbarOpen(false);
        bump();
    };

    const confirmBulkDelete = () => {
        if (!selectedIds.size) return;
        bulkDeleteResidentsPermanent([...selectedIds]);
        setBulkDeleteOpen(false);
        setBulkToolbarOpen(false);
        bump();
    };

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Platform Foundation', href: '/platform/tenants' },
                    { label: 'Resident & Community Management', href: '/platform/community/residents' },
                    { label: 'Resident Management' },
                ]}
            />

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Resident Management</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Manage resident onboarding, access control, documents, and occupancy details.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Link href={residentCreateHref()}>
                        <Button variant="company" size="cta" className={cn('gap-2', CTA_SHADOW_SOFT)}>
                            <LuPlus size={18} />
                            Add resident
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
                            placeholder="Search resident, unit number, email, or phone..."
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') setFilters((f) => ({ ...f, searchTerm: searchDraft }));
                            }}
                            className={cn(
                                'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white',
                                CTA_INPUT_FOCUS,
                            )}
                            aria-label="Search residents"
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
                            <div className="absolute right-0 top-[calc(100%+6px)] z-[300] w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</p>
                                {RESIDENT_TABLE_DATA_COLUMN_IDS.map((id) => {
                                    const labelMap: Record<string, string> = {
                                        residentId: 'Resident ID',
                                        fullName: 'Full name',
                                        residentType: 'Resident type',
                                        phoneNumber: 'Phone number',
                                        email: 'Email',
                                        propertyUnit: 'Property / unit number',
                                        moveInDate: 'Move-in date',
                                        residentStatus: 'Resident status',
                                        userRole: 'User role',
                                        portalAccess: 'Portal access enabled',
                                        accessExpiry: 'Access expiry date',
                                    };
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
                                            {labelMap[id]}
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
                            <div className="absolute right-0 top-[calc(100%+6px)] z-[300] w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() => runExportCsv(selectedIds.size ? 'residents-selected.csv' : 'residents-export.csv')}
                                >
                                    <LuDownload size={16} className="text-slate-400" />
                                    CSV
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() => {
                                        downloadResidentsCsv(exportRowsForScope(), 'residents-excel.csv');
                                        setExportMenuOpen(false);
                                    }}
                                >
                                    <LuFileText size={16} className="text-slate-400" />
                                    Excel (UTF-8 CSV)
                                </button>
                                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={runExportPdf}>
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
                        <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={() => downloadResidentsCsv(selectedRows, 'residents-selected.csv')}>
                            <LuDownload size={16} />
                            Export selected
                        </Button>
                        <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={() => setBulkChangeStatusOpen(true)}>
                            Change status
                        </Button>
                        <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={() => setBulkArchiveOpen(true)}>
                            Archive
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

            <DataTable<Resident>
                columns={columns}
                data={pageRows}
                getRowId={(row) => row.slug}
                sort={sort}
                onSortChange={setSort}
                columnVisibility={columnVisibility}
                columnWidths={columnWidths}
                onColumnWidthsChange={setColumnWidths}
                storageKey={TABLE_STORAGE_KEY}
                stickyColumnId="fullName"
                enableClientSort={false}
                stickyHeader
                emptyMessage="No residents match your filters. Adjust search or filters, or add a resident."
                selection={{
                    rowKey: 'slug',
                    selectedIds,
                    onSelectedIdsChange: setSelectedIds,
                }}
                onRowClick={(row) => router.push(residentViewHref(row.slug))}
            />

            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={sorted.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    label="residents"
                />
            </div>

            {drawerOpen ? (
                <>
                    <button type="button" className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]" aria-label="Close filters" onClick={() => setDrawerOpen(false)} />
                    <aside
                        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
                        role="dialog"
                        aria-label="Resident filters"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-bold text-slate-900">Advanced filters</h2>
                            <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" onClick={() => setDrawerOpen(false)}>
                                <LuX size={20} />
                            </button>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resident Type</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.typeFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, typeFilter: e.target.value as ResidentsFilterPayload['typeFilter'] }))}
                                >
                                    <option value="All">All types</option>
                                    {RESIDENT_TYPE_OPTIONS.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resident Status</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.statusFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, statusFilter: e.target.value as ResidentsFilterPayload['statusFilter'] }))}
                                >
                                    <option value="All">All statuses</option>
                                    {RESIDENT_STATUS_OPTIONS.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Portal Access Enabled</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.portalFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, portalFilter: e.target.value as ResidentsFilterPayload['portalFilter'] }))}
                                >
                                    <option value="All">All</option>
                                    <option value="Enabled">Enabled</option>
                                    <option value="Disabled">Disabled</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">User Role</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.roleFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, roleFilter: e.target.value as ResidentsFilterPayload['roleFilter'] }))}
                                >
                                    <option value="All">All roles</option>
                                    {RESIDENT_USER_ROLE_OPTIONS.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
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
                <p className="mb-3 text-sm text-slate-600">Save the current search and filter combination for quick recall across admin pages.</p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className={cn('mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)}
                    placeholder="e.g. Active owners · Portal on"
                />
            </Modal>

            <Modal
                isOpen={!!archiveTarget}
                onClose={() => setArchiveTarget(null)}
                title="Archive resident"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setArchiveTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            className="bg-rose-600 hover:bg-rose-700"
                            onClick={() => {
                                if (archiveTarget) archiveResident(archiveTarget.slug);
                                setArchiveTarget(null);
                                bump();
                            }}
                        >
                            Archive
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Archive <span className="font-semibold text-slate-900">{archiveTarget?.fullName}</span>? This removes the resident from your active list.
                </p>
            </Modal>

            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Delete resident"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            className="bg-rose-600 hover:bg-rose-700"
                            onClick={() => {
                                if (deleteTarget) deleteResidentPermanent(deleteTarget.slug);
                                setDeleteTarget(null);
                                bump();
                            }}
                        >
                            Delete permanently
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Permanently delete <span className="font-semibold text-slate-900">{deleteTarget?.fullName}</span>? This cannot be undone in the demo store.
                </p>
            </Modal>

            <Modal
                isOpen={bulkChangeStatusOpen}
                onClose={() => setBulkChangeStatusOpen(false)}
                title="Change status"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setBulkChangeStatusOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={confirmBulkChangeStatus} disabled={!selectedIds.size}>
                            Apply
                        </Button>
                    </>
                }
            >
                <label className="text-xs font-bold uppercase text-slate-400">Resident status</label>
                <select className={cn('mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)} value={bulkStatusPick} onChange={(e) => setBulkStatusPick(e.target.value as ResidentStatusValue)}>
                    {RESIDENT_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
                <p className="mt-3 text-sm text-slate-600">{selectedIds.size} record(s) will be updated.</p>
            </Modal>

            <Modal
                isOpen={bulkArchiveOpen}
                onClose={() => setBulkArchiveOpen(false)}
                title="Archive selected"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setBulkArchiveOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" className="bg-rose-600 hover:bg-rose-700" onClick={confirmBulkArchive}>
                            Archive
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">Archive {selectedIds.size} resident(s)? They will be removed from the active list.</p>
            </Modal>

            <Modal
                isOpen={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                title="Delete selected"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setBulkDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" className="bg-rose-600 hover:bg-rose-700" onClick={confirmBulkDelete}>
                            Delete permanently
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">Permanently delete {selectedIds.size} resident(s)? This cannot be undone in the demo store.</p>
            </Modal>

            <ImportResidentsModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImported={bump} />
        </CompanyAdminDashboardLayout>
    );
}
