'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { PaymentAddWizard } from '@/components/booking-payment/payments/PaymentAddWizard';
import { getBookingBySlug } from '@/lib/bookingPaymentMockStore';
import { navigateAfterResourceCreate, safeInternalPath } from '@/lib/navigationReturn';
import { cn } from '@/lib/utils';
import { CTA_UTILITY_BTN } from '@/lib/theme/ctaThemeClasses';

const PAY = '/company-admin/booking-payment/payments';

function PaymentAddContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const booking = searchParams.get('booking')?.trim() ?? '';
    const returnTo = safeInternalPath(searchParams.get('returnTo') ?? undefined);
    const bookingOk = Boolean(booking && getBookingBySlug(booking));
    const cancelFallback = bookingOk ? `${PAY}?booking=${encodeURIComponent(booking)}` : PAY;

    const goBack = () =>
        navigateAfterResourceCreate(router, {
            returnTo,
            fallback: cancelFallback,
        });

    return (
        <div className="min-h-0 w-full max-w-none bg-slate-50/50 pb-2">
            <div className="mb-4 w-full">
                <Breadcrumb
                    items={[
                        { label: 'Booking & Payment', href: '/company-admin/booking-payment/booking' },
                        { label: 'Payments', href: PAY },
                        { label: 'Add payment' },
                    ]}
                />
            </div>
            <div className="mx-auto w-full max-w-6xl px-0 sm:px-0">
                <header className="mb-3 rounded-xl border-b border-gray-200/80 bg-white px-4 py-3 lg:px-6">
                    <div className="flex flex-row items-start justify-between gap-3 sm:gap-4">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Add payment</h1>
                        <button
                            type="button"
                            onClick={goBack}
                            className={cn(CTA_UTILITY_BTN, 'px-2 py-1 pt-1')}
                        >
                            <span aria-hidden>←</span>
                            Back to payments
                        </button>
                    </div>
                </header>

                <div className="mt-2 pb-24">
                    <PaymentAddWizard
                        initialBookingSlug={bookingOk ? booking : ''}
                        onCancel={goBack}
                        onSaved={(paymentSlug) =>
                            navigateAfterResourceCreate(router, {
                                returnTo,
                                fallback: `${PAY}/view/${encodeURIComponent(paymentSlug)}`,
                            })
                        }
                    />
                </div>
            </div>
        </div>
    );
}

export default function PaymentAddPage() {
    return (
        <Suspense
            fallback={
                <div className="mx-auto max-w-3xl pb-12 pt-8 text-center text-sm font-medium text-slate-500">Loading…</div>
            }
        >
            <PaymentAddContent />
        </Suspense>
    );
}
