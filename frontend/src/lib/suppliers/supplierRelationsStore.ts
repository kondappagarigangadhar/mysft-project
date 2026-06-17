import { MOCK_SUPPLIER_TAB_BUNDLES } from '@/lib/suppliers/mockData';
import type {
    SupplierCapacityRow,
    SupplierComplianceRow,
    SupplierComplianceVerificationStatus,
    SupplierMaterialRow,
    SupplierPerformanceDeliveryRow,
    SupplierPricingRow,
    SupplierProcurementSelectionRow,
    SupplierTabBundle,
} from '@/lib/suppliers/types';

const KEY = 'arris-supplier-relations-v1';
export const SUPPLIER_RELATIONS_UPDATED_EVENT = 'arris-supplier-relations-updated';

export type SupplierRelationsStoreShape = {
    materials: SupplierMaterialRow[];
    pricing: SupplierPricingRow[];
    capacity: SupplierCapacityRow[];
    compliance: SupplierComplianceRow[];
    selections: SupplierProcurementSelectionRow[];
    performanceDeliveries: SupplierPerformanceDeliveryRow[];
};

function canUseStorage() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function emitUpdated() {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event(SUPPLIER_RELATIONS_UPDATED_EVENT));
}

function normalizeVerification(v: unknown): SupplierComplianceVerificationStatus {
    if (v === 'Verified' || v === 'Rejected' || v === 'Pending') return v;
    return 'Pending';
}

function normalizeComplianceRows(rows: unknown): SupplierComplianceRow[] {
    const seed = flattenSeed().compliance;
    if (!Array.isArray(rows)) return seed;
    return rows.map((r) => {
        const row = r as SupplierComplianceRow & { verificationStatus?: string };
        const expiryDate = typeof row.expiryDate === 'string' ? row.expiryDate : '';
        const rawStatus = String((row as { verificationStatus?: string }).verificationStatus ?? '');
        return {
            ...row,
            expiryDate,
            verificationStatus: rawStatus === 'Expired' ? 'Pending' : normalizeVerification(row.verificationStatus),
            fileMime: typeof row.fileMime === 'string' ? row.fileMime : undefined,
        };
    });
}

function normalizeMaterialRow(row: SupplierMaterialRow, fallbackCode: string): SupplierMaterialRow {
    return {
        ...row,
        materialCode: typeof row.materialCode === 'string' && row.materialCode.trim() ? row.materialCode.trim() : fallbackCode,
        description: typeof row.description === 'string' ? row.description : '',
    };
}

function normalizeMaterials(rows: SupplierMaterialRow[], seed: SupplierMaterialRow[]): SupplierMaterialRow[] {
    if (!Array.isArray(rows)) return seed;
    const seq = 1020;
    return rows.map((r, i) => {
        const code = typeof r.materialCode === 'string' && r.materialCode.trim() ? r.materialCode.trim() : `MAT-${seq + i + 1}`;
        return normalizeMaterialRow(r as SupplierMaterialRow, code);
    });
}

export function nextSupplierMaterialCode(): string {
    const rows = load().materials;
    let max = 1000;
    for (const r of rows) {
        const m = /^MAT-(\d+)$/i.exec(r.materialCode?.trim() ?? '');
        if (m) max = Math.max(max, Number(m[1]));
    }
    return `MAT-${max + 1}`;
}

function flattenSeed(): SupplierRelationsStoreShape {
    const bundles: SupplierTabBundle[] = Object.values(MOCK_SUPPLIER_TAB_BUNDLES);
    const materials = bundles.flatMap((b) => b.materials);
    return {
        materials: normalizeMaterials(materials, materials),
        pricing: bundles.flatMap((b) => b.pricing),
        capacity: bundles.flatMap((b) => b.capacity),
        compliance: bundles.flatMap((b) => b.compliance),
        selections: bundles.flatMap((b) => b.selections ?? []),
        performanceDeliveries: bundles.flatMap((b) => b.performanceDeliveries ?? []),
    };
}

