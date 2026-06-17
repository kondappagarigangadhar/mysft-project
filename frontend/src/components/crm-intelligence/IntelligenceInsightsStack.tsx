'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export type InsightAccent = 'amber' | 'red' | 'emerald' | 'blue';

export type IntelligenceInsightItem = {
    id: string;
    /** When set, row is a Next.js link (keyboard + SEO friendly). */
    href?: string;
    content: React.ReactNode;
};

export type IntelligenceInsightSection = {
    id: string;
    title: string;
    accent: InsightAccent;
    emptyText: string;
    items: IntelligenceInsightItem[];
    /** Use <ul> for the last section (suggested actions). */
    asList?: boolean;
};

/** Full-card tint + subtle border (matches Leads Intelligence compact insight cards). */
const surfaceMap: Record<InsightAccent, string> = {
    amber: 'border border-amber-100 bg-amber-50',
    red: 'border border-red-100 bg-red-50',
    emerald: 'border border-emerald-100 bg-emerald-50',
    blue: 'border border-blue-100 bg-blue-50',
};

const rowLinkClass =
    'block cursor-pointer rounded-md px-1 -mx-1 py-0.5 text-left transition-colors hover:bg-black/[0.04] hover:underline hover:decoration-slate-400 hover:underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25';

function InsightRow({ href, content, lineClass }: { href?: string; content: React.ReactNode; lineClass: string }) {
    if (href) {
        return (
            <Link href={href} className={cn(lineClass, rowLinkClass)}>
                {content}
            </Link>
        );
    }
    return <div className={lineClass}>{content}</div>;
}

export function IntelligenceInsightsStack({
    sections,
    compact = false,
    className,
}: {
    sections: IntelligenceInsightSection[];
    /** Leads Intelligence: 2×2 grid next to KPIs. Demand: vertical stack. */
    compact?: boolean;
    className?: string;
}) {
    const stackGap = compact ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-4';
    const cardBase = 'rounded-2xl shadow-sm';
    const contentPad = 'p-4';
    const titleClass = 'text-sm font-bold text-slate-800';
    const bodyClass = compact ? 'mt-2.5 space-y-1.5' : 'mt-2.5 space-y-1.5';
    const lineClass = 'text-xs text-slate-600 leading-snug';
    const listClass = compact ? 'mt-2.5 space-y-1.5 text-xs text-slate-600 leading-snug' : 'mt-2.5 space-y-1.5 text-xs text-slate-600';

    return (
        <div className={cn(stackGap, className)}>
            {sections.map((section) => {
                const surface = surfaceMap[section.accent];
                return (
                    <Card key={section.id} className={cn(cardBase, surface)} contentClassName={contentPad}>
                        <h3 className={titleClass}>{section.title}</h3>
                        {section.asList ? (
                            <ul className={listClass}>
                                {section.items.length === 0 ? (
                                    <li className={lineClass}>{section.emptyText}</li>
                                ) : (
                                    section.items.map((item) => (
                                        <li key={item.id}>
                                            {item.href ? (
                                                <Link href={item.href} className={cn(lineClass, rowLinkClass, '-ml-1 inline-block w-full')}>
                                                    {item.content}
                                                </Link>
                                            ) : (
                                                <span className={lineClass}>{item.content}</span>
                                            )}
                                        </li>
                                    ))
                                )}
                            </ul>
                        ) : (
                            <div className={bodyClass}>
                                {section.items.length === 0 ? (
                                    <p className={lineClass}>{section.emptyText}</p>
                                ) : (
                                    section.items.map((item) => (
                                        <InsightRow key={item.id} href={item.href} content={item.content} lineClass={lineClass} />
                                    ))
                                )}
                            </div>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}
