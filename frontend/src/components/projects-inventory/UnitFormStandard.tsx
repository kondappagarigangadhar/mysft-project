'use client';

import React from 'react';
import { FormCollapsibleSection } from '@/components/forms/FormCollapsibleSection';
import { CrmFieldProvider, InputField, SelectField } from '@/components/forms/Fields';
import { Button } from '@/components/ui/Button';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { InventorySyncLockingSection } from '@/components/projects-inventory/InventorySyncLockingSection';
import { cn } from '@/lib/utils';
import { CTA_FLOW_LINK, CTA_SHADOW_SOFT } from '@/lib/theme/ctaThemeClasses';
import {
    computeFinalUnitPrice,
    configurationOptionsForUnitType,
    defaultConfigurationForUnitType,
    formatCurrencyINR,
    type Project,
    type UnitAvailabilityStatus,
    type UnitType,
} from '@/lib/projectsInventoryStore';
import type { UnitFormValues, InventorySyncReadOnly } from '@/components/projects-inventory/UnitForm';
import { LuBox, LuIndianRupee, LuLayers, LuLayoutGrid, LuTag } from 'react-icons/lu';

export const ARRIS_UNIT_CREATE_DRAFT_KEY = 'arris-create-unit-draft-v1';

/** Shown when `addUnit` returns undefined (duplicate within project). */
export const UNIT_DUPLICATE_MESSAGE =
    'This unit number already exists in the selected project. Use a different number.';

const SCROLL_OFFSET_PX = 96;
const FORM_ID = 'unit-standard-form';

export const UNIT_CREATE_FIELD_IDS: Record<keyof UnitFormValues, string> = {
    projectSlug: 'unit-create-project',
    unit_number: 'unit-create-number',
    unit_type: 'unit-create-type',
    configuration: 'unit-create-config',
    unit_size: 'unit-create-size',
    price: 'unit-create-price',
    offer_price: 'unit-create-offer',
    availability_status: 'unit-create-availability',
    block_phase: 'unit-create-block',
    tower_block: 'unit-create-tower',
    floor: 'unit-create-floor',
    facing: 'unit-create-facing',
    plc_charges: 'unit-create-plc',
    gst_tax_percent: 'unit-create-gst',
};

const VALIDATION_ORDER: (keyof UnitFormValues)[] = [
    'projectSlug',
    'unit_number',
    'unit_type',
    'configuration',
    'unit_size',
    'price',
    'offer_price',
    'availability_status',
    'plc_charges',
    'gst_tax_percent',
];

const HUMAN_LABEL: Record<keyof UnitFormValues, string> = {
    projectSlug: 'Project',
    unit_number: 'Unit number',
    unit_type: 'Unit type',
    configuration: 'Configuration',
    unit_size: 'Area (sq.ft)',
    price: 'Base price',
    offer_price: 'Offer price',
    availability_status: 'Availability',
    block_phase: 'Block / phase',
    tower_block: 'Tower / block',
    floor: 'Floor',
    facing: 'Facing',
    plc_charges: 'PLC charges',
    gst_tax_percent: 'GST / tax %',
};

const DETAILS_KEYS: (keyof UnitFormValues)[] = [
    'projectSlug',
    'unit_number',
    'unit_type',
    'tower_block',
    'floor',
    'facing',
    'configuration',
    'unit_size',
];
const PRICING_KEYS: (keyof UnitFormValues)[] = ['price', 'offer_price', 'plc_charges', 'gst_tax_percent'];
const STATUS_KEYS: (keyof UnitFormValues)[] = ['availability_status', 'block_phase'];

type FormErrors = Partial<Record<keyof UnitFormValues, string>>;

const toDigitsOnly = (value: string) => value.replace(/\D/g, '');

