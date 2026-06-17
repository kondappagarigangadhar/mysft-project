'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { BpStatusBadge, paymentRecordStatusTone } from '@/components/booking-payment/BpStatusBadge';
import { PaymentLedgerRowActionsMenu } from '@/components/booking-payment/payments/PaymentLedgerRowActionsMenu';
import { downloadPaymentLedgerCsv } from '@/lib/exportPaymentLedgerCsv';
import { downloadPaymentInvoicesCsv } from '@/lib/exportPaymentInvoicesCsv';
import { openPaymentInvoicesPrint } from '@/lib/openPaymentInvoicesPrint';
import {
    getBookingBySlug,
    getPaymentTransactionId,
    isPaymentReceiptReady,
    type PaymentLedgerRow,
    type PaymentMode,
    type PaymentRecordStatus,
} from '@/lib/bookingPaymentMockStore';
import { formatShortDate } from '@/lib/formatDate';
import { cn } from '@/lib/utils';
import { CTA_BULK_BAR, CTA_CHECKBOX_SM, CTA_FLOW_LINK_SEMIBOLD, CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';
import {
    DEFAULT_SAVED_VIEW_AUTHOR,
    loadGlobalSavedViews,
    normalizeSavedViewRoute,
    replaceViewsForRoute,
} from '@/lib/globalSavedViewsStore';
import { useConsumePendingSavedView } from '@/hooks/useConsumePendingSavedView';
import { useGlobalSavedViewsSync } from '@/hooks/useGlobalSavedViewsSync';
import {
    LuArrowRight,
    LuBookmark,
    LuCheck,
    LuChevronDown,
    LuColumns3,
    LuDownload,
    LuFilter,
    LuSearch,
    LuTrash2,
    LuX,
} from 'react-icons/lu';

const ITEMS_PER_PAGE = 10;
type LedgerFiltersPayload = {
    searchTerm: string;
    statusFilter: 'All' | PaymentRecordStatus;
    modeFilter: 'All' | PaymentMode;
};

type SavedView = { id: string; name: string; payload: LedgerFiltersPayload };

function defaultLedgerFilters(): LedgerFiltersPayload {
    return { searchTerm: '', statusFilter: 'All', modeFilter: 'All' };
}

function sortLedgerRows(rows: PaymentLedgerRow[], sort: DataTableSortState): PaymentLedgerRow[] {
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
            case 'transaction_id':
                va = getPaymentTransactionId(a).toLowerCase();
                vb = getPaymentTransactionId(b).toLowerCase();
                break;
            case 'booking_id':
                va = a.bookingSlug.toLowerCase();
                vb = b.bookingSlug.toLowerCase();
                break;
            case 'amount':
                va = a.amount;
                vb = b.amount;
                break;
            case 'date':
                va = a.date;
                vb = b.date;
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
            default:
                return 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

export function PaymentLedgerTable({
    rows,
    loading,
    onView,
    onEdit,
    onMarkCompleted,
    onViewReceipt,
    onDownloadReceiptPdf,
    onGenerateReceipt,
    onSendReminder,
    onDelete,
    onBulkDelete,
}: {
    rows: PaymentLedgerRow[];
    loading?: boolean;
    onView: (slug: string) => void;
    onEdit: (slug: string) => void;
    onMarkCompleted: (slug: string) => void;
    onViewReceipt: (slug: string) => void;
    onDownloadReceiptPdf?: (slug: string) => void;
    onGenerateReceipt: (slug: string) => void;
    onSendReminder: (slug: string) => void;
    onDelete: (slug: string) => void;
    onBulkDelete?: (slugs: string[]) => void;
}) {
    const tableStorageKey = useMemo(() => `arris-payment-ledger-${rows[0]?.bookingSlug ?? 'default'}`, [rows]);
    const pathname = usePathname() ?? '';
    const searchParams = useSearchParams();
    const searchStr = searchParams.toString();
    const savedViewRoute = useMemo(
        () => normalizeSavedViewRoute(searchStr ? `${pathname}?${searchStr}` : pathname),
        [pathname, searchStr],
    );
    const globalViewsTick = useGlobalSavedViewsSync();

    const [filters, setFilters] = useState<LedgerFiltersPayload>(() => defaultLedgerFilters());
    const [searchDraft, setSearchDraft] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');

    const savedViews = useMemo((): SavedView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === savedViewRoute)
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as LedgerFiltersPayload }));
    }, [savedViewRoute, globalViewsTick]);

    useConsumePendingSavedView(savedViewRoute, (f) => {
        const p = f as Partial<LedgerFiltersPayload>;
        setFilters({ ...defaultLedgerFilters(), ...p });
        setSearchDraft(String(p.searchTerm ?? ''));
    });

    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'date', direction: 'desc' });
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const ids = ['payment_id', 'transaction_id', 'booking_id', 'amount', 'date', 'mode', 'receipt', 'status', 'actions'];
        return Object.fromEntries(ids.map((id) => [id, true])) as Record<string, boolean>;
    });
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        payment_id: 168,
        transaction_id: 140,
        booking_id: 140,
        amount: 100,
        date: 110,
        mode: 90,
        receipt: 120,
        status: 110,
        actions: 132,
    });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

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

    const modeOptions = useMemo(() => {
        const s = new Set<PaymentMode>();
        rows.forEach((r) => s.add(r.mode));
        return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, [rows]);

    const filtered = useMemo(() => {
        const q = filters.searchTerm.trim().toLowerCase();
        return rows.filter((p) => {
            const tid = getPaymentTransactionId(p).toLowerCase();
            const matchesSearch =
                !q ||
                p.slug.toLowerCase().includes(q) ||
                tid.includes(q) ||
                p.bookingSlug.toLowerCase().includes(q) ||
                p.receiptNumber.toLowerCase().includes(q) ||
                String(p.amount).includes(q) ||
                p.date.toLowerCase().includes(q) ||
                p.mode.toLowerCase().includes(q);
            const matchesStatus = filters.statusFilter === 'All' || p.status === filters.statusFilter;
            const matchesMode = filters.modeFilter === 'All' || p.mode === filters.modeFilter;
            return matchesSearch && matchesStatus && matchesMode;
        });
    }, [rows, filters]);

    const hasActiveFilters =
        filters.searchTerm.trim() !== '' || filters.statusFilter !== 'All' || filters.modeFilter !== 'All';

    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        setCurrentPage(1);
    }, [rows, filters, sort]);

    const sortedFiltered = useMemo(() => sortLedgerRows(filtered, sort), [filtered, sort]);
    const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / ITEMS_PER_PAGE));
    const paginated = useMemo(
        () => sortedFiltered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sortedFiltered, currentPage],
    );

    const persistSavedViews = (views: SavedView[]) => {
        replaceViewsForRoute(
            savedViewRoute,
            'Payments ledger',
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
        setDrawerOpen(false);
    };

    const resetFilters = () => {
        setFilters(defaultLedgerFilters());
        setSearchDraft('');
        setCurrentPage(1);
    };

    const applySearchToFilters = () => {
        setFilters((f) => ({ ...f, searchTerm: searchDraft }));
        setCurrentPage(1);
    };

    const selectClass = cn(
        'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800',
        CTA_INPUT_FOCUS,
    );

    const selectedRows = useMemo(() => sortedFiltered.filter((p) => selectedIds.has(p.slug)), [sortedFiltered, selectedIds]);

    const bulkExport = () => {
        const data = selectedIds.size ? selectedRows : sortedFiltered;
        downloadPaymentLedgerCsv(data, selectedIds.size ? 'payment-ledger-selected.csv' : 'payment-ledger-export.csv');
    };

    const exportData = selectedIds.size ? selectedRows : sortedFiltered;
    const bookingTag = rows[0]?.bookingSlug ? rows[0].bookingSlug.replace(/[^\w-]+/g, '_').slice(0, 40) : 'ledger';

    const exportLedgerCsvFromMenu = () => {
        setExportMenuOpen(false);
        downloadPaymentLedgerCsv(exportData, `payment-ledger-${bookingTag}.csv`);
    };

    const exportInvoicesCsvFromMenu = () => {
        setExportMenuOpen(false);
        downloadPaymentInvoicesCsv(exportData, `payment-invoices-${bookingTag}.csv`);
    };

    const exportInvoicesPdfFromMenu = () => {
        setExportMenuOpen(false);
        const b = rows[0] ? getBookingBySlug(rows[0].bookingSlug) : null;
        openPaymentInvoicesPrint(exportData, b ? `Invoices · ${b.customerName}` : 'Payment invoices');
    };

    const bulkDelete = () => {
        if (!selectedIds.size) return;
        const slugs = [...selectedIds];
        if (onBulkDelete) {
            onBulkDelete(slugs);
            setSelectedIds(new Set());
            return;
        }
        if (!window.confirm(`Delete ${slugs.length} payment row(s) from the ledger? This cannot be undone in the demo.`)) return;
        for (const slug of slugs) {
            onDelete(slug);
        }
        setSelectedIds(new Set());
    };

    const columns: DataTableColumn<PaymentLedgerRow>[] = useMemo(
        () => [
            {
                id: 'payment_id',
                header: 'Payment ID',
                sticky: true,
                sortable: true,
                sortValue: (row) => row.slug.toLowerCase(),
                minWidth: 150,
                render: (p) => {
                    const isInstallment = p.scheduleTypeResolved === 'installment';
                    return (
                        <div className="flex flex-col gap-1 min-w-0">
                            <Link
                                href={`/company-admin/booking-payment/payments/view/${encodeURIComponent(p.slug)}`}
                                className={cn('w-fit max-w-full truncate font-mono text-xs font-semibold', CTA_FLOW_LINK_SEMIBOLD)}
                                title={`View payment ${p.slug}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {p.slug}
                            </Link>
                            {isInstallment ? (
                                <Link
                                    href={`/company-admin/booking-payment/payments/installments?booking=${encodeURIComponent(p.bookingSlug)}`}
                                    title="Open installment schedules for this booking"
                                    className={cn(
                                        'inline-flex w-fit items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--cta-button-bg)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]',
                                        'hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_18%,white)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] focus-visible:ring-offset-1',
                                    )}
                                >
                                    Installment plan
                                    <LuArrowRight size={12} className="shrink-0 text-[var(--cta-button-bg)]" aria-hidden />
                                </Link>
                            ) : null}
                        </div>
                    );
                },
            },
            {
                id: 'transaction_id',
                header: 'Transaction ID',
                sortable: true,
                sortValue: (row) => getPaymentTransactionId(row).toLowerCase(),
                minWidth: 120,
                render: (p) => (
                    <span className="font-mono text-[11px] text-violet-900 truncate block max-w-[180px]" title={getPaymentTransactionId(p)}>
                        {getPaymentTransactionId(p)}
                    </span>
                ),
            },
            {
                id: 'booking_id',
                header: 'Booking ID',
                sortable: true,
                sortValue: (row) => row.bookingSlug.toLowerCase(),
                minWidth: 120,
                render: (p) => (
                    <Link
                        href={`/company-admin/booking-payment/booking/view/${encodeURIComponent(p.bookingSlug)}`}
                        className={cn(
                            'block max-w-[160px] truncate font-mono text-xs font-semibold',
                            CTA_FLOW_LINK_SEMIBOLD,
                        )}
                        title={`View booking ${p.bookingSlug}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {p.bookingSlug}
                    </Link>
                ),
            },
            {
                id: 'amount',
                header: 'Amount',
                sortable: true,
                sortValue: (row) => row.amount,
                minWidth: 90,
                render: (p) => <span className="tabular-nums font-medium text-slate-900">₹{p.amount.toLocaleString('en-IN')}</span>,
            },
            {
                id: 'date',
                header: 'Date',
                sortable: true,
                sortValue: (row) => row.date,
                minWidth: 100,
                render: (p) => <span className="whitespace-nowrap text-slate-700">{formatShortDate(p.date)}</span>,
            },
            {
                id: 'mode',
                header: 'Mode',
                sortable: true,
                sortValue: (row) => row.mode,
                minWidth: 80,
                render: (p) => <span className="text-slate-800">{p.mode}</span>,
            },
            {
                id: 'receipt',
                header: 'Receipt #',
                sortable: true,
                sortValue: (row) => row.receiptNumber.toLowerCase(),
                minWidth: 110,
                render: (p) => (
                    <span className="font-mono text-xs text-slate-800 truncate max-w-[140px] block" title={p.receiptNumber}>
                        {p.receiptNumber}
                    </span>
                ),
            },
            {
                id: 'status',
                header: 'Status',
                sortable: true,
                sortValue: (row) => row.status,
                minWidth: 100,
                render: (p) => <BpStatusBadge tone={paymentRecordStatusTone(p.status)}>{p.status}</BpStatusBadge>,
            },
            {
                id: 'actions',
                header: '',
                sortable: false,
                stickyEnd: true,
                minWidth: 120,
                cellClassName: 'text-right',
                render: (p) => (
                    <PaymentLedgerRowActionsMenu
                        slug={p.slug}
                        status={p.status}
                        receiptReady={isPaymentReceiptReady(p)}
                        onView={onView}
                        onEdit={onEdit}
                        onMarkCompleted={onMarkCompleted}
                        onViewReceipt={onViewReceipt}
                        onDownloadReceiptPdf={onDownloadReceiptPdf}
                        onGenerateReceipt={onGenerateReceipt}
                        onSendReminder={onSendReminder}
                        onDelete={onDelete}
                    />
                ),
            },
        ],
        [onView, onEdit, onMarkCompleted, onViewReceipt, onDownloadReceiptPdf, onGenerateReceipt, onSendReminder, onDelete],
    );

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-6 w-40 bg-slate-100 rounded" />
                <div className="overflow-x-auto rounded-xl border border-slate-200 -mx-2">
                    <div className="h-48 bg-slate-100 min-w-[1180px]" />
                </div>
            </div>
        );
    }

    if (rows.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
                <p className="text-sm font-semibold text-slate-700">No payments yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Record a payment for this booking. Use Installment view for per-line schedules and due dates.
                </p>
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
                            placeholder="Search payment ID, transaction ID, receipt, amount, date…"
                            value={searchDraft}
                            onChange={(e) => setSearchDraft(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applySearchToFilters()}
                            className={cn(
                                'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white',
                                CTA_INPUT_FOCUS,
                            )}
                            aria-label="Search ledger"
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
                                    ['transaction_id', 'Transaction ID'],
                                    ['booking_id', 'Booking ID'],
                                    ['amount', 'Amount'],
                                    ['date', 'Date'],
                                    ['mode', 'Mode'],
                                    ['receipt', 'Receipt #'],
                                    ['status', 'Status'],
                                ].map(([id, label]) => (
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

                    {rows.length > 0 ? (
                        <div className="relative" ref={exportMenuRef}>
                            <Button
                                type="button"
                                variant="companyOutline"
                                size="cta"
                                className="gap-2"
                                onClick={() => setExportMenuOpen((o) => !o)}
                            >
                                <LuDownload size={18} />
                                Export
                                <LuChevronDown size={16} className="opacity-70" aria-hidden />
                            </Button>
                            {exportMenuOpen ? (
                                <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        {selectedIds.size ? `${selectedIds.size} selected` : 'All filtered rows'}
                                    </p>
                                    <button
                                        type="button"
                                        className="flex w-full px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                                        onClick={exportLedgerCsvFromMenu}
                                    >
                                        Ledger (CSV)
                                    </button>
                                    <button
                                        type="button"
                                        className="flex w-full px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                                        onClick={exportInvoicesCsvFromMenu}
                                    >
                                        Invoices (CSV)
                                    </button>
                                    <button
                                        type="button"
                                        className="flex w-full px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                                        onClick={exportInvoicesPdfFromMenu}
                                    >
                                        Invoices (PDF)
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>

            {hasActiveFilters ? (
                <p className="text-xs font-medium text-slate-500">
                    Showing {filtered.length} of {rows.length} row{rows.length === 1 ? '' : 's'}
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

            <DataTable<PaymentLedgerRow>
                columns={columns}
                data={paginated}
                getRowId={(row) => row.slug}
                sort={sort}
                onSortChange={setSort}
                columnVisibility={columnVisibility}
                columnWidths={columnWidths}
                onColumnWidthsChange={setColumnWidths}
                storageKey={tableStorageKey}
                stickyColumnId="payment_id"
                enableClientSort={false}
                selection={{ rowKey: 'slug', selectedIds, onSelectedIdsChange: setSelectedIds }}
                emptyMessage="No payments match your filters. Adjust filters or reset."
                className="rounded-xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5"
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
                        aria-label="Filters"
                    >
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <h2 className="text-lg font-bold text-slate-900">Ledger filters</h2>
                            <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setDrawerOpen(false)}>
                                <LuX size={20} />
                            </button>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.statusFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, statusFilter: e.target.value as 'All' | PaymentRecordStatus }))}
                                >
                                    <option value="All">All statuses</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Failed">Failed</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment mode</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.modeFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, modeFilter: e.target.value as 'All' | PaymentMode }))}
                                >
                                    <option value="All">All modes</option>
                                    {modeOptions.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
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
                                                    className="w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium text-[var(--cta-button-bg)] hover:bg-white hover:text-[var(--cta-button-hover-bg)]"
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
                <p className="mb-3 text-sm text-slate-600">Save the current ledger filters and search for quick access from the drawer.</p>
                <label className="text-xs font-bold uppercase text-slate-400">View name</label>
                <input
                    value={saveViewName}
                    onChange={(e) => setSaveViewName(e.target.value)}
                    className={cn(
                        'mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm',
                        CTA_INPUT_FOCUS,
                    )}
                    placeholder="e.g. Pending · Bank"
                />
            </Modal>
        </div>
    );
}