function load(): SupplierRelationsStoreShape {
    if (!canUseStorage()) return flattenSeed();
    try {
        const raw = window.localStorage.getItem(KEY);
        if (!raw) return flattenSeed();
        const parsed = JSON.parse(raw) as Partial<SupplierRelationsStoreShape> & { compliance?: unknown; performanceDeliveries?: unknown; selections?: unknown };
        if (!parsed || typeof parsed !== 'object') return flattenSeed();
        const seed = flattenSeed();
        return {
            materials: normalizeMaterials(
                Array.isArray(parsed.materials) ? (parsed.materials as SupplierMaterialRow[]) : seed.materials,
                seed.materials,
            ),
            pricing: Array.isArray(parsed.pricing) ? parsed.pricing : seed.pricing,
            capacity: Array.isArray(parsed.capacity) ? parsed.capacity : seed.capacity,
            compliance: normalizeComplianceRows(parsed.compliance),
            selections: Array.isArray(parsed.selections) ? (parsed.selections as SupplierProcurementSelectionRow[]) : seed.selections,
            performanceDeliveries: Array.isArray(parsed.performanceDeliveries)
                ? (parsed.performanceDeliveries as SupplierPerformanceDeliveryRow[])
                : seed.performanceDeliveries,
        };
    } catch {
        return flattenSeed();
    }
}

function persist(next: SupplierRelationsStoreShape) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function getAllSupplierMaterials(): SupplierMaterialRow[] {
    return load().materials;
}
export function getAllSupplierPricing(): SupplierPricingRow[] {
    return load().pricing;
}
export function getAllSupplierCapacity(): SupplierCapacityRow[] {
    return load().capacity;
}
export function getAllSupplierCompliance(): SupplierComplianceRow[] {
    return load().compliance;
}
export function getAllSupplierSelections(): SupplierProcurementSelectionRow[] {
    return load().selections;
}
export function getAllSupplierPerformanceDeliveries(): SupplierPerformanceDeliveryRow[] {
    return load().performanceDeliveries;
}

export function getSupplierMaterialsBySupplierId(supplierId: string): SupplierMaterialRow[] {
    const id = supplierId.trim();
    return getAllSupplierMaterials().filter((r) => r.supplierId === id);
}
export function getSupplierPricingBySupplierId(supplierId: string): SupplierPricingRow[] {
    const id = supplierId.trim();
    return getAllSupplierPricing().filter((r) => r.supplierId === id);
}
export function getSupplierCapacityBySupplierId(supplierId: string): SupplierCapacityRow[] {
    const id = supplierId.trim();
    return getAllSupplierCapacity().filter((r) => r.supplierId === id);
}
export function getSupplierComplianceBySupplierId(supplierId: string): SupplierComplianceRow[] {
    const id = supplierId.trim();
    return getAllSupplierCompliance().filter((r) => r.supplierId === id);
}
export function getSupplierSelectionsBySupplierId(supplierId: string): SupplierProcurementSelectionRow[] {
    const id = supplierId.trim();
    return getAllSupplierSelections().filter((r) => r.supplierId === id);
}
export function getSupplierPerformanceBySupplierId(supplierId: string): SupplierPerformanceDeliveryRow[] {
    const id = supplierId.trim();
    return getAllSupplierPerformanceDeliveries().filter((r) => r.supplierId === id);
}

export function validateMaterialRow(row: Pick<SupplierMaterialRow, 'supplierId' | 'materialName' | 'category' | 'unit'>): string | null {
    if (!row.supplierId.trim()) return 'Supplier ID is required.';
    if (!row.materialName.trim()) return 'Material name is required.';
    if (!row.category.trim()) return 'Category is required.';
    if (!row.unit.trim()) return 'Unit is required.';
    return null;
}

export function addSupplierMaterial(
    input: Omit<SupplierMaterialRow, 'id' | 'materialCode' | 'description'> & { materialCode?: string; description?: string },
): { ok: true; row: SupplierMaterialRow } | { ok: false; error: string } {
    const err = validateMaterialRow(input);
    if (err) return { ok: false, error: err };
    const s = load();
    const materialCode = input.materialCode?.trim() || nextSupplierMaterialCode();
    const row: SupplierMaterialRow = {
        ...input,
        materialCode,
        description: input.description?.trim() ?? '',
        id: `sm-${Date.now()}`,
    };
    const next = { ...s, materials: [row, ...s.materials] };
    persist(next);
    emitUpdated();
    return { ok: true, row };
}

export function validatePricingRow(row: Pick<SupplierPricingRow, 'unitPrice' | 'effectiveDate' | 'validTill'>): string | null {
    if (!(row.unitPrice > 0)) return 'Price must be greater than 0.';
    if (row.validTill.trim() && row.validTill < row.effectiveDate) return 'Valid Till must be on or after Effective Date.';
    return null;
}