function validateUnitValues(v: UnitFormValues, duplicateMessage?: string | null): FormErrors {
    const next: FormErrors = {};
    if (!v.projectSlug) next.projectSlug = 'Project is required';
    if (!v.unit_number.trim()) {
        next.unit_number = 'This field is required';
    } else if (duplicateMessage) {
        next.unit_number = duplicateMessage;
    }
    if (!v.unit_type) next.unit_type = 'Please select unit type';
    if (!v.configuration.trim()) next.configuration = 'This field is required';
    if (!Number.isFinite(v.unit_size) || v.unit_size <= 0) next.unit_size = 'Enter a positive area';
    if (!Number.isFinite(v.price) || v.price <= 0) next.price = 'Enter a positive base price';
    if (v.offer_price !== undefined && v.offer_price > v.price) next.offer_price = 'Offer must be ≤ base price';
    if (!v.availability_status) next.availability_status = 'Please select availability';
    if (v.plc_charges !== undefined && (!Number.isFinite(v.plc_charges) || v.plc_charges < 0))
        next.plc_charges = 'Must be zero or positive';
    if (v.gst_tax_percent !== undefined) {
        const g = v.gst_tax_percent;
        if (!Number.isFinite(g) || g < 0 || g > 100) next.gst_tax_percent = 'Use 0–100';
    }
    return next;
}

function focusField(key: keyof UnitFormValues) {
    const id = UNIT_CREATE_FIELD_IDS[key];
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_PX;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    window.setTimeout(() => {
        const again = document.getElementById(id);
        if (again && 'focus' in again && typeof (again as HTMLElement & { focus: () => void }).focus === 'function') {
            (again as HTMLInputElement | HTMLSelectElement).focus({ preventScroll: true });
        }
    }, 400);
}

const unitTypeOptions = [
    { value: 'Plot', label: 'Plot' },
    { value: 'Apartment', label: 'Apartment' },
    { value: 'Villa', label: 'Villa' },
];
const availabilityOptions = [
    { value: 'available', label: 'Available' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'sold', label: 'Sold' },
    { value: 'pending', label: 'Pending' },
];

