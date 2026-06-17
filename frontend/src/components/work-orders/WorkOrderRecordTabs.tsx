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
import { WorkspaceUtilityToolbar, WORK_ORDER_WORKSPACE_HELP } from '@/components/workspace-help';
import { RecordWorkflowStepper } from '@/components/workflow/RecordWorkflowStepper';
import { computeWorkOrderWorkflowSteps } from '@/lib/work-orders/workOrderWorkflow';
import { createWorkflowStepHandler } from '@/lib/workflow/workflowStepNavigation';
import { draftService } from '@/lib/draftService';
import { getWorkOrderProjectOptions, getWorkOrderVendorOptions } from '@/lib/work-orders/workOrderCatalog';
import { RecordHistoryLogPanel } from '@/components/history-logs/RecordHistoryLogPanel';
import { workOrderActivitiesToHistoryLogEntries } from '@/lib/historyLogs/recordHistoryAdapters';
import { WorkOrderMainTabBar } from '@/components/work-orders/detail/WorkOrderMainTabBar';
import { WorkOrderOverviewLifecycle } from '@/components/work-orders/detail/WorkOrderOverviewLifecycle';
import { WorkOrderAIPanel } from '@/components/work-orders/WorkOrderAIPanel';
import type { WorkOrderDetailMainTabId } from '@/components/work-orders/detail/workOrderDetailTabIds';
import { normalizeWorkOrderDetailTab } from '@/components/work-orders/detail/workOrderDetailTabIds';
import { WorkOrderInlineOverviewEditor } from '@/components/work-orders/WorkOrderInlineOverviewEditor';
import {
    addWorkOrderFromCoreFields,
    archiveWorkOrder,
    computeDelayDays,
    duplicateWorkOrder,
    getNextWorkOrderCode,
    isEndDateAfterStartDate,
    type WorkOrderActivityEntry,
    type PaymentStatus,
    type SlaStatus,
    type VerificationStatus,
    type WorkOrder,
    type WorkOrderLocationDetails,
    type WorkOrderPriority,
    type WorkOrderStatus,
    type WorkType,
    type IssueType,
} from '@/lib/workOrderStore';
import {
    LuDownload,
    LuEllipsis,
    LuCalendar,
    LuMail,
    LuClock3,
    LuPrinter,
    LuClipboardList,
    LuExternalLink,
    LuActivity,
    LuPaperclip,
    LuPencil,
    LuTrash2,
    LuCopy,
    LuShare2,
    LuPlus,
} from 'react-icons/lu';

type TabId = WorkOrderDetailMainTabId;

const EMPTY_FIELD = '—';

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

const WORK_TYPE_OPTIONS: WorkType[] = ['Plumbing', 'Electrical', 'Civil', 'Interior', 'HVAC', 'Construction', 'Other'];
const PRIORITY_OPTIONS: WorkOrderPriority[] = ['Low', 'Medium', 'High', 'Critical'];

function deriveIssueTypeFromWorkType(workType: WorkType | ''): IssueType | '' {
    if (workType === 'Plumbing') return 'Plumbing Work';
    if (workType === 'Electrical') return 'Electrical Work';
    if (workType) return 'Other';
    return '';
}

function formatLocationDetails(loc?: WorkOrderLocationDetails): string {
    if (!loc) return '';
    if (loc.area?.trim() && !loc.flat?.trim() && !loc.block?.trim() && !loc.tower?.trim() && !loc.plot?.trim()) {
        return loc.area.trim();
    }
    return [loc.flat, loc.block, loc.tower, loc.plot, loc.area].filter((s) => s?.trim()).join(', ');
}

function locationDetailsToStore(value: string): WorkOrderLocationDetails {
    const trimmed = value.trim();
    return { flat: '', block: '', tower: '', plot: '', area: trimmed };
}
const SLA_OPTIONS: SlaStatus[] = ['On Track', 'Delayed', 'At Risk'];
const STATUS_OPTIONS: WorkOrderStatus[] = ['Draft', 'Open', 'Assigned', 'In Progress', 'On Hold', 'Completed', 'Verified', 'Cancelled'];
const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['Pending', 'Partial', 'Paid'];
const PAYMENT_STATUS_OVERVIEW_OPTIONS: PaymentStatus[] = ['Pending', 'Paid'];
// Attachments/documents tab removed from the tab bar for this build.

type OverviewDraft = {
    title: string;
    description: string;
    workType: WorkType | '';
    projectOrProperty: string;
    locationDetails: string;
    priority: WorkOrderPriority | '';
    requestedBy: string;
    requestedAt: string; // ISO (read-only in UI)

    vendorName: string;
    assignedDate: string;
    assignedBy: string;
    estimatedCost: string;
    estimatedDurationDays: string;

    startDate: string;
    endDate: string;
    slaStatus: SlaStatus;

    status: WorkOrderStatus;

    actualCost: string;
    paymentStatus: PaymentStatus | '';
    invoiceReference: string;
};

type WorkOrderDraftData = OverviewDraft;

