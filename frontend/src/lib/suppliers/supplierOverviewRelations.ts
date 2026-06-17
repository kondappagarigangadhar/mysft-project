import {
    addSupplierCapacity,
    addSupplierCompliance,
    addSupplierMaterial,
    addSupplierPricing,
    addSupplierSelection,
    deleteSupplierCapacity,
    deleteSupplierCompliance,
    deleteSupplierMaterial,
    deleteSupplierPricing,
    deleteSupplierSelection,
    getSupplierCapacityBySupplierId,
    getSupplierComplianceBySupplierId,
    getSupplierMaterialsBySupplierId,
    getSupplierPricingBySupplierId,
    getSupplierSelectionsBySupplierId,
    nextSupplierMaterialCode,
    updateSupplierCapacity,
    updateSupplierCompliance,
    updateSupplierMaterial,
    updateSupplierPricing,
    updateSupplierSelection,
    validateCapacityRow,
    validateComplianceRow,
    validateMaterialRow,
    validatePricingRow,
    validateSelectionRow,
} from '@/lib/suppliers/supplierRelationsStore';
import type { SupplierCapacityRow, SupplierComplianceRow, SupplierMaterialRow, SupplierPricingRow, SupplierProcurementSelectionRow } from '@/lib/suppliers/types';

export type SupplierRelationsDraft = {
    materials: SupplierMaterialRow[];
    pricing: SupplierPricingRow[];
    capacity: SupplierCapacityRow[];
    compliance: SupplierComplianceRow[];
    selections: SupplierProcurementSelectionRow[];
};

export function loadSupplierRelationsDraft(supplierId: string): SupplierRelationsDraft {
    return {
        materials: getSupplierMaterialsBySupplierId(supplierId).map((r) => ({ ...r })),
        pricing: getSupplierPricingBySupplierId(supplierId).map((r) => ({ ...r })),
        capacity: getSupplierCapacityBySupplierId(supplierId).map((r) => ({ ...r })),
        compliance: getSupplierComplianceBySupplierId(supplierId).map((r) => ({ ...r })),
        selections: getSupplierSelectionsBySupplierId(supplierId).map((r) => ({ ...r })),
    };
}

function rowChanged<T extends Record<string, unknown>>(a: T, b: T, keys: (keyof T)[]): boolean {
    return keys.some((k) => a[k] !== b[k]);
}

export function relationsDraftIsDirty(baseline: SupplierRelationsDraft, draft: SupplierRelationsDraft): boolean {
    const matKeys: (keyof SupplierMaterialRow)[] = ['materialCode', 'materialName', 'category', 'unit', 'description'];
    const priceKeys: (keyof SupplierPricingRow)[] = ['material', 'unitPrice', 'effectiveDate', 'validTill', 'status'];
    const capKeys: (keyof SupplierCapacityRow)[] = ['material', 'dailyCapacity', 'leadTimeDays', 'availabilityStatus'];
    const docKeys: (keyof SupplierComplianceRow)[] = ['documentType', 'fileName', 'fileUrl', 'fileMime', 'expiryDate', 'verificationStatus'];
    const selKeys: (keyof SupplierProcurementSelectionRow)[] = ['selectedSupplierId', 'material'];

    const baseMatIds = new Set(baseline.materials.map((r) => r.id));
    const draftMatIds = new Set(draft.materials.map((r) => r.id));
    if (baseline.materials.length !== draft.materials.length) return true;
    for (const id of baseMatIds) if (!draftMatIds.has(id)) return true;
    for (const d of draft.materials) {
        const b = baseline.materials.find((r) => r.id === d.id);
        if (!b || rowChanged(d, b, matKeys)) return true;
    }

    const basePIds = new Set(baseline.pricing.map((r) => r.id));
    const draftPIds = new Set(draft.pricing.map((r) => r.id));
    if (baseline.pricing.length !== draft.pricing.length) return true;
    for (const id of basePIds) if (!draftPIds.has(id)) return true;
    for (const d of draft.pricing) {
        const b = baseline.pricing.find((r) => r.id === d.id);
        if (!b || rowChanged(d, b, priceKeys)) return true;
    }

    const baseCIds = new Set(baseline.capacity.map((r) => r.id));
    const draftCIds = new Set(draft.capacity.map((r) => r.id));
    if (baseline.capacity.length !== draft.capacity.length) return true;
    for (const id of baseCIds) if (!draftCIds.has(id)) return true;
    for (const d of draft.capacity) {
        const b = baseline.capacity.find((r) => r.id === d.id);
        if (!b || rowChanged(d, b, capKeys)) return true;
    }

    const baseDocIds = new Set(baseline.compliance.map((r) => r.id));
    const draftDocIds = new Set(draft.compliance.map((r) => r.id));
    if (baseline.compliance.length !== draft.compliance.length) return true;
    for (const id of baseDocIds) if (!draftDocIds.has(id)) return true;
    for (const d of draft.compliance) {
        const b = baseline.compliance.find((r) => r.id === d.id);
        if (!b || rowChanged(d, b, docKeys)) return true;
    }

    const baseSelIds = new Set(baseline.selections.map((r) => r.id));
    const draftSelIds = new Set(draft.selections.map((r) => r.id));
    if (baseline.selections.length !== draft.selections.length) return true;
    for (const id of baseSelIds) if (!draftSelIds.has(id)) return true;
    for (const d of draft.selections) {
        const b = baseline.selections.find((r) => r.id === d.id);
        if (!b || rowChanged(d, b, selKeys)) return true;
    }

    return false;
}

