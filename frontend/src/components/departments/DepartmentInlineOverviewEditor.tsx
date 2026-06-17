'use client';

import React, { useState } from 'react';
import { EditableField, EditableSelect, EditableTextarea } from '@/components/leads/detail/InlineEditableSection';
import StatusBadge from '@/components/ui/StatusBadge';
import type { Department } from '@/data/mockData';
import { LuBuilding2, LuChevronDown, LuUsers } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const EMPTY = '—';

export type DepartmentInlineDraft = {
    name: string;
    code: string;
    businessUnitName: string;
    departmentHeadName: string;
    status: 'Active' | 'Inactive' | '';
    description: string;
};

export type DepartmentInlineErrorKey = 'name' | 'code' | 'businessUnitName' | 'status';

export const DEPARTMENT_INLINE_FIELD_IDS: Record<DepartmentInlineErrorKey, string> = {
    name: 'dept-inline-name',
    code: 'dept-inline-code',
    businessUnitName: 'dept-inline-bu',
    status: 'dept-inline-status',
};

function FieldRow({
    label,
    required,
    children,
    className,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex w-full items-center gap-3 border-b border-gray-200/80 px-3 py-2.5 odd:bg-gray-50/50',
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

function InlineSection({
    title,
    icon: Icon,
    open,
    onOpenChange,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    open: boolean;
    onOpenChange: (o: boolean) => void;
    children: React.ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-300 bg-white">
            <button
                type="button"
                onClick={() => onOpenChange(!open)}
                aria-expanded={open}
                className="flex w-full items-center gap-2.5 border-b border-gray-300 bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-3 py-2 text-left"
            >
                <Icon className="h-4 w-4 text-[var(--cta-button-bg)]" aria-hidden />
                <span className="flex-1 truncate text-sm font-semibold tracking-wide text-gray-800">{title}</span>
                <LuChevronDown className={cn('h-4 w-4 text-gray-500 transition', open && 'rotate-180')} aria-hidden />
            </button>
            <div hidden={!open}>{children}</div>
        </section>
    );
}

export function DepartmentInlineOverviewEditor({
    department,
    isEditing,
    draft,
    errors,
    onDraftChange,
    businessUnitOptions,
    userOptions,
    changedByKey,
}: {
    department: Department;
    isEditing: boolean;
    draft: DepartmentInlineDraft;
    errors: Partial<Record<DepartmentInlineErrorKey, string>>;
    onDraftChange: (key: keyof DepartmentInlineDraft, value: string) => void;
    businessUnitOptions: { id: number; name: string }[];
    userOptions: { id: number; name: string; designation?: string }[];
    changedByKey?: Partial<Record<DepartmentInlineErrorKey, boolean>>;
}) {
    const [open, setOpen] = useState({ info: true, org: true });
    const grid = 'grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2';

    return (
        <div className="space-y-4">
            <InlineSection
                title="DEPARTMENT INFORMATION"
                icon={LuBuilding2}
                open={open.info}
                onOpenChange={(o) => setOpen((s) => ({ ...s, info: o }))}
            >
                <div className={grid}>
                    <FieldRow label="Department ID">
                        <span className="font-mono text-sm text-gray-900">
                            {department.id > 0 ? `#${department.id}` : EMPTY}
                        </span>
                    </FieldRow>
                    <FieldRow label="Department name" required>
                        <EditableField
                            id={DEPARTMENT_INLINE_FIELD_IDS.name}
                            isEditing={isEditing}
                            error={errors.name}
                            isChanged={changedByKey?.name}
                            value={draft.name}
                            onChange={(v) => onDraftChange('name', v)}
                            readValue={department.name?.trim() || EMPTY}
                        />
                    </FieldRow>
                    <FieldRow label="Department code">
                        <EditableField
                            id={DEPARTMENT_INLINE_FIELD_IDS.code}
                            isEditing={isEditing}
                            error={errors.code}
                            isChanged={changedByKey?.code}
                            value={draft.code}
                            onChange={(v) => onDraftChange('code', v.toUpperCase().replace(/\s/g, ''))}
                            readValue={
                                department.code ? (
                                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono">
                                        {department.code}
                                    </code>
                                ) : (
                                    EMPTY
                                )
                            }
                        />
                    </FieldRow>
                    <FieldRow label="Business unit" required>
                        <EditableSelect
                            id={DEPARTMENT_INLINE_FIELD_IDS.businessUnitName}
                            isEditing={isEditing}
                            error={errors.businessUnitName}
                            isChanged={changedByKey?.businessUnitName}
                            value={draft.businessUnitName}
                            onChange={(v) => onDraftChange('businessUnitName', v)}
                            placeholder="Select business unit"
                            options={businessUnitOptions.map((bu) => bu.name)}
                            readValue={department.businessUnitName || EMPTY}
                        />
                    </FieldRow>
                    <FieldRow label="Status" required>
                        <EditableSelect
                            id={DEPARTMENT_INLINE_FIELD_IDS.status}
                            isEditing={isEditing}
                            error={errors.status}
                            isChanged={changedByKey?.status}
                            value={draft.status}
                            onChange={(v) => onDraftChange('status', v)}
                            placeholder="Select status"
                            options={['Active', 'Inactive']}
                            readValue={
                                department.id > 0 ? (
                                    <StatusBadge status={department.status} />
                                ) : (
                                    <span className="text-sm text-slate-500">Draft</span>
                                )
                            }
                        />
                    </FieldRow>
                    <FieldRow label="Created" className="xl:col-span-2">
                        <span className="tabular-nums text-slate-700">{department.createdDate || EMPTY}</span>
                    </FieldRow>
                    <FieldRow label="Description" className="xl:col-span-2">
                        <EditableTextarea
                            isEditing={isEditing}
                            value={draft.description}
                            onChange={(v) => onDraftChange('description', v)}
                            readValue={
                                department.description?.trim() ? (
                                    <span className="text-sm font-normal text-slate-700">{department.description}</span>
                                ) : (
                                    EMPTY
                                )
                            }
                            rows={3}
                        />
                    </FieldRow>
                </div>
            </InlineSection>

            <InlineSection
                title="ORGANIZATION"
                icon={LuUsers}
                open={open.org}
                onOpenChange={(o) => setOpen((s) => ({ ...s, org: o }))}
            >
                <div className={grid}>
                    <FieldRow label="Department head">
                        <EditableSelect
                            isEditing={isEditing}
                            value={draft.departmentHeadName}
                            onChange={(v) => onDraftChange('departmentHeadName', v)}
                            placeholder="Select head (optional)"
                            options={['— None —', ...userOptions.map((u) => u.name)]}
                            readValue={department.departmentHeadName || EMPTY}
                        />
                    </FieldRow>
                    <FieldRow label="Users count">
                        <span className="font-medium tabular-nums text-slate-800">{department.usersCount}</span>
                    </FieldRow>
                    <FieldRow label="Associated projects">
                        <span className="font-medium tabular-nums text-slate-800">
                            {department.associatedProjectsCount ?? 0}
                        </span>
                    </FieldRow>
                </div>
            </InlineSection>
        </div>
    );
}
