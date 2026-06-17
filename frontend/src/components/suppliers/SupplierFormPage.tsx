'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { CrmFieldProvider, InputField, SelectField, TextAreaField } from '@/components/forms/Fields';
import { FormCollapsibleSection } from '@/components/forms/FormCollapsibleSection';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { SUPPLIER_CATEGORIES } from '@/lib/suppliers/mockData';
import type { SupplierRecord, SupplierStatus, SupplierType } from '@/lib/suppliers/types';
import { getSupplierRecordById, saveSupplierFromForm, SUPPLIER_STORE_UPDATED_EVENT } from '@/lib/suppliers/supplierStore';
import { LuArrowLeft, LuInfo, LuMapPin, LuUser } from 'react-icons/lu';

const SUPPLIER_TYPES: SupplierType[] = ['Manufacturer', 'Distributor', 'Trader', 'Service'];
const STATUS_OPTIONS: SupplierStatus[] = ['Active', 'Inactive', 'Pending', 'Suspended'];

type FormState = {
    supplierId: string;
    supplierName: string;
    supplierType: string;
    categories: string[];
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    status: SupplierStatus;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const NAME_REGEX = /^[A-Za-z][A-Za-z\s.&'-]*$/;
const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALIDATION_ORDER: (keyof FormState)[] = ['supplierName', 'supplierType', 'categories', 'contactPerson', 'phone', 'email', 'city', 'status'];

function validate(state: FormState): FormErrors {
    const errors: FormErrors = {};
    if (!state.supplierName.trim()) errors.supplierName = 'Supplier name is required.';
    else if (!NAME_REGEX.test(state.supplierName.trim())) errors.supplierName = 'Use letters and common name characters only.';
    if (!state.supplierType.trim()) errors.supplierType = 'Supplier type is required.';
    if (state.categories.length === 0) errors.categories = 'Select at least one category.';
    if (!state.contactPerson.trim()) errors.contactPerson = 'Contact person is required.';
    else if (!NAME_REGEX.test(state.contactPerson.trim())) errors.contactPerson = 'Use letters and common name characters only.';
    if (!state.phone.trim()) errors.phone = 'Phone is required (10 digits).';
    else if (!PHONE_REGEX.test(state.phone.trim())) errors.phone = 'Enter a valid 10-digit mobile number.';
    if (state.email.trim() && !EMAIL_REGEX.test(state.email.trim())) errors.email = 'Enter a valid email address.';
    if (!state.city.trim()) errors.city = 'City is required.';
    return errors;
}

function prefillFrom(record?: SupplierRecord, newId?: string): FormState {
    return {
        supplierId: record?.id ?? newId ?? `SUP-${Math.floor(3000 + Math.random() * 7000)}`,
        supplierName: record?.name ?? '',
        supplierType: record?.type ?? '',
        categories: record?.categories ?? [],
        contactPerson: record?.contactPerson ?? '',
        phone: record?.phone ?? '',
        email: record?.email ?? '',
        address: record?.address ?? '',
        city: record?.city ?? '',
        status: record?.status ?? 'Pending',
    };
}

const SCROLL_OFF = 96;
function focusField(key: keyof FormState) {
    const idMap: Partial<Record<keyof FormState, string>> = {
        supplierName: 'supplier-name',
        supplierType: 'supplier-type',
        categories: 'supplier-categories',
        contactPerson: 'contact-person',
        phone: 'phone',
        email: 'email',
        city: 'city',
        status: 'supplier-status',
    };
    const id = idMap[key];
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFF;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    window.setTimeout(() => {
        if (key === 'categories') {
            const wrap = document.getElementById(id);
            const btn = wrap?.querySelector('button');
            (btn as HTMLButtonElement | undefined)?.focus({ preventScroll: true });
            return;
        }
        const again = document.getElementById(id);
        if (again && 'focus' in again) (again as HTMLInputElement).focus({ preventScroll: true });
    }, 350);
}

export function SupplierFormPage({ editSupplierId }: { editSupplierId?: string }) {
    const router = useRouter();
    const isEdit = Boolean(editSupplierId?.trim());
    const [listTick, setListTick] = useState(0);
    const existing = useMemo(
        () => (editSupplierId?.trim() ? getSupplierRecordById(editSupplierId.trim()) : undefined),
        [editSupplierId, listTick],
    );

    useEffect(() => {
        const sync = () => setListTick((x) => x + 1);
        window.addEventListener(SUPPLIER_STORE_UPDATED_EVENT, sync);
        return () => window.removeEventListener(SUPPLIER_STORE_UPDATED_EVENT, sync);
    }, []);

    const [state, setState] = useState<FormState>(() => {
        const id = editSupplierId?.trim();
        if (id) {
            const r = getSupplierRecordById(id);
            if (r) return prefillFrom(r);
        }
        return prefillFrom(undefined);
    });
    const [submitted, setSubmitted] = useState(false);
    const [savedDraft, setSavedDraft] = useState(false);
    const [openSections, setOpenSections] = useState({ basic: true, address: true });
    const [toast, setToast] = useState<{ msg: string; err: boolean } | null>(null);

    useEffect(() => {
        if (!editSupplierId?.trim()) {
            setState(prefillFrom(undefined));
        } else if (existing) {
            setState(prefillFrom(existing));
        }
        setSubmitted(false);
        setSavedDraft(false);
    }, [editSupplierId, existing?.id]);

    const errors = submitted ? validate(state) : {};
    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        let next = value;
        if (key === 'phone' && typeof value === 'string') next = value.replace(/\D/g, '').slice(0, 10) as FormState[K];
        setState((prev) => ({ ...prev, [key]: next }));
    };

    const toggleCategory = (category: string) => {
        setState((prev) => ({
            ...prev,
            categories: prev.categories.includes(category) ? prev.categories.filter((c) => c !== category) : [...prev.categories, category],
        }));
    };

    const title = isEdit ? 'Edit supplier' : 'Create supplier';

    const runSubmit = () => {
        setSubmitted(true);
        const nextErrors = validate(state);
        const first = VALIDATION_ORDER.find((k) => Boolean(nextErrors[k]));
        if (first) {
            flushSync(() => setOpenSections({ basic: true, address: true }));
            window.requestAnimationFrame(() => focusField(first));
            return;
        }
        saveSupplierFromForm({
            supplierId: state.supplierId,
            supplierName: state.supplierName,
            supplierType: state.supplierType,
            categories: state.categories,
            contactPerson: state.contactPerson,
            phone: state.phone,
            email: state.email,
            address: state.address,
            city: state.city,
            status: state.status,
        });
        setSavedDraft(false);
        setToast({ msg: isEdit ? 'Supplier updated.' : 'Supplier created.', err: false });
        window.setTimeout(() => {
            router.push(`/company-admin/suppliers/${encodeURIComponent(state.supplierId)}`);
        }, 500);
    };

    const validationSummary =
        submitted && Object.keys(errors).length > 0 ? (
            <div className="rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm">
                <p className="font-semibold">Please fix the highlighted fields.</p>
                <p className="mt-2 text-[13px]">
                                {VALIDATION_ORDER.filter((k) => errors[k]).map((k, i) => {
                        const label =
                            k === 'supplierName'
                                ? 'Supplier name'
                                : k === 'supplierType'
                                  ? 'Supplier type'
                                  : k === 'categories'
                                    ? 'Categories'
                                    : k === 'contactPerson'
                                      ? 'Contact person'
                                      : k === 'phone'
                                        ? 'Phone'
                                        : k === 'email'
                                          ? 'Email'
                                          : k === 'city'
                                            ? 'City'
                                            : 'Status';
                        return (
                            <span key={k}>
                                {i > 0 ? <span className="mx-1 text-amber-700/50">·</span> : null}
                                <button
                                    type="button"
                                    className="font-semibold text-[var(--cta-button-bg)] underline decoration-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] underline-offset-2"
                                    onClick={() => focusField(k)}
                                >
                                    {label}
                                </button>
                            </span>
                        );
                    })}
                </p>
            </div>
        ) : null;

    if (isEdit && !existing) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                <p>Supplier not found.</p>
                <Link href="/company-admin/suppliers/list" className="mt-3 inline-block font-medium text-[var(--cta-button-bg)] underline-offset-2 hover:underline">
                    Back to supplier list
                </Link>
            </div>
        );
    }

    return (
        <CrmFieldProvider>
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={() => setToast(null)} /> : null}
            <div className="mb-4">
                <Breadcrumb items={[{ label: 'Supplier Management', href: '/company-admin/suppliers/list' }, { label: title }]} />
            </div>

            <header className="mx-auto mb-3 max-w-4xl rounded-xl border-b border-gray-200/80 bg-white px-4 py-3 lg:px-6">
                <div className="flex flex-row items-start justify-between gap-3 sm:gap-4">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
                    <Link
                        href="/company-admin/suppliers/list"
                        className="inline-flex shrink-0 items-center rounded-md border border-[color-mix(in_srgb,var(--cta-button-bg)_12%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2 py-1 pt-1 text-sm font-semibold text-[var(--cta-button-bg)] transition hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)]"
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
                    {validationSummary}

                    <FormCollapsibleSection
                        layout="card"
                        title="Supplier details"
                        icon={LuUser}
                        tone="blue"
                        open={openSections.basic}
                        onOpenChange={(v) => setOpenSections((s) => ({ ...s, basic: v }))}
                    >
                        <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <InputField id="supplier-id" label="Supplier ID" value={state.supplierId} readOnly />
                            <InputField
                                id="supplier-name"
                                label="Supplier name"
                                required
                                value={state.supplierName}
                                onChange={(e) => setField('supplierName', e.target.value)}
                                error={errors.supplierName}
                            />
                            <SelectField
                                id="supplier-type"
                                label="Supplier type"
                                required
                                value={state.supplierType}
                                onChange={(e) => setField('supplierType', e.target.value)}
                                options={SUPPLIER_TYPES}
                                placeholder="Select type"
                                error={errors.supplierType}
                            />
                            <div id="supplier-categories" className="space-y-2 sm:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                                    Categories <span className="text-rose-500">*</span>
                                </label>
                                <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 sm:gap-2 sm:p-3">
                                    {SUPPLIER_CATEGORIES.map((category) => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => toggleCategory(category)}
                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition sm:px-3 ${
                                                state.categories.includes(category)
                                                    ? 'bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] shadow-sm'
                                                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                                {errors.categories ? <p className="mt-1.5 text-xs font-medium text-red-600">{errors.categories}</p> : null}
                            </div>
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
                        title="Address & status"
                        icon={LuMapPin}
                        tone="amber"
                        open={openSections.address}
                        onOpenChange={(v) => setOpenSections((s) => ({ ...s, address: v }))}
                    >
                        <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <TextAreaField
                                id="address"
                                label="Address"
                                value={state.address}
                                onChange={(e) => setField('address', e.target.value)}
                                className="sm:col-span-2"
                                rows={3}
                            />
                            <InputField id="city" label="City" required value={state.city} onChange={(e) => setField('city', e.target.value)} error={errors.city} />
                            <div>
                                <SelectField
                                    id="supplier-status"
                                    label="Status"
                                    value={state.status}
                                    onChange={(e) => setField('status', e.target.value as SupplierStatus)}
                                    options={STATUS_OPTIONS}
                                />
                                <p className="mt-1.5 text-xs text-slate-500">Use status to control sourcing eligibility.</p>
                            </div>
                        </div>
                    </FormCollapsibleSection>

                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-5">
                        <div className="flex gap-3 text-sm text-gray-600">
                            <LuInfo className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                            <p className="min-w-0 leading-relaxed">
                                Materials, pricing, capacity, and compliance live on the{' '}
                                <span className="font-semibold text-gray-900">supplier profile tabs</span> after save.
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
                                    'Save a draft anytime — create supplier validates required fields.'
                                )}
                            </p>
                        </div>
                        <div className="flex flex-col-reverse flex-wrap gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <Button
                                type="button"
                                variant="companyGhost"
                                size="cta"
                                onClick={() => router.push('/company-admin/suppliers/list')}
                                className="h-12 rounded-xl px-4 text-sm font-medium text-gray-600"
                            >
                                Cancel
                            </Button>
                            {!isEdit ? (
                                <Button
                                    type="button"
                                    variant="companyOutline"
                                    size="cta"
                                    onClick={() => setSavedDraft(true)}
                                    className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm hover:border-[color-mix(in_srgb,var(--cta-button-bg)_38%,transparent)]"
                                >
                                    Save draft
                                </Button>
                            ) : null}
                            <Button type="submit" variant="company" size="cta" className="h-12 min-w-44 rounded-xl font-semibold shadow-md shadow-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]">
                                {isEdit ? 'Save changes' : 'Create supplier'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </CrmFieldProvider>
    );
}
