'use client';

import { use, useMemo, useState } from 'react';
import { VendorInvoiceDetailShell, VendorInvoiceNotFound } from '@/components/vendor-invoices/VendorInvoiceDetailShell';
import { VendorInvoiceRecordTabs } from '@/components/vendor-invoices/VendorInvoiceRecordTabs';
import { buildEmptyVendorInvoice, getVendorInvoiceBySlug } from '@/lib/vendorInvoiceStore';

export default function VendorInvoiceViewPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [refresh, setRefresh] = useState(0);
    const createMode = slug === 'new';

    const invoice = useMemo(
        () => (createMode ? buildEmptyVendorInvoice() : getVendorInvoiceBySlug(slug)),
        [slug, refresh, createMode],
    );

    if (!invoice && !createMode) return <VendorInvoiceNotFound />;

    const label = createMode ? 'Create Vendor Invoice' : invoice!.invoiceNumber || invoice!.invoiceId;

    return (
        <VendorInvoiceDetailShell
            breadcrumbItems={[
                { label: 'Vendor Management', href: '/company-admin/vendors/list' },
                { label: 'Vendor Invoices', href: '/company-admin/vendors/invoices' },
                { label },
            ]}
        >
            <VendorInvoiceRecordTabs
                invoice={invoice!}
                createMode={createMode}
                onBump={() => setRefresh((n) => n + 1)}
            />
        </VendorInvoiceDetailShell>
    );
}
