'use client';

import React from 'react';
import { EditableField, EditableSelect, EditableTextarea } from '@/components/leads/detail/InlineEditableSection';
import { SUPPLIER_CATEGORIES } from '@/lib/suppliers/mockData';
import type { SupplierRecord, SupplierStatus, SupplierType } from '@/lib/suppliers/types';
import { OverviewCollapsibleSection, OverviewFieldRow } from '@/components/suppliers/supplierOverviewLayout';
import { cn } from '@/lib/utils';
import { LuUser } from 'react-icons/lu';

const EMPTY_FIELD = '—';

export type SupplierInlineDraft = {
    name: string;
    type: SupplierType;
    categories: string[];
    contactPerson: string;
    phone: string;
    email: string;
    city: string;
    status: SupplierStatus;
    address: string;
};

export type SupplierInlineErrorKey = keyof SupplierInlineDraft;

export const SUPPLIER_INLINE_FIELD_IDS: Record<SupplierInlineErrorKey, string> = {
    name: 'supplier-inline-name',
    type: 'supplier-inline-type',
    categories: 'supplier-inline-categories',
    contactPerson: 'supplier-inline-contact-person',
    phone: 'supplier-inline-phone',
    email: 'supplier-inline-email',
    city: 'supplier-inline-city',
    status: 'supplier-inline-status',
    address: 'supplier-inline-address',
};

export function buildSupplierInlineDraft(s: SupplierRecord): SupplierInlineDraft {
    return {
        name: s.name ?? '',
        type: s.type,
        categories: s.categories ?? [],
        contactPerson: s.contactPerson ?? '',
        phone: s.phone ?? '',
        email: s.email ?? '',
        city: s.city ?? '',
        status: s.status,
        address: s.address ?? '',
    };
}

