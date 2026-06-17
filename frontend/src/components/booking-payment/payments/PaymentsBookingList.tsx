'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { BpStatusBadge, statusToTone } from '@/components/booking-payment/BpStatusBadge';
import { BookingRowActionsMenu } from '@/components/booking-payment/BookingRowActionsMenu';
import { downloadBookingsCsv } from '@/lib/exportBookingsCsv';
import { downloadPaymentsBookingListCsv } from '@/lib/exportPaymentsBookingListCsv';
import { formatShortDate } from '@/lib/formatDate';
import { getBookingPaymentSummary, type BookingRecord } from '@/lib/bookingPaymentMockStore';
import { cn } from '@/lib/utils';
import { CTA_BULK_BAR, CTA_CHECKBOX_SM, CTA_FLOW_LINK_SEMIBOLD, CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';
import {
    DEFAULT_SAVED_VIEW_AUTHOR,
    importLegacyLocalSavedViewsOnce,
    loadGlobalSavedViews,
    normalizeSavedViewRoute,
    replaceViewsForRoute,
} from '@/lib/globalSavedViewsStore';
import { useConsumePendingSavedView } from '@/hooks/useConsumePendingSavedView';
import { useGlobalSavedViewsSync } from '@/hooks/useGlobalSavedViewsSync';
import { PaymentsBookingsGridView } from '@/components/booking-payment/payments/PaymentsBookingsGridView';
import {
    LuBookmark,
    LuCheck,
    LuChevronDown,
    LuColumns3,
    LuDownload,
    LuFileText,
    LuFilter,
    LuLayoutGrid,
    LuList,
    LuSearch,
    LuTrash2,
    LuX,
    LuArrowRight,
    LuPlus,
} from 'react-icons/lu';

const ITEMS_PER_PAGE = 10;
const DEFAULT_TABLE_STORAGE_KEY = 'arris-payments-booking-table-v1';
const PAYMENTS_LIST_GRID_VIEW_KEY = 'arris-payments-bookings-view-mode';
/** v2: default is grid; bump key so older sessions are not stuck on list-only default. */
const BOOKING_HUB_LIST_GRID_VIEW_KEY = 'arris-booking-hub-bookings-view-v2';

const BOOKING_VIEW_PATH = '/company-admin/booking-payment/booking/view';

export type PaymentsBookingFiltersPayload = {
    searchTerm: string;
    statusFilter: 'All' | BookingRecord['status'];
    projectFilter: string;
    /** Used when `columnLayout` is `bookingHub`; stays `All` on the payments screen. */
    leadFilter: string;
};

type SavedView = { id: string; name: string; payload: PaymentsBookingFiltersPayload };

function defaultFilters(): PaymentsBookingFiltersPayload {
    return { searchTerm: '', statusFilter: 'All', projectFilter: 'All', leadFilter: 'All' };
}

export type PaymentsBookingRow = BookingRecord & { paidCompleted: number; total: number; outstanding: number };

function sortPaymentsBookingRows(rows: PaymentsBookingRow[], sort: DataTableSortState): PaymentsBookingRow[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'booking_id':
                va = a.slug.toLowerCase();
                vb = b.slug.toLowerCase();
                break;
            case 'lead_id':
                va = a.leadId.toLowerCase();
                vb = b.leadId.toLowerCase();
                break;
            case 'assigned_to':
                va = a.assignedTo.toLowerCase();
                vb = b.assignedTo.toLowerCase();
                break;
            case 'customer':
                va = a.customerName.toLowerCase();
                vb = b.customerName.toLowerCase();
                break;
            case 'project_name':
                va = a.projectName.toLowerCase();
                vb = b.projectName.toLowerCase();
                break;
            case 'unit_id':
                va = a.unitId.toLowerCase();
                vb = b.unitId.toLowerCase();
                break;
            case 'project_unit':
                va = `${a.projectName} ${a.unitId}`.toLowerCase();
                vb = `${b.projectName} ${b.unitId}`.toLowerCase();
                break;
            case 'booked':
                va = a.bookingDate;
                vb = b.bookingDate;
                break;
            case 'status':
                va = a.status;
                vb = b.status;
                break;
            case 'paid':
                va = a.paidCompleted;
                vb = b.paidCompleted;
                break;
            case 'total':
                va = a.total;
                vb = b.total;
                break;
            case 'outstanding':
                va = a.outstanding;
                vb = b.outstanding;
                break;
            default:
                return 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

export type PaymentsBookingListBookingAdminActions = {
    onView: (slug: string) => void;
    onEdit: (slug: string) => void;
    onDelete: (slug: string) => void;
};

function paymentsColumnIds() {
    return ['booking_id', 'customer', 'project_unit', 'booked', 'status', 'total', 'paid', 'outstanding', 'actions'] as const;
}

function bookingHubColumnIds() {
    return [
        'booking_id',
        'lead_id',
        'assigned_to',
        'customer',
        'project_name',
        'unit_id',
        'booked',
        'status',
        'total',
        'actions',
    ] as const;
}

function defaultColumnVisibility(layout: 'payments' | 'bookingHub'): Record<string, boolean> {
    const ids = layout === 'bookingHub' ? bookingHubColumnIds() : paymentsColumnIds();
    return Object.fromEntries(ids.map((id) => [id, true])) as Record<string, boolean>;
}

function defaultColumnWidths(layout: 'payments' | 'bookingHub'): Record<string, number> {
    if (layout === 'bookingHub') {
        return {
            booking_id: 140,
            lead_id: 100,
            assigned_to: 120,
            customer: 168,
            project_name: 156,
            unit_id: 88,
            booked: 118,
            status: 112,
            total: 128,
            actions: 96,
        };
    }
    return {
        booking_id: 140,
        customer: 200,
        project_unit: 220,
        booked: 120,
        status: 120,
        total: 128,
        paid: 128,
        outstanding: 128,
        actions: 220,
    };
}

export function PaymentsBookingList({
    bookings,
    tableStorageKey = DEFAULT_TABLE_STORAGE_KEY,
    savedViewModule,
    legacySavedViewsStorageKey,
    bookingAdminActions,
    exportVariant = 'payments',
    onBulkDeleteBookings,
    columnLayout = 'payments',
    enableListGridToggle = false,
}: {
    bookings: BookingRecord[];
    /** Separate persisted column widths per screen (e.g. booking hub vs payments). */
    tableStorageKey?: string;
    /** Label stored on each global saved view (navbar badge). */
    savedViewModule: string;
    /** Optional former per-page localStorage key (one-time import into global store). */
    legacySavedViewsStorageKey?: string;
    /** Adds View / Edit / Delete booking menu beside payment actions (when shown). */
    bookingAdminActions?: PaymentsBookingListBookingAdminActions;
    exportVariant?: 'payments' | 'bookings';
    /** When set, bulk bar includes Delete for selected booking slugs (parent runs delete + refresh). */
    onBulkDeleteBookings?: (slugs: string[]) => void;
    /** `bookingHub`: lead, assigned-to, split project/unit columns like the legacy booking table. */
    columnLayout?: 'payments' | 'bookingHub';
    /** Payments landing page only: switch between data table and card grid (choice is remembered). */
    enableListGridToggle?: boolean;
}) {
    const router = useRouter();
    const pathname = usePathname() ?? '';
    const savedViewRoute = useMemo(() => normalizeSavedViewRoute(pathname), [pathname]);
    const globalViewsTick = useGlobalSavedViewsSync();

    useEffect(() => {
        if (!legacySavedViewsStorageKey) return;
        importLegacyLocalSavedViewsOnce(pathname, savedViewModule, legacySavedViewsStorageKey, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname, savedViewModule, legacySavedViewsStorageKey]);

    const goToBooking = useCallback(
        (slug: string) => {
            router.push(`/company-admin/booking-payment/payments?booking=${encodeURIComponent(slug)}`);
        },
        [router],
    );

    const goToAddPayment = useCallback(
        (slug: string) => {
            const rt = pathname.startsWith('/') ? `&returnTo=${encodeURIComponent(pathname)}` : '';
            router.push(`/company-admin/booking-payment/payments/add?booking=${encodeURIComponent(slug)}${rt}`);
        },
        [router, pathname],
    );

    const enriched = useMemo((): PaymentsBookingRow[] => {
        const out: PaymentsBookingRow[] = [];
        for (const b of bookings) {
            const summary = getBookingPaymentSummary(b.slug);
            const total = b.unitPrice;
            const paidCompleted = summary?.paidCompleted ?? 0;
            const outstanding = Math.max(0, total - paidCompleted);
            out.push({
                ...b,
                paidCompleted,
                total,
                outstanding,
            });
        }
        return out;
    }, [bookings]);

    const [filters, setFilters] = useState<PaymentsBookingFiltersPayload>(() => defaultFilters());
    const [searchDraft, setSearchDraft] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');

    const savedViews = useMemo((): SavedView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === savedViewRoute)
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as PaymentsBookingFiltersPayload }));
    }, [savedViewRoute, globalViewsTick]);

    useConsumePendingSavedView(savedViewRoute, (f) => {
        const p = f as Partial<PaymentsBookingFiltersPayload>;
        setFilters({ ...defaultFilters(), ...p });
        setSearchDraft(String(p.searchTerm ?? ''));
    });

    useEffect(() => {
        const t = window.setTimeout(() => {
            setFilters((f) => (f.searchTerm === searchDraft ? f : { ...f, searchTerm: searchDraft }));
        }, 320);
        return () => window.clearTimeout(t);
    }, [searchDraft]);

    const [sort, setSort] = useState<DataTableSortState>(() =>
        columnLayout === 'bookingHub'
            ? { columnId: 'booked', direction: 'desc' }
            : { columnId: 'customer', direction: 'asc' },
    );
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => defaultColumnVisibility(columnLayout));
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => defaultColumnWidths(columnLayout));
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    const bookingsViewStorageKey =
        columnLayout === 'bookingHub' ? BOOKING_HUB_LIST_GRID_VIEW_KEY : PAYMENTS_LIST_GRID_VIEW_KEY;

    /** Default is grid; only `localStorage` value `list` forces the table. */
    const [bookingsViewMode, setBookingsViewMode] = useState<'list' | 'grid'>('grid');
    useEffect(() => {
        if (!enableListGridToggle) return;
        try {
            const s = localStorage.getItem(bookingsViewStorageKey);
            if (s === 'list') setBookingsViewMode('list');
            else setBookingsViewMode('grid');
        } catch {
            /* ignore */
        }
    }, [enableListGridToggle, bookingsViewStorageKey]);

    const setBookingsViewModePersist = useCallback(
        (mode: 'list' | 'grid') => {
            setBookingsViewMode(mode);
            if (!enableListGridToggle) return;
            try {
                localStorage.setItem(bookingsViewStorageKey, mode);
            } catch {
                /* ignore */
            }
        },
        [enableListGridToggle, bookingsViewStorageKey],
    );

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

    const projectOptions = useMemo(() => {
        const s = new Set<string>();
        bookings.forEach((b) => s.add(b.projectName));
        return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, [bookings]);

    const leadIdsInData = useMemo(() => {
        const s = new Set(bookings.map((b) => b.leadId));
        return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, [bookings]);

    const filtered = useMemo(() => {
        const q = filters.searchTerm.trim().toLowerCase();
        return enriched.filter((b) => {
            const phoneDigits = b.phone.replace(/\D/g, '');
            const matchesSearch =
                !q ||
                b.slug.toLowerCase().includes(q) ||
                b.leadId.toLowerCase().includes(q) ||
                b.assignedTo.toLowerCase().includes(q) ||
                b.customerName.toLowerCase().includes(q) ||
                phoneDigits.includes(q) ||
                b.projectName.toLowerCase().includes(q) ||
                b.unitId.toLowerCase().includes(q) ||
                (b.unitConfiguration ?? '').toLowerCase().includes(q) ||
                String(b.unitPrice).includes(q) ||
                b.bookingDate.slice(0, 10).includes(q);
            const matchesStatus = filters.statusFilter === 'All' || b.status === filters.statusFilter;
            const matchesProject = filters.projectFilter === 'All' || b.projectName === filters.projectFilter;
            const matchesLead = filters.leadFilter === 'All' || b.leadId === filters.leadFilter;
            return matchesSearch && matchesStatus && matchesProject && matchesLead;
        });
    }, [enriched, filters]);

    const hasActiveFilters =
        filters.searchTerm.trim() !== '' ||
        filters.statusFilter !== 'All' ||
        filters.projectFilter !== 'All' ||
        filters.leadFilter !== 'All';

    const columnMenuEntries = useMemo(
        () =>
            columnLayout === 'bookingHub'
                ? [
                      ['booking_id', 'Booking ID'],
                      ['lead_id', 'Lead ID'],
                      ['assigned_to', 'Assigned to'],
                      ['customer', 'Customer'],
                      ['project_name', 'Project'],
                      ['unit_id', 'Unit'],
                      ['booked', 'Booked'],
                      ['status', 'Status'],
                      ['total', 'Total (Amount)'],
                  ]
                : [
                      ['booking_id', 'Booking ID'],
                      ['customer', 'Customer'],
                      ['project_unit', 'Project / unit'],
                      ['booked', 'Booked'],
                      ['status', 'Status'],
                      ['total', 'Total (Amount)'],
                      ['paid', 'Paid'],
                      ['outstanding', 'Outstanding'],
                  ],
        [columnLayout],
    );

    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, bookings, sort]);

    const sortedFiltered = useMemo(() => sortPaymentsBookingRows(filtered, sort), [filtered, sort]);
    const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / ITEMS_PER_PAGE));
    const paginated = useMemo(
        () => sortedFiltered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sortedFiltered, currentPage],
    );

    /** Sum totals across all rows matching current filters (not only the current page). */
    const listTotals = useMemo(() => {
        return sortedFiltered.reduce(
            (acc, row) => ({
                totalAmount: acc.totalAmount + row.total,
                totalPaid: acc.totalPaid + row.paidCompleted,
                totalOutstanding: acc.totalOutstanding + row.outstanding,
            }),
            { totalAmount: 0, totalPaid: 0, totalOutstanding: 0 },
        );
    }, [sortedFiltered]);

    const persistSavedViews = (views: SavedView[]) => {
        replaceViewsForRoute(
            savedViewRoute,
            savedViewModule,
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
        setFilters({ ...defaultFilters(), ...v.payload });
        setSearchDraft(v.payload.searchTerm ?? '');
        setDrawerOpen(false);
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((v) => v.id !== id));
    };

    const resetFilters = () => {
        setFilters(defaultFilters());
        setSearchDraft('');
        setCurrentPage(1);
    };

    const selectClass = cn(
        'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800',
        CTA_INPUT_FOCUS,
    );

    const columns: DataTableColumn<PaymentsBookingRow>[] = useMemo(() => {
        const bookingIdCol: DataTableColumn<PaymentsBookingRow> = {
            id: 'booking_id',
            header: 'Booking ID',
            sortable: true,
            sortValue: (row) => row.slug.toLowerCase(),
            minWidth: 120,
            render: (row) => (
                <Link
                    href={`${BOOKING_VIEW_PATH}/${encodeURIComponent(row.slug)}`}
                    className={cn('font-mono text-[11px] font-semibold', CTA_FLOW_LINK_SEMIBOLD)}
                    title={`View booking ${row.slug}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {row.slug}
                </Link>
            ),
        };

        const customerColPayments: DataTableColumn<PaymentsBookingRow> = {
            id: 'customer',
            header: 'Customer',
            sticky: true,
            sortable: true,
            sortValue: (row) => row.customerName.toLowerCase(),
            minWidth: 160,
            render: (row) => (
                <div>
                    <p className="font-semibold text-slate-900">{row.customerName}</p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">{row.slug}</p>
                </div>
            ),
        };

        const customerColHub: DataTableColumn<PaymentsBookingRow> = {
            id: 'customer',
            header: 'Customer',
            sticky: true,
            sortable: true,
            sortValue: (row) => row.customerName.toLowerCase(),
            minWidth: 140,
            render: (row) => (
                <span className="font-medium text-slate-900 truncate max-w-[200px] block" title={row.customerName}>
                    {row.customerName}
                </span>
            ),
        };

        const projectUnitCol: DataTableColumn<PaymentsBookingRow> = {
            id: 'project_unit',
            header: 'Project / unit',
            sortable: true,
            sortValue: (row) => `${row.projectName} ${row.unitId}`.toLowerCase(),
            minWidth: 180,
            render: (row) => (
                <div className="text-slate-700 text-sm">
                    <span className="font-medium">{row.projectName}</span>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">Unit {row.unitId}</p>
                    {row.unitConfiguration?.trim() ? (
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">{row.unitConfiguration}</p>
                    ) : null}
                </div>
            ),
        };

        const leadIdCol: DataTableColumn<PaymentsBookingRow> = {
            id: 'lead_id',
            header: 'Lead ID',
            sortable: true,
            sortValue: (row) => row.leadId.toLowerCase(),
            minWidth: 90,
            render: (row) => <span className="font-mono text-xs text-slate-800">{row.leadId}</span>,
        };

        const assignedToCol: DataTableColumn<PaymentsBookingRow> = {
            id: 'assigned_to',
            header: 'Assigned to',
            sortable: true,
            sortValue: (row) => row.assignedTo.toLowerCase(),
            minWidth: 110,
            render: (row) => (
                <span className="max-w-[140px] truncate text-sm text-slate-800" title={row.assignedTo}>
                    {row.assignedTo}
                </span>
            ),
        };

        const projectNameCol: DataTableColumn<PaymentsBookingRow> = {
            id: 'project_name',
            header: 'Project',
            sortable: true,
            sortValue: (row) => row.projectName.toLowerCase(),
            minWidth: 140,
            render: (row) => (
                <span className="line-clamp-2 text-slate-700 text-sm" title={row.projectName}>
                    {row.projectName}
                </span>
            ),
        };

        const unitIdCol: DataTableColumn<PaymentsBookingRow> = {
            id: 'unit_id',
            header: 'Unit',
            sortable: true,
            sortValue: (row) => row.unitId.toLowerCase(),
            minWidth: 88,
            render: (row) => <span className="font-mono text-xs font-semibold text-slate-800">{row.unitId}</span>,
        };

        const bookedCol: DataTableColumn<PaymentsBookingRow> = {
            id: 'booked',
            header: columnLayout === 'bookingHub' ? 'Booking date' : 'Booked',
            sortable: true,
            sortValue: (row) => row.bookingDate,
            minWidth: 110,
            render: (row) => <span className="tabular-nums text-sm text-slate-700">{formatShortDate(row.bookingDate)}</span>,
        };

        const statusCol: DataTableColumn<PaymentsBookingRow> = {
            id: 'status',
            header: 'Status',
            sortable: true,
            sortValue: (row) => row.status,
            minWidth: 100,
            render: (row) => <BpStatusBadge tone={statusToTone(row.status)}>{row.status}</BpStatusBadge>,
        };

        const totalCol: DataTableColumn<PaymentsBookingRow> = {
            id: 'total',
            header: (
                <span className="flex flex-col items-start gap-0.5 text-left normal-case">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total (Amount)</span>
                    <span className="text-sm font-black tabular-nums text-slate-900" title="Sum for filtered bookings">
                        ₹{listTotals.totalAmount.toLocaleString('en-IN')}
                    </span>
                </span>
            ),
            sortable: true,
            sortValue: (row) => row.total,
            minWidth: 128,
            render: (row) => <span className="tabular-nums font-semibold text-slate-800">₹{row.total.toLocaleString('en-IN')}</span>,
        };

        const paidCol: DataTableColumn<PaymentsBookingRow> = {
            id: 'paid',
            header: (
                <span className="flex flex-col items-start gap-0.5 text-left normal-case">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Paid amount</span>
                    <span className="text-sm font-black tabular-nums text-emerald-800" title="Sum for filtered bookings">
                        ₹{listTotals.totalPaid.toLocaleString('en-IN')}
                    </span>
                </span>
            ),
            sortable: true,
            sortValue: (row) => row.paidCompleted,
            minWidth: 128,
            render: (row) => (
                <span className="tabular-nums font-semibold text-emerald-800">₹{row.paidCompleted.toLocaleString('en-IN')}</span>
            ),
        };

        const outstandingCol: DataTableColumn<PaymentsBookingRow> = {
            id: 'outstanding',
            header: (
                <span className="flex flex-col items-start gap-0.5 text-left normal-case">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Outstanding</span>
                    <span className="text-sm font-black tabular-nums text-orange-800" title="Sum for filtered bookings">
                        ₹{listTotals.totalOutstanding.toLocaleString('en-IN')}
                    </span>
                </span>
            ),
            sortable: true,
            sortValue: (row) => row.outstanding,
            minWidth: 128,
            render: (row) => (
                <span className="tabular-nums font-semibold text-orange-800">₹{row.outstanding.toLocaleString('en-IN')}</span>
            ),
        };

        const actionsCol: DataTableColumn<PaymentsBookingRow> = {
            id: 'actions',
            header: '',
            sortable: false,
            stickyEnd: true,
            minWidth: exportVariant === 'payments' ? 220 : 96,
            cellClassName: 'text-right',
            render: (row) => (
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {exportVariant === 'payments' ? (
                        <>
                            <Button
                                type="button"
                                variant="company"
                                size="sm"
                                className="gap-1 shrink-0 whitespace-nowrap shadow-sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goToBooking(row.slug);
                                }}
                            >
                                <LuArrowRight size={14} aria-hidden />
                                View payments
                            </Button>
                            <Button
                                type="button"
                                variant="companyOutline"
                                size="sm"
                                className="gap-1 shrink-0 whitespace-nowrap bg-emerald-500  border-emerald-200 font-semibold text-emerald-100 hover:bg-emerald-600"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    goToAddPayment(row.slug);
                                }}
                            >
                                <LuPlus size={14} aria-hidden />
                                Add payment
                            </Button>
                        </>
                    ) : null}
                    {exportVariant === 'bookings' || bookingAdminActions ? (
                        <BookingRowActionsMenu
                            slug={row.slug}
                            paymentActions={
                                exportVariant === 'bookings'
                                    ? {
                                          onAddPayment: goToAddPayment,
                                          onOpenLedger: goToBooking,
                                      }
                                    : undefined
                            }
                            bookingActions={
                                bookingAdminActions
                                    ? {
                                          onView: bookingAdminActions.onView,
                                          onEdit: bookingAdminActions.onEdit,
                                          onDelete: bookingAdminActions.onDelete,
                                      }
                                    : undefined
                            }
                        />
                    ) : null}
                </div>
            ),
        };

        if (columnLayout === 'bookingHub') {
            return [
                bookingIdCol,
                leadIdCol,
                assignedToCol,
                customerColHub,
                projectNameCol,
                unitIdCol,
                bookedCol,
                statusCol,
                totalCol,
                actionsCol,
            ];
        }

        return [
            bookingIdCol,
            customerColPayments,
            projectUnitCol,
            bookedCol,
            statusCol,
            totalCol,
            paidCol,
            outstandingCol,
            actionsCol,
        ];
    }, [columnLayout, exportVariant, goToBooking, goToAddPayment, listTotals, bookingAdminActions]);

    const selectedRows = useMemo(() => sortedFiltered.filter((b) => selectedIds.has(b.slug)), [sortedFiltered, selectedIds]);

    const exportRowsForScope = () => (selectedIds.size ? selectedRows : sortedFiltered);

    const runExportCsv = (filename: string) => {
        const rows = exportRowsForScope();
        if (exportVariant === 'bookings') {
            downloadBookingsCsv(rows, filename);
        } else {
            downloadPaymentsBookingListCsv(rows, filename);
        }
        setExportMenuOpen(false);
    };

    const runExportExcelCsv = () => {
        const rows = exportRowsForScope();
        if (exportVariant === 'bookings') {
            downloadBookingsCsv(rows, 'bookings-excel.csv');
        } else {
            downloadPaymentsBookingListCsv(rows, 'payments-bookings-excel.csv');
        }
        setExportMenuOpen(false);
    };

    const bulkExport = () => {
        if (exportVariant === 'bookings') {
            downloadBookingsCsv(
                exportRowsForScope(),
                selectedIds.size ? 'bookings-selected.csv' : 'bookings-export.csv',
            );
        } else {
            downloadPaymentsBookingListCsv(
                exportRowsForScope(),
                selectedIds.size ? 'payments-bookings-selected.csv' : 'payments-bookings-export.csv',
            );
        }
    };

    const openBulkDeleteModal = () => {
        if (!onBulkDeleteBookings || !selectedIds.size) return;
        setBulkDeleteOpen(true);
    };

    const confirmBulkDeleteBookings = () => {
        if (!onBulkDeleteBookings || !selectedIds.size) return;
        onBulkDeleteBookings([...selectedIds]);
        setBulkDeleteOpen(false);
        setSelectedIds(new Set());
    };

    if (bookings.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center text-sm text-slate-600">
                No bookings yet. Create a booking first, then record payments here.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="order-2 flex min-w-0 flex-1 items-center gap-2 sm:order-1">
                    <div className="relative flex-1 max-w-xl">
                        <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            placeholder={
                                columnLayout === 'bookingHub'
                                    ? 'Search ID, lead, assigned to, customer, phone, project, unit, price, date…'
                                    : 'Search customer, booking ID, project, unit…'
                            }
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setFilters((f) => ({ ...f, searchTerm: searchDraft }));
                                }
                            }}
                            className={cn(
                                'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white',
                                CTA_INPUT_FOCUS,
                            )}
                            aria-label="Search bookings"
                        />
                    </div>
                </div>

                <div className="order-1 flex flex-wrap items-center justify-end gap-2 sm:order-2">
                    {enableListGridToggle ? (
                        <div
                            className="flex w-full items-center justify-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50/90 p-1 sm:w-auto"
                            role="group"
                            aria-label="Booking list layout"
                        >
                            <button
                                type="button"
                                onClick={() => setBookingsViewModePersist('list')}
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                                    bookingsViewMode === 'list'
                                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                                        : 'text-slate-600 hover:text-slate-900',
                                )}
                            >
                                <LuList size={18} aria-hidden />
                                List
                            </button>
                            <button
                                type="button"
                                onClick={() => setBookingsViewModePersist('grid')}
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                                    bookingsViewMode === 'grid'
                                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                                        : 'text-slate-600 hover:text-slate-900',
                                )}
                            >
                                <LuLayoutGrid size={18} aria-hidden />
                                Grid
                            </button>
                        </div>
                    ) : null}
                    {bookingsViewMode === 'list' || !enableListGridToggle ? (
                    <div className="relative" ref={columnMenuRef}>
                        <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setColumnMenuOpen((o) => !o)}>
                            <LuColumns3 size={18} />
                            Columns
                        </Button>
                        {columnMenuOpen ? (
                            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl ring-1 ring-black/5">
                                <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Visible</p>
                                {columnMenuEntries.map(([id, label]) => (
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
                                ))}
                            </div>
                        ) : null}
                    </div>
                    ) : null}

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
                            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() =>
                                        runExportCsv(
                                            selectedIds.size
                                                ? exportVariant === 'bookings'
                                                    ? 'bookings-selected.csv'
                                                    : 'payments-bookings-selected.csv'
                                                : exportVariant === 'bookings'
                                                  ? 'bookings-export.csv'
                                                  : 'payments-bookings-export.csv',
                                        )
                                    }
                                >
                                    <LuDownload size={16} className="text-slate-400" />
                                    CSV
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={runExportExcelCsv}
                                >
                                    <LuFileText size={16} className="text-slate-400" />
                                    Excel (UTF-8 CSV)
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {hasActiveFilters ? (
                <p className="text-xs font-medium text-slate-500">
                    Showing {filtered.length} of {bookings.length} booking{bookings.length === 1 ? '' : 's'}
                </p>
            ) : null}

            {selectedIds.size > 0 ? (
                <div className={cn('flex flex-col gap-3 rounded-xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between', CTA_BULK_BAR)}>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <LuCheck size={18} />
                        {selectedIds.size} selected
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={bulkExport}>
                            <LuDownload size={16} />
                            Export
                        </Button>
                        {onBulkDeleteBookings ? (
                            <Button
                                type="button"
                                variant="companyOutline"
                                size="sm"
                                className="gap-1.5 border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                                onClick={openBulkDeleteModal}
                            >
                                <LuTrash2 size={16} />
                                Delete
                            </Button>
                        ) : null}
                        <Button type="button" variant="companyGhost" size="sm" onClick={() => setSelectedIds(new Set())}>
                            Clear
                        </Button>
                    </div>
                </div>
            ) : null}

            {enableListGridToggle && bookingsViewMode === 'grid' ? (
                paginated.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-14 text-center text-sm text-slate-600">
                        No bookings on this page. Try another page or clear filters.
                    </div>
                ) : (
                    <PaymentsBookingsGridView
                        rows={paginated}
                        selectedIds={selectedIds}
                        onSelectedIdsChange={setSelectedIds}
                        sort={sort}
                        onSortChange={setSort}
                        goToBooking={goToBooking}
                        goToAddPayment={goToAddPayment}
                        columnLayout={columnLayout}
                        exportVariant={exportVariant}
                        bookingAdminActions={bookingAdminActions}
                    />
                )
            ) : (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5 overflow-hidden">
                    <DataTable<PaymentsBookingRow>
                        columns={columns}
                        data={paginated}
                        getRowId={(row) => row.slug}
                        sort={sort}
                        onSortChange={setSort}
                        columnVisibility={columnVisibility}
                        columnWidths={columnWidths}
                        onColumnWidthsChange={setColumnWidths}
                        storageKey={tableStorageKey}
                        stickyColumnId="customer"
                        enableClientSort={false}
                        selection={{ rowKey: 'slug', selectedIds, onSelectedIdsChange: setSelectedIds }}
                        emptyMessage="No bookings match your filters. Adjust filters or reset."
                        className="border-0 shadow-none ring-0"
                        onRowClick={exportVariant === 'payments' ? (row) => goToBooking(row.slug) : undefined}
                    />
                </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={sortedFiltered.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    label="bookings"
                />
            </div>

            {drawerOpen ? (
                <>
                    <button type="button" className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]" aria-label="Close" onClick={() => setDrawerOpen(false)} />
                    <aside
                        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
                        role="dialog"
                        aria-label="Filters"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-bold text-slate-900">Advanced filters</h2>
                            <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setDrawerOpen(false)}>
                                <LuX size={20} />
                            </button>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Booking status</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.statusFilter}
                                    onChange={(e) =>
                                        setFilters((f) => ({ ...f, statusFilter: e.target.value as 'All' | BookingRecord['status'] }))
                                    }
                                >
                                    <option value="All">All statuses</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Project</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.projectFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, projectFilter: e.target.value }))}
                                >
                                    <option value="All">All projects</option>
                                    {projectOptions.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {columnLayout === 'bookingHub' ? (
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lead ID</label>
                                    <select
                                        className={`mt-1.5 ${selectClass}`}
                                        value={filters.leadFilter}
                                        onChange={(e) => setFilters((f) => ({ ...f, leadFilter: e.target.value }))}
                                    >
                                        <option value="All">All leads</option>
                                        {leadIdsInData.map((id) => (
                                            <option key={id} value={id}>
                                                {id}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}
                            {savedViews.length > 0 ? (
                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                    <p className="text-xs font-semibold uppercase text-slate-500">Saved views</p>
                                    <ul className="mt-2 space-y-1">
                                        {savedViews.map((v) => (
                                            <li key={v.id} className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-[var(--cta-button-bg)] hover:bg-white hover:text-[var(--cta-button-hover-bg)]"
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
                isOpen={bulkDeleteOpen}
                onClose={() => setBulkDeleteOpen(false)}
                title="Delete selected bookings"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setBulkDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" className="bg-rose-600 hover:bg-rose-700" onClick={confirmBulkDeleteBookings}>
                            Delete {selectedIds.size} booking{selectedIds.size === 1 ? '' : 's'}
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Remove {selectedIds.size} selected booking{selectedIds.size === 1 ? '' : 's'}? In this demo, related payments, documents, and
                    payment links for those bookings are removed as well.
                </p>
            </Modal>

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
                <p className="mb-3 text-sm text-slate-600">Save the current filters and search for quick access from the drawer.</p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className={cn(
                        'mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm',
                        CTA_INPUT_FOCUS,
                    )}
                    placeholder="e.g. Confirmed · Tower A"
                />
            </Modal>
        </div>
    );
}
