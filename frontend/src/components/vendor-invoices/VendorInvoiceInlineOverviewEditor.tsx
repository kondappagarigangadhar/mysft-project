'use client';

import Link from 'next/link';
import React from 'react';
import {
    EditableDate,
    EditableField,
    EditableSelect,
} from '@/components/leads/detail/InlineEditableSection';
import {
    computeBillingTotals,
    type ServiceExecutionSlice,
    type VendorInvoiceLineItemDraft,
    type VendorInvoiceOverviewDraft,
    type WorkOrderRefSlice,
} from '@/lib/vendor-invoices/vendorInvoiceWorkOrderBridge';
import {
    formatMoney,
    formatVendorInvoiceCode,
    VENDOR_INVOICE_CURRENCIES,
    type VendorInvoice,
    type VendorInvoiceCurrency,
} from '@/lib/vendorInvoiceStore';
import { VendorInvoiceServiceExecutionBilling } from '@/components/vendor-invoices/VendorInvoiceServiceExecutionBilling';
import { cn } from '@/lib/utils';
import { BpStatusBadge } from '@/components/booking-payment/BpStatusBadge';
import {
    LuBuilding2,
    LuChevronDown,
    LuClipboardList,
    LuFileText,
    LuImage,
    LuNotebookPen,
    LuPaperclip,
    LuReceipt,
    LuTruck,
    LuWallet,
    LuWrench,
} from 'react-icons/lu';

const EMPTY = '—';

export type { VendorInvoiceOverviewDraft, WorkOrderRefSlice, ServiceExecutionSlice, VendorInvoiceLineItemDraft };

type InlineErrorKey = 'invoiceNumber' | 'vendorName' | 'linkedProject' | 'invoiceDate' | 'dueDate' | 'linkedWorkOrderId';

