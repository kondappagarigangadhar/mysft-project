'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { customerCreateHref } from '@/lib/customerRoutes';

export default function CustomerCreateRedirectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const qs = searchParams.toString();
        router.replace(qs ? `${customerCreateHref()}?${qs}` : customerCreateHref());
    }, [router, searchParams]);

    return null;
}
