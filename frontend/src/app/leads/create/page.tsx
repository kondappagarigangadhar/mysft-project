'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CreateLeadPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    React.useEffect(() => {
        const sp = new URLSearchParams(searchParams.toString());
        const qs = sp.toString();
        router.replace(qs ? `/leads/view/new?${qs}` : '/leads/view/new');
    }, [router, searchParams]);
    return null;
}
