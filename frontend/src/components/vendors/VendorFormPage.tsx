'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { CrmFieldProvider, InputField, SelectField, TextAreaField } from '@/components/forms/Fields';
import { FormCollapsibleSection } from '@/components/forms/FormCollapsibleSection';
import { VENDOR_CATEGORIES } from '@/lib/vendors/mockData';
import { getWorkOrderProjectOptions } from '@/lib/work-orders/workOrderCatalog';
import type { Vendor } from '@/lib/vendors/types';
import { saveVendorFromForm } from '@/lib/vendors/vendorStore';
import { LuArrowLeft, LuBuilding2, LuInfo, LuMapPin, LuStickyNote, LuUser } from 'react-icons/lu';

type VendorFormState = {
    vendorId: string;
    vendorName: string;
    vendorType: string;
    categories: string[];
    primaryProject: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    status: string;
    onboardedDate: string;
    notes: string;
};

type VendorFormPrefill = Vendor & {
    address?: string;
    pincode?: string;
    onboardedDate?: string;
    notes?: string;
};

type VendorFormErrors = Partial<Record<keyof VendorFormState, string>>;
const NAME_REGEX = /^[A-Za-z][A-Za-z\s.-]*$/;
const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PINCODE_REGEX = /^\d{6}$/;

function validateVendorForm(state: VendorFormState): VendorFormErrors {
    const errors: VendorFormErrors = {};
    if (!state.vendorName.trim()) errors.vendorName = 'Vendor name is required.';
    else if (!NAME_REGEX.test(state.vendorName.trim())) errors.vendorName = 'Vendor name can contain letters, spaces, dots, and hyphens only.';
    if (!state.vendorType.trim()) errors.vendorType = 'Vendor type is required.';
    if (state.categories.length === 0) errors.categories = 'Select at least one category.';
    if (!state.primaryProject.trim()) errors.primaryProject = 'Primary project is required.';
    if (!state.contactPerson.trim()) errors.contactPerson = 'Contact person is required.';
    else if (!NAME_REGEX.test(state.contactPerson.trim())) errors.contactPerson = 'Contact person can contain letters, spaces, dots, and hyphens only.';
    if (!state.phone.trim()) errors.phone = 'Phone number is required.';
    else if (!PHONE_REGEX.test(state.phone.trim())) errors.phone = 'Phone number must be exactly 10 digits.';
    if (state.email.trim() && !EMAIL_REGEX.test(state.email.trim())) errors.email = 'Please enter a valid email address.';
    if (!state.city.trim()) errors.city = 'City is required.';
    if (state.pincode.trim() && !PINCODE_REGEX.test(state.pincode.trim())) errors.pincode = 'Pincode must be exactly 6 digits.';
    return errors;
}

/** Same pattern as LeadFormEnterprise: first invalid field in this order gets scroll + focus on submit. */
const VENDOR_VALIDATION_ORDER: (keyof VendorFormState)[] = [
    'vendorName',
    'vendorType',
    'categories',
    'primaryProject',
    'contactPerson',
    'phone',
    'email',
    'city',
    'pincode',
];

const VENDOR_BASIC_FIELD_KEYS: (keyof VendorFormState)[] = [
    'vendorName',
    'vendorType',
    'categories',
    'primaryProject',
    'contactPerson',
    'phone',
    'email',
];

const VENDOR_ADDRESS_FIELD_KEYS: (keyof VendorFormState)[] = ['address', 'city', 'state', 'pincode', 'country'];

const VENDOR_FIELD_LABELS: Partial<Record<keyof VendorFormState, string>> = {
    vendorName: 'Vendor Name',
    vendorType: 'Vendor Type',
    categories: 'Category',
    primaryProject: 'Primary project',
    contactPerson: 'Contact Person',
    phone: 'Phone',
    email: 'Email',
    city: 'City',
    pincode: 'Pincode',
};

const VENDOR_FORM_SCROLL_OFFSET_PX = 96;

function vendorFieldDomId(field: keyof VendorFormState): string | null {
    switch (field) {
        case 'vendorName':
            return 'vendor-name';
        case 'vendorType':
            return 'vendor-type';
        case 'categories':
            return 'vendor-categories';
        case 'primaryProject':
            return 'vendor-primary-project';
        case 'contactPerson':
            return 'contact-person';
        case 'phone':
            return 'phone';
        case 'email':
            return 'email';
        case 'city':
            return 'city';
        case 'pincode':
            return 'pincode';
        default:
            return null;
    }
}

