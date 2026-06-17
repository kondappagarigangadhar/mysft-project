'use client';

import React, { useMemo, useState } from 'react';
import { EditableField, EditableSelect, EditableTextarea } from '@/components/leads/detail/InlineEditableSection';
import type { User } from '@/data/mockData';
import StatusBadge from '@/components/ui/StatusBadge';
import { getDepartmentsList } from '@/lib/departmentStore';
import { USER_PERMISSION_OPTIONS, enrichUserRecord, permissionLabel } from '@/lib/userPermissions';
import { LuChevronDown, LuShield, LuUser } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const EMPTY = '—';

export type UserOverviewDraft = {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    designation: string;
    role: string;
    department: string;
    status: User['status'] | '';
    roleName: string;
    roleDescription: string;
    permissions: string[];
    /** Internal — required for save; not shown in field list */
    tenantId: string;
};

export const USER_INLINE_FIELD_IDS: Record<keyof UserOverviewDraft, string> = {
    firstName: 'user-field-firstName',
    lastName: 'user-field-lastName',
    email: 'user-field-email',
    phoneNumber: 'user-field-phoneNumber',
    designation: 'user-field-designation',
    role: 'user-field-role',
    department: 'user-field-department',
    status: 'user-field-status',
    roleName: 'user-field-roleName',
    roleDescription: 'user-field-roleDescription',
    permissions: 'user-field-permissions',
    tenantId: 'user-field-tenantId',
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
                'flex w-full flex-col gap-1 border-b border-gray-200/80 px-3 py-2.5 odd:bg-gray-50/50 sm:flex-row sm:items-start sm:gap-3',
                className,
            )}
        >
            <div className="w-full shrink-0 text-sm font-medium text-gray-500 sm:w-44">
                <span className="inline-flex items-baseline gap-0.5">
                    {label}
                    {required ? (
                        <span className="text-rose-500" aria-hidden>
                            *
                        </span>
                    ) : null}
                </span>
            </div>
            <div className="flex w-full min-w-0 items-start gap-2 text-[15px] font-medium text-gray-900">
                <span className="hidden text-gray-300 sm:inline" aria-hidden>
                    :
                </span>
                <span className="w-full min-w-0">{children}</span>
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
        <section className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-none">
            <button
                type="button"
                onClick={() => onOpenChange(!open)}
                aria-expanded={open}
                className="flex w-full items-center gap-2.5 border-b border-gray-300 bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] px-3 py-2 text-left transition hover:brightness-[0.99]"
            >
                <span
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/90 text-[var(--cta-button-bg)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]"
                    aria-hidden
                >
                    <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-semibold text-gray-900">{title}</span>
                <LuChevronDown className={cn('h-4 w-4 shrink-0 text-gray-500 transition', open && 'rotate-180')} aria-hidden />
            </button>
            {open ? <div className="divide-y divide-gray-100">{children}</div> : null}
        </section>
    );
}

const ROLE_OPTIONS = ['Administrator', 'Engineer', 'Supervisor', 'Viewer', 'Auditor'];
const STATUS_OPTIONS: string[] = ['Active', 'Inactive', 'Pending', 'Suspended', 'Disabled'];

function PermissionListRead({ ids }: { ids: string[] }) {
    if (!ids.length) return <span className="text-slate-500">{EMPTY}</span>;
    return (
        <ul className="flex flex-wrap gap-1.5">
            {ids.map((id) => (
                <li
                    key={id}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700"
                >
                    {permissionLabel(id)}
                </li>
            ))}
        </ul>
    );
}

function PermissionListEdit({
    selected,
    onChange,
    error,
}: {
    selected: string[];
    onChange: (next: string[]) => void;
    error?: string;
}) {
    const toggle = (id: string) => {
        if (selected.includes(id)) onChange(selected.filter((p) => p !== id));
        else onChange([...selected, id]);
    };
    return (
        <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
                {USER_PERMISSION_OPTIONS.map((opt) => (
                    <label
                        key={opt.id}
                        className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition',
                            selected.includes(opt.id)
                                ? 'border-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]'
                                : 'border-slate-200 bg-white hover:bg-slate-50',
                        )}
                    >
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300"
                            checked={selected.includes(opt.id)}
                            onChange={() => toggle(opt.id)}
                        />
                        <span className="text-slate-800">{opt.label}</span>
                    </label>
                ))}
            </div>
            {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
        </div>
    );
}

