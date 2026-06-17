'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { IntelligenceRecordDetailShell } from '@/components/intelligence/IntelligenceRecordDetailShell';
import { riskClassMap, temperatureClassMap } from '@/lib/leadsIntelligenceHelpers';
import { leadProfileHref } from '@/lib/leadRoutes';
import { cn } from '@/lib/utils';
import { CTA_FLOW_LINK, CTA_FOCUS_VISIBLE_RING } from '@/lib/theme/ctaThemeClasses';
import type { IntelligenceLead } from '@/lib/leadsIntelligenceStore';
import { LuHistory, LuLayoutDashboard, LuSparkles } from 'react-icons/lu';

type IntelTab = 'overview' | 'ai' | 'activity';

/** Full-page intelligence lead detail — layout aligned with booking detail view. */
export function LeadIntelligenceDetailView({
    lead,
    listHref,
    listLabel,
    editHref,
    /** When false, the shell does not render edit (use a page-level edit control instead). */
    editInShell = true,
}: {
    lead: IntelligenceLead;
    listHref: string;
    listLabel: string;
    editHref: string;
    editInShell?: boolean;
}) {
    const [tab, setTab] = useState<IntelTab>('overview');

    const tabs = (
        <div className="flex gap-2 overflow-x-auto pb-2">
            {(
                [
                    { k: 'overview' as const, label: 'Overview', icon: LuLayoutDashboard },
                    { k: 'ai' as const, label: 'AI & insights', icon: LuSparkles },
                    { k: 'activity' as const, label: 'Activity & notes', icon: LuHistory },
                ] as const
            ).map((t) => (
                <button
                    key={t.k}
                    type="button"
                    onClick={() => setTab(t.k)}
                    className={cn(
                        'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                        CTA_FOCUS_VISIBLE_RING,
                        tab === t.k
                            ? 'border-[var(--cta-button-bg)] bg-[var(--cta-button-bg)] text-[var(--cta-button-text)]'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)]',
                    )}
                >
                    <t.icon size={14} aria-hidden />
                    {t.label}
                </button>
            ))}
        </div>
    );

    return (
        <IntelligenceRecordDetailShell
            listHref={listHref}
            listLabel={listLabel}
            title={lead.name}
            recordId={lead.id}
            recordIdLabel="Intelligence ID"
            editHref={editInShell ? editHref : undefined}
            editLabel={editInShell ? 'Edit intelligence record' : undefined}
            tabStrip={tabs}
            footerExtra={
                <Link
                    href={leadProfileHref(lead.leadSlug)}
                    className="inline-flex h-[42px] min-h-[42px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                    Open full CRM profile
                </Link>
            }
        >
            {tab === 'overview' && (
                <div className="space-y-4">
                    <dl className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                        <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Lead name</dt>
                            <dd className="text-right font-semibold text-slate-900">{lead.name}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Phone</dt>
                            <dd>
                                <a href={`tel:${lead.phone}`} className={cn('font-mono font-medium', CTA_FLOW_LINK)}>
                                    {lead.phone}
                                </a>
                            </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Email</dt>
                            <dd className="max-w-[min(100%,14rem)] break-all text-right">
                                <a href={`mailto:${lead.email}`} className={cn('font-medium', CTA_FLOW_LINK)}>
                                    {lead.email}
                                </a>
                            </dd>
                        </div>
                        <div className="border-t border-slate-100 pt-2">
                            <dt className="text-slate-500">Present address</dt>
                            <dd className="mt-1 text-left text-sm font-medium leading-relaxed text-slate-900">
                                {lead.presentAddress?.trim() ? (
                                    <span className="block whitespace-pre-wrap">{lead.presentAddress.trim()}</span>
                                ) : (
                                    <span className="text-slate-400">—</span>
                                )}
                            </dd>
                        </div>
                        <div className="border-t border-slate-100 pt-2">
                            <dt className="text-slate-500">Permanent address</dt>
                            <dd className="mt-1 text-left text-sm font-medium leading-relaxed text-slate-900">
                                {lead.permanentAddress?.trim() ? (
                                    <span className="block whitespace-pre-wrap">{lead.permanentAddress.trim()}</span>
                                ) : (
                                    <span className="text-slate-400">—</span>
                                )}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Source</dt>
                            <dd className="text-right font-medium text-slate-900">{lead.source}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Assigned to</dt>
                            <dd className="text-right font-medium text-slate-900">{lead.assignedTo}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Created</dt>
                            <dd className="text-right font-medium tabular-nums text-slate-900">{lead.createdAt}</dd>
                        </div>
                    </dl>
                </div>
            )}

            {tab === 'ai' && (
                <div className="space-y-4">
                    <dl className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                        <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Lead score</dt>
                            <dd className="font-bold tabular-nums text-slate-900">{lead.leadScore}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Conversion probability</dt>
                            <dd className="font-semibold tabular-nums text-slate-900">{lead.conversionProbability}%</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-slate-500">Engagement score</dt>
                            <dd className="font-semibold tabular-nums text-slate-900">{lead.engagementScore}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1">
                            <dt className="text-slate-500">Temperature</dt>
                            <dd>
                                <span
                                    className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${temperatureClassMap[lead.temperature]}`}
                                >
                                    {lead.temperature}
                                </span>
                            </dd>
                        </div>
                    </dl>
                    <div className="rounded-xl border border-slate-100 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Predictions</p>
                        <p className="mt-2 text-sm text-slate-700">
                            <span className="font-semibold text-slate-900">Next best action:</span> {lead.nextBestAction}
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                            <span className="font-semibold text-slate-900">Follow-up risk:</span>{' '}
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${riskClassMap[lead.followUpRisk]}`}>
                                {lead.followUpRisk}
                            </span>
                        </p>
                    </div>
                </div>
            )}

            {tab === 'activity' && (
                <div className="space-y-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Activity timeline</p>
                        <ul className="mt-3 space-y-2">
                            {lead.activity.map((item) => (
                                <li key={item.id} className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5">
                                    <p className="text-sm font-semibold text-slate-800">
                                        {item.type} · {item.date}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">{item.note}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{lead.notes || 'No notes provided.'}</p>
                    </div>
                </div>
            )}
        </IntelligenceRecordDetailShell>
    );
}
