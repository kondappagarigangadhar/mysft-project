'use client';

import { use, useMemo, useState } from 'react';
import { CustomerDetailShell, CustomerNotFound } from '@/components/customers/CustomerDetailShell';
import { CustomerRecordTabs } from '@/components/customers/CustomerRecordTabs';
import { customersListHref } from '@/lib/customerRoutes';
import { getCustomerBySlugIncludingArchived } from '@/lib/customersStore';

export default function CustomerViewPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [storeRefresh, setStoreRefresh] = useState(0);
    const createMode = slug === 'new';

    const customer = useMemo(
        () => (createMode ? undefined : getCustomerBySlugIncludingArchived(slug)),
        [slug, storeRefresh, createMode],
    );

    if (!createMode && !customer) {
        return <CustomerNotFound />;
    }

    const breadcrumbItems = [
        { label: 'Lead & Sales', href: '/leads' },
        { label: 'Customer & Buyer', href: customersListHref() },
        { label: createMode ? 'Create customer' : customer!.fullName },
    ];

    const shellCustomer = createMode
        ? ({
              slug: 'new',
              fullName: 'New customer',
              customerCode: 'NEW',
              phone: '',
              email: '',
              leadId: '',
              leadSlug: 'new',
              leadSource: 'Website' as const,
              bookingSlug: '',
              bookingId: '',
              projectName: '',
              unitNumber: '',
              bookingStatus: 'Pending' as const,
              assignedExecutive: '',
              totalAmount: 0,
              paidAmount: 0,
              pendingAmount: 0,
              paymentStatus: 'Pending' as const,
              customerStatus: 'Onboarding' as const,
              lastPaymentDate: '',
              createdDate: new Date().toISOString().slice(0, 10),
              bookingDate: new Date().toISOString().slice(0, 10),
              paymentLink: '',
              paymentHistory: [],
              documents: [],
              projectUpdates: [],
              journeyTimeline: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              deletedAt: null,
              id: 0,
          } satisfies Parameters<typeof CustomerRecordTabs>[0]['customer'])
        : customer!;

    return (
        <CustomerDetailShell breadcrumbItems={breadcrumbItems}>
            <CustomerRecordTabs customer={shellCustomer} createMode={createMode} onBump={() => setStoreRefresh((x) => x + 1)} />
        </CustomerDetailShell>
    );
}
