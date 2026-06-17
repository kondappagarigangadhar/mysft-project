'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { StatusModal } from '@/components/ui/StatusModal';
import { Modal } from '@/components/ui/Modal';
import { EditableField, EditableSelect, EditableTextarea } from '@/components/leads/detail/InlineEditableSection';
import { draftService } from '@/lib/draftService';
import { RecordHistoryLogPanel } from '@/components/history-logs/RecordHistoryLogPanel';
import { purchaseRequestActivitiesToHistoryLogEntries } from '@/lib/historyLogs/recordHistoryAdapters';
import { PurchaseRequestMainTabBar } from '@/components/purchase-requests/detail/PurchaseRequestMainTabBar';
import type { PurchaseRequestDetailMainTabId } from '@/components/purchase-requests/detail/purchaseRequestDetailTabIds';
import { normalizePurchaseRequestDetailTab } from '@/components/purchase-requests/detail/purchaseRequestDetailTabIds';
import {
    addPurchaseRequestFromCoreFields,
    archivePurchaseRequest,
    currentPurchaseRequestActor,
    duplicatePurchaseRequest,
    getActiveProjectNames,
    getMaterialCatalogMaterialNames,
    isRequiredDateInFuture,
    updatePurchaseRequest,
    type PrSupplierQuoteStored,
    type PurchaseRequest,
    type PurchaseRequestApprovalStatus,
    type PurchaseRequestPriority,
} from '@/lib/purchaseRequestStore';
import {
    buildPrSupplierQuoteRows,
    preserveQuotesFromStored,
} from '@/lib/procurement/prSupplierQuotes';
import { computePrProcurementSummary } from '@/lib/procurement/prLinkedPurchaseOrders';
import {
    computeAiProcurementInsights,
    computeProcurementWorkflowSteps,
} from '@/lib/procurement/prProcurementWorkflow';
import { getPurchaseOrdersByPrSlug, type PurchaseOrder } from '@/lib/purchaseOrderStore';
import { PrAiProcurementInsightsPanel } from '@/components/purchase-requests/PrAiProcurementInsights';
import { PrApprovalTimelinePanel } from '@/components/purchase-requests/PrApprovalTimelinePanel';
import { getInvoicesForPurchaseRequest } from '@/lib/procurement/prLinkedInvoices';
import { buildInvoiceDraftFromPr, computePrInvoiceSummary } from '@/lib/procurement/prLinkedInvoices';
import { PrLinkInvoiceModal } from '@/components/purchase-requests/PrLinkInvoiceModal';
import { PrLinkedInvoicesSummary } from '@/components/purchase-requests/PrLinkedInvoicesSummary';
import { PrLinkedInvoicesTable } from '@/components/purchase-requests/PrLinkedInvoicesTable';
import type { InvoiceOverviewDraft } from '@/components/invoices/InvoiceInlineOverviewEditor';
import { PrLinkPurchaseOrderModal } from '@/components/purchase-requests/PrLinkPurchaseOrderModal';
import { PrLinkedPurchaseOrdersSummary } from '@/components/purchase-requests/PrLinkedPurchaseOrdersSummary';
import { PrLinkedPurchaseOrdersTable } from '@/components/purchase-requests/PrLinkedPurchaseOrdersTable';
import { PrSupplierComparisonTable } from '@/components/purchase-requests/PrSupplierComparisonTable';
import { PrProcurementWorkflowStepper } from '@/components/purchase-requests/PrProcurementWorkflowStepper';
import { createWorkflowStepHandler } from '@/lib/workflow/workflowStepNavigation';
import { getAllSupplierRecords } from '@/lib/suppliers/supplierStore';
import { cn } from '@/lib/utils';
import { CTA_UTILITY_BTN } from '@/lib/theme/ctaThemeClasses';
import { WorkspaceUtilityToolbar, PURCHASE_REQUEST_WORKSPACE_HELP } from '@/components/workspace-help';
import {
    LuBadgeCheck,
    LuCalendar,
    LuChevronDown,
    LuClipboardList,
    LuClock3,
    LuDownload,
    LuEllipsis,
    LuPencil,
    LuPrinter,
    LuCopy,
    LuShare2,
    LuStore,
    LuTrash2,
    LuLink,
    LuPlus,
    LuReceipt,
} from 'react-icons/lu';

type TabId = PurchaseRequestDetailMainTabId;

type OverviewDraft = {
    prNumber: string;
    requestedBy: string;
    project: string;
    material: string;
    quantity: string;
    requiredDate: string;
    priority: PurchaseRequestPriority | '';
    notes: string;
    approvalStatus: PurchaseRequestApprovalStatus;
    approvalRemarks: string;
    approvedBy: string;
    approvalDate: string | null;
    selectedSupplierId: string | null;
    supplierQuotes: PrSupplierQuoteStored[];
};

type PrDraftData = OverviewDraft;

const PRIORITY_OPTIONS: PurchaseRequestPriority[] = ['High', 'Medium', 'Low'];
const APPROVAL_OPTIONS: PurchaseRequestApprovalStatus[] = ['Pending', 'Approved', 'Rejected'];

const EMPTY_FIELD = '—';

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

function approvalBadge(status: PurchaseRequestApprovalStatus) {
    const s = status.toLowerCase();
    const base = 'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold';
    if (s === 'approved') return cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-800');
    if (s === 'rejected') return cn(base, 'border-rose-200 bg-rose-50 text-rose-800');
    return cn(base, 'border-amber-200 bg-amber-50 text-amber-900');
}

function priorityBadgeUi(p: string) {
    const s = p.toLowerCase();
    const base = 'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold';
    if (s === 'high') return cn(base, 'border-rose-200 bg-rose-50 text-rose-900');
    if (s === 'low') return cn(base, 'border-slate-200 bg-slate-50 text-slate-700');
    return cn(base, 'border-amber-200 bg-amber-50 text-amber-900');
}

/** Matches supplier profile inline editor input styling (`InlineEditableSection`). */
const PR_INLINE_BASE_INPUT =
    'w-full rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]';

type PrFieldRowProps = {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
    id?: string;
};

function PrFieldRow({ label, required, children, className, id }: PrFieldRowProps) {
    return (
        <div id={id} className={cn('flex w-full items-center gap-3 border-b border-gray-200/80 px-3 py-2.5 odd:bg-gray-50/50', className)}>
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
            <div className="flex w-full min-w-0 items-center gap-2 text-[15px] font-medium text-gray-900">
                <span className="text-gray-300" aria-hidden>
                    :
                </span>
                <span className="w-full min-w-0">{children}</span>
            </div>
        </div>
    );
}

