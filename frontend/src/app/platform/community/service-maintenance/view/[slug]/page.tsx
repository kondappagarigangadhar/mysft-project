'use client';

import React, { use, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ServiceMaintenanceDetailShell, ServiceMaintenanceNotFound } from '@/components/service-maintenance/ServiceMaintenanceDetailShell';
import { ServiceMaintenanceRecordTabs } from '@/components/service-maintenance/ServiceMaintenanceRecordTabs';
import type { BreadcrumbItem } from '@/components/ui/Breadcrumb';
import {
    createDraftServiceMaintenanceTicket,
    getServiceMaintenanceTicketBySlugIncludingArchived,
    type ServiceMaintenanceTicket,
} from '@/lib/serviceMaintenanceStore';
import { serviceMaintenanceListHref } from '@/lib/serviceMaintenanceRoutes';
import { getResidentBySlug } from '@/lib/residentStore';
import { residentViewHref, residentsListHref } from '@/lib/residentRoutes';

export default function ServiceMaintenanceWorkspacePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const searchParams = useSearchParams();
    const linkedResidentSlug = searchParams.get('resident')?.trim() ?? '';
    const [storeRefresh, setStoreRefresh] = useState(0);
    const createMode = slug === 'new';
    const ticket = useMemo(() => {
        void storeRefresh;
        return createMode ? undefined : getServiceMaintenanceTicketBySlugIncludingArchived(slug);
    }, [slug, storeRefresh, createMode]);
    const draft = useMemo(() => createDraftServiceMaintenanceTicket(), []);

    React.useEffect(() => {
        try {
            window.localStorage.setItem('activeServiceTicketSlug', slug);
        } catch {
            // ignore
        }
    }, [slug]);

    const base = serviceMaintenanceListHref();
    const record: ServiceMaintenanceTicket = createMode ? draft : (ticket ?? draft);

    const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
        if (createMode) {
            const resident = linkedResidentSlug ? getResidentBySlug(linkedResidentSlug) : undefined;
            if (resident) {
                const residentsBase = residentsListHref();
                return [
                    { label: 'Platform Foundation', href: '/platform/tenants' },
                    { label: 'Resident & Community Management', href: residentsBase },
                    { label: 'Resident Management', href: residentsBase },
                    { label: resident.fullName, href: residentViewHref(resident.slug) },
                    { label: 'Create Service Ticket' },
                ];
            }
            return [
                { label: 'Platform Foundation', href: '/platform/tenants' },
                { label: 'mySFT Community Hub', href: base },
                { label: 'Create Service Ticket' },
            ];
        }
        if (!ticket) {
            return [
                { label: 'Platform Foundation', href: '/platform/tenants' },
                { label: 'mySFT Community Hub', href: base },
                { label: 'Service Request & Maintenance OS', href: base },
            ];
        }
        if (ticket.deletedAt) {
            return [
                { label: 'Platform Foundation', href: '/platform/tenants' },
                { label: 'mySFT Community Hub', href: base },
                { label: 'Service Request & Maintenance OS', href: base },
                { label: `${ticket.requestTitle} (archived)` },
            ];
        }
        return [
            { label: 'Platform Foundation', href: '/platform/tenants' },
            { label: 'mySFT Community Hub', href: base },
            { label: 'Service Request & Maintenance OS', href: base },
            { label: ticket.requestTitle || ticket.ticketCode },
        ];
    }, [createMode, linkedResidentSlug, base, ticket]);

    if (!ticket && !createMode) {
        return <ServiceMaintenanceNotFound />;
    }

    return (
        <ServiceMaintenanceDetailShell breadcrumbItems={breadcrumbItems}>
            <ServiceMaintenanceRecordTabs ticket={record} createMode={createMode} onBump={() => setStoreRefresh((x) => x + 1)} />
        </ServiceMaintenanceDetailShell>
    );
}
