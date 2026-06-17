'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/** Legacy route redirect: `/work-orders/create` → `/work-orders/view/new` */
export default function CreateWorkOrderLegacyRedirectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    React.useEffect(() => {
        const sp = new URLSearchParams(searchParams.toString());
        const qs = sp.toString();
        router.replace(qs ? `/work-orders/view/new?${qs}` : '/work-orders/view/new');
    }, [router, searchParams]);
    return null;
}

