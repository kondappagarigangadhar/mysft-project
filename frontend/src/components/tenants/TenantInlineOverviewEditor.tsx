'use client';

import React from 'react';
import { EditableField, EditableSelect, EditableTextarea } from '@/components/leads/detail/InlineEditableSection';
import type { Company } from '@/data/mockData';
import StatusBadge from '@/components/ui/StatusBadge';
import { LuBuilding2, LuChevronDown, LuMapPin, LuUser } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const EMPTY_FIELD = '—';

export type TenantOverviewDraft = {
    tenantCode: string;
    businessType: Company['businessType'] | '';
    name: string;
    email: string;
    phone: string;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    domain: string;
    plan: Company['plan'] | '';
    storageLimit: string;
    maxUsers: string;
    status: Company['status'] | '';
    city: string;
    state: string;
    address: string;
    country: string;
};

export const TENANT_INLINE_FIELD_IDS: Record<keyof TenantOverviewDraft, string> = {
    tenantCode: 'tenant-field-tenantCode',
    businessType: 'tenant-field-businessType',
    name: 'tenant-field-name',
    email: 'tenant-field-email',
    phone: 'tenant-field-phone',
    adminName: 'tenant-field-adminName',
    adminEmail: 'tenant-field-adminEmail',
    adminPhone: 'tenant-field-adminPhone',
    domain: 'tenant-field-domain',
    plan: 'tenant-field-plan',
    storageLimit: 'tenant-field-storageLimit',
    maxUsers: 'tenant-field-maxUsers',
    status: 'tenant-field-status',
    city: 'tenant-field-city',
    state: 'tenant-field-state',
    address: 'tenant-field-address',
    country: 'tenant-field-country',
};

