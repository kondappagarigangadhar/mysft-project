'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';

const BASE = '/company-admin/documents-compliance';

export default function ComplianceDocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    React.useEffect(() => {
        router.replace(`${BASE}/view/${encodeURIComponent(id)}`);
    }, [router, id]);
    return null;
}
