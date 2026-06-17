'use client';

import React from 'react';
import { EditableField, EditableSelect, EditableTextarea } from '@/components/leads/detail/InlineEditableSection';
import { VendorStatusBadge } from '@/components/vendors/VendorShared';
import type { VendorRecord } from '@/lib/vendors/vendorStore';
import type { VendorStatus, VendorType } from '@/lib/vendors/types';
import { LuBuilding2, LuChevronDown, LuMapPin, LuStickyNote, LuUser } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const EMPTY = '—';

type InfoItemProps = {
    children: React.ReactNode;
    className?: string;
    label: string;
    required?: boolean;
};

function FieldRow({ label, required, children, className }: InfoItemProps) {
    return (
        <div
            className={cn(
                'flex w-full items-center gap-3 border-b border-gray-200/80 px-3 py-2.5',
                'odd:bg-gray-50/50',
                className,
            )}
        >
            <div className="w-44 shrink-0 text-sm font-medium text-gray-500">
                <span className="inline-flex items-baseline gap-0.5">
                    {label}
                    {required ? (
                        <span className="text-rose-500" aria-hidden>
                            *
                        </span>
                    ) : null}
                </span>
            </div>
            <div className="flex w-full items-center gap-2 text-[15px] font-medium text-gray-900">
                <span className="text-gray-300" aria-hidden>
                    :
                </span>
                <span className="w-full">{children}</span>
            </div>
        </div>
    );
}

function InlineCollapsibleSection({
    title,
    icon: Icon,
    tone = 'slate',
    open,
    onOpenChange,
    headerRight,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    tone?: 'blue' | 'amber' | 'slate';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    headerRight?: React.ReactNode;
    children: React.ReactNode;
}) {
    const toneClasses =
        tone === 'blue'
            ? { head: 'bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]', icon: 'text-[var(--cta-button-bg)]', ring: 'ring-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]' }
            : tone === 'amber'
              ? { head: 'bg-amber-50/80', icon: 'text-amber-800', ring: 'ring-amber-100/80' }
              : { head: 'bg-slate-50/80', icon: 'text-slate-700', ring: 'ring-slate-200/70' };

    return (
        <section className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-none">
            <button
                type="button"
                onClick={() => onOpenChange(!open)}
                aria-expanded={open}
                className={cn(
                    'flex w-full items-center gap-2.5 border-b border-gray-300 px-3 py-2 text-left',
                    'transition hover:brightness-[0.99]',
                    toneClasses.head,
                )}
            >
                <span
                    className={cn(
                        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/90 ring-1',
                        toneClasses.ring,
                    )}
                    aria-hidden
                >
                    <Icon className={cn('h-4 w-4', toneClasses.icon)} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-semibold tracking-wide text-gray-800">{title}</span>
                        {headerRight ? <span className="ml-auto shrink-0">{headerRight}</span> : null}
                    </span>
                </span>
                <LuChevronDown
                    className={cn('h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200', open && 'rotate-180')}
                    aria-hidden
                />
            </button>
            <div hidden={!open} className="bg-white">
                {children}
            </div>
        </section>
    );
}

export type VendorInlineDraft = {
    name: string;
    type: VendorType;
    categoriesCsv: string;
    primaryProject: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    status: VendorStatus;
    onboardedDate: string;
    notes: string;
};

export type VendorInlineErrorKey = keyof Omit<VendorInlineDraft, never>;

export const VENDOR_INLINE_FIELD_IDS: Record<VendorInlineErrorKey, string> = {
    name: 'vendor-inline-name',
    type: 'vendor-inline-type',
    categoriesCsv: 'vendor-inline-categories',
    primaryProject: 'vendor-inline-primary-project',
    contactPerson: 'vendor-inline-contact',
    phone: 'vendor-inline-phone',
    email: 'vendor-inline-email',
    address: 'vendor-inline-address',
    city: 'vendor-inline-city',
    state: 'vendor-inline-state',
    pincode: 'vendor-inline-pincode',
    country: 'vendor-inline-country',
    status: 'vendor-inline-status',
    onboardedDate: 'vendor-inline-onboarded',
    notes: 'vendor-inline-notes',
};

