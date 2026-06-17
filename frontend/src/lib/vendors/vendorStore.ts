import { MOCK_VENDORS } from '@/lib/vendors/mockData';
import type { Vendor, VendorStatus, VendorType } from '@/lib/vendors/types';

export type VendorRecord = Vendor & {
    address: string;
    pincode: string;
    onboardedDate: string;
    notes: string;
};

type VendorFormPayload = {
    vendorId: string;
    vendorName: string;
    vendorType: string;
    categories: string[];
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    status: string;
    onboardedDate: string;
    notes: string;
    primaryProject: string;
};

const STORE_KEY = 'arris-vendors-store-v1';
export const VENDOR_STORE_UPDATED_EVENT = 'arris-vendors-store-updated';

function withDefaults(vendor: Vendor): VendorRecord {
    return {
        ...vendor,
        address: '',
        pincode: '',
        onboardedDate: vendor.createdAt,
        notes: '',
    };
}

function canUseStorage() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeStored(raw: unknown): VendorRecord[] {
    if (!Array.isArray(raw)) return MOCK_VENDORS.map(withDefaults);
    const baseById = new Map(MOCK_VENDORS.map((v) => [v.id, withDefaults(v)]));
    return raw
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const row = item as Partial<VendorRecord>;
            if (!row.id || !row.name) return null;
            const base = baseById.get(row.id) ?? null;
            return {
                ...(base ?? {}),
                ...row,
                id: String(row.id),
                name: String(row.name),
                categories: Array.isArray(row.categories) ? row.categories.map(String) : base?.categories ?? [],
                type: (row.type as VendorType) ?? base?.type ?? 'Contractor',
                status: (row.status as VendorStatus) ?? base?.status ?? 'Pending',
                rating: typeof row.rating === 'number' ? row.rating : base?.rating ?? 0,
                compliancePercent: typeof row.compliancePercent === 'number' ? row.compliancePercent : base?.compliancePercent ?? 0,
                docsComplete: typeof row.docsComplete === 'number' ? row.docsComplete : base?.docsComplete ?? 0,
                delays: typeof row.delays === 'number' ? row.delays : base?.delays ?? 0,
                slaBreaches: typeof row.slaBreaches === 'number' ? row.slaBreaches : base?.slaBreaches ?? 0,
                availability: (row.availability as VendorRecord['availability']) ?? base?.availability ?? 'Medium',
                contractStatus: (row.contractStatus as VendorRecord['contractStatus']) ?? base?.contractStatus ?? 'Draft',
                createdAt: row.createdAt ?? base?.createdAt ?? new Date().toISOString().slice(0, 10),
                contactPerson: row.contactPerson ?? base?.contactPerson ?? '',
                phone: row.phone ?? base?.phone ?? '',
                email: row.email ?? base?.email ?? '',
                city: row.city ?? base?.city ?? '',
                state: row.state ?? base?.state ?? '',
                country: row.country ?? base?.country ?? 'India',
                primaryProject: row.primaryProject ?? base?.primaryProject ?? '',
                address: row.address ?? base?.address ?? '',
                pincode: row.pincode ?? base?.pincode ?? '',
                onboardedDate: row.onboardedDate ?? base?.onboardedDate ?? (row.createdAt ?? new Date().toISOString().slice(0, 10)),
                notes: row.notes ?? base?.notes ?? '',
            } satisfies VendorRecord;
        })
        .filter((v): v is VendorRecord => !!v);
}

function emitUpdated() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(VENDOR_STORE_UPDATED_EVENT));
    }
}

export function getAllVendorRecords(): VendorRecord[] {
    if (!canUseStorage()) return MOCK_VENDORS.map(withDefaults);
    try {
        const raw = window.localStorage.getItem(STORE_KEY);
        if (!raw) return MOCK_VENDORS.map(withDefaults);
        return normalizeStored(JSON.parse(raw));
    } catch {
        return MOCK_VENDORS.map(withDefaults);
    }
}

export function getVendorRecordById(vendorId: string): VendorRecord | undefined {
    return getAllVendorRecords().find((v) => v.id === vendorId);
}

