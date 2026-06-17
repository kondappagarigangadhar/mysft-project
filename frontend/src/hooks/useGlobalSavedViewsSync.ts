'use client';

import { useEffect, useState } from 'react';
import { subscribeGlobalSavedViews } from '@/lib/globalSavedViewsStore';

/** Bumps a tick when global saved views change (same tab or cross-tab). */
export function useGlobalSavedViewsSync() {
    const [tick, setTick] = useState(0);
    useEffect(() => subscribeGlobalSavedViews(() => setTick((n) => n + 1)), []);
    return tick;
}
