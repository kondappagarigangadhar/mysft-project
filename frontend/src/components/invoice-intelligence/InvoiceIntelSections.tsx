'use client';

import React, { useCallback, useRef, useState } from 'react';
import { LuBadgeCheck, LuCircleX, LuEye, LuFileUp, LuSparkles } from 'react-icons/lu';
import { LeadsIntelAiPanel, LeadsIntelAiSectionHeader } from '@/components/leads-intelligence/leadsIntelligenceUi';
import { DemandClickableCard, DemandClickableLink } from '@/components/demand-intelligence/DemandClickableLink';
import type {
    DuplicateSuspectRow,
    FraudAlertRow,
    FraudRiskCategory,
    InvoiceExtractionSample,
    InvoiceForecastPeriod,
    InvoiceHealthSnapshot,
    InvoiceIntelRecord,
    InvoiceRecommendedAction,
    PaymentDueRow,
    PoMatchHighlight,
} from '@/lib/invoiceIntelligenceStore';
import {
    formatInr,
    impactClass,
    invoiceStatusClass,
    priorityClass,
    riskScoreLabel,
    riskScoreTone,
    validationStatusClass,
} from '@/lib/invoiceIntelligenceHelpers';
import {
    getInvoiceIntelDetailHref,
    getInvoiceValidationHref,
    INVOICE_INTEL_SECTION_IDS,
} from '@/lib/invoiceIntelligenceRoutes';
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

const EXTRACTION_FIELDS: { label: string; key: keyof InvoiceExtractionSample }[] = [
    { label: 'Vendor name', key: 'vendorName' },
    { label: 'Invoice number', key: 'invoiceNumber' },
    { label: 'Invoice date', key: 'invoiceDate' },
    { label: 'GST number', key: 'gstNumber' },
    { label: 'Tax amount', key: 'taxAmount' },
    { label: 'Subtotal', key: 'subtotal' },
    { label: 'Total amount', key: 'totalAmount' },
    { label: 'Payment terms', key: 'paymentTerms' },
    { label: 'PO reference', key: 'poReference' },
    { label: 'Work order ref', key: 'workOrderReference' },
];

