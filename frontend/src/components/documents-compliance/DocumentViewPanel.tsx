'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { DocumentCoreFieldsFromRecord } from '@/components/documents-compliance/DocumentCoreFieldsBlock';
import {
    getComplianceStatus,
    getCurrentVersion,
    getDocumentById,
    logDownload,
    logView,
} from '@/lib/complianceDocumentsMockStore';
import type { ComplianceDemoRole } from '@/lib/complianceRbac';
import { formatShortDate } from '@/lib/formatDate';
import { useComplianceStoreBump } from '@/hooks/useComplianceStoreBump';

/** Read-only details for the right panel — same core fields as the table, upload, and edit. */
export function DocumentViewPanel({
    open,
    documentId,
    onClose,
    actorName,
    actorRole,
}: {
    open: boolean;
    documentId: string | null;
    onClose: () => void;
    actorName: string;
    actorRole: ComplianceDemoRole;
}) {
    useComplianceStoreBump();
    const doc = useMemo(() => (documentId ? getDocumentById(documentId) : undefined), [documentId, open]);

    if (!open || !documentId) return null;
    if (!doc) return <p className="text-sm text-slate-500">Document not found.</p>;

    const v = getCurrentVersion(doc);
    const status = getComplianceStatus(doc.expiryDate);

    const onOpenDownload = () => {
        if (!v) return;
        logView(doc.id, { name: actorName, role: actorRole });
        logDownload(doc.id, { name: actorName, role: actorRole });
        window.open(v.storageUrl, '_blank', 'noopener,noreferrer');
    };

    const row = (label: string, value: React.ReactNode) => (
        <div className="flex justify-between gap-3 border-b border-slate-100 py-2.5 text-sm last:border-0">
            <span className="shrink-0 text-slate-500">{label}</span>
            <span className="min-w-0 text-right font-medium text-slate-900">{value}</span>
        </div>
    );

    return (
        <div className="flex min-h-0 flex-col gap-4">
            <DocumentCoreFieldsFromRecord doc={doc} />

            <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Compliance &amp; classification</p>
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 px-3">
                    {row(
                        'Compliance status',
                        <span
                            className={
                                status === 'Expired'
                                    ? 'rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800'
                                    : 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800'
                            }
                        >
                            {status}
                        </span>
                    )}
                    {doc.reraNumber ? row('RERA number', doc.reraNumber) : null}
                    {doc.expiryDate ? row('Expiry date', formatShortDate(doc.expiryDate)) : null}
                    {doc.categories.length ? row('Categories', doc.categories.join(', ')) : null}
                </div>
            </div>

            <div className="sticky bottom-0 z-10 -mx-1 mt-auto flex gap-2 border-t border-slate-100 bg-white/95 px-1 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <Button type="button" variant="companyOutline" size="cta" className="flex-1" onClick={onClose}>
                    Close
                </Button>
                <Button type="button" variant="company" size="cta" className="flex-1" onClick={onOpenDownload} disabled={!v}>
                    Download
                </Button>
            </div>
        </div>
    );
}
