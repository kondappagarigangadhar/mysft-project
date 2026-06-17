'use client';

import React from 'react';
import { FormCollapsibleSection } from '@/components/forms/FormCollapsibleSection';
import { CrmFieldProvider, InputField, SelectField, TextAreaField } from '@/components/forms/Fields';
import { Button } from '@/components/ui/Button';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { cn } from '@/lib/utils';
import { CTA_FLOW_LINK, CTA_SHADOW_SOFT } from '@/lib/theme/ctaThemeClasses';
import type { ProjectApprovalStatus } from '@/lib/projectsInventoryStore';
import type { ProjectStatus, ProjectType } from '@/lib/projectsInventoryStore';
import type { ProjectFormValues } from '@/components/projects-inventory/ProjectForm';
import {
    LuBuilding2,
    LuFileText,
    LuIndianRupee,
    LuLayers,
    LuMapPin,
    LuTag,
    LuUsers,
} from 'react-icons/lu';

export const ARRIS_PROJECT_CREATE_DRAFT_KEY = 'arris-create-project-draft-v2';

const SCROLL_OFFSET_PX = 96;
const FORM_ID = 'project-standard-form';

export const PROJECT_CREATE_FIELD_IDS: Record<keyof ProjectFormValues, string> = {
    project_name: 'project-create-name',
    project_type: 'project-create-type',
    project_status: 'project-create-status',
    requires_approval: 'project-create-approval',
    total_units: 'project-create-units',
    full_address: 'project-create-address',
    city: 'project-create-city',
    state: 'project-create-state',
    country: 'project-create-country',
    pincode: 'project-create-pincode',
    landmark: 'project-create-landmark',
    map_url: 'project-create-map',
    developer_name: 'project-create-developer',
    project_owner_name: 'project-create-owner',
    project_manager_name: 'project-create-pm',
    executive_manager_name: 'project-create-exec',
    sales_head: 'project-create-sales',
    towers_blocks: 'project-create-towers',
    floors: 'project-create-floors',
    launch_date: 'project-create-launch',
    possession_date: 'project-create-possession',
    starting_price: 'project-create-starting',
    max_price: 'project-create-max',
    internal_notes: 'project-create-notes',
};

const VALIDATION_ORDER: (keyof ProjectFormValues)[] = [
    'project_name',
    'project_type',
    'project_status',
    'full_address',
    'city',
    'state',
    'map_url',
    'project_owner_name',
    'project_manager_name',
    'executive_manager_name',
    'total_units',
];

const HUMAN_LABEL: Record<keyof ProjectFormValues, string> = {
    project_name: 'Project name',
    project_type: 'Project type',
    project_status: 'Status',
    requires_approval: 'Approval required',
    total_units: 'Total units',
    full_address: 'Full address',
    city: 'City',
    state: 'State',
    country: 'Country',
    pincode: 'Pincode',
    landmark: 'Landmark',
    map_url: 'Map URL',
    developer_name: 'Developer',
    project_owner_name: 'Project owner',
    project_manager_name: 'Project manager',
    executive_manager_name: 'Executive manager',
    sales_head: 'Sales head',
    towers_blocks: 'Towers / blocks',
    floors: 'Floors',
    launch_date: 'Launch date',
    possession_date: 'Possession date',
    starting_price: 'Starting price',
    max_price: 'Max price',
    internal_notes: 'Internal notes',
};

const BASIC_KEYS: (keyof ProjectFormValues)[] = ['project_name', 'project_type', 'project_status'];
const ADDRESS_KEYS: (keyof ProjectFormValues)[] = ['full_address', 'city', 'state', 'map_url'];
const MGMT_KEYS: (keyof ProjectFormValues)[] = ['project_owner_name', 'project_manager_name', 'executive_manager_name'];
const CAP_KEYS: (keyof ProjectFormValues)[] = ['total_units'];

type FormErrors = Partial<Record<keyof ProjectFormValues, string>>;

function validateProjectValues(v: ProjectFormValues): FormErrors {
    const next: FormErrors = {};
    if (!v.project_name.trim()) next.project_name = 'This field is required';
    else if (v.project_name.trim().length > 200) next.project_name = 'Use at most 200 characters';

    if (!v.project_type) next.project_type = 'Please select project type';
    if (!v.project_status) next.project_status = 'Please select status';

    if (!v.full_address.trim()) next.full_address = 'This field is required';
    if (!v.city.trim()) next.city = 'This field is required';
    if (!v.state.trim()) next.state = 'This field is required';

    if (!v.project_owner_name.trim()) next.project_owner_name = 'This field is required';
    if (!v.project_manager_name.trim()) next.project_manager_name = 'This field is required';
    if (!v.executive_manager_name.trim()) next.executive_manager_name = 'This field is required';

    if (!Number.isFinite(v.total_units) || v.total_units <= 0) next.total_units = 'Enter a positive number of units';

    if (v.map_url.trim() && !/^https?:\/\//i.test(v.map_url.trim())) {
        next.map_url = 'Enter a valid URL (https://…)';
    }
    return next;
}

