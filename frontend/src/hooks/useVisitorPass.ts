'use client';

import { useMemo, useSyncExternalStore } from 'react';
import {
    getVisitorRequestByPassId,
    getVisitorStoreEpoch,
    subscribeVisitorStore,
    type StoredVisitorRequest,
} from '@/lib/visitorRequestStore';

export function useVisitorPass(passId: string | undefined): StoredVisitorRequest | undefined {
    const epoch = useSyncExternalStore(subscribeVisitorStore, getVisitorStoreEpoch, getVisitorStoreEpoch);

    return useMemo(() => {
        if (!passId) return undefined;
        return getVisitorRequestByPassId(passId);
    }, [passId, epoch]);
}
