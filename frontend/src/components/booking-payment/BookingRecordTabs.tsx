'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { BookingDetailView, type BookingDetailTab } from '@/components/booking-payment/BookingDetailView';
import { BookingOverviewTab, type BookingDraft } from '@/components/booking-payment/BookingOverviewTab';
import { draftService } from '@/lib/draftService';
import {
    createBooking,
    getBookingBySlug,
    getLeadOptions,
    getProjectOptions,
    recordAdvancePaymentAtBooking,
    updateBooking,
} from '@/lib/bookingPaymentMockStore';
import { getLeadByLeadCode } from '@/lib/leadStore';
import { safeInternalPath } from '@/lib/navigationReturn';
import { CTA_FOCUS_VISIBLE_RING } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';
import {
    LuCreditCard,
    LuFileText,
    LuHistory,
    LuLayoutDashboard,
} from 'react-icons/lu';

const BASE = '/company-admin/booking-payment/booking';

function parseTab(raw: string | null): BookingDetailTab {
    if (raw === 'overview' || raw === 'payments' || raw === 'documents' || raw === 'history') return raw;
    return 'overview';
}

const TAB_ITEMS = [
    { k: 'overview' as const, label: 'Overview', icon: LuLayoutDashboard },
    { k: 'payments' as const, label: 'Payments', icon: LuCreditCard },
    { k: 'documents' as const, label: 'Documents', icon: LuFileText },
    { k: 'history' as const, label: 'History', icon: LuHistory },
];

function emptyDraft(todayIso: string): BookingDraft {
    return {
        leadId: '',
        assignedTo: '',
        customerName: '',
        phone: '',
        projectName: '',
        unitId: '',
        unitConfiguration: '',
        unitPrice: '',
        advanceAmount: '',
        bookingDate: todayIso,
        status: '',
        dealPaymentMode: '',
        notes: '',
    };
}

