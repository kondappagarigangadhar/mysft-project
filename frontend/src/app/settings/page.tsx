'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy route — redirects to centralized Platform Foundation workspace. */
export default function SettingsPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/company-admin/platform-foundation');
    }, [router]);
    return null;
}
