'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
    addAmenityBooking,
    deleteAmenityBooking,
    getAmenityBookingStoreEpoch,
    getAmenityBookingsForResident,
    subscribeAmenityBookingStore,
    updateAmenityBooking,
    updateAmenityBookingStatus,
    type AmenityBookingPatch,
    type StoredAmenityBooking,
} from '@/lib/amenityBookingStore';
import type { AmenityBookingStatus } from '@/modules/resident-portal/amenities/types';

export function useAmenityBookings(residentSlug: string | undefined) {
    const epoch = useSyncExternalStore(
        subscribeAmenityBookingStore,
        getAmenityBookingStoreEpoch,
        getAmenityBookingStoreEpoch,
    );

    const bookings = useMemo(() => {
        if (!residentSlug) return [] as StoredAmenityBooking[];
        return getAmenityBookingsForResident(residentSlug);
    }, [residentSlug, epoch]);

    const addBooking = useCallback(
        (
            input: Omit<StoredAmenityBooking, 'id' | 'residentSlug' | 'maxOccupancy'> & {
                id?: string;
                maxOccupancy?: number;
                status?: AmenityBookingStatus;
            },
        ) => {
            if (!residentSlug) return undefined;
            return addAmenityBooking({ ...input, residentSlug });
        },
        [residentSlug],
    );

    const updateBooking = useCallback(
        (id: string, patch: AmenityBookingPatch) => {
            const row = getAmenityBookingsForResident(residentSlug ?? '').find((b) => b.id === id);
            if (!residentSlug || !row || row.residentSlug !== residentSlug) return undefined;
            return updateAmenityBooking(id, patch);
        },
        [residentSlug],
    );

    const deleteBooking = useCallback(
        (id: string) => {
            const row = getAmenityBookingsForResident(residentSlug ?? '').find((b) => b.id === id);
            if (!residentSlug || !row || row.residentSlug !== residentSlug) return false;
            return deleteAmenityBooking(id);
        },
        [residentSlug],
    );

    const cancelBooking = useCallback(
        (id: string) => {
            const row = getAmenityBookingsForResident(residentSlug ?? '').find((b) => b.id === id);
            if (!residentSlug || !row || row.residentSlug !== residentSlug) return undefined;
            return updateAmenityBookingStatus(id, 'Cancelled');
        },
        [residentSlug],
    );

    return {
        bookings,
        addBooking,
        updateBooking,
        deleteBooking,
        cancelBooking,
        isLinked: Boolean(residentSlug),
    };
}
