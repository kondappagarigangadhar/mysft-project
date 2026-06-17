'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
    LuArrowRight,
    LuDownload,
    LuEye,
    LuFileText,
    LuFileUp,
    LuGitCompare,
    LuSparkles,
    LuTriangleAlert,
} from 'react-icons/lu';
import { LeadsIntelAiPanel, LeadsIntelAiSectionHeader } from '@/components/leads-intelligence/leadsIntelligenceUi';
import { DemandClickableCard, DemandClickableLink } from '@/components/demand-intelligence/DemandClickableLink';
import type {
    ClauseLibraryItem,
    ContractComparisonHighlight,
    ContractExtractionSample,
    ContractForecastPeriod,
    ContractRecommendedAction,
    ContractRecord,
    ContractRenewalRow,
    ContractRepositorySnapshot,
} from '@/lib/contractIntelligenceStore';
import {
    buildUploadedContractReview,
    impactClass,
    priorityClass,
    riskLevelClass,
    riskScoreLabel,
    riskScoreTone,
    statusClass,
    type UploadedContractReview,
} from '@/lib/contractIntelligenceHelpers';
import {
    CONTRACT_SECTION_IDS,
    getContractCompareHref,
    getContractDetailHref,
    getContractReviewHref,
} from '@/lib/contractIntelligenceRoutes';
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

