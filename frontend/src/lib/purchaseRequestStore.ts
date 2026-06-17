'use client';

import { getAllSupplierMaterials } from '@/lib/suppliers/supplierRelationsStore';
import { getDemoProjectNamesList } from '@/lib/demoCatalog';

export type PurchaseRequestPriority = 'High' | 'Medium' | 'Low';
export type PurchaseRequestApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

export type PurchaseRequestActivityEntry = {
    id: string;
    at: string;
    actor: string;
    title: string;
    body?: string;
    actionType?: string;
    severity?: 'info' | 'success' | 'warning' | 'critical';
};

export type PurchaseRequestApproval = {
    status: PurchaseRequestApprovalStatus;
    approvedBy: string;
    approvalDate: string | null;
    remarks: string;
};

/** Persisted supplier quote lines for comparison / selection (per PR). */
export type PrSupplierQuoteStored = {
    supplierId: string;
    quotedPrice: number;
    currency: string;
};

export type PurchaseRequestSupplierSelection = {
    selectedSupplierId: string | null;
    quotes: PrSupplierQuoteStored[];
};

export type PurchaseRequest = {
    id: number;
    slug: string;
    prNumber: string;
    requestedBy: string;
    project: string;
    material: string;
    quantity: number;
    requiredDate: string;
    priority: PurchaseRequestPriority;
    notes: string;
    approval: PurchaseRequestApproval;
    /** Supplier comparison + chosen supplier (operational step after approval). */
    supplierSelection: PurchaseRequestSupplierSelection;
    activityLog: PurchaseRequestActivityEntry[];
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
};

const STORAGE_KEY = 'arris-purchase-requests-v1';

export function currentPurchaseRequestActor() {
    return { id: 'u-admin', name: 'Company Admin', role: 'Company Admin' };
}

function nowIso() {
    return new Date().toISOString();
}

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

function ensureUniqueSlug(base: string, existing: PurchaseRequest[]): string {
    const b = base.trim() || 'pr';
    if (!existing.some((x) => x.slug === b)) return b;
    let i = 2;
    while (existing.some((x) => x.slug === `${b}-${i}`)) i++;
    return `${b}-${i}`;
}

export function formatPrNumber(id: number) {
    const n = Math.max(0, Math.floor(id));
    const y = new Date().getFullYear();
    return `PR-${y}-${1000 + n}`;
}

function nextId(rows: PurchaseRequest[]): number {
    return rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
}

function normalizeSupplierSelection(raw: unknown): PurchaseRequestSupplierSelection {
    if (!raw || typeof raw !== 'object') return { selectedSupplierId: null, quotes: [] };
    const o = raw as { selectedSupplierId?: unknown; quotes?: unknown };
    const sel = o.selectedSupplierId;
    const selectedSupplierId = typeof sel === 'string' && sel.trim() ? sel.trim() : null;
    const quotes: PrSupplierQuoteStored[] = Array.isArray(o.quotes)
        ? o.quotes
              .map((q): PrSupplierQuoteStored | null => {
                  if (!q || typeof q !== 'object') return null;
                  const qq = q as Partial<PrSupplierQuoteStored>;
                  const supplierId = typeof qq.supplierId === 'string' ? qq.supplierId.trim() : '';
                  const quotedPrice = typeof qq.quotedPrice === 'number' ? qq.quotedPrice : Number(qq.quotedPrice);
                  const currency = typeof qq.currency === 'string' && qq.currency.trim() ? qq.currency.trim() : 'INR';
                  if (!supplierId || !Number.isFinite(quotedPrice)) return null;
                  return { supplierId, quotedPrice, currency };
              })
              .filter((x): x is PrSupplierQuoteStored => x != null)
        : [];
    return { selectedSupplierId, quotes };
}

function hydrateFromLocalStorage(): PurchaseRequest[] {
    if (typeof window === 'undefined') return [];
    const parsed = safeJsonParse<PurchaseRequest[]>(window.localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r, i) =>
        repairPurchaseRequestRow(
            {
                ...r,
                approval: r.approval ?? {
                    status: 'Pending',
                    approvedBy: '',
                    approvalDate: null,
                    remarks: '',
                },
                supplierSelection: normalizeSupplierSelection((r as { supplierSelection?: unknown }).supplierSelection),
                activityLog: Array.isArray(r.activityLog) ? r.activityLog : [],
                archivedAt: r.archivedAt ?? null,
            },
            i,
        ),
    );
}

