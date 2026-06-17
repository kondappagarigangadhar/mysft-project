import type { VendorRecord } from '@/lib/vendors/vendorStore';
import type { IssueType, SlaStatus, WorkOrderPriority, WorkOrderStatus, WorkType } from '@/lib/workOrderStore';

/** Matches work-order create draft shape (`WorkOrderRecordTabs` / `draftService`). */
export type VendorWorkOrderCreateDraft = {
    title: string;
    description: string;
    workType: WorkType | '';
    issueType: IssueType | '';
    projectOrProperty: string;
    locationDetails: string;
    priority: WorkOrderPriority | '';
    requestedBy: string;
    requestedAt: string;
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
    paymentStatus: 'Pending' | 'Partial' | 'Paid' | '';
    invoiceReference: string;
};

function categoryToWorkType(category: string): WorkType | '' {
    const map: Record<string, WorkType> = {
        Electrical: 'Electrical',
        Plumbing: 'Plumbing',
        Civil: 'Civil',
        Interior: 'Interior',
        HVAC: 'HVAC',
        Security: 'Other',
    };
    return map[category] ?? 'Other';
}

function workTypeToIssueType(workType: WorkType | ''): IssueType | '' {
    if (workType === 'Plumbing') return 'Plumbing Work';
    if (workType === 'Electrical') return 'Electrical Work';
    return 'Other';
}

export function buildVendorPrefilledWorkOrderDraft(vendor: Pick<VendorRecord, 'name' | 'primaryProject' | 'categories'>): VendorWorkOrderCreateDraft {
    const now = new Date().toISOString();
    const ymd = now.slice(0, 10);
    const workType = categoryToWorkType(vendor.categories[0] ?? '');
    return {
        title: '',
        description: '',
        workType,
        issueType: workTypeToIssueType(workType),
        projectOrProperty: vendor.primaryProject?.trim() ?? '',
        locationDetails: '',
        priority: 'Medium',
        requestedBy: 'Company Admin',
        requestedAt: now,
        vendorName: vendor.name.trim(),
        assignedDate: ymd,
        assignedBy: 'Company Admin',
        estimatedCost: '',
        estimatedDurationDays: '',
        startDate: ymd,
        endDate: ymd,
        slaStatus: 'On Track',
        status: 'Draft',
        actualCost: '',
        paymentStatus: 'Pending',
        invoiceReference: '',
    };
}
