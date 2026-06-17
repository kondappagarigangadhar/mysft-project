'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TenantMainTabBar } from '@/components/tenants/detail/TenantMainTabBar';
import { TenantProfileHeader } from '@/components/tenants/detail/TenantProfileHeader';
import type { TenantDetailMainTabId } from '@/components/tenants/detail/tenantDetailTabIds';
import { normalizeTenantDetailTab } from '@/components/tenants/detail/tenantDetailTabIds';
import { TenantDetailMoreMenu } from '@/components/tenants/TenantDetailMoreMenu';
import { Button } from '@/components/ui/Button';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { StatusModal } from '@/components/ui/StatusModal';
import { RecordHistoryLogPanel } from '@/components/history-logs/RecordHistoryLogPanel';
import { tenantSyntheticHistoryEntries } from '@/lib/historyLogs/tenantHistoryAdapter';
import { cn } from '@/lib/utils';
import {
    CTA_INFO_BANNER,
    CTA_INFO_BANNER_BADGE,
    CTA_CARD_EDITING_RING,
} from '@/lib/theme/ctaThemeClasses';
import {
    LuCalendar,
    LuClock3,
} from 'react-icons/lu';
import type { Company } from '@/data/mockData';
import { addCompany, updateCompany, getCompanyById } from '@/lib/companyStore';
import { draftService } from '@/lib/draftService';
import { tenantCreateHref, tenantListHref, tenantViewHref } from '@/lib/tenantRoutes';
import { TenantAICopilotPanel } from '@/components/ai/TenantDetailAIBlocks';
import {
    TenantInlineOverviewEditor,
    TENANT_INLINE_FIELD_IDS,
    type TenantOverviewDraft,
} from '@/components/tenants/TenantInlineOverviewEditor';
import { WorkspaceUtilityToolbar, TENANT_WORKSPACE_HELP } from '@/components/workspace-help';

type OverviewDraft = TenantOverviewDraft;

function buildDraft(c: Company): OverviewDraft {
    return {
        tenantCode: c.tenantCode ?? '',
        businessType: c.businessType ?? '',
        name: c.name ?? '',
        email: c.email ?? '',
        phone: c.phone ?? '',
        adminName: c.adminName ?? '',
        adminEmail: c.adminEmail ?? '',
        adminPhone: c.adminPhone ?? '',
        domain: c.domain ?? '',
        plan: c.plan ?? '',
        storageLimit: c.storageLimit != null ? String(c.storageLimit) : '',
        maxUsers: c.maxUsers != null ? String(c.maxUsers) : '',
        status: c.status ?? '',
        city: c.city ?? '',
        state: c.state ?? '',
        address: c.address ?? '',
        country: c.country ?? 'India',
    };
}

