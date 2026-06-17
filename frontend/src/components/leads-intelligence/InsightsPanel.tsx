'use client';

import React, { useMemo } from 'react';
import { IntelligenceInsightsStack } from '@/components/crm-intelligence/IntelligenceInsightsStack';
import { buildLeadsIntelligenceInsightSections } from '@/components/crm-intelligence/intelligenceInsightBuilders';
import type { IntelligenceLead } from '@/lib/leadsIntelligenceStore';

interface InsightsPanelProps {
    leads: IntelligenceLead[];
    /** Tighter layout for sidebar / top strip next to KPIs */
    compact?: boolean;
}

/** Leads Intelligence AI insight cards — shared stack with Demand Intelligence (`IntelligenceInsightsStack`). */
export function InsightsPanel({ leads, compact }: InsightsPanelProps) {
    const sections = useMemo(() => buildLeadsIntelligenceInsightSections(leads), [leads]);
    return <IntelligenceInsightsStack sections={sections} compact={compact} />;
}
