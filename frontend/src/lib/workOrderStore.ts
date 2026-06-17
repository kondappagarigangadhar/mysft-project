'use client';

import { MOCK_VENDORS } from '@/lib/vendors/mockData';
import { resolveVendorIdByName } from '@/lib/vendors/vendorWorkOrders';

export type WorkType = 'Plumbing' | 'Electrical' | 'Civil' | 'Interior' | 'HVAC' | 'Construction' | 'Other';
export type IssueType = 'Plumbing Work' | 'Electrical Work' | 'Other';
export type WorkOrderPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type SlaStatus = 'On Track' | 'Delayed' | 'At Risk';
export type WorkOrderStatus = 'Draft' | 'Open' | 'Assigned' | 'In Progress' | 'On Hold' | 'Completed' | 'Verified' | 'Cancelled';
export type VerificationStatus = 'Approved' | 'Rework Needed' | 'Rejected';
export type PaymentStatus = 'Pending' | 'Partial' | 'Paid';

export type WorkOrderLocationDetails = {
    flat: string;
    block: string;
    tower: string;
    plot: string;
    area: string;
};

export type WorkOrderVendorAssignment = {
    vendorId: string;
    vendorName: string;
    assignedDate: string; // YYYY-MM-DD
    assignedBy: string;
    estimatedCost: string;
    estimatedDurationDays: number | null;
};

export type WorkOrderScheduling = {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    slaStatus: SlaStatus;
};

export type WorkOrderLifecycle = {
    status: WorkOrderStatus;
    statusUpdatedBy: string;
    statusUpdatedAt: string; // ISO
};

export type WorkOrderProgressUpdate = {
    id: string;
    at: string; // ISO
    actor: string;
    notes: string;
    completionPct: number; // 0..100
    images: { id: string; fileName: string; sizeLabel: string; url: string }[];
};

export type WorkOrderCompletion = {
    completionDate: string; // YYYY-MM-DD
    verifiedBy: string;
    verificationStatus: VerificationStatus | '';
    remarks: string;
    proofImages: { id: string; fileName: string; sizeLabel: string; url: string; uploadedAt: string; uploadedBy: string }[];
};

export type WorkOrderFinance = {
    actualCost: string;
    paymentStatus: PaymentStatus;
    invoiceReference: string;
    paymentLinkHref: string;
};

export type WorkOrderAttachmentCategory =
    | 'BOQ'
    | 'Drawings'
    | 'Work Images'
    | 'Agreements'
    | 'Site Documents'
    | 'Completion Documents'
    | 'Other';

export type WorkOrderAttachment = {
    id: string;
    category: WorkOrderAttachmentCategory;
    fileName: string;
    sizeLabel: string;
    uploadedAt: string; // ISO
    uploadedBy: string;
};

export type WorkOrderNotificationSettings = {
    notifyVendor: boolean;
    slaBreachAlert: boolean;
    completionUpdates: boolean;
    assignmentNotifications: boolean;
};

export type WorkOrderActivityEntry = {
    id: string;
    at: string; // ISO
    actor: string;
    title: string;
    body?: string;
    actionType?: string;
    severity?: 'info' | 'success' | 'warning' | 'critical';
};

export type WorkOrder = {
    id: number;
    slug: string;
    workOrderId: string; // e.g. WO-1001

    title: string;
    description: string;
    workType: WorkType | '';
    issueType: IssueType | '';
    projectOrProperty: string;
    location: WorkOrderLocationDetails;
    priority: WorkOrderPriority | '';
    requestedBy: string;
    requestedAt: string; // ISO

    vendor: WorkOrderVendorAssignment;
    scheduling: WorkOrderScheduling;
    lifecycle: WorkOrderLifecycle;
    progressUpdates: WorkOrderProgressUpdate[];
    completion: WorkOrderCompletion;
    finance: WorkOrderFinance;
    attachments: WorkOrderAttachment[];
    notifications: WorkOrderNotificationSettings;

    activityLog: WorkOrderActivityEntry[];

    createdAt: string; // ISO
    updatedAt: string; // ISO

    /** Soft-archive — ISO timestamp when archived (hidden from default lists). */
    archivedAt: string | null;

    /** Linked service maintenance ticket (when auto-created from SR). */
    linkedServiceRequestSlug?: string;
    linkedServiceRequestCode?: string;
    linkedResidentSlug?: string;
};

