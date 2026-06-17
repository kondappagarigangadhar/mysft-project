'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { BpStatusBadge, statusToTone } from '@/components/booking-payment/BpStatusBadge';
import { CTA_FOCUS_VISIBLE_RING, CTA_SHADOW_SOFT } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';
import {
    addBookingDocument,
    deleteBookingDocument,
    getBookingPaymentSummary,
    getDocumentsForBooking,
    getHistoryForBooking,
    getPaymentsForBooking,
    replaceBookingDocument,
    type BookingRecord,
} from '@/lib/bookingPaymentMockStore';
import { RecordHistoryLogPanel } from '@/components/history-logs/RecordHistoryLogPanel';
import { bookingHubHistoryToHistoryLogEntries } from '@/lib/historyLogs/recordHistoryAdapters';
import { MOCK_HISTORY_LOGS } from '@/lib/historyLogs/mockHistoryLogs';
import { formatShortDate } from '@/lib/formatDate';
import {
    LuBuilding2,
    LuCalendar,
    LuCreditCard,
    LuFileText,
    LuHistory,
    LuLayoutDashboard,
    LuLayers,
    LuPencil,
    LuPlus,
    LuScale,
    LuTrash2,
    LuTrendingUp,
    LuUpload,
    LuUser,
    LuWallet,
} from 'react-icons/lu';
import { BookingLinkedPaymentsSection } from '@/modules/booking/BookingLinkedPaymentsSection';
import { BookingOverviewTab, type BookingDraft } from '@/components/booking-payment/BookingOverviewTab';

export type BookingDetailTab = 'overview' | 'payments' | 'documents' | 'history';

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5 border-b border-gray-100 py-2.5 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
            <dd className="min-w-0 text-sm leading-snug font-medium text-gray-900 sm:max-w-[65%] sm:text-right">{children}</dd>
        </div>
    );
}

function DetailSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 sm:px-5">
                <span className="text-[var(--cta-button-bg)]">{icon}</span>
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            </div>
            <dl className="px-3 py-1 sm:px-5">{children}</dl>
        </section>
    );
}

const TAB_ITEMS = [
    { k: 'overview' as const, label: 'Overview', icon: LuLayoutDashboard },
    { k: 'payments' as const, label: 'Payments', icon: LuCreditCard },
    { k: 'documents' as const, label: 'Documents', icon: LuFileText },
    { k: 'history' as const, label: 'History', icon: LuHistory },
];