export function ContractRepositorySection({
    snapshot,
    contracts,
}: {
    snapshot: ContractRepositorySnapshot;
    contracts: ContractRecord[];
}) {
    const cards = [
        { label: 'Active contracts', value: snapshot.active, tone: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
        { label: 'Under review', value: snapshot.underReview, tone: 'border-violet-200 bg-violet-50 text-violet-900' },
        { label: 'Expiring soon', value: snapshot.expiringSoon, tone: 'border-amber-200 bg-amber-50 text-amber-900' },
        { label: 'Expired', value: snapshot.expired, tone: 'border-slate-200 bg-slate-50 text-slate-800' },
        { label: 'Recently uploaded', value: snapshot.recentlyUploaded, tone: 'border-cyan-200 bg-cyan-50 text-cyan-900' },
        { label: 'High risk', value: snapshot.highRisk, tone: 'border-rose-200 bg-rose-50 text-rose-900' },
    ];

    return (
        <div id={CONTRACT_SECTION_IDS.repository} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="indigo" aria-label="Contract repository snapshot">
                <LeadsIntelAiSectionHeader
                    title="Contract Repository Snapshot"
                    subtitle="Portfolio status — active, expiring, and high-risk agreements at a glance."
                    variant="indigo"
                />
                <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-6">
                    {cards.map((c) => (
                        <div key={c.label} className={cn('rounded-xl border p-3', c.tone)}>
                            <p className="text-[10px] font-bold uppercase tracking-wide opacity-85">{c.label}</p>
                            <p className="mt-1 text-xl font-bold tabular-nums">{c.value.toLocaleString('en-IN')}</p>
                        </div>
                    ))}
                </div>
                <div className="overflow-x-auto border-t border-slate-100">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-indigo-100/80 bg-indigo-50/50">
                                <th className={th}>Contract ID</th>
                                <th className={th}>Contract name</th>
                                <th className={th}>Vendor</th>
                                <th className={th}>Type</th>
                                <th className={th}>Start</th>
                                <th className={th}>Expiry</th>
                                <th className={th}>Status</th>
                                <th className={th}>Risk score</th>
                                <th className={th}>AI review</th>
                                <th className={th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contracts.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No contracts match filters.
                                    </td>
                                </tr>
                            ) : (
                                contracts.map((row, i) => {
                                    const href = getContractDetailHref(row.slug);
                                    return (
                                        <tr key={row.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                            <td className={cn(td, 'font-mono text-xs')}>{row.contractId}</td>
                                            <td className={cn(td, 'font-semibold')}>
                                                <DemandClickableLink href={href}>{row.name}</DemandClickableLink>
                                            </td>
                                            <td className={td}>{row.vendor}</td>
                                            <td className={cn(td, 'text-xs')}>{row.type}</td>
                                            <td className={cn(td, 'tabular-nums text-xs')}>{row.startDate}</td>
                                            <td className={cn(td, 'tabular-nums text-xs')}>{row.expiryDate}</td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold', statusClass(row.status))}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums', riskScoreTone(row.riskScore))}>
                                                    {row.riskScore}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'text-xs')}>{row.aiReviewStatus}</td>
                                            <td className={td}>
                                                <div className="flex flex-wrap gap-1">
                                                    <TableActionBtn label="View" icon={LuEye} onClick={() => href && (window.location.href = href)} />
                                                    <TableActionBtn label="Download" icon={LuDownload} onClick={() => window.alert(`Download: ${row.name}`)} />
                                                    <TableActionBtn
                                                        label="Compare"
                                                        icon={LuGitCompare}
                                                        onClick={() => {
                                                            const cmp = getContractCompareHref(row.slug);
                                                            if (cmp) window.location.href = cmp;
                                                        }}
                                                    />
                                                    <TableActionBtn
                                                        label="AI Review"
                                                        icon={LuSparkles}
                                                        onClick={() => {
                                                            const rev = getContractReviewHref(row.slug);
                                                            if (rev) window.location.href = rev;
                                                        }}
                                                    />
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

const EXTRACTION_FIELD_LABELS: { label: string; key: keyof ContractExtractionSample }[] = [
    { label: 'Contract', key: 'contractName' },
    { label: 'Parties', key: 'parties' },
    { label: 'Effective', key: 'effectiveDate' },
    { label: 'Expiry', key: 'expiryDate' },
    { label: 'Payment', key: 'paymentTerms' },
    { label: 'SLA', key: 'slaTerms' },
    { label: 'Termination', key: 'terminationClause' },
    { label: 'Penalty', key: 'penaltyClause' },
    { label: 'Liability', key: 'liabilityTerms' },
    { label: 'Insurance', key: 'insuranceRequirements' },
    { label: 'Renewal', key: 'renewalTerms' },
];

function UploadedReviewCard({
    review,
    expanded,
    onToggle,
}: {
    review: UploadedContractReview;
    expanded: boolean;
    onToggle: () => void;
}) {
    const { extraction } = review;
    const isAnalyzing = review.status === 'analyzing';

    return (
        <article className="rounded-lg border border-slate-200 bg-white">
            <button
                type="button"
                onClick={onToggle}
                disabled={isAnalyzing}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50/80 disabled:cursor-default"
            >
                <LuFileText size={16} className="shrink-0 text-violet-600" aria-hidden />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{review.fileName}</p>
                    <p className="text-[11px] text-slate-500">
                        {review.fileSizeLabel} · {review.uploadedAt}
                    </p>
                </div>
                {isAnalyzing ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-violet-700">
                        <LuSparkles size={12} className="animate-pulse" aria-hidden />
                        Analyzing…
                    </span>
                ) : (
                    <span className="shrink-0 text-slate-400">{expanded ? '−' : '+'}</span>
                )}
            </button>

            {!isAnalyzing ? (
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-amber-50/50 px-3 py-2">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">Contract risk score</p>
                        <p className="text-xl font-bold tabular-nums text-slate-900">
                            {extraction.riskScore} <span className="text-sm font-medium text-slate-500">/ 100</span>
                        </p>
                    </div>
                    <span className={cn('rounded-full border px-2.5 py-1 text-xs font-bold', riskScoreTone(extraction.riskScore))}>
                        {riskScoreLabel(extraction.riskScore)}
                    </span>
                </div>
            ) : null}

            {!isAnalyzing && extraction.findings.length > 0 ? (
                <ul className="space-y-1 border-t border-slate-100 px-3 py-2">
                    {extraction.findings.map((finding) => (
                        <li key={finding} className="text-xs font-medium text-amber-900">
                            <span aria-hidden>⚠ </span>
                            {finding}
                        </li>
                    ))}
                </ul>
            ) : null}

            {expanded && !isAnalyzing ? (
                <div className="border-t border-slate-100 px-3 pb-3">
                    <dl className="mt-2 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                        {EXTRACTION_FIELD_LABELS.map(({ label, key }) => {
                            const value = extraction[key];
                            if (typeof value !== 'string') return null;
                            return (
                                <div key={key} className="grid grid-cols-[88px_1fr] gap-2 text-xs">
                                    <dt className="font-medium text-slate-500">{label}</dt>
                                    <dd className={cn('font-medium', value === 'Not found' ? 'text-rose-700' : 'text-slate-800')}>
                                        {value}
                                    </dd>
                                </div>
                            );
                        })}
                    </dl>
                </div>
            ) : null}
        </article>
    );
}

