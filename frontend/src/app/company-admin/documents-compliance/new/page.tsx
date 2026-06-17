'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const BASE = '/company-admin/documents-compliance';

export default function NewComplianceDocumentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    React.useEffect(() => {
        const sp = new URLSearchParams(searchParams.toString());
        const qs = sp.toString();
        router.replace(qs ? `${BASE}/view/new?${qs}` : `${BASE}/view/new`);
    }, [router, searchParams]);

    return null;
}
