'use client';

import React, { useMemo, useRef, useState } from 'react';
import { EditableField, EditableSelect, EditableTextarea } from '@/components/leads/detail/InlineEditableSection';
import { OverviewCollapsibleSection, OverviewDetailCard, OverviewFieldRow } from '@/components/suppliers/supplierOverviewLayout';
import { Button } from '@/components/ui/Button';
import { SUPPLIER_CATEGORIES } from '@/lib/suppliers/mockData';
import type { RelationsFieldErrors } from '@/lib/suppliers/supplierOverviewRelations';
import {
    newDraftCapacityRow,
    newDraftComplianceRow,
    newDraftMaterialRow,
    newDraftPricingRow,
    newDraftSelectionRow,
} from '@/lib/suppliers/supplierOverviewRelations';
import { getAllSupplierCapacity, getAllSupplierPricing, nextSupplierMaterialCode } from '@/lib/suppliers/supplierRelationsStore';
import { supplierComplianceDateExpired, supplierComplianceDaysUntil } from '@/lib/suppliers/supplierComplianceUtils';
import { getAllSupplierRecords, getSupplierRecordById } from '@/lib/suppliers/supplierStore';
import type { SupplierCapacityRow, SupplierComplianceRow, SupplierMaterialRow, SupplierPricingRow, SupplierProcurementSelectionRow } from '@/lib/suppliers/types';
import { cn } from '@/lib/utils';
import { LuBoxes, LuDownload, LuEye, LuFile, LuGauge, LuIndianRupee, LuPlus, LuShieldCheck, LuTrash2, LuUsers } from 'react-icons/lu';

const EMPTY_FIELD = '—';
const MATERIAL_UNITS = ['Bag', 'MT', 'm³', 'Nos', 'kg', 'Litre', 'Ton', 'Sq.ft'] as const;
const PRICING_STATUS_OPTIONS = ['Active', 'Inactive'] as const;
function formatInr(amount: number) {
    return `₹${amount.toLocaleString('en-IN')}`;
}

function availabilityLabel(status: SupplierCapacityRow['availabilityStatus']) {
    if (status === 'Unavailable') return 'Not Available';
    return status;
}

function PricingStatusBadge({ status }: { status: SupplierPricingRow['status'] }) {
    const active = status === 'Active' || status === 'Ending Soon';
    const tone = active
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
        : status === 'Inactive' || status === 'Expired'
          ? 'border-slate-200 bg-slate-100 text-slate-700'
          : 'border-amber-200 bg-amber-50 text-amber-900';
    const label = status === 'Ending Soon' ? 'Active' : status === 'Inactive' ? 'Inactive' : status === 'Active' ? 'Active' : status;
    return <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', tone)}>{label === 'Active' || label === 'Inactive' ? label : status}</span>;
}

function AvailabilityBadge({ status }: { status: SupplierCapacityRow['availabilityStatus'] }) {
    const tone =
        status === 'Available'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : status === 'Limited'
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-slate-200 bg-slate-100 text-slate-700';
    return <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', tone)}>{availabilityLabel(status)}</span>;
}

function ComplianceStatusBadge({ doc }: { doc: SupplierComplianceRow }) {
    const expired = doc.expiryDate?.trim() ? supplierComplianceDateExpired(doc.expiryDate) : false;
    const label = expired ? 'Expired' : doc.verificationStatus;
    const tone =
        label === 'Verified'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : label === 'Pending'
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : label === 'Rejected'
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : 'border-orange-200 bg-orange-50 text-orange-900';
    return <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-semibold', tone)}>{label}</span>;
}

function ComplianceExpiryHint({ expiryDate }: { expiryDate: string }) {
    if (!expiryDate?.trim()) return null;
    const du = supplierComplianceDaysUntil(expiryDate);
    if (du === null || du < 0) return null;
    if (du > 30) return null;
    const tone = du <= 7 ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 bg-slate-50 text-slate-700';
    return <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', tone)}>{du === 0 ? 'Expires today' : `Expires in ${du}d`}</span>;
}

function TagBadge({ label }: { label: string }) {
    const tone =
        label === 'Best Price'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : label === 'Preferred Supplier'
              ? 'border-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] text-[var(--cta-button-bg)]'
              : label === 'Fast Delivery'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-slate-200 bg-slate-50 text-slate-700';
    return <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', tone)}>{label}</span>;
}

function fieldErr(errors: RelationsFieldErrors, section: string, id: string, field: string) {
    return errors[`${section}:${id}:${field}`] ?? errors[`${section}:${id}:_row`];
}

type Props = {
    supplierId: string;
    isEditing: boolean;
    onRequestEdit?: () => void;
    materials: SupplierMaterialRow[];
    pricing: SupplierPricingRow[];
    capacity: SupplierCapacityRow[];
    compliance: SupplierComplianceRow[];
    selections: SupplierProcurementSelectionRow[];
    errors: RelationsFieldErrors;
    onMaterialsChange: (rows: SupplierMaterialRow[]) => void;
    onPricingChange: (rows: SupplierPricingRow[]) => void;
    onCapacityChange: (rows: SupplierCapacityRow[]) => void;
    onComplianceChange: (rows: SupplierComplianceRow[]) => void;
    onSelectionsChange: (rows: SupplierProcurementSelectionRow[]) => void;
};