export function UserInlineOverviewEditor({
    user,
    isEditing,
    draft,
    onDraftChange,
    errors,
    changedByKey,
}: {
    user: User;
    isEditing: boolean;
    draft: UserOverviewDraft;
    onDraftChange: <K extends keyof UserOverviewDraft>(key: K, value: UserOverviewDraft[K]) => void;
    errors: Partial<Record<keyof UserOverviewDraft, string>>;
    changedByKey?: Partial<Record<keyof UserOverviewDraft, boolean>>;
}) {
    const [openProfile, setOpenProfile] = useState(true);
    const [openRole, setOpenRole] = useState(true);

    const departmentOptions = useMemo(() => {
        const names = getDepartmentsList().map((d) => d.name);
        if (draft.department && !names.includes(draft.department)) names.unshift(draft.department);
        return names.length ? names : ['Engineering', 'Operations', 'Management'];
    }, [draft.department]);

    const displayPermissions = enrichUserRecord(user).permissions ?? [];

    return (
        <div className="space-y-4">
            <InlineSection title="User information" icon={LuUser} open={openProfile} onOpenChange={setOpenProfile}>
                <FieldRow label="First Name" required>
                    <EditableField
                        id={USER_INLINE_FIELD_IDS.firstName}
                        isEditing={isEditing}
                        error={errors.firstName}
                        isChanged={changedByKey?.firstName}
                        value={draft.firstName}
                        onChange={(v) => onDraftChange('firstName', v)}
                        placeholder="First name"
                        readValue={<span>{user.firstName || EMPTY}</span>}
                    />
                </FieldRow>
                <FieldRow label="Last Name" required>
                    <EditableField
                        id={USER_INLINE_FIELD_IDS.lastName}
                        isEditing={isEditing}
                        error={errors.lastName}
                        isChanged={changedByKey?.lastName}
                        value={draft.lastName}
                        onChange={(v) => onDraftChange('lastName', v)}
                        placeholder="Last name"
                        readValue={<span>{user.lastName || EMPTY}</span>}
                    />
                </FieldRow>
                <FieldRow label="Email" required>
                    <EditableField
                        id={USER_INLINE_FIELD_IDS.email}
                        type="email"
                        isEditing={isEditing}
                        error={errors.email}
                        isChanged={changedByKey?.email}
                        value={draft.email}
                        onChange={(v) => onDraftChange('email', v)}
                        placeholder="name@company.com"
                        readValue={
                            user.email ? (
                                <a href={`mailto:${user.email}`} className="text-[var(--cta-button-bg)] hover:underline">
                                    {user.email}
                                </a>
                            ) : (
                                <span>{EMPTY}</span>
                            )
                        }
                    />
                </FieldRow>
                <FieldRow label="Phone Number" required>
                    <EditableField
                        id={USER_INLINE_FIELD_IDS.phoneNumber}
                        type="tel"
                        isEditing={isEditing}
                        error={errors.phoneNumber}
                        isChanged={changedByKey?.phoneNumber}
                        value={draft.phoneNumber}
                        onChange={(v) => onDraftChange('phoneNumber', v)}
                        placeholder="10-digit mobile"
                        readValue={
                            user.phoneNumber ? (
                                <a
                                    href={`tel:${user.phoneNumber.replace(/\D/g, '')}`}
                                    className="tabular-nums hover:text-[var(--cta-button-bg)]"
                                >
                                    {user.phoneNumber}
                                </a>
                            ) : (
                                <span>{EMPTY}</span>
                            )
                        }
                    />
                </FieldRow>
                <FieldRow label="Designation">
                    <EditableField
                        id={USER_INLINE_FIELD_IDS.designation}
                        isEditing={isEditing}
                        error={errors.designation}
                        isChanged={changedByKey?.designation}
                        value={draft.designation}
                        onChange={(v) => onDraftChange('designation', v)}
                        placeholder="Job title"
                        readValue={<span>{user.designation || EMPTY}</span>}
                    />
                </FieldRow>
                <FieldRow label="Role" required>
                    <EditableSelect
                        id={USER_INLINE_FIELD_IDS.role}
                        isEditing={isEditing}
                        error={errors.role}
                        isChanged={changedByKey?.role}
                        value={draft.role}
                        onChange={(v) => onDraftChange('role', v)}
                        options={ROLE_OPTIONS}
                        readValue={<span>{user.role || EMPTY}</span>}
                    />
                </FieldRow>
                <FieldRow label="Department" required>
                    <EditableSelect
                        id={USER_INLINE_FIELD_IDS.department}
                        isEditing={isEditing}
                        error={errors.department}
                        isChanged={changedByKey?.department}
                        value={draft.department}
                        onChange={(v) => onDraftChange('department', v)}
                        options={departmentOptions}
                        readValue={<span>{user.department || EMPTY}</span>}
                    />
                </FieldRow>
                <FieldRow label="Status" required>
                    <EditableSelect
                        id={USER_INLINE_FIELD_IDS.status}
                        isEditing={isEditing}
                        error={errors.status}
                        isChanged={changedByKey?.status}
                        value={draft.status}
                        onChange={(v) => onDraftChange('status', v as User['status'])}
                        options={STATUS_OPTIONS}
                        readValue={<StatusBadge status={user.status} />}
                    />
                </FieldRow>
            </InlineSection>

            <InlineSection title="Role & access" icon={LuShield} open={openRole} onOpenChange={setOpenRole}>
                <FieldRow label="Role Name" required>
                    <EditableField
                        id={USER_INLINE_FIELD_IDS.roleName}
                        isEditing={isEditing}
                        error={errors.roleName}
                        isChanged={changedByKey?.roleName}
                        value={draft.roleName}
                        onChange={(v) => onDraftChange('roleName', v)}
                        placeholder="e.g. Platform Administrator"
                        readValue={<span>{user.roleName || user.role || EMPTY}</span>}
                    />
                </FieldRow>
                <FieldRow label="Role Description">
                    <EditableTextarea
                        id={USER_INLINE_FIELD_IDS.roleDescription}
                        isEditing={isEditing}
                        error={errors.roleDescription}
                        isChanged={changedByKey?.roleDescription}
                        value={draft.roleDescription}
                        onChange={(v) => onDraftChange('roleDescription', v)}
                        placeholder="Describe scope and responsibilities"
                        rows={3}
                        readValue={
                            <span className="whitespace-pre-wrap text-slate-700">
                                {user.roleDescription?.trim() || EMPTY}
                            </span>
                        }
                    />
                </FieldRow>
                <FieldRow label="Permission List" className="sm:items-start">
                    {isEditing ? (
                        <PermissionListEdit
                            selected={draft.permissions}
                            onChange={(next) => onDraftChange('permissions', next)}
                            error={errors.permissions}
                        />
                    ) : (
                        <PermissionListRead ids={displayPermissions} />
                    )}
                </FieldRow>
            </InlineSection>
        </div>
    );
}
