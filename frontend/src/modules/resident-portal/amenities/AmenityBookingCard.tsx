'use client';

import React from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatBookingDateDisplay } from './amenityBookingTime';
import type { AmenityBooking } from './types';

export function AmenityBookingCard({
    booking,
    manageActions,
}: {
    booking: AmenityBooking;
    manageActions?: React.ReactNode;
}) {
    const dateLabel = formatBookingDateDisplay(booking.bookingDate);

    return (
        <article className="px-4 py-3.5 sm:px-5 mx-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">{booking.amenity}</p>
                        {booking.status === 'Cancelled' ? (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-800">
                                Cancelled
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-[rgba(0,0,0,0.55)]">
                        {dateLabel} · {booking.slot}
                    </p>
                    <p className="mt-1 text-xs text-[rgba(0,0,0,0.45)]">
                        Max {booking.maxOccupancy} · {booking.id}
                    </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={booking.status} />
                    {manageActions}
                </div>
            </div>
        </article>
    );
}
