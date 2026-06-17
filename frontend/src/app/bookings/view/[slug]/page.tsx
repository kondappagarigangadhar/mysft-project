'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const BASE = '/company-admin/booking-payment/booking';

export default function BookingViewAliasPage({ params }: { params: Promise<{ slug: string }> }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    React.useEffect(() => {
        (async () => {
            const { slug } = await params;
            const sp = new URLSearchParams(searchParams.toString());
            const qs = sp.toString();
            router.replace(qs ? `${BASE}/view/${encodeURIComponent(slug)}?${qs}` : `${BASE}/view/${encodeURIComponent(slug)}`);
        })();
    }, [router, searchParams, params]);

    return null;
}

