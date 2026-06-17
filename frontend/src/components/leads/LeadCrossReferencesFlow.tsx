'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { DataTableColumn } from '@/components/DataTable/DataTable';
import { RelationPicker } from '@/components/RelationPicker/RelationPicker';
import { SelectedRelationsTable } from '@/components/RelationPicker/SelectedRelationsTable';
import { LeadJourneyPreviewModal } from '@/components/leads/LeadJourneyPreviewModal';
import {
    createBooking,
    deleteBooking,
    deletePayment,
    getBookingBySlug,
    getBookingPaymentSummary,
    getBookings,
    type BookingRecord,
    type PaymentRecord,
} from '@/lib/bookingPaymentMockStore';
import {
    formatLeadCode,
    setLeadCrossReferences,
    type Lead,
    type LeadLinkedBookingRef,
    type LeadLinkedDocumentRef,
    type LeadLinkedPaymentRef,
} from '@/lib/leadStore';
import {
    fetchDocumentLookupRows,
    fetchDocumentLookupRowsForLead,
    fetchLeadBookingInventory,
    fetchLeadBookingInventoryAvailable,
    getPaymentsForLeadCode,
    resolveInventoryUnitHref,
    type DocumentLookupRow,
    type InventoryUnitRow,
} from '@/services/relationLookupService';
import { getDemoProjectNamesList } from '@/lib/demoCatalog';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
    CTA_FLOW_CHIP_LINK,
    CTA_FLOW_ICON_TILE,
    CTA_FLOW_LINK,
    CTA_FLOW_LINK_SEMIBOLD,
    CTA_GHOST_ROW_HOVER,
} from '@/lib/theme/ctaThemeClasses';
import {
    LuArrowRight,
    LuBanknote,
    LuCalendar,
    LuFileText,
    LuLayoutGrid,
    LuLink2,
    LuPencil,
    LuPlus,
    LuTrash2,
} from 'react-icons/lu';

function inr(n: number): string {
    return `₹${n.toLocaleString('en-IN')}`;
}

function syntheticInventoryRow(b: BookingRecord): InventoryUnitRow {
    return {
        id: b.slug,
        unitId: b.unitId,
        projectName: b.projectName,
        unitType: '—',
        type: b.unitConfiguration?.trim() || '—',
        price: b.unitPrice,
        status: 'Booked',
    };
}

/** Project Inventory tab (no unit query). */
function inventoryProjectTabHref(row: InventoryUnitRow): string | undefined {
    const unitHref = row.inventoryHref?.trim() || resolveInventoryUnitHref(row.projectName, row.unitId);
    if (!unitHref) return undefined;
    const path = unitHref.split('?')[0];
    return `${path}?tab=inventory`;
}

/** Deep link with unit selected (same as main inventory list). */
function inventoryUnitDetailHref(row: InventoryUnitRow): string | undefined {
    return row.inventoryHref?.trim() || resolveInventoryUnitHref(row.projectName, row.unitId);
}

/** Project Inventory tab for a saved booking row. */
function bookingProjectTabHref(b: BookingRecord): string | undefined {
    const unitHref = resolveInventoryUnitHref(b.projectName, b.unitId);
    if (!unitHref) return undefined;
    return `${unitHref.split('?')[0]}?tab=inventory`;
}

function ensureBookingRef(row: InventoryUnitRow, lead: Lead): LeadLinkedBookingRef {
    const code = formatLeadCode(lead.id);
    const byRowId = getBookingBySlug(row.id);
    if (byRowId) {
        return { id: `lb-${byRowId.slug}`, bookingSlug: byRowId.slug };
    }
    const existing = getBookings().find((b) => b.projectName === row.projectName && b.unitId === row.unitId);
    if (existing) {
        return { id: `lb-${existing.slug}`, bookingSlug: existing.slug };
    }
    const b = createBooking({
        leadId: code,
        assignedTo: lead.assignedTo?.trim() || 'Sales Team',
        customerName: lead.name,
        phone: lead.phone,
        projectName: row.projectName,
        unitId: row.unitId,
        unitConfiguration: row.type,
        unitPrice: row.price,
        status: 'Pending',
        dealPaymentMode: 'milestone',
    });
    return { id: `lb-${b.slug}`, bookingSlug: b.slug };
}

