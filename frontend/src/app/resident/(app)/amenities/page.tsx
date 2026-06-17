'use client';

import React, { useState } from 'react';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { useAmenityBookings } from '@/hooks/useAmenityBookings';
import { DEMO_RESIDENT_PROFILE, DEMO_RESIDENT_SLUG } from '@/lib/residentDemoProfile';
import type { StoredAmenityBooking } from '@/lib/amenityBookingStore';
import { SectionCard } from '@/modules/resident-portal/components/SectionCard';
import { ResidentPageHeader, ResidentPageShell } from '@/modules/resident-portal/components/ResidentPageShell';
import { useResidentSession } from '@/modules/resident-portal/store/residentSessionStore';
import { residentSectionFeedList } from '@/modules/resident-portal/styles/cardStyles';
import {
    AmenityBookingCard,
    AmenityBookingConfirmModal,
    AmenityBookingFormModal,
    AmenityBookingManageActions,
} from '@/modules/resident-portal/amenities';
import type { AmenityBookingFormValues } from '@/modules/resident-portal/amenities';
import { maxOccupancyForAmenity } from '@/modules/resident-portal/amenities/amenityConstants';
import { LuCalendarClock, LuPlus } from 'react-icons/lu';

type FormModalState = null | { mode: 'create' } | { mode: 'edit'; booking: StoredAmenityBooking };

export default function ResidentAmenitiesPage() {
    const { currentResident } = useResidentSession();
    const adminSlug = currentResident?.adminResidentSlug ?? DEMO_RESIDENT_SLUG;
    const { bookings, addBooking, updateBooking, deleteBooking, isLinked } = useAmenityBookings(adminSlug);

    const [formModal, setFormModal] = useState<FormModalState>(null);
    const [deleteTarget, setDeleteTarget] = useState<StoredAmenityBooking | null>(null);
    const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

    const residentName = currentResident?.fullName ?? DEMO_RESIDENT_PROFILE.fullName;
    const propertyUnit = DEMO_RESIDENT_PROFILE.propertyUnit;

    const handleFormSubmit = (values: AmenityBookingFormValues) => {
        if (formModal?.mode === 'create') {
            if (!isLinked) return;
            addBooking({
                residentName,
                propertyUnit,
                amenity: values.amenity,
                bookingDate: values.bookingDate,
                slot: values.slot,
                status: 'Booked',
                bookedAt: 'Just now',
                maxOccupancy: maxOccupancyForAmenity(values.amenity),
            });
            setToast({ message: 'Amenity booked successfully.', variant: 'success' });
            return;
        }
        if (formModal?.mode === 'edit') {
            updateBooking(formModal.booking.id, {
                amenity: values.amenity,
                bookingDate: values.bookingDate,
                slot: values.slot,
            });
            setToast({ message: 'Booking updated.', variant: 'success' });
        }
    };

    const formBooking = formModal?.mode === 'edit' ? formModal.booking : null;
    const formOpen = formModal !== null;

    return (
        <ResidentPageShell>
            <ResidentPageHeader
                icon={<LuCalendarClock className="h-5 w-5" aria-hidden />}
                title="Amenities"
                subtitle="Reserve gym, clubhouse, guest room, and pool slots."
            />

            <SectionCard
                title="Your bookings"
                subtitle="Upcoming and past reservations"
                accent="blue"
                icon={<LuCalendarClock className="h-4 w-4" />}
                bodyClassName="p-0"
                action={
                    <button
                        type="button"
                        onClick={() => setFormModal({ mode: 'create' })}
                        disabled={!isLinked}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0a66c2] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <LuPlus className="h-3.5 w-3.5" aria-hidden />
                        Book amenity
                    </button>
                }
            >
                {bookings.length === 0 ? (
                    <div className="px-4 py-10 text-center sm:px-5">
                        <p className="text-sm text-[rgba(0,0,0,0.55)]">No bookings yet.</p>
                        <button
                            type="button"
                            onClick={() => setFormModal({ mode: 'create' })}
                            disabled={!isLinked}
                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a66c2] hover:underline disabled:opacity-50"
                        >
                            <LuPlus className="h-4 w-4" aria-hidden />
                            Book your first amenity
                        </button>
                    </div>
                ) : (
                    <ul className={residentSectionFeedList}>
                        {bookings.map((booking) => (
                            <li key={booking.id}>
                                <AmenityBookingCard
                                    booking={booking}
                                    manageActions={
                                        <AmenityBookingManageActions
                                            booking={booking}
                                            mode="resident"
                                            onEdit={() => setFormModal({ mode: 'edit', booking })}
                                            onDelete={() => setDeleteTarget(booking)}
                                        />
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </SectionCard>

            <AmenityBookingFormModal
                booking={formBooking}
                isOpen={formOpen}
                onClose={() => setFormModal(null)}
                onSubmit={handleFormSubmit}
                disabled={!isLinked}
            />

            <AmenityBookingConfirmModal
                booking={deleteTarget}
                variant="delete"
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (!deleteTarget) return;
                    if (deleteBooking(deleteTarget.id)) {
                        setToast({ message: 'Booking deleted.', variant: 'success' });
                    }
                }}
            />

            {toast ? (
                <InlineToast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
            ) : null}
        </ResidentPageShell>
    );
}
