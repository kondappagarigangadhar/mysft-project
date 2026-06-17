'use client';

import React from 'react';
import { EditableDate, EditableField, EditableSelect, EditableTextarea } from '@/components/leads/detail/InlineEditableSection';
import { FieldRow, InlineCollapsibleSection } from '@/components/work-orders/detail/WorkOrderOverviewSectionKit';
import { cn } from '@/lib/utils';
import { computeDelayDays, getNextWorkOrderCode, type PaymentStatus, type SlaStatus, type WorkOrder, type WorkOrderPriority, type WorkOrderStatus, type WorkType } from '@/lib/workOrderStore';
import { LuClipboardList, LuClock3, LuHardHat, LuUser } from 'react-icons/lu';

const EMPTY = '—';

type InlineErrorKey =
    | 'title'
    | 'description'
    | 'workType'
    | 'projectOrProperty'
    | 'locationDetails'
    | 'priority'
    | 'vendorName'
    | 'assignedDate'
    | 'startDate'
    | 'endDate'
    | 'status'
    | 'paymentStatus';

export const WORK_ORDER_INLINE_FIELD_IDS: Record<InlineErrorKey, string> = {
    title: 'wo-inline-title',
    description: 'wo-inline-description',
    workType: 'wo-inline-work-type',
    projectOrProperty: 'wo-inline-project',
    locationDetails: 'wo-inline-location-details',
    priority: 'wo-inline-priority',
    vendorName: 'wo-inline-vendor',
    assignedDate: 'wo-inline-assigned-date',
    startDate: 'wo-inline-start-date',
    endDate: 'wo-inline-end-date',
    status: 'wo-inline-status',
    paymentStatus: 'wo-inline-payment-status',
};

type Draft = {
    title: string;
    description: string;
    workType: WorkType | '';
    projectOrProperty: string;
    locationDetails: string;
    priority: WorkOrderPriority | '';
    vendorName: string;
    assignedDate: string;
    assignedBy: string;
    estimatedCost: string;
    estimatedDurationDays: string;

    startDate: string;
    endDate: string;
    slaStatus: SlaStatus;

    status: WorkOrderStatus;
    requestedBy: string;
    requestedAt: string;

    actualCost: string;
    paymentStatus: PaymentStatus | '';
    invoiceReference: string;
};

