'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { CrmFieldProvider, InputField, SelectField, TextAreaField } from '@/components/forms/Fields';
import { EditableField, EditableSelect } from '@/components/leads/detail/InlineEditableSection';
import { WORK_ORDER_INLINE_FIELD_IDS } from '@/components/work-orders/WorkOrderInlineOverviewEditor';
import { FieldRow, InlineCollapsibleSection } from '@/components/work-orders/detail/WorkOrderOverviewSectionKit';
import {
    addWorkOrderProgressUpdate,
    deleteWorkOrderProgressUpdate,
    updateWorkOrderProgressUpdate,
    type PaymentStatus,
    type VerificationStatus,
    type WorkOrder,
    type WorkOrderProgressUpdate,
} from '@/lib/workOrderStore';
import { cn } from '@/lib/utils';
import {
    LuBadgeCheck,
    LuBan,
    LuCircleCheck,
    LuDownload,
    LuFileText,
    LuHistory,
    LuImage,
    LuPaperclip,
    LuPencil,
    LuPlus,
    LuReceipt,
    LuTrash2,
    LuShieldAlert,
} from 'react-icons/lu';

const EMPTY = '—';
const VERIFIED_BY_OPTIONS = ['Company Admin', 'Ops Lead', 'Site Engineer', 'QA Reviewer'] as const;
const fieldGrid = 'grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2';

function formatIso(iso: string) {
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

function formatBytes(bytes: number): string {
    const b = Number.isFinite(bytes) ? bytes : 0;
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(b < 10 * 1024 ? 1 : 0)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('read_failed'));
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.readAsDataURL(file);
    });
}

function verificationBadge(status: VerificationStatus | '') {
    const s = (status || '').toLowerCase();
    const base = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold';
    if (s === 'approved') return cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-800');
    if (s === 'rework needed') return cn(base, 'border-amber-200 bg-amber-50 text-amber-900');
    if (s === 'rejected') return cn(base, 'border-rose-200 bg-rose-50 text-rose-800');
    return cn(base, 'border-slate-200 bg-slate-50 text-slate-700');
}

type PaymentDraft = {
    actualCost: string;
    paymentStatus: PaymentStatus | '';
    invoiceReference: string;
};

type Props = {
    workOrder: WorkOrder;
    isCreate: boolean;
    isEditing: boolean;
    paymentDraft: PaymentDraft;
    paymentError?: string;
    onPaymentDraftChange: (key: keyof PaymentDraft, value: string) => void;
    paymentStatusOptions: PaymentStatus[];
    onBump: () => void;
    onToast: (msg: string, err: boolean) => void;
    onExportRecord: () => void;
    onSaveCompletion: (patch: {
        remarks: string;
        verifiedBy: string;
        verificationStatus: VerificationStatus | '';
    }) => Promise<boolean>;
};

