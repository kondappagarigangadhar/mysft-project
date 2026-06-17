'use client';

import React, { use, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PurchaseOrderDetailShell, PurchaseOrderNotFound } from '@/components/purchase-orders/PurchaseOrderDetailShell';
import { PurchaseOrderRecordTabs } from '@/components/purchase-orders/PurchaseOrderRecordTabs';
import { buildPurchaseOrderBreadcrumbs } from '@/lib/procurement/procurementBreadcrumbs';
import { buildEmptyPurchaseOrderDraft, getPurchaseOrderIncludingArchived } from '@/lib/purchaseOrderStore';

export default function PurchaseOrderViewPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const searchParams = useSearchParams();
    const [storeRefresh, setStoreRefresh] = useState(0);

    const createMode = slug === 'new';
    const prSlugFromUrl = searchParams.get('prSlug')?.trim() || undefined;
    const returnPrSlug = searchParams.get('returnPrSlug')?.trim() || prSlugFromUrl;

    const record = useMemo(
        () => (createMode ? undefined : getPurchaseOrderIncludingArchived(slug)),
        [slug, storeRefresh, createMode],
    );

    const createDraft = useMemo(() => buildEmptyPurchaseOrderDraft(prSlugFromUrl), [prSlugFromUrl]);

    React.useEffect(() => {
        try {
            window.localStorage.setItem('activePurchaseOrderSlug', slug);
        } catch {
            /* ignore */
        }
    }, [slug]);

    if (!record && !createMode) {
        return <PurchaseOrderNotFound />;
    }

    const breadcrumbItems = useMemo(
        () =>
            buildPurchaseOrderBreadcrumbs({
                createMode,
                returnPrSlug,
                poNumber: record?.poNumber,
            }),
        [createMode, returnPrSlug, record?.poNumber],
    );

    return (
        <PurchaseOrderDetailShell breadcrumbItems={[...breadcrumbItems]}>
            <PurchaseOrderRecordTabs
                purchaseOrder={createMode ? createDraft : record!}
                listVersion={storeRefresh}
                onBump={() => setStoreRefresh((x) => x + 1)}
                createMode={createMode}
            />
        </PurchaseOrderDetailShell>
    );
}
