'use client';

import { getMaterialCatalogMaterialNames, getPurchaseRequestIncludingArchived } from '@/lib/purchaseRequestStore';
import { getAllSupplierRecords } from '@/lib/suppliers/supplierStore';

export type PurchaseOrderStatus = 'Created' | 'Sent' | 'Delivered';
export type PoDeliveryStatus = 'Pending' | 'Partial' | 'Completed';
export type PoQualityCheck = 'Passed' | 'Failed';

export type PurchaseOrderActivityEntry = {
    id: string;
    at: string;
    actor: string;
    title: string;
    body?: string;
    actionType?: string;
    severity?: 'info' | 'success' | 'warning' | 'critical';
};

export type PurchaseOrderDelivery = {
    status: PoDeliveryStatus;
    receivedQuantity: number;
    /** YYYY-MM-DD */
    receivedDate: string;
    qualityCheck: PoQualityCheck | '';
};

export type PurchaseOrder = {
    id: number;
    slug: string;
    poNumber: string;
    /** Purchase request link (slug); maps to backend `pr_id`. */
    prSlug: string;
    prNumber: string;
    supplierId: string;
    supplierName: string;
    material: string;
    quantity: number;
    unitPrice: number;
    currency: string;
    totalAmount: number;
    /** YYYY-MM-DD */
    deliveryDate: string;
    status: PurchaseOrderStatus;
    delivery: PurchaseOrderDelivery;
    activityLog: PurchaseOrderActivityEntry[];
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
};

const STORAGE_KEY = 'arris-purchase-orders-v1';

export function currentPurchaseOrderActor() {
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

function ensureUniqueSlug(base: string, existing: PurchaseOrder[]): string {
    const b = base.trim() || 'po';
    if (!existing.some((x) => x.slug === b)) return b;
    let i = 2;
    while (existing.some((x) => x.slug === `${b}-${i}`)) i++;
    return `${b}-${i}`;
}

export function formatPoNumber(id: number) {
    const n = Math.max(0, Math.floor(id));
    const y = new Date().getFullYear();
    return `PO-${y}-${1000 + n}`;
}

function nextId(rows: PurchaseOrder[]): number {
    return rows.reduce((m, r) => Math.max(m, r.id), 0) + 1;
}

function defaultDelivery(): PurchaseOrderDelivery {
    return { status: 'Pending', receivedQuantity: 0, receivedDate: '', qualityCheck: '' };
}

const DEMO_PO_MATERIALS = [
    'OPC 53 Grade cement',
    'TMT 500D bars',
    'Ready-mix concrete M30',
    'CPVC Pipes',
] as const;

function poPrSlug(raw: Pick<PurchaseOrder, 'prSlug'>): string {
    return typeof raw.prSlug === 'string' ? raw.prSlug.trim() : '';
}

function resolvePoMaterial(raw: PurchaseOrder, index = 0): string {
    if (raw.material?.trim()) return raw.material.trim();
    const linkedPrSlug = poPrSlug(raw);
    if (linkedPrSlug) {
        const pr = getPurchaseRequestIncludingArchived(linkedPrSlug);
        if (pr?.material?.trim()) return pr.material.trim();
    }
    return DEMO_PO_MATERIALS[index % DEMO_PO_MATERIALS.length] ?? 'OPC 53 Grade cement';
}

type LegacyPurchaseOrderRow = PurchaseOrder & { invoice?: unknown };

function normalizePo(raw: LegacyPurchaseOrderRow, index = 0): PurchaseOrder {
    const { invoice: _legacyInvoice, ...poBase } = raw;
    const qty = Number(raw.quantity) || 0;
    const unit = Number(raw.unitPrice) || 0;
    const total = Number.isFinite(raw.totalAmount) && raw.totalAmount > 0 ? raw.totalAmount : qty * unit;
    const material = resolvePoMaterial(raw, index);
    const linkedPrSlug = poPrSlug(raw);
    const pr = linkedPrSlug ? getPurchaseRequestIncludingArchived(linkedPrSlug) : undefined;
    const supplierName =
        raw.supplierName?.trim() ||
        (raw.supplierId ? getAllSupplierRecords().find((s) => s.id === raw.supplierId)?.name : undefined) ||
        'MetroBuild Materials Pvt Ltd';
    return {
        ...poBase,
        prSlug: poPrSlug(raw),
        material,
        prNumber: raw.prNumber?.trim() || pr?.prNumber || raw.prNumber || '—',
        supplierName,
        currency: typeof raw.currency === 'string' && raw.currency.trim() ? raw.currency.trim() : 'INR',
        quantity: qty,
        unitPrice: unit,
        totalAmount: total,
        delivery: raw.delivery
            ? {
                  status: raw.delivery.status ?? 'Pending',
                  receivedQuantity: Math.max(0, Number(raw.delivery.receivedQuantity) || 0),
                  receivedDate: typeof raw.delivery.receivedDate === 'string' ? raw.delivery.receivedDate : '',
                  qualityCheck:
                      raw.delivery.qualityCheck === 'Passed' || raw.delivery.qualityCheck === 'Failed'
                          ? raw.delivery.qualityCheck
                          : '',
              }
            : defaultDelivery(),
        activityLog: Array.isArray(raw.activityLog) ? raw.activityLog : [],
        archivedAt: raw.archivedAt ?? null,
    };
}

function hydrateFromLocalStorage(): PurchaseOrder[] {
    if (typeof window === 'undefined') return [];
    const parsed = safeJsonParse<PurchaseOrder[]>(window.localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r, i) => normalizePo(r, i));
}