export function WorkOrderOverviewLifecycle({
    workOrder,
    isCreate,
    isEditing,
    paymentDraft,
    paymentError,
    onPaymentDraftChange,
    paymentStatusOptions,
    onBump,
    onToast,
    onExportRecord,
    onSaveCompletion,
}: Props) {
    const [open, setOpen] = useState({
        progressTimeline: true,
        completion: true,
        payment: true,
        documents: false,
    });

    const [progressNotes, setProgressNotes] = useState('');
    const [progressPct, setProgressPct] = useState(0);
    const [progressActor, setProgressActor] = useState('');
    const [progressImages, setProgressImages] = useState<Array<{ id: string; fileName: string; sizeLabel: string; url: string }>>([]);
    const progressImageInputRef = useRef<HTMLInputElement>(null);
    const [previewImage, setPreviewImage] = useState<{ fileName: string; url: string } | null>(null);
    const [progressModalOpen, setProgressModalOpen] = useState(false);
    const [editingProgressId, setEditingProgressId] = useState<string | null>(null);
    const [deleteProgressTarget, setDeleteProgressTarget] = useState<WorkOrderProgressUpdate | null>(null);
    const [verificationModalOpen, setVerificationModalOpen] = useState(false);

    const [completionRemarks, setCompletionRemarks] = useState(() => workOrder.completion?.remarks ?? '');
    const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | ''>(() => workOrder.completion?.verificationStatus ?? '');
    const [verifiedBy, setVerifiedBy] = useState(() => workOrder.completion?.verifiedBy ?? '');

    useEffect(() => {
        setCompletionRemarks(workOrder.completion?.remarks ?? '');
        setVerificationStatus(workOrder.completion?.verificationStatus ?? '');
        setVerifiedBy(workOrder.completion?.verifiedBy ?? '');
    }, [workOrder.completion?.remarks, workOrder.completion?.verificationStatus, workOrder.completion?.verifiedBy]);

    const sortedUpdates = useMemo(
        () => [...(workOrder.progressUpdates ?? [])].sort((a, b) => (a.at < b.at ? 1 : -1)),
        [workOrder.progressUpdates],
    );

    const relatedDocuments = useMemo(() => {
        const attachments = workOrder.attachments ?? [];
        const quote = attachments.find((a) => a.category === 'Agreements' || /quote/i.test(a.fileName));
        const invoiceAtt = attachments.find((a) => /invoice/i.test(a.fileName));
        const completionDoc = attachments.find((a) => a.category === 'Completion Documents');
        const workImages = attachments.filter((a) => a.category === 'Work Images');

        return [
            {
                key: 'wo-pdf',
                label: 'Work Order PDF',
                fileName: `${workOrder.workOrderId}_summary.json`,
                sizeLabel: 'Export',
                available: !isCreate,
                onAction: onExportRecord,
                icon: LuFileText,
            },
            {
                key: 'vendor-quote',
                label: 'Vendor Quote',
                fileName: quote?.fileName ?? (workOrder.vendor?.estimatedCost ? `Quote · ${workOrder.vendor.estimatedCost}` : ''),
                sizeLabel: quote?.sizeLabel ?? (workOrder.vendor?.estimatedCost ? 'Estimated' : ''),
                available: Boolean(quote || workOrder.vendor?.estimatedCost?.trim()),
                icon: LuPaperclip,
            },
            {
                key: 'invoice',
                label: 'Invoice',
                fileName: invoiceAtt?.fileName ?? (workOrder.finance?.invoiceReference?.trim() || ''),
                sizeLabel: invoiceAtt?.sizeLabel ?? (workOrder.finance?.paymentStatus || ''),
                available: Boolean(invoiceAtt || workOrder.finance?.invoiceReference?.trim()),
                icon: LuReceipt,
            },
            {
                key: 'completion-cert',
                label: 'Completion Certificate',
                fileName: completionDoc?.fileName ?? (workOrder.completion?.proofImages?.[0]?.fileName || ''),
                sizeLabel: completionDoc?.sizeLabel ?? (workImages[0]?.sizeLabel || ''),
                available: Boolean(
                    completionDoc ||
                        workOrder.completion?.proofImages?.length ||
                        workOrder.lifecycle?.status === 'Verified' ||
                        workOrder.lifecycle?.status === 'Completed',
                ),
                icon: LuCircleCheck,
            },
        ];
    }, [workOrder, isCreate, onExportRecord]);

    const onProgressImagesChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        const imagesOnly = files.filter((f) => (f.type || '').toLowerCase().startsWith('image/'));
        if (imagesOnly.length !== files.length) onToast('Only image files are allowed for progress proof.', true);
        if (!imagesOnly.length) {
            if (progressImageInputRef.current) progressImageInputRef.current.value = '';
            return;
        }
        try {
            const next = await Promise.all(
                imagesOnly.map(async (file) => ({
                    id: `img-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    fileName: file.name,
                    sizeLabel: formatBytes(file.size),
                    url: await readFileAsDataUrl(file),
                })),
            );
            setProgressImages((prev) => [...prev, ...next]);
        } catch {
            onToast('Could not read one or more images. Please try again.', true);
        } finally {
            if (progressImageInputRef.current) progressImageInputRef.current.value = '';
        }
    };

    const resetProgressForm = () => {
        setProgressNotes('');
        setProgressPct(0);
        setProgressActor('');
        setProgressImages([]);
        setEditingProgressId(null);
        if (progressImageInputRef.current) progressImageInputRef.current.value = '';
    };

    const openProgressModal = () => {
        resetProgressForm();
        setProgressActor(workOrder.vendor?.vendorName ?? '');
        setProgressModalOpen(true);
    };

    const openProgressModalForEdit = (update: WorkOrderProgressUpdate) => {
        setEditingProgressId(update.id);
        setProgressActor(update.actor);
        setProgressNotes(update.notes);
        setProgressPct(update.completionPct);
        setProgressImages(update.images ?? []);
        setProgressModalOpen(true);
    };

    const closeProgressModal = () => {
        setProgressModalOpen(false);
        resetProgressForm();
    };

    const confirmDeleteProgress = () => {
        if (!deleteProgressTarget) return;
        const ok = deleteWorkOrderProgressUpdate(workOrder.slug, deleteProgressTarget.id);
        if (!ok) {
            onToast('Could not delete progress update.', true);
            return;
        }
        setDeleteProgressTarget(null);
        onBump();
        onToast('Progress update deleted.', false);
    };

    const openVerificationModal = () => {
        setCompletionRemarks(workOrder.completion?.remarks ?? '');
        setVerificationStatus(workOrder.completion?.verificationStatus ?? '');
        setVerifiedBy(workOrder.completion?.verifiedBy ?? '');
        setVerificationModalOpen(true);
    };

    const closeVerificationModal = () => {
        setVerificationModalOpen(false);
    };

    const saveProgressUpdate = () => {
        if (!progressNotes.trim()) {
            onToast('Progress notes are required.', true);
            return;
        }
        const payload = {
            actor: progressActor.trim() || workOrder.vendor.vendorName || 'Vendor',
            notes: progressNotes.trim(),
            completionPct: progressPct,
            images: progressImages,
        };
        const isEdit = Boolean(editingProgressId);
        const saved = isEdit
            ? updateWorkOrderProgressUpdate(workOrder.slug, editingProgressId!, payload)
            : addWorkOrderProgressUpdate(workOrder.slug, payload);
        if (!saved) {
            onToast('Could not save progress update.', true);
            return;
        }
        closeProgressModal();
        onBump();
        onToast(isEdit ? 'Progress update saved.' : 'Progress update added.', false);
    };

    const progressModalTitle = editingProgressId ? 'Edit progress update' : 'Add progress update';

    const saveCompletion = async () => {
        if (verificationStatus && !verifiedBy.trim()) {
            onToast('Verified By is required when setting verification status.', true);
            return;
        }
        const ok = await onSaveCompletion({
            remarks: completionRemarks.trim(),
            verifiedBy: verifiedBy.trim(),
            verificationStatus,
        });
        if (ok) {
            closeVerificationModal();
            onToast('Completion verification updated.', false);
        }
    };

    const completionTableRow = useMemo(
        () => ({
            id: workOrder.slug,
            completionDate: workOrder.completion?.completionDate?.trim() || EMPTY,
            verifiedBy: workOrder.completion?.verifiedBy?.trim() || EMPTY,
            verificationStatus: workOrder.completion?.verificationStatus ?? '',
            remarks: workOrder.completion?.remarks?.trim() || 'No comments yet.',
        }),
        [workOrder],
    );

    if (isCreate) {
        return (
            <div className="w-full space-y-4">
                {['Progress Timeline', 'Completion & Verification', 'Payment Details', 'Related Documents'].map((title) => (
                    <div key={title} className="rounded-xl border border-dashed border-slate-200 bg-white/80 px-4 py-6 text-center">
                        <p className="text-sm font-semibold text-slate-800">{title}</p>
                        <p className="mt-1 text-sm text-slate-500">Available after the vendor assignment is created.</p>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <InlineCollapsibleSection
                title="PROGRESS TIMELINE"
                icon={LuHistory}
                tone="slate"
                sectionId="wf-wo-progress"
                open={open.progressTimeline}
                onOpenChange={(o) => setOpen((s) => ({ ...s, progressTimeline: o }))}
                headerRight={
                    <Button type="button" variant="companyOutline" size="sm" className="h-8 gap-1.5 bg-white" onClick={openProgressModal}>
                        <LuPlus size={14} />
                        Add update
                    </Button>
                }
            >
                <div className="p-4">
                    <Table
                        rowKey="id"
                        data={sortedUpdates}
                        renderExpandedRow={(u) => (
                            <div className="space-y-3 px-6 py-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Progress notes</p>
                                <p className="whitespace-pre-wrap text-sm text-slate-700">{u.notes}</p>
                                {u.images?.length ? (
                                    <>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Work photos</p>
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                            {u.images
                                                .filter((img: { url?: string }) => img.url?.trim())
                                                .map((img: { id: string; fileName: string; url: string }) => (
                                                    <button
                                                        key={img.id}
                                                        type="button"
                                                        className="overflow-hidden rounded-lg border border-slate-200 bg-white text-left"
                                                        onClick={() => setPreviewImage({ fileName: img.fileName, url: img.url })}
                                                    >
                                                        <img src={img.url} alt={img.fileName} className="h-20 w-full object-cover" />
                                                        <p className="truncate px-2 py-1 text-xs font-medium text-slate-600">{img.fileName}</p>
                                                    </button>
                                                ))}
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        )}
                        columns={[
                            {
                                key: 'at',
                                header: 'Date',
                                render: (u) => <span className="font-medium text-slate-800">{formatIso(u.at)}</span>,
                            },
                            {
                                key: 'actor',
                                header: 'Vendor / User',
                                render: (u) => <span className="font-semibold text-slate-900">{u.actor}</span>,
                            },
                            {
                                key: 'completionPct',
                                header: 'Completion %',
                                className: 'text-center',
                                render: (u) => (
                                    <span className="inline-flex rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-800">
                                        {u.completionPct}%
                                    </span>
                                ),
                            },
                            {
                                key: 'notes',
                                header: 'Notes',
                                render: (u) => (
                                    <span className="line-clamp-2 max-w-md text-slate-600" title={u.notes}>
                                        {u.notes}
                                    </span>
                                ),
                            },
                            {
                                key: 'images',
                                header: 'Photos',
                                className: 'text-center',
                                render: (u) => (
                                    <span className="text-sm font-medium text-slate-700">{u.images?.length ?? 0}</span>
                                ),
                            },
                            {
                                key: 'actions',
                                header: 'Actions',
                                className: 'text-right',
                                render: (u) => (
                                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            title="Edit update"
                                            aria-label="Edit progress update"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] hover:text-[var(--cta-button-bg)]"
                                            onClick={() => openProgressModalForEdit(u)}
                                        >
                                            <LuPencil size={15} />
                                        </button>
                                        <button
                                            type="button"
                                            title="Delete update"
                                            aria-label="Delete progress update"
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                                            onClick={() => setDeleteProgressTarget(u)}
                                        >
                                            <LuTrash2 size={15} />
                                        </button>
                                    </div>
                                ),
                            },
                        ]}
                    />
                    {!sortedUpdates.length ? (
                        <p className="mt-3 text-center text-sm text-slate-500">No progress updates yet. Use &quot;Add update&quot; to log vendor progress.</p>
                    ) : null}
                </div>
            </InlineCollapsibleSection>

            <InlineCollapsibleSection
                title="COMPLETION & VERIFICATION"
                icon={LuCircleCheck}
                tone="emerald"
                sectionId="wf-wo-completion"
                open={open.completion}
                onOpenChange={(o) => setOpen((s) => ({ ...s, completion: o }))}
                headerRight={
                    <Button type="button" variant="companyOutline" size="sm" className="h-8 gap-1.5 bg-white" onClick={openVerificationModal}>
                        <LuPencil size={14} />
                        Update verification
                    </Button>
                }
            >
                <div className="p-4">
                    <Table
                        rowKey="id"
                        data={[completionTableRow]}
                        columns={[
                            {
                                key: 'completionDate',
                                header: 'Completion Date',
                                render: (row) => <span className="font-medium text-slate-800">{row.completionDate}</span>,
                            },
                            {
                                key: 'verifiedBy',
                                header: 'Verified By',
                                render: (row) => <span className="font-medium text-slate-800">{row.verifiedBy}</span>,
                            },
                            {
                                key: 'verificationStatus',
                                header: 'Verification Status',
                                render: (row) => (
                                    <span className={verificationBadge(row.verificationStatus)}>
                                        {row.verificationStatus === 'Approved' ? (
                                            <LuBadgeCheck size={14} aria-hidden />
                                        ) : row.verificationStatus === 'Rework Needed' ? (
                                            <LuShieldAlert size={14} aria-hidden />
                                        ) : row.verificationStatus === 'Rejected' ? (
                                            <LuBan size={14} aria-hidden />
                                        ) : null}
                                        {row.verificationStatus?.trim() ? row.verificationStatus : 'Not verified'}
                                    </span>
                                ),
                            },
                            {
                                key: 'remarks',
                                header: 'Remarks / Comments',
                                render: (row) => (
                                    <span className="line-clamp-2 max-w-lg text-slate-600" title={row.remarks}>
                                        {row.remarks}
                                    </span>
                                ),
                            },
                        ]}
                    />
                </div>
            </InlineCollapsibleSection>

            <InlineCollapsibleSection
                title="PAYMENT DETAILS"
                icon={LuReceipt}
                tone="slate"
                open={open.payment}
                onOpenChange={(o) => setOpen((s) => ({ ...s, payment: o }))}
                sectionId="wf-wo-payment"
            >
                <div className={cn(fieldGrid, 'm-4')}>
                    <FieldRow label="Actual Cost">
                        <EditableField
                            isEditing={isEditing}
                            value={paymentDraft.actualCost}
                            onChange={(v) => onPaymentDraftChange('actualCost', v)}
                            readValue={workOrder.finance?.actualCost?.trim() || EMPTY}
                        />
                    </FieldRow>
                    <FieldRow label="Invoice Reference">
                        <EditableField
                            isEditing={isEditing}
                            value={paymentDraft.invoiceReference}
                            onChange={(v) => onPaymentDraftChange('invoiceReference', v)}
                            readValue={workOrder.finance?.invoiceReference?.trim() || EMPTY}
                        />
                    </FieldRow>
                    <FieldRow label="Payment Status" required>
                        <EditableSelect
                            id={WORK_ORDER_INLINE_FIELD_IDS.paymentStatus}
                            isEditing={isEditing}
                            error={paymentError}
                            value={paymentDraft.paymentStatus}
                            onChange={(v) => onPaymentDraftChange('paymentStatus', v)}
                            placeholder="Select payment status"
                            options={paymentStatusOptions}
                            readValue={workOrder.finance?.paymentStatus || EMPTY}
                        />
                    </FieldRow>
                </div>
            </InlineCollapsibleSection>

            <InlineCollapsibleSection
                title="RELATED DOCUMENTS"
                icon={LuPaperclip}
                tone="slate"
                open={open.documents}
                onOpenChange={(o) => setOpen((s) => ({ ...s, documents: o }))}
            >
                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                    {relatedDocuments.map((doc) => (
                        <div
                            key={doc.key}
                            className={cn(
                                'flex items-start gap-3 rounded-xl border px-4 py-3 transition',
                                doc.available ? 'border-slate-200 bg-white hover:bg-slate-50/60' : 'border-dashed border-slate-200 bg-slate-50/40 opacity-70',
                            )}
                        >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                <doc.icon size={18} aria-hidden />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900">{doc.label}</p>
                                <p className="mt-0.5 truncate text-xs text-slate-600">{doc.available ? doc.fileName || 'On file' : 'Not uploaded yet'}</p>
                                {doc.sizeLabel ? <p className="text-[11px] font-medium text-slate-400">{doc.sizeLabel}</p> : null}
                            </div>
                            {doc.key === 'wo-pdf' && doc.available ? (
                                <Button type="button" variant="companyOutline" size="sm" className="shrink-0 gap-1.5" onClick={doc.onAction}>
                                    <LuDownload size={14} />
                                    Export
                                </Button>
                            ) : null}
                        </div>
                    ))}
                </div>
            </InlineCollapsibleSection>

            <Modal
                isOpen={progressModalOpen}
                onClose={closeProgressModal}
                title={progressModalTitle}
                placement="top"
                maxWidthClassName="max-w-xl"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={closeProgressModal}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={saveProgressUpdate}>
                            {editingProgressId ? 'Save changes' : 'Save update'}
                        </Button>
                    </>
                }
            >
                <CrmFieldProvider>
                    <div className="space-y-4">
                        <InputField
                            label="Vendor / User"
                            value={progressActor}
                            onChange={(e) => setProgressActor(e.target.value)}
                            placeholder={workOrder.vendor?.vendorName || 'Vendor'}
                        />
                        <TextAreaField
                            label="Progress notes"
                            value={progressNotes}
                            onChange={(e) => setProgressNotes(e.target.value)}
                            placeholder="What was done today? Any blockers?"
                        />
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Progress images</label>
                            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <input
                                        ref={progressImageInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(ev) => void onProgressImagesChosen(ev)}
                                        className="hidden"
                                        id="wo-overview-progress-images"
                                    />
                                    <Button
                                        type="button"
                                        variant="companyOutline"
                                        size="sm"
                                        className="h-9 gap-2 bg-white"
                                        onClick={() => progressImageInputRef.current?.click()}
                                    >
                                        <LuImage size={16} />
                                        Upload images
                                    </Button>
                                    {progressImages.length ? (
                                        <Button type="button" variant="companyGhost" size="sm" className="h-9" onClick={() => setProgressImages([])}>
                                            Clear
                                        </Button>
                                    ) : null}
                                </div>
                                {progressImages.length ? (
                                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        {progressImages.map((img) => (
                                            <div key={img.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                                <img src={img.url} alt={img.fileName} className="h-20 w-full object-cover" />
                                                <p className="truncate px-2 py-1 text-xs font-medium text-slate-600">{img.fileName}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-900">Completion percentage</p>
                                <span className="rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-800">
                                    {progressPct}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={progressPct}
                                onChange={(e) => setProgressPct(Number(e.target.value) || 0)}
                                className="mt-3 w-full accent-[var(--cta-button-bg)]"
                            />
                        </div>
                    </div>
                </CrmFieldProvider>
            </Modal>

            <Modal
                isOpen={Boolean(deleteProgressTarget)}
                onClose={() => setDeleteProgressTarget(null)}
                title="Delete progress update"
                maxWidthClassName="max-w-md"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setDeleteProgressTarget(null)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" className="bg-rose-600 hover:bg-rose-700" onClick={confirmDeleteProgress}>
                            Delete
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Remove this progress entry from{' '}
                    <span className="font-semibold text-slate-900">{workOrder.workOrderId}</span>? This cannot be undone.
                </p>
                {deleteProgressTarget ? (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">{deleteProgressTarget.completionPct}% · {deleteProgressTarget.actor}</p>
                        <p className="mt-1 line-clamp-2 text-slate-600">{deleteProgressTarget.notes}</p>
                    </div>
                ) : null}
            </Modal>

            <Modal
                isOpen={verificationModalOpen}
                onClose={closeVerificationModal}
                title="Update completion & verification"
                placement="top"
                maxWidthClassName="max-w-xl"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={closeVerificationModal}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={() => void saveCompletion()}>
                            Save verification
                        </Button>
                    </>
                }
            >
                <CrmFieldProvider>
                    <div className="space-y-4">
                        <InputField
                            type="date"
                            label="Completion Date"
                            value={workOrder.completion?.completionDate ?? ''}
                            disabled
                            readOnly
                        />
                        <SelectField
                            label="Verified By"
                            value={verifiedBy}
                            options={[...VERIFIED_BY_OPTIONS]}
                            onChange={(e) => setVerifiedBy(e.target.value)}
                        />
                        <SelectField
                            label="Verification Status"
                            options={['', 'Approved', 'Rework Needed', 'Rejected']}
                            value={verificationStatus}
                            onChange={(e) => setVerificationStatus(e.target.value as VerificationStatus | '')}
                        />
                        <TextAreaField
                            label="Remarks / Comments"
                            value={completionRemarks}
                            onChange={(e) => setCompletionRemarks(e.target.value)}
                            placeholder="Verification remarks, rework notes, or approval comments…"
                        />
                    </div>
                </CrmFieldProvider>
            </Modal>

            <Modal
                isOpen={Boolean(previewImage)}
                onClose={() => setPreviewImage(null)}
                title={previewImage?.fileName ?? 'Image preview'}
                maxWidthClassName="max-w-3xl"
                footer={
                    <Button type="button" variant="company" size="cta" onClick={() => setPreviewImage(null)}>
                        Done
                    </Button>
                }
            >
                {previewImage?.url ? (
                    <img src={previewImage.url} alt={previewImage.fileName} className="max-h-[60vh] w-full rounded-lg object-contain bg-slate-50" />
                ) : (
                    <p className="text-sm text-slate-600">No preview available.</p>
                )}
            </Modal>
        </div>
    );
}
