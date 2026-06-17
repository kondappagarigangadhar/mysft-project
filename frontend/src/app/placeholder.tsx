'use client';

import React from 'react';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Card } from '@/components/ui/Card';
import { usePathname } from 'next/navigation';

export default function PlaceholderPage() {
    const pathname = usePathname();
    const title = pathname.split('/').pop()?.replace('-', ' ') || 'Page';
    const displayTitle = title.charAt(0).toUpperCase() + title.slice(1);

    return (
        <CompanyAdminDashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">{displayTitle}</h1>
                <p className="text-slate-500 mt-1">This section is currently under development.</p>
            </div>

            <Card className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-orange-50 text-primary rounded-3xl flex items-center justify-center mb-6 border border-orange-100 shadow-inner">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h2 className="text-2xl font-bold text-slate-700">Work in Progress</h2>
                <p className="text-slate-400 mt-2 max-w-sm">
                    We&apos;re building something great here! Check back soon for the full {displayTitle} experience.
                </p>
            </Card>
        </CompanyAdminDashboardLayout>
    );
}