export function BookingRecordTabs({ slug }: { slug: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const tab = useMemo(() => parseTab(searchParams.get('tab')), [searchParams]);
    const isCreate = slug === 'new';
    const isEdit = !isCreate && (searchParams.get('edit') === '1' || searchParams.get('edit') === 'true');

    const setTab = useCallback(
        (t: BookingDetailTab) => {
            const qs = t === 'overview' ? '' : `?tab=${t}`;
            router.replace(`${pathname}${qs}`, { scroll: false });
        },
        [router, pathname],
    );

    // View mode uses BookingDetailView.
    const booking = isCreate ? undefined : getBookingBySlug(slug);

    const returnTo = safeInternalPath(searchParams.get('returnTo') ?? undefined);
    const leadCodePrefill = searchParams.get('leadCode')?.trim() ?? '';

    const [leadListRevision, setLeadListRevision] = useState(0);
    useEffect(() => {
        const bump = () => {
            if (document.visibilityState === 'visible') setLeadListRevision((n) => n + 1);
        };
        document.addEventListener('visibilitychange', bump);
        return () => document.removeEventListener('visibilitychange', bump);
    }, []);

    const leadOptions = useMemo(() => {
        void leadListRevision;
        return getLeadOptions();
    }, [leadListRevision]);
    const projectOptions = useMemo(() => getProjectOptions(), []);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [draftSaving, setDraftSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

    const goAfterSave = useCallback(
        (nextSlug: string) => {
            if (returnTo) {
                router.push(returnTo);
                return;
            }
            router.push(`${BASE}/view/${encodeURIComponent(nextSlug)}`);
        },
        [returnTo, router],
    );

    const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const [draft, setDraft] = useState<BookingDraft>(() => emptyDraft(todayIso));
    const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
    const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
    const [draftLastSavedAt, setDraftLastSavedAt] = useState<string | null>(null);
    const [draftLoadedBanner, setDraftLoadedBanner] = useState(false);

    useEffect(() => {
        if (isCreate) {
            const base = emptyDraft(todayIso);
            const lead = leadCodePrefill ? getLeadByLeadCode(leadCodePrefill) : undefined;
            if (lead) {
                base.leadId = leadCodePrefill;
                base.assignedTo = lead.assignedTo?.trim() || 'Sales Team';
                base.customerName = lead.name.trim();
                base.phone = lead.phone.replace(/\D/g, '').slice(0, 15);
                const project = lead.project?.trim() || '';
                base.projectName = project && projectOptions.includes(project) ? project : '';
            }
            setDraft(base);
            setErrors({});
            setActiveDraftId(null);
            setDraftLastSavedAt(null);
            setDraftLoadedBanner(false);
            return;
        }
        if (!booking) return;
        setDraft({
            leadId: booking.leadId ?? '',
            assignedTo: booking.assignedTo ?? '',
            customerName: booking.customerName ?? '',
            phone: booking.phone ?? '',
            projectName: booking.projectName ?? '',
            unitId: booking.unitId ?? '',
            unitConfiguration: booking.unitConfiguration ?? '',
            unitPrice: String(booking.unitPrice ?? ''),
            advanceAmount: '',
            bookingDate: booking.bookingDate?.slice(0, 10) ?? todayIso,
            status: booking.status ?? '',
            dealPaymentMode: (booking.dealPaymentMode ?? '') as any,
            notes: booking.notes ?? '',
        });
        setErrors({});
    }, [isCreate, booking, leadCodePrefill, projectOptions, todayIso]);

    // Load create draft from URL (?draftId=) — same architecture as Leads.
    const initialDraftIdRef = React.useRef<string | null>(null);
    useEffect(() => {
        if (!isCreate) return;
        if (initialDraftIdRef.current === null) {
            initialDraftIdRef.current = searchParams.get('draftId')?.trim() || '';
            if (!initialDraftIdRef.current) initialDraftIdRef.current = '';
        }

        const draftIdFromUrl = searchParams.get('draftId')?.trim() || '';
        if (!draftIdFromUrl) {
            setActiveDraftId(null);
            setDraftLastSavedAt(null);
            setDraftLoadedBanner(false);
            return;
        }

        const found = draftService.getDraftById<BookingDraft>(draftIdFromUrl);
        if (!found || found.module !== 'booking') {
            setToast({ msg: 'Draft not found. Starting a new booking.', err: true });
            setActiveDraftId(null);
            setDraftLastSavedAt(null);
            setDraftLoadedBanner(false);
            router.replace(`${BASE}/view/new`, { scroll: true });
            return;
        }

        setDraft((prev) => ({ ...prev, ...(found.data ?? {}) }));
        setActiveDraftId(found.draftId);
        setDraftLastSavedAt(found.updatedAt);
        setDraftLoadedBanner(Boolean(initialDraftIdRef.current));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCreate, searchParams]);

    const createDraftDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        return () => {
            if (createDraftDebounceRef.current) clearTimeout(createDraftDebounceRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isCreate) return;
        if (draftSaving || isSubmitting) return;

        const hasAnyValue = Object.values(draft).some((v) => (typeof v === 'string' ? v.trim() : Boolean(v)));
        if (!hasAnyValue) return;

        if (createDraftDebounceRef.current) clearTimeout(createDraftDebounceRef.current);
        createDraftDebounceRef.current = setTimeout(() => {
            try {
                const saved = draftService.saveDraft<BookingDraft>('booking', draft, activeDraftId ?? undefined);
                setActiveDraftId(saved.draftId);
                setDraftLastSavedAt(saved.updatedAt);
                if (!searchParams.get('draftId')) {
                    const sp = new URLSearchParams(searchParams.toString());
                    sp.set('draftId', saved.draftId);
                    if (!sp.get('tab')) sp.set('tab', 'overview');
                    router.replace(`${window.location.pathname}?${sp.toString()}`, { scroll: false });
                }
            } catch {
                // silent auto-save failure
            }
        }, 1400);
         
    }, [draft, isCreate, activeDraftId, router, searchParams, draftSaving, isSubmitting]);

    const saveCreateDraft = useCallback(() => {
        if (!isCreate) return;
        setDraftSaving(true);
        try {
            const saved = draftService.saveDraft<BookingDraft>('booking', draft, activeDraftId ?? undefined);
            setActiveDraftId(saved.draftId);
            setDraftLastSavedAt(saved.updatedAt);
            if (!searchParams.get('draftId')) {
                const sp = new URLSearchParams(searchParams.toString());
                sp.set('draftId', saved.draftId);
                if (!sp.get('tab')) sp.set('tab', 'overview');
                router.replace(`${window.location.pathname}?${sp.toString()}`, { scroll: false });
            }
            setToast({ msg: 'Draft saved.', err: false });
        } catch {
            setToast({ msg: 'Could not save draft. Please try again.', err: true });
        } finally {
            setDraftSaving(false);
        }
    }, [activeDraftId, draft, isCreate, router, searchParams]);

    const validate = useCallback(() => {
        const next: Record<string, string> = {};
        if (!draft.leadId.trim()) next.leadId = 'Lead ID is required';
        if (!draft.assignedTo.trim()) next.assignedTo = 'Assigned owner is required';
        if (!draft.customerName.trim()) next.customerName = 'Customer name is required';
        if (!draft.phone.trim()) next.phone = 'Phone is required';
        if (!draft.projectName.trim()) next.projectName = 'Project is required';
        if (!draft.unitId.trim()) next.unitId = 'Unit ID is required';
        if (!draft.unitPrice.trim()) next.unitPrice = 'Unit price is required';
        if (!draft.bookingDate.trim()) next.bookingDate = 'Booking date is required';
        if (!draft.dealPaymentMode.trim()) next.dealPaymentMode = 'Payment plan is required';
        setErrors(next);
        return Object.keys(next).length === 0;
    }, [draft]);

    if (!isCreate && !booking) {
        // Let the existing view page handle "not found" UI (keeps behavior stable).
        return null;
    }

    if (!isCreate && !isEdit) {
        return (
            <BookingDetailView
                booking={booking!}
                tab={tab}
                onTabChange={setTab}
                listHref={BASE}
                editHref={`${BASE}/edit/${encodeURIComponent(slug)}`}
            />
        );
    }

    // Create/Edit mode: Leads-like inline collapsible editor (no stepper).
    const disableNonOverview = true;
    const viewHref = !isCreate ? `${BASE}/view/${encodeURIComponent(slug)}` : BASE;

    return (
        <div className="w-full min-w-0 space-y-0">
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={() => setToast(null)} /> : null}

            <div className="sticky top-26 z-40 -mx-4 border-b border-gray-200 bg-white lg:-mx-6">
                <nav className="flex min-w-0 divide-x divide-gray-200" aria-label="Booking record sections">
                    {TAB_ITEMS.map((t) => {
                        const Icon = t.icon;
                        const isActive = tab === t.k;
                        const disabled = disableNonOverview && t.k !== 'overview';
                        return (
                            <button
                                key={t.k}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                    if (disabled) return;
                                    setTab(t.k);
                                }}
                                className={cn(
                                    'inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-3 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                                    CTA_FOCUS_VISIBLE_RING,
                                    disabled && 'opacity-50 cursor-not-allowed',
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
                <div className="mx-auto w-full px-0 sm:px-0">
                    {isCreate && draftLoadedBanner ? (
                        <div className="mb-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <p className="font-semibold text-slate-900">You are editing a booking draft</p>
                                <p className="text-xs font-medium text-slate-600">
                                    {draftLastSavedAt ? `Last saved: ${draftLastSavedAt}` : 'Last saved: —'}
                                </p>
                            </div>
                        </div>
                    ) : null}
                    <BookingOverviewTab
                        booking={
                            isCreate
                                ? ({
                                      slug: 'new',
                                      leadId: '',
                                      assignedTo: '',
                                      customerName: '',
                                      phone: '',
                                      projectName: '',
                                      unitId: '',
                                      unitConfiguration: '',
                                      unitPrice: 0,
                                      bookingDate: todayIso,
                                      status: 'Pending',
                                      unitStatus: 'Available',
                                      dealPaymentMode: 'milestone',
                                      notes: '',
                                  } as any)
                                : (booking as any)
                        }
                        listHref={BASE}
                        editHref={`${BASE}/edit/${encodeURIComponent(slug)}`}
                        isEditing
                        isCreate={isCreate}
                        draft={draft}
                        errors={errors as any}
                        onDraftChange={(k, v) => {
                            setDraft((prev) => ({ ...prev, [k]: v }));
                            setErrors((prev) => {
                                if (!prev[k as any]) return prev;
                                const next = { ...prev };
                                delete next[k as any];
                                return next;
                            });
                        }}
                        onCancel={() => {
                            if (returnTo) router.push(returnTo);
                            else router.push(viewHref);
                        }}
                        onSaveDraft={saveCreateDraft}
                        onSubmit={async () => {
                            if (!validate()) return;
                            setIsSubmitting(true);
                            try {
                                await new Promise((r) => setTimeout(r, 200));
                                const price = Number(draft.unitPrice);
                                const advance = Number(String(draft.advanceAmount ?? '').replace(/\D/g, '')) || 0;
                                if (isCreate) {
                                    const row = createBooking({
                                        leadId: draft.leadId.trim(),
                                        assignedTo: draft.assignedTo.trim(),
                                        customerName: draft.customerName.trim(),
                                        phone: draft.phone.trim(),
                                        projectName: draft.projectName.trim(),
                                        unitId: draft.unitId.trim(),
                                        unitConfiguration: draft.unitConfiguration.trim() || undefined,
                                        unitPrice: price,
                                        bookingDate: draft.bookingDate.slice(0, 10),
                                        status: 'Pending',
                                        dealPaymentMode: (draft.dealPaymentMode as any) || 'milestone',
                                        notes: draft.notes?.trim() || undefined,
                                    });
                                    if (advance > 0) {
                                        recordAdvancePaymentAtBooking(row.slug, advance, 'Advance payment');
                                    }
                                    if (activeDraftId) {
                                        try {
                                            draftService.deleteDraft(activeDraftId);
                                        } catch {
                                            // ignore
                                        }
                                    }
                                    goAfterSave(row.slug);
                                } else {
                                    const updated = updateBooking(slug, {
                                        leadId: draft.leadId.trim(),
                                        assignedTo: draft.assignedTo.trim(),
                                        customerName: draft.customerName.trim(),
                                        phone: draft.phone.trim(),
                                        projectName: draft.projectName.trim(),
                                        unitId: draft.unitId.trim(),
                                        unitConfiguration: draft.unitConfiguration.trim() || undefined,
                                        unitPrice: price,
                                        bookingDate: draft.bookingDate.slice(0, 10),
                                        status: (draft.status as any) || booking!.status,
                                        dealPaymentMode: (draft.dealPaymentMode as any) || booking!.dealPaymentMode,
                                        notes: draft.notes?.trim() || undefined,
                                    });
                                    if (!updated) {
                                        setToast({ msg: 'Could not save changes. Try again.', err: true });
                                        return;
                                    }
                                    if (advance > 0) {
                                        recordAdvancePaymentAtBooking(updated.slug, advance, 'Advance payment');
                                    }
                                    goAfterSave(slug);
                                }
                            } finally {
                                setIsSubmitting(false);
                            }
                        }}
                        isSubmitting={isSubmitting}
                        showEditButton={false}
                    />
                </div>
            </div>
        </div>
    );
}

export default function BookingRecordTabsSuspense({ slug }: { slug: string }) {
    return (
        <Suspense
            fallback={
                <div className="w-full pb-10">
                    <div className="h-11 max-w-md animate-pulse rounded-lg bg-gray-100" />
                    <div className="mt-4 min-h-[min(24rem,70vh)] rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5">
                        <div className="h-48 animate-pulse rounded-xl bg-gray-100/80" />
                    </div>
                </div>
            }
        >
            <BookingRecordTabs slug={slug} />
        </Suspense>
    );
}

