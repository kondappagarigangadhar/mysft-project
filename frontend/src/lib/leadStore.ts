'use client';

import { leads as mockLeads } from '@/data/mockData';
import { DEFAULT_LEAD_CROSS_REFS_BY_SLUG } from '@/lib/leadCrossRefSeed';

export type LeadStatus = 'New' | 'Qualified' | 'Lost';
export type LeadSource = 'Website' | 'Facebook Ads' | 'Google Ads' | 'Referral' | 'Walk-in' | 'Broker';
export type PropertyType = '1 BHK' | '2 BHK' | '3 BHK' | '4 BHK' | 'Villa' | 'Duplex' | 'Commercial';

/** Select options for **Preferred Unit Type** on lead forms (aligned with `PropertyType`). */
export const LEAD_PREFERRED_UNIT_TYPE_OPTIONS: PropertyType[] = [
    '1 BHK',
    '2 BHK',
    '3 BHK',
    '4 BHK',
    'Villa',
    'Duplex',
    'Commercial',
];

export type FollowUpInteraction = 'Call' | 'WhatsApp' | 'Meeting' | 'Visit';

export type FollowUpPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type FollowUpTaskStatus = 'open' | 'completed';
export type FollowUpOutcomeKey = 'call_done' | 'no_answer' | 'meeting_done' | 'interested' | 'callback' | 'other';
export type SiteVisitStatus = 'Scheduled' | 'Completed' | 'Cancelled';
export type LeadStage = 'New' | 'Qualified' | 'Proposal' | 'Closed';
export type ConversionStatus = 'Won' | 'Lost';

export interface LeadFollowUp {
    id: string;
    followUpDate: string; // YYYY-MM-DD
    /** HH:mm (24h), optional; defaults to 10:00 in UI */
    followUpTime?: string;
    interactionType: FollowUpInteraction;
    /** Free-text outcome; badge uses outcomeKey for styling */
    outcome?: string;
    outcomeKey: FollowUpOutcomeKey;
    notes: string;
    nextAction: string;
    priority: FollowUpPriority;
    status: FollowUpTaskStatus;
    /** When closed (defaults to followUpDate for legacy log rows) */
    completedAt?: string;
}

export interface LeadSiteVisit {
    id: string;
    visitDate: string; // YYYY-MM-DD
    visitStatus: SiteVisitStatus;
    remarks: string;
}

export interface LeadAssignment {
    assignedTo: string;
    assignmentDate: string; // YYYY-MM-DD
}

export interface LeadPipeline {
    leadStage: LeadStage;
    conversionProbability: number; // 0..100
}

export interface LeadConversion {
    conversionStatus: ConversionStatus;
    convertedDate: string; // YYYY-MM-DD
}

export interface LeadBroker {
    brokerName: string;
    commissionPercentage: number; // 0..100
}

export interface LeadNotifications {
    reminderEnabled: boolean;
}

/** CRM detail tab: timeline events (mock / API-ready). */
export interface LeadActivityEntry {
    id: string;
    type: 'call' | 'email' | 'meeting' | 'site_visit' | 'note' | 'system';
    title: string;
    body?: string;
    at: string; // ISO 8601
    actor: string;
}

/** Threaded comments on a lead (separate from the single `notes` summary field). */
export interface LeadThreadNote {
    id: string;
    body: string;
    author: string;
    createdAt: string; // ISO 8601
}

export interface LeadFileAttachment {
    id: string;
    fileName: string;
    sizeLabel: string;
    uploadedAt: string; // YYYY-MM-DD or ISO
    uploadedBy: string;
}

/** Linked booking (company-admin hub) — `bookingSlug` is primary key in `bookingPaymentMockStore`. */
export interface LeadLinkedBookingRef {
    id: string;
    bookingSlug: string;
}

/** Linked payment row in the payments ledger. */
export interface LeadLinkedPaymentRef {
    id: string;
    paymentSlug: string;
}

/** Linked compliance / document library row. */
export interface LeadLinkedDocumentRef {
    id: string;
    documentId: string;
}

export interface Lead {
    id: number;
    slug: string;
    // Core fields (Leads list + Lead Info page)
    name: string;
    phone: string;
    email: string;
    source: LeadSource;
    project: string;
    budgetRange: string;
    preferredUnitType: PropertyType;
    status: LeadStatus;
    assignedTo: string;
    brokerAgent: string;
    notes: string;
    /** Full postal address (house/plot, street, locality, city, state, PIN). */
    presentAddress: string;
    /** Full permanent address when different from present. */
    permanentAddress: string;
    createdDate: string; // YYYY-MM-DD

    /**
     * Audit — ISO 8601 (maps to API `created_at`).
     * Set once at creation; never changes in normal flows.
     */
    createdAt: string;
    /**
     * Audit — ISO 8601 (maps to API `updated_at`).
     * Bumped on any lead mutation (see `updateLead`).
     */
    updatedAt: string;

    // CRM sub-sections
    assignment: LeadAssignment;
    followUps: LeadFollowUp[];
    siteVisits: LeadSiteVisit[];
    pipeline: LeadPipeline;
    conversion: LeadConversion;
    broker: LeadBroker;
    notifications: LeadNotifications;

    activityLog: LeadActivityEntry[];
    threadNotes: LeadThreadNote[];
    attachments: LeadFileAttachment[];

    /** Cross-references to booking hub, payments ledger, and document library (persisted in localStorage). */
    linkedBookings: LeadLinkedBookingRef[];
    linkedPayments: LeadLinkedPaymentRef[];
    linkedDocuments: LeadLinkedDocumentRef[];

