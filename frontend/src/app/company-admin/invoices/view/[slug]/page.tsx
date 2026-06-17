'use client';

import React, { use, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { InvoiceDetailShell, InvoiceNotFound } from '@/components/invoices/InvoiceDetailShell';
import { InvoiceRecordTabs } from '@/components/invoices/InvoiceRecordTabs';
import { buildInvoiceBreadcrumbs } from '@/lib/procurement/procurementBreadcrumbs';
import { buildEmptyInvoiceDraft, getInvoiceBySlugIncludingArchived, type Invoice } from '@/lib/invoiceStore';

export default function InvoiceViewPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const searchParams = useSearchParams();
    const [storeRefresh, setStoreRefresh] = useState(0);
    const returnPrSlug = searchParams.get('returnPrSlug')?.trim() || undefined;
    const returnPoNumber = searchParams.get('returnPoNumber')?.trim() || undefined;

    const createMode = slug === 'new';
    const invoice = useMemo(
        () => (createMode ? undefined : getInvoiceBySlugIncludingArchived(slug)),
        [slug, storeRefresh, createMode],
    );

    const createDraft = useMemo<Invoice>(() => buildEmptyInvoiceDraft(), []);

    React.useEffect(() => {
        try {
            window.localStorage.setItem('activeInvoiceSlug', slug);
        } catch {
            // ignore
        }
    }, [slug]);

    const titleForBreadcrumb = createMode
        ? 'Create invoice'
        : invoice!.invoiceNumber?.trim() || invoice!.invoiceId;

    const breadcrumbItems = useMemo(
        () =>
            buildInvoiceBreadcrumbs({
                createMode,
                returnPrSlug,
                returnPoNumber,
                title: titleForBreadcrumb,
            }),
        [createMode, returnPrSlug, returnPoNumber, titleForBreadcrumb],
    );

    if (!invoice && !createMode) {
        return <InvoiceNotFound />;
    }

    return (
        <InvoiceDetailShell breadcrumbItems={breadcrumbItems}>
            <InvoiceRecordTabs
                invoice={(createMode ? createDraft : invoice!) as Invoice}
                listVersion={storeRefresh}
                onBump={() => setStoreRefresh((x) => x + 1)}
                createMode={createMode}
            />
        </InvoiceDetailShell>
    );
}