export function SupplierOverviewProcurementSections({
    supplierId,
    isEditing,
    onRequestEdit,
    materials,
    pricing,
    capacity,
    compliance,
    selections,
    errors,
    onMaterialsChange,
    onPricingChange,
    onCapacityChange,
    onComplianceChange,
    onSelectionsChange,
}: Props) {
    const [catalogOpen, setCatalogOpen] = useState(true);
    const [pricingOpen, setPricingOpen] = useState(true);
    const [capacityOpen, setCapacityOpen] = useState(true);
    const [complianceOpen, setComplianceOpen] = useState(true);
    const [selectionOpen, setSelectionOpen] = useState(true);

    const materialOptions = useMemo(
        () => materials.map((m) => m.materialName.trim()).filter(Boolean),
        [materials],
    );

    const [procurementMaterial, setProcurementMaterial] = useState<string>(() => materialOptions[0] ?? '');
    React.useEffect(() => {
        if (procurementMaterial) return;
        if (materialOptions[0]) setProcurementMaterial(materialOptions[0]);
    }, [materialOptions, procurementMaterial]);

    const catalogErrorCount = useMemo(
        () => materials.filter((m) => fieldErr(errors, 'material', m.id, 'materialName') || fieldErr(errors, 'material', m.id, '_row')).length,
        [errors, materials],
    );
    const pricingErrorCount = useMemo(
        () => pricing.filter((p) => fieldErr(errors, 'pricing', p.id, 'material') || fieldErr(errors, 'pricing', p.id, '_row')).length,
        [errors, pricing],
    );
    const capacityErrorCount = useMemo(
        () => capacity.filter((c) => fieldErr(errors, 'capacity', c.id, 'material') || fieldErr(errors, 'capacity', c.id, '_row')).length,
        [errors, capacity],
    );
    const complianceErrorCount = useMemo(
        () =>
            (compliance ?? []).filter(
                (d) => fieldErr(errors, 'compliance', d.id, 'documentType') || fieldErr(errors, 'compliance', d.id, '_row'),
            ).length,
        [errors, compliance],
    );
    const selectionErrorCount = useMemo(
        () =>
            (selections ?? []).filter(
                (s) => fieldErr(errors, 'selection', s.id, 'selectedSupplierId') || fieldErr(errors, 'selection', s.id, '_row'),
            ).length,
        [errors, selections],
    );

    const patchMaterial = (id: string, patch: Partial<SupplierMaterialRow>) => {
        onMaterialsChange(materials.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    };
    const patchPricing = (id: string, patch: Partial<SupplierPricingRow>) => {
        onPricingChange(pricing.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    };
    const patchCapacity = (id: string, patch: Partial<SupplierCapacityRow>) => {
        onCapacityChange(capacity.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    };

    const addMaterial = () => {
        onMaterialsChange([...materials, newDraftMaterialRow(supplierId, nextSupplierMaterialCode())]);
    };
    const addPrice = () => {
        onPricingChange([...pricing, newDraftPricingRow(supplierId)]);
    };
    const addCapacity = () => {
        onCapacityChange([...capacity, newDraftCapacityRow(supplierId)]);
    };
    const addDocument = () => {
        onComplianceChange([...(compliance ?? []), newDraftComplianceRow(supplierId)]);
    };
    const addSelection = () => {
        onSelectionsChange([...(selections ?? []), newDraftSelectionRow(supplierId)]);
    };

    const ensureEditMode = () => {
        if (isEditing) return;
        onRequestEdit?.();
    };

    const activeSuppliers = useMemo(() => getAllSupplierRecords().filter((r) => r.status === 'Active'), []);

    const complianceHealth = useMemo(() => {
        const rows = compliance ?? [];
        const total = rows.length;
        if (!total) return { total: 0, expired: 0, verified: 0, pending: 0, label: 'No docs' };
        let expired = 0;
        let verified = 0;
        let pending = 0;
        for (const d of rows) {
            if (d.expiryDate && supplierComplianceDateExpired(d.expiryDate)) expired += 1;
            else if (d.verificationStatus === 'Verified') verified += 1;
            else pending += 1;
        }
        const label = expired > 0 ? 'Action needed' : pending > 0 ? 'In review' : 'Healthy';
        return { total, expired, verified, pending, label };
    }, [compliance]);

    const onPreview = (row: SupplierComplianceRow) => {
        if (!row.fileUrl) return;
        try {
            window.open(row.fileUrl, '_blank', 'noopener,noreferrer');
        } catch {
            // ignore
        }
    };

    const downloadFile = (row: SupplierComplianceRow) => {
        if (!row.fileUrl) return;
        const a = document.createElement('a');
        a.href = row.fileUrl;
        a.download = row.fileName || 'document';
        a.click();
    };

    const docInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const pickDocFile = (id: string) => docInputRefs.current[id]?.click();
    const readFile = (file: File): Promise<{ url: string; mime: string; name: string }> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ url: String(reader.result), mime: file.type, name: file.name });
            reader.onerror = () => reject(new Error('read failed'));
            reader.readAsDataURL(file);
        });

    const patchCompliance = (id: string, patch: Partial<SupplierComplianceRow>) => {
        onComplianceChange(compliance.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    };
    const patchSelection = (id: string, patch: Partial<SupplierProcurementSelectionRow>) => {
        onSelectionsChange(selections.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    };

    const upsertSelection = (material: string, selectedSupplierId: string) => {
        const m = material.trim();
        const sid = selectedSupplierId.trim();
        if (!m || !sid) return;
        const existingIdx = (selections ?? []).findIndex((r) => r.material.trim() === m);
        if (existingIdx >= 0) {
            const row = (selections ?? [])[existingIdx]!;
            patchSelection(row.id, { selectedSupplierId: sid, material: m });
            return;
        }
        onSelectionsChange([...(selections ?? []), { id: `draft-sel-${Date.now()}`, supplierId, selectedSupplierId: sid, material: m, tags: [] }]);
    };

    type CompareCard = {
        supplierId: string;
        supplierName: string;
        rating: number;
        unitPrice: number | null;
        currency: string;
        availability: SupplierCapacityRow['availabilityStatus'] | null;
        dailyCapacity: number | null;
        leadTimeDays: number | null;
        isBestPrice: boolean;
        isFastDelivery: boolean;
        isHighCapacity: boolean;
        isRecommended: boolean;
    };

    const comparisonCards = useMemo((): CompareCard[] => {
        const mat = procurementMaterial.trim();
        if (!mat) return [];
        const pricingRows = getAllSupplierPricing().filter(
            (p) => p.material === mat && (p.status === 'Active' || p.status === 'Ending Soon'),
        );
        const capRows = getAllSupplierCapacity().filter((c) => c.material === mat);
        const best = pricingRows.reduce<{ supplierId: string; unitPrice: number; currency: string } | null>((acc, r) => {
            if (!acc || r.unitPrice < acc.unitPrice) return { supplierId: r.supplierId, unitPrice: r.unitPrice, currency: r.currency };
            return acc;
        }, null);

        const capBySupplier = new Map<string, SupplierCapacityRow>();
        capRows.forEach((c) => capBySupplier.set(c.supplierId, c));

        const out: CompareCard[] = [];
        for (const sup of activeSuppliers) {
            const pr = pricingRows.find((p) => p.supplierId === sup.id) ?? null;
            const cap = capBySupplier.get(sup.id) ?? null;

            // Keep UI neat: show only suppliers that match this material (pricing and/or capacity).
            if (!pr && !cap) continue;

            const unitPrice = pr ? pr.unitPrice : null;
            const currency = pr?.currency ?? 'INR';
            const availability = cap?.availabilityStatus ?? null;
            const dailyCapacity = cap?.dailyCapacity ?? null;
            const leadTimeDays = cap?.leadTimeDays ?? null;
            const isBestPrice = Boolean(best && best.supplierId === sup.id);
            const isFastDelivery = Boolean(leadTimeDays != null && leadTimeDays <= 2);
            const isHighCapacity = Boolean(dailyCapacity != null && dailyCapacity >= 2000);

            // AI-ish recommendation score (simple, explainable)
            let score = 0;
            if (unitPrice != null) score += isBestPrice ? 40 : 20;
            if (availability === 'Available') score += 25;
            else if (availability === 'Limited') score += 10;
            if (isFastDelivery) score += 15;
            score += Math.min(20, Math.round((sup.rating / 5) * 20));

            out.push({
                supplierId: sup.id,
                supplierName: sup.name,
                rating: sup.rating,
                unitPrice,
                currency,
                availability,
                dailyCapacity,
                leadTimeDays,
                isBestPrice,
                isFastDelivery,
                isHighCapacity,
                isRecommended: score >= 75,
            });
        }

        out.sort((a, b) => {
            const ap = a.unitPrice ?? Number.POSITIVE_INFINITY;
            const bp = b.unitPrice ?? Number.POSITIVE_INFINITY;
            return ap - bp || (b.rating - a.rating) || a.supplierName.localeCompare(b.supplierName);
        });
        return out.slice(0, 8);
    }, [activeSuppliers, procurementMaterial]);

    const availabilityFor = (supplierId2: string, material: string): SupplierCapacityRow['availabilityStatus'] | null => {
        const hit = getAllSupplierCapacity().find((c) => c.supplierId === supplierId2 && c.material === material);
        return hit?.availabilityStatus ?? null;
    };
    const bestPriceFor = (material: string): { supplierId: string; unitPrice: number } | null => {
        const rows = getAllSupplierPricing().filter(
            (p) => p.material === material && (p.status === 'Active' || p.status === 'Ending Soon') && activeSuppliers.some((s) => s.id === p.supplierId),
        );
        if (!rows.length) return null;
        let best = rows[0];
        for (const r of rows) if (r.unitPrice < best.unitPrice) best = r;
        return { supplierId: best.supplierId, unitPrice: best.unitPrice };
    };

    return (
        <div className="space-y-4">
            <div data-supplier-overview-anchor="materials">
            <OverviewCollapsibleSection
                title="MATERIAL CATALOG"
                icon={LuBoxes}
                tone="slate"
                open={catalogOpen}
                onOpenChange={setCatalogOpen}
                headerRight={
                    <span className="flex items-center gap-2">
                        {isEditing && catalogErrorCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
                                {catalogErrorCount} issue(s)
                            </span>
                        ) : null}
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                ensureEditMode();
                                setCatalogOpen(true);
                                addMaterial();
                            }}
                        >
                            <LuPlus size={12} />
                            Add Material
                        </Button>
                    </span>
                }
            >
                {!materials.length ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-500">No materials in catalog yet.</p>
                ) : (
                    <div className="space-y-0 pb-1">
                        {materials.map((m) => (
                            <OverviewDetailCard key={m.id}>
                                {isEditing ? (
                                    <div className="flex justify-end border-b border-gray-100 px-2 py-1.5">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                            onClick={() => onMaterialsChange(materials.filter((r) => r.id !== m.id))}
                                        >
                                            <LuTrash2 size={12} />
                                            Remove
                                        </button>
                                    </div>
                                ) : null}
                                <div className="grid grid-cols-1 overflow-hidden xl:grid-cols-2">
                                    <OverviewFieldRow label="Material ID">
                                        <span className="font-mono text-sm tracking-tight text-gray-900">{m.materialCode || EMPTY_FIELD}</span>
                                    </OverviewFieldRow>
                                    <OverviewFieldRow label="Material Name" required>
                                        <EditableField
                                            isEditing={isEditing}
                                            error={fieldErr(errors, 'material', m.id, 'materialName')}
                                            value={m.materialName}
                                            onChange={(v) => patchMaterial(m.id, { materialName: v })}
                                            readValue={m.materialName?.trim() ? m.materialName : EMPTY_FIELD}
                                        />
                                    </OverviewFieldRow>
                                    <OverviewFieldRow label="Category" required>
                                        <EditableSelect
                                            isEditing={isEditing}
                                            error={fieldErr(errors, 'material', m.id, 'category')}
                                            value={m.category}
                                            onChange={(v) => patchMaterial(m.id, { category: v })}
                                            options={[...SUPPLIER_CATEGORIES]}
                                            readValue={m.category || EMPTY_FIELD}
                                        />
                                    </OverviewFieldRow>
                                    <OverviewFieldRow label="Unit" required>
                                        <EditableSelect
                                            isEditing={isEditing}
                                            error={fieldErr(errors, 'material', m.id, 'unit')}
                                            value={m.unit}
                                            onChange={(v) => patchMaterial(m.id, { unit: v })}
                                            options={[...MATERIAL_UNITS]}
                                            readValue={m.unit || EMPTY_FIELD}
                                        />
                                    </OverviewFieldRow>
                                    <OverviewFieldRow label="Description" className="xl:col-span-2">
                                        <EditableTextarea
                                            isEditing={isEditing}
                                            value={m.description ?? ''}
                                            onChange={(v) => patchMaterial(m.id, { description: v })}
                                            rows={2}
                                            readValue={m.description?.trim() ? m.description : EMPTY_FIELD}
                                        />
                                    </OverviewFieldRow>
                                </div>
                            </OverviewDetailCard>
                        ))}
                    </div>
                )}
            </OverviewCollapsibleSection>
            </div>

            <div data-supplier-overview-anchor="pricing">
            <OverviewCollapsibleSection
                title="SUPPLIER PRICING / RATE CARD"
                icon={LuIndianRupee}
                tone="amber"
                open={pricingOpen}
                onOpenChange={setPricingOpen}
                headerRight={
                    <span className="flex items-center gap-2">
                        {isEditing && pricingErrorCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
                                {pricingErrorCount} issue(s)
                            </span>
                        ) : null}
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                ensureEditMode();
                                setPricingOpen(true);
                                addPrice();
                            }}
                        >
                            <LuPlus size={12} />
                            Add Price
                        </Button>
                    </span>
                }
            >
                {!pricing.length ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-500">No pricing rows yet.</p>
                ) : (
                    <div className="space-y-0 pb-1">
                        {pricing.map((p) => {
                            const displayStatus: SupplierPricingRow['status'] =
                                p.status === 'Ending Soon' || p.status === 'Expired' || p.status === 'Draft' ? 'Active' : p.status === 'Inactive' ? 'Inactive' : p.status;
                            return (
                                <OverviewDetailCard key={p.id}>
                                    {isEditing ? (
                                        <div className="flex justify-end border-b border-gray-100 px-2 py-1.5">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                                onClick={() => onPricingChange(pricing.filter((r) => r.id !== p.id))}
                                            >
                                                <LuTrash2 size={12} />
                                                Remove
                                            </button>
                                        </div>
                                    ) : null}
                                    <div className="grid grid-cols-1 overflow-hidden xl:grid-cols-2">
                                        <OverviewFieldRow label="Material" required>
                                            {isEditing ? (
                                                materialOptions.length ? (
                                                    <EditableSelect
                                                        isEditing
                                                        error={fieldErr(errors, 'pricing', p.id, 'material')}
                                                        value={p.material}
                                                        onChange={(v) => patchPricing(p.id, { material: v })}
                                                        placeholder="Select material"
                                                        options={materialOptions}
                                                        readValue={p.material}
                                                    />
                                                ) : (
                                                    <EditableField
                                                        isEditing
                                                        error={fieldErr(errors, 'pricing', p.id, 'material')}
                                                        value={p.material}
                                                        onChange={(v) => patchPricing(p.id, { material: v })}
                                                        placeholder="Add materials to catalog first"
                                                        readValue={EMPTY_FIELD}
                                                    />
                                                )
                                            ) : (
                                                <span>{p.material?.trim() ? p.material : EMPTY_FIELD}</span>
                                            )}
                                        </OverviewFieldRow>
                                        <OverviewFieldRow label="Price Per Unit" required>
                                            <EditableField
                                                isEditing={isEditing}
                                                error={fieldErr(errors, 'pricing', p.id, 'unitPrice')}
                                                value={isEditing ? String(p.unitPrice || '') : ''}
                                                onChange={(v) => patchPricing(p.id, { unitPrice: Number(v.replace(/[^\d.]/g, '')) || 0 })}
                                                readValue={p.unitPrice > 0 ? formatInr(p.unitPrice) : EMPTY_FIELD}
                                            />
                                        </OverviewFieldRow>
                                        <OverviewFieldRow label="Effective Date" required>
                                            <EditableField
                                                isEditing={isEditing}
                                                type="date"
                                                error={fieldErr(errors, 'pricing', p.id, 'effectiveDate')}
                                                value={p.effectiveDate}
                                                onChange={(v) => patchPricing(p.id, { effectiveDate: v })}
                                                readValue={p.effectiveDate || EMPTY_FIELD}
                                            />
                                        </OverviewFieldRow>
                                        <OverviewFieldRow label="Valid Till">
                                            <EditableField
                                                isEditing={isEditing}
                                                type="date"
                                                value={p.validTill}
                                                onChange={(v) => patchPricing(p.id, { validTill: v })}
                                                readValue={p.validTill?.trim() ? p.validTill : EMPTY_FIELD}
                                            />
                                        </OverviewFieldRow>
                                        <OverviewFieldRow label="Status">
                                            {isEditing ? (
                                                <EditableSelect
                                                    isEditing
                                                    value={displayStatus === 'Inactive' ? 'Inactive' : 'Active'}
                                                    onChange={(v) => patchPricing(p.id, { status: v as 'Active' | 'Inactive' })}
                                                    options={[...PRICING_STATUS_OPTIONS]}
                                                    readValue={<PricingStatusBadge status={displayStatus} />}
                                                />
                                            ) : (
                                                <PricingStatusBadge status={displayStatus} />
                                            )}
                                        </OverviewFieldRow>
                                    </div>
                                </OverviewDetailCard>
                            );
                        })}
                    </div>
                )}
            </OverviewCollapsibleSection>
            </div>

            <div data-supplier-overview-anchor="capacity">
            <OverviewCollapsibleSection
                title="SUPPLY CAPACITY & AVAILABILITY"
                icon={LuGauge}
                tone="slate"
                open={capacityOpen}
                onOpenChange={setCapacityOpen}
                headerRight={
                    <span className="flex items-center gap-2">
                        {isEditing && capacityErrorCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
                                {capacityErrorCount} issue(s)
                            </span>
                        ) : null}
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                ensureEditMode();
                                setCapacityOpen(true);
                                addCapacity();
                            }}
                        >
                            <LuPlus size={12} />
                            Add Capacity
                        </Button>
                    </span>
                }
            >
                {!capacity.length ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-500">No capacity records yet.</p>
                ) : (
                    <div className="space-y-0 pb-1">
                        {capacity.map((c) => {
                            const matUnit = materials.find((m) => m.materialName === c.material)?.unit ?? '';
                            return (
                                <OverviewDetailCard key={c.id}>
                                    {isEditing ? (
                                        <div className="flex justify-end border-b border-gray-100 px-2 py-1.5">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                                onClick={() => onCapacityChange(capacity.filter((r) => r.id !== c.id))}
                                            >
                                                <LuTrash2 size={12} />
                                                Remove
                                            </button>
                                        </div>
                                    ) : null}
                                    <div className="grid grid-cols-1 overflow-hidden xl:grid-cols-2">
                                        <OverviewFieldRow label="Material" required>
                                            {isEditing ? (
                                                materialOptions.length ? (
                                                    <EditableSelect
                                                        isEditing
                                                        error={fieldErr(errors, 'capacity', c.id, 'material')}
                                                        value={c.material}
                                                        onChange={(v) => patchCapacity(c.id, { material: v })}
                                                        placeholder="Select material"
                                                        options={materialOptions}
                                                        readValue={c.material}
                                                    />
                                                ) : (
                                                    <EditableField
                                                        isEditing
                                                        error={fieldErr(errors, 'capacity', c.id, 'material')}
                                                        value={c.material}
                                                        onChange={(v) => patchCapacity(c.id, { material: v })}
                                                        readValue={EMPTY_FIELD}
                                                    />
                                                )
                                            ) : (
                                                <span>{c.material?.trim() ? c.material : EMPTY_FIELD}</span>
                                            )}
                                        </OverviewFieldRow>
                                        <OverviewFieldRow label="Daily Capacity" required>
                                            <EditableField
                                                isEditing={isEditing}
                                                error={fieldErr(errors, 'capacity', c.id, 'dailyCapacity')}
                                                value={isEditing ? String(c.dailyCapacity || '') : ''}
                                                onChange={(v) => patchCapacity(c.id, { dailyCapacity: Number(v.replace(/\D/g, '')) || 0 })}
                                                readValue={
                                                    c.dailyCapacity > 0 ? (
                                                        <span>
                                                            {c.dailyCapacity.toLocaleString('en-IN')}
                                                            {matUnit ? ` ${matUnit}` : ''}
                                                        </span>
                                                    ) : (
                                                        EMPTY_FIELD
                                                    )
                                                }
                                            />
                                        </OverviewFieldRow>
                                        <OverviewFieldRow label="Lead Time" required>
                                            <EditableField
                                                isEditing={isEditing}
                                                error={fieldErr(errors, 'capacity', c.id, 'leadTimeDays')}
                                                value={isEditing ? String(c.leadTimeDays || '') : ''}
                                                onChange={(v) => patchCapacity(c.id, { leadTimeDays: Number(v.replace(/\D/g, '')) || 0 })}
                                                readValue={c.leadTimeDays > 0 ? `${c.leadTimeDays} Day${c.leadTimeDays === 1 ? '' : 's'}` : EMPTY_FIELD}
                                            />
                                        </OverviewFieldRow>
                                        <OverviewFieldRow label="Availability Status">
                                            {isEditing ? (
                                                <select
                                                    className="w-full rounded-md border border-blue-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/25"
                                                    value={c.availabilityStatus}
                                                    onChange={(e) =>
                                                        patchCapacity(c.id, {
                                                            availabilityStatus: e.target.value as SupplierCapacityRow['availabilityStatus'],
                                                        })
                                                    }
                                                >
                                                    <option value="Available">Available</option>
                                                    <option value="Limited">Limited</option>
                                                    <option value="Unavailable">Not Available</option>
                                                </select>
                                            ) : (
                                                <AvailabilityBadge status={c.availabilityStatus} />
                                            )}
                                        </OverviewFieldRow>
                                    </div>
                                </OverviewDetailCard>
                            );
                        })}
                    </div>
                )}
            </OverviewCollapsibleSection>
            </div>

            <div data-supplier-overview-anchor="compliance">
            <OverviewCollapsibleSection
                title="SUPPLIER DOCUMENTS & COMPLIANCE"
                icon={LuShieldCheck}
                tone="blue"
                open={complianceOpen}
                onOpenChange={setComplianceOpen}
                headerRight={
                    <span className="flex items-center gap-2">
                        <span className="hidden items-center gap-2 text-xs font-semibold text-slate-600 sm:inline-flex">
                            <span
                                className={cn(
                                    'rounded-full border px-2 py-0.5',
                                    complianceHealth.expired > 0
                                        ? 'border-rose-200 bg-rose-50 text-rose-800'
                                        : complianceHealth.pending > 0
                                          ? 'border-amber-200 bg-amber-50 text-amber-900'
                                          : 'border-emerald-200 bg-emerald-50 text-emerald-800',
                                )}
                            >
                                {complianceHealth.label}
                            </span>
                            <span className="text-slate-400">{complianceHealth.total} doc(s)</span>
                        </span>
                        {isEditing && complianceErrorCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
                                {complianceErrorCount} issue(s)
                            </span>
                        ) : null}
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                ensureEditMode();
                                setComplianceOpen(true);
                                addDocument();
                            }}
                        >
                            <LuPlus size={12} />
                            Add Document
                        </Button>
                    </span>
                }
            >
                {!compliance.length ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-500">No compliance documents uploaded yet.</p>
                ) : (
                    <div className="space-y-0 pb-1">
                        {compliance.map((d) => (
                            <OverviewDetailCard key={d.id}>
                                {isEditing ? (
                                    <div className="flex justify-end border-b border-gray-100 px-2 py-1.5">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                            onClick={() => onComplianceChange(compliance.filter((r) => r.id !== d.id))}
                                        >
                                            <LuTrash2 size={12} />
                                            Remove
                                        </button>
                                    </div>
                                ) : null}
                                <div className="grid grid-cols-1 overflow-hidden xl:grid-cols-2">
                                    <OverviewFieldRow label="Document Type" required>
                                        <EditableSelect
                                            isEditing={isEditing}
                                            error={fieldErr(errors, 'compliance', d.id, 'documentType')}
                                            value={d.documentType}
                                            onChange={(v) => patchCompliance(d.id, { documentType: v })}
                                            options={['GST', 'PAN', 'License', 'Insurance', 'Compliance Certificate']}
                                            readValue={d.documentType?.trim() ? d.documentType : EMPTY_FIELD}
                                        />
                                    </OverviewFieldRow>

                                    <OverviewFieldRow label="Verification Status">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <ComplianceStatusBadge doc={d} />
                                            {d.expiryDate?.trim() ? <ComplianceExpiryHint expiryDate={d.expiryDate} /> : null}
                                        </div>
                                    </OverviewFieldRow>

                                    <OverviewFieldRow label="File" required className="xl:col-span-2">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-slate-900">
                                                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
                                                        <LuFile size={16} className="text-slate-700" />
                                                    </span>
                                                    <span className="truncate">{d.fileName?.trim() ? d.fileName : EMPTY_FIELD}</span>
                                                </span>

                                                {d.fileUrl ? (
                                                    <>
                                                        <Button type="button" variant="companyOutline" size="sm" className="h-8 gap-1 px-2 text-xs" onClick={() => onPreview(d)}>
                                                            <LuEye size={14} /> Preview
                                                        </Button>
                                                        <Button type="button" variant="companyOutline" size="sm" className="h-8 gap-1 px-2 text-xs" onClick={() => downloadFile(d)}>
                                                            <LuDownload size={14} /> Download
                                                        </Button>
                                                    </>
                                                ) : null}

                                                {isEditing ? (
                                                    <>
                                                        <input
                                                            ref={(el) => {
                                                                docInputRefs.current[d.id] = el;
                                                            }}
                                                            type="file"
                                                            accept="application/pdf,image/*"
                                                            className="hidden"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                try {
                                                                    const uploaded = await readFile(file);
                                                                    patchCompliance(d.id, { fileName: uploaded.name, fileUrl: uploaded.url, fileMime: uploaded.mime });
                                                                } catch {
                                                                    // ignore
                                                                }
                                                            }}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="company"
                                                            size="sm"
                                                            className="h-8 gap-1 px-2 text-xs"
                                                            onClick={() => pickDocFile(d.id)}
                                                        >
                                                            <LuFile size={14} /> {d.fileUrl ? 'Replace' : 'Upload'}
                                                        </Button>
                                                    </>
                                                ) : null}
                                            </div>

                                            {fieldErr(errors, 'compliance', d.id, 'fileName') ? (
                                                <p className="text-xs font-medium text-rose-600">{fieldErr(errors, 'compliance', d.id, 'fileName')}</p>
                                            ) : null}
                                        </div>
                                    </OverviewFieldRow>

                                    <OverviewFieldRow label="Expiry Date">
                                        <EditableField
                                            isEditing={isEditing}
                                            type="date"
                                            error={fieldErr(errors, 'compliance', d.id, 'expiryDate')}
                                            value={d.expiryDate}
                                            onChange={(v) => patchCompliance(d.id, { expiryDate: v })}
                                            readValue={d.expiryDate?.trim() ? d.expiryDate : EMPTY_FIELD}
                                        />
                                    </OverviewFieldRow>
                                </div>
                            </OverviewDetailCard>
                        ))}
                    </div>
                )}
            </OverviewCollapsibleSection>
            </div>

            <div data-supplier-overview-anchor="procurement">
            <OverviewCollapsibleSection
                title="SUPPLIER SELECTION (FOR PROCUREMENT)"
                icon={LuUsers}
                tone="slate"
                open={selectionOpen}
                onOpenChange={setSelectionOpen}
                headerRight={
                    <span className="flex items-center gap-2">
                        {isEditing && selectionErrorCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
                                {selectionErrorCount} issue(s)
                            </span>
                        ) : null}
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                ensureEditMode();
                                setSelectionOpen(true);
                                addSelection();
                            }}
                        >
                            <LuPlus size={12} />
                            Add Selection
                        </Button>
                    </span>
                }
            >
                <div className="p-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Material selection</p>
                                <p className="mt-1 text-sm font-medium text-slate-900">Select a material to compare active suppliers.</p>
                            </div>
                            <div className="w-full sm:w-80">
                                <select
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]"
                                    value={procurementMaterial}
                                    onChange={(e) => setProcurementMaterial(e.target.value)}
                                >
                                    <option value="">Select material</option>
                                    {materialOptions.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                      
                    </div>
                </div>

                {!procurementMaterial ? (
                    <p className="px-4 pb-6 text-center text-sm text-gray-500">Choose a material to see matching suppliers.</p>
                ) : !comparisonCards.length ? (
                    <div className="px-3 pb-3">
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-10 text-center">
                            <p className="text-sm font-semibold text-slate-800">No matching suppliers</p>
                            <p className="mt-1 text-xs text-slate-600">Add pricing or capacity for this material to enable comparison.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-3 px-3 pb-3 md:grid-cols-2">
                        {comparisonCards.map((c) => {
                            const slaTone =
                                c.availability === 'Available' && (c.leadTimeDays ?? 99) <= 2
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : c.availability === 'Limited'
                                      ? 'border-amber-200 bg-amber-50 text-amber-900'
                                      : 'border-slate-200 bg-slate-50 text-slate-700';
                            const slaLabel =
                                c.availability === 'Available' && (c.leadTimeDays ?? 99) <= 2
                                    ? 'Low SLA Risk'
                                    : c.availability === 'Limited'
                                      ? 'Medium SLA Risk'
                                      : 'Review';

                            return (
                                <div key={`${procurementMaterial}:${c.supplierId}`} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">{c.supplierName}</p>
                                            <p className="mt-0.5 text-xs text-slate-600">
                                                {procurementMaterial} · Rating <span className="tabular-nums font-semibold text-slate-900">{c.rating.toFixed(1)}</span>
                                            </p>
                                        </div>
                                        <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', slaTone)}>{slaLabel}</span>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2">
                                            <p className="font-semibold text-slate-500">PRICE</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">
                                                {c.unitPrice != null ? `${c.currency} ${c.unitPrice.toLocaleString('en-IN')}` : '—'}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2">
                                            <p className="font-semibold text-slate-500">AVAILABILITY</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900">{c.availability ? (c.availability === 'Unavailable' ? 'Not Available' : c.availability) : '—'}</p>
                                        </div>
                                        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2">
                                            <p className="font-semibold text-slate-500">CAPACITY</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">
                                                {c.dailyCapacity != null ? c.dailyCapacity.toLocaleString('en-IN') : '—'}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-2">
                                            <p className="font-semibold text-slate-500">LEAD TIME</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">
                                                {c.leadTimeDays != null ? `${c.leadTimeDays}d` : '—'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                        {c.isBestPrice ? <TagBadge label="Best Price" /> : null}
                                        {c.isFastDelivery ? <TagBadge label="Fast Delivery" /> : null}
                                        {c.isHighCapacity ? <TagBadge label="High Capacity" /> : null}
                                        {c.isRecommended ? <TagBadge label="Recommended" /> : null}
                                    </div>

                                    <div className="mt-3 flex items-center justify-end">
                                        <Button
                                            type="button"
                                            variant={c.isBestPrice ? 'company' : 'companyOutline'}
                                            size="sm"
                                            className="h-8 px-3 text-xs"
                                            onClick={() => {
                                                ensureEditMode();
                                                upsertSelection(procurementMaterial, c.supplierId);
                                            }}
                                        >
                                            Select supplier
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {(selections ?? []).length ? (
                    <div className="px-3 pb-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Selected suppliers</p>
                        <div className="space-y-0 pb-1">
                            {(selections ?? []).map((sel) => {
                            const selectedSupplier = getSupplierRecordById(sel.selectedSupplierId);
                            const supplierLabel = selectedSupplier?.name ?? (sel.selectedSupplierId?.trim() ? sel.selectedSupplierId : EMPTY_FIELD);
                            const best = sel.material?.trim() ? bestPriceFor(sel.material.trim()) : null;
                            const isBest = Boolean(best && best.supplierId === sel.selectedSupplierId);
                            const availability = sel.selectedSupplierId?.trim() && sel.material?.trim() ? availabilityFor(sel.selectedSupplierId, sel.material.trim()) : null;

                            const computedTags = (() => {
                                const out: string[] = [];
                                if (isBest) out.push('Best Price');
                                if (sel.selectedSupplierId === supplierId) out.push('Preferred Supplier');
                                const cap = getAllSupplierCapacity().find((c) => c.supplierId === sel.selectedSupplierId && c.material === sel.material);
                                if (cap && cap.leadTimeDays <= 2) out.push('Fast Delivery');
                                if (availability === 'Available') out.push('Low SLA Risk');
                                return out;
                            })();

                            return (
                                <OverviewDetailCard key={sel.id}>
                                    {isEditing ? (
                                        <div className="flex justify-end border-b border-gray-100 px-2 py-1.5">
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                                onClick={() => onSelectionsChange(selections.filter((r) => r.id !== sel.id))}
                                            >
                                                <LuTrash2 size={12} />
                                                Remove
                                            </button>
                                        </div>
                                    ) : null}

                                    <div className="grid grid-cols-1 overflow-hidden xl:grid-cols-2">
                                        <OverviewFieldRow label="Supplier" required>
                                            {isEditing ? (
                                                <select
                                                    className={cn(
                                                        'w-full rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/25',
                                                        fieldErr(errors, 'selection', sel.id, 'selectedSupplierId')
                                                            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/25'
                                                            : 'border-blue-300 focus:border-blue-500',
                                                    )}
                                                    value={sel.selectedSupplierId}
                                                    onChange={(e) => patchSelection(sel.id, { selectedSupplierId: e.target.value })}
                                                >
                                                    <option value="">Select supplier</option>
                                                    {activeSuppliers.map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="font-medium text-slate-900">{supplierLabel}</span>
                                            )}
                                            {fieldErr(errors, 'selection', sel.id, 'selectedSupplierId') ? (
                                                <p className="mt-1 text-xs font-medium text-rose-600">{fieldErr(errors, 'selection', sel.id, 'selectedSupplierId')}</p>
                                            ) : null}
                                        </OverviewFieldRow>

                                        <OverviewFieldRow label="Material" required>
                                            <EditableSelect
                                                isEditing={isEditing}
                                                error={fieldErr(errors, 'selection', sel.id, 'material')}
                                                value={sel.material}
                                                onChange={(v) => patchSelection(sel.id, { material: v })}
                                                placeholder="Select material"
                                                options={materialOptions}
                                                readValue={sel.material?.trim() ? sel.material : EMPTY_FIELD}
                                            />
                                        </OverviewFieldRow>

                                        <OverviewFieldRow label="Best Price Flag">
                                            {isBest ? <TagBadge label="Best Price" /> : <span className="text-sm text-slate-500">—</span>}
                                            {best && !isBest ? (
                                                <span className="ml-2 text-xs font-medium text-slate-500">Best: {getSupplierRecordById(best.supplierId)?.name ?? best.supplierId}</span>
                                            ) : null}
                                        </OverviewFieldRow>

                                        <OverviewFieldRow label="Availability">
                                            {availability ? <AvailabilityBadge status={availability} /> : <span className="text-sm text-slate-500">—</span>}
                                        </OverviewFieldRow>

                                        <OverviewFieldRow label="Recommendation Tags" className="xl:col-span-2">
                                            {computedTags.length ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {computedTags.map((t) => (
                                                        <TagBadge key={t} label={t} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-500">—</span>
                                            )}
                                        </OverviewFieldRow>
                                    </div>
                                </OverviewDetailCard>
                            );
                            })}
                        </div>
                    </div>
                ) : null}
            </OverviewCollapsibleSection>
            </div>
        </div>
    );
}