    /** AI / rules-based score 0–100 for prioritization. */
    leadScore: number;
    /** Soft-delete — ISO timestamp when archived (hidden from default lists). */
    deletedAt: string | null;
    /** Kanban pipeline column (Leads board). */
    kanbanColumn: KanbanColumnId;
}

/** Kanban columns aligned with enterprise pipeline naming. */
export type KanbanColumnId = 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed';

export function leadStageToKanbanColumn(stage: LeadStage): KanbanColumnId {
    switch (stage) {
        case 'New':
            return 'new';
        case 'Qualified':
            return 'qualified';
        case 'Proposal':
            return 'proposal';
        case 'Closed':
            return 'closed';
        default:
            return 'new';
    }
}

export function kanbanColumnToLeadStage(col: KanbanColumnId): LeadStage {
    switch (col) {
        case 'new':
            return 'New';
        case 'contacted':
        case 'qualified':
            return 'Qualified';
        case 'proposal':
            return 'Proposal';
        case 'closed':
            return 'Closed';
    }
}

/** Keeps CRM status badge (table) aligned with Kanban column moves. */
export function kanbanColumnToLeadStatus(col: KanbanColumnId): LeadStatus {
    switch (col) {
        case 'new':
            return 'New';
        case 'contacted':
        case 'qualified':
        case 'proposal':
        case 'closed':
            return 'Qualified';
    }
}

/**
 * Which pipeline column a lead should render in — CRM status is the source of truth:
 * New → New only; Qualified → contacted / qualified / proposal / closed; Lost → Proposal.
 */
export function resolveKanbanColumnForLead(lead: Lead): KanbanColumnId {
    if (lead.status === 'New') return 'new';
    if (lead.status === 'Lost') return 'proposal';
    if (lead.pipeline.leadStage === 'Closed' || lead.kanbanColumn === 'closed') return 'closed';
    if (lead.status === 'Qualified') {
        const k = lead.kanbanColumn;
        if (k === 'contacted' || k === 'qualified' || k === 'proposal') return k;
        if (k === 'new') return 'qualified';
        return 'qualified';
    }
    return lead.kanbanColumn ?? leadStageToKanbanColumn(lead.pipeline.leadStage);
}

/** Visual band for score coloring (green / yellow / red). */
export function leadScoreBand(score: number): 'high' | 'medium' | 'low' {
    const s = Math.max(0, Math.min(100, Math.round(score)));
    if (s >= 70) return 'high';
    if (s >= 40) return 'medium';
    return 'low';
}

const toYmd = (d: Date) => d.toISOString().slice(0, 10);

export const FOLLOW_UP_OUTCOME_KEY_LABEL: Record<FollowUpOutcomeKey, string> = {
    call_done: 'Call completed',
    no_answer: 'No answer',
    meeting_done: 'Meeting done',
    interested: 'Interested',
    callback: 'Callback requested',
    other: 'Other',
};

const PRIORITIES: readonly FollowUpPriority[] = ['Low', 'Medium', 'High', 'Urgent'] as const;
const OUTCOME_KEYS: readonly FollowUpOutcomeKey[] = [
    'call_done',
    'no_answer',
    'meeting_done',
    'interested',
    'callback',
    'other',
] as const;

function defaultOutcomeKey(i: FollowUpInteraction): FollowUpOutcomeKey {
    switch (i) {
        case 'Call':
            return 'call_done';
        case 'WhatsApp':
            return 'callback';
        case 'Meeting':
            return 'meeting_done';
        case 'Visit':
        default:
            return 'interested';
    }
}

function normalizeTimeLabel(raw: string | undefined): string {
    if (!raw?.trim() || !/^\d{1,2}:\d{2}$/.test(raw.trim())) return '10:00';
    const [hh, mm] = raw.trim().split(':') as [string, string];
    return `${String(Math.min(23, Math.max(0, parseInt(hh, 10) || 0))).padStart(2, '0')}:${String(Math.min(59, Math.max(0, parseInt(mm, 10) || 0))).padStart(2, '0')}`;
}

/**
 * Coerce follow-up records from older shapes (date-only, no status) into the CRM v2 model.
 * Rows without an explicit `status` are treated as completed historical log entries.
 */
export function normalizeFollowUp(fu: LeadFollowUp): LeadFollowUp {
    const followUpTime = normalizeTimeLabel(fu.followUpTime);

    const interaction: FollowUpInteraction = (
        ['Call', 'WhatsApp', 'Meeting', 'Visit'] as const
    ).includes(fu.interactionType as FollowUpInteraction)
        ? (fu.interactionType as FollowUpInteraction)
        : 'Call';

    const outcomeKey: FollowUpOutcomeKey = OUTCOME_KEYS.includes(
        fu.outcomeKey as FollowUpOutcomeKey,
    )
        ? (fu.outcomeKey as FollowUpOutcomeKey)
        : defaultOutcomeKey(interaction);

    const hasExplicitStatus =
        Object.prototype.hasOwnProperty.call(fu, 'status') && fu.status !== undefined && fu.status !== null;
    const status: FollowUpTaskStatus = hasExplicitStatus
        ? fu.status === 'completed'
            ? 'completed'
            : 'open'
        : 'completed';

    const priority: FollowUpPriority = PRIORITIES.includes(fu.priority as FollowUpPriority)
        ? (fu.priority as FollowUpPriority)
        : 'Medium';

    const label = fu.outcome?.trim() || FOLLOW_UP_OUTCOME_KEY_LABEL[outcomeKey];
    const completedAt =
        status === 'completed' ? (fu.completedAt?.trim() || fu.followUpDate) : undefined;

    return {
        ...fu,
        followUpTime,
        interactionType: interaction,
        outcomeKey,
        outcome: label,
        status,
        priority,
        completedAt,
    };
}

