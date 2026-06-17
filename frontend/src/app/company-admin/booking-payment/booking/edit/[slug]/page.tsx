'use client';

import React, { use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const BASE = '/company-admin/booking-payment/booking';

export default function EditBookingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();

    React.useEffect(() => {
        const sp = new URLSearchParams(searchParams.toString());
        sp.set('edit', '1');
        const qs = sp.toString();
        router.replace(`${BASE}/view/${encodeURIComponent(slug)}?${qs}`);
    }, [router, searchParams, slug]);

    return null;
}
