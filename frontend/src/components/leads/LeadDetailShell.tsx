'use client';

import React from 'react';
import Link from 'next/link';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Breadcrumb';
export function LeadNotFound() {
    return (
        <CompanyAdminDashboardLayout>
            <div className="mx-auto max-w-3xl pb-12">
                <div className="mt-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Lead not found</h1>
                    <p className="mt-2 text-gray-500">The lead you are looking for does not exist.</p>
                    <Link
                        href="/leads"
                        className="mt-4 inline-block font-medium text-gray-700 underline-offset-2 hover:text-gray-900 hover:underline"
                    >
                        Back to Leads
                    </Link>
                </div>
            </div>
        </CompanyAdminDashboardLayout>
    );
}

type LeadDetailShellProps = {
    breadcrumbItems: BreadcrumbItem[];
    children: React.ReactNode;
};

/**
 * Lead detail: breadcrumb only. Name, status, and icon toolbar (edit / clone / share / archive) live on the Overview tab profile card.
 */
export function LeadDetailShell({ breadcrumbItems, children }: LeadDetailShellProps) {
    return (
        <CompanyAdminDashboardLayout mainClassName="max-w-none">
            <>
                <Breadcrumb items={breadcrumbItems} />
                <div className="w-full pb-10">{children}</div>
            </>
        </CompanyAdminDashboardLayout>
    );
}
