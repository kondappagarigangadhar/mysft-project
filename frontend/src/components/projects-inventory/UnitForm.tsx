'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/projects-inventory/FormField';
import { TextInput } from '@/components/projects-inventory/TextInput';
import { SelectInput } from '@/components/projects-inventory/SelectInput';
import {
    computeFinalUnitPrice,
    configurationOptionsForUnitType,
    defaultConfigurationForUnitType,
    formatCurrencyINR,
    type Project,
    type UnitAvailabilityStatus,
    type UnitType,
} from '@/lib/projectsInventoryStore';
import { InventorySyncLockingSection } from '@/components/projects-inventory/InventorySyncLockingSection';
import { cn } from '@/lib/utils';

export type InventorySyncReadOnly = {
    inventory_lock_status: boolean;
    lock_timestamp: string;
    unlock_timestamp: string;
};

export {
    ARRIS_UNIT_CREATE_DRAFT_KEY,
    UnitFormStandard,
    UNIT_CREATE_FIELD_IDS,
    UNIT_DUPLICATE_MESSAGE,
} from './UnitFormStandard';

export type UnitFormValues = {
    projectSlug: string;
    unit_number: string;
    unit_type: UnitType;
    configuration: string;
    unit_size: number;
    price: number;
    offer_price?: number;
    availability_status: UnitAvailabilityStatus;
    block_phase?: string;
    tower_block?: string;
    floor?: string;
    facing?: string;
    plc_charges?: number;
    gst_tax_percent?: number;
};

function SectionHeader({ title, className }: { title: string; className?: string }) {
    return (
        <h3
            className={cn(
                'mb-3 mt-6 border-b border-slate-100 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 first:mt-0',
                className,
            )}
        >
            {title}
        </h3>
    );
}

/**
 * Add / edit unit — same field set and order as `InventoryUnitDetailPanel` (view), no duplicate side rails or insight cards.
 */