const STORAGE_KEY = 'arris-work-orders-v2';
const LEGACY_STORAGE_KEY = 'arris-work-orders-v1';

function nowIso() {
    return new Date().toISOString();
}

const toYmd = (d: Date) => d.toISOString().slice(0, 10);

function safeJsonParse<T>(raw: string | null): T | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

function slugify(input: string) {
    return input
        .trim()
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function ensureUniqueSlug(base: string, existing: WorkOrder[]): string {
    const b = base.trim() || 'work-order';
    if (!existing.some((x) => x.slug === b)) return b;
    let i = 2;
    while (existing.some((x) => x.slug === `${b}-${i}`)) i++;
    return `${b}-${i}`;
}

export function formatWorkOrderCode(id: number) {
    const n = Math.max(0, Math.floor(id));
    return `WO-${String(1000 + n)}`;
}

function normalizePct(v: number): number {
    if (!Number.isFinite(v)) return 0;
    return Math.max(0, Math.min(100, Math.round(v)));
}

function normalizeVendorAssignment(vendor: WorkOrderVendorAssignment | undefined): WorkOrderVendorAssignment {
    const name = vendor?.vendorName?.trim() ?? '';
    const vendorId = vendor?.vendorId?.trim() || resolveVendorIdByName(name);
    return {
        vendorId,
        vendorName: name,
        assignedDate: vendor?.assignedDate ?? '',
        assignedBy: vendor?.assignedBy ?? '',
        estimatedCost: vendor?.estimatedCost ?? '',
        estimatedDurationDays: vendor?.estimatedDurationDays ?? null,
    };
}

function hydrateFromLocalStorage(): WorkOrder[] {
    if (typeof window === 'undefined') return [];
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
            try {
                window.localStorage.setItem(STORAGE_KEY, legacy);
                window.localStorage.removeItem(LEGACY_STORAGE_KEY);
            } catch {
                // ignore
            }
            raw = legacy;
        }
    }
    const parsed = safeJsonParse<WorkOrder[]>(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((w) => ({
        ...w,
        issueType: ((w as { issueType?: IssueType | '' }).issueType ?? '') as IssueType | '',
        location: w.location ?? { flat: '', block: '', tower: '', plot: '', area: '' },
        vendor: normalizeVendorAssignment(w.vendor),
        scheduling: w.scheduling ?? { startDate: '', endDate: '', slaStatus: 'On Track' },
        lifecycle: w.lifecycle ?? { status: 'Draft', statusUpdatedBy: '', statusUpdatedAt: nowIso() },
        progressUpdates: Array.isArray(w.progressUpdates)
            ? w.progressUpdates.map((u: any) => ({
                  ...u,
                  images: Array.isArray(u?.images)
                      ? u.images.map((img: any) => ({
                            id: String(img?.id ?? `img-${Date.now()}`),
                            fileName: String(img?.fileName ?? 'image'),
                            sizeLabel: String(img?.sizeLabel ?? ''),
                            url: String(img?.url ?? ''),
                        }))
                      : [],
              }))
            : [],
        completion: w.completion
            ? {
                  completionDate: (w.completion as any).completionDate ?? '',
                  verifiedBy: (w.completion as any).verifiedBy ?? '',
                  verificationStatus: ((w.completion as any).verificationStatus ?? '') as any,
                  remarks: (w.completion as any).remarks ?? '',
                  proofImages: Array.isArray((w.completion as any).proofImages)
                      ? (w.completion as any).proofImages.map((img: any) => ({
                            id: String(img?.id ?? `proof-${Date.now()}`),
                            fileName: String(img?.fileName ?? 'image'),
                            sizeLabel: String(img?.sizeLabel ?? ''),
                            url: String(img?.url ?? ''),
                            uploadedAt: String(img?.uploadedAt ?? nowIso()),
                            uploadedBy: String(img?.uploadedBy ?? ''),
                        }))
                      : [],
              }
            : { completionDate: '', verifiedBy: '', verificationStatus: '', remarks: '', proofImages: [] },
        finance: w.finance ?? { actualCost: '', paymentStatus: 'Pending', invoiceReference: '', paymentLinkHref: '' },
        attachments: Array.isArray(w.attachments) ? w.attachments : [],
        notifications: w.notifications ?? {
            notifyVendor: true,
            slaBreachAlert: true,
            completionUpdates: true,
            assignmentNotifications: true,
        },
        activityLog: Array.isArray(w.activityLog) ? w.activityLog : [],
        createdAt: w.createdAt ?? nowIso(),
        updatedAt: w.updatedAt ?? w.createdAt ?? nowIso(),
        archivedAt: (w as { archivedAt?: string | null }).archivedAt ?? null,
    }));
}