function persist(rows: PurchaseRequest[]) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    window.dispatchEvent(new Event('arris-purchase-requests-updated'));
}

/** Static demo rows — always include material names (works on server without localStorage). */
const DEMO_PURCHASE_REQUEST_MATERIALS = [
    'OPC 53 Grade cement',
    'TMT 500D bars',
    'Ready-mix concrete M30',
    'CPVC Pipes',
    'Low-E DGU 6mm',
] as const;

function repairPurchaseRequestRow(row: PurchaseRequest, index: number): PurchaseRequest {
    const material =
        row.material?.trim() ||
        DEMO_PURCHASE_REQUEST_MATERIALS[index % DEMO_PURCHASE_REQUEST_MATERIALS.length] ||
        'OPC 53 Grade cement';
    const project = row.project?.trim() || getDemoProjectNamesList()[index % 3] || 'Skyline Residency';
    return { ...row, material, project };
}

function seedRows(): PurchaseRequest[] {
    const actor = currentPurchaseRequestActor().name;
    const iso = (d: string) => new Date(d).toISOString();
    const projects = getDemoProjectNamesList();
    const mats = DEMO_PURCHASE_REQUEST_MATERIALS;
    const quoteMetro = { supplierId: 'SUP-2401', quotedPrice: 420, currency: 'INR' };
    const quoteSteel = { supplierId: 'SUP-2401', quotedPrice: 58500, currency: 'INR' };
    const quoteRmc = { supplierId: 'SUP-2401', quotedPrice: 5200, currency: 'INR' };
    return [
        {
            id: 1,
            slug: 'pr-demo-1',
            prNumber: formatPrNumber(1),
            requestedBy: actor,
            project: projects[0] ?? 'Skyline Residency',
            material: mats[0],
            quantity: 120,
            requiredDate: futureYmd(14),
            priority: 'High',
            notes: 'Urgent for slab pour — Tower A.',
            approval: { status: 'Approved', approvedBy: actor, approvalDate: iso('2026-05-09T09:00:00'), remarks: 'Stock check passed.' },
            supplierSelection: { selectedSupplierId: 'SUP-2401', quotes: [quoteMetro] },
            activityLog: [
                {
                    id: 'a1',
                    at: iso('2026-05-10T10:00:00'),
                    actor,
                    title: 'Purchase request created',
                    body: `${formatPrNumber(1)} — ${mats[0]} × 120`,
                    actionType: 'created',
                    severity: 'success',
                },
            ],
            createdAt: iso('2026-05-10T10:00:00'),
            updatedAt: iso('2026-05-10T10:00:00'),
            archivedAt: null,
        },
        {
            id: 2,
            slug: 'pr-demo-2',
            prNumber: formatPrNumber(2),
            requestedBy: actor,
            project: projects[1] ?? 'Urban Flux Apartments',
            material: mats[1],
            quantity: 45,
            requiredDate: futureYmd(21),
            priority: 'Medium',
            notes: 'Structural steel for podium level.',
            approval: { status: 'Approved', approvedBy: actor, approvalDate: iso('2026-05-08T14:00:00'), remarks: 'Budget cleared.' },
            supplierSelection: {
                selectedSupplierId: 'SUP-2401',
                quotes: [quoteSteel, { supplierId: 'SUP-2404', quotedPrice: 59200, currency: 'INR' }],
            },
            activityLog: [
                {
                    id: 'a2',
                    at: iso('2026-05-07T09:00:00'),
                    actor,
                    title: 'Purchase request created',
                    body: `${formatPrNumber(2)} — ${mats[1]} × 45`,
                    actionType: 'created',
                    severity: 'success',
                },
                {
                    id: 'a2b',
                    at: iso('2026-05-08T14:00:00'),
                    actor,
                    title: 'Purchase request approved',
                    actionType: 'approved',
                    severity: 'success',
                },
            ],
            createdAt: iso('2026-05-07T09:00:00'),
            updatedAt: iso('2026-05-08T14:00:00'),
            archivedAt: null,
        },
        {
            id: 3,
            slug: 'pr-demo-3',
            prNumber: formatPrNumber(3),
            requestedBy: actor,
            project: projects[2] ?? 'Summit Woods',
            material: mats[2],
            quantity: 80,
            requiredDate: futureYmd(10),
            priority: 'High',
            notes: 'RMC pour schedule — Block C.',
            approval: { status: 'Approved', approvedBy: actor, approvalDate: iso('2026-05-09T11:30:00'), remarks: '' },
            supplierSelection: { selectedSupplierId: 'SUP-2401', quotes: [quoteRmc] },
            activityLog: [
                {
                    id: 'a3',
                    at: iso('2026-05-06T16:00:00'),
                    actor,
                    title: 'Purchase request created',
                    body: `${formatPrNumber(3)} — ${mats[2]} × 80`,
                    actionType: 'created',
                    severity: 'success',
                },
            ],
            createdAt: iso('2026-05-06T16:00:00'),
            updatedAt: iso('2026-05-09T11:30:00'),
            archivedAt: null,
        },
        {
            id: 4,
            slug: 'pr-demo-4',
            prNumber: formatPrNumber(4),
            requestedBy: actor,
            project: projects[0] ?? 'Skyline Residency',
            material: mats[3],
            quantity: 200,
            requiredDate: futureYmd(18),
            priority: 'Low',
            notes: 'Plumbing retrofit — rejected due to duplicate stock.',
            approval: { status: 'Rejected', approvedBy: actor, approvalDate: iso('2026-05-05T10:00:00'), remarks: 'Duplicate of open PR.' },
            supplierSelection: { selectedSupplierId: null, quotes: [] },
            activityLog: [
                {
                    id: 'a4',
                    at: iso('2026-05-04T12:00:00'),
                    actor,
                    title: 'Purchase request rejected',
                    actionType: 'rejected',
                    severity: 'warning',
                },
            ],
            createdAt: iso('2026-05-04T12:00:00'),
            updatedAt: iso('2026-05-05T10:00:00'),
            archivedAt: null,
        },
        {
            id: 5,
            slug: 'pr-demo-5',
            prNumber: formatPrNumber(5),
            requestedBy: actor,
            project: projects[1] ?? 'Urban Flux Apartments',
            material: mats[4],
            quantity: 60,
            requiredDate: futureYmd(25),
            priority: 'Medium',
            notes: 'Façade glazing batch 2.',
            approval: { status: 'Pending', approvedBy: '', approvalDate: null, remarks: '' },
            supplierSelection: { selectedSupplierId: null, quotes: [{ supplierId: 'SUP-2404', quotedPrice: 1850, currency: 'INR' }] },
            activityLog: [
                {
                    id: 'a5',
                    at: iso('2026-05-11T08:30:00'),
                    actor,
                    title: 'Purchase request created',
                    body: `${formatPrNumber(5)} — ${mats[4]} × 60`,
                    actionType: 'created',
                    severity: 'success',
                },
            ],
            createdAt: iso('2026-05-11T08:30:00'),
            updatedAt: iso('2026-05-11T08:30:00'),
            archivedAt: null,
        },
        {
            id: 6,
            slug: 'pr-demo-6',
            prNumber: formatPrNumber(6),
            requestedBy: actor,
            project: projects[2] ?? 'Summit Woods',
            material: 'Structural Steel',
            quantity: 32,
            requiredDate: futureYmd(16),
            priority: 'High',
            notes: 'Column cages — Block B.',
            approval: { status: 'Approved', approvedBy: actor, approvalDate: iso('2026-05-12T10:00:00'), remarks: '' },
            supplierSelection: {
                selectedSupplierId: 'SUP-2404',
                quotes: [{ supplierId: 'SUP-2404', quotedPrice: 61000, currency: 'INR' }],
            },
            activityLog: [
                {
                    id: 'a6',
                    at: iso('2026-05-11T15:00:00'),
                    actor,
                    title: 'Purchase request approved',
                    actionType: 'approved',
                    severity: 'success',
                },
            ],
            createdAt: iso('2026-05-11T15:00:00'),
            updatedAt: iso('2026-05-12T10:00:00'),
            archivedAt: null,
        },
    ];
}

