'use client';

import { getResidentBySlug, RESIDENT_PROPERTY_UNIT_OPTIONS } from '@/lib/residentStore';
import { runAutoAssignmentForTicket } from '@/lib/service-maintenance/serviceAutoAssignmentEngine';
import { createWorkOrderFromServiceRequest } from '@/lib/service-maintenance/serviceWorkOrderBridge';
import { getAllVendorRecords } from '@/lib/vendors/vendorStore';
import { resolveVendorIdByName } from '@/lib/vendors/vendorWorkOrders';
import { getDemoVendorNamesList, getWorkOrderBySlug, updateWorkOrder } from '@/lib/workOrderStore';

export type IssueCategory = 'Plumbing' | 'Electrical' | 'Cleaning' | 'HVAC' | 'Security' | 'Civil' | 'General';
export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus = 'Open' | 'In Progress' | 'On Hold' | 'Resolved' | 'Closed';
export type SlaStatus = 'On Track' | 'Warning' | 'Breached';
export type EscalationLevel = 'Level 1' | 'Level 2' | 'Level 3';
export type SourceChannel = 'Portal' | 'App' | 'WhatsApp' | 'Manual';
export type ResolutionStatus = 'Fixed' | 'Temporary Fix' | 'Pending Vendor' | 'Reopened';
export type SlaType = 'Standard' | 'Priority' | 'Emergency';

export const ISSUE_CATEGORY_OPTIONS: IssueCategory[] = ['Plumbing', 'Electrical', 'Cleaning', 'HVAC', 'Security', 'Civil', 'General'];
export const PRIORITY_LEVEL_OPTIONS: PriorityLevel[] = ['Low', 'Medium', 'High', 'Critical'];
export const TICKET_STATUS_OPTIONS: TicketStatus[] = ['Open', 'In Progress', 'On Hold', 'Resolved', 'Closed'];
export const SLA_STATUS_OPTIONS: SlaStatus[] = ['On Track', 'Warning', 'Breached'];
export const ESCALATION_LEVEL_OPTIONS: EscalationLevel[] = ['Level 1', 'Level 2', 'Level 3'];
export const SOURCE_CHANNEL_OPTIONS: SourceChannel[] = ['Portal', 'App', 'WhatsApp', 'Manual'];
export const RESOLUTION_STATUS_OPTIONS: ResolutionStatus[] = ['Fixed', 'Temporary Fix', 'Pending Vendor', 'Reopened'];
export const SLA_TYPE_OPTIONS: SlaType[] = ['Standard', 'Priority', 'Emergency'];

export const SERVICE_LOCATION_UNIT_OPTIONS: string[] = [...RESIDENT_PROPERTY_UNIT_OPTIONS];

export const SERVICE_MAINTENANCE_TICKET_UPDATED_EVENT = 'arris-service-maintenance-ticket-updated';

const RESOLUTION_COMPLETE: ResolutionStatus[] = ['Fixed', 'Temporary Fix'];

function emitServiceTicketUpdated() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(SERVICE_MAINTENANCE_TICKET_UPDATED_EVENT));
    }
}

function activeTicketStatusForVendor(assignedVendor: string): TicketStatus {
    return assignedVendor && assignedVendor !== 'Unassigned' ? 'In Progress' : 'Open';
}

/** Auto-set / clear closed date and ticket status when resolution status changes. */
function mergeResolutionLifecyclePatch(
    prev: ServiceMaintenanceTicket,
    patch: Partial<ServiceMaintenanceTicket>,
): Partial<ServiceMaintenanceTicket> {
    if (!('resolutionStatus' in patch) || patch.resolutionStatus === prev.resolutionStatus) {
        return patch;
    }

    const status = patch.resolutionStatus ?? '';
    const now = new Date().toISOString();
    const merged: Partial<ServiceMaintenanceTicket> = { ...patch };

    if (status === 'Fixed' || status === 'Temporary Fix') {
        merged.closureDate = patch.closureDate?.trim() ? patch.closureDate : now;
        if (!('ticketStatus' in patch)) {
            merged.ticketStatus = prev.closureConfirmation ? 'Closed' : 'Resolved';
        }
        return merged;
    }

    if (status === 'Reopened') {
        merged.closureDate = '';
        merged.closureConfirmation = false;
        if (!('ticketStatus' in patch)) {
            merged.ticketStatus = activeTicketStatusForVendor(prev.assignedVendor);
        }
        return merged;
    }

    if (status === 'Pending Vendor' || status === '') {
        merged.closureDate = '';
        if (!('ticketStatus' in patch)) {
            merged.ticketStatus = activeTicketStatusForVendor(prev.assignedVendor);
        }
        return merged;
    }

    return merged;
}

export function isServiceTicketResolutionComplete(ticket: Pick<ServiceMaintenanceTicket, 'resolutionStatus' | 'closureDate'>): boolean {
    if (ticket.closureDate?.trim()) return true;
    return RESOLUTION_COMPLETE.includes(ticket.resolutionStatus as ResolutionStatus);
}

export function applyServiceTicketResolutionStatus(
    slug: string,
    resolutionStatus: ResolutionStatus | '',
): ServiceMaintenanceTicket | undefined {
    return updateServiceMaintenanceTicket(slug, { resolutionStatus });
}

