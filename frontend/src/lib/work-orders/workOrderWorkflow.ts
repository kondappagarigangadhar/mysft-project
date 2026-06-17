import type { PaymentStatus, VerificationStatus, WorkOrder, WorkOrderStatus } from '@/lib/workOrderStore';
import { attachWorkflowStepNav, buildWorkflowSteps, type WorkflowStep, type WorkflowStepNav } from '@/lib/workflow/workflowStepTypes';

export const WORK_ORDER_WORKFLOW_NAV: Record<string, WorkflowStepNav> = {
    create: { tab: 'overview', sectionId: 'wf-wo-creation' },
    assign: { tab: 'overview', sectionId: 'wf-wo-vendor', requiresSaved: true },
    schedule: { tab: 'overview', sectionId: 'wf-wo-scheduling', requiresSaved: true },
    progress: { tab: 'overview', sectionId: 'wf-wo-progress', requiresSaved: true },
    complete: { tab: 'overview', sectionId: 'wf-wo-completion', requiresSaved: true },
    verify: { tab: 'overview', sectionId: 'wf-wo-completion', requiresSaved: true },
    payment: { tab: 'overview', sectionId: 'wf-wo-payment', requiresSaved: true },
};

const IN_PROGRESS_STATUSES: WorkOrderStatus[] = ['In Progress', 'On Hold', 'Completed', 'Verified'];
const COMPLETE_STATUSES: WorkOrderStatus[] = ['Completed', 'Verified'];

function statusOf(workOrder: WorkOrder): WorkOrderStatus {
    return workOrder.lifecycle?.status ?? 'Draft';
}

function isVendorAssigned(workOrder: WorkOrder): boolean {
    return Boolean(workOrder.vendor?.vendorName?.trim());
}

function isScheduled(workOrder: WorkOrder): boolean {
    return Boolean(workOrder.scheduling?.startDate?.trim() && workOrder.scheduling?.endDate?.trim());
}

function hasProgress(workOrder: WorkOrder): boolean {
    if ((workOrder.progressUpdates?.length ?? 0) > 0) return true;
    return IN_PROGRESS_STATUSES.includes(statusOf(workOrder));
}

function isWorkComplete(workOrder: WorkOrder): boolean {
    if (COMPLETE_STATUSES.includes(statusOf(workOrder))) return true;
    return Boolean(workOrder.completion?.completionDate?.trim());
}

function isVerified(workOrder: WorkOrder): boolean {
    if (statusOf(workOrder) === 'Verified') return true;
    return workOrder.completion?.verificationStatus === 'Approved';
}

function isPaid(workOrder: WorkOrder): boolean {
    return workOrder.finance?.paymentStatus === 'Paid';
}

function statusLabel(status: WorkOrderStatus, fallback: string): string {
    if (status === 'In Progress') return 'In progress';
    if (status === 'On Hold') return 'On hold';
    if (status === 'Verified') return 'Verified';
    if (status === 'Completed') return 'Completed';
    return fallback;
}

function paymentLabel(status: PaymentStatus | undefined): string {
    if (status === 'Paid') return 'Paid';
    if (status === 'Partial') return 'Partial pay';
    return 'Payment';
}

function verificationLabel(status: VerificationStatus | '' | undefined): string {
    if (status === 'Approved') return 'Verified';
    if (status === 'Rework Needed') return 'Rework';
    if (status === 'Rejected') return 'Rejected';
    return 'Verify';
}

export function computeWorkOrderWorkflowSteps(input: { isCreate: boolean; workOrder: WorkOrder }): WorkflowStep[] {
    const { isCreate, workOrder } = input;
    const status = statusOf(workOrder);
    const progressCount = workOrder.progressUpdates?.length ?? 0;

    const done = [
        !isCreate,
        !isCreate && isVendorAssigned(workOrder),
        !isCreate && isVendorAssigned(workOrder) && isScheduled(workOrder),
        !isCreate && isVendorAssigned(workOrder) && isScheduled(workOrder) && hasProgress(workOrder),
        !isCreate && isWorkComplete(workOrder),
        !isCreate && isVerified(workOrder),
        !isCreate && isPaid(workOrder),
    ];

    const labels = [
        'Create',
        isVendorAssigned(workOrder) ? 'Assigned' : 'Assign',
        isScheduled(workOrder) ? 'Scheduled' : 'Schedule',
        hasProgress(workOrder)
            ? progressCount > 0
                ? `Progress (${progressCount})`
                : statusLabel(status, 'Progress')
            : 'Progress',
        isWorkComplete(workOrder) ? statusLabel(status, 'Complete') : 'Complete',
        verificationLabel(workOrder.completion?.verificationStatus),
        paymentLabel(workOrder.finance?.paymentStatus),
    ];

    return attachWorkflowStepNav(
        buildWorkflowSteps(
            ['create', 'assign', 'schedule', 'progress', 'complete', 'verify', 'payment'].map((id, i) => ({
                id,
                label: labels[i]!,
            })),
            done,
        ),
        WORK_ORDER_WORKFLOW_NAV,
    );
}
