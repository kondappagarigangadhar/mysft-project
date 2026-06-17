'use client';

import React from 'react';
import {
    LuBadgeCheck,
    LuCalendarClock,
    LuShieldAlert,
    LuSparkles,
    LuTriangleAlert,
    LuUsers,
} from 'react-icons/lu';
import { DemandClickableCard } from '@/components/demand-intelligence/DemandClickableLink';
import type { VendorComplianceExecutiveKpis } from '@/lib/vendorComplianceIntelligenceStore';
import { VENDOR_COMPLIANCE_SECTION_IDS } from '@/lib/vendorComplianceIntelligenceRoutes';
import { cn } from '@/lib/utils';

export function VendorComplianceExecutiveSummary({ executive }: { executive: VendorComplianceExecutiveKpis }) {
    const metrics = [
        {
            label: 'Active vendors',
            value: executive.activeVendors.toLocaleString('en-IN'),
            sub: 'Monitored',
            icon: LuUsers,
            tone: 'border-violet-200 bg-violet-50 text-violet-900',
            href: `#${VENDOR_COMPLIANCE_SECTION_IDS.registry}`,
        },
        {
            label: 'Compliant vendors',
            value: String(executive.compliantVendors),
            sub: 'Fully verified',
            icon: LuBadgeCheck,
            tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
            href: `#${VENDOR_COMPLIANCE_SECTION_IDS.health}`,
        },
        {
            label: 'Non-compliant',
            value: String(executive.nonCompliantVendors),
            sub: 'Action required',
            icon: LuShieldAlert,
            tone: 'border-rose-200 bg-rose-50 text-rose-900',
            href: `#${VENDOR_COMPLIANCE_SECTION_IDS.insightsTable}`,
        },
        {
            label: 'Expired documents',
            value: String(executive.expiredDocuments),
            sub: 'Critical',
            icon: LuTriangleAlert,
            tone: 'border-rose-200 bg-rose-50 text-rose-900',
            href: `#${VENDOR_COMPLIANCE_SECTION_IDS.expiry}`,
        },
        {
            label: 'Upcoming expirations',
            value: String(executive.upcomingExpirations),
            sub: 'Next 90 days',
            icon: LuCalendarClock,
            tone: 'border-amber-200 bg-amber-50 text-amber-900',
            href: `#${VENDOR_COMPLIANCE_SECTION_IDS.expiry}`,
        },
        {
            label: 'High risk vendors',
            value: String(executive.highRiskVendors),
            sub: 'Immediate review',
            icon: LuTriangleAlert,
            tone: 'border-rose-200 bg-rose-50 text-rose-900',
            href: `#${VENDOR_COMPLIANCE_SECTION_IDS.risk}`,
        },
    ] as const;

    return (
        <section
            aria-label="AI executive summary"
            className="overflow-hidden rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/90 via-white to-blue-50/80 p-5 shadow-md ring-1 ring-violet-100/80"
        >
            <div className="flex flex-wrap items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-sm">
                    <LuSparkles size={20} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">AI executive summary</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">
                        Vendor compliance snapshot — who is compliant, who is at risk, and what to do today
                    </p>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {metrics.map((m) => {
                    const Icon = m.icon;
                    return (
                        <DemandClickableCard key={m.label} href={m.href} className={cn('rounded-xl border p-3', m.tone)}>
                            <div className="flex items-center justify-between gap-1">
                                <p className="text-[10px] font-bold uppercase tracking-wide opacity-85">{m.label}</p>
                                <Icon size={14} aria-hidden className="opacity-70" />
                            </div>
                            <p className="mt-1 text-xl font-bold tabular-nums">{m.value}</p>
                            <p className="mt-0.5 text-[10px] font-medium opacity-75">{m.sub}</p>
                        </DemandClickableCard>
                    );
                })}
            </div>

            <div className="mt-4 rounded-xl border border-violet-100/90 bg-white/80 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">AI summary</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{executive.narrative}</p>
            </div>
        </section>
    );
}
