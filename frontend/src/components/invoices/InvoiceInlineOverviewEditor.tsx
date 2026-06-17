'use client';

import React from 'react';
import {
    EditableDate,
    EditableField,
    EditableSelect,
} from '@/components/leads/detail/InlineEditableSection';
import { cn } from '@/lib/utils';
import {
    formatInvoiceCode,
    formatMoney,
    getNextInvoiceCode,
    type Invoice,
    type InvoiceAttachment,
    type InvoiceAttachmentCategory,
    type InvoiceCurrency,
    type InvoicePartyType,
    type InvoicePaymentMode,
    type InvoicePaymentStatus,
} from '@/lib/invoiceStore';
import type {
    ProcurementChargesDraft,
    ProcurementInvoiceBillingBundle,
    ProcurementMaterialDraft,
} from '@/lib/procurement/procurementInvoiceBilling';
import { ProcurementSupplierInvoiceBillingSections } from '@/components/invoices/ProcurementSupplierInvoiceBilling';
import {
    LuBuilding2,
    LuChevronDown,
    LuCircleDollarSign,
    LuDownload,
    LuExternalLink,
    LuFileText,
    LuImage,
    LuNotebookPen,
    LuPaperclip,
    LuReceipt,
    LuTrash2,
    LuTruck,
    LuUpload,
    LuWallet,
} from 'react-icons/lu';

const EMPTY = '—';

type InlineErrorKey =
    | 'invoiceNumber'
    | 'companyName'
    | 'partyName'
    | 'linkedProject'
    | 'invoiceDate'
    | 'dueDate'
    | 'invoiceAmount'
    | 'totalAmount'
    | 'assignedFinanceUser';

export const INVOICE_INLINE_FIELD_IDS: Record<InlineErrorKey, string> = {
    invoiceNumber: 'inv-inline-invoice-number',
    companyName: 'inv-inline-company-name',
    partyName: 'inv-inline-party-name',
    linkedProject: 'inv-inline-linked-project',
    invoiceDate: 'inv-inline-invoice-date',
    dueDate: 'inv-inline-due-date',
    invoiceAmount: 'inv-inline-invoice-amount',
    totalAmount: 'inv-inline-total-amount',
    assignedFinanceUser: 'inv-inline-finance-user',
};

/** Attachment item being uploaded in create mode (before the invoice has a slug). */
export type PendingInvoiceAttachment = {
    pendingId: string;
    category: InvoiceAttachmentCategory;
    fileName: string;
    sizeLabel: string;
    mimeType: string;
    /** Data URL (base64) used for preview, download, and final persistence. */
    url: string;
};

export type InvoiceOverviewDraft = {
    invoiceNumber: string;
    companyName: string;
    partyType: InvoicePartyType;
    partyName: string;

    linkedProject: string;
    linkedWorkOrderId: string;
    linkedPurchaseOrder: string;
    linkedPrSlug: string;
    linkedPrNumber: string;

    invoiceDate: string;
    dueDate: string;

    currency: InvoiceCurrency;
    invoiceAmount: string;
    taxAmount: string;
    totalAmount: string;
    notes: string;

    paidAmount: string;
    paymentStatus: InvoicePaymentStatus;
    primaryPaymentMode: InvoicePaymentMode | '';
    primaryTransactionRef: string;

    assignedFinanceUser: string;
};

function FieldRow({
    label,
    required,
    children,
    className,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex w-full items-center gap-3 border-b border-gray-200/80 px-3 py-2.5 odd:bg-gray-50/50', className)}>
            <div className="w-44 shrink-0 text-sm font-medium text-gray-500">
                <span className="inline-flex items-baseline gap-0.5">
                    {label}
                    {required ? (
                        <span className="text-rose-500" aria-hidden>
                            *
                        </span>
                    ) : null}
                </span>
            </div>
            <div className="flex w-full items-center gap-2 text-[15px] font-medium text-gray-900">
                <span className="text-gray-300" aria-hidden>
                    :
                </span>
                <span className="w-full">{children}</span>
            </div>
        </div>
    );
}

