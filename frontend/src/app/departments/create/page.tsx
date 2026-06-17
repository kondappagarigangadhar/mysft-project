'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateDepartmentRedirectPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/departments/view/new');
    }, [router]);
    return null;
}