export function UnitForm({
    initialUnitCode,
    initialValues,
    projects,
    projectLocked,
    syncReadOnly,
    onSubmit,
    onCancel,
    isSubmitting,
    submitLabel,
}: {
    initialUnitCode: string;
    initialValues: UnitFormValues;
    projects: Project[];
    projectLocked?: boolean;
    syncReadOnly?: InventorySyncReadOnly;
    onSubmit: (values: UnitFormValues) => Promise<void> | void;
    onCancel: () => void;
    isSubmitting?: boolean;
    submitLabel?: string;
}) {
    const resolvedSubmitLabel = submitLabel ?? 'Save';

    const [values, setValues] = useState<UnitFormValues>(initialValues);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const toDigitsOnly = (value: string) => value.replace(/\D/g, '');

    const getValidationErrors = (formValues: UnitFormValues) => {
        const next: Record<string, string> = {};
        if (!formValues.projectSlug) next.projectSlug = 'Project is required';
        if (!formValues.unit_number.trim()) next.unit_number = 'Unit number is required';
        if (!formValues.unit_type) next.unit_type = 'Unit type is required';
        if (!formValues.configuration.trim()) next.configuration = 'Configuration is required';
        if (!Number.isFinite(formValues.unit_size) || formValues.unit_size <= 0) next.unit_size = 'Unit size must be a positive number';
        if (!Number.isFinite(formValues.price) || formValues.price <= 0) next.price = 'Price must be a positive number';
        if (formValues.offer_price !== undefined && formValues.offer_price > formValues.price)
            next.offer_price = 'Offer price must be <= base price';
        if (!formValues.availability_status) next.availability_status = 'Status is required';
        if (formValues.plc_charges !== undefined && (!Number.isFinite(formValues.plc_charges) || formValues.plc_charges < 0))
            next.plc_charges = 'PLC must be zero or positive';
        if (formValues.gst_tax_percent !== undefined) {
            const g = formValues.gst_tax_percent;
            if (!Number.isFinite(g) || g < 0 || g > 100) next.gst_tax_percent = 'GST must be between 0 and 100';
        }
        return next;
    };

    const validate = () => {
        const next = getValidationErrors(values);
        setErrors(next);
        return Object.keys(next).length === 0;
    };
    const hasErrors = Object.keys(getValidationErrors(values)).length > 0;

    const updateValues = (updater: (prev: UnitFormValues) => UnitFormValues) => {
        setValues((prev) => {
            const next = updater(prev);
            setErrors(getValidationErrors(next));
            return next;
        });
    };

    useEffect(() => {
        setValues(initialValues);
        setErrors({});
    }, [initialValues]);

    const finalPricePreview = useMemo(
        () =>
            computeFinalUnitPrice({
                basePrice: values.price,
                offerPrice: values.offer_price,
                plcCharges: values.plc_charges,
                gstPct: values.gst_tax_percent,
            }),
        [values.price, values.offer_price, values.plc_charges, values.gst_tax_percent],
    );

    const unitTypeOptions = [
        { value: 'Plot', label: 'Plot' },
        { value: 'Apartment', label: 'Apartment' },
        { value: 'Villa', label: 'Villa' },
    ];
    const configurationSelectOptions = useMemo(() => {
        const base = configurationOptionsForUnitType(values.unit_type).map((c) => ({ value: c, label: c }));
        const c = values.configuration?.trim();
        if (c && !base.some((o) => o.value === c)) {
            return [{ value: c, label: c }, ...base];
        }
        return base;
    }, [values.unit_type, values.configuration]);
    const availabilityOptions = [
        { value: 'available', label: 'Available' },
        { value: 'reserved', label: 'Reserved' },
        { value: 'sold', label: 'Sold' },
        { value: 'pending', label: 'Pending' },
    ];

    const submit = async () => {
        if (isSubmitting) return;
        if (!validate()) return;
        await onSubmit(values);
    };

    return (
        <Card
            className="overflow-hidden border border-slate-200/80 bg-white p-0 shadow-md shadow-slate-200/30"
            contentClassName="p-0"
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    void submit();
                }}
            >
               

                <div className="p-6">
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <SectionHeader title="Details" className="mt-0" />
                        </div>

                        <div className="md:col-span-2">
                            <FormField label="Unit ID">
                                <TextInput value={initialUnitCode} onChange={() => {}} disabled readOnly />
                            </FormField>
                        </div>

                        <FormField label="Unit number" required>
                            <TextInput
                                name="unit_number"
                                value={values.unit_number}
                                onChange={(v) => updateValues((p) => ({ ...p, unit_number: v }))}
                                placeholder="e.g. A-402"
                                error={errors.unit_number}
                                autoComplete="off"
                            />
                        </FormField>

                        <FormField label="Project" required>
                            <SelectInput
                                name="projectSlug"
                                value={values.projectSlug}
                                onChange={(v) => updateValues((p) => ({ ...p, projectSlug: v }))}
                                options={projects.map((p) => ({ value: p.slug, label: p.project_name }))}
                                placeholder="Select project"
                                disabled={projectLocked}
                                error={errors.projectSlug}
                            />
                        </FormField>

                        <FormField label="Unit type" required>
                            <SelectInput
                                name="unit_type"
                                value={values.unit_type}
                                onChange={(v) => {
                                    const nextType = v as UnitType;
                                    updateValues((p) => ({
                                        ...p,
                                        unit_type: nextType,
                                        configuration: defaultConfigurationForUnitType(nextType),
                                    }));
                                }}
                                options={unitTypeOptions}
                                placeholder="Select unit type"
                                error={errors.unit_type}
                            />
                        </FormField>

                        <FormField label="Tower / block (optional)">
                            <TextInput
                                value={values.tower_block ?? ''}
                                onChange={(v) => updateValues((p) => ({ ...p, tower_block: v }))}
                                placeholder="e.g. Tower A"
                                autoComplete="off"
                            />
                        </FormField>

                        <FormField label="Floor (optional)">
                            <TextInput
                                value={values.floor ?? ''}
                                onChange={(v) => updateValues((p) => ({ ...p, floor: v }))}
                                placeholder="e.g. 12"
                                autoComplete="off"
                            />
                        </FormField>

                        <FormField label="Facing (optional)">
                            <TextInput
                                value={values.facing ?? ''}
                                onChange={(v) => updateValues((p) => ({ ...p, facing: v }))}
                                placeholder="e.g. East"
                                autoComplete="off"
                            />
                        </FormField>

                        <FormField label="Configuration (BHK / layout)" required hint="e.g. 2 BHK, Villa">
                            <SelectInput
                                name="configuration"
                                value={values.configuration}
                                onChange={(v) => updateValues((p) => ({ ...p, configuration: v }))}
                                options={configurationSelectOptions}
                                placeholder="Select configuration"
                                error={errors.configuration}
                            />
                        </FormField>

                        <FormField label="Area (sq.ft)" required>
                            <TextInput
                                name="unit_size"
                                value={String(values.unit_size)}
                                onChange={(v) => {
                                    const digits = toDigitsOnly(v);
                                    updateValues((p) => ({ ...p, unit_size: digits ? Number(digits) : 0 }));
                                }}
                                type="number"
                                error={errors.unit_size}
                            />
                        </FormField>

                        <div className="md:col-span-2">
                            <SectionHeader title="Pricing & taxes" />
                        </div>

                        <FormField label="Base price" required hint="INR">
                            <TextInput
                                name="price"
                                value={String(values.price)}
                                onChange={(v) => {
                                    const digits = toDigitsOnly(v);
                                    updateValues((p) => ({ ...p, price: digits ? Number(digits) : 0 }));
                                }}
                                type="number"
                                error={errors.price}
                            />
                        </FormField>

                        <FormField label="Offer price (optional)">
                            <TextInput
                                name="offer_price"
                                value={values.offer_price === undefined ? '' : String(values.offer_price)}
                                onChange={(v) => {
                                    const digits = toDigitsOnly(v);
                                    updateValues((p) => ({ ...p, offer_price: digits ? Number(digits) : undefined }));
                                }}
                                type="number"
                                error={errors.offer_price}
                            />
                        </FormField>

                        <FormField label="PLC charges (optional)">
                            <TextInput
                                value={values.plc_charges === undefined ? '' : String(values.plc_charges)}
                                onChange={(v) => {
                                    const digits = toDigitsOnly(v);
                                    updateValues((p) => ({ ...p, plc_charges: digits ? Number(digits) : undefined }));
                                }}
                                type="number"
                                error={errors.plc_charges}
                            />
                        </FormField>

                        <FormField label="GST / tax % (optional)" hint="0–100">
                            <TextInput
                                value={values.gst_tax_percent === undefined ? '' : String(values.gst_tax_percent)}
                                onChange={(v) => {
                                    const t = v.trim();
                                    if (!t) {
                                        updateValues((p) => ({ ...p, gst_tax_percent: undefined }));
                                        return;
                                    }
                                    const n = Number(t.replace(/,/g, ''));
                                    updateValues((p) => ({ ...p, gst_tax_percent: Number.isFinite(n) ? n : undefined }));
                                }}
                                placeholder="e.g. 5"
                                error={errors.gst_tax_percent}
                                autoComplete="off"
                            />
                        </FormField>

                        <FormField label="Final price (calculated)" hint="Offer + PLC + GST" className="md:col-span-2">
                            <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-base font-bold text-slate-900 tabular-nums">
                                {formatCurrencyINR(finalPricePreview)}
                            </div>
                        </FormField>

                        <div className="md:col-span-2">
                            <SectionHeader title="Status" />
                        </div>

                        <FormField label="Availability" required>
                            <SelectInput
                                name="availability_status"
                                value={values.availability_status}
                                onChange={(v) => updateValues((p) => ({ ...p, availability_status: v as UnitAvailabilityStatus }))}
                                options={availabilityOptions}
                                placeholder="Select status"
                                error={errors.availability_status}
                            />
                        </FormField>

                        <FormField label="Block / phase (optional)">
                            <TextInput
                                value={values.block_phase || ''}
                                onChange={(v) => updateValues((p) => ({ ...p, block_phase: v }))}
                                placeholder="e.g. Phase A"
                                autoComplete="off"
                            />
                        </FormField>

                        {syncReadOnly ? (
                            <InventorySyncLockingSection
                                mode="existing"
                                className="md:col-span-2"
                                inventory_lock_status={syncReadOnly.inventory_lock_status}
                                lock_timestamp={syncReadOnly.lock_timestamp}
                                unlock_timestamp={syncReadOnly.unlock_timestamp}
                                showDatetimePickers={false}
                            />
                        ) : null}
                    </div>

                    <div className="mt-8 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="cta"
                            onClick={onCancel}
                            className="flex-1 sm:flex-none"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="company"
                            size="cta"
                            className="flex-1 sm:flex-none"
                            disabled={isSubmitting || hasErrors}
                            isLoading={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : resolvedSubmitLabel}
                        </Button>
                    </div>
                </div>
            </form>
        </Card>
    );
}