export function BookingDetailView({
    booking,
    tab,
    onTabChange,
    listHref,
    editHref,
}: {
    booking: BookingRecord;
    tab: BookingDetailTab;
    onTabChange: (t: BookingDetailTab) => void;
    listHref: string;
    editHref: string;
}) {
    const [v, setV] = useState(0);
    const bump = useCallback(() => setV((x) => x + 1), []);

    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const dismissToast = useCallback(() => setToast(null), []);

    const documents = useMemo(() => getDocumentsForBooking(booking.slug), [booking.slug, v]);
    const history = useMemo(() => getHistoryForBooking(booking.slug), [booking.slug, v]);
    const paymentSummary = useMemo(() => getBookingPaymentSummary(booking.slug), [booking.slug, v]);

    const bookingHistoryTitle = (booking.customerName || '').trim() || booking.slug;
    const bookingHubSupplemental = useMemo(
        () => bookingHubHistoryToHistoryLogEntries(booking.slug, bookingHistoryTitle, history),
        [booking.slug, bookingHistoryTitle, history],
    );
    const extraPaymentHistoryRows = useMemo(() => {
        const slugs = new Set(getPaymentsForBooking(booking.slug).map((p) => p.slug));
        return MOCK_HISTORY_LOGS.filter((e) => e.module === 'payments' && slugs.has(e.recordId));
    }, [booking.slug, v]);

    const docFileInputRef = useRef<HTMLInputElement>(null);
    const [docUploadIntent, setDocUploadIntent] = useState<{ kind: 'add' } | { kind: 'replace'; fileId: string } | null>(null);

    const triggerDocUpload = (intent: { kind: 'add' } | { kind: 'replace'; fileId: string }) => {
        setDocUploadIntent(intent);
        window.setTimeout(() => docFileInputRef.current?.click(), 0);
    };

    const resolveUploadStatus = (file: File): 'uploaded' | 'failed' => {
        const n = file.name.toLowerCase();
        if (file.size <= 0) return 'failed';
        if (n.includes('fail')) return 'failed';
        return 'uploaded';
    };

    const onDocFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) {
            setDocUploadIntent(null);
            return;
        }
        const name = file.name.trim() || 'upload.bin';
        const status = resolveUploadStatus(file);
        if (docUploadIntent?.kind === 'replace') {
            replaceBookingDocument(booking.slug, docUploadIntent.fileId, name, status);
            setToast({
                msg:
                    status === 'uploaded'
                        ? `Replaced with “${name}” — uploaded.`
                        : `Replace failed for “${name}”. Try another file.`,
                err: status === 'failed',
            });
        } else {
            addBookingDocument(booking.slug, name, status);
            setToast({
                msg: status === 'uploaded' ? `“${name}” uploaded successfully.` : `Upload failed for “${name}”.`,
                err: status === 'failed',
            });
        }
        setDocUploadIntent(null);
        bump();
    };

    const onDeleteDocument = (fileId: string, fileName: string) => {
        deleteBookingDocument(booking.slug, fileId);
        setToast({ msg: `Removed “${fileName}”.` });
        bump();
    };

    const selected = booking;

    const viewDraft = useMemo<BookingDraft>(
        () => ({
            leadId: selected.leadId ?? '',
            assignedTo: selected.assignedTo ?? '',
            customerName: selected.customerName ?? '',
            phone: selected.phone ?? '',
            projectName: selected.projectName ?? '',
            unitId: selected.unitId ?? '',
            unitConfiguration: selected.unitConfiguration ?? '',
            unitPrice: String(selected.unitPrice ?? ''),
            advanceAmount: '',
            bookingDate: selected.bookingDate?.slice(0, 10) ?? '',
            status: selected.status ?? 'Pending',
            dealPaymentMode: selected.dealPaymentMode ?? 'milestone',
            notes: selected.notes ?? '',
        }),
        [selected],
    );

    return (
        <div className="w-full min-w-0 space-y-0">
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}

            <div className="sticky top-26 z-40 -mx-4 border-b border-gray-200 bg-white lg:-mx-6">
                <nav className="flex min-w-0 divide-x divide-gray-200" aria-label="Booking record sections">
                    {TAB_ITEMS.map((t) => {
                        const Icon = t.icon;
                        const isActive = tab === t.k;
                        return (
                            <button
                                key={t.k}
                                type="button"
                                onClick={() => onTabChange(t.k)}
                                className={cn(
                                    'inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                                    CTA_FOCUS_VISIBLE_RING,
                                    isActive
                                        ? 'font-semibold text-[var(--cta-button-bg)]'
                                        : 'font-medium text-gray-500 hover:text-gray-800',
                                )}
                            >
                                <Icon size={16} className={cn('shrink-0', isActive ? 'text-[var(--cta-button-bg)]' : 'opacity-80')} aria-hidden />
                                {t.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
                {tab === 'overview' && (
                    <div className="mx-auto w-full  px-0 sm:px-0">
                        <BookingOverviewTab
                            booking={selected}
                            listHref={listHref}
                            editHref={editHref}
                            isEditing={false}
                            isCreate={false}
                            draft={viewDraft}
                            errors={{}}
                            onDraftChange={() => {}}
                            showEditButton
                        />
                    </div>
                )}

                {tab === 'payments' && (
                    <div className="flex w-full min-w-0 flex-col gap-6 text-sm">
                        <div className="mb-1 flex shrink-0 items-center gap-2 border-b border-gray-100 pb-3">
                            <LuCreditCard className="shrink-0 text-[var(--cta-button-bg)]" size={18} aria-hidden />
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Payments</h3>
                                <p className="mt-0.5 text-xs text-gray-500">Financial summary and payments linked to this booking.</p>
                            </div>
                        </div>

                        {paymentSummary ? (
                            <div className="space-y-4">
                                <p className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">Financial summary</p>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-white shadow-sm">
                                                <LuScale className="opacity-95" size={20} aria-hidden />
                                            </span>
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-gray-600 uppercase">
                                                Agreed
                                            </span>
                                        </div>
                                        <p className="mt-4 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">Total unit value</p>
                                        <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900 tabular-nums">
                                            ₹{paymentSummary.unitPrice.toLocaleString('en-IN')}
                                        </p>
                                        <p className="mt-2 text-xs leading-snug text-gray-500">Full price as per booking</p>
                                    </div>

                                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                                                <LuTrendingUp size={20} aria-hidden />
                                            </span>
                                            <span className="rounded-full bg-emerald-100/90 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-800 uppercase">
                                                In
                                            </span>
                                        </div>
                                        <p className="mt-4 text-[11px] font-semibold tracking-wide text-emerald-800 uppercase">Collected</p>
                                        <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-950 tabular-nums">
                                            ₹{paymentSummary.paidCompleted.toLocaleString('en-IN')}
                                        </p>
                                        <p className="mt-2 text-xs leading-snug text-emerald-800/85">Completed payments only</p>
                                    </div>

                                    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
                                                <LuWallet size={20} aria-hidden />
                                            </span>
                                            <span className="rounded-full bg-amber-100/90 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-900 uppercase">
                                                Due
                                            </span>
                                        </div>
                                        <p className="mt-4 text-[11px] font-semibold tracking-wide text-amber-900 uppercase">Outstanding</p>
                                        <p className="mt-1 text-2xl font-bold tracking-tight text-amber-950 tabular-nums">
                                            ₹{paymentSummary.outstanding.toLocaleString('en-IN')}
                                        </p>
                                        <p className="mt-2 text-xs leading-snug text-amber-900/80">After completed payments</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center text-sm text-gray-600">
                                No financial summary available for this booking yet.
                            </p>
                        )}

                        <BookingLinkedPaymentsSection bookingSlug={selected.slug} />
                    </div>
                )}

                {tab === 'documents' && (
                    <div className="space-y-4 text-sm">
                        <input
                            ref={docFileInputRef}
                            type="file"
                            className="sr-only"
                            accept=".pdf,.doc,.docx,image/png,image/jpeg,image/webp"
                            onChange={onDocFileSelected}
                        />
                        <div className="mb-3 flex shrink-0 items-center gap-2 border-b border-gray-100 pb-3">
                            <LuFileText className="shrink-0 text-[var(--cta-button-bg)]" size={18} aria-hidden />
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Documents</h3>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    Metadata-only demo. Names containing &quot;fail&quot; or empty files simulate a failed upload.
                                </p>
                            </div>
                        </div>
                        {documents.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-8 text-center">
                                <p className="text-sm font-medium text-gray-800">No documents yet</p>
                                <p className="mt-1 text-xs text-gray-500">Upload a PDF, Word, or image file.</p>
                                <Button
                                    type="button"
                                    variant="company"
                                    size="cta"
                                    className={cn('mt-4 gap-2', CTA_SHADOW_SOFT)}
                                    onClick={() => triggerDocUpload({ kind: 'add' })}
                                >
                                    <LuUpload size={16} aria-hidden />
                                    Upload document
                                </Button>
                            </div>
                        ) : (
                            <>
                                <ul className="space-y-2">
                                    {documents.map((d) => (
                                        <li
                                            key={d.id}
                                            className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="flex min-w-0 items-start gap-2">
                                                <LuFileText className="mt-0.5 shrink-0 text-gray-400" size={16} aria-hidden />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="truncate font-medium text-gray-900" title={d.fileName}>
                                                            {d.fileName}
                                                        </p>
                                                        <span
                                                            className={cn(
                                                                'inline-flex shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase',
                                                                d.status === 'uploaded'
                                                                    ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
                                                                    : 'bg-red-50 text-red-800 ring-1 ring-red-200/80',
                                                            )}
                                                        >
                                                            {d.status === 'uploaded' ? 'Uploaded' : 'Failed'}
                                                        </span>
                                                    </div>
                                                    <p className="mt-0.5 text-xs text-gray-500">{new Date(d.uploadedAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center justify-end gap-1">
                                                <Button
                                                    type="button"
                                                    variant="companyOutline"
                                                    size="cta"
                                                    className="h-9 w-9 min-h-0 p-0"
                                                    title="Replace file"
                                                    aria-label="Replace document"
                                                    onClick={() => triggerDocUpload({ kind: 'replace', fileId: d.id })}
                                                >
                                                    <LuUpload size={16} aria-hidden />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="companyGhost"
                                                    size="cta"
                                                    className="h-9 w-9 min-h-0 p-0 text-red-700 hover:bg-red-50"
                                                    title="Delete"
                                                    aria-label="Delete document"
                                                    onClick={() => onDeleteDocument(d.id, d.fileName)}
                                                >
                                                    <LuTrash2 size={16} aria-hidden />
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    type="button"
                                    variant="companyOutline"
                                    size="cta"
                                    className="w-full gap-2"
                                    onClick={() => triggerDocUpload({ kind: 'add' })}
                                >
                                    <LuPlus size={16} aria-hidden />
                                    Upload another
                                </Button>
                            </>
                        )}
                    </div>
                )}

                {tab === 'history' && (
                    <div className="w-full min-w-0">
                        <RecordHistoryLogPanel
                            module="bookings"
                            recordId={booking.slug}
                            recordTitle={bookingHistoryTitle}
                            supplementalEntries={bookingHubSupplemental}
                            extraGlobalEntries={extraPaymentHistoryRows}
                            globalHistoryHref="/company-admin/history-logs?module=bookings"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
