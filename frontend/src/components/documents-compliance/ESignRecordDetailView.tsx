'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { ESignRecord } from '@/lib/complianceDocumentsMockStore';
import { formatShortDate } from '@/lib/formatDate';
import { LuDownload } from 'react-icons/lu';

export function ESignRecordDetailView({ record }: { record: ESignRecord }) {
    const page = record.signaturePage ?? 1;
    return (
        <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
                <span
                    className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        record.status === 'Signed' && 'bg-emerald-100 text-emerald-800',
                        record.status === 'Pending' && 'bg-amber-100 text-amber-900',
                        record.status === 'Failed' && 'bg-rose-100 text-rose-800',
                    )}
                >
                    {record.status}
                </span>
            </div>
            <dl className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <dt className="shrink-0 text-xs font-semibold text-slate-500">Request ID</dt>
                    <dd className="break-all text-right font-mono text-xs font-medium text-slate-900">{record.id}</dd>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <dt className="shrink-0 text-xs font-semibold text-slate-500">Document</dt>
                    <dd className="text-right font-semibold text-slate-900">{record.documentName}</dd>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <dt className="shrink-0 text-xs font-semibold text-slate-500">Document ID</dt>
                    <dd className="break-all text-right font-mono text-xs text-slate-800">{record.documentId}</dd>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <dt className="shrink-0 text-xs font-semibold text-slate-500">Signer</dt>
                    <dd className="text-right text-slate-900">{record.signerName}</dd>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <dt className="shrink-0 text-xs font-semibold text-slate-500">Aadhaar (masked)</dt>
                    <dd className="text-right font-mono text-xs text-slate-800">{record.aadhaarMasked}</dd>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <dt className="shrink-0 text-xs font-semibold text-slate-500">Transaction</dt>
                    <dd className="break-all text-right font-mono text-xs text-slate-800">{record.transactionId}</dd>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <dt className="shrink-0 text-xs font-semibold text-slate-500">Created</dt>
                    <dd className="tabular-nums text-right text-slate-800">{formatShortDate(record.createdAt.slice(0, 10))}</dd>
                </div>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <dt className="shrink-0 text-xs font-semibold text-slate-500">Signed</dt>
                    <dd className="text-right text-slate-800">
                        {record.signedAt ? formatShortDate(record.signedAt.slice(0, 10)) : '—'}
                    </dd>
                </div>
                <div className="border-t border-slate-100 pt-3">
                    <dt className="mb-1.5 text-xs font-semibold text-slate-500">Signature placement</dt>
                    <dd className="font-mono text-xs text-slate-700">
                        Page {page} — {record.signatureXPercent.toFixed(1)}% horizontal, {record.signatureYPercent.toFixed(1)}% vertical
                    </dd>
                </div>
            </dl>
            {record.signedStorageUrl ? (
                <Button
                    type="button"
                    variant="companyOutline"
                    size="cta"
                    className="w-full gap-2"
                    onClick={() => window.open(record.signedStorageUrl!, '_blank', 'noopener,noreferrer')}
                >
                    <LuDownload className="h-4 w-4" />
                    Download signed file
                </Button>
            ) : null}
        </div>
    );
}