export function WorkOrderInlineOverviewEditor({
    workOrder,
    isEditing,
    draft,
    errors,
    onDraftChange,
    workTypeOptions,
    projectOptions,
    vendorOptions,
    priorityOptions,
    slaOptions,
    statusOptions,
}: {
    workOrder: WorkOrder;
    isEditing: boolean;
    draft: Draft;
    errors: Partial<Record<InlineErrorKey, string>>;
    onDraftChange: (key: keyof Draft, value: string) => void;
    workTypeOptions: WorkType[];
    projectOptions: string[];
    vendorOptions: string[];
    priorityOptions: WorkOrderPriority[];
    slaOptions: SlaStatus[];
    statusOptions: WorkOrderStatus[];
    paymentStatusOptions: PaymentStatus[];
}) {
    const fieldGrid = 'grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2';
    const [open, setOpen] = React.useState({
        creation: true,
        assignment: true,
        sla: true,
    });
    const [attentionFieldId, setAttentionFieldId] = React.useState<string | null>(null);

    const creationReq = ['title', 'description', 'workType', 'projectOrProperty', 'locationDetails', 'priority'].filter((k) =>
        Boolean(errors[k as InlineErrorKey]),
    ).length;
    const assignmentReq = ['vendorName', 'assignedDate'].filter((k) => Boolean(errors[k as InlineErrorKey])).length;
    const slaReq = ['startDate', 'endDate', 'status'].filter((k) => Boolean(errors[k as InlineErrorKey])).length;

    const delayDays = computeDelayDays(draft.startDate, draft.endDate);
    const delayLabel = delayDays === null ? EMPTY : `${delayDays} day${delayDays === 1 ? '' : 's'}`;

    const woCode = workOrder.id > 0 ? workOrder.workOrderId : getNextWorkOrderCode();

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
            'title',
            'description',
            'workType',
            'projectOrProperty',
            'locationDetails',
            'priority',
            'vendorName',
            'assignedDate',
            'startDate',
            'endDate',
            'status',
            'paymentStatus',
        ];
        const first = ORDER.find((k) => Boolean(errors[k])) ?? keys[0];
        if (!first) return;

        const section: keyof typeof open =
            first === 'vendorName' || first === 'assignedDate'
                ? 'assignment'
                : first === 'startDate' || first === 'endDate' || first === 'status'
                  ? 'sla'
                  : first === 'paymentStatus'
                    ? 'sla'
                    : 'creation';

        setOpen((s) => ({ ...s, [section]: true }));
        if (first === 'paymentStatus') {
            document.getElementById('wo-section-payment')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }
        const fieldId = WORK_ORDER_INLINE_FIELD_IDS[first];
        if (fieldId) scrollFocusAttention(fieldId);
    }, [errors, isEditing, scrollFocusAttention]);

    return (
        <div className={cn('flex min-h-0 flex-1 flex-col', isEditing && 'border-none shadow-none')}>
            <div className="min-h-0 flex-1">
                <div className="space-y-4">
                    <InlineCollapsibleSection
                        title="WORK ORDER CREATION"
                        icon={LuClipboardList}
                        tone="blue"
                        sectionId="wf-wo-creation"
                        open={open.creation}
                        onOpenChange={(o) => setOpen((s) => ({ ...s, creation: o }))}
                        headerRight={
                            isEditing && creationReq > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {creationReq} field{creationReq === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className={fieldGrid}>
                            <FieldRow label="Work Order ID">
                                <span className="font-mono text-sm tracking-tight text-gray-900">{woCode || EMPTY}</span>
                            </FieldRow>
                            <FieldRow label="Title" required>
                                <EditableField
                                    id={WORK_ORDER_INLINE_FIELD_IDS.title}
                                    isEditing={isEditing}
                                    error={errors.title}
                                    className={cn(attentionFieldId === WORK_ORDER_INLINE_FIELD_IDS.title && 'rounded-md ring-2 ring-rose-500/25 animate-pulse')}
                                    value={draft.title}
                                    onChange={(v) => onDraftChange('title', v)}
                                    readValue={workOrder.title?.trim() ? <span className="text-base font-semibold text-gray-900">{workOrder.title}</span> : EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Description" required className="xl:col-span-2 xl:items-start">
                                <EditableTextarea
                                    id={WORK_ORDER_INLINE_FIELD_IDS.description}
                                    isEditing={isEditing}
                                    error={errors.description}
                                    className={cn(attentionFieldId === WORK_ORDER_INLINE_FIELD_IDS.description && 'rounded-md ring-2 ring-rose-500/25 animate-pulse')}
                                    value={draft.description}
                                    onChange={(v) => onDraftChange('description', v)}
                                    rows={4}
                                    placeholder="Describe the scope, access instructions, and constraints."
                                    readValue={
                                        workOrder.description?.trim() ? (
                                            <span className="block whitespace-pre-wrap font-medium leading-relaxed text-gray-800">{workOrder.description.trim()}</span>
                                        ) : (
                                            EMPTY
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Work Type" required>
                                <EditableSelect
                                    id={WORK_ORDER_INLINE_FIELD_IDS.workType}
                                    isEditing={isEditing}
                                    error={errors.workType}
                                    className={cn(attentionFieldId === WORK_ORDER_INLINE_FIELD_IDS.workType && 'rounded-md ring-2 ring-rose-500/25 animate-pulse')}
                                    value={draft.workType}
                                    onChange={(v) => onDraftChange('workType', v)}
                                    placeholder="Select work type"
                                    options={workTypeOptions}
                                    readValue={workOrder.workType || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Project / Property" required>
                                <EditableSelect
                                    id={WORK_ORDER_INLINE_FIELD_IDS.projectOrProperty}
                                    isEditing={isEditing}
                                    error={errors.projectOrProperty}
                                    className={cn(attentionFieldId === WORK_ORDER_INLINE_FIELD_IDS.projectOrProperty && 'rounded-md ring-2 ring-rose-500/25 animate-pulse')}
                                    value={draft.projectOrProperty}
                                    onChange={(v) => onDraftChange('projectOrProperty', v)}
                                    placeholder="Select project/property"
                                    options={projectOptions}
                                    readValue={workOrder.projectOrProperty?.trim() ? <span className="font-semibold text-gray-900">{workOrder.projectOrProperty}</span> : EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Location Details" required className="xl:col-span-2 xl:items-start">
                                <EditableTextarea
                                    id={WORK_ORDER_INLINE_FIELD_IDS.locationDetails}
                                    isEditing={isEditing}
                                    error={errors.locationDetails}
                                    className={cn(attentionFieldId === WORK_ORDER_INLINE_FIELD_IDS.locationDetails && 'rounded-md ring-2 ring-rose-500/25 animate-pulse')}
                                    value={draft.locationDetails}
                                    onChange={(v) => onDraftChange('locationDetails', v)}
                                    rows={2}
                                    placeholder="e.g. Tower A, Block 2, Flat 1204"
                                    readValue={
                                        draft.locationDetails?.trim() ? (
                                            <span className="block whitespace-pre-wrap font-medium text-gray-800">{draft.locationDetails.trim()}</span>
                                        ) : (
                                            EMPTY
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Priority" required>
                                <EditableSelect
                                    id={WORK_ORDER_INLINE_FIELD_IDS.priority}
                                    isEditing={isEditing}
                                    error={errors.priority}
                                    className={cn(attentionFieldId === WORK_ORDER_INLINE_FIELD_IDS.priority && 'rounded-md ring-2 ring-rose-500/25 animate-pulse')}
                                    value={draft.priority}
                                    onChange={(v) => onDraftChange('priority', v)}
                                    placeholder="Select priority"
                                    options={priorityOptions}
                                    readValue={workOrder.priority || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Requested By">
                                <EditableField
                                    isEditing={isEditing}
                                    value={draft.requestedBy}
                                    onChange={(v) => onDraftChange('requestedBy', v)}
                                    readValue={workOrder.requestedBy?.trim() ? workOrder.requestedBy : 'You'}
                                />
                            </FieldRow>
                            <FieldRow label="Requested Date">
                                <span className="text-sm font-medium text-gray-800">{draft.requestedAt ? new Date(draft.requestedAt).toLocaleString() : EMPTY}</span>
                            </FieldRow>
                        </div>
                    </InlineCollapsibleSection>

                    <InlineCollapsibleSection
                        title="VENDOR ASSIGNMENT"
                        icon={LuUser}
                        tone="amber"
                        sectionId="wf-wo-vendor"
                        open={open.assignment}
                        onOpenChange={(o) => setOpen((s) => ({ ...s, assignment: o }))}
                        headerRight={
                            isEditing && assignmentReq > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {assignmentReq} field{assignmentReq === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className={fieldGrid}>
                            <FieldRow label="Vendor" required>
                                <EditableSelect
                                    id={WORK_ORDER_INLINE_FIELD_IDS.vendorName}
                                    isEditing={isEditing}
                                    error={errors.vendorName}
                                    className={cn(attentionFieldId === WORK_ORDER_INLINE_FIELD_IDS.vendorName && 'rounded-md ring-2 ring-rose-500/25 animate-pulse')}
                                    value={draft.vendorName}
                                    onChange={(v) => onDraftChange('vendorName', v)}
                                    placeholder="Select vendor"
                                    options={vendorOptions}
                                    readValue={workOrder.vendor?.vendorName?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Assigned Date" required>
                                <EditableDate
                                    id={WORK_ORDER_INLINE_FIELD_IDS.assignedDate}
                                    isEditing={isEditing}
                                    error={errors.assignedDate}
                                    className={cn(attentionFieldId === WORK_ORDER_INLINE_FIELD_IDS.assignedDate && 'rounded-md ring-2 ring-rose-500/25 animate-pulse')}
                                    value={draft.assignedDate}
                                    onChange={(v) => onDraftChange('assignedDate', v)}
                                    readValue={workOrder.vendor?.assignedDate?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Assigned By">
                                <EditableField isEditing={isEditing} value={draft.assignedBy} onChange={(v) => onDraftChange('assignedBy', v)} readValue={workOrder.vendor?.assignedBy?.trim() || 'You'} />
                            </FieldRow>
                            <FieldRow label="Estimated Cost">
                                <EditableField isEditing={isEditing} value={draft.estimatedCost} onChange={(v) => onDraftChange('estimatedCost', v)} readValue={workOrder.vendor?.estimatedCost?.trim() || EMPTY} />
                            </FieldRow>
                            <FieldRow label="Estimated Duration (days)">
                                <EditableField
                                    isEditing={isEditing}
                                    value={draft.estimatedDurationDays}
                                    onChange={(v) => onDraftChange('estimatedDurationDays', v)}
                                    readValue={workOrder.vendor?.estimatedDurationDays !== null && workOrder.vendor?.estimatedDurationDays !== undefined ? String(workOrder.vendor.estimatedDurationDays) : EMPTY}
                                />
                            </FieldRow>
                        </div>
                    </InlineCollapsibleSection>

                    <InlineCollapsibleSection
                        title="SCHEDULING & SLA"
                        icon={LuHardHat}
                        tone="slate"
                        sectionId="wf-wo-scheduling"
                        open={open.sla}
                        onOpenChange={(o) => setOpen((s) => ({ ...s, sla: o }))}
                        headerRight={
                            isEditing && slaReq > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {slaReq} field{slaReq === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className={fieldGrid}>
                            <FieldRow label="Start Date" required>
                                <EditableDate
                                    id={WORK_ORDER_INLINE_FIELD_IDS.startDate}
                                    isEditing={isEditing}
                                    error={errors.startDate}
                                    className={cn(attentionFieldId === WORK_ORDER_INLINE_FIELD_IDS.startDate && 'rounded-md ring-2 ring-rose-500/25 animate-pulse')}
                                    value={draft.startDate}
                                    onChange={(v) => onDraftChange('startDate', v)}
                                    readValue={workOrder.scheduling?.startDate?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="End Date" required>
                                <EditableDate
                                    id={WORK_ORDER_INLINE_FIELD_IDS.endDate}
                                    isEditing={isEditing}
                                    error={errors.endDate}
                                    className={cn(attentionFieldId === WORK_ORDER_INLINE_FIELD_IDS.endDate && 'rounded-md ring-2 ring-rose-500/25 animate-pulse')}
                                    value={draft.endDate}
                                    onChange={(v) => onDraftChange('endDate', v)}
                                    readValue={workOrder.scheduling?.endDate?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="SLA Status">
                                <EditableSelect isEditing={isEditing} value={draft.slaStatus} onChange={(v) => onDraftChange('slaStatus', v)} options={slaOptions} readValue={workOrder.scheduling?.slaStatus || 'On Track'} />
                            </FieldRow>
                            <FieldRow label="Delay Days (computed)">
                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
                                    <LuClock3 size={16} className="text-gray-400" aria-hidden />
                                    {delayLabel}
                                </span>
                            </FieldRow>
                            <FieldRow label="Work Order Status" required>
                                <EditableSelect
                                    id={WORK_ORDER_INLINE_FIELD_IDS.status}
                                    isEditing={isEditing}
                                    error={errors.status}
                                    className={cn(attentionFieldId === WORK_ORDER_INLINE_FIELD_IDS.status && 'rounded-md ring-2 ring-rose-500/25 animate-pulse')}
                                    value={draft.status}
                                    onChange={(v) => onDraftChange('status', v)}
                                    options={statusOptions}
                                    placeholder="Select status"
                                    readValue={workOrder.lifecycle?.status || 'Draft'}
                                />
                            </FieldRow>
                            <FieldRow label="Status Updated By">
                                <span className="text-sm font-medium text-gray-800">{workOrder.lifecycle?.statusUpdatedBy?.trim() || EMPTY}</span>
                            </FieldRow>
                            <FieldRow label="Status Updated Date">
                                <span className="text-sm font-medium text-gray-800">
                                    {workOrder.lifecycle?.statusUpdatedAt ? new Date(workOrder.lifecycle.statusUpdatedAt).toLocaleString() : EMPTY}
                                </span>
                            </FieldRow>
                        </div>
                    </InlineCollapsibleSection>
                </div>
            </div>
        </div>
    );
}
