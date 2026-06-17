'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const TARGET = '/company-admin/booking-payment/booking/drafts';

export default function BookingDraftsAliasPage() {
    const router = useRouter();

    React.useEffect(() => {
        router.replace(TARGET);
    }, [router]);

    return null;
}

