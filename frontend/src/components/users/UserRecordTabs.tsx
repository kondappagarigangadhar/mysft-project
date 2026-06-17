'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserMainTabBar } from '@/components/users/detail/UserMainTabBar';
import { UserProfileHeader } from '@/components/users/detail/UserProfileHeader';
import type { UserDetailMainTabId } from '@/components/users/detail/userDetailTabIds';
import { normalizeUserDetailTab, USER_DETAIL_PRIMARY_TAB_ORDER } from '@/components/users/detail/userDetailTabIds';
import { UserDetailMoreMenu } from '@/components/users/UserDetailMoreMenu';
import { UserInlineOverviewEditor, USER_INLINE_FIELD_IDS, type UserOverviewDraft } from '@/components/users/UserInlineOverviewEditor';
import { Button } from '@/components/ui/Button';
import { Table } from '@/components/ui/Table';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { StatusModal } from '@/components/ui/StatusModal';
import { RecordHistoryLogPanel } from '@/components/history-logs/RecordHistoryLogPanel';
import { userSyntheticHistoryEntries } from '@/lib/historyLogs/userHistoryAdapter';
import { SectionCard } from '@/components/leads/LeadDetailFields';
import { cn } from '@/lib/utils';
import {
    CTA_INFO_BANNER,
    CTA_INFO_BANNER_BADGE,
    CTA_CARD_EDITING_RING,
} from '@/lib/theme/ctaThemeClasses';
import { LuCalendar, LuClock3, LuFileText, LuShield } from 'react-icons/lu';
import { WorkspaceUtilityToolbar, USER_WORKSPACE_HELP } from '@/components/workspace-help';
import type { User } from '@/data/mockData';
import {
    addUserRecord,
    companies,
    getDocuments,
    getProjectsByCompanyId,
    getUserById,
    projectTasks,
    updateUserRecord,
} from '@/data/mockData';
import { draftService } from '@/lib/draftService';
import { userCreateHref, userListHref, userViewHref } from '@/lib/userRoutes';
import {
    defaultPermissionsForRole,
    defaultRoleDescription,
    enrichUserRecord,
    permissionLabel,
} from '@/lib/userPermissions';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;

function digits10(phone: string) {
    return phone.replace(/\D/g, '').slice(-10);
}

function buildDraft(u: User): UserOverviewDraft {
    const enriched = enrichUserRecord(u);
    const role = enriched.role ?? '';
    return {
        firstName: enriched.firstName ?? '',
        lastName: enriched.lastName ?? '',
        email: enriched.email ?? '',
        phoneNumber: digits10(enriched.phoneNumber || ''),
        designation: enriched.designation ?? '',
        role,
        department: enriched.department ?? '',
        status: enriched.status ?? 'Active',
        roleName: enriched.roleName ?? role,
        roleDescription: enriched.roleDescription ?? '',
        permissions: [...(enriched.permissions ?? [])],
        tenantId: String(enriched.tenantId ?? ''),
    };
}

function emptyDraft(): UserOverviewDraft {
    const first = companies[0];
    const role = 'Engineer';
    return {
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        designation: '',
        role,
        department: 'Engineering',
        status: 'Pending',
        roleName: role,
        roleDescription: defaultRoleDescription(role),
        permissions: defaultPermissionsForRole(role),
        tenantId: first ? String(first.id) : '1',
    };
}

function draftsEqual(a: UserOverviewDraft, b: UserOverviewDraft) {
    return (Object.keys(a) as (keyof UserOverviewDraft)[]).every((k) => {
        if (k === 'permissions') return JSON.stringify(a.permissions) === JSON.stringify(b.permissions);
        return String(a[k]) === String(b[k]);
    });
}

function mergeUserForHeader(base: User, d: UserOverviewDraft): User {
    const tenant = companies.find((c) => c.id === Number(d.tenantId));
    return {
        ...base,
        firstName: d.firstName,
        lastName: d.lastName,
        name: `${d.firstName} ${d.lastName}`.trim() || base.name,
        email: d.email,
        phoneNumber: d.phoneNumber,
        role: d.role,
        department: d.department,
        tenantId: Number(d.tenantId) || base.tenantId,
        tenantName: tenant?.name ?? base.tenantName,
        designation: d.designation,
        status: (d.status || base.status) as User['status'],
        roleName: d.roleName,
        roleDescription: d.roleDescription,
        permissions: d.permissions,
    };
}