export function SupplierInlineOverviewEditor({
    supplier,
    isEditing,
    draft,
    errors,
    onDraftChange,
    changedByKey,
    typeOptions,
    statusOptions,
    suppressEditingChrome,
}: {
    supplier: SupplierRecord;
    isEditing: boolean;
    /** When true, parent supplies edit-mode border/background (overview page wraps multiple sections). */
    suppressEditingChrome?: boolean;
    draft: SupplierInlineDraft;
    errors: Partial<Record<SupplierInlineErrorKey, string>>;
    onDraftChange: <K extends SupplierInlineErrorKey>(key: K, value: SupplierInlineDraft[K]) => void;
    changedByKey?: Partial<Record<SupplierInlineErrorKey, boolean>>;
    typeOptions: SupplierType[];
    statusOptions: SupplierStatus[];
}) {
    const [detailsOpen, setDetailsOpen] = React.useState(true);
    const requiredErrors = ['name', 'contactPerson', 'phone', 'type', 'categories', 'status', 'city'].filter((k) => Boolean(errors[k as SupplierInlineErrorKey])).length;

    return (
        <div
            className={cn(
                'flex min-h-0 flex-1 flex-col',
                isEditing && !suppressEditingChrome && 'rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] p-3',
            )}
        >
            <div className="min-h-0 flex-1 space-y-4">
                <OverviewCollapsibleSection
                    title="SUPPLIER DETAILS"
                    icon={LuUser}
                    tone="blue"
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                    headerRight={
                        isEditing && requiredErrors > 0 ? (
                            <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                {requiredErrors} required
                            </span>
                        ) : null
                    }
                >
                    <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2">
                        <OverviewFieldRow label="Supplier ID">
                            <span className="font-mono text-sm tracking-tight text-gray-900">{supplier.id}</span>
                        </OverviewFieldRow>
                        <OverviewFieldRow label="Supplier Name" required>
                            <EditableField
                                id={SUPPLIER_INLINE_FIELD_IDS.name}
                                isEditing={isEditing}
                                error={errors.name}
                                isChanged={changedByKey?.name}
                                value={draft.name}
                                onChange={(v) => onDraftChange('name', v)}
                                readValue={supplier.name?.trim() ? <span className="text-base font-semibold text-gray-900">{supplier.name}</span> : EMPTY_FIELD}
                            />
                        </OverviewFieldRow>
                        <OverviewFieldRow label="Supplier Type" required>
                            <EditableSelect
                                id={SUPPLIER_INLINE_FIELD_IDS.type}
                                isEditing={isEditing}
                                error={errors.type}
                                isChanged={changedByKey?.type}
                                value={draft.type}
                                onChange={(v) => onDraftChange('type', v as SupplierType)}
                                options={typeOptions}
                                readValue={supplier.type || EMPTY_FIELD}
                            />
                        </OverviewFieldRow>
                        <OverviewFieldRow label="Material Categories" required className="xl:col-span-2">
                            {isEditing ? (
                                <div className="w-full">
                                    <div className="flex flex-wrap gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] bg-gray-50 p-2 shadow-sm">
                                        {SUPPLIER_CATEGORIES.map((category) => {
                                            const on = draft.categories.includes(category);
                                            return (
                                                <button
                                                    key={category}
                                                    type="button"
                                                    onClick={() => {
                                                        const next = on ? draft.categories.filter((c) => c !== category) : [...draft.categories, category];
                                                        onDraftChange('categories', next);
                                                    }}
                                                    className={cn(
                                                        'rounded-full px-2.5 py-1 text-xs font-semibold transition sm:px-3',
                                                        on ? 'bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] shadow-sm' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100',
                                                    )}
                                                >
                                                    {category}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.categories ? <p className="mt-1 text-xs font-medium text-rose-600">{errors.categories}</p> : null}
                                </div>
                            ) : (
                                <>{supplier.categories?.length ? supplier.categories.join(', ') : EMPTY_FIELD}</>
                            )}
                        </OverviewFieldRow>
                        <OverviewFieldRow label="Contact Person" required>
                            <EditableField
                                id={SUPPLIER_INLINE_FIELD_IDS.contactPerson}
                                isEditing={isEditing}
                                error={errors.contactPerson}
                                isChanged={changedByKey?.contactPerson}
                                value={draft.contactPerson}
                                onChange={(v) => onDraftChange('contactPerson', v)}
                                readValue={supplier.contactPerson?.trim() ? supplier.contactPerson : EMPTY_FIELD}
                            />
                        </OverviewFieldRow>
                        <OverviewFieldRow label="Phone Number" required>
                            <EditableField
                                id={SUPPLIER_INLINE_FIELD_IDS.phone}
                                isEditing={isEditing}
                                error={errors.phone}
                                isChanged={changedByKey?.phone}
                                value={draft.phone}
                                onChange={(v) => onDraftChange('phone', v.replace(/\D/g, '').slice(0, 10))}
                                type="tel"
                                readValue={
                                    supplier.phone?.trim() ? (
                                        <a href={`tel:${supplier.phone.replace(/\s/g, '')}`} className="hover:text-[var(--cta-button-bg)] hover:underline">
                                            {supplier.phone}
                                        </a>
                                    ) : (
                                        EMPTY_FIELD
                                    )
                                }
                            />
                        </OverviewFieldRow>
                        <OverviewFieldRow label="Email">
                            <EditableField
                                id={SUPPLIER_INLINE_FIELD_IDS.email}
                                isEditing={isEditing}
                                error={errors.email}
                                isChanged={changedByKey?.email}
                                value={draft.email}
                                onChange={(v) => onDraftChange('email', v)}
                                type="email"
                                readValue={
                                    supplier.email?.trim() ? (
                                        <a href={`mailto:${supplier.email}`} className="hover:text-[var(--cta-button-bg)] hover:underline">
                                            {supplier.email}
                                        </a>
                                    ) : (
                                        EMPTY_FIELD
                                    )
                                }
                            />
                        </OverviewFieldRow>
                        <OverviewFieldRow label="Address" className="xl:col-span-2">
                            <EditableTextarea
                                id={SUPPLIER_INLINE_FIELD_IDS.address}
                                isEditing={isEditing}
                                error={errors.address}
                                isChanged={changedByKey?.address}
                                value={draft.address}
                                onChange={(v) => onDraftChange('address', v)}
                                rows={2}
                                readValue={supplier.address?.trim() ? supplier.address : EMPTY_FIELD}
                            />
                        </OverviewFieldRow>
                        <OverviewFieldRow label="City" required>
                            <EditableField
                                id={SUPPLIER_INLINE_FIELD_IDS.city}
                                isEditing={isEditing}
                                error={errors.city}
                                isChanged={changedByKey?.city}
                                value={draft.city}
                                onChange={(v) => onDraftChange('city', v)}
                                readValue={supplier.city?.trim() ? supplier.city : EMPTY_FIELD}
                            />
                        </OverviewFieldRow>
                        <OverviewFieldRow label="Status" required>
                            <EditableSelect
                                id={SUPPLIER_INLINE_FIELD_IDS.status}
                                isEditing={isEditing}
                                error={errors.status}
                                isChanged={changedByKey?.status}
                                value={draft.status}
                                onChange={(v) => onDraftChange('status', v as SupplierStatus)}
                                options={statusOptions}
                                readValue={supplier.status || EMPTY_FIELD}
                            />
                        </OverviewFieldRow>
                        <OverviewFieldRow label="Onboarded Date" className="xl:col-span-2">
                            <span className="font-medium text-gray-900">{supplier.createdAt}</span>
                        </OverviewFieldRow>
                    </div>
                </OverviewCollapsibleSection>
            </div>
        </div>
    );
}

