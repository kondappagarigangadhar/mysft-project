'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { StatusModal } from '@/components/ui/StatusModal';
import { Modal } from '@/components/ui/Modal';
import { EditableField, EditableSelect } from '@/components/leads/detail/InlineEditableSection';
import { draftService } from '@/lib/draftService';
import { RecordHistoryLogPanel } from '@/components/history-logs/RecordHistoryLogPanel';
import { purchaseOrderActivitiesToHistoryLogEntries } from '@/lib/historyLogs/recordHistoryAdapters';
import { PurchaseOrderMainTabBar } from '@/components/purchase-orders/detail/PurchaseOrderMainTabBar';
import type { PurchaseOrderDetailMainTabId } from '@/components/purchase-orders/detail/purchaseOrderDetailTabIds';
import { normalizePurchaseOrderDetailTab } from '@/components/purchase-orders/detail/purchaseOrderDetailTabIds';
import {
    addPurchaseOrderFromCoreFields,
    archivePurchaseOrder,
    currentPurchaseOrderActor,
    duplicatePurchaseOrder,
    getMaterialOptionsForPo,
    getSupplierNamesForPo,
    isPoDeliveryDateInFuture,
    updatePurchaseOrder,
    type PoDeliveryStatus,
    type PoQualityCheck,
    type PurchaseOrder,
    type PurchaseOrderStatus,
} from '@/lib/purchaseOrderStore';
import { getApprovedPurchaseRequests, getPurchaseRequestIncludingArchived, type PurchaseRequest as ApprovedPrRow } from '@/lib/purchaseRequestStore';
import { getAllSupplierRecords } from '@/lib/suppliers/supplierStore';
import { procurementReturnPrHref } from '@/lib/procurement/procurementBreadcrumbs';
import { cn } from '@/lib/utils';
import { CTA_UTILITY_BTN } from '@/lib/theme/ctaThemeClasses';
import { WorkspaceUtilityToolbar, PURCHASE_ORDER_WORKSPACE_HELP } from '@/components/workspace-help';
import {
    LuActivity,
    LuCalendar,
    LuChevronDown,
    LuClipboardList,
    LuClock3,
    LuCopy,
    LuDownload,
    LuEllipsis,
    LuPackage,
    LuPencil,
    LuPlus,
    LuPrinter,
    LuShare2,
    LuTrash2,
    LuTruck,
} from 'react-icons/lu';

type TabId = PurchaseOrderDetailMainTabId;

const EMPTY_FIELD = '—';

const PO_STATUS_OPTIONS: PurchaseOrderStatus[] = ['Created', 'Sent', 'Delivered'];
const DELIVERY_STATUS_OPTIONS: PoDeliveryStatus[] = ['Pending', 'Partial', 'Completed'];
const QUALITY_OPTIONS: PoQualityCheck[] = ['Passed', 'Failed'];

type OverviewDraft = {
    poNumber: string;
    prSlug: string;
    prNumber: string;
    supplierId: string;
    supplierName: string;
    material: string;
    quantity: string;
    unitPrice: string;
    currency: string;
    deliveryDate: string;
    status: PurchaseOrderStatus | '';
};

type DeliveryDraft = {
    status: PoDeliveryStatus | '';
    receivedQuantity: string;
    receivedDate: string;
    qualityCheck: PoQualityCheck | '';
};

type PoDraftData = {
    overview: OverviewDraft;
    delivery?: DeliveryDraft;
};

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

function poStatusBadge(status: PurchaseOrderStatus | string) {
    const s = String(status).toLowerCase();
    const base = 'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold';
    if (s === 'delivered') return cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-800');
    if (s === 'sent') return cn(base, 'border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] text-slate-800');
    return cn(base, 'border-slate-200 bg-slate-50 text-slate-700');
}

function deliveryStatusBadge(status: string) {
    const s = status.toLowerCase();
    const base = 'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold';
    if (s === 'completed') return cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-800');
    if (s === 'partial') return cn(base, 'border-amber-200 bg-amber-50 text-amber-900');
    return cn(base, 'border-slate-200 bg-slate-50 text-slate-700');
}

function qualityBadge(status: string) {
    const s = status.toLowerCase();
    const base = 'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold';
    if (s === 'passed') return cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-800');
    if (s === 'failed') return cn(base, 'border-rose-200 bg-rose-50 text-rose-800');
    return cn(base, 'border-slate-200 bg-slate-50 text-slate-600');
}

const PO_INLINE_BASE_INPUT =
    'w-full rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]';

type PoFieldRowProps = {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
    id?: string;
};

