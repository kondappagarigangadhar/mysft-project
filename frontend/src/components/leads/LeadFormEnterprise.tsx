'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormCollapsibleSection } from '@/components/forms/FormCollapsibleSection';
import { CrmFieldProvider, InputField, SelectField, TextAreaField } from '@/components/forms/Fields';
import {
    getLeads,
    LEAD_PREFERRED_UNIT_TYPE_OPTIONS,
    normalizeLeadPhoneDigits,
    type LeadSource,
    type LeadStatus,
    type PropertyType,
} from '@/lib/leadStore';
import {
    alternateAiSuggestions,
    buildGeneratedNotesPreview,
    budgetShortTag,
    computeBookingChance,
    computeFormProgressPercent,
    computeImproveScoreChecklist,
    computeLeadQualityScore,
    computeMockConversionChance,
    computeScoreBreakdown,
    computeSiteVisitChance,
    defaultAiSuggestions,
    isLikelyCorporateEmail,
    LEAD_FIELD_IDS,
    previewRiskOpportunity,
    quickRiskFlagTags,
    sourceConversionShortTag,
    type ImproveScoreItem,
} from '@/lib/aiLeadCreateHelpers';
import { cn } from '@/lib/utils';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import {
    LuArrowLeft,
    LuBuilding2,
    LuFileText,
    LuHouse,
    LuIndianRupee,
    LuLayoutGrid,
    LuListChecks,
    LuMail,
    LuMapPin,
    LuPhone,
    LuSparkles,
    LuStickyNote,
    LuTag,
    LuUser,
    LuUserRound,
} from 'react-icons/lu';

const LEAD_CREATE_FORM_ID = 'lead-enterprise-create-form';
export const ARRIS_LEAD_CREATE_DRAFT_KEY = 'arris-create-lead-draft-v1';

const LEAD_FORM_SCROLL_OFFSET_PX = 96;

function focusLeadField(fieldKey: ImproveScoreItem['fieldKey']) {
    const id = LEAD_FIELD_IDS[fieldKey];
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - LEAD_FORM_SCROLL_OFFSET_PX;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    window.setTimeout(() => {
        const again = document.getElementById(id);
        if (again && 'focus' in again && typeof (again as HTMLElement & { focus: () => void }).focus === 'function') {
            (again as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).focus({ preventScroll: true });
        }
    }, 400);
}

export type LeadEnterpriseFormValues = {
    name: string;
    phone: string;
    email: string;
    source: LeadSource | '';
    project: string;
    budgetRange: string;
    preferredUnitType: PropertyType | '';
    status: LeadStatus | '';
    assignedTo: string;
    presentAddress: string;
    permanentAddress: string;
    notes: string;
};

const NAME_REGEX = /^[A-Za-z\s]+$/;
const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type FormErrors = Partial<Record<keyof LeadEnterpriseFormValues, string>>;

type FormMode = 'standard' | 'smartCreate';

/** First-invalid scroll + summary links: required fields in validation order. */
const REQUIRED_FIELD_KEYS: (keyof LeadEnterpriseFormValues)[] = [
    'name',
    'phone',
    'email',
    'source',
    'assignedTo',
    'project',
    'budgetRange',
    'preferredUnitType',
    'status',
];

const BASIC_SECTION_KEYS: (keyof LeadEnterpriseFormValues)[] = ['name', 'phone', 'email', 'source', 'assignedTo'];
const PROPERTY_SECTION_KEYS: (keyof LeadEnterpriseFormValues)[] = [
    'project',
    'budgetRange',
    'preferredUnitType',
    'status',
];

/** Scroll / summary link order: required fields first, then optional long-address caps. */
const VALIDATION_ERROR_ORDER: (keyof LeadEnterpriseFormValues)[] = [
    ...REQUIRED_FIELD_KEYS,
    'presentAddress',
    'permanentAddress',
];

const HUMAN_FIELD_LABEL: Record<keyof LeadEnterpriseFormValues, string> = {
    name: 'Lead Name',
    phone: 'Phone',
    email: 'Email',
    source: 'Lead Source',
    assignedTo: 'Assigned To',
    project: 'Project Interest',
    budgetRange: 'Budget Range',
    preferredUnitType: 'Preferred Unit Type',
    status: 'Lead Status',
    presentAddress: 'Present Address',
    permanentAddress: 'Permanent Address',
    notes: 'Notes',
};