function futureYmd(daysFromNow: number) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().slice(0, 10);
}

function mergeWithDemoSeed(persisted: PurchaseRequest[], seeded: PurchaseRequest[]): PurchaseRequest[] {
    const bySlug = new Map<string, PurchaseRequest>();
    for (const row of seeded) bySlug.set(row.slug, row);
    persisted.forEach((row, i) => bySlug.set(row.slug, repairPurchaseRequestRow(row, i)));
    return [...bySlug.values()].sort((a, b) => b.id - a.id);
}

function demoSeedComplete(rows: PurchaseRequest[], seeded: PurchaseRequest[]): boolean {
    const demoSlugs = new Set(seeded.map((r) => r.slug));
    return demoSlugs.size > 0 && [...demoSlugs].every((slug) => rows.some((r) => r.slug === slug));
}

function loadAll(): PurchaseRequest[] {
    const seeded = seedRows();
    if (typeof window === 'undefined') return seeded;
    const raw = hydrateFromLocalStorage();
    const merged = mergeWithDemoSeed(raw, seeded);
    const repaired = merged.map((r, i) => repairPurchaseRequestRow(r, i));
    if (!raw.length || !demoSeedComplete(raw, seeded) || repaired.some((r, i) => r.material !== merged[i]?.material)) {
        persist(repaired);
    }
    return repaired;
}

