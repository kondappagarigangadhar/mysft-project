'use client';

import React from 'react';
import Link from 'next/link';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Breadcrumb';
import { cn } from '@/lib/utils';
import { CTA_FLOW_LINK } from '@/lib/theme/ctaThemeClasses';

export function ProjectNotFound() {
    return (
        <CompanyAdminDashboardLayout mainClassName="max-w-none">
            <div className="mx-auto max-w-3xl pb-12">
                <div className="mt-8 text-center">
                    <h1 className="text-2xl font-bold text-slate-800">Project not found</h1>
                    <p className="mt-2 text-slate-500">The project you are looking for does not exist.</p>
                    <Link
                        href="/projects-inventory/projects"
                        className={cn('mt-4 inline-block', CTA_FLOW_LINK)}
                    >
                        Back to Projects
                    </Link>
                </div>
            </div>
        </CompanyAdminDashboardLayout>
    );
}

type ProjectDetailShellProps = {
    breadcrumbItems: BreadcrumbItem[];
    children: React.ReactNode;
};

/**
 * Project detail: breadcrumb wrapper only (matches Leads `LeadDetailShell` pattern).
 * The overview tab contains the record header + action toolbar.
 */
export function ProjectDetailShell({ breadcrumbItems, children }: ProjectDetailShellProps) {
    return (
        <CompanyAdminDashboardLayout mainClassName="max-w-none">
            <>
                <Breadcrumb items={breadcrumbItems} />
                <div className="w-full pb-10">{children}</div>
            </>
        </CompanyAdminDashboardLayout>
    );
}

