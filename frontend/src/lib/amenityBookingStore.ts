'use client';

import type { AmenityBooking, AmenityBookingStatus } from '@/modules/resident-portal/amenities/types';
import { maxOccupancyForAmenity } from '@/modules/resident-portal/amenities/amenityConstants';
import { defaultBookingDate } from '@/modules/resident-portal/amenities/amenityBookingTime';

export type StoredAmenityBooking = AmenityBooking & {
    residentSlug: string;
    residentName: string;
    propertyUnit?: string;
};

let _bookings: StoredAmenityBooking[] = [];
let _storeEpoch = 0;
const _listeners = new Set<() => void>();

export function subscribeAmenityBookingStore(listener: () => void) {
    _listeners.add(listener);
    return () => {
        _listeners.delete(listener);
    };
}

export function getAmenityBookingStoreEpoch() {
    return _storeEpoch;
}

function notify() {
    _storeEpoch += 1;
    _listeners.forEach((l) => l());
}

function seedBookings(): StoredAmenityBooking[] {
    const tomorrow = defaultBookingDate();
    const rows: Omit<StoredAmenityBooking, 'id'>[] = [
        {
            residentSlug: 'ramesh-kumar',
            residentName: 'Ramesh Kumar',
            propertyUnit: 'Skyline Residency — Unit 101',
            amenity: 'Gym',
            bookingDate: tomorrow,
            slot: '6:00 PM – 7:00 PM',
            status: 'Booked',
            maxOccupancy: 10,
            bookedAt: 'Today 4:20 PM',
        },
        {
            residentSlug: 'ramesh-kumar',
            residentName: 'Ramesh Kumar',
            propertyUnit: 'Skyline Residency — Unit 101',
            amenity: 'Clubhouse',
            bookingDate: tomorrow,
            slot: '10:00 AM – 11:00 AM',
            status: 'Booked',
            maxOccupancy: 40,
            bookedAt: 'Yesterday 2:00 PM',
        },
        {
            residentSlug: 'priya-mehta',
            residentName: 'Priya Mehta',
            propertyUnit: 'Riverfront Tower — Unit 1204',
            amenity: 'Swimming Pool',
            bookingDate: tomorrow,
            slot: '8:00 PM – 9:00 PM',
            status: 'Booked',
            maxOccupancy: 20,
            bookedAt: 'Today 11:00 AM',
        },
        {
            residentSlug: 'james-nguyen',
            residentName: 'James Nguyen',
            propertyUnit: 'Skyline Courts — Apt 902',
            amenity: 'Guest Room',
            bookingDate: tomorrow,
            slot: '6:00 PM – 7:00 PM',
            status: 'Pending',
            maxOccupancy: 4,
            bookedAt: 'Today 9:15 AM',
        },
    ];
    return rows.map((row, i) => ({
        ...row,
        id: `B-${2201 + i}`,
    }));
}

_bookings = seedBookings();

export function getAmenityBookingsForResident(residentSlug: string): StoredAmenityBooking[] {
    return _bookings
        .filter((b) => b.residentSlug === residentSlug)
        .sort((a, b) => (b.bookedAt ?? '').localeCompare(a.bookedAt ?? ''));
}

export function addAmenityBooking(
    input: Omit<StoredAmenityBooking, 'id' | 'maxOccupancy'> & { id?: string; maxOccupancy?: number },
): StoredAmenityBooking {
    const row: StoredAmenityBooking = {
        ...input,
        id: input.id ?? `B-${Math.floor(2000 + Math.random() * 8000)}`,
        maxOccupancy: input.maxOccupancy ?? maxOccupancyForAmenity(input.amenity),
        status: input.status ?? 'Booked',
    };
    _bookings = [row, ..._bookings];
    notify();
    return row;
}

export type AmenityBookingPatch = Partial<
    Pick<StoredAmenityBooking, 'amenity' | 'bookingDate' | 'slot' | 'status' | 'maxOccupancy'>
>;

export function updateAmenityBooking(id: string, patch: AmenityBookingPatch): StoredAmenityBooking | undefined {
    const idx = _bookings.findIndex((b) => b.id === id);
    if (idx < 0) return undefined;
    const next = { ..._bookings[idx]!, ...patch };
    if (patch.amenity) {
        next.maxOccupancy = maxOccupancyForAmenity(patch.amenity);
    }
    _bookings = _bookings.map((b, i) => (i === idx ? next : b));
    notify();
    return next;
}

export function updateAmenityBookingStatus(
    id: string,
    status: AmenityBookingStatus,
): StoredAmenityBooking | undefined {
    return updateAmenityBooking(id, { status });
}

export function deleteAmenityBooking(id: string): boolean {
    const before = _bookings.length;
    _bookings = _bookings.filter((b) => b.id !== id);
    if (_bookings.length === before) return false;
    notify();
    return true;
}