function aggregateBookingMoney(bookingSlugs: string[]): { total: number; paid: number; pending: number } {
    let total = 0;
    let paid = 0;
    for (const slug of bookingSlugs) {
        const s = getBookingPaymentSummary(slug);
        if (!s) continue;
        total += s.unitPrice;
        paid += s.paidCompleted;
    }
    return { total, paid, pending: Math.max(0, total - paid) };
}

function mergeByRefId<T extends { id: string }>(list: T[]): T[] {
    const m = new Map(list.map((x) => [x.id, x]));
    return [...m.values()];
}

function sortPayments(a: PaymentRecord, b: PaymentRecord): number {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.slug.localeCompare(a.slug);
}

function sortBookings(a: BookingRecord, b: BookingRecord): number {
    if (a.bookingDate !== b.bookingDate) return b.bookingDate.localeCompare(a.bookingDate);
    return b.slug.localeCompare(a.slug);
}

type LeadCrossReferencesFlowProps = {
    lead: Lead;
    listVersion: number;
    onBump: () => void;
    readOnly?: boolean;
};

export function LeadCrossReferencesFlow({ lead, listVersion, onBump, readOnly }: LeadCrossReferencesFlowProps) {
    const [inventoryPick, setInventoryPick] = useState<InventoryUnitRow[]>([]);
    const [invSnapshot, setInvSnapshot] = useState<InventoryUnitRow[]>([]);
    const [bookingInventoryPickerOpen, setBookingInventoryPickerOpen] = useState(false);
    const [inventoryFilterProject, setInventoryFilterProject] = useState<string>('__all__');
    const [inventoryFilterUnitType, setInventoryFilterUnitType] = useState<string>('__all__');
    const [derivedDocuments, setDerivedDocuments] = useState<DocumentLookupRow[]>([]);

    const leadCode = formatLeadCode(lead.id);

    const bookingRows = useMemo(() => {
        void listVersion;
        return getBookings()
            .filter((b) => b.leadId.trim() === leadCode)
            .sort(sortBookings);
    }, [leadCode, listVersion]);

    const bookingSlugsForLead = useMemo(() => bookingRows.map((b) => b.slug), [bookingRows]);

    const hasBooking = bookingRows.length > 0;
    /** Newest booking first — same order as the bookings table; used to deep-link straight to the ledger (`?booking=`). */
    const primaryBookingSlug = bookingRows[0]?.slug ?? '';

    const leadPayments = useMemo(() => {
        void listVersion;
        return [...getPaymentsForLeadCode(leadCode)].sort(sortPayments);
    }, [leadCode, listVersion]);

    const money = useMemo(() => aggregateBookingMoney(bookingSlugsForLead), [bookingSlugsForLead]);

    /** Documents: unlocked once this lead has at least one booking (data is auto-resolved from compliance + bookings). */
    const documentsUnlocked = hasBooking;

    const derivedDocumentIds = useMemo(() => new Set(derivedDocuments.map((d) => d.id)), [derivedDocuments]);

    const [manualDocResolved, setManualDocResolved] = useState<DocumentLookupRow[]>([]);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            const all = await fetchDocumentLookupRows();
            if (cancelled) return;
            const byId = new Map(all.map((d) => [d.id, d]));
            const rows = lead.linkedDocuments
                .map((r) => byId.get(r.documentId))
                .filter((x): x is DocumentLookupRow => Boolean(x))
                .filter((d) => !derivedDocumentIds.has(d.id));
            setManualDocResolved(rows);
        })();
        return () => {
            cancelled = true;
        };
    }, [lead.linkedDocuments, derivedDocumentIds, listVersion]);

    const displayDocuments = useMemo(() => {
        const byId = new Map<string, DocumentLookupRow>();
        for (const d of derivedDocuments) byId.set(d.id, d);
        for (const d of manualDocResolved) byId.set(d.id, d);
        return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
    }, [derivedDocuments, manualDocResolved]);

    useEffect(() => {
        void fetchDocumentLookupRowsForLead(leadCode).then(setDerivedDocuments);
    }, [leadCode, listVersion]);

    useEffect(() => {
        void fetchLeadBookingInventory().then(setInvSnapshot);
    }, [listVersion]);

    /** Re-read mock store when returning from Booking & Payment (e.g. after recording a payment). */
    useEffect(() => {
        const refresh = () => onBump();
        const onVis = () => {
            if (document.visibilityState === 'visible') refresh();
        };
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', onVis);
        return () => {
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', onVis);
        };
    }, [onBump]);

    const syncLinkedBookingRefs = useCallback(() => {
        const refs: LeadLinkedBookingRef[] = getBookings()
            .filter((b) => b.leadId.trim() === leadCode)
            .map((b) => ({ id: `lb-${b.slug}`, bookingSlug: b.slug }));
        setLeadCrossReferences(lead.slug, { linkedBookings: mergeByRefId(refs) });
    }, [lead.slug, leadCode]);

    const hydrateInventoryPick = useCallback(async () => {
        const inv = await fetchLeadBookingInventory();
        const rows: InventoryUnitRow[] = [];
        for (const b of getBookings().filter((x) => x.leadId.trim() === leadCode)) {
            const direct = inv.find((r) => r.id === b.slug);
            if (direct) {
                rows.push(direct);
                continue;
            }
            const match = inv.find((r) => r.projectName === b.projectName && r.unitId === b.unitId);
            rows.push(match ?? syntheticInventoryRow(b));
        }
        setInventoryPick(rows);
    }, [leadCode]);

    useEffect(() => {
        void hydrateInventoryPick();
    }, [hydrateInventoryPick, listVersion]);

    const inventoryExcludeIds = useMemo(() => {
        const set = new Set<string>();
        for (const b of bookingRows) {
            const row = invSnapshot.find((r) => r.projectName === b.projectName && r.unitId === b.unitId);
            if (row) set.add(row.id);
        }
        return set;
    }, [bookingRows, invSnapshot]);

    const onInventoryChange = (rows: InventoryUnitRow[]) => {
        if (readOnly) return;
        const refs = mergeByRefId(rows.map((row) => ensureBookingRef(row, lead)));
        setLeadCrossReferences(lead.slug, { linkedBookings: refs });
        setInventoryPick(rows);
        onBump();
        syncLinkedBookingRefs();
    };

    const onBookingInventoryPickerOpenChange = useCallback((isOpen: boolean) => {
        if (isOpen) {
            setInventoryFilterProject('__all__');
            setInventoryFilterUnitType('__all__');
        }
        setBookingInventoryPickerOpen(isOpen);
    }, []);

    const onRemoveBooking = useCallback(
        (bookingSlug: string) => {
            if (readOnly) return;
            if (
                !window.confirm(
                    'Delete this booking? In the demo, this also removes payments and links tied to this booking.',
                )
            ) {
                return;
            }
            const result = deleteBooking(bookingSlug);
            if (!result.ok) {
                window.alert(result.error);
                return;
            }
            syncLinkedBookingRefs();
            void hydrateInventoryPick();
            onBump();
        },
        [readOnly, syncLinkedBookingRefs, hydrateInventoryPick, onBump],
    );

    const onRemovePayment = useCallback(
        (paymentSlug: string) => {
            if (readOnly) return;
            if (!window.confirm('Delete this payment from the ledger?')) return;
            const result = deletePayment(paymentSlug);
            if (!result.ok) {
                window.alert(result.error);
                return;
            }
            onBump();
        },
        [readOnly, onBump],
    );

    const onDocumentSelectionChange = (rows: DocumentLookupRow[]) => {
        if (readOnly) return;
        const refs: LeadLinkedDocumentRef[] = mergeByRefId(
            rows.map((d) => ({ id: `ld-${d.id}`, documentId: d.id })),
        );
        setLeadCrossReferences(lead.slug, { linkedDocuments: refs });
        onBump();
    };

    useEffect(() => {
        const canonical = getPaymentsForLeadCode(leadCode);
        const refs: LeadLinkedPaymentRef[] = mergeByRefId(
            canonical.map((p) => ({ id: `lp-${p.slug}`, paymentSlug: p.slug })),
        );
        const prevSlugs = lead.linkedPayments
            .map((x) => x.paymentSlug)
            .sort()
            .join('|');
        const nextSlugs = refs
            .map((x) => x.paymentSlug)
            .sort()
            .join('|');
        if (prevSlugs === nextSlugs) return;
        setLeadCrossReferences(lead.slug, { linkedPayments: refs });
    }, [lead.slug, leadCode, lead.linkedPayments, listVersion]);

    const inventoryRowFilter = useCallback((row: InventoryUnitRow) => {
        if (inventoryFilterProject !== '__all__' && row.projectName !== inventoryFilterProject) return false;
        if (inventoryFilterUnitType !== '__all__') {
            const ut = (row.unitType ?? '').trim();
            if (ut.toLowerCase() !== inventoryFilterUnitType.toLowerCase()) return false;
        }
        return true;
    }, [inventoryFilterProject, inventoryFilterUnitType]);

    const inventoryModalHeaderFilters = useMemo(
        () => (
            <>
                <div className="flex min-w-40 flex-col gap-1">
                    <label htmlFor="inv-filter-project" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Project
                    </label>
                    <select
                        id="inv-filter-project"
                        value={inventoryFilterProject}
                        onChange={(e) => setInventoryFilterProject(e.target.value)}
                        className="h-11 w-full min-w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
                    >
                        <option value="__all__">All projects</option>
                        {getDemoProjectNamesList().map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex min-w-36 flex-col gap-1">
                    <label htmlFor="inv-filter-unittype" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Unit type
                    </label>
                    <select
                        id="inv-filter-unittype"
                        value={inventoryFilterUnitType}
                        onChange={(e) => setInventoryFilterUnitType(e.target.value)}
                        className="h-11 w-full min-w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
                    >
                        <option value="__all__">All types</option>
                        <option value="Apartment">Apartment</option>
                        <option value="Villa">Villa</option>
                        <option value="Plot">Plot</option>
                    </select>
                </div>
            </>
        ),
        [inventoryFilterProject, inventoryFilterUnitType],
    );

    const inventoryColumns: DataTableColumn<InventoryUnitRow>[] = useMemo(
        () => [
           
            {
                key: 'project',
                header: 'Project name',
                render: (row) => {
                    const href = inventoryProjectTabHref(row);
                    if (!href) return <span className="text-slate-800">{row.projectName}</span>;
                    return (
                        <Link
                            href={href}
                            className={CTA_FLOW_LINK}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {row.projectName}
                        </Link>
                    );
                },
            },
            {
                key: 'unit',
                header: 'Unit ID',
                render: (row) => {
                    const href = inventoryUnitDetailHref(row);
                    if (!href) return <span className="tabular-nums text-slate-800">{row.unitId}</span>;
                    return (
                        <Link
                            href={href}
                            className={cn('tabular-nums', CTA_FLOW_LINK_SEMIBOLD)}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {row.unitId}
                        </Link>
                    );
                },
            },
            {
                key: 'configuration',
                header: 'Configuration',
                render: (row) => (
                    <span className="text-slate-800">{row.type?.trim() || '—'}</span>
                ),
            },
            {
                key: 'price',
                header: 'Unit price',
                render: (row) => <span className="tabular-nums font-medium text-slate-900">{inr(row.price)}</span>,
            },
        ],
        [],
    );

    const bookingSelectedColumns: DataTableColumn<BookingRecord>[] = useMemo(
        () => [
            {
                key: 'slug',
                header: 'Booking ID',
                headerClassName: 'min-w-[7.5rem]',
                render: (b) => (
                    <Link
                        href={`/company-admin/booking-payment/booking/view/${encodeURIComponent(b.slug)}`}
                        className={cn('font-mono text-sm', CTA_FLOW_LINK_SEMIBOLD)}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {b.slug}
                    </Link>
                ),
            },
            {
                key: 'bookingDate',
                header: 'Booked on',
                render: (b) => <span className="tabular-nums text-slate-700">{b.bookingDate}</span>,
            },
            {
                key: 'project',
                header: 'Project',
                render: (b) => {
                    const href = bookingProjectTabHref(b);
                    if (!href) return <span className="text-slate-800">{b.projectName}</span>;
                    return (
                        <Link
                            href={href}
                            className={CTA_FLOW_LINK}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {b.projectName}
                        </Link>
                    );
                },
            },
            {
                key: 'unit',
                header: 'Unit ID',
                render: (b) => {
                    const href = resolveInventoryUnitHref(b.projectName, b.unitId);
                    if (!href) return <span className="tabular-nums text-slate-800">{b.unitId}</span>;
                    return (
                        <Link
                            href={href}
                            className={cn('tabular-nums', CTA_FLOW_LINK_SEMIBOLD)}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {b.unitId}
                        </Link>
                    );
                },
            },
            {
                key: 'configuration',
                header: 'Configuration',
                render: (b) => (
                    <span className="text-slate-800">{b.unitConfiguration?.trim() || '—'}</span>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                render: (b) => (
                    <span
                        className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                            b.status === 'Pending' && 'bg-amber-50 text-amber-900 ring-1 ring-amber-100',
                            b.status === 'Confirmed' && 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100',
                            b.status === 'Cancelled' && 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80',
                        )}
                    >
                        {b.status}
                    </span>
                ),
            },
            {
                key: 'amount',
                header: 'Amount',
                render: (b) => (
                    <span className="tabular-nums font-semibold text-slate-900">{inr(b.unitPrice)}</span>
                ),
            },
        ],
        [],
    );

    const leadViewReturnTo = `/leads/view/${lead.slug}`;

    const bookingTableExtraColumns: DataTableColumn<BookingRecord>[] = useMemo(
        () =>
            readOnly
                ? []
                : [
                      {
                          key: 'bookingRowActions',
                          header: '',
                          headerClassName: 'min-w-0',
                          className: 'text-right',
                          render: (b) => (
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                  <div className="flex items-center gap-0.5">
                                      <Link
                                          href={`/company-admin/booking-payment/booking/edit/${encodeURIComponent(b.slug)}?returnTo=${encodeURIComponent(leadViewReturnTo)}`}
                                          className={CTA_FLOW_ICON_TILE}
                                          aria-label="Edit booking"
                                          title="Edit booking"
                                          onClick={(e) => e.stopPropagation()}
                                      >
                                          <LuPencil size={15} aria-hidden />
                                      </Link>
                                      <Button
                                          type="button"
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8 min-h-0 shrink-0 rounded-lg border-red-200 bg-white p-0 text-red-600 shadow-sm hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                                          aria-label="Delete booking"
                                          title="Delete booking"
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              onRemoveBooking(b.slug);
                                          }}
                                      >
                                          <LuTrash2 size={15} aria-hidden />
                                      </Button>
                                  </div>
                                  <Link
                                      href={`/company-admin/booking-payment/payments/add?booking=${encodeURIComponent(b.slug)}&returnTo=${encodeURIComponent(leadViewReturnTo)}`}
                                      className={CTA_FLOW_CHIP_LINK}
                                      onClick={(e) => e.stopPropagation()}
                                  >
                                      <LuCalendar size={14} aria-hidden />
                                      Add payment
                                  </Link>
                              </div>
                          ),
                      },
                  ],
        [readOnly, leadViewReturnTo, onRemoveBooking],
    );

    const paymentColumns: DataTableColumn<PaymentRecord>[] = useMemo(
        () => [
            {
                key: 'id',
                header: 'Payment ID',
                render: (p) => (
                    <Link
                        href={`/company-admin/booking-payment/payments/view/${encodeURIComponent(p.slug)}`}
                        className={cn('font-mono text-sm', CTA_FLOW_LINK_SEMIBOLD)}
                    >
                        {p.slug}
                    </Link>
                ),
            },
            {
                key: 'booking',
                header: 'Booking',
                headerClassName: 'min-w-[9rem]',
                render: (p) => {
                    const b = getBookingBySlug(p.bookingSlug);
                    return (
                        <div className="flex flex-col gap-1.5">
                            <Link
                                href={`/company-admin/booking-payment/booking/view/${encodeURIComponent(p.bookingSlug)}`}
                                className={cn('font-mono text-xs', CTA_FLOW_LINK_SEMIBOLD)}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {p.bookingSlug}
                            </Link>
                            {b ? (
                                <span
                                    className={cn(
                                        'inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                        b.status === 'Pending' && 'bg-amber-50 text-amber-900 ring-1 ring-amber-100',
                                        b.status === 'Confirmed' && 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100',
                                        b.status === 'Cancelled' && 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80',
                                    )}
                                >
                                    {b.status}
                                </span>
                            ) : (
                                <span className="text-[10px] text-slate-500">—</span>
                            )}
                        </div>
                    );
                },
            },
            {
                key: 'amount',
                header: 'Amount',
                render: (p) => <span className="tabular-nums font-medium">{inr(p.amount)}</span>,
            },
            {
                key: 'date',
                header: 'Payment date',
                render: (p) => <span className="tabular-nums text-slate-700">{p.date}</span>,
            },
            {
                key: 'status',
                header: 'Status',
                render: (p) => (
                    <span
                        className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                            p.status === 'Completed' && 'bg-emerald-50 text-emerald-800',
                            p.status === 'Pending' && 'bg-amber-50 text-amber-900',
                            p.status === 'Failed' && 'bg-red-50 text-red-800',
                        )}
                    >
                        {p.status}
                    </span>
                ),
            },
        ],
        [],
    );

    const documentColumns: DataTableColumn<DocumentLookupRow>[] = useMemo(
        () => [
            {
                key: 'name',
                header: 'Document name',
                render: (d) => (
                    <Link
                        href={`/company-admin/documents-compliance/${encodeURIComponent(d.id)}`}
                        className={CTA_FLOW_LINK}
                    >
                        {d.name}
                    </Link>
                ),
            },
            { key: 'type', header: 'Type', render: (d) => d.type },
            {
                key: 'uploaded',
                header: 'Uploaded date',
                render: (d) => <span className="tabular-nums text-slate-700">{d.uploadDate}</span>,
            },
        ],
        [],
    );

    const excludeDocPickerIds = useMemo(() => new Set(displayDocuments.map((d) => d.id)), [displayDocuments]);

    return (
        <>
        <div className="space-y-5">
            <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-none sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-300 bg-gray-100 px-4 py-3 -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 sm:px-5 rounded-t-xl">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-[var(--cta-button-bg)] ring-1 ring-gray-200/80">
                            <LuLayoutGrid size={18} aria-hidden />
                        </span>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Step 1</p>
                            <h3 className="text-sm font-semibold tracking-wide text-gray-800">Booking Details</h3>
                            <p className="mt-1 text-sm text-slate-600">
                                Add units from available inventory only. Bookings for this lead also appear here when
                                created from Booking &amp; Payment.
                            </p>
                        </div>
                    </div>
                    {!readOnly ? (
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="companyOutline"
                                size="cta"
                                className="gap-2"
                                onClick={() => onBookingInventoryPickerOpenChange(true)}
                            >
                                <LuPlus size={16} aria-hidden />
                                Add booking
                            </Button>
                            <Link
                                href={`/company-admin/booking-payment/booking/create?leadCode=${encodeURIComponent(leadCode)}&returnTo=${encodeURIComponent(leadViewReturnTo)}`}
                                className="inline-flex h-[42px] min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                            >
                                <LuLink2 size={16} aria-hidden />
                                Quick create booking
                            </Link>
                        </div>
                    ) : null}
                </div>

                <div className="mt-4 space-y-4">
                    {!readOnly ? (
                        <RelationPicker<InventoryUnitRow>
                            title="Add booking — available units"
                            description="Only units with status Available are listed. Booked or reserved units are hidden. Use filters to narrow the list; project and unit cells open inventory."
                            triggerLabel="Add booking"
                            hideTrigger
                            open={bookingInventoryPickerOpen}
                            onOpenChange={onBookingInventoryPickerOpenChange}
                            fetchRows={fetchLeadBookingInventoryAvailable}
                            columns={inventoryColumns}
                            getRowId={(r) => r.id}
                            selected={inventoryPick}
                            onSelectedChange={onInventoryChange}
                            multiSelect
                            excludeIds={inventoryExcludeIds}
                            rowFilter={inventoryRowFilter}
                            modalHeaderExtras={inventoryModalHeaderFilters}
                            getSearchText={(r) =>
                                `${r.unitId} ${r.projectName} ${r.type} ${r.unitType ?? ''}`.toLowerCase()
                            }
                            onCreateNew={
                                readOnly
                                    ? undefined
                                    : () => {
                                          window.location.href = `/company-admin/booking-payment/booking/create?leadCode=${encodeURIComponent(leadCode)}&returnTo=${encodeURIComponent(leadViewReturnTo)}`;
                                      }
                            }
                            createNewLabel="Open create form"
                        />
                    ) : null}

                    <SelectedRelationsTable<BookingRecord>
                        title=""
                        rows={bookingRows}
                        columns={bookingSelectedColumns}
                        extraColumns={bookingTableExtraColumns}
                        getRowId={(b) => b.slug}
                        onRemove={onRemoveBooking}
                        hideRemoveColumn
                        emptyHint="No bookings yet. Use Add booking to reserve an available unit, or create one in Booking & Payment."
                    />

                    {hasBooking ? (
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total amount</p>
                                <p className="mt-1 text-lg font-black tabular-nums text-slate-900">{inr(money.total)}</p>
                            </div>
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Paid</p>
                                <p className="mt-1 text-lg font-black tabular-nums text-emerald-950">{inr(money.paid)}</p>
                            </div>
                            <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Pending</p>
                                <p className="mt-1 text-lg font-black tabular-nums text-amber-950">{inr(money.pending)}</p>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            <div
                className={cn(
                    'rounded-xl border border-gray-300 bg-white p-4 shadow-none sm:p-5',
                    !hasBooking && 'opacity-60',
                )}
            >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-300 bg-gray-100 px-4 py-3 -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 sm:px-5 rounded-t-xl">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-violet-700 ring-1 ring-gray-200/80">
                            <LuBanknote size={18} aria-hidden />
                        </span>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Step 2</p>
                            <h3 className="text-sm font-semibold tracking-wide text-gray-800">Payment Transactions</h3>
                           
                        </div>
                    </div>
                    {hasBooking && primaryBookingSlug ? (
                        <Link
                            href={`/company-admin/booking-payment/payments?booking=${encodeURIComponent(primaryBookingSlug)}&returnTo=${encodeURIComponent(leadViewReturnTo)}`}
                            className="inline-flex h-[42px] min-h-[42px] shrink-0 items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 text-sm font-semibold text-violet-900 shadow-sm transition hover:bg-violet-50"
                        >
                            <LuArrowRight size={16} aria-hidden />
                            Open payment ledger
                        </Link>
                    ) : null}
                </div>

                {!hasBooking ? (
                    <p className="mt-4 text-sm text-slate-600">Add a booking first to see payments for this lead.</p>
                ) : (
                    <div className="mt-4 space-y-4">
                        <SelectedRelationsTable<PaymentRecord>
                            title=""
                            rows={leadPayments}
                            columns={paymentColumns}
                            getRowId={(p) => p.slug}
                            onRemove={onRemovePayment}
                            canRemoveRow={() => !readOnly}
                            emptyHint="No payments recorded yet for this lead’s bookings. Add a payment from Booking & Payment or use Add new payment in the section header."
                        />
                    </div>
                )}
            </div>

            <div
                className={cn(
                    'rounded-xl border border-gray-300 bg-white p-4 shadow-none sm:p-5',
                    !documentsUnlocked && 'opacity-60',
                )}
            >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-300 bg-gray-100 px-4 py-3 -mx-4 -mt-4 sm:-mx-5 sm:-mt-5 sm:px-5 rounded-t-xl">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-sky-700 ring-1 ring-gray-200/80">
                            <LuFileText size={18} aria-hidden />
                        </span>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Step 3</p>
                            <h3 className="text-sm font-semibold tracking-wide text-gray-800">Compliance &amp; Documents</h3>
                            <p className="mt-1 text-sm text-slate-600">
                                Compliance documents linked to this lead’s bookings appear automatically. Attach more from
                                the library if needed.
                            </p>
                        </div>
                    </div>
                    {!readOnly ? (
                        <Link
                            href="/company-admin/documents-compliance/view/new"
                            className={cn(
                                'inline-flex h-[42px] min-h-[42px] items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-slate-500 transition',
                                CTA_GHOST_ROW_HOVER,
                            )}
                        >
                            Upload new document
                        </Link>
                    ) : null}
                </div>

                {!documentsUnlocked ? (
                    <p className="mt-4 text-sm text-slate-600">Add a booking to load documents tied to those bookings.</p>
                ) : (
                    <div className="mt-4 space-y-4">
                        {!readOnly ? (
                            <RelationPicker<DocumentLookupRow>
                                title="Attach documents"
                                description="Choose additional files from the document library (already linked records are excluded)."
                                triggerLabel="Attach documents"
                                fetchRows={fetchDocumentLookupRows}
                                columns={documentColumns}
                                getRowId={(d) => d.id}
                                selected={manualDocResolved}
                                onSelectedChange={onDocumentSelectionChange}
                                multiSelect
                                excludeIds={excludeDocPickerIds}
                                getSearchText={(d) => `${d.name} ${d.type} ${d.uploadDate}`.toLowerCase()}
                                onCreateNew={
                                    readOnly
                                        ? undefined
                                        : () => {
                                              window.location.href = '/company-admin/documents-compliance/view/new';
                                          }
                                }
                                createNewLabel="New upload"
                            />
                        ) : null}

                        <SelectedRelationsTable<DocumentLookupRow>
                            title=""
                            rows={displayDocuments}
                            columns={documentColumns}
                            getRowId={(d) => d.id}
                            onRemove={(id) => {
                                if (readOnly || derivedDocumentIds.has(id)) return;
                                const next = lead.linkedDocuments.filter((x) => x.documentId !== id);
                                setLeadCrossReferences(lead.slug, { linkedDocuments: next });
                                onBump();
                            }}
                            canRemoveRow={(row) => !readOnly && !derivedDocumentIds.has(row.id)}
                            emptyHint="No compliance documents found for these bookings yet. Upload new or attach from the library."
                        />
                    </div>
                )}
            </div>
        </div>

        <LeadJourneyPreviewModal
            lead={lead}
            leadCode={leadCode}
            bookingRows={bookingRows}
            leadPayments={leadPayments}
            displayDocuments={displayDocuments}
            money={money}
        />
        </>
    );
}
