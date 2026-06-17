'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Alias route to match Leads draft continuation UX.
 * Keeps the Projects Inventory module as the source of UI.
 */
export default function ProjectDraftsAliasPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    React.useEffect(() => {
        const sp = new URLSearchParams(searchParams.toString());
        const qs = sp.toString();
        router.replace(qs ? `/projects-inventory/projects/drafts?${qs}` : '/projects-inventory/projects/drafts');
    }, [router, searchParams]);

    return null;
}

