import { MOCK_SUPPLIERS } from '@/lib/suppliers/mockData';
import type { SupplierRecord, SupplierStatus, SupplierType } from '@/lib/suppliers/types';
import { cloneSupplierTabBundle, removeSupplierTabBundleOverride } from '@/lib/suppliers/supplierModuleStore';

const STORE_KEY = 'arris-suppliers-store-v1';
export const SUPPLIER_STORE_UPDATED_EVENT = 'arris-suppliers-store-updated';

export type SupplierFormPayload = {
    supplierId: string;
    supplierName: string;
    supplierType: string;
    categories: string[];
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    status: SupplierStatus;
};

function canUseStorage() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function emitUpdated() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(SUPPLIER_STORE_UPDATED_EVENT));
    }
}

function normalizeStored(raw: unknown): SupplierRecord[] {
    if (!Array.isArray(raw)) return [...MOCK_SUPPLIERS];
    const baseById = new Map(MOCK_SUPPLIERS.map((s) => [s.id, { ...s }]));
    const today = new Date().toISOString().slice(0, 10);
    return raw
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const row = item as Partial<SupplierRecord>;
            if (!row.id || !row.name) return null;
            const base = baseById.get(String(row.id)) ?? null;
            const createdAt = row.createdAt ?? base?.createdAt ?? today;
            const updatedAt = row.updatedAt ?? createdAt;
            return {
                ...(base ?? {}),
                ...row,
                id: String(row.id),
                name: String(row.name),
                categories: Array.isArray(row.categories) ? row.categories.map(String) : base?.categories ?? [],
                type: (row.type as SupplierType) ?? base?.type ?? 'Distributor',
                status: (row.status as SupplierStatus) ?? base?.status ?? 'Pending',
                rating: typeof row.rating === 'number' ? row.rating : base?.rating ?? 0,
                createdAt,
                updatedAt,
                contactPerson: row.contactPerson ?? base?.contactPerson ?? '',
                phone: row.phone ?? base?.phone ?? '',
                email: row.email ?? base?.email ?? '',
                city: row.city ?? base?.city ?? '',
                address: row.address ?? base?.address ?? '',
            } satisfies SupplierRecord;
        })
        .filter((v): v is SupplierRecord => !!v);
}

export function getAllSupplierRecords(): SupplierRecord[] {
    if (!canUseStorage()) return [...MOCK_SUPPLIERS];
    try {
        const raw = window.localStorage.getItem(STORE_KEY);
        if (!raw) return [...MOCK_SUPPLIERS];
        return normalizeStored(JSON.parse(raw));
    } catch {
        return [...MOCK_SUPPLIERS];
    }
}

export function getSupplierRecordById(supplierId: string): SupplierRecord | undefined {
    return getAllSupplierRecords().find((s) => s.id === supplierId);
}

export function saveSupplierFromForm(payload: SupplierFormPayload): SupplierRecord {
    const now = new Date().toISOString().slice(0, 10);
    const rows = getAllSupplierRecords();
    const existing = rows.find((s) => s.id === payload.supplierId.trim());
    const next: SupplierRecord = {
        id: payload.supplierId.trim(),
        name: payload.supplierName.trim(),
        type: (payload.supplierType || 'Distributor') as SupplierType,
        categories: payload.categories,
        contactPerson: payload.contactPerson.trim(),
        phone: payload.phone.trim(),
        email: payload.email.trim(),
        city: payload.city.trim(),
        status: payload.status,
        rating: existing?.rating ?? 4.0,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        address: payload.address.trim(),
    };
    const updatedRows = existing ? rows.map((r) => (r.id === next.id ? next : r)) : [next, ...rows];
    if (canUseStorage()) {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(updatedRows));
    }
    emitUpdated();
    return next;
}

export function deleteSupplierRecord(supplierId: string): boolean {
    const id = supplierId.trim();
    if (!id) return false;
    const rows = getAllSupplierRecords().filter((r) => r.id !== id);
    if (rows.length === getAllSupplierRecords().length) return false;
    if (canUseStorage()) {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(rows));
    }
    removeSupplierTabBundleOverride(id);
    emitUpdated();
    return true;
}

export function cloneSupplierRecord(supplierId: string): SupplierRecord | null {
    const source = getSupplierRecordById(supplierId.trim());
    if (!source) return null;
    const rows = getAllSupplierRecords();
    const existingIds = new Set(rows.map((r) => r.id));
    let candidate = '';
    let attempts = 0;
    while (!candidate || existingIds.has(candidate)) {
        candidate = `SUP-${Math.floor(3000 + Math.random() * 7000)}`;
        attempts += 1;
        if (attempts > 20000) return null;
    }
    const now = new Date().toISOString().slice(0, 10);
    const clone: SupplierRecord = {
        ...source,
        id: candidate,
        name: `${source.name} (Copy)`,
        status: 'Pending',
        rating: Math.max(0, source.rating - 0.2),
        createdAt: now,
        updatedAt: now,
    };
    const updatedRows = [clone, ...rows];
    if (canUseStorage()) {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(updatedRows));
    }
    cloneSupplierTabBundle(source.id, clone.id);
    emitUpdated();
    return clone;
}

/** Partial update for inline edit on the supplier profile page (id cannot change). */
export type SupplierCorePatch = Partial<
    Pick<SupplierRecord, 'name' | 'type' | 'categories' | 'contactPerson' | 'phone' | 'email' | 'city' | 'status' | 'address'>
>;

export function patchSupplierRecord(supplierId: string, patch: SupplierCorePatch): SupplierRecord | null {
    const id = supplierId.trim();
    if (!id) return null;
    const rows = getAllSupplierRecords();
    const existing = rows.find((s) => s.id === id);
    if (!existing) return null;
    const next: SupplierRecord = { ...existing };
    (Object.keys(patch) as (keyof SupplierCorePatch)[]).forEach((key) => {
        const v = patch[key];
        if (v === undefined) return;
        (next as Record<string, unknown>)[key] = v;
    });
    next.updatedAt = new Date().toISOString().slice(0, 10);
    const updatedRows = rows.map((row) => (row.id === id ? next : row));
    if (canUseStorage()) {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(updatedRows));
    }
    emitUpdated();
    return next;
}
