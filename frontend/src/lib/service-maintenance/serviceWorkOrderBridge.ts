import type { IssueCategory, PriorityLevel, ServiceMaintenanceTicket } from '@/lib/serviceMaintenanceStore';
import { parseServiceLocationContext } from '@/lib/service-maintenance/serviceLocationContext';
import {
    addWorkOrderFromCoreFields,
    type IssueType,
    type WorkOrder,
    type WorkOrderPriority,
    type WorkType,
} from '@/lib/workOrderStore';

function mapIssueCategoryToWorkType(category: IssueCategory): WorkType {
    if (category === 'Plumbing') return 'Plumbing';
    if (category === 'Electrical') return 'Electrical';
    if (category === 'HVAC') return 'HVAC';
    if (category === 'Civil') return 'Civil';
    return 'Other';
}

function mapIssueCategoryToIssueType(category: IssueCategory): IssueType {
    if (category === 'Plumbing') return 'Plumbing Work';
    if (category === 'Electrical') return 'Electrical Work';
    return 'Other';
}

function mapPriority(priority: PriorityLevel): WorkOrderPriority {
    return priority;
}

export function createWorkOrderFromServiceRequest(input: {
    ticket: ServiceMaintenanceTicket;
    vendorId: string;
    vendorName: string;
    assignedBy?: string;
    estimatedCost?: number;
}): WorkOrder {
    const { ticket, vendorId, vendorName } = input;
    const { project, unitLabel } = parseServiceLocationContext(ticket.locationUnit);
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const end = new Date();
    end.setDate(end.getDate() + Math.max(1, Math.ceil(ticket.resolutionTimeHours / 24)));

    return addWorkOrderFromCoreFields({
        title: ticket.requestTitle,
        description: ticket.description || `Service request ${ticket.ticketCode}`,
        workType: mapIssueCategoryToWorkType(ticket.issueCategory),
        issueType: mapIssueCategoryToIssueType(ticket.issueCategory),
        projectOrProperty: project,
        location: {
            flat: unitLabel,
            block: '',
            tower: project,
            plot: '',
            area: ticket.locationUnit,
        },
        priority: mapPriority(ticket.priorityLevel),
        requestedBy: input.assignedBy?.trim() || 'Service Maintenance OS',
        requestedAt: ticket.createdAt,
        vendor: {
            vendorId,
            vendorName,
            assignedDate: today,
            assignedBy: input.assignedBy?.trim() || 'Auto Assignment Engine',
            estimatedCost: String(input.estimatedCost ?? ticket.estimatedCost ?? 0),
            estimatedDurationDays: Math.max(1, Math.ceil(ticket.resolutionTimeHours / 24)),
        },
        scheduling: {
            startDate: today,
            endDate: end.toISOString().slice(0, 10),
            slaStatus: ticket.slaStatus === 'Breached' ? 'At Risk' : ticket.slaStatus === 'Warning' ? 'Delayed' : 'On Track',
        },
        lifecycle: { status: 'Assigned' },
        linkedServiceRequestSlug: ticket.slug,
        linkedServiceRequestCode: ticket.ticketCode,
        linkedResidentSlug: ticket.residentSlug ?? '',
    });
}
