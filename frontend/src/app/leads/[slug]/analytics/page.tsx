'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';

/** Legacy URL — analytics moved to `/leads/analytics`. */
export default function LeadAnalyticsLegacyRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/leads/analytics');
    }, [router]);
    return (
        <CompanyAdminDashboardLayout>
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Opening analytics…</div>
        </CompanyAdminDashboardLayout>
    );
}
