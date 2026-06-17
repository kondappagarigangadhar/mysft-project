'use client';

import React, { use, useMemo, useState } from 'react';
import { ResidentDetailShell, ResidentNotFound } from '@/components/residents/ResidentDetailShell';
import { ResidentRecordTabs } from '@/components/residents/ResidentRecordTabs';
import { createDraftResidentRecord, getResidentBySlugIncludingArchived, type Resident } from '@/lib/residentStore';
import { residentsListHref } from '@/lib/residentRoutes';

export default function ResidentWorkspacePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [storeRefresh, setStoreRefresh] = useState(0);
    const createMode = slug === 'new';
    const resident = useMemo(() => {
        void storeRefresh;
        return createMode ? undefined : getResidentBySlugIncludingArchived(slug);
    }, [slug, storeRefresh, createMode]);
    const draft = useMemo(() => createDraftResidentRecord(), []);

    React.useEffect(() => {
        try {
            window.localStorage.setItem('activeResidentSlug', slug);
        } catch {
            // ignore
        }
    }, [slug]);

    if (!resident && !createMode) {
        return <ResidentNotFound />;
    }

    const base = residentsListHref();
    const breadcrumbItems = createMode
        ? [
              { label: 'Platform Foundation', href: '/platform/tenants' },
              { label: 'Resident Management', href: base },
              { label: 'Create resident' },
          ]
        : resident!.deletedAt
          ? [
                { label: 'Platform Foundation', href: '/platform/tenants' },
                { label: 'Resident & Community Management', href: base },
                { label: 'Resident Management', href: base },
                { label: `${resident!.fullName} (archived)` },
            ]
          : [
                { label: 'Platform Foundation', href: '/platform/tenants' },
                { label: 'Resident & Community Management', href: base },
                { label: 'Resident Management', href: base },
                { label: resident!.fullName },
            ];

    const record: Resident = createMode ? draft : resident!;

    return (
        <ResidentDetailShell breadcrumbItems={[...breadcrumbItems]}>
            <ResidentRecordTabs resident={record} createMode={createMode} onBump={() => setStoreRefresh((x) => x + 1)} />
        </ResidentDetailShell>
    );
}
