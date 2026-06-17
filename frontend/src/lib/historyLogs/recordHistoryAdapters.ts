import type { BookingHistoryEntry } from '@/lib/bookingPaymentMockStore';
import type { HistoryLogEntry, HistoryModule, HistorySeverity } from '@/lib/historyLogs/types';
import type { LeadActivityEntry } from '@/lib/leadStore';
import type { ProjectActivityEntry } from '@/lib/projectsInventoryStore';
import type { VendorHistoryLog } from '@/lib/vendors/types';
import type { WorkOrderActivityEntry } from '../workOrderStore';
import type { InvoiceActivityEntry } from '../invoiceStore';
import type { PurchaseOrderActivityEntry } from '../purchaseOrderStore';
import type { PurchaseRequestActivityEntry } from '../purchaseRequestStore';

function actorUserId(name: string) {
    const k = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    return k ? `actor-${k}` : 'actor-unknown';
}

function touchpointActionType(t: LeadActivityEntry['type']): string {
    switch (t) {
        case 'system':
            return 'updated';
        case 'call':
        case 'email':
        case 'meeting':
        case 'site_visit':
            return 'crm_touchpoint';
        default:
            return 'note_added';
    }
}

function bookingHubSeverity(action: string): HistorySeverity {
    const a = action.toLowerCase();
    if (a.includes('fail')) return 'critical';
    if (a.includes('deleted') || a.includes('delete')) return 'warning';
    if (a.includes('cancel')) return 'critical';
    return 'info';
}

function bookingHubActionType(action: string): string {
    const a = action.toLowerCase();
    if (a.includes('created')) return 'created';
    if (a.includes('upload')) return 'uploaded';
    if (a.includes('replaced') || a.includes('replace')) return 'updated';
    if (a.includes('deleted') || a.includes('delete')) return 'deleted';
    return 'updated';
}

/** Booking & Payment hub timeline rows → unified history log shape. */
export function bookingHubHistoryToHistoryLogEntries(
    bookingSlug: string,
    recordTitle: string,
    entries: BookingHistoryEntry[],
): HistoryLogEntry[] {
    return entries.map((e) => ({
        id: `booking-hub-${e.id}`,
        at: e.at,
        user: { id: 'u-booking-hub', name: 'Booking hub', role: 'System' },
        module: 'bookings' as HistoryModule,
        recordId: bookingSlug,
        recordLabel: recordTitle,
        action: e.action,
        changes: e.detail?.trim() ? e.detail : '—',
        severity: bookingHubSeverity(e.action),
        actionType: bookingHubActionType(e.action),
    }));
}

/** Maps CRM activity log lines into global history shape (same fields as main History log). */
export function leadActivitiesToHistoryLogEntries(
    leadSlug: string,
    leadName: string,
    entries: LeadActivityEntry[],
): HistoryLogEntry[] {
    return entries.map((ev) => ({
        id: `lead-local-${ev.id}`,
        at: ev.at,
        user: { id: actorUserId(ev.actor), name: ev.actor },
        module: 'leads' as HistoryModule,
        recordId: leadSlug,
        recordLabel: leadName,
        action: ev.title,
        changes: ev.body,
        severity: 'info',
        actionType: touchpointActionType(ev.type),
    }));
}

