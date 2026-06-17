'use client';

import { useEffect, useState } from 'react';
import { subscribeComplianceStore } from '@/lib/complianceDocumentsMockStore';

/** Re-render when the compliance mock store mutates. */
export function useComplianceStoreBump(): number {
    const [v, setV] = useState(0);
    useEffect(() => subscribeComplianceStore(() => setV((x) => x + 1)), []);
    return v;
}