export function InvoiceHealthOverview({ snapshot }: { snapshot: InvoiceHealthSnapshot }) {
    const cards = [
        { label: 'Validated', value: snapshot.validated, tone: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
        { label: 'Needs review', value: snapshot.needsReview, tone: 'border-amber-200 bg-amber-50 text-amber-900' },
        { label: 'Duplicates detected', value: snapshot.duplicatesDetected, tone: 'border-rose-200 bg-rose-50 text-rose-900' },
        { label: 'Fraud alerts', value: snapshot.fraudAlerts, tone: 'border-rose-200 bg-rose-50 text-rose-900' },
        { label: 'Pending approval', value: snapshot.pendingApproval, tone: 'border-violet-200 bg-violet-50 text-violet-900' },
        { label: 'Payment due', value: snapshot.paymentDue, tone: 'border-cyan-200 bg-cyan-50 text-cyan-900' },
    ];

    return (
        <div id={INVOICE_INTEL_SECTION_IDS.health} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="emerald" aria-label="Invoice health overview">
                <LeadsIntelAiSectionHeader
                    title="Invoice Health Overview"
                    subtitle="Validation status, duplicates, fraud alerts, and payment pipeline."
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

export function InvoiceRepositorySection({ invoices }: { invoices: InvoiceIntelRecord[] }) {
    return (
        <div id={INVOICE_INTEL_SECTION_IDS.repository} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="indigo" aria-label="Invoice repository intelligence">
                <LeadsIntelAiSectionHeader
                    title="Invoice Repository Intelligence"
                    subtitle="Full invoice registry with AI validation status and risk scores."
                    variant="indigo"
                />
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-indigo-100/80 bg-indigo-50/50">
                                <th className={th}>Invoice number</th>
                                <th className={th}>Vendor</th>
                                <th className={th}>PO number</th>
                                <th className={th}>Invoice amount</th>
                                <th className={th}>Status</th>
                                <th className={th}>AI validation</th>
                                <th className={th}>Risk score</th>
                                <th className={th}>Created date</th>
                                <th className={th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No invoices match filters.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((row, i) => {
                                    const href = getInvoiceIntelDetailHref(row.slug);
                                    return (
                                        <tr key={row.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                            <td className={cn(td, 'font-semibold')}>
                                                <DemandClickableLink href={href}>{row.invoiceNumber}</DemandClickableLink>
                                            </td>
                                            <td className={td}>{row.vendor}</td>
                                            <td className={cn(td, 'font-mono text-xs')}>{row.poNumber}</td>
                                            <td className={cn(td, 'tabular-nums font-semibold')}>{formatInr(row.invoiceAmount)}</td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold', invoiceStatusClass(row.status))}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold', validationStatusClass(row.validationStatus))}>
                                                    {row.validationStatus}
                                                </span>
                                            </td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums', riskScoreTone(row.riskScore))}>
                                                    {row.riskScore}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'tabular-nums text-xs')}>{row.createdDate}</td>
                                            <td className={td}>
                                                <div className="flex flex-wrap gap-1">
                                                    <TableActionBtn label="View" icon={LuEye} onClick={() => href && (window.location.href = href)} />
                                                    <TableActionBtn
                                                        label="Validate"
                                                        icon={LuSparkles}
                                                        onClick={() => {
                                                            const v = getInvoiceValidationHref(row.slug);
                                                            if (v) window.location.href = v;
                                                        }}
                                                    />
                                                    <TableActionBtn label="Approve" icon={LuBadgeCheck} onClick={() => window.alert(`Approve: ${row.invoiceNumber}`)} />
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

export function AiValidationCenter({ sample }: { sample: InvoiceExtractionSample }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploaded, setUploaded] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleUpload = useCallback((files: FileList | null) => {
        if (!files?.length) return;
        setUploaded(files[0].name);
    }, []);

    return (
        <div id={INVOICE_INTEL_SECTION_IDS.validation} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="violet" aria-label="AI validation center">
                <LeadsIntelAiSectionHeader
                    title="AI Validation Center"
                    subtitle="Upload invoices for OCR extraction, PO matching, and validation."
                    variant="violet"
                />
                <div className="space-y-4 p-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,image/*,application/pdf"
                        onChange={(e) => {
                            handleUpload(e.target.files);
                            e.target.value = '';
                        }}
                    />
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleUpload(e.dataTransfer.files); }}
                        className={cn(
                            'flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2.5 transition-colors',
                            isDragging ? 'border-violet-400 bg-violet-50' : 'border-violet-200 bg-violet-50/40 hover:border-violet-300',
                        )}
                    >
                        <div className="flex min-w-0 items-center gap-2">
                            <LuFileUp size={18} className="shrink-0 text-violet-600" aria-hidden />
                            <p className="text-xs text-slate-600">
                                <span className="font-semibold text-slate-800">Upload PDF / image / scanned invoice</span>
                                {' · '}drag & drop or click
                            </p>
                        </div>
                        <button
                            type="button"
                            className="shrink-0 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        >
                            Choose file
                        </button>
                    </div>
                    {uploaded ? (
                        <p className="text-xs font-medium text-emerald-700">Uploaded: {uploaded} — AI extraction applied below.</p>
                    ) : null}

                    <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">AI extraction</p>
                            <dl className="mt-2 grid gap-1.5 sm:grid-cols-2">
                                {EXTRACTION_FIELDS.map(({ label, key }) => {
                                    const value = sample[key];
                                    const display = typeof value === 'number' ? formatInr(value) : String(value);
                                    return (
                                        <div key={key} className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-xs">
                                            <dt className="font-medium text-slate-500">{label}</dt>
                                            <dd className={cn('mt-0.5 font-semibold', value === 'Not found' ? 'text-rose-700' : 'text-slate-800')}>
                                                {display}
                                            </dd>
                                        </div>
                                    );
                                })}
                            </dl>
                        </div>
                        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Validation results</p>
                            <dl className="mt-3 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-slate-600">Invoice amount</dt>
                                    <dd className="font-bold tabular-nums">{formatInr(sample.invoiceAmount)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-slate-600">PO amount</dt>
                                    <dd className="font-bold tabular-nums">{formatInr(sample.poAmount)}</dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-slate-600">Variance</dt>
                                    <dd className="font-bold tabular-nums text-rose-700">{formatInr(sample.variance)}</dd>
                                </div>
                                <div className="flex justify-between border-t border-amber-200 pt-2">
                                    <dt className="font-semibold text-slate-700">Status</dt>
                                    <dd className="font-bold text-amber-900">{sample.validationStatus}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function PoMatchingCenter({ highlights }: { highlights: PoMatchHighlight[] }) {
    const matchTone: Record<PoMatchHighlight['matchResult'], string> = {
        'Exact Match': 'border-emerald-200 bg-emerald-50 text-emerald-900',
        'Partial Match': 'border-amber-200 bg-amber-50 text-amber-900',
        Mismatch: 'border-rose-200 bg-rose-50 text-rose-900',
        'Missing Reference': 'border-slate-200 bg-slate-50 text-slate-800',
    };

    return (
        <div id={INVOICE_INTEL_SECTION_IDS.poMatching} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="cyan" aria-label="PO matching intelligence">
                <LeadsIntelAiSectionHeader
                    title="PO Matching Intelligence"
                    subtitle="Match invoices against purchase orders, work orders, and vendor records."
                    variant="cyan"
                />
                <div className="grid gap-3 p-4 lg:grid-cols-3">
                    {highlights.length === 0 ? (
                        <p className="col-span-3 py-8 text-center text-sm text-slate-500">No PO matches in this view.</p>
                    ) : (
                        highlights.map((h) => (
                            <div key={h.id} className="rounded-xl border border-cyan-100 bg-cyan-50/30 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-bold text-slate-900">{h.invoiceNumber}</p>
                                    <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold', matchTone[h.matchResult])}>
                                        {h.matchResult}
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-slate-600">PO: {h.poNumber} · WO: {h.workOrderRef}</p>
                                <p className="text-xs text-slate-600">Vendor: {h.vendor}</p>
                                <dl className="mt-3 space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">PO amount</dt>
                                        <dd className="font-bold tabular-nums">{formatInr(h.poAmount)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">Invoice amount</dt>
                                        <dd className="font-bold tabular-nums">{formatInr(h.invoiceAmount)}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-slate-500">Variance %</dt>
                                        <dd className={cn('font-bold tabular-nums', h.variancePercent > 0 ? 'text-rose-700' : 'text-emerald-700')}>
                                            {h.variancePercent}%
                                        </dd>
                                    </div>
                                </dl>
                                <p className="mt-2 text-xs font-semibold text-cyan-800">{h.recommendation}</p>
                            </div>
                        ))
                    )}
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function DuplicateDetectionCenter({ duplicates }: { duplicates: DuplicateSuspectRow[] }) {
    return (
        <div id={INVOICE_INTEL_SECTION_IDS.duplicates} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="rose" aria-label="Duplicate detection center">
                <LeadsIntelAiSectionHeader
                    title="Duplicate Detection Center"
                    subtitle="AI-flagged duplicate invoice suspects with confidence scores."
                    variant="rose"
                />
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-rose-100 bg-rose-50/50">
                                <th className={th}>Invoice number</th>
                                <th className={th}>Possible match</th>
                                <th className={th}>Vendor</th>
                                <th className={th}>Amount</th>
                                <th className={th}>Confidence %</th>
                                <th className={th}>Status</th>
                                <th className={th}>Recommended action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {duplicates.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No duplicate suspects in this view.
                                    </td>
                                </tr>
                            ) : (
                                duplicates.map((row, i) => (
                                    <tr key={row.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                        <td className={cn(td, 'font-semibold')}>{row.invoiceNumber}</td>
                                        <td className={cn(td, 'font-semibold text-rose-800')}>{row.possibleMatch}</td>
                                        <td className={td}>{row.vendor}</td>
                                        <td className={cn(td, 'tabular-nums font-semibold')}>{formatInr(row.amount)}</td>
                                        <td className={cn(td, 'tabular-nums font-bold text-rose-700')}>{row.confidence}%</td>
                                        <td className={cn(td, 'text-xs')}>{row.status}</td>
                                        <td className={cn(td, 'text-xs font-semibold text-rose-800')}>{row.recommendedAction}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function FraudDetectionCenter({
    fraudScore,
    categories,
    alerts,
}: {
    fraudScore: number;
    categories: FraudRiskCategory[];
    alerts: FraudAlertRow[];
}) {
    return (
        <div id={INVOICE_INTEL_SECTION_IDS.fraud} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="rose" aria-label="Fraud detection center">
                <LeadsIntelAiSectionHeader
                    title="Fraud Detection Center"
                    subtitle="Fraud risk scoring, category breakdown, and alert queue."
                    variant="rose"
                />
                <div className="grid gap-4 p-4 lg:grid-cols-[240px_1fr]">
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Fraud risk score</p>
                        <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
                            {fraudScore} <span className="text-lg text-slate-500">/ 100</span>
                        </p>
                        <span className={cn('mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold', riskScoreTone(fraudScore))}>
                            {riskScoreLabel(fraudScore)}
                        </span>
                    </div>
                    <div>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">Risk categories</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {categories.map((c) => (
                                <div key={c.id} className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/40 px-3 py-2 text-xs">
                                    <span className="font-semibold text-slate-800">{c.label}</span>
                                    <span className="font-bold tabular-nums text-rose-800">{c.count}</span>
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
                                <th className={th}>Invoice</th>
                                <th className={th}>Issue</th>
                                <th className={th}>Risk</th>
                                <th className={th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No fraud alerts in this view.
                                    </td>
                                </tr>
                            ) : (
                                alerts.map((row, i) => {
                                    const href = getInvoiceIntelDetailHref(row.invoiceSlug);
                                    return (
                                        <tr key={row.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                            <td className={td}>{row.vendor}</td>
                                            <td className={cn(td, 'font-semibold')}>
                                                <DemandClickableLink href={href}>{row.invoiceNumber}</DemandClickableLink>
                                            </td>
                                            <td className={cn(td, 'text-xs')}>{row.issue}</td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold', riskScoreTone(row.risk === 'High' ? 80 : row.risk === 'Medium' ? 55 : 25))}>
                                                    {row.risk}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'text-xs font-semibold text-rose-800')}>{row.action}</td>
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

export function PaymentTracker({
    counts,
    payments,
}: {
    counts: { dueThisWeek: number; dueThisMonth: number; overdue: number; blocked: number; pendingApprovals: number };
    payments: PaymentDueRow[];
}) {
    const cards = [
        { label: 'Due this week', value: counts.dueThisWeek, tone: 'border-cyan-200 bg-cyan-50 text-cyan-900' },
        { label: 'Due this month', value: counts.dueThisMonth, tone: 'border-violet-200 bg-violet-50 text-violet-900' },
        { label: 'Overdue payments', value: counts.overdue, tone: 'border-rose-200 bg-rose-50 text-rose-900' },
        { label: 'Blocked payments', value: counts.blocked, tone: 'border-slate-200 bg-slate-50 text-slate-800' },
        { label: 'Pending approvals', value: counts.pendingApprovals, tone: 'border-amber-200 bg-amber-50 text-amber-900' },
    ];

    return (
        <div id={INVOICE_INTEL_SECTION_IDS.payments} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="indigo" aria-label="Payment tracker">
                <LeadsIntelAiSectionHeader
                    title="Payment Tracker"
                    subtitle="Payments due, overdue, blocked, and pending approval queue."
                    variant="indigo"
                />
                <div className="grid grid-cols-2 gap-2 p-4 lg:grid-cols-5">
                    {cards.map((c) => (
                        <div key={c.label} className={cn('rounded-xl border p-3', c.tone)}>
                            <p className="text-[10px] font-bold uppercase tracking-wide opacity-85">{c.label}</p>
                            <p className="mt-1 text-xl font-bold tabular-nums">{c.value}</p>
                        </div>
                    ))}
                </div>
                <div className="overflow-x-auto border-t border-slate-100">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-indigo-100 bg-indigo-50/50">
                                <th className={th}>Vendor</th>
                                <th className={th}>Invoice</th>
                                <th className={th}>Amount</th>
                                <th className={th}>Due date</th>
                                <th className={th}>Status</th>
                                <th className={th}>Priority</th>
                                <th className={th}>Recommended action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No payments in this view.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((row, i) => {
                                    const href = getInvoiceIntelDetailHref(row.invoiceSlug);
                                    return (
                                        <tr key={row.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                            <td className={td}>{row.vendor}</td>
                                            <td className={cn(td, 'font-semibold')}>
                                                <DemandClickableLink href={href}>{row.invoiceNumber}</DemandClickableLink>
                                            </td>
                                            <td className={cn(td, 'tabular-nums font-semibold')}>{formatInr(row.amount)}</td>
                                            <td className={cn(td, 'tabular-nums text-xs')}>{row.dueDate}</td>
                                            <td className={cn(td, 'text-xs font-semibold', row.status === 'Overdue' ? 'text-rose-700' : 'text-slate-800')}>
                                                {row.status}
                                            </td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold', priorityClass(row.priority))}>
                                                    {row.priority}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'text-xs font-semibold text-indigo-800')}>{row.recommendedAction}</td>
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

export function InvoiceRecommendedActions({ actions }: { actions: InvoiceRecommendedAction[] }) {
    return (
        <div id={INVOICE_INTEL_SECTION_IDS.actions} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="amber" aria-label="AI recommended actions">
                <LeadsIntelAiSectionHeader
                    title="AI Recommended Actions"
                    subtitle="Finance steps ranked by impact, urgency, and AI confidence."
                    variant="amber"
                    badge="Do today"
                />
                <div className="grid gap-3 p-4 sm:grid-cols-2">
                    {actions.length === 0 ? (
                        <p className="col-span-2 px-4 py-8 text-center text-sm text-slate-500">No actions in this view.</p>
                    ) : (
                        actions.map((a) => {
                            const href = getInvoiceIntelDetailHref(a.invoiceSlug);
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
                                    {href ? <p className="mt-2 text-[10px] font-semibold text-violet-700">Open invoice →</p> : null}
                                </DemandClickableCard>
                            );
                        })
                    )}
                </div>
            </LeadsIntelAiPanel>
        </div>
    );
}

export function InvoiceForecastCards({ periods }: { periods: InvoiceForecastPeriod[] }) {
    return (
        <div id={INVOICE_INTEL_SECTION_IDS.forecast} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="indigo" aria-label="Finance forecast">
                <LeadsIntelAiSectionHeader
                    title="Finance Forecast"
                    subtitle="Expected approvals, payments, duplicate cases, and invoice volume."
                    variant="indigo"
                />
                <div className="grid gap-3 p-4 md:grid-cols-3">
                    {periods.map((f) => (
                        <DemandClickableCard
                            key={f.id}
                            href={`#${INVOICE_INTEL_SECTION_IDS.insightsTable}`}
                            className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4"
                        >
                            <p className="text-sm font-bold text-indigo-900">{f.label}</p>
                            <ul className="mt-3 space-y-2 text-xs text-slate-700">
                                {f.awaitingApproval != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Invoices awaiting approval</span>
                                        <p className="text-lg font-bold tabular-nums text-slate-900">{f.awaitingApproval}</p>
                                    </li>
                                ) : null}
                                {f.expectedPayments != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Expected payments</span>
                                        <p className="text-lg font-bold tabular-nums text-slate-900">{f.expectedPayments}</p>
                                    </li>
                                ) : null}
                                {f.fraudReviews != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Fraud reviews</span>
                                        <p className="font-bold tabular-nums">{f.fraudReviews}</p>
                                    </li>
                                ) : null}
                                {f.invoiceVolume != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Invoice volume</span>
                                        <p className="text-lg font-bold tabular-nums text-slate-900">{f.invoiceVolume.toLocaleString('en-IN')}</p>
                                    </li>
                                ) : null}
                                {f.paymentVolume != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Payment volume</span>
                                        <p className="font-bold tabular-nums">{formatInr(f.paymentVolume)}</p>
                                    </li>
                                ) : null}
                                {f.duplicateCases != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Duplicate cases</span>
                                        <p className="font-bold tabular-nums text-rose-800">{f.duplicateCases}</p>
                                    </li>
                                ) : null}
                                {f.approvalLoad != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Approval load</span>
                                        <p className="font-bold tabular-nums">{f.approvalLoad}</p>
                                    </li>
                                ) : null}
                                {f.invoiceGrowth != null ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Invoice growth</span>
                                        <p className="font-bold tabular-nums">+{f.invoiceGrowth}%</p>
                                    </li>
                                ) : null}
                                {f.vendorBillingTrends ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Vendor billing trends</span>
                                        <p className="font-medium text-slate-800">{f.vendorBillingTrends}</p>
                                    </li>
                                ) : null}
                                {f.paymentForecast ? (
                                    <li>
                                        <span className="font-bold uppercase tracking-wide text-slate-500">Payment forecast</span>
                                        <p className="font-medium text-slate-800">{f.paymentForecast}</p>
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

export function InvoiceInsightsTable({ invoices }: { invoices: InvoiceIntelRecord[] }) {
    return (
        <div id={INVOICE_INTEL_SECTION_IDS.insightsTable} className="scroll-mt-24">
            <LeadsIntelAiPanel variant="violet" aria-label="Invoice intelligence table">
                <LeadsIntelAiSectionHeader
                    title="Invoice Intelligence"
                    subtitle="Single finance view — validation, PO match, duplicates, risk, and payment status."
                    variant="violet"
                />
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="border-b border-violet-100/80 bg-violet-50/50">
                                <th className={th}>Invoice number</th>
                                <th className={th}>Vendor</th>
                                <th className={th}>Invoice amount</th>
                                <th className={th}>PO amount</th>
                                <th className={th}>Variance</th>
                                <th className={th}>Risk score</th>
                                <th className={th}>Validation</th>
                                <th className={th}>Duplicate score</th>
                                <th className={th}>Payment status</th>
                                <th className={th}>Recommended action</th>
                                <th className={th}>Priority</th>
                                <th className={th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className="px-4 py-8 text-center text-sm text-slate-500">
                                        No invoices match filters.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv, i) => {
                                    const href = getInvoiceIntelDetailHref(inv.slug);
                                    return (
                                        <tr key={inv.id} className={cn('border-b border-slate-100', i % 2 === 1 && 'bg-slate-50/50')}>
                                            <td className={cn(td, 'font-semibold')}>
                                                <DemandClickableLink href={href} showArrow>
                                                    {inv.invoiceNumber}
                                                </DemandClickableLink>
                                            </td>
                                            <td className={td}>{inv.vendor}</td>
                                            <td className={cn(td, 'tabular-nums font-semibold')}>{formatInr(inv.invoiceAmount)}</td>
                                            <td className={cn(td, 'tabular-nums')}>{formatInr(inv.poAmount)}</td>
                                            <td className={cn(td, 'tabular-nums font-semibold', inv.variance > 0 ? 'text-rose-700' : 'text-slate-800')}>
                                                {formatInr(inv.variance)}
                                            </td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-bold tabular-nums', riskScoreTone(inv.riskScore))}>
                                                    {inv.riskScore}
                                                </span>
                                            </td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold', validationStatusClass(inv.validationStatus))}>
                                                    {inv.validationStatus}
                                                </span>
                                            </td>
                                            <td className={cn(td, 'tabular-nums font-bold', inv.duplicateScore >= 70 ? 'text-rose-700' : 'text-slate-800')}>
                                                {inv.duplicateScore}%
                                            </td>
                                            <td className={cn(td, 'text-xs font-semibold')}>{inv.paymentStatus}</td>
                                            <td className={cn(td, 'max-w-[140px] text-xs font-semibold text-violet-900')}>{inv.recommendedAction}</td>
                                            <td className={td}>
                                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold', priorityClass(inv.priority))}>
                                                    {inv.priority}
                                                </span>
                                            </td>
                                            <td className={td}>
                                                <div className="flex flex-wrap gap-1">
                                                    <TableActionBtn label="View" icon={LuEye} onClick={() => href && (window.location.href = href)} />
                                                    <TableActionBtn
                                                        label="Validate"
                                                        icon={LuSparkles}
                                                        onClick={() => {
                                                            const v = getInvoiceValidationHref(inv.slug);
                                                            if (v) window.location.href = v;
                                                        }}
                                                    />
                                                    <TableActionBtn label="Approve" icon={LuBadgeCheck} onClick={() => window.alert(`Approve: ${inv.invoiceNumber}`)} />
                                                    <TableActionBtn label="Reject" icon={LuCircleX} onClick={() => window.alert(`Reject: ${inv.invoiceNumber}`)} />
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
