'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';

export default function CompanyAdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const leadsStyleFullBleedMain =
        pathname === '/company-admin/vendors/create' ||
        pathname === '/company-admin/suppliers/create';

    return (
        <CompanyAdminDashboardLayout mainClassName={leadsStyleFullBleedMain ? '!max-w-none !pb-0' : undefined}>
            {leadsStyleFullBleedMain ? (
                <div className="min-h-0 w-full max-w-none bg-slate-50/50 pb-2">{children}</div>
            ) : (
                children
            )}
        </CompanyAdminDashboardLayout>
    );
}