function focusField(key: keyof ProjectFormValues) {
    const id = PROJECT_CREATE_FIELD_IDS[key];
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_PX;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    window.setTimeout(() => {
        const again = document.getElementById(id);
        if (again && 'focus' in again && typeof (again as HTMLElement & { focus: () => void }).focus === 'function') {
            (again as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).focus({ preventScroll: true });
        }
    }, 400);
}

const toDigitsOnly = (value: string) => value.replace(/\D/g, '');

const projectStatusOptions = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'active', label: 'Active' },
    { value: 'sold out', label: 'Sold Out' },
];
const projectTypeOptions = [
    { value: 'Plot', label: 'Plot' },
    { value: 'Apartment', label: 'Apartment' },
    { value: 'Villa', label: 'Villa' },
];

export function ProjectFormStandard({
    initialProjectCode,
    initialValues,
    projectApprovalStatus,
    projectStatusLocked,
    onSubmit,
    onCancel,
    isSubmitting,
    approvalAllowed = true,
    submitLabel = 'Save',
    draftStorageKey = ARRIS_PROJECT_CREATE_DRAFT_KEY,
    draftAutoSaveDisabled = false,
    onValuesChange,
    onManualSaveDraft,
}: {
    initialProjectCode: string;
    initialValues: ProjectFormValues;
    projectApprovalStatus?: ProjectApprovalStatus;
    projectStatusLocked?: boolean;
    onSubmit: (values: ProjectFormValues) => Promise<void> | void;
    onCancel: () => void;
    isSubmitting?: boolean;
    approvalAllowed?: boolean;
    submitLabel?: string;
    draftStorageKey?: string;
    /** When true, internal localStorage autosave is disabled (parent manages drafts). */
    draftAutoSaveDisabled?: boolean;
    /** Notifies parent on every value change (including initial load). */
    onValuesChange?: (values: ProjectFormValues) => void;
    /** Optional override for the "Save draft" button behavior. */
    onManualSaveDraft?: (values: ProjectFormValues) => void;
}) {
    const [values, setValues] = React.useState<ProjectFormValues>(initialValues);
    const [errors, setErrors] = React.useState<FormErrors>({});
    const [showValidationSummary, setShowValidationSummary] = React.useState(false);
    const [validationFieldToast, setValidationFieldToast] = React.useState<string | null>(null);
    const [submitShakeKey, setSubmitShakeKey] = React.useState(0);
    const [cardOpen, setCardOpen] = React.useState({
        basic: true,
        address: true,
        management: true,
        capacity: true,
        commercial: true,
        notes: true,
    });
    const [draftUi, setDraftUi] = React.useState<{ state: 'idle' | 'saving' | 'saved'; at: string | null }>({
        state: 'idle',
        at: null,
    });
    const dismissValidationToast = React.useCallback(() => setValidationFieldToast(null), []);
    const [baselineJson, setBaselineJson] = React.useState(() => JSON.stringify(initialValues));

    React.useEffect(() => {
        setValues(initialValues);
        setErrors({});
        setShowValidationSummary(false);
        setBaselineJson(JSON.stringify(initialValues));
    }, [initialValues]);

    React.useEffect(() => {
        onValuesChange?.(values);
    }, [values, onValuesChange]);

    const isDirty = React.useMemo(() => JSON.stringify(values) !== baselineJson, [values, baselineJson]);

    React.useEffect(() => {
        if (Object.keys(errors).length === 0) {
            setShowValidationSummary(false);
            setValidationFieldToast(null);
        }
    }, [errors]);

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
        if (draftAutoSaveDisabled) {
            setDraftUi({ state: 'idle', at: null });
            return;
        }
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
    }, [values, draftStorageKey, draftAutoSaveDisabled]);

    const clearFieldError = React.useCallback((name: keyof ProjectFormValues) => {
        setErrors((prev) => {
            if (!prev[name]) return prev;
            const next = { ...prev };
            delete next[name];
            return next;
        });
    }, []);

    const setValue = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => {
        setValues((p) => ({ ...p, [key]: value }));
        clearFieldError(key);
    };

    const fieldGap = 'gap-x-5 gap-y-5 sm:gap-x-6 sm:gap-y-6';
    const fid = (k: keyof ProjectFormValues) => PROJECT_CREATE_FIELD_IDS[k];

    const basicErr = BASIC_KEYS.filter((k) => errors[k]).length;
    const addressErr = ADDRESS_KEYS.filter((k) => errors[k]).length;
    const mgmtErr = MGMT_KEYS.filter((k) => errors[k]).length;
    const capErr = CAP_KEYS.filter((k) => errors[k]).length;

    const summaryKeys = showValidationSummary ? VALIDATION_ORDER.filter((k) => errors[k]) : [];

    const runSubmit = () => {
        if (isSubmitting) return;
        const nextErrors = validateProjectValues(values);
        setErrors(nextErrors);
        const keys = Object.keys(nextErrors) as (keyof ProjectFormValues)[];
        if (keys.length > 0) {
            setShowValidationSummary(true);
            setValidationFieldToast(`Please complete ${keys.length} required field${keys.length === 1 ? '' : 's'}`);
            setSubmitShakeKey((k) => k + 1);
            setCardOpen((s) => ({
                ...s,
                basic: BASIC_KEYS.some((k) => nextErrors[k]) ? true : s.basic,
                address: ADDRESS_KEYS.some((k) => nextErrors[k]) ? true : s.address,
                management: MGMT_KEYS.some((k) => nextErrors[k]) ? true : s.management,
                capacity: CAP_KEYS.some((k) => nextErrors[k]) ? true : s.capacity,
            }));
            const first = VALIDATION_ORDER.find((k) => nextErrors[k]);
            if (first) window.requestAnimationFrame(() => focusField(first));
            return;
        }
        setShowValidationSummary(false);
        void onSubmit(values);
    };

    const saveDraftManual = () => {
        if (onManualSaveDraft) {
            onManualSaveDraft(values);
            return;
        }
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
                                    if (BASIC_KEYS.includes(k)) setCardOpen((s) => ({ ...s, basic: true }));
                                    if (ADDRESS_KEYS.includes(k)) setCardOpen((s) => ({ ...s, address: true }));
                                    if (MGMT_KEYS.includes(k)) setCardOpen((s) => ({ ...s, management: true }));
                                    if (CAP_KEYS.includes(k)) setCardOpen((s) => ({ ...s, capacity: true }));
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

    const busyLabel = submitLabel === 'Create project' ? 'Creating...' : 'Saving…';

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
                        title="Basic information"
                        icon={LuBuilding2}
                        tone="blue"
                        open={cardOpen.basic}
                        onOpenChange={(o) => setCardOpen((s) => ({ ...s, basic: o }))}
                        headerRight={
                            basicErr > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {basicErr} field{basicErr === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
                            <div className="md:col-span-2">
                                <InputField
                                    label="Project ID"
                                    readOnly
                                    disabled
                                    value={initialProjectCode}
                                    className="opacity-90"
                                    startIcon={<LuTag aria-hidden />}
                                />
                                {projectApprovalStatus ? (
                                    <p className="mt-1.5 text-xs font-medium text-slate-500">
                                        Approval status: {projectApprovalStatus}
                                    </p>
                                ) : null}
                            </div>
                            <InputField
                                label="Project name"
                                required
                                id={fid('project_name')}
                                name="project_name"
                                value={values.project_name}
                                onChange={(e) => setValue('project_name', e.target.value)}
                                placeholder="e.g. Skyline Residency"
                                maxLength={200}
                                error={errors.project_name}
                                startIcon={<LuBuilding2 aria-hidden />}
                            />
                            <SelectField
                                label="Project type"
                                required
                                id={fid('project_type')}
                                name="project_type"
                                value={values.project_type}
                                onChange={(e) => setValue('project_type', e.target.value as ProjectType)}
                                options={projectTypeOptions}
                                placeholder="Select type"
                                error={errors.project_type}
                                startIcon={<LuLayers aria-hidden />}
                            />
                            <SelectField
                                label="Status"
                                required
                                id={fid('project_status')}
                                name="project_status"
                                value={values.project_status}
                                onChange={(e) => setValue('project_status', e.target.value as ProjectStatus)}
                                options={projectStatusOptions}
                                placeholder="Select status"
                                disabled={projectStatusLocked || !approvalAllowed}
                                error={errors.project_status}
                                startIcon={<LuTag aria-hidden />}
                            />
                            <div className="md:col-span-2">
                                <InputField
                                    label="Developer / builder name"
                                    id={fid('developer_name')}
                                    name="developer_name"
                                    value={values.developer_name}
                                    onChange={(e) => setValue('developer_name', e.target.value)}
                                    placeholder="Registered developer entity"
                                    showOptionalTag
                                    startIcon={<LuBuilding2 aria-hidden />}
                                />
                            </div>
                        </div>
                    </FormCollapsibleSection>

                    <FormCollapsibleSection
                        layout="card"
                        title="Address & location"
                        icon={LuMapPin}
                        tone="amber"
                        open={cardOpen.address}
                        onOpenChange={(o) => setCardOpen((s) => ({ ...s, address: o }))}
                        headerRight={
                            addressErr > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {addressErr} field{addressErr === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
                            <div className="md:col-span-2">
                                <TextAreaField
                                    label="Full address"
                                    required
                                    id={fid('full_address')}
                                    name="full_address"
                                    value={values.full_address}
                                    onChange={(e) => setValue('full_address', e.target.value)}
                                    rows={2}
                                    placeholder="Street, locality, district"
                                    error={errors.full_address}
                                    startIcon={<LuMapPin aria-hidden />}
                                />
                            </div>
                            <InputField
                                label="City"
                                required
                                id={fid('city')}
                                name="city"
                                value={values.city}
                                onChange={(e) => setValue('city', e.target.value)}
                                error={errors.city}
                                startIcon={<LuMapPin aria-hidden />}
                            />
                            <InputField
                                label="State"
                                required
                                id={fid('state')}
                                name="state"
                                value={values.state}
                                onChange={(e) => setValue('state', e.target.value)}
                                error={errors.state}
                                startIcon={<LuMapPin aria-hidden />}
                            />
                            <InputField
                                label="Country"
                                id={fid('country')}
                                name="country"
                                value={values.country}
                                onChange={(e) => setValue('country', e.target.value)}
                                placeholder="India"
                                showOptionalTag
                            />
                            <InputField
                                label="Pincode"
                                id={fid('pincode')}
                                name="pincode"
                                value={values.pincode}
                                onChange={(e) => setValue('pincode', toDigitsOnly(e.target.value).slice(0, 8))}
                                placeholder="6 digits"
                                inputMode="numeric"
                            />
                            <InputField
                                label="Landmark"
                                className="md:col-span-2"
                                id={fid('landmark')}
                                name="landmark"
                                value={values.landmark}
                                onChange={(e) => setValue('landmark', e.target.value)}
                                showOptionalTag
                            />
                            <div className="md:col-span-2">
                                <InputField
                                    label="Google Maps URL"
                                    id={fid('map_url')}
                                    name="map_url"
                                    value={values.map_url}
                                    onChange={(e) => {
                                        setValue('map_url', e.target.value);
                                    }}
                                    placeholder="https://…"
                                    error={errors.map_url}
                                    showOptionalTag
                                />
                            </div>
                        </div>
                    </FormCollapsibleSection>

                    <FormCollapsibleSection
                        layout="card"
                        title="Management team"
                        icon={LuUsers}
                        tone="slate"
                        open={cardOpen.management}
                        onOpenChange={(o) => setCardOpen((s) => ({ ...s, management: o }))}
                        headerRight={
                            mgmtErr > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {mgmtErr} field{mgmtErr === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
                            <InputField
                                label="Project owner name"
                                required
                                id={fid('project_owner_name')}
                                name="project_owner_name"
                                value={values.project_owner_name}
                                onChange={(e) => setValue('project_owner_name', e.target.value)}
                                error={errors.project_owner_name}
                                startIcon={<LuUsers aria-hidden />}
                            />
                            <InputField
                                label="Project manager name"
                                required
                                id={fid('project_manager_name')}
                                name="project_manager_name"
                                value={values.project_manager_name}
                                onChange={(e) => setValue('project_manager_name', e.target.value)}
                                error={errors.project_manager_name}
                                startIcon={<LuUsers aria-hidden />}
                            />
                            <InputField
                                label="Executive manager name"
                                required
                                id={fid('executive_manager_name')}
                                name="executive_manager_name"
                                value={values.executive_manager_name}
                                onChange={(e) => setValue('executive_manager_name', e.target.value)}
                                error={errors.executive_manager_name}
                                startIcon={<LuUsers aria-hidden />}
                            />
                            <InputField
                                label="Sales head"
                                id={fid('sales_head')}
                                name="sales_head"
                                value={values.sales_head}
                                onChange={(e) => setValue('sales_head', e.target.value)}
                                showOptionalTag
                            />
                        </div>
                    </FormCollapsibleSection>

                    <FormCollapsibleSection
                        layout="card"
                        title="Project capacity"
                        icon={LuLayers}
                        tone="blue"
                        open={cardOpen.capacity}
                        onOpenChange={(o) => setCardOpen((s) => ({ ...s, capacity: o }))}
                        headerRight={
                            capErr > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {capErr} field{capErr === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
                            <InputField
                                label="Total units"
                                required
                                id={fid('total_units')}
                                name="total_units"
                                type="text"
                                inputMode="numeric"
                                value={String(values.total_units)}
                                onChange={(e) => {
                                    const d = toDigitsOnly(e.target.value);
                                    setValue('total_units', d ? Number(d) : 0);
                                }}
                                error={errors.total_units}
                                startIcon={<LuLayers aria-hidden />}
                            />
                            <InputField
                                label="Towers / blocks"
                                id={fid('towers_blocks')}
                                name="towers_blocks"
                                value={values.towers_blocks}
                                onChange={(e) => setValue('towers_blocks', e.target.value)}
                                placeholder="e.g. Tower A, B"
                            />
                            <InputField
                                label="Floors"
                                id={fid('floors')}
                                name="floors"
                                value={values.floors}
                                onChange={(e) => setValue('floors', e.target.value)}
                                placeholder="e.g. G + 18"
                            />
                            <InputField
                                label="Launch date"
                                type="date"
                                id={fid('launch_date')}
                                name="launch_date"
                                value={values.launch_date}
                                onChange={(e) => setValue('launch_date', e.target.value)}
                            />
                            <InputField
                                label="Possession date"
                                type="date"
                                id={fid('possession_date')}
                                name="possession_date"
                                value={values.possession_date}
                                onChange={(e) => setValue('possession_date', e.target.value)}
                            />
                        </div>
                    </FormCollapsibleSection>

                    <FormCollapsibleSection
                        layout="card"
                        title="Commercial"
                        icon={LuIndianRupee}
                        tone="amber"
                        open={cardOpen.commercial}
                        onOpenChange={(o) => setCardOpen((s) => ({ ...s, commercial: o }))}
                    >
                        <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
                            <InputField
                                label="Starting price (₹)"
                                id={fid('starting_price')}
                                name="starting_price"
                                value={values.starting_price}
                                onChange={(e) => setValue('starting_price', toDigitsOnly(e.target.value))}
                                placeholder="e.g. 6200000"
                                showOptionalTag
                                startIcon={<LuIndianRupee aria-hidden />}
                            />
                            <InputField
                                label="Max price (₹)"
                                id={fid('max_price')}
                                name="max_price"
                                value={values.max_price}
                                onChange={(e) => setValue('max_price', toDigitsOnly(e.target.value))}
                                placeholder="e.g. 12500000"
                                showOptionalTag
                                startIcon={<LuIndianRupee aria-hidden />}
                            />
                            {approvalAllowed ? (
                                <div className="md:col-span-2">
                                    <div className="flex flex-col justify-between gap-4 rounded-xl border border-gray-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:p-5">
                                        <div>
                                            <span className="text-sm font-semibold text-gray-900">Approval required</span>
                                            <p className="mt-1 text-sm text-gray-500">
                                                When on, the project stays pending until an approver activates it.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={values.requires_approval}
                                            onClick={() => setValue('requires_approval', !values.requires_approval)}
                                            className={cn(
                                                'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors',
                                                values.requires_approval ? 'bg-[var(--cta-button-bg)]' : 'bg-slate-300',
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform',
                                                    values.requires_approval ? 'translate-x-7' : 'translate-x-1.5',
                                                )}
                                            />
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </FormCollapsibleSection>

                    <FormCollapsibleSection
                        layout="card"
                        title="Internal notes"
                        icon={LuFileText}
                        tone="slate"
                        open={cardOpen.notes}
                        onOpenChange={(o) => setCardOpen((s) => ({ ...s, notes: o }))}
                    >
                        <TextAreaField
                            label="Notes"
                            id={fid('internal_notes')}
                            name="internal_notes"
                            value={values.internal_notes}
                            onChange={(e) => setValue('internal_notes', e.target.value)}
                            rows={5}
                            placeholder="Handover checklist, lender nuances, broker policies…"
                            startIcon={<LuFileText aria-hidden />}
                            showOptionalTag
                        />
                    </FormCollapsibleSection>

                    <div className="space-y-3 border-t border-gray-200 pt-6">
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