export function reopenServiceMaintenanceTicket(slug: string): ServiceMaintenanceTicket | undefined {
    return applyServiceTicketResolutionStatus(slug, 'Pending Vendor');
}

export function getAssignedVendorOptions(): string[] {
    const vendors = getDemoVendorNamesList();
    return ['Unassigned', ...vendors];
}

export type AssignmentMethod = 'Auto' | 'Manual';

export type ServiceAssignmentHistoryEntry = {
    id: string;
    at: string;
    vendorId: string;
    vendorName: string;
    method: AssignmentMethod;
    confidence: number;
    reason: string;
    assignedBy: string;
    previousVendor?: string;
    workOrderSlug?: string;
    workOrderId?: string;
};

export type ServiceAttachment = {
    id: string;
    fileName: string;
    sizeLabel: string;
    uploadedAt: string;
    mimeType: string;
    blobUrl?: string;
};

export type ServiceMaintenanceTicket = {
    id: number;
    slug: string;
    ticketCode: string;
    /** Links ticket to a resident record in community management. */
    residentSlug?: string;
    requestTitle: string;
    issueCategory: IssueCategory;
    priorityLevel: PriorityLevel;
    description: string;
    attachment: ServiceAttachment | null;
    locationUnit: string;
    preferredVisitTime: string;
    ticketStatus: TicketStatus;
    sourceChannel: SourceChannel;
    slaType: SlaType;
    responseTimeHours: number;
    resolutionTimeHours: number;
    slaStatus: SlaStatus;
    escalationLevel: EscalationLevel;
    slaDueAt: string;
    assignedVendor: string;
    assignedVendorId: string;
    assignmentDate: string;
    assignmentMethod: AssignmentMethod | '';
    assignmentConfidence: number;
    assignmentReason: string;
    linkedWorkOrderSlug: string;
    linkedWorkOrderId: string;
    assignmentHistory: ServiceAssignmentHistoryEntry[];
    estimatedCost: number;
    vendorNotes: string;
    autoAssignEnabled: boolean;
    resolutionNotes: string;
    resolutionStatus: ResolutionStatus | '';
    resolutionAttachment: ServiceAttachment | null;
    closureConfirmation: boolean;
    residentFeedback: number;
    closureDate: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};

function slugify(raw: string): string {
    return raw
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 72);
}

let _nextId = 72000;

function formatTicketCode(id: number) {
    return `SR-${String(id).padStart(5, '0')}`;
}

function ensureUniqueSlug(base: string): string {
    const taken = new Set(_tickets.map((t) => t.slug));
    if (!taken.has(base)) return base;
    let i = 2;
    while (taken.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
}

function addHours(iso: string, hours: number): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    d.setHours(d.getHours() + hours);
    return d.toISOString();
}

function deriveSlaStatus(slaDueAt: string, ticketStatus: TicketStatus): SlaStatus {
    if (ticketStatus === 'Closed' || ticketStatus === 'Resolved') return 'On Track';
    const due = Date.parse(slaDueAt);
    if (Number.isNaN(due)) return 'On Track';
    const now = Date.now();
    const remaining = due - now;
    if (remaining <= 0) return 'Breached';
    if (remaining <= 4 * 3600000) return 'Warning';
    return 'On Track';
}

