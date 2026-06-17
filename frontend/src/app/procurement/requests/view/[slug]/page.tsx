'use client';

import React, { use, useMemo, useState } from 'react';
import { PurchaseRequestDetailShell, PurchaseRequestNotFound } from '@/components/purchase-requests/PurchaseRequestDetailShell';
import { PurchaseRequestRecordTabs } from '@/components/purchase-requests/PurchaseRequestRecordTabs';
import { buildEmptyPurchaseRequestDraft, getPurchaseRequestIncludingArchived } from '@/lib/purchaseRequestStore';

export default function PurchaseRequestViewPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [storeRefresh, setStoreRefresh] = useState(0);

    const createMode = slug === 'new';
    const record = useMemo(() => (createMode ? undefined : getPurchaseRequestIncludingArchived(slug)), [slug, storeRefresh, createMode]);
    const createDraft = React.useMemo(() => buildEmptyPurchaseRequestDraft(), []);

    React.useEffect(() => {
        try {
            window.localStorage.setItem('activePurchaseRequestSlug', slug);
        } catch {
            /* ignore */
        }
    }, [slug]);

    if (!record && !createMode) {
        return <PurchaseRequestNotFound />;
    }

    const breadcrumbItems = createMode
        ? ([
              { label: 'Procurement Management' },
              { label: 'Purchase Requests', href: '/procurement/requests' },
              { label: 'Create request' },
          ] as const)
        : ([
              { label: 'Procurement Management' },
              { label: 'Purchase Requests', href: '/procurement/requests' },
              { label: record!.prNumber || 'Request' },
          ] as const);

    return (
        <PurchaseRequestDetailShell breadcrumbItems={[...breadcrumbItems]}>
            <PurchaseRequestRecordTabs
                purchaseRequest={(createMode ? createDraft : record!)}
                listVersion={storeRefresh}
                onBump={() => setStoreRefresh((x) => x + 1)}
                createMode={createMode}
            />
        </PurchaseRequestDetailShell>
    );
}
