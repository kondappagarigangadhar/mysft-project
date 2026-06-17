'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { VendorDocumentFormField, vendorDocumentInputClass } from '@/components/vendors/shared/VendorDocumentFormFields';
import {
    fmtVendorDocumentDate,
    VENDOR_DOC_TYPES,
    VENDOR_DOC_VERIFICATION_OPTIONS,
} from '@/lib/vendors/vendorDocumentUi';
import { isPendingVerificationStatus } from '@/lib/vendors/vendorComplianceVerification';
import type { VendorDocument, VerificationStatus } from '@/lib/vendors/types';
import { MOCK_VENDORS } from '@/lib/vendors/mockData';
import { cn } from '@/lib/utils';

export type VendorDocumentEditForm = {
    vendorId: string;
    documentName: string;
    type: string;
    issueDate: string;
    expiryDate: string;
    notes: string;
    fileLabel: string;
    verificationStatus: VerificationStatus;
    verifiedBy: string;
    verifiedDate: string;
};

export function VendorDocumentEditModal({
    document: doc,
    form,
    submitAttempted,
    lockVendorId,
    onClose,
    onSave,
    onFormChange,
}: {
    document: VendorDocument | null;
    form: VendorDocumentEditForm;
    submitAttempted: boolean;
    lockVendorId?: string;
    onClose: () => void;
    onSave: () => void;
    onFormChange: (patch: Partial<VendorDocumentEditForm>) => void;
}) {
    const inputClass = vendorDocumentInputClass;

    return (
        <Modal
            isOpen={Boolean(doc)}
            onClose={onClose}
            title="Edit Document"
            placement="top"
            maxWidthClassName="max-w-2xl"
            footer={
                <>
                    <Button type="button" variant="companyOutline" size="cta" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="button" variant="company" size="cta" onClick={onSave}>
                        Save changes
                    </Button>
                </>
            }
        >
            {doc ? (
                <div className="space-y-4">
                    <p className="text-xs leading-relaxed text-slate-500">
                        Same flow as add document: type and file, dates, verification, display name, then notes.
                    </p>
                    <VendorDocumentFormField label="Vendor *">
                        <select
                            value={form.vendorId}
                            onChange={(e) => onFormChange({ vendorId: e.target.value })}
                            className={inputClass(!!submitAttempted && !form.vendorId)}
                            disabled={Boolean(lockVendorId)}
                        >
                            <option value="">Select vendor…</option>
                            {MOCK_VENDORS.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.name}
                                </option>
                            ))}
                        </select>
                    </VendorDocumentFormField>
                    <VendorDocumentFormField label="Document Type *">
                        <select
                            value={form.type}
                            onChange={(e) => onFormChange({ type: e.target.value })}
                            className={inputClass(false)}
                        >
                            {VENDOR_DOC_TYPES.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </VendorDocumentFormField>
                    <VendorDocumentFormField label="Document File">
                        <input
                            type="file"
                            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-800 hover:file:bg-[color-mix(in_srgb,var(--cta-button-bg)_18%,white)]"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) onFormChange({ fileLabel: f.name });
                            }}
                        />
                        <input
                            value={form.fileLabel}
                            onChange={(e) => onFormChange({ fileLabel: e.target.value })}
                            className={cn(inputClass(false), 'mt-2')}
                            placeholder="File name as stored"
                            aria-label="Document file name"
                        />
                        <p className="mt-1 text-xs text-slate-500">Previously: {doc.fileName ?? '—'}</p>
                    </VendorDocumentFormField>
                    <VendorDocumentFormField label="Upload date (recorded)">
                        <input
                            type="text"
                            readOnly
                            value={fmtVendorDocumentDate(doc.uploadedDate)}
                            className={cn(inputClass(false), 'bg-slate-50 text-slate-600')}
                        />
                    </VendorDocumentFormField>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <VendorDocumentFormField label="Issue Date">
                            <input
                                type="date"
                                value={form.issueDate}
                                onChange={(e) => onFormChange({ issueDate: e.target.value })}
                                className={inputClass(false)}
                            />
                        </VendorDocumentFormField>
                        <VendorDocumentFormField label="Expiry Date">
                            <input
                                type="date"
                                value={form.expiryDate}
                                onChange={(e) => onFormChange({ expiryDate: e.target.value })}
                                className={inputClass(false)}
                            />
                        </VendorDocumentFormField>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verification</p>
                        <div className="mt-3 space-y-3">
                            <VendorDocumentFormField label="Verification status">
                                <select
                                    value={form.verificationStatus}
                                    onChange={(e) =>
                                        onFormChange({ verificationStatus: e.target.value as VerificationStatus })
                                    }
                                    className={inputClass(false)}
                                >
                                    {VENDOR_DOC_VERIFICATION_OPTIONS.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </VendorDocumentFormField>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <VendorDocumentFormField label="Verified by">
                                    <input
                                        value={form.verifiedBy}
                                        onChange={(e) => onFormChange({ verifiedBy: e.target.value })}
                                        className={inputClass(false)}
                                        placeholder="e.g. Company Admin"
                                        disabled={isPendingVerificationStatus(form.verificationStatus)}
                                    />
                                </VendorDocumentFormField>
                                <VendorDocumentFormField label="Verified date">
                                    <input
                                        type="date"
                                        value={form.verifiedDate}
                                        onChange={(e) => onFormChange({ verifiedDate: e.target.value })}
                                        className={inputClass(false)}
                                        disabled={isPendingVerificationStatus(form.verificationStatus)}
                                    />
                                </VendorDocumentFormField>
                            </div>
                        </div>
                    </div>
                    <VendorDocumentFormField label="Document Name *">
                        <input
                            value={form.documentName}
                            onChange={(e) => onFormChange({ documentName: e.target.value })}
                            className={inputClass(!!submitAttempted && !form.documentName.trim())}
                            placeholder="e.g. GST Registration Certificate"
                        />
                    </VendorDocumentFormField>
                    <VendorDocumentFormField label="Notes">
                        <textarea
                            value={form.notes}
                            onChange={(e) => onFormChange({ notes: e.target.value })}
                            rows={3}
                            className={cn(inputClass(false), 'min-h-[88px] resize-y')}
                        />
                    </VendorDocumentFormField>
                </div>
            ) : null}
        </Modal>
    );
}
