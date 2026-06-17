'use client';

import type { ComponentType } from 'react';
import {
    LuFlame,
    LuGauge,
    LuHeartPulse,
    LuMegaphone,
    LuTarget,
    LuTrendingUp,
} from 'react-icons/lu';
import type { IntelligenceKpiAccent } from './IntelligenceKpiCard';

/** Shared KPI shape for Leads Intelligence and AI Demand Intelligence summaries. */
export type IntelligenceKpiSummary = {
    avgScore: number;
    avgProbability: number;
    hotLeads: number;
    riskAlerts: number;
    avgEngagement: number;
    campaignPerformance: number;
};

export type IntelligenceKpiDefinition = {
    key: keyof IntelligenceKpiSummary;
    title: string;
    suffix: string;
    sublabel?: string;
    icon: ComponentType<{ size?: number; className?: string }>;
    accent: IntelligenceKpiAccent;
};

/** Single config used on both intelligence dashboards. */
export const INTELLIGENCE_KPI_DEFINITIONS: IntelligenceKpiDefinition[] = [
    { key: 'avgScore', title: 'Average Lead Score', suffix: '%', icon: LuGauge, accent: 'blue' },
    { key: 'avgProbability', title: 'Conversion Probability', suffix: '%', icon: LuTrendingUp, accent: 'green' },
    { key: 'hotLeads', title: 'Hot Leads Count', suffix: '', icon: LuFlame, accent: 'orange' },
    { key: 'riskAlerts', title: 'Follow-up Risk Alerts', suffix: '', icon: LuHeartPulse, accent: 'red' },
    { key: 'avgEngagement', title: 'Engagement Score', suffix: '%', icon: LuTarget, accent: 'violet' },
    {
        key: 'campaignPerformance',
        title: 'Campaign Performance',
        suffix: '%',
        sublabel: 'Ads + campaigns share',
        icon: LuMegaphone,
        accent: 'blue',
    },
];
