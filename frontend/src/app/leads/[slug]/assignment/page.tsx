'use client';

import React, { use } from 'react';
import { LeadLegacyTabRedirect } from '@/components/leads/LeadLegacyTabRedirect';

export default function LeadAssignmentPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    return <LeadLegacyTabRedirect slug={slug} tab="assignment" />;
}