function focusVendorField(field: keyof VendorFormState) {
    const id = vendorFieldDomId(field);
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - VENDOR_FORM_SCROLL_OFFSET_PX;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    window.setTimeout(() => {
        if (field === 'categories') {
            const wrap = document.getElementById(id);
            const btn = wrap?.querySelector('button');
            if (btn && 'focus' in btn) (btn as HTMLButtonElement).focus({ preventScroll: true });
            return;
        }
        const again = document.getElementById(id);
        if (again && 'focus' in again && typeof (again as HTMLElement & { focus: (opts?: FocusOptions) => void }).focus === 'function') {
            (again as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).focus({ preventScroll: true });
        }
    }, 400);
}

function prefill(vendor?: VendorFormPrefill): VendorFormState {
    return {
        vendorId: vendor?.id ?? `VND-${Math.floor(2000 + Math.random() * 7000)}`,
        vendorName: vendor?.name ?? '',
        vendorType: vendor?.type ?? '',
        categories: vendor?.categories ?? [],
        primaryProject: vendor?.primaryProject ?? '',
        contactPerson: vendor?.contactPerson ?? '',
        phone: vendor?.phone ?? '',
        email: vendor?.email ?? '',
        address: vendor?.address ?? '',
        city: vendor?.city ?? '',
        state: vendor?.state ?? '',
        pincode: vendor?.pincode ?? '',
        country: vendor?.country ?? 'India',
        status: vendor?.status ?? 'Pending',
        onboardedDate: vendor?.onboardedDate ?? vendor?.createdAt ?? new Date().toISOString().slice(0, 10),
        notes: vendor?.notes ?? '',
    };
}