export type RelationsFieldErrors = Record<string, string>;

function errKey(section: string, id: string, field: string) {
    return `${section}:${id}:${field}`;
}

export function validateRelationsDraft(draft: SupplierRelationsDraft): RelationsFieldErrors {
    const errors: RelationsFieldErrors = {};
    const today = new Date().toISOString().slice(0, 10);
    for (const m of draft.materials) {
        const e = validateMaterialRow(m);
        if (e) errors[errKey('material', m.id, '_row')] = e;
        if (!m.materialName.trim()) errors[errKey('material', m.id, 'materialName')] = 'Material name is required.';
        if (!m.category.trim()) errors[errKey('material', m.id, 'category')] = 'Category is required.';
        if (!m.unit.trim()) errors[errKey('material', m.id, 'unit')] = 'Unit is required.';
    }
    for (const p of draft.pricing) {
        if (!p.material.trim()) errors[errKey('pricing', p.id, 'material')] = 'Material is required.';
        if (!(p.unitPrice > 0)) errors[errKey('pricing', p.id, 'unitPrice')] = 'Price must be greater than 0.';
        if (!p.effectiveDate.trim()) errors[errKey('pricing', p.id, 'effectiveDate')] = 'Effective date is required.';
        const rowErr = validatePricingRow(p);
        if (rowErr && !errors[errKey('pricing', p.id, 'unitPrice')]) errors[errKey('pricing', p.id, '_row')] = rowErr;
    }
    for (const c of draft.capacity) {
        if (!c.material.trim()) errors[errKey('capacity', c.id, 'material')] = 'Material is required.';
        const rowErr = validateCapacityRow(c);
        if (rowErr) errors[errKey('capacity', c.id, '_row')] = rowErr;
        if (!(c.dailyCapacity > 0)) errors[errKey('capacity', c.id, 'dailyCapacity')] = 'Daily capacity must be greater than 0.';
        if (!(c.leadTimeDays > 0)) errors[errKey('capacity', c.id, 'leadTimeDays')] = 'Lead time must be greater than 0.';
    }
    for (const d of draft.compliance) {
        const rowErr = validateComplianceRow(d);
        if (rowErr) errors[errKey('compliance', d.id, '_row')] = rowErr;
        if (!d.documentType.trim()) errors[errKey('compliance', d.id, 'documentType')] = 'Document type is required.';
        if (!d.fileName.trim()) errors[errKey('compliance', d.id, 'fileName')] = 'File is required.';
        if (d.expiryDate?.trim() && d.expiryDate <= today) errors[errKey('compliance', d.id, 'expiryDate')] = 'Expiry date must be a future date when provided.';
    }
    for (const s of draft.selections) {
        const rowErr = validateSelectionRow(s);
        if (rowErr) errors[errKey('selection', s.id, '_row')] = rowErr;
        if (!s.selectedSupplierId.trim()) errors[errKey('selection', s.id, 'selectedSupplierId')] = 'Supplier is required.';
        if (!s.material.trim()) errors[errKey('selection', s.id, 'material')] = 'Material is required.';
    }
    return errors;
}

function isNewDraftId(id: string) {
    return id.startsWith('draft-');
}

