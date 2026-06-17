'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { BpStatusBadge, paymentRecordStatusTone } from '@/components/booking-payment/BpStatusBadge';
import { InputField } from '@/components/forms/Fields';
import { getPayments, getReportsSummary, type PaymentRecord, type PaymentRecordStatus, type PaymentSource } from '@/lib/bookingPaymentMockStore';
import { validateReportDateRange, type ReportFilterField } from '@/lib/bookingPaymentFormValidation';
import { downloadReportsPaymentsCsv } from '@/lib/exportReportsPaymentsCsv';
import { cn } from '@/lib/utils';
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
    LuFilter,
    LuPercent,
    LuSearch,
    LuTrendingUp,
    LuX,
} from 'react-icons/lu';

const ITEMS_PER_PAGE = 10;
const TABLE_STORAGE_KEY = 'arris-booking-payment-reports-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-reports-saved-views';
const PAY_VIEW = '/company-admin/booking-payment/payments/view';
const BOOKING_VIEW = '/company-admin/booking-payment/booking/view';

function withReturnTo(href: string, pathname: string) {
    if (!pathname) return href;
    const sep = href.includes('?') ? '&' : '?';
    return `${href}${sep}returnTo=${encodeURIComponent(pathname)}`;
}

const REPORT_ROW_LINK_CLASS =
    'font-mono text-xs font-semibold text-blue-700 underline-offset-2 hover:text-blue-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 focus-visible:ring-offset-1 rounded-sm';

function defaultDateRange() {
    const today = new Date().toISOString().slice(0, 10);
    const ago = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    return { from: ago, to: today };
}

export type ReportsFilterPayload = {
    searchTerm: string;
    statusFilter: 'All' | PaymentRecordStatus;
    sourceFilter: 'All' | PaymentSource;
    dateFrom: string;
    dateTo: string;
};

type SavedView = { id: string; name: string; payload: ReportsFilterPayload };

function defaultReportsFilters(range: { from: string; to: string }): ReportsFilterPayload {
    return {
        searchTerm: '',
        statusFilter: 'All',
        sourceFilter: 'All',
        dateFrom: range.from,
        dateTo: range.to,
    };
}