function persistToLocalStorage(all: WorkOrder[]) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
        // ignore quota
    }
}

type VendorWorkOrderSeedItem = {
    title: string;
    type: WorkType;
    priority: WorkOrderPriority;
    status: WorkOrderStatus;
    slaStatus: SlaStatus;
};

function buildSeedWorkOrders(): WorkOrder[] {
    const baseNow = new Date();
    const vendorPlans: Array<{
        vendorId: string;
        vendorName: string;
        project: string;
        items: VendorWorkOrderSeedItem[];
    }> = MOCK_VENDORS.map((v) => {
        const project = v.primaryProject;
        const byCategory: Record<string, VendorWorkOrderSeedItem[]> = {
            Electrical: [
                { title: 'Replace corridor lighting – Tower A', type: 'Electrical', priority: 'Medium', status: 'In Progress', slaStatus: 'On Track' },
                { title: 'Electrical panel inspection – Block C', type: 'Electrical', priority: 'Critical', status: 'Assigned', slaStatus: 'At Risk' },
            ],
            Civil: [
                { title: 'Crack repair in basement ramp', type: 'Civil', priority: 'Critical', status: 'In Progress', slaStatus: 'Delayed' },
                { title: 'Retaining wall pour – Phase 2', type: 'Civil', priority: 'High', status: 'Open', slaStatus: 'On Track' },
            ],
            Security: [
                { title: 'Lobby access control upgrade', type: 'Other', priority: 'High', status: 'Completed', slaStatus: 'On Track' },
                { title: 'Perimeter camera calibration', type: 'Other', priority: 'Medium', status: 'Verified', slaStatus: 'On Track' },
            ],
            Interior: [
                { title: 'Lobby paint touch-up and polish', type: 'Interior', priority: 'Low', status: 'On Hold', slaStatus: 'On Track' },
                { title: 'Show flat fit-out refresh', type: 'Interior', priority: 'Medium', status: 'Open', slaStatus: 'At Risk' },
            ],
            Plumbing: [
                { title: 'Fix water leakage in Block B – 5th floor', type: 'Plumbing', priority: 'High', status: 'In Progress', slaStatus: 'Delayed' },
                { title: 'Plumbing line pressure test – Tower D', type: 'Plumbing', priority: 'Medium', status: 'Assigned', slaStatus: 'On Track' },
            ],
            HVAC: [
                { title: 'HVAC duct cleaning – Phase 2', type: 'HVAC', priority: 'Medium', status: 'Open', slaStatus: 'On Track' },
                { title: 'Cooling tower service', type: 'HVAC', priority: 'Low', status: 'Completed', slaStatus: 'On Track' },
            ],
        };
        const category = v.categories[0] ?? 'Other';
        const items = byCategory[category] ?? [
            { title: `Site punch list – ${v.name}`, type: 'Other' as WorkType, priority: 'Medium' as WorkOrderPriority, status: 'Open' as WorkOrderStatus, slaStatus: 'On Track' as SlaStatus },
            { title: `Routine maintenance – ${project}`, type: 'Other' as WorkType, priority: 'Low' as WorkOrderPriority, status: 'Assigned' as WorkOrderStatus, slaStatus: 'On Track' as SlaStatus },
        ];
        return { vendorId: v.id, vendorName: v.name, project, items };
    });

    const seeded: WorkOrder[] = [];
    let id = 0;
    for (const plan of vendorPlans) {
        for (const meta of plan.items) {
            id += 1;
            const i = id - 1;
            const createdAt = new Date(baseNow.getTime() - (12 - i) * 86400000 + i * 37 * 60000).toISOString();
            const updatedAt = new Date(new Date(createdAt).getTime() + (i % 3) * 6 * 3600000 + 42 * 60000).toISOString();
            const startDate = toYmd(new Date(baseNow.getTime() - (6 - (i % 6)) * 86400000));
            const endDate = toYmd(new Date(new Date(`${startDate}T00:00:00.000Z`).getTime() + (2 + (i % 6)) * 86400000));

            const workOrderId = formatWorkOrderCode(id);
            const title = meta.title;
            const slug = ensureUniqueSlug(slugify(title) || `work-order-${id}`, seeded);
            const requestedBy = i % 2 === 0 ? 'Priya Ops' : 'Rajesh PM';
            const { vendorId, vendorName } = plan;
            const status = meta.status;

            const completionPct =
                status === 'Completed' || status === 'Verified' ? 100 : status === 'In Progress' ? 55 : status === 'Assigned' ? 18 : 0;
            const progressUpdates: WorkOrderProgressUpdate[] =
                completionPct > 0 && status !== 'Cancelled'
                    ? [
                          {
                              id: `prog-seed-${id}-1`,
                              at: new Date(new Date(createdAt).getTime() + 2 * 3600000).toISOString(),
                              actor: vendorName,
                              notes: 'Site inspection completed. Material list shared.',
                              completionPct: Math.min(40, completionPct),
                              images: [],
                          },
                          ...(completionPct > 55
                              ? [
                                    {
                                        id: `prog-seed-${id}-2`,
                                        at: new Date(new Date(createdAt).getTime() + 26 * 3600000).toISOString(),
                                        actor: vendorName,
                                        notes: 'Work in progress. Team deployed and execution underway.',
                                        completionPct,
                                        images: [],
                                    },
                                ]
                              : []),
                      ]
                    : [];

            const paymentStatus: PaymentStatus =
                status === 'Verified' || status === 'Completed' ? (i % 2 === 0 ? 'Paid' : 'Partial') : 'Pending';
            const verificationStatus: VerificationStatus | '' =
                status === 'Verified' ? 'Approved' : status === 'Completed' ? 'Rework Needed' : '';

            const attachments: WorkOrderAttachment[] =
                i % 3 === 0
                    ? [
                          {
                              id: `att-seed-${id}-1`,
                              category: 'Work Images',
                              fileName: `WO_${workOrderId}_site-photo.jpg`,
                              sizeLabel: '220 KB',
                              uploadedAt: updatedAt,
                              uploadedBy: vendorName,
                          },
                      ]
                    : [];

            const activityLog: WorkOrderActivityEntry[] = [
                {
                    id: `wo-seed-act-${id}-created`,
                    at: createdAt,
                    actor: requestedBy,
                    title: 'Work order created',
                    body: `${workOrderId} · ${title}`,
                    actionType: 'created',
                    severity: 'success',
                },
                {
                    id: `wo-seed-act-${id}-assigned`,
                    at: new Date(new Date(createdAt).getTime() + 4 * 3600000).toISOString(),
                    actor: 'System',
                    title: 'Vendor assignment updated',
                    body: vendorName,
                    actionType: 'assigned_changed',
                    severity: 'info',
                },
                ...(progressUpdates.length
                    ? [
                          {
                              id: `wo-seed-act-${id}-progress`,
                              at: progressUpdates[0]!.at,
                              actor: vendorName,
                              title: 'Progress updated',
                              body: `${progressUpdates[0]!.completionPct}% · ${progressUpdates[0]!.notes}`,
                              actionType: 'progress_updated',
                              severity: 'info' as const,
                          },
                      ]
                    : []),
            ];

            const issueType: IssueType =
                meta.type === 'Plumbing' ? 'Plumbing Work' : meta.type === 'Electrical' ? 'Electrical Work' : 'Other';

            seeded.push({
                id,
                slug,
                workOrderId,
                title,
                description:
                    'Auto-seeded demo work order aligned to vendor registry and primary project. Replace with API-backed records when connected.',
                workType: meta.type,
                issueType,
                projectOrProperty: plan.project,
                location: {
                    flat: i % 2 === 0 ? String(100 + i) : '',
                    block: ['A', 'B', 'C', 'D'][i % 4]!,
                    tower: ['Tower A', 'Tower B', 'Tower C', 'Tower D'][i % 4]!,
                    plot: i % 5 === 0 ? `Plot ${i + 1}` : '',
                    area: i % 3 === 0 ? 'Basement' : i % 3 === 1 ? 'Lobby' : 'Common area',
                },
                priority: meta.priority,
                requestedBy,
                requestedAt: createdAt,
                vendor: {
                    vendorId,
                    vendorName,
                    assignedDate: startDate,
                    assignedBy: requestedBy,
                    estimatedCost: `₹${(25000 + i * 7500).toLocaleString('en-IN')}`,
                    estimatedDurationDays: 2 + (i % 7),
                },
                scheduling: {
                    startDate,
                    endDate,
                    slaStatus: meta.slaStatus,
                },
                lifecycle: {
                    status,
                    statusUpdatedBy: requestedBy,
                    statusUpdatedAt: updatedAt,
                },
                progressUpdates,
                completion: {
                    completionDate: status === 'Completed' || status === 'Verified' ? endDate : '',
                    verifiedBy: status === 'Verified' ? 'Company Admin' : '',
                    verificationStatus,
                    remarks: verificationStatus ? 'Reviewed on site.' : '',
                    proofImages: [],
                },
                finance: {
                    actualCost:
                        status === 'Completed' || status === 'Verified' ? `₹${(22000 + i * 7000).toLocaleString('en-IN')}` : '',
                    paymentStatus,
                    invoiceReference: status === 'Completed' || status === 'Verified' ? `INV-WO-${1000 + id}` : '',
                    paymentLinkHref: '',
                },
                attachments,
                notifications: {
                    notifyVendor: true,
                    slaBreachAlert: true,
                    completionUpdates: true,
                    assignmentNotifications: true,
                },
                activityLog,
                createdAt,
                updatedAt,
                archivedAt: null,
            });
        }
    }
    return seeded;
}

