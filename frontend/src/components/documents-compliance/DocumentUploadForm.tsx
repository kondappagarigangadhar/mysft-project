'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { FormCollapsibleSection } from '@/components/forms/FormCollapsibleSection';
import { CrmFieldProvider, InputField, SelectField } from '@/components/forms/Fields';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { DocumentFormStickyStatusFooter } from '@/components/documents-compliance/DocumentFormStickyStatusFooter';
import { cn } from '@/lib/utils';
import { CTA_LINK_UNDERLINE, CTA_SELECTABLE_PILL_ACTIVE } from '@/lib/theme/ctaThemeClasses';
import {
    DOCUMENT_CATEGORY_OPTIONS,
    DOCUMENT_TYPE_OPTIONS,
    addDocument,
    formatComplianceFileSize,
    getBookingLookupOptions,
    getCustomerLookupOptions,
    getProjectLookupOptions,
    type AccessLevel,
} from '@/lib/complianceDocumentsMockStore';
import { COMPLIANCE_ROLE_LABELS, type ComplianceDemoRole } from '@/lib/complianceRbac';
import { DOCUMENT_FORM_FIELD_IDS, focusDocumentFormField, uploadFormStatusLabel } from '@/lib/documentComplianceFormUi';
import {
    clearDocumentUploadDraft,
    loadDocumentUploadDraft,
    type DocumentUploadDraftV1,
    saveDocumentUploadDraftToStorage,
} from '@/lib/documentUploadDraftStorage';
import {
    LuCalendar,
    LuFileText,
    LuLink2,
    LuScale,
    LuShield,
    LuTag,
    LuTrash2,
    LuUpload,
    LuUser,
} from 'react-icons/lu';

const MAX_BYTES = 100 * 1024 * 1024;
const ACCEPT = 'application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png';
const DOC_UPLOAD_FORM_ID = 'document-compliance-upload-form';

const ACCESS_OPTIONS: { value: AccessLevel; label: string }[] = [
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' },
    { value: 'restricted', label: 'Restricted' },
];

const ROLE_OPTIONS: ComplianceDemoRole[] = ['super_admin', 'company_admin', 'staff', 'viewer'];

const VALIDATION_ORDER = ['name', 'documentType', 'categories', 'file', 'allowedRoles'] as const;
type UploadErrKey = (typeof VALIDATION_ORDER)[number];

const SCROLL_FOR: Record<UploadErrKey, string> = {
    name: DOCUMENT_FORM_FIELD_IDS.name,
    documentType: DOCUMENT_FORM_FIELD_IDS.type,
    categories: DOCUMENT_FORM_FIELD_IDS.categories,
    file: DOCUMENT_FORM_FIELD_IDS.file,
    allowedRoles: DOCUMENT_FORM_FIELD_IDS.roles,
};

const HUMAN: Record<UploadErrKey, string> = {
    name: 'Document name',
    documentType: 'Document type',
    categories: 'Categories',
    file: 'File',
    allowedRoles: 'Allowed roles',
};