function PoFieldRow({ label, required, children, className, id }: PoFieldRowProps) {
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

function PoCollapsibleSection({
    title,
    icon: Icon,
    tone = 'slate',
    open,
    onOpenChange,
    headerRight,
    children,
    className,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    tone?: 'blue' | 'amber' | 'slate';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    headerRight?: React.ReactNode;
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
        <section className={cn('overflow-hidden rounded-xl border border-gray-300 bg-white shadow-none', className)}>
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

function PoEditableLookupSelect({
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
                className={cn(PO_INLINE_BASE_INPUT, 'h-10', borderClass)}
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

function buildOverviewDraftFromPo(po: PurchaseOrder): OverviewDraft {
    return {
        poNumber: po.poNumber,
        prSlug: po.prSlug,
        prNumber: po.prNumber,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        material: po.material,
        quantity: String(po.quantity),
        unitPrice: String(po.unitPrice),
        currency: po.currency,
        deliveryDate: po.deliveryDate,
        status: po.status,
    };
}

function buildDeliveryDraftFromPo(po: PurchaseOrder): DeliveryDraft {
    return {
        status: po.delivery.status,
        receivedQuantity: String(po.delivery.receivedQuantity),
        receivedDate: po.delivery.receivedDate,
        qualityCheck: po.delivery.qualityCheck || '',
    };
}

function formatMoney(n: number, currency: string) {
    const c = currency?.trim() || 'INR';
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: c, maximumFractionDigits: 2 }).format(n);
    } catch {
        return `${c} ${n.toFixed(2)}`;
    }
}

export function PurchaseOrderRecordTabs({
    purchaseOrder,
    listVersion,
    onBump,
    createMode = false,
}: {
    purchaseOrder: PurchaseOrder;
    listVersion: number;
    onBump: () => void;
    createMode?: boolean;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isCreate = createMode;

    const afterCreateOrCancelHref = useMemo(() => {
        const returnPr =
            searchParams.get('returnPrSlug')?.trim() || searchParams.get('prSlug')?.trim() || '';
        return returnPr ? procurementReturnPrHref(returnPr) : '/procurement/purchase-orders';
    }, [searchParams]);

    const [tab, setTabState] = useState<TabId>(() => normalizePurchaseOrderDetailTab(searchParams.get('tab')));
    const setTab = useCallback(
        (next: TabId) => {
            if (isCreate && next !== 'overview') return;
            setTabState(next);
            const url = `/procurement/purchase-orders/view/${encodeURIComponent(isCreate ? 'new' : purchaseOrder.slug)}?tab=${encodeURIComponent(next)}`;
            router.replace(url, { scroll: false });
        },
        [isCreate, router, purchaseOrder.slug],
    );

    useEffect(() => {
        const fromUrl = normalizePurchaseOrderDetailTab(searchParams.get('tab'));
        setTabState(isCreate ? 'overview' : fromUrl);
    }, [searchParams, isCreate]);

    useEffect(() => {
        if (!isCreate) return;
        if (tab === 'overview') return;
        setTabState('overview');
        router.replace(`/procurement/purchase-orders/view/new?tab=overview`, { scroll: false });
    }, [isCreate, tab, router]);

    const [isInlineEditing, setIsInlineEditing] = useState(isCreate ? true : false);
    const [overviewDraft, setOverviewDraft] = useState<OverviewDraft>(() => buildOverviewDraftFromPo(purchaseOrder));
    const [deliveryDraft, setDeliveryDraft] = useState<DeliveryDraft>(() =>
        isCreate ? { status: 'Pending', receivedQuantity: '0', receivedDate: '', qualityCheck: '' } : buildDeliveryDraftFromPo(purchaseOrder),
    );

    const [overviewErrors, setOverviewErrors] = useState<Partial<Record<keyof OverviewDraft, string>>>({});
    const [deliveryErrors, setDeliveryErrors] = useState<Partial<Record<keyof DeliveryDraft, string>>>({});

    const [saving, setSaving] = useState(false);
    const [draftSaving, setDraftSaving] = useState(false);
    const [inlineToast, setInlineToast] = useState<{ msg: string; err: boolean } | null>(null);
    const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
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

    const prOptions = useMemo(
        () =>
            getApprovedPurchaseRequests().map((p: ApprovedPrRow) => ({
                value: p.slug,
                label: `${p.prNumber} — ${p.material}`,
            })),
        [listVersion],
    );

    const supplierOptions = useMemo(() => getSupplierNamesForPo().map((s) => ({ value: s.id, label: s.name })), [listVersion]);
    const materialOptions = useMemo(() => getMaterialOptionsForPo(), [listVersion]);

    const [poOverviewDetailsOpen, setPoOverviewDetailsOpen] = useState(true);
    const [poDeliverySectionsOpen, setPoDeliverySectionsOpen] = useState({ receipt: true, summary: true });

    const fieldIsEditing = isCreate || isInlineEditing;

    const prReferenceReadLabel = useMemo(() => {
        const o = prOptions.find((p) => p.value === overviewDraft.prSlug);
        if (o) return o.label;
        return overviewDraft.prNumber?.trim() || EMPTY_FIELD;
    }, [prOptions, overviewDraft.prSlug, overviewDraft.prNumber]);

    const referenceSectionErrorCount = useMemo(() => {
        if (!fieldIsEditing) return 0;
        return (['prSlug', 'supplierId', 'material'] as const).filter((k) => Boolean(overviewErrors[k])).length;
    }, [fieldIsEditing, overviewErrors]);

    const pricingSectionErrorCount = useMemo(() => {
        if (!fieldIsEditing) return 0;
        return (['quantity', 'unitPrice', 'currency'] as const).filter((k) => Boolean(overviewErrors[k])).length;
    }, [fieldIsEditing, overviewErrors]);

    const scheduleSectionErrorCount = useMemo(() => {
        if (!fieldIsEditing) return 0;
        return (['deliveryDate', 'status'] as const).filter((k) => Boolean(overviewErrors[k])).length;
    }, [fieldIsEditing, overviewErrors]);

    const overviewDetailsErrorCount = useMemo(() => {
        if (!fieldIsEditing) return 0;
        return referenceSectionErrorCount + pricingSectionErrorCount + scheduleSectionErrorCount;
    }, [fieldIsEditing, referenceSectionErrorCount, pricingSectionErrorCount, scheduleSectionErrorCount]);

    const deliveryReceiptErrorCount = useMemo(() => {
        if (!fieldIsEditing) return 0;
        return (['status', 'receivedQuantity', 'qualityCheck'] as const).filter((k) => Boolean(deliveryErrors[k])).length;
    }, [fieldIsEditing, deliveryErrors]);

    const utilityBtn = CTA_UTILITY_BTN;

    const orderedQty = isCreate ? Number(overviewDraft.quantity) || 0 : purchaseOrder.quantity;

    useEffect(() => {
        if (isInlineEditing || isCreate) return;
        setOverviewDraft(buildOverviewDraftFromPo(purchaseOrder));
        setDeliveryDraft(buildDeliveryDraftFromPo(purchaseOrder));
        setOverviewErrors({});
        setDeliveryErrors({});
    }, [isInlineEditing, isCreate, purchaseOrder, listVersion]);

    useEffect(() => {
        const e = searchParams.get('edit');
        if (e !== '1' && e !== 'true') return;
        setIsInlineEditing(true);
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete('edit');
        const qs = sp.toString();
        const base = `/procurement/purchase-orders/view/${encodeURIComponent(isCreate ? 'new' : purchaseOrder.slug)}`;
        router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    }, [searchParams, purchaseOrder.slug, router, isCreate]);

    const runOverviewValidation = useCallback(() => {
        const next: Partial<Record<keyof OverviewDraft, string>> = {};
        if (!overviewDraft.prSlug.trim()) next.prSlug = 'PR reference is required (approved PR only).';
        if (!overviewDraft.supplierId.trim()) next.supplierId = 'Supplier is required.';
        if (!overviewDraft.material.trim()) next.material = 'Material is required.';
        const qty = Number(overviewDraft.quantity);
        if (!overviewDraft.quantity.trim() || !Number.isFinite(qty) || qty <= 0) next.quantity = 'Quantity must be greater than 0.';
        const unit = Number(overviewDraft.unitPrice);
        if (!overviewDraft.unitPrice.trim() || !Number.isFinite(unit) || unit <= 0) next.unitPrice = 'Unit price must be greater than 0.';
        if (!overviewDraft.currency.trim()) next.currency = 'Currency is required.';
        if (!overviewDraft.deliveryDate.trim()) next.deliveryDate = 'Delivery date is required.';
        else if (!isPoDeliveryDateInFuture(overviewDraft.deliveryDate)) next.deliveryDate = 'Delivery date must be in the future.';
        if (!overviewDraft.status) next.status = 'Status is required.';
        const pr = getPurchaseRequestIncludingArchived(overviewDraft.prSlug.trim());
        if (!pr) next.prSlug = 'Purchase request not found.';
        else if (pr.approval.status !== 'Approved') next.prSlug = 'Only approved purchase requests can be linked.';
        return next;
    }, [overviewDraft]);

    const runDeliveryValidation = useCallback(
        (qty: number) => {
            const next: Partial<Record<keyof DeliveryDraft, string>> = {};
            if (!deliveryDraft.status) next.status = 'Delivery status is required.';
            const rec = Number(deliveryDraft.receivedQuantity);
            if (!deliveryDraft.receivedQuantity.trim() || !Number.isFinite(rec) || rec < 0) {
                next.receivedQuantity = 'Enter received quantity (0 or more).';
            } else if (rec > qty) {
                next.receivedQuantity = `Received quantity cannot exceed ordered quantity (${qty}).`;
            }
            if (!deliveryDraft.qualityCheck) next.qualityCheck = 'Quality check is required.';
            return next;
        },
        [deliveryDraft],
    );

    const onOverviewDraft = useCallback(<K extends keyof OverviewDraft>(key: K, value: OverviewDraft[K]) => {
        setOverviewDraft((prev) => ({ ...prev, [key]: value }));
        setOverviewErrors((prev) => {
            if (!prev[key]) return prev;
            const n = { ...prev };
            delete n[key];
            return n;
        });
    }, []);

    const onPrPick = useCallback((slug: string) => {
        const pr = getPurchaseRequestIncludingArchived(slug.trim());
        if (!pr) {
            onOverviewDraft('prSlug', slug);
            onOverviewDraft('prNumber', '');
            return;
        }
        const sid = pr.supplierSelection?.selectedSupplierId ?? '';
        const sup = sid ? getAllSupplierRecords().find((s) => s.id === sid) : undefined;
        const quote = pr.supplierSelection?.quotes?.find((q) => q.supplierId === sid);
        setOverviewDraft((prev) => ({
            ...prev,
            prSlug: pr.slug,
            prNumber: pr.prNumber,
            material: pr.material,
            quantity: String(pr.quantity),
            supplierId: sid,
            supplierName: sup?.name ?? '',
            unitPrice: quote && Number.isFinite(quote.quotedPrice) ? String(quote.quotedPrice) : prev.unitPrice,
            currency: quote?.currency ?? prev.currency ?? 'INR',
        }));
        setOverviewErrors((e) => {
            const n = { ...e };
            delete n.prSlug;
            delete n.material;
            delete n.quantity;
            delete n.supplierId;
            return n;
        });
    }, [onOverviewDraft]);

    const onSupplierPick = useCallback((supplierId: string) => {
        const sup = getAllSupplierRecords().find((s) => s.id === supplierId);
        setOverviewDraft((prev) => ({ ...prev, supplierId, supplierName: sup?.name ?? '' }));
        setOverviewErrors((e) => {
            const n = { ...e };
            delete n.supplierId;
            return n;
        });
    }, []);

    const totalAmountPreview = useMemo(() => {
        const q = Number(overviewDraft.quantity);
        const u = Number(overviewDraft.unitPrice);
        if (!Number.isFinite(q) || !Number.isFinite(u)) return 0;
        return q * u;
    }, [overviewDraft.quantity, overviewDraft.unitPrice]);

    const focusFirstOverviewError = (nextErrors: Partial<Record<keyof OverviewDraft, string>>) => {
        const order: (keyof OverviewDraft)[] = [
            'prSlug',
            'supplierId',
            'material',
            'quantity',
            'unitPrice',
            'currency',
            'deliveryDate',
            'status',
        ];
        const idMap: Partial<Record<keyof OverviewDraft, string>> = {
            prSlug: 'po-field-pr',
            supplierId: 'po-field-supplier',
            material: 'po-field-material',
            quantity: 'po-field-qty',
            unitPrice: 'po-field-unit',
            currency: 'po-field-currency',
            deliveryDate: 'po-field-delivery',
            status: 'po-field-status',
        };
        for (const k of order) {
            if (nextErrors[k]) {
                const id = idMap[k];
                if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
        }
    };

    const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        return () => {
            if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        };
    }, []);

    const hasAnyCreateDraftValue = useMemo(() => {
        return [
            overviewDraft.prSlug,
            overviewDraft.supplierId,
            overviewDraft.material,
            overviewDraft.quantity,
            overviewDraft.unitPrice,
        ].some((v) => String(v).trim() !== '');
    }, [overviewDraft]);

    useEffect(() => {
        if (!isCreate) return;
        if (draftSaving || saving) return;
        if (!hasAnyCreateDraftValue) return;
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        autoSaveRef.current = setTimeout(() => {
            try {
                const saved = draftService.saveDraft<PoDraftData>(
                    'purchase_order',
                    { overview: overviewDraft, delivery: deliveryDraft },
                    activeDraftId ?? undefined,
                );
                setActiveDraftId(saved.draftId);
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
    }, [overviewDraft, deliveryDraft, isCreate, activeDraftId, router, searchParams, draftSaving, saving, hasAnyCreateDraftValue]);

    useEffect(() => {
        if (!isCreate) return;
        const draftIdFromUrl = searchParams.get('draftId')?.trim() || '';
        if (!draftIdFromUrl) return;
        const found = draftService.getDraftById<PoDraftData>(draftIdFromUrl);
        if (!found || found.module !== 'purchase_order') return;
        if (found.data?.overview) setOverviewDraft(found.data.overview);
        if (found.data?.delivery) setDeliveryDraft(found.data.delivery);
        setActiveDraftId(found.draftId);
    }, [isCreate, searchParams]);

    const saveDraftNow = useCallback(() => {
        if (!isCreate) return;
        setDraftSaving(true);
        try {
            const saved = draftService.saveDraft<PoDraftData>(
                'purchase_order',
                { overview: overviewDraft, delivery: deliveryDraft },
                activeDraftId ?? undefined,
            );
            setActiveDraftId(saved.draftId);
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
    }, [overviewDraft, deliveryDraft, isCreate, activeDraftId, router, searchParams, showStatusModal]);

    const historySupplemental = useMemo(
        () =>
            isCreate ? [] : purchaseOrderActivitiesToHistoryLogEntries(purchaseOrder.slug, purchaseOrder.poNumber, purchaseOrder.activityLog),
        [isCreate, purchaseOrder.slug, purchaseOrder.poNumber, purchaseOrder.activityLog],
    );

    const exportPoJson = (po: PurchaseOrder) => {
        const blob = new Blob([JSON.stringify(po, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${po.poNumber || po.slug}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const onShare = async () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        if (navigator.share) {
            try {
                await navigator.share({ title: overviewDraft.poNumber || 'Purchase order', url });
                return;
            } catch {
                /* ignore */
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
        const copy = duplicatePurchaseOrder(purchaseOrder.slug);
        if (!copy) return;
        router.push(`/procurement/purchase-orders/view/${encodeURIComponent(copy.slug)}?tab=overview`);
        onBump();
    };

    const onCreate = useCallback(async () => {
        if (!isCreate) return;
        const qty = Number(overviewDraft.quantity) || 0;
        const nextErrors = runOverviewValidation();
        const nextDeliveryErrors = runDeliveryValidation(qty);
        setOverviewErrors(nextErrors);
        setDeliveryErrors(nextDeliveryErrors);
        if (Object.keys(nextErrors).length) {
            setInlineToast({ msg: 'Please fill required reference, pricing, and delivery fields.', err: true });
            focusFirstOverviewError(nextErrors);
            return;
        }
        if (Object.keys(nextDeliveryErrors).length) {
            setInlineToast({ msg: 'Please fill required goods receipt fields.', err: true });
            document.getElementById('po-delivery-status')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setSaving(true);
        try {
            const created = addPurchaseOrderFromCoreFields({
                prSlug: overviewDraft.prSlug.trim(),
                supplierId: overviewDraft.supplierId.trim(),
                material: overviewDraft.material.trim(),
                quantity: qty,
                unitPrice: Number(overviewDraft.unitPrice),
                currency: overviewDraft.currency.trim(),
                deliveryDate: overviewDraft.deliveryDate.trim(),
                status: overviewDraft.status as PurchaseOrderStatus,
                delivery: {
                    status: deliveryDraft.status as PoDeliveryStatus,
                    receivedQuantity: Number(deliveryDraft.receivedQuantity),
                    receivedDate: deliveryDraft.receivedDate.trim(),
                    qualityCheck: deliveryDraft.qualityCheck as PoQualityCheck,
                },
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
                title: 'Purchase order created',
                afterClose: () => {
                    const returnPr =
                        searchParams.get('returnPrSlug')?.trim() || searchParams.get('prSlug')?.trim() || '';
                    router.replace(
                        returnPr
                            ? procurementReturnPrHref(returnPr)
                            : `/procurement/purchase-orders/view/${encodeURIComponent(created.slug)}?tab=overview`,
                        { scroll: true },
                    );
                },
            });
        } catch {
            setInlineToast({ msg: 'Could not create purchase order.', err: true });
            showStatusModal({ type: 'error', title: 'Something went wrong' });
        } finally {
            setSaving(false);
        }
    }, [
        activeDraftId,
        deliveryDraft,
        overviewDraft,
        isCreate,
        onBump,
        router,
        runDeliveryValidation,
        runOverviewValidation,
        searchParams,
        showStatusModal,
    ]);

    const onSaveOverview = useCallback(
        async ({ exitAfter }: { exitAfter: boolean }) => {
            if (isCreate) return;
            const nextErrors = runOverviewValidation();
            setOverviewErrors(nextErrors);
            if (Object.keys(nextErrors).length) {
                setInlineToast({ msg: 'Please fix validation errors.', err: true });
                focusFirstOverviewError(nextErrors);
                return;
            }

            const nextDeliveryErrors = runDeliveryValidation(orderedQty);
            setDeliveryErrors(nextDeliveryErrors);
            if (Object.keys(nextDeliveryErrors).length) {
                setInlineToast({ msg: 'Please fix delivery fields.', err: true });
                return;
            }

            setSaving(true);
            try {
                const sup = getAllSupplierRecords().find((s) => s.id === overviewDraft.supplierId.trim());
                const saved = updatePurchaseOrder(
                    purchaseOrder.slug,
                    {
                        prSlug: overviewDraft.prSlug.trim(),
                        prNumber: getPurchaseRequestIncludingArchived(overviewDraft.prSlug.trim())?.prNumber ?? overviewDraft.prNumber,
                        supplierId: overviewDraft.supplierId.trim(),
                        supplierName: sup?.name ?? overviewDraft.supplierName,
                        material: overviewDraft.material.trim(),
                        quantity: Number(overviewDraft.quantity),
                        unitPrice: Number(overviewDraft.unitPrice),
                        currency: overviewDraft.currency.trim(),
                        deliveryDate: overviewDraft.deliveryDate.trim(),
                        status: overviewDraft.status as PurchaseOrderStatus,
                        delivery: {
                            status: deliveryDraft.status as PoDeliveryStatus,
                            receivedQuantity: Number(deliveryDraft.receivedQuantity),
                            receivedDate: deliveryDraft.receivedDate.trim(),
                            qualityCheck: deliveryDraft.qualityCheck as PoQualityCheck,
                        },
                    },
                    undefined,
                );
                if (!saved) {
                    setInlineToast({ msg: 'Could not save.', err: true });
                    showStatusModal({ type: 'error', title: 'Save failed' });
                    return;
                }
                onBump();
                setOverviewDraft(buildOverviewDraftFromPo(saved));
                setDeliveryDraft(buildDeliveryDraftFromPo(saved));
                setInlineToast({ msg: 'Saved.', err: false });
                showStatusModal({ type: 'success', title: 'Changes saved' });
                if (exitAfter) setIsInlineEditing(false);
                setOverviewErrors({});
                setDeliveryErrors({});
            } finally {
                setSaving(false);
            }
        },
        [overviewDraft, deliveryDraft, isCreate, onBump, orderedQty, purchaseOrder.slug, runDeliveryValidation, runOverviewValidation, showStatusModal],
    );

    const onCancelOverview = useCallback(() => {
        setOverviewDraft(buildOverviewDraftFromPo(purchaseOrder));
        setOverviewErrors({});
        setDeliveryDraft(buildDeliveryDraftFromPo(purchaseOrder));
        setDeliveryErrors({});
        setIsInlineEditing(false);
    }, [purchaseOrder]);

    const confirmArchive = () => {
        if (isCreate) return;
        if (archivePurchaseOrder(purchaseOrder.slug)) {
            setArchiveModalOpen(false);
            router.push('/procurement/purchase-orders');
        }
    };

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

            <PurchaseOrderMainTabBar
                active={tab}
                secondaryDisabled={isCreate}
                historyDisabled={isCreate}
                onChange={(next) => {
                    if (isCreate && next !== 'overview') {
                        setInlineToast({ msg: 'Save the purchase order to open other tabs.', err: true });
                        return;
                    }
                    if (isInlineEditing && !isCreate && next !== 'overview') {
                        const ok = window.confirm('You are editing overview. Leave and discard changes?');
                        if (!ok) return;
                        onCancelOverview();
                    }
                    setTab(next);
                }}
            />

            <div className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
                {tab === 'overview' ? (
                    <>
                        {isCreate ? (
                            <div className="mt-3 rounded-lg border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] p-3 text-sm font-medium text-slate-900">
                                Creating a new purchase order{' '}
                                <span className="ml-2 rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-white px-2 py-0.5 text-xs font-semibold text-slate-800">Draft</span>
                            </div>
                        ) : null}

                        <div className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                {!isCreate ? (
                                    <div className="flex flex-wrap items-center gap-3" role="toolbar" aria-label="Purchase order actions">
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
                                        <Link href="/procurement/purchase-orders/view/new?tab=overview">
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
                                        help={PURCHASE_ORDER_WORKSPACE_HELP}
                                        triggerLabel="Purchase order workspace help"
                                        onExport={() => exportPoJson(purchaseOrder)}
                                        saving={saving}
                                        isInlineEditing={isInlineEditing}
                                    />
                                ) : (
                                    <div className="flex flex-wrap gap-3 sm:justify-end">
                                        <Link href="/procurement/purchase-orders" className="text-sm font-semibold text-[var(--cta-button-bg)] underline underline-offset-2">
                                            Back to list
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {!isCreate ? (
                            <div className="mt-2 rounded-md bg-white/80 px-4 py-2 text-sm text-gray-700">
                                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
                                    <span className="inline-flex items-center gap-2">
                                        <LuCalendar size={14} className="text-gray-500" aria-hidden />
                                        <span className="text-gray-600">Created</span>
                                        <span className="font-medium text-gray-900">{formatAuditTimestamp(purchaseOrder.createdAt)}</span>
                                    </span>
                                    <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                                    <span className="inline-flex items-center gap-2">
                                        <LuClock3 size={14} className="text-gray-500" aria-hidden />
                                        <span className="text-gray-600">Updated</span>
                                        <span className="font-medium text-gray-900">{formatAuditTimestamp(purchaseOrder.updatedAt)}</span>
                                    </span>
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-3 grid grid-cols-1 items-start gap-4 lg:grid-cols-3 lg:gap-5">
                            <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
                                <div className="flex min-w-0 flex-col rounded-xl border border-gray-200/80 bg-white shadow-sm">
                                    <div className="bg-[#7185a217] px-4 py-4 sm:px-5 sm:py-5">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purchase order</p>
                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                    <h2 className="text-xl font-semibold text-slate-900">{isCreate ? 'New PO' : overviewDraft.poNumber}</h2>
                                                    {fieldIsEditing ? (
                                                        <span className="hidden rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-800 sm:inline-flex">
                                                            Editing
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                            <span className={poStatusBadge((isCreate ? overviewDraft.status : purchaseOrder.status) || 'Created')}>
                                                {(isCreate ? overviewDraft.status : purchaseOrder.status) || 'Created'}
                                            </span>
                                        </div>

                                        <div
                                            className={cn(
                                                'mt-5 space-y-4',
                                                fieldIsEditing &&
                                                    'rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] p-3',
                                            )}
                                        >
                                            <PoCollapsibleSection
                                                title="REFERENCE, PRICING & DELIVERY"
                                                icon={LuClipboardList}
                                                tone="blue"
                                                open={poOverviewDetailsOpen}
                                                onOpenChange={setPoOverviewDetailsOpen}
                                                headerRight={
                                                    fieldIsEditing && overviewDetailsErrorCount > 0 ? (
                                                        <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                                            {overviewDetailsErrorCount} required
                                                        </span>
                                                    ) : null
                                                }
                                            >
                                                <div className="space-y-3 p-3">
                                                    <div className="rounded-lg border border-gray-200/80">
                                                        <div className="border-b border-gray-200/80 bg-slate-50/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                            Reference & parties
                                                        </div>
                                                        <div className="grid grid-cols-1 overflow-hidden xl:grid-cols-2">
                                                            <PoFieldRow label="PO ID" id="po-field-poId">
                                                                {isCreate ? (
                                                                    <span className="text-sm font-medium text-gray-500">Auto-generated on save</span>
                                                                ) : (
                                                                    <span className="font-mono text-sm tracking-tight text-gray-900">{overviewDraft.poNumber}</span>
                                                                )}
                                                            </PoFieldRow>
                                                            <PoFieldRow label="PR number">
                                                                <span className="text-[15px] font-medium text-gray-900">
                                                                    {overviewDraft.prNumber?.trim() || EMPTY_FIELD}
                                                                </span>
                                                            </PoFieldRow>
                                                            <PoFieldRow label="PR reference" required className="xl:col-span-2" id="po-field-pr">
                                                                <PoEditableLookupSelect
                                                                    id="po-select-pr"
                                                                    isEditing={fieldIsEditing}
                                                                    error={overviewErrors.prSlug}
                                                                    value={overviewDraft.prSlug}
                                                                    onChange={(v) => onPrPick(v)}
                                                                    options={[{ value: '', label: 'Select approved PR' }, ...prOptions]}
                                                                    placeholder="Select approved PR"
                                                                    readValue={
                                                                        prReferenceReadLabel === EMPTY_FIELD ? (
                                                                            <span className="text-gray-400">{EMPTY_FIELD}</span>
                                                                        ) : (
                                                                            <span className="font-medium text-gray-900">{prReferenceReadLabel}</span>
                                                                        )
                                                                    }
                                                                />
                                                            </PoFieldRow>
                                                            <PoFieldRow label="Supplier" required className="xl:col-span-2" id="po-field-supplier">
                                                                <PoEditableLookupSelect
                                                                    id="po-select-supplier"
                                                                    isEditing={fieldIsEditing}
                                                                    error={overviewErrors.supplierId}
                                                                    value={overviewDraft.supplierId}
                                                                    onChange={(v) => onSupplierPick(v)}
                                                                    options={[{ value: '', label: 'Select supplier' }, ...supplierOptions]}
                                                                    placeholder="Select supplier"
                                                                    readValue={
                                                                        overviewDraft.supplierName?.trim() ? (
                                                                            <span className="font-medium text-gray-900">{overviewDraft.supplierName}</span>
                                                                        ) : (
                                                                            <span className="text-gray-400">{EMPTY_FIELD}</span>
                                                                        )
                                                                    }
                                                                />
                                                            </PoFieldRow>
                                                            <PoFieldRow label="Material" required className="xl:col-span-2" id="po-field-material">
                                                                <EditableSelect
                                                                    id="po-select-material"
                                                                    isEditing={fieldIsEditing}
                                                                    error={overviewErrors.material}
                                                                    value={overviewDraft.material}
                                                                    onChange={(v) => onOverviewDraft('material', v)}
                                                                    options={materialOptions}
                                                                    placeholder="Select material"
                                                                    readValue={
                                                                        overviewDraft.material?.trim() ? (
                                                                            <span className="font-medium text-gray-900">{overviewDraft.material}</span>
                                                                        ) : (
                                                                            EMPTY_FIELD
                                                                        )
                                                                    }
                                                                />
                                                            </PoFieldRow>
                                                        </div>
                                                    </div>

                                                    <div className="rounded-lg border border-gray-200/80">
                                                        <div className="border-b border-gray-200/80 bg-slate-50/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                            Quantity & pricing
                                                        </div>
                                                        <div className="grid grid-cols-1 overflow-hidden xl:grid-cols-2">
                                                            <PoFieldRow label="Quantity" required id="po-field-qty">
                                                                <EditableField
                                                                    id="po-field-qty-input"
                                                                    isEditing={fieldIsEditing}
                                                                    error={overviewErrors.quantity}
                                                                    value={overviewDraft.quantity}
                                                                    onChange={(v) => onOverviewDraft('quantity', v.replace(/[^\d.]/g, ''))}
                                                                    readValue={
                                                                        overviewDraft.quantity?.trim() ? (
                                                                            <span className="tabular-nums font-medium text-gray-900">{overviewDraft.quantity}</span>
                                                                        ) : (
                                                                            EMPTY_FIELD
                                                                        )
                                                                    }
                                                                />
                                                            </PoFieldRow>
                                                            <PoFieldRow label="Unit price" required id="po-field-unit">
                                                                <EditableField
                                                                    id="po-field-unit-input"
                                                                    isEditing={fieldIsEditing}
                                                                    error={overviewErrors.unitPrice}
                                                                    value={overviewDraft.unitPrice}
                                                                    onChange={(v) => onOverviewDraft('unitPrice', v.replace(/[^\d.]/g, ''))}
                                                                    readValue={
                                                                        overviewDraft.unitPrice?.trim() ? (
                                                                            <span className="tabular-nums font-medium text-gray-900">{overviewDraft.unitPrice}</span>
                                                                        ) : (
                                                                            EMPTY_FIELD
                                                                        )
                                                                    }
                                                                />
                                                            </PoFieldRow>
                                                            <PoFieldRow label="Currency" required id="po-field-currency">
                                                                <EditableField
                                                                    id="po-field-currency-input"
                                                                    isEditing={fieldIsEditing}
                                                                    error={overviewErrors.currency}
                                                                    value={overviewDraft.currency}
                                                                    onChange={(v) => onOverviewDraft('currency', v)}
                                                                    readValue={
                                                                        overviewDraft.currency?.trim() ? (
                                                                            <span className="font-medium text-gray-900">{overviewDraft.currency}</span>
                                                                        ) : (
                                                                            EMPTY_FIELD
                                                                        )
                                                                    }
                                                                />
                                                            </PoFieldRow>
                                                            <PoFieldRow label="Total amount">
                                                                <span className="tabular-nums font-semibold text-gray-900">
                                                                    {formatMoney(totalAmountPreview, overviewDraft.currency)}
                                                                </span>
                                                            </PoFieldRow>
                                                        </div>
                                                    </div>

                                                    <div className="rounded-lg border border-gray-200/80">
                                                        <div className="border-b border-gray-200/80 bg-slate-50/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                                            Delivery & status
                                                        </div>
                                                        <div className="grid grid-cols-1 overflow-hidden xl:grid-cols-2">
                                                            <PoFieldRow label="Delivery date" required id="po-field-delivery">
                                                                <EditableField
                                                                    id="po-field-delivery-input"
                                                                    isEditing={fieldIsEditing}
                                                                    type="date"
                                                                    error={overviewErrors.deliveryDate}
                                                                    value={overviewDraft.deliveryDate}
                                                                    onChange={(v) => onOverviewDraft('deliveryDate', v)}
                                                                    readValue={
                                                                        overviewDraft.deliveryDate?.trim() ? (
                                                                            <span className="tabular-nums text-gray-900">{overviewDraft.deliveryDate}</span>
                                                                        ) : (
                                                                            EMPTY_FIELD
                                                                        )
                                                                    }
                                                                />
                                                            </PoFieldRow>
                                                            <PoFieldRow label="Status" required id="po-field-status">
                                                                <EditableSelect
                                                                    id="po-select-status"
                                                                    isEditing={fieldIsEditing}
                                                                    error={overviewErrors.status}
                                                                    value={overviewDraft.status}
                                                                    onChange={(v) => onOverviewDraft('status', v as PurchaseOrderStatus)}
                                                                    options={[...PO_STATUS_OPTIONS]}
                                                                    placeholder="Select status"
                                                                    readValue={
                                                                        overviewDraft.status ? (
                                                                            <span className={poStatusBadge(overviewDraft.status)}>{overviewDraft.status}</span>
                                                                        ) : (
                                                                            <span className="text-gray-400">{EMPTY_FIELD}</span>
                                                                        )
                                                                    }
                                                                />
                                                            </PoFieldRow>
                                                        </div>
                                                    </div>
                                                </div>
                                            </PoCollapsibleSection>

                                            <PoCollapsibleSection
                                                title="GOODS RECEIPT"
                                                icon={LuPackage}
                                                tone="blue"
                                                open={poDeliverySectionsOpen.receipt}
                                                onOpenChange={(o) => setPoDeliverySectionsOpen((s) => ({ ...s, receipt: o }))}
                                                headerRight={
                                                    fieldIsEditing && deliveryReceiptErrorCount > 0 ? (
                                                        <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                                            {deliveryReceiptErrorCount} required
                                                        </span>
                                                    ) : null
                                                }
                                            >
                                                {isCreate ? (
                                                    <p className="mx-3 mt-3 text-xs text-slate-500">
                                                        Record initial receipt details when issuing the PO, or update after goods arrive.
                                                    </p>
                                                ) : null}
                                                <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 m-3 xl:grid-cols-2">
                                                                    <PoFieldRow label="Delivery status" required id="po-delivery-status">
                                                                        <EditableSelect
                                                                            id="po-select-delivery-status"
                                                                            isEditing={fieldIsEditing}
                                                                            error={deliveryErrors.status}
                                                                            value={deliveryDraft.status}
                                                                            onChange={(v) => setDeliveryDraft((d) => ({ ...d, status: v as PoDeliveryStatus }))}
                                                                            options={[...DELIVERY_STATUS_OPTIONS]}
                                                                            placeholder="Select status"
                                                                            readValue={
                                                                                <span className={deliveryStatusBadge(deliveryDraft.status || 'Pending')}>
                                                                                    {deliveryDraft.status || EMPTY_FIELD}
                                                                                </span>
                                                                            }
                                                                        />
                                                                    </PoFieldRow>
                                                                    <PoFieldRow label="Received quantity" required id="po-delivery-received-qty">
                                                                        <EditableField
                                                                            id="po-delivery-received-input"
                                                                            isEditing={fieldIsEditing}
                                                                            error={deliveryErrors.receivedQuantity}
                                                                            value={deliveryDraft.receivedQuantity}
                                                                            onChange={(v) => setDeliveryDraft((d) => ({ ...d, receivedQuantity: v.replace(/[^\d.]/g, '') }))}
                                                                            readValue={
                                                                                deliveryDraft.receivedQuantity?.trim() ? (
                                                                                    <span className="tabular-nums font-medium text-gray-900">{deliveryDraft.receivedQuantity}</span>
                                                                                ) : (
                                                                                    EMPTY_FIELD
                                                                                )
                                                                            }
                                                                        />
                                                                    </PoFieldRow>
                                                                    <PoFieldRow label="Received date" id="po-delivery-received-date">
                                                                        <EditableField
                                                                            id="po-delivery-received-date-input"
                                                                            isEditing={fieldIsEditing}
                                                                            type="date"
                                                                            value={deliveryDraft.receivedDate}
                                                                            onChange={(v) => setDeliveryDraft((d) => ({ ...d, receivedDate: v }))}
                                                                            readValue={
                                                                                deliveryDraft.receivedDate?.trim() ? (
                                                                                    <span className="tabular-nums text-gray-900">{deliveryDraft.receivedDate}</span>
                                                                                ) : (
                                                                                    <span className="text-gray-400">{EMPTY_FIELD}</span>
                                                                                )
                                                                            }
                                                                        />
                                                                    </PoFieldRow>
                                                                    <PoFieldRow label="Quality check" required className="xl:col-span-2" id="po-delivery-quality">
                                                                        <EditableSelect
                                                                            id="po-select-quality"
                                                                            isEditing={fieldIsEditing}
                                                                            error={deliveryErrors.qualityCheck}
                                                                            value={deliveryDraft.qualityCheck}
                                                                            onChange={(v) => setDeliveryDraft((d) => ({ ...d, qualityCheck: v as PoQualityCheck }))}
                                                                            options={[...QUALITY_OPTIONS]}
                                                                            placeholder="Select result"
                                                                            readValue={
                                                                                deliveryDraft.qualityCheck ? (
                                                                                    <span className={qualityBadge(deliveryDraft.qualityCheck)}>{deliveryDraft.qualityCheck}</span>
                                                                                ) : (
                                                                                    <span className="text-gray-400">{EMPTY_FIELD}</span>
                                                                                )
                                                                            }
                                                                        />
                                                                    </PoFieldRow>
                                                </div>
                                            </PoCollapsibleSection>
                                        </div>
                                        {fieldIsEditing ? (
                                            <div className="sticky bottom-0 z-30 mt-4 pb-1">
                                                <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur sm:flex sm:items-center sm:justify-between sm:px-5">
                                                    <div className="text-sm font-semibold text-gray-900">{isCreate ? 'Finish create' : 'Unsaved changes'}</div>
                                                    <div className="mt-3 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:justify-end">
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
                                                                    Save draft
                                                                </Button>
                                                                <Button type="button" variant="company" size="cta" onClick={() => void onCreate()} isLoading={saving}>
                                                                    Create PO
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button type="button" variant="companyOutline" size="cta" onClick={onCancelOverview} disabled={saving}>
                                                                    Cancel
                                                                </Button>
                                                                <Button type="button" variant="companyOutline" size="cta" onClick={() => void onSaveOverview({ exitAfter: false })} isLoading={saving}>
                                                                    Save
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="company"
                                                                    size="cta"
                                                                    onClick={() => void onSaveOverview({ exitAfter: true })}
                                                                    isLoading={saving}
                                                                >
                                                                    Save & exit
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

                            <div className="min-w-0 lg:col-span-1 lg:sticky lg:top-44 lg:self-start">
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick info</p>
                                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                                        <p>
                                            <span className="font-semibold">PR</span>: {overviewDraft.prNumber?.trim() || EMPTY_FIELD}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Supplier</span>: {overviewDraft.supplierName?.trim() || EMPTY_FIELD}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Material</span>: {overviewDraft.material?.trim() || EMPTY_FIELD}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Delivery</span>: {overviewDraft.deliveryDate || EMPTY_FIELD}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : null}

                {tab === 'activity' && !isCreate ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <RecordHistoryLogPanel
                            module="purchase_orders"
                            recordId={purchaseOrder.slug}
                            recordTitle={purchaseOrder.poNumber}
                            supplementalEntries={historySupplemental}
                        />
                    </div>
                ) : null}
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
                title="Archive purchase order"
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
                    Archive <span className="font-semibold">{purchaseOrder.poNumber}</span>? It will be removed from the active list.
                </p>
            </Modal>
        </div>
    );
}