export function LeadFormEnterprise({
    initialValues,
    onSubmit,
    onCancel,
    isSubmitting,
    leadSources,
    projects,
    preferredUnitTypeOptions = LEAD_PREFERRED_UNIT_TYPE_OPTIONS,
    assignedTos,
    submitLabel = 'Save',
    mode = 'standard',
    embedded = false,
}: {
    initialValues: LeadEnterpriseFormValues;
    onSubmit: (values: LeadEnterpriseFormValues) => Promise<void> | void;
    onCancel: () => void;
    isSubmitting?: boolean;
    leadSources: LeadSource[];
    projects: string[];
    preferredUnitTypeOptions?: PropertyType[];
    assignedTos: string[];
    submitLabel?: string;
    mode?: FormMode;
    /** No page header or width shell — use inside modals. */
    embedded?: boolean;
}) {
    const router = useRouter();
    const smart = mode === 'smartCreate';
    /** Modals: lighter stacked sections with explicit vertical rhythm. */
    const sectionLayout: 'card' | 'embed' = embedded && !smart ? 'embed' : 'card';
    const [values, setValues] = React.useState<LeadEnterpriseFormValues>(() => ({
        ...initialValues,
        phone: normalizeLeadPhoneDigits(initialValues.phone),
    }));
    const [errors, setErrors] = React.useState<FormErrors>({});
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [strategyFlip, setStrategyFlip] = React.useState(0);
    const [whatsappHint, setWhatsappHint] = React.useState<string | null>(null);
    const [draftUi, setDraftUi] = React.useState<{ state: 'idle' | 'saving' | 'saved'; at: string | null }>({
        state: 'idle',
        at: null,
    });
    const [showValidationSummary, setShowValidationSummary] = React.useState(false);
    const [cardSectionsOpen, setCardSectionsOpen] = React.useState({
        basic: true,
        property: true,
        additional: true,
    });
    const [validationFieldToast, setValidationFieldToast] = React.useState<string | null>(null);
    const [submitShakeKey, setSubmitShakeKey] = React.useState(0);
    const dismissValidationToast = React.useCallback(() => setValidationFieldToast(null), []);
    const initialSnapshotValue = React.useMemo(
        () => JSON.stringify({ ...initialValues, phone: normalizeLeadPhoneDigits(initialValues.phone) }),
        [initialValues],
    );
    const [initialSnapshot, setInitialSnapshot] = React.useState<string>(initialSnapshotValue);

    React.useEffect(() => {
        const normalized = { ...initialValues, phone: normalizeLeadPhoneDigits(initialValues.phone) };
        setValues(normalized);
        setErrors({});
        setShowValidationSummary(false);
        const next = JSON.stringify(normalized);
        setInitialSnapshot(next);
    }, [initialValues]);

    const isDirty = React.useMemo(() => {
        if (embedded) return false;
        return JSON.stringify(values) !== initialSnapshot;
    }, [values, embedded, initialSnapshot]);

    const quality = React.useMemo(() => computeLeadQualityScore(values), [values]);
    const progressPct = React.useMemo(() => computeFormProgressPercent(values), [values]);
    const aiBundle = React.useMemo(
        () => (strategyFlip % 2 === 0 ? defaultAiSuggestions(quality) : alternateAiSuggestions(quality)),
        [quality, strategyFlip],
    );
    const previewRo = React.useMemo(() => previewRiskOpportunity(quality), [quality]);
    const conversionChance = React.useMemo(
        () => computeMockConversionChance(quality, Boolean(values.budgetRange.trim())),
        [quality, values.budgetRange],
    );
    const riskTags = React.useMemo(() => quickRiskFlagTags(values, quality), [values, quality]);
    const scoreBreakdown = React.useMemo(() => computeScoreBreakdown(values), [values]);
    const improveChecklist = React.useMemo(() => computeImproveScoreChecklist(values), [values]);
    const siteVisitChance = React.useMemo(() => computeSiteVisitChance(values, quality), [values, quality]);
    const bookingChance = React.useMemo(() => computeBookingChance(values, quality, siteVisitChance), [values, quality, siteVisitChance]);

    /** Debounced autosave for create lead (standard or smart) — not in embedded edit modals. */
    React.useEffect(() => {
        if (embedded) return;
        setDraftUi((prev) => ({ ...prev, state: 'saving' }));
        const t = window.setTimeout(() => {
            try {
                window.localStorage.setItem(ARRIS_LEAD_CREATE_DRAFT_KEY, JSON.stringify(values));
                setDraftUi({
                    state: 'saved',
                    at: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
                });
            } catch {
                setDraftUi({ state: 'idle', at: null });
            }
        }, 700);
        return () => window.clearTimeout(t);
    }, [values, embedded]);

    const validateValues = (formValues: LeadEnterpriseFormValues): FormErrors => {
        const nextErrors: FormErrors = {};

        if (!formValues.name.trim()) {
            nextErrors.name = 'This field is required';
        } else if (!NAME_REGEX.test(formValues.name.trim())) {
            nextErrors.name = 'Lead name can contain letters and spaces only.';
        }

        if (!formValues.phone.trim()) {
            nextErrors.phone = 'This field is required';
        } else if (!PHONE_REGEX.test(formValues.phone.trim())) {
            nextErrors.phone = 'Enter a valid 10-digit mobile number';
        }

        if (!formValues.email.trim()) {
            nextErrors.email = 'This field is required';
        } else if (!EMAIL_REGEX.test(formValues.email.trim())) {
            nextErrors.email = 'Enter a valid email address';
        }

        if (!formValues.source) nextErrors.source = 'Please choose lead source';
        if (!formValues.project?.trim()) nextErrors.project = 'Please choose a project';
        if (!formValues.budgetRange.trim()) nextErrors.budgetRange = 'This field is required';
        else if (formValues.budgetRange.trim().length > 120) nextErrors.budgetRange = 'Use a shorter budget description.';
        if (!formValues.preferredUnitType) nextErrors.preferredUnitType = 'Please select preferred unit type';
        if (!formValues.status) nextErrors.status = 'Please select lead status';
        if (!formValues.assignedTo?.trim()) nextErrors.assignedTo = 'Please select owner';

        const addrMax = 500;
        if (formValues.presentAddress.trim().length > addrMax) {
            nextErrors.presentAddress = `Use at most ${addrMax} characters.`;
        }
        if (formValues.permanentAddress.trim().length > addrMax) {
            nextErrors.permanentAddress = `Use at most ${addrMax} characters.`;
        }

        return nextErrors;
    };

    const sanitizeInputValue = (name: string, value: string) => {
        if (name === 'name') {
            return value.replace(/[^A-Za-z\s]/g, '');
        }
        if (name === 'phone') {
            return value.replace(/\D/g, '').slice(0, 10);
        }
        if (name === 'presentAddress' || name === 'permanentAddress') {
            return value.slice(0, 500);
        }
        return value;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const sanitizedValue = sanitizeInputValue(name, value);
        setValues((prev) => ({ ...prev, [name]: sanitizedValue } as LeadEnterpriseFormValues));
        setErrors((prev) => {
            if (!prev[name as keyof LeadEnterpriseFormValues]) return prev;
            const next = { ...prev };
            delete next[name as keyof LeadEnterpriseFormValues];
            return next;
        });
    };

    const phoneInsightOk = values.phone.length === 10 && PHONE_REGEX.test(values.phone) && !errors.phone;
    const emailFormatOk = values.email.trim().length > 0 && EMAIL_REGEX.test(values.email.trim()) && !errors.email;
    const emailCorporateInsight = emailFormatOk && isLikelyCorporateEmail(values.email);

    const popularProjects = projects.slice(0, 2);

    const budgetQuickChips = ['₹50L – ₹80L', '₹80L – ₹1.2Cr', '₹1.2Cr – ₹2Cr', '₹2Cr+'] as const;

    const duplicateWarning = React.useMemo(() => {
        if (!smart) return null;
        const p = values.phone.trim();
        const em = values.email.trim().toLowerCase();
        if (p.length !== 10 && em.length < 3) return null;
        const leads = getLeads();
        const match = leads.find((l) => {
            const lp = normalizeLeadPhoneDigits(l.phone);
            return (p.length === 10 && lp === p) || (em.length > 0 && l.email.trim().toLowerCase() === em);
        });
        if (!match) return null;
        return `Possible duplicate: ${match.name} (${match.phone}) — review before creating.`;
    }, [smart, values.phone, values.email]);

    const saveDraftNow = React.useCallback(() => {
        if (embedded) return;
        setDraftUi((prev) => ({ ...prev, state: 'saving' }));
        try {
            window.localStorage.setItem(ARRIS_LEAD_CREATE_DRAFT_KEY, JSON.stringify(values));
            setDraftUi({
                state: 'saved',
                at: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
            });
        } catch {
            setDraftUi({ state: 'idle', at: null });
        }
    }, [embedded, values]);

    React.useEffect(() => {
        if (Object.keys(errors).length === 0) {
            setShowValidationSummary(false);
            setValidationFieldToast(null);
        }
    }, [errors]);

    React.useEffect(() => {
        if (embedded || !isDirty) return;
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [embedded, isDirty]);

    const nameOk = Boolean(values.name.trim() && NAME_REGEX.test(values.name.trim()) && !errors.name);
    const phoneOk = Boolean(!errors.phone && values.phone.length === 10 && PHONE_REGEX.test(values.phone));
    const emailOk = Boolean(!errors.email && values.email.trim() && EMAIL_REGEX.test(values.email.trim()));
    const sourceOk = Boolean(values.source && !errors.source);
    const assignedOk = Boolean(values.assignedTo?.trim() && !errors.assignedTo);
    const projectOk = Boolean(values.project?.trim() && !errors.project);
    const budgetOk = Boolean(values.budgetRange.trim() && !errors.budgetRange);
    const unitOk = Boolean(values.preferredUnitType && !errors.preferredUnitType);
    const statusOk = Boolean(values.status && !errors.status);

    const presentFieldOk = smart && !errors.presentAddress && values.presentAddress.trim().length > 0;
    const permFieldOk = smart && !errors.permanentAddress && values.permanentAddress.trim().length > 0;
    const notesFieldOk = smart && values.notes.trim().length > 0;

    const scrollToFieldKey = React.useCallback((fieldKey: keyof typeof LEAD_FIELD_IDS) => {
        if (BASIC_SECTION_KEYS.includes(fieldKey)) {
            setCardSectionsOpen((s) => ({ ...s, basic: true }));
        }
        if (PROPERTY_SECTION_KEYS.includes(fieldKey)) {
            setCardSectionsOpen((s) => ({ ...s, property: true }));
        }
        if (fieldKey === 'presentAddress' || fieldKey === 'permanentAddress' || fieldKey === 'notes') {
            setCardSectionsOpen((s) => ({ ...s, additional: true }));
        }
        window.requestAnimationFrame(() => {
            focusLeadField(fieldKey as ImproveScoreItem['fieldKey']);
        });
    }, []);

    const runSubmit = () => {
        if (isSubmitting) return;
        const nextErrors = validateValues(values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setShowValidationSummary(true);
            const n = Object.keys(nextErrors).length;
            setValidationFieldToast(`Please complete ${n} required field${n === 1 ? '' : 's'}`);
            setSubmitShakeKey((k) => k + 1);
            setCardSectionsOpen((s) => ({
                ...s,
                basic: BASIC_SECTION_KEYS.some((k) => nextErrors[k]) ? true : s.basic,
                property: PROPERTY_SECTION_KEYS.some((k) => nextErrors[k]) ? true : s.property,
                additional: nextErrors.presentAddress || nextErrors.permanentAddress ? true : s.additional,
            }));
            const firstKey = VALIDATION_ERROR_ORDER.find((k) => Boolean(nextErrors[k]));
            if (firstKey) {
                window.requestAnimationFrame(() => {
                    focusLeadField(firstKey as ImproveScoreItem['fieldKey']);
                });
            }
            return;
        }
        setShowValidationSummary(false);
        if (smart) {
            setPreviewOpen(true);
            return;
        }
        void onSubmit(values);
    };

    const confirmCreate = () => {
        void Promise.resolve(onSubmit(values)).then(() => setPreviewOpen(false));
    };

    const qualityBarColor =
        quality.band === 'high' ? 'bg-emerald-500' : quality.band === 'medium' ? 'bg-amber-500' : 'bg-rose-500';
    const qualityTextColor =
        quality.band === 'high' ? 'text-emerald-800' : quality.band === 'medium' ? 'text-amber-900' : 'text-rose-800';
    const qualityBg =
        quality.band === 'high'
            ? 'bg-emerald-50/90 border-emerald-200/80'
            : quality.band === 'medium'
              ? 'bg-amber-50/90 border-amber-200/80'
              : 'bg-rose-50/90 border-rose-200/80';
    const bandShort = quality.band === 'high' ? 'High' : quality.band === 'medium' ? 'Medium' : 'Low';
    const bandBadgeClass =
        quality.band === 'high'
            ? 'bg-emerald-600/15 text-emerald-900 ring-emerald-300/80'
            : quality.band === 'medium'
              ? 'bg-amber-500/15 text-amber-950 ring-amber-300/80'
              : 'bg-rose-600/12 text-rose-900 ring-rose-300/70';

    const fieldGap = embedded
        ? 'gap-x-4 gap-y-5 sm:gap-x-5 sm:gap-y-5'
        : 'gap-x-6 gap-y-6 md:gap-y-7';
    const chipBase =
        'rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-800 shadow-sm transition-colors duration-200 hover:border-blue-300 hover:bg-sky-50/80';
    const chipSelected = 'border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:text-white';
    const fid = (k: keyof typeof LEAD_FIELD_IDS) => LEAD_FIELD_IDS[k];
    const basicSectionErrorCount = BASIC_SECTION_KEYS.filter((k) => errors[k]).length;
    const propertySectionErrorCount = PROPERTY_SECTION_KEYS.filter((k) => errors[k]).length;
    const summaryLinkKeys = showValidationSummary
        ? VALIDATION_ERROR_ORDER.filter((k) => errors[k])
        : [];

    const validationSummaryEl =
        showValidationSummary && summaryLinkKeys.length > 0 ? (
            <div
                id="lead-create-validation-summary"
                className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3.5 text-sm text-amber-950 shadow-sm"
                role="alert"
            >
                <p className="flex flex-wrap items-center gap-2 font-semibold leading-snug text-amber-950">
                    <span aria-hidden>⚠</span>
                    <span>Please complete required details before creating lead.</span>
                </p>
                <p className="mt-2 text-[13px] font-medium text-amber-900/95">
                    {summaryLinkKeys.map((k, i) => (
                        <React.Fragment key={k}>
                            {i > 0 ? <span className="mx-1 text-amber-800/40">·</span> : null}
                            <button
                                type="button"
                                className="rounded font-semibold text-blue-600 underline decoration-blue-500/30 underline-offset-2 transition hover:text-blue-800"
                                onClick={() => scrollToFieldKey(k)}
                            >
                                {HUMAN_FIELD_LABEL[k]}
                            </button>
                        </React.Fragment>
                    ))}
                </p>
            </div>
        ) : null;

    const basicInfoFields = (
        <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
            <div>
                <InputField
                    label="Lead name"
                    required
                    name="name"
                    id={fid('name')}
                    value={values.name}
                    onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
                    placeholder="As it should appear in CRM and contracts"
                    maxLength={100}
                    autoComplete="name"
                    error={errors.name}
                    success={smart && nameOk}
                    startIcon={<LuUser aria-hidden />}
                />
                {smart && !values.name.trim() && !errors.name ? (
                    <p className="mt-2 text-xs font-medium text-gray-500">Name unlocks routing and improves lead quality.</p>
                ) : null}
            </div>

            <div>
                <InputField
                    label="Phone"
                    required
                    name="phone"
                    id={fid('phone')}
                    value={values.phone}
                    onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
                    type="tel"
                    placeholder="10 digits, no country code"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    error={errors.phone}
                    success={smart && phoneOk}
                    startIcon={<LuPhone aria-hidden />}
                />
                {smart && phoneInsightOk ? (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                        Verified
                    </span>
                ) : null}
            </div>

            <div>
                <InputField
                    label="Email"
                    required
                    name="email"
                    id={fid('email')}
                    value={values.email}
                    onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
                    type="email"
                    placeholder="name@domain.com"
                    autoComplete="email"
                    maxLength={150}
                    error={errors.email}
                    success={smart && emailOk}
                    startIcon={<LuMail aria-hidden />}
                />
                {smart && emailFormatOk && (
                    <span
                        className={cn(
                            'mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                            emailCorporateInsight
                                ? 'border-sky-200/80 bg-sky-50 text-sky-900'
                                : 'border-emerald-200/80 bg-emerald-50 text-emerald-900',
                        )}
                    >
                        {emailCorporateInsight ? 'Corporate domain' : 'Format OK'}
                    </span>
                )}
            </div>

            <div>
                <SelectField
                    label="Lead source"
                    required
                    name="source"
                    id={fid('source')}
                    value={values.source || ''}
                    onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                    options={leadSources}
                    placeholder="How they found you"
                    error={errors.source}
                    success={smart && sourceOk}
                    startIcon={<LuTag aria-hidden />}
                />
                {smart && values.source ? (
                    <span className="mt-2 inline-flex rounded-full border border-gray-200 bg-slate-50/90 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                        {sourceConversionShortTag(values.source as LeadSource)}
                    </span>
                ) : null}
            </div>

            <SelectField
                label="Assigned to"
                required
                name="assignedTo"
                id={fid('assignedTo')}
                value={values.assignedTo || ''}
                onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                options={assignedTos}
                placeholder="Select owner"
                error={errors.assignedTo}
                success={smart && assignedOk}
                startIcon={<LuUserRound aria-hidden />}
            />
        </div>
    );

    const propertyInterestFields = (
        <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
            <div>
                <SelectField
                    label="Project interest"
                    required
                    name="project"
                    id={fid('project')}
                    value={values.project || ''}
                    onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                    options={projects}
                    placeholder="Select project"
                    error={errors.project}
                    success={smart && projectOk}
                    startIcon={<LuBuilding2 aria-hidden />}
                />
                {smart && popularProjects.length > 0 ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Popular</span>
                        {popularProjects.map((p) => (
                            <span
                                key={p}
                                className="inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-950"
                            >
                                {p}
                            </span>
                        ))}
                    </div>
                ) : null}
            </div>

            <div>
                <InputField
                    label="Budget range"
                    required
                    name="budgetRange"
                    id={fid('budgetRange')}
                    value={values.budgetRange || ''}
                    onChange={handleChange as React.ChangeEventHandler<HTMLInputElement>}
                    placeholder="e.g. ₹80L – ₹1.2Cr"
                    maxLength={120}
                    error={errors.budgetRange}
                    success={smart && budgetOk}
                    startIcon={<LuIndianRupee aria-hidden />}
                />
                {smart ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {budgetQuickChips.map((chip) => {
                            const selected = values.budgetRange === chip;
                            return (
                                <button
                                    key={chip}
                                    type="button"
                                    className={cn(chipBase, selected && chipSelected)}
                                    onClick={() => {
                                        setValues((v) => ({ ...v, budgetRange: chip }));
                                        setErrors((e) => {
                                            const n = { ...e };
                                            delete n.budgetRange;
                                            return n;
                                        });
                                    }}
                                >
                                    {chip}
                                </button>
                            );
                        })}
                    </div>
                ) : null}
                {smart ? (
                    <span className="mt-2 inline-flex rounded-full border border-gray-200 bg-slate-50/90 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                        {budgetShortTag()}
                    </span>
                ) : null}
            </div>

            <SelectField
                label="Preferred unit type"
                required
                name="preferredUnitType"
                id={fid('preferredUnitType')}
                value={values.preferredUnitType || ''}
                onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                options={preferredUnitTypeOptions}
                placeholder="Configuration (e.g. 2 BHK)"
                error={errors.preferredUnitType}
                success={smart && unitOk}
                startIcon={<LuLayoutGrid aria-hidden />}
            />

            <SelectField
                label="Lead status"
                required
                name="status"
                id={fid('status')}
                value={values.status || ''}
                onChange={handleChange as React.ChangeEventHandler<HTMLSelectElement>}
                options={['New', 'Qualified', 'Lost']}
                placeholder="Pipeline stage"
                error={errors.status}
                success={smart && statusOk}
                startIcon={<LuListChecks aria-hidden />}
            />
        </div>
    );

    const additionalInfoFields = (
        <div className={cn('grid grid-cols-1 md:grid-cols-2', fieldGap)}>
            <div className="md:col-span-2">
                <TextAreaField
                    label="Present address"
                    name="presentAddress"
                    id={fid('presentAddress')}
                    value={values.presentAddress}
                    onChange={handleChange as React.ChangeEventHandler<HTMLTextAreaElement>}
                    rows={2}
                    maxLength={500}
                    placeholder="Street, area, city, state, PIN"
                    error={errors.presentAddress}
                    className="md:col-span-2"
                    success={presentFieldOk}
                    startIcon={<LuMapPin aria-hidden />}
                    textareaClassName="!min-h-[76px] max-h-48 py-2.5 leading-snug"
                />
            </div>

            <TextAreaField
                label="Permanent address"
                name="permanentAddress"
                id={fid('permanentAddress')}
                value={values.permanentAddress}
                onChange={handleChange as React.ChangeEventHandler<HTMLTextAreaElement>}
                rows={2}
                maxLength={500}
                placeholder="If different from present — full address and PIN"
                error={errors.permanentAddress}
                className="md:col-span-2"
                success={permFieldOk}
                startIcon={<LuHouse aria-hidden />}
                textareaClassName="!min-h-[76px] max-h-48 py-2.5 leading-snug"
            />

            <div className="md:col-span-2 space-y-3">
                <TextAreaField
                    label="Notes"
                    name="notes"
                    id={fid('notes')}
                    value={values.notes}
                    onChange={handleChange as React.ChangeEventHandler<HTMLTextAreaElement>}
                    rows={smart ? 6 : 5}
                    placeholder="Intent, timeline, must-haves, best time to reach…"
                    success={notesFieldOk}
                    startIcon={<LuStickyNote aria-hidden />}
                />
                {smart && !values.notes.trim() ? (
                    <p className="text-xs font-medium text-gray-500">A short line on intent improves handoff to sales.</p>
                ) : null}
                {smart ? (
                    <Button
                        type="button"
                        variant="companyOutline"
                        size="sm"
                        className="h-10 gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-blue-300 hover:bg-sky-50/60"
                        onClick={() => setValues((v) => ({ ...v, notes: buildGeneratedNotesPreview(v) }))}
                    >
                        <LuSparkles size={16} aria-hidden className="text-blue-600" />
                        Generate notes
                    </Button>
                ) : null}
            </div>
        </div>
    );

    const formInner = !smart ? (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                runSubmit();
            }}
            className={cn(embedded ? 'space-y-5' : 'space-y-6')}
        >
            {validationSummaryEl}
            <FormCollapsibleSection
                layout={sectionLayout}
                title="Basic information"
                icon={LuUser}
                tone="blue"
                open={cardSectionsOpen.basic}
                onOpenChange={(o) => setCardSectionsOpen((s) => ({ ...s, basic: o }))}
                headerRight={
                    basicSectionErrorCount > 0 ? (
                        <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                            {basicSectionErrorCount} field{basicSectionErrorCount === 1 ? '' : 's'} required
                        </span>
                    ) : null
                }
            >
                {basicInfoFields}
            </FormCollapsibleSection>
            <FormCollapsibleSection
                layout="card"
                title="Property interest"
                icon={LuBuilding2}
                tone="amber"
                open={cardSectionsOpen.property}
                onOpenChange={(o) => setCardSectionsOpen((s) => ({ ...s, property: o }))}
                headerRight={
                    propertySectionErrorCount > 0 ? (
                        <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                            {propertySectionErrorCount} field{propertySectionErrorCount === 1 ? '' : 's'} required
                        </span>
                    ) : null
                }
            >
                {propertyInterestFields}
            </FormCollapsibleSection>
            <FormCollapsibleSection
                layout={sectionLayout}
                title="Additional information"
                icon={LuFileText}
                tone="slate"
                open={cardSectionsOpen.additional}
                onOpenChange={(o) => setCardSectionsOpen((s) => ({ ...s, additional: o }))}
            >
                {additionalInfoFields}
            </FormCollapsibleSection>

            {!embedded ? (
                <div className="space-y-3 border-t border-gray-200 pt-6">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="min-h-5 text-xs text-gray-500">
                            {draftUi.state === 'saving' ? (
                                'Saving draft…'
                            ) : draftUi.state === 'saved' && draftUi.at ? (
                                <>
                                    Draft saved <span className="tabular-nums text-gray-700">{draftUi.at}</span> · stored in
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
                            onClick={saveDraftNow}
                            disabled={isSubmitting}
                            className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm hover:border-blue-300/80"
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
                                'h-12 min-w-44 rounded-xl font-semibold shadow-md shadow-blue-600/20',
                                submitShakeKey > 0 && 'animate-lead-form-shake',
                            )}
                        >
                            {isSubmitting
                                ? submitLabel === 'Create lead'
                                    ? 'Creating...'
                                    : 'Saving…'
                                : submitLabel}
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    className={cn(
                        'flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end',
                        embedded
                            ? 'border-t border-slate-200/90 bg-slate-50/50 pt-5 sm:rounded-b-xl sm:pt-6'
                            : 'border-t border-gray-200 pt-6',
                    )}
                >
                    <Button
                        type="button"
                        variant="companyOutline"
                        size="cta"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="h-12 min-w-28 rounded-xl border border-gray-200 font-semibold text-gray-800"
                    >
                        Cancel
                    </Button>
                    <Button
                        key={submitShakeKey}
                        type="submit"
                        variant="company"
                        size="cta"
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                        className={cn(
                            'h-12 min-w-44 rounded-xl font-semibold shadow-md shadow-blue-600/20',
                            submitShakeKey > 0 && 'animate-lead-form-shake',
                        )}
                    >
                        {isSubmitting
                            ? submitLabel === 'Create lead'
                                ? 'Creating...'
                                : 'Saving…'
                            : submitLabel}
                    </Button>
                </div>
            )}
        </form>
    ) : (
        <form
            id={LEAD_CREATE_FORM_ID}
            onSubmit={(e) => {
                e.preventDefault();
                runSubmit();
            }}
            className="space-y-8"
        >
            {validationSummaryEl}
            {duplicateWarning ? (
                <div
                    className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3.5 text-sm text-amber-950 shadow-sm"
                    role="status"
                >
                    <p className="font-semibold text-amber-900">Duplicate check</p>
                    <p className="mt-1 text-amber-900/90">{duplicateWarning}</p>
                </div>
            ) : null}

            <FormCollapsibleSection
                layout="card"
                title="Basic information"
                icon={LuUser}
                tone="blue"
                open={cardSectionsOpen.basic}
                onOpenChange={(o) => setCardSectionsOpen((s) => ({ ...s, basic: o }))}
                headerRight={
                    basicSectionErrorCount > 0 ? (
                        <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                            {basicSectionErrorCount} field{basicSectionErrorCount === 1 ? '' : 's'} required
                        </span>
                    ) : null
                }
            >
                {basicInfoFields}
            </FormCollapsibleSection>

            <FormCollapsibleSection
                layout="card"
                title="Property interest"
                icon={LuBuilding2}
                tone="amber"
                open={cardSectionsOpen.property}
                onOpenChange={(o) => setCardSectionsOpen((s) => ({ ...s, property: o }))}
                headerRight={
                    propertySectionErrorCount > 0 ? (
                        <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                            {propertySectionErrorCount} field{propertySectionErrorCount === 1 ? '' : 's'} required
                        </span>
                    ) : null
                }
            >
                {propertyInterestFields}
            </FormCollapsibleSection>

            <FormCollapsibleSection
                layout="card"
                title="Additional information"
                icon={LuFileText}
                tone="slate"
                open={cardSectionsOpen.additional}
                onOpenChange={(o) => setCardSectionsOpen((s) => ({ ...s, additional: o }))}
            >
                {additionalInfoFields}
            </FormCollapsibleSection>
        </form>
    );

    const stickyRail = smart ? (
        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:max-w-none">
            <div className={cn('rounded-2xl border border-gray-200 bg-white p-5 shadow-sm', qualityBg)}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lead quality score</p>
                <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    <p className={cn('text-3xl font-bold tabular-nums leading-none tracking-tight', qualityTextColor)}>{quality.percent}%</p>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide', bandBadgeClass)}>
                        {bandShort}
                    </span>
                </div>
                <p className={cn('mt-1 text-sm font-medium', qualityTextColor)}>{quality.label}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-gray-200/50">
                    <div className={cn('h-full rounded-full transition-all duration-300', qualityBarColor)} style={{ width: `${quality.percent}%` }} />
                </div>
                <ul className="mt-4 space-y-1.5 border-t border-gray-200/60 pt-4">
                    {scoreBreakdown.map((row) => (
                        <li key={row.label} className="flex items-start justify-between gap-2 text-xs leading-tight text-gray-800">
                            <span className="min-w-0 font-medium text-gray-700">
                                <span aria-hidden className="mr-0.5">
                                    {row.ok ? '✔' : '⚠'}
                                </span>
                                {row.label}
                            </span>
                            <span className="shrink-0 tabular-nums text-gray-500">
                                {row.earned}/{row.cap}
                            </span>
                        </li>
                    ))}
                </ul>
                <div className="mt-4 border-t border-gray-200/60 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Improve score</p>
                    {improveChecklist.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                            {improveChecklist.map((it) => (
                                <li key={`${it.fieldKey}-${it.label}`}>
                                    <button
                                        type="button"
                                        onClick={() => focusLeadField(it.fieldKey)}
                                        className="flex w-full items-start justify-between gap-2 rounded-lg py-1.5 text-left text-xs text-gray-800 transition hover:bg-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30"
                                    >
                                        <span className="min-w-0 font-semibold">{it.label}</span>
                                        <span className="shrink-0 font-bold tabular-nums text-violet-700">+{it.impactPercent}%</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-xs font-medium text-emerald-800">No critical gaps for this score</p>
                    )}
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-linear-to-br from-sky-50/80 to-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Predictions</p>
                <dl className="mt-3 space-y-2.5 text-sm text-gray-800">
                    <div className="flex justify-between gap-2">
                        <dt className="text-gray-500">Site visit</dt>
                        <dd className="font-bold tabular-nums text-gray-900">{siteVisitChance}%</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                        <dt className="text-gray-500">Booking</dt>
                        <dd className="font-bold tabular-nums text-gray-900">{bookingChance}%</dd>
                    </div>
                    <div className="flex justify-between gap-2 border-t border-gray-200/80 pt-2.5">
                        <dt className="text-gray-500">Qualification win</dt>
                        <dd className="font-bold tabular-nums text-gray-900">{conversionChance}%</dd>
                    </div>
                </dl>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-linear-to-br from-violet-50/70 to-sky-50/40 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">AI suggestions</p>
                    <Button
                        type="button"
                        variant="companyOutline"
                        size="sm"
                        className="h-8 rounded-full border border-violet-200/90 bg-white/90 px-3 text-xs font-semibold text-violet-900 shadow-sm"
                        onClick={() => setStrategyFlip((x) => x + 1)}
                    >
                        Strategy
                    </Button>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-gray-700">
                    <li>
                        <span className="font-semibold text-gray-900">Follow-up:</span> {aiBundle.followUp}
                    </li>
                    <li>
                        <span className="font-semibold text-gray-900">Approach:</span> {aiBundle.approach}
                    </li>
                    <li className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">Priority:</span>
                        <span
                            className={cn(
                                'rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                                aiBundle.priority === 'High' && 'border-rose-200/80 bg-rose-50 text-rose-800',
                                aiBundle.priority === 'Medium' && 'border-amber-200/80 bg-amber-50 text-amber-900',
                                aiBundle.priority === 'Low' && 'border-gray-200/80 bg-gray-100 text-gray-700',
                            )}
                        >
                            {aiBundle.priority}
                        </span>
                    </li>
                </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-slate-50/80 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quick insights</p>
                <dl className="mt-3 space-y-2.5 text-sm text-gray-700">
                    <div>
                        <dt className="text-gray-500">Closing window</dt>
                        <dd className="mt-0.5 font-medium text-gray-900">{aiBundle.followUp}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">Risk flags</dt>
                        <dd className="mt-1.5 flex flex-wrap gap-1.5">
                            {riskTags.map((t) => (
                                <span
                                    key={t}
                                    className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-800"
                                >
                                    {t}
                                </span>
                            ))}
                        </dd>
                    </div>
                </dl>
            </div>
        </aside>
    ) : null;

    const smartFooter = smart ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 sm:px-6 sm:pb-5">
            <div className="pointer-events-auto flex w-full max-w-7xl flex-col gap-4 border-t border-gray-200/90 bg-white/90 px-4 py-3.5 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.08)] backdrop-blur-md supports-backdrop-filter:bg-white/85 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:rounded-t-2xl sm:px-5 sm:py-3.5">
                <div className="flex min-w-0 flex-1 flex-wrap items-stretch gap-4 sm:gap-8">
                    <div className="min-w-28">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Completion</p>
                        <p className="mt-0.5 text-2xl font-bold tabular-nums text-gray-900">{progressPct}%</p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200/90">
                            <div
                                className="h-full rounded-full bg-blue-600"
                                style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                            />
                        </div>
                    </div>
                    <div className="hidden h-12 w-px shrink-0 self-center bg-gray-200 sm:block" aria-hidden />
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Draft</p>
                        {draftUi.state === 'saving' ? (
                            <p className="mt-0.5 text-sm font-medium text-amber-700">Saving…</p>
                        ) : draftUi.state === 'saved' && draftUi.at ? (
                            <p className="mt-0.5 text-sm font-medium text-gray-700">
                                Saved <span className="tabular-nums text-gray-900">{draftUi.at}</span>
                            </p>
                        ) : (
                            <p className="mt-0.5 text-sm text-gray-400">Not saved yet</p>
                        )}
                        <p className="mt-0.5 text-xs text-gray-500">Autosave in this browser</p>
                    </div>
                    <div className={cn('self-start rounded-xl border px-3 py-2 shadow-sm sm:self-center', qualityBg)}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Quality score</p>
                        <div className="mt-0.5 flex items-baseline gap-1.5">
                            <p className={cn('text-xl font-bold tabular-nums', qualityTextColor)}>{quality.percent}%</p>
                            <span className={cn('text-xs font-bold uppercase', qualityTextColor)}>{bandShort}</span>
                        </div>
                    </div>
                </div>

                <div className="flex w-full min-w-0 flex-col gap-2 border-t border-gray-100 pt-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-2 sm:border-0 sm:pt-0">
                    {isDirty ? <span className="text-center text-xs font-medium text-amber-800 sm:mr-1 sm:text-left">Unsaved changes</span> : null}
                    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                        <Button
                            type="button"
                            variant="companyGhost"
                            size="cta"
                            className="h-12 rounded-xl px-4 text-sm font-medium text-gray-600"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="cta"
                            className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm hover:border-blue-300/90"
                            onClick={saveDraftNow}
                            disabled={isSubmitting}
                        >
                            Save draft
                        </Button>
                        <Button
                            key={submitShakeKey}
                            type="submit"
                            form={LEAD_CREATE_FORM_ID}
                            variant="company"
                            size="cta"
                            disabled={isSubmitting}
                            isLoading={isSubmitting}
                            className={cn(
                                'h-12 min-w-44 rounded-xl px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30',
                                submitShakeKey > 0 && 'animate-lead-form-shake',
                            )}
                        >
                            {isSubmitting
                                ? submitLabel === 'Create lead'
                                    ? 'Creating...'
                                    : 'Saving…'
                                : submitLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    ) : null;

    const validationToastEl =
        validationFieldToast ? (
            <InlineToast
                message={validationFieldToast}
                variant="error"
                onDismiss={dismissValidationToast}
            />
        ) : null;

    if (!smart) {
        if (embedded) {
            return (
                <CrmFieldProvider>
                    <>
                        {formInner}
                        {validationToastEl}
                    </>
                </CrmFieldProvider>
            );
        }
        return (
            <CrmFieldProvider>
                <>
                {validationToastEl}
                <div className="mb-4">
                            <Breadcrumb
                                items={[
                                    { label: 'Leads', href: '/leads' },
                                    { label: 'Create lead' },
                                ]}
                            />
                        </div>
                    <header className="mb-3 border-b border-gray-200/80 bg-white px-4 rounded-xl py-3 lg:px-6 max-w-4xl mx-auto">
                        
                        <div className="flex flex-row items-start justify-between gap-3 sm:gap-4 ">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Create Lead</h1>
                            <button
                                type="button"
                                onClick={() => router.push('/leads')}
                                className="inline-flex shrink-0 items-center border border-blue-500/10 bg-blue-50/90 px-2 py-1 rounded-md pt-1 text-sm font-semibold text-blue-600 transition hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35"
                            >
                                <LuArrowLeft className="h-4 w-4" aria-hidden />
                                Back to Leads
                            </button>
                        </div>
                    </header>
                    <div className="mx-auto w-full max-w-4xl pb-8">{formInner}</div>
                </>
            </CrmFieldProvider>
        );
    }

    return (
        <CrmFieldProvider>
            <>
            {validationToastEl}
            {whatsappHint ? (
                <p className="mb-3 rounded-xl border border-gray-200 bg-slate-50/90 px-3 py-2.5 text-xs font-medium text-gray-600">
                    {whatsappHint}
                </p>
            ) : null}

            <header className="mb-8 -mx-4 border-b border-gray-200/80 bg-white px-4 pb-6 pt-0 lg:-mx-6 lg:px-6">
                <div className="mb-4">
                    <Breadcrumb
                        items={[
                            { label: 'Leads', href: '/leads' },
                            { label: 'Create lead' },
                        ]}
                    />
                </div>
                <div className="min-w-0">
                    <div className="flex flex-row items-start justify-between gap-3 sm:gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create Lead</h1>
                         
                        </div>
                        <button
                            type="button"
                            onClick={() => router.push('/leads')}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-md pt-1 text-sm font-semibold text-blue-600 transition hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35"
                        >
                            <LuArrowLeft className="h-4 w-4" aria-hidden />
                            Back to Leads
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 items-start gap-10 pb-32 lg:grid-cols-10">
                <div className="min-w-0 lg:col-span-7">{formInner}</div>
                <div className="min-w-0 lg:col-span-3">{stickyRail}</div>
            </div>

            {smartFooter}

            <Modal
                isOpen={previewOpen}
                onClose={() => !isSubmitting && setPreviewOpen(false)}
                title="Review & create lead"
                maxWidthClassName="max-w-md"
                footer={
                    <>
                        <Button
                            type="button"
                            variant="companyOutline"
                            size="cta"
                            className="h-12 rounded-xl border-gray-200 font-semibold"
                            disabled={isSubmitting}
                            onClick={() => setPreviewOpen(false)}
                        >
                            Edit
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            className="h-12 min-w-44 rounded-xl font-semibold shadow-lg shadow-blue-600/25"
                            disabled={isSubmitting}
                            onClick={confirmCreate}
                        >
                            {isSubmitting ? 'Creating…' : 'Confirm & create'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 text-sm text-slate-700">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                        <p className="text-xs font-bold uppercase text-slate-400">Summary</p>
                        <ul className="mt-2 space-y-1.5">
                            <li>
                                <span className="text-slate-500">Name:</span>{' '}
                                <span className="font-semibold text-slate-900">{values.name || '—'}</span>
                            </li>
                            <li>
                                <span className="text-slate-500">Project:</span>{' '}
                                <span className="font-medium">{values.project || '—'}</span>
                            </li>
                            <li>
                                <span className="text-slate-500">Budget:</span>{' '}
                                <span className="font-medium">{values.budgetRange || '—'}</span>
                            </li>
                            <li>
                                <span className="text-slate-500">Source:</span> {values.source}
                            </li>
                        </ul>
                    </div>
                    <div className={cn('rounded-xl border p-3', qualityBg)}>
                        <p className="text-xs font-bold uppercase text-slate-500">AI score</p>
                        <p className={cn('mt-1 text-xl font-black', qualityTextColor)}>
                            {quality.percent}% · {quality.label}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-white p-3">
                        <p className="text-xs font-bold uppercase text-slate-400">Risk &amp; opportunity</p>
                        <p className="mt-2 text-slate-700">
                            <span className="font-semibold text-rose-700">Risk:</span> {previewRo.risk}
                        </p>
                        <p className="mt-1 text-slate-700">
                            <span className="font-semibold text-emerald-700">Opportunity:</span> {previewRo.opportunity}
                        </p>
                    </div>
                </div>
            </Modal>
            </>
        </CrmFieldProvider>
    );
}
