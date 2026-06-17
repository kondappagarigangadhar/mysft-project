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
import { ImportUsersModal } from '@/components/users/ImportUsersModal';
import { UserRowActionsMenu } from '@/components/users/UserRowActionsMenu';
import StatusBadge from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import {
    CTA_BULK_BAR,
    CTA_CHECKBOX_SM,
    CTA_INPUT_FOCUS,
    CTA_SHADOW_SOFT,
} from '@/lib/theme/ctaThemeClasses';
import { downloadUsersCsv, openUsersPrintReport } from '@/lib/exportUsersCsv';
import {
    DEFAULT_SAVED_VIEW_AUTHOR,
    importLegacyLocalSavedViewsOnce,
    loadGlobalSavedViews,
    normalizeSavedViewRoute,
    replaceViewsForRoute,
} from '@/lib/globalSavedViewsStore';
import { useConsumePendingSavedView } from '@/hooks/useConsumePendingSavedView';
import { useGlobalSavedViewsSync } from '@/hooks/useGlobalSavedViewsSync';
import type { User } from '@/data/mockData';
import { addUserRecord, companies, deleteUserRecord, getUsers, updateUserRecord } from '@/data/mockData';
import { userCreateHref, userViewHref } from '@/lib/userRoutes';
import { enrichUserRecord, permissionLabel } from '@/lib/userPermissions';
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
const TABLE_STORAGE_KEY = 'arris-users-table-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-users-saved-views';

const USER_TABLE_DATA_COLUMN_IDS = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'designation',
    'role',
    'department',
    'status',
    'roleName',
    'roleDescription',
    'permissions',
] as const;

const USER_COLUMN_LABELS: Record<(typeof USER_TABLE_DATA_COLUMN_IDS)[number], string> = {
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone Number',
    designation: 'Designation',
    role: 'Role',
    department: 'Department',
    status: 'Status',
    roleName: 'Role Name',
    roleDescription: 'Role Description',
    permissions: 'Permission List',
};

const USER_TABLE_DEFAULT_ON = new Set<string>([
    ...USER_TABLE_DATA_COLUMN_IDS,
    'actions',
]);

export type UsersFilterPayload = {
    searchTerm: string;
    roleFilter: 'All' | string;
    statusFilter: 'All' | string;
    departmentFilter: 'All' | string;
    tenantFilter: 'All' | string;
    dateFrom: string;
    dateTo: string;
};

type SavedView = { id: string; name: string; payload: UsersFilterPayload };

const defaultFilters = (): UsersFilterPayload => ({
    searchTerm: '',
    roleFilter: 'All',
    statusFilter: 'All',
    departmentFilter: 'All',
    tenantFilter: 'All',
    dateFrom: '',
    dateTo: '',
});

function sortUsers(rows: User[], sort: DataTableSortState): User[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'firstName':
                va = a.firstName.toLowerCase();
                vb = b.firstName.toLowerCase();
                break;
            case 'lastName':
                va = a.lastName.toLowerCase();
                vb = b.lastName.toLowerCase();
                break;
            case 'email':
                va = a.email.toLowerCase();
                vb = b.email.toLowerCase();
                break;
            case 'phone':
                va = a.phoneNumber.replace(/\D/g, '');
                vb = b.phoneNumber.replace(/\D/g, '');
                break;
            case 'designation':
                va = (a.designation ?? '').toLowerCase();
                vb = (b.designation ?? '').toLowerCase();
                break;
            case 'role':
                va = a.role.toLowerCase();
                vb = b.role.toLowerCase();
                break;
            case 'department':
                va = a.department.toLowerCase();
                vb = b.department.toLowerCase();
                break;
            case 'status':
                va = a.status;
                vb = b.status;
                break;
            case 'roleName':
                va = (a.roleName ?? a.role).toLowerCase();
                vb = (b.roleName ?? b.role).toLowerCase();
                break;
            case 'roleDescription':
                va = (a.roleDescription ?? '').toLowerCase();
                vb = (b.roleDescription ?? '').toLowerCase();
                break;
            case 'permissions':
                va = (a.permissions ?? []).join(',');
                vb = (b.permissions ?? []).join(',');
                break;
            default:
                return 0;
        }
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