export function buildVendorInlineDraft(v: VendorRecord): VendorInlineDraft {
    return {
        name: v.name,
        type: v.type,
        categoriesCsv: v.categories.join(', '),
        primaryProject: v.primaryProject ?? '',
        contactPerson: v.contactPerson,
        phone: v.phone,
        email: v.email,
        address: v.address ?? '',
        city: v.city,
        state: v.state,
        pincode: v.pincode ?? '',
        country: v.country,
        status: v.status,
        onboardedDate: v.onboardedDate ?? v.createdAt,
        notes: v.notes ?? '',
    };
}

export function categoriesCsvToList(csv: string): string[] {
    return csv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

type Props = {
    vendor: VendorRecord;
    isEditing: boolean;
    draft: VendorInlineDraft;
    errors: Partial<Record<VendorInlineErrorKey, string>>;
    onDraftChange: (key: keyof VendorInlineDraft, value: string) => void;
    changedByKey?: Partial<Record<VendorInlineErrorKey, boolean>>;
    typeOptions: VendorType[];
    statusOptions: VendorStatus[];
    projectOptions: string[];
};

export function VendorInlineOverviewEditor({
    vendor,
    isEditing,
    draft,
    errors,
    onDraftChange,
    changedByKey,
    typeOptions,
    statusOptions,
    projectOptions,
}: Props) {
    const fieldGrid = 'grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2';
    const [sectionsOpen, setSectionsOpen] = React.useState({
        general: true,
        classification: true,
        address: true,
        notes: true,
    });

    const generalErrCount = ['name', 'contactPerson', 'phone', 'email'].filter((k) => Boolean(errors[k as VendorInlineErrorKey])).length;
    const classErrCount = ['type', 'categoriesCsv', 'primaryProject', 'status', 'onboardedDate'].filter((k) =>
        Boolean(errors[k as VendorInlineErrorKey]),
    ).length;
    const addrErrCount = ['city', 'state', 'country', 'address', 'pincode'].filter((k) => Boolean(errors[k as VendorInlineErrorKey])).length;

    return (
        <div className={cn('flex min-h-0 flex-1 flex-col', isEditing && 'rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] p-3')}>
            <div className="min-h-0 flex-1">
                <div className="space-y-4">
                    <InlineCollapsibleSection
                        title="CONTACT & IDENTITY"
                        icon={LuUser}
                        tone="blue"
                        open={sectionsOpen.general}
                        onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, general: o }))}
                        headerRight={
                            isEditing && generalErrCount > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {generalErrCount} field{generalErrCount === 1 ? '' : 's'}
                                </span>
                            ) : null
                        }
                    >
                        <div className={fieldGrid}>
                            <FieldRow label="Vendor ID">
                                <span className="font-mono text-sm tracking-tight text-gray-900">{vendor.id}</span>
                            </FieldRow>
                            <FieldRow label="Vendor name" required>
                                <EditableField
                                    id={VENDOR_INLINE_FIELD_IDS.name}
                                    isEditing={isEditing}
                                    error={errors.name}
                                    isChanged={changedByKey?.name}
                                    value={draft.name}
                                    onChange={(value) => onDraftChange('name', value)}
                                    readValue={
                                        vendor.name?.trim() ? <span className="text-base font-semibold text-gray-900">{vendor.name}</span> : EMPTY
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Contact person" required>
                                <EditableField
                                    id={VENDOR_INLINE_FIELD_IDS.contactPerson}
                                    isEditing={isEditing}
                                    error={errors.contactPerson}
                                    isChanged={changedByKey?.contactPerson}
                                    value={draft.contactPerson}
                                    onChange={(value) => onDraftChange('contactPerson', value)}
                                    readValue={vendor.contactPerson?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Phone" required>
                                <EditableField
                                    id={VENDOR_INLINE_FIELD_IDS.phone}
                                    isEditing={isEditing}
                                    error={errors.phone}
                                    isChanged={changedByKey?.phone}
                                    value={draft.phone}
                                    onChange={(value) => onDraftChange('phone', value.replace(/\D/g, '').slice(0, 10))}
                                    type="tel"
                                    readValue={
                                        vendor.phone?.trim() ? (
                                            <a href={`tel:${vendor.phone.replace(/\s/g, '')}`} className="hover:text-[var(--cta-button-bg)] hover:underline">
                                                {vendor.phone}
                                            </a>
                                        ) : (
                                            EMPTY
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Email" required>
                                <EditableField
                                    id={VENDOR_INLINE_FIELD_IDS.email}
                                    isEditing={isEditing}
                                    error={errors.email}
                                    isChanged={changedByKey?.email}
                                    value={draft.email}
                                    onChange={(value) => onDraftChange('email', value)}
                                    type="email"
                                    readValue={
                                        vendor.email?.trim() ? (
                                            <a href={`mailto:${vendor.email}`} className="break-all hover:text-[var(--cta-button-bg)] hover:underline">
                                                {vendor.email}
                                            </a>
                                        ) : (
                                            EMPTY
                                        )
                                    }
                                />
                            </FieldRow>
                        </div>
                    </InlineCollapsibleSection>

                    <InlineCollapsibleSection
                        title="CLASSIFICATION"
                        icon={LuBuilding2}
                        tone="amber"
                        open={sectionsOpen.classification}
                        onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, classification: o }))}
                        headerRight={
                            isEditing && classErrCount > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {classErrCount} field{classErrCount === 1 ? '' : 's'}
                                </span>
                            ) : null
                        }
                    >
                        <div className={fieldGrid}>
                            <FieldRow label="Vendor type" required>
                                <EditableSelect
                                    id={VENDOR_INLINE_FIELD_IDS.type}
                                    isEditing={isEditing}
                                    error={errors.type}
                                    isChanged={changedByKey?.type}
                                    value={draft.type}
                                    onChange={(value) => onDraftChange('type', value)}
                                    options={typeOptions}
                                    readValue={vendor.type}
                                />
                            </FieldRow>
                            <FieldRow label="Categories" required>
                                <EditableField
                                    id={VENDOR_INLINE_FIELD_IDS.categoriesCsv}
                                    isEditing={isEditing}
                                    error={errors.categoriesCsv}
                                    isChanged={changedByKey?.categoriesCsv}
                                    value={draft.categoriesCsv}
                                    onChange={(value) => onDraftChange('categoriesCsv', value)}
                                    placeholder="Comma-separated, e.g. Electrical, HVAC"
                                    readValue={vendor.categories.length ? vendor.categories.join(', ') : EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Primary project" required>
                                <EditableSelect
                                    id={VENDOR_INLINE_FIELD_IDS.primaryProject}
                                    isEditing={isEditing}
                                    error={errors.primaryProject}
                                    isChanged={changedByKey?.primaryProject}
                                    value={draft.primaryProject}
                                    onChange={(value) => onDraftChange('primaryProject', value)}
                                    options={projectOptions}
                                    placeholder="Select project"
                                    readValue={vendor.primaryProject?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Status" required>
                                <EditableSelect
                                    id={VENDOR_INLINE_FIELD_IDS.status}
                                    isEditing={isEditing}
                                    error={errors.status}
                                    isChanged={changedByKey?.status}
                                    value={draft.status}
                                    onChange={(value) => onDraftChange('status', value)}
                                    options={statusOptions}
                                    readValue={<VendorStatusBadge status={vendor.status} />}
                                />
                            </FieldRow>
                            <FieldRow label="Onboarded date" required>
                                <EditableField
                                    id={VENDOR_INLINE_FIELD_IDS.onboardedDate}
                                    isEditing={isEditing}
                                    error={errors.onboardedDate}
                                    isChanged={changedByKey?.onboardedDate}
                                    value={draft.onboardedDate}
                                    onChange={(value) => onDraftChange('onboardedDate', value)}
                                    type="date"
                                    readValue={vendor.onboardedDate || vendor.createdAt}
                                />
                            </FieldRow>
                        </div>
                    </InlineCollapsibleSection>

                    <InlineCollapsibleSection
                        title="ADDRESS"
                        icon={LuMapPin}
                        tone="slate"
                        open={sectionsOpen.address}
                        onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, address: o }))}
                        headerRight={
                            isEditing && addrErrCount > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {addrErrCount} field{addrErrCount === 1 ? '' : 's'}
                                </span>
                            ) : null
                        }
                    >
                        <div className={fieldGrid}>
                            <FieldRow label="City" required>
                                <EditableField
                                    id={VENDOR_INLINE_FIELD_IDS.city}
                                    isEditing={isEditing}
                                    error={errors.city}
                                    isChanged={changedByKey?.city}
                                    value={draft.city}
                                    onChange={(value) => onDraftChange('city', value)}
                                    readValue={vendor.city?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="State">
                                <EditableField
                                    id={VENDOR_INLINE_FIELD_IDS.state}
                                    isEditing={isEditing}
                                    error={errors.state}
                                    isChanged={changedByKey?.state}
                                    value={draft.state}
                                    onChange={(value) => onDraftChange('state', value)}
                                    readValue={vendor.state?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Country" required>
                                <EditableField
                                    id={VENDOR_INLINE_FIELD_IDS.country}
                                    isEditing={isEditing}
                                    error={errors.country}
                                    isChanged={changedByKey?.country}
                                    value={draft.country}
                                    onChange={(value) => onDraftChange('country', value)}
                                    readValue={vendor.country?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Pincode">
                                <EditableField
                                    id={VENDOR_INLINE_FIELD_IDS.pincode}
                                    isEditing={isEditing}
                                    error={errors.pincode}
                                    isChanged={changedByKey?.pincode}
                                    value={draft.pincode}
                                    onChange={(value) => onDraftChange('pincode', value.replace(/\D/g, '').slice(0, 6))}
                                    readValue={vendor.pincode?.trim() || EMPTY}
                                />
                            </FieldRow>
                            <FieldRow label="Street address" className="xl:col-span-2">
                                <EditableTextarea
                                    id={VENDOR_INLINE_FIELD_IDS.address}
                                    isEditing={isEditing}
                                    error={errors.address}
                                    isChanged={changedByKey?.address}
                                    value={draft.address}
                                    onChange={(value) => onDraftChange('address', value)}
                                    rows={3}
                                    readValue={
                                        <span className="block whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-gray-900">
                                            {vendor.address?.trim() || EMPTY}
                                        </span>
                                    }
                                />
                            </FieldRow>
                        </div>
                    </InlineCollapsibleSection>

                    <InlineCollapsibleSection
                        title="INTERNAL NOTES"
                        icon={LuStickyNote}
                        tone="slate"
                        open={sectionsOpen.notes}
                        onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, notes: o }))}
                        headerRight={isEditing && errors.notes ? <span className="text-xs font-semibold text-red-600">Issue</span> : null}
                    >
                        <div className="overflow-hidden rounded-lg border border-gray-200/80">
                            <FieldRow label="Notes" className="items-start xl:col-span-2">
                                <EditableTextarea
                                    id={VENDOR_INLINE_FIELD_IDS.notes}
                                    isEditing={isEditing}
                                    error={errors.notes}
                                    isChanged={changedByKey?.notes}
                                    value={draft.notes}
                                    onChange={(value) => onDraftChange('notes', value)}
                                    rows={4}
                                    readValue={
                                        <span className="block whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-gray-900">
                                            {vendor.notes?.trim() || EMPTY}
                                        </span>
                                    }
                                />
                            </FieldRow>
                        </div>
                    </InlineCollapsibleSection>
                </div>
            </div>
        </div>
    );
}
