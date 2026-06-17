'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import BookingRecordTabsSuspense from '@/components/booking-payment/BookingRecordTabs';
import { getBookingBySlug } from '@/lib/bookingPaymentMockStore';

const BASE = '/company-admin/booking-payment/booking';

export default function BookingViewPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const searchParams = useSearchParams();

    const isCreate = slug === 'new';
    const booking = isCreate ? undefined : getBookingBySlug(slug);

    if (!isCreate && !booking) {
        return (
            <>
                <Breadcrumb
                    items={[
                        { label: 'Booking & Payment', href: BASE },
                        { label: 'Booking', href: BASE },
                        { label: 'Not found' },
                    ]}
                />
                <div className="mx-auto max-w-3xl pb-12">
                    <div className="mt-8 text-center">
                        <h1 className="text-2xl font-bold text-gray-800">Booking not found</h1>
                        <p className="mt-2 text-gray-500">The booking you are looking for does not exist.</p>
                        <Link
                            href={BASE}
                            className="mt-4 inline-block font-medium text-gray-700 underline-offset-2 hover:text-gray-900 hover:underline"
                        >
                            Back to Booking
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    const breadcrumbItems = isCreate
        ? ([{ label: 'Booking & Payment', href: BASE }, { label: 'Booking', href: BASE }, { label: 'Create booking' }] as const)
        : ([
              { label: 'Booking & Payment', href: BASE },
              { label: 'Booking', href: BASE },
              { label: booking!.customerName },
              ...(searchParams.get('edit') ? ([{ label: 'Edit' }] as const) : ([] as const)),
          ] as const);

    return (
        <>
            <Breadcrumb items={[...breadcrumbItems]} />
            <div className="w-full pb-10">
                <BookingRecordTabsSuspense slug={slug} />
            </div>
        </>
    );
}
