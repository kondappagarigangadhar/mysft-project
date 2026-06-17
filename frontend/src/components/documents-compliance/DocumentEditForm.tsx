'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { FormCollapsibleSection } from '@/components/forms/FormCollapsibleSection';
import { CrmFieldProvider, InputField, SelectField } from '@/components/forms/Fields';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { PreviousVersionReadonlyValue } from '@/components/documents-compliance/DocumentCoreFieldsBlock';
import { DocumentFormStickyStatusFooter } from '@/components/documents-compliance/DocumentFormStickyStatusFooter';
import { cn } from '@/lib/utils';
import { CTA_LINK_UNDERLINE, CTA_SELECTABLE_PILL_ACTIVE } from '@/lib/theme/ctaThemeClasses';
import {
    DOCUMENT_CATEGORY_OPTIONS,
    DOCUMENT_TYPE_OPTIONS,
    formatComplianceFileSize,
    getBookingLookupOptions,
    getCurrentVersion,
    getCustomerLookupOptions,
    getDocumentById,
    getProjectLookupOptions,
    getUploadDateYmd,
    updateDocumentMeta,
    type AccessLevel,
    type ComplianceDocumentRecord,
} from '@/lib/complianceDocumentsMockStore';
import { COMPLIANCE_ROLE_LABELS, type ComplianceDemoRole } from '@/lib/complianceRbac';
import { useComplianceStoreBump } from '@/hooks/useComplianceStoreBump';
import { formatShortDate } from '@/lib/formatDate';
import { DOCUMENT_FORM_FIELD_IDS, editFormStatusLabel, focusDocumentFormField } from '@/lib/documentComplianceFormUi';
import {
    LuCalendar,
    LuFileText,
    LuLink2,
    LuScale,
    LuShield,
    LuUpload,
    LuUser,
} from 'react-icons/lu';

const DOC_EDIT_FORM_ID = 'document-compliance-edit-form';

const ACCESS_OPTIONS: { value: AccessLevel; label: string }[] = [
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' },
    { value: 'restricted', label: 'Restricted' },
];

const ROLE_OPTIONS: ComplianceDemoRole[] = ['super_admin', 'company_admin', 'staff', 'viewer'];

const EDIT_VALIDATION_ORDER = ['name', 'categories', 'allowedRoles'] as const;
type EditErrKey = (typeof EDIT_VALIDATION_ORDER)[number];

const SCROLL_FOR_EDIT: Record<EditErrKey, string> = {
    name: DOCUMENT_FORM_FIELD_IDS.name,
    categories: DOCUMENT_FORM_FIELD_IDS.categories,
    allowedRoles: DOCUMENT_FORM_FIELD_IDS.roles,
};

const HUMAN_EDIT: Record<EditErrKey, string> = {
    name: 'Document name',
    categories: 'Categories',
    allowedRoles: 'Allowed roles',
};

