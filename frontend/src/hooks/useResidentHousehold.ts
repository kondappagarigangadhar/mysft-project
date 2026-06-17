'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
    getResidentBySlug,
    getResidentStoreEpoch,
    sanitizeResidentHousehold,
    subscribeResidentStore,
    updateResident,
    type ResidentHouseholdMember,
} from '@/lib/residentStore';

export function useResidentHousehold(adminResidentSlug: string | undefined) {
    const epoch = useSyncExternalStore(subscribeResidentStore, getResidentStoreEpoch, getResidentStoreEpoch);

    const householdMembers = useMemo(() => {
        if (!adminResidentSlug) return [] as ResidentHouseholdMember[];
        return getResidentBySlug(adminResidentSlug)?.householdMembers ?? [];
    }, [adminResidentSlug, epoch]);

    const onHouseholdChange = useCallback(
        (next: ResidentHouseholdMember[]) => {
            if (!adminResidentSlug) return;
            updateResident(adminResidentSlug, { householdMembers: sanitizeResidentHousehold(next) });
        },
        [adminResidentSlug],
    );

    return {
        householdMembers,
        onHouseholdChange,
        isLinked: Boolean(adminResidentSlug),
        memberCount: householdMembers.filter(
            (m) => m.fullName.trim() || m.relationship?.trim() || m.phoneNumber?.trim() || m.notes?.trim(),
        ).length,
    };
}
