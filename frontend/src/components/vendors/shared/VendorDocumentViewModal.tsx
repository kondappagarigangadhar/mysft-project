'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { VerificationBadge } from '@/components/vendors/VendorShared';
import {
    fmtVendorDocumentDate,
    getVendorDocumentVerifiedByDisplay,
    VENDOR_DOC_COLUMN_LABEL,
} from '@/lib/vendors/vendorDocumentUi';
import type { VendorDocument } from '@/lib/vendors/types';

export function VendorDocumentViewModal({
    document: doc,
    vendorName,
    onClose,
    onEdit,
    onDownload,
    hideVendorLink = false,
}: {
    document: VendorDocument | null;
    vendorName: string;
    onClose: () => void;
    onEdit: (doc: VendorDocument) => void;
    onDownload: (doc: VendorDocument) => void;
    hideVendorLink?: boolean;
}) {
    return (
        <Modal
            isOpen={Boolean(doc)}
            onClose={onClose}
            title="Document Details"
            placement="top"
            maxWidthClassName="max-w-3xl"
            footer={
                <>
                    <Button type="button" variant="companyOutline" size="cta" onClick={onClose}>
                        Close
                    </Button>
                    {doc ? (
                        <>
                            <Button type="button" variant="companyOutline" size="cta" onClick={() => onEdit(doc)}>
                                Edit
                            </Button>
                            <Button type="button" variant="company" size="cta" onClick={() => onDownload(doc)}>
                                Download
                            </Button>
                        </>
                    ) : null}
                </>
            }
        >
            {doc ? (
                <div className="space-y-4">
                    <p className="text-xs text-slate-500">Same field order as the compliance center table and forms.</p>
                    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 p-3">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{VENDOR_DOC_COLUMN_LABEL.vendor}</dt>
                            <dd className="mt-1 font-medium text-slate-900">
                                {hideVendorLink ? (
                                    vendorName
                                ) : (
                                    <Link
                                        href={`/company-admin/vendors/${encodeURIComponent(doc.vendorId)}?tab=overview`}
                                        className="text-[var(--cta-button-bg)] hover:underline"
                                    >
                                        {vendorName}
                                    </Link>
                                )}
                            </dd>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{VENDOR_DOC_COLUMN_LABEL.type}</dt>
                            <dd className="mt-1 font-medium text-slate-900">{doc.type}</dd>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3 sm:col-span-2">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{VENDOR_DOC_COLUMN_LABEL.documentFile}</dt>
                            <dd className="mt-1 font-mono text-sm font-medium text-slate-900">{doc.fileName?.trim() || '—'}</dd>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3 sm:col-span-2">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{VENDOR_DOC_COLUMN_LABEL.documentName}</dt>
                            <dd className="mt-1 font-medium text-slate-900">{doc.documentName}</dd>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{VENDOR_DOC_COLUMN_LABEL.uploadedDate}</dt>
                            <dd className="mt-1 font-medium tabular-nums text-slate-900">{fmtVendorDocumentDate(doc.uploadedDate)}</dd>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Issue date</dt>
                            <dd className="mt-1 font-medium tabular-nums text-slate-900">{fmtVendorDocumentDate(doc.issueDate)}</dd>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{VENDOR_DOC_COLUMN_LABEL.expiryDate}</dt>
                            <dd className="mt-1 font-medium tabular-nums text-slate-900">{fmtVendorDocumentDate(doc.expiryDate)}</dd>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{VENDOR_DOC_COLUMN_LABEL.status}</dt>
                            <dd className="mt-2">
                                <VerificationBadge status={doc.verificationStatus} />
                            </dd>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{VENDOR_DOC_COLUMN_LABEL.verifiedBy}</dt>
                            <dd className="mt-1 font-medium text-slate-900">{getVendorDocumentVerifiedByDisplay(doc)}</dd>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-3">
                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{VENDOR_DOC_COLUMN_LABEL.verifiedDate}</dt>
                            <dd className="mt-1 font-medium tabular-nums text-slate-900">{fmtVendorDocumentDate(doc.verifiedDate)}</dd>
                        </div>
                    </dl>
                    {doc.approvalNotes ? (
                        <div className="rounded-xl border border-slate-200 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approval notes</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{doc.approvalNotes}</p>
                        </div>
                    ) : null}
                    {doc.notes ? (
                        <div className="rounded-xl border border-slate-200 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{doc.notes}</p>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </Modal>
    );
}
