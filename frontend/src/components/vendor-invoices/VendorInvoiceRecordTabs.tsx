'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BpStatusBadge } from '@/components/booking-payment/BpStatusBadge';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { Button } from '@/components/ui/Button';
import { StatusModal } from '@/components/ui/StatusModal';
import { VendorInvoiceMainTabBar } from '@/components/vendor-invoices/detail/VendorInvoiceMainTabBar';
import {
    normalizeVendorInvoiceDetailTab,
    type VendorInvoiceDetailMainTabId,
} from '@/components/vendor-invoices/detail/vendorInvoiceDetailTabIds';
import { VendorInvoiceApprovalStepper } from '@/components/vendor-invoices/VendorInvoiceApprovalStepper';
import { VendorInvoiceAIPanel } from '@/components/vendor-invoices/VendorInvoiceAIPanel';
import { VendorInvoiceInlineOverviewEditor } from '@/components/vendor-invoices/VendorInvoiceInlineOverviewEditor';
import { VendorInvoiceWorkOrderPicker } from '@/components/vendor-invoices/VendorInvoiceWorkOrderPicker';
import {
    addVendorInvoice,
    archiveVendorInvoice,
    duplicateVendorInvoice,
    formatMoney,
    getDemoFinanceUsers,
    getDemoVendorInvoiceCategories,
    getVendorInvoices,
    hasDuplicateVendorInvoiceForWorkOrder,
    updateVendorInvoice,
    type VendorInvoice,
} from '@/lib/vendorInvoiceStore';
import {
    buildDraftFromVendorInvoice,
    buildEmptyVendorInvoiceDraft,
    buildServiceExecutionFromWorkOrder,
    buildVendorDetailsFromVendor,
    buildVendorInvoiceDraftFromVendor,
    buildVendorInvoiceDraftFromWorkOrder,
    buildWorkOrderRefFromWorkOrder,
    computeBillingTotals,
    computeVendorInvoiceAiSignals,
    getBillableWorkOrdersForVendor,
    lineItemsDraftToStore,
    type VendorInvoiceLineItemDraft,
    type VendorInvoiceOverviewDraft,
} from '@/lib/vendor-invoices/vendorInvoiceWorkOrderBridge';
import { getWorkOrderProjectOptions } from '@/lib/work-orders/workOrderCatalog';
import { getAllVendorRecords } from '@/lib/vendors/vendorStore';
import { getWorkOrders } from '@/lib/workOrderStore';
import { CTA_INFO_BANNER, CTA_INFO_BANNER_BADGE, CTA_UTILITY_BTN } from '@/lib/theme/ctaThemeClasses';
import { LuCalendar, LuClock3, LuCopy, LuPencil, LuPlus, LuShare2, LuTrash2 } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const EMPTY_FIELD = '—';

