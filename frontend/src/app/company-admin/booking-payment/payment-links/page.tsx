'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { PaymentLinkRowActionsMenu } from '@/components/booking-payment/payment-links/PaymentLinkRowActionsMenu';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { ConfirmModal } from '@/components/booking-payment/ConfirmModal';
import { PaymentLinkStatusBadge } from '@/components/booking-payment/payment-links/PaymentLinkStatusBadge';
import {
    bulkDeletePaymentLinks,
    cancelPaymentLink,
    deletePaymentLink,
    getBookingBySlug,
    getEffectivePaymentLinkDisplayStatus,
    getHoursToExpiryEnd,
    getPaymentLinkBookingParty,
    getPaymentLinkBySlug,
    getPaymentLinks,
    type PaymentLinkDisplayStatus,
    type PaymentLinkRecord,
    type PaymentLinkSendVia,
} from '@/lib/bookingPaymentMockStore';
import { downloadPaymentLinksCsv } from '@/lib/exportPaymentLinksCsv';
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
    LuFileText,
    LuFilter,
    LuPlus,
    LuSearch,
    LuTrash2,
    LuX,
} from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { CTA_BULK_BAR, CTA_CHECKBOX_SM, CTA_FLOW_LINK_SEMIBOLD, CTA_INPUT_FOCUS, CTA_SHADOW_SOFT } from '@/lib/theme/ctaThemeClasses';

const LINKS_BASE = '/company-admin/booking-payment/payment-links';
const BOOKING_VIEW_BASE = '/company-admin/booking-payment/booking/view';

const SEND_VIA_OPTIONS: { value: PaymentLinkSendVia; label: string }[] = [
    { value: 'Email', label: 'Email' },
    { value: 'SMS', label: 'SMS' },
    { value: 'WhatsApp', label: 'WhatsApp' },
    { value: 'Email & SMS', label: 'Email & SMS' },
    { value: 'All channels', label: 'All channels' },
];

const STATUS_FILTER_OPTIONS: { value: 'All' | PaymentLinkDisplayStatus; label: string }[] = [
    { value: 'All', label: 'All statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'Expired', label: 'Expired' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Cancelled', label: 'Cancelled' },
];

const ITEMS_PER_PAGE = 10;
const TABLE_STORAGE_KEY = 'arris-payment-links-table-v1';
const LEGACY_SAVED_VIEWS_KEY = 'arris-payment-links-saved-views';

type PaymentLinksFilterPayload = {
    searchTerm: string;
    statusFilter: 'All' | PaymentLinkDisplayStatus;
    bookingFilter: string;
    sendViaFilter: 'All' | PaymentLinkSendVia;
};

type SavedPaymentLinkView = { id: string; name: string; payload: PaymentLinksFilterPayload };

function defaultPaymentLinkFilters(): PaymentLinksFilterPayload {
    return {
        searchTerm: '',
        statusFilter: 'All',
        bookingFilter: 'All',
        sendViaFilter: 'All',
    };
}