export function UsersListPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname() ?? '';
    const globalViewsTick = useGlobalSavedViewsSync();
    const [listVersion, setListVersion] = useState(0);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const rows = useMemo(() => {
        void listVersion;
        return getUsers().map(enrichUserRecord);
    }, [listVersion]);

    const bump = useCallback(() => {
        setListVersion((v) => v + 1);
        setSelectedIds(new Set());
    }, []);

    const [filters, setFilters] = useState<UsersFilterPayload>(() => defaultFilters());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [searchDraft, setSearchDraft] = useState('');

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Users', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedView[] => {
        void globalViewsTick;
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as UsersFilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const p = f as Partial<UsersFilterPayload>;
        setFilters({ ...defaultFilters(), ...p });
        setSearchDraft(String(p.searchTerm ?? ''));
    });

    useEffect(() => {
        const t = window.setTimeout(() => {
            setFilters((f) => (f.searchTerm === searchDraft ? f : { ...f, searchTerm: searchDraft }));
        }, 320);
        return () => window.clearTimeout(t);
    }, [searchDraft]);

    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'lastName', direction: 'asc' });
    const [importOpen, setImportOpen] = useState(false);

    useEffect(() => {
        if (searchParams.get('import') !== '1') return;
        setImportOpen(true);
        const next = new URLSearchParams(searchParams.toString());
        next.delete('import');
        const q = next.toString();
        router.replace(q ? `/platform/users?${q}` : '/platform/users', { scroll: false });
    }, [searchParams, router]);

    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
    const [bulkStatusPick, setBulkStatusPick] = useState<User['status']>('Active');
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const allIds = [...USER_TABLE_DATA_COLUMN_IDS, 'actions' as const];
        return Object.fromEntries(allIds.map((id) => [id, USER_TABLE_DEFAULT_ON.has(id)])) as Record<string, boolean>;
    });

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        firstName: 120,
        lastName: 120,
        email: 200,
        phone: 120,
        designation: 140,
        role: 110,
        department: 130,
        status: 100,
        roleName: 140,
        roleDescription: 180,
        permissions: 200,
        actions: 128,
    });

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

    const roleOptions = useMemo(() => {
        const s = new Set<string>();
        rows.forEach((u) => s.add(u.role));
        return Array.from(s).sort();
    }, [rows]);

    const deptOptions = useMemo(() => {
        const s = new Set<string>();
        rows.forEach((u) => s.add(u.department));
        return Array.from(s).sort();
    }, [rows]);

    const filtered = useMemo(() => {
        const st = filters.searchTerm.trim().toLowerCase();
        return rows.filter((u) => {
            const matchesSearch =
                !st ||
                u.firstName.toLowerCase().includes(st) ||
                u.lastName.toLowerCase().includes(st) ||
                u.name.toLowerCase().includes(st) ||
                u.email.toLowerCase().includes(st) ||
                u.phoneNumber.toLowerCase().includes(st) ||
                (u.designation ?? '').toLowerCase().includes(st) ||
                u.role.toLowerCase().includes(st) ||
                (u.roleName ?? '').toLowerCase().includes(st) ||
                u.department.toLowerCase().includes(st);
            const matchesRole = filters.roleFilter === 'All' || u.role === filters.roleFilter;
            const matchesStatus = filters.statusFilter === 'All' || u.status === filters.statusFilter;
            const matchesDept = filters.departmentFilter === 'All' || u.department === filters.departmentFilter;
            const matchesTenant = filters.tenantFilter === 'All' || u.tenantId.toString() === filters.tenantFilter;
            const ymd = (u.joined || '').slice(0, 10);
            const matchesFrom = !filters.dateFrom || !ymd || ymd >= filters.dateFrom;
            const matchesTo = !filters.dateTo || !ymd || ymd <= filters.dateTo;
            return matchesSearch && matchesRole && matchesStatus && matchesDept && matchesTenant && matchesFrom && matchesTo;
        });
    }, [rows, filters]);

    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sort]);

    const sortedFiltered = useMemo(() => sortUsers(filtered, sort), [filtered, sort]);

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
        filters.roleFilter !== 'All' ||
        filters.statusFilter !== 'All' ||
        filters.departmentFilter !== 'All' ||
        filters.tenantFilter !== 'All' ||
        filters.dateFrom !== '' ||
        filters.dateTo !== '';

    const persistSavedViews = (views: SavedView[]) => {
        replaceViewsForRoute(
            pathname,
            'Users',
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
        () => sortedFiltered.filter((u) => selectedIds.has(String(u.id))),
        [sortedFiltered, selectedIds],
    );

    const exportRowsForScope = () => {
        if (selectedIds.size) return selectedRows;
        return sortedFiltered;
    };

    const runExportCsv = (filename: string) => {
        downloadUsersCsv(exportRowsForScope(), filename);
        setExportMenuOpen(false);
    };

    const runExportExcel = () => {
        downloadUsersCsv(exportRowsForScope(), 'users-export-excel.csv');
        setExportMenuOpen(false);
    };

    const runExportPdf = () => {
        const r = exportRowsForScope();
        const scope = selectedIds.size ? 'Selected users' : 'Users export';
        openUsersPrintReport(r, `${scope} · ${r.length} record(s)`);
        setExportMenuOpen(false);
    };

    const confirmBulkDelete = () => {
        selectedIds.forEach((id) => deleteUserRecord(Number(id)));
        setBulkDeleteOpen(false);
        bump();
    };

    const confirmBulkStatus = () => {
        selectedIds.forEach((id) =>
            updateUserRecord(Number(id), { status: bulkStatusPick, updatedDate: new Date().toISOString().slice(0, 10) }),
        );
        setBulkStatusOpen(false);
        bump();
    };

    const existingEmails = useMemo(() => new Set(rows.map((u) => u.email.trim().toLowerCase())), [rows]);

    const onImported = (drafts: Omit<User, 'id'>[]) => {
        drafts.forEach((d) => addUserRecord(d));
        bump();
    };

    const columns: DataTableColumn<User>[] = useMemo(
        () => [
            {
                id: 'firstName',
                header: 'First Name',
                sticky: true,
                sortable: true,
                sortValue: (row) => row.firstName.toLowerCase(),
                minWidth: 120,
                render: (row) => (
                    <Link
                        href={userViewHref(row.id)}
                        className="font-semibold text-slate-900 hover:text-[var(--cta-button-bg)] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {row.firstName}
                    </Link>
                ),
            },
            {
                id: 'lastName',
                header: 'Last Name',
                sortable: true,
                sortValue: (row) => row.lastName.toLowerCase(),
                minWidth: 120,
                render: (row) => (
                    <Link
                        href={userViewHref(row.id)}
                        className="font-medium text-slate-800 hover:text-[var(--cta-button-bg)] hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {row.lastName}
                    </Link>
                ),
            },
            {
                id: 'email',
                header: 'Email',
                sortable: true,
                sortValue: (row) => row.email.toLowerCase(),
                minWidth: 180,
                render: (row) => (
                    <a href={`mailto:${row.email}`} className="truncate text-slate-700 hover:text-[var(--cta-button-bg)] hover:underline" onClick={(e) => e.stopPropagation()}>
                        {row.email}
                    </a>
                ),
            },
            {
                id: 'phone',
                header: 'Phone Number',
                sortable: true,
                sortValue: (row) => row.phoneNumber.replace(/\D/g, ''),
                minWidth: 110,
                render: (row) => <span className="tabular-nums text-slate-700">{row.phoneNumber}</span>,
            },
            {
                id: 'designation',
                header: 'Designation',
                sortable: true,
                sortValue: (row) => (row.designation ?? '').toLowerCase(),
                minWidth: 130,
                render: (row) => <span className="text-slate-700">{row.designation || '—'}</span>,
            },
            {
                id: 'role',
                header: 'Role',
                sortable: true,
                sortValue: (row) => row.role.toLowerCase(),
                minWidth: 110,
                render: (row) => <span className="text-slate-700">{row.role}</span>,
            },
            {
                id: 'department',
                header: 'Department',
                sortable: true,
                sortValue: (row) => row.department.toLowerCase(),
                minWidth: 120,
                render: (row) => <span className="text-slate-700">{row.department}</span>,
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
                id: 'roleName',
                header: 'Role Name',
                sortable: true,
                sortValue: (row) => (row.roleName ?? row.role).toLowerCase(),
                minWidth: 130,
                render: (row) => <span className="text-slate-700">{row.roleName || row.role}</span>,
            },
            {
                id: 'roleDescription',
                header: 'Role Description',
                sortable: true,
                sortValue: (row) => (row.roleDescription ?? '').toLowerCase(),
                minWidth: 160,
                render: (row) => (
                    <span className="line-clamp-2 text-slate-600" title={row.roleDescription}>
                        {row.roleDescription || '—'}
                    </span>
                ),
            },
            {
                id: 'permissions',
                header: 'Permission List',
                sortable: true,
                sortValue: (row) => (row.permissions ?? []).join(','),
                minWidth: 180,
                render: (row) => {
                    const perms = row.permissions ?? [];
                    if (!perms.length) return <span className="text-slate-400">—</span>;
                    const shown = perms.slice(0, 2).map(permissionLabel).join(', ');
                    const more = perms.length > 2 ? ` +${perms.length - 2}` : '';
                    return (
                        <span className="text-slate-700" title={perms.map(permissionLabel).join(', ')}>
                            {shown}
                            {more}
                        </span>
                    );
                },
            },
            {
                id: 'actions',
                header: '',
                sortable: false,
                minWidth: 100,
                headerClassName: 'w-[128px]',
                cellClassName: 'text-right',
                render: (row) => <UserRowActionsMenu user={row} onBump={bump} />,
            },
        ],
        [bump],
    );

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Platform Foundation', href: '/platform/tenants' },
                    { label: 'Users', href: '/platform/users' },
                ]}
            />

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Users</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Enterprise directory — same workspace patterns as Leads (search, columns, filters, saved views, import/export).
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Link href={userCreateHref()}>
                        <Button type="button" variant="company" size="cta" className={cn('gap-2', CTA_SHADOW_SOFT)}>
                            <LuPlus size={18} />
                            Create user
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
                            placeholder="Search name, email, phone, role, department, tenant…"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') setFilters((f) => ({ ...f, searchTerm: searchDraft }));
                            }}
                            className={cn(
                                'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white',
                                CTA_INPUT_FOCUS,
                            )}
                            aria-label="Search users"
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
                                {USER_TABLE_DATA_COLUMN_IDS.map((id) => {
                                    const label =
                                        id in USER_COLUMN_LABELS
                                            ? USER_COLUMN_LABELS[id as keyof typeof USER_COLUMN_LABELS]
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
                                    onClick={() => runExportCsv(selectedIds.size ? 'users-selected.csv' : 'users-export.csv')}
                                >
                                    <LuDownload size={16} className="text-slate-400" />
                                    CSV
                                </button>
                                <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" onClick={runExportExcel}>
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
                        <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={() => setBulkStatusOpen(true)}>
                            Status
                        </Button>
                        <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={() => downloadUsersCsv(selectedRows, 'users-selected.csv')}>
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

            <DataTable<User>
                columns={columns}
                data={paginated}
                getRowId={(row) => String(row.id)}
                sort={sort}
                onSortChange={setSort}
                columnVisibility={columnVisibility}
                columnWidths={columnWidths}
                onColumnWidthsChange={setColumnWidths}
                storageKey={TABLE_STORAGE_KEY}
                stickyColumnId="firstName"
                enableClientSort={false}
                emptyMessage="No users match your filters. Adjust search or filters, or create a new user."
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
                    label="users"
                />
            </div>

            {drawerOpen ? (
                <>
                    <button type="button" className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]" aria-label="Close filters" onClick={() => setDrawerOpen(false)} />
                    <aside
                        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
                        role="dialog"
                        aria-label="Advanced filters"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-bold text-slate-900">Advanced filters</h2>
                            <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" onClick={() => setDrawerOpen(false)}>
                                <LuX size={20} />
                            </button>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.roleFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, roleFilter: e.target.value }))}
                                >
                                    <option value="All">All roles</option>
                                    {roleOptions.map((r) => (
                                        <option key={r} value={r}>
                                            {r}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.statusFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, statusFilter: e.target.value }))}
                                >
                                    <option value="All">All statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Suspended">Suspended</option>
                                    <option value="Disabled">Disabled</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Department</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.departmentFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, departmentFilter: e.target.value }))}
                                >
                                    <option value="All">All departments</option>
                                    {deptOptions.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tenant</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.tenantFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, tenantFilter: e.target.value }))}
                                >
                                    <option value="All">All tenants</option>
                                    {companies.map((c) => (
                                        <option key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Joined from</label>
                                    <input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                                        className={`mt-1.5 ${selectClass}`}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Joined to</label>
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
                <p className="mb-3 text-sm text-slate-600">Save the current search and filter combination for this list.</p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className={cn('mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm', CTA_INPUT_FOCUS)}
                    placeholder="e.g. Skyline · Active engineers"
                />
            </Modal>

            <Modal
                isOpen={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                title="Delete selected users"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setBulkDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" className="bg-rose-600 hover:bg-rose-700" onClick={confirmBulkDelete}>
                            Delete {selectedIds.size} user(s)
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">Remove {selectedIds.size} selected user(s)?</p>
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
                <p className="mb-3 text-sm text-slate-600">Set status for {selectedIds.size} selected user(s).</p>
                <label className="text-xs font-bold uppercase text-slate-400">Status</label>
                <select className={`mt-1.5 ${selectClass}`} value={bulkStatusPick} onChange={(e) => setBulkStatusPick(e.target.value as User['status'])}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Disabled">Disabled</option>
                </select>
            </Modal>

            <ImportUsersModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImported={onImported} existingEmails={existingEmails} />
        </CompanyAdminDashboardLayout>
    );
}
