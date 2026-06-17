'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/projects-inventory/FormField';
import { TextInput } from '@/components/projects-inventory/TextInput';
import { SelectInput } from '@/components/projects-inventory/SelectInput';
import type { ProjectStatus, ProjectType } from '@/lib/projectsInventoryStore';
import type { ProjectApprovalStatus } from '@/lib/projectsInventoryStore';
import { cn } from '@/lib/utils';
import { CTA_FOCUS_VISIBLE_RING, CTA_INPUT_FOCUS, CTA_SHADOW_SOFT } from '@/lib/theme/ctaThemeClasses';

export type ProjectFormValues = {
    project_name: string;
    project_type: ProjectType;
    project_status: ProjectStatus;
    requires_approval: boolean;
    total_units: number;
    full_address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    landmark: string;
    map_url: string;
    developer_name: string;
    project_owner_name: string;
    project_manager_name: string;
    executive_manager_name: string;
    sales_head: string;
    towers_blocks: string;
    floors: string;
    launch_date: string;
    possession_date: string;
    starting_price: string;
    max_price: string;
    internal_notes: string;
};

export { ARRIS_PROJECT_CREATE_DRAFT_KEY, ProjectFormStandard } from './ProjectFormStandard';

export const PROJECT_CREATE_FORM_ID = 'project-enterprise-create-form';
const CREATE_PROJECT_DRAFT_KEY = 'arris-create-project-draft-v2';

const PROJECT_FIELD_IDS = {
    project_name: 'project-create-name',
    full_address: 'project-create-address',
    city: 'project-create-city',
    state: 'project-create-state',
    project_owner_name: 'project-create-owner',
    project_manager_name: 'project-create-pm',
    executive_manager_name: 'project-create-exec',
    total_units: 'project-create-units',
    project_type: 'project-create-type',
    project_status: 'project-create-status',
} as const;

type ImproveFieldKey = keyof typeof PROJECT_FIELD_IDS;

function focusProjectField(fieldKey: ImproveFieldKey) {
    const id = PROJECT_FIELD_IDS[fieldKey];
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
        const again = document.getElementById(id);
        if (again && 'focus' in again && typeof (again as HTMLElement & { focus: () => void }).focus === 'function') {
            (again as HTMLInputElement | HTMLSelectElement).focus({ preventScroll: true });
        }
    }, 320);
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="border-b border-[#e5e7eb] pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
            {subtitle ? <p className="mt-1 text-xs font-medium text-slate-400">{subtitle}</p> : null}
        </div>
    );
}

function computeProjectProgress(values: ProjectFormValues): number {
    let n = 0;
    const checks = [
        values.project_name.trim().length > 0,
        values.project_type,
        values.project_status,
        values.full_address.trim().length > 0,
        values.city.trim().length > 0,
        values.state.trim().length > 0,
        values.project_owner_name.trim().length > 0,
        values.project_manager_name.trim().length > 0,
        values.executive_manager_name.trim().length > 0,
        Number.isFinite(values.total_units) && values.total_units > 0,
    ];
    checks.forEach((c) => {
        if (c) n++;
    });
    return Math.round((n / checks.length) * 100);
}

function readinessFromProgress(p: number): { band: 'high' | 'medium' | 'low'; label: string } {
    if (p >= 85) return { band: 'high', label: 'Ready to submit' };
    if (p >= 55) return { band: 'medium', label: 'Almost there' };
    return { band: 'low', label: 'Complete required fields' };
}

function computeImproveChecklist(values: ProjectFormValues): { key: ImproveFieldKey; label: string; impact: number }[] {
    const out: { key: ImproveFieldKey; label: string; impact: number }[] = [];
    if (!values.project_name.trim()) out.push({ key: 'project_name', label: 'Project name', impact: 12 });
    if (!values.full_address.trim()) out.push({ key: 'full_address', label: 'Full address', impact: 12 });
    if (!values.city.trim()) out.push({ key: 'city', label: 'City', impact: 10 });
    if (!values.state.trim()) out.push({ key: 'state', label: 'State', impact: 10 });
    if (!values.project_owner_name.trim()) out.push({ key: 'project_owner_name', label: 'Project owner', impact: 10 });
    if (!values.project_manager_name.trim()) out.push({ key: 'project_manager_name', label: 'Project manager', impact: 10 });
    if (!values.executive_manager_name.trim()) out.push({ key: 'executive_manager_name', label: 'Executive manager', impact: 10 });
    if (!Number.isFinite(values.total_units) || values.total_units <= 0) out.push({ key: 'total_units', label: 'Total units', impact: 10 });
    if (!values.project_type) out.push({ key: 'project_type', label: 'Project type', impact: 8 });
    if (!values.project_status) out.push({ key: 'project_status', label: 'Status', impact: 8 });
    return out;
}

