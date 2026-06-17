'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { StatusModal } from '@/components/ui/StatusModal';
import {
    addProject,
    type Project,
    type ProjectApprovalStatus,
    type ProjectStatus,
    type ProjectType,
    getNextProjectCode,
} from '@/lib/projectsInventoryStore';
import { ProjectOverviewTab } from '@/components/projects-inventory/project-view/ProjectOverviewTab';
import type { ProjectFormValues } from '@/components/projects-inventory/ProjectForm';
import {
    ProjectActivityTab,
    ProjectDocumentsTab,
    ProjectInventoryTab,
    ProjectPaymentsTab,
    ProjectPricingTab,
    ProjectVendorsTab,
    ProjectWorkOrdersTab,
    type ProjectViewTabKey,
} from '@/components/projects-inventory/project-view';
import { ProjectViewTabBar } from '@/components/projects-inventory/project-view/ProjectViewTabBar';
import { draftService } from '@/lib/draftService';
import { cn } from '@/lib/utils';
import { CTA_INFO_BANNER, CTA_INFO_BANNER_BADGE } from '@/lib/theme/ctaThemeClasses';

export const ARRIS_PROJECT_CREATE_MODE_DRAFT_KEY = 'arris-project-create-mode-draft-v1';

function formatIso(iso: string) {
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

function emptyCreateFormValues(): ProjectFormValues {
    return {
        project_name: '',
        project_type: 'Apartment' as ProjectType,
        project_status: 'upcoming' as ProjectStatus,
        requires_approval: true,
        total_units: 10,
        full_address: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        landmark: '',
        map_url: '',
        developer_name: '',
        project_owner_name: '',
        project_manager_name: '',
        executive_manager_name: '',
        sales_head: '',
        towers_blocks: '',
        floors: '',
        launch_date: '',
        possession_date: '',
        starting_price: '',
        max_price: '',
        internal_notes: '',
    };
}

function formValuesToOverviewDraft(values: ProjectFormValues): Record<string, unknown> {
    return {
        ...values,
        total_units: String(values.total_units ?? ''),
    };
}

function overviewDraftToFormValues(draft: Record<string, unknown>): ProjectFormValues {
    const d = draft as Partial<Record<keyof ProjectFormValues, unknown>> & { total_units?: unknown };
    const units = Number(String(d.total_units ?? '').replace(/\D/g, '')) || 0;
    return {
        project_name: String(d.project_name ?? ''),
        project_type: (d.project_type as ProjectFormValues['project_type']) ?? ('' as unknown as ProjectFormValues['project_type']),
        project_status: (d.project_status as ProjectFormValues['project_status']) ?? ('' as unknown as ProjectFormValues['project_status']),
        requires_approval: d.requires_approval === '' ? false : Boolean(d.requires_approval ?? false),
        total_units: units,
        full_address: String(d.full_address ?? ''),
        city: String(d.city ?? ''),
        state: String(d.state ?? ''),
        country: String(d.country ?? ''),
        pincode: String(d.pincode ?? ''),
        landmark: String(d.landmark ?? ''),
        map_url: String(d.map_url ?? ''),
        developer_name: String(d.developer_name ?? ''),
        project_owner_name: String(d.project_owner_name ?? ''),
        project_manager_name: String(d.project_manager_name ?? ''),
        executive_manager_name: String(d.executive_manager_name ?? ''),
        sales_head: String(d.sales_head ?? ''),
        towers_blocks: String(d.towers_blocks ?? ''),
        floors: String(d.floors ?? ''),
        launch_date: String(d.launch_date ?? ''),
        possession_date: String(d.possession_date ?? ''),
        starting_price: String(d.starting_price ?? ''),
        max_price: String(d.max_price ?? ''),
        internal_notes: String(d.internal_notes ?? ''),
    };
}

const VALID_TAB_KEYS: ProjectViewTabKey[] = [
    'overview',
    'inventory',
    'pricing',
    'documents',
    'payments',
    'vendors',
    'work-orders',
    'history',
];

function normalizeTab(raw: string | null): ProjectViewTabKey {
    if (!raw) return 'overview';
    // Backwards-compat: legacy `activity` and removed `bookings` URLs.
    if (raw === 'activity') return 'history';
    if (raw === 'bookings' || raw === 'customers') return 'payments';
    if ((VALID_TAB_KEYS as string[]).includes(raw)) return raw as ProjectViewTabKey;
    return 'overview';
}

type CreateDraft = {
    project_name: string;
    project_type: ProjectType | '';
    project_status: ProjectStatus | '';
    requires_approval: boolean;
    total_units: string;
    developer_name: string;
    full_address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    landmark: string;
    map_url: string;
    project_owner_name: string;
    project_manager_name: string;
    executive_manager_name: string;
    sales_head: string;
    towers_blocks: string;
    floors: string;
    launch_date: string;
    possession_date: string;
    starting_price: string;
    max_price: string;
    internal_notes: string;
};

function emptyCreateDraft(): CreateDraft {
    return {
        project_name: '',
        project_type: '' as ProjectType | '',
        project_status: '' as ProjectStatus | '',
        requires_approval: true,
        total_units: '',
        developer_name: '',
        full_address: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        landmark: '',
        map_url: '',
        project_owner_name: '',
        project_manager_name: '',
        executive_manager_name: '',
        sales_head: '',
        towers_blocks: '',
        floors: '',
        launch_date: '',
        possession_date: '',
        starting_price: '',
        max_price: '',
        internal_notes: '',
    };
}

function draftToProjectLike(d: CreateDraft): Project {
    const now = new Date().toISOString();
    const approval_status: ProjectApprovalStatus = d.requires_approval ? 'pending' : 'approved';
    return {
        id: 0,
        slug: 'new',
        project_id: 'PR-NEW',
        project_name: d.project_name ?? '',
        project_type: (d.project_type || 'Apartment') as ProjectType,
        location: `${(d.city ?? '').trim()}${(d.city ?? '').trim() && (d.state ?? '').trim() ? ', ' : ''}${(d.state ?? '').trim()}`.trim() || '—',
        total_units: Number(d.total_units.replace(/\D/g, '')) || 0,
        project_status: (d.requires_approval ? 'upcoming' : (d.project_status || 'upcoming')) as ProjectStatus,
        approval_status,
        full_address: d.full_address ?? '',
        city: d.city ?? '',
        state: d.state ?? '',
        country: d.country ?? 'India',
        pincode: d.pincode ?? '',
        landmark: d.landmark ?? '',
        map_url: d.map_url ?? '',
        developer_name: d.developer_name ?? '',
        project_owner_name: d.project_owner_name ?? '',
        project_manager_name: d.project_manager_name ?? '',
        executive_manager_name: d.executive_manager_name ?? '',
        sales_head: d.sales_head ?? '',
        towers_blocks: d.towers_blocks ?? '',
        floors: d.floors ?? '',
        launch_date: d.launch_date ?? '',
        possession_date: d.possession_date ?? '',
        starting_price: d.starting_price ? Number(d.starting_price.replace(/\D/g, '')) : undefined,
        max_price: d.max_price ? Number(d.max_price.replace(/\D/g, '')) : undefined,
        internal_notes: d.internal_notes ?? '',
        created_at: now,
        updated_at: now,
        archived: false,
    };
}

function parseOptRupee(raw: string) {
    const n = Number((raw ?? '').replace(/\D/g, ''));
    return Number.isFinite(n) && n > 0 ? n : undefined;
}

function toLocationFromCityState(d: Pick<CreateDraft, 'city' | 'state' | 'full_address'>): string {
    const c = (d.city ?? '').trim();
    const s = (d.state ?? '').trim();
    if (c && s) return `${c}, ${s}`;
    return c || s || (d.full_address ?? '').trim().slice(0, 120) || '—';
}

function validateCreateDraft(d: CreateDraft): Partial<Record<keyof CreateDraft, string>> {
    const next: Partial<Record<keyof CreateDraft, string>> = {};
    if (!d.project_name.trim()) next.project_name = 'Project name is required.';
    if (!String(d.project_type || '').trim()) next.project_type = 'Project type is required.';
    if (!String(d.project_status || '').trim()) next.project_status = 'Project status is required.';
    if (!d.full_address.trim()) next.full_address = 'Full address is required.';
    if (!d.city.trim()) next.city = 'City is required.';
    if (!d.state.trim()) next.state = 'State is required.';
    if (!d.project_owner_name.trim()) next.project_owner_name = 'Project owner is required.';
    if (!d.project_manager_name.trim()) next.project_manager_name = 'Project manager is required.';
    if (!d.executive_manager_name.trim()) next.executive_manager_name = 'Executive manager is required.';
    const units = Number(d.total_units.replace(/\D/g, ''));
    if (!Number.isFinite(units) || units <= 0) next.total_units = 'Enter a positive number of units.';
    if (d.map_url.trim() && !/^https?:\/\//i.test(d.map_url.trim())) next.map_url = 'Enter a valid URL (https://…).';
    return next;
}

export function ProjectRecordTabs({
    project,
    listVersion,
    onBump,
    createMode = false,
}: {
    project: Project;
    listVersion: number;
    onBump: () => void;
    createMode?: boolean;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isCreate = createMode;

    const [tab, setTabState] = useState<ProjectViewTabKey>(() => normalizeTab(searchParams.get('tab')));
    const setTab = useCallback(
        (next: ProjectViewTabKey) => {
            if (isCreate && next !== 'overview') return;
            setTabState(next);
            const url = `/projects-inventory/projects/view/${encodeURIComponent(isCreate ? 'new' : project.slug)}?tab=${encodeURIComponent(next)}`;
            router.replace(url, { scroll: false });
        },
        [isCreate, project.slug, router],
    );

    useEffect(() => {
        const fromUrl = normalizeTab(searchParams.get('tab'));
        setTabState(isCreate ? 'overview' : fromUrl);
    }, [searchParams, isCreate]);

    useEffect(() => {
        if (!isCreate) return;
        if (tab === 'overview') return;
        setTabState('overview');
        router.replace(`/projects-inventory/projects/view/new?tab=overview`, { scroll: false });
    }, [isCreate, tab, router]);

    const [inlineToast, setInlineToast] = useState<{ msg: string; err: boolean } | null>(null);
    const [statusModal, setStatusModal] = useState<{
        open: boolean;
        type: 'success' | 'error';
        title: string;
        subtitle?: string;
        afterClose?: () => void;
    }>({ open: false, type: 'success', title: '' });

    const showStatusModal = useCallback(
        ({ type, title, subtitle, afterClose }: { type: 'success' | 'error'; title: string; subtitle?: string; afterClose?: () => void }) => {
            setStatusModal({ open: true, type, title, subtitle, afterClose });
        },
        [],
    );

    const [isInlineEditing, setIsInlineEditing] = useState(isCreate ? true : false);
    const [inlineSaving, setInlineSaving] = useState(false);
    const [draftLoadedBanner, setDraftLoadedBanner] = useState(false);
    const [createOverviewDraft, setCreateOverviewDraft] = useState<Record<string, unknown>>(() =>
        formValuesToOverviewDraft(emptyCreateFormValues()),
    );
    const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
    const [draftLastSavedAt, setDraftLastSavedAt] = useState<string | null>(null);
    const [latestValues, setLatestValues] = useState<ProjectFormValues>(() => emptyCreateFormValues());
    const createBaselineJsonRef = useRef<string>(JSON.stringify(emptyCreateFormValues()));
    const initialDraftIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!isCreate) return;
        // Capture whether the user opened create with a draftId already present.
        // If draftId is added later by autosave, we should NOT show "editing a draft" UI.
        if (initialDraftIdRef.current !== null) return;
        initialDraftIdRef.current = searchParams.get('draftId')?.trim() || '';
    }, [isCreate, searchParams]);

    useEffect(() => {
        if (!isCreate) return;
        const draftIdFromUrl = searchParams.get('draftId')?.trim() || '';
        if (!draftIdFromUrl) {
            setActiveDraftId(null);
            setDraftLastSavedAt(null);
            setDraftLoadedBanner(false);
            const empty = emptyCreateFormValues();
            createBaselineJsonRef.current = JSON.stringify(empty);
            setCreateOverviewDraft(formValuesToOverviewDraft(empty));
            return;
        }
        const found = draftService.getDraftById<ProjectFormValues>(draftIdFromUrl);
        if (!found || found.module !== 'project') {
            setInlineToast({ msg: 'Draft not found. Starting a new project.', err: true });
            showStatusModal({ type: 'error', title: 'Draft not found', subtitle: 'Starting a new project.' });
            setActiveDraftId(null);
            setDraftLastSavedAt(null);
            setDraftLoadedBanner(false);
            const empty = emptyCreateFormValues();
            createBaselineJsonRef.current = JSON.stringify(empty);
            setCreateOverviewDraft(formValuesToOverviewDraft(empty));
            const sp = new URLSearchParams(searchParams.toString());
            sp.delete('draftId');
            if (!sp.get('tab')) sp.set('tab', 'overview');
            router.replace(`${window.location.pathname}?${sp.toString()}`, { scroll: false });
            return;
        }
        const hydrated = { ...emptyCreateFormValues(), ...(found.data ?? {}) };
        createBaselineJsonRef.current = JSON.stringify(hydrated);
        setCreateOverviewDraft(formValuesToOverviewDraft(hydrated));
        setActiveDraftId(found.draftId);
        setDraftLastSavedAt(found.updatedAt);
        setDraftLoadedBanner(Boolean(initialDraftIdRef.current));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCreate, searchParams]);

    const createDraftDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        return () => {
            if (createDraftDebounceRef.current) clearTimeout(createDraftDebounceRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isCreate) return;
        if (inlineSaving) return;

        // Match Leads behavior: only create/update draft after user modifies the form.
        const dirty = JSON.stringify(latestValues) !== createBaselineJsonRef.current;
        if (!dirty) return;

        if (createDraftDebounceRef.current) clearTimeout(createDraftDebounceRef.current);
        createDraftDebounceRef.current = setTimeout(() => {
            try {
                const saved = draftService.saveDraft<ProjectFormValues>('project', latestValues, activeDraftId ?? undefined);
                setActiveDraftId(saved.draftId);
                setDraftLastSavedAt(saved.updatedAt);
                if (!searchParams.get('draftId')) {
                    const sp = new URLSearchParams(searchParams.toString());
                    sp.set('draftId', saved.draftId);
                    if (!sp.get('tab')) sp.set('tab', 'overview');
                    router.replace(`${window.location.pathname}?${sp.toString()}`, { scroll: false });
                }
            } catch {
                // silent autosave failure; explicit Save Draft handles user feedback
            }
        }, 1400);
         
    }, [latestValues, isCreate, activeDraftId, router, searchParams, inlineSaving]);

    const saveCreateDraft = useCallback(() => {
        if (!isCreate) return;
        try {
            const dirty = JSON.stringify(latestValues) !== createBaselineJsonRef.current;
            if (!dirty) return;
            const saved = draftService.saveDraft<ProjectFormValues>('project', latestValues, activeDraftId ?? undefined);
            setActiveDraftId(saved.draftId);
            setDraftLastSavedAt(saved.updatedAt);
            if (!searchParams.get('draftId')) {
                const sp = new URLSearchParams(searchParams.toString());
                sp.set('draftId', saved.draftId);
                if (!sp.get('tab')) sp.set('tab', 'overview');
                router.replace(`${window.location.pathname}?${sp.toString()}`, { scroll: false });
            }
            // Draft saves silently during create mode (matches Leads UX expectation).
        } catch {
            // Silent failure: user can continue; draft autosave may resume.
        }
    }, [activeDraftId, isCreate, latestValues, router, searchParams, showStatusModal]);

    useEffect(() => {
        const e = searchParams.get('edit');
        if (e !== '1' && e !== 'true') return;
        setIsInlineEditing(true);
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete('edit');
        const qs = sp.toString();
        const base = `/projects-inventory/projects/view/${encodeURIComponent(isCreate ? 'new' : project.slug)}`;
        const next = qs ? `${base}?${qs}` : base;
        router.replace(next, { scroll: false });
    }, [searchParams, router, project.slug, isCreate]);

    const tabs = useMemo(() => {
        const basePath = `/projects-inventory/projects/view/${encodeURIComponent(isCreate ? 'new' : project.slug)}`;
        return [
            { key: 'overview' as const, label: 'Overview', href: `${basePath}?tab=overview` },
            { key: 'inventory' as const, label: 'Inventory', href: `${basePath}?tab=inventory` },
            { key: 'pricing' as const, label: 'Pricing', href: `${basePath}?tab=pricing` },
            { key: 'documents' as const, label: 'Documents', href: `${basePath}?tab=documents` },
            { key: 'payments' as const, label: 'Payments', href: `${basePath}?tab=payments` },
            { key: 'vendors' as const, label: 'Vendors', href: `${basePath}?tab=vendors` },
            { key: 'work-orders' as const, label: 'Work Orders', href: `${basePath}?tab=work-orders` },
            { key: 'history' as const, label: 'History', href: `${basePath}?tab=history` },
        ] as const;
    }, [project.slug, isCreate]);

    const disableNonOverviewTabs = isCreate;
    const nonOverviewKeys: ProjectViewTabKey[] = [
        'inventory',
        'pricing',
        'payments',
        'documents',
        'vendors',
        'work-orders',
        'history',
    ];
    const disableRelatedSections = isCreate || isInlineEditing;
    const relatedDisabledMessage = isCreate ? 'Create project to enable this section' : 'Complete editing to enable this section';

    const disabledSection = (children: React.ReactNode) => (
        <div>
            <div className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
                {relatedDisabledMessage}
            </div>
            <div className="opacity-50 pointer-events-none">{children}</div>
        </div>
    );

    const projectForOverview = project;

    return (
        <div className="w-full min-w-0 space-y-0">
            <StatusModal
                open={statusModal.open}
                type={statusModal.type}
                title={statusModal.title}
                subtitle={statusModal.subtitle}
                autoCloseMs={1750}
                onClose={() => {
                    const after = statusModal.afterClose;
                    setStatusModal((prev) => ({ ...prev, open: false, afterClose: undefined }));
                    if (after) after();
                }}
            />

            {inlineToast ? (
                <InlineToast message={inlineToast.msg} variant={inlineToast.err ? 'error' : 'success'} onDismiss={() => setInlineToast(null)} />
            ) : null}

            <ProjectViewTabBar
                items={[...tabs]}
                activeKey={tab}
                onChange={(next) => {
                    if (disableNonOverviewTabs && next !== 'overview') {
                        setInlineToast({ msg: 'Create project to access other sections.', err: true });
                        return;
                    }
                    setTab(next);
                }}
                disabledKeys={disableNonOverviewTabs ? nonOverviewKeys : undefined}
            />

            {tab === 'overview' ? (
                <>
                    {isCreate && draftLoadedBanner ? (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <p className="font-semibold text-slate-900">You are editing a draft</p>
                                <p className="text-xs font-medium text-slate-600">
                                    {draftLastSavedAt ? `Last saved: ${formatIso(draftLastSavedAt)}` : 'Last saved: —'}
                                </p>
                            </div>
                        </div>
                    ) : null}

                    {isCreate ? (
                        <div className={cn(CTA_INFO_BANNER)}>
                            You are creating a new project{' '}
                            <span className={CTA_INFO_BANNER_BADGE}>Draft</span>
                        </div>
                    ) : null}

                    <div className=" min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
                        {isCreate ? (
                            <ProjectOverviewTab
                                project={projectForOverview}
                                onApproved={onBump}
                                storeVersion={listVersion}
                                createMode
                                createDraft={createOverviewDraft}
                                createErrors={undefined}
                                onCreateDraftChange={(next) => {
                                    const nextDraft = (next ?? {}) as Record<string, unknown>;
                                    setCreateOverviewDraft(nextDraft);
                                    const values = overviewDraftToFormValues(nextDraft);
                                    setLatestValues(values);
                                }}
                                onCreateCancel={() => router.push('/projects-inventory/projects')}
                                onCreateSaveDraft={() => {
                                    saveCreateDraft();
                                    router.replace('/projects-inventory/projects/drafts');
                                }}
                                createSubmitting={inlineSaving}
                                onCreateSubmit={() => {
                                    const values = overviewDraftToFormValues(createOverviewDraft);
                                    setInlineSaving(true);
                                    try {
                                        const created = addProject({
                                            project_name: values.project_name.trim(),
                                            project_type: values.project_type,
                                            location:
                                                `${values.city.trim()}${values.city.trim() && values.state.trim() ? ', ' : ''}${values.state.trim()}`.trim() ||
                                                values.full_address.trim().slice(0, 120) ||
                                                '—',
                                            total_units: values.total_units,
                                            project_status: values.project_status,
                                            requires_approval: values.requires_approval,
                                            full_address: values.full_address.trim(),
                                            city: values.city.trim(),
                                            state: values.state.trim(),
                                            country: values.country.trim() || 'India',
                                            pincode: values.pincode.trim(),
                                            landmark: values.landmark.trim(),
                                            map_url: values.map_url.trim(),
                                            developer_name: values.developer_name.trim(),
                                            project_owner_name: values.project_owner_name.trim(),
                                            project_manager_name: values.project_manager_name.trim(),
                                            executive_manager_name: values.executive_manager_name.trim(),
                                            sales_head: values.sales_head.trim(),
                                            towers_blocks: values.towers_blocks.trim(),
                                            floors: values.floors.trim(),
                                            launch_date: values.launch_date.trim(),
                                            possession_date: values.possession_date.trim(),
                                            starting_price: values.starting_price ? Number(values.starting_price.replace(/\D/g, '')) : undefined,
                                            max_price: values.max_price ? Number(values.max_price.replace(/\D/g, '')) : undefined,
                                            internal_notes: values.internal_notes.trim(),
                                        });
                                        if (activeDraftId) {
                                            try {
                                                draftService.deleteDraft(activeDraftId);
                                            } catch {
                                                // ignore
                                            }
                                        }
                                        onBump();
                                        showStatusModal({
                                            type: 'success',
                                            title: 'Project created successfully',
                                            afterClose: () => {
                                                router.replace(
                                                    `/projects-inventory/projects/view/${encodeURIComponent(created.slug)}?tab=overview`,
                                                    { scroll: true },
                                                );
                                            },
                                        });
                                    } catch {
                                        showStatusModal({ type: 'error', title: 'Something went wrong. Please try again.' });
                                    } finally {
                                        setInlineSaving(false);
                                    }
                                }}
                            />
                        ) : (
                            <ProjectOverviewTab project={projectForOverview} onApproved={onBump} storeVersion={listVersion} startInlineEditing={isInlineEditing} />
                        )}

                       

                        
                    </div>
                </>
            ) : null}

            {tab === 'inventory' ? (
                <div id="wf-project-inventory" className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
                    {disableRelatedSections ? (
                        disabledSection(<ProjectInventoryTab project={project} projectSlug={project.slug} storeVersion={listVersion} projectsCount={0} onStoreRefresh={onBump} />)
                    ) : (
                        <ProjectInventoryTab project={project} projectSlug={project.slug} storeVersion={listVersion} projectsCount={0} onStoreRefresh={onBump} />
                    )}
                </div>
            ) : null}

            {tab === 'pricing' ? (
                <div id="wf-project-pricing" className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
                    {disableRelatedSections ? (
                        disabledSection(<ProjectPricingTab project={project} projectSlug={project.slug} storeVersion={listVersion} onStoreRefresh={onBump} />)
                    ) : (
                        <ProjectPricingTab project={project} projectSlug={project.slug} storeVersion={listVersion} onStoreRefresh={onBump} />
                    )}
                </div>
            ) : null}

            {tab === 'payments' ? (
                <div className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
                    {disableRelatedSections ? (
                        disabledSection(<ProjectPaymentsTab project={project} storeVersion={listVersion} />)
                    ) : (
                        <ProjectPaymentsTab project={project} storeVersion={listVersion} />
                    )}
                </div>
            ) : null}

            {tab === 'documents' ? (
                <div id="wf-project-documents" className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
                    {disableRelatedSections ? (
                        disabledSection(<ProjectDocumentsTab project={project} projectSlug={project.slug} storeVersion={listVersion} onStoreRefresh={onBump} />)
                    ) : (
                        <ProjectDocumentsTab project={project} projectSlug={project.slug} storeVersion={listVersion} onStoreRefresh={onBump} />
                    )}
                </div>
            ) : null}

            {tab === 'vendors' ? (
                <div className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
                    {disableRelatedSections ? (
                        disabledSection(<ProjectVendorsTab project={project} storeVersion={listVersion} />)
                    ) : (
                        <ProjectVendorsTab project={project} storeVersion={listVersion} />
                    )}
                </div>
            ) : null}

            {tab === 'work-orders' ? (
                <div className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
                    {disableRelatedSections ? (
                        disabledSection(<ProjectWorkOrdersTab project={project} storeVersion={listVersion} />)
                    ) : (
                        <ProjectWorkOrdersTab project={project} storeVersion={listVersion} />
                    )}
                </div>
            ) : null}

            {tab === 'history' ? (
                <div className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
                    {disableRelatedSections ? disabledSection(<ProjectActivityTab projectSlug={project.slug} storeVersion={listVersion} />) : <ProjectActivityTab projectSlug={project.slug} storeVersion={listVersion} />}
                </div>
            ) : null}
        </div>
    );
}