function InlineCollapsibleSection({
    title,
    icon: Icon,
    tone = 'slate',
    open,
    onOpenChange,
    headerRight,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    tone?: 'blue' | 'amber' | 'slate' | 'emerald';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    headerRight?: React.ReactNode;
    children: React.ReactNode;
}) {
    const toneClasses =
        tone === 'blue'
            ? { head: 'bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]', icon: 'text-[var(--cta-button-bg)]', ring: 'ring-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]' }
            : tone === 'amber'
              ? { head: 'bg-amber-50/80', icon: 'text-amber-800', ring: 'ring-amber-100/80' }
              : tone === 'emerald'
                ? { head: 'bg-emerald-50/80', icon: 'text-emerald-800', ring: 'ring-emerald-100/80' }
                : { head: 'bg-slate-50/80', icon: 'text-slate-700', ring: 'ring-slate-200/70' };

    return (
        <section className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-none">
            <button
                type="button"
                onClick={() => onOpenChange(!open)}
                aria-expanded={open}
                className={cn(
                    'flex w-full items-center gap-2.5 border-b border-gray-300 px-3 py-2 text-left transition hover:brightness-[0.99]',
                    toneClasses.head,
                )}
            >
                <span
                    className={cn(
                        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/90 ring-1',
                        toneClasses.ring,
                    )}
                    aria-hidden
                >
                    <Icon className={cn('h-4 w-4', toneClasses.icon)} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-semibold tracking-wide text-gray-800">{title}</span>
                        {headerRight ? <span className="ml-auto shrink-0">{headerRight}</span> : null}
                    </span>
                </span>
                <LuChevronDown
                    className={cn('h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200', open && 'rotate-180')}
                    aria-hidden
                />
            </button>
            <div hidden={!open} className="bg-white">
                {children}
            </div>
        </section>
    );
}