function sortPaymentLinksList(rows: PaymentLinkRecord[], sort: DataTableSortState): PaymentLinkRecord[] {
    const col = sort.columnId;
    if (!col || col === 'actions') return [...rows];
    const dir = sort.direction === 'asc' ? 1 : -1;
    const copy = [...rows];
    copy.sort((a, b) => {
        let va: string | number = '';
        let vb: string | number = '';
        switch (col) {
            case 'link_id':
                va = a.slug.toLowerCase();
                vb = b.slug.toLowerCase();
                break;
            case 'booking_id':
                va = a.bookingSlug.toLowerCase();
                vb = b.bookingSlug.toLowerCase();
                break;
            case 'customer':
                va = getPaymentLinkBookingParty(a.bookingSlug).customerName.toLowerCase();
                vb = getPaymentLinkBookingParty(b.bookingSlug).customerName.toLowerCase();
                break;
            case 'amount':
                va = a.amount;
                vb = b.amount;
                break;
            case 'expiry':
                va = a.expiryDate;
                vb = b.expiryDate;
                break;
            case 'purpose':
                va = a.purpose;
                vb = b.purpose;
                break;
            case 'send_via':
                va = a.sendVia ?? '';
                vb = b.sendVia ?? '';
                break;
            case 'status':
                va = getEffectivePaymentLinkDisplayStatus(a);
                vb = getEffectivePaymentLinkDisplayStatus(b);
                break;
            default:
                return 0;
        }
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
    return copy;
}

export default function PaymentLinksPage() {
    const router = useRouter();
    const pathname = usePathname() ?? LINKS_BASE;
    const globalViewsTick = useGlobalSavedViewsSync();
    const [v, setV] = useState(0);

    const links = useMemo(() => getPaymentLinks(), [v]);

    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const dismissToast = useCallback(() => setToast(null), []);

    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<string | null>(null);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const [filters, setFilters] = useState<PaymentLinksFilterPayload>(() => defaultPaymentLinkFilters());
    const [searchDraft, setSearchDraft] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [saveModalOpen, setSaveModalOpen] = useState(false);
    const [saveViewName, setSaveViewName] = useState('');

    useEffect(() => {
        importLegacyLocalSavedViewsOnce(pathname, 'Payment links', LEGACY_SAVED_VIEWS_KEY, DEFAULT_SAVED_VIEW_AUTHOR);
    }, [pathname]);

    const savedViews = useMemo((): SavedPaymentLinkView[] => {
        return loadGlobalSavedViews()
            .filter((v) => normalizeSavedViewRoute(v.route) === normalizeSavedViewRoute(pathname))
            .map((v) => ({ id: v.id, name: v.name, payload: v.filters as PaymentLinksFilterPayload }));
    }, [pathname, globalViewsTick]);

    useConsumePendingSavedView(normalizeSavedViewRoute(pathname), (f) => {
        const p = f as Partial<PaymentLinksFilterPayload>;
        setFilters({ ...defaultPaymentLinkFilters(), ...p });
        setSearchDraft(String(p.searchTerm ?? ''));
    });

    const [sort, setSort] = useState<DataTableSortState>({ columnId: 'expiry', direction: 'desc' });
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
        const ids = ['link_id', 'booking_id', 'customer', 'amount', 'purpose', 'expiry', 'status', 'send_via', 'actions'];
        return Object.fromEntries(ids.map((id) => [id, true])) as Record<string, boolean>;
    });
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        link_id: 140,
        booking_id: 140,
        customer: 176,
        amount: 100,
        purpose: 120,
        expiry: 110,
        status: 120,
        send_via: 130,
        actions: 132,
    });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [columnMenuOpen, setColumnMenuOpen] = useState(false);
    const columnMenuRef = useRef<HTMLDivElement>(null);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

    useEffect(() => {
        const t = window.setTimeout(() => {
            setFilters((f) => (f.searchTerm === searchDraft ? f : { ...f, searchTerm: searchDraft }));
        }, 320);
        return () => window.clearTimeout(t);
    }, [searchDraft]);

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

    const bump = useCallback(() => {
        setV((x) => x + 1);
        setSelectedIds(new Set());
    }, []);

    const openView = useCallback(
        (slug: string) => {
            router.push(`${LINKS_BASE}/view/${encodeURIComponent(slug)}`);
        },
        [router],
    );

    const openEdit = useCallback(
        (slug: string) => {
            const row = getPaymentLinkBySlug(slug);
            if (!row) return;
            if (row.linkStatus === 'paid' || row.linkStatus === 'cancelled') {
                router.push(`${LINKS_BASE}/view/${encodeURIComponent(slug)}`);
                setToast({ msg: 'Paid or cancelled links cannot be edited.', err: true });
                return;
            }
            router.push(`${LINKS_BASE}/form?slug=${encodeURIComponent(slug)}`);
        },
        [router],
    );

    const bookingSlugOptions = useMemo(() => {
        const set = new Set(links.map((l) => l.bookingSlug));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [links]);

    const filteredLinks = useMemo(() => {
        const q = filters.searchTerm.trim().toLowerCase();
        return links.filter((l) => {
            const disp = getEffectivePaymentLinkDisplayStatus(l);
            const send = l.sendVia ?? 'Email & SMS';
            const b = getBookingBySlug(l.bookingSlug);
            const party = getPaymentLinkBookingParty(l.bookingSlug);
            const bookingSearch =
                b &&
                (b.customerName.toLowerCase().includes(q) ||
                    b.projectName.toLowerCase().includes(q) ||
                    b.unitId.toLowerCase().includes(q));
            const partySearch =
                party.customerName.toLowerCase().includes(q) || party.leadSummary.toLowerCase().includes(q);
            const matchesSearch =
                !q ||
                l.slug.toLowerCase().includes(q) ||
                l.bookingSlug.toLowerCase().includes(q) ||
                l.purpose.toLowerCase().includes(q) ||
                l.url.toLowerCase().includes(q) ||
                String(l.amount).includes(q) ||
                Boolean(bookingSearch) ||
                partySearch;
            const matchesStatus = filters.statusFilter === 'All' || disp === filters.statusFilter;
            const matchesBooking = filters.bookingFilter === 'All' || l.bookingSlug === filters.bookingFilter;
            const matchesSendVia = filters.sendViaFilter === 'All' || send === filters.sendViaFilter;
            return matchesSearch && matchesStatus && matchesBooking && matchesSendVia;
        });
    }, [links, filters]);

    const hasActiveFilters =
        filters.searchTerm.trim() !== '' ||
        filters.statusFilter !== 'All' ||
        filters.bookingFilter !== 'All' ||
        filters.sendViaFilter !== 'All';

    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, v, sort]);

    const sortedFilteredLinks = useMemo(() => sortPaymentLinksList(filteredLinks, sort), [filteredLinks, sort]);
    const totalPages = Math.max(1, Math.ceil(sortedFilteredLinks.length / ITEMS_PER_PAGE));
    const paginatedLinks = useMemo(
        () => sortedFilteredLinks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
        [sortedFilteredLinks, currentPage],
    );

    const persistSavedViews = (views: SavedPaymentLinkView[]) => {
        replaceViewsForRoute(
            pathname,
            'Payment links',
            views.map((x) => ({ id: x.id, name: x.name, payload: x.payload as Record<string, unknown> })),
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

    const applySavedView = (sv: SavedPaymentLinkView) => {
        setFilters({ ...defaultPaymentLinkFilters(), ...sv.payload });
        setSearchDraft(sv.payload.searchTerm ?? '');
        setDrawerOpen(false);
    };

    const deleteSavedView = (id: string) => {
        persistSavedViews(savedViews.filter((v) => v.id !== id));
    };

    const resetFilters = () => {
        setFilters(defaultPaymentLinkFilters());
        setSearchDraft('');
        setCurrentPage(1);
    };

    const selectClass = cn(
        'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800',
        CTA_INPUT_FOCUS,
    );

    const selectedRows = useMemo(() => sortedFilteredLinks.filter((l) => selectedIds.has(l.slug)), [sortedFilteredLinks, selectedIds]);

    const exportRowsForScope = () => (selectedIds.size ? selectedRows : sortedFilteredLinks);

    const runExportCsv = (filename: string) => {
        downloadPaymentLinksCsv(exportRowsForScope(), filename);
        setExportMenuOpen(false);
    };

    const runExportExcelCsv = () => {
        downloadPaymentLinksCsv(exportRowsForScope(), 'payment-links-excel.csv');
        setExportMenuOpen(false);
    };

    const bulkExportCsv = () => {
        downloadPaymentLinksCsv(
            exportRowsForScope(),
            selectedIds.size ? 'payment-links-selected.csv' : 'payment-links-export.csv',
        );
    };

    const confirmBulkDelete = () => {
        const slugs = [...selectedIds];
        if (!slugs.length) return;
        const { deleted, skipped } = bulkDeletePaymentLinks(slugs);
        setBulkDeleteOpen(false);
        bump();
        if (deleted > 0 && skipped.length === 0) {
            setToast({ msg: `${deleted} payment link(s) deleted.` });
        } else if (deleted > 0 && skipped.length > 0) {
            setToast({
                msg: `${deleted} deleted. ${skipped.length} skipped (e.g. paid or missing).`,
            });
        } else if (skipped.length > 0) {
            setToast({ msg: skipped[0]?.error ?? 'No links could be deleted.', err: true });
        }
    };

    const copyUrl = useCallback((url: string) => {
        void navigator.clipboard.writeText(url);
        setToast({ msg: 'Link copied to clipboard.' });
    }, []);

    const onConfirmCancel = () => {
        if (!cancelTarget) return;
        const res = cancelPaymentLink(cancelTarget);
        setCancelOpen(false);
        setCancelTarget(null);
        if (!res.ok) {
            setToast({ msg: res.error, err: true });
            return;
        }
        setToast({ msg: 'Payment link cancelled.' });
        bump();
    };

    const onConfirmDelete = () => {
        if (!deleteTarget) return;
        const res = deletePaymentLink(deleteTarget);
        setDeleteOpen(false);
        setDeleteTarget(null);
        if (!res.ok) {
            setToast({ msg: res.error, err: true });
            return;
        }
        setToast({ msg: 'Payment link deleted.' });
        bump();
    };

    const paymentLinkColumns: DataTableColumn<PaymentLinkRecord>[] = useMemo(
        () => [
            {
                id: 'link_id',
                header: 'Link ID',
                sortable: true,
                sortValue: (row) => row.slug.toLowerCase(),
                minWidth: 130,
                render: (row) => (
                    <Link
                        href={`${LINKS_BASE}/view/${encodeURIComponent(row.slug)}`}
                        className={cn('break-all font-mono text-xs font-semibold', CTA_FLOW_LINK_SEMIBOLD)}
                        title={`View payment link ${row.slug}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {row.slug}
                    </Link>
                ),
            },
            {
                id: 'booking_id',
                header: 'Booking ID',
                sortable: true,
                sortValue: (row) => row.bookingSlug.toLowerCase(),
                minWidth: 120,
                render: (row) => (
                    <Link
                        href={`${BOOKING_VIEW_BASE}/${encodeURIComponent(row.bookingSlug)}`}
                        className={cn('font-mono text-xs font-semibold', CTA_FLOW_LINK_SEMIBOLD)}
                        title={`View booking ${row.bookingSlug}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {row.bookingSlug}
                    </Link>
                ),
            },
            {
                id: 'customer',
                header: 'Customer / lead',
                sortable: true,
                sortValue: (row) => getPaymentLinkBookingParty(row.bookingSlug).customerName.toLowerCase(),
                minWidth: 160,
                render: (row) => {
                    const party = getPaymentLinkBookingParty(row.bookingSlug);
                    return (
                        <div className="min-w-0 max-w-[220px]">
                            <span className="block truncate font-medium text-slate-900" title={party.customerName}>
                                {party.customerName}
                            </span>
                            <span className="block truncate text-xs text-slate-500" title={party.leadSummary}>
                                {party.leadSummary}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'amount',
                header: 'Amount',
                sortable: true,
                sortValue: (row) => row.amount,
                minWidth: 90,
                render: (row) => (
                    <span className="tabular-nums font-bold text-slate-900">₹{row.amount.toLocaleString('en-IN')}</span>
                ),
            },
            {
                id: 'purpose',
                header: 'Purpose',
                sortable: true,
                sortValue: (row) => row.purpose.toLowerCase(),
                minWidth: 100,
                render: (row) => <span className="text-slate-800">{row.purpose}</span>,
            },
            {
                id: 'expiry',
                header: 'Expiry',
                sortable: true,
                sortValue: (row) => row.expiryDate,
                minWidth: 100,
                render: (row) => <span className="tabular-nums text-sm text-slate-800">{row.expiryDate}</span>,
            },
            {
                id: 'status',
                header: 'Status',
                sortable: true,
                sortValue: (row) => getEffectivePaymentLinkDisplayStatus(row),
                minWidth: 120,
                render: (row) => {
                    const disp = getEffectivePaymentLinkDisplayStatus(row);
                    const hrs = row.linkStatus === 'active' ? getHoursToExpiryEnd(row.expiryDate) : undefined;
                    return <PaymentLinkStatusBadge status={disp} hoursToExpiry={hrs} />;
                },
            },
            {
                id: 'send_via',
                header: 'Send via',
                sortable: true,
                sortValue: (row) => (row.sendVia ?? 'Email & SMS').toLowerCase(),
                minWidth: 120,
                render: (row) => <span className="text-sm text-slate-700">{row.sendVia ?? 'Email & SMS'}</span>,
            },
            {
                id: 'actions',
                header: '',
                sortable: false,
                minWidth: 120,
                cellClassName: 'text-right',
                render: (row) => {
                    const canEdit = row.linkStatus !== 'paid' && row.linkStatus !== 'cancelled';
                    const showCancel = row.linkStatus === 'active';
                    const showDelete = row.linkStatus !== 'paid';
                    return (
                        <PaymentLinkRowActionsMenu
                            onView={() => openView(row.slug)}
                            onEdit={() => openEdit(row.slug)}
                            onCopyUrl={() => copyUrl(row.url)}
                            onCancel={() => {
                                setCancelTarget(row.slug);
                                setCancelOpen(true);
                            }}
                            onDelete={() => {
                                setDeleteTarget(row.slug);
                                setDeleteOpen(true);
                            }}
                            canEdit={canEdit}
                            showCancel={showCancel}
                            showDelete={showDelete}
                        />
                    );
                },
            },
        ],
        [openView, openEdit, copyUrl],
    );

    return (
        <div className="space-y-6">
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}

            <ConfirmModal
                open={cancelOpen}
                title="Cancel payment link?"
                message="Customers will no longer be able to pay using this link. This cannot be undone for settlement records."
                confirmLabel="Cancel link"
                onCancel={() => {
                    setCancelOpen(false);
                    setCancelTarget(null);
                }}
                onConfirm={onConfirmCancel}
            />

            <ConfirmModal
                open={deleteOpen}
                title="Delete payment link?"
                message="This removes the link from your list. Paid links cannot be deleted."
                confirmLabel="Delete"
                onCancel={() => {
                    setDeleteOpen(false);
                    setDeleteTarget(null);
                }}
                onConfirm={onConfirmDelete}
            />

            <Breadcrumb
                items={[
                    { label: 'Booking & Payment', href: '/company-admin/booking-payment/booking' },
                    { label: 'Payment Links', href: '/company-admin/booking-payment/payment-links' },
                ]}
            />

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payment links</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Enterprise table — search, columns, filters, and actions for each link.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="company"
                    size="cta"
                    className={cn('gap-2 shrink-0', CTA_SHADOW_SOFT)}
                    onClick={() => router.push(`${LINKS_BASE}/form`)}
                >
                    <LuPlus size={18} />
                    New link
                </Button>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="order-2 flex min-w-0 flex-1 items-center gap-2 sm:order-1">
                    <div className="relative flex-1 max-w-xl">
                        <LuSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Search slug, booking, purpose, URL, amount, customer…"
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
                            aria-label="Search payment links"
                        />
                    </div>
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
                                    ['link_id', 'Link ID'],
                                    ['booking_id', 'Booking ID'],
                                    ['customer', 'Customer / lead'],
                                    ['amount', 'Amount'],
                                    ['purpose', 'Purpose'],
                                    ['expiry', 'Expiry'],
                                    ['status', 'Status'],
                                    ['send_via', 'Send via'],
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
                                        runExportCsv(selectedIds.size ? 'payment-links-selected.csv' : 'payment-links-export.csv')
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

            {hasActiveFilters && links.length > 0 ? (
                <p className="mb-3 text-xs font-medium text-slate-500">
                    Showing {filteredLinks.length} of {links.length} link{links.length === 1 ? '' : 's'}
                </p>
            ) : null}

            {selectedIds.size > 0 ? (
                <div className={cn('mb-4 flex flex-col gap-3 rounded-xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between', CTA_BULK_BAR)}>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <LuCheck size={18} />
                        {selectedIds.size} selected
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="companyOutline" size="sm" className="gap-1.5 bg-white" onClick={bulkExportCsv}>
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

            <DataTable<PaymentLinkRecord>
                columns={paymentLinkColumns}
                data={paginatedLinks}
                getRowId={(row) => row.slug}
                sort={sort}
                onSortChange={setSort}
                columnVisibility={columnVisibility}
                columnWidths={columnWidths}
                onColumnWidthsChange={setColumnWidths}
                storageKey={TABLE_STORAGE_KEY}
                stickyColumnId="link_id"
                enableClientSort={false}
                selection={{ rowKey: 'slug', selectedIds, onSelectedIdsChange: setSelectedIds }}
                emptyMessage={
                    links.length === 0 ? 'No payment links. Click “New link”.' : 'No links match your filters. Adjust filters or reset.'
                }
            />

            <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={sortedFilteredLinks.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    label="links"
                />
            </div>

            {drawerOpen ? (
                <>
                    <button
                        type="button"
                        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
                        aria-label="Close"
                        onClick={() => setDrawerOpen(false)}
                    />
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
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.statusFilter}
                                    onChange={(e) =>
                                        setFilters((f) => ({ ...f, statusFilter: e.target.value as 'All' | PaymentLinkDisplayStatus }))
                                    }
                                >
                                    {STATUS_FILTER_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Booking</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.bookingFilter}
                                    onChange={(e) => setFilters((f) => ({ ...f, bookingFilter: e.target.value }))}
                                >
                                    <option value="All">All bookings</option>
                                    {bookingSlugOptions.map((slug) => (
                                        <option key={slug} value={slug}>
                                            {slug}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Send via</label>
                                <select
                                    className={`mt-1.5 ${selectClass}`}
                                    value={filters.sendViaFilter}
                                    onChange={(e) =>
                                        setFilters((f) => ({ ...f, sendViaFilter: e.target.value as 'All' | PaymentLinkSendVia }))
                                    }
                                >
                                    <option value="All">All channels</option>
                                    {SEND_VIA_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {savedViews.length > 0 ? (
                                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                                    <p className="text-xs font-semibold uppercase text-slate-500">Saved views</p>
                                    <ul className="mt-2 space-y-1">
                                        {savedViews.map((sv) => (
                                            <li key={sv.id} className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-[var(--cta-button-bg)] hover:bg-white hover:text-[var(--cta-button-hover-bg)]"
                                                    onClick={() => applySavedView(sv)}
                                                >
                                                    {sv.name}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600"
                                                    aria-label={`Delete saved view ${sv.name}`}
                                                    onClick={() => deleteSavedView(sv.id)}
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
                title="Delete selected payment links"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setBulkDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" className="bg-rose-600 hover:bg-rose-700" onClick={confirmBulkDelete}>
                            Delete {selectedIds.size} link{selectedIds.size === 1 ? '' : 's'}
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Remove up to {selectedIds.size} selected link{selectedIds.size === 1 ? '' : 's'}? Paid links cannot be deleted and will be skipped.
                    Other links are removed from this demo list.
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
                    placeholder="e.g. Active · WhatsApp"
                />
            </Modal>
        </div>
    );
}
