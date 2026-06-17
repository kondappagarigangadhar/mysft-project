'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ServiceMaintenanceCreateRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/platform/community/service-maintenance/view/new');
    }, [router]);
    return null;
}
