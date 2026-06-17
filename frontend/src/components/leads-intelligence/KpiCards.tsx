'use client';

import React from 'react';
import { IntelligenceKpiGrid } from '@/components/crm-intelligence/IntelligenceKpiGrid';
import type { IntelligenceKpiSummary } from '@/components/crm-intelligence/intelligenceKpiConfig';

export type KpiCardsProps = IntelligenceKpiSummary;

/** Leads Intelligence — same KPI cards as AI Demand Intelligence (`IntelligenceKpiGrid`). */
export function KpiCards(props: KpiCardsProps) {
    return (
        <IntelligenceKpiGrid
            kpis={props}
            columnsClassName="grid grid-cols-2 gap-3 sm:gap-3 lg:grid-cols-2"
        />
    );
}