export function slugify(input: string) {
    return input
        .trim()
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

export function formatLeadCode(id: number) {
    return `AR-${id}`;
}

/** Lead view / audit: `21-04-2026 10:45 AM` in local time (en-IN style). */
export function formatLeadAuditTimestamp(iso: string | undefined | null): string {
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

/** Strip to the last 10 digits so +91 / spaces from imports still validate in forms. */
export function normalizeLeadPhoneDigits(input: string): string {
    const d = input.replace(/\D/g, '');
    if (d.length >= 10) return d.slice(-10);
    return d;
}

const mapToLeadStatus = (status: string): LeadStatus => {
    const s = status.toLowerCase();
    if (s === 'new') return 'New';
    if (s === 'lost') return 'Lost';
    // Everything else is considered "Qualified" for this CRM UI.
    return 'Qualified';
};

const mapToLeadStage = (status: string): LeadStage => {
    const s = status.toLowerCase();
    if (s === 'new') return 'New';
    if (s === 'site visit scheduled') return 'Qualified';
    if (s === 'closed') return 'Closed';
    if (s === 'lost') return 'Proposal';
    // Contacted / Interested / Negotiation / Booked
    return 'Proposal';
};

const stageToProgress = (stage: LeadStage) => {
    switch (stage) {
        case 'New':
            return 20;
        case 'Qualified':
            return 45;
        case 'Proposal':
            return 75;
        case 'Closed':
            return 100;
    }
};

const stageToConversionProbability = (stage: LeadStage) => stageToProgress(stage);

/** Maps CRM status dropdown to pipeline stage for core-field updates. */
const CRM_STATUS_TO_STAGE: Record<LeadStatus, LeadStage> = {
    New: 'New',
    Qualified: 'Qualified',
    Lost: 'Proposal',
};

const STAGE_PROBABILITY: Record<LeadStage, number> = {
    New: 20,
    Qualified: 45,
    Proposal: 75,
    Closed: 100,
};

function buildInitialLeadFromMock(l: (typeof mockLeads)[number], index: number): Lead {
    const createdDate = (l.createdDate || toYmd(new Date())) as string;
    const status = mapToLeadStatus(l.status);
    const leadStage = mapToLeadStage(l.status);
    const baseSlug = slugify(l.name);

    // Ensure stable unique slugs if names collide.
    const slug = `${baseSlug}${index === 0 ? '' : ''}`;

    const assignmentDate = createdDate;
    const brokerAgent = (l.brokerAgent || '') as string;
    const brokerCommission = 5 + ((l.id || index) % 10); // demo 5..14

    const oldF = toYmd(new Date(Date.now() - 1000 * 60 * 60 * 24 * 3));
    const todayStr = toYmd(new Date());
    const followUps: LeadFollowUp[] = [
        normalizeFollowUp({
            id: `${l.id}-fu-1`,
            followUpDate: createdDate,
            followUpTime: '10:30',
            interactionType: 'Call',
            outcome: 'Call completed',
            outcomeKey: 'call_done',
            notes: 'Initial discussion and requirement capture.',
            nextAction: 'Share project pricing and unit options.',
            priority: 'Medium',
            status: 'completed',
            completedAt: createdDate,
        }),
        normalizeFollowUp({
            id: `${l.id}-fu-2`,
            followUpDate: oldF,
            followUpTime: '16:00',
            interactionType: 'Meeting',
            outcome: 'Meeting done',
            outcomeKey: 'meeting_done',
            notes: 'Site presentation and next steps aligned.',
            nextAction: 'Schedule a follow-up call after customer review.',
            priority: 'High',
            status: 'completed',
            completedAt: oldF,
        }),
        normalizeFollowUp({
            id: `${l.id}-fu-3`,
            followUpDate: todayStr,
            followUpTime: '15:00',
            interactionType: 'WhatsApp',
            outcome: 'Callback requested',
            outcomeKey: 'callback',
            notes: 'Pinged on WhatsApp — customer will confirm slot after 2 PM.',
            nextAction: 'Call at 3 PM to lock site visit.',
            priority: 'Urgent',
            status: 'open',
        }),
    ];

    const siteVisits: LeadSiteVisit[] = l.status === 'Site Visit Scheduled'
        ? [
              {
                  id: `${l.id}-sv-1`,
                  visitDate: createdDate,
                  visitStatus: 'Scheduled',
                  remarks: 'Initial site visit scheduled based on customer preferences.',
              },
          ]
        : [];

    const conversionStatus: ConversionStatus = leadStage === 'Closed' ? 'Won' : status === 'Lost' ? 'Lost' : 'Won';

    const leadScore = Math.min(100, Math.max(12, 18 + ((l.id ?? index) * 17 + index * 11) % 82));
    let kanbanColumn: KanbanColumnId = leadStageToKanbanColumn(leadStage);
    if (leadStage === 'Qualified' && index % 2 === 0) kanbanColumn = 'contacted';

    const createdAt = `${createdDate}T09:00:00.000Z`;
    const updatedAt = new Date(new Date(createdAt).getTime() + 2 * 86400000 + index * 73 * 60000).toISOString();

    return {
        id: l.id,
        slug,
        name: l.name,
        phone: normalizeLeadPhoneDigits(l.phone),
        email: (l.email || '').toString(),
        source: l.source as LeadSource,
        project: (l.projectName || '') as string,
        budgetRange: (l.budgetRange || l.budget || '').toString(),
        preferredUnitType: l.propertyType as PropertyType,
        status,
        assignedTo: l.assignedTo || '',
        brokerAgent,
        notes: l.notes || '',
        presentAddress: '',
        permanentAddress: '',
        createdDate,
        createdAt,
        updatedAt,

        assignment: {
            assignedTo: l.assignedTo || '',
            assignmentDate,
        },
        followUps,
        siteVisits,
        pipeline: {
            leadStage,
            conversionProbability: stageToConversionProbability(leadStage),
        },
        conversion: {
            conversionStatus,
            convertedDate: createdDate,
        },
        broker: {
            brokerName: brokerAgent,
            commissionPercentage: brokerCommission,
        },
        notifications: {
            reminderEnabled: false,
        },

        activityLog: [
            {
                id: `${l.id}-act-1`,
                type: 'system',
                title: 'Lead captured',
                body: 'Lead created from marketing channel.',
                at: `${createdDate}T09:15:00.000Z`,
                actor: 'System',
            },
            {
                id: `${l.id}-act-2`,
                type: 'call',
                title: 'Discovery call',
                body: 'Captured requirements and preferred locality.',
                at: `${createdDate}T11:40:00.000Z`,
                actor: l.assignedTo || 'Sales',
            },
            {
                id: `${l.id}-act-3`,
                type: 'email',
                title: 'Brochure shared',
                body: 'Sent project brochure and floor plans.',
                at: `${createdDate}T15:05:00.000Z`,
                actor: l.assignedTo || 'Sales',
            },
        ],
        threadNotes: [
            {
                id: `${l.id}-tn-1`,
                body: l.notes?.trim()
                    ? `Summary: ${l.notes.slice(0, 120)}${l.notes.length > 120 ? '…' : ''}`
                    : 'Initial qualification notes will appear here.',
                author: l.assignedTo || 'Sales',
                createdAt: `${createdDate}T10:20:00.000Z`,
            },
        ],
        attachments: [
            {
                id: `${l.id}-att-1`,
                fileName: 'Lead_Requirements.pdf',
                sizeLabel: '128 KB',
                uploadedAt: createdDate,
                uploadedBy: l.assignedTo || 'Sales',
            },
        ],

        linkedBookings: [],
        linkedPayments: [],
        linkedDocuments: [],

        leadScore,
        deletedAt: null,
        kanbanColumn,
    };
}

const _initialLeads: Lead[] = mockLeads.map((l, i) => buildInitialLeadFromMock(l, i));

let _leads: Lead[] = (() => {
    const seen = new Map<string, number>();
    return _initialLeads.map((lead) => {
        const current = seen.get(lead.slug) ?? 0;
        const next = current + 1;
        seen.set(lead.slug, next);
        if (current === 0) return lead;
        return { ...lead, slug: `${lead.slug}-${next}` };
    });
})();

const CROSS_REFS_LS_KEY = 'arris-lead-cross-refs-v3';

type CrossRefsStored = {
    linkedBookings: LeadLinkedBookingRef[];
    linkedPayments: LeadLinkedPaymentRef[];
    linkedDocuments: LeadLinkedDocumentRef[];
};

function persistCrossRefsToLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
        const map: Record<string, CrossRefsStored> = {};
        for (const l of _leads) {
            map[l.slug] = {
                linkedBookings: l.linkedBookings ?? [],
                linkedPayments: l.linkedPayments ?? [],
                linkedDocuments: l.linkedDocuments ?? [],
            };
        }
        localStorage.setItem(CROSS_REFS_LS_KEY, JSON.stringify(map));
    } catch {
        /* quota */
    }
}