function parseVendorDateTime(raw: string): string {
    const t = raw.trim();
    if (!t) return new Date().toISOString();
    if (t.includes('T')) {
        const d = new Date(t);
        return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    }
    const normalized = t.length <= 16 ? `${t}:00` : t;
    const d = new Date(normalized.replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/** Vendor profile table rows → unified history entries (record-scoped UI). */
export function vendorHistoryToHistoryLogEntries(
    vendorId: string,
    vendorName: string,
    rows: VendorHistoryLog[],
): HistoryLogEntry[] {
    return rows.map((r) => ({
        id: `vendor-local-${r.id}`,
        at: parseVendorDateTime(r.dateTime),
        user: { id: actorUserId(r.user), name: r.user },
        module: 'vendors' as HistoryModule,
        recordId: vendorId,
        recordLabel: vendorName,
        action: r.action,
        changes: `${r.oldValue} → ${r.newValue}`,
        severity: 'info',
        actionType: 'updated',
        beforeValue: r.oldValue,
        afterValue: r.newValue,
    }));
}

function projectAtToIso(at: string): string {
    if (!at?.trim()) return new Date().toISOString();
    if (at.includes('T')) {
        const d = new Date(at);
        return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    }
    const d = new Date(at.trim().replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

const KIND_ACTION: Partial<Record<ProjectActivityEntry['kind'], string>> = {
    project_created: 'Project created',
    project_edited: 'Project updated',
    price_changed: 'Pricing',
    inventory_updated: 'Inventory',
    unit_booked: 'Unit booked',
    approval_requested: 'Approval requested',
    approval_completed: 'Approval completed',
    document_uploaded: 'Document uploaded',
    document_deleted: 'Document removed',
    project_archived: 'Project archived',
};

/** Project store activity stream → unified history entries. */
export function projectActivitiesToHistoryLogEntries(
    projectSlug: string,
    projectDisplayName: string,
    items: ProjectActivityEntry[],
): HistoryLogEntry[] {
    return items.map((e) => ({
        id: `proj-local-${e.id}`,
        at: projectAtToIso(e.at),
        user: { id: actorUserId(e.actor ?? 'System'), name: e.actor?.trim() || 'System' },
        module: 'projects' as HistoryModule,
        recordId: projectSlug,
        recordLabel: projectDisplayName,
        action: e.message,
        changes: KIND_ACTION[e.kind] ?? e.kind,
        severity: 'info',
        actionType: e.kind,
    }));
}

/** Work order local activity feed → unified history entries. */
export function workOrderActivitiesToHistoryLogEntries(
    workOrderSlug: string,
    workOrderTitle: string,
    entries: WorkOrderActivityEntry[],
): HistoryLogEntry[] {
    return entries.map((ev) => ({
        id: `wo-local-${ev.id}`,
        at: ev.at,
        user: { id: actorUserId(ev.actor), name: ev.actor },
        module: 'work_orders' as HistoryModule,
        recordId: workOrderSlug,
        recordLabel: workOrderTitle,
        action: ev.title,
        changes: ev.body,
        severity: ev.severity ?? 'info',
        actionType: ev.actionType ?? 'updated',
    }));
}

export function purchaseRequestActivitiesToHistoryLogEntries(
    prSlug: string,
    prLabel: string,
    entries: PurchaseRequestActivityEntry[],
): HistoryLogEntry[] {
    return entries.map((ev) => ({
        id: `pr-local-${ev.id}`,
        at: ev.at,
        user: { id: actorUserId(ev.actor), name: ev.actor },
        module: 'purchase_requests' as HistoryModule,
        recordId: prSlug,
        recordLabel: prLabel,
        action: ev.title,
        changes: ev.body,
        severity: ev.severity ?? 'info',
        actionType: ev.actionType ?? 'updated',
    }));
}

export function purchaseOrderActivitiesToHistoryLogEntries(
    poSlug: string,
    poLabel: string,
    entries: PurchaseOrderActivityEntry[],
): HistoryLogEntry[] {
    return entries.map((ev) => ({
        id: `po-local-${ev.id}`,
        at: ev.at,
        user: { id: actorUserId(ev.actor), name: ev.actor },
        module: 'purchase_orders' as HistoryModule,
        recordId: poSlug,
        recordLabel: poLabel,
        action: ev.title,
        changes: ev.body,
        severity: ev.severity ?? 'info',
        actionType: ev.actionType ?? 'updated',
    }));
}

/** Invoice local activity feed → unified history entries. */
export function invoiceActivitiesToHistoryLogEntries(
    invoiceSlug: string,
    invoiceTitle: string,
    entries: InvoiceActivityEntry[],
): HistoryLogEntry[] {
    return entries.map((ev) => ({
        id: `inv-local-${ev.id}`,
        at: ev.at,
        user: { id: actorUserId(ev.actor), name: ev.actor },
        module: 'invoices' as HistoryModule,
        recordId: invoiceSlug,
        recordLabel: invoiceTitle,
        action: ev.title,
        changes: ev.body,
        severity: ev.severity ?? 'info',
        actionType: ev.actionType ?? 'updated',
    }));
}
