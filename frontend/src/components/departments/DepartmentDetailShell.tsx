'use client';

import React from 'react';
import Link from 'next/link';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Breadcrumb';

export function DepartmentNotFound() {
    return (
        <CompanyAdminDashboardLayout>
            <div className="mx-auto max-w-3xl pb-12">
                <div className="mt-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Department not found</h1>
                    <p className="mt-2 text-gray-500">The department you are looking for does not exist.</p>
                    <Link
                        href="/departments"
                        className="mt-4 inline-block font-medium text-gray-700 underline-offset-2 hover:text-gray-900 hover:underline"
                    >
                        Back to Departments
                    </Link>
                </div>
            </div>
        </CompanyAdminDashboardLayout>
    );
}

export function DepartmentDetailShell({
    breadcrumbItems,
    children,
}: {
    breadcrumbItems: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    return (
        <CompanyAdminDashboardLayout mainClassName="max-w-none">
            <>
                <Breadcrumb items={breadcrumbItems} />
                <div className="w-full pb-10">{children}</div>
            </>
        </CompanyAdminDashboardLayout>
    );
}
