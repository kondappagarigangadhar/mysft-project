'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CreateProjectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    React.useEffect(() => {
        const sp = new URLSearchParams(searchParams.toString());
        const qs = sp.toString();
        router.replace(qs ? `/projects-inventory/projects/view/new?${qs}` : '/projects-inventory/projects/view/new');
    }, [router, searchParams]);
    return null;
}
