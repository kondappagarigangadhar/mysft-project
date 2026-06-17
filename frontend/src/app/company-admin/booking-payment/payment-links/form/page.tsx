'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { PaymentLinkForm, ARRIS_PAYMENT_LINK_FORM_DRAFT_KEY } from '@/components/booking-payment/payment-links/PaymentLinkForm';
import { getBookingBySlug, getPaymentLinkBySlug } from '@/lib/bookingPaymentMockStore';
import { cn } from '@/lib/utils';
import { CTA_FLOW_LINK_SEMIBOLD, CTA_UTILITY_BTN } from '@/lib/theme/ctaThemeClasses';

const LINKS = '/company-admin/booking-payment/payment-links';

function PaymentLinkFormPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const slugParam = searchParams.get('slug')?.trim() ?? '';
    const bookingParam = searchParams.get('booking')?.trim() ?? '';

    const row = useMemo(() => (slugParam ? getPaymentLinkBySlug(slugParam) : undefined), [slugParam]);
    const [savedToast, setSavedToast] = useState(false);
    const dismissSavedToast = () => setSavedToast(false);

    useEffect(() => {
        if (!slugParam || !row) return;
        if (row.linkStatus === 'paid' || row.linkStatus === 'cancelled') {
            router.replace(`${LINKS}/view/${encodeURIComponent(slugParam)}`);
        }
    }, [row, router, slugParam]);

    const isEdit = Boolean(slugParam && row);
    const initialBooking =
        !isEdit && bookingParam && getBookingBySlug(bookingParam) ? bookingParam : undefined;

    if (slugParam && !row) {
        return (
            <>
                <Breadcrumb
                    items={[
                        { label: 'Booking & Payment', href: '/company-admin/booking-payment/booking' },
                        { label: 'Payment links', href: LINKS },
                        { label: 'Link' },
                    ]}
                />
                <div className="mx-auto w-full max-w-4xl px-4 pb-12">
                    <div className="mt-8 text-center">
                        <h1 className="text-2xl font-bold text-gray-900">Payment link not found</h1>
                        <p className="mt-2 text-gray-600">This link is not in the list.</p>
                        <Link href={LINKS} className={cn('mt-4 inline-block', CTA_FLOW_LINK_SEMIBOLD)}>
                            Back to payment links
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    if (slugParam && row && (row.linkStatus === 'paid' || row.linkStatus === 'cancelled')) {
        return (
            <>
                <Breadcrumb
                    items={[
                        { label: 'Booking & Payment', href: '/company-admin/booking-payment/booking' },
                        { label: 'Payment links', href: LINKS },
                        { label: 'Redirecting…' },
                    ]}
                />
                <div className="mx-auto w-full max-w-4xl px-4 pb-12 pt-8 text-center text-sm font-medium text-gray-600">
                    Redirecting to details…
                </div>
            </>
        );
    }

    const viewHref = slugParam ? `${LINKS}/view/${encodeURIComponent(slugParam)}` : LINKS;
    const backLabel = isEdit ? 'Back to link' : 'Back to payment links';

    return (
        <>
            {savedToast ? (
                <InlineToast
                    message={isEdit ? 'Payment link saved' : 'Payment link created'}
                    variant="success"
                    onDismiss={dismissSavedToast}
                />
            ) : null}
            <div className="min-h-0 w-full max-w-none bg-slate-50/50 pb-2">
                <div className="mb-4 w-full">
                    <Breadcrumb
                        items={[
                            { label: 'Booking & Payment', href: '/company-admin/booking-payment/booking' },
                            { label: 'Payment links', href: LINKS },
                            { label: isEdit ? 'Edit link' : 'New link' },
                        ]}
                    />
                </div>
                <div className="mx-auto w-full max-w-4xl px-0 sm:px-0">
                    <header className="mb-3 rounded-xl border-b border-gray-200/80 bg-white px-4 py-3 lg:px-6">
                        <div className="flex flex-row items-start justify-between gap-3 sm:gap-4">
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                                    {isEdit ? 'Edit payment link' : 'New payment link'}
                                </h1>
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    {isEdit
                                        ? 'Update before the link is paid or cancelled. The shareable URL does not change.'
                                        : "One-time link for a booking milestone. After save we open the detail page to copy the URL and share with your customer."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.push(isEdit ? viewHref : LINKS)}
                                className={cn(CTA_UTILITY_BTN, 'px-2 py-1 pt-1')}
                            >
                                <span aria-hidden>←</span>
                                {backLabel}
                            </button>
                        </div>
                    </header>

                    <div className="mt-2">
                        <PaymentLinkForm
                            variant={isEdit ? 'edit' : 'add'}
                            editSlug={isEdit ? slugParam : undefined}
                            initialBookingSlug={initialBooking}
                            enableDraftAutosave={!isEdit}
                            draftStorageKey={ARRIS_PAYMENT_LINK_FORM_DRAFT_KEY}
                            onCancel={() => router.push(isEdit ? viewHref : LINKS)}
                            onSaved={(paymentLinkSlug) => {
                                setSavedToast(true);
                                window.setTimeout(() => {
                                    router.push(`${LINKS}/view/${encodeURIComponent(paymentLinkSlug)}`);
                                }, 900);
                            }}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

export default function PaymentLinkFormPage() {
    return (
        <Suspense
            fallback={
                <div className="mx-auto w-full max-w-4xl px-4 pb-10 pt-6">
                    <div className="h-9 w-56 animate-pulse rounded-lg bg-gray-100" />
                    <div className="mt-3 h-4 max-w-xl animate-pulse rounded bg-gray-100" />
                    <div className="mt-8 h-64 animate-pulse rounded-xl border border-gray-100 bg-gray-50/80" />
                </div>
            }
        >
            <PaymentLinkFormPageContent />
        </Suspense>
    );
}