function validateDraft(d: UserOverviewDraft): Partial<Record<keyof UserOverviewDraft, string>> {
    const e: Partial<Record<keyof UserOverviewDraft, string>> = {};
    if (!d.firstName.trim()) e.firstName = 'First name is required';
    if (!d.lastName.trim()) e.lastName = 'Last name is required';
    if (!d.email.trim()) e.email = 'Email is required';
    else if (!EMAIL_REGEX.test(d.email.trim())) e.email = 'Invalid email';
    if (!d.phoneNumber.trim()) e.phoneNumber = 'Phone is required';
    else if (!PHONE_REGEX.test(digits10(d.phoneNumber))) e.phoneNumber = '10 digits required';
    if (!d.role.trim()) e.role = 'Role is required';
    if (!d.department.trim()) e.department = 'Department is required';
    if (!d.tenantId.trim()) e.tenantId = 'Tenant is required';
    if (!d.status) e.status = 'Status is required';
    if (!d.roleName.trim()) e.roleName = 'Role name is required';
    if (!d.permissions.length) e.permissions = 'Select at least one permission';
    return e;
}

function formatIso(iso: string) {
    const raw = iso?.trim() ?? '';
    if (!raw) return '—';
    try {
        const d = new Date(raw.includes('T') ? raw : `${raw.slice(0, 10)}T12:00:00`);
        if (Number.isNaN(d.getTime())) return raw;
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return raw;
    }
}

