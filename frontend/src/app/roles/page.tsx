'use client';

import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import PageHeader from '@/components/ui/PageHeader';

export default function RolesPage() {
    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Platform Foundation', href: '/platform/tenants' },
                    { label: 'Roles & Permissions', href: '/roles' },
                ]}
            />
            <PageHeader title="Roles & Permissions" />
        </CompanyAdminDashboardLayout>
    );
}