function sortReportPayments(rows: PaymentRecord[], sort: DataTableSortState): PaymentRecord[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'payment_id':
                va = a.slug.toLowerCase();
                vb = b.slug.toLowerCase();
                break;
            case 'booking_id':
                va = a.bookingSlug.toLowerCase();
                vb = b.bookingSlug.toLowerCase();
                break;
            case 'date':
                va = a.date;
                vb = b.date;
                break;
            case 'amount':
                va = a.amount;
                vb = b.amount;
                break;
            case 'mode':
                va = a.mode;
                vb = b.mode;
                break;
            case 'receipt':
                va = a.receiptNumber.toLowerCase();
                vb = b.receiptNumber.toLowerCase();
                break;
            case 'status':
                va = a.status;
                vb = b.status;
                break;
            case 'source':
                va = a.source;
                vb = b.source;
                break;
            default:
                return 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

export default function BookingPaymentReportsPage() {
    const pathname = usePathname() ?? '';
    const returnTo = pathname.startsWith('/') && !pathname.startsWith('//') ? pathname : '';
    const globalViewsTick = useGlobalSavedViewsSync();

    const s = useMemo(() => getReportsSummary(), []);
    const allPayments = useMemo(() => getPayments(), []);

    const defaultRange = useMemo(() => defaultDateRange(), []);

    const [filters, setFilters] = useState<ReportsFilterPayload>(() => defaultReportsFilters(defaultRange));
    const [searchDraft, setSearchDraft] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Reports', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as ReportsFilterPayload }));
    }, [pathname, globalViewsTick]);

    const [fromDate, setFromDate] = useState(filters.dateFrom);
    const [toDate, setToDate] = useState(filters.dateTo);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const p = f as ReportsFilterPayload;
        setFilters(p);
        setSearchDraft(p.searchTerm ?? '');
        setFromDate(p.dateFrom);
        setToDate(p.dateTo);
    });
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<ReportFilterField, string>>>({});
    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const dismissToast = useCallback(() => setToast(null), []);

    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'date', direction: 'desc' });
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const ids = ['payment_id', 'booking_id', 'date', 'amount', 'mode', 'receipt', 'status', 'source'];
        return Object.fromEntries(ids.map((id) => [id, true])) as Record<string, boolean>;
    });
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        payment_id: 150,
        booking_id: 150,
        date: 110,
        amount: 100,
        mode: 90,
        receipt: 120,
        status: 110,
        source: 110,
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

    useEffect(() => {
        setFromDate(filters.dateFrom);
        setToDate(filters.dateTo);
    }, [filters.dateFrom, filters.dateTo]);

    const rangeFiltered = useMemo(() => {
        return allPayments.filter((p) => p.date >= filters.dateFrom && p.date <= filters.dateTo);
    }, [allPayments, filters.dateFrom, filters.dateTo]);

    const filteredPayments = useMemo(() => {
        const q = filters.searchTerm.trim().toLowerCase();
        return rangeFiltered.filter((p) => {
            const matchesSearch =
                !q ||
                p.slug.toLowerCase().includes(q) ||
                p.bookingSlug.toLowerCase().includes(q) ||
                p.receiptNumber.toLowerCase().includes(q) ||
                String(p.amount).includes(q) ||
                p.mode.toLowerCase().includes(q) ||
                p.date.includes(q);
            const matchesStatus = filters.statusFilter === 'All' || p.status === filters.statusFilter;
            const matchesSource = filters.sourceFilter === 'All' || p.source === filters.sourceFilter;
            return matchesSearch && matchesStatus && matchesSource;
        });
    }, [rangeFiltered, filters]);

    const hasActiveFilters =
        filters.searchTerm.trim() !== '' ||
        filters.statusFilter !== 'All' ||
        filters.sourceFilter !== 'All' ||
        filters.dateFrom !== defaultRange.from ||
        filters.dateTo !== defaultRange.to;

    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, sort]);

    const sortedFiltered = useMemo(() => sortReportPayments(filteredPayments, sort), [filteredPayments, sort]);
    const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / ITEMS_PER_PAGE));
    const paginatedPayments = useMemo(
        () => sortedFiltered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sortedFiltered, currentPage],
    );

    const persistSavedViews = (views: SavedView[]) => {
        replaceViewsForRoute(
            pathname,
            'Reports',
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
        setFromDate(v.payload.dateFrom);
        setToDate(v.payload.dateTo);
        setDrawerOpen(false);
    };

    const resetAllFilters = () => {
        const r = defaultRange;
        setFilters(defaultReportsFilters(r));
        setSearchDraft('');
        setFromDate(r.from);
        setToDate(r.to);
        setFieldErrors({});
        setCurrentPage(1);
    };

    const applySearchToFilters = () => {
        setFilters((f) => ({ ...f, searchTerm: searchDraft }));
        setCurrentPage(1);
    };

    const clearReportField = (key: ReportFilterField) => {
        setFieldErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const onApplyRangeInDrawer = (e: React.FormEvent) => {
        e.preventDefault();
        const nextErrors = validateReportDateRange({ fromDate, toDate });
        setFieldErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setToast({ msg: 'Please fix the date range.', err: true });
            return;
        }
        setFilters((f) => ({ ...f, dateFrom: fromDate, dateTo: toDate }));
        setToast({ msg: `Date range applied: ${fromDate} → ${toDate}` });
        setDrawerOpen(false);
    };

    const onExportCsv = () => {
        const nextErrors = validateReportDateRange({ fromDate: filters.dateFrom, toDate: filters.dateTo });
        if (Object.keys(nextErrors).length > 0) {
            setToast({ msg: 'Fix the date range before export.', err: true });
            return;
        }
        const rows = selectedIds.size ? sortedFiltered.filter((p) => selectedIds.has(p.slug)) : sortedFiltered;
        downloadReportsPaymentsCsv(rows, selectedIds.size ? 'reports-payments-selected.csv' : 'reports-payments-export.csv');
        setToast({ msg: 'CSV downloaded.' });
    };

    const selectedRows = useMemo(() => sortedFiltered.filter((p) => selectedIds.has(p.slug)), [sortedFiltered, selectedIds]);

    const bulkExport = () => {
        const rows = selectedIds.size ? selectedRows : sortedFiltered;
        downloadReportsPaymentsCsv(rows, selectedIds.size ? 'reports-payments-selected.csv' : 'reports-payments-export.csv');
        setToast({ msg: 'CSV downloaded.' });
    };

    const selectClass =
        'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

    const columns: DataTableColumn<PaymentRecord>[] = useMemo(
        () => [
            {
                id: 'payment_id',
                header: 'Payment ID',
                sticky: true,
                sortable: true,
                sortValue: (p) => p.slug.toLowerCase(),
                minWidth: 140,
                render: (p) => (
                    <Link
                        href={withReturnTo(`${PAY_VIEW}/${encodeURIComponent(p.slug)}`, returnTo)}
                        className={cn(REPORT_ROW_LINK_CLASS, 'block max-w-[200px] truncate')}
                        title={p.slug}
                    >
                        {p.slug}
                    </Link>
                ),
            },
            {
                id: 'booking_id',
                header: 'Booking ID',
                sortable: true,
                sortValue: (p) => p.bookingSlug.toLowerCase(),
                minWidth: 140,
                render: (p) => (
                    <Link
                        href={withReturnTo(`${BOOKING_VIEW}/${encodeURIComponent(p.bookingSlug)}`, returnTo)}
                        className={cn(REPORT_ROW_LINK_CLASS, 'block max-w-[220px] truncate')}
                        title={p.bookingSlug}
                    >
                        {p.bookingSlug}
                    </Link>
                ),
            },
            {
                id: 'date',
                header: 'Date',
                sortable: true,
                sortValue: (p) => p.date,
                minWidth: 100,
                render: (p) => <span className="whitespace-nowrap text-slate-700 tabular-nums">{p.date}</span>,
            },
            {
                id: 'amount',
                header: 'Amount',
                sortable: true,
                sortValue: (p) => p.amount,
                minWidth: 100,
                render: (p) => <span className="tabular-nums font-medium text-slate-900">₹{p.amount.toLocaleString('en-IN')}</span>,
            },
            {
                id: 'mode',
                header: 'Mode',
                sortable: true,
                sortValue: (p) => p.mode,
                minWidth: 90,
                render: (p) => <span className="text-slate-800">{p.mode}</span>,
            },
            {
                id: 'receipt',
                header: 'Receipt #',
                sortable: true,
                sortValue: (p) => p.receiptNumber.toLowerCase(),
                minWidth: 110,
                render: (p) => (
                    <Link
                        href={withReturnTo(`${PAY_VIEW}/${encodeURIComponent(p.slug)}`, returnTo)}
                        className={cn(REPORT_ROW_LINK_CLASS, 'block max-w-[140px] truncate')}
                        title={`View payment · ${p.receiptNumber}`}
                    >
                        {p.receiptNumber}
                    </Link>
                ),
            },
            {
                id: 'status',
                header: 'Status',
                sortable: true,
                sortValue: (p) => p.status,
                minWidth: 100,
                render: (p) => <BpStatusBadge tone={paymentRecordStatusTone(p.status)}>{p.status}</BpStatusBadge>,
            },
            {
                id: 'source',
                header: 'Source',
                sortable: true,
                sortValue: (p) => p.source,
                minWidth: 100,
                render: (p) => <span className="text-sm text-slate-700">{p.source === 'Payment Link' ? 'Payment link' : 'Manual'}</span>,
            },
        ],
        [returnTo],
    );

    return (
        <div className="space-y-6">
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}

            <Breadcrumb
                items={[
                    { label: 'Booking & Payment', href: '/company-admin/booking-payment/booking' },
                    { label: 'Reports', href: '/company-admin/booking-payment/reports' },
                ]}
            />

            <div className="mb-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports</h1>
                <p className="mt-1 text-sm font-medium text-slate-500">
                    KPIs and payment drill-down. Search, columns, filters, and export match the rest of Booking &amp; Payment.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card className="border-none shadow-md">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-slate-500">Total revenue (collected)</p>
                            <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">₹{s.totalRevenue.toLocaleString('en-IN')}</p>
                            <p className="mt-2 text-xs font-semibold text-slate-500">Completed payments</p>
                        </div>
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                            <LuTrendingUp size={24} />
                        </span>
                    </div>
                </Card>
                <Card className="border-none shadow-md">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-slate-500">Pending (ledger)</p>
                            <p className="mt-2 text-3xl font-black tabular-nums text-blue-900">₹{s.pendingTotal.toLocaleString('en-IN')}</p>
                            <p className="mt-2 text-xs font-semibold text-slate-500">Pending payments</p>
                        </div>
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                            <LuPercent size={24} />
                        </span>
                    </div>
                </Card>
                <Card className="border-none shadow-md">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-bold text-slate-500">Collection efficiency</p>
                            <p className="mt-2 text-3xl font-black tabular-nums text-blue-900">{s.collectionEfficiency}%</p>
                            <p className="mt-2 text-xs font-semibold text-slate-500">Mock ratio vs booking value</p>
                        </div>
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                            <LuPercent size={24} />
                        </span>
                    </div>
                </Card>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-slate-900">Payments in range</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                    {filteredPayments.length} row(s) in view · {filters.dateFrom} → {filters.dateTo}
                </p>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="order-2 flex min-w-0 flex-1 items-center gap-2 sm:order-1">
                    <div className="relative flex-1 max-w-xl">
                        <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Search payment ID, booking, receipt, amount, mode…"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applySearchToFilters()}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            aria-label="Search report rows"
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
                                {[
                                    ['payment_id', 'Payment ID'],
                                    ['booking_id', 'Booking ID'],
                                    ['date', 'Date'],
                                    ['amount', 'Amount'],
                                    ['mode', 'Mode'],
                                    ['receipt', 'Receipt #'],
                                    ['status', 'Status'],
                                    ['source', 'Source'],
                                ].map(([id, label]) => (
                                    <label key={id} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-blue-600"
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

                    <Button type="button" variant="company" size="cta" className="gap-2 shadow-md shadow-blue-600/15" onClick={onExportCsv}>
                        <LuDownload size={18} />
                        Export CSV
                    </Button>
                </div>
            </div>

            {selectedIds.size > 0 ? (
                <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-950">
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

            <DataTable<PaymentRecord>
                columns={columns}
                data={paginatedPayments}
                getRowId={(p) => p.slug}
                sort={sort}
                onSortChange={setSort}
                columnVisibility={columnVisibility}
                columnWidths={columnWidths}
                onColumnWidthsChange={setColumnWidths}
                storageKey={TABLE_STORAGE_KEY}
                stickyColumnId="payment_id"
                enableClientSort={false}
                selection={{ rowKey: 'slug', selectedIds, onSelectedIdsChange: setSelectedIds }}
                emptyMessage="No payments in this range. Adjust filters or search."
            />

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={sortedFiltered.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    label="payments"
                />
            </div>

            {drawerOpen ? (
                <>
                    <button type="button" className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]" aria-label="Close" onClick={() => setDrawerOpen(false)} />
                    <aside
                        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
                        role="dialog"
                        aria-label="Report filters"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-bold text-slate-900">Report filters</h2>
                            <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setDrawerOpen(false)}>
                                <LuX size={20} />
                            </button>
                        </div>
                        <form onSubmit={onApplyRangeInDrawer} className="flex flex-1 flex-col overflow-hidden">
                            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                                <InputField
                                    label="From"
                                    type="date"
                                    required
                                    value={fromDate}
                                    error={fieldErrors.fromDate}
                                    onChange={(e) => {
                                        setFromDate(e.target.value);
                                        clearReportField('fromDate');
                                    }}
                                />
                                <InputField
                                    label="To"
                                    type="date"
                                    required
                                    value={toDate}
                                    max={new Date().toISOString().slice(0, 10)}
                                    error={fieldErrors.toDate}
                                    onChange={(e) => {
                                        setToDate(e.target.value);
                                        clearReportField('toDate');
                                    }}
                                />
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                                    <select
                                        className={`mt-1.5 ${selectClass}`}
                                        value={filters.statusFilter}
                                        onChange={(e) =>
                                            setFilters((f) => ({ ...f, statusFilter: e.target.value as 'All' | PaymentRecordStatus }))
                                        }
                                    >
                                        <option value="All">All statuses</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Failed">Failed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source</label>
                                    <select
                                        className={`mt-1.5 ${selectClass}`}
                                        value={filters.sourceFilter}
                                        onChange={(e) =>
                                            setFilters((f) => ({ ...f, sourceFilter: e.target.value as 'All' | PaymentSource }))
                                        }
                                    >
                                        <option value="All">All sources</option>
                                        <option value="Manual">Manual</option>
                                        <option value="Payment Link">Payment link</option>
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
                                                        className="w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium text-blue-800 hover:bg-white"
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
                            <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4">
                                <Button type="submit" variant="company" size="cta" className="w-full gap-2">
                                    <LuFilter size={18} />
                                    Apply date range
                                </Button>
                                <div className="flex gap-2">
                                    <Button type="button" variant="companyOutline" size="cta" className="flex-1" onClick={resetAllFilters}>
                                        Reset all
                                    </Button>
                                    <Button type="button" variant="company" size="cta" className="flex-1" onClick={() => setDrawerOpen(false)}>
                                        Done
                                    </Button>
                                </div>
                            </div>
                        </form>
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
                <p className="mb-3 text-sm text-slate-600">Save the current date range, status, source, and search for quick access from the drawer.</p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. Last 30d · Completed"
                />
            </Modal>
        </div>
    );
}
