'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { StatusModal } from '@/components/ui/StatusModal';
import { Modal } from '@/components/ui/Modal';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { cn } from '@/lib/utils';
import { CTA_UTILITY_BTN } from '@/lib/theme/ctaThemeClasses';
import { WorkspaceUtilityToolbar, INVOICE_WORKSPACE_HELP } from '@/components/workspace-help';
import { CrmFieldProvider, InputField, SelectField, TextAreaField } from '@/components/forms/Fields';
import { draftService } from '@/lib/draftService';
import { getDemoProjectNamesList } from '@/lib/demoCatalog';
import { RecordHistoryLogPanel } from '@/components/history-logs/RecordHistoryLogPanel';
import { invoiceActivitiesToHistoryLogEntries } from '@/lib/historyLogs/recordHistoryAdapters';
import { BpStatusBadge } from '@/components/booking-payment/BpStatusBadge';
import { InvoiceMainTabBar } from '@/components/invoices/detail/InvoiceMainTabBar';
import type { InvoiceDetailMainTabId } from '@/components/invoices/detail/invoiceDetailTabIds';
import { normalizeInvoiceDetailTab } from '@/components/invoices/detail/invoiceDetailTabIds';
import {
    InvoiceInlineOverviewEditor,
    INVOICE_INLINE_FIELD_IDS,
    type InvoiceOverviewDraft,
    type PendingInvoiceAttachment,
} from '@/components/invoices/InvoiceInlineOverviewEditor';
import {
    addInvoiceAttachment,
    addInvoiceFromCoreFields,
    addInvoicePayment,
    archiveInvoice,
    deriveInvoiceBalance,
    deriveInvoicePaymentStatus,
    duplicateInvoice,
    formatMoney,
    getDemoCounterpartyOptions,
    getDemoFinanceUsersList,
    INVOICE_CURRENCIES,
    INVOICE_PARTY_TYPES,
    INVOICE_PAYMENT_MODES,
    INVOICE_PAYMENT_STATUSES,
    INVOICE_VALIDATION_STATUSES,
    markInvoiceExported,
    removeInvoiceAttachment,
    removeInvoicePayment,
    updateInvoice,
    updateInvoiceNotifications,
    updateInvoiceValidation,
    type Invoice,
    type InvoiceCurrency,
    type InvoicePaymentEntry,
    type InvoicePaymentMode,
    type InvoicePaymentStatus,
    type InvoiceValidationStatus,
} from '@/lib/invoiceStore';
import { getWorkOrders } from '@/lib/workOrderStore';
import { getPurchaseOrdersByPrSlug } from '@/lib/purchaseOrderStore';
import { getPurchaseRequestIncludingArchived } from '@/lib/purchaseRequestStore';
import { procurementReturnPrHref } from '@/lib/procurement/procurementBreadcrumbs';
import { resolvePrProcurementLinkContext } from '@/lib/procurement/prProcurementLinks';
import { buildInvoiceDraftFromPr } from '@/lib/procurement/prLinkedInvoices';
import {
    computeProcurementBillingBundle,
    createEmptyProcurementBillingState,
    procurementBillingStateFromInvoice,
    type ProcurementChargesDraft,
    type ProcurementMaterialDraft,
} from '@/lib/procurement/procurementInvoiceBilling';
import {
    clearStoredProcurementBilling,
    loadStoredProcurementBilling,
    procurementBillingStorageKey,
    saveStoredProcurementBilling,
} from '@/lib/procurement/procurementInvoiceMaterialStore';
import { ProcurementInvoiceAIPanel } from '@/components/invoices/ProcurementSupplierInvoiceBilling';
import {
    LuActivity,
    LuArrowRight,
    LuBadgeCheck,
    LuBan,
    LuBanknote,
    LuBell,
    LuCalendar,
    LuCircleCheck,
    LuCircleDollarSign,
    LuClock3,
    LuCopy,
    LuCreditCard,
    LuDownload,
    LuExternalLink,
    LuEllipsis,
    LuFileText,
    LuHistory,
    LuLandmark,
    LuMail,
    LuNotebookPen,
    LuPaperclip,
    LuPencil,
    LuPlus,
    LuPrinter,
    LuQrCode,
    LuReceipt,
    LuScale,
    LuShare2,
    LuShieldCheck,
    LuTrash2,
    LuTrendingUp,
    LuTriangleAlert,
    LuUpload,
    LuWallet,
    LuX,
} from 'react-icons/lu';

type TabId = InvoiceDetailMainTabId;
const EMPTY_FIELD = '—';

/* -------------------------------------------------------------------------- */
/*  Utilities                                                                 */
/* -------------------------------------------------------------------------- */

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

function downloadTextFile({ filename, content, mime }: { filename: string; content: string; mime: string }) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function formatAuditTimestamp(iso: string | undefined | null): string {
    if (!iso?.trim()) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const yr = d.getFullYear();
    const h24 = d.getHours();
    const m = d.getMinutes();
    const isPm = h24 >= 12;
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    const mm = String(m).padStart(2, '0');
    const ap = isPm ? 'PM' : 'AM';
    return `${day}-${mon}-${yr} ${String(h12).padStart(2, '0')}:${mm} ${ap}`;
}

