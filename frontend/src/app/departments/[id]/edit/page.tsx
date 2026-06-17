'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function DepartmentLegacyEditRedirect() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    useEffect(() => {
        if (id) router.replace(`/departments/view/${encodeURIComponent(id)}?edit=1`);
    }, [router, id]);
    return null;
}