export function ProjectForm({
    initialProjectCode,
    initialValues,
    projectApprovalStatus,
    projectStatusLocked,
    onSubmit,
    onCancel,
    isSubmitting,
    approvalAllowed = true,
    variant = 'default',
    submitLabel,
    draftStorageKey,
}: {
    initialProjectCode: string;
    initialValues: ProjectFormValues;
    projectApprovalStatus?: ProjectApprovalStatus;
    projectStatusLocked?: boolean;
    onSubmit: (values: ProjectFormValues) => Promise<void> | void;
    onCancel: () => void;
    isSubmitting?: boolean;
    approvalAllowed?: boolean;
    variant?: 'default' | 'smartCreate';
    submitLabel?: string;
    /** When set (e.g. edit flow), drafts autosave under this key. */
    draftStorageKey?: string;
}) {
    const smart = variant === 'smartCreate';
    const resolvedSubmitLabel = submitLabel ?? 'Save';
    const resolvedDraftKey = draftStorageKey ?? CREATE_PROJECT_DRAFT_KEY;

    const [values, setValues] = useState<ProjectFormValues>(initialValues);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [strategyFlip, setStrategyFlip] = useState(0);
    const [draftUi, setDraftUi] = useState<{ state: 'idle' | 'saving' | 'saved'; at: string | null }>({
        state: 'idle',
        at: null,
    });

    const [savedBaselineJson, setSavedBaselineJson] = useState(() => JSON.stringify(initialValues));
    const dirty = JSON.stringify(values) !== savedBaselineJson;

    useEffect(() => {
        setValues(initialValues);
        setSavedBaselineJson(JSON.stringify(initialValues));
        setErrors({});
    }, [initialValues]);

    useEffect(() => {
        if (!dirty) return;
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [dirty]);

    const toDigitsOnly = (value: string) => value.replace(/\D/g, '');

    const getValidationErrors = () => {
        const next: Record<string, string> = {};
        if (!values.project_name.trim()) next.project_name = 'Project name is required';
        else if (values.project_name.trim().length > 200) next.project_name = 'Max 200 characters';

        if (!values.full_address.trim()) next.full_address = 'Full address is required';
        if (!values.city.trim()) next.city = 'City is required';
        if (!values.state.trim()) next.state = 'State is required';

        if (!values.project_owner_name.trim()) next.project_owner_name = 'Project owner is required';
        if (!values.project_manager_name.trim()) next.project_manager_name = 'Project manager is required';
        if (!values.executive_manager_name.trim()) next.executive_manager_name = 'Executive manager is required';

        if (!Number.isFinite(values.total_units) || values.total_units <= 0) next.total_units = 'Total units must be a positive number';
        if (!values.project_type) next.project_type = 'Project type is required';
        if (!values.project_status) next.project_status = 'Project status is required';

        if (values.map_url.trim() && !/^https?:\/\//i.test(values.map_url.trim())) {
            next.map_url = 'Enter a valid URL (https://…)';
        }
        return next;
    };

    const validate = () => {
        const next = getValidationErrors();
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const hasErrors = Object.keys(getValidationErrors()).length > 0;

    useEffect(() => {
        if (!smart) return;
        setDraftUi((prev) => ({ ...prev, state: 'saving' }));
        const t = window.setTimeout(() => {
            try {
                window.localStorage.setItem(resolvedDraftKey, JSON.stringify(values));
                setDraftUi({
                    state: 'saved',
                    at: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
                });
            } catch {
                setDraftUi({ state: 'idle', at: null });
            }
        }, 700);
        return () => window.clearTimeout(t);
    }, [values, smart, resolvedDraftKey]);

    const progressPct = useMemo(() => computeProjectProgress(values), [values]);
    const readiness = useMemo(() => readinessFromProgress(progressPct), [progressPct]);
    const improveChecklist = useMemo(() => computeImproveChecklist(values), [values]);

    const aiBundle = useMemo(
        () =>
            strategyFlip % 2 === 0
                ? {
                      followUp: 'Align tower/block labels with inventory import templates.',
                      approach: 'Capture RERA-linked addresses early for compliance packs.',
                      priority: values.requires_approval ? ('High' as const) : ('Medium' as const),
                  }
                : {
                      followUp: 'Executive ownership fields improve audit readiness.',
                      approach: 'Use possession dates to trigger pricing and demand workflows.',
                      priority: Number(values.total_units) > 150 ? ('High' as const) : ('Low' as const),
                  },
        [strategyFlip, values.requires_approval, values.total_units],
    );

    const insightTags = useMemo(() => {
        const t: string[] = [];
        if (Number(values.total_units) > 200) t.push('Large inventory');
        if (values.requires_approval) t.push('Approval gated');
        if (values.project_status === 'active') t.push('Live project');
        if (values.city.trim()) t.push(values.city.trim());
        if (t.length === 0) t.push('Standard setup');
        return t;
    }, [values]);

    const qualityBarColor =
        readiness.band === 'high' ? 'bg-emerald-500' : readiness.band === 'medium' ? 'bg-amber-500' : 'bg-rose-500';
    const qualityTextColor =
        readiness.band === 'high' ? 'text-emerald-800' : readiness.band === 'medium' ? 'text-amber-900' : 'text-rose-800';
    const qualityBg =
        readiness.band === 'high'
            ? 'bg-emerald-50/90 border-emerald-200/80'
            : readiness.band === 'medium'
              ? 'bg-amber-50/90 border-amber-200/80'
              : 'bg-rose-50/90 border-rose-200/80';
    const bandShort = readiness.band === 'high' ? 'High' : readiness.band === 'medium' ? 'Medium' : 'Low';
    const bandBadgeClass =
        readiness.band === 'high'
            ? 'bg-emerald-600/15 text-emerald-900 ring-emerald-300/80'
            : readiness.band === 'medium'
              ? 'bg-amber-500/15 text-amber-950 ring-amber-300/80'
              : 'bg-rose-600/12 text-rose-900 ring-rose-300/70';

    const submit = async () => {
        if (isSubmitting) return;
        if (!validate()) return;
        await onSubmit(values);
        setSavedBaselineJson(JSON.stringify(values));
    };

    const saveDraftManual = () => {
        try {
            window.localStorage.setItem(resolvedDraftKey, JSON.stringify(values));
            setDraftUi({
                state: 'saved',
                at: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
            });
        } catch {
            setDraftUi({ state: 'idle', at: null });
        }
    };

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

    const padClass = smart ? 'p-4 sm:p-6' : 'p-6';
    const fieldGap = 'gap-x-6 gap-y-5';
    const cardClass = 'overflow-hidden rounded-xl border border-[#e5e7eb] bg-white p-0 shadow-sm shadow-slate-200/40 transition-shadow hover:shadow-md';

    const formInner = (
        <Card className={cardClass} contentClassName="p-0">
            <form
                id={smart ? PROJECT_CREATE_FORM_ID : undefined}
                onSubmit={(e) => {
                    e.preventDefault();
                    void submit();
                }}
            >
                {!smart ? (
                    <div className="border-b border-[#e5e7eb] bg-slate-50/50 px-6 py-5">
                        <h2 className="text-lg font-bold text-slate-900">Project record</h2>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                            Structured enterprise setup — all routes and saves stay compatible with your existing catalog.
                        </p>
                    </div>
                ) : null}

                <div className={cn(padClass, 'space-y-8')}>
                    <div className="space-y-8">
                        {/* A. Basic Info */}
                        <section className="space-y-4">
                            <SectionHeader title="A. Basic information" subtitle="Identity and lifecycle" />
                            <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
                                <div className="md:col-span-2">
                                    <FormField
                                        label="Project ID"
                                        className="space-y-0"
                                        hint={projectApprovalStatus ? `Approval: ${projectApprovalStatus}` : 'Read-only enterprise code'}
                                    >
                                        <TextInput value={initialProjectCode} onChange={() => {}} disabled readOnly />
                                    </FormField>
                                </div>
                                <FormField label="Project name" required>
                                    <TextInput
                                        id={smart ? PROJECT_FIELD_IDS.project_name : undefined}
                                        name="project_name"
                                        value={values.project_name}
                                        onChange={(v) => setValues((p) => ({ ...p, project_name: v }))}
                                        placeholder="e.g. Skyline Residency"
                                        maxLength={200}
                                        error={errors.project_name}
                                        autoComplete="off"
                                    />
                                </FormField>
                                <FormField label="Project type" required>
                                    <SelectInput
                                        id={smart ? PROJECT_FIELD_IDS.project_type : undefined}
                                        name="project_type"
                                        value={values.project_type}
                                        onChange={(v) => setValues((p) => ({ ...p, project_type: v as ProjectType }))}
                                        options={projectTypeOptions}
                                        error={errors.project_type}
                                    />
                                </FormField>
                                <FormField label="Status" required>
                                    <SelectInput
                                        id={smart ? PROJECT_FIELD_IDS.project_status : undefined}
                                        name="project_status"
                                        value={values.project_status}
                                        onChange={(v) => setValues((p) => ({ ...p, project_status: v as ProjectStatus }))}
                                        options={projectStatusOptions}
                                        disabled={projectStatusLocked || !approvalAllowed}
                                        error={errors.project_status}
                                    />
                                </FormField>
                                <FormField label="Developer / builder name" hint="Optional">
                                    <TextInput
                                        value={values.developer_name}
                                        onChange={(v) => setValues((p) => ({ ...p, developer_name: v }))}
                                        placeholder="Registered developer entity"
                                        autoComplete="organization"
                                    />
                                </FormField>
                            </div>
                        </section>

                        {/* B. Address */}
                        <section className="space-y-4">
                            <SectionHeader title="B. Address & location" />
                            <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
                                <div className="md:col-span-2">
                                    <FormField label="Full address" required>
                                        <TextInput
                                            id={smart ? PROJECT_FIELD_IDS.full_address : undefined}
                                            name="full_address"
                                            value={values.full_address}
                                            onChange={(v) => setValues((p) => ({ ...p, full_address: v }))}
                                            placeholder="Street, locality, district"
                                            error={errors.full_address}
                                        />
                                    </FormField>
                                </div>
                                <FormField label="City" required>
                                    <TextInput
                                        id={smart ? PROJECT_FIELD_IDS.city : undefined}
                                        value={values.city}
                                        onChange={(v) => setValues((p) => ({ ...p, city: v }))}
                                        placeholder="City"
                                        error={errors.city}
                                    />
                                </FormField>
                                <FormField label="State" required>
                                    <TextInput
                                        id={smart ? PROJECT_FIELD_IDS.state : undefined}
                                        value={values.state}
                                        onChange={(v) => setValues((p) => ({ ...p, state: v }))}
                                        placeholder="State / UT"
                                        error={errors.state}
                                    />
                                </FormField>
                                <FormField label="Country" hint="Optional default India">
                                    <TextInput
                                        value={values.country}
                                        onChange={(v) => setValues((p) => ({ ...p, country: v }))}
                                        placeholder="India"
                                    />
                                </FormField>
                                <FormField label="Pincode">
                                    <TextInput
                                        value={values.pincode}
                                        onChange={(v) => setValues((p) => ({ ...p, pincode: toDigitsOnly(v).slice(0, 8) }))}
                                        placeholder="6 digits"
                                    />
                                </FormField>
                                <FormField label="Landmark" className="md:col-span-2">
                                    <TextInput
                                        value={values.landmark}
                                        onChange={(v) => setValues((p) => ({ ...p, landmark: v }))}
                                        placeholder="Nearby landmark"
                                    />
                                </FormField>
                                <FormField label="Google Maps URL" className="md:col-span-2" hint="Optional">
                                    <TextInput
                                        value={values.map_url}
                                        onChange={(v) => setValues((p) => ({ ...p, map_url: v }))}
                                        placeholder="https://maps.google.com/…"
                                        error={errors.map_url}
                                    />
                                </FormField>
                            </div>
                        </section>

                        {/* C. Management */}
                        <section className="space-y-4">
                            <SectionHeader title="C. Management team" subtitle="Client-requested ownership structure" />
                            <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
                                <FormField label="Project owner name" required>
                                    <TextInput
                                        id={smart ? PROJECT_FIELD_IDS.project_owner_name : undefined}
                                        value={values.project_owner_name}
                                        onChange={(v) => setValues((p) => ({ ...p, project_owner_name: v }))}
                                        error={errors.project_owner_name}
                                    />
                                </FormField>
                                <FormField label="Project manager name" required>
                                    <TextInput
                                        id={smart ? PROJECT_FIELD_IDS.project_manager_name : undefined}
                                        value={values.project_manager_name}
                                        onChange={(v) => setValues((p) => ({ ...p, project_manager_name: v }))}
                                        error={errors.project_manager_name}
                                    />
                                </FormField>
                                <FormField label="Executive manager name" required>
                                    <TextInput
                                        id={smart ? PROJECT_FIELD_IDS.executive_manager_name : undefined}
                                        value={values.executive_manager_name}
                                        onChange={(v) => setValues((p) => ({ ...p, executive_manager_name: v }))}
                                        error={errors.executive_manager_name}
                                    />
                                </FormField>
                                <FormField label="Sales head" hint="Optional">
                                    <TextInput
                                        value={values.sales_head}
                                        onChange={(v) => setValues((p) => ({ ...p, sales_head: v }))}
                                    />
                                </FormField>
                            </div>
                        </section>

                        {/* D. Capacity */}
                        <section className="space-y-4">
                            <SectionHeader title="D. Project capacity" />
                            <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
                                <FormField label="Total units" required>
                                    <TextInput
                                        id={smart ? PROJECT_FIELD_IDS.total_units : undefined}
                                        name="total_units"
                                        value={String(values.total_units)}
                                        onChange={(v) => {
                                            const digits = toDigitsOnly(v);
                                            setValues((p) => ({ ...p, total_units: digits ? Number(digits) : 0 }));
                                        }}
                                        type="number"
                                        error={errors.total_units}
                                    />
                                </FormField>
                                <FormField label="Towers / blocks">
                                    <TextInput
                                        value={values.towers_blocks}
                                        onChange={(v) => setValues((p) => ({ ...p, towers_blocks: v }))}
                                        placeholder="e.g. Tower A, B"
                                    />
                                </FormField>
                                <FormField label="Floors">
                                    <TextInput
                                        value={values.floors}
                                        onChange={(v) => setValues((p) => ({ ...p, floors: v }))}
                                        placeholder="e.g. G + 18"
                                    />
                                </FormField>
                                <FormField label="Launch date">
                                    <TextInput
                                        type="date"
                                        value={values.launch_date}
                                        onChange={(v) => setValues((p) => ({ ...p, launch_date: v }))}
                                    />
                                </FormField>
                                <FormField label="Possession date">
                                    <TextInput
                                        type="date"
                                        value={values.possession_date}
                                        onChange={(v) => setValues((p) => ({ ...p, possession_date: v }))}
                                    />
                                </FormField>
                            </div>
                        </section>

                        {/* E. Commercial */}
                        <section className="space-y-4">
                            <SectionHeader title="E. Commercial snapshot" />
                            <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
                                <FormField label="Starting price (₹)" hint="Optional">
                                    <TextInput
                                        value={values.starting_price}
                                        onChange={(v) => setValues((p) => ({ ...p, starting_price: toDigitsOnly(v) }))}
                                        placeholder="e.g. 6200000"
                                    />
                                </FormField>
                                <FormField label="Max price (₹)" hint="Optional">
                                    <TextInput
                                        value={values.max_price}
                                        onChange={(v) => setValues((p) => ({ ...p, max_price: toDigitsOnly(v) }))}
                                        placeholder="e.g. 12500000"
                                    />
                                </FormField>
                                {approvalAllowed ? (
                                    <div className="md:col-span-2">
                                        <div className="flex flex-col justify-between gap-4 rounded-xl border border-[#e5e7eb] bg-slate-50/60 p-5 sm:flex-row sm:items-center">
                                            <div>
                                                <span className="text-sm font-bold text-slate-900">Approval required</span>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    When on, the project stays pending until an approver activates it.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={values.requires_approval}
                                                onClick={() => setValues((p) => ({ ...p, requires_approval: !p.requires_approval }))}
                                                className={cn(
                                                    'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors',
                                                    values.requires_approval ? 'bg-[var(--cta-button-bg)]' : 'bg-slate-300',
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                                                        values.requires_approval ? 'translate-x-6' : 'translate-x-1',
                                                    )}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </section>

                        {/* F. Notes */}
                        <section className="space-y-4">
                            <SectionHeader title="F. Internal notes" />
                            <FormField label="Notes" hint="Visible to your workspace only">
                                <textarea
                                    value={values.internal_notes}
                                    onChange={(e) => setValues((p) => ({ ...p, internal_notes: e.target.value }))}
                                    rows={4}
                                    className={cn(
                                        'w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm',
                                        CTA_INPUT_FOCUS,
                                    )}
                                    placeholder="Handover checklist, lender nuances, broker policies…"
                                />
                            </FormField>
                        </section>
                    </div>

                    {!smart ? (
                        <div className="mt-10 flex flex-col gap-3 border-t border-[#e5e7eb] bg-slate-50/40 px-6 py-5 sm:flex-row sm:justify-end">
                            <Button type="button" variant="companyGhost" size="cta" onClick={onCancel} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="button" variant="companyOutline" size="cta" onClick={saveDraftManual}>
                                Save draft
                            </Button>
                            <Button
                                type="submit"
                                variant="company"
                                size="cta"
                                disabled={isSubmitting || hasErrors}
                                isLoading={isSubmitting}
                            >
                                {isSubmitting ? 'Saving…' : resolvedSubmitLabel}
                            </Button>
                        </div>
                    ) : null}
                </div>
            </form>
        </Card>
    );

    const stickyRail = smart ? (
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
            <div className={cn('rounded-xl border p-4 shadow-sm', qualityBg)}>
                <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Readiness score</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    <p className={cn('text-3xl font-black tabular-nums leading-none', qualityTextColor)}>{progressPct}%</p>
                    <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide ring-1 uppercase', bandBadgeClass)}>
                        {bandShort}
                    </span>
                </div>
                <p className={cn('mt-2 text-xs font-semibold', qualityTextColor)}>{readiness.label}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
                    <div className={cn('h-full rounded-full transition-all duration-300', qualityBarColor)} style={{ width: `${progressPct}%` }} />
                </div>
                <div className="mt-4 border-t border-black/5 pt-4">
                    <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Missing fields</p>
                    {improveChecklist.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                            {improveChecklist.map((it) => (
                                <li key={it.key}>
                                    <button
                                        type="button"
                                        onClick={() => focusProjectField(it.key)}
                                        className={cn(
                                            'flex w-full items-start justify-between gap-2 rounded-lg py-1.5 text-left text-xs text-slate-800 transition hover:bg-white/60 focus:outline-none focus-visible:ring-2',
                                            CTA_FOCUS_VISIBLE_RING,
                                        )}
                                    >
                                        <span className="min-w-0 font-semibold">{it.label}</span>
                                        <span className="shrink-0 font-bold tabular-nums text-violet-800">+{it.impact}%</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-xs font-medium text-emerald-800">All required fields complete</p>
                    )}
                </div>
            </div>

            <div className="rounded-xl border border-violet-200/70 bg-linear-to-br from-violet-50/90 to-sky-50/50 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900">AI suggestions</p>
                    <Button
                        type="button"
                        variant="companyOutline"
                        size="sm"
                        className="h-7 border-violet-300 px-2 text-[11px] text-violet-900"
                        onClick={() => setStrategyFlip((x) => x + 1)}
                    >
                        Refresh
                    </Button>
                </div>
                <ul className="mt-3 space-y-2 text-xs leading-snug text-slate-700">
                    <li>
                        <span className="font-semibold text-slate-800">Next: </span>
                        {aiBundle.followUp}
                    </li>
                    <li>
                        <span className="font-semibold text-slate-800">Playbook: </span>
                        {aiBundle.approach}
                    </li>
                    <li className="flex flex-wrap items-center gap-1">
                        <span className="font-semibold text-slate-800">Priority: </span>
                        <span
                            className={cn(
                                'rounded px-1.5 py-0.5 text-[10px] font-bold',
                                aiBundle.priority === 'High' && 'bg-rose-100 text-rose-800',
                                aiBundle.priority === 'Medium' && 'bg-amber-100 text-amber-900',
                                aiBundle.priority === 'Low' && 'bg-slate-200 text-slate-700',
                            )}
                        >
                            {aiBundle.priority}
                        </span>
                    </li>
                </ul>
            </div>

            <div className="rounded-xl border border-[#e5e7eb] bg-slate-50/80 p-4 shadow-sm">
                <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Draft status</p>
                <p className="mt-2 text-xs text-slate-600">
                    {draftUi.state === 'saving' ? 'Saving draft…' : null}
                    {draftUi.state === 'saved' && draftUi.at ? `Last saved locally · ${draftUi.at}` : null}
                    {draftUi.state === 'idle' ? 'Autosave enabled while you type.' : null}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                    {insightTags.map((t) => (
                        <span key={t} className="rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 ring-1 ring-[#e5e7eb]">
                            {t}
                        </span>
                    ))}
                </div>
            </div>
        </aside>
    ) : null;

    const smartFooter = smart ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-3 sm:px-6 sm:pb-4 lg:ml-16">
            <div className="pointer-events-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5e7eb] bg-white/95 px-4 py-3 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.12)] backdrop-blur-md supports-backdrop-filter:bg-white/90 sm:px-6">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                    <div className={cn('rounded-lg border px-3 py-2 shadow-sm', qualityBg)}>
                        <p className="text-[9px] font-bold tracking-wider text-slate-500 uppercase">Score</p>
                        <p className={cn('text-lg font-black tabular-nums', qualityTextColor)}>
                            {progressPct}% <span className="text-[10px] font-bold uppercase">{bandShort}</span>
                        </p>
                    </div>
                    <p className="hidden text-xs text-slate-500 sm:block">
                        {dirty ? 'You have unsaved changes.' : 'All changes saved to draft locally.'}
                    </p>
                </div>
                <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                    <Button type="button" variant="companyGhost" size="cta" className="h-10 text-sm" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="button" variant="companyOutline" size="cta" className="h-10 text-sm" onClick={saveDraftManual} disabled={isSubmitting}>
                        Save draft
                    </Button>
                    <Button
                        type="submit"
                        form={PROJECT_CREATE_FORM_ID}
                        variant="company"
                        size="cta"
                        className={cn('h-10 min-w-[160px] text-sm', CTA_SHADOW_SOFT)}
                        disabled={isSubmitting || hasErrors}
                        isLoading={isSubmitting}
                    >
                        {isSubmitting ? 'Saving…' : resolvedSubmitLabel}
                    </Button>
                </div>
            </div>
        </div>
    ) : null;

    if (!smart) {
        return formInner;
    }

    return (
        <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-slate-500">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">Enterprise layout</span>
                    <span className="tabular-nums">{progressPct}% complete</span>
                </div>
                {draftUi.state === 'saving' ? (
                    <span className="text-amber-700">Saving draft…</span>
                ) : draftUi.state === 'saved' && draftUi.at ? (
                    <span className="text-emerald-700">Draft · {draftUi.at}</span>
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-6 pb-28 lg:grid-cols-3 lg:items-start">
                <div className="lg:col-span-2">{formInner}</div>
                <div className="lg:col-span-1">{stickyRail}</div>
            </div>

            {smartFooter}
        </>
    );
}
