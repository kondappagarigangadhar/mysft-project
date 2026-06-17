'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from '@/components/data-table/DataTable';
import type { DataTableColumn, DataTableSortState } from '@/components/data-table/types';
import { SupplierComplianceDocBadge, SupplierComplianceExpiryHint } from '@/components/suppliers/SupplierShared';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PortaledRowActionsMenu } from '@/components/ui/PortaledRowActionsMenu';
import { supplierComplianceDaysUntil } from '@/lib/suppliers/supplierComplianceUtils';
import { appendSupplierRecordActivity } from '@/lib/suppliers/supplierRecordActivityLog';
import type { SupplierComplianceRow } from '@/lib/suppliers/types';
import {
    addSupplierCompliance,
    deleteSupplierCompliance,
    getSupplierComplianceBySupplierId,
    SUPPLIER_RELATIONS_UPDATED_EVENT,
    updateSupplierCompliance,
    validateComplianceRow,
} from '@/lib/suppliers/supplierRelationsStore';
import { cn } from '@/lib/utils';
import { LuDownload, LuEye, LuFileUp, LuPencil, LuPlus, LuShieldCheck, LuShieldOff, LuTrash2 } from 'react-icons/lu';

const DOCUMENT_TYPES = [
    'GST Certificate',
    'ISO Certificate',
    'Trade License',
    'PAN',
    'Environmental Clearance',
] as const;

const ACCEPT_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function isAllowedFile(file: File): boolean {
    if (file.type === 'application/pdf') return true;
    return file.type.startsWith('image/');
}

type Toast = { msg: string; err: boolean };

