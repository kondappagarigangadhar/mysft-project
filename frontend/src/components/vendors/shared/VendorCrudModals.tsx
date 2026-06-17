'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { MOCK_VENDORS } from '@/lib/vendors/mockData';
import { cn } from '@/lib/utils';

export type AddContractPayload = {
    vendorId: string;
    contractName: string;
    startDate: string;
    endDate: string;
    value: string;
    fileName: string;
    notes: string;
};

export function AddContractModal({
    isOpen,
    onClose,
    onSubmit,
    initialVendorId,
    lockVendor = false,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: AddContractPayload) => void;
    initialVendorId?: string;
    lockVendor?: boolean;
}) {
    const [form, setForm] = useState<AddContractPayload>({
        vendorId: initialVendorId || MOCK_VENDORS[0]?.id || '',
        contractName: '',
        startDate: '',
        endDate: '',
        value: '',
        fileName: '',
        notes: '',
    });
    const [submitAttempted, setSubmitAttempted] = useState(false);
    useEffect(() => {
        if (!isOpen) return;
        setForm({
            vendorId: initialVendorId || MOCK_VENDORS[0]?.id || '',
            contractName: '',
            startDate: '',
            endDate: '',
            value: '',
            fileName: '',
            notes: '',
        });
        setSubmitAttempted(false);
    }, [initialVendorId, isOpen]);
    const valueNum = form.value.trim() ? Number(form.value) : NaN;
    const contractErrors = {
        vendorId: !form.vendorId ? 'Vendor is required.' : '',
        contractName: !form.contractName.trim() ? 'Contract name is required.' : '',
        startDate: !form.startDate ? 'Start date is required.' : '',
        endDate: !form.endDate ? 'End date is required.' : form.startDate && form.endDate <= form.startDate ? 'End date must be after start date.' : '',
        value: !form.value.trim() ? 'Contract value is required.' : Number.isNaN(valueNum) || valueNum <= 0 ? 'Contract value must be a positive number.' : '',
        fileName: !form.fileName.trim() ? 'File name is required.' : '',
    };
    const invalid = Object.values(contractErrors).some(Boolean);
    const inputClass = 'h-11 w-full rounded-xl border border-slate-200 px-3 text-sm';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Contract"
            maxWidthClassName="max-w-xl"
            footer={
                <>
                    <Button variant="companyOutline" size="cta" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="company"
                        size="cta"
                        onClick={() => {
                            setSubmitAttempted(true);
                            if (invalid) return;
                            onSubmit({ ...form, contractName: form.contractName.trim(), fileName: form.fileName.trim(), notes: form.notes.trim() });
                        }}
                    >
                        Save Contract
                    </Button>
                </>
            }
        >
            <div className="space-y-3">
                <Field label="Vendor" required>
                    <select className={inputClass} value={form.vendorId} onChange={(e) => setForm((s) => ({ ...s, vendorId: e.target.value }))} disabled={lockVendor}>
                        {MOCK_VENDORS.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.name} ({v.id})
                            </option>
                        ))}
                    </select>
                    {submitAttempted && contractErrors.vendorId ? <p className="mt-1 text-xs font-medium text-red-600">{contractErrors.vendorId}</p> : null}
                </Field>
                <Field label="Contract Name" required>
                    <input className={inputClass} value={form.contractName} onChange={(e) => setForm((s) => ({ ...s, contractName: e.target.value }))} />
                    {submitAttempted && contractErrors.contractName ? <p className="mt-1 text-xs font-medium text-red-600">{contractErrors.contractName}</p> : null}
                </Field>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Start Date" required>
                        <input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))} />
                        {submitAttempted && contractErrors.startDate ? <p className="mt-1 text-xs font-medium text-red-600">{contractErrors.startDate}</p> : null}
                    </Field>
                    <Field label="End Date" required>
                        <input type="date" className={inputClass} value={form.endDate} onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))} />
                        {submitAttempted && contractErrors.endDate ? <p className="mt-1 text-xs font-medium text-red-600">{contractErrors.endDate}</p> : null}
                    </Field>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Contract Value" required>
                        <input className={inputClass} value={form.value} onChange={(e) => setForm((s) => ({ ...s, value: e.target.value.replace(/[^\d.]/g, '') }))} />
                        {submitAttempted && contractErrors.value ? <p className="mt-1 text-xs font-medium text-red-600">{contractErrors.value}</p> : null}
                    </Field>
                    <Field label="Upload PDF Name" required>
                        <input className={inputClass} value={form.fileName} onChange={(e) => setForm((s) => ({ ...s, fileName: e.target.value }))} placeholder="contract.pdf" />
                        {submitAttempted && contractErrors.fileName ? <p className="mt-1 text-xs font-medium text-red-600">{contractErrors.fileName}</p> : null}
                    </Field>
                </div>
                <Field label="Notes">
                    <textarea className={cn(inputClass, 'h-24 py-2')} value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
                </Field>
            </div>
        </Modal>
    );
}

