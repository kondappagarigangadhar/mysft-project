'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { PaymentsBookingList } from '@/components/booking-payment/payments/PaymentsBookingList';
import { deleteBooking, getBookingBySlug, getBookings } from '@/lib/bookingPaymentMockStore';
import { LuPlus } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { CTA_SHADOW_SOFT } from '@/lib/theme/ctaThemeClasses';

const BOOKING_BASE_PATH = '/company-admin/booking-payment/booking';

export default function BookingPage() {
    const router = useRouter();
    const pathname = usePathname() ?? '';
    const [v, setV] = useState(0);

    const bookings = useMemo(() => getBookings(), [v]);

    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);

    const bump = useCallback(() => {
        setV((x) => x + 1);
    }, []);

    const dismissToast = useCallback(() => setToast(null), []);

    const openAdd = useCallback(() => {
        const q = pathname.startsWith('/') ? `?returnTo=${encodeURIComponent(pathname)}` : '';
        router.push(`${BOOKING_BASE_PATH}/create${q}`);
    }, [router, pathname]);

    const openView = useCallback(
        (slug: string) => {
            router.push(`${BOOKING_BASE_PATH}/view/${encodeURIComponent(slug)}`);
        },
        [router],
    );

    const openEdit = useCallback(
        (slug: string) => {
            router.push(`${BOOKING_BASE_PATH}/edit/${encodeURIComponent(slug)}`);
        },
        [router],
    );

    const confirmDeleteBooking = useCallback((slug: string) => {
        const b = getBookingBySlug(slug);
        if (!b) return;
        if (
            typeof window !== 'undefined' &&
            !window.confirm(
                `Delete booking for “${b.customerName}”? Payments, documents, and payment links for this booking will be removed (demo).`,
            )
        ) {
            return;
        }
        const res = deleteBooking(slug);
        if (!res.ok) {
            setToast({ msg: res.error, err: true });
            return;
        }
        setToast({ msg: 'Booking deleted.' });
        bump();
    }, [bump]);

    const handleBulkDeleteBookings = useCallback(
        (slugs: string[]) => {
            for (const slug of slugs) {
                deleteBooking(slug);
            }
            setToast({ msg: `${slugs.length} booking(s) deleted.` });
            bump();
        },
        [bump],
    );

    return (
        <div className="space-y-6">
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}

            <Breadcrumb
                items={[
                    { label: 'Booking & Payment', href: BOOKING_BASE_PATH },
                    { label: 'Booking', href: BOOKING_BASE_PATH },
                ]}
            />

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Booking</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Full booking columns (lead, assigned to, project, unit) plus total amount in the header. Use List or
                        Grid for layout. Row menu: payments and booking tools.
                    </p>
                </div>
                <Button type="button" variant="company" size="cta" className={cn('gap-2 shrink-0', CTA_SHADOW_SOFT)} onClick={openAdd}>
                    <LuPlus size={18} />
                    Add booking
                </Button>
            </div>

            <PaymentsBookingList
                bookings={bookings}
                columnLayout="bookingHub"
                enableListGridToggle
                tableStorageKey="arris-booking-hub-table-v1"
                savedViewModule="Bookings"
                legacySavedViewsStorageKey="arris-booking-hub-saved-views"
                exportVariant="bookings"
                bookingAdminActions={{
                    onView: openView,
                    onEdit: openEdit,
                    onDelete: confirmDeleteBooking,
                }}
                onBulkDeleteBookings={handleBulkDeleteBookings}
            />
        </div>
    );
}
