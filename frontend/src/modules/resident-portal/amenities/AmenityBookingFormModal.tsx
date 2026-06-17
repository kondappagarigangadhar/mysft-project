'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import {
    residentChipActiveClass,
    residentChipInactiveClass,
    residentInputClass,
} from '@/modules/resident-portal/components/ResidentPageShell';
import { AMENITY_OPTIONS } from './amenityConstants';
import {
    bookingDateToInputValue,
    buildSlotLabel,
    defaultBookingDate,
    defaultEndTime,
    defaultStartTime,
    parseSlotToTimes,
} from './amenityBookingTime';
import type { AmenityBooking, AmenityType } from './types';
import { LuCalendar, LuClock, LuDumbbell, LuHouse, LuHotel, LuWaves } from 'react-icons/lu';

export type AmenityBookingFormValues = {
    amenity: AmenityType;
    bookingDate: string;
    slot: string;
};

const AMENITY_ICONS: Record<AmenityType, React.ReactNode> = {
    Gym: <LuDumbbell className="h-3.5 w-3.5" />,
    Clubhouse: <LuHouse className="h-3.5 w-3.5" />,
    'Guest Room': <LuHotel className="h-3.5 w-3.5" />,
    'Swimming Pool': <LuWaves className="h-3.5 w-3.5" />,
};

type Props = {
    /** `null` = new booking */
    booking: AmenityBooking | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (values: AmenityBookingFormValues) => void;
    submitLabel?: string;
    /** Modal title when creating (default: Book amenity) */
    createTitle?: string;
    disabled?: boolean;
};

export function AmenityBookingFormModal({
    booking,
    isOpen,
    onClose,
    onSubmit,
    submitLabel,
    createTitle = 'Book amenity',
    disabled = false,
}: Props) {
    const isCreate = booking === null;
    const [amenity, setAmenity] = useState<AmenityType>('Gym');
    const [bookingDate, setBookingDate] = useState(defaultBookingDate());
    const [startTime, setStartTime] = useState(defaultStartTime());
    const [endTime, setEndTime] = useState(defaultEndTime());

    useEffect(() => {
        if (!isOpen) return;
        if (!booking) {
            setAmenity('Gym');
            setBookingDate(defaultBookingDate());
            setStartTime(defaultStartTime());
            setEndTime(defaultEndTime());
            return;
        }
        setAmenity(booking.amenity);
        setBookingDate(bookingDateToInputValue(booking.bookingDate));
        const times = parseSlotToTimes(booking.slot);
        setStartTime(times.start);
        setEndTime(times.end);
    }, [isOpen, booking]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (disabled) return;
        onSubmit({
            amenity,
            bookingDate,
            slot: buildSlotLabel(startTime, endTime),
        });
        onClose();
    };

    const title = isCreate ? createTitle : `Edit — ${booking.amenity}`;
    const primaryLabel = submitLabel ?? (isCreate ? 'Confirm booking' : 'Save changes');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidthClassName="max-w-md">
            <form onSubmit={submit} className="space-y-3.5">
                <div className="space-y-2">
                    <span className="block text-xs font-semibold text-gray-800">Amenity</span>
                    <div className="flex flex-wrap gap-1.5">
                        {AMENITY_OPTIONS.map((a) => {
                            const active = amenity === a.key;
                            return (
                                <button
                                    key={a.key}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => setAmenity(a.key)}
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                                        active ? residentChipActiveClass : residentChipInactiveClass,
                                    )}
                                >
                                    {AMENITY_ICONS[a.key]}
                                    {a.key}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="ab-date" className="block text-xs font-semibold text-gray-800">
                        Booking date
                    </label>
                    <div className="relative">
                        <LuCalendar
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                            aria-hidden
                        />
                        <input
                            id="ab-date"
                            type="date"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            required
                            disabled={disabled}
                            className={cn(residentInputClass, 'pl-10')}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <label htmlFor="ab-start" className="block text-xs font-semibold text-gray-800">
                            Start time
                        </label>
                        <div className="relative">
                            <LuClock
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                aria-hidden
                            />
                            <input
                                id="ab-start"
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                                disabled={disabled}
                                className={cn(residentInputClass, 'pl-10')}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label htmlFor="ab-end" className="block text-xs font-semibold text-gray-800">
                            End time
                        </label>
                        <div className="relative">
                            <LuClock
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                aria-hidden
                            />
                            <input
                                id="ab-end"
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                                disabled={disabled}
                                className={cn(residentInputClass, 'pl-10')}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={disabled}
                        className="rounded-full bg-[#0a66c2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {primaryLabel}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
