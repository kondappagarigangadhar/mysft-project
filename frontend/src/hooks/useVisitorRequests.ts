'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
    addVisitorRequest,
    deleteVisitorRequest,
    getVisitorRequestsForResident,
    getVisitorStoreEpoch,
    subscribeVisitorStore,
    updateVisitorRequest,
    updateVisitorRequestStatus,
    type StoredVisitorRequest,
    type VisitorRequestPatch,
} from '@/lib/visitorRequestStore';
import type { VisitorStatus } from '@/modules/resident-portal/visitors/types';

export function useVisitorRequests(residentSlug: string | undefined) {
    const epoch = useSyncExternalStore(subscribeVisitorStore, getVisitorStoreEpoch, getVisitorStoreEpoch);

    const requests = useMemo(() => {
        if (!residentSlug) return [] as StoredVisitorRequest[];
        return getVisitorRequestsForResident(residentSlug);
    }, [residentSlug, epoch]);

    const addRequest = useCallback(
        (input: Omit<StoredVisitorRequest, 'id' | 'residentSlug'> & { id?: string; status?: VisitorStatus }) => {
            if (!residentSlug) return undefined;
            return addVisitorRequest({ ...input, residentSlug });
        },
        [residentSlug],
    );

    const updateRequest = useCallback((passId: string, patch: VisitorRequestPatch) => {
        const row = getVisitorRequestsForResident(residentSlug ?? '').find((r) => r.id === passId);
        if (!residentSlug || !row || row.residentSlug !== residentSlug) return undefined;
        return updateVisitorRequest(passId, patch);
    }, [residentSlug]);

    const deleteRequest = useCallback((passId: string) => {
        const row = getVisitorRequestsForResident(residentSlug ?? '').find((r) => r.id === passId);
        if (!residentSlug || !row || row.residentSlug !== residentSlug) return false;
        return deleteVisitorRequest(passId);
    }, [residentSlug]);

    const revokeRequest = useCallback((passId: string) => {
        const row = getVisitorRequestsForResident(residentSlug ?? '').find((r) => r.id === passId);
        if (!residentSlug || !row || row.residentSlug !== residentSlug) return undefined;
        return updateVisitorRequestStatus(passId, 'Rejected');
    }, [residentSlug]);

    return {
        requests,
        addRequest,
        updateRequest,
        deleteRequest,
        revokeRequest,
        isLinked: Boolean(residentSlug),
    };
}
