'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
    getResidentBySlug,
    getResidentStoreEpoch,
    sanitizeResidentVehicles,
    subscribeResidentStore,
    updateResident,
    type ResidentVehicle,
} from '@/lib/residentStore';

/**
 * Shared vehicle list for admin resident workspace and resident portal unit page.
 * Writes go to the in-memory resident store immediately so both sides stay aligned.
 */
export function useResidentVehicles(adminResidentSlug: string | undefined) {
    const epoch = useSyncExternalStore(subscribeResidentStore, getResidentStoreEpoch, getResidentStoreEpoch);

    const vehicles = useMemo(() => {
        if (!adminResidentSlug) return [] as ResidentVehicle[];
        return getResidentBySlug(adminResidentSlug)?.vehicles ?? [];
    }, [adminResidentSlug, epoch]);

    const onVehiclesChange = useCallback(
        (next: ResidentVehicle[]) => {
            if (!adminResidentSlug) return;
            updateResident(adminResidentSlug, { vehicles: sanitizeResidentVehicles(next) });
        },
        [adminResidentSlug],
    );

    return {
        vehicles,
        onVehiclesChange,
        isLinked: Boolean(adminResidentSlug),
        vehicleCount: vehicles.filter(
            (v) => v.vehicleName.trim() || v.registrationNumber.trim() || v.notes?.trim(),
        ).length,
    };
}