function hydrateCrossRefsFromLocalStorage(): void {
    if (typeof window === 'undefined') return;
    try {
        const raw = localStorage.getItem(CROSS_REFS_LS_KEY);
        if (!raw) return;
        const map = JSON.parse(raw) as Record<string, CrossRefsStored>;
        _leads = _leads.map((l) => {
            const x = map[l.slug];
            if (!x) {
                return {
                    ...l,
                    linkedBookings: l.linkedBookings ?? [],
                    linkedPayments: l.linkedPayments ?? [],
                    linkedDocuments: l.linkedDocuments ?? [],
                };
            }
            return {
                ...l,
                linkedBookings: Array.isArray(x.linkedBookings) ? x.linkedBookings : [],
                linkedPayments: Array.isArray(x.linkedPayments) ? x.linkedPayments : [],
                linkedDocuments: Array.isArray(x.linkedDocuments) ? x.linkedDocuments : [],
            };
        });
    } catch {
        /* invalid */
    }
}

function applyDefaultLeadCrossReferences(): void {
    _leads = _leads.map((lead) => {
        const seed = DEFAULT_LEAD_CROSS_REFS_BY_SLUG[lead.slug];
        if (!seed) return lead;
        return {
            ...lead,
            linkedBookings: seed.linkedBookings,
            linkedPayments: seed.linkedPayments,
            linkedDocuments: seed.linkedDocuments,
        };
    });
}

/** Re-apply demo cross-refs when localStorage has empty links for seeded slugs. */
function mergeSeededCrossRefsIfEmpty(): void {
    _leads = _leads.map((lead) => {
        const seed = DEFAULT_LEAD_CROSS_REFS_BY_SLUG[lead.slug];
        if (!seed) return lead;
        const hasAny =
            (lead.linkedBookings?.length ?? 0) > 0 ||
            (lead.linkedPayments?.length ?? 0) > 0 ||
            (lead.linkedDocuments?.length ?? 0) > 0;
        if (hasAny) return lead;
        return {
            ...lead,
            linkedBookings: seed.linkedBookings,
            linkedPayments: seed.linkedPayments,
            linkedDocuments: seed.linkedDocuments,
        };
    });
}

