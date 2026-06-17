'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { ImportPaymentRecordsModal } from '@/components/booking-payment/payments/ImportPaymentRecordsModal';
import { PaymentLedgerTable } from '@/components/booking-payment/payments/PaymentLedgerTable';
import { PaymentsBookingList } from '@/components/booking-payment/payments/PaymentsBookingList';
import {
    deletePayment,
    getBookingBySlug,
    getBookings,
    getPaymentBySlug,
    getPaymentLedgerRows,
    markPaymentReceiptGenerated,
    updatePayment,
} from '@/lib/bookingPaymentMockStore';
import { openBookingPaymentReceiptPrint } from '@/lib/openBookingPaymentReceiptPrint';
import { LuArrowLeft, LuPlus, LuUpload } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { CTA_FLOW_LINK_SEMIBOLD, CTA_INPUT_FOCUS, CTA_SHADOW_SOFT } from '@/lib/theme/ctaThemeClasses';

const PAY = '/company-admin/booking-payment/payments';

function PaymentsPageInner() {
    const router = useRouter();
    const pathname = usePathname() ?? '';
    const searchParams = useSearchParams();
    const [v, setV] = useState(0);
    const bump = () => setV((x) => x + 1);

    const bookings = useMemo(() => getBookings(), [v]);

    const selectedBookingSlug = useMemo(() => {
        const b = searchParams.get('booking')?.trim();
        return b && getBookingBySlug(b) ? b : '';
    }, [searchParams, v]);

    const showBookingList = !selectedBookingSlug;

    const [sectionLoading, setSectionLoading] = useState(false);
    useEffect(() => {
        if (!selectedBookingSlug) return;
        setSectionLoading(true);
        const t = window.setTimeout(() => setSectionLoading(false), 240);
        return () => window.clearTimeout(t);
    }, [selectedBookingSlug, v]);

    const ledgerRows = useMemo(
        () => (selectedBookingSlug ? getPaymentLedgerRows(selectedBookingSlug) : []),
        [selectedBookingSlug, v]
    );

    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const dismissToast = useCallback(() => setToast(null), []);
    const [importOpen, setImportOpen] = useState(false);

    const selectedBooking = useMemo(
        () => (selectedBookingSlug ? getBookingBySlug(selectedBookingSlug) ?? null : null),
        [selectedBookingSlug, v]
    );

    const openAdd = useCallback(() => {
        if (!selectedBookingSlug) return;
        const rt = pathname.startsWith('/') ? `&returnTo=${encodeURIComponent(pathname)}` : '';
        router.push(`${PAY}/add?booking=${encodeURIComponent(selectedBookingSlug)}${rt}`);
    }, [router, selectedBookingSlug, pathname]);

    const openView = useCallback(
        (slug: string) => {
            router.push(`${PAY}/view/${encodeURIComponent(slug)}`);
        },
        [router]
    );

    const openEdit = useCallback(
        (slug: string) => {
            router.push(`${PAY}/edit/${encodeURIComponent(slug)}`);
        },
        [router]
    );

    const onMarkCompleted = (slug: string) => {
        const res = updatePayment(slug, { status: 'Completed' });
        if (!res.ok) {
            setToast({ msg: res.error, err: true });
            return;
        }
        setToast({ msg: 'Payment marked as completed.' });
        bump();
        router.push(`${PAY}/view/${encodeURIComponent(slug)}`);
    };

    const onGenerateReceipt = (slug: string) => {
        const res = markPaymentReceiptGenerated(slug);
        if (!res.ok) {
            setToast({ msg: res.error, err: true });
            return;
        }
        setToast({ msg: 'Receipt generated. Use “View receipt” anytime from Actions.' });
        bump();
        router.push(`${PAY}/view/${encodeURIComponent(slug)}`);
    };

    const onSendReminder = (slug: string) => {
        const p = getPaymentBySlug(slug);
        setToast({
            msg: p ? `Reminder queued for ${p.receiptNumber} — ${p.amount.toLocaleString('en-IN')} (demo).` : 'Payment not found.',
            err: !p,
        });
    };

    const onDeletePayment = (slug: string) => {
        const p = getPaymentBySlug(slug);
        if (!p) {
            setToast({ msg: 'Payment not found.', err: true });
            return;
        }
        if (
            typeof window !== 'undefined' &&
            !window.confirm(
                `Delete payment ${p.receiptNumber} (₹${p.amount.toLocaleString('en-IN')})? This cannot be undone in the demo.`
            )
        ) {
            return;
        }
        const res = deletePayment(slug);
        if (!res.ok) {
            setToast({ msg: res.error, err: true });
            return;
        }
        setToast({ msg: 'Payment removed from ledger.' });
        bump();
    };

    const onDownloadReceiptPdf = useCallback((slug: string) => {
        const p = getPaymentBySlug(slug);
        if (!p) {
            setToast({ msg: 'Payment not found.', err: true });
            return;
        }
        const b = getBookingBySlug(p.bookingSlug);
        openBookingPaymentReceiptPrint(p, b ?? null);
    }, []);

    const onBulkDeletePayments = (slugs: string[]) => {
        if (!slugs.length) return;
        if (
            typeof window !== 'undefined' &&
            !window.confirm(`Delete ${slugs.length} payment(s) from the ledger? This cannot be undone in the demo.`)
        ) {
            return;
        }
        let n = 0;
        for (const slug of slugs) {
            const res = deletePayment(slug);
            if (res.ok) n++;
        }
        if (n > 0) {
            setToast({ msg: `${n} payment(s) removed from ledger.` });
            bump();
        }
    };

    return (
        <>
            <Breadcrumb
                items={
                    showBookingList
                        ? [
                              { label: 'Booking & Payment', href: '/company-admin/booking-payment/booking' },
                              { label: 'Payments' },
                          ]
                        : [
                              { label: 'Booking & Payment', href: '/company-admin/booking-payment/booking' },
                              { label: 'Payments', href: PAY },
                              { label: selectedBooking?.customerName ?? 'Booking' },
                          ]
                }
            />
            <div className="space-y-4 pb-8">
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}

            {showBookingList ? (
                <>
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments</h1>
                            <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
                                Select a customer to open their payment ledger, record collections, and manage installment schedules. Use
                                List or Grid to switch how bookings are shown.
                            </p>
                        </div>
                    </div>
                    <PaymentsBookingList
                        bookings={bookings}
                        enableListGridToggle
                        savedViewModule="Payments"
                        legacySavedViewsStorageKey="arris-payments-booking-saved-views"
                    />
                </>
            ) : (
                <>
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <Link
                                href={PAY}
                                className={cn('inline-flex items-center gap-1.5 text-sm mb-2', CTA_FLOW_LINK_SEMIBOLD)}
                            >
                                <LuArrowLeft size={16} aria-hidden />
                                All bookings
                            </Link>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Payments</h1>
                            <p className="mt-1 text-sm font-medium text-slate-500 max-w-2xl">
                                Ledger and receipts for this booking. Add, view, and edit open on full pages. Use Installments for schedules.
                            </p>
                        </div>
                        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:justify-end">
                            <div className="min-w-[min(100%,280px)] w-full sm:w-[min(100%,320px)]">
                                <label className="sr-only" htmlFor="payments-booking-switch">
                                    Booking
                                </label>
                                <select
                                    id="payments-booking-switch"
                                    value={selectedBookingSlug}
                                    onChange={(e) => {
                                        const next = e.target.value;
                                        if (!next) router.replace(PAY, { scroll: false });
                                        else router.replace(`${PAY}?booking=${encodeURIComponent(next)}`, { scroll: false });
                                    }}
                                    className={cn(
                                        'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm',
                                        CTA_INPUT_FOCUS,
                                    )}
                                >
                                    <option value="">All bookings</option>
                                    {bookings.map((b) => (
                                        <option key={b.slug} value={b.slug}>
                                            {b.customerName} · {b.projectName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Button type="button" variant="companyOutline" size="cta" className="gap-2 shrink-0" onClick={() => setImportOpen(true)}>
                                <LuUpload size={18} />
                                Import payments
                            </Button>
                            <Button type="button" variant="company" size="cta" className={cn('gap-2 shrink-0', CTA_SHADOW_SOFT)} onClick={openAdd}>
                                <LuPlus size={18} />
                                Add payment
                            </Button>
                        </div>
                    </div>

                    <section>
                        <PaymentLedgerTable
                            key={`${selectedBookingSlug}-${v}`}
                            rows={ledgerRows}
                            loading={sectionLoading && !!selectedBookingSlug}
                            onView={openView}
                            onEdit={openEdit}
                            onMarkCompleted={onMarkCompleted}
                            onViewReceipt={openView}
                            onDownloadReceiptPdf={onDownloadReceiptPdf}
                            onGenerateReceipt={onGenerateReceipt}
                            onSendReminder={onSendReminder}
                            onDelete={onDeletePayment}
                            onBulkDelete={onBulkDeletePayments}
                        />
                    </section>

                    <ImportPaymentRecordsModal
                        open={importOpen}
                        onClose={() => setImportOpen(false)}
                        defaultBookingSlug={selectedBookingSlug}
                        onImported={(n) => {
                            if (n > 0) {
                                setToast({ msg: `${n} payment record(s) imported.` });
                                bump();
                            }
                        }}
                    />
                </>
            )}
        </div>
        </>
    );
}

export default function PaymentsPage() {
    return (
        <Suspense fallback={<div className="rounded-xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">Loading…</div>}>
            <PaymentsPageInner />
        </Suspense>
    );
}
