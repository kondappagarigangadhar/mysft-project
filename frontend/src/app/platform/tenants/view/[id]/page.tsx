'use client';

import React, { use, useMemo, useState } from 'react';
import type { Company } from '@/data/mockData';
import { getCompanyById } from '@/lib/companyStore';
import { TenantDetailShell, TenantNotFound } from '@/components/tenants/TenantDetailShell';
import { TenantRecordTabs } from '@/components/tenants/TenantRecordTabs';
import { tenantListHref } from '@/lib/tenantRoutes';

function buildNewCompanyDraft(): Company {
    const now = new Date().toISOString().slice(0, 10);
    return {
        id: 0,
        name: '',
        owner: '',
        status: 'Pending',
        revenue: '₹0',
        joinedDate: '—',
        tenantCode: '',
        domain: '',
        country: 'India',
        plan: 'Basic',
        usersCount: 0,
        createdAt: now,
        businessType: 'Builder',
        email: '',
        phone: '',
        city: '',
        state: '',
        adminName: '',
        adminEmail: '',
        adminPhone: '',
        lastUpdated: now,
    };
}

export default function TenantViewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [storeRefresh, setStoreRefresh] = useState(0);
    const createMode = id === 'new';
    const numericId = createMode ? 0 : Number(id);
    const company = useMemo(() => {
        void storeRefresh;
        return createMode ? undefined : getCompanyById(numericId);
    }, [createMode, numericId, storeRefresh]);
    const createDraft = useMemo(() => buildNewCompanyDraft(), []);

    if (!createMode && (Number.isNaN(numericId) || !company)) {
        return <TenantNotFound />;
    }

    const breadcrumbItems = createMode
        ? ([{ label: 'Tenants', href: tenantListHref() }, { label: 'Create tenant' }] as const)
        : ([{ label: 'Tenants', href: tenantListHref() }, { label: company!.name }] as const);

    return (
        <TenantDetailShell breadcrumbItems={[...breadcrumbItems]}>
            <TenantRecordTabs
                company={(createMode ? createDraft : company!) as Company}
                listVersion={storeRefresh}
                onBump={() => setStoreRefresh((x) => x + 1)}
                createMode={createMode}
            />
        </TenantDetailShell>
    );
}