export function SupplierComplianceTabPanel({
    supplierId,
    supplierName,
    onToast,
}: {
    supplierId: string;
    supplierName: string;
    onToast: (t: Toast) => void;
}) {
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const fn = () => setTick((x) => x + 1);
        window.addEventListener(SUPPLIER_RELATIONS_UPDATED_EVENT, fn);
        return () => window.removeEventListener(SUPPLIER_RELATIONS_UPDATED_EVENT, fn);
    }, []);

    const compliance = useMemo(() => getSupplierComplianceBySupplierId(supplierId), [supplierId, tick]);

    const [compSort, setCompSort] = useState<DataTableSortState>({ columnId: 'expiryDate', direction: 'asc' });
    const [compColumnWidths, setCompColumnWidths] = useState<Record<string, number>>({
        documentType: 200,
        fileName: 220,
        expiryDate: 200,
        verificationStatus: 180,
        actions: 90,
    });
    const [compColumnVisibility, setCompColumnVisibility] = useState<Record<string, boolean>>({
        documentType: true,
        fileName: true,
        expiryDate: true,
        verificationStatus: true,
        actions: true,
    });

    const [compEditorOpen, setCompEditorOpen] = useState(false);
    const [compEditing, setCompEditing] = useState<SupplierComplianceRow | null>(null);
    const [docTypeSelect, setDocTypeSelect] = useState<string>(DOCUMENT_TYPES[0]);
    const [docTypeCustom, setDocTypeCustom] = useState('');
    const [compForm, setCompForm] = useState<Omit<SupplierComplianceRow, 'id' | 'supplierId'>>({
        documentType: DOCUMENT_TYPES[0],
        fileName: '',
        fileUrl: '',
        fileMime: '',
        expiryDate: '',
        verificationStatus: 'Pending',
    });
    const [compFormError, setCompFormError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [previewRow, setPreviewRow] = useState<SupplierComplianceRow | null>(null);

    const resolvedDocumentType = useCallback(() => {
        if (docTypeSelect === '__custom__') return docTypeCustom.trim();
        return docTypeSelect;
    }, [docTypeSelect, docTypeCustom]);

    const openCreate = () => {
        setCompEditing(null);
        setDocTypeSelect(DOCUMENT_TYPES[0]);
        setDocTypeCustom('');
        setCompForm({
            documentType: DOCUMENT_TYPES[0],
            fileName: '',
            fileUrl: '',
            fileMime: '',
            expiryDate: '',
            verificationStatus: 'Pending',
        });
        setCompFormError(null);
        setCompEditorOpen(true);
    };

    const attachFile = async (file: File | undefined) => {
        if (!file) return;
        if (!isAllowedFile(file)) {
            setCompFormError('Please upload a PDF or image file only.');
            return;
        }
        return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                setCompForm((f) => ({
                    ...f,
                    fileName: file.name,
                    fileUrl: String(reader.result),
                    fileMime: file.type,
                }));
                setCompFormError(null);
                resolve();
            };
            reader.onerror = () => reject(new Error('read failed'));
            reader.readAsDataURL(file);
        });
    };

    const onDropFiles = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        void attachFile(e.dataTransfer.files?.[0]);
    };

    const logCompliance = (action: string, changes: string, actionType: string) => {
        appendSupplierRecordActivity({
            user: { id: 'u-admin', name: 'Admin', role: 'Company Admin' },
            recordId: supplierId,
            recordLabel: supplierName,
            action,
            changes,
            severity: 'info',
            actionType,
        });
    };

    const submitCompliance = () => {
        const docType = compEditing ? compForm.documentType.trim() : resolvedDocumentType();
        const nextForm: Omit<SupplierComplianceRow, 'id' | 'supplierId'> = compEditing
            ? { ...compForm, documentType: compForm.documentType.trim() }
            : { ...compForm, documentType: docType };

        const err = validateComplianceRow(nextForm);
        setCompFormError(err);
        if (err) return;

        if (compEditing) {
            const res = updateSupplierCompliance({ ...compEditing, supplierId, ...nextForm });
            if (!res.ok) return setCompFormError(res.error);
            logCompliance('Compliance document updated', `${compEditing.documentType} · ${nextForm.fileName}`, 'document_updated');
            onToast({ msg: 'Document updated.', err: false });
            setCompEditorOpen(false);
            return;
        }
        const res = addSupplierCompliance({ supplierId, ...nextForm });
        if (!res.ok) return setCompFormError(res.error);
        logCompliance('Compliance document uploaded', `${nextForm.documentType} · ${nextForm.fileName}`, 'document_uploaded');
        onToast({ msg: 'Document uploaded.', err: false });
        setCompEditorOpen(false);
    };

    const columns = useMemo((): DataTableColumn<SupplierComplianceRow>[] => {
        return [
            {
                id: 'documentType',
                header: 'Document type',
                sortable: true,
                sortValue: (r) => r.documentType,
                minWidth: 200,
                sticky: true,
                render: (r) => <span className="font-semibold text-slate-900">{r.documentType}</span>,
            },
            {
                id: 'fileName',
                header: 'File',
                sortable: true,
                sortValue: (r) => r.fileName,
                minWidth: 220,
                render: (r) => (
                    <div className="flex min-w-0 flex-col gap-1">
                        <span className="truncate font-medium text-slate-800">{r.fileName}</span>
                        {r.fileUrl ? (
                            <button
                                type="button"
                                className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline"
                                onClick={() => setPreviewRow(r)}
                            >
                                <LuEye size={14} /> Preview
                            </button>
                        ) : null}
                    </div>
                ),
            },
            {
                id: 'expiryDate',
                header: 'Expiry',
                sortable: true,
                sortValue: (r) => r.expiryDate || '9999-12-31',
                minWidth: 200,
                render: (r) => (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="tabular-nums text-slate-800">{r.expiryDate || '—'}</span>
                        {r.expiryDate ? <SupplierComplianceExpiryHint expiryDate={r.expiryDate} /> : null}
                    </div>
                ),
            },
            {
                id: 'verificationStatus',
                header: 'Verification',
                sortable: true,
                sortValue: (r) => r.verificationStatus,
                minWidth: 180,
                render: (r) => <SupplierComplianceDocBadge status={r.verificationStatus} expiryDate={r.expiryDate} />,
            },
            {
                id: 'actions',
                header: '',
                minWidth: 90,
                stickyEnd: true,
                cellClassName: 'text-right',
                render: (r) => (
                    <PortaledRowActionsMenu estimatedMenuHeight={280} minMenuWidth={220}>
                        {({ close }) => (
                            <>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() => {
                                        close();
                                        setPreviewRow(r);
                                    }}
                                >
                                    <LuEye size={16} className="text-slate-400" /> View
                                </button>
                                {r.fileUrl ? (
                                    <a
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                        href={r.fileUrl}
                                        download={r.fileName}
                                        onClick={close}
                                    >
                                        <LuDownload size={16} className="text-slate-400" /> Download
                                    </a>
                                ) : (
                                    <button
                                        type="button"
                                        disabled
                                        className="flex w-full cursor-not-allowed items-center gap-2 px-3 py-2 text-left text-sm text-slate-400"
                                    >
                                        <LuDownload size={16} /> Download (attach file)
                                    </button>
                                )}
                                <div className="my-1 border-t border-slate-100" />
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-emerald-800 hover:bg-emerald-50"
                                    onClick={() => {
                                        close();
                                        const next = { ...r, verificationStatus: 'Verified' as const };
                                        const err = validateComplianceRow(next);
                                        if (err) {
                                            onToast({ msg: err, err: true });
                                            return;
                                        }
                                        updateSupplierCompliance(next);
                                        logCompliance('Compliance verification updated', `${r.documentType} → Verified`, 'verification_updated');
                                        onToast({ msg: 'Marked verified.', err: false });
                                    }}
                                >
                                    <LuShieldCheck size={16} /> Verify
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-800 hover:bg-rose-50"
                                    onClick={() => {
                                        close();
                                        const next = { ...r, verificationStatus: 'Rejected' as const };
                                        updateSupplierCompliance(next);
                                        logCompliance('Compliance verification updated', `${r.documentType} → Rejected`, 'verification_updated');
                                        onToast({ msg: 'Marked rejected.', err: false });
                                    }}
                                >
                                    <LuShieldOff size={16} /> Reject
                                </button>
                                <div className="my-1 border-t border-slate-100" />
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    onClick={() => {
                                        close();
                                        setCompEditing(r);
                                        setDocTypeSelect(DOCUMENT_TYPES.includes(r.documentType as (typeof DOCUMENT_TYPES)[number]) ? r.documentType : '__custom__');
                                        setDocTypeCustom(DOCUMENT_TYPES.includes(r.documentType as (typeof DOCUMENT_TYPES)[number]) ? '' : r.documentType);
                                        const { id: _id, supplierId: _sid, ...rest } = r;
                                        setCompForm(rest);
                                        setCompFormError(null);
                                        setCompEditorOpen(true);
                                    }}
                                >
                                    <LuPencil size={16} className="text-slate-400" /> Edit
                                </button>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                                    onClick={() => {
                                        close();
                                        const ok = window.confirm(`Delete document “${r.documentType}”?`);
                                        if (!ok) return;
                                        deleteSupplierCompliance(r.id);
                                        logCompliance('Compliance document deleted', r.documentType, 'document_deleted');
                                        onToast({ msg: 'Document deleted.', err: false });
                                    }}
                                >
                                    <LuTrash2 size={16} /> Delete
                                </button>
                            </>
                        )}
                    </PortaledRowActionsMenu>
                ),
            },
        ];
    }, [onToast, supplierName, supplierId]);

    return (
        <article className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">Documents & compliance</h3>
                    <p className="mt-1 text-xs text-slate-500">Upload certificates and track verification. PDF and images only.</p>
                </div>
                <Button type="button" variant="company" size="cta" className="gap-2" onClick={openCreate}>
                    <LuPlus size={16} /> Upload document
                </Button>
            </div>

            {!compliance.length ? (
                <button
                    type="button"
                    onClick={openCreate}
                    className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center transition hover:border-[color-mix(in_srgb,var(--cta-button-bg)_38%,transparent)] hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]"
                >
                    <LuFileUp className="mb-2 text-slate-400" size={32} />
                    <p className="text-sm font-semibold text-slate-800">No compliance documents yet</p>
                    <p className="mt-1 max-w-md text-xs text-slate-500">Add GST, licenses, and other evidence. Drag-and-drop upload is available in the document modal.</p>
                    <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--cta-button-bg)] px-4 py-2 text-xs font-semibold text-white shadow-sm">
                        Upload your first document
                    </span>
                </button>
            ) : (
                <DataTable<SupplierComplianceRow>
                    columns={columns}
                    data={compliance}
                    getRowId={(r) => r.id}
                    sort={compSort}
                    onSortChange={setCompSort}
                    columnVisibility={compColumnVisibility}
                    columnWidths={compColumnWidths}
                    onColumnWidthsChange={setCompColumnWidths}
                    storageKey={`${supplierId}-supplier-compliance-tab-v2`}
                    stickyColumnId="documentType"
                    emptyMessage="No documents found."
                />
            )}

            <Modal
                isOpen={compEditorOpen}
                onClose={() => setCompEditorOpen(false)}
                title={compEditing ? 'Edit compliance document' : 'Upload compliance document'}
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setCompEditorOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={submitCompliance}>
                            {compEditing ? 'Save changes' : 'Upload'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    {compFormError ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-800">{compFormError}</div>
                    ) : null}

                    {!compEditing ? (
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Document type <span className="text-rose-500">*</span>
                            </label>
                            <select
                                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                value={docTypeSelect}
                                onChange={(e) => setDocTypeSelect(e.target.value)}
                            >
                                {DOCUMENT_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                                <option value="__custom__">Other…</option>
                            </select>
                            {docTypeSelect === '__custom__' ? (
                                <input
                                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                    placeholder="Describe document type"
                                    value={docTypeCustom}
                                    onChange={(e) => setDocTypeCustom(e.target.value)}
                                />
                            ) : null}
                        </div>
                    ) : (
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Document type <span className="text-rose-500">*</span>
                            </label>
                            <input
                                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                value={compForm.documentType}
                                onChange={(e) => setCompForm((f) => ({ ...f, documentType: e.target.value }))}
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                            File <span className="text-rose-500">*</span>
                        </label>
                        <p className="mt-0.5 text-xs text-slate-500">PDF or image files only.</p>
                        <input ref={fileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => void attachFile(e.target.files?.[0])} />
                        <button
                            type="button"
                            onDragEnter={(e) => {
                                e.preventDefault();
                                setDragActive(true);
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                setDragActive(false);
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'copy';
                            }}
                            onDrop={onDropFiles}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                'mt-1.5 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-sm transition',
                                dragActive ? 'border-[color-mix(in_srgb,var(--cta-button-bg)_45%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]' : 'border-slate-200 bg-slate-50/40 hover:border-slate-300',
                            )}
                        >
                            <LuFileUp className="mb-2 text-slate-400" size={28} />
                            <span className="font-semibold text-slate-800">Drag & drop or browse</span>
                            <span className="mt-1 text-xs text-slate-500">{compForm.fileName || 'No file selected'}</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Expiry date</label>
                            <p className="mt-0.5 text-xs text-slate-500">Optional. When set, must be a future date.</p>
                            <input
                                type="date"
                                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                value={compForm.expiryDate}
                                onChange={(e) => setCompForm((f) => ({ ...f, expiryDate: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                                Verification status <span className="text-rose-500">*</span>
                            </label>
                            <select
                                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                value={compForm.verificationStatus}
                                onChange={(e) =>
                                    setCompForm((f) => ({
                                        ...f,
                                        verificationStatus: e.target.value as SupplierComplianceRow['verificationStatus'],
                                    }))
                                }
                            >
                                {(['Pending', 'Verified', 'Rejected'] as const).map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-slate-500">Defaults to Pending for new uploads.</p>
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!previewRow} onClose={() => setPreviewRow(null)} title={previewRow ? previewRow.documentType : 'Preview'} footer={null}>
                {previewRow?.fileUrl ? (
                    <div className="max-h-[70vh] overflow-auto">
                        {previewRow.fileMime?.startsWith('image/') || previewRow.fileUrl.startsWith('data:image/') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img alt={previewRow.fileName} src={previewRow.fileUrl} className="max-h-[65vh] w-full object-contain" />
                        ) : (
                            <iframe title={previewRow.fileName} src={previewRow.fileUrl} className="h-[65vh] w-full rounded-lg border border-slate-200" />
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-slate-600">No file attached for preview. Edit the row to upload a PDF or image.</p>
                )}
            </Modal>
        </article>
    );
}