applyDefaultLeadCrossReferences();
hydrateCrossRefsFromLocalStorage();
mergeSeededCrossRefsIfEmpty();

function leadWithCrossRefDefaults(l: Lead): Lead {
    const ymd = l.createdDate || toYmd(new Date());
    const createdFallback = `${ymd}T00:00:00.000Z`;
    const createdAt = l.createdAt?.trim() ? l.createdAt : createdFallback;
    const updatedAt = l.updatedAt?.trim() ? l.updatedAt : createdAt;
    return {
        ...l,
        presentAddress: l.presentAddress ?? '',
        permanentAddress: l.permanentAddress ?? '',
        linkedBookings: l.linkedBookings ?? [],
        linkedPayments: l.linkedPayments ?? [],
        linkedDocuments: l.linkedDocuments ?? [],
        followUps: (l.followUps ?? []).map((fu) => normalizeFollowUp(fu as LeadFollowUp)),
        createdAt,
        updatedAt,
    };
}

let _nextLeadId = (_leads.reduce((max, l) => Math.max(max, l.id), 0) || 0) + 1;

export function getNextLeadCode() {
    return formatLeadCode(_nextLeadId);
}

function ensureUniqueSlug(slug: string) {
    if (!_leads.some(l => l.slug === slug)) return slug;
    let i = 2;
    while (_leads.some(l => l.slug === `${slug}-${i}`)) i++;
    return `${slug}-${i}`;
}

/** Triggers hybrid AI scoring service (debounced) — LeadCreated / LeadUpdated / etc. */
function notifyAISalesRecalc(
    slug: string,
    event: 'LeadCreated' | 'LeadUpdated' | 'FollowUpAdded' | 'VisitCompleted' | 'StageChanged',
): void {
    if (typeof window === 'undefined') return;
    void import('@/lib/ai-sales-intelligence/aiSalesEvents').then((m) => m.queueAISalesRecalculation(slug, event));
}

export function getLeads(): Lead[] {
    return _leads.filter((l) => !l.deletedAt).map(leadWithCrossRefDefaults);
}

export function getLeadBySlug(slug: string): Lead | undefined {
    const l = _leads.find((x) => x.slug === slug);
    if (!l || l.deletedAt) return undefined;
    return leadWithCrossRefDefaults(l);
}

/** Active or archived — for detail view and admin recovery flows. */
export function getLeadBySlugIncludingArchived(slug: string): Lead | undefined {
    const l = _leads.find((x) => x.slug === slug);
    if (!l) return undefined;
    return leadWithCrossRefDefaults(l);
}

export function getArchivedLeads(): Lead[] {
    return _leads
        .filter((l) => !!l.deletedAt)
        .map(leadWithCrossRefDefaults)
        .sort((a, b) => (b.deletedAt ?? '').localeCompare(a.deletedAt ?? ''));
}

/** Resolve a lead by display code, e.g. `AR-1` (same as booking “Lead ID”). */
export function getLeadByLeadCode(code: string): Lead | undefined {
    const c = code.trim();
    if (!c) return undefined;
    const l = _leads.find((x) => formatLeadCode(x.id) === c);
    if (!l || l.deletedAt) return undefined;
    return leadWithCrossRefDefaults(l);
}

/** Quick-create path for streamlined CRM forms (defaults for inventory fields until API provides them). */
export function addLeadFromCoreFields(input: {
    name: string;
    phone: string;
    email: string;
    source: LeadSource;
    status: LeadStatus;
    assignedTo: string;
    notes: string;
    project: string;
    budgetRange: string;
    preferredUnitType: PropertyType;
    presentAddress?: string;
    permanentAddress?: string;
}): Lead {
    return addLead({
        name: input.name,
        phone: input.phone,
        email: input.email,
        source: input.source,
        project: input.project.trim() || 'Unassigned',
        budgetRange: input.budgetRange.trim() || '0',
        preferredUnitType: input.preferredUnitType,
        status: input.status,
        assignedTo: input.assignedTo,
        brokerAgent: '',
        notes: input.notes,
        presentAddress: input.presentAddress?.trim() ?? '',
        permanentAddress: input.permanentAddress?.trim() ?? '',
    });
}

export function addLead(input: {
    name: string;
    phone: string;
    email: string;
    source: LeadSource;
    project: string;
    budgetRange: string;
    preferredUnitType: PropertyType;
    status: LeadStatus;
    assignedTo: string;
    brokerAgent: string;
    notes: string;
    presentAddress?: string;
    permanentAddress?: string;
}): Lead {
    const createdDate = toYmd(new Date());
    const baseSlug = slugify(input.name);
    const slug = ensureUniqueSlug(baseSlug || `lead-${_nextLeadId}`);

    const leadStage: LeadStage = input.status === 'New' ? 'New' : input.status === 'Lost' ? 'Proposal' : 'Qualified';

    const newId = _nextLeadId++;
    const nowIso = new Date().toISOString();

    const lead: Lead = {
        id: newId,
        slug,
        name: input.name,
        phone: normalizeLeadPhoneDigits(input.phone),
        email: input.email,
        source: input.source,
        project: input.project,
        budgetRange: input.budgetRange,
        preferredUnitType: input.preferredUnitType,
        status: input.status,
        assignedTo: input.assignedTo,
        brokerAgent: input.brokerAgent,
        notes: input.notes,
        presentAddress: input.presentAddress?.trim() ?? '',
        permanentAddress: input.permanentAddress?.trim() ?? '',
        createdDate,
        createdAt: nowIso,
        updatedAt: nowIso,

        assignment: {
            assignedTo: input.assignedTo,
            assignmentDate: createdDate,
        },
        followUps: [],
        siteVisits: [],
        pipeline: {
            leadStage,
            conversionProbability: stageToConversionProbability(leadStage),
        },
        conversion: {
            conversionStatus: input.status === 'Lost' ? 'Lost' : 'Won',
            convertedDate: createdDate,
        },
        broker: {
            brokerName: input.brokerAgent,
            commissionPercentage: 7,
        },
        notifications: {
            reminderEnabled: false,
        },

        activityLog: [
            {
                id: `act-${newId}-1`,
                type: 'system',
                title: 'Lead created',
                body: 'Lead record created in CRM.',
                at: new Date().toISOString(),
                actor: 'You',
            },
        ],
        threadNotes: [],
        attachments: [],

        linkedBookings: [],
        linkedPayments: [],
        linkedDocuments: [],

        leadScore: Math.min(92, Math.max(28, 35 + (newId * 13) % 55)),
        deletedAt: null,
        kanbanColumn: leadStageToKanbanColumn(leadStage),
    };

    _leads = [..._leads, lead];
    persistCrossRefsToLocalStorage();
    notifyAISalesRecalc(slug, 'LeadCreated');
    return lead;
}

