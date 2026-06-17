'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { EditableDate, EditableField, EditableSelect, EditableTextarea } from '@/components/leads/detail/InlineEditableSection';
import { ProjectStatusBadge } from '@/components/projects-inventory/ProjectStatusBadge';
import { cn } from '@/lib/utils';
import {
    addProject,
    approveProject,
    archiveProject,
    computeDemandScorePercent,
    estimateProjectRevenuePotential,
    formatCurrencyINR,
    getLeadDemandCountForProjectName,
    getPricingHistoryForProject,
    getProjectDocuments,
    getProjectInventoryBuckets,
    getProjects,
    getUnits,
    unarchiveProject,
    updateProject,
    type Project,
    type ProjectStatus,
    type ProjectType,
} from '@/lib/projectsInventoryStore';
import { WorkspaceHelp, PROJECT_WORKSPACE_HELP } from '@/components/workspace-help';
import {
    LuBuilding2,
    LuCalendar,
    LuCheck,
    LuChevronDown,
    LuClipboardCheck,
    LuCopy,
    LuDownload,
    LuFileText,
    LuFingerprint,
    LuLayers,
    LuMapPin,
    LuPlus,
    LuPencil,
    LuShare2,
    LuSparkles,
    LuTag,
    LuTrendingUp,
    LuArchive,
    LuUsers,
} from 'react-icons/lu';
import { ComplianceAICard } from '@/components/ai/ComplianceAICard';
import { RecordWorkflowStepper } from '@/components/workflow/RecordWorkflowStepper';
import { computeProjectWorkflowSteps } from '@/lib/projects/projectWorkflow';
import { createWorkflowStepHandler, scrollToWorkflowSection } from '@/lib/workflow/workflowStepNavigation';
import { ProjectRecordCard } from '@/components/projects-inventory/project-view/ProjectDetailPrimitives';
import {
    buildProjectEnterpriseDraft,
    DEFAULT_ENTERPRISE_SECTIONS_OPEN,
    ProjectOverviewEnterpriseSections,
    ProjectOverviewRightRailEnhancements,
    projectEnterpriseDraftToPatch,
    type ProjectEnterpriseDraft,
} from '@/components/projects-inventory/project-view/ProjectOverviewEnterpriseSections';
import {
    CTA_EDITING_BADGE,
    CTA_FLOW_LINK,
    CTA_SHADOW_SOFT,
    CTA_UTILITY_BTN,
} from '@/lib/theme/ctaThemeClasses';

const actionBtn =
    'flex min-h-10 w-full min-w-0 items-center justify-center gap-1.5 px-2.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] sm:px-3';

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

type Props = {
    project: Project;
    onApproved?: () => void;
    storeVersion: number;
    startInlineEditing?: boolean;

    /** Create mode renders inside `/projects-inventory/projects/view/new` (single-page create flow like Leads). */
    createMode?: boolean;
    /** Create-mode draft state (stored in localStorage by the parent). */
    createDraft?: Record<string, unknown>;
    /** Create-mode field errors (required fields, url format, etc.). */
    createErrors?: Record<string, string | undefined>;
    /** Update create-mode draft state (parent-controlled). */
    onCreateDraftChange?: (next: any) => void;
    /** Create-mode actions (parent-controlled). */
    onCreateCancel?: () => void;
    onCreateSaveDraft?: () => void;
    onCreateSubmit?: (draft: ProjectInlineDraft) => void;
    createSubmitting?: boolean;
};