export type AddDocumentPayload = {
    vendorId: string;
    type: string;
    documentName: string;
    fileLabel: string;
    issueDate: string;
    expiryDate: string;
    notes: string;
};

const DOC_TYPES = ['PAN', 'GST', 'License', 'Agreement', 'Insurance', 'Trade License', 'Other'] as const;

export function AddDocumentModal({
    isOpen,
    onClose,
    onSubmit,
    initialVendorId,
    lockVendor = false,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: AddDocumentPayload) => void;
    initialVendorId?: string;
    lockVendor?: boolean;
}) {
    const [form, setForm] = useState<AddDocumentPayload>({
        vendorId: initialVendorId || MOCK_VENDORS[0]?.id || '',
        type: 'PAN',
        documentName: '',
        issueDate: '',
        expiryDate: '',
        notes: '',
        fileLabel: '',
    });
    const [submitAttempted, setSubmitAttempted] = useState(false);
    useEffect(() => {
        if (!isOpen) return;
        setForm({
            vendorId: initialVendorId || MOCK_VENDORS[0]?.id || '',
            type: 'PAN',
            documentName: '',
            issueDate: '',
            expiryDate: '',
            notes: '',
            fileLabel: '',
        });
        setSubmitAttempted(false);
    }, [initialVendorId, isOpen]);
    const docErrors = {
        vendorId: !form.vendorId ? 'Vendor is required.' : '',
        documentName: !form.documentName.trim() ? 'Document name is required.' : '',
        fileLabel: !form.fileLabel.trim() ? 'File name is required.' : '',
        expiryDate: form.issueDate && form.expiryDate && form.expiryDate <= form.issueDate ? 'Expiry date must be after issue date.' : '',
    };
    const invalid = Object.values(docErrors).some(Boolean);
    const inputClass = 'h-11 w-full rounded-xl border border-slate-200 px-3 text-sm';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Document"
            placement="top"
            maxWidthClassName="max-w-2xl"
            footer={
                <>
                    <Button variant="companyOutline" size="cta" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="company"
                        size="cta"
                        onClick={() => {
                            setSubmitAttempted(true);
                            if (invalid) return;
                            onSubmit({
                                ...form,
                                documentName: form.documentName.trim(),
                                fileLabel: form.fileLabel.trim(),
                                notes: form.notes.trim(),
                            });
                        }}
                    >
                        Save Document
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <p className="text-xs leading-relaxed text-slate-500">
                    Upload starts compliance verification automatically. Status will be Pending Verification until the review workflow completes.
                </p>
                <Field label="Vendor" required>
                    <select className={inputClass} value={form.vendorId} onChange={(e) => setForm((f) => ({ ...f, vendorId: e.target.value }))} disabled={lockVendor}>
                        {MOCK_VENDORS.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.name}
                            </option>
                        ))}
                    </select>
                    {submitAttempted && docErrors.vendorId ? <p className="mt-1 text-xs font-medium text-red-600">{docErrors.vendorId}</p> : null}
                </Field>
                <Field label="Document Type" required>
                    <select className={inputClass} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                        {DOC_TYPES.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Document File" required>
                    <input
                        type="file"
                        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-800 hover:file:bg-[color-mix(in_srgb,var(--cta-button-bg)_18%,white)]"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setForm((prev) => ({ ...prev, fileLabel: f.name }));
                        }}
                    />
                    <input
                        className={cn(inputClass, 'mt-2')}
                        value={form.fileLabel}
                        onChange={(e) => setForm((f) => ({ ...f, fileLabel: e.target.value }))}
                        placeholder="e.g. license.pdf"
                        aria-label="Document file name"
                    />
                    {submitAttempted && docErrors.fileLabel ? <p className="mt-1 text-xs font-medium text-red-600">{docErrors.fileLabel}</p> : null}
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Issue Date">
                        <input type="date" className={inputClass} value={form.issueDate} onChange={(e) => setForm((f) => ({ ...f, issueDate: e.target.value }))} />
                    </Field>
                    <Field label="Expiry Date">
                        <input type="date" className={inputClass} value={form.expiryDate} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))} />
                        {submitAttempted && docErrors.expiryDate ? <p className="mt-1 text-xs font-medium text-red-600">{docErrors.expiryDate}</p> : null}
                    </Field>
                </div>
                <Field label="Document Name" required>
                    <input
                        className={inputClass}
                        value={form.documentName}
                        onChange={(e) => setForm((f) => ({ ...f, documentName: e.target.value }))}
                        placeholder="e.g. GST Registration Certificate"
                    />
                    {submitAttempted && docErrors.documentName ? <p className="mt-1 text-xs font-medium text-red-600">{docErrors.documentName}</p> : null}
                </Field>
                <Field label="Notes">
                    <textarea className={cn(inputClass, 'min-h-[88px] resize-y py-2')} rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                </Field>
            </div>
        </Modal>
    );
}

function Field({ label, children, required = false }: { label: string; children: ReactNode; required?: boolean }) {
    return (
        <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600">{label}{required ? <span className="text-rose-500"> *</span> : null}</span>
            {children}
        </label>
    );
}