export function getMaterialCatalogMaterialNames(): string[] {
    try {
        const rows = getAllSupplierMaterials();
        const names = uniqueSorted(rows.map((m) => m.materialName));
        if (names.length) return names;
    } catch {
        /* ignore */
    }
    return ['TMT 500D 12mm', 'Low-E DGU 6mm', 'CPVC Pipes', 'Cement (OPC 53)', 'Structural Steel'];
}

function uniqueSorted(values: string[]) {
    return [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function getActiveProjectNames(): string[] {
    return getDemoProjectNamesList();
}

export function getPurchaseRequests(): PurchaseRequest[] {
    return loadAll().filter((r) => !r.archivedAt);
}

/** Approved, non-archived purchase requests (e.g. PO reference lookup). */
export function getApprovedPurchaseRequests(): PurchaseRequest[] {
    return getPurchaseRequests().filter((r) => r.approval.status === 'Approved');
}

export function getPurchaseRequestIncludingArchived(slug: string): PurchaseRequest | undefined {
    return loadAll().find((r) => r.slug === slug);
}

export function appendActivity(
    row: PurchaseRequest,
    entry: Omit<PurchaseRequestActivityEntry, 'id' | 'at'> & { id?: string; at?: string },
): PurchaseRequest {
    const id = entry.id ?? `ev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const at = entry.at ?? nowIso();
    return {
        ...row,
        activityLog: [...row.activityLog, { ...entry, id, at }],
        updatedAt: nowIso(),
    };
}

export function addPurchaseRequestFromCoreFields(input: {
    requestedBy: string;
    project: string;
    material: string;
    quantity: number;
    requiredDate: string;
    priority: PurchaseRequestPriority;
    notes: string;
    approval: PurchaseRequestApproval;
}): PurchaseRequest {
    const all = loadAll();
    const id = nextId(all);
    const prNumber = formatPrNumber(id);
    const baseSlug = ensureUniqueSlug(slugify(`pr-${prNumber}`), all);
    const actor = input.requestedBy.trim() || currentPurchaseRequestActor().name;
    let row: PurchaseRequest = {
        id,
        slug: baseSlug,
        prNumber,
        requestedBy: actor,
        project: input.project.trim(),
        material: input.material.trim(),
        quantity: input.quantity,
        requiredDate: input.requiredDate.trim(),
        priority: input.priority,
        notes: input.notes.trim(),
        approval: { ...input.approval },
        supplierSelection: { selectedSupplierId: null, quotes: [] },
        activityLog: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
        archivedAt: null,
    };
    row = appendActivity(row, {
        actor,
        title: 'Purchase request created',
        body: `${prNumber} — ${row.material} × ${row.quantity}`,
        actionType: 'created',
        severity: 'success',
    });
    persist([row, ...all]);
    return row;
}

export function updatePurchaseRequest(
    slug: string,
    patch: Partial<
        Pick<
            PurchaseRequest,
            | 'project'
            | 'material'
            | 'quantity'
            | 'requiredDate'
            | 'priority'
            | 'notes'
            | 'approval'
            | 'requestedBy'
            | 'supplierSelection'
        >
    >,
    activity?: Omit<PurchaseRequestActivityEntry, 'id' | 'at'>,
): PurchaseRequest | null {
    const all = loadAll();
    const idx = all.findIndex((r) => r.slug === slug);
    if (idx < 0) return null;
    const prev = all[idx]!;
    const mergedApproval = patch.approval ? { ...prev.approval, ...patch.approval } : prev.approval;
    let row: PurchaseRequest = {
        ...prev,
        ...patch,
        approval: mergedApproval,
        updatedAt: nowIso(),
    };
    if (activity) {
        row = appendActivity(row, { ...activity, actor: activity.actor || currentPurchaseRequestActor().name });
    } else {
        row = appendActivity(row, {
            actor: currentPurchaseRequestActor().name,
            title: 'Purchase request edited',
            body: 'Details updated.',
            actionType: 'edited',
            severity: 'info',
        });
    }
    const next = [...all];
    next[idx] = row;
    persist(next);
    return row;
}

export function setApprovalStatus(
    slug: string,
    status: PurchaseRequestApprovalStatus,
    opts?: { remarks?: string },
): PurchaseRequest | null {
    const row = getPurchaseRequestIncludingArchived(slug);
    if (!row || row.archivedAt) return null;
    const actor = currentPurchaseRequestActor().name;
    const remarks = opts?.remarks !== undefined ? opts.remarks : row.approval.remarks;
    const approvalDate = status === 'Pending' ? null : nowIso();
    const approvedBy = status === 'Pending' ? '' : actor;
    const activityTitle = status === 'Approved' ? 'Purchase request approved' : status === 'Rejected' ? 'Purchase request rejected' : 'Approval status updated';
    const actionType = status === 'Approved' ? 'approved' : status === 'Rejected' ? 'rejected' : 'updated';
    return updatePurchaseRequest(
        slug,
        {
            approval: {
                status,
                approvedBy,
                approvalDate,
                remarks: remarks ?? '',
            },
        },
        {
            actor,
            title: activityTitle,
            body: remarks?.trim() || undefined,
            actionType,
            severity: status === 'Rejected' ? 'warning' : status === 'Approved' ? 'success' : 'info',
        },
    );
}

export function archivePurchaseRequest(slug: string): boolean {
    const all = loadAll();
    const idx = all.findIndex((r) => r.slug === slug);
    if (idx < 0) return false;
    const row = {
        ...all[idx]!,
        archivedAt: nowIso(),
        updatedAt: nowIso(),
    };
    const withLog = appendActivity(row, {
        actor: currentPurchaseRequestActor().name,
        title: 'Purchase request archived',
        actionType: 'archived',
        severity: 'warning',
    });
    const next = [...all];
    next[idx] = withLog;
    persist(next);
    return true;
}

export function duplicatePurchaseRequest(slug: string): PurchaseRequest | null {
    const src = getPurchaseRequestIncludingArchived(slug);
    if (!src) return null;
    /* Duplicate resets supplier selection (fresh negotiation). */
    return addPurchaseRequestFromCoreFields({
        requestedBy: src.requestedBy,
        project: src.project,
        material: src.material,
        quantity: src.quantity,
        requiredDate: src.requiredDate,
        priority: src.priority,
        notes: src.notes,
        approval: { status: 'Pending', approvedBy: '', approvalDate: null, remarks: '' },
    });
}

export function buildEmptyPurchaseRequestDraft(): PurchaseRequest {
    const actor = currentPurchaseRequestActor().name;
    const t = new Date();
    t.setDate(t.getDate() + 1);
    const ymd = t.toISOString().slice(0, 10);
    return {
        id: 0,
        slug: 'new',
        prNumber: '',
        requestedBy: actor,
        project: '',
        material: '',
        quantity: 0,
        requiredDate: ymd,
        priority: 'Medium',
        notes: '',
        approval: { status: 'Pending', approvedBy: '', approvalDate: null, remarks: '' },
        supplierSelection: { selectedSupplierId: null, quotes: [] },
        activityLog: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
        archivedAt: null,
    };
}

/** Strictly after calendar today (local). */
export function isRequiredDateInFuture(ymd: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
    const [y, m, d] = ymd.split('-').map((n) => Number(n));
    const picked = new Date(y!, m! - 1, d!);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    picked.setHours(0, 0, 0, 0);
    return picked.getTime() > today.getTime();
}