/** Same interaction chrome as supplier profile `InlineCollapsibleSection`. */
function PrCollapsibleSection({
    title,
    icon: Icon,
    tone = 'slate',
    open,
    onOpenChange,
    headerRight,
    sectionId,
    children,
    className,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    tone?: 'blue' | 'amber' | 'slate';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    headerRight?: React.ReactNode;
    sectionId?: string;
    children: React.ReactNode;
    className?: string;
}) {
    const toneClasses =
        tone === 'blue'
            ? { head: 'bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]', icon: 'text-[var(--cta-button-bg)]', ring: 'ring-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]' }
            : tone === 'amber'
              ? { head: 'bg-amber-50/80', icon: 'text-amber-800', ring: 'ring-amber-100/80' }
              : { head: 'bg-slate-50/80', icon: 'text-slate-700', ring: 'ring-slate-200/70' };

    return (
        <section id={sectionId} className={cn('overflow-hidden rounded-xl border border-gray-300 bg-white shadow-none', className)}>
            <button
                type="button"
                onClick={() => onOpenChange(!open)}
                aria-expanded={open}
                className={cn('flex w-full items-center gap-2.5 border-b border-gray-300 px-3 py-2 text-left transition hover:brightness-[0.99]', toneClasses.head)}
            >
                <span className={cn('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/90 ring-1', toneClasses.ring)} aria-hidden>
                    <Icon className={cn('h-4 w-4', toneClasses.icon)} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-semibold uppercase tracking-wide text-gray-800">{title}</span>
                        {headerRight ? <span className="ml-auto shrink-0">{headerRight}</span> : null}
                    </span>
                </span>
                <LuChevronDown className={cn('h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
            </button>
            <div hidden={!open} className="bg-white">
                {children}
            </div>
        </section>
    );
}

function PrEditableLookupSelect({
    isEditing,
    error,
    id,
    value,
    onChange,
    options,
    placeholder,
    readValue,
}: {
    isEditing: boolean;
    error?: string;
    id?: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    readValue: React.ReactNode;
}) {
    const [entered, setEntered] = React.useState(false);
    React.useEffect(() => {
        if (!isEditing) return;
        const t = window.requestAnimationFrame(() => setEntered(true));
        return () => window.cancelAnimationFrame(t);
    }, [isEditing]);

    if (!isEditing) return <>{readValue}</>;

    const borderClass = error
        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/25'
        : 'border-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] focus:border-[var(--cta-button-bg)]';

    return (
        <div
            className={cn(
                'w-full min-w-0 transition-[opacity,transform] duration-200 ease-out',
                entered ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
            )}
        >
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-invalid={Boolean(error)}
                className={cn(PR_INLINE_BASE_INPUT, 'h-10', borderClass)}
            >
                {placeholder ? (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                ) : null}
                {options.map((o) => (
                    <option key={o.value || 'empty'} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            {error ? <p className="mt-1 text-xs font-medium text-rose-600">{error}</p> : null}
        </div>
    );
}

function buildDraftFromPr(pr: PurchaseRequest): OverviewDraft {
    const sel = pr.supplierSelection ?? { selectedSupplierId: null as string | null, quotes: [] as PrSupplierQuoteStored[] };
    return {
        prNumber: pr.prNumber,
        requestedBy: pr.requestedBy,
        project: pr.project,
        material: String(pr.material ?? '').trim(),
        quantity: String(pr.quantity),
        requiredDate: pr.requiredDate,
        priority: pr.priority,
        notes: pr.notes ?? '',
        approvalStatus: pr.approval.status,
        approvalRemarks: pr.approval.remarks ?? '',
        approvedBy: pr.approval.approvedBy ?? '',
        approvalDate: pr.approval.approvalDate,
        selectedSupplierId: sel.selectedSupplierId,
        supplierQuotes: Array.isArray(sel.quotes) ? sel.quotes : [],
    };
}

function hasAnyDraftValue(d: OverviewDraft): boolean {
    return [d.project, d.material, d.quantity, d.notes, d.approvalRemarks].some((v) => String(v).trim() !== '');
}

export function PurchaseRequestRecordTabs({
    purchaseRequest,
    listVersion,
    onBump,
    createMode = false,
}: {
    purchaseRequest: PurchaseRequest;
    listVersion: number;
    onBump: () => void;
    createMode?: boolean;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isCreate = createMode;

    const [tab, setTabState] = useState<TabId>(() => normalizePurchaseRequestDetailTab(searchParams.get('tab')));
    const setTab = useCallback(
        (next: TabId) => {
            if (isCreate && next !== 'overview') return;
            setTabState(next);
            const url = `/procurement/requests/view/${encodeURIComponent(isCreate ? 'new' : purchaseRequest.slug)}?tab=${encodeURIComponent(next)}`;
            router.replace(url, { scroll: false });
        },
        [isCreate, router, purchaseRequest.slug],
    );

    useEffect(() => {
        const fromUrl = normalizePurchaseRequestDetailTab(searchParams.get('tab'));
        setTabState(isCreate ? 'overview' : fromUrl);
    }, [searchParams, isCreate]);

    useEffect(() => {
        if (!isCreate) return;
        if (tab === 'overview') return;
        setTabState('overview');
        router.replace(`/procurement/requests/view/new?tab=overview`, { scroll: false });
    }, [isCreate, tab, router]);

    const [isInlineEditing, setIsInlineEditing] = useState(isCreate ? true : false);
    const [draft, setDraft] = useState<OverviewDraft>(() => buildDraftFromPr(purchaseRequest));
    const [errors, setErrors] = useState<Partial<Record<keyof OverviewDraft, string>>>({});
    const [saving, setSaving] = useState(false);
    const [draftSaving, setDraftSaving] = useState(false);
    const [inlineToast, setInlineToast] = useState<{ msg: string; err: boolean } | null>(null);
    const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
    const [draftLastSavedAt, setDraftLastSavedAt] = useState<string | null>(null);
    const [draftLoadedBanner, setDraftLoadedBanner] = useState(false);
    const [statusModal, setStatusModal] = useState<{
        open: boolean;
        type: 'success' | 'error';
        title: string;
        subtitle?: string;
        afterClose?: () => void;
    }>({ open: false, type: 'success', title: '' });

    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [archiveModalOpen, setArchiveModalOpen] = useState(false);

    const showStatusModal = useCallback(
        ({ type, title, subtitle, afterClose }: { type: 'success' | 'error'; title: string; subtitle?: string; afterClose?: () => void }) => {
            setStatusModal({ open: true, type, title, subtitle, afterClose });
        },
        [],
    );

    const projectOptions = useMemo(() => getActiveProjectNames(), []);
    const materialOptions = useMemo(() => getMaterialCatalogMaterialNames(), []);

    const [supplierLookupSearch, setSupplierLookupSearch] = useState('');

    const [prSectionsOpen, setPrSectionsOpen] = useState({
        requestDetails: true,
        approval: true,
        supplierSelection: true,
    });

    const [poListVersion, setPoListVersion] = useState(0);
    const [invoiceListVersion, setInvoiceListVersion] = useState(0);
    const [linkPoModalOpen, setLinkPoModalOpen] = useState(false);
    const [linkInvoiceModalOpen, setLinkInvoiceModalOpen] = useState(false);

    useEffect(() => {
        const onPoUpdate = () => setPoListVersion((n) => n + 1);
        window.addEventListener('arris-purchase-orders-updated', onPoUpdate);
        return () => window.removeEventListener('arris-purchase-orders-updated', onPoUpdate);
    }, []);

    useEffect(() => {
        const onInvoiceUpdate = () => setInvoiceListVersion((n) => n + 1);
        window.addEventListener('arris-invoices-updated', onInvoiceUpdate);
        return () => window.removeEventListener('arris-invoices-updated', onInvoiceUpdate);
    }, []);

    const linkedPurchaseOrders = useMemo(() => {
        if (isCreate) return [];
        return getPurchaseOrdersByPrSlug(purchaseRequest.slug);
    }, [isCreate, purchaseRequest.slug, poListVersion, listVersion]);

    const linkedInvoices = useMemo(() => {
        if (isCreate) return [];
        return getInvoicesForPurchaseRequest(purchaseRequest.slug);
    }, [isCreate, purchaseRequest.slug, invoiceListVersion, listVersion]);

    const procurementSummary = useMemo(
        () => (isCreate ? computePrProcurementSummary('') : computePrProcurementSummary(purchaseRequest.slug)),
        [isCreate, purchaseRequest.slug, poListVersion, listVersion],
    );

    const invoiceSummary = useMemo(
        () => (isCreate ? computePrInvoiceSummary('') : computePrInvoiceSummary(purchaseRequest.slug)),
        [isCreate, purchaseRequest.slug, invoiceListVersion, listVersion],
    );

    const canManageLinkedPos = !isCreate && draft.approvalStatus === 'Approved';
    const canManageInvoices = canManageLinkedPos && linkedPurchaseOrders.length > 0;

    const createPoHref = useMemo(() => {
        const q = new URLSearchParams({ tab: 'overview', prSlug: purchaseRequest.slug, returnPrSlug: purchaseRequest.slug });
        return `/procurement/purchase-orders/view/new?${q.toString()}`;
    }, [purchaseRequest.slug]);

    const comparisonRows = useMemo(() => {
        const mat =
            String(draft.material ?? '').trim() || String(purchaseRequest.material ?? '').trim();
        return buildPrSupplierQuoteRows(mat, preserveQuotesFromStored(draft.supplierQuotes));
    }, [draft.material, draft.supplierQuotes, purchaseRequest.material, listVersion]);

    const workflowSteps = useMemo(
        () =>
            computeProcurementWorkflowSteps({
                isCreate,
                approvalStatus: draft.approvalStatus,
                selectedSupplierId: draft.selectedSupplierId,
                linkedPoCount: linkedPurchaseOrders.length,
                orders: linkedPurchaseOrders,
                linkedInvoiceCount: linkedInvoices.length,
                invoices: linkedInvoices,
            }),
        [isCreate, draft.approvalStatus, draft.selectedSupplierId, linkedPurchaseOrders, linkedInvoices],
    );

    const onWorkflowStepNavigate = useCallback(
        createWorkflowStepHandler({
            currentTab: tab,
            setTab: (next) => setTab(next as TabId),
            isCreate,
            onBlocked: (msg) => setInlineToast({ msg, err: true }),
        }),
        [tab, setTab, isCreate],
    );

    const aiInsights = useMemo(
        () =>
            computeAiProcurementInsights({
                material: draft.material ?? purchaseRequest.material,
                approvalStatus: draft.approvalStatus,
                selectedSupplierId: draft.selectedSupplierId,
                comparisonRows,
                orders: linkedPurchaseOrders,
                invoices: linkedInvoices,
                priority: draft.priority || purchaseRequest.priority,
            }),
        [
            draft.material,
            draft.approvalStatus,
            draft.selectedSupplierId,
            draft.priority,
            comparisonRows,
            linkedPurchaseOrders,
            linkedInvoices,
            purchaseRequest.material,
            purchaseRequest.priority,
        ],
    );

    const activeSupplierOptions = useMemo(() => {
        const q = supplierLookupSearch.trim().toLowerCase();
        return getAllSupplierRecords()
            .filter((s) => s.status === 'Active')
            .filter((s) => !q || `${s.name} ${s.city}`.toLowerCase().includes(q))
            .map((s) => ({ value: s.id, label: `${s.name}${s.city ? ` · ${s.city}` : ''}` }));
    }, [supplierLookupSearch, listVersion]);

    const supplierSectionLocked = isCreate || !isInlineEditing || draft.approvalStatus !== 'Approved';

    const fieldIsEditing = isCreate || isInlineEditing;

    const selectedSupplierReadLabel = useMemo(() => {
        if (!draft.selectedSupplierId?.trim()) return EMPTY_FIELD;
        const fromOpts = activeSupplierOptions.find((x) => x.value === draft.selectedSupplierId);
        if (fromOpts) return fromOpts.label;
        const rec = getAllSupplierRecords().find((s) => s.id === draft.selectedSupplierId);
        return rec?.name ?? draft.selectedSupplierId;
    }, [draft.selectedSupplierId, activeSupplierOptions, listVersion]);

    const onCreateInvoiceForPo = useCallback(
        (po: PurchaseOrder) => {
            const supplier = getAllSupplierRecords().find((s) => s.id === draft.selectedSupplierId?.trim());
            const supplierName = po.supplierName?.trim() || supplier?.name || '';
            const draftData: InvoiceOverviewDraft = buildInvoiceDraftFromPr({
                pr: purchaseRequest,
                linkedPos: linkedPurchaseOrders,
                supplierName,
                preferredPoNumber: po.poNumber,
            });
            const saved = draftService.saveDraft<InvoiceOverviewDraft>('invoice', draftData);
            const q = new URLSearchParams({
                tab: 'overview',
                draftId: saved.draftId,
                returnPrSlug: purchaseRequest.slug,
                returnPoNumber: po.poNumber,
            });
            router.push(`/company-admin/invoices/view/new?${q.toString()}`);
        },
        [draft.selectedSupplierId, linkedPurchaseOrders, purchaseRequest, router],
    );

    const requestDetailsErrorCount = useMemo(() => {
        if (!fieldIsEditing) return 0;
        const keys: (keyof OverviewDraft)[] = ['project', 'material', 'quantity', 'requiredDate', 'priority'];
        return keys.filter((k) => Boolean(errors[k])).length;
    }, [fieldIsEditing, errors]);

    const supplierSelectionErrorCount = useMemo(() => {
        if (!fieldIsEditing || draft.approvalStatus !== 'Approved') return 0;
        return errors.selectedSupplierId ? 1 : 0;
    }, [fieldIsEditing, draft.approvalStatus, errors.selectedSupplierId]);

    const onMaterialPicked = useCallback(
        (value: string) => {
            setDraft((prev) => {
                const prevQuotes = prev.supplierQuotes;
                const built = buildPrSupplierQuoteRows(value, preserveQuotesFromStored(prevQuotes));
                return {
                    ...prev,
                    material: value,
                    supplierQuotes: built.map((r) => ({
                        supplierId: r.supplierId,
                        quotedPrice: r.quotedPrice ?? 0,
                        currency: r.currency,
                    })),
                };
            });
            setErrors((prev) => {
                if (!prev.material) return prev;
                const n = { ...prev };
                delete n.material;
                return n;
            });
        },
        [],
    );

    const onQuotePriceChange = useCallback((supplierId: string, raw: string, currency: string) => {
        const n = Number(raw);
        setDraft((prev) => {
            const quotes = [...prev.supplierQuotes];
            const idx = quotes.findIndex((q) => q.supplierId === supplierId);
            const row = { supplierId, quotedPrice: Number.isFinite(n) ? n : 0, currency: currency || 'INR' };
            if (idx >= 0) quotes[idx] = row;
            else quotes.push(row);
            return { ...prev, supplierQuotes: quotes };
        });
    }, []);

    const utilityBtn = CTA_UTILITY_BTN;

    const runValidation = useCallback(() => {
        const next: Partial<Record<keyof OverviewDraft, string>> = {};
        if (!draft.project.trim()) next.project = 'Project is required.';
        if (!draft.material.trim()) next.material = 'Material is required.';
        const qty = Number(draft.quantity);
        if (!draft.quantity.trim() || !Number.isFinite(qty) || qty <= 0) next.quantity = 'Quantity must be greater than 0.';
        if (!draft.requiredDate.trim()) next.requiredDate = 'Required date is mandatory.';
        else if (!isRequiredDateInFuture(draft.requiredDate)) next.requiredDate = 'Required date must be in the future.';
        if (!draft.priority.trim()) next.priority = 'Priority is required.';
        if (draft.approvalStatus === 'Approved') {
            if (!draft.selectedSupplierId?.trim()) next.selectedSupplierId = 'Select a supplier.';
            else {
                const quote = draft.supplierQuotes.find((q) => q.supplierId === draft.selectedSupplierId);
                if (!quote || !Number.isFinite(quote.quotedPrice) || quote.quotedPrice <= 0) {
                    next.selectedSupplierId = 'Quoted price must be greater than 0 for the selected supplier.';
                }
            }
        }
        return next;
    }, [draft]);

    const focusFirstError = (nextErrors: Partial<Record<keyof OverviewDraft, string>>) => {
        const order: (keyof OverviewDraft)[] = [
            'project',
            'material',
            'quantity',
            'requiredDate',
            'priority',
            'selectedSupplierId',
            'notes',
            'approvalRemarks',
        ];
        const idMap: Partial<Record<keyof OverviewDraft, string>> = {
            project: 'pr-field-project',
            material: 'pr-field-material',
            quantity: 'pr-field-quantity',
            requiredDate: 'pr-field-requiredDate',
            priority: 'pr-field-priority',
            selectedSupplierId: 'pr-field-selectedSupplier',
            notes: 'pr-field-notes',
            approvalRemarks: 'pr-field-approvalRemarks',
        };
        for (const k of order) {
            if (nextErrors[k]) {
                const id = idMap[k];
                if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
        }
    };

    const onDraftChange = useCallback(<K extends keyof OverviewDraft>(key: K, value: OverviewDraft[K]) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => {
            if (!prev[key]) return prev;
            const n = { ...prev };
            delete n[key];
            return n;
        });
    }, []);

    useEffect(() => {
        if (!isInlineEditing) {
            setDraft(buildDraftFromPr(purchaseRequest));
            setErrors({});
        }
    }, [isInlineEditing, purchaseRequest, listVersion]);

    useEffect(() => {
        const e = searchParams.get('edit');
        if (e !== '1' && e !== 'true') return;
        setIsInlineEditing(true);
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete('edit');
        const qs = sp.toString();
        const base = `/procurement/requests/view/${encodeURIComponent(isCreate ? 'new' : purchaseRequest.slug)}`;
        router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    }, [searchParams, purchaseRequest.slug, router, isCreate]);

    useEffect(() => {
        if (!isCreate) return;
        const draftIdFromUrl = searchParams.get('draftId')?.trim() || '';
        if (!draftIdFromUrl) {
            setActiveDraftId(null);
            setDraftLastSavedAt(null);
            setDraftLoadedBanner(false);
            return;
        }
        const found = draftService.getDraftById<PrDraftData>(draftIdFromUrl);
        if (!found || found.module !== 'purchase_request') {
            setInlineToast({ msg: 'Draft not found.', err: true });
            setActiveDraftId(null);
            setDraftLastSavedAt(null);
            setDraftLoadedBanner(false);
            return;
        }
        setDraft((prev) => {
            const patch = (found.data ?? {}) as Partial<OverviewDraft>;
            return {
                ...prev,
                ...patch,
                material: patch.material != null ? String(patch.material).trim() : prev.material,
            };
        });
        setActiveDraftId(found.draftId);
        setDraftLastSavedAt(found.updatedAt);
        setDraftLoadedBanner(true);
    }, [isCreate, searchParams]);

    const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        return () => {
            if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isCreate) return;
        if (draftSaving || saving) return;
        if (!hasAnyDraftValue(draft)) return;
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        autoSaveRef.current = setTimeout(() => {
            try {
                const saved = draftService.saveDraft<PrDraftData>('purchase_request', draft, activeDraftId ?? undefined);
                setActiveDraftId(saved.draftId);
                setDraftLastSavedAt(saved.updatedAt);
                if (!searchParams.get('draftId')) {
                    const sp = new URLSearchParams(searchParams.toString());
                    sp.set('draftId', saved.draftId);
                    if (!sp.get('tab')) sp.set('tab', 'overview');
                    router.replace(`${window.location.pathname}?${sp.toString()}`, { scroll: false });
                }
            } catch {
                /* ignore */
            }
        }, 1400);
    }, [draft, isCreate, activeDraftId, router, searchParams, draftSaving, saving]);

    const saveDraftNow = useCallback(() => {
        if (!isCreate) return;
        setDraftSaving(true);
        try {
            const saved = draftService.saveDraft<PrDraftData>('purchase_request', draft, activeDraftId ?? undefined);
            setActiveDraftId(saved.draftId);
            setDraftLastSavedAt(saved.updatedAt);
            if (!searchParams.get('draftId')) {
                const sp = new URLSearchParams(searchParams.toString());
                sp.set('draftId', saved.draftId);
                if (!sp.get('tab')) sp.set('tab', 'overview');
                router.replace(`${window.location.pathname}?${sp.toString()}`, { scroll: false });
            }
            setInlineToast({ msg: 'Draft saved.', err: false });
            showStatusModal({ type: 'success', title: 'Draft saved' });
        } catch {
            setInlineToast({ msg: 'Could not save draft.', err: true });
        } finally {
            setDraftSaving(false);
        }
    }, [activeDraftId, draft, isCreate, router, searchParams, showStatusModal]);

    const historySupplemental = useMemo(
        () =>
            isCreate ? [] : purchaseRequestActivitiesToHistoryLogEntries(purchaseRequest.slug, purchaseRequest.prNumber, purchaseRequest.activityLog),
        [isCreate, purchaseRequest.slug, purchaseRequest.prNumber, purchaseRequest.activityLog],
    );

    const exportPrJson = (pr: PurchaseRequest) => {
        const blob = new Blob([JSON.stringify(pr, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pr.prNumber || pr.slug}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const onShare = async () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        if (navigator.share) {
            try {
                await navigator.share({ title: draft.prNumber || 'Purchase request', url });
                return;
            } catch {
                /* fall through */
            }
        }
        setShareUrl(url);
        setShareModalOpen(true);
    };

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setShareModalOpen(false);
            setInlineToast({ msg: 'Link copied.', err: false });
        } catch {
            setInlineToast({ msg: 'Could not copy link.', err: true });
        }
    };

    const onClone = () => {
        if (isCreate) return;
        const copy = duplicatePurchaseRequest(purchaseRequest.slug);
        if (!copy) return;
        try {
            window.localStorage.setItem('activePurchaseRequestSlug', copy.slug);
        } catch {
            /* ignore */
        }
        router.push(`/procurement/requests/view/${encodeURIComponent(copy.slug)}?tab=overview`);
        onBump();
    };

    const onCreate = useCallback(async () => {
        if (!isCreate) return;
        const nextErrors = runValidation();
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) {
            setInlineToast({ msg: 'Please fill required fields.', err: true });
            focusFirstError(nextErrors);
            return;
        }
        setSaving(true);
        try {
            const qty = Number(draft.quantity);
            const actor = currentPurchaseRequestActor().name;
            const created = addPurchaseRequestFromCoreFields({
                requestedBy: actor,
                project: draft.project.trim(),
                material: draft.material.trim(),
                quantity: qty,
                requiredDate: draft.requiredDate.trim(),
                priority: (draft.priority || 'Medium') as PurchaseRequestPriority,
                notes: draft.notes.trim(),
                approval: { status: 'Pending', approvedBy: '', approvalDate: null, remarks: '' },
            });
            if (activeDraftId) {
                try {
                    draftService.deleteDraft(activeDraftId);
                } catch {
                    /* ignore */
                }
            }
            onBump();
            showStatusModal({
                type: 'success',
                title: 'Purchase request created',
                afterClose: () => router.replace(`/procurement/requests/view/${encodeURIComponent(created.slug)}?tab=overview`, { scroll: true }),
            });
        } catch {
            setInlineToast({ msg: 'Could not create request.', err: true });
            showStatusModal({ type: 'error', title: 'Something went wrong' });
        } finally {
            setSaving(false);
        }
    }, [activeDraftId, draft, isCreate, onBump, router, runValidation, showStatusModal]);

    const onSaveEdits = useCallback(
        async ({ exitAfter }: { exitAfter: boolean }) => {
            if (isCreate) return;
            const nextErrors = runValidation();
            setErrors(nextErrors);
            if (Object.keys(nextErrors).length) {
                setInlineToast({ msg: 'Please fix validation errors.', err: true });
                focusFirstError(nextErrors);
                return;
            }
            setSaving(true);
            try {
                const original = buildDraftFromPr(purchaseRequest);
                const qty = Number(draft.quantity);
                const actor = currentPurchaseRequestActor().name;

                const approvalStatus = draft.approvalStatus;
                let approvedBy = draft.approvedBy;
                let approvalDate = draft.approvalDate;
                const remarks = draft.approvalRemarks.trim();

                if (approvalStatus !== original.approvalStatus) {
                    if (approvalStatus === 'Pending') {
                        approvedBy = '';
                        approvalDate = null;
                    } else {
                        approvedBy = actor;
                        approvalDate = new Date().toISOString();
                    }
                } else {
                    approvedBy = purchaseRequest.approval.approvedBy;
                    approvalDate = purchaseRequest.approval.approvalDate;
                }

                const statusChanged = approvalStatus !== original.approvalStatus;
                const actorName = currentPurchaseRequestActor().name;

                const mat = draft.material.trim();
                const rowsAtSave = buildPrSupplierQuoteRows(mat, preserveQuotesFromStored(draft.supplierQuotes));
                const mergedQuotes: PrSupplierQuoteStored[] = rowsAtSave.map((r) => {
                    const hit = draft.supplierQuotes.find((q) => q.supplierId === r.supplierId);
                    return {
                        supplierId: r.supplierId,
                        quotedPrice: hit?.quotedPrice ?? r.quotedPrice ?? 0,
                        currency: hit?.currency ?? r.currency,
                    };
                });
                const supplierSelection = {
                    selectedSupplierId: draft.selectedSupplierId,
                    quotes: mergedQuotes,
                };
                const prevSel = purchaseRequest.supplierSelection;
                const selChanged =
                    (prevSel.selectedSupplierId ?? null) !== (supplierSelection.selectedSupplierId ?? null) ||
                    JSON.stringify(prevSel.quotes) !== JSON.stringify(supplierSelection.quotes);

                let activity:
                    | { actor: string; title: string; body?: string; actionType: string; severity: 'info' | 'success' | 'warning' }
                    | undefined;
                if (statusChanged) {
                    if (approvalStatus === 'Approved')
                        activity = {
                            actor: actorName,
                            title: 'Purchase request approved',
                            body: remarks || undefined,
                            actionType: 'approved',
                            severity: 'success',
                        };
                    else if (approvalStatus === 'Rejected')
                        activity = {
                            actor: actorName,
                            title: 'Purchase request rejected',
                            body: remarks || undefined,
                            actionType: 'rejected',
                            severity: 'warning',
                        };
                    else activity = { actor: actorName, title: 'Approval reset to pending', actionType: 'updated', severity: 'info' };
                } else if (selChanged && draft.approvalStatus === 'Approved') {
                    const name = draft.selectedSupplierId
                        ? getAllSupplierRecords().find((s) => s.id === draft.selectedSupplierId)?.name
                        : '';
                    activity = {
                        actor: actorName,
                        title: 'Supplier selection updated',
                        body: name ? `Supplier: ${name}` : undefined,
                        actionType: 'updated',
                        severity: 'info',
                    };
                }

                const saved = updatePurchaseRequest(
                    purchaseRequest.slug,
                    {
                        project: draft.project.trim(),
                        material: draft.material.trim(),
                        quantity: qty,
                        requiredDate: draft.requiredDate.trim(),
                        priority: (draft.priority || 'Medium') as PurchaseRequestPriority,
                        notes: draft.notes.trim(),
                        approval: {
                            status: approvalStatus,
                            approvedBy,
                            approvalDate,
                            remarks,
                        },
                        supplierSelection,
                    },
                    activity,
                );

                if (!saved) {
                    setInlineToast({ msg: 'Could not save.', err: true });
                    showStatusModal({ type: 'error', title: 'Save failed' });
                    return;
                }
                onBump();
                setDraft(buildDraftFromPr(saved));
                setInlineToast({ msg: 'Saved.', err: false });
                showStatusModal({ type: 'success', title: 'Changes saved' });
                if (exitAfter) setIsInlineEditing(false);
                setErrors({});
            } finally {
                setSaving(false);
            }
        },
        [draft, isCreate, onBump, purchaseRequest, runValidation, showStatusModal],
    );

    const onCancelEdits = useCallback(() => {
        setDraft(buildDraftFromPr(purchaseRequest));
        setErrors({});
        setIsInlineEditing(false);
    }, [purchaseRequest]);

    const confirmArchive = () => {
        if (isCreate) return;
        if (archivePurchaseRequest(purchaseRequest.slug)) {
            setArchiveModalOpen(false);
            router.push('/procurement/requests');
        }
    };

    const renderPurchaseRequestToolbar = () => (
        <div className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {!isCreate ? (
                    <div className="flex flex-wrap items-center gap-3" role="toolbar" aria-label="Purchase request actions">
                        {!isInlineEditing ? (
                            <button
                                type="button"
                                onClick={() => setIsInlineEditing(true)}
                                disabled={saving}
                                className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md bg-[var(--cta-button-bg)] px-2.25 py-1.5 text-sm font-medium text-[var(--cta-button-text)] hover:bg-[var(--cta-button-hover-bg)] hover:text-[var(--cta-button-hover-text)] disabled:opacity-50"
                            >
                                <LuPencil size={16} aria-hidden />
                                Edit
                            </button>
                        ) : (
                            <button
                                type="button"
                                disabled
                                className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.25 py-1.5 text-sm font-medium text-slate-400"
                            >
                                <LuPencil size={16} aria-hidden />
                                Editing
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClone}
                            disabled={saving || isInlineEditing}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.25 py-1.5 text-sm font-medium text-slate-800 hover:bg-gray-100"
                        >
                            <LuCopy size={16} aria-hidden />
                            Clone
                        </button>
                        <button
                            type="button"
                            onClick={() => void onShare()}
                            disabled={saving || isInlineEditing}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.25 py-1.5 text-sm font-medium text-slate-800 hover:bg-gray-100"
                        >
                            <LuShare2 size={16} aria-hidden />
                            Share
                        </button>
                        <button
                            type="button"
                            onClick={() => setArchiveModalOpen(true)}
                            disabled={saving || isInlineEditing}
                            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-rose-300 bg-white px-2.25 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
                        >
                            <LuTrash2 size={16} aria-hidden />
                            Archive
                        </button>
                        <Link href="/procurement/requests/view/new?tab=overview">
                            <span className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.25 py-1.5 text-sm font-medium text-slate-800 hover:bg-gray-100">
                                <LuPlus size={16} aria-hidden />
                                New
                            </span>
                        </Link>
                    </div>
                ) : (
                    <span />
                )}

                {!isCreate ? (
                    <WorkspaceUtilityToolbar
                        help={PURCHASE_REQUEST_WORKSPACE_HELP}
                        triggerLabel="Purchase request workspace help"
                        onExport={() => exportPrJson(purchaseRequest)}
                        saving={saving}
                        isInlineEditing={isInlineEditing}
                    />
                ) : (
                    <div className="flex flex-wrap gap-3 sm:justify-end">
                        <Link href="/procurement/requests" className="text-sm font-semibold text-[var(--cta-button-bg)] underline underline-offset-2">
                            Back to list
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );

    const renderStickyEditFooter = () =>
        fieldIsEditing ? (
            <div className="sticky bottom-0 z-30 mt-4 pb-1">
                <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur sm:flex sm:items-center sm:justify-between sm:px-5">
                    <div className="text-sm font-semibold text-gray-900">{isCreate ? 'Finish and create' : 'Unsaved changes'}</div>
                    <div className="mt-3 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:justify-end">
                        {isCreate ? (
                            <>
                                <Button type="button" variant="companyOutline" size="cta" onClick={() => router.push('/procurement/requests')} disabled={saving}>
                                    Cancel
                                </Button>
                                <Button type="button" variant="companyOutline" size="cta" onClick={saveDraftNow} isLoading={draftSaving} disabled={saving || draftSaving}>
                                    Save draft
                                </Button>
                                <Button type="button" variant="company" size="cta" onClick={() => void onCreate()} isLoading={saving}>
                                    Create request
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button type="button" variant="companyOutline" size="cta" onClick={onCancelEdits} disabled={saving}>
                                    Cancel
                                </Button>
                                <Button type="button" variant="companyOutline" size="cta" onClick={() => void onSaveEdits({ exitAfter: false })} isLoading={saving}>
                                    Save
                                </Button>
                                <Button
                                    type="button"
                                    variant="company"
                                    size="cta"
                                    onClick={() => void onSaveEdits({ exitAfter: true })}
                                    isLoading={saving}
                                >
                                    Save & exit
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        ) : null;

    const workflowCardHeader = (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purchase request</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-900">{isCreate ? 'New request' : draft.prNumber || purchaseRequest.prNumber}</h2>
                    {fieldIsEditing ? (
                        <span className="hidden rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-800 sm:inline-flex">
                            Editing
                        </span>
                    ) : null}
                </div>
            </div>
            <span className={approvalBadge(isCreate ? 'Pending' : draft.approvalStatus)}>{isCreate ? 'Pending' : draft.approvalStatus}</span>
        </div>
    );

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
            {inlineToast ? <InlineToast message={inlineToast.msg} variant={inlineToast.err ? 'error' : 'success'} onDismiss={() => setInlineToast(null)} /> : null}

            <PurchaseRequestMainTabBar
                active={tab}
                lockedDetailTabs={isCreate}
                onChange={(next) => {
                    if (isCreate && next !== 'overview') {
                        setInlineToast({ msg: 'Save the request to open other tabs.', err: true });
                        return;
                    }
                    if (isInlineEditing && !isCreate && next !== tab) {
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
                            <p className="font-semibold text-slate-900">Draft</p>
                            <p className="text-xs font-medium text-slate-600">
                                {draftLastSavedAt ? `Last saved: ${formatAuditTimestamp(draftLastSavedAt)}` : '—'}
                            </p>
                        </div>
                    </div>
                ) : null}

                {tab === 'overview' ? renderPurchaseRequestToolbar() : null}

                {tab === 'overview' ? (
                    <>
                        {isCreate ? (
                            <div className="mt-3 rounded-lg border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] p-3 text-sm font-medium text-slate-900">
                                Creating a new purchase request{' '}
                                <span className="ml-2 rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-white px-2 py-0.5 text-xs font-semibold text-slate-800">Draft</span>
                            </div>
                        ) : null}

                        {!isCreate ? (
                            <div className="mt-2 rounded-md bg-white/80 px-4 py-2 text-sm text-gray-700">
                                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
                                    <span className="inline-flex items-center gap-2">
                                        <LuCalendar size={14} className="text-gray-500" aria-hidden />
                                        <span className="text-gray-600">Created</span>
                                        <span className="font-medium text-gray-900">{formatAuditTimestamp(purchaseRequest.createdAt)}</span>
                                    </span>
                                    <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                                    <span className="inline-flex items-center gap-2">
                                        <LuClock3 size={14} className="text-gray-500" aria-hidden />
                                        <span className="text-gray-600">Updated</span>
                                        <span className="font-medium text-gray-900">{formatAuditTimestamp(purchaseRequest.updatedAt)}</span>
                                    </span>
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-3">
                            <PrProcurementWorkflowStepper steps={workflowSteps} onStepNavigate={onWorkflowStepNavigate} />
                        </div>

                        <div className="mt-3 flex flex-col gap-4 lg:gap-5">
                            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-5">
                            <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
                                <div className="flex min-w-0 flex-col rounded-xl border border-gray-200/80 bg-white shadow-sm">
                                    <div className="bg-[#7185a217] px-4 py-4 sm:px-5 sm:py-5">
                                        {workflowCardHeader}

                                        <div
                                            className={cn(
                                                'mt-5 space-y-4',
                                                fieldIsEditing && 'rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] p-3',
                                            )}
                                        >
                                            <PrCollapsibleSection
                                                title="REQUEST DETAILS"
                                                icon={LuClipboardList}
                                                tone="blue"
                                                sectionId="wf-pr-request"
                                                open={prSectionsOpen.requestDetails}
                                                onOpenChange={(o) => setPrSectionsOpen((s) => ({ ...s, requestDetails: o }))}
                                                headerRight={
                                                    fieldIsEditing && requestDetailsErrorCount > 0 ? (
                                                        <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                                            {requestDetailsErrorCount} required
                                                        </span>
                                                    ) : null
                                                }
                                            >
                                                <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2">
                                                    <PrFieldRow label="Request ID">
                                                        {isCreate ? (
                                                            <span className="text-sm font-medium text-gray-500">Auto-generated on save</span>
                                                        ) : (
                                                            <span className="font-mono text-sm tracking-tight text-gray-900">{draft.prNumber}</span>
                                                        )}
                                                    </PrFieldRow>
                                                    <PrFieldRow label="Requested by">
                                                        <span className="text-[15px] font-medium text-gray-900">{draft.requestedBy?.trim() || EMPTY_FIELD}</span>
                                                    </PrFieldRow>
                                                    <PrFieldRow label="Project" required id="pr-field-project">
                                                        <EditableSelect
                                                            id="pr-select-project"
                                                            isEditing={fieldIsEditing}
                                                            error={errors.project}
                                                            value={draft.project}
                                                            onChange={(v) => onDraftChange('project', v)}
                                                            options={projectOptions}
                                                            placeholder="Select project"
                                                            readValue={
                                                                draft.project?.trim() ? (
                                                                    <span className="font-medium text-gray-900">{draft.project}</span>
                                                                ) : (
                                                                    EMPTY_FIELD
                                                                )
                                                            }
                                                        />
                                                    </PrFieldRow>
                                                    <PrFieldRow label="Material" required id="pr-field-material">
                                                        <EditableSelect
                                                            id="pr-select-material"
                                                            isEditing={fieldIsEditing}
                                                            error={errors.material}
                                                            value={draft.material}
                                                            onChange={(v) => onMaterialPicked(v)}
                                                            options={materialOptions}
                                                            placeholder="Select material"
                                                            readValue={
                                                                draft.material?.trim() ? (
                                                                    <span className="font-medium text-gray-900">{draft.material}</span>
                                                                ) : (
                                                                    EMPTY_FIELD
                                                                )
                                                            }
                                                        />
                                                    </PrFieldRow>
                                                    <PrFieldRow label="Quantity" required id="pr-field-quantity">
                                                        <EditableField
                                                            id="pr-field-quantity-input"
                                                            isEditing={fieldIsEditing}
                                                            error={errors.quantity}
                                                            value={draft.quantity}
                                                            onChange={(v) => onDraftChange('quantity', v.replace(/[^\d.]/g, ''))}
                                                            readValue={
                                                                draft.quantity?.trim() ? (
                                                                    <span className="tabular-nums font-medium text-gray-900">{draft.quantity}</span>
                                                                ) : (
                                                                    EMPTY_FIELD
                                                                )
                                                            }
                                                        />
                                                    </PrFieldRow>
                                                    <PrFieldRow label="Required date" required id="pr-field-requiredDate">
                                                        <EditableField
                                                            id="pr-field-requiredDate-input"
                                                            isEditing={fieldIsEditing}
                                                            type="date"
                                                            error={errors.requiredDate}
                                                            value={draft.requiredDate}
                                                            onChange={(v) => onDraftChange('requiredDate', v)}
                                                            readValue={
                                                                draft.requiredDate?.trim() ? (
                                                                    <span className="tabular-nums text-gray-900">{draft.requiredDate}</span>
                                                                ) : (
                                                                    EMPTY_FIELD
                                                                )
                                                            }
                                                        />
                                                    </PrFieldRow>
                                                    <PrFieldRow label="Priority" required id="pr-field-priority">
                                                        <EditableSelect
                                                            id="pr-select-priority"
                                                            isEditing={fieldIsEditing}
                                                            error={errors.priority}
                                                            value={draft.priority}
                                                            onChange={(v) => onDraftChange('priority', v as PurchaseRequestPriority)}
                                                            options={[...PRIORITY_OPTIONS]}
                                                            placeholder="Select priority"
                                                            readValue={
                                                                draft.priority ? <span className={priorityBadgeUi(draft.priority)}>{draft.priority}</span> : EMPTY_FIELD
                                                            }
                                                        />
                                                    </PrFieldRow>
                                                    <PrFieldRow label="Notes" className="xl:col-span-2" id="pr-field-notes">
                                                        <EditableTextarea
                                                            id="pr-field-notes-input"
                                                            isEditing={fieldIsEditing}
                                                            value={draft.notes}
                                                            onChange={(v) => onDraftChange('notes', v)}
                                                            rows={3}
                                                            readValue={
                                                                draft.notes?.trim() ? (
                                                                    <span className="whitespace-pre-wrap text-[15px] font-normal leading-relaxed text-gray-900">{draft.notes}</span>
                                                                ) : (
                                                                    <span className="text-gray-400">{EMPTY_FIELD}</span>
                                                                )
                                                            }
                                                        />
                                                    </PrFieldRow>
                                                </div>
                                            </PrCollapsibleSection>

                                            <PrCollapsibleSection
                                                title="APPROVAL"
                                                icon={LuBadgeCheck}
                                                tone="slate"
                                                sectionId="wf-pr-approval"
                                                open={prSectionsOpen.approval}
                                                onOpenChange={(o) => setPrSectionsOpen((s) => ({ ...s, approval: o }))}
                                            >
                                                <div className="grid grid-cols-1 xl:grid-cols-2">
                                                    <PrFieldRow label="Approval status" id="pr-field-approvalStatus">
                                                        <EditableSelect
                                                            id="pr-select-approval"
                                                            isEditing={fieldIsEditing && !isCreate}
                                                            value={draft.approvalStatus}
                                                            onChange={(v) => onDraftChange('approvalStatus', v as PurchaseRequestApprovalStatus)}
                                                            options={[...APPROVAL_OPTIONS]}
                                                            readValue={<span className={approvalBadge(draft.approvalStatus)}>{draft.approvalStatus}</span>}
                                                        />
                                                    </PrFieldRow>
                                                    <PrFieldRow label="Approved by">
                                                        <span className="text-[15px] text-gray-900">{draft.approvedBy?.trim() || EMPTY_FIELD}</span>
                                                    </PrFieldRow>
                                                    <PrFieldRow label="Approval date">
                                                        <span className="text-[15px] text-gray-900">
                                                            {draft.approvalDate ? formatAuditTimestamp(draft.approvalDate) : EMPTY_FIELD}
                                                        </span>
                                                    </PrFieldRow>
                                                    <PrFieldRow label="Remarks" className="xl:col-span-2" id="pr-field-approvalRemarks">
                                                        <EditableTextarea
                                                            id="pr-field-approvalRemarks-input"
                                                            isEditing={fieldIsEditing && !isCreate}
                                                            value={draft.approvalRemarks}
                                                            onChange={(v) => onDraftChange('approvalRemarks', v)}
                                                            rows={2}
                                                            readValue={
                                                                draft.approvalRemarks?.trim() ? (
                                                                    <span className="whitespace-pre-wrap text-[15px] font-normal leading-relaxed text-gray-900">{draft.approvalRemarks}</span>
                                                                ) : (
                                                                    <span className="text-gray-400">{EMPTY_FIELD}</span>
                                                                )
                                                            }
                                                        />
                                                    </PrFieldRow>
                                                </div>
                                                <PrApprovalTimelinePanel
                                                    status={draft.approvalStatus}
                                                    approvedBy={draft.approvedBy}
                                                    approvalDateFormatted={
                                                        draft.approvalDate ? formatAuditTimestamp(draft.approvalDate) : '—'
                                                    }
                                                    remarks={draft.approvalRemarks}
                                                    isCreate={isCreate}
                                                />
                                            </PrCollapsibleSection>

                                            <PrCollapsibleSection
                                                title="SUPPLIER SELECTION"
                                                icon={LuStore}
                                                tone="amber"
                                                sectionId="wf-pr-supplier"
                                                open={prSectionsOpen.supplierSelection}
                                                onOpenChange={(o) => setPrSectionsOpen((s) => ({ ...s, supplierSelection: o }))}
                                                headerRight={
                                                    fieldIsEditing && draft.approvalStatus === 'Approved' && supplierSelectionErrorCount > 0 ? (
                                                        <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                                            Supplier
                                                        </span>
                                                    ) : null
                                                }
                                            >
                                                {draft.approvalStatus !== 'Approved' ? (
                                                    <div className="px-3 py-3 text-sm text-gray-600">
                                                        Approve this purchase request to compare suppliers, capture quoted prices, and convert to a purchase order.
                                                    </div>
                                                ) : null}

                                                {draft.approvalStatus === 'Approved' ? (
                                                    <div className="grid grid-cols-1">
                                                        {supplierSectionLocked ? (
                                                            <div className="px-3 py-2.5 text-xs font-medium text-gray-500">
                                                                Select Edit to update supplier selection and quoted prices.
                                                            </div>
                                                        ) : null}

                                                        <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2">
                                                            <PrFieldRow label="Supplier" required className="xl:col-span-2" id="pr-field-selectedSupplier">
                                                                <PrEditableLookupSelect
                                                                    id="pr-select-supplier"
                                                                    isEditing={!supplierSectionLocked}
                                                                    error={errors.selectedSupplierId}
                                                                    value={draft.selectedSupplierId ?? ''}
                                                                    onChange={(v) => {
                                                                        const t = v.trim();
                                                                        onDraftChange('selectedSupplierId', t ? t : null);
                                                                        setErrors((prev) => {
                                                                            if (!prev.selectedSupplierId) return prev;
                                                                            const n = { ...prev };
                                                                            delete n.selectedSupplierId;
                                                                            return n;
                                                                        });
                                                                    }}
                                                                    options={[{ value: '', label: 'Select supplier' }, ...activeSupplierOptions]}
                                                                    placeholder="Search & select supplier"
                                                                    readValue={
                                                                        selectedSupplierReadLabel === EMPTY_FIELD ? (
                                                                            <span className="text-gray-400">{EMPTY_FIELD}</span>
                                                                        ) : (
                                                                            <span className="font-medium text-gray-900">{selectedSupplierReadLabel}</span>
                                                                        )
                                                                    }
                                                                />
                                                            </PrFieldRow>
                                                        </div>

                                                        <PrSupplierComparisonTable
                                                            rows={comparisonRows}
                                                            selectedSupplierId={draft.selectedSupplierId}
                                                            locked={supplierSectionLocked}
                                                            search={supplierLookupSearch}
                                                            onSearchChange={setSupplierLookupSearch}
                                                            onSelectSupplier={(supplierId) => {
                                                                onDraftChange('selectedSupplierId', supplierId);
                                                                setErrors((prev) => {
                                                                    if (!prev.selectedSupplierId) return prev;
                                                                    const n = { ...prev };
                                                                    delete n.selectedSupplierId;
                                                                    return n;
                                                                });
                                                            }}
                                                            onQuotePriceChange={onQuotePriceChange}
                                                        />
                                                    </div>
                                                ) : null}
                                            </PrCollapsibleSection>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="min-w-0 lg:col-span-1 lg:sticky lg:top-44 lg:self-start">
                                <PrAiProcurementInsightsPanel insights={aiInsights} />
                                <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Request snapshot</p>
                                    <div className="mt-2 space-y-1.5 text-xs text-slate-700">
                                        <p>
                                            <span className="font-semibold">Project</span>: {draft.project?.trim() || EMPTY_FIELD}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Material</span>: {draft.material?.trim() || EMPTY_FIELD}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Required</span>: {draft.requiredDate || EMPTY_FIELD}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Priority</span>: {draft.priority || EMPTY_FIELD}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            </div>

                            {!isCreate ? (
                                <article id="wf-pr-purchase-orders" className="w-full rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-semibold text-slate-900">Linked purchase orders</h3>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                Full-width procurement summary. Open a PO for execution details — multiple orders per request are supported.
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="companyOutline"
                                                className="gap-1.5"
                                                disabled={!canManageLinkedPos}
                                                onClick={() => setLinkPoModalOpen(true)}
                                            >
                                                <LuLink size={14} />
                                                Link Purchase Order
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="company"
                                                className="gap-1.5"
                                                disabled={!canManageLinkedPos}
                                                onClick={() => router.push(createPoHref)}
                                            >
                                                <LuPlus size={14} />
                                                Create Purchase Order
                                            </Button>
                                        </div>
                                    </div>

                                    {draft.approvalStatus !== 'Approved' ? (
                                        <p className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-xs font-medium text-amber-950">
                                            Approve this request to create or link purchase orders.
                                        </p>
                                    ) : null}

                                    <PrLinkedPurchaseOrdersSummary summary={procurementSummary} />
                                    <div className="mt-4 w-full min-w-0 overflow-x-auto">
                                        <PrLinkedPurchaseOrdersTable
                                            orders={linkedPurchaseOrders}
                                            prSlug={purchaseRequest.slug}
                                            projectName={purchaseRequest.project}
                                            canManage={canManageLinkedPos}
                                            canCreateInvoice={canManageInvoices}
                                            onCreateInvoiceForPo={onCreateInvoiceForPo}
                                        />
                                    </div>
                                </article>
                            ) : null}

                            {!isCreate ? (
                                <article id="wf-pr-invoices" className="w-full rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
                                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                                        <div className="min-w-0">
                                            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                                <LuReceipt size={16} className="text-[var(--cta-button-bg)]" aria-hidden />
                                                Invoice &amp; payments
                                            </h3>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                Linked to{' '}
                                                <Link href="/company-admin/invoices" className="font-semibold text-[var(--cta-button-bg)] hover:underline">
                                                    Invoice &amp; Payments
                                                </Link>
                                                . Link existing invoices here, or use Create invoice on each purchase order row above.
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="companyOutline"
                                                className="gap-1.5"
                                                disabled={!canManageInvoices}
                                                onClick={() => setLinkInvoiceModalOpen(true)}
                                            >
                                                <LuLink size={14} />
                                                Link invoice
                                            </Button>
                                        </div>
                                    </div>

                                    {linkedPurchaseOrders.length === 0 ? (
                                        <p className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-xs font-medium text-amber-950">
                                            Link at least one purchase order before creating or linking invoices.
                                        </p>
                                    ) : draft.approvalStatus !== 'Approved' ? (
                                        <p className="mb-3 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-xs font-medium text-amber-950">
                                            Approve this request and raise POs to unlock invoice tracking.
                                        </p>
                                    ) : null}

                                    <PrLinkedInvoicesSummary summary={invoiceSummary} />
                                    <div className="mt-4 w-full min-w-0 overflow-x-auto">
                                        <PrLinkedInvoicesTable
                                            invoices={linkedInvoices}
                                            prSlug={purchaseRequest.slug}
                                            canManage={canManageInvoices}
                                        />
                                    </div>
                                </article>
                            ) : null}
                        </div>
                    </>
                ) : null}

                {tab === 'activity' && !isCreate ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <RecordHistoryLogPanel
                            module="purchase_requests"
                            recordId={purchaseRequest.slug}
                            recordTitle={purchaseRequest.prNumber}
                            supplementalEntries={historySupplemental}
                        />
                    </div>
                ) : null}
                {tab !== 'activity' ? renderStickyEditFooter() : null}
            </div>

            <Modal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                title="Share link"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setShareModalOpen(false)}>
                            Close
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={() => void copyShareLink()}>
                            Copy link
                        </Button>
                    </>
                }
            >
                <p className="mb-2 text-sm text-slate-600">Copy this URL to share this record.</p>
                <p className="break-all rounded-lg bg-slate-50 p-2 text-xs text-slate-700">{shareUrl}</p>
            </Modal>

            <Modal
                isOpen={archiveModalOpen}
                onClose={() => setArchiveModalOpen(false)}
                title="Archive purchase request"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setArchiveModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" className="bg-rose-600 hover:bg-rose-700" onClick={confirmArchive}>
                            Archive
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Archive <span className="font-semibold">{purchaseRequest.prNumber}</span>? It will be removed from the active list.
                </p>
            </Modal>

            {!isCreate ? (
                <PrLinkPurchaseOrderModal
                    isOpen={linkPoModalOpen}
                    onClose={() => setLinkPoModalOpen(false)}
                    prSlug={purchaseRequest.slug}
                    prNumber={purchaseRequest.prNumber}
                    onLinked={() => {
                        setPoListVersion((n) => n + 1);
                        setInlineToast({ msg: 'Purchase order linked to this request.', err: false });
                    }}
                />
            ) : null}

            {!isCreate ? (
                <PrLinkInvoiceModal
                    isOpen={linkInvoiceModalOpen}
                    onClose={() => setLinkInvoiceModalOpen(false)}
                    prSlug={purchaseRequest.slug}
                    prNumber={purchaseRequest.prNumber}
                    onLinked={() => {
                        setInvoiceListVersion((n) => n + 1);
                        setInlineToast({ msg: 'Invoice linked to this request.', err: false });
                    }}
                />
            ) : null}
        </div>
    );
}