export function UnitFormStandard({
    initialUnitCode,
    initialValues,
    projects,
    projectLocked,
    syncReadOnly,
    onSubmit,
    onCancel,
    isSubmitting,
    submitLabel = 'Save',
    enableDraftAutosave = true,
    draftStorageKey = ARRIS_UNIT_CREATE_DRAFT_KEY,
    serverDuplicateError,
    onClearServerDuplicate,
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
    /** When true (default), localStorage draft + footer matches create project. Set false for edit. */
    enableDraftAutosave?: boolean;
    draftStorageKey?: string;
    serverDuplicateError?: string | null;
    onClearServerDuplicate?: () => void;
}) {
    const [values, setValues] = React.useState<UnitFormValues>(initialValues);
    const [errors, setErrors] = React.useState<FormErrors>({});
    const [showValidationSummary, setShowValidationSummary] = React.useState(false);
    const [validationFieldToast, setValidationFieldToast] = React.useState<string | null>(null);
    const [submitShakeKey, setSubmitShakeKey] = React.useState(0);
    const [cardOpen, setCardOpen] = React.useState({
        details: true,
        pricing: true,
        status: true,
        sync: true,
    });
    const [draftUi, setDraftUi] = React.useState<{ state: 'idle' | 'saving' | 'saved'; at: string | null }>({
        state: 'idle',
        at: null,
    });
    const dismissValidationToast = React.useCallback(() => setValidationFieldToast(null), []);
    const [baselineJson, setBaselineJson] = React.useState(() => JSON.stringify(initialValues));
    const useDraft = enableDraftAutosave;

    React.useEffect(() => {
        setValues(initialValues);
        setErrors({});
        setShowValidationSummary(false);
        setBaselineJson(JSON.stringify(initialValues));
    }, [initialValues]);

    const isDirty = React.useMemo(() => JSON.stringify(values) !== baselineJson, [values, baselineJson]);

    const configurationSelectOptions = React.useMemo(() => {
        const base = configurationOptionsForUnitType(values.unit_type).map((c) => ({ value: c, label: c }));
        const c = values.configuration?.trim();
        if (c && !base.some((o) => o.value === c)) {
            return [{ value: c, label: c }, ...base];
        }
        return base;
    }, [values.unit_type, values.configuration]);

    const finalPricePreview = React.useMemo(
        () =>
            computeFinalUnitPrice({
                basePrice: values.price,
                offerPrice: values.offer_price,
                plcCharges: values.plc_charges,
                gstPct: values.gst_tax_percent,
            }),
        [values.price, values.offer_price, values.plc_charges, values.gst_tax_percent],
    );

    React.useEffect(() => {
        if (Object.keys(errors).length === 0) {
            setShowValidationSummary(false);
            setValidationFieldToast(null);
        }
    }, [errors]);

    React.useEffect(() => {
        if (!serverDuplicateError) return;
        setErrors((e) => ({ ...e, unit_number: serverDuplicateError }));
        setShowValidationSummary(true);
        setCardOpen((s) => ({ ...s, details: true }));
        setValidationFieldToast(serverDuplicateError);
        window.requestAnimationFrame(() => focusField('unit_number'));
    }, [serverDuplicateError]);

    React.useEffect(() => {
        if (!isDirty) return;
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [isDirty]);

    React.useEffect(() => {
        if (!useDraft) return;
        setDraftUi((prev) => ({ ...prev, state: 'saving' }));
        const t = window.setTimeout(() => {
            try {
                window.localStorage.setItem(draftStorageKey, JSON.stringify(values));
                setDraftUi({
                    state: 'saved',
                    at: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
                });
            } catch {
                setDraftUi({ state: 'idle', at: null });
            }
        }, 700);
        return () => window.clearTimeout(t);
    }, [values, draftStorageKey, useDraft]);

    const clearFieldError = React.useCallback((name: keyof UnitFormValues) => {
        if (name === 'unit_number' && onClearServerDuplicate) onClearServerDuplicate();
        setErrors((prev) => {
            if (!prev[name]) return prev;
            const next = { ...prev };
            delete next[name];
            return next;
        });
    }, [onClearServerDuplicate]);

    const setValue = <K extends keyof UnitFormValues>(key: K, value: UnitFormValues[K]) => {
        setValues((p) => ({ ...p, [key]: value }));
        clearFieldError(key);
    };

    const projectOptions = React.useMemo(
        () => projects.map((p) => ({ value: p.slug, label: p.project_name })),
        [projects],
    );

    const fieldGap = 'gap-x-5 gap-y-5 sm:gap-x-6 sm:gap-y-6';
    const fid = (k: keyof UnitFormValues) => UNIT_CREATE_FIELD_IDS[k];

    const detailsErr = DETAILS_KEYS.filter((k) => errors[k]).length;
    const pricingErr = PRICING_KEYS.filter((k) => errors[k]).length;
    const statusErr = STATUS_KEYS.filter((k) => errors[k]).length;

    const summaryKeys = showValidationSummary ? VALIDATION_ORDER.filter((k) => errors[k]) : [];

    const runSubmit = () => {
        if (isSubmitting) return;
        const nextErrors = validateUnitValues(values, serverDuplicateError);
        setErrors(nextErrors);
        const keys = Object.keys(nextErrors) as (keyof UnitFormValues)[];
        if (keys.length > 0) {
            setShowValidationSummary(true);
            setValidationFieldToast(
                `Please complete ${keys.length} required field${keys.length === 1 ? '' : 's'}`,
            );
            setSubmitShakeKey((k) => k + 1);
            setCardOpen((s) => ({
                ...s,
                details: DETAILS_KEYS.some((k) => nextErrors[k]) ? true : s.details,
                pricing: PRICING_KEYS.some((k) => nextErrors[k]) ? true : s.pricing,
                status: STATUS_KEYS.some((k) => nextErrors[k]) ? true : s.status,
            }));
            const first = VALIDATION_ORDER.find((k) => nextErrors[k]);
            if (first) window.requestAnimationFrame(() => focusField(first));
            return;
        }
        setShowValidationSummary(false);
        void onSubmit(values);
    };

    const saveDraftManual = () => {
        if (!useDraft || !draftStorageKey) return;
        try {
            window.localStorage.setItem(draftStorageKey, JSON.stringify(values));
            setDraftUi({
                state: 'saved',
                at: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
            });
        } catch {
            setDraftUi({ state: 'idle', at: null });
        }
    };

    const busyLabel = submitLabel.toLowerCase().includes('add') ? 'Adding…' : 'Saving…';

    const validationSummaryEl =
        showValidationSummary && summaryKeys.length > 0 ? (
            <div
                className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3.5 text-sm text-amber-950 shadow-sm"
                role="alert"
            >
                <p className="flex flex-wrap items-center gap-2 font-semibold leading-snug text-amber-950">
                    <span aria-hidden>⚠</span>
                    <span>Please complete required details before continuing.</span>
                </p>
                <p className="mt-2 text-[13px] font-medium text-amber-900/95">
                    {summaryKeys.map((k, i) => (
                        <React.Fragment key={k}>
                            {i > 0 ? <span className="mx-1 text-amber-800/40">·</span> : null}
                            <button
                                type="button"
                                className={cn('rounded', CTA_FLOW_LINK)}
                                onClick={() => {
                                    if (DETAILS_KEYS.includes(k)) setCardOpen((s) => ({ ...s, details: true }));
                                    if (PRICING_KEYS.includes(k)) setCardOpen((s) => ({ ...s, pricing: true }));
                                    if (STATUS_KEYS.includes(k)) setCardOpen((s) => ({ ...s, status: true }));
                                    window.requestAnimationFrame(() => focusField(k));
                                }}
                            >
                                {HUMAN_LABEL[k]}
                            </button>
                        </React.Fragment>
                    ))}
                </p>
            </div>
        ) : null;

    return (
        <CrmFieldProvider>
            <>
                {validationFieldToast ? (
                    <InlineToast
                        message={validationFieldToast}
                        variant="error"
                        onDismiss={dismissValidationToast}
                    />
                ) : null}
                <form
                    id={FORM_ID}
                    onSubmit={(e) => {
                        e.preventDefault();
                        runSubmit();
                    }}
                    className="space-y-6"
                >
                    {validationSummaryEl}

                    <FormCollapsibleSection
                        layout="card"
                        title="Unit details"
                        icon={LuBox}
                        tone="blue"
                        open={cardOpen.details}
                        onOpenChange={(o) => setCardOpen((s) => ({ ...s, details: o }))}
                        headerRight={
                            detailsErr > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {detailsErr} field{detailsErr === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
                            <div className="md:col-span-2">
                                <InputField
                                    label="Unit ID"
                                    readOnly
                                    disabled
                                    value={initialUnitCode}
                                    className="opacity-90"
                                    startIcon={<LuTag aria-hidden />}
                                />
                            </div>
                            <SelectField
                                label="Project"
                                required
                                id={fid('projectSlug')}
                                name="projectSlug"
                                value={values.projectSlug}
                                onChange={(e) => {
                                    setValue('projectSlug', e.target.value);
                                }}
                                options={projectOptions}
                                placeholder="Select project"
                                disabled={projectLocked}
                                error={errors.projectSlug}
                                startIcon={<LuLayers aria-hidden />}
                            />
                            <InputField
                                label="Unit number"
                                required
                                id={fid('unit_number')}
                                name="unit_number"
                                value={values.unit_number}
                                onChange={(e) => setValue('unit_number', e.target.value)}
                                placeholder="e.g. A-402"
                                error={errors.unit_number}
                                autoComplete="off"
                            />
                            <SelectField
                                label="Unit type"
                                required
                                id={fid('unit_type')}
                                name="unit_type"
                                value={values.unit_type}
                                onChange={(e) => {
                                    const nextType = e.target.value as UnitType;
                                    setValues((p) => ({
                                        ...p,
                                        unit_type: nextType,
                                        configuration: defaultConfigurationForUnitType(nextType),
                                    }));
                                    clearFieldError('unit_type');
                                    clearFieldError('configuration');
                                }}
                                options={unitTypeOptions}
                                placeholder="Select type"
                                error={errors.unit_type}
                                startIcon={<LuLayoutGrid aria-hidden />}
                            />
                            <InputField
                                label="Tower / block"
                                id={fid('tower_block')}
                                name="tower_block"
                                value={values.tower_block ?? ''}
                                onChange={(e) => setValue('tower_block', e.target.value || undefined)}
                                placeholder="e.g. Tower A"
                                showOptionalTag
                            />
                            <InputField
                                label="Floor"
                                id={fid('floor')}
                                name="floor"
                                value={values.floor ?? ''}
                                onChange={(e) => setValue('floor', e.target.value || undefined)}
                                placeholder="e.g. 12"
                                showOptionalTag
                            />
                            <InputField
                                label="Facing"
                                id={fid('facing')}
                                name="facing"
                                value={values.facing ?? ''}
                                onChange={(e) => setValue('facing', e.target.value || undefined)}
                                placeholder="e.g. East"
                                showOptionalTag
                            />
                            <SelectField
                                label="Configuration (BHK / layout)"
                                required
                                id={fid('configuration')}
                                name="configuration"
                                value={values.configuration}
                                onChange={(e) => setValue('configuration', e.target.value)}
                                options={configurationSelectOptions}
                                placeholder="Select configuration"
                                error={errors.configuration}
                            />
                            <InputField
                                label="Area (sq.ft)"
                                required
                                id={fid('unit_size')}
                                name="unit_size"
                                type="text"
                                inputMode="numeric"
                                value={String(values.unit_size)}
                                onChange={(e) => {
                                    const d = toDigitsOnly(e.target.value);
                                    setValue('unit_size', d ? Number(d) : 0);
                                }}
                                error={errors.unit_size}
                            />
                        </div>
                    </FormCollapsibleSection>

                    <FormCollapsibleSection
                        layout="card"
                        title="Pricing & taxes"
                        icon={LuIndianRupee}
                        tone="amber"
                        open={cardOpen.pricing}
                        onOpenChange={(o) => setCardOpen((s) => ({ ...s, pricing: o }))}
                        headerRight={
                            pricingErr > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {pricingErr} field{pricingErr === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
                            <InputField
                                label="Base price (INR)"
                                required
                                id={fid('price')}
                                name="price"
                                type="text"
                                inputMode="numeric"
                                value={String(values.price)}
                                onChange={(e) => {
                                    const d = toDigitsOnly(e.target.value);
                                    setValue('price', d ? Number(d) : 0);
                                }}
                                error={errors.price}
                                startIcon={<LuIndianRupee aria-hidden />}
                            />
                            <InputField
                                label="Offer price (INR)"
                                id={fid('offer_price')}
                                name="offer_price"
                                type="text"
                                inputMode="numeric"
                                value={values.offer_price === undefined ? '' : String(values.offer_price)}
                                onChange={(e) => {
                                    const d = toDigitsOnly(e.target.value);
                                    setValue('offer_price', d ? Number(d) : undefined);
                                }}
                                error={errors.offer_price}
                                showOptionalTag
                            />
                            <InputField
                                label="PLC charges (INR)"
                                id={fid('plc_charges')}
                                name="plc_charges"
                                type="text"
                                inputMode="numeric"
                                value={values.plc_charges === undefined ? '' : String(values.plc_charges)}
                                onChange={(e) => {
                                    const d = toDigitsOnly(e.target.value);
                                    setValue('plc_charges', d ? Number(d) : undefined);
                                }}
                                error={errors.plc_charges}
                                showOptionalTag
                            />
                            <InputField
                                label="GST / tax %"
                                id={fid('gst_tax_percent')}
                                name="gst_tax_percent"
                                value={values.gst_tax_percent === undefined ? '' : String(values.gst_tax_percent)}
                                onChange={(e) => {
                                    const t = e.target.value.trim();
                                    if (!t) {
                                        setValue('gst_tax_percent', undefined);
                                        return;
                                    }
                                    const n = Number(t.replace(/,/g, ''));
                                    setValue('gst_tax_percent', Number.isFinite(n) ? n : undefined);
                                }}
                                placeholder="e.g. 5"
                                error={errors.gst_tax_percent}
                                showOptionalTag
                            />
                            <div className="md:col-span-2">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-700">Final price (calculated)</p>
                                <div className="rounded-xl border border-gray-200 bg-slate-50/80 px-4 py-3 text-base font-bold text-slate-900 tabular-nums">
                                    {formatCurrencyINR(finalPricePreview)}
                                </div>
                                <p className="mt-1.5 text-xs font-medium text-gray-500">Offer, PLC, and GST when provided.</p>
                            </div>
                        </div>
                    </FormCollapsibleSection>

                    <FormCollapsibleSection
                        layout="card"
                        title="Availability & phasing"
                        icon={LuTag}
                        tone="slate"
                        open={cardOpen.status}
                        onOpenChange={(o) => setCardOpen((s) => ({ ...s, status: o }))}
                        headerRight={
                            statusErr > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {statusErr} field{statusErr === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
                            <SelectField
                                label="Availability"
                                required
                                id={fid('availability_status')}
                                name="availability_status"
                                value={values.availability_status}
                                onChange={(e) =>
                                    setValue('availability_status', e.target.value as UnitAvailabilityStatus)
                                }
                                options={availabilityOptions}
                                placeholder="Select status"
                                error={errors.availability_status}
                            />
                            <InputField
                                label="Block / phase"
                                id={fid('block_phase')}
                                name="block_phase"
                                value={values.block_phase || ''}
                                onChange={(e) => setValue('block_phase', e.target.value || undefined)}
                                placeholder="e.g. Phase A"
                                showOptionalTag
                            />
                        </div>
                    </FormCollapsibleSection>

                    {syncReadOnly ? (
                        <FormCollapsibleSection
                            layout="card"
                            title="Sync & locking (read only)"
                            icon={LuLayers}
                            tone="slate"
                            open={cardOpen.sync}
                            onOpenChange={(o) => setCardOpen((s) => ({ ...s, sync: o }))}
                        >
                            <InventorySyncLockingSection
                                mode="existing"
                                className="w-full"
                                inventory_lock_status={syncReadOnly.inventory_lock_status}
                                lock_timestamp={syncReadOnly.lock_timestamp}
                                unlock_timestamp={syncReadOnly.unlock_timestamp}
                                showDatetimePickers={false}
                            />
                        </FormCollapsibleSection>
                    ) : null}

                    <div className="space-y-3 border-t border-gray-200 pt-6">
                        {useDraft ? (
                            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                                <p className="min-h-5 text-xs text-gray-500">
                                    {draftUi.state === 'saving' ? (
                                        'Saving draft…'
                                    ) : draftUi.state === 'saved' && draftUi.at ? (
                                        <>
                                            Draft saved <span className="tabular-nums text-gray-700">{draftUi.at}</span> ·
                                            this browser
                                        </>
                                    ) : (
                                        'Autosave: draft updates as you type'
                                    )}
                                </p>
                                {isDirty ? <span className="text-xs font-medium text-amber-800">Unsaved changes</span> : null}
                            </div>
                        ) : isDirty ? (
                            <p className="text-xs font-medium text-amber-800">Unsaved changes</p>
                        ) : null}
                        <div className="flex flex-col-reverse flex-wrap gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <Button
                                type="button"
                                variant="companyGhost"
                                size="cta"
                                onClick={onCancel}
                                disabled={isSubmitting}
                                className="h-12 rounded-xl px-4 text-sm font-medium text-gray-600"
                            >
                                Cancel
                            </Button>
                            {useDraft ? (
                                <Button
                                    type="button"
                                    variant="companyOutline"
                                    size="cta"
                                    onClick={saveDraftManual}
                                    disabled={isSubmitting}
                                    className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm hover:border-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)]"
                                >
                                    Save draft
                                </Button>
                            ) : null}
                            <Button
                                key={submitShakeKey}
                                type="submit"
                                variant="company"
                                size="cta"
                                disabled={isSubmitting}
                                isLoading={isSubmitting}
                                className={cn(
                                    'h-12 min-w-44 rounded-xl font-semibold',
                                    CTA_SHADOW_SOFT,
                                    submitShakeKey > 0 && 'animate-lead-form-shake',
                                )}
                            >
                                {isSubmitting ? busyLabel : submitLabel}
                            </Button>
                        </div>
                    </div>
                </form>
            </>
        </CrmFieldProvider>
    );
}