function formatAuditTimestamp(iso: string | undefined | null): string {
    if (!iso?.trim()) return EMPTY_FIELD;
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

function approvalTone(status: string) {
    if (status === 'Approved' || status === 'Paid') return 'success' as const;
    if (status === 'Rejected') return 'danger' as const;
    if (status === 'Under Review' || status === 'Submitted') return 'warning' as const;
    return 'neutral' as const;
}

function paymentTone(status: string) {
    if (status === 'Paid') return 'success' as const;
    if (status === 'Partial') return 'warning' as const;
    return 'neutral' as const;
}

export function VendorInvoiceRecordTabs({
    invoice,
    createMode = false,
    onBump,
}: {
    invoice: VendorInvoice;
    createMode?: boolean;
    onBump: () => void;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isCreate = createMode;

    const [tab, setTabState] = useState<VendorInvoiceDetailMainTabId>(() =>
        normalizeVendorInvoiceDetailTab(searchParams.get('tab')),
    );
    const setTab = useCallback(
        (next: VendorInvoiceDetailMainTabId) => {
            if (isCreate && next !== 'overview') return;
            setTabState(next);
            const url = `/company-admin/vendors/invoices/view/${encodeURIComponent(isCreate ? 'new' : invoice.slug)}?tab=${encodeURIComponent(next)}`;
            router.replace(url, { scroll: false });
        },
        [isCreate, router, invoice.slug],
    );

    useEffect(() => {
        const fromUrl = normalizeVendorInvoiceDetailTab(searchParams.get('tab'));
        setTabState(isCreate ? 'overview' : fromUrl);
    }, [searchParams, isCreate]);

    const [isInlineEditing, setIsInlineEditing] = useState(isCreate);
    const [draft, setDraft] = useState<VendorInvoiceOverviewDraft>(() =>
        isCreate ? buildEmptyVendorInvoiceDraft() : buildDraftFromVendorInvoice(invoice),
    );
    const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
    const [saving, setSaving] = useState(false);
    const [inlineToast, setInlineToast] = useState<{ msg: string; err: boolean } | null>(null);
    const [statusModal, setStatusModal] = useState<{
        open: boolean;
        type: 'success' | 'error';
        title: string;
        afterClose?: () => void;
    }>({ open: false, type: 'success', title: '' });

    const vendors = useMemo(() => getAllVendorRecords(), []);
    const projects = useMemo(() => getWorkOrderProjectOptions(), []);
    const allWorkOrders = useMemo(() => getWorkOrders().filter((w) => !w.archivedAt), []);

    const prefilledVendorId = useMemo(
        () => searchParams.get('vendorId')?.trim() || '',
        [searchParams],
    );
    const lockVendor = Boolean(isCreate && prefilledVendorId);
    const prefilledVendor = useMemo(
        () => (prefilledVendorId ? vendors.find((v) => v.id === prefilledVendorId) : undefined),
        [prefilledVendorId, vendors],
    );

    const workOrders = useMemo(() => {
        if (lockVendor && prefilledVendor) {
            return getBillableWorkOrdersForVendor(prefilledVendor.id, prefilledVendor.name, allWorkOrders);
        }
        return allWorkOrders;
    }, [allWorkOrders, lockVendor, prefilledVendor]);
    const financeUsers = useMemo(() => getDemoFinanceUsers(), []);
    const categories = useMemo(() => getDemoVendorInvoiceCategories(), []);

    const vendorOptions = useMemo(() => vendors.map((v) => ({ id: v.id, name: v.name })), [vendors]);
    const workOrderOptions = useMemo(
        () => workOrders.map((w) => ({ id: w.workOrderId, label: `${w.workOrderId} — ${w.title}` })),
        [workOrders],
    );

    const invoicedWorkOrderIds = useMemo(() => {
        const ids = new Set<string>();
        getVendorInvoices().forEach((inv) => {
            if (inv.linkedWorkOrderId?.trim()) ids.add(inv.linkedWorkOrderId.trim());
        });
        return ids;
    }, [invoice.slug, isCreate]);

    useEffect(() => {
        if (isCreate) return;
        if (isInlineEditing) return;
        setDraft(buildDraftFromVendorInvoice(invoice));
    }, [invoice, isInlineEditing, isCreate]);

    const applyWorkOrderToDraft = useCallback(
        (workOrderId: string) => {
            if (!workOrderId) {
                if (prefilledVendor) {
                    setDraft(buildVendorInvoiceDraftFromVendor(prefilledVendor));
                } else {
                    setDraft(buildEmptyVendorInvoiceDraft());
                }
                return;
            }
            const wo = allWorkOrders.find((w) => w.workOrderId === workOrderId) ?? workOrders.find((w) => w.workOrderId === workOrderId);
            if (!wo) return;
            const next = buildVendorInvoiceDraftFromWorkOrder(wo, vendors);
            if (lockVendor && prefilledVendor) {
                next.vendorId = prefilledVendor.id;
                next.vendorName = prefilledVendor.name;
                next.vendorCategory = prefilledVendor.categories[0] ?? next.vendorCategory;
            }
            setDraft(next);
        },
        [vendors, workOrders, allWorkOrders, prefilledVendor, lockVendor],
    );

    useEffect(() => {
        if (!isCreate) return;
        const woId = searchParams.get('workOrderId')?.trim() || searchParams.get('workOrder')?.trim() || '';
        if (woId) {
            applyWorkOrderToDraft(woId);
            return;
        }
        if (prefilledVendor) {
            setDraft(buildVendorInvoiceDraftFromVendor(prefilledVendor));
        }
    }, [isCreate, searchParams, applyWorkOrderToDraft, prefilledVendor]);

    const [selectedServiceRequestId, setSelectedServiceRequestId] = useState('');

    const onSelectServiceRequest = useCallback(
        (serviceRequestId: string, workOrderId: string) => {
            setSelectedServiceRequestId(serviceRequestId);
            if (workOrderId) applyWorkOrderToDraft(workOrderId);
            else if (!serviceRequestId) setSelectedServiceRequestId('');
        },
        [applyWorkOrderToDraft],
    );

    useEffect(() => {
        const e = searchParams.get('edit');
        if (e !== '1' && e !== 'true') return;
        setIsInlineEditing(true);
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete('edit');
        const qs = sp.toString();
        const base = `/company-admin/vendors/invoices/view/${encodeURIComponent(isCreate ? 'new' : invoice.slug)}`;
        router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    }, [searchParams, invoice.slug, router, isCreate]);

    useEffect(() => {
        if (isCreate) setIsInlineEditing(true);
    }, [isCreate]);

    const discount = Number(draft.discount) || 0;
    const gstPercent = Number(draft.gstPercent) || 18;
    const billing = computeBillingTotals(draft.lineItems, discount, gstPercent);
    const total = billing.invoiceAmount;

    const linkedWorkOrder = useMemo(() => {
        const woId = draft.linkedWorkOrderId?.trim() || invoice.linkedWorkOrderId?.trim();
        return workOrders.find((w) => w.workOrderId === woId);
    }, [draft.linkedWorkOrderId, invoice.linkedWorkOrderId, workOrders]);

    const workOrderRef = useMemo(() => {
        if (linkedWorkOrder) return buildWorkOrderRefFromWorkOrder(linkedWorkOrder);
        return invoice.workOrderRef ?? {
            residentName: '',
            unit: '',
            issueCategory: '',
            completionDate: '',
            vendorAssigned: '',
            workOrderValue: 0,
        };
    }, [linkedWorkOrder, invoice.workOrderRef]);

    const vendorDetailsForAi = useMemo(() => {
        const vendor = vendors.find((v) => v.id === draft.vendorId || v.name === draft.vendorName);
        return buildVendorDetailsFromVendor(vendor);
    }, [draft.vendorId, draft.vendorName, vendors]);

    const serviceExecution = useMemo(() => {
        if (linkedWorkOrder) {
            return buildServiceExecutionFromWorkOrder(linkedWorkOrder, draft.vendorName || invoice.vendorName);
        }
        return {
            servicePerformed: draft.servicePerformed || invoice.servicePerformed || invoice.lineItems[0]?.description || '',
            completionDate: invoice.workOrderRef?.completionDate ?? '',
            project: draft.linkedProject || invoice.linkedProject,
            tower: draft.linkedTower || invoice.linkedTower,
            unit: invoice.workOrderRef?.unit ?? '',
            residentName: invoice.workOrderRef?.residentName ?? '',
            serviceCategory: invoice.workOrderRef?.issueCategory ?? draft.vendorCategory,
            vendorName: draft.vendorName || invoice.vendorName,
        };
    }, [linkedWorkOrder, draft, invoice]);

    const onDraftChange = useCallback(
        (key: keyof VendorInvoiceOverviewDraft, value: string) => {
            setDraft((prev) => {
                const next = { ...prev, [key]: value };
                if (key === 'vendorName') {
                    const v = vendors.find((x) => x.name === value);
                    next.vendorId = v?.id ?? '';
                    next.vendorCategory = v?.categories[0] ?? next.vendorCategory;
                    if (!next.sourceWorkOrderId) {
                        next.linkedProject = v?.primaryProject ?? next.linkedProject;
                    }
                }
                return next;
            });
            if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
        },
        [errors, vendors],
    );

    const onLineItemsChange = useCallback((items: VendorInvoiceLineItemDraft[]) => {
        setDraft((prev) => ({ ...prev, lineItems: items }));
    }, []);

    const validate = useCallback(() => {
        const next: Partial<Record<string, string>> = {};
        if (!draft.invoiceNumber.trim()) next.invoiceNumber = 'Invoice number is required';
        if (!draft.linkedWorkOrderId.trim()) next.linkedWorkOrderId = 'Completed work order is required';
        if (!draft.vendorName.trim()) next.vendorName = 'Vendor is required';
        if (!draft.linkedProject.trim()) next.linkedProject = 'Project is required';
        if (!draft.invoiceDate.trim()) next.invoiceDate = 'Invoice date is required';
        const lineItems = lineItemsDraftToStore(draft.lineItems);
        if (!lineItems.length || lineItems.every((li) => li.amount <= 0)) {
            next.lineItems = 'Add at least one billable line item';
        }
        if (isCreate && hasDuplicateVendorInvoiceForWorkOrder(draft.linkedWorkOrderId)) {
            next.linkedWorkOrderId = 'An invoice already exists for this work order';
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    }, [draft, isCreate]);

    const persistDraft = useCallback(async () => {
        if (!validate()) {
            setInlineToast({ msg: 'Fix required fields before saving.', err: true });
            return false;
        }
        const lineItems = lineItemsDraftToStore(draft.lineItems);
        const vendor = vendors.find((v) => v.id === draft.vendorId || v.name === draft.vendorName);
        const vendorDetails = buildVendorDetailsFromVendor(vendor);
        const woRef = linkedWorkOrder ? buildWorkOrderRefFromWorkOrder(linkedWorkOrder) : workOrderRef;
        const aiSignals = computeVendorInvoiceAiSignals({
            invoiceTotal: billing.invoiceAmount,
            workOrderValue: woRef.workOrderValue,
            approvedAmount: 0,
            vendorCompliance: vendorDetails.complianceStatus,
            vendorContract: vendorDetails.contractStatus,
            vendorRiskScore: vendor ? Math.max(20, 100 - vendor.compliancePercent) : 40,
            hasDuplicateForWorkOrder: hasDuplicateVendorInvoiceForWorkOrder(draft.linkedWorkOrderId, isCreate ? undefined : invoice.slug),
            hasMandatoryDocuments: false,
            currency: draft.currency,
        });
        setSaving(true);
        try {
            if (isCreate) {
                const created = addVendorInvoice({
                    invoiceNumber: draft.invoiceNumber.trim(),
                    vendorId: draft.vendorId,
                    vendorName: draft.vendorName,
                    vendorCategory: draft.vendorCategory,
                    linkedProject: draft.linkedProject,
                    linkedTower: draft.linkedTower,
                    linkedWorkOrderId: draft.linkedWorkOrderId,
                    linkedWorkOrderSlug: draft.linkedWorkOrderSlug,
                    linkedServiceRequestId: draft.linkedServiceRequestId,
                    linkedServiceRequestSlug: draft.linkedServiceRequestSlug,
                    invoiceDate: draft.invoiceDate,
                    dueDate: draft.dueDate,
                    currency: draft.currency as VendorInvoice['currency'],
                    assignedFinanceUser: draft.assignedFinanceUser,
                    servicePerformed: draft.servicePerformed || serviceExecution.servicePerformed,
                    lineItems,
                    discount,
                    gstPercent,
                    notes: draft.notes,
                    approvalStatus: 'Draft',
                    workOrderRef: woRef,
                    vendorDetails,
                    aiValidation: {
                        status: aiSignals.validation.status ?? 'Needs Review',
                        workOrderApprovedAmount: aiSignals.validation.workOrderApprovedAmount ?? woRef.workOrderValue,
                        varianceAmount: aiSignals.validation.varianceAmount ?? 0,
                        variancePercent: aiSignals.validation.variancePercent ?? 0,
                        riskScore: aiSignals.validation.riskScore ?? 30,
                        confidenceScore: aiSignals.validation.confidenceScore ?? aiSignals.confidence,
                        recommendedAction: aiSignals.validation.recommendedAction ?? aiSignals.recommendation,
                        findings: aiSignals.validation.findings ?? [],
                    },
                });
                onBump();
                setStatusModal({
                    open: true,
                    type: 'success',
                    title: 'Vendor Invoice Created',
                    afterClose: () =>
                        router.replace(
                            `/company-admin/vendors/invoices/view/${encodeURIComponent(created.slug)}?tab=overview`,
                        ),
                });
                return true;
            }
            updateVendorInvoice(invoice.slug, {
                invoiceNumber: draft.invoiceNumber.trim(),
                vendorId: draft.vendorId,
                vendorName: draft.vendorName,
                vendorCategory: draft.vendorCategory,
                linkedProject: draft.linkedProject,
                linkedTower: draft.linkedTower,
                linkedWorkOrderId: draft.linkedWorkOrderId,
                linkedWorkOrderSlug: draft.linkedWorkOrderSlug,
                linkedServiceRequestId: draft.linkedServiceRequestId,
                linkedServiceRequestSlug: draft.linkedServiceRequestSlug,
                invoiceDate: draft.invoiceDate,
                dueDate: draft.dueDate,
                currency: draft.currency as VendorInvoice['currency'],
                assignedFinanceUser: draft.assignedFinanceUser,
                servicePerformed: draft.servicePerformed || serviceExecution.servicePerformed,
                lineItems,
                discount,
                gstPercent,
                notes: draft.notes,
                workOrderRef: woRef,
                vendorDetails,
                aiValidation: {
                    status: aiSignals.validation.status ?? invoice.aiValidation.status,
                    workOrderApprovedAmount: aiSignals.validation.workOrderApprovedAmount ?? woRef.workOrderValue,
                    varianceAmount: aiSignals.validation.varianceAmount ?? 0,
                    variancePercent: aiSignals.validation.variancePercent ?? 0,
                    riskScore: aiSignals.validation.riskScore ?? invoice.aiValidation.riskScore,
                    confidenceScore: aiSignals.validation.confidenceScore ?? aiSignals.confidence,
                    recommendedAction: aiSignals.validation.recommendedAction ?? aiSignals.recommendation,
                    findings: aiSignals.validation.findings ?? [],
                },
            });
            onBump();
            setInlineToast({ msg: 'Vendor invoice updated.', err: false });
            return true;
        } catch {
            setInlineToast({ msg: 'Could not save vendor invoice.', err: true });
            return false;
        } finally {
            setSaving(false);
        }
    }, [
        billing.invoiceAmount,
        discount,
        draft,
        gstPercent,
        invoice.slug,
        isCreate,
        linkedWorkOrder,
        onBump,
        router,
        serviceExecution.servicePerformed,
        validate,
        vendors,
        workOrderRef,
    ]);

    const onSaveEdits = useCallback(
        async ({ exitAfter }: { exitAfter: boolean }) => {
            const ok = await persistDraft();
            if (!ok) return;
            if (exitAfter) {
                setIsInlineEditing(false);
                router.replace(`/company-admin/vendors/invoices/view/${encodeURIComponent(invoice.slug)}?tab=overview`, {
                    scroll: false,
                });
            }
        },
        [invoice.slug, persistDraft, router],
    );

    const onCancelEdits = useCallback(() => {
        setDraft(buildDraftFromVendorInvoice(invoice));
        setErrors({});
        setIsInlineEditing(false);
        router.replace(`/company-admin/vendors/invoices/view/${encodeURIComponent(invoice.slug)}?tab=overview`, {
            scroll: false,
        });
    }, [invoice, router]);

    const onClone = useCallback(() => {
        const copy = duplicateVendorInvoice(invoice.slug);
        if (copy) {
            onBump();
            router.push(`/company-admin/vendors/invoices/view/${encodeURIComponent(copy.slug)}?tab=overview`);
        }
    }, [invoice.slug, onBump, router]);

    const onArchive = useCallback(() => {
        if (archiveVendorInvoice(invoice.slug)) {
            onBump();
            router.push('/company-admin/vendors/invoices');
        }
    }, [invoice.slug, onBump, router]);

    const utilityBtn = CTA_UTILITY_BTN;

    return (
        <div className="w-full min-w-0 space-y-0">
            <StatusModal
                open={statusModal.open}
                type={statusModal.type}
                title={statusModal.title}
                autoCloseMs={1750}
                onClose={() => {
                    const after = statusModal.afterClose;
                    setStatusModal((s) => ({ ...s, open: false }));
                    after?.();
                }}
            />
            {inlineToast ? (
                <InlineToast message={inlineToast.msg} variant={inlineToast.err ? 'error' : 'success'} onDismiss={() => setInlineToast(null)} />
            ) : null}

            <VendorInvoiceMainTabBar
                active={tab}
                disabledKeys={
                    isCreate ? (['validation', 'payments', 'documents'] as VendorInvoiceDetailMainTabId[]) : []
                }
                onChange={(next) => {
                    if (isCreate && next !== 'overview') {
                        setInlineToast({ msg: 'Create vendor invoice to access other sections.', err: true });
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
                {tab === 'overview' ? (
                    <>
                        {isCreate ? (
                            <div className={CTA_INFO_BANNER}>
                                You are creating a vendor invoice from completed work{' '}
                                <span className={CTA_INFO_BANNER_BADGE}>Draft</span>
                            </div>
                        ) : null}

                        {isCreate ? (
                            <VendorInvoiceWorkOrderPicker
                                workOrders={workOrders}
                                invoicedWorkOrderIds={invoicedWorkOrderIds}
                                selectedWorkOrderId={draft.linkedWorkOrderId}
                                selectedServiceRequestId={selectedServiceRequestId || draft.linkedServiceRequestId}
                                onSelectWorkOrder={(woId) => {
                                    setSelectedServiceRequestId('');
                                    applyWorkOrderToDraft(woId);
                                }}
                                onSelectServiceRequest={onSelectServiceRequest}
                                vendorLocked={lockVendor}
                                vendorName={prefilledVendor?.name ?? draft.vendorName}
                            />
                        ) : null}

                        <div className="mt-3 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                {!isCreate ? (
                                    <div className="flex flex-wrap items-center gap-3" role="toolbar" aria-label="Vendor invoice actions">
                                        {!isInlineEditing ? (
                                            <button
                                                type="button"
                                                onClick={() => setIsInlineEditing(true)}
                                                disabled={saving}
                                                className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md bg-[var(--cta-button-bg)] px-2.25 py-1.5 text-sm font-medium text-[var(--cta-button-text)] transition-colors hover:bg-[var(--cta-button-hover-bg)] disabled:opacity-50"
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
                                        <button type="button" disabled={saving || isInlineEditing} className={cn(utilityBtn, 'disabled:opacity-60')}>
                                            <LuShare2 size={16} className="shrink-0" aria-hidden />
                                            <span className="whitespace-nowrap">Share</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={onArchive}
                                            disabled={saving || isInlineEditing}
                                            className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border border-rose-300 bg-white px-2.25 py-1.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-60"
                                        >
                                            <LuTrash2 size={16} className="shrink-0" aria-hidden />
                                            <span className="whitespace-nowrap">Archive</span>
                                        </button>
                                        <Link href="/company-admin/vendors/invoices/view/new">
                                            <span className={utilityBtn}>
                                                <LuPlus size={16} className="shrink-0" aria-hidden />
                                                <span className="whitespace-nowrap">New</span>
                                            </span>
                                        </Link>
                                    </div>
                                ) : (
                                    <span />
                                )}
                                {isCreate ? (
                                    <Link
                                        href="/company-admin/vendors/invoices"
                                        className="text-sm font-semibold text-[var(--cta-button-bg)] underline decoration-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] underline-offset-2 hover:text-slate-800"
                                    >
                                        Back to Vendor Invoices
                                    </Link>
                                ) : null}
                            </div>
                        </div>

                        {!isCreate ? (
                            <div className="mt-2 rounded-md bg-white/80 px-4 py-2 text-sm text-gray-700">
                                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
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
                                    <div className="bg-[#7185a217] px-4 py-4 sm:px-5 sm:py-5">
                                        <div className="min-w-0 w-full">
                                            <div className="flex min-w-0 items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vendor invoice</p>
                                                    <h2 className="mt-1 truncate text-xl font-semibold text-slate-900">
                                                        {draft.invoiceNumber?.trim()
                                                            ? draft.invoiceNumber
                                                            : isCreate
                                                              ? 'New vendor invoice'
                                                              : invoice.invoiceNumber || invoice.invoiceId}
                                                    </h2>
                                                </div>
                                                {!isCreate ? (
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <BpStatusBadge tone={approvalTone(invoice.approvalStatus)}>
                                                            {invoice.approvalStatus}
                                                        </BpStatusBadge>
                                                        <BpStatusBadge tone={paymentTone(invoice.paymentStatus)}>
                                                            {invoice.paymentStatus}
                                                        </BpStatusBadge>
                                                    </div>
                                                ) : null}
                                            </div>
                                            {!isCreate ? (
                                                <VendorInvoiceApprovalStepper status={invoice.approvalStatus} />
                                            ) : (
                                                <VendorInvoiceApprovalStepper status="Draft" />
                                            )}
                                        </div>

                                        <div className="mt-4 min-w-0">
                                            <VendorInvoiceInlineOverviewEditor
                                                invoice={invoice}
                                                isEditing={isInlineEditing}
                                                draft={draft}
                                                errors={errors}
                                                onDraftChange={onDraftChange}
                                                onLineItemsChange={onLineItemsChange}
                                                vendorOptions={vendorOptions}
                                                categoryOptions={categories}
                                                projectOptions={projects}
                                                workOrderOptions={workOrderOptions}
                                                financeUserOptions={financeUsers}
                                                workOrderRef={workOrderRef}
                                                serviceExecution={serviceExecution}
                                                isCreateMode={isCreate}
                                                lockVendor={lockVendor}
                                                onRequestEdit={() => setIsInlineEditing(true)}
                                            />
                                        </div>

                                        {isInlineEditing ? (
                                            <div className="sticky bottom-0 z-30 mt-4 pb-1">
                                                <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur supports-backdrop-filter:bg-white/90 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {isCreate
                                                                ? 'Review details and create vendor invoice'
                                                                : 'You have unsaved changes'}
                                                        </p>
                                                    </div>
                                                    <div className="mt-3 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:items-center sm:justify-end">
                                                        {isCreate ? (
                                                            <>
                                                                <Button
                                                                    type="button"
                                                                    variant="companyOutline"
                                                                    size="cta"
                                                                    onClick={() => router.push('/company-admin/vendors/invoices')}
                                                                    disabled={saving}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="company"
                                                                    size="cta"
                                                                    onClick={() => void persistDraft()}
                                                                    isLoading={saving}
                                                                >
                                                                    {saving ? 'Creating...' : 'Create Vendor Invoice'}
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button type="button" variant="companyOutline" size="cta" onClick={onCancelEdits} disabled={saving}>
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="companyOutline"
                                                                    size="cta"
                                                                    onClick={() => void onSaveEdits({ exitAfter: false })}
                                                                    disabled={saving}
                                                                    isLoading={saving}
                                                                >
                                                                    {saving ? 'Saving...' : 'Save'}
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="company"
                                                                    size="cta"
                                                                    onClick={() => void onSaveEdits({ exitAfter: true })}
                                                                    disabled={saving}
                                                                    isLoading={saving}
                                                                >
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

                            <div className="min-w-0 space-y-4 lg:col-span-1 lg:sticky lg:top-44 lg:self-start">
                                {isCreate && !draft.linkedWorkOrderId ? (
                                    <div>
                                        <p className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                                            Select a completed work order to run AI validation
                                        </p>
                                        <div className="pointer-events-none opacity-50">
                                            <VendorInvoiceAIPanel
                                                invoice={invoice}
                                                draft={draft}
                                                workOrderValue={0}
                                                disabled
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <VendorInvoiceAIPanel
                                        invoice={invoice}
                                        draft={draft}
                                        workOrderValue={workOrderRef.workOrderValue}
                                        disabled={false}
                                        excludeSlug={isCreate ? undefined : invoice.slug}
                                        vendorDetailsOverride={vendorDetailsForAi}
                                    />
                                )}
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quick info</p>
                                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                                        <p>
                                            <span className="font-semibold">Total</span>: {formatMoney(isInlineEditing ? total : invoice.invoiceAmount, draft.currency)}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Paid</span>: {formatMoney(invoice.paidAmount, draft.currency)}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Balance</span>:{' '}
                                            {formatMoney(
                                                Math.max(0, (isInlineEditing ? total : invoice.invoiceAmount) - invoice.paidAmount),
                                                draft.currency,
                                            )}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Vendor</span>: {draft.vendorName || EMPTY_FIELD}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Project</span>: {draft.linkedProject || EMPTY_FIELD}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Work order</span>: {draft.linkedWorkOrderId || EMPTY_FIELD}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : null}

                {tab === 'validation' && !isCreate ? (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <h3 className="text-sm font-semibold text-slate-900">AI Validation &amp; Approval</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <BpStatusBadge tone={invoice.aiValidation.status === 'Passed' ? 'success' : invoice.aiValidation.status === 'High Risk' ? 'danger' : 'warning'}>
                                {invoice.aiValidation.status}
                            </BpStatusBadge>
                            <BpStatusBadge tone={approvalTone(invoice.approvalStatus)}>{invoice.approvalStatus}</BpStatusBadge>
                        </div>
                        <p className="mt-3 text-sm text-slate-600">{invoice.aiValidation.recommendedAction}</p>
                        {invoice.aiValidation.findings.length ? (
                            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                                {invoice.aiValidation.findings.map((f) => (
                                    <li key={f}>{f}</li>
                                ))}
                            </ul>
                        ) : null}
                    </div>
                ) : null}

                {tab === 'payments' && !isCreate ? (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <h3 className="text-sm font-semibold text-slate-900">Payment summary</h3>
                        <dl className="mt-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Invoice amount</dt>
                                <dd className="font-medium">{formatMoney(invoice.invoiceAmount, invoice.currency)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Approved</dt>
                                <dd>{formatMoney(invoice.approvedAmount, invoice.currency)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-slate-500">Paid</dt>
                                <dd>{formatMoney(invoice.paidAmount, invoice.currency)}</dd>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-2">
                                <dt className="font-medium">Balance</dt>
                                <dd className="font-semibold">{formatMoney(invoice.balanceAmount, invoice.currency)}</dd>
                            </div>
                        </dl>
                    </div>
                ) : null}

                {tab === 'documents' && !isCreate ? (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <h3 className="text-sm font-semibold text-slate-900">Attachments</h3>
                        {invoice.attachments.length ? (
                            <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
                                {invoice.attachments.map((a) => (
                                    <li key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                                        <span>
                                            <span className="font-medium">{a.category}</span> · {a.fileName}
                                        </span>
                                        <span className="text-xs text-slate-500">{a.sizeLabel}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="mt-3 text-sm text-slate-500">No attachments uploaded.</p>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
