'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LeadMainTabBar } from '@/components/leads/detail/LeadMainTabBar';
import { ProfileHeader } from '@/components/leads/detail/ProfileHeader';
import { LeadInlineOverviewEditor, LEAD_INLINE_FIELD_IDS } from '@/components/leads/LeadInlineOverviewEditor';
import type { LeadDetailMainTabId } from '@/components/leads/detail/leadDetailTabIds';
import { normalizeLeadDetailTab } from '@/components/leads/detail/leadDetailTabIds';
import { LeadDetailMoreMenu } from '@/components/leads/LeadDetailMoreMenu';
import { LeadCrossReferencesFlow } from '@/components/leads/LeadCrossReferencesFlow';
import {
    LeadAssignmentPanel,
    LeadBrokerPanel,
    LeadConversionPanel,
    LeadFollowUpsPanel,
    LeadNotificationsPanel,
    LeadPipelinePanel,
    LeadSiteVisitPanel,
} from '@/components/leads/LeadDetailTabPanels';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { InputField } from '@/components/forms/Fields';
import { focusPanelFieldById, RequiredAsteriskMark } from '@/components/leads/leadPanelValidationUtils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { getDemoProjectNamesList } from '@/lib/demoCatalog';
import {
    addLeadFromCoreFields,
    addLeadAttachment,
    addLeadThreadNote,
    formatLeadCode,
    formatLeadAuditTimestamp,
    getLeads,
    LEAD_PREFERRED_UNIT_TYPE_OPTIONS,
    patchLeadCoreFields,
    removeLeadAttachment,
    restoreLead,
    updateLeadAttachment,
    type LeadSource,
    type Lead,
    type LeadFileAttachment,
    type LeadThreadNote,
} from '@/lib/leadStore';
import {
    LuCalendar,
    LuClock3,
    LuDownload,
    LuMail,
    LuEllipsis,
    LuEye,
    LuFileText,
    LuFolderOpen,
    LuPaperclip,
    LuPencil,
    LuPrinter,
    LuPhone,
    LuPlus,
    LuRotateCcw,
    LuTrash2,
} from 'react-icons/lu';
import { LeadAICopilotPanel } from '@/components/ai/LeadDetailAIBlocks';
import { RecordHistoryLogPanel } from '@/components/history-logs/RecordHistoryLogPanel';
import { leadActivitiesToHistoryLogEntries } from '@/lib/historyLogs/recordHistoryAdapters';
import { cn } from '@/lib/utils';
import {
    CTA_AVATAR_GRADIENT,
    CTA_CARD_EDITING_RING,
    CTA_DASHED_DROPZONE_HOVER,
    CTA_FOCUS_RING_SOFT,
    CTA_INFO_BANNER,
    CTA_INFO_BANNER_BADGE,
    CTA_INPUT_FOCUS,
    CTA_LINK_UNDERLINE,
    CTA_UTILITY_BTN,
} from '@/lib/theme/ctaThemeClasses';
import { StatusModal } from '@/components/ui/StatusModal';
import { draftService } from '@/lib/draftService';
import { WorkspaceUtilityToolbar, LEAD_WORKSPACE_HELP } from '@/components/workspace-help';
import { RecordWorkflowStepper } from '@/components/workflow/RecordWorkflowStepper';
import { computeLeadWorkflowSteps } from '@/lib/leads/leadWorkflow';
import { createWorkflowStepHandler } from '@/lib/workflow/workflowStepNavigation';

const NOTE_FIELD_IDS = { body: 'thread-note-body', author: 'thread-note-author' } as const;
type NoteFormErrorKey = 'body' | 'author';
const NOTE_ORDER: NoteFormErrorKey[] = ['body', 'author'];
const NOTE_LABEL: Record<NoteFormErrorKey, string> = {
    body: 'Note',
    author: 'Your name',
};
const LEAD_STATUS_OPTIONS: Lead['status'][] = ['New', 'Qualified', 'Lost'];
const DEFAULT_SOURCES: Lead['source'][] = ['Website', 'Facebook Ads', 'Google Ads', 'Referral', 'Walk-in', 'Broker'];

type InlineOverviewDraft = {
    name: string;
    phone: string;
    email: string;
    source: Lead['source'] | '';
    assignedTo: string;
    project: string;
    budgetRange: string;
    preferredUnitType: Lead['preferredUnitType'] | '';
    status: Lead['status'] | '';
    notes: string;
    presentAddress: string;
    permanentAddress: string;
};

type LeadDraftData = InlineOverviewDraft;

type InlineOverviewErrorKey = keyof Omit<InlineOverviewDraft, 'notes'>;
type InlineOverviewFormKey = keyof InlineOverviewDraft;

function buildInlineOverviewDraft(lead: Lead): InlineOverviewDraft {
    return {
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        source: (lead.source as Lead['source'] | '') ?? '',
        assignedTo: lead.assignedTo,
        project: lead.project,
        budgetRange: lead.budgetRange,
        preferredUnitType: (lead.preferredUnitType as Lead['preferredUnitType'] | '') ?? '',
        status: (lead.status as Lead['status'] | '') ?? '',
        notes: lead.notes ?? '',
        presentAddress: lead.presentAddress ?? '',
        permanentAddress: lead.permanentAddress ?? '',
    };
}

function formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function uploadedAtToDateInputValue(s: string): string {
    if (!s?.trim()) return new Date().toISOString().slice(0, 10);
    const ymd = s.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;
    try {
        return new Date(s).toISOString().slice(0, 10);
    } catch {
        return new Date().toISOString().slice(0, 10);
    }
}

function formatIso(iso: string) {
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

function downloadTextFile({ filename, content, mime }: { filename: string; content: string; mime: string }) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/** Sort key for mixing thread notes (ISO) and attachments (date / ISO). */
function timelineSortMs(value: string): number {
    const v = value?.trim() ?? '';
    if (!v) return 0;
    const parsed = Date.parse(v);
    if (!Number.isNaN(parsed)) return parsed;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const d = Date.parse(`${v}T12:00:00.000Z`);
        return Number.isNaN(d) ? 0 : d;
    }
    return 0;
}

type NotesFilesTimelineEntry =
    | { kind: 'note'; at: number; note: LeadThreadNote }
    | { kind: 'file'; at: number; file: LeadFileAttachment };

function buildNotesFilesTimeline(notes: LeadThreadNote[], attachments: LeadFileAttachment[]): NotesFilesTimelineEntry[] {
    const items: NotesFilesTimelineEntry[] = [
        ...notes.map((note) => ({ kind: 'note' as const, at: timelineSortMs(note.createdAt), note })),
        ...attachments.map((file) => ({ kind: 'file' as const, at: timelineSortMs(file.uploadedAt), file })),
    ];
    items.sort((a, b) => b.at - a.at);
    return items;
}

