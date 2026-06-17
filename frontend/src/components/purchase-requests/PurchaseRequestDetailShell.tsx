'use client';

import React from 'react';
import Link from 'next/link';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Breadcrumb';

export function PurchaseRequestNotFound() {
    return (
        <CompanyAdminDashboardLayout>
            <div className="mx-auto max-w-3xl pb-12">
                <div className="mt-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Purchase request not found</h1>
                    <p className="mt-2 text-gray-500">The purchase request you are looking for does not exist.</p>
                    <Link
                        href="/procurement/requests"
                        className="mt-4 inline-block font-medium text-gray-700 underline-offset-2 hover:text-gray-900 hover:underline"
                    >
                        Back to Purchase Requests
                    </Link>
                </div>
            </div>
        </CompanyAdminDashboardLayout>
    );
}

type Props = {
    breadcrumbItems: BreadcrumbItem[];
    children: React.ReactNode;
};

/** Breadcrumb only — toolbar lives on the Overview tab (matches Leads / Work Orders). */
export function PurchaseRequestDetailShell({ breadcrumbItems, children }: Props) {
    return (
        <CompanyAdminDashboardLayout mainClassName="max-w-none">
            <>
                <Breadcrumb items={breadcrumbItems} />
                <div className="w-full pb-10">{children}</div>
            </>
        </CompanyAdminDashboardLayout>
    );
}