export function persistSupplierRelationsDraft(
    supplierId: string,
    draft: SupplierRelationsDraft,
    baseline: SupplierRelationsDraft,
): { ok: true } | { ok: false; error: string } {
    const draftMatIds = new Set(draft.materials.map((r) => r.id));
    for (const b of baseline.materials) {
        if (!draftMatIds.has(b.id)) {
            deleteSupplierMaterial(b.id);
        }
    }
    for (const row of draft.materials) {
        if (isNewDraftId(row.id)) {
            const code = row.materialCode?.trim() || nextSupplierMaterialCode();
            const res = addSupplierMaterial({
                supplierId,
                materialCode: code,
                materialName: row.materialName.trim(),
                category: row.category.trim(),
                unit: row.unit.trim(),
                description: row.description?.trim(),
            });
            if (!res.ok) return res;
        } else {
            const res = updateSupplierMaterial({ ...row, supplierId });
            if (!res.ok) return res;
        }
    }

    const draftPIds = new Set(draft.pricing.map((r) => r.id));
    for (const b of baseline.pricing) {
        if (!draftPIds.has(b.id)) deleteSupplierPricing(b.id);
    }
    for (const row of draft.pricing) {
        if (isNewDraftId(row.id)) {
            const res = addSupplierPricing({
                supplierId,
                material: row.material.trim(),
                unitPrice: row.unitPrice,
                currency: row.currency || 'INR',
                effectiveDate: row.effectiveDate,
                validTill: row.validTill || '',
                status: row.status,
            });
            if (!res.ok) return res;
        } else {
            const res = updateSupplierPricing({ ...row, supplierId });
            if (!res.ok) return res;
        }
    }

    const draftCIds = new Set(draft.capacity.map((r) => r.id));
    for (const b of baseline.capacity) {
        if (!draftCIds.has(b.id)) deleteSupplierCapacity(b.id);
    }
    for (const row of draft.capacity) {
        if (isNewDraftId(row.id)) {
            const res = addSupplierCapacity({
                supplierId,
                material: row.material.trim(),
                dailyCapacity: row.dailyCapacity,
                leadTimeDays: row.leadTimeDays,
                availabilityStatus: row.availabilityStatus,
            });
            if (!res.ok) return res;
        } else {
            const res = updateSupplierCapacity({ ...row, supplierId });
            if (!res.ok) return res;
        }
    }

    const draftDocIds = new Set(draft.compliance.map((r) => r.id));
    for (const b of baseline.compliance) {
        if (!draftDocIds.has(b.id)) deleteSupplierCompliance(b.id);
    }
    for (const row of draft.compliance) {
        if (isNewDraftId(row.id)) {
            const res = addSupplierCompliance({
                supplierId,
                documentType: row.documentType.trim(),
                fileName: row.fileName.trim(),
                fileUrl: row.fileUrl,
                fileMime: row.fileMime,
                expiryDate: row.expiryDate || '',
                verificationStatus: row.verificationStatus ?? 'Pending',
            });
            if (!res.ok) return res;
        } else {
            const res = updateSupplierCompliance({ ...row, supplierId });
            if (!res.ok) return res;
        }
    }

    const draftSelIds = new Set(draft.selections.map((r) => r.id));
    for (const b of baseline.selections) {
        if (!draftSelIds.has(b.id)) deleteSupplierSelection(b.id);
    }
    for (const row of draft.selections) {
        if (isNewDraftId(row.id)) {
            const res = addSupplierSelection({
                supplierId,
                selectedSupplierId: row.selectedSupplierId.trim(),
                material: row.material.trim(),
                tags: row.tags ?? [],
            });
            if (!res.ok) return res;
        } else {
            const res = updateSupplierSelection({ ...row, supplierId });
            if (!res.ok) return res;
        }
    }

    return { ok: true };
}

export function newDraftMaterialRow(supplierId: string, materialCode: string): SupplierMaterialRow {
    return {
        id: `draft-m-${Date.now()}`,
        supplierId,
        materialCode,
        materialName: '',
        category: '',
        unit: '',
        description: '',
    };
}

export function newDraftPricingRow(supplierId: string): SupplierPricingRow {
    const today = new Date().toISOString().slice(0, 10);
    return {
        id: `draft-p-${Date.now()}`,
        supplierId,
        material: '',
        unitPrice: 0,
        currency: 'INR',
        effectiveDate: today,
        validTill: '',
        status: 'Active',
    };
}

export function newDraftCapacityRow(supplierId: string): SupplierCapacityRow {
    return {
        id: `draft-c-${Date.now()}`,
        supplierId,
        material: '',
        dailyCapacity: 0,
        leadTimeDays: 1,
        availabilityStatus: 'Available',
    };
}

export function newDraftComplianceRow(supplierId: string): SupplierComplianceRow {
    return {
        id: `draft-d-${Date.now()}`,
        supplierId,
        documentType: '',
        fileName: '',
        fileUrl: '',
        fileMime: '',
        expiryDate: '',
        verificationStatus: 'Pending',
    };
}

export function newDraftSelectionRow(supplierId: string): SupplierProcurementSelectionRow {
    return {
        id: `draft-sel-${Date.now()}`,
        supplierId,
        selectedSupplierId: '',
        material: '',
        tags: [],
    };
}
