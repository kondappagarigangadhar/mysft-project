'use client';

import React, { use, useMemo, useState } from 'react';
import { WorkOrderDetailShell, WorkOrderNotFound } from '@/components/work-orders/WorkOrderDetailShell';
import { WorkOrderRecordTabs } from '@/components/work-orders/WorkOrderRecordTabs';
import { buildEmptyWorkOrderDraft, getWorkOrderBySlugIncludingArchived, type WorkOrder } from '@/lib/workOrderStore';
import { buildVendorAssignmentDetailBreadcrumbs } from '@/lib/workOrderBreadcrumbs';

export default function WorkOrderViewPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [storeRefresh, setStoreRefresh] = useState(0);

    const createMode = slug === 'new';
    const workOrder = useMemo(() => (createMode ? undefined : getWorkOrderBySlugIncludingArchived(slug)), [slug, storeRefresh, createMode]);

    const createDraft = React.useMemo<WorkOrder>(() => buildEmptyWorkOrderDraft(), []);

    React.useEffect(() => {
        try {
            window.localStorage.setItem('activeWorkOrderSlug', slug);
        } catch {
            // ignore
        }
    }, [slug]);

    if (!workOrder && !createMode) {
        return <WorkOrderNotFound />;
    }

    const breadcrumbItems = buildVendorAssignmentDetailBreadcrumbs({
        createMode,
        title: workOrder?.title,
        workOrderId: workOrder?.workOrderId,
    });

    return (
        <WorkOrderDetailShell breadcrumbItems={breadcrumbItems}>
            <WorkOrderRecordTabs
                workOrder={(createMode ? createDraft : workOrder!) as WorkOrder}
                listVersion={storeRefresh}
                onBump={() => setStoreRefresh((x) => x + 1)}
                createMode={createMode}
            />
        </WorkOrderDetailShell>
    );
}

