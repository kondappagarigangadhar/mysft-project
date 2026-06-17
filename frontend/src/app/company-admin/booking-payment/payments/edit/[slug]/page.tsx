'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { PaymentEditForm } from '@/components/booking-payment/payments/PaymentEditForm';
import { getPaymentBySlug } from '@/lib/bookingPaymentMockStore';
import { cn } from '@/lib/utils';
import { CTA_FLOW_LINK_SEMIBOLD, CTA_UTILITY_BTN } from '@/lib/theme/ctaThemeClasses';

const PAY = '/company-admin/booking-payment/payments';

export default function PaymentEditPage({ params }: { params: Promise<{ slug: string }> }) {
    const router = useRouter();
    const { slug } = use(params);
    const payment = getPaymentBySlug(slug);

    if (!payment) {
        return (
            <div className="min-h-0 w-full max-w-none bg-slate-50/50 pb-2">
                <div className="mx-auto max-w-3xl px-4 pb-12 pt-8 text-center">
                    <h1 className="text-2xl font-bold text-slate-800">Payment not found</h1>
                    <p className="mt-2 text-slate-500">This payment is not in the ledger.</p>
                    <Link href={PAY} className={cn('mt-4 inline-block', CTA_FLOW_LINK_SEMIBOLD)}>
                        Back to Payments
                    </Link>
                </div>
            </div>
        );
    }

    const viewHref = `${PAY}/view/${encodeURIComponent(slug)}`;
    const goBack = () => router.push(viewHref);

    return (
        <div className="min-h-0 w-full max-w-none bg-slate-50/50 pb-2">
            <div className="mb-4 w-full">
                <Breadcrumb
                    items={[
                        { label: 'Booking & Payment', href: '/company-admin/booking-payment/booking' },
                        { label: 'Payments', href: PAY },
                        { label: 'Edit payment' },
                    ]}
                />
            </div>
            <div className="mx-auto w-full max-w-6xl px-0 sm:px-0">
                <header className="mb-3 rounded-xl border-b border-gray-200/80 bg-white px-4 py-3 lg:px-6">
                    <div className="flex flex-row items-start justify-between gap-3 sm:gap-4">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Edit payment</h1>
                        <button
                            type="button"
                            onClick={goBack}
                            className={cn(CTA_UTILITY_BTN, 'px-2 py-1 pt-1')}
                        >
                            <span aria-hidden>←</span>
                            Back to details
                        </button>
                    </div>
                </header>

                <div className="mt-2 pb-24">
                    <PaymentEditForm paymentSlug={slug} onCancel={goBack} onSuccess={goBack} />
                </div>
            </div>
        </div>
    );
}
