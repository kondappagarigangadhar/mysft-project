'use client';

import React from 'react';
import { EditableField, EditableSelect, EditableTextarea } from '@/components/leads/detail/InlineEditableSection';
import { formatLeadCode, type Lead, type LeadSource, type LeadStatus, type PropertyType } from '@/lib/leadStore';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { LuBuilding2, LuChevronDown, LuFileText, LuMapPin, LuUser } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const EMPTY_FIELD = '—';

type EditableLeadDraft = {
    name: string;
    phone: string;
    email: string;
    source: LeadSource | '';
    assignedTo: string;
    project: string;
    budgetRange: string;
    preferredUnitType: PropertyType | '';
    status: LeadStatus | '';
    presentAddress: string;
    permanentAddress: string;
    notes: string;
};

type InlineErrorKey =
    | 'name'
    | 'phone'
    | 'email'
    | 'source'
    | 'assignedTo'
    | 'project'
    | 'budgetRange'
    | 'preferredUnitType'
    | 'status'
    | 'presentAddress'
    | 'permanentAddress';

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
    sectionId,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    tone?: 'blue' | 'amber' | 'slate';
    open: boolean;
    onOpenChange: (open: boolean) => void;
    headerRight?: React.ReactNode;
    sectionId?: string;
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
        <section id={sectionId} className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-none">
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

export const LEAD_INLINE_FIELD_IDS: Record<InlineErrorKey, string> = {
    name: 'lead-inline-name',
    phone: 'lead-inline-phone',
    email: 'lead-inline-email',
    source: 'lead-inline-source',
    assignedTo: 'lead-inline-assigned-to',
    project: 'lead-inline-project',
    budgetRange: 'lead-inline-budget-range',
    preferredUnitType: 'lead-inline-preferred-unit-type',
    status: 'lead-inline-status',
    presentAddress: 'lead-inline-present-address',
    permanentAddress: 'lead-inline-permanent-address',
};

