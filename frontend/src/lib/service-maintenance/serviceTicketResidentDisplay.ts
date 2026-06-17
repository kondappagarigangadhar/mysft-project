import type { ServiceMaintenanceTicket } from '@/lib/serviceMaintenanceStore';
import { isServiceTicketResolutionComplete } from '@/lib/serviceMaintenanceStore';
import { getWorkOrderBySlug } from '@/lib/workOrderStore';

export function formatServiceTicketDisplayDate(iso: string): string {
    if (!iso?.trim()) return '—';
    try {
        const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
    } catch {
        return '—';
    }
}

function linkedWorkOrder(ticket: ServiceMaintenanceTicket) {
    return ticket.linkedWorkOrderSlug ? getWorkOrderBySlug(ticket.linkedWorkOrderSlug) : undefined;
}

export function getServiceTicketAssignedVendorLabel(ticket: ServiceMaintenanceTicket): string {
    if (ticket.assignedVendor && ticket.assignedVendor !== 'Unassigned') {
        return ticket.assignedVendor;
    }
    const woVendor = linkedWorkOrder(ticket)?.vendor.vendorName?.trim();
    return woVendor || 'Not Assigned';
}

/** Date the vendor was assigned to this request. */
export function getServiceTicketAssignedDateLabel(ticket: ServiceMaintenanceTicket): string {
    const hasVendor = Boolean(ticket.assignedVendor && ticket.assignedVendor !== 'Unassigned');
    if (!hasVendor) return '—';
    if (ticket.assignmentDate?.trim()) {
        return formatServiceTicketDisplayDate(ticket.assignmentDate);
    }
    const woAssigned = linkedWorkOrder(ticket)?.vendor.assignedDate;
    if (woAssigned?.trim()) {
        return formatServiceTicketDisplayDate(woAssigned);
    }
    return '—';
}

/** Date work was completed — set when resolution is Fixed / Temporary Fix. */
export function getServiceTicketClosedDateLabel(ticket: ServiceMaintenanceTicket): string {
    if (!isServiceTicketResolutionComplete(ticket) && !ticket.closureDate?.trim()) {
        return '—';
    }
    if (ticket.closureDate?.trim()) {
        return formatServiceTicketDisplayDate(ticket.closureDate);
    }
    const woCompletion = linkedWorkOrder(ticket)?.completion.completionDate;
    if (woCompletion?.trim()) {
        return formatServiceTicketDisplayDate(woCompletion);
    }
    return '—';
}
