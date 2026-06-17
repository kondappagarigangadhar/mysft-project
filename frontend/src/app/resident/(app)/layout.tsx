'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ResidentShellLayout } from '@/modules/resident-portal/layouts/ResidentShellLayout';
import { useResidentSession } from '@/modules/resident-portal/store/residentSessionStore';

export default function ResidentAppGroupLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { session } = useResidentSession();

    useEffect(() => {
        if (!session.isAuthenticated) router.replace('/resident/login');
    }, [router, session.isAuthenticated]);

    return <ResidentShellLayout>{children}</ResidentShellLayout>;
}