export function LeadInlineOverviewEditor({
    lead,
    isEditing,
    draft,
    errors,
    onDraftChange,
    sourceOptions,
    projectOptions,
    assignedToOptions,
    changedByKey,
    statusOptions,
    unitTypeOptions,
}: {
    lead: Lead;
    isEditing: boolean;
    draft: EditableLeadDraft;
    errors: Partial<Record<InlineErrorKey, string>>;
    onDraftChange: (key: keyof EditableLeadDraft, value: string) => void;
    sourceOptions: LeadSource[];
    projectOptions: string[];
    assignedToOptions: string[];
    changedByKey?: Partial<Record<InlineErrorKey, boolean>>;
    statusOptions: LeadStatus[];
    unitTypeOptions: PropertyType[];
}) {
    const budgetLine = draft.budgetRange?.trim() ? draft.budgetRange : EMPTY_FIELD;
    const fieldGrid = 'grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2';
    const [sectionsOpen, setSectionsOpen] = React.useState({
        general: true,
        address: true,
        project: true,
        summary: true,
    });

    const generalRequiredErrors = ['name', 'phone', 'email', 'assignedTo', 'status'].filter(
        (k) => Boolean(errors[k as InlineErrorKey]),
    ).length;
    const projectRequiredErrors = ['source', 'project', 'budgetRange', 'preferredUnitType'].filter(
        (k) => Boolean(errors[k as InlineErrorKey]),
    ).length;

    return (
        <div className={cn('flex min-h-0 flex-1 flex-col', isEditing && 'border-none shadow-none')}>
            <div className="min-h-0 flex-1">
                <div className="space-y-4">
                    <InlineCollapsibleSection
                        title="LEAD INFORMATION"
                        icon={LuUser}
                        tone="blue"
                        sectionId="wf-lead-information"
                        open={sectionsOpen.general}
                        onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, general: o }))}
                        headerRight={
                            isEditing && generalRequiredErrors > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {generalRequiredErrors} field{generalRequiredErrors === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className={fieldGrid}>
                            <FieldRow label="Lead ID">
                                <span className="font-mono text-sm tracking-tight text-gray-900">
                                    {lead.id > 0 ? formatLeadCode(lead.id) : EMPTY_FIELD}
                                </span>
                            </FieldRow>
                            <FieldRow label="Lead Name" required>
                                <EditableField
                                    id={LEAD_INLINE_FIELD_IDS.name}
                                    isEditing={isEditing}
                                    error={errors.name}
                                    isChanged={changedByKey?.name}
                                    value={draft.name}
                                    onChange={(value) => onDraftChange('name', value)}
                                    readValue={
                                        lead.name?.trim() ? (
                                            <span className="text-base font-semibold text-gray-900">{lead.name}</span>
                                        ) : (
                                            EMPTY_FIELD
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Phone" required>
                                <EditableField
                                    id={LEAD_INLINE_FIELD_IDS.phone}
                                    isEditing={isEditing}
                                    error={errors.phone}
                                    isChanged={changedByKey?.phone}
                                    value={draft.phone}
                                    onChange={(value) => onDraftChange('phone', value)}
                                    type="tel"
                                    readValue={
                                        lead.phone?.trim() ? (
                                            <a href={`tel:${lead.phone.replace(/\s/g, '')}`} className="hover:text-[var(--cta-button-bg)] hover:underline">
                                                {lead.phone}
                                            </a>
                                        ) : (
                                            EMPTY_FIELD
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Email" required>
                                <EditableField
                                    id={LEAD_INLINE_FIELD_IDS.email}
                                    isEditing={isEditing}
                                    error={errors.email}
                                    isChanged={changedByKey?.email}
                                    value={draft.email}
                                    onChange={(value) => onDraftChange('email', value)}
                                    type="email"
                                    readValue={
                                        lead.email?.trim() ? (
                                            <a href={`mailto:${lead.email}`} className="break-all hover:text-[var(--cta-button-bg)] hover:underline">
                                                {lead.email}
                                            </a>
                                        ) : (
                                            EMPTY_FIELD
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Assigned To" required>
                                <EditableSelect
                                    id={LEAD_INLINE_FIELD_IDS.assignedTo}
                                    isEditing={isEditing}
                                    error={errors.assignedTo}
                                    isChanged={changedByKey?.assignedTo}
                                    value={draft.assignedTo}
                                    onChange={(value) => onDraftChange('assignedTo', value)}
                                    placeholder="Select owner"
                                    options={assignedToOptions}
                                    readValue={lead.assignedTo?.trim() || EMPTY_FIELD}
                                />
                            </FieldRow>
                            <FieldRow label="Status" required>
                                <EditableSelect
                                    id={LEAD_INLINE_FIELD_IDS.status}
                                    isEditing={isEditing}
                                    error={errors.status}
                                    isChanged={changedByKey?.status}
                                    value={draft.status}
                                    onChange={(value) => onDraftChange('status', value)}
                                    placeholder="Select status"
                                    options={statusOptions}
                                    readValue={
                                        lead.id > 0 ? (
                                            <LeadStatusBadge status={lead.status} />
                                        ) : (
                                            <span className="inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2.5 py-0.5 text-xs font-semibold text-[var(--cta-button-bg)]">
                                                Draft
                                            </span>
                                        )
                                    }
                                />
                            </FieldRow>
                        </div>
                    </InlineCollapsibleSection>

                    <InlineCollapsibleSection
                        title="PROPERTY INTEREST"
                        icon={LuBuilding2}
                        tone="amber"
                        open={sectionsOpen.project}
                        onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, project: o }))}
                        headerRight={
                            isEditing && projectRequiredErrors > 0 ? (
                                <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-red-600">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                                    {projectRequiredErrors} field{projectRequiredErrors === 1 ? '' : 's'} required
                                </span>
                            ) : null
                        }
                    >
                        <div className={fieldGrid}>
                            <FieldRow label="Lead Source" required>
                                <EditableSelect
                                    id={LEAD_INLINE_FIELD_IDS.source}
                                    isEditing={isEditing}
                                    error={errors.source}
                                    isChanged={changedByKey?.source}
                                    value={draft.source}
                                    onChange={(value) => onDraftChange('source', value)}
                                    placeholder="Select source"
                                    options={sourceOptions}
                                    readValue={lead.source || EMPTY_FIELD}
                                />
                            </FieldRow>
                            <FieldRow label="Project Interest" required>
                                <EditableSelect
                                    id={LEAD_INLINE_FIELD_IDS.project}
                                    isEditing={isEditing}
                                    error={errors.project}
                                    isChanged={changedByKey?.project}
                                    value={draft.project}
                                    onChange={(value) => onDraftChange('project', value)}
                                    placeholder="Select project"
                                    options={projectOptions}
                                    readValue={
                                        lead.project?.trim() ? (
                                            <span className="font-semibold text-gray-900">{lead.project}</span>
                                        ) : (
                                            EMPTY_FIELD
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Budget Range" required>
                                <EditableField
                                    id={LEAD_INLINE_FIELD_IDS.budgetRange}
                                    isEditing={isEditing}
                                    error={errors.budgetRange}
                                    isChanged={changedByKey?.budgetRange}
                                    value={draft.budgetRange}
                                    onChange={(value) => onDraftChange('budgetRange', value)}
                                    readValue={
                                        budgetLine !== EMPTY_FIELD ? (
                                            <span className="font-semibold text-[var(--cta-button-bg)]">{budgetLine}</span>
                                        ) : (
                                            budgetLine
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Preferred Unit" required>
                                <EditableSelect
                                    id={LEAD_INLINE_FIELD_IDS.preferredUnitType}
                                    isEditing={isEditing}
                                    error={errors.preferredUnitType}
                                    isChanged={changedByKey?.preferredUnitType}
                                    value={draft.preferredUnitType}
                                    onChange={(value) => onDraftChange('preferredUnitType', value)}
                                    placeholder="Select unit type"
                                    options={unitTypeOptions}
                                    readValue={lead.preferredUnitType?.trim() ? lead.preferredUnitType : EMPTY_FIELD}
                                />
                            </FieldRow>
                        </div>
                    </InlineCollapsibleSection>

                    <InlineCollapsibleSection
                        title="ADDRESS DETAILS"
                        icon={LuMapPin}
                        tone="slate"
                        open={sectionsOpen.address}
                        onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, address: o }))}
                    >
                        <div className="overflow-hidden rounded-lg border border-gray-200/80">
                            <FieldRow label="Present Address">
                                <EditableTextarea
                                    id={LEAD_INLINE_FIELD_IDS.presentAddress}
                                    isEditing={isEditing}
                                    error={errors.presentAddress}
                                    isChanged={changedByKey?.presentAddress}
                                    value={draft.presentAddress}
                                    onChange={(value) => onDraftChange('presentAddress', value)}
                                    rows={3}
                                    readValue={
                                        lead.presentAddress?.trim() ? (
                                            <span className="block whitespace-pre-wrap font-medium leading-relaxed text-gray-800">
                                                {lead.presentAddress.trim()}
                                            </span>
                                        ) : (
                                            EMPTY_FIELD
                                        )
                                    }
                                />
                            </FieldRow>
                            <FieldRow label="Permanent Address">
                                <EditableTextarea
                                    id={LEAD_INLINE_FIELD_IDS.permanentAddress}
                                    isEditing={isEditing}
                                    error={errors.permanentAddress}
                                    isChanged={changedByKey?.permanentAddress}
                                    value={draft.permanentAddress}
                                    onChange={(value) => onDraftChange('permanentAddress', value)}
                                    rows={3}
                                    readValue={
                                        lead.permanentAddress?.trim() ? (
                                            <span className="block whitespace-pre-wrap font-medium leading-relaxed text-gray-800">
                                                {lead.permanentAddress.trim()}
                                            </span>
                                        ) : (
                                            EMPTY_FIELD
                                        )
                                    }
                                />
                            </FieldRow>
                        </div>
                    </InlineCollapsibleSection>

                    <InlineCollapsibleSection
                        title="LEAD SUMMARY & REQUIREMENTS"
                        icon={LuFileText}
                        tone="slate"
                        open={sectionsOpen.summary}
                        onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, summary: o }))}
                    >
                        <div className="space-y-2">
                            {isEditing ? (
                                <EditableTextarea
                                    id="lead-inline-summary-notes"
                                    isEditing={isEditing}
                                    value={draft.notes}
                                    onChange={(value) => onDraftChange('notes', value)}
                                    readValue={draft.notes?.trim() ? draft.notes : EMPTY_FIELD}
                                    rows={6}
                                    placeholder="Add a crisp summary: intent, timeline, must-haves, next step…"
                                />
                            ) : lead.notes?.trim() ? (
                                <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-gray-800 px-2 py-2">
                                    {lead.notes.trim()}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500 px-2 py-2">No summary added yet.</p>
                            )}
                        </div>
                    </InlineCollapsibleSection>
                </div>
            </div>
        </div>
    );
}
