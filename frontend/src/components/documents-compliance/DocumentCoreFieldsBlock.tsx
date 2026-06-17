'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { COMPLIANCE_ROLE_LABELS, type ComplianceDemoRole } from '@/lib/complianceRbac';
import {
    formatComplianceFileSize,
    getCurrentVersion,
    getPreviousVersion,
    getUploadDateYmd,
    type ComplianceDocumentRecord,
} from '@/lib/complianceDocumentsMockStore';
import { formatShortDate } from '@/lib/formatDate';

/** Same labels as Document management table + panels (upload / edit / view). */
export const COMPLIANCE_DOCUMENT_FIELD_LABELS = {
    documentId: 'Document ID',
    documentName: 'Document name',
    documentType: 'Document type',
    fileUpload: 'File upload',
    fileSize: 'File size',
    uploadDate: 'Upload date',
    uploadedBy: 'Uploaded by',
    bookingId: 'Booking ID',
    customerId: 'Customer ID',
    projectId: 'Project ID',
    versionNumber: 'Version number',
    previousVersion: 'Previous version',
    accessLevel: 'Access level',
    allowedRoles: 'Allowed roles',
} as const;

export function DocumentFieldRow({
    label,
    value,
    valueClassName,
    alignValueTop,
}: {
    label: string;
    value: React.ReactNode;
    valueClassName?: string;
    /** Tall content (e.g. file dropzone) — top-align label and value. */
    alignValueTop?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex justify-between gap-3 border-b border-slate-100 py-2.5 text-sm last:border-0',
                alignValueTop && 'items-start'
            )}
        >
            <span className={cn('shrink-0 text-slate-500', alignValueTop && 'pt-0.5')}>{label}</span>
            <span className={cn('min-w-0 text-right font-medium text-slate-900', valueClassName)}>{value}</span>
        </div>
    );
}

export function formatAllowedRolesList(roles: ComplianceDemoRole[]): string {
    const s = roles.map((r) => COMPLIANCE_ROLE_LABELS[r]).join(', ');
    return s || '—';
}

export function PreviousVersionReadonlyValue({ doc }: { doc: ComplianceDocumentRecord }) {
    const prev = getPreviousVersion(doc);
    if (!prev) return '—';
    return (
        <span className="font-mono text-xs">
            v{prev.version} · <span className="text-slate-600">{prev.fileName}</span>
        </span>
    );
}

/** Same field order as Document management table — read-only from a saved record. */
export function DocumentCoreFieldsFromRecord({ doc }: { doc: ComplianceDocumentRecord }) {
    const v = getCurrentVersion(doc);
    const uploadYmd = getUploadDateYmd(doc);
    const L = COMPLIANCE_DOCUMENT_FIELD_LABELS;
    return (
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 px-3">
            <DocumentFieldRow label={L.documentId} value={doc.id} valueClassName="font-mono text-xs" />
            <DocumentFieldRow label={L.documentName} value={doc.name} />
            <DocumentFieldRow label={L.documentType} value={doc.documentType} />
            <DocumentFieldRow
                label={L.fileUpload}
                value={<span className="font-mono text-xs">{v?.fileName ?? '—'}</span>}
            />
            <DocumentFieldRow label={L.fileSize} value={v ? formatComplianceFileSize(v.sizeBytes) : '—'} />
            <DocumentFieldRow label={L.uploadDate} value={formatShortDate(uploadYmd)} />
            <DocumentFieldRow label={L.uploadedBy} value={v?.uploadedBy ?? '—'} />
            <DocumentFieldRow label={L.bookingId} value={doc.bookingId || '—'} valueClassName="font-mono text-xs" />
            <DocumentFieldRow label={L.customerId} value={doc.customerId || '—'} valueClassName="font-mono text-xs" />
            <DocumentFieldRow label={L.projectId} value={doc.projectId || '—'} />
            <DocumentFieldRow label={L.versionNumber} value={v?.version ?? '—'} valueClassName="font-mono text-xs" />
            <DocumentFieldRow label={L.previousVersion} value={<PreviousVersionReadonlyValue doc={doc} />} />
            <DocumentFieldRow label={L.accessLevel} value={<span className="capitalize">{doc.accessLevel}</span>} />
            <DocumentFieldRow label={L.allowedRoles} value={formatAllowedRolesList(doc.allowedRoles)} valueClassName="text-xs leading-snug" />
        </div>
    );
}