function DocumentEditFormBody({
    doc,
    setDoc,
    categories,
    setCategories,
    allowedRoles,
    setAllowedRoles,
    onCancel,
    onSuccess,
    actorName,
    actorRole,
}: {
    doc: ComplianceDocumentRecord;
    setDoc: React.Dispatch<React.SetStateAction<ComplianceDocumentRecord | null>>;
    categories: string[];
    setCategories: React.Dispatch<React.SetStateAction<string[]>>;
    allowedRoles: ComplianceDemoRole[];
    setAllowedRoles: React.Dispatch<React.SetStateAction<ComplianceDemoRole[]>>;
    onCancel: () => void;
    onSuccess?: () => void;
    actorName: string;
    actorRole: ComplianceDemoRole;
}) {
    const [errors, setErrors] = useState<Partial<Record<EditErrKey, string>>>({});
    const [showValidationSummary, setShowValidationSummary] = useState(false);
    const [validationFieldToast, setValidationFieldToast] = useState<string | null>(null);
    const [submitShakeKey, setSubmitShakeKey] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cardOpen, setCardOpen] = useState({
        basic: true,
        file: true,
        linked: true,
        access: true,
        compliance: true,
        additional: false,
    });

    const dismissValidationToast = useCallback(() => setValidationFieldToast(null), []);

    useEffect(() => {
        if (Object.keys(errors).length === 0) {
            setShowValidationSummary(false);
            setValidationFieldToast(null);
        }
    }, [errors]);

    const projects = getProjectLookupOptions();
    const bookings = getBookingLookupOptions();
    const customers = getCustomerLookupOptions();

    const v = getCurrentVersion(doc);
    const uploadYmd = getUploadDateYmd(doc);

    const toggleCategory = (c: string) => {
        setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
        clearErr('categories');
    };

    const toggleRole = (r: ComplianceDemoRole) => {
        setAllowedRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
        clearErr('allowedRoles');
    };

    const clearErr = (k: EditErrKey) => {
        setErrors((p) => {
            if (!p[k]) return p;
            const n = { ...p };
            delete n[k];
            return n;
        });
    };

    const runValidate = (): Partial<Record<EditErrKey, string>> => {
        const e: Partial<Record<EditErrKey, string>> = {};
        if (!doc.name.trim()) e.name = 'Document name is required.';
        if (!categories.length) e.categories = 'Select at least one category.';
        if (!allowedRoles.length) e.allowedRoles = 'Select at least one role.';
        return e;
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        const next = runValidate();
        setErrors(next);
        const keys = Object.keys(next) as EditErrKey[];
        if (keys.length) {
            setShowValidationSummary(true);
            setValidationFieldToast(
                `Please complete ${keys.length} required field${keys.length === 1 ? '' : 's'}`,
            );
            setSubmitShakeKey((k) => k + 1);
            setCardOpen((s) => ({
                ...s,
                basic: (['name', 'categories'] as const).some((x) => next[x]) ? true : s.basic,
                access: next.allowedRoles ? true : s.access,
            }));
            const first = EDIT_VALIDATION_ORDER.find((f) => next[f]);
            if (first) requestAnimationFrame(() => focusDocumentFormField(SCROLL_FOR_EDIT[first]));
            return;
        }

        flushSync(() => {
            setIsSubmitting(true);
        });
        try {
            updateDocumentMeta(
                doc.id,
                {
                    name: doc.name.trim(),
                    documentType: doc.documentType,
                    categories,
                    projectId: doc.projectId,
                    bookingId: doc.bookingId,
                    customerId: doc.customerId,
                    accessLevel: doc.accessLevel,
                    allowedRoles,
                    reraNumber: doc.reraNumber,
                    expiryDate: doc.expiryDate,
                },
                { name: actorName, role: actorRole },
            );
            onSuccess?.();
        } finally {
            setIsSubmitting(false);
        }
    };

    const formStatus = useMemo(
        () =>
            editFormStatusLabel({
                name: doc.name,
                categoriesCount: categories.length,
                allowedRolesCount: allowedRoles.length,
            }),
        [doc.name, categories.length, allowedRoles.length],
    );

    const basicErr = (['name', 'categories'] as const).filter((k) => errors[k]).length;
    const accessErr = errors.allowedRoles ? 1 : 0;
    const summaryKeys = showValidationSummary ? (EDIT_VALIDATION_ORDER.filter((f) => errors[f]) as EditErrKey[]) : [];

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
                <div className="w-full space-y-6">
                    <form id={DOC_EDIT_FORM_ID} onSubmit={onSubmit} className="space-y-6">
                            <p className="text-xs text-slate-500">
                                <span className="text-rose-500">*</span> Required fields. File version history is unchanged until you upload
                                a new version from the document list.
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
                                                        if (['name', 'categories'].includes(f)) {
                                                            setCardOpen((c) => ({ ...c, basic: true }));
                                                        }
                                                        if (f === 'allowedRoles') setCardOpen((c) => ({ ...c, access: true }));
                                                        requestAnimationFrame(() => focusDocumentFormField(SCROLL_FOR_EDIT[f]));
                                                    }}
                                                >
                                                    {HUMAN_EDIT[f]}
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
                                        <div className="rounded-lg border border-sky-100 bg-sky-50/50 px-3 py-2.5 text-xs text-sky-900">
                                            <span className="font-semibold text-slate-600">Document ID</span>
                                            <span className="ml-2 font-mono text-slate-800">{doc.id}</span>
                                        </div>
                                    </div>
                                    <div id={DOCUMENT_FORM_FIELD_IDS.name} className="sm:col-span-1">
                                        <InputField
                                            id={`${DOCUMENT_FORM_FIELD_IDS.name}-input`}
                                            name="name"
                                            label="Document name"
                                            required
                                            value={doc.name}
                                            onChange={(e) => {
                                                setDoc((d) => (d ? { ...d, name: e.target.value } : d));
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
                                            value={doc.documentType}
                                            onChange={(e) => setDoc((d) => (d ? { ...d, documentType: e.target.value } : d))}
                                            options={DOCUMENT_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
                                        />
                                    </div>
                                    <div id={DOCUMENT_FORM_FIELD_IDS.categories} className="sm:col-span-2">
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
                                </div>
                            </FormCollapsibleSection>

                            <FormCollapsibleSection
                                layout="card"
                                title="File (read-only)"
                                icon={LuUpload}
                                tone="amber"
                                open={cardOpen.file}
                                onOpenChange={(o) => setCardOpen((c) => ({ ...c, file: o }))}
                            >
                                <div id={DOCUMENT_FORM_FIELD_IDS.file} className="space-y-3">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-6">
                                        <div className="flex flex-wrap items-start gap-3">
                                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
                                                <LuFileText className="h-6 w-6 text-slate-600" aria-hidden />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-slate-900">{v?.fileName ?? '—'}</p>
                                                <div className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                                                    <p>
                                                        <span className="text-slate-500">Size:</span>{' '}
                                                        {v ? formatComplianceFileSize(v.sizeBytes) : '—'}
                                                    </p>
                                                    <p>
                                                        <span className="text-slate-500">Uploaded:</span> {formatShortDate(uploadYmd)}
                                                    </p>
                                                    <p className="sm:col-span-2">
                                                        <span className="text-slate-500">Uploaded by:</span> {v?.uploadedBy ?? '—'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="mt-4 text-xs font-medium text-slate-500">
                                            Replace the file from the document list when you need a new version.
                                        </p>
                                    </div>
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
                                            value={doc.bookingId}
                                            onChange={(e) => setDoc((d) => (d ? { ...d, bookingId: e.target.value } : d))}
                                            options={bookings.map((p) => ({ value: p.value, label: p.label }))}
                                            placeholder="—"
                                        />
                                    </div>
                                    <div id={DOCUMENT_FORM_FIELD_IDS.customer}>
                                        <SelectField
                                            label="Customer"
                                            value={doc.customerId}
                                            onChange={(e) => setDoc((d) => (d ? { ...d, customerId: e.target.value } : d))}
                                            options={customers.map((p) => ({ value: p.value, label: p.label }))}
                                            placeholder="—"
                                        />
                                    </div>
                                    <div id={DOCUMENT_FORM_FIELD_IDS.project} className="sm:col-span-2">
                                        <SelectField
                                            label="Project"
                                            value={doc.projectId}
                                            onChange={(e) => setDoc((d) => (d ? { ...d, projectId: e.target.value } : d))}
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
                                            value={doc.accessLevel}
                                            onChange={(e) => setDoc((d) => (d ? { ...d, accessLevel: e.target.value as AccessLevel } : d))}
                                            options={ACCESS_OPTIONS}
                                        />
                                    </div>
                                    <div id={DOCUMENT_FORM_FIELD_IDS.roles} className="sm:col-span-2">
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
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div id={DOCUMENT_FORM_FIELD_IDS.rera}>
                                        <InputField
                                            label="RERA number"
                                            value={doc.reraNumber}
                                            onChange={(e) => setDoc((d) => (d ? { ...d, reraNumber: e.target.value } : d))}
                                            placeholder="e.g. RERA/TG/2024/008821"
                                        />
                                    </div>
                                    <div id={DOCUMENT_FORM_FIELD_IDS.expiry}>
                                        <InputField
                                            label="Expiry date"
                                            type="date"
                                            value={doc.expiryDate ?? ''}
                                            onChange={(e) => setDoc((d) => (d ? { ...d, expiryDate: e.target.value || null } : d))}
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
                                        <p className="mt-1 font-mono text-xs text-slate-800">{v?.version ?? '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Previous version</p>
                                        <div className="mt-1 text-xs">
                                            <PreviousVersionReadonlyValue doc={doc} />
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-500">
                                        Notes are not stored in this demo — use your DMS integration for annotations.
                                    </div>
                                </div>
                            </FormCollapsibleSection>

                            <div className="sticky bottom-0 z-30 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur supports-backdrop-filter:bg-white/90 sm:-mx-5 sm:px-5">
                                <DocumentFormStickyStatusFooter
                                    formId={DOC_EDIT_FORM_ID}
                                    formStatus={formStatus}
                                    onCancel={onCancel}
                                    submitLabel="Save changes"
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

export function DocumentEditForm({
    open,
    documentId,
    onCancel,
    onSuccess,
    actorName,
    actorRole,
}: {
    open: boolean;
    documentId: string | null;
    onCancel: () => void;
    onSuccess?: () => void;
    actorName: string;
    actorRole: ComplianceDemoRole;
}) {
    useComplianceStoreBump();
    const [doc, setDoc] = useState<ComplianceDocumentRecord | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [allowedRoles, setAllowedRoles] = useState<ComplianceDemoRole[]>([]);

    useEffect(() => {
        if (!open || !documentId) {
             
            setDoc(null);
            return;
        }
        const d = getDocumentById(documentId);
        setDoc(d ?? null);
        if (d) {
            setCategories(d.categories);
            setAllowedRoles(d.allowedRoles);
        }
    }, [open, documentId]);

    if (!open || !documentId) return null;

    if (!doc) {
        return <p className="text-sm text-slate-500">Document not found.</p>;
    }

    return (
        <DocumentEditFormBody
            doc={doc}
            setDoc={setDoc}
            categories={categories}
            setCategories={setCategories}
            allowedRoles={allowedRoles}
            setAllowedRoles={setAllowedRoles}
            onCancel={onCancel}
            onSuccess={onSuccess}
            actorName={actorName}
            actorRole={actorRole}
        />
    );
}
