'use client';

import React from 'react';
import { LuEye, LuFileText, LuShieldCheck, LuSparkles } from 'react-icons/lu';
import { LeadsIntelAiPanel, LeadsIntelAiSectionHeader } from '@/components/leads-intelligence/leadsIntelligenceUi';
import { DemandClickableCard, DemandClickableLink } from '@/components/demand-intelligence/DemandClickableLink';
import type {
    VendorCategoryPerformance,
    VendorComplianceForecastPeriod,
    VendorComplianceHealthSnapshot,
    VendorComplianceRecommendedAction,
    VendorComplianceRecord,
    VendorExpiryRow,
    VendorHighRiskRow,
    VendorKycProfile,
    VendorRiskFactor,
    VendorValidationFinding,
} from '@/lib/vendorComplianceIntelligenceStore';
import {
    complianceStatusClass,
    docStatusClass,
    impactClass,
    kycStatusClass,
    priorityClass,
    riskScoreLabel,
    riskScoreTone,
} from '@/lib/vendorComplianceIntelligenceHelpers';
import {
    getVendorComplianceDetailHref,
    getVendorKycHref,
    VENDOR_COMPLIANCE_SECTION_IDS,
} from '@/lib/vendorComplianceIntelligenceRoutes';
import { cn } from '@/lib/utils';

const th = 'px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500';
const td = 'px-4 py-3 text-sm text-slate-800';

function TableActionBtn({
    label,
    icon: Icon,
    onClick,
}: {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
            title={label}
        >
            <Icon size={12} aria-hidden />
            {label}
        </button>
    );
}

