'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResidentSession } from '../store/residentSessionStore';

export function useResidentRequireAuth() {
    const router = useRouter();
    const { session } = useResidentSession();

    useEffect(() => {
        if (!session.isAuthenticated) router.replace('/resident/login');
    }, [router, session.isAuthenticated]);

    return session;
}