export function updateLead(slug: string, updates: Partial<Omit<Lead, 'id' | 'slug'>>): Lead | undefined {
    const raw = _leads.find((l) => l.slug === slug);
    if (!raw) return undefined;
    const nowIso = new Date().toISOString();
    const next = _leads.map((l) => {
        if (l.slug !== slug) return l;
        const merged = { ...l, ...updates, updatedAt: nowIso } as Lead;
        merged.createdAt = l.createdAt;
        return merged;
    });
    const updated = next.find((k) => k.slug === slug);
    _leads = next;
    if (updated) notifyAISalesRecalc(slug, 'LeadUpdated');
    return updated ? leadWithCrossRefDefaults(updated) : undefined;
}

/** Append a file row to the lead attachments list (demo / client-side until upload API exists). */
export function addLeadAttachment(
    slug: string,
    row: Omit<LeadFileAttachment, 'id'> & { id?: string },
): Lead | undefined {
    const lead = getLeadBySlug(slug);
    if (!lead) return undefined;
    const id = row.id?.trim() || `att-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    const next: LeadFileAttachment = {
        id,
        fileName: row.fileName.trim(),
        sizeLabel: row.sizeLabel.trim(),
        uploadedAt: row.uploadedAt.trim(),
        uploadedBy: row.uploadedBy.trim(),
    };
    return updateLead(slug, { attachments: [...lead.attachments, next] });
}

export function updateLeadAttachment(
    slug: string,
    attachmentId: string,
    patch: Partial<Omit<LeadFileAttachment, 'id'>>,
): Lead | undefined {
    const lead = getLeadBySlug(slug);
    if (!lead) return undefined;
    const idx = lead.attachments.findIndex((a) => a.id === attachmentId);
    if (idx < 0) return undefined;
    const prev = lead.attachments[idx]!;
    const next: LeadFileAttachment = {
        ...prev,
        fileName: patch.fileName !== undefined ? patch.fileName.trim() : prev.fileName,
        sizeLabel: patch.sizeLabel !== undefined ? patch.sizeLabel.trim() : prev.sizeLabel,
        uploadedAt: patch.uploadedAt !== undefined ? patch.uploadedAt.trim() : prev.uploadedAt,
        uploadedBy: patch.uploadedBy !== undefined ? patch.uploadedBy.trim() : prev.uploadedBy,
    };
    const attachments = [...lead.attachments];
    attachments[idx] = next;
    return updateLead(slug, { attachments });
}

export function removeLeadAttachment(slug: string, attachmentId: string): Lead | undefined {
    const lead = getLeadBySlug(slug);
    if (!lead) return undefined;
    const next = lead.attachments.filter((a) => a.id !== attachmentId);
    if (next.length === lead.attachments.length) return undefined;
    return updateLead(slug, { attachments: next });
}

/** Soft-delete (archives lead — hidden from default lists). */
export function deleteLead(slug: string): boolean {
    const lead = _leads.find((l) => l.slug === slug && !l.deletedAt);
    if (!lead) return false;
    const ts = new Date().toISOString();
    _leads = _leads.map((l) => (l.slug === slug ? { ...l, deletedAt: ts, updatedAt: ts } : l));
    persistCrossRefsToLocalStorage();
    return true;
}

/** Move an archived lead back to the active list. */
export function restoreLead(slug: string): boolean {
    const lead = _leads.find((l) => l.slug === slug && l.deletedAt);
    if (!lead) return false;
    const u = new Date().toISOString();
    _leads = _leads.map((k) => (k.slug === slug ? { ...k, deletedAt: null, updatedAt: u } : k));
    persistCrossRefsToLocalStorage();
    return true;
}

/** Move lead on Kanban — updates pipeline stage, column, CRM status (table), and conversion. */
export function updateLeadKanbanColumn(slug: string, col: KanbanColumnId): Lead | undefined {
    const raw = _leads.find((l) => l.slug === slug && !l.deletedAt);
    if (!raw) return undefined;
    const nextStage = kanbanColumnToLeadStage(col);
    const nextStatus = kanbanColumnToLeadStatus(col);
    const result = updateLead(slug, {
        kanbanColumn: col,
        status: nextStatus,
        pipeline: {
            leadStage: nextStage,
            conversionProbability: STAGE_PROBABILITY[nextStage],
        },
        conversion: {
            ...raw.conversion,
            conversionStatus:
                nextStage === 'Closed' ? 'Won' : raw.conversion.conversionStatus === 'Lost' ? 'Won' : raw.conversion.conversionStatus,
        },
    });
    if (result) notifyAISalesRecalc(slug, 'StageChanged');
    return result;
}

export function duplicateLead(slug: string): Lead | undefined {
    const src = _leads.find((l) => l.slug === slug && !l.deletedAt);
    if (!src) return undefined;
    const createdDate = toYmd(new Date());
    const baseName = `${src.name} (Copy)`;
    const newSlug = ensureUniqueSlug(slugify(baseName) || `lead-${_nextLeadId}`);
    const nowClone = new Date().toISOString();

    const copy: Lead = {
        ...src,
        id: _nextLeadId++,
        slug: newSlug,
        name: baseName,
        createdDate,
        createdAt: nowClone,
        updatedAt: nowClone,
        deletedAt: null,
        linkedBookings: [],
        linkedPayments: [],
        linkedDocuments: [],
        assignment: {
            ...src.assignment,
            assignmentDate: createdDate,
        },
        activityLog: [
            ...src.activityLog,
            {
                id: `act-dup-${Date.now()}`,
                type: 'system',
                title: 'Lead cloned',
                body: `Duplicated from ${formatLeadCode(src.id)}.`,
                at: new Date().toISOString(),
                actor: 'You',
            },
        ],
    };

    _leads = [..._leads, copy];
    persistCrossRefsToLocalStorage();
    return copy;
}

export function addLeadThreadNote(slug: string, body: string, author: string): Lead | undefined {
    const lead = getLeadBySlug(slug);
    if (!lead) return undefined;
    const note: LeadThreadNote = {
        id: `tn-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        body: body.trim(),
        author: author.trim() || 'You',
        createdAt: new Date().toISOString(),
    };
    return updateLead(slug, { threadNotes: [...lead.threadNotes, note] });
}

