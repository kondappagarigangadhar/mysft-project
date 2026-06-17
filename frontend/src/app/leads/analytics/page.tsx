'use client';

import React from 'react';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { LeadAnalyticsPanel } from '@/components/leads/LeadDetailTabPanels';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default function LeadsAnalyticsPage() {
    return (
        <CompanyAdminDashboardLayout>
            <>
                <Breadcrumb items={[{ label: 'Leads', href: '/leads' }, { label: 'Analytics' }]} />
                <div className="mx-auto max-w-5xl pb-12">
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Leads analytics</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">Pipeline summary across all leads in your CRM.</p>
                    <div className="mt-8">
                        <LeadAnalyticsPanel />
                    </div>
                </div>
            </>
        </CompanyAdminDashboardLayout>
    );
}
