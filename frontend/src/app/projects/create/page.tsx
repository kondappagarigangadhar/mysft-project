'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Alias route to match Leads draft continuation UX:
 * - `/projects/create?draftId=...` redirects into Projects Inventory create flow.
 * - No separate UI should live here.
 */
export default function CreateProjectAliasPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    React.useEffect(() => {
        const sp = new URLSearchParams(searchParams.toString());
        const qs = sp.toString();
        router.replace(qs ? `/projects-inventory/projects/create?${qs}` : '/projects-inventory/projects/create');
    }, [router, searchParams]);

    return null;
}