export function computeRemainingSlaLabel(slaDueAt: string, ticketStatus: TicketStatus): string {
    if (ticketStatus === 'Closed' || ticketStatus === 'Resolved') return 'Complete';
    const due = Date.parse(slaDueAt);
    if (Number.isNaN(due)) return '—';
    const diffMs = due - Date.now();
    if (diffMs <= 0) {
        const over = Math.abs(diffMs);
        const h = Math.floor(over / 3600000);
        const m = Math.floor((over % 3600000) / 60000);
        return h > 0 ? `${h}h ${m}m overdue` : `${m}m overdue`;
    }
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    if (h >= 24) {
        const d = Math.floor(h / 24);
        return `${d}d ${h % 24}h left`;
    }
    return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

export function computeSlaProgressPercent(createdAt: string, slaDueAt: string, ticketStatus: TicketStatus): number {
    if (ticketStatus === 'Closed' || ticketStatus === 'Resolved') return 100;
    const start = Date.parse(createdAt);
    const end = Date.parse(slaDueAt);
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
    const elapsed = Date.now() - start;
    const total = end - start;
    return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
}

const seedNow = new Date().toISOString();
const vendors = getAssignedVendorOptions().filter((v) => v !== 'Unassigned');

function seedAssignmentFields(
    overrides: Partial<
        Pick<
            ServiceMaintenanceTicket,
            | 'assignedVendorId'
            | 'assignmentMethod'
            | 'assignmentConfidence'
            | 'assignmentReason'
            | 'linkedWorkOrderSlug'
            | 'linkedWorkOrderId'
            | 'assignmentHistory'
        >
    > = {},
) {
    return {
        assignedVendorId: '',
        assignmentMethod: '' as AssignmentMethod | '',
        assignmentConfidence: 0,
        assignmentReason: '',
        linkedWorkOrderSlug: '',
        linkedWorkOrderId: '',
        assignmentHistory: [] as ServiceAssignmentHistoryEntry[],
        ...overrides,
    };
}

const _seed: ServiceMaintenanceTicket[] = [
    {
        id: 72001,
        slug: 'leaking-kitchen-sink-unit-1204',
        ticketCode: formatTicketCode(72001),
        requestTitle: 'Leaking kitchen sink — Unit 1204',
        issueCategory: 'Plumbing',
        priorityLevel: 'High',
        description: 'Resident reports steady drip under kitchen sink cabinet. Water pooling on floor mat.',
        attachment: null,
        locationUnit: 'Riverfront Tower — Unit 1204',
        preferredVisitTime: '2026-05-21T10:00:00+05:30',
        residentSlug: 'priya-mehta',
        ticketStatus: 'In Progress',
        sourceChannel: 'Portal',
        slaType: 'Priority',
        responseTimeHours: 2,
        resolutionTimeHours: 24,
        slaStatus: 'On Track',
        escalationLevel: 'Level 1',
        slaDueAt: addHours(seedNow, 20),
        assignedVendor: 'AquaFix Plumbing Co.',
        assignmentDate: seedNow,
        ...seedAssignmentFields({
            assignedVendorId: 'VND-1006',
            assignmentMethod: 'Auto',
            assignmentConfidence: 94,
            assignmentReason: 'Project Match + Plumbing Category + SLA 96%',
            assignmentHistory: [
                {
                    id: 'asg-seed-72001',
                    at: seedNow,
                    vendorId: 'VND-1006',
                    vendorName: 'AquaFix Plumbing Co.',
                    method: 'Auto',
                    confidence: 94,
                    reason: 'Project Match + Plumbing Category + SLA 96%',
                    assignedBy: 'Auto Assignment Engine',
                },
            ],
        }),
        estimatedCost: 4500,
        vendorNotes: 'Plumber dispatched with spare washers.',
        autoAssignEnabled: true,
        resolutionNotes: '',
        resolutionStatus: 'Pending Vendor',
        resolutionAttachment: null,
        closureConfirmation: false,
        residentFeedback: 0,
        closureDate: '',
        createdAt: seedNow,
        updatedAt: seedNow,
        deletedAt: null,
    },
    {
        id: 72002,
        slug: 'ac-not-cooling-apt-902',
        ticketCode: formatTicketCode(72002),
        requestTitle: 'AC not cooling — Apt 902',
        issueCategory: 'HVAC',
        priorityLevel: 'Critical',
        description: 'Split AC running but no cold air. Outdoor unit humming.',
        attachment: {
            id: 'att-1',
            fileName: 'ac-unit-photo.jpg',
            sizeLabel: '890 KB',
            uploadedAt: seedNow,
            mimeType: 'image/jpeg',
        },
        locationUnit: 'Skyline Courts — Apt 902',
        preferredVisitTime: '2026-05-20T14:30:00+05:30',
        residentSlug: 'james-nguyen',
        ticketStatus: 'Open',
        sourceChannel: 'App',
        slaType: 'Emergency',
        responseTimeHours: 1,
        resolutionTimeHours: 8,
        slaStatus: 'Warning',
        escalationLevel: 'Level 2',
        slaDueAt: addHours(seedNow, 6),
        assignedVendor: 'Unassigned',
        assignmentDate: '',
        ...seedAssignmentFields(),
        estimatedCost: 0,
        vendorNotes: '',
        autoAssignEnabled: true,
        resolutionNotes: '',
        resolutionStatus: '',
        resolutionAttachment: null,
        closureConfirmation: false,
        residentFeedback: 0,
        closureDate: '',
        createdAt: seedNow,
        updatedAt: seedNow,
        deletedAt: null,
    },
    {
        id: 72003,
        slug: 'lobby-deep-clean-scheduled',
        ticketCode: formatTicketCode(72003),
        requestTitle: 'Lobby deep clean — scheduled service',
        issueCategory: 'Cleaning',
        priorityLevel: 'Low',
        description: 'Quarterly lobby and elevator landing deep clean.',
        attachment: null,
        locationUnit: 'Garden Plaza — Villa 07',
        preferredVisitTime: '2026-05-25T09:00:00+05:30',
        residentSlug: 'ananya-iyer',
        ticketStatus: 'On Hold',
        sourceChannel: 'Manual',
        slaType: 'Standard',
        responseTimeHours: 8,
        resolutionTimeHours: 72,
        slaStatus: 'On Track',
        escalationLevel: 'Level 1',
        slaDueAt: addHours(seedNow, 68),
        assignedVendor: 'SparkClean Facility Services',
        assignmentDate: seedNow,
        ...seedAssignmentFields({
            assignedVendorId: 'VND-1008',
            assignmentMethod: 'Auto',
            assignmentConfidence: 86,
            assignmentReason: 'Project Match + Cleaning Category + SLA 88%',
            assignmentHistory: [
                {
                    id: 'asg-seed-72003',
                    at: seedNow,
                    vendorId: 'VND-1008',
                    vendorName: 'SparkClean Facility Services',
                    method: 'Auto',
                    confidence: 86,
                    reason: 'Project Match + Cleaning Category + SLA 88%',
                    assignedBy: 'Auto Assignment Engine',
                },
            ],
        }),
        estimatedCost: 12000,
        vendorNotes: 'Awaiting resident committee approval for weekend slot.',
        autoAssignEnabled: true,
        resolutionNotes: '',
        resolutionStatus: '',
        resolutionAttachment: null,
        closureConfirmation: false,
        residentFeedback: 0,
        closureDate: '',
        createdAt: seedNow,
        updatedAt: seedNow,
        deletedAt: null,
    },
    {
        id: 72004,
        slug: 'cctv-blind-spot-parking',
        ticketCode: formatTicketCode(72004),
        requestTitle: 'CCTV blind spot — parking level B2',
        issueCategory: 'Security',
        priorityLevel: 'Medium',
        description: 'Camera #14 offline near pillar C. Reported via WhatsApp.',
        attachment: null,
        locationUnit: 'Central Annex — Suite 310',
        preferredVisitTime: '2026-05-22T16:00:00+05:30',
        residentSlug: 'maria-lopez',
        ticketStatus: 'Resolved',
        sourceChannel: 'WhatsApp',
        slaType: 'Standard',
        responseTimeHours: 4,
        resolutionTimeHours: 48,
        slaStatus: 'On Track',
        escalationLevel: 'Level 1',
        slaDueAt: addHours(seedNow, -2),
        assignedVendor: 'SafeGuard Security Services',
        assignmentDate: seedNow,
        ...seedAssignmentFields({
            assignedVendorId: 'VND-1003',
            assignmentMethod: 'Manual',
            assignmentConfidence: 100,
            assignmentReason: 'Manual assignment — security vendor on contract',
            assignmentHistory: [
                {
                    id: 'asg-seed-72004',
                    at: seedNow,
                    vendorId: 'VND-1003',
                    vendorName: 'SafeGuard Security Services',
                    method: 'Manual',
                    confidence: 100,
                    reason: 'Manual assignment — security vendor on contract',
                    assignedBy: 'Company Admin',
                },
            ],
        }),
        estimatedCost: 8500,
        vendorNotes: 'Replaced PoE switch port.',
        autoAssignEnabled: false,
        resolutionNotes: 'Camera back online; footage verified for last 24h.',
        resolutionStatus: 'Fixed',
        resolutionAttachment: null,
        closureConfirmation: true,
        residentFeedback: 4,
        closureDate: seedNow,
        createdAt: seedNow,
        updatedAt: seedNow,
        deletedAt: null,
    },
    {
        id: 72005,
        slug: 'cracked-tile-bathroom',
        ticketCode: formatTicketCode(72005),
        requestTitle: 'Cracked floor tile — master bathroom',
        issueCategory: 'Civil',
        priorityLevel: 'Medium',
        description: 'Tile crack expanding near shower drain. Safety concern.',
        attachment: null,
        locationUnit: 'Marina Views — Penthouse B',
        preferredVisitTime: '2026-05-23T11:00:00+05:30',
        residentSlug: 'oliver-schmidt',
        ticketStatus: 'Closed',
        sourceChannel: 'Portal',
        slaType: 'Standard',
        responseTimeHours: 6,
        resolutionTimeHours: 96,
        slaStatus: 'On Track',
        escalationLevel: 'Level 1',
        slaDueAt: addHours(seedNow, -24),
        assignedVendor: vendors[0] ?? 'Prime Electrical Works',
        assignmentDate: seedNow,
        ...seedAssignmentFields({
            assignmentMethod: 'Manual',
            assignmentConfidence: 100,
            assignmentReason: 'Manual assignment at ticket creation',
            assignmentHistory: [
                {
                    id: 'asg-seed-72005',
                    at: seedNow,
                    vendorId: resolveVendorIdByName(vendors[0] ?? 'Prime Electrical Works'),
                    vendorName: vendors[0] ?? 'Prime Electrical Works',
                    method: 'Manual',
                    confidence: 100,
                    reason: 'Manual assignment at ticket creation',
                    assignedBy: 'Company Admin',
                },
            ],
        }),
        estimatedCost: 6500,
        vendorNotes: 'Matched tile batch from stock.',
        autoAssignEnabled: false,
        resolutionNotes: 'Tile replaced and grouted. Area sealed 24h.',
        resolutionStatus: 'Fixed',
        resolutionAttachment: {
            id: 'att-res-1',
            fileName: 'completion-photo.jpg',
            sizeLabel: '640 KB',
            uploadedAt: seedNow,
            mimeType: 'image/jpeg',
        },
        closureConfirmation: true,
        residentFeedback: 5,
        closureDate: seedNow,
        createdAt: seedNow,
        updatedAt: seedNow,
        deletedAt: null,
    },
];

_nextId = Math.max(..._seed.map((t) => t.id), _nextId) + 1;

let _tickets: ServiceMaintenanceTicket[] = [..._seed];

function hydrateAssignmentFields(row: ServiceMaintenanceTicket): ServiceMaintenanceTicket {
    return {
        ...row,
        assignedVendorId: row.assignedVendorId ?? (row.assignedVendor !== 'Unassigned' ? resolveVendorIdByName(row.assignedVendor) : ''),
        assignmentMethod: row.assignmentMethod ?? '',
        assignmentConfidence: row.assignmentConfidence ?? 0,
        assignmentReason: row.assignmentReason ?? '',
        linkedWorkOrderSlug: row.linkedWorkOrderSlug ?? '',
        linkedWorkOrderId: row.linkedWorkOrderId ?? '',
        assignmentHistory: row.assignmentHistory ?? [],
    };
}

function refreshSlaFields(row: ServiceMaintenanceTicket): ServiceMaintenanceTicket {
    const slaStatus = deriveSlaStatus(row.slaDueAt, row.ticketStatus);
    return hydrateAssignmentFields({ ...row, slaStatus });
}

function countOpenTicketsByVendorName(): Record<string, number> {
    const open = new Set<TicketStatus>(['Open', 'In Progress', 'On Hold']);
    const counts: Record<string, number> = {};
    for (const t of _tickets) {
        if (t.deletedAt || !open.has(t.ticketStatus)) continue;
        if (!t.assignedVendor || t.assignedVendor === 'Unassigned') continue;
        counts[t.assignedVendor] = (counts[t.assignedVendor] ?? 0) + 1;
    }
    return counts;
}

function resolveVendorName(vendorId: string, vendorName: string): { vendorId: string; vendorName: string } {
    const byId = getAllVendorRecords().find((v) => v.id === vendorId);
    if (byId) return { vendorId: byId.id, vendorName: byId.name };
    const id = vendorId.trim() || resolveVendorIdByName(vendorName);
    return { vendorId: id, vendorName: vendorName.trim() };
}

function appendAssignmentHistory(
    ticket: ServiceMaintenanceTicket,
    entry: Omit<ServiceAssignmentHistoryEntry, 'id' | 'at'>,
): ServiceAssignmentHistoryEntry[] {
    const row: ServiceAssignmentHistoryEntry = {
        id: `asg-hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        at: new Date().toISOString(),
        ...entry,
    };
    return [...(ticket.assignmentHistory ?? []), row];
}

export function assignVendorToServiceTicket(
    slug: string,
    input: {
        vendorName: string;
        vendorId?: string;
        method: AssignmentMethod;
        confidence?: number;
        reason?: string;
        assignedBy?: string;
        skipWorkOrder?: boolean;
    },
): ServiceMaintenanceTicket | undefined {
    const t = _tickets.find((x) => x.slug === slug && !x.deletedAt);
    if (!t) return undefined;
    const vendorName = input.vendorName.trim();
    if (!vendorName || vendorName === 'Unassigned') return undefined;

    const { vendorId, vendorName: resolvedName } = resolveVendorName(input.vendorId ?? '', vendorName);
    const now = new Date().toISOString();
    const previousVendor = t.assignedVendor !== 'Unassigned' ? t.assignedVendor : undefined;

    let linkedWorkOrderSlug = t.linkedWorkOrderSlug ?? '';
    let linkedWorkOrderId = t.linkedWorkOrderId ?? '';

    if (!input.skipWorkOrder) {
        if (linkedWorkOrderSlug) {
            const existing = getWorkOrderBySlug(linkedWorkOrderSlug);
            if (existing) {
                updateWorkOrder(linkedWorkOrderSlug, {
                    vendor: {
                        vendorId,
                        vendorName: resolvedName,
                        assignedDate: now.slice(0, 10),
                        assignedBy: input.assignedBy ?? 'Company Admin',
                        estimatedCost: String(t.estimatedCost || existing.vendor.estimatedCost || ''),
                        estimatedDurationDays: existing.vendor.estimatedDurationDays,
                    },
                    lifecycle: {
                        status: existing.lifecycle.status === 'Draft' || existing.lifecycle.status === 'Open' ? 'Assigned' : existing.lifecycle.status,
                        statusUpdatedBy: input.assignedBy ?? 'Company Admin',
                        statusUpdatedAt: now,
                    },
                });
                linkedWorkOrderId = existing.workOrderId;
            }
        } else {
            const wo = createWorkOrderFromServiceRequest({
                ticket: t,
                vendorId,
                vendorName: resolvedName,
                assignedBy: input.assignedBy ?? (input.method === 'Auto' ? 'Auto Assignment Engine' : 'Company Admin'),
                estimatedCost: t.estimatedCost,
            });
            linkedWorkOrderSlug = wo.slug;
            linkedWorkOrderId = wo.workOrderId;
        }
    }

    const history = appendAssignmentHistory(t, {
        vendorId,
        vendorName: resolvedName,
        method: input.method,
        confidence: input.confidence ?? (input.method === 'Auto' ? 0 : 100),
        reason: input.reason?.trim() || (input.method === 'Manual' ? 'Manual reassignment by manager' : 'Auto assignment'),
        assignedBy: input.assignedBy ?? (input.method === 'Auto' ? 'Auto Assignment Engine' : 'Company Admin'),
        previousVendor,
        workOrderSlug: linkedWorkOrderSlug || undefined,
        workOrderId: linkedWorkOrderId || undefined,
    });

    const next = refreshSlaFields({
        ...t,
        assignedVendor: resolvedName,
        assignedVendorId: vendorId,
        assignmentDate: now,
        assignmentMethod: input.method,
        assignmentConfidence: input.confidence ?? (input.method === 'Manual' ? 100 : 0),
        assignmentReason: input.reason?.trim() || (input.method === 'Manual' ? 'Manual reassignment by manager' : ''),
        linkedWorkOrderSlug,
        linkedWorkOrderId,
        assignmentHistory: history,
        ticketStatus: t.ticketStatus === 'Open' ? 'In Progress' : t.ticketStatus,
        resolutionStatus: t.resolutionStatus || 'Pending Vendor',
        updatedAt: now,
    });

    _tickets = _tickets.map((row) => (row.slug === slug ? next : row));
    emitServiceTicketUpdated();
    return next;
}

export function runAutoAssignmentForServiceTicket(slug: string): ServiceMaintenanceTicket | undefined {
    const t = _tickets.find((x) => x.slug === slug && !x.deletedAt);
    if (!t || !t.autoAssignEnabled) return t ? refreshSlaFields(t) : undefined;
    if (t.assignedVendor && t.assignedVendor !== 'Unassigned') return refreshSlaFields(t);

    const result = runAutoAssignmentForTicket(t, countOpenTicketsByVendorName());
    if (!result) return refreshSlaFields(t);

    return assignVendorToServiceTicket(slug, {
        vendorName: result.vendorName,
        vendorId: result.vendorId,
        method: 'Auto',
        confidence: result.confidence,
        reason: result.reason,
        assignedBy: 'Auto Assignment Engine',
    });
}

export function getServiceMaintenanceTickets(): ServiceMaintenanceTicket[] {
    return _tickets.filter((t) => !t.deletedAt).map(refreshSlaFields);
}

export function getArchivedServiceMaintenanceTickets(): ServiceMaintenanceTicket[] {
    return _tickets.filter((t) => Boolean(t.deletedAt)).map(refreshSlaFields);
}

export function getServiceMaintenanceTicketBySlug(slug: string): ServiceMaintenanceTicket | undefined {
    const row = _tickets.find((t) => t.slug === slug && !t.deletedAt);
    return row ? refreshSlaFields(row) : undefined;
}

export function getServiceMaintenanceTicketBySlugIncludingArchived(slug: string): ServiceMaintenanceTicket | undefined {
    const row = _tickets.find((t) => t.slug === slug);
    return row ? refreshSlaFields(row) : undefined;
}

export function peekNextServiceTicketId(): number {
    return Math.max(..._tickets.map((t) => t.id), _nextId - 1, 71999) + 1;
}

export function peekNextServiceTicketCode(): string {
    return formatTicketCode(peekNextServiceTicketId());
}

export function createDraftServiceMaintenanceTicket(): ServiceMaintenanceTicket {
    const now = new Date().toISOString();
    const code = peekNextServiceTicketCode();
    const resolutionHours = 24;
    return {
        id: -1,
        slug: 'new',
        ticketCode: code,
        requestTitle: '',
        issueCategory: 'General',
        priorityLevel: 'Medium',
        description: '',
        attachment: null,
        locationUnit: SERVICE_LOCATION_UNIT_OPTIONS[0] ?? '',
        preferredVisitTime: now.slice(0, 16),
        ticketStatus: 'Open',
        sourceChannel: 'Manual',
        slaType: 'Standard',
        responseTimeHours: 4,
        resolutionTimeHours: resolutionHours,
        slaStatus: 'On Track',
        escalationLevel: 'Level 1',
        slaDueAt: addHours(now, resolutionHours),
        assignedVendor: 'Unassigned',
        assignmentDate: '',
        ...seedAssignmentFields(),
        estimatedCost: 0,
        vendorNotes: '',
        autoAssignEnabled: true,
        resolutionNotes: '',
        resolutionStatus: '',
        resolutionAttachment: null,
        closureConfirmation: false,
        residentFeedback: 0,
        closureDate: '',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
    };
}

export function bulkSetTicketStatus(slugs: string[], status: TicketStatus): void {
    const set = new Set(slugs);
    const now = new Date().toISOString();
    _tickets = _tickets.map((t) =>
        set.has(t.slug) && !t.deletedAt
            ? refreshSlaFields({
                  ...t,
                  ticketStatus: status,
                  updatedAt: now,
                  closureDate: status === 'Closed' ? now : t.closureDate,
              })
            : t,
    );
}

export function bulkAssignVendor(slugs: string[], vendor: string): void {
    for (const slug of slugs) {
        assignVendorToServiceTicket(slug, {
            vendorName: vendor,
            method: 'Manual',
            confidence: 100,
            reason: 'Bulk manual assignment',
            assignedBy: 'Company Admin',
        });
    }
}

export function bulkEscalateTickets(slugs: string[], level: EscalationLevel): void {
    const set = new Set(slugs);
    const now = new Date().toISOString();
    _tickets = _tickets.map((t) =>
        set.has(t.slug) && !t.deletedAt
            ? refreshSlaFields({
                  ...t,
                  escalationLevel: level,
                  slaStatus: t.slaStatus === 'On Track' ? 'Warning' : t.slaStatus,
                  updatedAt: now,
              })
            : t,
    );
}

export function bulkDeleteServiceTicketsPermanent(slugs: string[]): void {
    const set = new Set(slugs);
    _tickets = _tickets.filter((t) => !set.has(t.slug));
}

export function addServiceMaintenanceTicket(
    patch: Omit<Partial<ServiceMaintenanceTicket>, 'id' | 'slug' | 'ticketCode'> & Pick<ServiceMaintenanceTicket, 'requestTitle'>,
): ServiceMaintenanceTicket {
    const id = peekNextServiceTicketId();
    _nextId = id + 1;
    const slug = ensureUniqueSlug(slugify(`${patch.requestTitle}-${id}`));
    const now = new Date().toISOString();
    const resolutionHours = patch.resolutionTimeHours ?? 24;
    const row: ServiceMaintenanceTicket = refreshSlaFields({
        id,
        slug,
        ticketCode: formatTicketCode(id),
        requestTitle: patch.requestTitle.trim(),
        issueCategory: patch.issueCategory ?? 'General',
        priorityLevel: patch.priorityLevel ?? 'Medium',
        description: patch.description?.trim() ?? '',
        attachment: patch.attachment ?? null,
        locationUnit: patch.locationUnit ?? SERVICE_LOCATION_UNIT_OPTIONS[0] ?? '',
        preferredVisitTime: patch.preferredVisitTime ?? now,
        ticketStatus: patch.ticketStatus ?? 'Open',
        sourceChannel: patch.sourceChannel ?? 'Manual',
        slaType: patch.slaType ?? 'Standard',
        responseTimeHours: patch.responseTimeHours ?? 4,
        resolutionTimeHours: resolutionHours,
        slaStatus: patch.slaStatus ?? 'On Track',
        escalationLevel: patch.escalationLevel ?? 'Level 1',
        slaDueAt: patch.slaDueAt ?? addHours(now, resolutionHours),
        assignedVendor: patch.assignedVendor ?? 'Unassigned',
        assignedVendorId: patch.assignedVendorId ?? '',
        assignmentDate: patch.assignmentDate ?? '',
        assignmentMethod: patch.assignmentMethod ?? '',
        assignmentConfidence: patch.assignmentConfidence ?? 0,
        assignmentReason: patch.assignmentReason ?? '',
        linkedWorkOrderSlug: patch.linkedWorkOrderSlug ?? '',
        linkedWorkOrderId: patch.linkedWorkOrderId ?? '',
        assignmentHistory: patch.assignmentHistory ?? [],
        estimatedCost: patch.estimatedCost ?? 0,
        vendorNotes: patch.vendorNotes?.trim() ?? '',
        autoAssignEnabled: patch.autoAssignEnabled ?? true,
        resolutionNotes: patch.resolutionNotes?.trim() ?? '',
        resolutionStatus: patch.resolutionStatus ?? '',
        resolutionAttachment: patch.resolutionAttachment ?? null,
        closureConfirmation: patch.closureConfirmation ?? false,
        residentFeedback: patch.residentFeedback ?? 0,
        closureDate: patch.closureDate ?? '',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
    });
    _tickets = [..._tickets, row];

    const shouldAutoAssign =
        row.autoAssignEnabled &&
        (row.assignedVendor === 'Unassigned' || !row.assignedVendor) &&
        !patch.assignedVendor;
    if (shouldAutoAssign) {
        const assigned = runAutoAssignmentForServiceTicket(row.slug) ?? row;
        emitServiceTicketUpdated();
        return assigned;
    }
    emitServiceTicketUpdated();
    return refreshSlaFields(row);
}

export function updateServiceMaintenanceTicket(
    slug: string,
    patch: Partial<Omit<ServiceMaintenanceTicket, 'id' | 'slug' | 'ticketCode'>>,
): ServiceMaintenanceTicket | undefined {
    const prev = _tickets.find((t) => t.slug === slug);
    if (!prev) return undefined;
    const now = new Date().toISOString();
    const lifecyclePatch = mergeResolutionLifecyclePatch(prev, patch);
    let next: ServiceMaintenanceTicket = {
        ...prev,
        ...lifecyclePatch,
        slug: prev.slug,
        id: prev.id,
        ticketCode: prev.ticketCode,
        updatedAt: now,
    };
    if (lifecyclePatch.resolutionTimeHours != null && !lifecyclePatch.slaDueAt) {
        next.slaDueAt = addHours(prev.createdAt, lifecyclePatch.resolutionTimeHours);
    }
    if (
        'closureConfirmation' in lifecyclePatch &&
        lifecyclePatch.closureConfirmation &&
        (next.resolutionStatus === 'Fixed' || next.resolutionStatus === 'Temporary Fix')
    ) {
        next.ticketStatus = 'Closed';
        if (!next.closureDate) next.closureDate = now;
    }
    next = refreshSlaFields(next);
    _tickets = _tickets.map((t) => (t.slug === slug ? next : t));
    emitServiceTicketUpdated();
    return next;
}

export function closeServiceMaintenanceTicket(slug: string): boolean {
    const t = _tickets.find((x) => x.slug === slug && !x.deletedAt);
    if (!t) return false;
    const now = new Date().toISOString();
    updateServiceMaintenanceTicket(slug, {
        ticketStatus: 'Closed',
        closureConfirmation: true,
        closureDate: now,
        resolutionStatus: t.resolutionStatus || 'Fixed',
    });
    return true;
}

export function archiveServiceMaintenanceTicket(slug: string): boolean {
    const t = _tickets.find((x) => x.slug === slug && !x.deletedAt);
    if (!t) return false;
    const now = new Date().toISOString();
    updateServiceMaintenanceTicket(slug, { deletedAt: now, ticketStatus: 'Closed' });
    return true;
}

export function deleteServiceMaintenanceTicketPermanent(slug: string): boolean {
    const before = _tickets.length;
    _tickets = _tickets.filter((x) => x.slug !== slug);
    return _tickets.length < before;
}

export function duplicateServiceMaintenanceTicket(slug: string): ServiceMaintenanceTicket | undefined {
    const src = _tickets.find((t) => t.slug === slug && !t.deletedAt);
    if (!src) return undefined;
    const copyTitle = `${src.requestTitle} (Copy)`;
    return addServiceMaintenanceTicket({
        requestTitle: copyTitle,
        issueCategory: src.issueCategory,
        priorityLevel: src.priorityLevel,
        description: src.description,
        attachment: src.attachment ? { ...src.attachment, id: `att-${Date.now()}`, uploadedAt: new Date().toISOString() } : null,
        locationUnit: src.locationUnit,
        preferredVisitTime: src.preferredVisitTime,
        ticketStatus: 'Open',
        sourceChannel: src.sourceChannel,
        slaType: src.slaType,
        responseTimeHours: src.responseTimeHours,
        resolutionTimeHours: src.resolutionTimeHours,
        escalationLevel: 'Level 1',
        assignedVendor: 'Unassigned',
        assignedVendorId: '',
        assignmentDate: '',
        assignmentMethod: '',
        assignmentConfidence: 0,
        assignmentReason: '',
        linkedWorkOrderSlug: '',
        linkedWorkOrderId: '',
        assignmentHistory: [],
        estimatedCost: src.estimatedCost,
        vendorNotes: '',
        autoAssignEnabled: src.autoAssignEnabled,
        resolutionNotes: '',
        resolutionStatus: '',
        resolutionAttachment: null,
        closureConfirmation: false,
        residentFeedback: 0,
        closureDate: '',
    });
}

export function escalateServiceMaintenanceTicket(slug: string, level?: EscalationLevel): boolean {
    const t = _tickets.find((x) => x.slug === slug && !x.deletedAt);
    if (!t) return false;
    const order: EscalationLevel[] = ['Level 1', 'Level 2', 'Level 3'];
    const idx = order.indexOf(level ?? t.escalationLevel);
    const nextLevel = level ?? order[Math.min(idx + 1, order.length - 1)]!;
    updateServiceMaintenanceTicket(slug, {
        escalationLevel: nextLevel,
        slaStatus: t.slaStatus === 'On Track' ? 'Warning' : t.slaStatus,
    });
    return true;
}

export function assignVendorToTicket(slug: string, vendor: string): boolean {
    return Boolean(
        assignVendorToServiceTicket(slug, {
            vendorName: vendor,
            method: 'Manual',
            confidence: 100,
            reason: 'Manual vendor assignment',
            assignedBy: 'Company Admin',
        }),
    );
}

export function getServiceTicketAssignmentHistory(slug: string): ServiceAssignmentHistoryEntry[] {
    const t = getServiceMaintenanceTicketBySlug(slug);
    return t?.assignmentHistory ?? [];
}

export type ServiceTicketResidentContext = {
    slug: string;
    fullName: string;
    residentCode: string;
    propertyUnit: string;
    phoneNumber: string;
    email: string;
};

export function resolveServiceTicketResidentContext(
    residentSlug?: string,
    unitOverride?: string,
): ServiceTicketResidentContext | undefined {
    const slug = residentSlug?.trim();
    if (!slug) return undefined;
    const resident = getResidentBySlug(slug);
    if (!resident) return undefined;
    const unit = unitOverride?.trim() || resident.propertyUnit.trim();
    return {
        slug: resident.slug,
        fullName: resident.fullName,
        residentCode: resident.residentCode,
        propertyUnit: unit,
        phoneNumber: resident.phoneNumber,
        email: resident.email,
    };
}

export function getResidentContextForTicket(
    ticket: Pick<ServiceMaintenanceTicket, 'residentSlug'>,
): ServiceTicketResidentContext | undefined {
    return resolveServiceTicketResidentContext(ticket.residentSlug);
}

function ticketBelongsToResident(ticket: ServiceMaintenanceTicket, residentSlug: string, propertyUnit?: string): boolean {
    if (ticket.residentSlug === residentSlug) return true;
    if (!ticket.residentSlug && propertyUnit && ticket.locationUnit === propertyUnit) return true;
    return false;
}

export function getServiceMaintenanceTicketsForResident(residentSlug: string): ServiceMaintenanceTicket[] {
    const resident = getResidentBySlug(residentSlug);
    const propertyUnit = resident?.propertyUnit;
    return getServiceMaintenanceTickets()
        .filter((t) => ticketBelongsToResident(t, residentSlug, propertyUnit))
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function getLinkableServiceRequestsForResident(residentSlug: string): ServiceMaintenanceTicket[] {
    const linked = new Set(getServiceMaintenanceTicketsForResident(residentSlug).map((t) => t.slug));
    return getServiceMaintenanceTickets().filter((t) => {
        if (linked.has(t.slug)) return false;
        if (t.residentSlug && t.residentSlug !== residentSlug) return false;
        return true;
    });
}

export function linkServiceRequestToResident(
    ticketSlug: string,
    residentSlug: string,
    propertyUnit: string,
): ServiceMaintenanceTicket | undefined {
    const unit = propertyUnit.trim();
    return updateServiceMaintenanceTicket(ticketSlug, {
        residentSlug,
        ...(unit ? { locationUnit: unit } : {}),
    });
}
