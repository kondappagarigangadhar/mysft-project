import { emptyTabBundle, MOCK_SUPPLIER_TAB_BUNDLES } from '@/lib/suppliers/mockData';
import type { SupplierTabBundle } from '@/lib/suppliers/types';

const MODULE_KEY = 'arris-supplier-modules-v1';
export const SUPPLIER_MODULE_UPDATED_EVENT = 'arris-supplier-modules-updated';

function canUseStorage() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function emit() {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(SUPPLIER_MODULE_UPDATED_EVENT));
}

function loadOverrides(): Record<string, SupplierTabBundle> {
    if (!canUseStorage()) return {};
    try {
        const raw = window.localStorage.getItem(MODULE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== 'object') return {};
        return parsed as Record<string, SupplierTabBundle>;
    } catch {
        return {};
    }
}

function persistOverrides(next: Record<string, SupplierTabBundle>) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(MODULE_KEY, JSON.stringify(next));
}

export function getSupplierTabBundle(supplierId: string): SupplierTabBundle {
    const id = supplierId.trim();
    const overrides = loadOverrides();
    if (overrides[id]) return overrides[id];
    return MOCK_SUPPLIER_TAB_BUNDLES[id] ?? emptyTabBundle();
}

/** Copy tab demo data when cloning a supplier that had seeded or overridden tabs. */
export function cloneSupplierTabBundle(fromId: string, toId: string) {
    const src = getSupplierTabBundle(fromId);
    const remapped: SupplierTabBundle = {
        materials: src.materials.map((r, i) => ({ ...r, id: `${toId}-m-${i + 1}`, supplierId: toId })),
        pricing: src.pricing.map((r, i) => ({ ...r, id: `${toId}-p-${i + 1}`, supplierId: toId })),
        capacity: src.capacity.map((r, i) => ({ ...r, id: `${toId}-c-${i + 1}`, supplierId: toId })),
        compliance: src.compliance.map((r, i) => ({ ...r, id: `${toId}-d-${i + 1}`, supplierId: toId })),
        performanceDeliveries: (src.performanceDeliveries ?? []).map((r, i) => ({
            ...r,
            id: `${toId}-perf-${i + 1}`,
            supplierId: toId,
        })),
    };
    const overrides = loadOverrides();
    overrides[toId] = remapped;
    persistOverrides(overrides);
    emit();
}

/** When a supplier is deleted, drop any override bundle. */
export function removeSupplierTabBundleOverride(supplierId: string) {
    const id = supplierId.trim();
    const overrides = loadOverrides();
    if (!overrides[id]) return;
    delete overrides[id];
    persistOverrides(overrides);
    emit();
}