export function addSupplierPricing(input: Omit<SupplierPricingRow, 'id'>): { ok: true; row: SupplierPricingRow } | { ok: false; error: string } {
    const err = validatePricingRow(input);
    if (err) return { ok: false, error: err };
    const s = load();
    const row: SupplierPricingRow = { ...input, id: `sp-${Date.now()}` };
    const next = { ...s, pricing: [row, ...s.pricing] };
    persist(next);
    emitUpdated();
    return { ok: true, row };
}

export function validateCapacityRow(row: Pick<SupplierCapacityRow, 'dailyCapacity' | 'leadTimeDays'>): string | null {
    if (!(row.dailyCapacity > 0)) return 'Capacity must be greater than 0.';
    if (!(row.leadTimeDays > 0)) return 'Lead time must be greater than 0.';
    return null;
}

export function addSupplierCapacity(input: Omit<SupplierCapacityRow, 'id'>): { ok: true; row: SupplierCapacityRow } | { ok: false; error: string } {
    const err = validateCapacityRow(input);
    if (err) return { ok: false, error: err };
    const s = load();
    const row: SupplierCapacityRow = { ...input, id: `sc-${Date.now()}` };
    const next = { ...s, capacity: [row, ...s.capacity] };
    persist(next);
    emitUpdated();
    return { ok: true, row };
}

export function validateComplianceRow(row: Pick<SupplierComplianceRow, 'documentType' | 'fileName'>): string | null {
    if (!row.documentType.trim()) return 'Document type is required.';
    if (!row.fileName.trim()) return 'File is required.';
    return null;
}

function validateNewComplianceExpiry(expiryDate: string): string | null {
    const exp = expiryDate.trim();
    if (!exp) return null;
    const today = new Date().toISOString().slice(0, 10);
    if (exp <= today) return 'Expiry date must be a future date when provided.';
    return null;
}

export function validatePerformanceDeliveryRow(
    row: Pick<SupplierPerformanceDeliveryRow, 'project' | 'material' | 'deliveryDate' | 'rating' | 'delayDays'>,
): string | null {
    if (!row.project.trim()) return 'Project is required.';
    if (!row.material.trim()) return 'Material is required.';
    if (!row.deliveryDate.trim()) return 'Delivery date is required.';
    if (!Number.isFinite(row.delayDays) || row.delayDays < 0) return 'Delay days must be zero or greater.';
    const r = row.rating;
    if (!Number.isFinite(r) || !Number.isInteger(r) || r < 1 || r > 5) return 'Rating must be a whole number from 1 to 5.';
    return null;
}

export function addSupplierCompliance(input: Omit<SupplierComplianceRow, 'id'>): { ok: true; row: SupplierComplianceRow } | { ok: false; error: string } {
    const err = validateComplianceRow(input);
    if (err) return { ok: false, error: err };
    const expErr = validateNewComplianceExpiry(input.expiryDate ?? '');
    if (expErr) return { ok: false, error: expErr };
    const s = load();
    const row: SupplierComplianceRow = { ...input, id: `sd-${Date.now()}` };
    const next = { ...s, compliance: [row, ...s.compliance] };
    persist(next);
    emitUpdated();
    return { ok: true, row };
}

function replaceById<T extends { id: string }>(rows: T[], next: T): T[] {
    return rows.map((r) => (r.id === next.id ? next : r));
}

export function updateSupplierMaterial(nextRow: SupplierMaterialRow): { ok: true } | { ok: false; error: string } {
    const err = validateMaterialRow(nextRow);
    if (err) return { ok: false, error: err };
    const s = load();
    persist({ ...s, materials: replaceById(s.materials, nextRow) });
    emitUpdated();
    return { ok: true };
}
export function deleteSupplierMaterial(id: string): boolean {
    const s = load();
    const next = s.materials.filter((r) => r.id !== id);
    if (next.length === s.materials.length) return false;
    persist({ ...s, materials: next });
    emitUpdated();
    return true;
}

export function updateSupplierPricing(nextRow: SupplierPricingRow): { ok: true } | { ok: false; error: string } {
    const err = validatePricingRow(nextRow);
    if (err) return { ok: false, error: err };
    const s = load();
    persist({ ...s, pricing: replaceById(s.pricing, nextRow) });
    emitUpdated();
    return { ok: true };
}
export function deleteSupplierPricing(id: string): boolean {
    const s = load();
    const next = s.pricing.filter((r) => r.id !== id);
    if (next.length === s.pricing.length) return false;
    persist({ ...s, pricing: next });
    emitUpdated();
    return true;
}