function persist(rows: PurchaseOrder[]) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    window.dispatchEvent(new Event('arris-purchase-orders-updated'));
}

function futureYmd(daysFromNow: number) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().slice(0, 10);
}

function prRef(slug: string, fallbackNumber: string): { prSlug: string; prNumber: string } {
    const pr = getPurchaseRequestIncludingArchived(slug);
    return { prSlug: slug, prNumber: pr?.prNumber ?? fallbackNumber };
}

function seedRows(): PurchaseOrder[] {
    const actor = currentPurchaseOrderActor().name;
    const iso = (d: string) => new Date(d).toISOString();
    const y = new Date().getFullYear();
    const pr1 = prRef('pr-demo-1', `PR-${y}-1001`);
    const pr2 = prRef('pr-demo-2', `PR-${y}-1002`);
    const pr3 = prRef('pr-demo-3', `PR-${y}-1003`);
    const pr4 = prRef('pr-demo-4', `PR-${y}-1004`);
    const pr5 = prRef('pr-demo-5', `PR-${y}-1005`);
    const pr6 = prRef('pr-demo-6', `PR-${y}-1006`);

    const rows: PurchaseOrder[] = [
        {
            id: 1,
            slug: 'po-demo-1',
            poNumber: formatPoNumber(1),
            ...pr1,
            supplierId: 'SUP-2401',
            supplierName: 'MetroBuild Materials Pvt Ltd',
            material: 'OPC 53 Grade cement',
            quantity: 120,
            unitPrice: 420,
            currency: 'INR',
            totalAmount: 120 * 420,
            deliveryDate: futureYmd(14),
            status: 'Created',
            delivery: defaultDelivery(),
            activityLog: [
                {
                    id: 'po-a1',
                    at: iso('2026-05-10T10:00:00'),
                    actor,
                    title: 'Purchase order created',
                    body: `${formatPoNumber(1)} linked to ${pr1.prNumber}`,
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
            slug: 'po-demo-2',
            poNumber: formatPoNumber(2),
            ...pr2,
            supplierId: 'SUP-2401',
            supplierName: 'MetroBuild Materials Pvt Ltd',
            material: 'TMT 500D bars',
            quantity: 45,
            unitPrice: 58500,
            currency: 'INR',
            totalAmount: 45 * 58500,
            deliveryDate: futureYmd(12),
            status: 'Sent',
            delivery: { status: 'Pending', receivedQuantity: 0, receivedDate: '', qualityCheck: '' },
            activityLog: [
                {
                    id: 'po-a2',
                    at: iso('2026-05-09T10:00:00'),
                    actor,
                    title: 'Purchase order created',
                    body: `${formatPoNumber(2)} linked to ${pr2.prNumber}`,
                    actionType: 'created',
                    severity: 'success',
                },
            ],
            createdAt: iso('2026-05-09T10:00:00'),
            updatedAt: iso('2026-05-09T10:00:00'),
            archivedAt: null,
        },
        {
            id: 3,
            slug: 'po-demo-3',
            poNumber: formatPoNumber(3),
            ...pr3,
            supplierId: 'SUP-2401',
            supplierName: 'MetroBuild Materials Pvt Ltd',
            material: 'Ready-mix concrete M30',
            quantity: 80,
            unitPrice: 5200,
            currency: 'INR',
            totalAmount: 80 * 5200,
            deliveryDate: futureYmd(8),
            status: 'Created',
            delivery: defaultDelivery(),
            activityLog: [
                {
                    id: 'po-a3',
                    at: iso('2026-05-10T11:00:00'),
                    actor,
                    title: 'Purchase order created',
                    body: `${formatPoNumber(3)} linked to ${pr3.prNumber}`,
                    actionType: 'created',
                    severity: 'success',
                },
            ],
            createdAt: iso('2026-05-10T11:00:00'),
            updatedAt: iso('2026-05-10T11:00:00'),
            archivedAt: null,
        },
        {
            id: 4,
            slug: 'po-demo-4',
            poNumber: formatPoNumber(4),
            ...pr4,
            supplierId: 'SUP-2403',
            supplierName: 'AquaFlow Plumbing Co',
            material: 'CPVC Pipes',
            quantity: 200,
            unitPrice: 185,
            currency: 'INR',
            totalAmount: 200 * 185,
            deliveryDate: futureYmd(18),
            status: 'Sent',
            delivery: { status: 'Pending', receivedQuantity: 0, receivedDate: '', qualityCheck: '' },
            activityLog: [],
            createdAt: iso('2026-05-08T12:00:00'),
            updatedAt: iso('2026-05-08T12:00:00'),
            archivedAt: null,
        },
        {
            id: 5,
            slug: 'po-demo-5',
            poNumber: formatPoNumber(5),
            ...pr5,
            supplierId: 'SUP-2404',
            supplierName: 'FinishCraft Traders',
            material: 'Low-E DGU 6mm',
            quantity: 60,
            unitPrice: 1850,
            currency: 'INR',
            totalAmount: 60 * 1850,
            deliveryDate: futureYmd(25),
            status: 'Created',
            delivery: defaultDelivery(),
            activityLog: [],
            createdAt: iso('2026-05-11T16:00:00'),
            updatedAt: iso('2026-05-11T16:00:00'),
            archivedAt: null,
        },
        {
            id: 6,
            slug: 'po-demo-6',
            poNumber: formatPoNumber(6),
            ...pr6,
            supplierId: 'SUP-2404',
            supplierName: 'FinishCraft Traders',
            material: 'Structural Steel',
            quantity: 32,
            unitPrice: 61000,
            currency: 'INR',
            totalAmount: 32 * 61000,
            deliveryDate: futureYmd(16),
            status: 'Sent',
            delivery: { status: 'Partial', receivedQuantity: 16, receivedDate: futureYmd(-1), qualityCheck: 'Passed' },
            activityLog: [],
            createdAt: iso('2026-05-12T11:00:00'),
            updatedAt: iso('2026-05-12T11:00:00'),
            archivedAt: null,
        },
        {
            id: 7,
            slug: 'po-demo-7',
            poNumber: formatPoNumber(7),
            ...pr1,
            supplierId: 'SUP-2401',
            supplierName: 'MetroBuild Materials Pvt Ltd',
            material: 'OPC 53 Grade cement',
            quantity: 60,
            unitPrice: 420,
            currency: 'INR',
            totalAmount: 60 * 420,
            deliveryDate: futureYmd(5),
            status: 'Delivered',
            delivery: { status: 'Completed', receivedQuantity: 60, receivedDate: futureYmd(-2), qualityCheck: 'Passed' },
            activityLog: [
                {
                    id: 'po-a7',
                    at: iso('2026-05-01T09:00:00'),
                    actor,
                    title: 'Delivery completed',
                    body: `Delivered against ${pr1.prNumber}.`,
                    actionType: 'delivered',
                    severity: 'success',
                },
            ],
            createdAt: iso('2026-05-01T09:00:00'),
            updatedAt: iso('2026-05-12T15:00:00'),
            archivedAt: null,
        },
        {
            id: 8,
            slug: 'po-demo-8',
            poNumber: formatPoNumber(8),
            ...pr3,
            supplierId: 'SUP-2401',
            supplierName: 'MetroBuild Materials Pvt Ltd',
            material: 'Ready-mix concrete M30',
            quantity: 40,
            unitPrice: 5200,
            currency: 'INR',
            totalAmount: 40 * 5200,
            deliveryDate: futureYmd(15),
            status: 'Delivered',
            delivery: { status: 'Completed', receivedQuantity: 40, receivedDate: futureYmd(-3), qualityCheck: 'Passed' },
            activityLog: [],
            createdAt: iso('2026-05-11T14:00:00'),
            updatedAt: iso('2026-05-13T09:00:00'),
            archivedAt: null,
        },
    ];
    return rows.map((r, i) => normalizePo(r, i));
}

function mergeWithDemoSeed(persisted: PurchaseOrder[], seeded: PurchaseOrder[]): PurchaseOrder[] {
    const bySlug = new Map<string, PurchaseOrder>();
    for (const row of seeded) bySlug.set(row.slug, row);
    persisted.forEach((row, i) => bySlug.set(row.slug, normalizePo(row, i)));
    return [...bySlug.values()].sort((a, b) => b.id - a.id);
}

function demoSeedComplete(rows: PurchaseOrder[], seeded: PurchaseOrder[]): boolean {
    const demoSlugs = new Set(seeded.map((r) => r.slug));
    return demoSlugs.size > 0 && [...demoSlugs].every((slug) => rows.some((r) => r.slug === slug));
}

function loadAll(): PurchaseOrder[] {
    const seeded = seedRows();
    if (typeof window === 'undefined') return seeded;
    const raw = hydrateFromLocalStorage();
    const merged = mergeWithDemoSeed(raw, seeded);
    const repaired = merged.map((r, i) => normalizePo(r, i));
    if (!raw.length || !demoSeedComplete(raw, seeded) || repaired.some((r, i) => r.prNumber !== merged[i]?.prNumber || r.material !== merged[i]?.material)) {
        persist(repaired);
    }
    return repaired;
}

export function getPurchaseOrders(): PurchaseOrder[] {
    return loadAll().filter((r) => !r.archivedAt);
}

/** POs linked to a purchase request (`prSlug` is the PR foreign key; maps to backend `pr_id`). */
export function getPurchaseOrdersByPrSlug(prSlug: string): PurchaseOrder[] {
    const slug = prSlug.trim();
    if (!slug) return [];
    return getPurchaseOrders()
        .filter((r) => poPrSlug(r) === slug)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Active POs not already linked to this PR (for link-existing flow). */
export function getLinkablePurchaseOrdersForPr(prSlug: string): PurchaseOrder[] {
    const slug = prSlug.trim();
    if (!slug) return [];
    return getPurchaseOrders()
        .filter((r) => poPrSlug(r) !== slug)
        .sort((a, b) => b.poNumber.localeCompare(a.poNumber));
}

export function linkPurchaseOrderToPr(poSlug: string, prSlug: string): PurchaseOrder | null {
    const targetPr = prSlug.trim();
    const targetPo = poSlug.trim();
    if (!targetPr || !targetPo) return null;
    const pr = getPurchaseRequestIncludingArchived(targetPr);
    if (!pr) return null;
    return updatePurchaseOrder(
        targetPo,
        { prSlug: targetPr, prNumber: pr.prNumber },
        {
            actor: currentPurchaseOrderActor().name,
            title: 'Linked to purchase request',
            body: `Attached to ${pr.prNumber}.`,
            actionType: 'linked',
            severity: 'info',
        },
    );
}

/** Clears PR link on the PO only; the purchase order record is not deleted or archived. */
export function unlinkPurchaseOrderFromPr(poSlug: string, prSlug: string): PurchaseOrder | null {
    const targetPo = poSlug.trim();
    const targetPr = prSlug.trim();
    if (!targetPo || !targetPr) return null;
    const po = getPurchaseOrderIncludingArchived(targetPo);
    if (!po || poPrSlug(po) !== targetPr) return null;
    return updatePurchaseOrder(
        targetPo,
        { prSlug: '', prNumber: '' },
        {
            actor: currentPurchaseOrderActor().name,
            title: 'Unlinked from purchase request',
            body: `Removed link to purchase request. ${po.poNumber} remains in Purchase Orders.`,
            actionType: 'unlinked',
            severity: 'warning',
        },
    );
}

export function getPurchaseOrderIncludingArchived(slug: string): PurchaseOrder | undefined {
    return loadAll().find((r) => r.slug === slug);
}

export function appendPurchaseOrderActivity(
    row: PurchaseOrder,
    entry: Omit<PurchaseOrderActivityEntry, 'id' | 'at'> & { id?: string; at?: string },
): PurchaseOrder {
    const id = entry.id ?? `ev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const at = entry.at ?? nowIso();
    return {
        ...row,
        activityLog: [...row.activityLog, { ...entry, id, at }],
        updatedAt: nowIso(),
    };
}

export function getSupplierNamesForPo(): { id: string; name: string }[] {
    return getAllSupplierRecords()
        .filter((s) => s.status === 'Active')
        .map((s) => ({ id: s.id, name: s.name }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

export function getMaterialOptionsForPo(): string[] {
    return getMaterialCatalogMaterialNames();
}

/** Delivery date must be strictly after today (local), same rule as PR required date. */
export function isPoDeliveryDateInFuture(ymd: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
    const [y, m, d] = ymd.split('-').map((n) => Number(n));
    const picked = new Date(y!, m! - 1, d!);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    picked.setHours(0, 0, 0, 0);
    return picked.getTime() > today.getTime();
}

export type PurchaseOrderCreateInput = {
    prSlug: string;
    supplierId: string;
    material: string;
    quantity: number;
    unitPrice: number;
    currency: string;
    deliveryDate: string;
    status?: PurchaseOrderStatus;
    delivery?: PurchaseOrderDelivery;
};

export function addPurchaseOrderFromCoreFields(input: PurchaseOrderCreateInput): PurchaseOrder {
    const all = loadAll();
    const id = nextId(all);
    const poNumber = formatPoNumber(id);
    const baseSlug = ensureUniqueSlug(slugify(`po-${poNumber}`), all);
    const pr = getPurchaseRequestIncludingArchived(input.prSlug.trim());
    const prNumber = pr?.prNumber ?? '—';
    const supplier = getAllSupplierRecords().find((s) => s.id === input.supplierId.trim());
    const supplierName = supplier?.name ?? '—';
    const qty = Math.max(0, input.quantity);
    const unit = Math.max(0, input.unitPrice);
    const currency = input.currency.trim() || 'INR';
    const status = input.status ?? 'Created';
    let row: PurchaseOrder = normalizePo({
        id,
        slug: baseSlug,
        poNumber,
        prSlug: input.prSlug.trim(),
        prNumber,
        supplierId: input.supplierId.trim(),
        supplierName,
        material: input.material.trim(),
        quantity: qty,
        unitPrice: unit,
        currency,
        totalAmount: qty * unit,
        deliveryDate: input.deliveryDate.trim(),
        status,
        delivery: input.delivery ?? defaultDelivery(),
        activityLog: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
        archivedAt: null,
    });
    row = appendPurchaseOrderActivity(row, {
        actor: currentPurchaseOrderActor().name,
        title: 'Purchase order created',
        body: `${poNumber} — ${row.material} × ${qty}`,
        actionType: 'created',
        severity: 'success',
    });
    persist([row, ...all]);
    return row;
}

export type PurchaseOrderPatch = Partial<
    Pick<
        PurchaseOrder,
        | 'prSlug'
        | 'prNumber'
        | 'supplierId'
        | 'supplierName'
        | 'material'
        | 'quantity'
        | 'unitPrice'
        | 'currency'
        | 'totalAmount'
        | 'deliveryDate'
        | 'status'
        | 'delivery'
    >
>;

export function updatePurchaseOrder(
    slug: string,
    patch: PurchaseOrderPatch,
    activity?: Omit<PurchaseOrderActivityEntry, 'id' | 'at'>,
): PurchaseOrder | null {
    const all = loadAll();
    const idx = all.findIndex((r) => r.slug === slug);
    if (idx < 0) return null;
    const prev = all[idx]!;
    let row: PurchaseOrder = {
        ...prev,
        ...patch,
        delivery: patch.delivery ? { ...prev.delivery, ...patch.delivery } : prev.delivery,
        updatedAt: nowIso(),
    };
    const qty = patch.quantity != null ? row.quantity : prev.quantity;
    const unit = patch.unitPrice != null ? row.unitPrice : prev.unitPrice;
    if (patch.quantity != null || patch.unitPrice != null) {
        row.totalAmount = qty * unit;
    }
    if (activity) {
        row = appendPurchaseOrderActivity(row, { ...activity, actor: activity.actor || currentPurchaseOrderActor().name });
    } else {
        row = appendPurchaseOrderActivity(row, {
            actor: currentPurchaseOrderActor().name,
            title: 'Purchase order updated',
            body: 'Details updated.',
            actionType: 'edited',
            severity: 'info',
        });
    }
    const next = [...all];
    next[idx] = normalizePo(row);
    persist(next);
    return next[idx]!;
}

export function archivePurchaseOrder(slug: string): boolean {
    const all = loadAll();
    const idx = all.findIndex((r) => r.slug === slug);
    if (idx < 0) return false;
    const row = {
        ...all[idx]!,
        archivedAt: nowIso(),
        updatedAt: nowIso(),
    };
    const withLog = appendPurchaseOrderActivity(row, {
        actor: currentPurchaseOrderActor().name,
        title: 'Purchase order archived',
        actionType: 'archived',
        severity: 'warning',
    });
    const next = [...all];
    next[idx] = withLog;
    persist(next);
    return true;
}

export function duplicatePurchaseOrder(slug: string): PurchaseOrder | null {
    const src = getPurchaseOrderIncludingArchived(slug);
    if (!src) return null;
    return addPurchaseOrderFromCoreFields({
        prSlug: src.prSlug,
        supplierId: src.supplierId,
        material: src.material,
        quantity: src.quantity,
        unitPrice: src.unitPrice,
        currency: src.currency,
        deliveryDate: src.deliveryDate,
        status: 'Created',
    });
}

export function buildEmptyPurchaseOrderDraft(prSlugFromUrl?: string): PurchaseOrder {
    const actor = currentPurchaseOrderActor().name;
    const t = new Date();
    t.setDate(t.getDate() + 3);
    const ymd = t.toISOString().slice(0, 10);
    const pr = prSlugFromUrl ? getPurchaseRequestIncludingArchived(prSlugFromUrl.trim()) : undefined;
    const quote = pr?.supplierSelection?.quotes?.find((q) => q.supplierId === pr.supplierSelection?.selectedSupplierId);
    const sid = pr?.supplierSelection?.selectedSupplierId ?? '';
    const sup = sid ? getAllSupplierRecords().find((s) => s.id === sid) : undefined;
    const qty = pr?.quantity ?? 0;
    const unit = quote && Number.isFinite(quote.quotedPrice) ? quote.quotedPrice : 0;
    return normalizePo({
        id: 0,
        slug: 'new',
        poNumber: '',
        prSlug: pr?.slug ?? '',
        prNumber: pr?.prNumber ?? '',
        supplierId: sid,
        supplierName: sup?.name ?? '',
        material: pr?.material ?? '',
        quantity: qty,
        unitPrice: unit,
        currency: quote?.currency ?? 'INR',
        totalAmount: qty * unit,
        deliveryDate: ymd,
        status: 'Created',
        delivery: defaultDelivery(),
        activityLog: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
        archivedAt: null,
    });
}