function FieldRow({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('flex w-full items-center gap-3 border-b border-gray-200/80 px-3 py-2.5 odd:bg-gray-50/50', className)}>
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

function TenantCollapsibleSection({
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
            ? {
                  head: 'bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]',
                  icon: 'text-[var(--cta-button-bg)]',
                  ring: 'ring-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]',
              }
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
                    'flex w-full items-center gap-2.5 border-b border-gray-300 px-3 py-2 text-left transition hover:brightness-[0.99]',
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

const BUSINESS_TYPES: Company['businessType'][] = ['Builder', 'Association', 'Developer'];
const PLAN_OPTIONS: Company['plan'][] = ['Basic', 'Pro', 'Enterprise'];
const STATUS_OPTIONS: Company['status'][] = ['Active', 'Pending', 'Suspended', 'Inactive'];

/** Leads-style row layout, collapsible sections, and `Editable*` inputs for view vs edit. */
export function TenantInlineOverviewEditor({
    company,
    isEditing,
    draft,
    errors,
    onDraftChange,
    changedByKey,
}: {
    company: Company;
    isEditing: boolean;
    draft: TenantOverviewDraft;
    errors: Partial<Record<keyof TenantOverviewDraft, string>>;
    onDraftChange: <K extends keyof TenantOverviewDraft>(key: K, value: TenantOverviewDraft[K]) => void;
    changedByKey?: Partial<Record<keyof TenantOverviewDraft, boolean>>;
}) {
    const fieldGrid = 'grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2';
    const [sectionsOpen, setSectionsOpen] = React.useState({
        tenant: true,
        admin: true,
        location: true,
    });

    const contactRequiredKeys: (keyof TenantOverviewDraft)[] = ['tenantCode', 'businessType', 'name', 'email', 'phone'];
    const adminRequiredKeys: (keyof TenantOverviewDraft)[] = ['adminName', 'adminEmail', 'adminPhone', 'plan', 'status'];
    const locationRequiredKeys: (keyof TenantOverviewDraft)[] = ['city', 'state'];

    const contactErrCount = contactRequiredKeys.filter((k) => Boolean(errors[k])).length;
    const adminErrCount = adminRequiredKeys.filter((k) => Boolean(errors[k])).length;
    const locErrCount = locationRequiredKeys.filter((k) => Boolean(errors[k])).length;

    const planRead = company.plan ? (
        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-blue-800">{company.plan}</span>
    ) : (
        EMPTY_FIELD
    );

    return (
        <div className={cn('flex min-h-0 flex-1 flex-col', isEditing && 'border-none shadow-none')}>
            <div className="min-h-0 flex-1">
                <div className="space-y-4">
                    <TenantCollapsibleSection
                        title="ORGANIZATION & CONTACT"
                        icon={LuUser}
                        tone="blue"
                        open={sectionsOpen.tenant}
                        onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, tenant: o }))}
                        headerRight={
                            isEditing && contactErrCount > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {contactErrCount} field{contactErrCount === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className={fieldGrid}>
                            <FieldRow label="Organization Name" required>
                                <EditableField
                                    id={TENANT_INLINE_FIELD_IDS.name}
                                    isEditing={isEditing}
                                    error={errors.name}
                                    isChanged={changedByKey?.name}
                                    value={draft.name}
                                    onChange={(v) => onDraftChange('name', v)}
                                    readValue={
                                        company.name?.trim() ? <span className="text-base font-semibold text-gray-900">{company.name}</span> : EMPTY_FIELD
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Organization Code" required>
                                <EditableField
                                    id={TENANT_INLINE_FIELD_IDS.tenantCode}
                                    isEditing={isEditing}
                                    error={errors.tenantCode}
                                    isChanged={changedByKey?.tenantCode}
                                    value={draft.tenantCode}
                                    onChange={(v) => onDraftChange('tenantCode', v.replace(/[^a-zA-Z0-9]/g, ''))}
                                    readValue={
                                        company.tenantCode?.trim() ? (
                                            <span className="font-mono text-sm font-semibold tracking-tight text-gray-900">{company.tenantCode}</span>
                                        ) : (
                                            EMPTY_FIELD
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Business Type" required>
                                <EditableSelect
                                    id={TENANT_INLINE_FIELD_IDS.businessType}
                                    isEditing={isEditing}
                                    error={errors.businessType}
                                    isChanged={changedByKey?.businessType}
                                    value={draft.businessType}
                                    onChange={(v) => onDraftChange('businessType', v as Company['businessType'])}
                                    placeholder="Select type"
                                    options={[...BUSINESS_TYPES]}
                                    readValue={company.businessType || EMPTY_FIELD}
                                />
                            </FieldRow>
                            <FieldRow label="Contact Email" required>
                                <EditableField
                                    id={TENANT_INLINE_FIELD_IDS.email}
                                    isEditing={isEditing}
                                    error={errors.email}
                                    isChanged={changedByKey?.email}
                                    value={draft.email}
                                    onChange={(v) => onDraftChange('email', v)}
                                    type="email"
                                    readValue={
                                        company.email?.trim() ? (
                                            <a href={`mailto:${company.email}`} className="break-all hover:text-[var(--cta-button-bg)] hover:underline">
                                                {company.email}
                                            </a>
                                        ) : (
                                            EMPTY_FIELD
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Contact Phone" required>
                                <EditableField
                                    id={TENANT_INLINE_FIELD_IDS.phone}
                                    isEditing={isEditing}
                                    error={errors.phone}
                                    isChanged={changedByKey?.phone}
                                    value={draft.phone}
                                    onChange={(v) => onDraftChange('phone', v.replace(/\D/g, '').slice(0, 10))}
                                    type="tel"
                                    readValue={
                                        company.phone?.trim() ? (
                                            <a href={`tel:${company.phone.replace(/\s/g, '')}`} className="hover:text-[var(--cta-button-bg)] hover:underline">
                                                {company.phone}
                                            </a>
                                        ) : (
                                            EMPTY_FIELD
                                        )
                                    }
                                />
                            </FieldRow>
                        </div>
                    </TenantCollapsibleSection>

                    <TenantCollapsibleSection
                        title="ADMIN & SUBSCRIPTION"
                        icon={LuBuilding2}
                        tone="amber"
                        open={sectionsOpen.admin}
                        onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, admin: o }))}
                        headerRight={
                            isEditing && adminErrCount > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {adminErrCount} field{adminErrCount === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className={fieldGrid}>
                            <FieldRow label="Admin name" required>
                                <EditableField
                                    id={TENANT_INLINE_FIELD_IDS.adminName}
                                    isEditing={isEditing}
                                    error={errors.adminName}
                                    isChanged={changedByKey?.adminName}
                                    value={draft.adminName}
                                    onChange={(v) => onDraftChange('adminName', v)}
                                    readValue={company.adminName?.trim() || EMPTY_FIELD}
                                />
                            </FieldRow>
                            <FieldRow label="Admin email" required>
                                <EditableField
                                    id={TENANT_INLINE_FIELD_IDS.adminEmail}
                                    isEditing={isEditing}
                                    error={errors.adminEmail}
                                    isChanged={changedByKey?.adminEmail}
                                    value={draft.adminEmail}
                                    onChange={(v) => onDraftChange('adminEmail', v)}
                                    type="email"
                                    readValue={
                                        company.adminEmail?.trim() ? (
                                            <a href={`mailto:${company.adminEmail}`} className="break-all hover:text-[var(--cta-button-bg)] hover:underline">
                                                {company.adminEmail}
                                            </a>
                                        ) : (
                                            EMPTY_FIELD
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Admin phone" required>
                                <EditableField
                                    id={TENANT_INLINE_FIELD_IDS.adminPhone}
                                    isEditing={isEditing}
                                    error={errors.adminPhone}
                                    isChanged={changedByKey?.adminPhone}
                                    value={draft.adminPhone}
                                    onChange={(v) => onDraftChange('adminPhone', v.replace(/\D/g, '').slice(0, 10))}
                                    type="tel"
                                    readValue={company.adminPhone?.trim() || EMPTY_FIELD}
                                />
                            </FieldRow>
                            <FieldRow label="Domain">
                                <EditableField
                                    id={TENANT_INLINE_FIELD_IDS.domain}
                                    isEditing={isEditing}
                                    error={errors.domain}
                                    isChanged={changedByKey?.domain}
                                    value={draft.domain}
                                    onChange={(v) => onDraftChange('domain', v)}
                                    readValue={company.domain?.trim() ? (
                                        <span className="font-mono text-sm text-gray-800">{company.domain}</span>
                                    ) : (
                                        EMPTY_FIELD
                                    )}
                                />
                            </FieldRow>
                            <FieldRow label="Subscription plan" required>
                                <EditableSelect
                                    id={TENANT_INLINE_FIELD_IDS.plan}
                                    isEditing={isEditing}
                                    error={errors.plan}
                                    isChanged={changedByKey?.plan}
                                    value={draft.plan}
                                    onChange={(v) => onDraftChange('plan', v as Company['plan'])}
                                    placeholder="Select plan"
                                    options={[...PLAN_OPTIONS]}
                                    readValue={planRead}
                                />
                            </FieldRow>
                            <FieldRow label="Storage limit (GB)">
                                <EditableField
                                    id={TENANT_INLINE_FIELD_IDS.storageLimit}
                                    isEditing={isEditing}
                                    error={errors.storageLimit}
                                    isChanged={changedByKey?.storageLimit}
                                    value={draft.storageLimit}
                                    onChange={(v) => onDraftChange('storageLimit', v.replace(/\D/g, ''))}
                                    readValue={company.storageLimit != null ? <span>{String(company.storageLimit)} GB</span> : EMPTY_FIELD}
                                />
                            </FieldRow>
                            <FieldRow label="Max users">
                                <EditableField
                                    id={TENANT_INLINE_FIELD_IDS.maxUsers}
                                    isEditing={isEditing}
                                    error={errors.maxUsers}
                                    isChanged={changedByKey?.maxUsers}
                                    value={draft.maxUsers}
                                    onChange={(v) => onDraftChange('maxUsers', v.replace(/\D/g, ''))}
                                    readValue={company.maxUsers != null ? <span>{String(company.maxUsers)}</span> : EMPTY_FIELD}
                                />
                            </FieldRow>
                            <FieldRow label="Status" required>
                                <EditableSelect
                                    id={TENANT_INLINE_FIELD_IDS.status}
                                    isEditing={isEditing}
                                    error={errors.status}
                                    isChanged={changedByKey?.status}
                                    value={draft.status}
                                    onChange={(v) => onDraftChange('status', v as Company['status'])}
                                    placeholder="Select status"
                                    options={[...STATUS_OPTIONS]}
                                    readValue={<StatusBadge status={company.status} />}
                                />
                            </FieldRow>
                        </div>
                    </TenantCollapsibleSection>

                    <TenantCollapsibleSection
                        title="LOCATION"
                        icon={LuMapPin}
                        tone="slate"
                        open={sectionsOpen.location}
                        onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, location: o }))}
                        headerRight={
                            isEditing && locErrCount > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {locErrCount} field{locErrCount === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className="overflow-hidden rounded-lg border border-gray-200/80">
                            <div className={fieldGrid}>
                                <FieldRow label="City" required>
                                    <EditableField
                                        id={TENANT_INLINE_FIELD_IDS.city}
                                        isEditing={isEditing}
                                        error={errors.city}
                                        isChanged={changedByKey?.city}
                                        value={draft.city}
                                        onChange={(v) => onDraftChange('city', v)}
                                        readValue={company.city?.trim() || EMPTY_FIELD}
                                    />
                                </FieldRow>
                                <FieldRow label="State" required>
                                    <EditableField
                                        id={TENANT_INLINE_FIELD_IDS.state}
                                        isEditing={isEditing}
                                        error={errors.state}
                                        isChanged={changedByKey?.state}
                                        value={draft.state}
                                        onChange={(v) => onDraftChange('state', v)}
                                        readValue={company.state?.trim() || EMPTY_FIELD}
                                    />
                                </FieldRow>
                                <FieldRow label="Country">
                                    <EditableField
                                        id={TENANT_INLINE_FIELD_IDS.country}
                                        isEditing={isEditing}
                                        error={errors.country}
                                        isChanged={changedByKey?.country}
                                        value={draft.country}
                                        onChange={(v) => onDraftChange('country', v)}
                                        readValue={company.country?.trim() || EMPTY_FIELD}
                                    />
                                </FieldRow>
                            </div>
                            <FieldRow label="Address" className="xl:col-span-2">
                                <EditableTextarea
                                    id={TENANT_INLINE_FIELD_IDS.address}
                                    isEditing={isEditing}
                                    error={errors.address}
                                    isChanged={changedByKey?.address}
                                    value={draft.address}
                                    onChange={(v) => onDraftChange('address', v)}
                                    rows={3}
                                    readValue={
                                        company.address?.trim() ? (
                                            <span className="block whitespace-pre-wrap font-medium leading-relaxed text-gray-800">{company.address.trim()}</span>
                                        ) : (
                                            EMPTY_FIELD
                                        )
                                    }
                                />
                            </FieldRow>
                        </div>
                    </TenantCollapsibleSection>
                </div>
            </div>
        </div>
    );
}
