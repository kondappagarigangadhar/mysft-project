'use client';

import React from 'react';
import type { IntelligenceLead } from '@/lib/leadsIntelligenceStore';
import { getRecommendedActionLabel, formatRevenueLakhs, getLeadRevenuePotentialLakhs, isLeadLeakage } from '@/lib/leadsIntelligenceHelpers';
import { leadProfileHref } from '@/lib/leadRoutes';
import type { IntelligenceInsightSection } from './IntelligenceInsightsStack';

export function buildLeadsIntelligenceInsightSections(leads: IntelligenceLead[]): IntelligenceInsightSection[] {
    const closers = [...leads]
        .filter((l) => l.conversionProbability >= 70 && l.status !== 'Converted' && l.status !== 'Lost')
        .sort((a, b) => b.conversionProbability - a.conversionProbability)
        .slice(0, 5);
    const leakage = [...leads].filter(isLeadLeakage).slice(0, 5);
    const hotLeads = [...leads]
        .filter((l) => l.temperature === 'Hot' && l.status !== 'Converted' && l.status !== 'Lost')
        .sort((a, b) => b.leadScore - a.leadScore)
        .slice(0, 5);
    const actions = [...leads]
        .filter((l) => l.status !== 'Converted' && l.status !== 'Lost')
        .sort((a, b) => b.conversionProbability - a.conversionProbability)
        .slice(0, 4);

    return [
        {
            id: 'closers',
            title: 'Potential closures this week',
            accent: 'emerald',
            emptyText: 'No high-probability closes in current filter.',
            items: closers.map((lead) => ({
                id: lead.id,
                href: leadProfileHref(lead.leadSlug),
                content: (
                    <>
                        <span className="font-semibold text-slate-800">{lead.name}</span> — {lead.conversionProbability}% ·{' '}
                        {formatRevenueLakhs(getLeadRevenuePotentialLakhs(lead))}
                    </>
                ),
            })),
        },
        {
            id: 'leakage',
            title: 'Lead leakage alerts',
            accent: 'red',
            emptyText: 'No leakage in current filter.',
            items: leakage.map((lead) => ({
                id: lead.id,
                href: leadProfileHref(lead.leadSlug),
                content: (
                    <>
                        {lead.name} — <span className="font-semibold text-red-600">Follow up today</span>
                    </>
                ),
            })),
        },
        {
            id: 'hot',
            title: 'Hot leads (lead scoring)',
            accent: 'amber',
            emptyText: 'No hot leads in current filter.',
            items: hotLeads.map((lead) => ({
                id: lead.id,
                href: leadProfileHref(lead.leadSlug),
                content: (
                    <>
                        <span className="font-semibold text-slate-800">{lead.name}</span> — Score {lead.leadScore} · {lead.temperature}
                    </>
                ),
            })),
        },
        {
            id: 'nba',
            title: 'AI recommended actions',
            accent: 'blue',
            emptyText: 'No actions.',
            asList: true,
            items: actions.map((lead) => ({
                id: lead.id,
                href: leadProfileHref(lead.leadSlug),
                content: (
                    <>
                        {getRecommendedActionLabel(lead)} — {lead.name}
                    </>
                ),
            })),
        },
    ];
}
