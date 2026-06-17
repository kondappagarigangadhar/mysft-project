'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VendorsCreateRoute() {
    const router = useRouter();
    const searchParams = useSearchParams();

    React.useEffect(() => {
        const sp = new URLSearchParams(searchParams.toString());
        const qs = sp.toString();
        router.replace(qs ? `/company-admin/vendors/new?${qs}` : '/company-admin/vendors/new');
    }, [router, searchParams]);

    return null;
}
