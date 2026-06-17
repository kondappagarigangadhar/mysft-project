'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResidentSession } from '@/modules/resident-portal/store/residentSessionStore';

export default function ResidentAuthGroupLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { session } = useResidentSession();

    useEffect(() => {
        if (session.isAuthenticated) router.replace('/resident/dashboard');
    }, [router, session.isAuthenticated]);

    return children;
}

