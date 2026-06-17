'use client';

import { useEffect, useRef } from 'react';
import { consumePendingSavedViewFilters } from '@/lib/globalSavedViewsStore';

/** After navbar navigation, applies queued filter payload once on the matching route. */
export function useConsumePendingSavedView(pathname: string, apply: (filters: Record<string, unknown>) => void) {
    const applyRef = useRef(apply);
    useEffect(() => {
        applyRef.current = apply;
    });
    useEffect(() => {
        const raw = consumePendingSavedViewFilters(pathname);
        if (raw) applyRef.current(raw);
    }, [pathname]);
}