export function ContractReviewCenter({ sample }: { sample: ContractExtractionSample }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploads, setUploads] = useState<UploadedContractReview[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const processFiles = useCallback(
        (files: FileList | File[] | null) => {
            if (!files?.length) return;

            Array.from(files).forEach((file) => {
                const review = buildUploadedContractReview(file, sample);
                setUploads((prev) => [review, ...prev]);
                setExpandedId(review.id);

                window.setTimeout(() => {
                    setUploads((prev) =>
                        prev.map((item) => (item.id === review.id ? { ...item, status: 'completed' } : item)),
                    );
                }, 1200);
            });
        },
        [sample],
    );

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        processFiles(event.target.files);
        event.target.value = '';
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragging(false);
        processFiles(event.dataTransfer.files);
    };

    return (
        <div id={CONTRACT_SECTION_IDS.review} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="violet" aria-label="AI review center">
                <LeadsIntelAiSectionHeader
                    title="AI Review Center"
                    subtitle="Upload a contract to extract fields and score risk."
                    variant="violet"
                />

                <div className="space-y-3 p-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileChange}
                    />
                    <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleUploadClick();
                            }
                        }}
                        onClick={handleUploadClick}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            'flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2.5 transition-colors',
                            isDragging
                                ? 'border-violet-400 bg-violet-50'
                                : 'border-violet-200 bg-violet-50/40 hover:border-violet-300',
                        )}
                    >
                        <div className="flex min-w-0 items-center gap-2">
                            <LuFileUp size={18} className="shrink-0 text-violet-600" aria-hidden />
                            <p className="text-xs text-slate-600">
                                <span className="font-semibold text-slate-800">Upload PDF or DOCX</span>
                                {' · '}drag & drop or click
                            </p>
                        </div>
                        <button
                            type="button"
                            className="shrink-0 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                            onClick={(event) => {
                                event.stopPropagation();
                                handleUploadClick();
                            }}
                        >
                            Choose file
                        </button>
                    </div>

                    {uploads.length > 0 ? (
                        <div className="space-y-2">
                            {uploads.map((review) => (
                                <UploadedReviewCard
                                    key={review.id}
                                    review={review}
                                    expanded={expandedId === review.id}
                                    onToggle={() => setExpandedId((id) => (id === review.id ? null : review.id))}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500">
                            No uploads yet. Each file shows extracted fields, findings, and a risk score.
                        </p>
                    )}
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function ContractComparisonCenter({ highlights }: { highlights: ContractComparisonHighlight[] }) {
    const toneClass: Record<ContractComparisonHighlight['tone'], string> = {
        rose: 'border-rose-200 bg-rose-50/60',
        amber: 'border-amber-200 bg-amber-50/60',
        emerald: 'border-emerald-200 bg-emerald-50/60',
        slate: 'border-slate-200 bg-slate-50/60',
    };

    return (
        <div id={CONTRACT_SECTION_IDS.comparison} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="cyan" aria-label="Contract comparison center">
                <LeadsIntelAiSectionHeader
                    title="Contract Comparison Center"
                    subtitle="Compare Contract A vs Contract B — clauses, pricing, SLA, liability, and risk differences."
                    variant="cyan"
                />
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-cyan-100 bg-cyan-50/30 p-4">
                        <p className="text-xs font-bold text-cyan-900">Contract A</p>
                        <p className="mt-1 font-semibold text-slate-900">MetroBuild Vendor Agreement</p>
                    </div>
                    <div className="rounded-xl border border-cyan-100 bg-cyan-50/30 p-4">
                        <p className="text-xs font-bold text-cyan-900">Contract B</p>
                        <p className="mt-1 font-semibold text-slate-900">MetroBuild Phase 2 Construction</p>
                    </div>
                </div>
                <div className="border-t border-slate-100 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Comparison dimensions</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {['Clause', 'Pricing', 'SLA', 'Liability', 'Renewal', 'Insurance', 'Penalty'].map((d) => (
                            <span key={d} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                                {d}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="border-t border-slate-100 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">AI highlights</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {highlights.map((h) => (
                            <div key={h.id} className={cn('rounded-xl border p-3', toneClass[h.tone])}>
                                <p className="text-[10px] font-bold uppercase text-slate-600">{h.label}</p>
                                <p className="mt-1 text-xs font-semibold text-slate-800">
                                    {h.contractA}
                                    {h.contractB !== '—' ? ` vs ${h.contractB}` : ''}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-600">{h.detail}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function ContractRenewalTracker({
    counts,
    renewals,
}: {
    counts: { expiring30: number; expiring60: number; expiring90: number; renewalsPendingApproval: number; autoRenewals: number };
    renewals: ContractRenewalRow[];
}) {
    const cards = [
        { label: 'Expiring in 30 days', value: counts.expiring30 },
        { label: 'Expiring in 60 days', value: counts.expiring60 },
        { label: 'Expiring in 90 days', value: counts.expiring90 },
        { label: 'Renewals pending approval', value: counts.renewalsPendingApproval },
        { label: 'Auto renewals', value: counts.autoRenewals },
    ];

    return (
        <div id={CONTRACT_SECTION_IDS.renewal} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="amber" aria-label="Renewal tracker">
                <LeadsIntelAiSectionHeader
                    title="Renewal Tracker"
                    subtitle="Expiring agreements and renewal decisions — renew, renegotiate, or replace vendor."
                    variant="amber"
                />
                <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-5">
                    {cards.map((c) => (
                        <div key={c.label} className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900">{c.label}</p>
                            <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">{c.value}</p>
                        </div>
                    ))}
                </div>
                <div className="overflow-x-auto border-t border-slate-100">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-amber-100/80 bg-amber-50/50">
                                <th className={th}>Contract</th>
                                <th className={th}>Vendor</th>
                                <th className={th}>Expiry</th>
                                <th className={th}>Renewal status</th>
                                <th className={th}>Risk</th>
                                <th className={th}>Suggested action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renewals.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No renewals in this view.
                                    </td>
                                </tr>
                            ) : (
                                renewals.map((row, i) => {
                                    const href = getContractDetailHref(row.contractSlug);
                                    return (
                                        <tr key={row.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                            <td className={cn(td, 'font-semibold')}>
                                                <DemandClickableLink href={href}>{row.contractName}</DemandClickableLink>
                                            </td>
                                            <td className={td}>{row.vendor}</td>
                                            <td className={cn(td, 'tabular-nums text-xs')}>{row.expiryDate}</td>
                                            <td className={cn(td, 'text-xs')}>{row.renewalStatus}</td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold', riskLevelClass(row.riskLevel))}>
                                                    {row.riskLevel}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'text-xs font-semibold text-violet-800')}>{row.suggestedAction}</td>
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

export function ContractClauseLibrary({ clauses }: { clauses: ClauseLibraryItem[] }) {
    return (
        <div id={CONTRACT_SECTION_IDS.clauses} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="indigo" aria-label="Clause library">
                <LeadsIntelAiSectionHeader
                    title="Clause Library"
                    subtitle="Reusable clause templates — termination, penalty, SLA, insurance, and compliance."
                    variant="indigo"
                />
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    {clauses.map((cl) => (
                        <DemandClickableCard
                            key={cl.id}
                            href={`#${CONTRACT_SECTION_IDS.clauses}`}
                            className="rounded-xl border border-indigo-100 bg-white p-3 shadow-sm"
                        >
                            <p className="text-[10px] font-bold uppercase text-indigo-700">{cl.category}</p>
                            <p className="mt-1 font-bold text-slate-900">{cl.name}</p>
                            <p className="mt-2 text-xs text-slate-600">
                                Usage: <span className="font-bold">{cl.usageCount}</span>
                            </p>
                            <span className={cn('mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold', riskLevelClass(cl.riskLevel))}>
                                {cl.riskLevel} risk
                            </span>
                            <p className="mt-2 text-[10px] font-semibold text-violet-700">View template →</p>
                        </DemandClickableCard>
                    ))}
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function ContractRecommendedActions({ actions }: { actions: ContractRecommendedAction[] }) {
    return (
        <div id={CONTRACT_SECTION_IDS.actions} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="amber" aria-label="AI recommended actions">
                <LeadsIntelAiSectionHeader
                    title="AI Recommended Actions"
                    subtitle="Exact legal and compliance steps — ranked by business impact and urgency."
                    variant="amber"
                    badge="Do today"
                />
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                    {actions.length === 0 ? (
                        <p className="col-span-2 px-4 py-8 text-center text-sm text-slate-500">No actions in this view.</p>
                    ) : (
                        actions.map((a) => {
                            const href = getContractDetailHref(a.contractSlug);
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
                                    {href ? <p className="mt-2 text-[10px] font-semibold text-violet-700">Open contract →</p> : null}
                                </DemandClickableCard>
                            );
                        })
                    )}
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function ContractForecastCards({ periods }: { periods: ContractForecastPeriod[] }) {
    return (
        <div id={CONTRACT_SECTION_IDS.forecast} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="indigo" aria-label="Contract forecast">
                <LeadsIntelAiSectionHeader
                    title="Contract Forecast"
                    subtitle="Expected expirations, reviews, renewals, and risk escalations."
                    variant="indigo"
                />
                <div className="grid gap-3 p-4 md:grid-cols-3">
                    {periods.map((f) => (
                        <DemandClickableCard
                            key={f.id}
                            href={`#${CONTRACT_SECTION_IDS.insightsTable}`}
                            className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4"
                        >
                            <p className="text-sm font-bold text-indigo-900">{f.label}</p>
                            <ul className="mt-3 space-y-2 text-xs text-slate-700">
                                <li>
                                    <span className="font-bold uppercase tracking-wide text-slate-500">Contracts expiring</span>
                                    <p className="text-lg font-bold tabular-nums text-slate-900">{f.contractsExpiring}</p>
                                </li>
                                <li>
                                    <span className="font-bold uppercase tracking-wide text-slate-500">Expected reviews</span>
                                    <p className="text-lg font-bold tabular-nums text-slate-900">{f.expectedReviews}</p>
                                </li>
                                <li>
                                    <span className="font-bold uppercase tracking-wide text-slate-500">Risk escalations</span>
                                    <p className="text-lg font-bold tabular-nums text-rose-800">{f.riskEscalations}</p>
                                </li>
                                {f.renewals != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Renewals</span>
                                        <p className="font-bold tabular-nums">{f.renewals}</p>
                                    </li>
                                ) : null}
                                {f.contractUploads != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Contract uploads</span>
                                        <p className="font-bold tabular-nums">{f.contractUploads}</p>
                                    </li>
                                ) : null}
                                {f.legalReviews != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Legal reviews</span>
                                        <p className="font-bold tabular-nums">{f.legalReviews}</p>
                                    </li>
                                ) : null}
                                {f.contractVolume != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Contract volume</span>
                                        <p className="font-bold tabular-nums">{f.contractVolume}</p>
                                    </li>
                                ) : null}
                                {f.renewalLoad != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Renewal load</span>
                                        <p className="font-bold tabular-nums">{f.renewalLoad}</p>
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

export function ContractInsightsTable({ contracts }: { contracts: ContractRecord[] }) {
    return (
        <div id={CONTRACT_SECTION_IDS.insightsTable} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="violet" aria-label="AI contract insights table">
                <LeadsIntelAiSectionHeader
                    title="AI Contract Insights"
                    subtitle="Single management view — risk, status, expiry, and AI recommendations."
                    variant="violet"
                />
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-violet-100/80 bg-violet-50/50">
                                <th className={th}>Contract name</th>
                                <th className={th}>Vendor</th>
                                <th className={th}>Risk score</th>
                                <th className={th}>Status</th>
                                <th className={th}>Expiry</th>
                                <th className={th}>AI recommendation</th>
                                <th className={th}>Priority</th>
                                <th className={th}>Last review</th>
                                <th className={th}>Owner</th>
                                <th className={th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contracts.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No contracts match filters.
                                    </td>
                                </tr>
                            ) : (
                                contracts.map((c, i) => {
                                    const href = getContractDetailHref(c.slug);
                                    return (
                                        <tr key={c.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                            <td className={cn(td, 'font-semibold')}>
                                                <DemandClickableLink href={href} showArrow>
                                                    {c.name}
                                                </DemandClickableLink>
                                            </td>
                                            <td className={td}>{c.vendor}</td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums', riskScoreTone(c.riskScore))}>
                                                    {c.riskScore}
                                                </span>
                                            </td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold', statusClass(c.status))}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'tabular-nums text-xs')}>{c.expiryDate}</td>
                                            <td className={cn(td, 'max-w-[180px] text-xs font-semibold text-violet-900')}>
                                                <DemandClickableLink href={href} className="inline-flex items-center gap-1">
                                                    {c.aiRecommendation}
                                                    <LuArrowRight size={12} className="opacity-60" aria-hidden />
                                                </DemandClickableLink>
                                            </td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold', priorityClass(c.priority))}>
                                                    {c.priority}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'text-xs tabular-nums')}>{c.lastReview}</td>
                                            <td className={cn(td, 'text-xs')}>{c.owner}</td>
                                            <td className={td}>
                                                <div className="flex flex-wrap gap-1">
                                                    <TableActionBtn label="View" icon={LuEye} onClick={() => href && (window.location.href = href)} />
                                                    <TableActionBtn
                                                        label="Compare"
                                                        icon={LuGitCompare}
                                                        onClick={() => {
                                                            const cmp = getContractCompareHref(c.slug);
                                                            if (cmp) window.location.href = cmp;
                                                        }}
                                                    />
                                                    <TableActionBtn
                                                        label="Review"
                                                        icon={LuSparkles}
                                                        onClick={() => {
                                                            const rev = getContractReviewHref(c.slug);
                                                            if (rev) window.location.href = rev;
                                                        }}
                                                    />
                                                    <TableActionBtn label="Download" icon={LuDownload} onClick={() => window.alert(`Download: ${c.name}`)} />
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