export function addLeadActivityEntry(slug: string, entry: Omit<LeadActivityEntry, 'id'>): Lead | undefined {
    const lead = getLeadBySlug(slug);
    if (!lead) return undefined;
    const full: LeadActivityEntry = {
        ...entry,
        id: `act-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    };
    return updateLead(slug, { activityLog: [...lead.activityLog, full] });
}

/** Updates the streamlined CRM form fields while preserving project, inventory, and history. */
export function updateLeadCoreFields(
    slug: string,
    patch: {
        name: string;
        phone: string;
        email: string;
        source: LeadSource;
        status: LeadStatus;
        assignedTo: string;
        notes: string;
        project: string;
        budgetRange: string;
        preferredUnitType: PropertyType;
        presentAddress?: string;
        permanentAddress?: string;
    },
): Lead | undefined {
    const lead = getLeadBySlugIncludingArchived(slug);
    if (!lead) return undefined;
    const nextStage = CRM_STATUS_TO_STAGE[patch.status];
    return updateLead(slug, {
        name: patch.name.trim(),
        phone: normalizeLeadPhoneDigits(patch.phone),
        email: patch.email.trim(),
        source: patch.source,
        status: patch.status,
        assignedTo: patch.assignedTo,
        notes: patch.notes,
        presentAddress: patch.presentAddress?.trim() ?? '',
        permanentAddress: patch.permanentAddress?.trim() ?? '',
        project: patch.project.trim() || lead.project,
        budgetRange: patch.budgetRange.trim(),
        preferredUnitType: patch.preferredUnitType,
        kanbanColumn: leadStageToKanbanColumn(nextStage),
        assignment: {
            ...lead.assignment,
            assignedTo: patch.assignedTo,
        },
        pipeline: {
            leadStage: nextStage,
            conversionProbability: STAGE_PROBABILITY[nextStage],
        },
        conversion: {
            ...lead.conversion,
            conversionStatus:
                patch.status === 'Lost' ? 'Lost' : nextStage === 'Closed' ? 'Won' : lead.conversion.conversionStatus,
        },
    });
}

/** Applies partial updates for lead overview fields while preserving dependent pipeline state. */
export function patchLeadCoreFields(
    slug: string,
    patch: Partial<{
        name: string;
        phone: string;
        email: string;
        source: LeadSource;
        status: LeadStatus;
        assignedTo: string;
        notes: string;
        project: string;
        budgetRange: string;
        preferredUnitType: PropertyType;
        presentAddress: string;
        permanentAddress: string;
    }>,
): Lead | undefined {
    const lead = getLeadBySlugIncludingArchived(slug);
    if (!lead) return undefined;
    const hasAny = Object.keys(patch).length > 0;
    if (!hasAny) return lead;
    const nextStatus = patch.status ?? lead.status;
    const nextStage = CRM_STATUS_TO_STAGE[nextStatus];
    const nextAssignedTo = patch.assignedTo ?? lead.assignedTo;

    return updateLead(slug, {
        ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
        ...(patch.phone !== undefined ? { phone: normalizeLeadPhoneDigits(patch.phone) } : {}),
        ...(patch.email !== undefined ? { email: patch.email.trim() } : {}),
        ...(patch.source !== undefined ? { source: patch.source } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.assignedTo !== undefined ? { assignedTo: nextAssignedTo } : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
        ...(patch.presentAddress !== undefined ? { presentAddress: patch.presentAddress.trim() } : {}),
        ...(patch.permanentAddress !== undefined ? { permanentAddress: patch.permanentAddress.trim() } : {}),
        ...(patch.project !== undefined ? { project: patch.project.trim() || lead.project } : {}),
        ...(patch.budgetRange !== undefined ? { budgetRange: patch.budgetRange.trim() } : {}),
        ...(patch.preferredUnitType !== undefined ? { preferredUnitType: patch.preferredUnitType } : {}),
        ...(patch.status !== undefined
            ? {
                  kanbanColumn: leadStageToKanbanColumn(nextStage),
                  pipeline: {
                      leadStage: nextStage,
                      conversionProbability: STAGE_PROBABILITY[nextStage],
                  },
                  conversion: {
                      ...lead.conversion,
                      conversionStatus:
                          patch.status === 'Lost' ? 'Lost' : nextStage === 'Closed' ? 'Won' : lead.conversion.conversionStatus,
                  },
              }
            : {}),
        ...(patch.assignedTo !== undefined
            ? {
                  assignment: {
                      ...lead.assignment,
                      assignedTo: nextAssignedTo,
                  },
              }
            : {}),
    });
}

/** Persist linked bookings / payments / documents for a lead (localStorage). */
export function setLeadCrossReferences(
    slug: string,
    patch: Partial<Pick<Lead, 'linkedBookings' | 'linkedPayments' | 'linkedDocuments'>>,
): Lead | undefined {
    const raw = _leads.find((l) => l.slug === slug);
    if (!raw) return undefined;
    const nextBookings = patch.linkedBookings ?? raw.linkedBookings ?? [];
    const nextPayments = patch.linkedPayments ?? raw.linkedPayments ?? [];
    const nextDocuments = patch.linkedDocuments ?? raw.linkedDocuments ?? [];
    const updated = updateLead(slug, {
        linkedBookings: nextBookings,
        linkedPayments: nextPayments,
        linkedDocuments: nextDocuments,
    });
    persistCrossRefsToLocalStorage();
    return updated;
}

export function bulkDeleteLeads(slugs: string[]): number {
    const set = new Set(slugs);
    const ts = new Date().toISOString();
    let count = 0;
    _leads = _leads.map((l) => {
        if (!set.has(l.slug) || l.deletedAt) return l;
        count++;
        return { ...l, deletedAt: ts, updatedAt: ts };
    });
    if (count > 0) persistCrossRefsToLocalStorage();
    return count;
}

export function bulkAssignLeads(slugs: string[], assignedTo: string): void {
    const d = toYmd(new Date());
    for (const slug of slugs) {
        const lead = getLeadBySlug(slug);
        if (!lead) continue;
        updateLead(slug, {
            assignedTo,
            assignment: { assignedTo, assignmentDate: d },
        });
    }
}

export function bulkSetLeadStatus(slugs: string[], status: LeadStatus): void {
    for (const slug of slugs) {
        const lead = getLeadBySlug(slug);
        if (!lead) continue;
        const nextStage = CRM_STATUS_TO_STAGE[status];
        updateLead(slug, {
            status,
            kanbanColumn: leadStageToKanbanColumn(nextStage),
            pipeline: {
                leadStage: nextStage,
                conversionProbability: STAGE_PROBABILITY[nextStage],
            },
            conversion: {
                ...lead.conversion,
                conversionStatus: status === 'Lost' ? 'Lost' : lead.conversion.conversionStatus,
            },
        });
    }
}

export function setLeadAssignment(slug: string, assignment: LeadAssignment): Lead | undefined {
    return updateLead(slug, {
        assignment,
        assignedTo: assignment.assignedTo,
    });
}

export function addFollowUp(slug: string, followUp: Omit<LeadFollowUp, 'id'>): Lead | undefined {
    const lead = getLeadBySlug(slug);
    if (!lead) return undefined;
    const id = `fu-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const row = normalizeFollowUp({ ...followUp, id } as LeadFollowUp);
    const result = updateLead(slug, {
        followUps: [...lead.followUps, row],
    });
    if (result) notifyAISalesRecalc(slug, 'FollowUpAdded');
    return result;
}

export function updateFollowUp(
    slug: string,
    followUpId: string,
    patch: Partial<Omit<LeadFollowUp, 'id'>>,
): Lead | undefined {
    const lead = getLeadBySlug(slug);
    if (!lead) return undefined;
    const followUps = lead.followUps.map((fu) => {
        if (fu.id !== followUpId) return fu;
        return normalizeFollowUp({ ...fu, ...patch, id: fu.id });
    });
    return updateLead(slug, { followUps });
}

export function deleteFollowUp(slug: string, followUpId: string): Lead | undefined {
    const lead = getLeadBySlug(slug);
    if (!lead) return undefined;
    const followUps = lead.followUps.filter((fu) => fu.id !== followUpId);
    return updateLead(slug, { followUps });
}

export function setSiteVisit(slug: string, visit: Omit<LeadSiteVisit, 'id'>): Lead | undefined {
    const lead = getLeadBySlug(slug);
    if (!lead) return undefined;
    const id = `sv-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const result = updateLead(slug, {
        siteVisits: [...lead.siteVisits, { ...visit, id }],
    });
    if (result && visit.visitStatus === 'Completed') notifyAISalesRecalc(slug, 'VisitCompleted');
    return result;
}

export function setPipeline(slug: string, pipeline: LeadPipeline): Lead | undefined {
    return updateLead(slug, { pipeline });
}

export function setConversion(slug: string, conversion: LeadConversion): Lead | undefined {
    return updateLead(slug, { conversion });
}

export function setBroker(slug: string, broker: LeadBroker): Lead | undefined {
    return updateLead(slug, { broker, brokerAgent: broker.brokerName });
}

export function setNotifications(slug: string, notifications: LeadNotifications): Lead | undefined {
    return updateLead(slug, { notifications });
}

