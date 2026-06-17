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
import { ImportCustomersModal } from '@/components/customers/ImportCustomersModal';
import { CustomerRowActionsMenu } from '@/components/customers/CustomerRowActionsMenu';
import { cn } from '@/lib/utils';
import { CTA_BULK_BAR, CTA_CHECKBOX_SM, CTA_INPUT_FOCUS, CTA_SHADOW_SOFT } from '@/lib/theme/ctaThemeClasses';
import { downloadCustomersCsv, openCustomersPrintReport } from '@/lib/exportCustomersCsv';
import { customerCreateHref, customerViewHref } from '@/lib/customerRoutes';
import type { Customer, CustomerBookingStatus, CustomerPaymentStatus, CustomerStatus } from '@/lib/customersStore';
import {
    CUSTOMER_BOOKING_STATUS_OPTIONS,
    CUSTOMER_PAYMENT_STATUS_OPTIONS,
    CUSTOMER_STATUS_OPTIONS,
    archiveCustomer,
    bulkArchiveCustomers,
    bulkAssignExecutive,
    bulkDeleteCustomersPermanent,
    deleteCustomerPermanent,
    getCustomerExecutiveOptions,
    getCustomerProjectOptions,
    getCustomers,
    normalizeCustomerPhoneDigits,
} from '@/lib/customersStore';
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
    LuFilter,
    LuPlus,
    LuSearch,
    LuTrash2,
    LuUpload,
    LuUserPlus,
    LuX,
} from 'react-icons/lu';

const ITEMS_PER_PAGE = 10;
const TABLE_STORAGE_KEY = 'arris-customers-table-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-customers-saved-views';

const CUSTOMER_TABLE_DATA_COLUMN_IDS = [
    'customerName',
    'bookingId',
    'projectName',
    'unitNumber',
    'bookingStatus',
    'totalAmount',
    'paidAmount',
    'pendingAmount',
    'paymentStatus',
    'assignedExecutive',
    'lastPaymentDate',
] as const;

const CUSTOMER_TABLE_DEFAULT_ON = new Set<string>([
    'customerName',
    'bookingId',
    'projectName',
    'unitNumber',
    'bookingStatus',
    'totalAmount',
    'paidAmount',
    'pendingAmount',
    'paymentStatus',
    'assignedExecutive',
    'actions',
]);

export type CustomersFilterPayload = {
    searchTerm: string;
    bookingStatusFilter: 'All' | CustomerBookingStatus;
    paymentStatusFilter: 'All' | CustomerPaymentStatus;
    projectFilter: 'All' | string;
    executiveFilter: 'All' | string;
    customerStatusFilter: 'All' | CustomerStatus;
};

type SavedView = { id: string; name: string; payload: CustomersFilterPayload };

function defaultFilters(): CustomersFilterPayload {
    return {
        searchTerm: '',
        bookingStatusFilter: 'All',
        paymentStatusFilter: 'All',
        projectFilter: 'All',
        executiveFilter: 'All',
        customerStatusFilter: 'All',
    };
}