function workOrdersNeedVendorReseed(rows: WorkOrder[]): boolean {
    if (rows.length === 0) return true;
    return rows.every((wo) => !wo.vendor?.vendorId?.trim());
}

let _workOrders: WorkOrder[] = hydrateFromLocalStorage();
if (typeof window !== 'undefined' && workOrdersNeedVendorReseed(_workOrders)) {
    _workOrders = buildSeedWorkOrders();
    persistToLocalStorage(_workOrders);
}
let _nextId = (_workOrders.reduce((m, w) => Math.max(m, w.id), 0) || 0) + 1;

export function getNextWorkOrderCode() {
    return formatWorkOrderCode(_nextId);
}

export function getWorkOrders(): WorkOrder[] {
    return _workOrders.filter((w) => !w.archivedAt).slice().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getWorkOrderBySlug(slug: string): WorkOrder | undefined {
    const s = slug.trim();
    if (!s) return undefined;
    return _workOrders.find((w) => w.slug === s);
}

/** Active or archived — for detail view / recovery flows. */
export function getWorkOrderBySlugIncludingArchived(slug: string): WorkOrder | undefined {
    const s = slug.trim();
    if (!s) return undefined;
    return _workOrders.find((w) => w.slug === s);
}

export function archiveWorkOrder(slug: string): boolean {
    const wo = _workOrders.find((w) => w.slug === slug && !w.archivedAt);
    if (!wo) return false;
    const ts = nowIso();
    _workOrders = _workOrders.map((w) => (w.slug === slug ? { ...w, archivedAt: ts, updatedAt: ts } : w));
    persistToLocalStorage(_workOrders);
    return true;
}

export function restoreWorkOrder(slug: string): boolean {
    const wo = _workOrders.find((w) => w.slug === slug && w.archivedAt);
    if (!wo) return false;
    const ts = nowIso();
    _workOrders = _workOrders.map((w) => (w.slug === slug ? { ...w, archivedAt: null, updatedAt: ts } : w));
    persistToLocalStorage(_workOrders);
    return true;
}

export function duplicateWorkOrder(slug: string): WorkOrder | undefined {
    const src = _workOrders.find((w) => w.slug === slug && !w.archivedAt);
    if (!src) return undefined;
    const id = _nextId++;
    const now = nowIso();
    const baseTitle = `${src.title} (Copy)`;
    const newSlug = ensureUniqueSlug(slugify(baseTitle) || `work-order-${id}`, _workOrders);
    const copy: WorkOrder = {
        ...src,
        id,
        slug: newSlug,
        workOrderId: formatWorkOrderCode(id),
        title: baseTitle,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
        activityLog: [
            ...(src.activityLog ?? []),
            {
                id: `wo-act-dup-${Date.now()}`,
                at: now,
                actor: 'You',
                title: 'Work order cloned',
                body: `Duplicated from ${src.workOrderId}.`,
                actionType: 'duplicated',
                severity: 'info',
            },
        ],
    };
    _workOrders = [..._workOrders, copy];
    persistToLocalStorage(_workOrders);
    return copy;
}

export function getDemoVendorNamesList(): string[] {
    const list = MOCK_VENDORS.map((v) => v.name.trim()).filter(Boolean);
    list.sort((a, b) => a.localeCompare(b));
    if (list.length === 0) list.push('Prime Electrical Works');
    return list;
}

export function addWorkOrderFromCoreFields(input: {
    title: string;
    description: string;
    workType: WorkType;
    issueType: IssueType | '';
    projectOrProperty: string;
    location: WorkOrderLocationDetails;
    priority: WorkOrderPriority;
    requestedBy: string;
    requestedAt?: string;
    vendor: WorkOrderVendorAssignment;
    scheduling: WorkOrderScheduling;
    lifecycle: Pick<WorkOrderLifecycle, 'status'>;
    finance?: Pick<WorkOrderFinance, 'actualCost' | 'paymentStatus' | 'invoiceReference'>;
    completionPct?: number;
    linkedServiceRequestSlug?: string;
    linkedServiceRequestCode?: string;
    linkedResidentSlug?: string;
}): WorkOrder {
    const id = _nextId++;
    const now = nowIso();
    const title = input.title.trim();
    const slug = ensureUniqueSlug(slugify(title) || `work-order-${id}`, _workOrders);
    const workOrderId = formatWorkOrderCode(id);

    const lifecycle: WorkOrderLifecycle = {
        status: input.lifecycle.status,
        statusUpdatedBy: input.requestedBy.trim() || 'You',
        statusUpdatedAt: now,
    };

    const created: WorkOrder = {
        id,
        slug,
        workOrderId,
        title,
        description: input.description.trim(),
        workType: input.workType,
        issueType: input.issueType,
        projectOrProperty: input.projectOrProperty.trim(),
        location: input.location,
        priority: input.priority,
        requestedBy: input.requestedBy.trim() || 'You',
        requestedAt: input.requestedAt?.trim() || now,

        vendor: normalizeVendorAssignment(input.vendor),
        scheduling: input.scheduling,
        lifecycle,
        progressUpdates: [],
        completion: { completionDate: '', verifiedBy: '', verificationStatus: '', remarks: '', proofImages: [] },
        finance: {
            actualCost: input.finance?.actualCost?.trim() ?? '',
            paymentStatus: input.finance?.paymentStatus ?? 'Pending',
            invoiceReference: input.finance?.invoiceReference?.trim() ?? '',
            paymentLinkHref: '',
        },
        attachments: [],
        notifications: {
            notifyVendor: true,
            slaBreachAlert: true,
            completionUpdates: true,
            assignmentNotifications: true,
        },

        activityLog: [
            {
                id: `wo-act-${id}-created`,
                at: now,
                actor: input.requestedBy.trim() || 'You',
                title: 'Work order created',
                body: `${workOrderId} · ${title}`,
                actionType: 'created',
                severity: 'success',
            },
        ],

        createdAt: now,
        updatedAt: now,
        archivedAt: null,
        linkedServiceRequestSlug: input.linkedServiceRequestSlug?.trim() || undefined,
        linkedServiceRequestCode: input.linkedServiceRequestCode?.trim() || undefined,
        linkedResidentSlug: input.linkedResidentSlug?.trim() || undefined,
    };

    const pct = normalizePct(input.completionPct ?? 0);
    if (pct > 0) {
        created.progressUpdates = [
            {
                id: `prog-${Date.now()}`,
                at: now,
                actor: created.vendor.vendorName?.trim() ? created.vendor.vendorName : created.requestedBy,
                notes: 'Initial progress captured during creation.',
                completionPct: pct,
                images: [],
            },
        ];
    }

    _workOrders = [..._workOrders, created];
    persistToLocalStorage(_workOrders);
    return created;
}

export function updateWorkOrder(
    slug: string,
    updates: Partial<Omit<WorkOrder, 'id' | 'slug' | 'workOrderId' | 'createdAt'>>,
    activity?: Omit<WorkOrderActivityEntry, 'id' | 'at'> & { at?: string },
): WorkOrder | undefined {
    const raw = getWorkOrderBySlug(slug);
    if (!raw) return undefined;
    const now = nowIso();
    const next: WorkOrder = {
        ...raw,
        ...updates,
        vendor: updates.vendor ? normalizeVendorAssignment({ ...raw.vendor, ...updates.vendor }) : raw.vendor,
        updatedAt: now,
        createdAt: raw.createdAt,
        workOrderId: raw.workOrderId,
    };
    if (activity) {
        const entry: WorkOrderActivityEntry = {
            id: `wo-act-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            at: activity.at?.trim() || now,
            actor: activity.actor.trim() || 'You',
            title: activity.title.trim(),
            body: activity.body,
            actionType: activity.actionType,
            severity: activity.severity,
        };
        next.activityLog = [...(raw.activityLog ?? []), entry];
    }
    _workOrders = _workOrders.map((w) => (w.slug === slug ? next : w));
    persistToLocalStorage(_workOrders);
    return next;
}

export function addWorkOrderProgressUpdate(
    slug: string,
    input: { actor: string; notes: string; completionPct: number; images?: WorkOrderProgressUpdate['images'] },
): WorkOrder | undefined {
    const wo = getWorkOrderBySlug(slug);
    if (!wo) return undefined;
    const now = nowIso();
    const update: WorkOrderProgressUpdate = {
        id: `prog-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        at: now,
        actor: input.actor.trim() || 'Vendor',
        notes: input.notes.trim(),
        completionPct: normalizePct(input.completionPct),
        images: Array.isArray(input.images) ? input.images : [],
    };
    return updateWorkOrder(
        slug,
        { progressUpdates: [...wo.progressUpdates, update] },
        {
            actor: update.actor,
            title: 'Progress updated',
            body: `${update.completionPct}% · ${update.notes.slice(0, 120)}${update.notes.length > 120 ? '…' : ''}`,
            actionType: 'progress_updated',
            severity: 'info',
        },
    );
}

export function updateWorkOrderProgressUpdate(
    slug: string,
    updateId: string,
    input: { actor: string; notes: string; completionPct: number; images?: WorkOrderProgressUpdate['images'] },
): WorkOrder | undefined {
    const wo = getWorkOrderBySlug(slug);
    if (!wo) return undefined;
    const existing = wo.progressUpdates.find((u) => u.id === updateId);
    if (!existing) return undefined;

    const updated: WorkOrderProgressUpdate = {
        ...existing,
        actor: input.actor.trim() || 'Vendor',
        notes: input.notes.trim(),
        completionPct: normalizePct(input.completionPct),
        images: Array.isArray(input.images) ? input.images : existing.images,
    };

    return updateWorkOrder(
        slug,
        { progressUpdates: wo.progressUpdates.map((u) => (u.id === updateId ? updated : u)) },
        {
            actor: updated.actor,
            title: 'Progress update edited',
            body: `${updated.completionPct}% · ${updated.notes.slice(0, 120)}${updated.notes.length > 120 ? '…' : ''}`,
            actionType: 'progress_updated',
            severity: 'info',
        },
    );
}

export function deleteWorkOrderProgressUpdate(slug: string, updateId: string): WorkOrder | undefined {
    const wo = getWorkOrderBySlug(slug);
    if (!wo) return undefined;
    const target = wo.progressUpdates.find((u) => u.id === updateId);
    if (!target) return undefined;

    return updateWorkOrder(
        slug,
        { progressUpdates: wo.progressUpdates.filter((u) => u.id !== updateId) },
        {
            actor: 'You',
            title: 'Progress update removed',
            body: `${target.completionPct}% · ${target.notes.slice(0, 80)}${target.notes.length > 80 ? '…' : ''}`,
            actionType: 'progress_deleted',
            severity: 'warning',
        },
    );
}

export function addWorkOrderAttachment(
    slug: string,
    row: Omit<WorkOrderAttachment, 'id' | 'uploadedAt'> & { id?: string; uploadedAt?: string },
): WorkOrder | undefined {
    const wo = getWorkOrderBySlug(slug);
    if (!wo) return undefined;
    const now = nowIso();
    const next: WorkOrderAttachment = {
        id: row.id?.trim() || `att-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
        category: row.category,
        fileName: row.fileName.trim(),
        sizeLabel: row.sizeLabel.trim() || '—',
        uploadedAt: row.uploadedAt?.trim() || now,
        uploadedBy: row.uploadedBy.trim() || 'You',
    };
    return updateWorkOrder(
        slug,
        { attachments: [...wo.attachments, next] },
        {
            actor: next.uploadedBy,
            title: 'Attachment uploaded',
            body: `${next.category} · ${next.fileName}`,
            actionType: 'attachment_uploaded',
            severity: 'info',
        },
    );
}

export function removeWorkOrderAttachment(slug: string, attachmentId: string): WorkOrder | undefined {
    const wo = getWorkOrderBySlug(slug);
    if (!wo) return undefined;
    const next = wo.attachments.filter((a) => a.id !== attachmentId);
    if (next.length === wo.attachments.length) return undefined;
    return updateWorkOrder(
        slug,
        { attachments: next },
        { actor: 'You', title: 'Attachment removed', body: attachmentId, actionType: 'attachment_deleted', severity: 'warning' },
    );
}

export function computeDelayDays(startDate: string, endDate: string): number | null {
    const s = startDate?.trim();
    const e = endDate?.trim();
    if (!s || !e) return null;
    const start = new Date(`${s}T00:00:00.000Z`);
    const end = new Date(`${e}T00:00:00.000Z`);
    const ms = end.getTime() - start.getTime();
    if (!Number.isFinite(ms)) return null;
    const days = Math.floor(ms / 86400000);
    return Math.max(0, days);
}

export function isEndDateAfterStartDate(startDate: string, endDate: string): boolean {
    const s = startDate?.trim();
    const e = endDate?.trim();
    if (!s || !e) return true;
    return e > s;
}

export function buildEmptyWorkOrderDraft(): WorkOrder {
    const now = nowIso();
    const ymd = toYmd(new Date());
    const id = 0;
    return {
        id,
        slug: 'new',
        workOrderId: getNextWorkOrderCode(),
        title: '',
        description: '',
        workType: '',
        issueType: '',
        projectOrProperty: '',
        location: { flat: '', block: '', tower: '', plot: '', area: '' },
        priority: '',
        requestedBy: 'You',
        requestedAt: now,

        vendor: {
            vendorId: '',
            vendorName: '',
            assignedDate: ymd,
            assignedBy: 'You',
            estimatedCost: '',
            estimatedDurationDays: null,
        },
        scheduling: {
            startDate: ymd,
            endDate: ymd,
            slaStatus: 'On Track',
        },
        lifecycle: {
            status: 'Draft',
            statusUpdatedBy: 'You',
            statusUpdatedAt: now,
        },
        progressUpdates: [],
        completion: { completionDate: '', verifiedBy: '', verificationStatus: '', remarks: '', proofImages: [] },
        finance: { actualCost: '', paymentStatus: 'Pending', invoiceReference: '', paymentLinkHref: '' },
        attachments: [],
        notifications: {
            notifyVendor: true,
            slaBreachAlert: true,
            completionUpdates: true,
            assignmentNotifications: true,
        },
        activityLog: [],

        createdAt: now,
        updatedAt: now,
        archivedAt: null,
    };
}

