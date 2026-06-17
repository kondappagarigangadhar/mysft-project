'use client';

import React, { Suspense } from 'react';
import type { Lead } from '@/lib/leadStore';
import { LeadRecordTabs } from '@/components/leads/LeadRecordTabs';

function TabsFallback() {
    return (
        <div className="space-y-4">
            <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
            <div className="h-64 animate-pulse rounded-xl bg-gray-100/80" />
        </div>
    );
}

export function LeadRecordTabsGate(props: { lead: Lead; listVersion: number; onBump: () => void }) {
    return (
        <Suspense fallback={<TabsFallback />}>
            <LeadRecordTabs {...props} />
        </Suspense>
    );
}