function sortCustomersList(rows: Customer[], sort: DataTableSortState): Customer[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'customerName':
                va = a.fullName.toLowerCase();
                vb = b.fullName.toLowerCase();
                break;
            case 'bookingId':
                va = a.bookingId.toLowerCase();
                vb = b.bookingId.toLowerCase();
                break;
            case 'projectName':
                va = a.projectName.toLowerCase();
                vb = b.projectName.toLowerCase();
                break;
            case 'unitNumber':
                va = a.unitNumber.toLowerCase();
                vb = b.unitNumber.toLowerCase();
                break;
            case 'bookingStatus':
                va = a.bookingStatus;
                vb = b.bookingStatus;
                break;
            case 'totalAmount':
                va = a.totalAmount;
                vb = b.totalAmount;
                break;
            case 'paidAmount':
                va = a.paidAmount;
                vb = b.paidAmount;
                break;
            case 'pendingAmount':
                va = a.pendingAmount;
                vb = b.pendingAmount;
                break;
            case 'paymentStatus':
                va = a.paymentStatus;
                vb = b.paymentStatus;
                break;
            case 'assignedExecutive':
                va = a.assignedExecutive.toLowerCase();
                vb = b.assignedExecutive.toLowerCase();
                break;
            case 'lastPaymentDate':
                va = a.lastPaymentDate;
                vb = b.lastPaymentDate;
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
    if (!ymd || ymd.length < 10) return ymd || '—';
    const [y, m, d] = ymd.slice(0, 10).split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[Number(m) - 1] || m} ${Number(d)}, ${y}`;
}

function fmtCurrency(n: number) {
    return `₹${n.toLocaleString('en-IN')}`;
}

function bookingBadge(s: CustomerBookingStatus) {
    if (s === 'Confirmed') return 'bg-emerald-100 text-emerald-900';
    if (s === 'Cancelled') return 'bg-rose-100 text-rose-900';
    return 'bg-amber-100 text-amber-950';
}

export function CustomersListPageContent() {
    const pathname = usePathname() ?? '';
    const router = useRouter();
    const searchParams = useSearchParams();
    const globalViewsTick = useGlobalSavedViewsSync();
    const [listVersion, setListVersion] = useState(0);
    const allRows = useMemo(() => {
        void listVersion;
        return getCustomers();
    }, [listVersion]);

    const [filters, setFilters] = useState<CustomersFilterPayload>(() => defaultFilters());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');
    const [searchDraft, setSearchDraft] = useState('');
    const [importOpen, setImportOpen] = useState(false);
    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'customerName', direction: 'asc' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [bulkToolbarOpen, setBulkToolbarOpen] = useState(false);
    const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
    const [bulkAssignPick, setBulkAssignPick] = useState('');
    const [bulkArchiveOpen, setBulkArchiveOpen] = useState(false);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
    const [archiveTarget, setArchiveTarget] = useState<Customer | null>(null);

    const columnMenuRef = useRef<HTMLDivElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const bulkToolbarRef = useRef<HTMLDivElement>(null);

    const executiveOptions = useMemo(() => getCustomerExecutiveOptions(), [listVersion]);
    const projectOptions = useMemo(() => getCustomerProjectOptions(), [listVersion]);

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Customers', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as CustomersFilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const p = f as Partial<CustomersFilterPayload>;
        setFilters({ ...defaultFilters(), ...p });
        setSearchDraft(String(p.searchTerm ?? ''));
    });

    useEffect(() => {
        if (searchParams.get('import') !== '1') return;
        setImportOpen(true);
        const next = new URLSearchParams(searchParams.toString());
        next.delete('import');
        const q = next.toString();
        router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    }, [searchParams, router, pathname]);

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const allIds = [...CUSTOMER_TABLE_DATA_COLUMN_IDS, 'actions' as const];
        return Object.fromEntries(allIds.map((id) => [id, CUSTOMER_TABLE_DEFAULT_ON.has(id)])) as Record<string, boolean>;
    });

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        customerName: 240,
        bookingId: 120,
        projectName: 160,
        unitNumber: 100,
        bookingStatus: 110,
        totalAmount: 110,
        paidAmount: 110,
        pendingAmount: 110,
        paymentStatus: 110,
        assignedExecutive: 140,
        lastPaymentDate: 120,
        actions: 128,
    });

    useEffect(() => setCurrentPage(1), [filters, listVersion, sort]);

    const bump = useCallback(() => {
        setListVersion((v) => v + 1);
        setSelectedIds(new Set());
    }, []);

    const filtered = useMemo(() => {
        const st = filters.searchTerm.trim().toLowerCase();
        return allRows.filter((c) => {
            const matchSearch =
                !st ||
                c.fullName.toLowerCase().includes(st) ||
                c.bookingId.toLowerCase().includes(st) ||
                c.projectName.toLowerCase().includes(st) ||
                c.unitNumber.toLowerCase().includes(st) ||
                normalizeCustomerPhoneDigits(c.phone).includes(st.replace(/\D/g, '')) ||
                c.customerCode.toLowerCase().includes(st) ||
                String(c.totalAmount).includes(st.replace(/\D/g, ''));
            const matchBooking = filters.bookingStatusFilter === 'All' || c.bookingStatus === filters.bookingStatusFilter;
            const matchPayment = filters.paymentStatusFilter === 'All' || c.paymentStatus === filters.paymentStatusFilter;
            const matchProject = filters.projectFilter === 'All' || c.projectName === filters.projectFilter;
            const matchExec = filters.executiveFilter === 'All' || c.assignedExecutive === filters.executiveFilter;
            const matchCustStatus = filters.customerStatusFilter === 'All' || c.customerStatus === filters.customerStatusFilter;
            return matchSearch && matchBooking && matchPayment && matchProject && matchExec && matchCustStatus;
        });
    }, [allRows, filters]);

    const sorted = useMemo(() => sortCustomersList(filtered, sort), [filtered, sort]);
    const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
    const pageRows = useMemo(() => sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE), [sorted, currentPage]);
    const selectedRows = useMemo(() => sorted.filter((c) => selectedIds.has(c.slug)), [sorted, selectedIds]);
    const exportRows = () => (selectedIds.size ? selectedRows : sorted);

    const hasActiveFilters = Object.entries(filters).some(([k, v]) => {
        if (k === 'searchTerm') return String(v).trim() !== '';
        return v !== 'All';
    });

    const persistSavedViews = (views: SavedView[]) => {
        replaceViewsForRoute(
            pathname,
            'Customers',
            views.map((v) => ({ id: v.id, name: v.name, payload: v.payload as Record<string, unknown> })),
            DEFAULT_SAVED_VIEW_AUTHOR,
        );
    };

    const columns: DataTableColumn<Customer>[] = useMemo(
        () => [
            {
                id: 'customerName',
                header: 'Customer Name',
                sticky: true,
                sortable: true,
                sortValue: (r) => r.fullName.toLowerCase(),
                minWidth: 200,
                render: (row) => (
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 text-sm font-bold text-slate-700 ring-1 ring-slate-200/80">
                            {row.fullName.charAt(0).toUpperCase()}
                        </div>
                        <Link href={customerViewHref(row.slug)} className="truncate font-semibold text-slate-900 hover:text-[var(--cta-button-bg)] hover:underline" onClick={(e) => e.stopPropagation()}>
                            {row.fullName}
                        </Link>
                    </div>
                ),
            },
            { id: 'bookingId', header: 'Booking ID', sortable: true, sortValue: (r) => r.bookingId, minWidth: 110, render: (r) => <span className="font-mono text-xs font-semibold">{r.bookingId}</span> },
            { id: 'projectName', header: 'Project Name', sortable: true, sortValue: (r) => r.projectName, minWidth: 140, render: (r) => r.projectName },
            { id: 'unitNumber', header: 'Unit Number', sortable: true, sortValue: (r) => r.unitNumber, minWidth: 90, render: (r) => r.unitNumber },
            {
                id: 'bookingStatus',
                header: 'Booking Status',
                sortable: true,
                sortValue: (r) => r.bookingStatus,
                minWidth: 110,
                render: (r) => <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold uppercase', bookingBadge(r.bookingStatus))}>{r.bookingStatus}</span>,
            },
            { id: 'totalAmount', header: 'Total Amount', sortable: true, sortValue: (r) => r.totalAmount, minWidth: 110, render: (r) => <span className="tabular-nums">{fmtCurrency(r.totalAmount)}</span> },
            { id: 'paidAmount', header: 'Paid Amount', sortable: true, sortValue: (r) => r.paidAmount, minWidth: 110, render: (r) => <span className="tabular-nums text-emerald-800">{fmtCurrency(r.paidAmount)}</span> },
            { id: 'pendingAmount', header: 'Pending Amount', sortable: true, sortValue: (r) => r.pendingAmount, minWidth: 110, render: (r) => <span className="tabular-nums text-amber-900">{fmtCurrency(r.pendingAmount)}</span> },
            {
                id: 'paymentStatus',
                header: 'Payment Status',
                sortable: true,
                sortValue: (r) => r.paymentStatus,
                minWidth: 110,
                render: (r) => (
                    <span
                        className={cn(
                            'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase',
                            r.paymentStatus === 'Paid' && 'bg-emerald-100 text-emerald-900',
                            r.paymentStatus === 'Partial' && 'bg-amber-100 text-amber-950',
                            r.paymentStatus === 'Overdue' && 'bg-rose-100 text-rose-900',
                            r.paymentStatus === 'Pending' && 'bg-slate-100 text-slate-700',
                        )}
                    >
                        {r.paymentStatus}
                    </span>
                ),
            },
            { id: 'assignedExecutive', header: 'Assigned Executive', sortable: true, sortValue: (r) => r.assignedExecutive, minWidth: 130, render: (r) => r.assignedExecutive || '—' },
            { id: 'lastPaymentDate', header: 'Last Payment Date', sortable: true, sortValue: (r) => r.lastPaymentDate, minWidth: 120, render: (r) => formatYmdDisplay(r.lastPaymentDate) },
            {
                id: 'actions',
                header: '',
                sortable: false,
                minWidth: 100,
                cellClassName: 'text-right',
                render: (row) => (
                    <CustomerRowActionsMenu
                        customer={row}
                        onArchive={(c) => setArchiveTarget(c)}
                        onDelete={(c) => setDeleteTarget(c)}
                        onCloseParent={() => setSelectedIds(new Set())}
                    />
                ),
            },
        ],
        [],
    );

    const selectClass = cn('h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm', CTA_INPUT_FOCUS);

    const applySavedView = (v: SavedView) => {
        setFilters({ ...defaultFilters(), ...v.payload });
        setSearchDraft(v.payload.searchTerm ?? '');
        setDrawerOpen(false);
    };

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb items={[{ label: 'Lead & Sales', href: '/leads' }, { label: 'Customer & Buyer' }]} />

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer & Buyer Portal</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Manage converted leads, bookings, customer payments, buyer documents, and project communication.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Link href={`${pathname}?import=1`}>
                        <Button variant="companyOutline" size="cta" className="gap-2">
                            <LuUpload size={18} /> Import
                        </Button>
                    </Link>
                    <Button variant="companyOutline" size="cta" className="gap-2" onClick={() => downloadCustomersCsv(exportRows())}>
                        <LuDownload size={18} /> Export
                    </Button>
                    <Button variant="companyOutline" size="cta" className="gap-2" onClick={() => setSaveModalOpen(true)}>
                        <LuBookmark size={18} /> Save View
                    </Button>
                    <Link href={customerCreateHref()}>
                        <Button variant="company" size="cta" className={cn('gap-2', CTA_SHADOW_SOFT)}>
                            <LuPlus size={18} /> Add Customer
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="relative min-w-[200px] flex-1 max-w-xl">
                    <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="search"
                        placeholder="Search customer, booking ID, project, unit, payment, or phone..."
                        value={searchDraft}
                        onChange={(e) => setSearchDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && setFilters((f) => ({ ...f, searchTerm: searchDraft }))}
                        className={cn('h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm', CTA_INPUT_FOCUS)}
                    />
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button variant={drawerOpen ? 'company' : 'companyOutline'} size="cta" className="gap-2" onClick={() => setDrawerOpen(true)}>
                        <LuFilter size={18} /> Filters
                    </Button>
                    <div className="relative" ref={columnMenuRef}>
                        <Button variant="companyOutline" size="cta" className="gap-2" onClick={() => setColumnMenuOpen((o) => !o)}>
                            <LuColumns3 size={18} /> Columns
                        </Button>
                    </div>
                    <Button variant="companyOutline" size="cta" className="gap-2" onClick={() => setSaveModalOpen(true)}>
                        <LuBookmark size={18} /> Save View
                    </Button>
                    <Button variant="companyOutline" size="cta" className="gap-2" onClick={() => setImportOpen(true)}>
                        <LuUpload size={18} /> Import
                    </Button>
                    <div className="relative" ref={exportMenuRef}>
                        <Button variant="companyOutline" size="cta" className="gap-2" onClick={() => setExportMenuOpen((o) => !o)}>
                            <LuDownload size={18} /> Export
                        </Button>
                        {exportMenuOpen ? (
                            <div className="absolute right-0 top-full z-[300] mt-1 w-48 rounded-xl border bg-white py-1 shadow-xl">
                                <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { downloadCustomersCsv(exportRows()); setExportMenuOpen(false); }}>
                                    CSV
                                </button>
                                <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { openCustomersPrintReport(exportRows(), 'Customers'); setExportMenuOpen(false); }}>
                                    Print report
                                </button>
                            </div>
                        ) : null}
                    </div>
                    {selectedIds.size > 0 ? (
                        <div className="relative" ref={bulkToolbarRef}>
                            <Button variant="company" size="cta" className="gap-2" onClick={() => setBulkToolbarOpen((o) => !o)}>
                                Bulk Actions ({selectedIds.size}) <LuChevronDown size={16} />
                            </Button>
                            {bulkToolbarOpen ? (
                                <div className={cn('absolute right-0 top-full z-[300] mt-1 min-w-[200px] rounded-xl border bg-white py-1 shadow-xl', CTA_BULK_BAR)}>
                                    <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { downloadCustomersCsv(selectedRows); setBulkToolbarOpen(false); }}>
                                        Export Selected
                                    </button>
                                    <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { setBulkAssignPick(executiveOptions[0] ?? ''); setBulkAssignOpen(true); setBulkToolbarOpen(false); }}>
                                        Assign Executive
                                    </button>
                                    <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { setBulkArchiveOpen(true); setBulkToolbarOpen(false); }}>
                                        Archive
                                    </button>
                                    <button type="button" className="block w-full px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50" onClick={() => { setBulkDeleteOpen(true); setBulkToolbarOpen(false); }}>
                                        Delete
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>

            <DataTable
                data={pageRows}
                columns={columns}
                getRowId={(r) => r.slug}
                sort={sort}
                onSortChange={setSort}
                columnVisibility={columnVisibility}
                columnWidths={columnWidths}
                onColumnWidthsChange={setColumnWidths}
                storageKey={TABLE_STORAGE_KEY}
                stickyColumnId="customerName"
                enableClientSort={false}
                stickyHeader
                emptyMessage="No customers match your filters."
                selection={{
                    rowKey: 'slug',
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
                    label="customers"
                />
            </div>

            {drawerOpen ? (
                <div className="fixed inset-0 z-[400] flex justify-end bg-black/30" onClick={() => setDrawerOpen(false)}>
                    <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">Filters</h2>
                            <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close">
                                <LuX size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-xs font-bold uppercase text-slate-500">Booking Status</label>
                            <select className={selectClass} value={filters.bookingStatusFilter} onChange={(e) => setFilters((f) => ({ ...f, bookingStatusFilter: e.target.value as CustomersFilterPayload['bookingStatusFilter'] }))}>
                                <option value="All">All</option>
                                {CUSTOMER_BOOKING_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <label className="block text-xs font-bold uppercase text-slate-500">Payment Status</label>
                            <select className={selectClass} value={filters.paymentStatusFilter} onChange={(e) => setFilters((f) => ({ ...f, paymentStatusFilter: e.target.value as CustomersFilterPayload['paymentStatusFilter'] }))}>
                                <option value="All">All</option>
                                {CUSTOMER_PAYMENT_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <label className="block text-xs font-bold uppercase text-slate-500">Project Name</label>
                            <select className={selectClass} value={filters.projectFilter} onChange={(e) => setFilters((f) => ({ ...f, projectFilter: e.target.value }))}>
                                <option value="All">All</option>
                                {projectOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <label className="block text-xs font-bold uppercase text-slate-500">Assigned Executive</label>
                            <select className={selectClass} value={filters.executiveFilter} onChange={(e) => setFilters((f) => ({ ...f, executiveFilter: e.target.value }))}>
                                <option value="All">All</option>
                                {executiveOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <label className="block text-xs font-bold uppercase text-slate-500">Customer Status</label>
                            <select className={selectClass} value={filters.customerStatusFilter} onChange={(e) => setFilters((f) => ({ ...f, customerStatusFilter: e.target.value as CustomersFilterPayload['customerStatusFilter'] }))}>
                                <option value="All">All</option>
                                {CUSTOMER_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="mt-6 flex gap-2">
                            <Button variant="companyOutline" onClick={() => { setFilters(defaultFilters()); setSearchDraft(''); }}>Reset</Button>
                            <Button variant="company" onClick={() => setDrawerOpen(false)}>Apply</Button>
                        </div>
                        {savedViews.length ? (
                            <div className="mt-6 border-t pt-4">
                                <p className="text-xs font-bold uppercase text-slate-500">Saved views</p>
                                <ul className="mt-2 space-y-1">
                                    {savedViews.map((v) => (
                                        <li key={v.id}>
                                            <button type="button" className="text-sm font-medium text-[var(--cta-button-bg)] hover:underline" onClick={() => applySavedView(v)}>
                                                {v.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}

            <ImportCustomersModal open={importOpen} onClose={() => setImportOpen(false)} onImported={bump} />

            <Modal isOpen={saveModalOpen} onClose={() => setSaveModalOpen(false)} title="Save view">
                <input value={saveViewName} onChange={(e) => setSaveViewName(e.target.value)} placeholder="View name" className={cn('w-full rounded-xl border px-3 py-2 text-sm', CTA_INPUT_FOCUS)} />
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="companyOutline" onClick={() => setSaveModalOpen(false)}>Cancel</Button>
                    <Button variant="company" onClick={() => { const name = saveViewName.trim(); if (!name) return; persistSavedViews([...savedViews, { id: `v-${Date.now()}`, name, payload: { ...filters } }]); setSaveViewName(''); setSaveModalOpen(false); }}>
                        Save
                    </Button>
                </div>
            </Modal>

            <Modal isOpen={!!archiveTarget} onClose={() => setArchiveTarget(null)} title="Archive customer?">
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="companyOutline" onClick={() => setArchiveTarget(null)}>Cancel</Button>
                    <Button variant="company" onClick={() => { if (archiveTarget) archiveCustomer(archiveTarget.slug); setArchiveTarget(null); bump(); }}>Archive</Button>
                </div>
            </Modal>

            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete customer?">
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="companyOutline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button variant="company" onClick={() => { if (deleteTarget) deleteCustomerPermanent(deleteTarget.slug); setDeleteTarget(null); bump(); }}>Delete</Button>
                </div>
            </Modal>

            <Modal isOpen={bulkAssignOpen} onClose={() => setBulkAssignOpen(false)} title="Assign executive">
                <select className={selectClass} value={bulkAssignPick} onChange={(e) => setBulkAssignPick(e.target.value)}>
                    {executiveOptions.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="company" onClick={() => { bulkAssignExecutive([...selectedIds], bulkAssignPick); setBulkAssignOpen(false); bump(); }}>Assign</Button>
                </div>
            </Modal>

            <Modal isOpen={bulkArchiveOpen} onClose={() => setBulkArchiveOpen(false)} title="Archive selected?">
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="company" onClick={() => { bulkArchiveCustomers([...selectedIds]); setBulkArchiveOpen(false); bump(); }}>Archive</Button>
                </div>
            </Modal>

            <Modal isOpen={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} title="Delete selected?">
                <div className="mt-4 flex justify-end gap-2">
                    <Button variant="company" onClick={() => { bulkDeleteCustomersPermanent([...selectedIds]); setBulkDeleteOpen(false); bump(); }}>Delete</Button>
                </div>
            </Modal>
        </CompanyAdminDashboardLayout>
    );
}