function downloadJson(filename: string, data: unknown) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function UserRecordTabs({
    user,
    listVersion,
    onBump,
    createMode = false,
}: {
    user: User;
    listVersion: number;
    onBump: () => void;
    createMode?: boolean;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isCreate = createMode;
    const [tab, setTabState] = useState<UserDetailMainTabId>(() => normalizeUserDetailTab(searchParams.get('tab')));

    const setTab = useCallback(
        (next: UserDetailMainTabId) => {
            if (isCreate && next !== 'overview') return;
            setTabState(next);
            const id = isCreate ? 'new' : String(user.id);
            router.replace(`${userViewHref(id)}?tab=${encodeURIComponent(next)}`, { scroll: false });
        },
        [user.id, router, isCreate],
    );

    useEffect(() => {
        setTabState(isCreate ? 'overview' : normalizeUserDetailTab(searchParams.get('tab')));
    }, [searchParams, isCreate]);

    useEffect(() => {
        if (!isCreate) return;
        if (tab === 'overview') return;
        setTabState('overview');
        router.replace(`${userCreateHref()}?tab=overview`, { scroll: false });
    }, [isCreate, tab, router]);

    const [isInlineEditing, setIsInlineEditing] = useState(isCreate);
    const displayUser = useMemo(() => enrichUserRecord(user), [user, listVersion]);
    const [draft, setDraft] = useState<UserOverviewDraft>(() => (isCreate ? emptyDraft() : buildDraft(displayUser)));
    const [errors, setErrors] = useState<Partial<Record<keyof UserOverviewDraft, string>>>({});
    const [saving, setSaving] = useState(false);
    const [inlineToast, setInlineToast] = useState<{ msg: string; err: boolean } | null>(null);
    const [statusModal, setStatusModal] = useState<{ open: boolean; type: 'success' | 'error'; title: string; subtitle?: string }>({
        open: false,
        type: 'success',
        title: '',
    });
    const [draftSaving, setDraftSaving] = useState(false);
    const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
    const [draftLastSavedAt, setDraftLastSavedAt] = useState<string | null>(null);
    const [draftLoadedBanner, setDraftLoadedBanner] = useState(false);

    const headerUser = useMemo(() => mergeUserForHeader(displayUser, draft), [displayUser, draft]);

    const isInlineDirty = useMemo(() => {
        if (isCreate) return !draftsEqual(draft, emptyDraft());
        return !draftsEqual(draft, buildDraft(displayUser));
    }, [isCreate, draft, user]);

    const baselineDraft = useMemo(() => buildDraft(displayUser), [displayUser]);

    const changedByKey = useMemo((): Partial<Record<keyof UserOverviewDraft, boolean>> | undefined => {
        if (!isInlineEditing || isCreate) return undefined;
        const keys = Object.keys(draft) as (keyof UserOverviewDraft)[];
        const out: Partial<Record<keyof UserOverviewDraft, boolean>> = {};
        keys.forEach((k) => {
            if (k === 'permissions') {
                if (JSON.stringify(draft.permissions) !== JSON.stringify(baselineDraft.permissions)) out[k] = true;
            } else if (String(draft[k]) !== String(baselineDraft[k])) out[k] = true;
        });
        return out;
    }, [draft, baselineDraft, isInlineEditing, isCreate]);

    useEffect(() => {
        const e = searchParams.get('edit');
        if (e !== '1' && e !== 'true') return;
        if (isCreate) return;
        setIsInlineEditing(true);
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete('edit');
        const qs = sp.toString();
        const base = userViewHref(user.id);
        router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    }, [searchParams, router, isCreate, user.id]);

    useEffect(() => {
        if (isInlineEditing) return;
        setDraft(isCreate ? emptyDraft() : buildDraft(displayUser));
        setErrors({});
    }, [isInlineEditing, user, listVersion, isCreate]);

    const disabledTabs = useMemo(() => {
        if (!isCreate) return new Set<UserDetailMainTabId>();
        return new Set(USER_DETAIL_PRIMARY_TAB_ORDER.filter((t) => t !== 'overview'));
    }, [isCreate]);

    const projects = useMemo(() => {
        void listVersion;
        return getProjectsByCompanyId(user.tenantId);
    }, [user.tenantId, listVersion]);

    const taskCount = useMemo(() => {
        return projectTasks.filter((t) => t.assignee && user.name && t.assignee.includes(user.firstName)).length;
    }, [user.firstName, user.name]);

    const onDraftChange = <K extends keyof UserOverviewDraft>(key: K, value: UserOverviewDraft[K]) => {
        setDraft((p) => ({ ...p, [key]: value }));
        setErrors((er) => {
            if (!er[key]) return er;
            const n = { ...er };
            delete n[key];
            return n;
        });
    };

    const onCancelEdits = () => {
        if (isCreate) {
            router.push(userListHref());
            return;
        }
        setIsInlineEditing(false);
        setDraft(buildDraft(displayUser));
        setErrors({});
    };

    const saveDraftNow = () => {
        if (!isCreate) return;
        setDraftSaving(true);
        try {
            const saved = draftService.saveDraft<UserOverviewDraft>('user', draft, activeDraftId ?? undefined);
            setActiveDraftId(saved.draftId);
            setDraftLastSavedAt(saved.updatedAt);
            const sp = new URLSearchParams(searchParams.toString());
            sp.set('draftId', saved.draftId);
            if (!sp.get('tab')) sp.set('tab', 'overview');
            router.replace(`${typeof window !== 'undefined' ? window.location.pathname : userCreateHref()}?${sp.toString()}`, {
                scroll: false,
            });
            setInlineToast({ msg: 'Draft saved.', err: false });
            setStatusModal({ open: true, type: 'success', title: 'Draft saved' });
        } catch {
            setInlineToast({ msg: 'Could not save draft.', err: true });
        } finally {
            setDraftSaving(false);
        }
    };

    useEffect(() => {
        if (!isCreate) return;
        const id = searchParams.get('draftId')?.trim();
        if (!id) {
            setDraftLoadedBanner(false);
            return;
        }
        const found = draftService.getDraftById<UserOverviewDraft>(id);
        if (!found || found.module !== 'user') {
            setDraftLoadedBanner(false);
            return;
        }
        setDraft((p) => ({ ...p, ...(found.data ?? {}) }));
        setActiveDraftId(found.draftId);
        setDraftLastSavedAt(found.updatedAt);
        setDraftLoadedBanner(true);
    }, [isCreate, searchParams]);

    const persistUser = (exitAfter: boolean) => {
        const nextErrors = validateDraft(draft);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) {
            setInlineToast({ msg: 'Please fix highlighted fields.', err: true });
            const first = Object.keys(nextErrors)[0] as keyof UserOverviewDraft;
            document.getElementById(USER_INLINE_FIELD_IDS[first])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        const tenant = companies.find((c) => c.id === Number(draft.tenantId));
        if (!tenant) {
            setInlineToast({ msg: 'Invalid tenant.', err: true });
            return;
        }
        setSaving(true);
        try {
            const phone = digits10(draft.phoneNumber);
            const displayPhone = phone.length === 10 ? `${phone.slice(0, 5)} ${phone.slice(5)}` : draft.phoneNumber;
            if (isCreate) {
                const created = addUserRecord({
                    firstName: draft.firstName.trim(),
                    lastName: draft.lastName.trim(),
                    name: '',
                    email: draft.email.trim(),
                    phoneNumber: displayPhone,
                    designation: draft.designation.trim() || '—',
                    role: draft.role.trim(),
                    department: draft.department.trim(),
                    tenantId: tenant.id,
                    tenantName: tenant.name,
                    status: draft.status as User['status'],
                    roleName: draft.roleName.trim(),
                    roleDescription: draft.roleDescription.trim(),
                    permissions: [...draft.permissions],
                    createdDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).replace(',', ''),
                    joined: new Date().toISOString().slice(0, 10),
                    lastLogin: undefined,
                    updatedDate: new Date().toISOString().slice(0, 10),
                });
                onBump();
                if (activeDraftId) draftService.deleteDraft(activeDraftId);
                setStatusModal({ open: true, type: 'success', title: 'User created', subtitle: created.name });
                router.replace(`${userViewHref(created.id)}?tab=overview`);
            } else {
                updateUserRecord(user.id, {
                    firstName: draft.firstName.trim(),
                    lastName: draft.lastName.trim(),
                    email: draft.email.trim(),
                    phoneNumber: displayPhone,
                    designation: draft.designation.trim(),
                    role: draft.role.trim(),
                    department: draft.department.trim(),
                    tenantId: tenant.id,
                    tenantName: tenant.name,
                    status: draft.status as User['status'],
                    roleName: draft.roleName.trim(),
                    roleDescription: draft.roleDescription.trim(),
                    permissions: [...draft.permissions],
                    updatedDate: new Date().toISOString().slice(0, 10),
                });
                onBump();
                setInlineToast({ msg: 'User updated.', err: false });
                setStatusModal({ open: true, type: 'success', title: 'Saved' });
                if (exitAfter) setIsInlineEditing(false);
                else {
                    const fresh = getUserById(user.id);
                    if (fresh) setDraft(buildDraft(fresh));
                    setErrors({});
                }
            }
        } finally {
            setSaving(false);
        }
    };

    const historySupplemental = useMemo(() => userSyntheticHistoryEntries(user), [user]);

    const exportUserJson = () => {
        downloadJson(`user-${user.id}.json`, user);
    };

    const readCreated = user.createdDate || user.joined?.slice(0, 10) || '—';
    const readLastLogin = user.lastLogin ? formatIso(user.lastLogin) : '—';
    const readUpdated = user.updatedDate ? formatIso(user.updatedDate) : formatIso(user.joined);

    const docs = useMemo(() => getDocuments(), []);

    return (
        <div className="w-full min-w-0 space-y-0">
            <StatusModal
                open={statusModal.open}
                type={statusModal.type}
                title={statusModal.title}
                subtitle={statusModal.subtitle}
                autoCloseMs={1600}
                onClose={() => setStatusModal((p) => ({ ...p, open: false, subtitle: undefined }))}
            />
            {inlineToast ? <InlineToast message={inlineToast.msg} variant={inlineToast.err ? 'error' : 'success'} onDismiss={() => setInlineToast(null)} /> : null}

            <UserMainTabBar
                active={tab}
                disabledTabs={disabledTabs}
                onChange={(next) => {
                    if (isCreate && next !== 'overview') {
                        setInlineToast({ msg: 'Create user to access other sections.', err: true });
                        return;
                    }
                    if (next !== tab && isInlineEditing && !isCreate && tab === 'overview') {
                        if (isInlineDirty) {
                            const ok = window.confirm('You have unsaved changes. Leave this tab and discard them?');
                            if (!ok) return;
                            onCancelEdits();
                        } else setIsInlineEditing(false);
                    }
                    setTab(next);
                }}
            />

            {tab === 'overview' && isCreate && draftLoadedBanner ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-semibold text-slate-900">You are editing a draft</p>
                        <p className="text-xs font-medium text-slate-600">
                            {draftLastSavedAt ? `Last saved: ${formatIso(draftLastSavedAt)}` : 'Last saved: —'}
                        </p>
                    </div>
                </div>
            ) : null}
            {tab === 'overview' && isCreate ? (
                <div className={CTA_INFO_BANNER}>
                    You are creating a new user <span className={CTA_INFO_BANNER_BADGE}>Draft</span>
                </div>
            ) : null}

            {!isCreate ? (
                <div className="mt-3 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        {tab === 'overview' ? (
                            <UserDetailMoreMenu
                                user={user}
                                onEdit={() => setIsInlineEditing(true)}
                                isEditing={isInlineEditing}
                                isSaving={saving}
                                onArchived={() => onBump()}
                                createMode={false}
                            />
                        ) : (
                            <p className="min-w-0 truncate text-sm font-semibold text-slate-800">{user.name || 'User'}</p>
                        )}
                        <WorkspaceUtilityToolbar
                            help={USER_WORKSPACE_HELP}
                            triggerLabel="User workspace help"
                            email={user.email}
                            onExport={exportUserJson}
                            saving={saving}
                            isInlineEditing={isInlineEditing}
                        />
                    </div>
                    {tab === 'overview' ? (
                        <div className="mt-2 rounded-md bg-white/80 px-4 py-2 text-sm text-gray-700">
                            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
                                <span className="inline-flex items-center gap-2">
                                    <LuCalendar size={14} className="text-gray-500" aria-hidden />
                                    <span className="text-gray-600">Created</span>
                                    <span className="font-medium text-gray-900">{readCreated}</span>
                                </span>
                                <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                                <span className="inline-flex items-center gap-2">
                                    <LuClock3 size={14} className="text-gray-500" aria-hidden />
                                    <span className="text-gray-600">Updated</span>
                                    <span className="font-medium text-gray-900">{readUpdated}</span>
                                </span>
                                <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                                <span className="inline-flex items-center gap-2">
                                    <span className="text-gray-600">Last login</span>
                                    <span className="font-medium text-gray-900">{readLastLogin}</span>
                                </span>
                                <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                                <span className="text-gray-600">
                                    Status <span className="font-medium text-gray-900">{user.status}</span>
                                </span>
                                <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                                <span className="text-gray-600">
                                    Role <span className="font-medium text-gray-900">{user.role}</span>
                                </span>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}

            <div className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
                {isCreate ? (
                    <div className="mt-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                        Draft workspace — complete Overview, then <strong>Save</strong> to unlock all tabs.
                        {draftLastSavedAt ? <span className="ml-2 text-xs text-slate-500">Last draft: {draftLastSavedAt}</span> : null}
                    </div>
                ) : null}

                {tab === 'overview' ? (
                    <div className="mt-3 flex w-full min-w-0 flex-col gap-4 sm:mt-4 sm:gap-6">
                        <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-5">
                            <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:col-span-2">
                                <div
                                    className={cn(
                                        'flex min-h-0 min-w-0 flex-col rounded-xl border bg-white shadow-sm',
                                        isInlineEditing ? CTA_CARD_EDITING_RING : 'border-gray-200/80',
                                    )}
                                >
                                    <div className="bg-[#7185a217] px-4 py-4 sm:px-5 sm:py-5">
                                        <UserProfileHeader user={headerUser} isEditing={isInlineEditing} />
                                        <div className="mt-6 border-t border-slate-200/80 pt-5">
                                            <UserInlineOverviewEditor
                                                user={headerUser}
                                                isEditing={isInlineEditing}
                                                draft={draft}
                                                errors={errors}
                                                onDraftChange={onDraftChange}
                                                changedByKey={changedByKey}
                                            />
                                        </div>
                                        {isInlineEditing ? (
                                            <div className="sticky bottom-0 z-30 mt-4 pb-1">
                                                <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur supports-backdrop-filter:bg-white/90 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {isCreate ? 'Create user to enable related sections' : 'You have unsaved changes'}
                                                        </p>
                                                        {!isInlineDirty ? (
                                                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                                                Up to date
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                    <div className="mt-3 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:items-center sm:justify-end">
                                                        {isCreate ? (
                                                            <>
                                                                <Button type="button" variant="companyOutline" size="cta" onClick={onCancelEdits} disabled={saving}>
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="companyOutline"
                                                                    size="cta"
                                                                    onClick={saveDraftNow}
                                                                    isLoading={draftSaving}
                                                                    disabled={saving || draftSaving}
                                                                >
                                                                    {draftSaving ? 'Saving...' : 'Save draft'}
                                                                </Button>
                                                                <Button type="button" variant="company" size="cta" isLoading={saving} onClick={() => persistUser(true)}>
                                                                    {saving ? 'Creating...' : 'Create user'}
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button type="button" variant="companyOutline" size="cta" onClick={onCancelEdits} disabled={saving}>
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="companyOutline"
                                                                    size="cta"
                                                                    onClick={() => persistUser(false)}
                                                                    disabled={saving || !isInlineDirty}
                                                                    isLoading={saving}
                                                                >
                                                                    {saving ? 'Saving...' : 'Save'}
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="company"
                                                                    size="cta"
                                                                    onClick={() => persistUser(true)}
                                                                    isLoading={saving}
                                                                    disabled={!isInlineDirty}
                                                                >
                                                                    {saving ? 'Saving...' : 'Save & exit'}
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                            <div className="min-w-0 space-y-4 lg:col-span-1 lg:sticky lg:top-44 lg:self-start">
                                {isCreate ? (
                                    <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                                        Quick summary available after the user is created.
                                    </p>
                                ) : (
                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Quick info</h3>
                                        <dl className="mt-3 space-y-2 text-sm">
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-slate-500">Assigned projects</dt>
                                                <dd className="font-semibold text-slate-900">{projects.length}</dd>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-slate-500">Active tasks</dt>
                                                <dd className="font-semibold text-slate-900">{taskCount}</dd>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-slate-500">Login status</dt>
                                                <dd className="font-semibold text-slate-900">{user.status === 'Active' ? 'Allowed' : 'Restricted'}</dd>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-slate-500">Role type</dt>
                                                <dd className="font-semibold text-slate-900">{user.role}</dd>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-slate-500">Access level</dt>
                                                <dd className="font-semibold text-slate-900">{user.role === 'Administrator' ? 'Full' : 'Standard'}</dd>
                                            </div>
                                        </dl>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}

                {tab === 'roles' && !isCreate ? (
                    <div className="mt-4 space-y-4">
                        <SectionCard title="Role name" description="Assigned RBAC role for this user" icon={LuShield}>
                            <p className="text-sm font-semibold text-slate-900">{displayUser.roleName || displayUser.role}</p>
                            <p className="mt-2 text-sm text-slate-600">{displayUser.roleDescription || '—'}</p>
                        </SectionCard>
                        <SectionCard title="Permission list" description="Granted workspace permissions" icon={LuShield}>
                            <Table
                                columns={[
                                    { key: 'id', header: 'Permission', render: (r: { id: string }) => permissionLabel(r.id) },
                                    { key: 'idRaw', header: 'Key', render: (r) => <span className="font-mono text-xs text-slate-500">{r.id}</span> },
                                ]}
                                data={(displayUser.permissions ?? []).map((id) => ({ id }))}
                            />
                        </SectionCard>
                    </div>
                ) : null}

                {tab === 'documents' && !isCreate ? (
                    <div className="mt-4 space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                        <SectionCard title="Documents" description="Upload, preview, download, and verification" icon={LuFileText}>
                            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                                <input type="file" className="hidden" multiple />
                                Drop files or click to upload (demo)
                            </label>
                            <Table
                                className="mt-4"
                                columns={[
                                    { key: 'name', header: 'Name', render: (r) => r.name },
                                    { key: 'type', header: 'Type', render: (r) => r.type },
                                    { key: 'date', header: 'Date', render: (r) => r.date },
                                    { key: 'status', header: 'Status', render: (r) => r.status },
                                ]}
                                data={docs}
                            />
                        </SectionCard>
                    </div>
                ) : null}

                {tab === 'history' && !isCreate ? (
                    <div className="mt-4">
                        <RecordHistoryLogPanel
                            module="users"
                            recordId={String(user.id)}
                            recordTitle={user.name}
                            supplementalEntries={historySupplemental}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
}
