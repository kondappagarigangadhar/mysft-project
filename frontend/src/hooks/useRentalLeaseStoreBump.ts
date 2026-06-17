'use client';

import { useEffect, useState } from 'react';
import { subscribeRentalLeaseStore } from '@/lib/rentalLeaseAgreementStore';

/** Re-render when the rental lease mock store mutates. */
export function useRentalLeaseStoreBump(): number {
    const [v, setV] = useState(0);
    useEffect(() => subscribeRentalLeaseStore(() => setV((x) => x + 1)), []);
    return v;
}