function emptyDraft(): OverviewDraft {
    const d = new Date().toISOString().slice(0, 10);
    return {
        tenantCode: '',
        businessType: '',
        name: '',
        email: '',
        phone: '',
        adminName: '',
        adminEmail: '',
        adminPhone: '',
        domain: '',
        plan: '',
        storageLimit: '',
        maxUsers: '',
        status: 'Pending',
        city: '',
        state: '',
        address: '',
        country: 'India',
    };
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

function tenantDraftsEqual(a: OverviewDraft, b: OverviewDraft): boolean {
    return (Object.keys(a) as (keyof OverviewDraft)[]).every((k) => String(a[k]) === String(b[k]));
}

function companyFromDraft(base: Company, d: OverviewDraft): Company {
    return {
        ...base,
        name: d.name.trim() || base.name,
        tenantCode: d.tenantCode.trim() || base.tenantCode,
        businessType: (d.businessType || base.businessType) as Company['businessType'],
        email: d.email.trim() || base.email,
        phone: d.phone.trim() || base.phone,
        plan: (d.plan || base.plan) as Company['plan'],
        status: (d.status || base.status) as Company['status'],
        domain: d.domain.trim() || base.domain,
        city: d.city.trim() || base.city,
        state: d.state.trim() || base.state,
    };
}

const NAME_REGEX = /^[A-Za-z\s]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{10}$/;

function validateTenantDraft(d: OverviewDraft): Partial<Record<keyof OverviewDraft, string>> {
    const e: Partial<Record<keyof OverviewDraft, string>> = {};
    if (!d.name.trim()) e.name = 'Organization Name is required';
    else if (!NAME_REGEX.test(d.name.trim())) e.name = 'Letters and spaces only';
    if (!d.tenantCode.trim()) e.tenantCode = 'Organization Code is required';
    else if (!/^[a-zA-Z0-9]+$/.test(d.tenantCode.trim())) e.tenantCode = 'Alphanumeric only';
    if (!d.businessType) e.businessType = 'Business type is required';
    if (!d.email.trim()) e.email = 'Contact Email is required';
    else if (!EMAIL_REGEX.test(d.email.trim())) e.email = 'Invalid email';
    if (!d.phone.trim()) e.phone = 'Contact Phone is required';
    else if (!PHONE_REGEX.test(d.phone.trim())) e.phone = '10 digits required';
    if (!d.city.trim()) e.city = 'City is required';
    if (!d.state.trim()) e.state = 'State is required';
    if (!d.plan) e.plan = 'Plan is required';
    if (!d.adminName.trim()) e.adminName = 'Admin name is required';
    if (!d.adminEmail.trim()) e.adminEmail = 'Admin email is required';
    else if (!EMAIL_REGEX.test(d.adminEmail.trim())) e.adminEmail = 'Invalid email';
    if (!d.adminPhone.trim()) e.adminPhone = 'Admin phone is required';
    else if (!PHONE_REGEX.test(d.adminPhone.trim())) e.adminPhone = '10 digits required';
    if (!d.status) e.status = 'Status is required';
    return e;
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

export function TenantRecordTabs({
    company,
    listVersion,
    onBump,
    createMode = false,
}: {
    company: Company;
    listVersion: number;
    onBump: () => void;
    createMode?: boolean;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isCreate = createMode;
    const [tab, setTabState] = useState<TenantDetailMainTabId>(() => normalizeTenantDetailTab(searchParams.get('tab')));

    const setTab = useCallback(
        (next: TenantDetailMainTabId) => {
            if (isCreate && next !== 'overview') return;
            setTabState(next);
            const id = isCreate ? 'new' : String(company.id);
            router.replace(`${tenantViewHref(id)}?tab=${encodeURIComponent(next)}`, { scroll: false });
        },
        [company.id, router, isCreate],
    );

    useEffect(() => {
        setTabState(isCreate ? 'overview' : normalizeTenantDetailTab(searchParams.get('tab')));
    }, [searchParams, isCreate]);

    useEffect(() => {
        if (!isCreate) return;
        if (tab === 'overview') return;
        setTabState('overview');
        router.replace(`${tenantCreateHref()}?tab=overview`, { scroll: false });
    }, [isCreate, tab, router]);

    const [isInlineEditing, setIsInlineEditing] = useState(isCreate);
    const [draft, setDraft] = useState<OverviewDraft>(() => (isCreate ? emptyDraft() : buildDraft(company)));
    const [errors, setErrors] = useState<Partial<Record<keyof OverviewDraft, string>>>({});
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

    const headerCompany = useMemo(() => companyFromDraft(company, draft), [company, draft]);

    const isInlineDirty = useMemo(() => {
        if (isCreate) return !tenantDraftsEqual(draft, emptyDraft());
        return !tenantDraftsEqual(draft, buildDraft(company));
    }, [isCreate, draft, company]);

    const baselineDraft = useMemo(() => buildDraft(company), [company]);

    const changedByKey = useMemo((): Partial<Record<keyof OverviewDraft, boolean>> | undefined => {
        if (!isInlineEditing || isCreate) return undefined;
        const keys = Object.keys(draft) as (keyof OverviewDraft)[];
        const out: Partial<Record<keyof OverviewDraft, boolean>> = {};
        keys.forEach((k) => {
            if (String(draft[k]) !== String(baselineDraft[k])) out[k] = true;
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
        const base = tenantViewHref(company.id);
        router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    }, [searchParams, router, isCreate, company.id]);

    useEffect(() => {
        if (isInlineEditing) return;
        setDraft(isCreate ? emptyDraft() : buildDraft(company));
        setErrors({});
    }, [isInlineEditing, company, listVersion, isCreate]);

    const disabledTabs = useMemo(() => {
        if (!isCreate) return new Set<TenantDetailMainTabId>();
        return new Set<TenantDetailMainTabId>(['history']);
    }, [isCreate]);

    const onDraftChange = <K extends keyof OverviewDraft>(key: K, value: OverviewDraft[K]) => {
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
            router.push(tenantListHref());
            return;
        }
        setIsInlineEditing(false);
        setDraft(buildDraft(company));
        setErrors({});
    };

    const saveDraftNow = () => {
        if (!isCreate) return;
        setDraftSaving(true);
        try {
            const saved = draftService.saveDraft<OverviewDraft>('tenant', draft, activeDraftId ?? undefined);
            setActiveDraftId(saved.draftId);
            setDraftLastSavedAt(saved.updatedAt);
            const sp = new URLSearchParams(searchParams.toString());
            sp.set('draftId', saved.draftId);
            if (!sp.get('tab')) sp.set('tab', 'overview');
            router.replace(`${typeof window !== 'undefined' ? window.location.pathname : tenantCreateHref()}?${sp.toString()}`, {
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
        const found = draftService.getDraftById<OverviewDraft>(id);
        if (!found || found.module !== 'tenant') {
            setDraftLoadedBanner(false);
            return;
        }
        setDraft((p) => ({ ...p, ...(found.data ?? {}) }));
        setActiveDraftId(found.draftId);
        setDraftLastSavedAt(found.updatedAt);
        setDraftLoadedBanner(true);
    }, [isCreate, searchParams]);

    const persistTenant = (exitAfter: boolean) => {
        const nextErrors = validateTenantDraft(draft);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) {
            setInlineToast({ msg: 'Please fix highlighted fields.', err: true });
            const first = Object.keys(nextErrors)[0] as keyof OverviewDraft;
            const el = document.getElementById(TENANT_INLINE_FIELD_IDS[first]);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setSaving(true);
        try {
            if (isCreate) {
                const created = addCompany({
                    name: draft.name.trim(),
                    tenantCode: draft.tenantCode.trim(),
                    businessType: draft.businessType as Company['businessType'],
                    email: draft.email.trim(),
                    phone: draft.phone.trim(),
                    address: draft.address.trim(),
                    city: draft.city.trim(),
                    state: draft.state.trim(),
                    plan: draft.plan as Company['plan'],
                    adminName: draft.adminName.trim(),
                    adminEmail: draft.adminEmail.trim(),
                    adminPhone: draft.adminPhone.trim(),
                    domain: draft.domain.trim(),
                    status: draft.status as Company['status'],
                    maxUsers: draft.maxUsers ? Number(draft.maxUsers) : undefined,
                    storageLimit: draft.storageLimit ? Number(draft.storageLimit) : undefined,
                    owner: draft.adminName.trim(),
                    country: draft.country.trim() || 'India',
                });
                onBump();
                setStatusModal({ open: true, type: 'success', title: 'Tenant created', subtitle: created.name });
                router.replace(`${tenantViewHref(created.id)}?tab=overview`);
            } else {
                updateCompany(company.id, {
                    name: draft.name.trim(),
                    tenantCode: draft.tenantCode.trim(),
                    businessType: draft.businessType as Company['businessType'],
                    email: draft.email.trim(),
                    phone: draft.phone.trim(),
                    address: draft.address.trim(),
                    city: draft.city.trim(),
                    state: draft.state.trim(),
                    plan: draft.plan as Company['plan'],
                    adminName: draft.adminName.trim(),
                    adminEmail: draft.adminEmail.trim(),
                    adminPhone: draft.adminPhone.trim(),
                    domain: draft.domain.trim(),
                    status: draft.status as Company['status'],
                    maxUsers: draft.maxUsers ? Number(draft.maxUsers) : undefined,
                    storageLimit: draft.storageLimit ? Number(draft.storageLimit) : undefined,
                    owner: draft.adminName.trim(),
                    country: draft.country.trim() || 'India',
                });
                onBump();
                setInlineToast({ msg: 'Tenant updated.', err: false });
                setStatusModal({ open: true, type: 'success', title: 'Saved' });
                if (exitAfter) {
                    setIsInlineEditing(false);
                } else {
                    const fresh = getCompanyById(company.id);
                    if (fresh) setDraft(buildDraft(fresh));
                    setErrors({});
                }
            }
        } finally {
            setSaving(false);
        }
    };

    const historySupplemental = useMemo(() => tenantSyntheticHistoryEntries(company), [company]);

    const exportTenantJson = () => {
        downloadJson(`tenant-${company.id}.json`, company);
    };

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

            <TenantMainTabBar
                active={tab}
                disabledTabs={disabledTabs}
                onChange={(next) => {
                    if (isCreate && next !== 'overview') {
                        setInlineToast({ msg: 'Create tenant to access History.', err: true });
                        return;
                    }
                    if (next !== tab && isInlineEditing && !isCreate && tab === 'overview') {
                        if (isInlineDirty) {
                            const ok = window.confirm('You have unsaved changes. Leave this tab and discard them?');
                            if (!ok) return;
                            onCancelEdits();
                        } else {
                            setIsInlineEditing(false);
                        }
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
                    You are creating a new tenant <span className={CTA_INFO_BANNER_BADGE}>Draft</span>
                </div>
            ) : null}

            {!isCreate ? (
                <div className="mt-3 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        {tab === 'overview' ? (
                            <TenantDetailMoreMenu
                                company={company}
                                onEdit={() => setIsInlineEditing(true)}
                                isEditing={isInlineEditing}
                                isSaving={saving}
                                onArchived={() => onBump()}
                            />
                        ) : (
                            <p className="min-w-0 truncate text-sm font-semibold text-slate-800">{company.name || 'Tenant'}</p>
                        )}
                        <WorkspaceUtilityToolbar
                            help={TENANT_WORKSPACE_HELP}
                            triggerLabel="Tenant workspace help"
                            email={company.email}
                            onExport={exportTenantJson}
                            saving={saving}
                            isInlineEditing={isInlineEditing}
                        />
                    </div>
                    {tab === 'overview' ? (
                        <div className="mt-2 rounded-md bg-white/80 px-4 py-2 text-sm text-gray-700">
                            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
                                <span className="inline-flex items-center gap-2">
                                    <LuCalendar size={14} className="text-gray-500" aria-hidden />
                                    <span className="text-gray-600">Date created</span>
                                    <span className="font-medium text-gray-900">{formatIso(company.createdAt)}</span>
                                </span>
                                <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                                <span className="inline-flex items-center gap-2">
                                    <LuClock3 size={14} className="text-gray-500" aria-hidden />
                                    <span className="text-gray-600">Last updated</span>
                                    <span className="font-medium text-gray-900">{formatIso(company.lastUpdated ?? company.createdAt)}</span>
                                </span>
                                <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                                <span className="inline-flex items-center gap-2 text-gray-600">
                                    Plan <span className="font-medium text-gray-900">{company.plan}</span>
                                </span>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}

            <div className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
                {isCreate ? (
                    <div className="mt-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                        Draft workspace — complete Overview, then <strong>Save</strong> to unlock History.
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
                                        <TenantProfileHeader company={headerCompany} isEditing={isInlineEditing} />
                                        <div className="mt-6 border-t border-slate-200/80 pt-5">
                                            <TenantInlineOverviewEditor
                                                company={company}
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
                                                            {isCreate ? 'Create tenant to enable History' : 'You have unsaved changes'}
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
                                                                <Button type="button" variant="company" size="cta" isLoading={saving} onClick={() => persistTenant(true)}>
                                                                    {saving ? 'Creating...' : 'Create tenant'}
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
                                                                    onClick={() => persistTenant(false)}
                                                                    disabled={saving || !isInlineDirty}
                                                                    isLoading={saving}
                                                                >
                                                                    {saving ? 'Saving...' : 'Save'}
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="company"
                                                                    size="cta"
                                                                    onClick={() => persistTenant(true)}
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
                                    <div>
                                        <p className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                                            Available after tenant is created
                                        </p>
                                        <div className="pointer-events-none opacity-50">
                                            <TenantAICopilotPanel company={headerCompany} disabled />
                                        </div>
                                    </div>
                                ) : (
                                    <TenantAICopilotPanel company={company} />
                                )}
                                {!isCreate ? (
                                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Quick info</h3>
                                        <dl className="mt-3 space-y-2 text-sm">
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-slate-500">Status</dt>
                                                <dd className="font-semibold text-slate-900">{company.status}</dd>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-slate-500">Plan</dt>
                                                <dd className="font-semibold text-slate-900">{company.plan}</dd>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-slate-500">Users</dt>
                                                <dd className="font-semibold text-slate-900">{company.usersCount}</dd>
                                            </div>
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-slate-500">Revenue</dt>
                                                <dd className="font-semibold text-slate-900">{company.revenue}</dd>
                                            </div>
                                        </dl>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ) : null}

                {tab === 'history' && !isCreate ? (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                        <RecordHistoryLogPanel module="tenants" recordId={String(company.id)} recordTitle={company.name} supplementalEntries={historySupplemental} />
                    </div>
                ) : null}
            </div>
        </div>
    );
}
