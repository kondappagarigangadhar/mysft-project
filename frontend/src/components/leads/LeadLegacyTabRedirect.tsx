'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';

/**
 * Redirects old `/leads/[slug]/…` routes to the unified detail page with `?tab=`.
 */
export function LeadLegacyTabRedirect({ slug, tab }: { slug: string; tab: string }) {
    const router = useRouter();

    useEffect(() => {
        router.replace(`/leads/view/${encodeURIComponent(slug)}?tab=${encodeURIComponent(tab)}`);
    }, [router, slug, tab]);

    return (
        <CompanyAdminDashboardLayout>
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">Opening lead…</div>
        </CompanyAdminDashboardLayout>
    );
}
