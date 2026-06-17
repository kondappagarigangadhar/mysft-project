'use client';

import React from 'react';
import { LuChevronRight, LuTriangleAlert } from 'react-icons/lu';
import { DemandClickableLink } from '@/components/demand-intelligence/DemandClickableLink';
import type { InvoiceAttentionItem } from '@/lib/invoiceIntelligenceStore';
import { getInvoiceIntelDetailHref } from '@/lib/invoiceIntelligenceRoutes';
import { INVOICE_INTEL_SECTION_IDS } from '@/lib/invoiceIntelligenceRoutes';
import { cn } from '@/lib/utils';

export function InvoiceAttentionToday({ items }: { items: InvoiceAttentionItem[] }) {
    if (items.length === 0) return null;

    return (
        <section
            id={INVOICE_INTEL_SECTION_IDS.attention}
            aria-label="Finance attention required"
            className="scroll-mt-24 overflow-hidden rounded-2xl border-2 border-rose-300/80 bg-gradient-to-br from-rose-50 via-white to-amber-50/80 shadow-md ring-1 ring-rose-200/60"
        >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200/80 bg-rose-100/60 px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-white shadow-sm">
                        <LuTriangleAlert size={18} aria-hidden />
                    </span>
                    <div>
                        <h2 className="text-sm font-bold text-rose-950">Finance Attention Required</h2>
                        <p className="text-xs text-rose-800/90">Critical invoice validation, duplicate, and payment issues only.</p>
                    </div>
                </div>
                <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {items.length} item{items.length === 1 ? '' : 's'}
                </span>
            </div>
            <ul className="divide-y divide-rose-100/90">
                {items.map((item) => {
                    const critical = item.severity === 'critical';
                    const href = getInvoiceIntelDetailHref(item.invoiceSlug);
                    const inner = (
                        <>
                            <div className="min-w-0">
                                <span
                                    className={cn(
                                        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                                        critical ? 'bg-rose-600 text-white' : 'bg-amber-500 text-amber-950',
                                    )}
                                >
                                    {item.headline}
                                </span>
                                {item.invoiceNumber ? (
                                    <p className="mt-1.5 text-sm font-bold text-slate-900">Invoice: {item.invoiceNumber}</p>
                                ) : null}
                                {item.vendor ? (
                                    <p className="text-xs text-slate-600">
                                        Vendor: <span className="font-semibold text-violet-800">{item.vendor}</span>
                                    </p>
                                ) : null}
                                {item.detail ? <p className="text-xs text-slate-600">{item.detail}</p> : null}
                                {item.metricLabel && item.metricValue ? (
                                    <p className="mt-1 text-xs font-semibold text-slate-800">
                                        {item.metricLabel}:{' '}
                                        <span className="tabular-nums text-rose-700">{item.metricValue}</span>
                                    </p>
                                ) : null}
                            </div>
                            <div className="rounded-lg border border-white/80 bg-white px-3 py-2 shadow-sm sm:max-w-[240px]">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Action</p>
                                <p className="mt-0.5 text-sm font-semibold text-slate-900">{item.recommendedAction}</p>
                            </div>
                            {href ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
                                    View invoice
                                    <LuChevronRight size={14} aria-hidden />
                                </span>
                            ) : null}
                        </>
                    );

                    return (
                        <li key={item.id}>
                            {href ? (
                                <DemandClickableLink
                                    href={href}
                                    block
                                    className={cn(
                                        'grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center',
                                        critical ? 'bg-rose-50/80 hover:bg-rose-100/50' : 'bg-amber-50/40 hover:bg-amber-50/70',
                                    )}
                                >
                                    {inner}
                                </DemandClickableLink>
                            ) : (
                                <div
                                    className={cn(
                                        'grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center',
                                        critical ? 'bg-rose-50/80' : 'bg-amber-50/40',
                                    )}
                                >
                                    {inner}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