export function updateSupplierCapacity(nextRow: SupplierCapacityRow): { ok: true } | { ok: false; error: string } {
    const err = validateCapacityRow(nextRow);
    if (err) return { ok: false, error: err };
    const s = load();
    persist({ ...s, capacity: replaceById(s.capacity, nextRow) });
    emitUpdated();
    return { ok: true };
}
export function deleteSupplierCapacity(id: string): boolean {
    const s = load();
    const next = s.capacity.filter((r) => r.id !== id);
    if (next.length === s.capacity.length) return false;
    persist({ ...s, capacity: next });
    emitUpdated();
    return true;
}

export function updateSupplierCompliance(nextRow: SupplierComplianceRow): { ok: true } | { ok: false; error: string } {
    const err = validateComplianceRow(nextRow);
    if (err) return { ok: false, error: err };
    const expErr = validateNewComplianceExpiry(nextRow.expiryDate ?? '');
    if (expErr) return { ok: false, error: expErr };
    const s = load();
    persist({ ...s, compliance: replaceById(s.compliance, nextRow) });
    emitUpdated();
    return { ok: true };
}
export function deleteSupplierCompliance(id: string): boolean {
    const s = load();
    const next = s.compliance.filter((r) => r.id !== id);
    if (next.length === s.compliance.length) return false;
    persist({ ...s, compliance: next });
    emitUpdated();
    return true;
}

export function validateSelectionRow(row: Pick<SupplierProcurementSelectionRow, 'selectedSupplierId' | 'material'>): string | null {
    if (!row.selectedSupplierId.trim()) return 'Supplier is required.';
    if (!row.material.trim()) return 'Material is required.';
    return null;
}

export function addSupplierSelection(
    input: Omit<SupplierProcurementSelectionRow, 'id'>,
): { ok: true; row: SupplierProcurementSelectionRow } | { ok: false; error: string } {
    const err = validateSelectionRow(input);
    if (err) return { ok: false, error: err };
    const s = load();
    const row: SupplierProcurementSelectionRow = { ...input, id: `ssel-${Date.now()}` };
    const next = { ...s, selections: [row, ...(s.selections ?? [])] };
    persist(next);
    emitUpdated();
    return { ok: true, row };
}

export function updateSupplierSelection(nextRow: SupplierProcurementSelectionRow): { ok: true } | { ok: false; error: string } {
    const err = validateSelectionRow(nextRow);
    if (err) return { ok: false, error: err };
    const s = load();
    persist({ ...s, selections: replaceById(s.selections ?? [], nextRow) });
    emitUpdated();
    return { ok: true };
}

export function deleteSupplierSelection(id: string): boolean {
    const s = load();
    const next = (s.selections ?? []).filter((r) => r.id !== id);
    if (next.length === (s.selections ?? []).length) return false;
    persist({ ...s, selections: next });
    emitUpdated();
    return true;
}

export function addSupplierPerformanceDelivery(
    input: Omit<SupplierPerformanceDeliveryRow, 'id'>,
): { ok: true; row: SupplierPerformanceDeliveryRow } | { ok: false; error: string } {
    const err = validatePerformanceDeliveryRow(input);
    if (err) return { ok: false, error: err };
    const s = load();
    const row: SupplierPerformanceDeliveryRow = { ...input, id: `sperf-${Date.now()}` };
    const next = { ...s, performanceDeliveries: [row, ...s.performanceDeliveries] };
    persist(next);
    emitUpdated();
    return { ok: true, row };
}

export function updateSupplierPerformanceDelivery(
    nextRow: SupplierPerformanceDeliveryRow,
): { ok: true } | { ok: false; error: string } {
    const err = validatePerformanceDeliveryRow(nextRow);
    if (err) return { ok: false, error: err };
    const s = load();
    persist({ ...s, performanceDeliveries: replaceById(s.performanceDeliveries, nextRow) });
    emitUpdated();
    return { ok: true };
}

export function deleteSupplierPerformanceDelivery(id: string): boolean {
    const s = load();
    const next = s.performanceDeliveries.filter((r) => r.id !== id);
    if (next.length === s.performanceDeliveries.length) return false;
    persist({ ...s, performanceDeliveries: next });
    emitUpdated();
    return true;
}