export function VendorFormPage() {
    const router = useRouter();
    const [state, setState] = useState<VendorFormState>(prefill());
    const [submitted, setSubmitted] = useState(false);
    const [savedDraft, setSavedDraft] = useState(false);
    const [openSections, setOpenSections] = useState({
        basic: true,
        address: true,
        status: true,
        notes: true,
    });

    const projectOptions = useMemo(() => getWorkOrderProjectOptions(), []);
    const validationErrors = useMemo(() => validateVendorForm(state), [state]);

    const setField = <K extends keyof VendorFormState>(key: K, value: VendorFormState[K]) => {
        let next = value;
        if (key === 'phone' && typeof value === 'string') next = value.replace(/\D/g, '').slice(0, 10) as VendorFormState[K];
        if (key === 'pincode' && typeof value === 'string') next = value.replace(/\D/g, '').slice(0, 6) as VendorFormState[K];
        setState((prev) => ({ ...prev, [key]: next }));
    };

    const toggleCategory = (category: string) => {
        setState((prev) => ({
            ...prev,
            categories: prev.categories.includes(category) ? prev.categories.filter((item) => item !== category) : [...prev.categories, category],
        }));
    };

    const title = 'Create Vendor';
    const errors = submitted ? validationErrors : {};
    const errorKeysOrdered = VENDOR_VALIDATION_ORDER.filter((k) => Boolean(errors[k]));

    const scrollToFieldKey = (fieldKey: keyof VendorFormState) => {
        flushSync(() => {
            setOpenSections((s) => ({
                ...s,
                basic: VENDOR_BASIC_FIELD_KEYS.some((k) => k === fieldKey) ? true : s.basic,
                address: VENDOR_ADDRESS_FIELD_KEYS.some((k) => k === fieldKey) ? true : s.address,
            }));
        });
        window.requestAnimationFrame(() => {
            focusVendorField(fieldKey);
        });
    };

    const runSubmit = () => {
        setSubmitted(true);
        const nextErrors = validateVendorForm(state);
        if (Object.keys(nextErrors).length > 0) {
            const firstKey = VENDOR_VALIDATION_ORDER.find((k) => Boolean(nextErrors[k]));
            if (firstKey) {
                flushSync(() => {
                    setOpenSections((s) => ({
                        ...s,
                        basic: VENDOR_BASIC_FIELD_KEYS.some((k) => nextErrors[k]) ? true : s.basic,
                        address: VENDOR_ADDRESS_FIELD_KEYS.some((k) => nextErrors[k]) ? true : s.address,
                    }));
                });
                window.requestAnimationFrame(() => {
                    focusVendorField(firstKey);
                });
            }
            return;
        }
        saveVendorFromForm(state);
        setSavedDraft(false);
        router.push(`/company-admin/vendors/${encodeURIComponent(state.vendorId)}`);
    };

    const validationSummaryEl =
        submitted && errorKeysOrdered.length > 0 ? (
            <div className="rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm">
                <p className="font-semibold">Please complete required fields before saving vendor.</p>
                <p className="mt-2 text-[13px]">
                    {errorKeysOrdered.map((k, i) => (
                        <span key={k}>
                            {i > 0 ? <span className="mx-1 text-amber-700/50">·</span> : null}
                            <button
                                type="button"
                                className="font-semibold text-[var(--cta-button-bg)] underline decoration-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] underline-offset-2"
                                onClick={() => scrollToFieldKey(k)}
                            >
                                {VENDOR_FIELD_LABELS[k] ?? String(k)}
                            </button>
                        </span>
                    ))}
                </p>
            </div>
        ) : null;

    return (
        <CrmFieldProvider>
            <div className="mb-4">
                <Breadcrumb items={[{ label: 'Vendor Management', href: '/company-admin/vendors/list' }, { label: title }]} />
            </div>

            <header className="mb-3 border-b border-gray-200/80 bg-white px-4 py-3 max-w-4xl mx-auto rounded-xl lg:px-6">
                <div className="flex flex-row items-start justify-between gap-3 sm:gap-4">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
                    <Link
                        href="/company-admin/vendors/list"
                        className="inline-flex shrink-0 items-center border border-[color-mix(in_srgb,var(--cta-button-bg)_12%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2 py-1 rounded-md pt-1 text-sm font-semibold text-[var(--cta-button-bg)] transition hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)]"
                    >
                        <LuArrowLeft className="h-4 w-4" aria-hidden />
                        Back to list
                    </Link>
                </div>
            </header>

            <div className="mx-auto w-full max-w-4xl pb-8">
                <form
                    className="space-y-6"
                    onSubmit={(e) => {
                        e.preventDefault();
                        runSubmit();
                    }}
                >
                    {validationSummaryEl}

                    <FormCollapsibleSection
                        layout="card"
                        title="Basic information"
                        icon={LuUser}
                        tone="blue"
                        open={openSections.basic}
                        onOpenChange={(v) => setOpenSections((s) => ({ ...s, basic: v }))}
                    >
                        <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <InputField id="vendor-id" label="Vendor ID" value={state.vendorId} readOnly />
                            <InputField
                                id="vendor-name"
                                label="Vendor name"
                                required
                                value={state.vendorName}
                                onChange={(e) => setField('vendorName', e.target.value)}
                                error={errors.vendorName}
                            />
                            <SelectField
                                id="vendor-type"
                                label="Vendor type"
                                required
                                value={state.vendorType}
                                onChange={(e) => setField('vendorType', e.target.value)}
                                options={['Contractor', 'Supplier']}
                                placeholder="Select type"
                                error={errors.vendorType}
                            />
                            <div id="vendor-categories" className="space-y-2 sm:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Categories <span className="text-rose-500">*</span>
                                </label>
                                <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 sm:gap-2 sm:p-3">
                                    {VENDOR_CATEGORIES.map((category) => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => toggleCategory(category)}
                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition sm:px-3 ${state.categories.includes(category) ? 'bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] shadow-sm' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'}`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                                {errors.categories ? <p className="mt-1.5 text-xs font-medium text-red-600">{errors.categories}</p> : null}
                            </div>
                            <SelectField
                                id="vendor-primary-project"
                                label="Primary project"
                                required
                                value={state.primaryProject}
                                onChange={(e) => setField('primaryProject', e.target.value)}
                                options={projectOptions}
                                placeholder="Select project"
                                error={errors.primaryProject}
                            />
                            <InputField
                                id="contact-person"
                                label="Contact person"
                                required
                                value={state.contactPerson}
                                onChange={(e) => setField('contactPerson', e.target.value)}
                                error={errors.contactPerson}
                            />
                            <InputField
                                id="phone"
                                label="Phone"
                                required
                                value={state.phone}
                                onChange={(e) => setField('phone', e.target.value)}
                                error={errors.phone}
                                inputMode="numeric"
                                maxLength={10}
                            />
                            <InputField
                                id="email"
                                label="Email"
                                value={state.email}
                                onChange={(e) => setField('email', e.target.value)}
                                className="sm:col-span-2"
                                error={errors.email}
                            />
                        </div>
                    </FormCollapsibleSection>

                    <FormCollapsibleSection
                        layout="card"
                        title="Address"
                        icon={LuMapPin}
                        tone="amber"
                        open={openSections.address}
                        onOpenChange={(v) => setOpenSections((s) => ({ ...s, address: v }))}
                    >
                        <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <TextAreaField
                                id="address"
                                label="Street address"
                                value={state.address}
                                onChange={(e) => setField('address', e.target.value)}
                                className="sm:col-span-2"
                                rows={2}
                            />
                            <InputField id="city" label="City" required value={state.city} onChange={(e) => setField('city', e.target.value)} error={errors.city} />
                            <InputField id="state" label="State" value={state.state} onChange={(e) => setField('state', e.target.value)} />
                            <InputField
                                id="pincode"
                                label="Pincode"
                                value={state.pincode}
                                onChange={(e) => setField('pincode', e.target.value)}
                                error={errors.pincode}
                                inputMode="numeric"
                                maxLength={6}
                            />
                            <InputField id="country" label="Country" value={state.country} onChange={(e) => setField('country', e.target.value)} />
                        </div>
                    </FormCollapsibleSection>

                    <FormCollapsibleSection
                        layout="card"
                        title="Status"
                        icon={LuBuilding2}
                        tone="blue"
                        open={openSections.status}
                        onOpenChange={(v) => setOpenSections((s) => ({ ...s, status: v }))}
                    >
                        <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <SelectField
                                id="status"
                                label="Vendor status"
                                value={state.status}
                                onChange={(e) => setField('status', e.target.value)}
                                options={['Pending', 'Active', 'Inactive']}
                            />
                            <InputField id="onboarded" label="Onboarded date" value={state.onboardedDate} readOnly />
                        </div>
                    </FormCollapsibleSection>

                    <FormCollapsibleSection
                        layout="card"
                        title="Internal notes"
                        icon={LuStickyNote}
                        tone="slate"
                        open={openSections.notes}
                        onOpenChange={(v) => setOpenSections((s) => ({ ...s, notes: v }))}
                    >
                        <TextAreaField id="notes" label="Notes" value={state.notes} onChange={(e) => setField('notes', e.target.value)} rows={3} />
                    </FormCollapsibleSection>

                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-5">
                        <div className="flex gap-3 text-sm text-gray-600">
                            <LuInfo className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                            <p className="min-w-0 leading-relaxed">
                                Compliance documents can be added after save from{' '}
                                <span className="font-semibold text-gray-900">Vendor → Compliance</span> or the vendor profile.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 border-t border-gray-200 pt-6">
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="min-h-5 text-xs text-gray-500">
                                {savedDraft ? (
                                    <>
                                        Draft saved (demo) · <span className="tabular-nums text-gray-700">this session</span>
                                    </>
                                ) : (
                                    'Save a draft anytime — create vendor validates required fields.'
                                )}
                            </p>
                        </div>
                        <div className="flex flex-col-reverse flex-wrap gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <Button
                                type="button"
                                variant="companyGhost"
                                size="cta"
                                onClick={() => router.push('/company-admin/vendors/list')}
                                className="h-12 rounded-xl px-4 text-sm font-medium text-gray-600"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="companyOutline"
                                size="cta"
                                onClick={() => setSavedDraft(true)}
                                className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm hover:border-[color-mix(in_srgb,var(--cta-button-bg)_38%,transparent)]"
                            >
                                Save draft
                            </Button>
                            <Button type="submit" variant="company" size="cta" className="h-12 min-w-44 rounded-xl font-semibold shadow-md shadow-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]">
                                Create vendor
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </CrmFieldProvider>
    );
}