export function InvoiceInlineOverviewEditor({
    invoice,
    isEditing,
    draft,
    errors,
    onDraftChange,
    counterpartyOptions,
    projectOptions,
    workOrderOptions,
    financeUserOptions,
    currencyOptions,
    partyTypeOptions,
    paymentStatusOptions,
    paymentModeOptions,
    purchaseOrderOptions = [],
    linkedPrNumber = '',
    isCreateMode = false,
    pendingAttachments = [],
    onUploadFiles,
    onRemoveAttachment,
    onRemovePendingAttachment,
    onPreviewAttachment,
    procurementBilling = null,
    procurementMaterialDrafts,
    onProcurementMaterialDraftsChange,
    procurementCharges,
    onProcurementChargesChange,
}: {
    invoice: Invoice;
    isEditing: boolean;
    draft: InvoiceOverviewDraft;
    errors: Partial<Record<InlineErrorKey, string>>;
    onDraftChange: (key: keyof InvoiceOverviewDraft, value: string) => void;
    counterpartyOptions: { name: string; type: InvoicePartyType }[];
    projectOptions: string[];
    workOrderOptions: string[];
    financeUserOptions: string[];
    currencyOptions: InvoiceCurrency[];
    partyTypeOptions: InvoicePartyType[];
    paymentStatusOptions: InvoicePaymentStatus[];
    paymentModeOptions: InvoicePaymentMode[];
    /** True when no invoice slug exists yet — uploads accumulate as pending. */
    purchaseOrderOptions?: { value: string; label: string }[];
    linkedPrNumber?: string;
    isCreateMode?: boolean;
    pendingAttachments?: PendingInvoiceAttachment[];
    onUploadFiles?: (files: File[]) => void | Promise<void>;
    onRemoveAttachment?: (attachmentId: string) => void;
    onRemovePendingAttachment?: (pendingId: string) => void;
    onPreviewAttachment?: (attachment: { fileName: string; url: string; mimeType: string }) => void;
    procurementBilling?: ProcurementInvoiceBillingBundle | null;
    procurementMaterialDrafts?: ProcurementMaterialDraft[];
    onProcurementMaterialDraftsChange?: (rows: ProcurementMaterialDraft[]) => void;
    procurementCharges?: ProcurementChargesDraft;
    onProcurementChargesChange?: (charges: ProcurementChargesDraft) => void;
}) {
    const fieldGrid = 'grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2';
    const [open, setOpen] = React.useState({ info: true, payment: true, attachments: true, notes: true });
    const [attentionFieldId, setAttentionFieldId] = React.useState<string | null>(null);

    const invoiceCode = invoice.id > 0 ? invoice.invoiceId : getNextInvoiceCode();

    const infoReq = (['invoiceNumber', 'companyName', 'partyName', 'linkedProject', 'invoiceDate', 'dueDate', 'invoiceAmount', 'totalAmount', 'assignedFinanceUser'] as InlineErrorKey[]).filter(
        (k) => Boolean(errors[k]),
    ).length;

    /** Counterparty options filtered by chosen party type. */
    const filteredCounterparties = React.useMemo(() => {
        return counterpartyOptions.filter((c) => c.type === draft.partyType).map((c) => c.name);
    }, [counterpartyOptions, draft.partyType]);

    /** Derived total preview for read mode. */
    const totalPreview = React.useMemo(() => {
        const ia = Number(draft.invoiceAmount) || 0;
        const ta = Number(draft.taxAmount) || 0;
        return ia + ta;
    }, [draft.invoiceAmount, draft.taxAmount]);

    const balancePreview = React.useMemo(() => {
        const t = Number(draft.totalAmount) || 0;
        const p = Number(draft.paidAmount) || 0;
        return Math.max(0, t - p);
    }, [draft.totalAmount, draft.paidAmount]);

    const isSupplierInvoice = draft.partyType === 'Supplier' || invoice.partyType === 'Supplier';

    const scrollFocusAttention = React.useCallback((fieldId: string) => {
        if (typeof window === 'undefined') return;
        const el = document.getElementById(fieldId);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => {
            try {
                (el as HTMLElement).focus?.();
            } catch {
                /* ignore */
            }
        }, 220);
        setAttentionFieldId(fieldId);
        window.setTimeout(() => setAttentionFieldId((prev) => (prev === fieldId ? null : prev)), 1400);
    }, []);

    React.useEffect(() => {
        if (!isEditing) return;
        const keys = Object.keys(errors ?? {}) as InlineErrorKey[];
        if (keys.length === 0) return;
        const ORDER: InlineErrorKey[] = [
            'invoiceNumber',
            'companyName',
            'partyName',
            'linkedProject',
            'invoiceDate',
            'dueDate',
            'invoiceAmount',
            'totalAmount',
            'assignedFinanceUser',
        ];
        const first = ORDER.find((k) => Boolean(errors[k])) ?? keys[0];
        if (!first) return;
        setOpen((s) => ({ ...s, info: true }));
        const fid = INVOICE_INLINE_FIELD_IDS[first];
        if (fid) scrollFocusAttention(fid);
    }, [errors, isEditing, scrollFocusAttention]);

    return (
        <div className={cn('flex min-h-0 flex-1 flex-col', isEditing && 'border-none shadow-none')}>
            <div className="min-h-0 flex-1">
                <div className="space-y-4">
                    {/* ------------------------------------------------------------------ */}
                    {/*  Section 1: Invoice Information                                     */}
                    {/* ------------------------------------------------------------------ */}
                    <InlineCollapsibleSection
                        title="INVOICE INFORMATION"
                        icon={LuReceipt}
                        tone="blue"
                        open={open.info}
                        onOpenChange={(o) => setOpen((s) => ({ ...s, info: o }))}
                        headerRight={
                            isEditing && infoReq > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {infoReq} field{infoReq === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className={fieldGrid}>
                            <FieldRow label="Invoice ID">
                                <span className="font-mono text-sm tracking-tight text-gray-900">{invoiceCode || EMPTY}</span>
                            </FieldRow>
                            <FieldRow label="Invoice Number" required>
                                <EditableField
                                    id={INVOICE_INLINE_FIELD_IDS.invoiceNumber}
                                    isEditing={isEditing}
                                    error={errors.invoiceNumber}
                                    className={cn(
                                        attentionFieldId === INVOICE_INLINE_FIELD_IDS.invoiceNumber &&
                                            'rounded-md ring-2 ring-rose-500/25 animate-pulse',
                                    )}
                                    value={draft.invoiceNumber}
                                    onChange={(v) => onDraftChange('invoiceNumber', v)}
                                    placeholder="e.g. VD-2014"
                                    readValue={
                                        invoice.invoiceNumber?.trim() ? (
                                            <span className="text-base font-semibold text-gray-900">{invoice.invoiceNumber}</span>
                                        ) : (
                                            EMPTY
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Company Name" required>
                                <EditableField
                                    id={INVOICE_INLINE_FIELD_IDS.companyName}
                                    isEditing={isEditing}
                                    error={errors.companyName}
                                    className={cn(
                                        attentionFieldId === INVOICE_INLINE_FIELD_IDS.companyName &&
                                            'rounded-md ring-2 ring-rose-500/25 animate-pulse',
                                    )}
                                    value={draft.companyName}
                                    onChange={(v) => onDraftChange('companyName', v)}
                                    placeholder="Buying / paying company"
                                    readValue={invoice.companyName?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Counterparty Type" required>
                                <EditableSelect
                                    isEditing={isEditing}
                                    value={draft.partyType}
                                    onChange={(v) => onDraftChange('partyType', v)}
                                    options={partyTypeOptions}
                                    placeholder="Select"
                                    readValue={invoice.partyType || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Vendor / Supplier" required>
                                <EditableSelect
                                    id={INVOICE_INLINE_FIELD_IDS.partyName}
                                    isEditing={isEditing}
                                    error={errors.partyName}
                                    className={cn(
                                        attentionFieldId === INVOICE_INLINE_FIELD_IDS.partyName &&
                                            'rounded-md ring-2 ring-rose-500/25 animate-pulse',
                                    )}
                                    value={draft.partyName}
                                    onChange={(v) => onDraftChange('partyName', v)}
                                    placeholder={`Select ${draft.partyType.toLowerCase()}`}
                                    options={filteredCounterparties}
                                    readValue={invoice.partyName?.trim() ? (
                                        <span className="inline-flex items-center gap-2">
                                            <LuTruck size={14} className="text-slate-400" aria-hidden />
                                            <span className="font-semibold text-gray-900">{invoice.partyName}</span>
                                        </span>
                                    ) : EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Linked Project" required>
                                <EditableSelect
                                    id={INVOICE_INLINE_FIELD_IDS.linkedProject}
                                    isEditing={isEditing}
                                    error={errors.linkedProject}
                                    className={cn(
                                        attentionFieldId === INVOICE_INLINE_FIELD_IDS.linkedProject &&
                                            'rounded-md ring-2 ring-rose-500/25 animate-pulse',
                                    )}
                                    value={draft.linkedProject}
                                    onChange={(v) => onDraftChange('linkedProject', v)}
                                    placeholder="Select project"
                                    options={projectOptions}
                                    readValue={invoice.linkedProject?.trim() ? (
                                        <span className="inline-flex items-center gap-2">
                                            <LuBuilding2 size={14} className="text-slate-400" aria-hidden />
                                            <span className="font-semibold text-gray-900">{invoice.linkedProject}</span>
                                        </span>
                                    ) : EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Linked Work Order">
                                <EditableSelect
                                    isEditing={isEditing}
                                    value={draft.linkedWorkOrderId}
                                    onChange={(v) => onDraftChange('linkedWorkOrderId', v)}
                                    placeholder="Link work order (optional)"
                                    options={['', ...workOrderOptions]}
                                    readValue={invoice.linkedWorkOrderId?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Linked Purchase Order">
                                {purchaseOrderOptions.length > 0 ? (
                                    <EditableSelect
                                        isEditing={isEditing}
                                        value={draft.linkedPurchaseOrder.split(',')[0]?.trim() ?? draft.linkedPurchaseOrder}
                                        onChange={(v) => onDraftChange('linkedPurchaseOrder', v)}
                                        placeholder="Select purchase order"
                                        options={purchaseOrderOptions.map((o) => o.value)}
                                        readValue={
                                            draft.linkedPurchaseOrder?.trim() ? (
                                                <span className="font-mono text-sm font-semibold text-gray-900">{draft.linkedPurchaseOrder}</span>
                                            ) : (
                                                EMPTY
                                            )
                                        }
                                    />
                                ) : (
                                    <EditableField
                                        isEditing={isEditing}
                                        value={draft.linkedPurchaseOrder}
                                        onChange={(v) => onDraftChange('linkedPurchaseOrder', v)}
                                        placeholder="e.g. PO-2026-1001"
                                        readValue={invoice.linkedPurchaseOrder?.trim() || EMPTY}
                                    />
                                )}
                            </FieldRow>
                            {linkedPrNumber?.trim() ? (
                                <FieldRow label="Linked PR">
                                    <span className="font-mono text-sm font-semibold text-gray-900">{linkedPrNumber}</span>
                                </FieldRow>
                            ) : null}
                            <FieldRow label="Invoice Date" required>
                                <EditableDate
                                    id={INVOICE_INLINE_FIELD_IDS.invoiceDate}
                                    isEditing={isEditing}
                                    error={errors.invoiceDate}
                                    className={cn(
                                        attentionFieldId === INVOICE_INLINE_FIELD_IDS.invoiceDate &&
                                            'rounded-md ring-2 ring-rose-500/25 animate-pulse',
                                    )}
                                    value={draft.invoiceDate}
                                    onChange={(v) => onDraftChange('invoiceDate', v)}
                                    readValue={invoice.invoiceDate?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Due Date" required>
                                <EditableDate
                                    id={INVOICE_INLINE_FIELD_IDS.dueDate}
                                    isEditing={isEditing}
                                    error={errors.dueDate}
                                    className={cn(
                                        attentionFieldId === INVOICE_INLINE_FIELD_IDS.dueDate &&
                                            'rounded-md ring-2 ring-rose-500/25 animate-pulse',
                                    )}
                                    value={draft.dueDate}
                                    onChange={(v) => onDraftChange('dueDate', v)}
                                    readValue={invoice.dueDate?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Currency">
                                <EditableSelect
                                    isEditing={isEditing}
                                    value={draft.currency}
                                    onChange={(v) => onDraftChange('currency', v)}
                                    options={currencyOptions}
                                    readValue={invoice.currency || 'INR'}
                                />
                            </FieldRow>
                            <FieldRow label="Invoice Amount" required>
                                <EditableField
                                    id={INVOICE_INLINE_FIELD_IDS.invoiceAmount}
                                    isEditing={isEditing}
                                    error={errors.invoiceAmount}
                                    type="text"
                                    className={cn(
                                        attentionFieldId === INVOICE_INLINE_FIELD_IDS.invoiceAmount &&
                                            'rounded-md ring-2 ring-rose-500/25 animate-pulse',
                                    )}
                                    value={draft.invoiceAmount}
                                    onChange={(v) => onDraftChange('invoiceAmount', v.replace(/[^\d.]/g, ''))}
                                    placeholder="0"
                                    readValue={
                                        Number(invoice.invoiceAmount) > 0
                                            ? formatMoney(Number(invoice.invoiceAmount), invoice.currency)
                                            : EMPTY
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Tax Amount">
                                <EditableField
                                    isEditing={isEditing}
                                    type="text"
                                    value={draft.taxAmount}
                                    onChange={(v) => onDraftChange('taxAmount', v.replace(/[^\d.]/g, ''))}
                                    placeholder="0"
                                    readValue={
                                        Number(invoice.taxAmount) > 0
                                            ? formatMoney(Number(invoice.taxAmount), invoice.currency)
                                            : EMPTY
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Total Amount" required>
                                <EditableField
                                    id={INVOICE_INLINE_FIELD_IDS.totalAmount}
                                    isEditing={isEditing}
                                    error={errors.totalAmount}
                                    type="text"
                                    className={cn(
                                        attentionFieldId === INVOICE_INLINE_FIELD_IDS.totalAmount &&
                                            'rounded-md ring-2 ring-rose-500/25 animate-pulse',
                                    )}
                                    value={draft.totalAmount}
                                    onChange={(v) => onDraftChange('totalAmount', v.replace(/[^\d.]/g, ''))}
                                    placeholder={String(totalPreview || '0')}
                                    readValue={
                                        Number(invoice.totalAmount) > 0 ? (
                                            <span className="inline-flex items-center gap-2">
                                                <LuCircleDollarSign size={14} className="text-slate-400" aria-hidden />
                                                <span className="font-semibold text-gray-900">
                                                    {formatMoney(Number(invoice.totalAmount), invoice.currency)}
                                                </span>
                                            </span>
                                        ) : (
                                            EMPTY
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Assigned Finance User" required>
                                <EditableSelect
                                    id={INVOICE_INLINE_FIELD_IDS.assignedFinanceUser}
                                    isEditing={isEditing}
                                    error={errors.assignedFinanceUser}
                                    className={cn(
                                        attentionFieldId === INVOICE_INLINE_FIELD_IDS.assignedFinanceUser &&
                                            'rounded-md ring-2 ring-rose-500/25 animate-pulse',
                                    )}
                                    value={draft.assignedFinanceUser}
                                    onChange={(v) => onDraftChange('assignedFinanceUser', v)}
                                    placeholder="Select user"
                                    options={financeUserOptions}
                                    readValue={invoice.assignedFinanceUser?.trim() || EMPTY}
                                />
                            </FieldRow>
                        </div>
                    </InlineCollapsibleSection>

                    {isSupplierInvoice && procurementBilling ? (
                        <ProcurementSupplierInvoiceBillingSections
                            invoice={invoice}
                            billing={procurementBilling}
                            currency={draft.currency || invoice.currency}
                            isEditing={isEditing}
                            materialDrafts={procurementMaterialDrafts}
                            onMaterialDraftsChange={onProcurementMaterialDraftsChange}
                            charges={procurementCharges}
                            onChargesChange={onProcurementChargesChange}
                        />
                    ) : null}

                    {/* ------------------------------------------------------------------ */}
                    {/*  Section 2: Payment Summary                                         */}
                    {/* ------------------------------------------------------------------ */}
                    <InlineCollapsibleSection
                        title="PAYMENT SUMMARY"
                        icon={LuWallet}
                        tone="emerald"
                        open={open.payment}
                        onOpenChange={(o) => setOpen((s) => ({ ...s, payment: o }))}
                    >
                        <div className={fieldGrid}>
                            <FieldRow label="Paid Amount">
                                <EditableField
                                    isEditing={isEditing}
                                    type="text"
                                    value={draft.paidAmount}
                                    onChange={(v) => onDraftChange('paidAmount', v.replace(/[^\d.]/g, ''))}
                                    placeholder="0"
                                    readValue={
                                        Number(invoice.paidAmount) > 0
                                            ? formatMoney(Number(invoice.paidAmount), invoice.currency)
                                            : formatMoney(0, invoice.currency)
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Balance Amount">
                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 tabular-nums">
                                    {formatMoney(isEditing ? balancePreview : Number(invoice.balanceAmount || 0), invoice.currency)}
                                </span>
                            </FieldRow>
                            <FieldRow label="Payment Status">
                                <EditableSelect
                                    isEditing={isEditing}
                                    value={draft.paymentStatus}
                                    onChange={(v) => onDraftChange('paymentStatus', v)}
                                    options={paymentStatusOptions}
                                    readValue={invoice.paymentStatus || 'Pending'}
                                />
                            </FieldRow>
                            <FieldRow label="Payment Method">
                                <EditableSelect
                                    isEditing={isEditing}
                                    value={draft.primaryPaymentMode}
                                    onChange={(v) => onDraftChange('primaryPaymentMode', v)}
                                    options={['', ...paymentModeOptions]}
                                    placeholder="Select payment mode"
                                    readValue={invoice.primaryPaymentMode || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Transaction Reference">
                                <EditableField
                                    isEditing={isEditing}
                                    value={draft.primaryTransactionRef}
                                    onChange={(v) => onDraftChange('primaryTransactionRef', v)}
                                    placeholder="UTR / Cheque / UPI ref."
                                    readValue={invoice.primaryTransactionRef?.trim() || EMPTY}
                                />
                            </FieldRow>
                        </div>
                    </InlineCollapsibleSection>

                    {/* ------------------------------------------------------------------ */}
                    {/*  Section 3: Attachments (PDF / image upload + preview)              */}
                    {/* ------------------------------------------------------------------ */}
                    <InlineCollapsibleSection
                        title="ATTACHMENTS"
                        icon={LuPaperclip}
                        tone="slate"
                        open={open.attachments}
                        onOpenChange={(o) => setOpen((s) => ({ ...s, attachments: o }))}
                        headerRight={
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-500 ring-1 ring-gray-200">
                                {(invoice.attachments?.length ?? 0) + pendingAttachments.length} file
                                {(invoice.attachments?.length ?? 0) + pendingAttachments.length === 1 ? '' : 's'}
                            </span>
                        }
                    >
                        <AttachmentsBlock
                            invoiceCode={invoice.id > 0 ? invoice.invoiceId : formatInvoiceCode(0)}
                            attachments={invoice.attachments ?? []}
                            pendingAttachments={pendingAttachments}
                            isCreateMode={isCreateMode}
                            onUploadFiles={onUploadFiles}
                            onRemoveAttachment={onRemoveAttachment}
                            onRemovePendingAttachment={onRemovePendingAttachment}
                            onPreviewAttachment={onPreviewAttachment}
                        />
                    </InlineCollapsibleSection>

                    {/* ------------------------------------------------------------------ */}
                    {/*  Section 4: Notes                                                   */}
                    {/* ------------------------------------------------------------------ */}
                    <InlineCollapsibleSection
                        title="NOTES"
                        icon={LuNotebookPen}
                        tone="amber"
                        open={open.notes}
                        onOpenChange={(o) => setOpen((s) => ({ ...s, notes: o }))}
                        headerRight={
                            invoice.notes?.trim() || draft.notes?.trim() ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-500 ring-1 ring-gray-200">
                                    {(isEditing ? draft.notes : invoice.notes || '').trim().length} chars
                                </span>
                            ) : null
                        }
                    >
                        <div className="px-3 py-3">
                            {isEditing ? (
                                <div className="space-y-1.5">
                                    <textarea
                                        value={draft.notes}
                                        onChange={(e) => onDraftChange('notes', e.target.value)}
                                        rows={5}
                                        maxLength={2000}
                                        placeholder="Internal notes, line item summary, payment instructions, or anything finance / approvers should see."
                                        className={cn(
                                            'w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium leading-relaxed text-gray-900 placeholder:text-gray-400',
                                            'focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]',
                                        )}
                                    />
                                    <div className="flex items-center justify-between text-[11px] font-medium text-gray-400">
                                        <span>Notes are visible to all finance &amp; admin users.</span>
                                        <span className="tabular-nums">{draft.notes.length}/2000</span>
                                    </div>
                                </div>
                            ) : invoice.notes?.trim() ? (
                                <p className="whitespace-pre-wrap rounded-lg border border-gray-200/80 bg-amber-50/30 px-3 py-2.5 text-sm font-medium leading-relaxed text-gray-800">
                                    {invoice.notes.trim()}
                                </p>
                            ) : (
                                <p className="rounded-lg border border-dashed border-gray-200 bg-slate-50/60 px-3 py-3 text-xs font-medium text-gray-500">
                                    No notes yet. Add context for finance approvers, vendors, or internal reviewers.
                                </p>
                            )}
                        </div>
                    </InlineCollapsibleSection>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Attachments block — inline PDF / image upload, preview, download, remove   */
/* -------------------------------------------------------------------------- */

const ACCEPTED_FILE_TYPES = 'application/pdf,image/*';
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file

function isImageMime(mime: string): boolean {
    return mime?.toLowerCase().startsWith('image/');
}

function isPdfMime(mime: string): boolean {
    return mime?.toLowerCase() === 'application/pdf';
}

function AttachmentsBlock({
    invoiceCode,
    attachments,
    pendingAttachments,
    isCreateMode,
    onUploadFiles,
    onRemoveAttachment,
    onRemovePendingAttachment,
    onPreviewAttachment,
}: {
    invoiceCode: string;
    attachments: InvoiceAttachment[];
    pendingAttachments: PendingInvoiceAttachment[];
    isCreateMode: boolean;
    onUploadFiles?: (files: File[]) => void | Promise<void>;
    onRemoveAttachment?: (attachmentId: string) => void;
    onRemovePendingAttachment?: (pendingId: string) => void;
    onPreviewAttachment?: (attachment: { fileName: string; url: string; mimeType: string }) => void;
}) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [uploading, setUploading] = React.useState(false);

    const totalCount = attachments.length + pendingAttachments.length;

    const handleFiles = React.useCallback(
        async (files: File[]) => {
            if (!files.length) return;
            if (!onUploadFiles) return;
            setError(null);
            const accepted: File[] = [];
            for (const f of files) {
                const mime = (f.type || '').toLowerCase();
                const okMime = isPdfMime(mime) || isImageMime(mime);
                if (!okMime) {
                    setError(`"${f.name}" is not a PDF or image.`);
                    continue;
                }
                if (f.size > MAX_FILE_BYTES) {
                    setError(`"${f.name}" exceeds the 10 MB upload limit.`);
                    continue;
                }
                accepted.push(f);
            }
            if (!accepted.length) return;
            try {
                setUploading(true);
                await onUploadFiles(accepted);
            } finally {
                setUploading(false);
            }
        },
        [onUploadFiles],
    );

    const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const list = Array.from(e.target.files ?? []);
        await handleFiles(list);
        if (inputRef.current) inputRef.current.value = '';
    };

    const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const list = Array.from(e.dataTransfer?.files ?? []);
        await handleFiles(list);
    };

    return (
        <div className="px-3 py-3 text-sm text-gray-700">
            {/* Upload zone */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragOver(false);
                }}
                onDrop={(e) => void onDrop(e)}
                className={cn(
                    'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors',
                    isDragOver
                        ? 'border-[color-mix(in_srgb,var(--cta-button-bg)_45%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]/70'
                        : 'border-gray-200 bg-slate-50/50 hover:bg-slate-50',
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED_FILE_TYPES}
                    multiple
                    onChange={(e) => void onInputChange(e)}
                    className="hidden"
                    aria-label="Upload invoice files"
                />
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--cta-button-bg)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]">
                    <LuUpload size={18} aria-hidden />
                </span>
                <div className="text-sm font-semibold text-gray-800">
                    Drag &amp; drop, or{' '}
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="font-semibold text-[var(--cta-button-bg)] underline-offset-2 hover:underline"
                        disabled={uploading}
                    >
                        browse files
                    </button>
                </div>
                <p className="text-[11px] font-medium text-gray-500">
                    PDF or image · up to 10 MB · multiple files supported
                </p>
                {uploading ? (
                    <p className="text-[11px] font-medium text-[var(--cta-button-bg)]">Uploading…</p>
                ) : null}
            </div>

            {error ? (
                <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700">{error}</p>
            ) : null}

            {/* Pending uploads (create mode) */}
            {pendingAttachments.length > 0 ? (
                <div className="mt-3">
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                        Pending uploads · saved on create
                    </p>
                    <ul className="divide-y divide-amber-100 overflow-hidden rounded-lg border border-amber-200 bg-amber-50/40">
                        {pendingAttachments.map((a) => (
                            <AttachmentRow
                                key={a.pendingId}
                                fileName={a.fileName}
                                category={a.category}
                                sizeLabel={a.sizeLabel}
                                mimeType={a.mimeType}
                                url={a.url}
                                onPreview={() =>
                                    onPreviewAttachment?.({ fileName: a.fileName, url: a.url, mimeType: a.mimeType })
                                }
                                onRemove={() => onRemovePendingAttachment?.(a.pendingId)}
                                pending
                            />
                        ))}
                    </ul>
                </div>
            ) : null}

            {/* Saved attachments */}
            {attachments.length > 0 ? (
                <div className="mt-3">
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500">Uploaded files</p>
                    <ul className="divide-y divide-gray-200/80 overflow-hidden rounded-lg border border-gray-200/80">
                        {attachments
                            .slice()
                            .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
                            .map((a) => (
                                <AttachmentRow
                                    key={a.id}
                                    fileName={a.fileName}
                                    category={a.category}
                                    sizeLabel={a.sizeLabel}
                                    mimeType={a.mimeType}
                                    url={a.url}
                                    version={a.version}
                                    onPreview={() =>
                                        onPreviewAttachment?.({ fileName: a.fileName, url: a.url, mimeType: a.mimeType })
                                    }
                                    onRemove={() => {
                                        if (window.confirm(`Remove "${a.fileName}"?`)) onRemoveAttachment?.(a.id);
                                    }}
                                />
                            ))}
                    </ul>
                </div>
            ) : null}

            {totalCount === 0 ? (
                <p className="mt-3 rounded-lg border border-dashed border-gray-200 bg-slate-50/60 px-3 py-3 text-xs font-medium text-gray-500">
                    No attachments yet. Upload the invoice PDF, supporting images, or scans here.
                </p>
            ) : null}

            <p className="mt-2 text-[11px] font-medium text-gray-400">
                {isCreateMode ? `New invoice (${invoiceCode})` : `Invoice ${invoiceCode}`} ·{' '}
                {isCreateMode
                    ? 'pending files are saved when you click Create Invoice'
                    : 'changes save instantly to this invoice'}
            </p>
        </div>
    );
}

function AttachmentRow({
    fileName,
    category,
    sizeLabel,
    mimeType,
    url,
    version,
    pending,
    onPreview,
    onRemove,
}: {
    fileName: string;
    category: InvoiceAttachmentCategory;
    sizeLabel: string;
    mimeType: string;
    url: string;
    version?: number;
    pending?: boolean;
    onPreview: () => void;
    onRemove: () => void;
}) {
    const isImage = isImageMime(mimeType);
    const isPdf = isPdfMime(mimeType);

    return (
        <li className="flex items-center gap-3 px-3 py-2.5">
            {isImage && url ? (
                <button
                    type="button"
                    onClick={onPreview}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md ring-1 ring-gray-200 transition hover:ring-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)]"
                    aria-label={`Preview ${fileName}`}
                    title="Click to preview"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={fileName} className="h-full w-full object-cover" />
                </button>
            ) : (
                <span
                    className={cn(
                        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md ring-1',
                        isPdf
                            ? 'bg-rose-50 text-rose-700 ring-rose-100'
                            : isImage
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                              : 'bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] text-[var(--cta-button-bg)] ring-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]',
                    )}
                    aria-hidden
                >
                    {isImage ? <LuImage size={18} /> : <LuFileText size={18} />}
                </span>
            )}
            <div className="min-w-0 flex-1">
                <button
                    type="button"
                    onClick={onPreview}
                    className="block w-full truncate text-left text-sm font-semibold text-gray-900 hover:text-[var(--cta-button-bg)] hover:underline"
                    title={fileName}
                >
                    {fileName}
                </button>
                <p className="truncate text-xs text-gray-500">
                    {category} · {sizeLabel}
                    {typeof version === 'number' && version > 1 ? ` · v${version}` : ''}
                    {pending ? ' · pending' : ''}
                </p>
            </div>
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={onPreview}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    title="Preview"
                >
                    <LuExternalLink size={14} />
                    <span className="hidden sm:inline">Preview</span>
                </button>
                <a
                    href={url || '#'}
                    download={fileName}
                    onClick={(e) => {
                        if (!url) e.preventDefault();
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    title="Download"
                >
                    <LuDownload size={14} />
                    <span className="hidden sm:inline">Download</span>
                </a>
                <button
                    type="button"
                    onClick={onRemove}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    title="Remove"
                >
                    <LuTrash2 size={14} />
                </button>
            </div>
        </li>
    );
}