export function saveVendorFromForm(payload: VendorFormPayload): VendorRecord {
    const now = new Date().toISOString().slice(0, 10);
    const rows = getAllVendorRecords();
    const existing = rows.find((v) => v.id === payload.vendorId);
    const next: VendorRecord = {
        id: payload.vendorId.trim(),
        name: payload.vendorName.trim(),
        type: (payload.vendorType || 'Contractor') as VendorType,
        categories: payload.categories,
        contactPerson: payload.contactPerson.trim(),
        phone: payload.phone.trim(),
        email: payload.email.trim(),
        city: payload.city.trim(),
        state: payload.state.trim(),
        country: payload.country.trim() || 'India',
        status: (payload.status || 'Pending') as VendorStatus,
        rating: existing?.rating ?? 0,
        compliancePercent: existing?.compliancePercent ?? 0,
        contractStatus: existing?.contractStatus ?? 'Draft',
        docsComplete: existing?.docsComplete ?? 0,
        delays: existing?.delays ?? 0,
        slaBreaches: existing?.slaBreaches ?? 0,
        availability: existing?.availability ?? 'Medium',
        primaryProject: payload.primaryProject.trim() || existing?.primaryProject || '',
        createdAt: existing?.createdAt ?? payload.onboardedDate ?? now,
        address: payload.address.trim(),
        pincode: payload.pincode.trim(),
        onboardedDate: payload.onboardedDate || existing?.onboardedDate || now,
        notes: payload.notes.trim(),
    };

    const updatedRows = existing ? rows.map((r) => (r.id === next.id ? next : r)) : [next, ...rows];
    if (canUseStorage()) {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(updatedRows));
    }
    emitUpdated();
    return next;
}

export function updateVendorStatus(vendorId: string, status: VendorStatus): VendorRecord | null {
    const id = vendorId.trim();
    if (!id) return null;
    const rows = getAllVendorRecords();
    const existing = rows.find((v) => v.id === id);
    if (!existing) return null;
    const next: VendorRecord = { ...existing, status };
    const updatedRows = rows.map((row) => (row.id === id ? next : row));
    if (canUseStorage()) {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(updatedRows));
    }
    emitUpdated();
    return next;
}

/** Partial update for inline edit on the vendor view page (id cannot change). */
export type VendorCorePatch = Partial<
    Pick<
        VendorRecord,
        | 'name'
        | 'type'
        | 'categories'
        | 'contactPerson'
        | 'phone'
        | 'email'
        | 'city'
        | 'state'
        | 'country'
        | 'status'
        | 'address'
        | 'pincode'
        | 'onboardedDate'
        | 'notes'
        | 'primaryProject'
    >
>;

export function patchVendorRecord(vendorId: string, patch: VendorCorePatch): VendorRecord | null {
    const id = vendorId.trim();
    if (!id) return null;
    const rows = getAllVendorRecords();
    const existing = rows.find((v) => v.id === id);
    if (!existing) return null;
    const next: VendorRecord = { ...existing };
    (Object.keys(patch) as (keyof VendorCorePatch)[]).forEach((key) => {
        const v = patch[key];
        if (v === undefined) return;
        (next as Record<string, unknown>)[key] = v;
    });
    const updatedRows = rows.map((row) => (row.id === id ? next : row));
    if (canUseStorage()) {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(updatedRows));
    }
    emitUpdated();
    return next;
}

export function cloneVendorRecord(vendorId: string): VendorRecord | null {
    const source = getVendorRecordById(vendorId.trim());
    if (!source) return null;

    const rows = getAllVendorRecords();
    const existingIds = new Set(rows.map((r) => r.id));
    let candidate = '';
    let attempts = 0;
    while (!candidate || existingIds.has(candidate)) {
        candidate = `VND-${Math.floor(2000 + Math.random() * 7000)}`;
        attempts += 1;
        if (attempts > 20000) return null;
    }

    const now = new Date().toISOString().slice(0, 10);
    const clone: VendorRecord = {
        ...source,
        id: candidate,
        name: `${source.name} (Copy)`,
        status: 'Pending',
        createdAt: now,
        onboardedDate: now,
    };
    const updatedRows = [clone, ...rows];
    if (canUseStorage()) {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(updatedRows));
    }
    emitUpdated();
    return clone;
}

export function deleteVendorRecord(vendorId: string): boolean {
    const id = vendorId.trim();
    if (!id) return false;
    const rows = getAllVendorRecords();
    if (!rows.some((r) => r.id === id)) return false;
    const updatedRows = rows.filter((row) => row.id !== id);
    if (canUseStorage()) {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(updatedRows));
    }
    emitUpdated();
    return true;
}