export function DocumentUploadForm({
    open,
    onCancel,
    onSuccess,
    uploadedBy,
    userRole,
    /** When set, form restores from and can save to this localStorage key (new upload page). */
    draftStorageKey,
}: {
    open: boolean;
    onCancel: () => void;
    onSuccess?: (createdId?: string) => void;
    uploadedBy: string;
    userRole: ComplianceDemoRole;
    draftStorageKey?: string;
}) {
    const [name, setName] = useState('');
    const [docType, setDocType] = useState<string>(DOCUMENT_TYPE_OPTIONS[0]);
    const [categories, setCategories] = useState<string[]>([]);
    const [projectId, setProjectId] = useState('');
    const [bookingId, setBookingId] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [accessLevel, setAccessLevel] = useState<AccessLevel>('private');
    const [allowedRoles, setAllowedRoles] = useState<ComplianceDemoRole[]>([
        'super_admin',
        'company_admin',
        'staff',
        'viewer',
    ]);
    const [rera, setRera] = useState('');
    const [expiry, setExpiry] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [drag, setDrag] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<UploadErrKey, string>>>({});
    const [showValidationSummary, setShowValidationSummary] = useState(false);
    const [validationFieldToast, setValidationFieldToast] = useState<string | null>(null);
    const [submitShakeKey, setSubmitShakeKey] = useState(0);
    const [cardOpen, setCardOpen] = useState({
        basic: true,
        file: true,
        linked: true,
        access: true,
        compliance: true,
        additional: false,
    });
    const [draftFileHint, setDraftFileHint] = useState<{ name: string; size: number; type: string } | null>(null);
    const [showDraftSavedToast, setShowDraftSavedToast] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const dismissDraftSavedToast = useCallback(() => setShowDraftSavedToast(false), []);

    const dismissValidationToast = useCallback(() => setValidationFieldToast(null), []);

    const reset = useCallback(() => {
        setName('');
        setDocType(DOCUMENT_TYPE_OPTIONS[0]);
        setCategories([]);
        setProjectId('');
        setBookingId('');
        setCustomerId('');
        setAccessLevel('private');
        setAllowedRoles(['super_admin', 'company_admin', 'staff', 'viewer']);
        setRera('');
        setExpiry('');
        setFile(null);
        setDraftFileHint(null);
        setErrors({});
        setShowValidationSummary(false);
        setValidationFieldToast(null);
        setIsSubmitting(false);
    }, []);

    const applyDraft = useCallback((d: DocumentUploadDraftV1) => {
        setName(d.name);
        setDocType(
            (DOCUMENT_TYPE_OPTIONS as readonly string[]).includes(d.documentType) ? d.documentType : DOCUMENT_TYPE_OPTIONS[0],
        );
        setCategories(Array.isArray(d.categories) ? d.categories : []);
        setProjectId(d.projectId ?? '');
        setBookingId(d.bookingId ?? '');
        setCustomerId(d.customerId ?? '');
        setAccessLevel(d.accessLevel === 'public' || d.accessLevel === 'private' || d.accessLevel === 'restricted' ? d.accessLevel : 'private');
        setAllowedRoles(
            Array.isArray(d.allowedRoles) && d.allowedRoles.length
                ? (d.allowedRoles.filter((r) => ROLE_OPTIONS.includes(r)) as ComplianceDemoRole[])
                : ['super_admin', 'company_admin', 'staff', 'viewer'],
        );
        setRera(d.rera ?? '');
        setExpiry(d.expiry ?? '');
        setFile(null);
        setDraftFileHint(d.fileMeta && d.fileMeta.name ? d.fileMeta : null);
        if (d.cardOpen && typeof d.cardOpen === 'object') {
            setCardOpen((prev) => ({
                basic: d.cardOpen.basic ?? prev.basic,
                file: d.cardOpen.file ?? prev.file,
                linked: d.cardOpen.linked ?? prev.linked,
                access: d.cardOpen.access ?? prev.access,
                compliance: d.cardOpen.compliance ?? prev.compliance,
                additional: d.cardOpen.additional ?? prev.additional,
            }));
        }
        setErrors({});
        setShowValidationSummary(false);
        setValidationFieldToast(null);
    }, []);

    useEffect(() => {
        if (!open) return;
        if (draftStorageKey) {
            const loaded = loadDocumentUploadDraft(draftStorageKey);
            if (loaded) {
                applyDraft(loaded);
                return;
            }
        }
        reset();
    }, [open, draftStorageKey, applyDraft, reset]);

    useEffect(() => {
        if (Object.keys(errors).length === 0) {
            setShowValidationSummary(false);
            setValidationFieldToast(null);
        }
    }, [errors]);

    const projects = getProjectLookupOptions();
    const bookings = getBookingLookupOptions();
    const customers = getCustomerLookupOptions();

    const formStatus = useMemo(
        () =>
            uploadFormStatusLabel({
                name,
                docType,
                categoriesCount: categories.length,
                file: Boolean(file),
                allowedRolesCount: allowedRoles.length,
            }),
        [name, docType, categories.length, file, allowedRoles.length],
    );

    const saveDraft = useCallback(() => {
        if (!draftStorageKey) return;
        saveDocumentUploadDraftToStorage(draftStorageKey, {
            name,
            documentType: docType,
            categories,
            projectId,
            bookingId,
            customerId,
            accessLevel,
            allowedRoles,
            rera,
            expiry,
            fileMeta: file ? { name: file.name, size: file.size, type: file.type } : draftFileHint,
            cardOpen,
        });
        setShowDraftSavedToast(true);
    }, [
        draftStorageKey,
        name,
        docType,
        categories,
        projectId,
        bookingId,
        customerId,
        accessLevel,
        allowedRoles,
        rera,
        expiry,
        file,
        draftFileHint,
        cardOpen,
    ]);

    const clearErr = (k: UploadErrKey) => {
        setErrors((p) => {
            if (!p[k]) return p;
            const n = { ...p };
            delete n[k];
            return n;
        });
    };

    const runValidate = (): Partial<Record<UploadErrKey, string>> => {
        const e: Partial<Record<UploadErrKey, string>> = {};
        if (!name.trim()) e.name = 'Document name is required.';
        if (!docType) e.documentType = 'Document type is required.';
        if (!file) e.file = 'Please upload a file (PDF / JPG / PNG).';
        else {
            if (file.size > MAX_BYTES) e.file = 'Max file size is 100MB.';
            const n = file.name.toLowerCase();
            const ok = n.endsWith('.pdf') || n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.png');
            if (!ok) e.file = 'Allowed types: PDF, JPG, PNG.';
        }
        if (!categories.length) e.categories = 'Select at least one category.';
        if (!allowedRoles.length) e.allowedRoles = 'Select at least one role.';
        return e;
    };

    const runSubmit = () => {
        if (isSubmitting) return;
        const next = runValidate();
        setErrors(next);
        const keys = Object.keys(next) as UploadErrKey[];
        if (keys.length) {
            setShowValidationSummary(true);
            setValidationFieldToast(
                `Please complete ${keys.length} required field${keys.length === 1 ? '' : 's'}`,
            );
            setSubmitShakeKey((k) => k + 1);
            setCardOpen((s) => ({
                ...s,
                basic: (['name', 'documentType', 'categories'] as const).some((x) => next[x]) ? true : s.basic,
                file: next.file ? true : s.file,
                access: next.allowedRoles ? true : s.access,
            }));
            const first = VALIDATION_ORDER.find((f) => next[f]);
            if (first) window.requestAnimationFrame(() => focusDocumentFormField(SCROLL_FOR[first]));
            return;
        }
        if (!file) return;
        flushSync(() => {
            setIsSubmitting(true);
        });
        try {
            const created = addDocument({
                name: name.trim(),
                documentType: docType,
                categories,
                file: { name: file.name, type: file.type, size: file.size },
                projectId,
                bookingId,
                customerId,
                accessLevel,
                allowedRoles,
                reraNumber: rera,
                expiryDate: expiry || null,
                uploadedBy,
                userRole,
            });
            if (draftStorageKey) {
                clearDocumentUploadDraft(draftStorageKey);
            }
            onSuccess?.(created?.id);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleCategory = (c: string) => {
        setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
        clearErr('categories');
    };

    const toggleRole = (r: ComplianceDemoRole) => {
        setAllowedRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
        clearErr('allowedRoles');
    };

    const onDrop = (ev: React.DragEvent) => {
        ev.preventDefault();
        setDrag(false);
        const f = ev.dataTransfer.files?.[0];
        if (f) {
            setFile(f);
            setDraftFileHint(null);
            clearErr('file');
        }
    };

    const basicErr = ['name', 'documentType', 'categories'].filter((k) => errors[k as UploadErrKey]).length;
    const fileErr = errors.file ? 1 : 0;
    const accessErr = errors.allowedRoles ? 1 : 0;
    const summaryKeys = showValidationSummary ? (VALIDATION_ORDER.filter((f) => errors[f]) as UploadErrKey[]) : [];

    if (!open) return null;

    return (
        <CrmFieldProvider>
            <>
                {showDraftSavedToast ? (
                    <InlineToast message="Draft saved" variant="success" onDismiss={dismissDraftSavedToast} />
                ) : null}
                {validationFieldToast ? (
                    <InlineToast
                        message={validationFieldToast}
                        variant="error"
                        onDismiss={dismissValidationToast}
                    />
                ) : null}
                <div className="w-full space-y-6">
                    <form
                        id={DOC_UPLOAD_FORM_ID}
                        onSubmit={(e) => {
                            e.preventDefault();
                            runSubmit();
                        }}
                        className="space-y-6"
                    >
                            <p className="text-xs text-slate-500">
                                <span className="text-rose-500">*</span> Required fields. PDF, JPG, or PNG · max 100MB.
                            </p>

                            {showValidationSummary && summaryKeys.length > 0 ? (
                                <div
                                    className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3.5 text-sm text-amber-950 shadow-sm"
                                    role="alert"
                                >
                                    <p className="font-semibold text-amber-950">
                                        <span className="mr-1" aria-hidden>
                                            ⚠
                                        </span>
                                        Please complete required details before continuing.
                                    </p>
                                    <p className="mt-2 text-[13px] font-medium text-amber-900/95">
                                        {summaryKeys.map((f, i) => (
                                            <span key={f}>
                                                {i > 0 ? <span className="mx-1 text-amber-800/40">·</span> : null}
                                                <button
                                                    type="button"
                                                    className={CTA_LINK_UNDERLINE}
                                                    onClick={() => {
                                                        if (['name', 'documentType', 'categories'].includes(f)) {
                                                            setCardOpen((c) => ({ ...c, basic: true }));
                                                        }
                                                        if (f === 'file') setCardOpen((c) => ({ ...c, file: true }));
                                                        if (f === 'allowedRoles') setCardOpen((c) => ({ ...c, access: true }));
                                                        requestAnimationFrame(() => focusDocumentFormField(SCROLL_FOR[f]));
                                                    }}
                                                >
                                                    {HUMAN[f]}
                                                </button>
                                            </span>
                                        ))}
                                    </p>
                                </div>
                            ) : null}

                            <FormCollapsibleSection
                                layout="card"
                                title="Basic information"
                                icon={LuFileText}
                                tone="blue"
                                open={cardOpen.basic}
                                onOpenChange={(o) => setCardOpen((c) => ({ ...c, basic: o }))}
                                headerRight={
                                    basicErr > 0 ? (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
                                            {basicErr} required
                                        </span>
                                    ) : null
                                }
                            >
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <InputField
                                            label="Document ID"
                                            readOnly
                                            disabled
                                            value="Assigned on save"
                                            className="opacity-90"
                                            startIcon={<LuTag aria-hidden />}
                                        />
                                    </div>
                                    <div
                                        id={DOCUMENT_FORM_FIELD_IDS.name}
                                        className="sm:col-span-1"
                                    >
                                        <InputField
                                            id={`${DOCUMENT_FORM_FIELD_IDS.name}-input`}
                                            name="name"
                                            label="Document name"
                                            required
                                            value={name}
                                            onChange={(e) => {
                                                setName(e.target.value);
                                                clearErr('name');
                                            }}
                                            placeholder="e.g. RERA registration pack"
                                            error={errors.name}
                                        />
                                    </div>
                                    <div id={DOCUMENT_FORM_FIELD_IDS.type}>
                                        <SelectField
                                            id={`${DOCUMENT_FORM_FIELD_IDS.type}-input`}
                                            name="documentType"
                                            label="Document type"
                                            required
                                            value={docType}
                                            onChange={(e) => {
                                                setDocType(e.target.value);
                                                clearErr('documentType');
                                            }}
                                            options={DOCUMENT_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
                                            error={errors.documentType}
                                        />
                                    </div>
                                    <div
                                        id={DOCUMENT_FORM_FIELD_IDS.categories}
                                        className="sm:col-span-2"
                                    >
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-700">
                                            Categories <span className="text-rose-500">*</span>
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {DOCUMENT_CATEGORY_OPTIONS.map((c) => (
                                                <label
                                                    key={c}
                                                    className={cn(
                                                        'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                                                        categories.includes(c)
                                                            ? CTA_SELECTABLE_PILL_ACTIVE
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                                                    )}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={categories.includes(c)}
                                                        onChange={() => toggleCategory(c)}
                                                    />
                                                    {c}
                                                </label>
                                            ))}
                                        </div>
                                        {errors.categories ? <p className="mt-1.5 text-xs text-red-600">{errors.categories}</p> : null}
                                    </div>
                                    <p className="text-xs text-gray-500 sm:col-span-2">
                                        <span className="font-medium text-slate-600">Uploaded by</span> {uploadedBy}
                                    </p>
                                </div>
                            </FormCollapsibleSection>

                            <FormCollapsibleSection
                                layout="card"
                                title="File upload"
                                icon={LuUpload}
                                tone="amber"
                                open={cardOpen.file}
                                onOpenChange={(o) => setCardOpen((c) => ({ ...c, file: o }))}
                                headerRight={
                                    fileErr > 0 ? (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
                                            Required
                                        </span>
                                    ) : null
                                }
                            >
                                <div
                                    id={DOCUMENT_FORM_FIELD_IDS.file}
                                    className="space-y-3"
                                >
                                    <div
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDrag(true);
                                        }}
                                        onDragLeave={() => setDrag(false)}
                                        onDrop={onDrop}
                                        className={cn(
                                            'w-full rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors',
                                            drag
                                                ? 'border-[color-mix(in_srgb,var(--cta-button-bg)_48%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]'
                                                : 'border-slate-200 bg-slate-50/40',
                                            errors.file ? 'border-red-300 bg-rose-50/30' : '',
                                        )}
                                    >
                                        <LuUpload className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                                        <p className="text-sm font-semibold text-slate-800">Drag &amp; drop or browse</p>
                                        <p className="mt-1 text-xs text-slate-500">PDF, JPG, PNG · max 100MB</p>
                                        <input
                                            type="file"
                                            accept={ACCEPT}
                                            className="mt-4 mx-auto block max-w-xs text-xs"
                                            onChange={(e) => {
                                                const f = e.target.files?.[0] ?? null;
                                                setFile(f);
                                                if (f) setDraftFileHint(null);
                                                clearErr('file');
                                            }}
                                        />
                                    </div>
                                    {!file && draftFileHint ? (
                                        <p className="rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
                                            <span className="font-semibold">Draft file (re-select to submit):</span>{' '}
                                            {draftFileHint.name} · {formatComplianceFileSize(draftFileHint.size)}
                                        </p>
                                    ) : null}
                                    {errors.file ? <p className="text-xs text-red-600">{errors.file}</p> : null}
                                    {file ? (
                                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/80">
                                                    <LuFileText className="h-5 w-5 text-slate-600" aria-hidden />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
                                                    <p className="text-xs text-slate-500">{formatComplianceFileSize(file.size)}</p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="companyGhost"
                                                size="sm"
                                                className="shrink-0 gap-1 text-rose-700"
                                                onClick={() => {
                                                    setFile(null);
                                                    setDraftFileHint(null);
                                                    clearErr('file');
                                                }}
                                            >
                                                <LuTrash2 className="h-4 w-4" aria-hidden />
                                                Remove
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                            </FormCollapsibleSection>

                            <FormCollapsibleSection
                                layout="card"
                                title="Linked data"
                                icon={LuLink2}
                                tone="slate"
                                open={cardOpen.linked}
                                onOpenChange={(o) => setCardOpen((c) => ({ ...c, linked: o }))}
                            >
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div id={DOCUMENT_FORM_FIELD_IDS.booking}>
                                        <SelectField
                                            label="Booking"
                                            value={bookingId}
                                            onChange={(e) => setBookingId(e.target.value)}
                                            options={bookings.map((p) => ({ value: p.value, label: p.label }))}
                                            placeholder="—"
                                        />
                                    </div>
                                    <div id={DOCUMENT_FORM_FIELD_IDS.customer}>
                                        <SelectField
                                            label="Customer"
                                            value={customerId}
                                            onChange={(e) => setCustomerId(e.target.value)}
                                            options={customers.map((p) => ({ value: p.value, label: p.label }))}
                                            placeholder="—"
                                        />
                                    </div>
                                    <div
                                        id={DOCUMENT_FORM_FIELD_IDS.project}
                                        className="sm:col-span-2"
                                    >
                                        <SelectField
                                            label="Project"
                                            value={projectId}
                                            onChange={(e) => setProjectId(e.target.value)}
                                            options={projects.map((p) => ({ value: p.value, label: p.label }))}
                                            placeholder="—"
                                        />
                                    </div>
                                </div>
                            </FormCollapsibleSection>

                            <FormCollapsibleSection
                                layout="card"
                                title="Access control"
                                icon={LuShield}
                                tone="blue"
                                open={cardOpen.access}
                                onOpenChange={(o) => setCardOpen((c) => ({ ...c, access: o }))}
                                headerRight={
                                    accessErr > 0 ? (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
                                            Required
                                        </span>
                                    ) : null
                                }
                            >
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div id={DOCUMENT_FORM_FIELD_IDS.access}>
                                        <SelectField
                                            label="Access level"
                                            value={accessLevel}
                                            onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}
                                            options={ACCESS_OPTIONS}
                                        />
                                    </div>
                                    <div
                                        id={DOCUMENT_FORM_FIELD_IDS.roles}
                                        className="sm:col-span-2"
                                    >
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-700">
                                            Allowed roles <span className="text-rose-500">*</span>
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {ROLE_OPTIONS.map((r) => (
                                                <label
                                                    key={r}
                                                    className={cn(
                                                        'cursor-pointer rounded-full border px-2.5 py-1.5 text-xs font-medium',
                                                        allowedRoles.includes(r)
                                                            ? CTA_SELECTABLE_PILL_ACTIVE
                                                            : 'border-slate-200 text-slate-600',
                                                    )}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only"
                                                        checked={allowedRoles.includes(r)}
                                                        onChange={() => toggleRole(r)}
                                                    />
                                                    {COMPLIANCE_ROLE_LABELS[r]}
                                                </label>
                                            ))}
                                        </div>
                                        {errors.allowedRoles ? <p className="mt-1.5 text-xs text-red-600">{errors.allowedRoles}</p> : null}
                                    </div>
                                </div>
                            </FormCollapsibleSection>

                            <FormCollapsibleSection
                                layout="card"
                                title="Compliance"
                                icon={LuScale}
                                tone="amber"
                                open={cardOpen.compliance}
                                onOpenChange={(o) => setCardOpen((c) => ({ ...c, compliance: o }))}
                            >
                                <div
                                    className={cn(
                                        'grid grid-cols-1 gap-5 sm:grid-cols-2',
                                    )}
                                >
                                    <div
                                        id={DOCUMENT_FORM_FIELD_IDS.rera}
                                    >
                                        <InputField
                                            label="RERA number"
                                            value={rera}
                                            onChange={(e) => setRera(e.target.value)}
                                            placeholder="e.g. RERA/TG/2024/008821"
                                        />
                                    </div>
                                    <div
                                        id={DOCUMENT_FORM_FIELD_IDS.expiry}
                                    >
                                        <InputField
                                            label="Expiry date"
                                            type="date"
                                            value={expiry}
                                            onChange={(e) => setExpiry(e.target.value)}
                                            startIcon={<LuCalendar aria-hidden />}
                                        />
                                    </div>
                                </div>
                            </FormCollapsibleSection>

                            <FormCollapsibleSection
                                layout="card"
                                title="Additional information"
                                icon={LuUser}
                                tone="slate"
                                open={cardOpen.additional}
                                onOpenChange={(o) => setCardOpen((c) => ({ ...c, additional: o }))}
                            >
                                <div className="space-y-4 text-sm text-slate-700">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Version</p>
                                        <p className="mt-1 font-mono text-xs">1 (initial)</p>
                                    </div>
                                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-500">
                                        Notes are not stored in this demo — use your DMS for annotations.
                                    </div>
                                </div>
                            </FormCollapsibleSection>

                        <div className="sticky bottom-0 z-30 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur supports-backdrop-filter:bg-white/90 sm:-mx-5 sm:px-5">
                            <DocumentFormStickyStatusFooter
                                formId={DOC_UPLOAD_FORM_ID}
                                formStatus={formStatus}
                                onCancel={onCancel}
                                onSaveDraft={draftStorageKey ? saveDraft : undefined}
                                submitLabel="Create document"
                                submitShakeKey={submitShakeKey}
                                isLoading={isSubmitting}
                            />
                        </div>
                    </form>
                </div>
            </>
        </CrmFieldProvider>
    );
}
