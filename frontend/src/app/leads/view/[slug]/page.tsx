'use client';

import React, { use, useMemo, useState } from 'react';
import { LeadDetailShell, LeadNotFound } from '@/components/leads/LeadDetailShell';
import { LeadRecordTabs } from '@/components/leads/LeadRecordTabs';
import { getLeadBySlugIncludingArchived, updateLead, type Lead } from '@/lib/leadStore';
import { getIntelligenceLeadByLeadSlug } from '@/lib/leadsIntelligenceStore';

export default function LeadInfoPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [storeRefresh, setStoreRefresh] = useState(0);

    const createMode = slug === 'new';
    const lead = useMemo(() => (createMode ? undefined : getLeadBySlugIncludingArchived(slug)), [slug, storeRefresh, createMode]);

    const createDraftLead = React.useMemo<Lead>(() => {
        const nowIso = new Date().toISOString();
        const ymd = nowIso.slice(0, 10);
        return {
            id: 0,
            slug: 'new',
            name: '',
            phone: '',
            email: '',
            source: '' as unknown as Lead['source'],
            project: '',
            budgetRange: '',
            preferredUnitType: '' as unknown as Lead['preferredUnitType'],
            status: '' as unknown as Lead['status'],
            assignedTo: '',
            brokerAgent: '',
            notes: '',
            presentAddress: '',
            permanentAddress: '',
            createdDate: ymd,
            createdAt: nowIso,
            updatedAt: nowIso,

            assignment: { assignedTo: '', assignmentDate: ymd },
            followUps: [],
            siteVisits: [],
            pipeline: { leadStage: 'New', conversionProbability: 0 },
            conversion: { conversionStatus: 'Won', convertedDate: ymd },
            broker: { brokerName: '', commissionPercentage: 0 },
            notifications: { reminderEnabled: false },
            activityLog: [],
            threadNotes: [],
            attachments: [],
            linkedBookings: [],
            linkedPayments: [],
            linkedDocuments: [],
            leadScore: 0,
            deletedAt: null,
            kanbanColumn: 'new',
        };
    }, []);

    /** Copy addresses from Leads Intelligence into CRM when CRM fields are empty (same `leadSlug`). */
    React.useEffect(() => {
        if (createMode) return;
        const base = getLeadBySlugIncludingArchived(slug);
        if (!base) return;
        const intel = getIntelligenceLeadByLeadSlug(slug);
        if (!intel) return;
        const crmP = base.presentAddress?.trim() ?? '';
        const crmPerm = base.permanentAddress?.trim() ?? '';
        const intelP = intel.presentAddress?.trim() ?? '';
        const intelPerm = intel.permanentAddress?.trim() ?? '';
        const patch: { presentAddress?: string; permanentAddress?: string } = {};
        if (!crmP && intelP) patch.presentAddress = intelP;
        if (!crmPerm && intelPerm) patch.permanentAddress = intelPerm;
        if (Object.keys(patch).length === 0) return;
        updateLead(slug, patch);
        setStoreRefresh((x) => x + 1);
    }, [slug]);

    React.useEffect(() => {
        try {
            window.localStorage.setItem('activeLeadSlug', slug);
        } catch {
            // ignore
        }
    }, [slug]);

    if (!lead && !createMode) {
        return <LeadNotFound />;
    }

    const breadcrumbItems = createMode
        ? ([{ label: 'Leads', href: '/leads' }, { label: 'Create lead' }] as const)
        : lead!.deletedAt
          ? ([
                { label: 'Leads', href: '/leads' },
                { label: 'Archived', href: '/leads/archived' },
                { label: lead!.name },
            ] as const)
          : ([{ label: 'Leads', href: '/leads' }, { label: lead!.name }] as const);

    return (
        <LeadDetailShell breadcrumbItems={[...breadcrumbItems]}>
            <LeadRecordTabs
                lead={(createMode ? createDraftLead : lead!) as Lead}
                listVersion={storeRefresh}
                onBump={() => setStoreRefresh((x) => x + 1)}
                createMode={createMode}
            />
        </LeadDetailShell>
    );
}