function LeadNotesFilesTimelinePane({
    listVersion,
    notes,
    attachments,
    formatIso: fmt,
    setPreviewAttachment,
    downloadAttachmentMeta: dl,
    openAttachmentEdit,
    deleteAttachment: del,
}: {
    listVersion: number;
    notes: LeadThreadNote[];
    attachments: LeadFileAttachment[];
    formatIso: (iso: string) => string;
    setPreviewAttachment: (f: LeadFileAttachment) => void;
    downloadAttachmentMeta: (f: LeadFileAttachment) => void;
    openAttachmentEdit: (f: LeadFileAttachment) => void;
    deleteAttachment: (f: LeadFileAttachment) => void;
}) {
    const timeline = buildNotesFilesTimeline(notes, attachments);
    const hasItems = timeline.length > 0;

    return (
        <div
            className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-200/60"
            key={`thread-timeline-${listVersion}`}
        >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-slate-50/40 px-4 py-4 sm:px-5 sm:py-5 [scrollbar-gutter:stable]">
                {!hasItems ? (
                    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/60 px-4 py-10 text-center">
                        <LuFileText className="text-slate-200" size={36} aria-hidden />
                        <p className="mt-4 text-sm font-medium text-slate-600">No notes or files yet</p>
                        <p className="mt-1 max-w-[18rem] text-xs text-slate-500">
                            Add a note or upload a file on the left to start the thread.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {timeline.map((entry) => {
                            if (entry.kind === 'note') {
                                const n = entry.note;
                                const initial = (n.author.trim().charAt(0) || '?').toUpperCase();
                                return (
                                    <article key={`n-${n.id}`} className="flex gap-3">
                                        <div
                                            className={cn(
                                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm',
                                                CTA_AVATAR_GRADIENT,
                                            )}
                                            aria-hidden
                                        >
                                            {initial}
                                        </div>
                                        <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-slate-100 bg-white px-4 py-3 shadow-sm">
                                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                <span className="text-sm font-semibold text-slate-900">{n.author}</span>
                                                <time className="text-[11px] tabular-nums text-slate-400">{fmt(n.createdAt)}</time>
                                            </div>
                                            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Note</p>
                                            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">{n.body}</p>
                                        </div>
                                    </article>
                                );
                            }
                            const f = entry.file;
                            return (
                                <article key={`f-${f.id}`} className="flex gap-3">
                                    <div
                                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm ring-1 ring-slate-300/60"
                                        aria-hidden
                                    >
                                        <LuPaperclip size={16} />
                                    </div>
                                    <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-slate-100 bg-white px-4 py-3 shadow-sm">
                                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                                            <span className="text-sm font-semibold text-slate-900">{f.uploadedBy || 'Team'}</span>
                                            <time className="text-[11px] tabular-nums text-slate-400">{fmt(f.uploadedAt)}</time>
                                        </div>
                                        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">File</p>
                                        <p className="mt-2 truncate text-sm font-medium text-slate-800">{f.fileName}</p>
                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {f.sizeLabel}
                                        </p>
                                        <div className="mt-3 flex flex-wrap items-center gap-0.5 border-t border-slate-100 pt-3">
                                            <button
                                                type="button"
                                                onClick={() => setPreviewAttachment(f)}
                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                                title="Preview"
                                            >
                                                <LuEye size={16} aria-hidden />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => dl(f)}
                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                                title="Download"
                                            >
                                                <LuDownload size={16} aria-hidden />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openAttachmentEdit(f)}
                                                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                                title="Edit"
                                            >
                                                <LuPencil size={16} aria-hidden />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => del(f)}
                                                className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                                                title="Delete"
                                            >
                                                <LuTrash2 size={16} aria-hidden />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export function LeadRecordTabs({
    lead,
    listVersion,
    onBump,
    createMode = false,
}: {
    lead: Lead;
    listVersion: number;
    onBump: () => void;
    createMode?: boolean;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isArchived = !!lead.deletedAt;
    const isCreate = createMode;

    const onRestoreArchived = () => {
        if (restoreLead(lead.slug)) {
            onBump();
            router.push('/leads');
        }
    };
    const [tab, setTabState] = useState<LeadDetailMainTabId>(() => normalizeLeadDetailTab(searchParams.get('tab')));

    const setTab = useCallback(
        (next: LeadDetailMainTabId) => {
            if (isCreate && next !== 'overview') return;
            setTabState(next);
            const url = `/leads/view/${encodeURIComponent(isCreate ? 'new' : lead.slug)}?tab=${encodeURIComponent(next)}`;
            router.replace(url, { scroll: false });
        },
        [lead.slug, router, isCreate]
    );

    useEffect(() => {
        const fromUrl = normalizeLeadDetailTab(searchParams.get('tab'));
        setTabState(isCreate ? 'overview' : fromUrl);
    }, [searchParams, isCreate]);

    useEffect(() => {
        if (!isCreate) return;
        if (tab === 'overview') return;
        setTabState('overview');
        router.replace(`/leads/view/new?tab=overview`, { scroll: false });
    }, [isCreate, tab, router]);

    const [isInlineEditing, setIsInlineEditing] = useState(isCreate ? true : false);
    const [inlineDraft, setInlineDraft] = useState<InlineOverviewDraft>(() => buildInlineOverviewDraft(lead));
    const [inlineErrors, setInlineErrors] = useState<Partial<Record<InlineOverviewErrorKey, string>>>({});
    const [inlineSaving, setInlineSaving] = useState(false);
    const [inlineToast, setInlineToast] = useState<{ msg: string; err: boolean } | null>(null);
    const [draftSaving, setDraftSaving] = useState(false);
    const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
    const [draftLastSavedAt, setDraftLastSavedAt] = useState<string | null>(null);
    const [draftLoadedBanner, setDraftLoadedBanner] = useState(false);
    const [statusModal, setStatusModal] = useState<{
        open: boolean;
        type: 'success' | 'error';
        title: string;
        subtitle?: string;
        afterClose?: () => void;
    }>({ open: false, type: 'success', title: '' });
    const [leadOptimistic, setLeadOptimistic] = useState<Lead | null>(null);
    const displayedLead = leadOptimistic ?? lead;
    const showStatusModal = useCallback(
        ({
            type,
            title,
            subtitle,
            afterClose,
        }: {
            type: 'success' | 'error';
            title: string;
            subtitle?: string;
            afterClose?: () => void;
        }) => {
            setStatusModal({ open: true, type, title, subtitle, afterClose });
        },
        [],
    );

    const leadHistorySupplemental = React.useMemo(
        () => leadActivitiesToHistoryLogEntries(displayedLead.slug, displayedLead.name, displayedLead.activityLog),
        [displayedLead.slug, displayedLead.name, displayedLead.activityLog],
    );

    const leadWorkflowSteps = React.useMemo(
        () => computeLeadWorkflowSteps({ isCreate, lead: displayedLead }),
        [isCreate, displayedLead, listVersion],
    );

    const onWorkflowStepNavigate = React.useCallback(
        createWorkflowStepHandler({
            currentTab: tab,
            setTab: (next) => setTab(next as LeadDetailMainTabId),
            isCreate,
            onBlocked: (msg) => setInlineToast({ msg, err: true }),
        }),
        [tab, setTab, isCreate],
    );
    const [previewAttachment, setPreviewAttachment] = useState<LeadFileAttachment | null>(null);
    const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
    const [editingAttachmentId, setEditingAttachmentId] = useState<string | null>(null);
    const [attachFileName, setAttachFileName] = useState('');
    const [attachSize, setAttachSize] = useState('');
    const [attachBy, setAttachBy] = useState('');
    const [attachDate, setAttachDate] = useState('');
    const [attachError, setAttachError] = useState('');
    const attachmentFileInputRef = useRef<HTMLInputElement>(null);

    const resetAttachmentFormForCreate = useCallback(() => {
        setEditingAttachmentId(null);
        setAttachFileName('');
        setAttachSize('');
        setAttachBy(lead.assignedTo?.trim() || 'You');
        setAttachDate(new Date().toISOString().slice(0, 10));
        setAttachError('');
        if (attachmentFileInputRef.current) attachmentFileInputRef.current.value = '';
    }, [lead.assignedTo]);

    const openAttachmentCreate = useCallback(() => {
        resetAttachmentFormForCreate();
        setAttachmentModalOpen(true);
    }, [resetAttachmentFormForCreate]);

    const openAttachmentEdit = useCallback((row: LeadFileAttachment) => {
        setEditingAttachmentId(row.id);
        setAttachFileName(row.fileName);
        setAttachSize(row.sizeLabel);
        setAttachBy(row.uploadedBy);
        setAttachDate(uploadedAtToDateInputValue(row.uploadedAt));
        setAttachError('');
        if (attachmentFileInputRef.current) attachmentFileInputRef.current.value = '';
        setAttachmentModalOpen(true);
    }, []);

    const closeAttachmentModal = useCallback(() => {
        setAttachmentModalOpen(false);
        setEditingAttachmentId(null);
    }, []);

    useEffect(() => {
        const e = searchParams.get('edit');
        if (e !== '1' && e !== 'true') return;
        setIsInlineEditing(true);
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete('edit');
        const qs = sp.toString();
        const base = `/leads/view/${encodeURIComponent(isCreate ? 'new' : lead.slug)}`;
        const next = qs ? `${base}?${qs}` : base;
        router.replace(next, { scroll: false });
    }, [searchParams, lead.slug, router, isCreate]);

    useEffect(() => {
        if (!isInlineEditing) {
            setInlineDraft(buildInlineOverviewDraft(displayedLead));
            setInlineErrors({});
        }
    }, [displayedLead, isInlineEditing]);

    useEffect(() => {
        if (!leadOptimistic) return;
        // Clear override once the parent lead prop catches up.
        if (lead.updatedAt !== leadOptimistic.updatedAt) setLeadOptimistic(null);
    }, [lead.updatedAt, leadOptimistic]);

    const inlineSourceOptions = React.useMemo(() => {
        const src = new Set<Lead['source']>(DEFAULT_SOURCES);
        getLeads().forEach((l) => src.add(l.source));
        return Array.from(src);
    }, []);

    const inlineAssignedToOptions = React.useMemo(() => {
        const owners = new Set<string>();
        getLeads().forEach((l) => {
            const v = l.assignedTo?.trim();
            if (v) owners.add(v);
        });
        const assignedList = Array.from(owners);
        if (assignedList.length === 0) assignedList.push('Sales Team');
        // Ensure current lead owner is always present
        const leadOwner = lead.assignedTo?.trim();
        if (leadOwner && !assignedList.includes(leadOwner)) assignedList.push(leadOwner);
        return assignedList;
    }, [lead.assignedTo]);

    const inlineProjectOptions = React.useMemo(() => {
        const baseProjects = getDemoProjectNamesList();
        const leadProject = lead.project?.trim();
        return leadProject && !baseProjects.includes(leadProject) ? [...baseProjects, leadProject] : baseProjects;
    }, [lead.project]);

    const originalDraftForChanged = React.useMemo(() => buildInlineOverviewDraft(displayedLead), [displayedLead]);
    const changedByKey = React.useMemo<Partial<Record<InlineOverviewErrorKey, boolean>>>(() => {
        const next: Partial<Record<InlineOverviewErrorKey, boolean>> = {};
        const keys: InlineOverviewErrorKey[] = [
            'name',
            'phone',
            'email',
            'source',
            'assignedTo',
            'project',
            'budgetRange',
            'preferredUnitType',
            'status',
            'presentAddress',
            'permanentAddress',
        ];
        for (const k of keys) next[k] = inlineDraft[k] !== originalDraftForChanged[k];
        return next;
    }, [inlineDraft, originalDraftForChanged]);

    const notesChanged = inlineDraft.notes !== (displayedLead.notes ?? '');
    const isInlineDirty = React.useMemo(() => {
        return Boolean(notesChanged || Object.values(changedByKey).some(Boolean));
    }, [changedByKey, notesChanged]);

    const onInlineDraftChange = useCallback(<K extends keyof InlineOverviewDraft>(key: K, value: InlineOverviewDraft[K]) => {
        setInlineDraft((prev) => ({ ...prev, [key]: value }));
        setInlineErrors((prev) => {
            if (!prev[key as InlineOverviewErrorKey]) return prev;
            const next = { ...prev };
            delete next[key as InlineOverviewErrorKey];
            return next;
        });
    }, []);

    const onInlineOverviewChange = useCallback((key: InlineOverviewFormKey, value: string) => {
        onInlineDraftChange(key, value as InlineOverviewDraft[InlineOverviewFormKey]);
    }, [onInlineDraftChange]);

    const runInlineValidation = useCallback(() => {
        const next: Partial<Record<InlineOverviewErrorKey, string>> = {};
        if (!inlineDraft.name.trim()) next.name = 'Lead name is required.';
        if (!inlineDraft.phone.trim()) next.phone = 'Phone number is required.';
        if (!inlineDraft.email.trim()) next.email = 'Email is required.';
        if (!inlineDraft.source.trim()) next.source = 'Lead source is required.';
        if (!inlineDraft.assignedTo.trim()) next.assignedTo = 'Assigned owner is required.';
        if (!inlineDraft.project.trim()) next.project = 'Project interest is required.';
        if (!inlineDraft.budgetRange.trim()) next.budgetRange = 'Budget range is required.';
        if (!inlineDraft.preferredUnitType.trim()) next.preferredUnitType = 'Preferred unit type is required.';
        if (!inlineDraft.status.trim()) next.status = 'Status is required.';
        return next;
    }, [inlineDraft]);

    // Show required-field validation immediately when entering edit mode.
    useEffect(() => {
        if (isCreate) return;
        if (!isInlineEditing) return;
        setInlineErrors(runInlineValidation());
    }, [isInlineEditing, runInlineValidation, isCreate]);

    const scrollToInlineErrorField = useCallback((key: InlineOverviewErrorKey) => {
        const el = document.getElementById(LEAD_INLINE_FIELD_IDS[key]);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
            el.focus();
        }
    }, []);

    useEffect(() => {
        if (!isCreate) return;
        const draftIdFromUrl = searchParams.get('draftId')?.trim() || '';
        if (!draftIdFromUrl) {
            setActiveDraftId(null);
            setDraftLastSavedAt(null);
            setDraftLoadedBanner(false);
            return;
        }
        const found = draftService.getDraftById<LeadDraftData>(draftIdFromUrl);
        if (!found || found.module !== 'lead') {
            setInlineToast({ msg: 'Draft not found. Starting a new lead.', err: true });
            showStatusModal({ type: 'error', title: 'Draft not found', subtitle: 'Starting a new lead.' });
            setActiveDraftId(null);
            setDraftLastSavedAt(null);
            setDraftLoadedBanner(false);
            return;
        }
        setInlineDraft((prev) => ({ ...prev, ...(found.data ?? {}) }));
        setActiveDraftId(found.draftId);
        setDraftLastSavedAt(found.updatedAt);
        setDraftLoadedBanner(true);
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
        if (draftSaving || inlineSaving) return;

        const hasAnyValue = Object.values(inlineDraft).some((v) => (typeof v === 'string' ? v.trim() : Boolean(v)));
        if (!hasAnyValue) return;

        if (createDraftDebounceRef.current) clearTimeout(createDraftDebounceRef.current);
        createDraftDebounceRef.current = setTimeout(() => {
            try {
                const saved = draftService.saveDraft<LeadDraftData>('lead', inlineDraft, activeDraftId ?? undefined);
                setActiveDraftId(saved.draftId);
                setDraftLastSavedAt(saved.updatedAt);
                if (!searchParams.get('draftId')) {
                    const sp = new URLSearchParams(searchParams.toString());
                    sp.set('draftId', saved.draftId);
                    if (!sp.get('tab')) sp.set('tab', 'overview');
                    router.replace(`${window.location.pathname}?${sp.toString()}`, { scroll: false });
                }
            } catch {
                // silent auto-save failure; explicit Save Draft handles user feedback
            }
        }, 1400);
         
    }, [inlineDraft, isCreate, activeDraftId, router, searchParams, draftSaving, inlineSaving]);

    const saveCreateDraft = useCallback(() => {
        if (!isCreate) return;
        setDraftSaving(true);
        try {
            const saved = draftService.saveDraft<LeadDraftData>('lead', inlineDraft, activeDraftId ?? undefined);
            setActiveDraftId(saved.draftId);
            setDraftLastSavedAt(saved.updatedAt);
            if (!searchParams.get('draftId')) {
                const sp = new URLSearchParams(searchParams.toString());
                sp.set('draftId', saved.draftId);
                if (!sp.get('tab')) sp.set('tab', 'overview');
                router.replace(`${window.location.pathname}?${sp.toString()}`, { scroll: false });
            }
            setInlineToast({ msg: 'Draft saved.', err: false });
            showStatusModal({ type: 'success', title: 'Draft Saved Successfully' });
        } catch {
            setInlineToast({ msg: 'Could not save draft. Please try again.', err: true });
            showStatusModal({
                type: 'error',
                title: 'Something went wrong. Please try again.',
                subtitle: 'We could not save your draft.',
            });
        } finally {
            setDraftSaving(false);
        }
    }, [activeDraftId, inlineDraft, isCreate, router, searchParams, showStatusModal]);

    const onCreateLead = useCallback(async () => {
        if (!isCreate) return;
        const nextErrors = runInlineValidation();
        setInlineErrors(nextErrors);
        const firstError = (Object.keys(nextErrors)[0] ?? null) as InlineOverviewErrorKey | null;
        if (firstError) {
            window.requestAnimationFrame(() => scrollToInlineErrorField(firstError));
            setInlineToast({ msg: 'Please fill required fields.', err: true });
            return;
        }
        setInlineSaving(true);
        try {
            const created = addLeadFromCoreFields({
                name: inlineDraft.name.trim(),
                phone: inlineDraft.phone.trim(),
                email: inlineDraft.email.trim(),
                source: inlineDraft.source as LeadSource,
                status: inlineDraft.status as Lead['status'],
                assignedTo: inlineDraft.assignedTo.trim(),
                notes: inlineDraft.notes?.trim() ?? '',
                project: inlineDraft.project.trim(),
                budgetRange: inlineDraft.budgetRange.trim(),
                preferredUnitType: inlineDraft.preferredUnitType as Lead['preferredUnitType'],
                presentAddress: inlineDraft.presentAddress?.trim() ?? '',
                permanentAddress: inlineDraft.permanentAddress?.trim() ?? '',
            });
            try {
                window.localStorage.setItem('activeLeadSlug', created.slug);
            } catch {
                // ignore
            }
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
                title: 'Lead Created Successfully',
                afterClose: () => {
                    router.replace(`/leads/view/${encodeURIComponent(created.slug)}?tab=overview`, { scroll: true });
                },
            });
        } catch {
            setInlineToast({ msg: 'Could not create lead. Please try again.', err: true });
            showStatusModal({ type: 'error', title: 'Something went wrong. Please try again.' });
        } finally {
            setInlineSaving(false);
        }
    }, [activeDraftId, inlineDraft, isCreate, onBump, router, runInlineValidation, scrollToInlineErrorField, showStatusModal]);

    const onInlineEditCancel = useCallback(() => {
        setInlineDraft(buildInlineOverviewDraft(displayedLead));
        setInlineErrors({});
        setIsInlineEditing(false);
        setLeadOptimistic(null);
    }, [displayedLead]);

    const onInlineEditSave = useCallback(async ({ exitAfter }: { exitAfter: boolean }) => {
        const nextErrors = runInlineValidation();
        setInlineErrors(nextErrors);
        const firstError = (Object.keys(nextErrors)[0] ?? null) as InlineOverviewErrorKey | null;
        if (firstError) {
            window.requestAnimationFrame(() => scrollToInlineErrorField(firstError));
            setInlineToast({ msg: 'Please fill required fields.', err: true });
            return;
        }

        const patch: Partial<InlineOverviewDraft> = {};
        const originalDraft = buildInlineOverviewDraft(displayedLead);
        (Object.keys(inlineDraft) as (keyof InlineOverviewDraft)[]).forEach((key) => {
            if (inlineDraft[key] !== originalDraft[key]) {
                (patch as Record<string, unknown>)[key] = inlineDraft[key];
            }
        });
        if (Object.keys(patch).length === 0) {
            if (exitAfter) setIsInlineEditing(false);
            return;
        }

        setInlineSaving(true);
        try {
            const storePatch = patch as unknown as Parameters<typeof patchLeadCoreFields>[1];
            const updated = patchLeadCoreFields(displayedLead.slug, storePatch);
            if (!updated) {
                setInlineToast({ msg: 'Could not save changes. Please try again.', err: true });
                showStatusModal({ type: 'error', title: 'Something went wrong. Please try again.' });
                return;
            }
            setLeadOptimistic(updated);
            setInlineDraft(buildInlineOverviewDraft(updated));
            onBump();
            setInlineToast({ msg: 'Lead updated successfully.', err: false });
            showStatusModal({ type: 'success', title: 'Changes Saved Successfully' });
            if (exitAfter) setIsInlineEditing(false);
            setInlineErrors({});
        } finally {
            setInlineSaving(false);
        }
    }, [displayedLead, inlineDraft, onBump, runInlineValidation, scrollToInlineErrorField, showStatusModal]);

    useEffect(() => {
        if (!isInlineEditing) return;
        const t = window.requestAnimationFrame(() => {
            const el = document.getElementById(LEAD_INLINE_FIELD_IDS.name);
            if (el instanceof HTMLInputElement) el.focus();
        });
        return () => window.cancelAnimationFrame(t);
    }, [isInlineEditing]);

    useEffect(() => {
        if (!isInlineEditing || !isInlineDirty) return;
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [isInlineEditing, isInlineDirty]);

    useEffect(() => {
        if (!isInlineEditing) return;
        const onKeyDown = (e: KeyboardEvent) => {
            const k = e.key?.toLowerCase();
            if ((e.ctrlKey || e.metaKey) && k === 's') {
                e.preventDefault();
                if (!inlineSaving) void onInlineEditSave({ exitAfter: false });
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isInlineEditing, inlineSaving, onInlineEditSave]);

    const [noteDraft, setNoteDraft] = useState('');
    const [author, setAuthor] = useState(() => lead.assignedTo || 'You');
    const [noteFormErrors, setNoteFormErrors] = useState<Partial<Record<NoteFormErrorKey, string>>>({});
    const [showNoteValidationSummary, setShowNoteValidationSummary] = useState(false);
    const [noteValidationFieldToast, setNoteValidationFieldToast] = useState<string | null>(null);
    const [noteSubmitShakeKey, setNoteSubmitShakeKey] = useState(0);
    const [timelineFlash, setTimelineFlash] = useState<string | null>(null);
    const timelineFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const dismissNoteValidationToast = useCallback(() => {
        setNoteValidationFieldToast(null);
    }, []);

    const flashTimeline = useCallback((message: string) => {
        if (timelineFlashTimerRef.current) clearTimeout(timelineFlashTimerRef.current);
        setTimelineFlash(message);
        timelineFlashTimerRef.current = setTimeout(() => {
            setTimelineFlash(null);
            timelineFlashTimerRef.current = null;
        }, 2200);
    }, []);

    useEffect(() => {
        return () => {
            if (timelineFlashTimerRef.current) clearTimeout(timelineFlashTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (Object.keys(noteFormErrors).length === 0) {
            setShowNoteValidationSummary(false);
            setNoteValidationFieldToast(null);
        }
    }, [noteFormErrors]);

    const runNoteFormValidation = useCallback((): Partial<Record<NoteFormErrorKey, string>> => {
        const next: Partial<Record<NoteFormErrorKey, string>> = {};
        if (!noteDraft.trim()) next.body = 'Required';
        if (!author.trim()) next.author = 'Required';
        return next;
    }, [noteDraft, author]);

    const scrollToNoteField = useCallback((k: NoteFormErrorKey) => {
        window.requestAnimationFrame(() => focusPanelFieldById(NOTE_FIELD_IDS[k]));
    }, []);

    const notes = [...lead.threadNotes].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    const submitNote = (e: React.FormEvent) => {
        e.preventDefault();
        const nextErrors = runNoteFormValidation();
        setNoteFormErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            setShowNoteValidationSummary(true);
            const n = Object.keys(nextErrors).length;
            setNoteValidationFieldToast(`Please complete ${n} required field${n === 1 ? '' : 's'}`);
            setNoteSubmitShakeKey((k) => k + 1);
            const firstKey = NOTE_ORDER.find((k) => Boolean(nextErrors[k]));
            if (firstKey) {
                window.requestAnimationFrame(() => focusPanelFieldById(NOTE_FIELD_IDS[firstKey]));
            }
            return;
        }
        const body = noteDraft.trim();
        addLeadThreadNote(lead.slug, body, author.trim());
        setNoteDraft('');
        setNoteFormErrors({});
        setShowNoteValidationSummary(false);
        setNoteValidationFieldToast(null);
        onBump();
        flashTimeline('Note added to timeline');
    };

    const submitAttachment = (e: React.FormEvent) => {
        e.preventDefault();
        const name = attachFileName.trim();
        if (!name) {
            setAttachError('File name is required.');
            return;
        }
        setAttachError('');
        const uploadedAt = attachDate.trim() || new Date().toISOString().slice(0, 10);
        const uploadedBy = attachBy.trim() || 'You';
        const sizeLabel = attachSize.trim() || '—';

        if (editingAttachmentId) {
            updateLeadAttachment(lead.slug, editingAttachmentId, {
                fileName: name,
                sizeLabel,
                uploadedAt,
                uploadedBy,
            });
        } else {
            addLeadAttachment(lead.slug, {
                fileName: name,
                sizeLabel,
                uploadedAt,
                uploadedBy,
            });
        }
        closeAttachmentModal();
        onBump();
        flashTimeline(editingAttachmentId ? 'File updated on timeline' : 'File added to timeline');
    };

    const onAttachmentFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAttachFileName(file.name);
        setAttachSize(formatFileSize(file.size));
        setAttachError('');
    };

    const downloadAttachmentMeta = (f: LeadFileAttachment) => {
        const blob = new Blob(
            [
                `mySFT — attachment metadata (demo)\r\n\r\nFile: ${f.fileName}\r\nSize: ${f.sizeLabel}\r\nUploaded: ${f.uploadedAt}\r\nBy: ${f.uploadedBy}\r\n`,
            ],
            { type: 'text/plain;charset=utf-8' },
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safe = f.fileName.replace(/[/\\?%*:|"<>]/g, '-').replace(/\.+$/, '') || 'attachment';
        a.download = `${safe}-metadata.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const deleteAttachment = (f: LeadFileAttachment) => {
        if (!window.confirm(`Remove “${f.fileName}” from this lead?`)) return;
        removeLeadAttachment(lead.slug, f.id);
        if (previewAttachment?.id === f.id) setPreviewAttachment(null);
        onBump();
    };

    const exportLeadJson = useCallback(
        (l: Lead) => {
            const safe = (l.slug || l.name || 'lead')
                .toString()
                .trim()
                .replace(/[/\\?%*:|"<>]/g, '-')
                .replace(/\.+$/, '')
                .slice(0, 80) || 'lead';
            downloadTextFile({
                filename: `${safe}.json`,
                content: JSON.stringify(l, null, 2),
                mime: 'application/json;charset=utf-8',
            });
        },
        [],
    );

    const panelProps = { slug: lead.slug, lead, onBump };

    const noteSummaryLinkKeys = showNoteValidationSummary
        ? NOTE_ORDER.filter((k) => Boolean(noteFormErrors[k]))
        : [];
    const noteValidationSummaryEl =
        showNoteValidationSummary && noteSummaryLinkKeys.length > 0 ? (
            <div
                className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-3.5 py-3 text-sm text-amber-950 shadow-sm"
                role="alert"
            >
                <p className="flex flex-wrap items-center gap-2 font-semibold leading-snug text-amber-950">
                    <span aria-hidden>⚠</span>
                    <span>Please complete required details before saving the note.</span>
                </p>
                <p className="mt-2 text-[13px] font-medium text-amber-900/95">
                    {noteSummaryLinkKeys.map((k, i) => (
                        <React.Fragment key={k}>
                            {i > 0 ? <span className="mx-1 text-amber-800/40">·</span> : null}
                            <button
                                type="button"
                                className={CTA_LINK_UNDERLINE}
                                onClick={() => scrollToNoteField(k)}
                            >
                                {NOTE_LABEL[k]}
                            </button>
                        </React.Fragment>
                    ))}
                </p>
            </div>
        ) : null;

    const noteValidationToastEl =
        noteValidationFieldToast ? (
            <InlineToast
                message={noteValidationFieldToast}
                variant="error"
                onDismiss={dismissNoteValidationToast}
            />
        ) : null;

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
            {inlineToast ? <InlineToast message={inlineToast.msg} variant={inlineToast.err ? 'error' : 'success'} onDismiss={() => setInlineToast(null)} /> : null}
            <LeadMainTabBar
                active={tab}
                onChange={(next) => {
                    if (isCreate && next !== 'overview') {
                        setInlineToast({ msg: 'Create lead to access other sections.', err: true });
                        return;
                    }
                    if (isInlineEditing && isInlineDirty) {
                        const ok = window.confirm('You have unsaved changes. Leave this tab and discard them?');
                        if (!ok) return;
                        onInlineEditCancel();
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
                    You are creating a new lead <span className={CTA_INFO_BANNER_BADGE}>Draft</span>
                </div>
            ) : null}

            {!isArchived && !isCreate ? (
                <div className="mt-3 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        {tab === 'overview' ? (
                            <div className="flex flex-wrap items-center gap-3">
                                <LeadDetailMoreMenu
                                    lead={displayedLead}
                                    onEdit={() => setIsInlineEditing(true)}
                                    isEditing={isInlineEditing}
                                    isSaving={inlineSaving}
                                />
                            </div>
                        ) : (
                            <p className="min-w-0 truncate text-sm font-semibold text-slate-800">
                                {displayedLead.name || 'Lead'}
                                <span className="ml-2 font-normal text-slate-500">{formatLeadCode(displayedLead.id)}</span>
                            </p>
                        )}
                        <WorkspaceUtilityToolbar
                            help={LEAD_WORKSPACE_HELP}
                            triggerLabel="Lead workspace help"
                            email={displayedLead.email}
                            onExport={() => exportLeadJson(displayedLead)}
                            saving={inlineSaving}
                            isInlineEditing={isInlineEditing}
                        />
                    </div>
                    {tab === 'overview' ? (
                        <div className="mt-2 rounded-md bg-white/80 px-4 py-2 text-sm text-gray-700">
                            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
                                <span className="inline-flex items-center gap-2">
                                    <LuCalendar size={14} className="text-gray-500" aria-hidden />
                                    <span className="text-gray-600">Date Created</span>
                                    <span className="font-medium text-gray-900">{formatLeadAuditTimestamp(lead.createdAt)}</span>
                                </span>
                                <span className="hidden h-4 w-px bg-gray-300 sm:block" aria-hidden />
                                <span className="inline-flex items-center gap-2">
                                    <LuClock3 size={14} className="text-gray-500" aria-hidden />
                                    <span className="text-gray-600">Last updated</span>
                                    <span className="font-medium text-gray-900">{formatLeadAuditTimestamp(lead.updatedAt)}</span>
                                </span>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}

            {isArchived ? (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium text-amber-950">
                            This lead is archived and is hidden from the main Leads list.
                            {lead.deletedAt ? (
                                <span className="mt-1 block text-xs font-normal text-amber-900/80">
                                    Archived {formatIso(lead.deletedAt)}
                                </span>
                            ) : null}
                        </p>
                        <Button
                            type="button"
                            variant="company"
                            size="sm"
                            className="h-10 shrink-0 gap-2 self-start sm:self-auto"
                            onClick={onRestoreArchived}
                        >
                            <LuRotateCcw size={16} />
                            Restore lead
                        </Button>
                    </div>
                </div>
            ) : null}

            <div className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
                {tab === 'overview' ? (
                    <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-6">
                        <RecordWorkflowStepper
                            steps={leadWorkflowSteps}
                            ariaLabel="Lead sales workflow"
                            onStepNavigate={onWorkflowStepNavigate}
                        />
                        <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-5">
                            <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:col-span-2">
                                <div
                                    className={cn(
                                        'flex min-h-0 min-w-0 flex-col rounded-xl border bg-white shadow-sm',
                                        isInlineEditing ? CTA_CARD_EDITING_RING : 'border-gray-200/80',
                                    )}
                                >
                                    <div className="px-4 py-4 sm:px-5 sm:py-5 bg-[#7185a217]">
                                        
                                        <div className="min-w-0 w-full">
                                            <ProfileHeader key="lead-header" lead={displayedLead} embedded />
                                        </div>
                                        <div className="mt-4 min-w-0">
                                            <LeadInlineOverviewEditor
                                                key={isInlineEditing ? 'lead-inline-editor-edit' : 'lead-inline-editor-view'}
                                                lead={displayedLead}
                                                isEditing={isInlineEditing}
                                                draft={inlineDraft}
                                                errors={inlineErrors}
                                                onDraftChange={onInlineOverviewChange}
                                                sourceOptions={inlineSourceOptions}
                                                projectOptions={inlineProjectOptions}
                                                assignedToOptions={inlineAssignedToOptions}
                                                changedByKey={changedByKey}
                                                statusOptions={LEAD_STATUS_OPTIONS}
                                                unitTypeOptions={LEAD_PREFERRED_UNIT_TYPE_OPTIONS}
                                            />
                                        </div>
                                        {isInlineEditing && !isArchived ? (
                                            <div className="sticky bottom-0 z-30 mt-4 pb-1">
                                                <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur supports-backdrop-filter:bg-white/90 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {isCreate ? 'Create lead to enable related sections' : 'You have unsaved changes'}
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
                                                                <Button type="button" variant="companyOutline" size="cta" onClick={() => router.push('/leads')} disabled={inlineSaving}>
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="companyOutline"
                                                                    size="cta"
                                                                    onClick={saveCreateDraft}
                                                                    isLoading={draftSaving}
                                                                    disabled={inlineSaving || draftSaving}
                                                                >
                                                                    {draftSaving ? 'Saving...' : 'Save Draft'}
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="company"
                                                                    size="cta"
                                                                    onClick={() => void onCreateLead()}
                                                                    isLoading={inlineSaving}
                                                                >
                                                                    {inlineSaving ? 'Creating...' : 'Create Lead'}
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button type="button" variant="companyOutline" size="cta" onClick={onInlineEditCancel} disabled={inlineSaving}>
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="companyOutline"
                                                                    size="cta"
                                                                    onClick={() => void onInlineEditSave({ exitAfter: false })}
                                                                    disabled={inlineSaving || !isInlineDirty}
                                                                    isLoading={inlineSaving}
                                                                >
                                                                    {inlineSaving ? 'Saving...' : 'Save'}
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="company"
                                                                    size="cta"
                                                                    onClick={() => void onInlineEditSave({ exitAfter: true })}
                                                                    isLoading={inlineSaving}
                                                                    disabled={!isInlineDirty}
                                                                >
                                                                    {inlineSaving ? 'Saving...' : 'Save & Exit'}
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
                            <div className="min-w-0 lg:col-span-1 lg:sticky lg:top-44 lg:self-start">
                                {isCreate ? (
                                    <div>
                                        <p className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                                            Available after lead is created
                                        </p>
                                        <div className="opacity-50 pointer-events-none">
                                            <LeadAICopilotPanel lead={displayedLead} disabled />
                                        </div>
                                    </div>
                                ) : (
                                    <LeadAICopilotPanel lead={displayedLead} disabled={isArchived} />
                                )}
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-gray-200" aria-hidden />
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Booking, Payments &amp; Documents</p>
                                <div className="h-px flex-1 bg-gray-200" aria-hidden />
                            </div>
                            {isInlineEditing && !isArchived ? (
                                <p className="mt-2 text-sm font-medium text-gray-500">
                                    {isCreate ? 'Create lead to enable this section.' : 'Complete editing to manage bookings, payments, and documents.'}
                                </p>
                            ) : null}
                        </div>

                        {isCreate ? (
                            <div>
                                <div className="mb-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
                                    Create lead to enable this section
                                </div>
                                <div className="opacity-50 pointer-events-none">
                                    <LeadCrossReferencesFlow lead={displayedLead} listVersion={listVersion} onBump={onBump} readOnly />
                                </div>
                            </div>
                        ) : (
                            <div id="wf-lead-booking">
                                <LeadCrossReferencesFlow
                                    lead={displayedLead}
                                    listVersion={listVersion}
                                    onBump={onBump}
                                    readOnly={isArchived || isInlineEditing}
                                />
                            </div>
                        )}
                    </div>
                ) : null}

                {tab === 'activity' ? (
                    <div className="w-full min-w-0">
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                            <RecordHistoryLogPanel
                                module="leads"
                                recordId={displayedLead.slug}
                                recordTitle={displayedLead.name}
                                supplementalEntries={leadHistorySupplemental}
                            />
                        </div>
                    </div>
                ) : null}

                {tab === 'notes' ? (
                    <>
                        {noteValidationToastEl}
                        <div className="mx-auto w-full max-w-400 px-0 min-[1920px]:px-0">
                        <div className="flex h-[min(52rem,calc(100dvh-9.5rem))] min-h-96 w-full flex-col overflow-hidden rounded-2xl sm:h-[min(56rem,calc(100dvh-9rem))] min-[1920px]:h-[min(64rem,calc(100dvh-8.5rem))]">
                            {timelineFlash ? (
                                <div
                                    className="shrink-0 border-b border-emerald-200/60 bg-emerald-50/95 px-3 py-2.5 text-center text-sm font-medium text-emerald-900"
                                    role="status"
                                >
                                    {timelineFlash}
                                </div>
                            ) : null}

                            <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch border-none shadow-none">
                                <aside className="w-full min-w-0 shrink-0 overflow-y-auto rounded-xl bg-white p-4  sm:p-5 lg:h-full lg:min-h-0 lg:w-[min(100%,36rem)] xl:w-160 2xl:w-176">
                                <div className="flex min-w-0 flex-col gap-4">
                                    <div>
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">New note</h3>
                                        <form onSubmit={submitNote} className="mt-3 space-y-3">
                                            {noteValidationSummaryEl}
                                            <div className="space-y-1.5">
                                                <label
                                                    className="text-xs font-semibold uppercase tracking-wider text-slate-500"
                                                    htmlFor={NOTE_FIELD_IDS.body}
                                                >
                                                    Note
                                                    <RequiredAsteriskMark />
                                                </label>
                                                <textarea
                                                    id={NOTE_FIELD_IDS.body}
                                                    value={noteDraft}
                                                    onChange={(e) => {
                                                        setNoteDraft(e.target.value);
                                                        setNoteFormErrors((prev) => {
                                                            if (!prev.body) return prev;
                                                            const p = { ...prev };
                                                            delete p.body;
                                                            return p;
                                                        });
                                                    }}
                                                    rows={5}
                                                    placeholder="What happened on the call? Next step? Handoff?"
                                                    aria-invalid={Boolean(noteFormErrors.body)}
                                                    className={cn(
                                                        'min-h-[130px] w-full resize-y rounded-xl border-0 bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:outline-none focus:ring-2',
                                                        noteFormErrors.body
                                                            ? 'ring-2 ring-rose-300/90 focus:ring-rose-500/35'
                                                            : cn('ring-1 ring-slate-200/80 focus:ring-2', CTA_FOCUS_RING_SOFT),
                                                    )}
                                                />
                                                {noteFormErrors.body ? (
                                                    <p className="text-xs font-medium text-rose-600">{noteFormErrors.body}</p>
                                                ) : null}
                                            </div>
                                            <div className="space-y-1.5">
                                                <label
                                                    className="text-xs font-semibold uppercase tracking-wider text-slate-500"
                                                    htmlFor={NOTE_FIELD_IDS.author}
                                                >
                                                    Your name
                                                    <RequiredAsteriskMark />
                                                </label>
                                                <input
                                                    id={NOTE_FIELD_IDS.author}
                                                    value={author}
                                                    onChange={(e) => {
                                                        setAuthor(e.target.value);
                                                        setNoteFormErrors((prev) => {
                                                            if (!prev.author) return prev;
                                                            const p = { ...prev };
                                                            delete p.author;
                                                            return p;
                                                        });
                                                    }}
                                                    placeholder="Your name"
                                                    autoComplete="name"
                                                    aria-invalid={Boolean(noteFormErrors.author)}
                                                    className={cn(
                                                        'h-10 w-full rounded-lg border-0 bg-slate-50 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:outline-none focus:ring-2',
                                                        noteFormErrors.author
                                                            ? 'ring-2 ring-rose-300/90 focus:ring-rose-500/35'
                                                            : cn('ring-1 ring-slate-200/80 focus:ring-2', CTA_FOCUS_RING_SOFT),
                                                    )}
                                                />
                                                {noteFormErrors.author ? (
                                                    <p className="text-xs font-medium text-rose-600">{noteFormErrors.author}</p>
                                                ) : null}
                                            </div>
                                            <div className="flex justify-end">
                                                <Button
                                                    key={noteSubmitShakeKey}
                                                    type="submit"
                                                    variant="company"
                                                    size="cta"
                                                    className={cn(
                                                        'h-10 rounded-lg px-5 text-sm font-semibold shadow-none',
                                                        noteSubmitShakeKey > 0 && 'animate-lead-form-shake',
                                                    )}
                                                >
                                                    Save
                                                </Button>
                                            </div>
                                        </form>
                                    </div>

                                    <div className="h-px bg-slate-100" />

                                    <div>
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Upload file</h3>
                                            <button
                                                type="button"
                                                onClick={openAttachmentCreate}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40"
                                            >
                                                <LuPlus size={14} aria-hidden />
                                                Upload
                                            </button>
                                        </div>
                                        <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
                                            Demo: metadata only. Saved files appear in the thread on the right.
                                        </p>

                                        {lead.attachments.length === 0 ? (
                                            <button
                                                type="button"
                                                onClick={openAttachmentCreate}
                                                className={cn(
                                                    'mt-3 flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center transition',
                                                    CTA_DASHED_DROPZONE_HOVER,
                                                )}
                                            >
                                                <LuFolderOpen className="text-slate-300" size={28} aria-hidden />
                                                <span className="mt-2 text-sm font-medium text-slate-600">Upload a file</span>
                                                <span className="mt-0.5 text-xs text-slate-400">PDF, images, or any reference</span>
                                            </button>
                                        ) : (
                                            <p className="mt-3 rounded-lg bg-slate-50/80 px-3 py-2.5 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-100">
                                                <span className="font-semibold text-slate-800">
                                                    {lead.attachments.length} file{lead.attachments.length === 1 ? '' : 's'}
                                                </span>{' '}
                                                on the thread.{' '}
                                                <button
                                                    type="button"
                                                    onClick={openAttachmentCreate}
                                                    className={cn('font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline')}
                                                >
                                                    Add another
                                                </button>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                </aside>

                                <div className="min-h-0 w-full min-w-0 flex-1 overflow-hidden">
                                    <LeadNotesFilesTimelinePane
                                        listVersion={listVersion}
                                        notes={notes}
                                        attachments={lead.attachments}
                                        formatIso={formatIso}
                                        setPreviewAttachment={setPreviewAttachment}
                                        downloadAttachmentMeta={downloadAttachmentMeta}
                                        openAttachmentEdit={openAttachmentEdit}
                                        deleteAttachment={deleteAttachment}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    </>
                ) : null}

                {tab === 'assignment' ? (
                    <div id="wf-lead-assignment" className="w-full min-w-0">
                        <LeadAssignmentPanel {...panelProps} />
                    </div>
                ) : null}

                {tab === 'follow-up' ? (
                    <div id="wf-lead-follow-up" className="w-full min-w-0">
                        <LeadFollowUpsPanel {...panelProps} />
                    </div>
                ) : null}

                {tab === 'site-visit' ? (
                    <div id="wf-lead-site-visit" className="w-full min-w-0">
                        <LeadSiteVisitPanel {...panelProps} />
                    </div>
                ) : null}

                {tab === 'pipeline' ? (
                    <div id="wf-lead-pipeline" className="mx-auto w-full min-w-0 max-w-6xl">
                        <LeadPipelinePanel {...panelProps} />
                    </div>
                ) : null}

                {tab === 'conversion' ? (
                    <div id="wf-lead-conversion" className="w-full min-w-0">
                        <LeadConversionPanel {...panelProps} />
                    </div>
                ) : null}

                {tab === 'broker' ? (
                    <div className="w-full min-w-0">
                        <LeadBrokerPanel {...panelProps} />
                    </div>
                ) : null}

                {tab === 'notifications' ? (
                    <div className="mx-auto w-full min-w-0 max-w-6xl">
                        <LeadNotificationsPanel {...panelProps} />
                    </div>
                ) : null}
            </div>

            <Modal
                isOpen={!!previewAttachment}
                onClose={() => setPreviewAttachment(null)}
                title="Attachment preview"
                maxWidthClassName="max-w-md"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setPreviewAttachment(null)}>
                            Close
                        </Button>
                        {previewAttachment ? (
                            <Button
                                type="button"
                                variant="company"
                                size="cta"
                                onClick={() => {
                                    downloadAttachmentMeta(previewAttachment);
                                }}
                            >
                                Download
                            </Button>
                        ) : null}
                    </>
                }
            >
                {previewAttachment ? (
                    <div className="space-y-3 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">{previewAttachment.fileName}</p>
                        <dl className="grid gap-2 text-xs sm:text-sm">
                            <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
                                <dt className="text-slate-500">Size</dt>
                                <dd className="font-medium text-slate-800">{previewAttachment.sizeLabel}</dd>
                            </div>
                            <div className="flex justify-between gap-4 border-b border-slate-100 py-2">
                                <dt className="text-slate-500">Uploaded</dt>
                                <dd className="font-medium text-slate-800">{previewAttachment.uploadedAt}</dd>
                            </div>
                            <div className="flex justify-between gap-4 py-2">
                                <dt className="text-slate-500">By</dt>
                                <dd className="font-medium text-slate-800">{previewAttachment.uploadedBy}</dd>
                            </div>
                        </dl>
                        <p className="text-xs text-slate-500">
                            Binary files are not stored in this demo — metadata only. Download exports a small text summary.
                        </p>
                    </div>
                ) : null}
            </Modal>

            <Modal
                isOpen={attachmentModalOpen}
                onClose={closeAttachmentModal}
                title={editingAttachmentId ? 'Edit attachment' : 'Create attachment'}
                maxWidthClassName="max-w-md"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={closeAttachmentModal}>
                            Cancel
                        </Button>
                        <Button type="submit" form="lead-attachment-form" variant="company" size="cta">
                            Save
                        </Button>
                    </>
                }
            >
                <form id="lead-attachment-form" onSubmit={submitAttachment} className="space-y-4">
                    <input
                        ref={attachmentFileInputRef}
                        type="file"
                        className="sr-only"
                        tabIndex={-1}
                        onChange={onAttachmentFileChosen}
                        aria-hidden
                    />
                    <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Upload file</span>
                        <button
                            type="button"
                            onClick={() => attachmentFileInputRef.current?.click()}
                            className={cn(
                                'inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-sm font-semibold text-slate-600 transition',
                                CTA_DASHED_DROPZONE_HOVER,
                            )}
                        >
                            <LuPaperclip size={20} className="shrink-0" aria-hidden />
                            Choose file from device
                        </button>
                        <p className="text-xs text-slate-500">Selecting a file fills name and size. You can still edit fields below.</p>
                    </div>
                    <InputField
                        label="File name"
                        required
                        value={attachFileName}
                        onChange={(e) => {
                            setAttachFileName(e.target.value);
                            if (attachError) setAttachError('');
                        }}
                        placeholder="e.g. Offer_letter.pdf"
                        error={attachError}
                        autoComplete="off"
                    />
                    <InputField
                        label="Size"
                        value={attachSize}
                        onChange={(e) => setAttachSize(e.target.value)}
                        placeholder="e.g. 128 KB"
                    />
                    <InputField
                        label="Uploaded by"
                        value={attachBy}
                        onChange={(e) => setAttachBy(e.target.value)}
                        placeholder="Name"
                    />
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Upload date</label>
                        <input
                            type="date"
                            value={attachDate}
                            onChange={(e) => setAttachDate(e.target.value)}
                            className={cn(
                                'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-gray-900',
                                CTA_INPUT_FOCUS,
                            )}
                        />
                    </div>
                    <p className="text-xs text-slate-500">Binary upload is not stored yet — metadata is saved to the lead record for demo.</p>
                </form>
            </Modal>
        </div>
    );
}