export function VendorComplianceHealthOverview({ snapshot }: { snapshot: VendorComplianceHealthSnapshot }) {
    const cards = [
        { label: 'Fully compliant', value: snapshot.fullyCompliant, tone: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
        { label: 'Pending verification', value: snapshot.pendingVerification, tone: 'border-amber-200 bg-amber-50 text-amber-900' },
        { label: 'Missing documents', value: snapshot.missingDocuments, tone: 'border-rose-200 bg-rose-50 text-rose-900' },
        { label: 'Expiring soon', value: snapshot.expiringSoon, tone: 'border-amber-200 bg-amber-50 text-amber-900' },
        { label: 'High risk vendors', value: snapshot.highRiskVendors, tone: 'border-rose-200 bg-rose-50 text-rose-900' },
        { label: 'Blocked vendors', value: snapshot.blockedVendors, tone: 'border-slate-200 bg-slate-50 text-slate-800' },
    ];

    return (
        <div id={VENDOR_COMPLIANCE_SECTION_IDS.health} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="emerald" aria-label="Compliance health overview">
                <LeadsIntelAiSectionHeader
                    title="Compliance Health Overview"
                    subtitle="Portfolio compliance posture — verified, pending, missing, and blocked vendors."
                    variant="emerald"
                />
                <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-6">
                    {cards.map((c) => (
                        <div key={c.label} className={cn('rounded-xl border p-3', c.tone)}>
                            <p className="text-[10px] font-bold uppercase tracking-wide opacity-85">{c.label}</p>
                            <p className="mt-1 text-xl font-bold tabular-nums">{c.value.toLocaleString('en-IN')}</p>
                        </div>
                    ))}
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function VendorRegistrySection({ vendors }: { vendors: VendorComplianceRecord[] }) {
    return (
        <div id={VENDOR_COMPLIANCE_SECTION_IDS.registry} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="indigo" aria-label="Vendor registry intelligence">
                <LeadsIntelAiSectionHeader
                    title="Vendor Registry Intelligence"
                    subtitle="Operational vendor registry — compliance status, KYC, licenses, and verification dates."
                    variant="indigo"
                />
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-indigo-100/80 bg-indigo-50/50">
                                <th className={th}>Vendor name</th>
                                <th className={th}>Category</th>
                                <th className={th}>Compliance status</th>
                                <th className={th}>Risk score</th>
                                <th className={th}>KYC status</th>
                                <th className={th}>Insurance</th>
                                <th className={th}>License</th>
                                <th className={th}>Last verified</th>
                                <th className={th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No vendors match filters.
                                    </td>
                                </tr>
                            ) : (
                                vendors.map((row, i) => {
                                    const href = getVendorComplianceDetailHref(row.slug);
                                    return (
                                        <tr key={row.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                            <td className={cn(td, 'font-semibold')}>
                                                <DemandClickableLink href={href}>{row.name}</DemandClickableLink>
                                            </td>
                                            <td className={cn(td, 'text-xs')}>{row.category}</td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold', complianceStatusClass(row.complianceStatus))}>
                                                    {row.complianceStatus}
                                                </span>
                                            </td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums', riskScoreTone(row.riskScore))}>
                                                    {row.riskScore}
                                                </span>
                                            </td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold', kycStatusClass(row.kycStatus))}>
                                                    {row.kycStatus}
                                                </span>
                                            </td>
                                            <td className={td}>
                                                <span className={cn('text-xs font-semibold', docStatusClass(row.insuranceStatus))}>
                                                    {row.insuranceStatus}
                                                </span>
                                            </td>
                                            <td className={td}>
                                                <span className={cn('text-xs font-semibold', docStatusClass(row.licenseStatus))}>
                                                    {row.licenseStatus}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'tabular-nums text-xs')}>{row.lastVerified}</td>
                                            <td className={td}>
                                                <div className="flex flex-wrap gap-1">
                                                    <TableActionBtn label="View" icon={LuEye} onClick={() => href && (window.location.href = href)} />
                                                    <TableActionBtn label="Verify" icon={LuShieldCheck} onClick={() => window.alert(`Verify: ${row.name}`)} />
                                                    <TableActionBtn label="Request docs" icon={LuFileText} onClick={() => window.alert(`Request documents: ${row.name}`)} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function KycVerificationCenter({ profile }: { profile: VendorKycProfile }) {
    const profileFields = [
        { label: 'Vendor name', value: profile.vendorName },
        { label: 'GST number', value: profile.gstNumber },
        { label: 'PAN number', value: profile.panNumber },
        { label: 'Address', value: profile.address },
        { label: 'Contact person', value: profile.contactPerson },
        { label: 'Phone', value: profile.phone },
        { label: 'Email', value: profile.email },
        { label: 'Registration date', value: profile.registrationDate },
        { label: 'Vendor category', value: profile.category },
    ];

    return (
        <div id={VENDOR_COMPLIANCE_SECTION_IDS.kyc} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="violet" aria-label="KYC verification center">
                <LeadsIntelAiSectionHeader
                    title="KYC Verification Center"
                    subtitle="Vendor profile, compliance documents, and verification status."
                    variant="violet"
                />
                <div className="grid gap-4 p-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-violet-100 bg-violet-50/30 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Vendor profile</p>
                        <dl className="mt-3 space-y-2">
                            {profileFields.map((f) => (
                                <div key={f.label} className="grid grid-cols-[120px_1fr] gap-2 text-xs">
                                    <dt className="font-medium text-slate-500">{f.label}</dt>
                                    <dd className="font-semibold text-slate-800">{f.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Compliance documents</p>
                        <ul className="mt-3 space-y-2">
                            {profile.documents.map((doc) => (
                                <li key={doc.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs">
                                    <span className="font-semibold text-slate-800">{doc.name}</span>
                                    <span className={cn('font-bold', docStatusClass(doc.status))}>{doc.status}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function AiValidationResults({ findings }: { findings: VendorValidationFinding[] }) {
    const statusTone = (status: VendorValidationFinding['status']) => {
        if (status === 'pass') return 'border-emerald-200 bg-emerald-50/60 text-emerald-900';
        if (status === 'warn') return 'border-amber-200 bg-amber-50/60 text-amber-900';
        return 'border-rose-200 bg-rose-50/60 text-rose-900';
    };

    return (
        <div id={VENDOR_COMPLIANCE_SECTION_IDS.validation} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="cyan" aria-label="AI validation results">
                <LeadsIntelAiSectionHeader
                    title="AI Validation Results"
                    subtitle="Automated GST, PAN, insurance, license, and MSME verification."
                    variant="cyan"
                />
                <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    {findings.map((f) => (
                        <div key={f.id} className={cn('rounded-xl border p-3', statusTone(f.status))}>
                            <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">{f.label}</p>
                            <p className="mt-1 text-sm font-semibold">{f.detail}</p>
                        </div>
                    ))}
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function VendorRiskCenter({
    riskScore,
    riskFactors,
    highRiskVendors,
}: {
    riskScore: number;
    riskFactors: VendorRiskFactor[];
    highRiskVendors: VendorHighRiskRow[];
}) {
    return (
        <div id={VENDOR_COMPLIANCE_SECTION_IDS.risk} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="rose" aria-label="Vendor risk center">
                <LeadsIntelAiSectionHeader
                    title="Vendor Risk Center"
                    subtitle="Risk scoring, contributing factors, and high-risk vendor actions."
                    variant="rose"
                />
                <div className="grid gap-4 p-4 lg:grid-cols-[240px_1fr]">
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Vendor risk score</p>
                        <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                            {riskScore} <span className="text-lg text-slate-500">/ 100</span>
                        </p>
                        <span className={cn('mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold', riskScoreTone(riskScore))}>
                            {riskScoreLabel(riskScore)}
                        </span>
                    </div>
                    <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Risk factors</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {riskFactors.map((f) => (
                                <div key={f.id} className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/40 px-3 py-2 text-xs">
                                    <span className="font-semibold text-slate-800">{f.label}</span>
                                    <span className="font-bold tabular-nums text-rose-800">{f.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto border-t border-slate-100">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-rose-100 bg-rose-50/50">
                                <th className={th}>Vendor</th>
                                <th className={th}>Category</th>
                                <th className={th}>Risk score</th>
                                <th className={th}>Primary risk</th>
                                <th className={th}>Recommended action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {highRiskVendors.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No high-risk vendors in this view.
                                    </td>
                                </tr>
                            ) : (
                                highRiskVendors.map((row, i) => {
                                    const href = getVendorComplianceDetailHref(row.vendorSlug);
                                    return (
                                        <tr key={row.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                            <td className={cn(td, 'font-semibold')}>
                                                <DemandClickableLink href={href}>{row.vendorName}</DemandClickableLink>
                                            </td>
                                            <td className={cn(td, 'text-xs')}>{row.category}</td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums', riskScoreTone(row.riskScore))}>
                                                    {row.riskScore}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'text-xs')}>{row.primaryRisk}</td>
                                            <td className={cn(td, 'text-xs font-semibold text-rose-800')}>{row.recommendedAction}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function ExpiryCenter({
    counts,
    expiries,
}: {
    counts: { expiring30: number; expiring60: number; expiring90: number; alreadyExpired: number };
    expiries: VendorExpiryRow[];
}) {
    const countCards = [
        { label: 'Expiring in 30 days', value: counts.expiring30, tone: 'border-rose-200 bg-rose-50 text-rose-900' },
        { label: 'Expiring in 60 days', value: counts.expiring60, tone: 'border-amber-200 bg-amber-50 text-amber-900' },
        { label: 'Expiring in 90 days', value: counts.expiring90, tone: 'border-amber-200 bg-amber-50 text-amber-900' },
        { label: 'Already expired', value: counts.alreadyExpired, tone: 'border-slate-200 bg-slate-50 text-slate-800' },
    ];

    return (
        <div id={VENDOR_COMPLIANCE_SECTION_IDS.expiry} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="amber" aria-label="Expiry center">
                <LeadsIntelAiSectionHeader
                    title="Expiry Center"
                    subtitle="Document expiry tracking — renewals, updates, and vendor suspensions."
                    variant="amber"
                />
                <div className="grid grid-cols-2 gap-2 p-4 lg:grid-cols-4">
                    {countCards.map((c) => (
                        <div key={c.label} className={cn('rounded-xl border p-3', c.tone)}>
                            <p className="text-[10px] font-bold uppercase tracking-wide opacity-85">{c.label}</p>
                            <p className="mt-1 text-xl font-bold tabular-nums">{c.value}</p>
                        </div>
                    ))}
                </div>
                <div className="overflow-x-auto border-t border-slate-100">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-amber-100 bg-amber-50/50">
                                <th className={th}>Vendor</th>
                                <th className={th}>Document type</th>
                                <th className={th}>Expiry date</th>
                                <th className={th}>Days remaining</th>
                                <th className={th}>Priority</th>
                                <th className={th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expiries.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No expiries in this view.
                                    </td>
                                </tr>
                            ) : (
                                expiries.map((row, i) => {
                                    const href = getVendorComplianceDetailHref(row.vendorSlug);
                                    return (
                                        <tr key={row.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                            <td className={cn(td, 'font-semibold')}>
                                                <DemandClickableLink href={href}>{row.vendorName}</DemandClickableLink>
                                            </td>
                                            <td className={cn(td, 'text-xs')}>{row.documentType}</td>
                                            <td className={cn(td, 'tabular-nums text-xs')}>{row.expiryDate}</td>
                                            <td className={cn(td, 'tabular-nums font-bold', row.daysRemaining < 0 ? 'text-rose-700' : 'text-slate-800')}>
                                                {row.daysRemaining < 0 ? `${Math.abs(row.daysRemaining)} days ago` : `${row.daysRemaining} days`}
                                            </td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold', priorityClass(row.priority))}>
                                                    {row.priority}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'text-xs font-semibold text-amber-800')}>{row.suggestedAction}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function VendorComplianceRecommendedActions({ actions }: { actions: VendorComplianceRecommendedAction[] }) {
    return (
        <div id={VENDOR_COMPLIANCE_SECTION_IDS.actions} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="amber" aria-label="AI recommended actions">
                <LeadsIntelAiSectionHeader
                    title="AI Recommended Actions"
                    subtitle="Compliance steps ranked by impact, urgency, and AI confidence."
                    variant="amber"
                    badge="Do today"
                />
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                    {actions.length === 0 ? (
                        <p className="col-span-2 px-4 py-8 text-center text-sm text-slate-500">No actions in this view.</p>
                    ) : (
                        actions.map((a) => {
                            const href = getVendorComplianceDetailHref(a.vendorSlug);
                            return (
                                <DemandClickableCard
                                    key={a.id}
                                    href={href}
                                    className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/60 to-white p-4"
                                >
                                    <p className="text-sm font-bold text-slate-900">{a.title}</p>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                        <span className={cn('rounded-lg border px-2 py-1 font-semibold', impactClass(a.impact))}>
                                            Impact: {a.impact}
                                        </span>
                                        <span className={cn('rounded-lg border px-2 py-1 font-semibold', priorityClass(a.priority))}>
                                            Priority: {a.priority}
                                        </span>
                                        <span className="rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 font-semibold text-violet-800">
                                            Confidence: {a.confidence}%
                                        </span>
                                    </div>
                                    {href ? <p className="mt-2 text-[10px] font-semibold text-violet-700">Open vendor →</p> : null}
                                </DemandClickableCard>
                            );
                        })
                    )}
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function VendorComplianceForecastCards({ periods }: { periods: VendorComplianceForecastPeriod[] }) {
    return (
        <div id={VENDOR_COMPLIANCE_SECTION_IDS.forecast} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="indigo" aria-label="Compliance forecast">
                <LeadsIntelAiSectionHeader
                    title="Compliance Forecast"
                    subtitle="Expected verifications, expirations, renewals, and compliance load."
                    variant="indigo"
                />
                <div className="grid gap-3 p-4 md:grid-cols-3">
                    {periods.map((f) => (
                        <DemandClickableCard
                            key={f.id}
                            href={`#${VENDOR_COMPLIANCE_SECTION_IDS.insightsTable}`}
                            className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4"
                        >
                            <p className="text-sm font-bold text-indigo-900">{f.label}</p>
                            <ul className="mt-3 space-y-2 text-xs text-slate-700">
                                {f.expectedVerifications != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Expected verifications</span>
                                        <p className="text-lg font-bold tabular-nums text-slate-900">{f.expectedVerifications}</p>
                                    </li>
                                ) : null}
                                {f.upcomingExpirations != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Upcoming expirations</span>
                                        <p className="text-lg font-bold tabular-nums text-slate-900">{f.upcomingExpirations}</p>
                                    </li>
                                ) : null}
                                {f.complianceReviews != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Compliance reviews</span>
                                        <p className="text-lg font-bold tabular-nums text-slate-900">{f.complianceReviews}</p>
                                    </li>
                                ) : null}
                                {f.renewalsDue != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Renewals due</span>
                                        <p className="font-bold tabular-nums">{f.renewalsDue}</p>
                                    </li>
                                ) : null}
                                {f.vendorReviews != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Vendor reviews</span>
                                        <p className="font-bold tabular-nums">{f.vendorReviews}</p>
                                    </li>
                                ) : null}
                                {f.complianceAudits != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Compliance audits</span>
                                        <p className="font-bold tabular-nums">{f.complianceAudits}</p>
                                    </li>
                                ) : null}
                                {f.vendorGrowth != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Vendor growth</span>
                                        <p className="font-bold tabular-nums">{f.vendorGrowth}</p>
                                    </li>
                                ) : null}
                                {f.complianceLoad != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Compliance load</span>
                                        <p className="font-bold tabular-nums">{f.complianceLoad}</p>
                                    </li>
                                ) : null}
                                <li>
                                    <span className="font-bold uppercase tracking-wide text-slate-500">Risk trend</span>
                                    <p className="font-medium text-slate-800">{f.riskTrend}</p>
                                </li>
                            </ul>
                        </DemandClickableCard>
                    ))}
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function CompliancePerformanceByCategory({ categories }: { categories: VendorCategoryPerformance[] }) {
    return (
        <div id={VENDOR_COMPLIANCE_SECTION_IDS.category} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="cyan" aria-label="Compliance performance by category">
                <LeadsIntelAiSectionHeader
                    title="Compliance Performance by Category"
                    subtitle="Vendor count, compliance rate, risk exposure, and expiring documents per trade."
                    variant="cyan"
                />
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map((cat) => (
                        <DemandClickableCard
                            key={cat.id}
                            href={`#${VENDOR_COMPLIANCE_SECTION_IDS.registry}`}
                            className="rounded-xl border border-cyan-100 bg-cyan-50/30 p-4"
                        >
                            <p className="text-sm font-bold text-cyan-900">{cat.category} vendors</p>
                            <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
                                <li>
                                    Vendor count: <span className="font-bold tabular-nums">{cat.vendorCount}</span>
                                </li>
                                <li>
                                    Compliance: <span className="font-bold tabular-nums text-emerald-700">{cat.compliancePercent}%</span>
                                </li>
                                <li>
                                    Risk: <span className="font-bold tabular-nums text-rose-700">{cat.riskPercent}%</span>
                                </li>
                                <li>
                                    Expiring docs: <span className="font-bold tabular-nums">{cat.expiringDocuments}</span>
                                </li>
                            </ul>
                        </DemandClickableCard>
                    ))}
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function VendorComplianceInsightsTable({ vendors }: { vendors: VendorComplianceRecord[] }) {
    return (
        <div id={VENDOR_COMPLIANCE_SECTION_IDS.insightsTable} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="violet" aria-label="Vendor compliance intelligence table">
                <LeadsIntelAiSectionHeader
                    title="Vendor Compliance Intelligence"
                    subtitle="Single management view — compliance %, risk, documents, KYC, and recommended actions."
                    variant="violet"
                />
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-violet-100/80 bg-violet-50/50">
                                <th className={th}>Vendor name</th>
                                <th className={th}>Category</th>
                                <th className={th}>Compliance %</th>
                                <th className={th}>Risk score</th>
                                <th className={th}>Missing docs</th>
                                <th className={th}>Expiring docs</th>
                                <th className={th}>KYC status</th>
                                <th className={th}>Last verification</th>
                                <th className={th}>Recommended action</th>
                                <th className={th}>Priority</th>
                                <th className={th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No vendors match filters.
                                    </td>
                                </tr>
                            ) : (
                                vendors.map((v, i) => {
                                    const href = getVendorComplianceDetailHref(v.slug);
                                    return (
                                        <tr key={v.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                            <td className={cn(td, 'font-semibold')}>
                                                <DemandClickableLink href={href} showArrow>
                                                    {v.name}
                                                </DemandClickableLink>
                                            </td>
                                            <td className={cn(td, 'text-xs')}>{v.category}</td>
                                            <td className={cn(td, 'tabular-nums font-bold')}>{v.compliancePercent}%</td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums', riskScoreTone(v.riskScore))}>
                                                    {v.riskScore}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'tabular-nums')}>{v.missingDocuments}</td>
                                            <td className={cn(td, 'tabular-nums')}>{v.expiringDocuments}</td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold', kycStatusClass(v.kycStatus))}>
                                                    {v.kycStatus}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'text-xs tabular-nums')}>{v.lastVerified}</td>
                                            <td className={cn(td, 'max-w-[160px] text-xs font-semibold text-violet-900')}>{v.recommendedAction}</td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold', priorityClass(v.priority))}>
                                                    {v.priority}
                                                </span>
                                            </td>
                                            <td className={td}>
                                                <div className="flex flex-wrap gap-1">
                                                    <TableActionBtn label="View" icon={LuEye} onClick={() => href && (window.location.href = href)} />
                                                    <TableActionBtn label="Verify" icon={LuShieldCheck} onClick={() => window.alert(`Verify: ${v.name}`)} />
                                                    <TableActionBtn
                                                        label="KYC"
                                                        icon={LuSparkles}
                                                        onClick={() => {
                                                            const kyc = getVendorKycHref(v.slug);
                                                            if (kyc) window.location.href = kyc;
                                                        }}
                                                    />
                                                    <TableActionBtn label="Request docs" icon={LuFileText} onClick={() => window.alert(`Request documents: ${v.name}`)} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}
