'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useAmenityBookings } from '@/hooks/useAmenityBookings';
import type { StoredAmenityBooking } from '@/lib/amenityBookingStore';
import type { Resident } from '@/lib/residentStore';
import { residentSectionFeedList } from '@/modules/resident-portal/styles/cardStyles';
import {
    AmenityBookingCard,
    AmenityBookingConfirmModal,
    AmenityBookingFormModal,
    AmenityBookingManageActions,
} from '@/modules/resident-portal/amenities';
import type { AmenityBookingFormValues } from '@/modules/resident-portal/amenities';
import { maxOccupancyForAmenity } from '@/modules/resident-portal/amenities/amenityConstants';
import { LuCalendarClock, LuPlus, LuShieldAlert } from 'react-icons/lu';

type Props = {
    resident: Resident;
};

type FormModalState = null | { mode: 'create' } | { mode: 'edit'; booking: StoredAmenityBooking };

export function ResidentAmenitiesTab({ resident }: Props) {
    const { bookings, addBooking, updateBooking, deleteBooking, cancelBooking } = useAmenityBookings(resident.slug);
    const [formModal, setFormModal] = useState<FormModalState>(null);
    const [deleteTarget, setDeleteTarget] = useState<StoredAmenityBooking | null>(null);
    const [cancelTarget, setCancelTarget] = useState<StoredAmenityBooking | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const activeCount = bookings.filter((b) => b.status === 'Booked' || b.status === 'Pending').length;
    const formBooking = formModal?.mode === 'edit' ? formModal.booking : null;
    const isCreateForm = formModal?.mode === 'create';

    const handleFormSubmit = (values: AmenityBookingFormValues) => {
        if (formModal?.mode === 'create') {
            const created = addBooking({
                residentName: resident.fullName,
                propertyUnit: resident.propertyUnit,
                amenity: values.amenity,
                bookingDate: values.bookingDate,
                slot: values.slot,
                status: 'Booked',
                bookedAt: 'Added by admin',
                maxOccupancy: maxOccupancyForAmenity(values.amenity),
            });
            if (created) {
                setNotice(`Added ${created.amenity} booking.`);
            }
            return;
        }
        if (formModal?.mode === 'edit') {
            updateBooking(formModal.booking.id, values);
            setNotice(`Updated ${values.amenity} booking.`);
        }
    };

    return (
        <div className="w-full min-w-0 space-y-4">
            <Card className="border border-gray-200 p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                            <LuCalendarClock className="h-5 w-5 text-gray-500" aria-hidden />
                            Amenity bookings
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Reservations for {resident.propertyUnit || 'this unit'} — from the resident portal or added
                            here.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setFormModal({ mode: 'create' })}
                            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0092ff] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#007ad6]"
                        >
                            <LuPlus className="h-3.5 w-3.5" aria-hidden />
                            Add amenity
                        </button>
                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-900">
                            {activeCount} active
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800">
                            {bookings.length} total
                        </span>
                    </div>
                </div>
            </Card>

            {notice ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{notice}</p>
            ) : null}

            <Card className="overflow-hidden border border-gray-200 shadow-sm" contentClassName="p-0">
                {bookings.length === 0 ? (
                    <div className="px-4 py-10 text-center sm:px-5">
                        <p className="text-sm text-gray-500">No amenity bookings yet.</p>
                        <button
                            type="button"
                            onClick={() => setFormModal({ mode: 'create' })}
                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0092ff] hover:underline"
                        >
                            <LuPlus className="h-4 w-4" aria-hidden />
                            Add amenity booking
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
                                            mode="admin"
                                            onEdit={() => setFormModal({ mode: 'edit', booking })}
                                            onDelete={() => setDeleteTarget(booking)}
                                            onCancel={() => setCancelTarget(booking)}
                                        />
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <Card className="border border-amber-100 bg-amber-50/40 p-4 shadow-sm sm:p-5">
                <p className="flex items-start gap-2 text-sm text-amber-950">
                    <LuShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                        <strong>Add amenity</strong> books a slot for this resident. <strong>Cancel booking</strong> releases
                        the slot. Residents can also book from the portal.
                    </span>
                </p>
            </Card>

            <AmenityBookingFormModal
                booking={formBooking}
                isOpen={formModal !== null}
                onClose={() => setFormModal(null)}
                onSubmit={handleFormSubmit}
                createTitle="Add amenity booking"
                submitLabel={isCreateForm ? 'Add booking' : 'Save changes'}
            />

            <AmenityBookingConfirmModal
                booking={deleteTarget}
                variant="delete"
                isOpen={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (!deleteTarget) return;
                    if (deleteBooking(deleteTarget.id)) {
                        setNotice(`Deleted ${deleteTarget.amenity} booking.`);
                    }
                }}
            />

            <AmenityBookingConfirmModal
                booking={cancelTarget}
                variant="cancel"
                isOpen={cancelTarget !== null}
                onClose={() => setCancelTarget(null)}
                onConfirm={() => {
                    if (!cancelTarget) return;
                    cancelBooking(cancelTarget.id);
                    setNotice(`Cancelled ${cancelTarget.amenity} booking.`);
                }}
            />
        </div>
    );
}