function formatIso(iso: string) {
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

function statusChip(status: WorkOrderStatus) {
    const s = status.toLowerCase();
    const base = 'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold';
    if (s === 'completed' || s === 'verified') return cn(base, 'border-emerald-200 bg-emerald-50 text-emerald-800');
    if (s === 'cancelled') return cn(base, 'border-rose-200 bg-rose-50 text-rose-800');
    if (s === 'on hold') return cn(base, 'border-amber-200 bg-amber-50 text-amber-900');
    if (s === 'in progress') return cn(base, 'border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] text-slate-800');
    if (s === 'assigned' || s === 'open') return cn(base, 'border-slate-200 bg-white text-slate-700');
    return cn(base, 'border-slate-200 bg-slate-50 text-slate-700');
}

function buildOverviewDraftFromWorkOrder(wo: WorkOrder): OverviewDraft {
    return {
        title: wo.title ?? '',
        description: wo.description ?? '',
        workType: (wo.workType as WorkType | '') ?? '',
        projectOrProperty: wo.projectOrProperty ?? '',
        locationDetails: formatLocationDetails(wo.location),
        priority: (wo.priority as WorkOrderPriority | '') ?? '',
        requestedBy: wo.requestedBy ?? 'You',
        requestedAt: wo.requestedAt ?? new Date().toISOString(),

        vendorName: wo.vendor?.vendorName ?? '',
        assignedDate: wo.vendor?.assignedDate ?? '',
        assignedBy: wo.vendor?.assignedBy ?? 'You',
        estimatedCost: wo.vendor?.estimatedCost ?? '',
        estimatedDurationDays: wo.vendor?.estimatedDurationDays === null || wo.vendor?.estimatedDurationDays === undefined ? '' : String(wo.vendor.estimatedDurationDays),

        startDate: wo.scheduling?.startDate ?? '',
        endDate: wo.scheduling?.endDate ?? '',
        slaStatus: wo.scheduling?.slaStatus ?? 'On Track',

        status: wo.lifecycle?.status ?? 'Draft',
        actualCost: wo.finance?.actualCost ?? '',
        paymentStatus: (wo.finance?.paymentStatus ?? '') as PaymentStatus | '',
        invoiceReference: wo.finance?.invoiceReference ?? '',
    };
}

function parseDurationDays(raw: string): number | null {
    const t = raw.trim();
    if (!t) return null;
    const n = Number(t);
    if (!Number.isFinite(n)) return null;
    const v = Math.max(0, Math.floor(n));
    return v;
}

function hasAnyValue(d: OverviewDraft): boolean {
    return Object.values(d).some((v) => (typeof v === 'string' ? v.trim() : Boolean(v)));
}

export function WorkOrderRecordTabs({
    workOrder,
    listVersion,
    onBump,
    createMode = false,
}: {
    workOrder: WorkOrder;
    listVersion: number;
    onBump: () => void;
    createMode?: boolean;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isCreate = createMode;

    const [tab, setTabState] = useState<TabId>(() => normalizeWorkOrderDetailTab(searchParams.get('tab')));
    const setTab = useCallback(
        (next: TabId) => {
            if (isCreate && next !== 'overview') return;
            setTabState(next);
            const url = `/work-orders/view/${encodeURIComponent(isCreate ? 'new' : workOrder.slug)}?tab=${encodeURIComponent(next)}`;
            router.replace(url, { scroll: false });
        },
        [isCreate, router, workOrder.slug],
    );

    useEffect(() => {
        const fromUrl = normalizeWorkOrderDetailTab(searchParams.get('tab'));
        setTabState(isCreate ? 'overview' : fromUrl);
    }, [searchParams, isCreate]);

    useEffect(() => {
        if (!isCreate) return;
        if (tab === 'overview') return;
        setTabState('overview');
        router.replace(`/work-orders/view/new?tab=overview`, { scroll: false });
    }, [isCreate, tab, router]);

    const [isInlineEditing, setIsInlineEditing] = useState(isCreate ? true : false);
    const [draft, setDraft] = useState<OverviewDraft>(() => buildOverviewDraftFromWorkOrder(workOrder));
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

    const showStatusModal = useCallback(
        ({
            type,
            title,
            subtitle,
            afterClose,
        }: {
            type: 'success' | 'error';
            title: string;
            subtitle?: string;
            afterClose?: () => void;
        }) => {
            setStatusModal({ open: true, type, title, subtitle, afterClose });
        },
        [],
    );

    const projectOptions = useMemo(() => getWorkOrderProjectOptions(), []);
    const vendorOptions = useMemo(() => {
        const scoped = getWorkOrderVendorOptions(draft.projectOrProperty);
        const current = draft.vendorName?.trim();
        if (current && !scoped.includes(current)) return [current, ...scoped].sort((a, b) => a.localeCompare(b));
        return scoped;
    }, [draft.projectOrProperty, draft.vendorName]);

    const workOrderWorkflowSteps = useMemo(
        () => computeWorkOrderWorkflowSteps({ isCreate, workOrder }),
        [isCreate, workOrder, listVersion],
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

    const runValidation = useCallback(() => {
        const next: Partial<Record<keyof OverviewDraft, string>> = {};
        if (!draft.title.trim()) next.title = 'Title is required.';
        if (!draft.description.trim()) next.description = 'Description is required.';
        if (!draft.workType.trim()) next.workType = 'Work type is required.';
        if (!draft.projectOrProperty.trim()) next.projectOrProperty = 'Project / Property is required.';
        if (!draft.locationDetails.trim()) next.locationDetails = 'Location details are required.';
        if (!draft.priority.trim()) next.priority = 'Priority is required.';

        if (!draft.vendorName.trim()) next.vendorName = 'Vendor is required.';
        if (!draft.assignedDate.trim()) next.assignedDate = 'Assigned date is required.';

        if (!draft.startDate.trim()) next.startDate = 'Start date is required.';
        if (!draft.endDate.trim()) next.endDate = 'End date is required.';
        if (!isEndDateAfterStartDate(draft.startDate, draft.endDate)) next.endDate = 'End date must be greater than start date.';

        if (!draft.status.trim()) next.status = 'Status is required.';
        if (!draft.paymentStatus.trim()) next.paymentStatus = 'Payment status is required.';
        return next;
    }, [draft]);

    const onDraftChange = useCallback(<K extends keyof OverviewDraft>(key: K, value: OverviewDraft[K]) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }, []);

    useEffect(() => {
        if (!isInlineEditing) {
            setDraft(buildOverviewDraftFromWorkOrder(workOrder));
            setErrors({});
        }
    }, [isInlineEditing, workOrder, listVersion]);

    useEffect(() => {
        const e = searchParams.get('edit');
        if (e !== '1' && e !== 'true') return;
        setIsInlineEditing(true);
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete('edit');
        const qs = sp.toString();
        const base = `/work-orders/view/${encodeURIComponent(isCreate ? 'new' : workOrder.slug)}`;
        const next = qs ? `${base}?${qs}` : base;
        router.replace(next, { scroll: false });
    }, [searchParams, workOrder.slug, router, isCreate]);

    // Draft hydration (create mode) from `?draftId=...`
    useEffect(() => {
        if (!isCreate) return;
        const draftIdFromUrl = searchParams.get('draftId')?.trim() || '';
        if (!draftIdFromUrl) {
            setActiveDraftId(null);
            setDraftLastSavedAt(null);
            setDraftLoadedBanner(false);
            return;
        }
        const found = draftService.getDraftById<WorkOrderDraftData>(draftIdFromUrl);
        if (!found || found.module !== 'work_order') {
            setInlineToast({ msg: 'Draft not found. Starting a new work order.', err: true });
            showStatusModal({ type: 'error', title: 'Draft not found', subtitle: 'Starting a new work order.' });
            setActiveDraftId(null);
            setDraftLastSavedAt(null);
            setDraftLoadedBanner(false);
            return;
        }
        setDraft((prev) => {
            const data = (found.data ?? {}) as Partial<OverviewDraft> & {
                unitId?: string;
                flat?: string;
                block?: string;
                tower?: string;
                plot?: string;
                area?: string;
            };
            const locationDetails =
                data.locationDetails?.trim() ||
                [data.flat, data.block, data.tower, data.plot, data.area].filter((s) => s?.trim()).join(', ') ||
                '';
            return { ...prev, ...data, locationDetails };
        });
        setActiveDraftId(found.draftId);
        setDraftLastSavedAt(found.updatedAt);
        setDraftLoadedBanner(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (!hasAnyValue(draft)) return;

        if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
        autoSaveRef.current = setTimeout(() => {
            try {
                const saved = draftService.saveDraft<WorkOrderDraftData>('work_order', draft, activeDraftId ?? undefined);
                setActiveDraftId(saved.draftId);
                setDraftLastSavedAt(saved.updatedAt);
                if (!searchParams.get('draftId')) {
                    const sp = new URLSearchParams(searchParams.toString());
                    sp.set('draftId', saved.draftId);
                    if (!sp.get('tab')) sp.set('tab', 'overview');
                    router.replace(`${window.location.pathname}?${sp.toString()}`, { scroll: false });
                }
            } catch {
                // silent auto-save failure
            }
        }, 1400);
         
    }, [draft, isCreate, activeDraftId, router, searchParams, draftSaving, saving]);

    const saveDraftNow = useCallback(() => {
        if (!isCreate) return;
        setDraftSaving(true);
        try {
            const saved = draftService.saveDraft<WorkOrderDraftData>('work_order', draft, activeDraftId ?? undefined);
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
            showStatusModal({ type: 'error', title: 'Something went wrong. Please try again.', subtitle: 'We could not save your draft.' });
        } finally {
            setDraftSaving(false);
        }
    }, [activeDraftId, draft, isCreate, router, searchParams, showStatusModal]);

    const onCreateWorkOrder = useCallback(async () => {
        if (!isCreate) return;
        const nextErrors = runValidation();
        setErrors(nextErrors);
        const first = Object.keys(nextErrors)[0] as keyof OverviewDraft | undefined;
        if (first) {
            setInlineToast({ msg: 'Please fill required fields.', err: true });
            const el = document.getElementById(`wo-field-${String(first)}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setSaving(true);
        try {
            const created = addWorkOrderFromCoreFields({
                title: draft.title.trim(),
                description: draft.description.trim(),
                workType: draft.workType as WorkType,
                issueType: deriveIssueTypeFromWorkType(draft.workType),
                projectOrProperty: draft.projectOrProperty.trim(),
                location: locationDetailsToStore(draft.locationDetails),
                priority: draft.priority as WorkOrderPriority,
                requestedBy: draft.requestedBy.trim() || 'You',
                requestedAt: draft.requestedAt,
                vendor: {
                    vendorId: '',
                    vendorName: draft.vendorName.trim(),
                    assignedDate: draft.assignedDate.trim(),
                    assignedBy: draft.assignedBy.trim() || 'You',
                    estimatedCost: draft.estimatedCost.trim(),
                    estimatedDurationDays: parseDurationDays(draft.estimatedDurationDays),
                },
                scheduling: {
                    startDate: draft.startDate.trim(),
                    endDate: draft.endDate.trim(),
                    slaStatus: draft.slaStatus,
                },
                lifecycle: { status: draft.status },
                finance: {
                    actualCost: draft.actualCost.trim(),
                    paymentStatus: (draft.paymentStatus || 'Pending') as PaymentStatus,
                    invoiceReference: draft.invoiceReference.trim(),
                },
            });

            if (activeDraftId) {
                try {
                    draftService.deleteDraft(activeDraftId);
                } catch {
                    // ignore
                }
            }
            onBump();
            showStatusModal({
                type: 'success',
                title: 'Work Order Created Successfully',
                afterClose: () => router.replace(`/work-orders/view/${encodeURIComponent(created.slug)}?tab=overview`, { scroll: true }),
            });
        } catch {
            setInlineToast({ msg: 'Could not create work order. Please try again.', err: true });
            showStatusModal({ type: 'error', title: 'Something went wrong. Please try again.' });
        } finally {
            setSaving(false);
        }
    }, [activeDraftId, draft, isCreate, onBump, router, runValidation, showStatusModal]);

    const onSaveEdits = useCallback(async ({ exitAfter }: { exitAfter: boolean }) => {
        if (isCreate) return;
        const nextErrors = runValidation();
        setErrors(nextErrors);
        const first = Object.keys(nextErrors)[0] as keyof OverviewDraft | undefined;
        if (first) {
            setInlineToast({ msg: 'Please fix validation errors.', err: true });
            const el = document.getElementById(`wo-field-${String(first)}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setSaving(true);
        try {
            const original = buildOverviewDraftFromWorkOrder(workOrder);
            const changed: Partial<OverviewDraft> = {};
            (Object.keys(draft) as (keyof OverviewDraft)[]).forEach((k) => {
                if (draft[k] !== original[k]) (changed as any)[k] = draft[k];
            });
            if (Object.keys(changed).length === 0) {
                if (exitAfter) setIsInlineEditing(false);
                return;
            }

            const updated = await (async () => {
                // Local store updates are synchronous, but keep the async signature similar to Leads.
                const next = await Promise.resolve({
                    title: draft.title.trim(),
                    description: draft.description.trim(),
                    workType: draft.workType,
                    issueType: deriveIssueTypeFromWorkType(draft.workType),
                    projectOrProperty: draft.projectOrProperty.trim(),
                    location: locationDetailsToStore(draft.locationDetails),
                    priority: draft.priority,
                    requestedBy: draft.requestedBy.trim() || 'You',
                    requestedAt: draft.requestedAt,
                    vendor: {
                        vendorName: draft.vendorName.trim(),
                        assignedDate: draft.assignedDate.trim(),
                        assignedBy: draft.assignedBy.trim() || 'You',
                        estimatedCost: draft.estimatedCost.trim(),
                        estimatedDurationDays: parseDurationDays(draft.estimatedDurationDays),
                    },
                    scheduling: { startDate: draft.startDate.trim(), endDate: draft.endDate.trim(), slaStatus: draft.slaStatus },
                    lifecycle: { ...workOrder.lifecycle, status: draft.status, statusUpdatedBy: 'You', statusUpdatedAt: new Date().toISOString() },
                    finance: {
                        ...workOrder.finance,
                        actualCost: draft.actualCost.trim(),
                        paymentStatus: (draft.paymentStatus || 'Pending') as PaymentStatus,
                        invoiceReference: draft.invoiceReference.trim(),
                    },
                });
                return next;
            })();

            // Import lazily to avoid circular deps in some bundlers
            const mod = await import('@/lib/workOrderStore');
            const saved = mod.updateWorkOrder(
                workOrder.slug,
                updated as any,
                { actor: 'You', title: 'Work order updated', body: 'Inline edits saved', actionType: 'updated', severity: 'success' },
            );
            if (!saved) {
                setInlineToast({ msg: 'Could not save changes. Please try again.', err: true });
                showStatusModal({ type: 'error', title: 'Something went wrong. Please try again.' });
                return;
            }

            onBump();
            setDraft(buildOverviewDraftFromWorkOrder(saved));
            setInlineToast({ msg: 'Work order updated successfully.', err: false });
            showStatusModal({ type: 'success', title: 'Changes Saved Successfully' });
            if (exitAfter) setIsInlineEditing(false);
            setErrors({});
        } finally {
            setSaving(false);
        }
    }, [draft, isCreate, onBump, runValidation, showStatusModal, workOrder]);

    const onCancelEdits = useCallback(() => {
        setDraft(buildOverviewDraftFromWorkOrder(workOrder));
        setErrors({});
        setIsInlineEditing(false);
    }, [workOrder]);

    const delayDays = useMemo(() => computeDelayDays(draft.startDate, draft.endDate), [draft.startDate, draft.endDate]);
    const delayLabel = delayDays === null ? '—' : `${delayDays} day${delayDays === 1 ? '' : 's'}`;

    // Notifications tab state
    const [notifyVendor, setNotifyVendor] = useState(() => workOrder.notifications?.notifyVendor ?? true);
    const [completionUpdates, setCompletionUpdates] = useState(() => workOrder.notifications?.completionUpdates ?? true);

    useEffect(() => {
        setNotifyVendor(workOrder.notifications?.notifyVendor ?? true);
        setCompletionUpdates(workOrder.notifications?.completionUpdates ?? true);
    }, [workOrder.notifications?.notifyVendor, workOrder.notifications?.completionUpdates]);

    const saveCompletionVerification = useCallback(
        async (patch: { remarks: string; verifiedBy: string; verificationStatus: VerificationStatus | '' }) => {
            if (isCreate) return false;

            const nextCompletion = {
                ...workOrder.completion,
                remarks: patch.remarks,
                verifiedBy: patch.verifiedBy,
                verificationStatus: patch.verificationStatus,
            };

            const activity = {
                actor: patch.verifiedBy || 'Company Admin',
                title: 'Completion verification updated',
                body: `${patch.verificationStatus || 'Updated'} · ${workOrder.completion?.completionDate || 'No completion date'}`,
                actionType: 'completion_verified',
                severity:
                    patch.verificationStatus === 'Approved'
                        ? 'success'
                        : patch.verificationStatus === 'Rework Needed'
                          ? 'warning'
                          : patch.verificationStatus === 'Rejected'
                            ? 'critical'
                            : 'info',
            };

            const mod = await import('@/lib/workOrderStore');
            const saved = mod.updateWorkOrder(workOrder.slug, { completion: nextCompletion } as any, activity as any);
            if (!saved) {
                setInlineToast({ msg: 'Could not save completion updates. Please try again.', err: true });
                return false;
            }

            onBump();
            return true;
        },
        [isCreate, onBump, workOrder.completion, workOrder.slug],
    );

    const updateNotificationSettings = async (patch: Partial<WorkOrder['notifications']>, activityTitle: string) => {
        if (isCreate) return;
        const nextNotifications = { ...workOrder.notifications, ...patch };
        const mod = await import('@/lib/workOrderStore');
        const saved = mod.updateWorkOrder(
            workOrder.slug,
            { notifications: nextNotifications } as any,
            {
                actor: 'System',
                title: activityTitle,
                body: Object.entries(patch)
                    .map(([k, v]) => `${k}: ${v ? 'ON' : 'OFF'}`)
                    .join(' · '),
                actionType: 'notification_setting_updated',
                severity: 'info',
            } as any,
        );
        if (!saved) {
            setInlineToast({ msg: 'Could not update notification settings. Please try again.', err: true });
            return;
        }
        onBump();
        setInlineToast({ msg: 'Notification settings updated.', err: false });
    };

    const slaDelayDays = useMemo(() => {
        const end = workOrder.scheduling?.endDate ?? '';
        if (!end.trim()) return null;
        const todayYmd = new Date().toISOString().slice(0, 10);
        if (end >= todayYmd) return 0;
        const endD = new Date(`${end}T00:00:00.000Z`);
        const now = new Date();
        const ms = now.getTime() - endD.getTime();
        if (!Number.isFinite(ms)) return null;
        return Math.max(0, Math.floor(ms / 86400000));
    }, [workOrder.scheduling?.endDate]);

    const slaBreached = Boolean(slaDelayDays && slaDelayDays > 0);
    const slaAlertEnabled = workOrder.notifications?.slaBreachAlert ?? true;

    useEffect(() => {
        if (isCreate) return;
        if (!slaAlertEnabled || !slaBreached) return;
        const already = (workOrder.activityLog ?? []).some((e) => e.actionType === 'sla_breach_alert');
        if (already) return;
        void (async () => {
            const mod = await import('@/lib/workOrderStore');
            const saved = mod.updateWorkOrder(
                workOrder.slug,
                {},
                {
                    actor: 'System',
                    title: 'SLA breach alert',
                    body: `Due date delayed by ${slaDelayDays} day${slaDelayDays === 1 ? '' : 's'}.`,
                    actionType: 'sla_breach_alert',
                    severity: 'warning',
                } as any,
            );
            if (saved) {
                onBump();
                setInlineToast({ msg: 'SLA breach alert triggered.', err: true });
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slaAlertEnabled, slaBreached, slaDelayDays, isCreate, workOrder.slug]);

    const completionMarked = workOrder.lifecycle?.status === 'Completed' || workOrder.lifecycle?.status === 'Verified';
    useEffect(() => {
        if (isCreate) return;
        if (!completionUpdates || !completionMarked) return;
        const already = (workOrder.activityLog ?? []).some((e) => e.actionType === 'completion_update_notification');
        if (already) return;
        void (async () => {
            const mod = await import('@/lib/workOrderStore');
            const saved = mod.updateWorkOrder(
                workOrder.slug,
                {},
                {
                    actor: 'System',
                    title: 'Completion update',
                    body: `Vendor marked work as ${workOrder.lifecycle?.status}.`,
                    actionType: 'completion_update_notification',
                    severity: 'success',
                } as any,
            );
            if (saved) {
                onBump();
                setInlineToast({ msg: 'Completion update sent to Admin/Ops.', err: false });
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [completionUpdates, completionMarked, isCreate, workOrder.slug]);

    const createModeDisabledWrap = (children: React.ReactNode) => (
        <div>
            <div className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
                Create work order to enable this section
            </div>
            <div className="opacity-50 pointer-events-none">{children}</div>
        </div>
    );

    const historySupplemental = useMemo(
        () => workOrderActivitiesToHistoryLogEntries(workOrder.slug, workOrder.title || workOrder.workOrderId, workOrder.activityLog ?? []),
        [workOrder.slug, workOrder.title, workOrder.workOrderId, workOrder.activityLog],
    );

    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [archiveModalOpen, setArchiveModalOpen] = useState(false);

    const utilityBtn = CTA_UTILITY_BTN;

    const onClone = () => {
        if (isCreate) return;
        const copy = duplicateWorkOrder(workOrder.slug);
        if (copy) {
            try {
                window.localStorage.setItem('activeWorkOrderSlug', copy.slug);
            } catch {
                /* ignore */
            }
            router.push(`/work-orders/view/${encodeURIComponent(copy.slug)}?tab=overview`);
        }
    };

    const onShare = async () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        try {
            if (navigator.share) {
                await navigator.share({ title: `${draft.title || workOrder.workOrderId} · Work Order`, url });
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
            // keep modal open for manual copy
        }
    };

    const exportWorkOrderJson = (wo: WorkOrder) => {
        const safe = (wo.slug || wo.workOrderId || 'work-order')
            .toString()
            .trim()
            .replace(/[/\\?%*:|"<>]/g, '-')
            .replace(/\.+$/, '')
            .slice(0, 80) || 'work-order';
        downloadTextFile({
            filename: `${safe}.json`,
            content: JSON.stringify(wo, null, 2),
            mime: 'application/json;charset=utf-8',
        });
    };

    const confirmArchive = () => {
        setArchiveModalOpen(false);
        if (archiveWorkOrder(workOrder.slug)) {
            router.push('/work-orders');
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
            {inlineToast ? (
                <InlineToast message={inlineToast.msg} variant={inlineToast.err ? 'error' : 'success'} onDismiss={() => setInlineToast(null)} />
            ) : null}

            <WorkOrderMainTabBar
                active={tab}
                onChange={(next) => {
                    if (isCreate && next !== 'overview') {
                        setInlineToast({ msg: 'Create work order to access other sections.', err: true });
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

                {tab === 'overview' ? (
                    <>
                        {isCreate ? (
                            <div className="mt-3 rounded-lg border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] p-3 text-sm font-medium text-slate-900">
                                You are creating a new work order{' '}
                                <span className="ml-2 rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-white px-2 py-0.5 text-xs font-semibold text-slate-800">
                                    Draft
                                </span>
                            </div>
                        ) : null}

                        <div className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                {!isCreate ? (
                                    <div className="flex flex-wrap items-center gap-3" role="toolbar" aria-label="Work order actions">
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
                                                className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.25 py-1.5 text-sm font-medium text-slate-400 hover:bg-slate-50/50"
                                            >
                                                <LuPencil size={16} className="shrink-0" aria-hidden />
                                                <span className="whitespace-nowrap">Editing</span>
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={onClone}
                                            disabled={saving || isInlineEditing}
                                            className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.25 py-1.5 text-sm font-medium text-slate-800 transition-colors hover:bg-gray-100"
                                        >
                                            <LuCopy size={16} className="shrink-0" aria-hidden />
                                            <span className="whitespace-nowrap">Clone</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => void onShare()}
                                            disabled={saving || isInlineEditing}
                                            className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.25 py-1.5 text-sm font-medium text-slate-800 transition-colors hover:bg-gray-100"
                                        >
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

                                        <Link href="/work-orders/view/new">
                                            <span className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.25 py-1.5 text-sm font-medium text-slate-800 transition-colors hover:bg-gray-100">
                                                <LuPlus size={16} className="shrink-0" aria-hidden />
                                                <span className="whitespace-nowrap">New</span>
                                            </span>
                                        </Link>
                                    </div>
                                ) : (
                                    <span />
                                )}

                                {!isCreate ? (
                                    <WorkspaceUtilityToolbar
                                        help={WORK_ORDER_WORKSPACE_HELP}
                                        triggerLabel="Work order workspace help"
                                        emailHref={
                                            draft.vendorName?.trim()
                                                ? `mailto:?subject=${encodeURIComponent(`Work order: ${workOrder.workOrderId}`)}&body=${encodeURIComponent(`Work order: ${workOrder.workOrderId}\nTitle: ${workOrder.title}\n\nLink: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`
                                                : null
                                        }
                                        onExport={() => exportWorkOrderJson(workOrder)}
                                        saving={saving}
                                        isInlineEditing={isInlineEditing}
                                    />
                                ) : (
                                    <div className="flex flex-wrap items-center justify-start gap-3 sm:justify-end">
                                        <Link href="/work-orders" className="text-sm font-semibold text-[var(--cta-button-bg)] underline decoration-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] underline-offset-2 hover:text-slate-800">
                                            Back to Vendor Assignments
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
                                        <span className="font-medium text-gray-900">{formatAuditTimestamp(workOrder.createdAt)}</span>
                                    </span>
                                    <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                                    <span className="inline-flex items-center gap-2">
                                        <LuClock3 size={14} className="text-gray-500" aria-hidden />
                                        <span className="text-gray-600">Last updated</span>
                                        <span className="font-medium text-gray-900">{formatAuditTimestamp(workOrder.updatedAt)}</span>
                                    </span>
                                </div>
                            </div>
                        ) : null}

                        <RecordWorkflowStepper
                            className="mt-3"
                            steps={workOrderWorkflowSteps}
                            ariaLabel="Vendor assignment workflow"
                            onStepNavigate={onWorkflowStepNavigate}
                        />

                        <div className={cn('mt-3 flex min-w-0 flex-col gap-4 sm:gap-5', isInlineEditing && 'pb-28')}>
                            <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-5">
                                <div className="min-w-0 lg:col-span-2">
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
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vendor assignment</p>
                                                <h2 className="mt-1 truncate text-xl font-semibold text-slate-900">
                                                    {draft.title?.trim() ? draft.title : isCreate ? 'New vendor assignment' : workOrder.title}
                                                </h2>
                                            </div>
                                            <span className={statusChip(draft.status)}>{draft.status}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 min-w-0">
                                        <WorkOrderInlineOverviewEditor
                                            workOrder={workOrder}
                                            isEditing={isInlineEditing}
                                            draft={draft as any}
                                            errors={errors as any}
                                            onDraftChange={(k, v) => onDraftChange(k as any, v)}
                                            workTypeOptions={WORK_TYPE_OPTIONS}
                                            projectOptions={projectOptions}
                                            vendorOptions={vendorOptions}
                                            priorityOptions={PRIORITY_OPTIONS}
                                            slaOptions={SLA_OPTIONS}
                                            statusOptions={STATUS_OPTIONS}
                                            paymentStatusOptions={PAYMENT_STATUS_OVERVIEW_OPTIONS}
                                        />
                                    </div>
                                </div>
                                    </div>
                                </div>

                                <div className="min-w-0 space-y-4 lg:col-span-1 lg:sticky lg:top-44 lg:self-start">
                                <WorkOrderAIPanel
                                    workOrder={workOrder}
                                    draft={{
                                        title: draft.title,
                                        vendorName: draft.vendorName,
                                        projectOrProperty: draft.projectOrProperty,
                                        slaStatus: draft.slaStatus,
                                        status: draft.status,
                                        priority: draft.priority,
                                        endDate: draft.endDate,
                                    }}
                                    disabled={isCreate || isInlineEditing}
                                />
                                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assignment snapshot</p>
                                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                                        <p>
                                            <span className="font-semibold">Vendor</span>: {draft.vendorName?.trim() || EMPTY_FIELD}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Project</span>: {draft.projectOrProperty?.trim() || EMPTY_FIELD}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Location</span>: {draft.locationDetails?.trim() || EMPTY_FIELD}
                                        </p>
                                        <p>
                                            <span className="font-semibold">SLA</span>: {draft.slaStatus}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Status</span>: {draft.status}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Due</span>: {draft.endDate?.trim() || EMPTY_FIELD}
                                        </p>
                                    </div>
                                </div>
                                </div>
                            </div>

                            <WorkOrderOverviewLifecycle
                                workOrder={workOrder}
                                isCreate={isCreate}
                                isEditing={isInlineEditing}
                                paymentDraft={{
                                    actualCost: draft.actualCost,
                                    paymentStatus: draft.paymentStatus,
                                    invoiceReference: draft.invoiceReference,
                                }}
                                paymentError={errors.paymentStatus}
                                onPaymentDraftChange={(key, value) => onDraftChange(key as keyof OverviewDraft, value)}
                                paymentStatusOptions={PAYMENT_STATUS_OVERVIEW_OPTIONS}
                                onBump={onBump}
                                onToast={(msg, err) => setInlineToast({ msg, err })}
                                onExportRecord={() => exportWorkOrderJson(workOrder)}
                                onSaveCompletion={saveCompletionVerification}
                            />

                            {isInlineEditing ? (
                                <div className="sticky bottom-0 z-40 mt-2 pb-1 pt-2">
                                    <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.12)] backdrop-blur supports-backdrop-filter:bg-white/90 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                                        <div className="flex items-center gap-3">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {isCreate ? 'Create vendor assignment to enable lifecycle sections' : 'You have unsaved changes'}
                                            </p>
                                        </div>
                                        <div className="mt-3 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:items-center sm:justify-end">
                                            {isCreate ? (
                                                <>
                                                    <Button type="button" variant="companyOutline" size="cta" onClick={() => router.push('/work-orders')} disabled={saving}>
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="companyOutline"
                                                        size="cta"
                                                        onClick={saveDraftNow}
                                                        isLoading={draftSaving}
                                                        disabled={saving || draftSaving}
                                                    >
                                                        {draftSaving ? 'Saving...' : 'Save Draft'}
                                                    </Button>
                                                    <Button type="button" variant="company" size="cta" onClick={() => void onCreateWorkOrder()} isLoading={saving}>
                                                        {saving ? 'Creating...' : 'Create Vendor Assignment'}
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
                    </>
                ) : null}

                {tab !== 'overview' ? (
                    <div className="mt-4">
                        {tab === 'notifications' ? (
                            isCreate ? (
                                createModeDisabledWrap(
                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <p className="text-sm text-slate-600">Notifications &amp; alerts will be enabled after creation.</p>
                                    </div>,
                                )
                            ) : (
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900">Notification settings</h3>
                                            <p className="mt-1 text-xs font-medium text-slate-500">Configure vendor and ops notifications for this work order.</p>
                                        </div>

                                        <div className="mt-4 space-y-4">
                                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 transition hover:bg-slate-50/40">
                                                <ToggleSwitch
                                                    checked={notifyVendor}
                                                    onCheckedChange={(next) => {
                                                        setNotifyVendor(next);
                                                        void updateNotificationSettings(
                                                            { notifyVendor: next, assignmentNotifications: next },
                                                            'Vendor assignment notifications updated',
                                                        );
                                                    }}
                                                    label="Notify Vendor"
                                                    description="Send assignment notification to vendor when this work order is assigned."
                                                />
                                            </div>

                                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 transition hover:bg-slate-50/40">
                                                <ToggleSwitch
                                                    checked={completionUpdates}
                                                    onCheckedChange={(next) => {
                                                        setCompletionUpdates(next);
                                                        void updateNotificationSettings(
                                                            { completionUpdates: next },
                                                            'Completion update notifications updated',
                                                        );
                                                    }}
                                                    label="Completion Update"
                                                    description="Notify Admin/Ops when vendor marks work as completed."
                                                />
                                            </div>

                                            <div className="rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900">SLA Breach Alert</p>
                                                        <p className="mt-1 text-sm text-slate-600">
                                                            System-generated alert when SLA/due date is delayed. Display-only.
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
                                                            slaBreached
                                                                ? 'border-amber-200 bg-amber-50 text-amber-900'
                                                                : 'border-emerald-200 bg-emerald-50 text-emerald-800',
                                                        )}
                                                    >
                                                        {slaBreached ? 'Delayed' : 'On track'}
                                                    </span>
                                                </div>
                                                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Due date</p>
                                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                                            {workOrder.scheduling?.endDate?.trim() ? workOrder.scheduling.endDate : EMPTY_FIELD}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Delay</p>
                                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                                            {slaDelayDays === null ? EMPTY_FIELD : `${slaDelayDays} day${slaDelayDays === 1 ? '' : 's'}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                {!slaAlertEnabled ? (
                                                    <p className="mt-2 text-xs font-medium text-slate-500">SLA breach alerts are turned off for this work order.</p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                                        <h3 className="text-sm font-semibold text-slate-900">Notification status</h3>
                                        <p className="mt-1 text-xs font-medium text-slate-500">System events are logged to History automatically.</p>

                                        <div className="mt-4 space-y-3">
                                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-sm font-semibold text-slate-900">Vendor notify</p>
                                                    <span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', notifyVendor ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700')}>
                                                        {notifyVendor ? 'ON' : 'OFF'}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm text-slate-600">Used for assignment notifications.</p>
                                            </div>

                                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-sm font-semibold text-slate-900">Completion updates</p>
                                                    <span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', completionUpdates ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700')}>
                                                        {completionUpdates ? 'ON' : 'OFF'}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm text-slate-600">Admin/Ops gets notified when work is marked completed.</p>
                                            </div>

                                            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-sm font-semibold text-slate-900">SLA alert</p>
                                                    <span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', slaBreached ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-800')}>
                                                        {slaBreached ? 'Triggered' : 'Healthy'}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm text-slate-600">System-generated when due date slips.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        ) : null}

                        {tab === 'activity' ? (
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                                <RecordHistoryLogPanel module="work_orders" recordId={workOrder.slug} recordTitle={workOrder.title || workOrder.workOrderId} supplementalEntries={historySupplemental} />
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>

            <Modal
                isOpen={archiveModalOpen}
                onClose={() => setArchiveModalOpen(false)}
                title="Archive work order"
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
                    Archive <span className="font-semibold text-slate-900">{workOrder.title || workOrder.workOrderId}</span>? This removes it from your active Work Orders list.
                </p>
            </Modal>

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
                <p className="mb-2 text-sm text-slate-600">Copy this URL to share this work order record.</p>
                <input
                    readOnly
                    value={shareUrl}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800"
                    onFocus={(e) => e.target.select()}
                />
            </Modal>
        </div>
    );
}

