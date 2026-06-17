'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { LuPencil } from 'react-icons/lu';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import { PaymentDetailView } from '@/components/booking-payment/payments/PaymentDetailView';
import { getBookingBySlug, getBookingPaymentSummary, getPaymentBySlug } from '@/lib/bookingPaymentMockStore';
import { cn } from '@/lib/utils';
import { CTA_FLOW_LINK_SEMIBOLD, CTA_UTILITY_BTN } from '@/lib/theme/ctaThemeClasses';
import { WorkspaceHelp, PAYMENT_WORKSPACE_HELP } from '@/components/workspace-help';

const PAY = '/company-admin/booking-payment/payments';

export default function PaymentViewPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const payment = getPaymentBySlug(slug);

    if (!payment) {
        return (
            <div className="mx-auto max-w-3xl pb-12">
                <div className="mt-8 text-center">
                    <h1 className="text-2xl font-bold text-slate-800">Payment not found</h1>
                    <p className="mt-2 text-slate-500">This payment is not in the ledger.</p>
                    <Link href={PAY} className={cn('mt-4 inline-block', CTA_FLOW_LINK_SEMIBOLD)}>
                        Back to Payments
                    </Link>
                </div>
            </div>
        );
    }

    const booking = getBookingBySlug(payment.bookingSlug);
    const summary = getBookingPaymentSummary(payment.bookingSlug);
    const editHref = `${PAY}/edit/${encodeURIComponent(slug)}`;

    return (
        <>
            <Breadcrumb
                items={[
                    { label: 'Booking & Payment', href: '/company-admin/booking-payment/booking' },
                    { label: 'Payments', href: PAY },
                    { label: booking?.customerName ?? 'Payment' },
                ]}
            />
            <div className="mx-auto max-w-6xl px-1 pb-12 sm:px-0">
                <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">Payment details</h1>
                        <p className="mt-1 font-medium text-slate-500">Receipt and ledger fields for this payment.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <WorkspaceHelp {...PAYMENT_WORKSPACE_HELP} triggerLabel="Payment workspace help" />
                        <Link
                            href={editHref}
                            className={cn(CTA_UTILITY_BTN, 'h-10 rounded-xl px-4 shadow-sm')}
                            aria-label="Edit payment"
                        >
                            <LuPencil size={18} aria-hidden />
                            Edit
                        </Link>
                    </div>
                </div>

                <div className="mt-8">
                    <Card className="border border-slate-200/80 bg-white shadow-lg shadow-slate-200/40">
                        <PaymentDetailView payment={payment} pendingAmount={summary?.outstanding ?? 0} booking={booking ?? null} />
                    </Card>
                </div>
            </div>
        </>
    );
}