export const VENDOR_INVOICE_INLINE_FIELD_IDS: Record<InlineErrorKey, string> = {
    invoiceNumber: 'vinv-inline-invoice-number',
    vendorName: 'vinv-inline-vendor',
    linkedProject: 'vinv-inline-project',
    invoiceDate: 'vinv-inline-invoice-date',
    dueDate: 'vinv-inline-due-date',
    linkedWorkOrderId: 'vinv-inline-work-order',
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

export function VendorInvoiceInlineOverviewEditor({
    invoice,
    isEditing,
    draft,
    errors,
    onDraftChange,
    onLineItemsChange,
    vendorOptions,
    categoryOptions,
    projectOptions,
    workOrderOptions,
    financeUserOptions,
    workOrderRef,
    serviceExecution,
    isCreateMode = false,
    lockVendor = false,
    onRequestEdit,
}: {
    invoice: VendorInvoice;
    isEditing: boolean;
    draft: VendorInvoiceOverviewDraft;
    errors: Partial<Record<string, string>>;
    onDraftChange: (key: keyof VendorInvoiceOverviewDraft, value: string) => void;
    onLineItemsChange: (items: VendorInvoiceLineItemDraft[]) => void;
    vendorOptions: { id: string; name: string }[];
    categoryOptions: string[];
    projectOptions: string[];
    workOrderOptions: { id: string; label: string }[];
    financeUserOptions: string[];
    workOrderRef: WorkOrderRefSlice;
    serviceExecution: ServiceExecutionSlice;
    isCreateMode?: boolean;
    lockVendor?: boolean;
    onRequestEdit?: () => void;
}) {
    const fieldGrid = 'grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2';
    const workOrderSourced = Boolean(draft.sourceWorkOrderId?.trim());
    const vendorReadOnly = lockVendor || workOrderSourced;
    const vendorProfileHref =
        (draft.vendorId || invoice.vendorId)?.trim()
            ? `/company-admin/vendors/${encodeURIComponent(draft.vendorId || invoice.vendorId)}?tab=overview`
            : null;
    const [open, setOpen] = React.useState({
        info: true,
        wo: false,
        execution: true,
        payment: false,
        attachments: false,
        notes: false,
    });
    const [attentionFieldId, setAttentionFieldId] = React.useState<string | null>(null);

    const invoiceCode = invoice.invoiceId?.trim() || (invoice.id > 0 ? formatVendorInvoiceCode(invoice.id) : 'Assigned on save');

    const discount = Number(draft.discount) || 0;
    const gstNum = Number(draft.gstPercent) || 18;
    const { invoiceAmount: total } = computeBillingTotals(draft.lineItems, discount, gstNum);
    const currency = (draft.currency || invoice.currency || 'INR') as VendorInvoiceCurrency;

    const infoReq = (['invoiceNumber', 'vendorName', 'linkedProject', 'invoiceDate', 'linkedWorkOrderId'] as InlineErrorKey[]).filter(
        (k) => Boolean(errors[k]),
    ).length;

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
        const ORDER: InlineErrorKey[] = ['invoiceNumber', 'linkedWorkOrderId', 'vendorName', 'linkedProject', 'invoiceDate', 'dueDate'];
        const first = ORDER.find((k) => Boolean(errors[k])) ?? keys[0];
        if (!first) return;
        setOpen((s) => ({ ...s, info: true }));
        const fid = VENDOR_INVOICE_INLINE_FIELD_IDS[first];
        if (fid) scrollFocusAttention(fid);
    }, [errors, isEditing, scrollFocusAttention]);

    return (
        <div className={cn('flex min-h-0 flex-1 flex-col', isEditing && 'border-none shadow-none')}>
            <div className="min-h-0 flex-1">
                <div className="space-y-4">
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
                            <FieldRow label="Vendor Invoice Number" required>
                                <EditableField
                                    id={VENDOR_INVOICE_INLINE_FIELD_IDS.invoiceNumber}
                                    isEditing={isEditing}
                                    error={errors.invoiceNumber}
                                    className={cn(
                                        attentionFieldId === VENDOR_INVOICE_INLINE_FIELD_IDS.invoiceNumber &&
                                            'rounded-md ring-2 ring-rose-500/25 animate-pulse',
                                    )}
                                    value={draft.invoiceNumber}
                                    onChange={(v) => onDraftChange('invoiceNumber', v)}
                                    placeholder="e.g. VINV-2026-014"
                                    readValue={
                                        invoice.invoiceNumber?.trim() ? (
                                            <span className="text-base font-semibold text-gray-900">{invoice.invoiceNumber}</span>
                                        ) : (
                                            EMPTY
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Vendor" required>
                                <EditableSelect
                                    id={VENDOR_INVOICE_INLINE_FIELD_IDS.vendorName}
                                    isEditing={isEditing && !vendorReadOnly}
                                    error={errors.vendorName}
                                    className={cn(
                                        attentionFieldId === VENDOR_INVOICE_INLINE_FIELD_IDS.vendorName &&
                                            'rounded-md ring-2 ring-rose-500/25 animate-pulse',
                                    )}
                                    value={draft.vendorName}
                                    onChange={(v) => onDraftChange('vendorName', v)}
                                    placeholder="Select vendor"
                                    options={vendorOptions.map((v) => v.name)}
                                    readValue={
                                        (draft.vendorName || invoice.vendorName)?.trim() ? (
                                            <span className="inline-flex items-center gap-2">
                                                <LuTruck size={14} className="text-slate-400" aria-hidden />
                                                {vendorProfileHref ? (
                                                    <Link
                                                        href={vendorProfileHref}
                                                        className="font-semibold text-[var(--cta-button-bg)] hover:underline"
                                                    >
                                                        {draft.vendorName || invoice.vendorName}
                                                    </Link>
                                                ) : (
                                                    <span className="font-semibold text-gray-900">{draft.vendorName || invoice.vendorName}</span>
                                                )}
                                            </span>
                                        ) : (
                                            EMPTY
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Vendor Category">
                                <EditableSelect
                                    isEditing={isEditing && !vendorReadOnly}
                                    value={draft.vendorCategory}
                                    onChange={(v) => onDraftChange('vendorCategory', v)}
                                    placeholder="Select category"
                                    options={categoryOptions}
                                    readValue={invoice.vendorCategory?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Linked Project" required>
                                <EditableSelect
                                    id={VENDOR_INVOICE_INLINE_FIELD_IDS.linkedProject}
                                    isEditing={isEditing && !workOrderSourced && !lockVendor}
                                    error={errors.linkedProject}
                                    className={cn(
                                        attentionFieldId === VENDOR_INVOICE_INLINE_FIELD_IDS.linkedProject &&
                                            'rounded-md ring-2 ring-rose-500/25 animate-pulse',
                                    )}
                                    value={draft.linkedProject}
                                    onChange={(v) => onDraftChange('linkedProject', v)}
                                    placeholder="Select project"
                                    options={projectOptions}
                                    readValue={
                                        invoice.linkedProject?.trim() ? (
                                            <span className="inline-flex items-center gap-2">
                                                <LuBuilding2 size={14} className="text-slate-400" aria-hidden />
                                                <span className="font-semibold text-gray-900">{invoice.linkedProject}</span>
                                            </span>
                                        ) : (
                                            EMPTY
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Linked Tower">
                                <EditableField
                                    isEditing={isEditing && !workOrderSourced && !lockVendor}
                                    value={draft.linkedTower}
                                    onChange={(v) => onDraftChange('linkedTower', v)}
                                    placeholder="Tower / block"
                                    readValue={invoice.linkedTower?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Linked Work Order" required>
                                <EditableSelect
                                    id={VENDOR_INVOICE_INLINE_FIELD_IDS.linkedWorkOrderId}
                                    isEditing={isEditing && !workOrderSourced}
                                    error={errors.linkedWorkOrderId}
                                    value={draft.linkedWorkOrderId}
                                    onChange={(v) => onDraftChange('linkedWorkOrderId', v)}
                                    placeholder="Link work order"
                                    options={workOrderOptions.map((w) => w.id)}
                                    readValue={
                                        draft.linkedWorkOrderId?.trim() || invoice.linkedWorkOrderId?.trim() ? (
                                            <span className="font-mono text-sm font-semibold">
                                                {draft.linkedWorkOrderId || invoice.linkedWorkOrderId}
                                            </span>
                                        ) : (
                                            EMPTY
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Service Request">
                                <EditableField
                                    isEditing={isEditing && !workOrderSourced}
                                    value={draft.linkedServiceRequestId}
                                    onChange={(v) => onDraftChange('linkedServiceRequestId', v)}
                                    placeholder="e.g. SR-72001"
                                    readValue={invoice.linkedServiceRequestId?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Invoice Date" required>
                                <EditableDate
                                    id={VENDOR_INVOICE_INLINE_FIELD_IDS.invoiceDate}
                                    isEditing={isEditing}
                                    error={errors.invoiceDate}
                                    value={draft.invoiceDate}
                                    onChange={(v) => onDraftChange('invoiceDate', v)}
                                    readValue={invoice.invoiceDate?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Due Date">
                                <EditableDate
                                    id={VENDOR_INVOICE_INLINE_FIELD_IDS.dueDate}
                                    isEditing={isEditing}
                                    error={errors.dueDate}
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
                                    options={VENDOR_INVOICE_CURRENCIES}
                                    readValue={invoice.currency || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Assigned Finance User">
                                <EditableSelect
                                    isEditing={isEditing}
                                    value={draft.assignedFinanceUser}
                                    onChange={(v) => onDraftChange('assignedFinanceUser', v)}
                                    placeholder="Select finance user"
                                    options={['', ...financeUserOptions]}
                                    readValue={invoice.assignedFinanceUser?.trim() || EMPTY}
                                />
                            </FieldRow>
                        </div>
                    </InlineCollapsibleSection>

                    <InlineCollapsibleSection
                        title="WORK ORDER REFERENCE"
                        icon={LuClipboardList}
                        tone="amber"
                        open={open.wo}
                        onOpenChange={(o) => setOpen((s) => ({ ...s, wo: o }))}
                    >
                        <div className={fieldGrid}>
                            <FieldRow label="Work Order Number">
                                <span className="font-mono text-sm">{draft.linkedWorkOrderId?.trim() || invoice.linkedWorkOrderId?.trim() || EMPTY}</span>
                            </FieldRow>
                            <FieldRow label="Service Request">
                                <span>{draft.linkedServiceRequestId?.trim() || invoice.linkedServiceRequestId?.trim() || EMPTY}</span>
                            </FieldRow>
                            <FieldRow label="Resident Name">
                                <span>{workOrderRef.residentName?.trim() || EMPTY}</span>
                            </FieldRow>
                            <FieldRow label="Unit">
                                <span>{workOrderRef.unit?.trim() || EMPTY}</span>
                            </FieldRow>
                            <FieldRow label="Issue Category">
                                <span>{workOrderRef.issueCategory?.trim() || EMPTY}</span>
                            </FieldRow>
                            <FieldRow label="Completion Date">
                                <span>{workOrderRef.completionDate?.trim() || EMPTY}</span>
                            </FieldRow>
                            <FieldRow label="Vendor Assigned">
                                <span>{workOrderRef.vendorAssigned?.trim() || EMPTY}</span>
                            </FieldRow>
                            <FieldRow label="Work Order Value">
                                <span className="font-semibold">
                                    {workOrderRef.workOrderValue > 0 ? formatMoney(workOrderRef.workOrderValue, currency) : EMPTY}
                                </span>
                            </FieldRow>
                        </div>
                        {!draft.linkedWorkOrderId?.trim() && !invoice.linkedWorkOrderId?.trim() && isEditing ? (
                            <p className="border-t border-gray-200/80 px-3 py-2 text-xs font-medium text-amber-800">
                                Link a work order above to auto-populate reference fields.
                            </p>
                        ) : null}
                    </InlineCollapsibleSection>

                    <InlineCollapsibleSection
                        title="SERVICE EXECUTION & BILLING DETAILS"
                        icon={LuWrench}
                        tone="emerald"
                        open={open.execution}
                        onOpenChange={(o) => setOpen((s) => ({ ...s, execution: o }))}
                    >
                        <div className="px-3 py-3">
                            <VendorInvoiceServiceExecutionBilling
                                execution={serviceExecution}
                                lineItems={draft.lineItems}
                                onLineItemsChange={onLineItemsChange}
                                discount={draft.discount}
                                gstPercent={draft.gstPercent}
                                onDiscountChange={(v) => onDraftChange('discount', v)}
                                onGstPercentChange={(v) => onDraftChange('gstPercent', v)}
                                isEditing={isEditing}
                                currency={currency}
                                storedSubtotal={invoice.subtotal}
                                storedGst={invoice.gstAmount}
                                storedTotal={invoice.invoiceAmount}
                                onRequestEdit={onRequestEdit}
                            />
                        </div>
                    </InlineCollapsibleSection>

                    <InlineCollapsibleSection
                        title="PAYMENT SUMMARY"
                        icon={LuWallet}
                        tone="emerald"
                        open={open.payment}
                        onOpenChange={(o) => setOpen((s) => ({ ...s, payment: o }))}
                    >
                        <div className={fieldGrid}>
                            <FieldRow label="Invoice Amount">
                                <span className="font-semibold tabular-nums">
                                    {formatMoney(isEditing ? total : invoice.invoiceAmount, currency)}
                                </span>
                            </FieldRow>
                            <FieldRow label="Approved Amount">
                                <span className="tabular-nums">{formatMoney(invoice.approvedAmount, currency)}</span>
                            </FieldRow>
                            <FieldRow label="Paid Amount">
                                <span className="tabular-nums">{formatMoney(invoice.paidAmount, currency)}</span>
                            </FieldRow>
                            <FieldRow label="Balance">
                                <span className="font-semibold tabular-nums">
                                    {formatMoney(
                                        isEditing
                                            ? Math.max(0, total - invoice.paidAmount)
                                            : invoice.balanceAmount,
                                        currency,
                                    )}
                                </span>
                            </FieldRow>
                            <FieldRow label="Payment Status">
                                <BpStatusBadge
                                    tone={
                                        invoice.paymentStatus === 'Paid'
                                            ? 'success'
                                            : invoice.paymentStatus === 'Partial'
                                              ? 'warning'
                                              : 'neutral'
                                    }
                                >
                                    {invoice.paymentStatus}
                                </BpStatusBadge>
                            </FieldRow>
                            <FieldRow label="Payment Date">
                                <span>{invoice.payment.paymentDate?.trim() || EMPTY}</span>
                            </FieldRow>
                            <FieldRow label="Payment Method">
                                <span>{invoice.payment.paymentMethod?.trim() || EMPTY}</span>
                            </FieldRow>
                            <FieldRow label="Transaction Reference">
                                <span className="font-mono text-sm">
                                    {invoice.payment.transactionReference?.trim() || EMPTY}
                                </span>
                            </FieldRow>
                        </div>
                        {isCreateMode ? (
                            <p className="border-t border-gray-200/80 px-3 py-2 text-xs font-medium text-slate-500">
                                Payment details are recorded after invoice approval.
                            </p>
                        ) : null}
                    </InlineCollapsibleSection>

                    <InlineCollapsibleSection
                        title="ATTACHMENTS"
                        icon={LuPaperclip}
                        tone="slate"
                        open={open.attachments}
                        onOpenChange={(o) => setOpen((s) => ({ ...s, attachments: o }))}
                        headerRight={
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-500 ring-1 ring-gray-200">
                                {invoice.attachments?.length ?? 0} file
                                {(invoice.attachments?.length ?? 0) === 1 ? '' : 's'}
                            </span>
                        }
                    >
                        <VendorInvoiceAttachmentsList
                            attachments={invoice.attachments ?? []}
                            isCreateMode={isCreateMode}
                        />
                    </InlineCollapsibleSection>

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
                                        rows={4}
                                        maxLength={2000}
                                        placeholder="Internal notes for finance approvers, vendor context, or payment instructions."
                                        className={cn(
                                            'w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium leading-relaxed text-gray-900 placeholder:text-gray-400',
                                            'focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]',
                                        )}
                                    />
                                    <div className="flex items-center justify-between text-[11px] font-medium text-gray-400">
                                        <span>Visible to finance &amp; admin users.</span>
                                        <span className="tabular-nums">{draft.notes.length}/2000</span>
                                    </div>
                                </div>
                            ) : invoice.notes?.trim() ? (
                                <p className="whitespace-pre-wrap rounded-lg border border-gray-200/80 bg-amber-50/30 px-3 py-2.5 text-sm font-medium leading-relaxed text-gray-800">
                                    {invoice.notes.trim()}
                                </p>
                            ) : (
                                <p className="rounded-lg border border-dashed border-gray-200 bg-slate-50/60 px-3 py-3 text-xs font-medium text-gray-500">
                                    No notes yet. Add context for finance approvers or internal reviewers.
                                </p>
                            )}
                        </div>
                    </InlineCollapsibleSection>
                </div>
            </div>
        </div>
    );
}

function VendorInvoiceAttachmentsList({
    attachments,
    isCreateMode,
}: {
    attachments: VendorInvoice['attachments'];
    isCreateMode?: boolean;
}) {
    if (!attachments.length) {
        return (
            <div className="px-3 py-4">
                <p className="rounded-lg border border-dashed border-gray-200 bg-slate-50/60 px-3 py-4 text-center text-xs font-medium text-gray-500">
                    {isCreateMode
                        ? 'Save the invoice to upload vendor invoice PDFs, completion photos, and tax documents.'
                        : 'No attachments uploaded yet.'}
                </p>
            </div>
        );
    }

    return (
        <ul className="divide-y divide-gray-200/80">
            {attachments.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-3 py-2.5 odd:bg-gray-50/50">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 ring-1 ring-gray-200">
                        {a.fileName.toLowerCase().endsWith('.pdf') ? (
                            <LuFileText size={16} aria-hidden />
                        ) : (
                            <LuImage size={16} aria-hidden />
                        )}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{a.fileName}</p>
                        <p className="text-xs text-gray-500">
                            {a.category} · {a.sizeLabel}
                        </p>
                    </div>
                    {a.url ? (
                        <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-xs font-semibold text-[var(--cta-button-bg)] hover:underline"
                        >
                            View
                        </a>
                    ) : null}
                </li>
            ))}
        </ul>
    );
}
