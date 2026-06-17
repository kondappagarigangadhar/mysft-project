'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CreateResidentRedirectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    React.useEffect(() => {
        const sp = new URLSearchParams(searchParams.toString());
        const qs = sp.toString();
        router.replace(qs ? `/platform/community/residents/view/new?${qs}` : '/platform/community/residents/view/new');
    }, [router, searchParams]);
    return null;
}