function formatIso(iso: string) {
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

function buildDraftFromInvoice(inv: Invoice): InvoiceOverviewDraft {
    return {
        invoiceNumber: inv.invoiceNumber ?? '',
        companyName: inv.companyName ?? '',
        partyType: inv.partyType ?? 'Vendor',
        partyName: inv.partyName ?? '',
        linkedProject: inv.linkedProject ?? '',
        linkedWorkOrderId: inv.linkedWorkOrderId ?? '',
        linkedPurchaseOrder: inv.linkedPurchaseOrder ?? '',
        linkedPrSlug: inv.linkedPrSlug ?? '',
        linkedPrNumber: inv.linkedPrNumber ?? '',
        invoiceDate: inv.invoiceDate ?? '',
        dueDate: inv.dueDate ?? '',
        currency: inv.currency ?? 'INR',
        invoiceAmount: String(inv.invoiceAmount ?? 0),
        taxAmount: String(inv.taxAmount ?? 0),
        totalAmount: String(inv.totalAmount ?? 0),
        notes: inv.notes ?? '',
        paidAmount: String(inv.paidAmount ?? 0),
        paymentStatus: inv.paymentStatus ?? 'Pending',
        primaryPaymentMode: (inv.primaryPaymentMode ?? '') as InvoicePaymentMode | '',
        primaryTransactionRef: inv.primaryTransactionRef ?? '',
        assignedFinanceUser: inv.assignedFinanceUser ?? '',
    };
}

function hasAnyValue(d: InvoiceOverviewDraft): boolean {
    return Object.values(d).some((v) => (typeof v === 'string' ? v.trim() : Boolean(v)));
}

function validationTone(status: InvoiceValidationStatus | string) {
    if (status === 'Approved') return 'success' as const;
    if (status === 'Rejected') return 'danger' as const;
    return 'warning' as const;
}

function paymentTone(status: string) {
    if (status === 'Paid') return 'success' as const;
    if (status === 'Pending') return 'warning' as const;
    if (status === 'Partial') return 'warning' as const;
    return 'neutral' as const;
}

function exportTone(status: string) {
    if (status === 'Exported') return 'success' as const;
    if (status === 'Failed') return 'danger' as const;
    if (status === 'Queued') return 'warning' as const;
    return 'neutral' as const;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function InvoiceRecordTabs({
    invoice,
    listVersion,
    onBump,
    createMode = false,
}: {
    invoice: Invoice;
    listVersion: number;
    onBump: () => void;
    createMode?: boolean;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isCreate = createMode;

    const afterCreateOrCancelHref = useMemo(() => {
        const returnPr = searchParams.get('returnPrSlug')?.trim() || '';
        return returnPr ? procurementReturnPrHref(returnPr) : '/company-admin/invoices';
    }, [searchParams]);

    /* ------------------------------ tab state ------------------------------ */
    const [tab, setTabState] = useState<TabId>(() => normalizeInvoiceDetailTab(searchParams.get('tab')));
    const setTab = useCallback(
        (next: TabId) => {
            if (isCreate && next !== 'overview') return;
            setTabState(next);
            const url = `/company-admin/invoices/view/${encodeURIComponent(isCreate ? 'new' : invoice.slug)}?tab=${encodeURIComponent(next)}`;
            router.replace(url, { scroll: false });
        },
        [isCreate, router, invoice.slug],
    );

    useEffect(() => {
        const fromUrl = normalizeInvoiceDetailTab(searchParams.get('tab'));
        setTabState(isCreate ? 'overview' : fromUrl);
    }, [searchParams, isCreate]);

    useEffect(() => {
        if (!isCreate) return;
        if (tab === 'overview') return;
        setTabState('overview');
        router.replace(`/company-admin/invoices/view/new?tab=overview`, { scroll: false });
    }, [isCreate, tab, router]);

    /* ------------------------------ draft state ---------------------------- */
    const [draft, setDraft] = useState<InvoiceOverviewDraft>(() => buildDraftFromInvoice(invoice));
    const [errors, setErrors] = useState<Partial<Record<keyof InvoiceOverviewDraft, string>>>({});
    const [isInlineEditing, setIsInlineEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [inlineToast, setInlineToast] = useState<{ msg: string; err: boolean } | null>(null);

    const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
    const [draftSaving, setDraftSaving] = useState(false);
    const [draftLastSavedAt, setDraftLastSavedAt] = useState<string | null>(null);
    const [draftLoadedBanner, setDraftLoadedBanner] = useState(false);

    const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ------------------------------ statuses / modals ---------------------- */
    type StatusModalState = {
        open: boolean;
        type: 'success' | 'error';
        title: string;
        subtitle?: string;
        afterClose?: () => void;
    };
    const [statusModal, setStatusModal] = useState<StatusModalState>({ open: false, type: 'success', title: '' });
    const showStatusModal = useCallback((next: Omit<StatusModalState, 'open'>) => setStatusModal({ ...next, open: true }), []);
    const [archiveModalOpen, setArchiveModalOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');

    /* ------------------------------ tab-specific UI state ------------------ */
    // Payments tab
    const [pmtStatus, setPmtStatus] = useState<InvoicePaymentStatus>(invoice.paymentStatus);
    const [pmtDate, setPmtDate] = useState<string>('');
    const [pmtAmount, setPmtAmount] = useState<string>('');
    const [pmtMode, setPmtMode] = useState<InvoicePaymentMode>('Bank Transfer');
    const [pmtRef, setPmtRef] = useState<string>('');
    const [pmtRemarks, setPmtRemarks] = useState<string>('');
    const [pmtErrors, setPmtErrors] = useState<{ status?: string; amount?: string }>({});
    const [pmtSaving, setPmtSaving] = useState(false);

    // Validation tab
    const [valStatus, setValStatus] = useState<InvoiceValidationStatus>(invoice.validation?.status ?? 'Pending');
    const [valBy, setValBy] = useState<string>(invoice.validation?.validatedBy ?? '');
    const [valRemarks, setValRemarks] = useState<string>(invoice.validation?.remarks ?? '');
    const [valErrors, setValErrors] = useState<{ status?: string; validatedBy?: string }>({});

    // Documents tab
    const docInputRef = useRef<HTMLInputElement | null>(null);
    const [previewDoc, setPreviewDoc] = useState<{ fileName: string; url: string; mimeType: string } | null>(null);

    /** Overview-tab attachments that are uploaded during CREATE mode (before a slug exists). Persisted on Create Invoice. */
    const [pendingAttachments, setPendingAttachments] = useState<PendingInvoiceAttachment[]>([]);

    /* ------------------------------ catalogs ------------------------------- */
    const counterpartyOptions = useMemo(() => getDemoCounterpartyOptions(), []);
    const projectOptions = useMemo(() => getDemoProjectNamesList(), []);
    const workOrderOptions = useMemo(() => getWorkOrders().map((w) => w.workOrderId), [listVersion]);
    const financeUserOptions = useMemo(() => getDemoFinanceUsersList(), []);

    const procurementLinkContext = useMemo(() => {
        const slug =
            searchParams.get('returnPrSlug')?.trim() ||
            draft.linkedPrSlug?.trim() ||
            invoice.linkedPrSlug?.trim() ||
            '';
        return slug ? resolvePrProcurementLinkContext(slug) : null;
    }, [searchParams, draft.linkedPrSlug, invoice.linkedPrSlug]);

    const purchaseOrderOptions = useMemo(
        () => procurementLinkContext?.purchaseOrderOptions ?? [],
        [procurementLinkContext],
    );

    const isSupplierInvoice = draft.partyType === 'Supplier' || invoice.partyType === 'Supplier';

    const [procurementMaterialDrafts, setProcurementMaterialDrafts] = useState<ProcurementMaterialDraft[]>([]);
    const [procurementCharges, setProcurementCharges] = useState<ProcurementChargesDraft>({
        transportCharges: '',
        loadingCharges: '',
        discount: '',
    });

    const hydrateProcurementBilling = useCallback(() => {
        if (!isSupplierInvoice) return;
        const storageKey = isCreate
            ? activeDraftId
                ? procurementBillingStorageKey(`draft:${activeDraftId}`)
                : null
            : procurementBillingStorageKey(invoice.slug);
        const stored = storageKey ? loadStoredProcurementBilling(storageKey) : null;
        if (stored) {
            setProcurementMaterialDrafts(stored.materials);
            setProcurementCharges(stored.charges);
            return;
        }
        if (isCreate) {
            const empty = createEmptyProcurementBillingState();
            setProcurementMaterialDrafts(empty.materials);
            setProcurementCharges(empty.charges);
            return;
        }
        const seeded = procurementBillingStateFromInvoice(invoice);
        setProcurementMaterialDrafts(seeded.materials);
        setProcurementCharges(seeded.charges);
    }, [activeDraftId, invoice, isCreate, isSupplierInvoice]);

    const procurementBilling = useMemo(() => {
        if (!isSupplierInvoice) return null;
        const liveTotals = isInlineEditing || isCreate;
        return computeProcurementBillingBundle(invoice, procurementMaterialDrafts, procurementCharges, liveTotals);
    }, [invoice, isSupplierInvoice, procurementMaterialDrafts, procurementCharges, isInlineEditing, isCreate]);

    /* ------------------------------ effects -------------------------------- */
    // Sync draft when invoice (non-create) updates externally
    useEffect(() => {
        if (isCreate) return;
        if (isInlineEditing) return;
        setDraft(buildDraftFromInvoice(invoice));
    }, [invoice, isInlineEditing, isCreate]);

    // Load procurement material rows for supplier invoices
    useEffect(() => {
        if (!isSupplierInvoice) return;
        if (!isCreate && isInlineEditing) return;
        if (isCreate && procurementMaterialDrafts.length > 0) return;
        hydrateProcurementBilling();
    }, [
        isSupplierInvoice,
        invoice.slug,
        activeDraftId,
        isCreate,
        isInlineEditing,
        hydrateProcurementBilling,
        procurementMaterialDrafts.length,
    ]);

    // Keep invoice payment summary in sync with material billing while editing
    useEffect(() => {
        if (!isSupplierInvoice || !procurementBilling) return;
        if (!isInlineEditing && !isCreate) return;
        const { summary } = procurementBilling;
        const invoiceAmount =
            Math.round((summary.materialValue + summary.transportCharges + summary.loadingCharges - summary.discount) * 100) /
            100;
        setDraft((prev) => {
            const nextInvoice = String(invoiceAmount);
            const nextTax = String(summary.gst);
            const nextTotal = String(summary.finalInvoiceAmount);
            if (prev.invoiceAmount === nextInvoice && prev.taxAmount === nextTax && prev.totalAmount === nextTotal) {
                return prev;
            }
            return { ...prev, invoiceAmount: nextInvoice, taxAmount: nextTax, totalAmount: nextTotal };
        });
    }, [isSupplierInvoice, procurementBilling, isInlineEditing, isCreate]);

    // Persist procurement rows against invoice draft id during create
    useEffect(() => {
        if (!isCreate || !isSupplierInvoice || !activeDraftId || !procurementMaterialDrafts.length) return;
        saveStoredProcurementBilling(procurementBillingStorageKey(`draft:${activeDraftId}`), {
            materials: procurementMaterialDrafts,
            charges: procurementCharges,
        });
    }, [isCreate, isSupplierInvoice, activeDraftId, procurementMaterialDrafts, procurementCharges]);

    // Inline edit activation via `?edit=1`
    useEffect(() => {
        const e = searchParams.get('edit');
        if (e !== '1' && e !== 'true') return;
        setIsInlineEditing(true);
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete('edit');
        const qs = sp.toString();
        const base = `/company-admin/invoices/view/${encodeURIComponent(isCreate ? 'new' : invoice.slug)}`;
        router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    }, [searchParams, invoice.slug, router, isCreate]);

    // Draft hydration from `?draftId=...`
    useEffect(() => {
        if (!isCreate) return;
        const draftIdFromUrl = searchParams.get('draftId')?.trim() || '';
        if (!draftIdFromUrl) {
            setActiveDraftId(null);
            setDraftLastSavedAt(null);
            setDraftLoadedBanner(false);
            return;
        }
        const found = draftService.getDraftById<InvoiceOverviewDraft>(draftIdFromUrl);
        if (!found || found.module !== 'invoice') {
            setInlineToast({ msg: 'Draft not found. Starting a new invoice.', err: true });
            showStatusModal({ type: 'error', title: 'Draft not found', subtitle: 'Starting a new invoice.' });
            setActiveDraftId(null);
            setDraftLastSavedAt(null);
            setDraftLoadedBanner(false);
            return;
        }
        setDraft((prev) => ({ ...prev, ...(found.data ?? {}) }));
        setActiveDraftId(found.draftId);
        setDraftLastSavedAt(found.updatedAt);
        setDraftLoadedBanner(true);
    }, [isCreate, searchParams, showStatusModal]);

    // Prefill create draft from purchase request when opened from procurement (no draftId yet)
    useEffect(() => {
        if (!isCreate) return;
        if (searchParams.get('draftId')?.trim()) return;
        const prSlug = searchParams.get('returnPrSlug')?.trim();
        if (!prSlug) return;
        const pr = getPurchaseRequestIncludingArchived(prSlug);
        if (!pr) return;
        const pos = getPurchaseOrdersByPrSlug(prSlug);
        const ctx = resolvePrProcurementLinkContext(prSlug);
        const supplierName = ctx?.supplierName ?? '';
        setDraft(buildInvoiceDraftFromPr({ pr, linkedPos: pos, supplierName }));
    }, [isCreate, searchParams]);

    // Default to editing in create-mode
    useEffect(() => {
        if (isCreate) setIsInlineEditing(true);
    }, [isCreate]);

    // Debounced draft auto-save (create mode)
    useEffect(() => {
        if (!isCreate) return;
        if (draftSaving || saving) return;
        if (!hasAnyValue(draft)) return;
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        autoSaveRef.current = setTimeout(() => {
            try {
                const saved = draftService.saveDraft<InvoiceOverviewDraft>('invoice', draft, activeDraftId ?? undefined);
                setActiveDraftId(saved.draftId);
                setDraftLastSavedAt(saved.updatedAt);
                if (!searchParams.get('draftId')) {
                    const sp = new URLSearchParams(searchParams.toString());
                    sp.set('draftId', saved.draftId);
                    if (!sp.get('tab')) sp.set('tab', 'overview');
                    router.replace(`${window.location.pathname}?${sp.toString()}`, { scroll: false });
                }
            } catch {
                /* silent */
            }
        }, 1400);
    }, [draft, isCreate, activeDraftId, router, searchParams, draftSaving, saving]);

    useEffect(() => {
        return () => {
            if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        };
    }, []);

    /* ------------------------------ draft handlers ------------------------- */
    const onDraftChange = useCallback((key: keyof InvoiceOverviewDraft, value: string) => {
        setDraft((prev) => {
            const next = { ...prev, [key]: value } as InvoiceOverviewDraft;
            // Auto-recompute totalAmount if user typed invoiceAmount or taxAmount
            if (key === 'invoiceAmount' || key === 'taxAmount') {
                const ia = Number(key === 'invoiceAmount' ? value : next.invoiceAmount) || 0;
                const ta = Number(key === 'taxAmount' ? value : next.taxAmount) || 0;
                next.totalAmount = String(ia + ta);
            }
            // Reset partyName when partyType switches
            if (key === 'partyType') {
                next.partyName = '';
            }
            return next;
        });
        setErrors((prev) => {
            if (!prev[key]) return prev;
            const { [key]: _drop, ...rest } = prev;
            return rest;
        });
    }, []);

    /* ------------------------------ validation ----------------------------- */
    const runValidation = useCallback(() => {
        const next: Partial<Record<keyof InvoiceOverviewDraft, string>> = {};
        if (!draft.invoiceNumber.trim()) next.invoiceNumber = 'Invoice number is required.';
        if (!draft.companyName.trim()) next.companyName = 'Company name is required.';
        if (!draft.partyName.trim()) next.partyName = 'Vendor / supplier is required.';
        if (!draft.linkedProject.trim()) next.linkedProject = 'Linked project is required.';
        if (!draft.invoiceDate.trim()) next.invoiceDate = 'Invoice date is required.';
        if (!draft.dueDate.trim()) next.dueDate = 'Due date is required.';
        if (draft.invoiceDate.trim() && draft.dueDate.trim() && draft.dueDate < draft.invoiceDate) {
            next.dueDate = 'Due date cannot be before invoice date.';
        }
        const invAmount = Number(draft.invoiceAmount);
        if (!Number.isFinite(invAmount) || invAmount <= 0) next.invoiceAmount = 'Invoice amount must be greater than 0.';
        const totalAmount = Number(draft.totalAmount);
        if (!Number.isFinite(totalAmount) || totalAmount <= 0) next.totalAmount = 'Total amount must be greater than 0.';
        if (!draft.assignedFinanceUser.trim()) next.assignedFinanceUser = 'Assigned finance user is required.';
        return next;
    }, [draft]);

    /* ------------------------------ create handler ------------------------- */
    const onCreateInvoice = useCallback(async () => {
        if (!isCreate) return;
        const nextErrors = runValidation();
        setErrors(nextErrors);
        const first = Object.keys(nextErrors)[0] as keyof InvoiceOverviewDraft | undefined;
        if (first) {
            setInlineToast({ msg: 'Please fill required fields.', err: true });
            const fid = INVOICE_INLINE_FIELD_IDS[first as keyof typeof INVOICE_INLINE_FIELD_IDS];
            if (fid) {
                const el = document.getElementById(fid);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        setSaving(true);
        try {
            const total = Number(draft.totalAmount) || 0;
            const paid = Number(draft.paidAmount) || 0;
            const created = addInvoiceFromCoreFields({
                invoiceNumber: draft.invoiceNumber,
                companyName: draft.companyName,
                partyType: draft.partyType,
                partyName: draft.partyName,
                linkedProject: draft.linkedProject,
                linkedWorkOrderId: draft.linkedWorkOrderId,
                linkedPurchaseOrder: draft.linkedPurchaseOrder,
                linkedPrSlug: draft.linkedPrSlug,
                linkedPrNumber: draft.linkedPrNumber,
                invoiceDate: draft.invoiceDate,
                dueDate: draft.dueDate,
                currency: draft.currency,
                invoiceAmount: Number(draft.invoiceAmount) || 0,
                taxAmount: Number(draft.taxAmount) || 0,
                totalAmount: total,
                notes: draft.notes,
                paymentStatus: deriveInvoicePaymentStatus(total, paid),
                primaryPaymentMode: draft.primaryPaymentMode,
                primaryTransactionRef: draft.primaryTransactionRef,
                paidAmount: paid,
                assignedFinanceUser: draft.assignedFinanceUser,
            });
            // Commit any pending Overview-tab attachments to the freshly-created invoice.
            if (pendingAttachments.length) {
                for (const att of pendingAttachments) {
                    try {
                        addInvoiceAttachment(created.slug, {
                            category: att.category,
                            fileName: att.fileName,
                            sizeLabel: att.sizeLabel,
                            mimeType: att.mimeType,
                            url: att.url,
                        });
                    } catch {
                        /* ignore individual upload failures so the invoice still saves */
                    }
                }
                setPendingAttachments([]);
            }
            if (activeDraftId) {
                try {
                    draftService.deleteDraft(activeDraftId);
                } catch {
                    /* ignore */
                }
            }
            if (isSupplierInvoice && procurementMaterialDrafts.length) {
                saveStoredProcurementBilling(procurementBillingStorageKey(created.slug), {
                    materials: procurementMaterialDrafts,
                    charges: procurementCharges,
                });
                try {
                    clearStoredProcurementBilling(procurementBillingStorageKey(`draft:${activeDraftId}`));
                } catch {
                    /* ignore */
                }
            }
            onBump();
            const returnPrSlug = searchParams.get('returnPrSlug')?.trim();
            showStatusModal({
                type: 'success',
                title: 'Invoice Created Successfully',
                afterClose: () =>
                    router.replace(
                        returnPrSlug
                            ? procurementReturnPrHref(returnPrSlug)
                            : `/company-admin/invoices/view/${encodeURIComponent(created.slug)}?tab=overview`,
                        { scroll: true },
                    ),
            });
        } catch {
            setInlineToast({ msg: 'Could not create invoice. Please try again.', err: true });
            showStatusModal({ type: 'error', title: 'Something went wrong. Please try again.' });
        } finally {
            setSaving(false);
        }
    }, [activeDraftId, draft, isCreate, isSupplierInvoice, onBump, pendingAttachments, procurementCharges, procurementMaterialDrafts, router, runValidation, searchParams, showStatusModal]);

    /* ------------------------------ save inline edits ---------------------- */
    const onSaveEdits = useCallback(
        async (opts: { exitAfter: boolean }) => {
            if (isCreate) return;
            const nextErrors = runValidation();
            setErrors(nextErrors);
            const first = Object.keys(nextErrors)[0] as keyof InvoiceOverviewDraft | undefined;
            if (first) {
                setInlineToast({ msg: 'Please fix the highlighted fields.', err: true });
                const fid = INVOICE_INLINE_FIELD_IDS[first as keyof typeof INVOICE_INLINE_FIELD_IDS];
                if (fid) {
                    const el = document.getElementById(fid);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }
            setSaving(true);
            try {
                const total = Number(draft.totalAmount) || 0;
                const paid = Number(draft.paidAmount) || 0;
                updateInvoice(
                    invoice.slug,
                    {
                        invoiceNumber: draft.invoiceNumber.trim(),
                        companyName: draft.companyName.trim(),
                        partyType: draft.partyType,
                        partyName: draft.partyName.trim(),
                        linkedProject: draft.linkedProject.trim(),
                        linkedWorkOrderId: draft.linkedWorkOrderId.trim(),
                        linkedPurchaseOrder: draft.linkedPurchaseOrder.trim(),
                        linkedPrSlug: draft.linkedPrSlug.trim(),
                        linkedPrNumber: draft.linkedPrNumber.trim(),
                        invoiceDate: draft.invoiceDate.trim(),
                        dueDate: draft.dueDate.trim(),
                        currency: draft.currency,
                        invoiceAmount: Number(draft.invoiceAmount) || 0,
                        taxAmount: Number(draft.taxAmount) || 0,
                        totalAmount: total,
                        notes: draft.notes.trim(),
                        paidAmount: paid,
                        balanceAmount: deriveInvoiceBalance(total, paid),
                        paymentStatus: deriveInvoicePaymentStatus(total, paid),
                        primaryPaymentMode: draft.primaryPaymentMode,
                        primaryTransactionRef: draft.primaryTransactionRef.trim(),
                        assignedFinanceUser: draft.assignedFinanceUser.trim() || 'You',
                    },
                    { actor: 'You', title: 'Invoice updated', body: 'Inline edits saved.', actionType: 'updated', severity: 'info' },
                );
                onBump();
                if (isSupplierInvoice && procurementMaterialDrafts.length) {
                    saveStoredProcurementBilling(procurementBillingStorageKey(invoice.slug), {
                        materials: procurementMaterialDrafts,
                        charges: procurementCharges,
                    });
                }
                if (opts.exitAfter) {
                    setIsInlineEditing(false);
                }
                showStatusModal({ type: 'success', title: 'Invoice Updated' });
            } catch {
                setInlineToast({ msg: 'Could not save changes. Please try again.', err: true });
                showStatusModal({ type: 'error', title: 'Something went wrong. Please try again.' });
            } finally {
                setSaving(false);
            }
        },
        [draft, invoice.slug, isCreate, isSupplierInvoice, onBump, procurementCharges, procurementMaterialDrafts, runValidation, showStatusModal],
    );

    const onCancelEdits = useCallback(() => {
        setIsInlineEditing(false);
        setErrors({});
        setDraft(buildDraftFromInvoice(invoice));
        hydrateProcurementBilling();
    }, [hydrateProcurementBilling, invoice]);

    /* ------------------------------ draft save handler --------------------- */
    const saveDraftNow = useCallback(() => {
        if (!isCreate) return;
        setDraftSaving(true);
        try {
            const saved = draftService.saveDraft<InvoiceOverviewDraft>('invoice', draft, activeDraftId ?? undefined);
            setActiveDraftId(saved.draftId);
            setDraftLastSavedAt(saved.updatedAt);
            if (!searchParams.get('draftId')) {
                const sp = new URLSearchParams(searchParams.toString());
                sp.set('draftId', saved.draftId);
                if (!sp.get('tab')) sp.set('tab', 'overview');
                router.replace(`${window.location.pathname}?${sp.toString()}`, { scroll: false });
            }
            setInlineToast({ msg: 'Draft saved.', err: false });
            showStatusModal({ type: 'success', title: 'Draft Saved Successfully' });
        } catch {
            setInlineToast({ msg: 'Could not save draft. Please try again.', err: true });
            showStatusModal({ type: 'error', title: 'Something went wrong. Please try again.' });
        } finally {
            setDraftSaving(false);
        }
    }, [activeDraftId, draft, isCreate, router, searchParams, showStatusModal]);

    /* ------------------------------ generic actions ------------------------ */
    const onClone = () => {
        const copy = duplicateInvoice(invoice.slug);
        if (copy) {
            router.push(`/company-admin/invoices/view/${encodeURIComponent(copy.slug)}?tab=overview`);
        }
    };

    const onShare = async () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        try {
            if (navigator.share) {
                await navigator.share({ title: `${invoice.invoiceId} · Invoice`, url });
                return;
            }
        } catch {
            /* ignore */
        }
        setShareUrl(url);
        setShareModalOpen(true);
    };

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setShareModalOpen(false);
        } catch {
            /* keep modal open */
        }
    };

    const exportInvoiceJson = (inv: Invoice) => {
        const safe = (inv.slug || inv.invoiceId || 'invoice')
            .toString()
            .trim()
            .replace(/[/\\?%*:|"<>]/g, '-')
            .replace(/\.+$/, '')
            .slice(0, 80) || 'invoice';
        downloadTextFile({
            filename: `${safe}.json`,
            content: JSON.stringify(inv, null, 2),
            mime: 'application/json;charset=utf-8',
        });
        markInvoiceExported(inv.slug);
        onBump();
    };

    const confirmArchive = () => {
        setArchiveModalOpen(false);
        if (archiveInvoice(invoice.slug)) {
            router.push('/company-admin/invoices');
        }
    };

    /* ------------------------------ payments tab handlers ------------------ */
    /** Remaining balance available to be recorded as a new payment. */
    const pmtRemainingBalance = Math.max(0, (invoice.totalAmount || 0) - (invoice.paidAmount || 0));

    /** Live projection of paid / balance / status as the user types. */
    const pmtAmountNumber = Number(pmtAmount);
    const pmtAmountValid = pmtAmount.trim() === '' ? 0 : Number.isFinite(pmtAmountNumber) ? Math.max(0, pmtAmountNumber) : 0;
    const projectedPaid = (invoice.paidAmount || 0) + pmtAmountValid;
    const projectedBalance = Math.max(0, (invoice.totalAmount || 0) - projectedPaid);
    const projectedAutoStatus = deriveInvoicePaymentStatus(invoice.totalAmount || 0, projectedPaid);

    const onSavePaymentUpdate = () => {
        const errs: { status?: string; amount?: string } = {};
        if (!pmtStatus) errs.status = 'Payment status is required.';
        if (pmtAmount.trim() !== '') {
            if (!Number.isFinite(pmtAmountNumber)) {
                errs.amount = 'Enter a valid amount.';
            } else if (pmtAmountNumber < 0) {
                errs.amount = 'Paid amount cannot be negative.';
            } else if (pmtAmountNumber > pmtRemainingBalance + 0.0001) {
                errs.amount = `Paid amount cannot exceed remaining balance (${formatMoney(pmtRemainingBalance, invoice.currency)}).`;
            }
        }
        setPmtErrors(errs);
        if (Object.keys(errs).length > 0) {
            setInlineToast({ msg: 'Please review the payment tracking fields.', err: true });
            return;
        }
        setPmtSaving(true);
        try {
            const amount = pmtAmount.trim() === '' ? 0 : Math.max(0, pmtAmountNumber);
            // If a non-zero amount is supplied → write a timeline entry first (auto-recalcs paid/balance/status).
            if (amount > 0) {
                addInvoicePayment(invoice.slug, {
                    paymentDate: pmtDate.trim() || new Date().toISOString().slice(0, 10),
                    amount,
                    mode: pmtMode,
                    transactionRef: pmtRef.trim(),
                    remarks: pmtRemarks.trim(),
                });
            }
            // After persisting (or skipping) the payment entry, apply explicit status override if needed.
            const latestPaid = (invoice.paidAmount || 0) + amount;
            const derived = deriveInvoicePaymentStatus(invoice.totalAmount || 0, latestPaid);
            if (derived !== pmtStatus) {
                updateInvoice(
                    invoice.slug,
                    {
                        paymentStatus: pmtStatus,
                        balanceAmount: deriveInvoiceBalance(invoice.totalAmount || 0, latestPaid),
                    },
                    {
                        actor: 'You',
                        title: 'Payment status updated',
                        body: `Status manually set to ${pmtStatus}.`,
                        actionType: 'status_changed',
                        severity: 'info',
                    },
                );
            }
            onBump();
            setPmtAmount('');
            setPmtDate('');
            setPmtRef('');
            setPmtRemarks('');
            setPmtErrors({});
            showStatusModal({
                type: 'success',
                title: amount > 0 ? 'Payment Recorded' : 'Payment Status Updated',
            });
        } catch {
            setInlineToast({ msg: 'Could not save payment update. Please try again.', err: true });
        } finally {
            setPmtSaving(false);
        }
    };

    const onResetPaymentForm = () => {
        setPmtStatus(invoice.paymentStatus);
        setPmtAmount('');
        setPmtDate('');
        setPmtMode('Bank Transfer');
        setPmtRef('');
        setPmtRemarks('');
        setPmtErrors({});
    };

    const onRemovePayment = (id: string) => {
        if (!window.confirm('Remove this payment? Balance will be recalculated.')) return;
        const ok = removeInvoicePayment(invoice.slug, id);
        if (ok) onBump();
    };

    /* ------------------------------ validation tab handlers ---------------- */
    const onSaveValidation = () => {
        const errs: { status?: string; validatedBy?: string } = {};
        if (!valStatus) errs.status = 'Validation status is required.';
        if (!valBy.trim()) errs.validatedBy = 'Validated by is required.';
        setValErrors(errs);
        if (Object.keys(errs).length > 0) {
            setInlineToast({ msg: 'Please fill all required validation fields.', err: true });
            const firstId = errs.status ? 'inv-val-status' : 'inv-val-by';
            const el = document.getElementById(firstId);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        const next = updateInvoiceValidation(invoice.slug, {
            status: valStatus,
            validatedBy: valBy.trim(),
            remarks: valRemarks.trim(),
        });
        if (next) {
            onBump();
            showStatusModal({ type: 'success', title: 'Validation Updated' });
        }
    };

    useEffect(() => {
        setValStatus(invoice.validation?.status ?? 'Pending');
        setValBy(invoice.validation?.validatedBy ?? '');
        setValRemarks(invoice.validation?.remarks ?? '');
        setValErrors({});
    }, [invoice.validation?.status, invoice.validation?.validatedBy, invoice.validation?.remarks]);

    /** Keep the inline Payment Status select in sync when the invoice changes (refresh / remote update). */
    useEffect(() => {
        setPmtStatus(invoice.paymentStatus);
    }, [invoice.paymentStatus]);

    /* ------------------------------ documents tab handlers ----------------- */
    const onDocumentsChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        if (!files.length) return;
        for (const f of files) {
            try {
                const url = await readFileAsDataUrl(f);
                const isInvoicePdf = f.type === 'application/pdf' && f.name.toLowerCase().includes('invoice');
                addInvoiceAttachment(invoice.slug, {
                    category: isInvoicePdf ? 'Invoice PDF' : f.type === 'application/pdf' ? 'Invoice PDF' : 'Supporting Document',
                    fileName: f.name,
                    sizeLabel: formatBytes(f.size),
                    mimeType: f.type || 'application/octet-stream',
                    url,
                });
            } catch {
                setInlineToast({ msg: `Could not read ${f.name}.`, err: true });
            }
        }
        if (docInputRef.current) docInputRef.current.value = '';
        onBump();
    };

    const onRemoveDocument = (id: string) => {
        if (!window.confirm('Remove this document?')) return;
        const ok = removeInvoiceAttachment(invoice.slug, id);
        if (ok) onBump();
    };

    /* ------------------------------ overview tab attachment handlers ------- */
    /** Classify by mime + filename so the Documents tab and the Overview tab stay in sync. */
    const classifyAttachment = useCallback((file: File): 'Invoice PDF' | 'Supporting Document' => {
        const isPdf = file.type === 'application/pdf';
        const lower = file.name.toLowerCase();
        const looksLikeInvoice = lower.includes('invoice') || lower.startsWith('inv-');
        if (isPdf && looksLikeInvoice) return 'Invoice PDF';
        if (isPdf) return 'Invoice PDF';
        return 'Supporting Document';
    }, []);

    const onOverviewUploadFiles = useCallback(
        async (files: File[]) => {
            if (!files.length) return;
            // CREATE mode → buffer as pending until invoice is created.
            if (isCreate) {
                const additions: PendingInvoiceAttachment[] = [];
                for (const f of files) {
                    try {
                        const url = await readFileAsDataUrl(f);
                        additions.push({
                            pendingId: `pending-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
                            category: classifyAttachment(f),
                            fileName: f.name,
                            sizeLabel: formatBytes(f.size),
                            mimeType: f.type || 'application/octet-stream',
                            url,
                        });
                    } catch {
                        setInlineToast({ msg: `Could not read ${f.name}.`, err: true });
                    }
                }
                if (additions.length) {
                    setPendingAttachments((prev) => [...prev, ...additions]);
                }
                return;
            }
            // VIEW / EDIT mode → persist immediately.
            for (const f of files) {
                try {
                    const url = await readFileAsDataUrl(f);
                    addInvoiceAttachment(invoice.slug, {
                        category: classifyAttachment(f),
                        fileName: f.name,
                        sizeLabel: formatBytes(f.size),
                        mimeType: f.type || 'application/octet-stream',
                        url,
                    });
                } catch {
                    setInlineToast({ msg: `Could not read ${f.name}.`, err: true });
                }
            }
            onBump();
        },
        [classifyAttachment, invoice.slug, isCreate, onBump],
    );

    const onOverviewRemoveAttachment = useCallback(
        (id: string) => {
            const ok = removeInvoiceAttachment(invoice.slug, id);
            if (ok) onBump();
        },
        [invoice.slug, onBump],
    );

    const onRemovePendingAttachment = useCallback((pendingId: string) => {
        setPendingAttachments((prev) => prev.filter((p) => p.pendingId !== pendingId));
    }, []);

    /* ------------------------------ notifications handlers ----------------- */
    const onToggleNotification = (key: keyof Invoice['notifications']) => {
        const next = updateInvoiceNotifications(invoice.slug, {
            [key]: !invoice.notifications[key],
        });
        if (next) onBump();
    };

    /* ------------------------------ history supplemental ------------------- */
    const historySupplemental = useMemo(
        () =>
            invoiceActivitiesToHistoryLogEntries(
                invoice.slug,
                invoice.invoiceNumber || invoice.invoiceId,
                invoice.activityLog ?? [],
            ),
        [invoice.slug, invoice.invoiceNumber, invoice.invoiceId, invoice.activityLog],
    );

    /* ------------------------------ shared UI primitives ------------------- */
    const utilityBtn = CTA_UTILITY_BTN;

    const createModeDisabledWrap = (children: React.ReactNode) => (
        <div>
            <div className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
                Create invoice to enable this section
            </div>
            <div className="opacity-50 pointer-events-none">{children}</div>
        </div>
    );

    /* ------------------------------ render --------------------------------- */
    return (
        <div className="w-full min-w-0 space-y-0">
            <StatusModal
                open={statusModal.open}
                type={statusModal.type}
                title={statusModal.title}
                subtitle={statusModal.subtitle}
                autoCloseMs={1750}
                onClose={() => {
                    const after = statusModal.afterClose;
                    setStatusModal((prev) => ({ ...prev, open: false, afterClose: undefined }));
                    if (after) after();
                }}
            />
            {inlineToast ? (
                <InlineToast
                    message={inlineToast.msg}
                    variant={inlineToast.err ? 'error' : 'success'}
                    onDismiss={() => setInlineToast(null)}
                />
            ) : null}

            <InvoiceMainTabBar
                active={tab}
                disabledKeys={isCreate ? (['validation', 'payments', 'documents', 'notifications', 'activity'] as TabId[]) : []}
                onChange={(next) => {
                    if (isCreate && next !== 'overview') {
                        setInlineToast({ msg: 'Create invoice to access other sections.', err: true });
                        return;
                    }
                    if (isInlineEditing && !isCreate && next !== 'overview') {
                        const ok = window.confirm('You are editing. Leave this tab and discard changes?');
                        if (!ok) return;
                        onCancelEdits();
                    }
                    setTab(next);
                }}
            />

            <div className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
                {isCreate && draftLoadedBanner ? (
                    <div className="mt-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="font-semibold text-slate-900">You are editing a draft</p>
                            <p className="text-xs font-medium text-slate-600">
                                {draftLastSavedAt ? `Last saved: ${formatIso(draftLastSavedAt)}` : 'Last saved: —'}
                            </p>
                        </div>
                    </div>
                ) : null}

                {/* =========================== OVERVIEW =========================== */}
                {tab === 'overview' ? (
                    <>
                        {isCreate ? (
                            <div className="mt-3 rounded-lg border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] p-3 text-sm font-medium text-slate-900">
                                You are creating a new invoice{' '}
                                <span className="ml-2 rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-white px-2 py-0.5 text-xs font-semibold text-slate-800">
                                    Draft
                                </span>
                            </div>
                        ) : null}

                        <div className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                {!isCreate ? (
                                    <div className="flex flex-wrap items-center gap-3" role="toolbar" aria-label="Invoice actions">
                                        {!isInlineEditing ? (
                                            <button
                                                type="button"
                                                onClick={() => setIsInlineEditing(true)}
                                                disabled={saving}
                                                className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md bg-[var(--cta-button-bg)] px-2.25 py-1.5 text-sm font-medium text-[var(--cta-button-text)] transition-colors hover:bg-[var(--cta-button-hover-bg)] hover:text-[var(--cta-button-hover-text)] disabled:opacity-50"
                                            >
                                                <LuPencil size={16} className="shrink-0" aria-hidden />
                                                <span className="whitespace-nowrap">Edit</span>
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled
                                                className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.25 py-1.5 text-sm font-medium text-slate-400"
                                            >
                                                <LuPencil size={16} className="shrink-0" aria-hidden />
                                                <span className="whitespace-nowrap">Editing</span>
                                            </button>
                                        )}

                                        <button type="button" onClick={onClone} disabled={saving || isInlineEditing} className={cn(utilityBtn, 'disabled:opacity-60')}>
                                            <LuCopy size={16} className="shrink-0" aria-hidden />
                                            <span className="whitespace-nowrap">Clone</span>
                                        </button>

                                        <button type="button" onClick={() => void onShare()} disabled={saving || isInlineEditing} className={cn(utilityBtn, 'disabled:opacity-60')}>
                                            <LuShare2 size={16} className="shrink-0" aria-hidden />
                                            <span className="whitespace-nowrap">Share</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setArchiveModalOpen(true)}
                                            disabled={saving || isInlineEditing}
                                            className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border border-rose-300 bg-white px-2.25 py-1.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
                                        >
                                            <LuTrash2 size={16} className="shrink-0" aria-hidden />
                                            <span className="whitespace-nowrap">Archive</span>
                                        </button>

                                        <Link href="/company-admin/invoices/view/new">
                                            <span className={utilityBtn}>
                                                <LuPlus size={16} className="shrink-0" aria-hidden />
                                                <span className="whitespace-nowrap">New</span>
                                            </span>
                                        </Link>
                                    </div>
                                ) : (
                                    <span />
                                )}

                                {!isCreate ? (
                                    <div className="flex flex-wrap items-center justify-start gap-3 sm:justify-end">
                                        <WorkspaceUtilityToolbar
                                            help={INVOICE_WORKSPACE_HELP}
                                            triggerLabel="Invoice workspace help"
                                            emailHref={
                                                invoice.partyName?.trim()
                                                    ? `mailto:?subject=${encodeURIComponent(`Invoice: ${invoice.invoiceId}`)}&body=${encodeURIComponent(`Invoice: ${invoice.invoiceId}\nNumber: ${invoice.invoiceNumber}\nParty: ${invoice.partyName}\n\nLink: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`
                                                    : null
                                            }
                                            onExport={() => exportInvoiceJson(invoice)}
                                            saving={saving}
                                            isInlineEditing={isInlineEditing}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap items-center justify-start gap-3 sm:justify-end">
                                        <Link href="/company-admin/invoices" className="text-sm font-semibold text-[var(--cta-button-bg)] underline decoration-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] underline-offset-2 hover:text-slate-800">
                                            Back to Invoices
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {!isCreate ? (
                            <div className="mt-2 rounded-md bg-white/80 px-4 py-2 text-sm text-gray-700">
                                <div className="flex justify-center flex-wrap items-center gap-x-6 gap-y-1">
                                    <span className="inline-flex items-center gap-2">
                                        <LuCalendar size={14} className="text-gray-500" aria-hidden />
                                        <span className="text-gray-600">Date Created</span>
                                        <span className="font-medium text-gray-900">{formatAuditTimestamp(invoice.createdAt)}</span>
                                    </span>
                                    <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                                    <span className="inline-flex items-center gap-2">
                                        <LuClock3 size={14} className="text-gray-500" aria-hidden />
                                        <span className="text-gray-600">Last updated</span>
                                        <span className="font-medium text-gray-900">{formatAuditTimestamp(invoice.updatedAt)}</span>
                                    </span>
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-3 grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-5">
                            <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:col-span-2">
                                <div
                                    className={cn(
                                        'flex min-h-0 min-w-0 flex-col rounded-xl border bg-white shadow-sm',
                                        isInlineEditing
                                            ? 'border-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]'
                                            : 'border-gray-200/80',
                                    )}
                                >
                                    <div className="px-4 py-4 sm:px-5 sm:py-5 bg-[#7185a217]">
                                        <div className="min-w-0 w-full">
                                            <div className="flex min-w-0 items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice</p>
                                                    <h2 className="mt-1 truncate text-xl font-semibold text-slate-900">
                                                        {draft.invoiceNumber?.trim() ? draft.invoiceNumber : isCreate ? 'New invoice' : invoice.invoiceNumber || invoice.invoiceId}
                                                    </h2>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <BpStatusBadge tone={validationTone(invoice.validation?.status ?? 'Pending')}>
                                                        {invoice.validation?.status ?? 'Pending'}
                                                    </BpStatusBadge>
                                                    <BpStatusBadge tone={paymentTone(draft.paymentStatus ?? invoice.paymentStatus)}>
                                                        {draft.paymentStatus ?? invoice.paymentStatus}
                                                    </BpStatusBadge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 min-w-0">
                                            <InvoiceInlineOverviewEditor
                                                invoice={invoice}
                                                isEditing={isInlineEditing}
                                                draft={draft}
                                                errors={errors as any}
                                                onDraftChange={onDraftChange}
                                                counterpartyOptions={counterpartyOptions}
                                                projectOptions={projectOptions}
                                                workOrderOptions={workOrderOptions}
                                                financeUserOptions={financeUserOptions}
                                                currencyOptions={INVOICE_CURRENCIES}
                                                partyTypeOptions={INVOICE_PARTY_TYPES}
                                                paymentStatusOptions={INVOICE_PAYMENT_STATUSES}
                                                paymentModeOptions={INVOICE_PAYMENT_MODES}
                                                purchaseOrderOptions={purchaseOrderOptions}
                                                linkedPrNumber={draft.linkedPrNumber || procurementLinkContext?.prNumber}
                                                isCreateMode={isCreate}
                                                pendingAttachments={pendingAttachments}
                                                onUploadFiles={onOverviewUploadFiles}
                                                onRemoveAttachment={onOverviewRemoveAttachment}
                                                onRemovePendingAttachment={onRemovePendingAttachment}
                                                onPreviewAttachment={(p) => setPreviewDoc(p)}
                                                procurementBilling={procurementBilling}
                                                procurementMaterialDrafts={procurementMaterialDrafts}
                                                onProcurementMaterialDraftsChange={setProcurementMaterialDrafts}
                                                procurementCharges={procurementCharges}
                                                onProcurementChargesChange={setProcurementCharges}
                                            />
                                        </div>

                                        {isInlineEditing ? (
                                            <div className="sticky bottom-0 z-30 mt-4 pb-1">
                                                <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur supports-backdrop-filter:bg-white/90 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {isCreate ? 'Create invoice to enable related sections' : 'You have unsaved changes'}
                                                        </p>
                                                    </div>
                                                    <div className="mt-3 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:items-center sm:justify-end">
                                                        {isCreate ? (
                                                            <>
                                                                <Button
                                                                    type="button"
                                                                    variant="companyOutline"
                                                                    size="cta"
                                                                    onClick={() => router.push(afterCreateOrCancelHref)}
                                                                    disabled={saving}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button type="button" variant="companyOutline" size="cta" onClick={saveDraftNow} isLoading={draftSaving} disabled={saving || draftSaving}>
                                                                    {draftSaving ? 'Saving...' : 'Save Draft'}
                                                                </Button>
                                                                <Button type="button" variant="company" size="cta" onClick={() => void onCreateInvoice()} isLoading={saving}>
                                                                    {saving ? 'Creating...' : 'Create Invoice'}
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button type="button" variant="companyOutline" size="cta" onClick={onCancelEdits} disabled={saving}>
                                                                    Cancel
                                                                </Button>
                                                                <Button type="button" variant="companyOutline" size="cta" onClick={() => void onSaveEdits({ exitAfter: false })} disabled={saving} isLoading={saving}>
                                                                    {saving ? 'Saving...' : 'Save'}
                                                                </Button>
                                                                <Button type="button" variant="company" size="cta" onClick={() => void onSaveEdits({ exitAfter: true })} disabled={saving} isLoading={saving}>
                                                                    {saving ? 'Saving...' : 'Save & Exit'}
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>

                            {/* Quick info sidebar */}
                            <div className="min-w-0 lg:col-span-1 lg:sticky lg:top-44 lg:self-start space-y-4">
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick info</p>
                                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                                        <p>
                                            <span className="font-semibold">Total</span>: {formatMoney(Number(draft.totalAmount) || 0, draft.currency)}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Paid</span>: {formatMoney(Number(draft.paidAmount) || 0, draft.currency)}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Balance</span>:{' '}
                                            {formatMoney(Math.max(0, (Number(draft.totalAmount) || 0) - (Number(draft.paidAmount) || 0)), draft.currency)}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Counterparty</span>: {draft.partyName || EMPTY_FIELD}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Project</span>: {draft.linkedProject || EMPTY_FIELD}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Export</span>:{' '}
                                            <BpStatusBadge tone={exportTone(invoice.exportStatus)}>{invoice.exportStatus}</BpStatusBadge>
                                        </p>
                                    </div>
                                </div>
                                {isSupplierInvoice && procurementBilling ? (
                                    <ProcurementInvoiceAIPanel billing={procurementBilling} currency={draft.currency || invoice.currency} />
                                ) : null}
                            </div>
                        </div>
                    </>
                ) : null}

                {/* =========================== VALIDATION =========================== */}
                {tab === 'validation' && !isCreate ? (
                    <CrmFieldProvider>
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-slate-900">Finance validation</h3>
                                        <p className="mt-1 text-xs font-medium text-slate-500">
                                            Approve or reject this invoice. Finance / Company admin only.
                                        </p>
                                    </div>
                                    <BpStatusBadge tone={validationTone(invoice.validation?.status ?? 'Pending')}>
                                        {invoice.validation?.status ?? 'Pending'}
                                    </BpStatusBadge>
                                </div>
                                <div className="mt-4 space-y-4">
                                    <SelectField
                                        id="inv-val-status"
                                        label="Validation Status"
                                        required
                                        value={valStatus}
                                        onChange={(e) => {
                                            setValStatus(e.target.value as InvoiceValidationStatus);
                                            if (valErrors.status) setValErrors((prev) => ({ ...prev, status: undefined }));
                                        }}
                                        options={INVOICE_VALIDATION_STATUSES.map((s) => ({ value: s, label: s }))}
                                        error={valErrors.status}
                                    />
                                    <SelectField
                                        id="inv-val-by"
                                        label="Validated By"
                                        required
                                        value={valBy}
                                        onChange={(e) => {
                                            setValBy(e.target.value);
                                            if (valErrors.validatedBy) setValErrors((prev) => ({ ...prev, validatedBy: undefined }));
                                        }}
                                        placeholder="Select user…"
                                        options={financeUserOptions.map((u) => ({ value: u, label: u }))}
                                        error={valErrors.validatedBy}
                                    />
                                    <TextAreaField
                                        id="inv-val-remarks"
                                        label="Remarks"
                                        value={valRemarks}
                                        onChange={(e) => setValRemarks(e.target.value)}
                                        placeholder={
                                            valStatus === 'Rejected'
                                                ? 'Explain why this invoice is being rejected.'
                                                : valStatus === 'Approved'
                                                  ? 'Confirm checks performed (BOQ match, GST, totals).'
                                                  : 'Audit note — visible to finance & admin.'
                                        }
                                    />
                                </div>
                                <div className="mt-5 flex flex-wrap justify-end gap-2">
                                    <Button type="button" variant="companyOutline" size="cta" onClick={() => {
                                        setValStatus(invoice.validation?.status ?? 'Pending');
                                        setValBy(invoice.validation?.validatedBy ?? '');
                                        setValRemarks(invoice.validation?.remarks ?? '');
                                        setValErrors({});
                                    }}>
                                        Reset
                                    </Button>
                                    <Button type="button" variant="company" size="cta" onClick={onSaveValidation}>
                                        <LuShieldCheck size={16} className="mr-1" aria-hidden />
                                        Save validation
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                                <h3 className="text-sm font-semibold text-slate-900">Last validation</h3>
                                <p className="mt-1 text-xs font-medium text-slate-500">Audit log of the most recent decision.</p>
                                <dl className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
                                    <div className="grid grid-cols-[160px_1fr] gap-2 px-3 py-2.5">
                                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
                                        <dd className="text-sm font-semibold text-slate-900">
                                            <BpStatusBadge tone={validationTone(invoice.validation?.status ?? 'Pending')}>
                                                {invoice.validation?.status ?? 'Pending'}
                                            </BpStatusBadge>
                                        </dd>
                                    </div>
                                    <div className="grid grid-cols-[160px_1fr] gap-2 px-3 py-2.5">
                                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Validated By</dt>
                                        <dd className="text-sm font-medium text-slate-800">{invoice.validation?.validatedBy?.trim() || EMPTY_FIELD}</dd>
                                    </div>
                                    <div className="grid grid-cols-[160px_1fr] gap-2 px-3 py-2.5">
                                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Validation Date</dt>
                                        <dd className="text-sm font-medium text-slate-800">{formatAuditTimestamp(invoice.validation?.validatedAt)}</dd>
                                    </div>
                                    <div className="grid grid-cols-[160px_1fr] gap-2 px-3 py-2.5">
                                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remarks</dt>
                                        <dd className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{invoice.validation?.remarks?.trim() || EMPTY_FIELD}</dd>
                                    </div>
                                    {invoice.validation?.status === 'Rejected' && invoice.validation?.rejectionRemarks?.trim() ? (
                                        <div className="grid grid-cols-[160px_1fr] gap-2 px-3 py-2.5">
                                            <dt className="text-xs font-semibold uppercase tracking-wide text-rose-600">Rejection Remarks</dt>
                                            <dd className="text-sm font-medium text-rose-800 whitespace-pre-wrap">{invoice.validation.rejectionRemarks}</dd>
                                        </div>
                                    ) : null}
                                </dl>
                            </div>
                        </div>
                    </CrmFieldProvider>
                ) : null}
                {tab === 'validation' && isCreate ? (
                    <div className="mt-4">
                        {createModeDisabledWrap(
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-sm text-slate-600">Validation workflow becomes available after the invoice is created.</p>
                            </div>,
                        )}
                    </div>
                ) : null}

                {/* =========================== PAYMENTS =========================== */}
                {tab === 'payments' && !isCreate ? (
                    <CrmFieldProvider>
                        <div className="space-y-4">
                           
                            {/* ---------------- Two-column body: form + summary/timeline -------------- */}
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                {/* LEFT — Payment Tracking form (spans 2/3) */}
                                <div className="lg:col-span-2">
                                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
                                            <div className="min-w-0">
                                                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white text-[var(--cta-button-bg)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]">
                                                        <LuCircleDollarSign size={16} aria-hidden />
                                                    </span>
                                                    Payment Tracking
                                                </h3>
                                                <p className="mt-0.5 text-xs font-medium text-slate-500">
                                                    Track invoice payments, balances, and finance updates.
                                                </p>
                                            </div>
                                            <PaymentStatusPill status={pmtStatus} />
                                        </div>

                                        <div className="px-4 py-4 sm:px-5 sm:py-5">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <SelectField
                                                    id="inv-pmt-status"
                                                    label="Payment Status"
                                                    required
                                                    value={pmtStatus}
                                                    onChange={(e) => {
                                                        setPmtStatus(e.target.value as InvoicePaymentStatus);
                                                        if (pmtErrors.status) setPmtErrors((p) => ({ ...p, status: undefined }));
                                                    }}
                                                    options={INVOICE_PAYMENT_STATUSES.map((s) => ({ value: s, label: s }))}
                                                    error={pmtErrors.status}
                                                />
                                                <InputField
                                                    id="inv-pmt-amount"
                                                    label="Paid Amount"
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={pmtAmount}
                                                    onChange={(e) => {
                                                        setPmtAmount(e.target.value.replace(/[^\d.]/g, ''));
                                                        if (pmtErrors.amount) setPmtErrors((p) => ({ ...p, amount: undefined }));
                                                    }}
                                                    placeholder="0"
                                                    error={pmtErrors.amount}
                                                />
                                                <div>
                                                    <p className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-700">
                                                        Balance Amount{' '}
                                                        <span className="text-[12px] font-medium normal-case tracking-normal text-gray-400">
                                                            (auto-calculated)
                                                        </span>
                                                    </p>
                                                    <div className="flex h-12 items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm font-semibold text-slate-900">
                                                        <span className="tabular-nums">
                                                            {formatMoney(projectedBalance, invoice.currency)}
                                                        </span>
                                                        {pmtAmountValid > 0 ? (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                                                                <LuArrowRight size={12} aria-hidden />
                                                                after this update
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <InputField
                                                    label="Payment Date"
                                                    type="date"
                                                    value={pmtDate}
                                                    onChange={(e) => setPmtDate(e.target.value)}
                                                />
                                                <SelectField
                                                    label="Payment Mode"
                                                    value={pmtMode}
                                                    onChange={(e) => setPmtMode(e.target.value as InvoicePaymentMode)}
                                                    options={INVOICE_PAYMENT_MODES.map((m) => ({ value: m, label: m }))}
                                                />
                                                <InputField
                                                    label="Transaction Reference"
                                                    value={pmtRef}
                                                    onChange={(e) => setPmtRef(e.target.value)}
                                                    placeholder="UTR / Cheque / UPI ref."
                                                />
                                            </div>

                                            <div className="mt-4">
                                                <TextAreaField
                                                    label="Finance Notes / Remarks"
                                                    value={pmtRemarks}
                                                    onChange={(e) => setPmtRemarks(e.target.value)}
                                                    placeholder="Optional internal note for finance approvers."
                                                />
                                            </div>

                                            {projectedAutoStatus !== pmtStatus && pmtAmountValid > 0 ? (
                                                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs font-medium text-amber-800">
                                                    <LuTriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden />
                                                    <span>
                                                        Based on the paid amount, the auto-calculated status would be{' '}
                                                        <strong>{projectedAutoStatus}</strong>. You&apos;ve manually selected{' '}
                                                        <strong>{pmtStatus}</strong> — this will override the auto value.
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* Sticky action footer */}
                                        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-5">
                                            <p className="text-[11px] font-medium text-slate-500">
                                                Remaining balance:{' '}
                                                <span className="font-semibold tabular-nums text-slate-700">
                                                    {formatMoney(pmtRemainingBalance, invoice.currency)}
                                                </span>
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    variant="companyOutline"
                                                    size="cta"
                                                    onClick={onResetPaymentForm}
                                                    disabled={pmtSaving}
                                                >
                                                    Reset
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="company"
                                                    size="cta"
                                                    className="gap-1"
                                                    onClick={onSavePaymentUpdate}
                                                    isLoading={pmtSaving}
                                                    disabled={pmtSaving}
                                                >
                                                    <LuCircleCheck size={16} aria-hidden />
                                                    {pmtSaving ? 'Saving…' : 'Save Payment Update'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT — Payment Summary card */}
                                <div className="lg:col-span-1">
                                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                        <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
                                            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white text-emerald-700 ring-1 ring-emerald-100">
                                                    <LuActivity size={16} aria-hidden />
                                                </span>
                                                Payment Summary
                                            </h3>
                                            <p className="mt-0.5 text-xs font-medium text-slate-500">Live finance snapshot.</p>
                                        </div>
                                        <dl className="divide-y divide-slate-100 px-4 py-2 text-sm sm:px-5">
                                            <SummaryRow label="Total Invoice Amount" value={formatMoney(invoice.totalAmount, invoice.currency)} />
                                            <SummaryRow
                                                label="Paid Amount"
                                                value={formatMoney(invoice.paidAmount, invoice.currency)}
                                                accent="emerald"
                                            />
                                            <SummaryRow
                                                label="Balance Amount"
                                                value={formatMoney(invoice.balanceAmount, invoice.currency)}
                                                accent="amber"
                                            />
                                            <SummaryRow
                                                label="Payment Status"
                                                value={<PaymentStatusPill status={invoice.paymentStatus} />}
                                            />
                                            <SummaryRow
                                                label="Last Payment"
                                                value={
                                                    invoice.payments.length
                                                        ? formatMoney(
                                                              invoice.payments.slice().sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1))[0]!.amount,
                                                              invoice.currency,
                                                          )
                                                        : EMPTY_FIELD
                                                }
                                            />
                                        </dl>
                                        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-2 sm:px-5">
                                            <p className="text-[11px] font-medium text-slate-500">
                                                Use the form on the left to record a new payment or override the status.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CrmFieldProvider>
                ) : null}
                {tab === 'payments' && isCreate ? (
                    <div className="mt-4">
                        {createModeDisabledWrap(
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-sm text-slate-600">Payments can be recorded after the invoice is created.</p>
                            </div>,
                        )}
                    </div>
                ) : null}

                {/* =========================== DOCUMENTS =========================== */}
                {tab === 'documents' && !isCreate ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">Invoice documents</h3>
                                <p className="mt-0.5 text-xs font-medium text-slate-500">PDF preview, version history, and compliance attachments.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    ref={docInputRef}
                                    type="file"
                                    accept="application/pdf,image/*"
                                    multiple
                                    onChange={(e) => void onDocumentsChosen(e)}
                                    className="hidden"
                                    id="inv-documents-upload"
                                />
                                <Button
                                    type="button"
                                    variant="company"
                                    size="cta"
                                    className="gap-2"
                                    onClick={() => docInputRef.current?.click()}
                                >
                                    <LuUpload size={16} />
                                    Upload files
                                </Button>
                            </div>
                        </div>

                        {invoice.attachments.length === 0 ? (
                            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                                <LuPaperclip size={24} className="mx-auto text-slate-400" aria-hidden />
                                <p className="mt-2 text-sm font-semibold text-slate-800">No documents uploaded yet</p>
                                <p className="mt-1 text-xs text-slate-500">Upload the invoice PDF, BOQ, GST certificate, or any other supporting files.</p>
                            </div>
                        ) : (
                            <ul className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
                                {invoice.attachments
                                    .slice()
                                    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
                                    .map((a) => (
                                        <li key={a.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)] text-[var(--cta-button-bg)]">
                                                <LuFileText size={18} aria-hidden />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewDoc({ fileName: a.fileName, url: a.url, mimeType: a.mimeType })}
                                                    className="block max-w-full truncate text-left text-sm font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline"
                                                >
                                                    {a.fileName}
                                                </button>
                                                <p className="text-xs font-medium text-slate-500">
                                                    {a.category} · {a.sizeLabel} · v{a.version} · uploaded {formatAuditTimestamp(a.uploadedAt)} by {a.uploadedBy}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={a.url}
                                                    download={a.fileName}
                                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    <LuDownload size={14} />
                                                    Download
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => onRemoveDocument(a.id)}
                                                    className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                                >
                                                    <LuTrash2 size={14} />
                                                    Remove
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </div>
                ) : null}
                {tab === 'documents' && isCreate ? (
                    <div className="mt-4">
                        {createModeDisabledWrap(
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-sm text-slate-600">Document upload available after the invoice is created.</p>
                            </div>,
                        )}
                    </div>
                ) : null}

                {/* =========================== NOTIFICATIONS =========================== */}
                {tab === 'notifications' && !isCreate ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <h3 className="text-sm font-semibold text-slate-900">Notification preferences</h3>
                        <p className="mt-1 text-xs font-medium text-slate-500">Configure alerts and reminders. Channels apply to all enabled alerts.</p>

                        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                            <NotificationToggle
                                label="Notify Vendor / Supplier"
                                helper="Send invoice receipt acknowledgement to the counterparty."
                                icon={LuMail}
                                value={invoice.notifications.notifyVendor}
                                onToggle={() => onToggleNotification('notifyVendor')}
                            />
                            <NotificationToggle
                                label="Payment Reminder"
                                helper="Reminder before scheduled payment date."
                                icon={LuWallet}
                                value={invoice.notifications.paymentReminder}
                                onToggle={() => onToggleNotification('paymentReminder')}
                            />
                            <NotificationToggle
                                label="Due Reminder"
                                helper="Daily reminders 3 days before due date."
                                icon={LuCalendar}
                                value={invoice.notifications.dueReminder}
                                onToggle={() => onToggleNotification('dueReminder')}
                            />
                            <NotificationToggle
                                label="Validation Alert"
                                helper="Notify when finance approves or rejects."
                                icon={LuBadgeCheck}
                                value={invoice.notifications.validationAlert}
                                onToggle={() => onToggleNotification('validationAlert')}
                            />
                            <NotificationToggle
                                label="Export Alert"
                                helper="Notify when invoice is exported to accounting."
                                icon={LuExternalLink}
                                value={invoice.notifications.exportAlert}
                                onToggle={() => onToggleNotification('exportAlert')}
                            />
                        </div>

                        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Channels</p>
                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <NotificationToggle compact label="Email" icon={LuMail} value={invoice.notifications.channelEmail} onToggle={() => onToggleNotification('channelEmail')} />
                                <NotificationToggle compact label="SMS" icon={LuBell} value={invoice.notifications.channelSms} onToggle={() => onToggleNotification('channelSms')} />
                                <NotificationToggle compact label="In-App" icon={LuActivity} value={invoice.notifications.channelInApp} onToggle={() => onToggleNotification('channelInApp')} />
                            </div>
                        </div>
                    </div>
                ) : null}
                {tab === 'notifications' && isCreate ? (
                    <div className="mt-4">
                        {createModeDisabledWrap(
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-sm text-slate-600">Notifications can be configured after the invoice is created.</p>
                            </div>,
                        )}
                    </div>
                ) : null}

                {/* =========================== HISTORY =========================== */}
                {tab === 'activity' && !isCreate ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <RecordHistoryLogPanel
                            module="invoices"
                            recordId={invoice.slug}
                            recordTitle={invoice.invoiceNumber || invoice.invoiceId}
                            supplementalEntries={historySupplemental}
                        />
                    </div>
                ) : null}
                {tab === 'activity' && isCreate ? (
                    <div className="mt-4">
                        {createModeDisabledWrap(
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-sm text-slate-600">History will be available after the invoice is created.</p>
                            </div>,
                        )}
                    </div>
                ) : null}
            </div>

            {/* Archive modal */}
            <Modal
                isOpen={archiveModalOpen}
                onClose={() => setArchiveModalOpen(false)}
                title="Archive invoice?"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setArchiveModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" className="bg-rose-600 hover:bg-rose-700" onClick={confirmArchive}>
                            <LuTrash2 size={16} className="mr-1" />
                            Archive
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Archiving moves <strong>{invoice.invoiceId}</strong> out of the active list. You can restore it from the archived list later.
                </p>
            </Modal>

            {/* Share modal */}
            <Modal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                title="Share invoice"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setShareModalOpen(false)}>
                            Close
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={copyShareLink}>
                            Copy link
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">Copy the link below to share this invoice with another user.</p>
                <input
                    readOnly
                    value={shareUrl}
                    className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                    onFocus={(e) => e.currentTarget.select()}
                />
            </Modal>

            {/* Document preview modal */}
            <Modal
                isOpen={Boolean(previewDoc)}
                onClose={() => setPreviewDoc(null)}
                title={previewDoc?.fileName ?? 'Document preview'}
                footer={
                    <Button type="button" variant="company" size="cta" onClick={() => setPreviewDoc(null)}>
                        Close
                    </Button>
                }
            >
                {previewDoc ? (
                    previewDoc.mimeType.startsWith('image/') ? (
                        <img src={previewDoc.url} alt={previewDoc.fileName} className="mx-auto max-h-[70vh] rounded" />
                    ) : previewDoc.mimeType === 'application/pdf' ? (
                        <iframe src={previewDoc.url} title={previewDoc.fileName} className="h-[70vh] w-full rounded border border-slate-200" />
                    ) : (
                        <p className="text-sm text-slate-600">Preview unavailable for this file type. Use Download to view.</p>
                    )
                ) : null}
            </Modal>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Notification toggle row                                                   */
/* -------------------------------------------------------------------------- */

function NotificationToggle({
    label,
    helper,
    icon: Icon,
    value,
    onToggle,
    compact,
}: {
    label: string;
    helper?: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    value: boolean;
    onToggle: () => void;
    compact?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3',
                compact ? 'py-2' : 'py-3',
            )}
        >
            <div className="flex min-w-0 items-center gap-2.5">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                    <Icon size={16} aria-hidden />
                </span>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
                    {helper ? <p className="truncate text-xs text-slate-500">{helper}</p> : null}
                </div>
            </div>
            <ToggleSwitch checked={value} onCheckedChange={onToggle} />
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Payment tab — helpers                                                     */
/* -------------------------------------------------------------------------- */

const PAYMENT_TONE_STYLES: Record<'slate' | 'emerald' | 'amber' | 'blue', { card: string; chip: string; label: string; value: string }> = {
    slate: {
        card: 'border-slate-200 bg-white',
        chip: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
        label: 'text-slate-500',
        value: 'text-slate-900',
    },
    emerald: {
        card: 'border-emerald-100 bg-emerald-50/40',
        chip: 'bg-white text-emerald-700 ring-1 ring-emerald-100',
        label: 'text-emerald-700',
        value: 'text-emerald-900',
    },
    amber: {
        card: 'border-amber-100 bg-amber-50/40',
        chip: 'bg-white text-amber-700 ring-1 ring-amber-100',
        label: 'text-amber-700',
        value: 'text-amber-900',
    },
    blue: {
        card: 'border-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]',
        chip: 'bg-white text-[var(--cta-button-bg)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]',
        label: 'text-[var(--cta-button-bg)]',
        value: 'text-slate-900',
    },
};

function PaymentSummaryCard({
    label,
    value,
    helper,
    icon,
    tone,
}: {
    label: string;
    value: React.ReactNode;
    helper?: string;
    icon: React.ReactNode;
    tone: 'slate' | 'emerald' | 'amber' | 'blue';
}) {
    const t = PAYMENT_TONE_STYLES[tone];
    return (
        <div className={cn('rounded-xl border p-4 shadow-sm transition-colors', t.card)}>
            <div className="flex items-center justify-between gap-2">
                <p className={cn('text-[11px] font-bold uppercase tracking-wider', t.label)}>{label}</p>
                <span className={cn('inline-flex h-8 w-8 items-center justify-center rounded-md', t.chip)}>{icon}</span>
            </div>
            <p className={cn('mt-2 text-lg font-bold tabular-nums sm:text-xl', t.value)}>{value}</p>
            {helper ? <p className="mt-1 text-[11px] font-medium text-slate-500">{helper}</p> : null}
        </div>
    );
}

function PaymentStatusSummaryCard({ status }: { status: InvoicePaymentStatus }) {
    const tone: 'slate' | 'emerald' | 'amber' | 'blue' =
        status === 'Paid' ? 'emerald' : status === 'Partial' ? 'blue' : 'amber';
    const t = PAYMENT_TONE_STYLES[tone];
    const Icon =
        status === 'Paid' ? LuCircleCheck : status === 'Partial' ? LuActivity : LuClock3;
    return (
        <div className={cn('rounded-xl border p-4 shadow-sm transition-colors', t.card)}>
            <div className="flex items-center justify-between gap-2">
                <p className={cn('text-[11px] font-bold uppercase tracking-wider', t.label)}>Status</p>
                <span className={cn('inline-flex h-8 w-8 items-center justify-center rounded-md', t.chip)}>
                    <Icon size={18} aria-hidden />
                </span>
            </div>
            <div className="mt-2 flex items-center">
                <PaymentStatusPill status={status} />
            </div>
            <p className="mt-1 text-[11px] font-medium text-slate-500">
                {status === 'Paid'
                    ? 'Invoice is fully settled.'
                    : status === 'Partial'
                      ? 'Partial payment received.'
                      : 'No payment received yet.'}
            </p>
        </div>
    );
}

function PaymentStatusPill({ status }: { status: InvoicePaymentStatus }) {
    if (status === 'Paid') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                <LuCircleCheck size={12} aria-hidden /> Paid
            </span>
        );
    }
    if (status === 'Partial') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2.5 py-0.5 text-xs font-semibold text-slate-800 ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_25%,transparent)]">
                <LuActivity size={12} aria-hidden /> Partial
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
            <LuClock3 size={12} aria-hidden /> Pending
        </span>
    );
}

function SummaryRow({
    label,
    value,
    accent,
}: {
    label: string;
    value: React.ReactNode;
    accent?: 'emerald' | 'amber';
}) {
    return (
        <div className="flex items-center justify-between gap-3 py-2.5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
            <dd
                className={cn(
                    'text-sm font-semibold tabular-nums text-slate-900',
                    accent === 'emerald' && 'text-emerald-700',
                    accent === 'amber' && 'text-amber-700',
                )}
            >
                {value}
            </dd>
        </div>
    );
}

function paymentModeIcon(mode: string) {
    switch (mode) {
        case 'Bank Transfer':
            return <LuLandmark size={14} aria-hidden />;
        case 'UPI':
            return <LuQrCode size={14} aria-hidden />;
        case 'Cash':
            return <LuBanknote size={14} aria-hidden />;
        case 'Cheque':
            return <LuFileText size={14} aria-hidden />;
        case 'Card':
            return <LuCreditCard size={14} aria-hidden />;
        default:
            return <LuWallet size={14} aria-hidden />;
    }
}

function PaymentTimelineItem({
    index,
    payment,
    currency,
    onRemove,
}: {
    index: number;
    payment: InvoicePaymentEntry;
    currency: InvoiceCurrency;
    onRemove: () => void;
}) {
    return (
        <li className="relative">
            <span
                className="absolute -left-[27px] top-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--cta-button-bg)] ring-4 ring-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]"
                aria-hidden
            />
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-slate-300">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-base font-bold tabular-nums text-slate-900">
                            {formatMoney(payment.amount, currency)}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 text-slate-700 ring-1 ring-slate-200">
                                {paymentModeIcon(payment.mode)}
                                {payment.mode}
                            </span>
                            {payment.paymentDate ? (
                                <span className="inline-flex items-center gap-1">
                                    <LuCalendar size={12} aria-hidden />
                                    {payment.paymentDate}
                                </span>
                            ) : null}
                            {payment.transactionRef ? (
                                <span className="truncate font-mono text-[11px] text-slate-600">
                                    Ref: {payment.transactionRef}
                                </span>
                            ) : null}
                        </div>
                        {payment.remarks ? (
                            <p className="mt-1.5 text-xs text-slate-600 whitespace-pre-wrap">{payment.remarks}</p>
                        ) : null}
                        <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                            #{index} · Added by {payment.recordedBy}
                            {payment.recordedAt
                                ? ` · ${new Date(payment.recordedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`
                                : ''}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-rose-200 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        title="Remove payment"
                        aria-label="Remove payment"
                    >
                        <LuTrash2 size={12} aria-hidden />
                        Remove
                    </button>
                </div>
            </div>
        </li>
    );
}
