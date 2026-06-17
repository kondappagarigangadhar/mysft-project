'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const BASE = '/company-admin/booking-payment/booking';

export default function CreateBookingAliasPage() {
    const router = useRouter();

    React.useEffect(() => {
        router.replace(`${BASE}/view/new`);
    }, [router]);

    return null;
}