type ProjectInlineDraft = {
    project_name: string;
    project_type: ProjectType | '';
    project_status: ProjectStatus | '';
    requires_approval: boolean | '';
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

type ProjectInlineErrorKey =
    | 'project_name'
    | 'project_type'
    | 'project_status'
    | 'full_address'
    | 'city'
    | 'state'
    | 'project_owner_name'
    | 'project_manager_name'
    | 'executive_manager_name'
    | 'total_units'
    | 'map_url';

const PROJECT_INLINE_FIELD_IDS: Record<ProjectInlineErrorKey, string> = {
    project_name: 'project-inline-project-name',
    project_type: 'project-inline-project-type',
    project_status: 'project-inline-project-status',
    full_address: 'project-inline-full-address',
    city: 'project-inline-city',
    state: 'project-inline-state',
    map_url: 'project-inline-map-url',
    project_owner_name: 'project-inline-owner',
    project_manager_name: 'project-inline-manager',
    executive_manager_name: 'project-inline-exec',
    total_units: 'project-inline-total-units',
};

type SectionTone = 'blue' | 'amber' | 'slate';

function InlineCollapsibleSection({
    title,
    icon: Icon,
    tone,
    open,
    onOpenChange,
    headerRight,
    sectionId,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: SectionTone;
    open: boolean;
    onOpenChange: (next: boolean) => void;
    headerRight?: React.ReactNode;
    sectionId?: string;
    children: React.ReactNode;
}) {
    const toneClasses =
        tone === 'blue'
            ? {
                  head: 'bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)]',
                  icon: 'text-[var(--cta-button-bg)]',
                  ring: 'ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]',
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
                <span className={cn('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/90 ring-1', toneClasses.ring)} aria-hidden>
                    <Icon className={cn('h-4 w-4', toneClasses.icon)} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-semibold tracking-wide text-gray-800">{title}</span>
                        {headerRight ? <span className="ml-auto shrink-0">{headerRight}</span> : null}
                    </span>
                </span>
                <LuChevronDown className={cn('h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
            </button>
            <div hidden={!open}>
                {children}
            </div>
        </section>
    );
}

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
                'flex w-full items-center gap-3 border-b border-gray-200/80 px-3 py-2.5',
                'odd:bg-gray-50/50',
                // When placed inside a 2-col grid (md+), give a subtle center divider.
                'md:odd:border-r md:odd:border-gray-100',
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
                <span className="w-full min-w-0">{children}</span>
            </div>
        </div>
    );
}

function buildProjectInlineDraft(p: Project): ProjectInlineDraft {
    return {
        project_name: p.project_name ?? '',
        project_type: (p.project_type as ProjectType | '') ?? '',
        project_status: (p.project_status as ProjectStatus | '') ?? '',
        requires_approval: p.approval_status ? p.approval_status === 'pending' : '',
        total_units: Number.isFinite(p.total_units) ? String(p.total_units) : '',
        developer_name: p.developer_name ?? '',
        full_address: p.full_address ?? '',
        city: p.city ?? '',
        state: p.state ?? '',
        country: p.country ?? '',
        pincode: p.pincode ?? '',
        landmark: p.landmark ?? '',
        map_url: p.map_url ?? '',
        project_owner_name: p.project_owner_name ?? '',
        project_manager_name: p.project_manager_name ?? '',
        executive_manager_name: p.executive_manager_name ?? '',
        sales_head: p.sales_head ?? '',
        towers_blocks: p.towers_blocks ?? '',
        floors: p.floors ?? '',
        launch_date: p.launch_date ?? '',
        possession_date: p.possession_date ?? '',
        starting_price: p.starting_price != null ? String(p.starting_price) : '',
        max_price: p.max_price != null ? String(p.max_price) : '',
        internal_notes: p.internal_notes ?? '',
    };
}

function toLocationFromCityState(draft: Pick<ProjectInlineDraft, 'city' | 'state'> & { full_address?: string; location?: string }) {
    const c = (draft.city ?? '').trim();
    const s = (draft.state ?? '').trim();
    if (c && s) return `${c}, ${s}`;
    return c || s || draft.full_address?.trim() || draft.location || '';
}

function parseOptRupee(raw: string) {
    const n = Number((raw ?? '').replace(/\D/g, ''));
    return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function ProjectOverviewTab({
    project,
    onApproved,
    storeVersion,
    startInlineEditing,
    createMode,
    createDraft,
    createErrors,
    onCreateDraftChange,
    onCreateCancel,
    onCreateSaveDraft,
    onCreateSubmit,
    createSubmitting,
}: Props) {
    const router = useRouter();
    const isCreate = Boolean(createMode);
    const [isApproving, setIsApproving] = useState(false);
    const [isInlineEditing, setIsInlineEditing] = useState(false);
    const [projectOptimistic, setProjectOptimistic] = useState<Project | null>(null);
    const displayedProject = projectOptimistic ?? project;
    const approvalStatus = displayedProject.approval_status;
    const isArchived = displayedProject.archived === true;

    const [inlineDraft, setInlineDraft] = useState<ProjectInlineDraft>(() => buildProjectInlineDraft(project));
    const [inlineBaseline, setInlineBaseline] = useState<ProjectInlineDraft>(() => buildProjectInlineDraft(project));
    const [enterpriseDraft, setEnterpriseDraft] = useState<ProjectEnterpriseDraft>(() => buildProjectEnterpriseDraft(project));
    const [enterpriseBaseline, setEnterpriseBaseline] = useState<ProjectEnterpriseDraft>(() => buildProjectEnterpriseDraft(project));
    const [inlineErrors, setInlineErrors] = useState<Partial<Record<ProjectInlineErrorKey, string>>>({});
    const [inlineSaving, setInlineSaving] = useState(false);
    const [inlineToast, setInlineToast] = useState<{ msg: string; err: boolean } | null>(null);

    useEffect(() => {
        if (!isCreate) return;
        const base = buildProjectInlineDraft(displayedProject);
        const merged = { ...base, ...(createDraft ?? {}) } as unknown as ProjectInlineDraft;
        setInlineBaseline(merged);
        setInlineDraft(merged);
        setInlineErrors((createErrors ?? {}) as Partial<Record<ProjectInlineErrorKey, string>>);
        setInlineToast(null);
        setIsInlineEditing(true);
        setInlineSaving(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCreate]);

    useEffect(() => {
        if (!projectOptimistic) return;
        if (projectOptimistic.updated_at && project.updated_at && projectOptimistic.updated_at === project.updated_at) {
            setProjectOptimistic(null);
        }
    }, [projectOptimistic, project.updated_at]);

    const projectTypeOptions = useMemo(() => ['Plot', 'Apartment', 'Villa'] as ProjectType[], []);
    const projectStatusOptions = useMemo(() => ['upcoming', 'active', 'sold out'] as ProjectStatus[], []);

    const teamMemberOptions = useMemo(() => {
        const all = getProjects();
        const set = new Set<string>();
        for (const p of all) {
            if (p.project_owner_name?.trim()) set.add(p.project_owner_name.trim());
            if (p.project_manager_name?.trim()) set.add(p.project_manager_name.trim());
            if (p.executive_manager_name?.trim()) set.add(p.executive_manager_name.trim());
            if (p.sales_head?.trim()) set.add(p.sales_head.trim());
        }
        const curated = Array.from(set);
        return curated.sort((a, b) => a.localeCompare(b));
    }, [storeVersion]);

    const onWorkflowStepNavigate = useCallback(
        createWorkflowStepHandler({
            isCreate,
            onBlocked: (msg) => setInlineToast({ msg, err: true }),
            onTabRoute: (nextTab, sectionId) => {
                if (isCreate) return;
                if (nextTab !== 'overview') {
                    const slug = displayedProject.slug;
                    router.push(`/projects-inventory/projects/view/${slug}?tab=${encodeURIComponent(nextTab)}`);
                    if (sectionId) window.setTimeout(() => scrollToWorkflowSection(sectionId), 150);
                    return;
                }
                if (sectionId) scrollToWorkflowSection(sectionId);
            },
        }),
        [isCreate, displayedProject.slug, router],
    );

    const projectWorkflowSteps = useMemo(() => {
        const slug = displayedProject.slug;
        const inventory = isCreate ? { total: 0 } : getProjectInventoryBuckets(slug);
        const pricingHistory = isCreate ? [] : getPricingHistoryForProject(slug);
        const projectUnits = isCreate ? [] : getUnits().filter((u) => u.projectSlug === slug);
        const hasPricingConfigured =
            pricingHistory.length > 0 || projectUnits.some((u) => (u.offer_price ?? u.price) > 0);
        const documentCount = isCreate ? 0 : getProjectDocuments(slug).length;

        return computeProjectWorkflowSteps({
            isCreate,
            approvalStatus: displayedProject.approval_status ?? 'pending',
            projectStatus: displayedProject.project_status ?? 'upcoming',
            inventoryUnitCount: inventory.total,
            hasPricingConfigured,
            documentCount,
        });
    }, [isCreate, displayedProject.slug, displayedProject.approval_status, displayedProject.project_status, storeVersion]);

    const changedByKey = useMemo(() => {
        const next: Partial<Record<keyof ProjectInlineDraft, boolean>> = {};
        (Object.keys(inlineDraft) as (keyof ProjectInlineDraft)[]).forEach((k) => {
            next[k] = inlineDraft[k] !== inlineBaseline[k];
        });
        return next;
    }, [inlineDraft, inlineBaseline]);

    const enterpriseChangedByKey = useMemo(() => {
        const next: Partial<Record<keyof ProjectEnterpriseDraft, boolean>> = {};
        (Object.keys(enterpriseDraft) as (keyof ProjectEnterpriseDraft)[]).forEach((k) => {
            next[k] = enterpriseDraft[k] !== enterpriseBaseline[k];
        });
        return next;
    }, [enterpriseDraft, enterpriseBaseline]);

    const scrollToInlineErrorField = (key: ProjectInlineErrorKey) => {
        const el = document.getElementById(PROJECT_INLINE_FIELD_IDS[key]);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if ('focus' in el && typeof (el as HTMLElement & { focus: () => void }).focus === 'function') {
            (el as HTMLElement & { focus: () => void }).focus();
        }
    };

    const runInlineValidation = () => {
        const next: Partial<Record<ProjectInlineErrorKey, string>> = {};
        if (!inlineDraft.project_name.trim()) next.project_name = 'Project name is required';
        else if (inlineDraft.project_name.trim().length > 200) next.project_name = 'Use at most 200 characters';

        if (!inlineDraft.project_type) next.project_type = 'Project type is required';
        if (!inlineDraft.project_status) next.project_status = 'Project status is required';

        if (!inlineDraft.full_address.trim()) next.full_address = 'Full address is required';
        if (!inlineDraft.city.trim()) next.city = 'City is required';
        if (!inlineDraft.state.trim()) next.state = 'State is required';

        if (!inlineDraft.project_owner_name.trim()) next.project_owner_name = 'Project owner is required';
        if (!inlineDraft.project_manager_name.trim()) next.project_manager_name = 'Project manager is required';
        if (!inlineDraft.executive_manager_name.trim()) next.executive_manager_name = 'Executive manager is required';

        const units = Number(inlineDraft.total_units.replace(/\D/g, ''));
        if (!Number.isFinite(units) || units <= 0) next.total_units = 'Enter a positive number of units';

        if (inlineDraft.map_url.trim() && !/^https?:\/\//i.test(inlineDraft.map_url.trim())) {
            next.map_url = 'Enter a valid URL (https://…)';
        }

        return next;
    };

    const onInlineDraftChange = <K extends keyof ProjectInlineDraft>(key: K, value: ProjectInlineDraft[K]) => {
        setInlineDraft((prev) => {
            const next =
                key === 'requires_approval'
                    ? (() => {
                          const v = value as ProjectInlineDraft['requires_approval'];
                          const on: ProjectInlineDraft['requires_approval'] = v === '' ? '' : Boolean(v);
                          return {
                              ...prev,
                              requires_approval: on,
                              project_status: on === true ? ('upcoming' as ProjectStatus) : prev.project_status,
                          };
                      })()
                    : { ...prev, [key]: value };

            if (isCreate) onCreateDraftChange?.(next);
            return next;
        });
        setInlineErrors((prev) => {
            if (!prev[key as ProjectInlineErrorKey]) return prev;
            const next = { ...prev };
            delete next[key as ProjectInlineErrorKey];
            return next;
        });
    };

    const onInlineEditStart = React.useCallback(() => {
        const base = buildProjectInlineDraft(displayedProject);
        const entBase = buildProjectEnterpriseDraft(displayedProject);
        setInlineBaseline(base);
        setInlineDraft(base);
        setEnterpriseBaseline(entBase);
        setEnterpriseDraft(entBase);
        setInlineErrors({});
        setInlineToast(null);
        setIsInlineEditing(true);
        setInlineSaving(false);
    }, [displayedProject]);

    // Edit mode: show required-field validation immediately when entering edit mode.
    useEffect(() => {
        if (isCreate) return;
        if (!isInlineEditing) return;
        setInlineErrors(runInlineValidation());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isInlineEditing, isCreate]);

    useEffect(() => {
        if (!startInlineEditing) return;
        onInlineEditStart();
    }, [startInlineEditing, onInlineEditStart]);

    const onInlineEditCancel = () => {
        setInlineDraft(inlineBaseline);
        setEnterpriseDraft(enterpriseBaseline);
        setInlineErrors({});
        setIsInlineEditing(false);
        setInlineToast(null);
    };

    const onShare = async () => {
        try {
            const url = window.location.href;
            await navigator.clipboard.writeText(url);
            setInlineToast({ msg: 'Project link copied.', err: false });
        } catch {
            setInlineToast({ msg: 'Could not copy link. Please try again.', err: true });
        }
    };

    const onClone = () => {
        try {
            const base = displayedProject;
            const created = addProject({
                project_name: `${base.project_name} (Copy)`,
                project_type: base.project_type,
                location: base.location,
                total_units: base.total_units,
                project_status: base.project_status,
                requires_approval: (base.approval_status ?? 'pending') === 'pending',
                full_address: base.full_address ?? '',
                city: base.city ?? '',
                state: base.state ?? '',
                country: base.country ?? 'India',
                pincode: base.pincode ?? '',
                landmark: base.landmark ?? '',
                map_url: base.map_url ?? '',
                developer_name: base.developer_name ?? '',
                project_owner_name: base.project_owner_name ?? '',
                project_manager_name: base.project_manager_name ?? '',
                executive_manager_name: base.executive_manager_name ?? '',
                sales_head: base.sales_head ?? '',
                towers_blocks: base.towers_blocks ?? '',
                floors: base.floors ?? '',
                launch_date: base.launch_date ?? '',
                possession_date: base.possession_date ?? '',
                starting_price: base.starting_price,
                max_price: base.max_price,
                internal_notes: base.internal_notes ?? '',
            });
            setInlineToast({ msg: 'Project cloned successfully.', err: false });
            onApproved?.();
            router.push(`/projects-inventory/projects/view/${created.slug}?tab=overview&edit=1`);
        } catch {
            setInlineToast({ msg: 'Could not clone project. Please try again.', err: true });
        }
    };

    const onToggleArchive = () => {
        try {
            const updated = isArchived ? unarchiveProject(displayedProject.slug) : archiveProject(displayedProject.slug);
            if (!updated) {
                setInlineToast({ msg: 'Could not update archive state. Please try again.', err: true });
                return;
            }
            setProjectOptimistic(updated);
            onApproved?.();
            setInlineToast({ msg: isArchived ? 'Project restored from archive.' : 'Project archived.', err: false });
        } catch {
            setInlineToast({ msg: 'Could not update archive state. Please try again.', err: true });
        }
    };

    const onInlineEditSave = async (): Promise<boolean> => {
        const nextErrors = runInlineValidation();
        setInlineErrors(nextErrors);

        const firstError = (Object.keys(nextErrors)[0] ?? null) as ProjectInlineErrorKey | null;
        if (firstError) {
            window.requestAnimationFrame(() => scrollToInlineErrorField(firstError));
            setInlineToast({ msg: 'Please fill required fields.', err: true });
            return false;
        }

        const patch: Record<string, unknown> = {};
        const base = inlineBaseline;
        const draft = inlineDraft;

        const trimMaybe = (v: string) => v.trim();
        const toLocation = () =>
            toLocationFromCityState({
                city: draft.city,
                state: draft.state,
                full_address: draft.full_address,
                location: displayedProject.location,
            });

        if (trimMaybe(draft.project_name) !== trimMaybe(base.project_name)) patch.project_name = trimMaybe(draft.project_name);
        if (draft.project_type !== base.project_type) patch.project_type = draft.project_type;
        if (draft.requires_approval !== base.requires_approval || draft.project_status !== base.project_status) {
            patch.approval_status = draft.requires_approval ? 'pending' : 'approved';
            patch.project_status = draft.requires_approval ? 'upcoming' : draft.project_status;
        }

        if (trimMaybe(draft.developer_name) !== trimMaybe(base.developer_name)) patch.developer_name = trimMaybe(draft.developer_name);

        const unitsDraft = Number(draft.total_units.replace(/\D/g, ''));
        const unitsBase = Number(base.total_units.replace(/\D/g, ''));
        if (Number.isFinite(unitsDraft) && unitsDraft > 0 && unitsDraft !== unitsBase) patch.total_units = unitsDraft;

        if (trimMaybe(draft.full_address) !== trimMaybe(base.full_address)) patch.full_address = trimMaybe(draft.full_address);
        if (trimMaybe(draft.city) !== trimMaybe(base.city)) patch.city = trimMaybe(draft.city);
        if (trimMaybe(draft.state) !== trimMaybe(base.state)) patch.state = trimMaybe(draft.state);
        if (trimMaybe(draft.pincode) !== trimMaybe(base.pincode)) patch.pincode = trimMaybe(draft.pincode);
        if (trimMaybe(draft.country) !== trimMaybe(base.country)) patch.country = trimMaybe(draft.country) || 'India';
        if (trimMaybe(draft.landmark) !== trimMaybe(base.landmark)) patch.landmark = trimMaybe(draft.landmark);
        if (trimMaybe(draft.map_url) !== trimMaybe(base.map_url)) patch.map_url = trimMaybe(draft.map_url);

        if (
            trimMaybe(draft.city) !== trimMaybe(base.city) ||
            trimMaybe(draft.state) !== trimMaybe(base.state) ||
            trimMaybe(draft.full_address) !== trimMaybe(base.full_address)
        ) {
            const nextLocation = toLocation();
            if (nextLocation.trim()) patch.location = nextLocation.trim();
        }

        if (trimMaybe(draft.project_owner_name) !== trimMaybe(base.project_owner_name)) patch.project_owner_name = trimMaybe(draft.project_owner_name);
        if (trimMaybe(draft.project_manager_name) !== trimMaybe(base.project_manager_name)) patch.project_manager_name = trimMaybe(draft.project_manager_name);
        if (trimMaybe(draft.executive_manager_name) !== trimMaybe(base.executive_manager_name))
            patch.executive_manager_name = trimMaybe(draft.executive_manager_name);
        if (trimMaybe(draft.sales_head) !== trimMaybe(base.sales_head)) patch.sales_head = trimMaybe(draft.sales_head);

        if (trimMaybe(draft.towers_blocks) !== trimMaybe(base.towers_blocks)) patch.towers_blocks = trimMaybe(draft.towers_blocks);
        if (trimMaybe(draft.floors) !== trimMaybe(base.floors)) patch.floors = trimMaybe(draft.floors);

        if (trimMaybe(draft.launch_date) !== trimMaybe(base.launch_date)) patch.launch_date = trimMaybe(draft.launch_date);
        if (trimMaybe(draft.possession_date) !== trimMaybe(base.possession_date)) patch.possession_date = trimMaybe(draft.possession_date);

        if (trimMaybe(draft.starting_price) !== trimMaybe(base.starting_price)) patch.starting_price = parseOptRupee(draft.starting_price);
        if (trimMaybe(draft.max_price) !== trimMaybe(base.max_price)) patch.max_price = parseOptRupee(draft.max_price);

        if (trimMaybe(draft.internal_notes) !== trimMaybe(base.internal_notes)) patch.internal_notes = trimMaybe(draft.internal_notes);

        const enterprisePatch = projectEnterpriseDraftToPatch(enterpriseDraft);
        const enterpriseBasePatch = projectEnterpriseDraftToPatch(enterpriseBaseline);
        for (const [k, v] of Object.entries(enterprisePatch)) {
            const baseVal = (enterpriseBasePatch as Record<string, unknown>)[k];
            if (JSON.stringify(v) !== JSON.stringify(baseVal)) {
                (patch as Record<string, unknown>)[k] = v;
            }
        }

        if (Object.keys(patch).length === 0) {
            setIsInlineEditing(false);
            return true;
        }

        setInlineSaving(true);
        try {
            const updated = updateProject(project.slug, patch as any);
            if (!updated) {
                setInlineToast({ msg: 'Could not save changes. Please try again.', err: true });
                return false;
            }
            const updatedDraft = buildProjectInlineDraft(updated);
            const updatedEnterprise = buildProjectEnterpriseDraft(updated);
            setProjectOptimistic(updated);
            setInlineDraft(updatedDraft);
            setInlineBaseline(updatedDraft);
            setEnterpriseDraft(updatedEnterprise);
            setEnterpriseBaseline(updatedEnterprise);
            setInlineErrors({});
            setIsInlineEditing(false);
            onApproved?.();
            setInlineToast({ msg: 'Project updated successfully.', err: false });
            return true;
        } finally {
            setInlineSaving(false);
        }
    };

    const onInlineEditSaveAndExit = async () => {
        const ok = await onInlineEditSave();
        if (!ok) return;
        router.push('/projects-inventory/projects');
    };

    const onCreateProject = () => {
        const nextErrors = runInlineValidation();
        setInlineErrors(nextErrors);
        const firstError = (Object.keys(nextErrors)[0] ?? null) as ProjectInlineErrorKey | null;
        if (firstError) {
            window.requestAnimationFrame(() => scrollToInlineErrorField(firstError));
            setInlineToast({ msg: 'Please fill required fields.', err: true });
            return;
        }
        onCreateSubmit?.(inlineDraft);
    };

    const buckets = useMemo(() => getProjectInventoryBuckets(project.slug), [project.slug, storeVersion]);
    const revenuePotential = useMemo(() => estimateProjectRevenuePotential(project), [project, storeVersion]);
    const leadDemand = useMemo(() => getLeadDemandCountForProjectName(project.project_name), [project.project_name, storeVersion]);
    const projectsCount = useMemo(() => getProjects().length, [storeVersion]);
    const demandScore = computeDemandScorePercent(leadDemand, Math.max(1, projectsCount));

    const EMPTY = '—';
    const utilityBtn = CTA_UTILITY_BTN;

    const exportProjectJson = () => {
        const blob = new Blob([JSON.stringify(displayedProject, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safe =
            (displayedProject.slug || displayedProject.project_name || 'project')
                .toString()
                .trim()
                .replace(/[/\\?%*:|"<>]/g, '-')
                .replace(/\.+$/, '')
                .slice(0, 80) || 'project';
        a.download = `${safe}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const [sectionsOpen, setSectionsOpen] = useState({
        info: true,
        address: true,
        team: true,
        timeline: true,
        commercial: true,
        notes: true,
        ...DEFAULT_ENTERPRISE_SECTIONS_OPEN,
    });

    return (
        <div className="flex w-full min-w-0 flex-col gap-2 lg:gap-3">
            {inlineToast ? (
                <InlineToast
                    message={inlineToast.msg}
                    variant={inlineToast.err ? 'error' : 'success'}
                    onDismiss={() => setInlineToast(null)}
                />
            ) : null}

            {!isCreate ? (
                <div className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={onInlineEditStart}
                                disabled={isInlineEditing || inlineSaving || isArchived}
                                className={cn(
                                    actionBtn,
                                    'w-auto rounded-md bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] hover:bg-[var(--cta-button-hover-bg)] disabled:bg-gray-300 disabled:text-gray-600',
                                )}
                            >
                                <LuPencil size={16} />
                                {isInlineEditing ? 'Editing' : 'Edit'}
                            </button>
                            <button
                                type="button"
                                onClick={onClone}
                                disabled={inlineSaving}
                                className={cn(actionBtn, 'w-auto rounded-md border border-slate-200 bg-white text-slate-800 hover:bg-gray-100')}
                            >
                                <LuCopy size={16} />
                                Clone
                            </button>
                            <button
                                type="button"
                                onClick={onShare}
                                disabled={inlineSaving}
                                className={cn(actionBtn, 'w-auto rounded-md border border-slate-200 bg-white text-slate-800 hover:bg-gray-100')}
                            >
                                <LuShare2 size={16} />
                                Share
                            </button>
                            <button
                                type="button"
                                onClick={onToggleArchive}
                                disabled={inlineSaving || isInlineEditing}
                                className={cn(actionBtn, 'w-auto rounded-md border border-rose-300 bg-white text-rose-700 hover:bg-rose-50')}
                            >
                                <LuArchive size={16} />
                                {isArchived ? 'Restore' : 'Archive'}
                            </button>

                            {approvalStatus === 'pending' ? (
                                <button
                                    type="button"
                                    disabled={isApproving || isInlineEditing || inlineSaving || isArchived}
                                    className={cn(
                                    actionBtn,
                                    'w-auto rounded-md bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] hover:bg-[var(--cta-button-hover-bg)] disabled:bg-gray-300 disabled:text-gray-600',
                                )}
                                    onClick={() => {
                                        setIsApproving(true);
                                        approveProject(project.slug);
                                        onApproved?.();
                                        setIsApproving(false);
                                    }}
                                >
                                    <LuCheck size={16} />
                                    Approve
                                </button>
                            ) : null}

                            <button
                                type="button"
                                disabled={inlineSaving}
                                className={cn(actionBtn, 'w-auto rounded-md border border-slate-200 bg-white text-slate-800 hover:bg-gray-100')}
                                onClick={() => {
                                    router.push('/projects-inventory/projects/view/new?tab=overview');
                                }}
                            >
                                <LuPlus size={16} />
                                New
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                            <details className="relative sm:hidden">
                                <summary className={cn(utilityBtn, 'list-none cursor-pointer select-none')}>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span>More</span>
                                        <LuChevronDown size={16} aria-hidden />
                                    </span>
                                </summary>
                                <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                                    <div className="p-1">
                                        {displayedProject.map_url?.trim() ? (
                                            <a
                                                href={displayedProject.map_url.trim()}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                                            >
                                                <LuMapPin size={16} aria-hidden />
                                                Map
                                            </a>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={exportProjectJson}
                                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                                        >
                                            <LuDownload size={16} aria-hidden />
                                            Export
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => window.print()}
                                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                                        >
                                            <LuFileText size={16} aria-hidden />
                                            Print
                                        </button>
                                    </div>
                                </div>
                            </details>
                            <WorkspaceHelp {...PROJECT_WORKSPACE_HELP} triggerLabel="Project workspace help" className="sm:hidden" />
                            <div className="hidden items-center gap-3 sm:flex">
                                <div className="h-6 w-px bg-gray-300" aria-hidden />
                                {displayedProject.map_url?.trim() ? (
                                    <a href={displayedProject.map_url.trim()} target="_blank" rel="noreferrer" className={utilityBtn}>
                                        <LuMapPin size={16} aria-hidden />
                                        Map
                                    </a>
                                ) : null}
                                <button type="button" onClick={exportProjectJson} className={utilityBtn}>
                                    <LuDownload size={16} aria-hidden />
                                    Export
                                </button>
                                <button type="button" onClick={() => window.print()} className={utilityBtn}>
                                    <LuFileText size={16} aria-hidden />
                                    Print
                                </button>
                                <WorkspaceHelp {...PROJECT_WORKSPACE_HELP} triggerLabel="Project workspace help" />
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {!isCreate ? (
                <div className="rounded-md bg-white/80 px-4 py-2 text-sm text-gray-700">
                    <div className="flex justify-center flex-wrap items-center gap-x-6 gap-y-1">
                        <span className="inline-flex items-center gap-2">
                            <LuCalendar size={14} className="text-gray-500" aria-hidden />
                            <span className="text-gray-600">Created</span>
                            <span className="font-medium text-gray-900">{displayedProject.created_at ?? EMPTY}</span>
                        </span>
                        <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                        <span className="inline-flex items-center gap-2">
                            <LuCalendar size={14} className="text-gray-500" aria-hidden />
                            <span className="text-gray-600">Last updated</span>
                            <span className="font-medium text-gray-900">{displayedProject.updated_at ?? EMPTY}</span>
                        </span>
                    </div>
                </div>
            ) : null}

            <div className="mt-3">
                <RecordWorkflowStepper
                    steps={projectWorkflowSteps}
                    ariaLabel="Project setup workflow"
                    onStepNavigate={onWorkflowStepNavigate}
                />
            </div>

            <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-5">
                <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:col-span-2">
                    <ProjectRecordCard
                        className={
                            isInlineEditing
                                ? cn(
                                      'border-[color-mix(in_srgb,var(--cta-button-bg)_32%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)] bg-[#7185a217]',
                                      CTA_SHADOW_SOFT,
                                  )
                                : undefined
                        }
                    >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <div className="flex min-w-0 gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-gray-100 to-gray-50 text-lg font-semibold text-gray-700 ring-1 ring-gray-200/80">
                                    {initials(displayedProject.project_name)}
                                </div>
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="truncate text-2xl font-semibold tracking-tight text-gray-900">
                                            {isCreate ? 'New project' : displayedProject.project_name}
                                        </h2>
                                        {isInlineEditing ? (
                                            <span className={CTA_EDITING_BADGE}>
                                                {isCreate ? 'Create Mode' : 'Editing Mode'}
                                            </span>
                                        ) : null}
                                        {!isCreate ? <ProjectStatusBadge status={displayedProject.project_status} /> : null}
                                    </div>
                                    {!isCreate ? (
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                            <span className="inline-flex items-center gap-1.5">
                                                <LuBuilding2 size={14} className="shrink-0 text-gray-400" aria-hidden />
                                                <span className="text-gray-500">Type</span>
                                                <span className="font-medium text-gray-800">{displayedProject.project_type}</span>
                                            </span>
                                            <span className="inline-flex min-w-0 items-center gap-1.5">
                                                <LuMapPin size={14} className="shrink-0 text-gray-400" aria-hidden />
                                                <span className="truncate font-medium text-gray-800">{displayedProject.location}</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1.5">
                                                <LuLayers size={14} className="text-gray-400" aria-hidden />
                                                <span className="text-gray-500">Planned</span>
                                                <span className="font-medium tabular-nums text-gray-800">{displayedProject.total_units} units</span>
                                            </span>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {!isCreate ? (
                            <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50/70 px-4 py-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Live inventory</p>
                                <p className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700">
                                    <span>
                                        <strong className="tabular-nums text-gray-900">{buckets.total}</strong> total
                                    </span>
                                    <span>
                                        <strong className="tabular-nums text-emerald-700">{buckets.available}</strong> available
                                    </span>
                                    <span>
                                        <strong className="tabular-nums text-gray-900">{buckets.booked}</strong> booked
                                    </span>
                                    <span>
                                        <strong className="tabular-nums text-amber-800">{buckets.reserved}</strong> reserved
                                    </span>
                                    <span>
                                        <strong className="tabular-nums text-rose-800">{buckets.blocked}</strong> blocked
                                    </span>
                                </p>
                                <p className="mt-2 text-xs text-gray-600">
                                    Revenue potential (non-sold):{' '}
                                    <span className="font-semibold text-gray-900">{formatCurrencyINR(revenuePotential)}</span>
                                </p>
                            </div>
                        ) : null}

                        <div className={cn(isInlineEditing && 'rounded-md bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]')}>
                            <div className="mt-4 space-y-4">
                                <InlineCollapsibleSection
                                    title="PROJECT INFORMATION"
                                    icon={LuFingerprint}
                                    tone="blue"
                                    sectionId="wf-project-information"
                                    open={sectionsOpen.info}
                                    onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, info: o }))}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2">
                                        <FieldRow label="Project ID">
                                            <span className="font-mono text-sm tracking-tight">{displayedProject.project_id}</span>
                                        </FieldRow>
                                        <FieldRow label="Project Name" required>
                                            <EditableField
                                                id={PROJECT_INLINE_FIELD_IDS.project_name}
                                                isEditing={isInlineEditing}
                                                error={inlineErrors.project_name}
                                                isChanged={Boolean(changedByKey.project_name)}
                                                value={inlineDraft.project_name}
                                                onChange={(value) => onInlineDraftChange('project_name', value)}
                                                readValue={
                                                    <span className="text-base font-semibold text-gray-900">{displayedProject.project_name}</span>
                                                }
                                            />
                                        </FieldRow>
                                        <FieldRow label="Type" required>
                                            <EditableSelect
                                                id={PROJECT_INLINE_FIELD_IDS.project_type}
                                                isEditing={isInlineEditing}
                                                error={inlineErrors.project_type}
                                                isChanged={Boolean(changedByKey.project_type)}
                                                value={inlineDraft.project_type}
                                                onChange={(value) => onInlineDraftChange('project_type', value as ProjectType)}
                                                options={projectTypeOptions}
                                                placeholder={isCreate ? 'Select type' : undefined}
                                                readValue={displayedProject.project_type}
                                            />
                                        </FieldRow>
                                        <FieldRow label="Status" required>
                                            <EditableSelect
                                                id={PROJECT_INLINE_FIELD_IDS.project_status}
                                                isEditing={isInlineEditing}
                                                error={inlineErrors.project_status}
                                                isChanged={Boolean(changedByKey.project_status)}
                                                value={inlineDraft.project_status}
                                                onChange={(value) => onInlineDraftChange('project_status', value as ProjectStatus)}
                                                options={projectStatusOptions}
                                                placeholder={isCreate ? 'Select status' : undefined}
                                                readValue={<ProjectStatusBadge status={displayedProject.project_status} />}
                                            />
                                        </FieldRow>
                                        <FieldRow label="Developer / builder">
                                            <EditableField
                                                id="project-inline-developer"
                                                isEditing={isInlineEditing}
                                                isChanged={Boolean(changedByKey.developer_name)}
                                                value={inlineDraft.developer_name}
                                                onChange={(value) => onInlineDraftChange('developer_name', value)}
                                                readValue={displayedProject.developer_name?.trim() ? displayedProject.developer_name : EMPTY}
                                                placeholder="Developer name"
                                            />
                                        </FieldRow>
                                        <FieldRow label="Approval required">
                                            <EditableSelect
                                                id="project-inline-requires-approval"
                                                isEditing={isInlineEditing}
                                                isChanged={Boolean(changedByKey.requires_approval)}
                                                value={
                                                    inlineDraft.requires_approval === ''
                                                        ? ''
                                                        : inlineDraft.requires_approval
                                                          ? 'Yes'
                                                          : 'No'
                                                }
                                                onChange={(value) => onInlineDraftChange('requires_approval', value === 'Yes')}
                                                options={['Yes', 'No']}
                                                placeholder={isCreate ? 'Select' : undefined}
                                                readValue={displayedProject.approval_status === 'pending' ? 'Yes' : 'No'}
                                            />
                                        </FieldRow>
                                        <FieldRow label="Total units" required>
                                            <EditableField
                                                id={PROJECT_INLINE_FIELD_IDS.total_units}
                                                isEditing={isInlineEditing}
                                                error={inlineErrors.total_units}
                                                isChanged={Boolean(changedByKey.total_units)}
                                                value={inlineDraft.total_units}
                                                onChange={(value) => onInlineDraftChange('total_units', value.replace(/\D/g, '').slice(0, 6))}
                                                readValue={String(displayedProject.total_units ?? EMPTY)}
                                                placeholder="Total units"
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
                                    <div className="grid grid-cols-1 md:grid-cols-2">
                                        <FieldRow label="Full address" required className="md:col-span-2">
                                            <EditableTextarea
                                                id={PROJECT_INLINE_FIELD_IDS.full_address}
                                                isEditing={isInlineEditing}
                                                error={inlineErrors.full_address}
                                                isChanged={Boolean(changedByKey.full_address)}
                                                value={inlineDraft.full_address}
                                                onChange={(value) => onInlineDraftChange('full_address', value)}
                                                rows={2}
                                                placeholder="Street, locality, district"
                                                readValue={
                                                    displayedProject.full_address?.trim() ? (
                                                        <span className="block whitespace-pre-wrap font-medium leading-relaxed text-gray-800">
                                                            {displayedProject.full_address.trim()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-600">{displayedProject.location}</span>
                                                    )
                                                }
                                            />
                                        </FieldRow>
                                        <FieldRow label="City" required>
                                            <EditableField
                                                id={PROJECT_INLINE_FIELD_IDS.city}
                                                isEditing={isInlineEditing}
                                                error={inlineErrors.city}
                                                isChanged={Boolean(changedByKey.city)}
                                                value={inlineDraft.city}
                                                onChange={(value) => onInlineDraftChange('city', value)}
                                                readValue={displayedProject.city ?? EMPTY}
                                            />
                                        </FieldRow>
                                        <FieldRow label="State" required>
                                            <EditableField
                                                id={PROJECT_INLINE_FIELD_IDS.state}
                                                isEditing={isInlineEditing}
                                                error={inlineErrors.state}
                                                isChanged={Boolean(changedByKey.state)}
                                                value={inlineDraft.state}
                                                onChange={(value) => onInlineDraftChange('state', value)}
                                                readValue={displayedProject.state ?? EMPTY}
                                            />
                                        </FieldRow>
                                        <FieldRow label="Pincode">
                                            <EditableField
                                                id="project-inline-pincode"
                                                isEditing={isInlineEditing}
                                                value={inlineDraft.pincode}
                                                onChange={(value) => onInlineDraftChange('pincode', value.replace(/\D/g, '').slice(0, 8))}
                                                isChanged={Boolean(changedByKey.pincode)}
                                                readValue={displayedProject.pincode ?? EMPTY}
                                                placeholder="6 digits"
                                            />
                                        </FieldRow>
                                        <FieldRow label="Country">
                                            <EditableField
                                                id="project-inline-country"
                                                isEditing={isInlineEditing}
                                                isChanged={Boolean(changedByKey.country)}
                                                value={inlineDraft.country}
                                                onChange={(value) => onInlineDraftChange('country', value)}
                                                readValue={displayedProject.country ?? 'India'}
                                                placeholder="India"
                                            />
                                        </FieldRow>
                                        <FieldRow label="Landmark">
                                            <EditableField
                                                id="project-inline-landmark"
                                                isEditing={isInlineEditing}
                                                isChanged={Boolean(changedByKey.landmark)}
                                                value={inlineDraft.landmark}
                                                onChange={(value) => onInlineDraftChange('landmark', value)}
                                                readValue={displayedProject.landmark?.trim() ? displayedProject.landmark : EMPTY}
                                                placeholder="Nearby landmark"
                                            />
                                        </FieldRow>
                                        <FieldRow label="Google Maps URL" className="md:col-span-2">
                                            <EditableField
                                                id={PROJECT_INLINE_FIELD_IDS.map_url}
                                                isEditing={isInlineEditing}
                                                error={inlineErrors.map_url}
                                                isChanged={Boolean(changedByKey.map_url)}
                                                value={inlineDraft.map_url}
                                                onChange={(value) => onInlineDraftChange('map_url', value)}
                                                readValue={
                                                    displayedProject.map_url?.trim() ? (
                                                        <a
                                                            href={displayedProject.map_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className={cn('break-all', CTA_FLOW_LINK)}
                                                        >
                                                            {displayedProject.map_url}
                                                        </a>
                                                    ) : (
                                                        EMPTY
                                                    )
                                                }
                                                placeholder="https://maps.google.com/…"
                                            />
                                        </FieldRow>
                                    </div>
                                </InlineCollapsibleSection>

                                <InlineCollapsibleSection
                                    title="TEAM"
                                    icon={LuUsers}
                                    tone="amber"
                                    open={sectionsOpen.team}
                                    onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, team: o }))}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2">
                                        <FieldRow label="Project owner" required>
                                            <EditableSelect
                                                id={PROJECT_INLINE_FIELD_IDS.project_owner_name}
                                                isEditing={isInlineEditing}
                                                error={inlineErrors.project_owner_name}
                                                isChanged={Boolean(changedByKey.project_owner_name)}
                                                value={inlineDraft.project_owner_name}
                                                onChange={(value) => onInlineDraftChange('project_owner_name', value)}
                                                options={teamMemberOptions}
                                                readValue={displayedProject.project_owner_name ?? EMPTY}
                                            />
                                        </FieldRow>
                                        <FieldRow label="Project manager" required>
                                            <EditableSelect
                                                id={PROJECT_INLINE_FIELD_IDS.project_manager_name}
                                                isEditing={isInlineEditing}
                                                error={inlineErrors.project_manager_name}
                                                isChanged={Boolean(changedByKey.project_manager_name)}
                                                value={inlineDraft.project_manager_name}
                                                onChange={(value) => onInlineDraftChange('project_manager_name', value)}
                                                options={teamMemberOptions}
                                                readValue={displayedProject.project_manager_name ?? EMPTY}
                                            />
                                        </FieldRow>
                                        <FieldRow label="Executive manager" required>
                                            <EditableSelect
                                                id={PROJECT_INLINE_FIELD_IDS.executive_manager_name}
                                                isEditing={isInlineEditing}
                                                error={inlineErrors.executive_manager_name}
                                                isChanged={Boolean(changedByKey.executive_manager_name)}
                                                value={inlineDraft.executive_manager_name}
                                                onChange={(value) => onInlineDraftChange('executive_manager_name', value)}
                                                options={teamMemberOptions}
                                                readValue={displayedProject.executive_manager_name ?? EMPTY}
                                            />
                                        </FieldRow>
                                        <FieldRow label="Sales head">
                                            <EditableSelect
                                                id="project-inline-sales-head"
                                                isEditing={isInlineEditing}
                                                isChanged={Boolean(changedByKey.sales_head)}
                                                value={inlineDraft.sales_head}
                                                onChange={(value) => onInlineDraftChange('sales_head', value)}
                                                options={teamMemberOptions}
                                                readValue={displayedProject.sales_head ?? EMPTY}
                                            />
                                        </FieldRow>
                                    </div>
                                </InlineCollapsibleSection>

                                <InlineCollapsibleSection
                                    title="TIMELINE"
                                    icon={LuCalendar}
                                    tone="slate"
                                    open={sectionsOpen.timeline}
                                    onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, timeline: o }))}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2">
                                        <FieldRow label="Towers / blocks">
                                            <EditableField
                                                id="project-inline-towers"
                                                isEditing={isInlineEditing}
                                                isChanged={Boolean(changedByKey.towers_blocks)}
                                                value={inlineDraft.towers_blocks}
                                                onChange={(value) => onInlineDraftChange('towers_blocks', value)}
                                                readValue={displayedProject.towers_blocks?.trim() ? displayedProject.towers_blocks : EMPTY}
                                                placeholder="e.g. Tower A, B"
                                            />
                                        </FieldRow>
                                        <FieldRow label="Floors">
                                            <EditableField
                                                id="project-inline-floors"
                                                isEditing={isInlineEditing}
                                                isChanged={Boolean(changedByKey.floors)}
                                                value={inlineDraft.floors}
                                                onChange={(value) => onInlineDraftChange('floors', value)}
                                                readValue={displayedProject.floors?.trim() ? displayedProject.floors : EMPTY}
                                                placeholder="e.g. G + 18"
                                            />
                                        </FieldRow>
                                        <FieldRow label="Launch">
                                            <EditableDate
                                                id="project-inline-launch-date"
                                                isEditing={isInlineEditing}
                                                isChanged={Boolean(changedByKey.launch_date)}
                                                value={inlineDraft.launch_date}
                                                onChange={(value) => onInlineDraftChange('launch_date', value)}
                                                readValue={displayedProject.launch_date ?? EMPTY}
                                            />
                                        </FieldRow>
                                        <FieldRow label="Possession">
                                            <EditableDate
                                                id="project-inline-possession-date"
                                                isEditing={isInlineEditing}
                                                isChanged={Boolean(changedByKey.possession_date)}
                                                value={inlineDraft.possession_date}
                                                onChange={(value) => onInlineDraftChange('possession_date', value)}
                                                readValue={displayedProject.possession_date ?? EMPTY}
                                            />
                                        </FieldRow>
                                    </div>
                                </InlineCollapsibleSection>

                                <InlineCollapsibleSection
                                    title="COMMERCIAL"
                                    icon={LuTag}
                                    tone="amber"
                                    sectionId="wf-project-status"
                                    open={sectionsOpen.commercial}
                                    onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, commercial: o }))}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2">
                                        <FieldRow label="Starting price (₹)">
                                            <EditableField
                                                id="project-inline-starting-price"
                                                isEditing={isInlineEditing}
                                                isChanged={Boolean(changedByKey.starting_price)}
                                                value={inlineDraft.starting_price}
                                                onChange={(value) => onInlineDraftChange('starting_price', value.replace(/\D/g, '').slice(0, 12))}
                                                readValue={displayedProject.starting_price != null ? String(displayedProject.starting_price) : EMPTY}
                                                placeholder="e.g. 6200000"
                                            />
                                        </FieldRow>
                                        <FieldRow label="Max price (₹)">
                                            <EditableField
                                                id="project-inline-max-price"
                                                isEditing={isInlineEditing}
                                                isChanged={Boolean(changedByKey.max_price)}
                                                value={inlineDraft.max_price}
                                                onChange={(value) => onInlineDraftChange('max_price', value.replace(/\D/g, '').slice(0, 12))}
                                                readValue={displayedProject.max_price != null ? String(displayedProject.max_price) : EMPTY}
                                                placeholder="e.g. 12500000"
                                            />
                                        </FieldRow>
                                    </div>
                                </InlineCollapsibleSection>

                                <ProjectOverviewEnterpriseSections
                                    project={displayedProject}
                                    isInlineEditing={isInlineEditing}
                                    draft={enterpriseDraft}
                                    onDraftChange={(key, value) => setEnterpriseDraft((prev) => ({ ...prev, [key]: value }))}
                                    changedByKey={enterpriseChangedByKey}
                                    sectionsOpen={{
                                        config: sectionsOpen.config,
                                        rera: sectionsOpen.rera,
                                        amenities: sectionsOpen.amenities,
                                        construction: sectionsOpen.construction,
                                        media: sectionsOpen.media,
                                    }}
                                    onSectionsOpenChange={(next) => setSectionsOpen((s) => ({ ...s, ...next }))}
                                />
                            </div>
                        </div>
                    </ProjectRecordCard>

                    <InlineCollapsibleSection
                        title="INTERNAL NOTES"
                        icon={LuFileText}
                        tone="slate"
                        open={sectionsOpen.notes}
                        onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, notes: o }))}
                    >
                        <div className="px-4 py-3">
                            {isInlineEditing ? (
                                <EditableTextarea
                                    id="project-inline-internal-notes"
                                    isEditing={isInlineEditing}
                                    isChanged={Boolean(changedByKey.internal_notes)}
                                    value={inlineDraft.internal_notes}
                                    onChange={(value) => onInlineDraftChange('internal_notes', value)}
                                    rows={5}
                                    placeholder="Add internal notes for your workspace…"
                                    readValue={displayedProject.internal_notes?.trim() ? displayedProject.internal_notes.trim() : '—'}
                                />
                            ) : displayedProject.internal_notes?.trim() ? (
                                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-gray-800">
                                    {displayedProject.internal_notes.trim()}
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500">No internal notes on this project.</p>
                            )}
                        </div>
                    </InlineCollapsibleSection>

                    {isInlineEditing ? (
                        <div className="sticky bottom-0 z-30 mt-4 pb-1">
                            <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur supports-backdrop-filter:bg-white/90 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                                <p className="text-sm font-semibold text-gray-900">
                                    {isCreate ? 'Create project to enable related sections' : 'You have unsaved changes'}
                                </p>
                                <div className="mt-3 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:items-center sm:justify-end">
                                    {isCreate ? (
                                        <>
                                            <Button
                                                type="button"
                                                variant="companyOutline"
                                                size="cta"
                                                onClick={onCreateCancel ?? (() => router.push('/projects-inventory/projects'))}
                                                disabled={Boolean(createSubmitting)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="companyOutline"
                                                size="cta"
                                                onClick={onCreateSaveDraft}
                                                disabled={Boolean(createSubmitting)}
                                            >
                                                Save Draft
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="company"
                                                size="cta"
                                                onClick={onCreateProject}
                                                isLoading={Boolean(createSubmitting)}
                                                disabled={Boolean(createSubmitting)}
                                            >
                                                {createSubmitting ? 'Creating...' : 'Create Project'}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                type="button"
                                                variant="companyOutline"
                                                size="cta"
                                                onClick={onInlineEditCancel}
                                                disabled={inlineSaving}
                                            >
                                                Cancel
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="companyOutline"
                                                size="cta"
                                                onClick={onInlineEditSave}
                                                isLoading={inlineSaving}
                                            >
                                                Save
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="company"
                                                size="cta"
                                                onClick={onInlineEditSaveAndExit}
                                                disabled={inlineSaving}
                                            >
                                                Save &amp; Exit
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                <aside className="min-w-0 lg:sticky lg:top-44 lg:self-start">
                    <div className="rounded-xl border border-gray-200/80 bg-[#7185a217] shadow-sm">
                        <div className="divide-y divide-gray-100">
                            <div id="wf-project-approval" className="p-4 sm:p-5">
                                <div className="mb-2 flex items-center gap-2">
                                    <LuClipboardCheck className="text-[var(--cta-button-bg)]" size={18} aria-hidden />
                                    <h3 className="text-sm font-semibold text-gray-900">Approval</h3>
                                </div>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium text-gray-800">State:</span> {approvalStatus ?? 'Not set'}
                                </p>
                                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                                    {approvalStatus === 'pending'
                                        ? 'Awaiting approval before go-live workflows.'
                                        : 'Approved — inventory and pricing are fully available.'}
                                </p>
                            </div>
                            <div className="p-4 sm:p-5">
                                <div className="mb-2 flex items-center gap-2">
                                    <LuSparkles className="text-violet-600" size={18} aria-hidden />
                                    <h3 className="text-sm font-semibold text-gray-900">Demand</h3>
                                </div>
                                <p className="text-2xl font-bold tabular-nums text-gray-900">{demandScore}%</p>
                                <p className="mt-1 text-xs text-gray-500">Demand score (CRM match)</p>
                                <p className="mt-2 flex items-start gap-1.5 text-sm text-gray-600">
                                    <LuTrendingUp className="mt-0.5 shrink-0 text-emerald-600" size={14} aria-hidden />
                                    {leadDemand} leads reference this project name.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <ComplianceAICard scope="project" />
                    </div>

                    <ProjectOverviewRightRailEnhancements project={displayedProject} demandScore={demandScore} leadDemand={leadDemand} />
                </aside>
            </div>
        </div>
    );
}
