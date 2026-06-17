'use client';

import { Fragment, useMemo } from 'react';
import { VerificationBadge } from '@/components/vendors/VendorShared';
import { VendorComplianceVerificationTimeline } from '@/components/vendors/VendorComplianceVerificationTimeline';
import type { VendorDocument } from '@/lib/vendors/types';
import { shouldShowComplianceTimeline } from '@/lib/vendors/vendorComplianceVerification';

export function VendorProfileDocumentsTable({
    documents,
    onView,
    onEdit,
    onDelete,
}: {
    documents: VendorDocument[];
    onView: (doc: VendorDocument) => void;
    onEdit: (doc: VendorDocument) => void;
    onDelete: (doc: VendorDocument) => void;
}) {
    const rows = useMemo(() => documents.slice(0, 6), [documents]);

    if (!rows.length) {
        return (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                No compliance documents on file for this vendor yet.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                        <th className="px-2 py-2">Document Name</th>
                        <th className="px-2 py-2">Type</th>
                        <th className="px-2 py-2">Upload Date</th>
                        <th className="px-2 py-2">Expiry Date</th>
                        <th className="px-2 py-2">Verification</th>
                        <th className="px-2 py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((doc) => (
                        <Fragment key={doc.id}>
                            <tr className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                                <td className="px-2 py-2 font-semibold text-slate-900">{doc.documentName}</td>
                                <td className="px-2 py-2 text-slate-700">{doc.type}</td>
                                <td className="px-2 py-2 text-slate-700">{doc.uploadedDate}</td>
                                <td className="px-2 py-2 text-slate-700">{doc.expiryDate ?? '—'}</td>
                                <td className="px-2 py-2">
                                    <VerificationBadge status={doc.verificationStatus} />
                                </td>
                                <td className="px-2 py-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            className="text-xs font-semibold text-(--cta-button-bg) hover:underline"
                                            onClick={() => onView(doc)}
                                        >
                                            View
                                        </button>
                                        <button
                                            type="button"
                                            className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
                                            onClick={() => onEdit(doc)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                                            onClick={() => onDelete(doc)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            {shouldShowComplianceTimeline(doc) ? (
                                <tr className="border-t border-slate-50 bg-white">
                                    <td colSpan={6} className="px-2 pb-3 pt-1">
                                        <VendorComplianceVerificationTimeline document={doc} />
                                    </td>
                                </tr>
                            ) : null}
                        </Fragment>
                    ))}
                </tbody>
            </table>
            {documents.length > 6 ? (
                <p className="mt-2 text-xs text-slate-500">Showing 6 of {documents.length} documents.</p>
            ) : null}
        </div>
    );
}
