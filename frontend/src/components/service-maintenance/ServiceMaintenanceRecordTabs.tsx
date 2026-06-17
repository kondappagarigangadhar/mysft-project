'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EditableField, EditableSelect, EditableTextarea } from '@/components/leads/detail/InlineEditableSection';
import { RecordHistoryLogPanel } from '@/components/history-logs/RecordHistoryLogPanel';
import { ServiceMaintenanceAIPanel } from '@/components/service-maintenance/ServiceMaintenanceAIPanel';
import { ServiceMaintenanceDetailMoreMenu } from '@/components/service-maintenance/ServiceMaintenanceDetailMoreMenu';
import { ServiceMaintenanceMainTabBar } from '@/components/service-maintenance/ServiceMaintenanceMainTabBar';
import {
    normalizeServiceMaintenanceTab,
    type ServiceMaintenanceTabId,
} from '@/components/service-maintenance/serviceMaintenanceDetailTabIds';
import { EMPTY_FIELD, ServiceCollapsibleSection, ServiceFieldRow } from '@/components/service-maintenance/ServiceMaintenanceOverviewFieldKit';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { StatusModal } from '@/components/ui/StatusModal';
import { cn } from '@/lib/utils';
import {
    CTA_CARD_EDITING_RING,
    CTA_EDITING_BADGE,
    CTA_FOCUS_RING_SOFT,
    CTA_INFO_BANNER,
    CTA_INFO_BANNER_BADGE,
    CTA_UTILITY_BTN,
} from '@/lib/theme/ctaThemeClasses';
import { WorkspaceUtilityToolbar, SERVICE_MAINTENANCE_WORKSPACE_HELP } from '@/components/workspace-help';
import type { HistoryLogEntry } from '@/lib/historyLogs/types';
import {
    addServiceMaintenanceTicket,
    applyServiceTicketResolutionStatus,
    assignVendorToServiceTicket,
    isServiceTicketResolutionComplete,
    reopenServiceMaintenanceTicket,
    runAutoAssignmentForServiceTicket,
    closeServiceMaintenanceTicket,
    computeRemainingSlaLabel,
    computeSlaProgressPercent,
    deleteServiceMaintenanceTicketPermanent,
    ESCALATION_LEVEL_OPTIONS,
    getAssignedVendorOptions,
    ISSUE_CATEGORY_OPTIONS,
    peekNextServiceTicketCode,
    PRIORITY_LEVEL_OPTIONS,
    RESOLUTION_STATUS_OPTIONS,
    SERVICE_LOCATION_UNIT_OPTIONS,
    SLA_TYPE_OPTIONS,
    SOURCE_CHANNEL_OPTIONS,
    TICKET_STATUS_OPTIONS,
    updateServiceMaintenanceTicket,
    getResidentContextForTicket,
    resolveServiceTicketResidentContext,
    type EscalationLevel,
    type ServiceTicketResidentContext,
    type IssueCategory,
    type PriorityLevel,
    type ResolutionStatus,
    type ServiceAttachment,
    type ServiceMaintenanceTicket,
    type SlaStatus,
    type SlaType,
    type SourceChannel,
    type TicketStatus,
} from '@/lib/serviceMaintenanceStore';
import { serviceMaintenanceCreateHref, serviceMaintenanceListHref, serviceMaintenanceViewHref } from '@/lib/serviceMaintenanceRoutes';
import { residentViewHref } from '@/lib/residentRoutes';
import { workOrderProfileHref } from '@/lib/workOrderRoutes';
import { getServiceTicketAssignedDateLabel } from '@/lib/service-maintenance/serviceTicketResidentDisplay';
import {
    LuTriangle,
    LuCalendar,
    LuClock3,
    LuDownload,
    LuEllipsis,
    LuFileText,
    LuLayoutGrid,
    LuMail,
    LuMapPin,
    LuPaperclip,
    LuPrinter,
    LuStar,
    LuTimer,
    LuUser,
    LuWrench,
} from 'react-icons/lu';

type Draft = {
    requestTitle: string;
    issueCategory: IssueCategory | '';
    priorityLevel: PriorityLevel | '';
    description: string;
    locationUnit: string;
    preferredVisitTime: string;
    ticketStatus: TicketStatus | '';
    sourceChannel: SourceChannel | '';
    slaType: SlaType | '';
    responseTimeHours: number;
    resolutionTimeHours: number;
    escalationLevel: EscalationLevel | '';
    slaDueAt: string;
    assignedVendor: string;
    assignmentDate: string;
    estimatedCost: number;
    vendorNotes: string;
    autoAssignEnabled: boolean;
    resolutionNotes: string;
    resolutionStatus: ResolutionStatus | '';
    closureConfirmation: boolean;
    residentFeedback: number;
    closureDate: string;
};

const INLINE_IDS = {
    requestTitle: 'svc-inline-request-title',
    description: 'svc-inline-description',
    locationUnit: 'svc-inline-location',
    preferredVisitTime: 'svc-inline-visit-time',
    vendorNotes: 'svc-inline-vendor-notes',
    resolutionNotes: 'svc-inline-resolution-notes',
    estimatedCost: 'svc-inline-estimated-cost',
    responseHours: 'svc-inline-response-hours',
    resolutionHours: 'svc-inline-resolution-hours',
    slaDueAt: 'svc-inline-sla-due',
} as const;

type Props = {
    ticket: ServiceMaintenanceTicket;
    createMode: boolean;
    onBump: () => void;
};

function formatIso(iso: string) {
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

function formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

function toDatetimeLocalValue(iso: string): string {
    if (!iso?.trim()) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(v: string): string {
    if (!v?.trim()) return new Date().toISOString();
    const parsed = Date.parse(v);
    return Number.isNaN(parsed) ? v : new Date(parsed).toISOString();
}

function buildDraft(t: ServiceMaintenanceTicket): Draft {
    return {
        requestTitle: t.requestTitle,
        issueCategory: t.issueCategory,
        priorityLevel: t.priorityLevel,
        description: t.description,
        locationUnit: t.locationUnit,
        preferredVisitTime: toDatetimeLocalValue(t.preferredVisitTime),
        ticketStatus: t.ticketStatus,
        sourceChannel: t.sourceChannel,
        slaType: t.slaType,
        responseTimeHours: t.responseTimeHours,
        resolutionTimeHours: t.resolutionTimeHours,
        escalationLevel: t.escalationLevel,
        slaDueAt: toDatetimeLocalValue(t.slaDueAt),
        assignedVendor: t.assignedVendor,
        assignmentDate: t.assignmentDate,
        estimatedCost: t.estimatedCost,
        vendorNotes: t.vendorNotes,
        autoAssignEnabled: t.autoAssignEnabled,
        resolutionNotes: t.resolutionNotes,
        resolutionStatus: t.resolutionStatus,
        closureConfirmation: t.closureConfirmation,
        residentFeedback: t.residentFeedback,
        closureDate: t.closureDate,
    };
}

function emptyDraft(locationUnit?: string, residentContext?: ServiceTicketResidentContext): Draft {
    const now = new Date().toISOString();
    const unit = locationUnit?.trim() || residentContext?.propertyUnit?.trim() || (SERVICE_LOCATION_UNIT_OPTIONS[0] ?? '');
    const residentNote = residentContext
        ? [
              `Resident: ${residentContext.fullName} (${residentContext.residentCode})`,
              residentContext.propertyUnit ? `Unit: ${residentContext.propertyUnit}` : '',
              residentContext.phoneNumber ? `Phone: ${residentContext.phoneNumber}` : '',
              residentContext.email ? `Email: ${residentContext.email}` : '',
          ]
              .filter(Boolean)
              .join('\n')
        : '';
    return {
        requestTitle: '',
        issueCategory: 'General',
        priorityLevel: 'Medium',
        description: residentNote,
        locationUnit: unit,
        preferredVisitTime: toDatetimeLocalValue(now),
        ticketStatus: 'Open',
        sourceChannel: residentContext ? 'Portal' : 'Manual',
        slaType: 'Standard',
        responseTimeHours: 4,
        resolutionTimeHours: 24,
        escalationLevel: 'Level 1',
        slaDueAt: toDatetimeLocalValue(now),
        assignedVendor: 'Unassigned',
        assignmentDate: '',
        estimatedCost: 0,
        vendorNotes: '',
        autoAssignEnabled: true,
        resolutionNotes: '',
        resolutionStatus: '',
        closureConfirmation: false,
        residentFeedback: 0,
        closureDate: '',
    };
}

function categoryBadge(cat: IssueCategory | '') {
    if (!cat) return 'bg-slate-100 text-slate-700';
    const map: Partial<Record<IssueCategory, string>> = {
        Plumbing: 'bg-sky-100 text-sky-900',
        Electrical: 'bg-amber-100 text-amber-950',
        HVAC: 'bg-cyan-100 text-cyan-950',
        Security: 'bg-violet-100 text-violet-900',
        Cleaning: 'bg-teal-100 text-teal-900',
        Civil: 'bg-stone-100 text-stone-900',
    };
    return map[cat] ?? 'bg-slate-100 text-slate-800';
}

function priorityBadge(p: PriorityLevel | '') {
    if (!p) return 'bg-slate-100 text-slate-700';
    if (p === 'Critical') return 'bg-rose-100 text-rose-900';
    if (p === 'High') return 'bg-orange-100 text-orange-950';
    if (p === 'Medium') return 'bg-amber-100 text-amber-950';
    return 'bg-slate-100 text-slate-800';
}

function statusBadge(s: TicketStatus | '') {
    if (!s) return 'bg-slate-100 text-slate-700';
    if (s === 'Open') return 'bg-blue-100 text-blue-900';
    if (s === 'In Progress') return 'bg-indigo-100 text-indigo-900';
    if (s === 'On Hold') return 'bg-amber-100 text-amber-950';
    if (s === 'Resolved') return 'bg-emerald-100 text-emerald-900';
    return 'bg-slate-200 text-slate-900';
}

function slaBadge(s: SlaStatus) {
    if (s === 'Breached') return 'bg-rose-100 text-rose-900 ring-1 ring-rose-200';
    if (s === 'Warning') return 'bg-amber-100 text-amber-950 ring-1 ring-amber-200';
    return 'bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200';
}

function StarRating({
    value,
    editing,
    onChange,
}: {
    value: number;
    editing: boolean;
    onChange: (n: number) => void;
}) {
    if (!editing) {
        if (!value) return <span className="text-gray-500">{EMPTY_FIELD}</span>;
        return (
            <span className="inline-flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                    <LuStar key={n} size={16} className={cn(n <= value ? 'text-amber-500 fill-amber-400' : 'text-gray-300')} aria-hidden />
                ))}
                <span className="ml-1 text-sm text-gray-600">({value}/5)</span>
            </span>
        );
    }
    return (
        <span className="inline-flex flex-wrap items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    onClick={() => onChange(n)}
                    className={cn(
                        'rounded p-1 transition hover:bg-amber-50',
                        CTA_FOCUS_RING_SOFT,
                        n <= value ? 'text-amber-500' : 'text-gray-300',
                    )}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                >
                    <LuStar size={20} className={cn(n <= value && 'fill-amber-400')} />
                </button>
            ))}
        </span>
    );
}

function AttachmentBlock({
    label,
    attachment,
    canMutate,
    fileInputRef,
    onPick,
    onPreview,
    onDownload,
}: {
    label: string;
    attachment: ServiceAttachment | null;
    canMutate: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPreview: () => void;
    onDownload: () => void;
}) {
    return (
        <div className="space-y-3 p-3">
            <p className="text-sm text-gray-600">{label}</p>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={onPick} />
            {attachment ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="font-semibold text-gray-900">{attachment.fileName}</p>
                            <p className="text-xs text-gray-500">
                                {attachment.sizeLabel} · {formatIso(attachment.uploadedAt)}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="companyOutline" size="sm" onClick={onPreview} disabled={!attachment.blobUrl}>
                                Preview
                            </Button>
                            <Button type="button" variant="companyOutline" size="sm" onClick={onDownload} disabled={!attachment.blobUrl}>
                                Download
                            </Button>
                            <Button type="button" variant="company" size="sm" onClick={() => fileInputRef.current?.click()} disabled={!canMutate}>
                                Replace
                            </Button>
                        </div>
                    </div>
                    {attachment.mimeType.startsWith('image') && attachment.blobUrl ? (
                        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white p-2">
                            <img src={attachment.blobUrl} alt="" className="max-h-64 w-full object-contain" />
                        </div>
                    ) : null}
                </div>
            ) : (
                <button
                    type="button"
                    disabled={!canMutate}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        'flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white px-4 py-10 text-sm font-semibold text-gray-600 hover:border-[var(--cta-button-bg)] hover:text-[var(--cta-button-bg)] disabled:opacity-40',
                        CTA_FOCUS_RING_SOFT,
                    )}
                >
                    <LuPaperclip className="mb-2 h-8 w-8 opacity-70" aria-hidden />
                    Upload file
                </button>
            )}
        </div>
    );
}

export function ServiceMaintenanceRecordTabs({ ticket, createMode, onBump }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [tab, setTab] = useState<ServiceMaintenanceTabId>(() => normalizeServiceMaintenanceTab(searchParams.get('tab')));
    const [isInlineEditing, setIsInlineEditing] = useState(false);
    const [inlineSaving, setInlineSaving] = useState(false);
    const [inlineToast, setInlineToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const [statusModal, setStatusModal] = useState<{ open: boolean; type: 'success' | 'error'; title: string }>({
        open: false,
        type: 'success',
        title: '',
    });
    const [optimistic, setOptimistic] = useState<ServiceMaintenanceTicket | null>(null);
    const [permDelOpen, setPermDelOpen] = useState(false);
    const [assignVendorOpen, setAssignVendorOpen] = useState(false);
    const [assignVendorChoice, setAssignVendorChoice] = useState('Unassigned');
    const [sectionsOpen, setSectionsOpen] = useState({ ticket: true, sla: true, vendor: true, resolution: true, attachments: true });

    const linkedResidentSlug = searchParams.get('resident')?.trim() ?? '';
    const linkedResidentUnit = searchParams.get('unit')?.trim() ?? '';

    const linkedResident = useMemo(
        () =>
            createMode
                ? resolveServiceTicketResidentContext(linkedResidentSlug, linkedResidentUnit)
                : getResidentContextForTicket(ticket),
        [createMode, linkedResidentSlug, linkedResidentUnit, ticket],
    );

    const [draft, setDraft] = useState<Draft>(() =>
        createMode
            ? emptyDraft(
                  linkedResidentUnit,
                  resolveServiceTicketResidentContext(linkedResidentSlug, linkedResidentUnit),
              )
            : buildDraft(ticket),
    );
    const [ticketAttachment, setTicketAttachment] = useState<ServiceAttachment | null>(() => ticket.attachment);
    const [resolutionAttachment, setResolutionAttachment] = useState<ServiceAttachment | null>(() => ticket.resolutionAttachment);
    const ticketFileRef = useRef<HTMLInputElement>(null);
    const resolutionFileRef = useRef<HTMLInputElement>(null);

    const displayed = optimistic ?? ticket;
    const canMutateFields = createMode || (isInlineEditing && !ticket.deletedAt);
    const fieldGrid = 'grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2';
    const nextCode = peekNextServiceTicketCode();
    const vendorOptions = useMemo(() => getAssignedVendorOptions(), []);

    const liveSlaStatus = displayed.slaStatus;
    const slaProgress = computeSlaProgressPercent(displayed.createdAt, displayed.slaDueAt, displayed.ticketStatus);
    const slaRemaining = computeRemainingSlaLabel(displayed.slaDueAt, displayed.ticketStatus);

    const historySupplemental = useMemo((): HistoryLogEntry[] => {
        if (createMode) return [];
        const entries: HistoryLogEntry[] = [
            {
                id: `svc-${displayed.slug}-created`,
                at: displayed.createdAt,
                user: { id: 'u-sys', name: 'System', role: 'Platform' },
                module: 'service_maintenance',
                recordId: displayed.slug,
                recordLabel: displayed.requestTitle,
                action: 'Service ticket created',
                changes: '—',
                severity: 'success',
                actionType: 'created',
            },
            {
                id: `svc-${displayed.slug}-updated`,
                at: displayed.updatedAt,
                user: { id: 'u-admin', name: 'Company Admin', role: 'Company Admin' },
                module: 'service_maintenance',
                recordId: displayed.slug,
                recordLabel: displayed.requestTitle,
                action: 'Ticket updated',
                changes: '—',
                severity: 'info',
                actionType: 'edited',
            },
        ];
        if (displayed.assignedVendor && displayed.assignedVendor !== 'Unassigned') {
            entries.push({
                id: `svc-${displayed.slug}-vendor`,
                at: displayed.assignmentDate || displayed.updatedAt,
                user: { id: 'u-ops', name: 'Operations', role: 'Company Admin' },
                module: 'service_maintenance',
                recordId: displayed.slug,
                recordLabel: displayed.requestTitle,
                action: `Vendor assigned: ${displayed.assignedVendor}`,
                changes: displayed.assignedVendor,
                severity: 'info',
                actionType: 'assigned',
            });
        }
        if (displayed.escalationLevel !== 'Level 1') {
            entries.push({
                id: `svc-${displayed.slug}-esc`,
                at: displayed.updatedAt,
                user: { id: 'u-ops', name: 'Operations', role: 'Company Admin' },
                module: 'service_maintenance',
                recordId: displayed.slug,
                recordLabel: displayed.requestTitle,
                action: `Escalated to ${displayed.escalationLevel}`,
                changes: displayed.escalationLevel,
                severity: 'warning',
                actionType: 'status_changed',
            });
        }
        return entries;
    }, [createMode, displayed]);

    useEffect(() => {
        setTab(createMode ? 'overview' : normalizeServiceMaintenanceTab(searchParams.get('tab')));
    }, [searchParams, createMode]);

    useEffect(() => {
        if (!createMode) return;
        if (tab === 'overview') return;
        setTab('overview');
        const sp = new URLSearchParams(searchParams.toString());
        sp.set('tab', 'overview');
        router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
    }, [createMode, tab, router, pathname, searchParams]);

    useEffect(() => {
        const e = searchParams.get('edit');
        if (e !== '1' && e !== 'true') return;
        if (createMode) return;
        setIsInlineEditing(true);
        const sp = new URLSearchParams(searchParams.toString());
        sp.delete('edit');
        const qs = sp.toString();
        const base = serviceMaintenanceViewHref(ticket.slug);
        router.replace(qs ? `${base}?${qs}` : base, { scroll: false });
    }, [searchParams, router, createMode, ticket.slug]);

    useEffect(() => {
        setOptimistic(null);
        setTicketAttachment(ticket.attachment);
        setResolutionAttachment(ticket.resolutionAttachment);
        if (!isInlineEditing && !createMode) setDraft(buildDraft(ticket));
    }, [ticket, isInlineEditing, createMode]);

    useEffect(() => {
        if (!createMode) return;
        const residentContext = resolveServiceTicketResidentContext(linkedResidentSlug, linkedResidentUnit);
        setDraft(emptyDraft(linkedResidentUnit, residentContext));
        setTicketAttachment(null);
        setResolutionAttachment(null);
    }, [createMode, linkedResidentSlug, linkedResidentUnit]);

    const setTabNavigate = useCallback(
        (next: ServiceMaintenanceTabId) => {
            if (createMode && next !== 'overview') return;
            setTab(next);
            const sp = new URLSearchParams(searchParams.toString());
            sp.set('tab', next);
            router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
        },
        [router, searchParams, createMode, pathname],
    );

    const patchFromDraft = (): Partial<ServiceMaintenanceTicket> => ({
        requestTitle: draft.requestTitle.trim(),
        issueCategory: draft.issueCategory as IssueCategory,
        priorityLevel: draft.priorityLevel as PriorityLevel,
        description: draft.description.trim(),
        locationUnit: draft.locationUnit.trim(),
        preferredVisitTime: fromDatetimeLocalValue(draft.preferredVisitTime),
        ticketStatus: draft.ticketStatus as TicketStatus,
        sourceChannel: draft.sourceChannel as SourceChannel,
        slaType: draft.slaType as SlaType,
        responseTimeHours: draft.responseTimeHours,
        resolutionTimeHours: draft.resolutionTimeHours,
        escalationLevel: draft.escalationLevel as EscalationLevel,
        slaDueAt: fromDatetimeLocalValue(draft.slaDueAt),
        assignedVendor: draft.assignedVendor,
        assignmentDate: draft.assignmentDate,
        estimatedCost: draft.estimatedCost,
        vendorNotes: draft.vendorNotes.trim(),
        autoAssignEnabled: draft.autoAssignEnabled,
        resolutionNotes: draft.resolutionNotes.trim(),
        resolutionStatus: draft.resolutionStatus,
        closureConfirmation: draft.closureConfirmation,
        residentFeedback: draft.residentFeedback,
        closureDate: draft.closureDate,
        attachment: ticketAttachment,
        resolutionAttachment,
    });

    const isDirty = useMemo(() => {
        if (createMode) return true;
        const base = buildDraft(ticket);
        const draftDirty = (Object.keys(base) as (keyof Draft)[]).some((k) => draft[k] !== base[k]);
        return (
            draftDirty ||
            JSON.stringify(ticketAttachment) !== JSON.stringify(ticket.attachment) ||
            JSON.stringify(resolutionAttachment) !== JSON.stringify(ticket.resolutionAttachment)
        );
    }, [createMode, draft, ticket, ticketAttachment, resolutionAttachment]);

    const validate = (): string | null => {
        if (!draft.requestTitle.trim()) return 'Request title is required.';
        if (!draft.issueCategory) return 'Issue category is required.';
        if (!draft.priorityLevel) return 'Priority is required.';
        if (!draft.locationUnit.trim()) return 'Location / unit is required.';
        if (!draft.sourceChannel) return 'Source channel is required.';
        if (!draft.slaType) return 'SLA type is required.';
        return null;
    };

    const onCreate = async ({ andNew }: { andNew: boolean }) => {
        const err = validate();
        if (err) {
            setInlineToast({ msg: err, err: true });
            return;
        }
        setInlineSaving(true);
        try {
            const created = addServiceMaintenanceTicket({
                ...patchFromDraft(),
                requestTitle: draft.requestTitle.trim(),
                ...(linkedResident?.slug ? { residentSlug: linkedResident.slug } : {}),
            });
            onBump();
            setStatusModal({ open: true, type: 'success', title: 'Service ticket created' });
            if (andNew) {
                setDraft(emptyDraft(linkedResidentUnit, linkedResident));
                setTicketAttachment(null);
                setResolutionAttachment(null);
                const createHref = serviceMaintenanceCreateHref(
                    linkedResident
                        ? { residentSlug: linkedResident.slug, propertyUnit: linkedResident.propertyUnit }
                        : undefined,
                );
                router.replace(`${createHref}${createHref.includes('?') ? '&' : '?'}tab=overview`, { scroll: false });
            } else {
                window.setTimeout(() => {
                    router.replace(`${serviceMaintenanceViewHref(created.slug)}?tab=overview`, { scroll: true });
                }, 400);
            }
        } catch {
            setInlineToast({ msg: 'Could not create ticket.', err: true });
        } finally {
            setInlineSaving(false);
        }
    };

    const onSaveEdit = async ({ exitAfter }: { exitAfter: boolean }) => {
        const err = validate();
        if (err) {
            setInlineToast({ msg: err, err: true });
            return;
        }
        setInlineSaving(true);
        try {
            const updated = updateServiceMaintenanceTicket(ticket.slug, patchFromDraft());
            if (!updated) {
                setInlineToast({ msg: 'Could not save changes.', err: true });
                return;
            }
            setOptimistic(updated);
            onBump();
            setStatusModal({ open: true, type: 'success', title: 'Changes saved successfully' });
            if (exitAfter) setIsInlineEditing(false);
        } finally {
            setInlineSaving(false);
        }
    };

    const onCancelEdit = () => {
        setDraft(buildDraft(ticket));
        setTicketAttachment(ticket.attachment);
        setResolutionAttachment(ticket.resolutionAttachment);
        setIsInlineEditing(false);
        setOptimistic(null);
    };

    const exportJson = () => {
        const payload = { ...displayed, attachment: ticketAttachment, resolutionAttachment };
        const safe = (displayed.requestTitle || 'service-ticket')
            .replace(/[/\\?%*:|"<>]/g, '-')
            .replace(/\.+$/, '')
            .slice(0, 80);
        downloadTextFile({ filename: `${safe}.json`, content: JSON.stringify(payload, null, 2), mime: 'application/json;charset=utf-8' });
    };

    const ticketMailtoHref = useMemo(() => {
        const subject = `${displayed.ticketCode}: ${displayed.requestTitle}`;
        const url = typeof window !== 'undefined' ? window.location.href : '';
        const body = [
            `Ticket: ${displayed.ticketCode}`,
            `Title: ${displayed.requestTitle}`,
            `Status: ${displayed.ticketStatus}`,
            `Unit: ${displayed.locationUnit}`,
            url ? `Link: ${url}` : '',
        ]
            .filter(Boolean)
            .join('\n');
        return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }, [displayed]);

    const makeAttachment = (file: File): ServiceAttachment => ({
        id: `att-${Date.now()}`,
        fileName: file.name,
        sizeLabel: formatFileSize(file.size),
        uploadedAt: new Date().toISOString(),
        mimeType: file.type || 'application/octet-stream',
        blobUrl: URL.createObjectURL(file),
    });

    const onPickTicketFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setTicketAttachment(makeAttachment(file));
        e.target.value = '';
    };

    const onPickResolutionFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setResolutionAttachment(makeAttachment(file));
        e.target.value = '';
    };

    const openAttachment = (att: ServiceAttachment | null) => {
        if (!att?.blobUrl) return;
        window.open(att.blobUrl, '_blank', 'noopener,noreferrer');
    };

    const downloadAttachment = (att: ServiceAttachment | null) => {
        if (!att?.blobUrl) return;
        const a = document.createElement('a');
        a.href = att.blobUrl;
        a.download = att.fileName;
        a.click();
    };

    const confirmAssignVendor = () => {
        if (assignVendorChoice === 'Unassigned') {
            setInlineToast({ msg: 'Select a vendor to assign.', err: true });
            return;
        }
        const isReassign = displayed.assignedVendor !== 'Unassigned';
        const updated = assignVendorToServiceTicket(ticket.slug, {
            vendorName: assignVendorChoice,
            method: 'Manual',
            confidence: 100,
            reason: isReassign ? 'Manual reassignment by manager' : 'Manual vendor assignment',
            assignedBy: 'Company Admin',
        });
        setAssignVendorOpen(false);
        if (updated) setOptimistic(updated);
        onBump();
        setInlineToast({
            msg: isReassign ? `Vendor changed to ${assignVendorChoice}.` : `Assigned ${assignVendorChoice}.`,
            err: false,
        });
    };

    const openChangeVendor = () => {
        setAssignVendorChoice(displayed.assignedVendor !== 'Unassigned' ? displayed.assignedVendor : vendorOptions[1] ?? 'Unassigned');
        setAssignVendorOpen(true);
    };

    const showOverviewContent = tab === 'overview' || createMode;

    const d = draft;

    const headerTitle = createMode ? d.requestTitle.trim() || 'New service ticket' : displayed.requestTitle;
    const headerCategory = (canMutateFields ? d.issueCategory : displayed.issueCategory) as IssueCategory | '';
    const headerPriority = (canMutateFields ? d.priorityLevel : displayed.priorityLevel) as PriorityLevel | '';
    const headerStatus = (canMutateFields ? d.ticketStatus : displayed.ticketStatus) as TicketStatus | '';
    const vendorAssignedDateLabel = useMemo(() => getServiceTicketAssignedDateLabel(displayed), [displayed]);

    const syncTicketFromStore = useCallback(
        (updated: ServiceMaintenanceTicket | undefined) => {
            if (!updated) return;
            setOptimistic(updated);
            if (!isInlineEditing) setDraft(buildDraft(updated));
            onBump();
        },
        [isInlineEditing, onBump],
    );

    const handleResolutionStatusChange = (status: ResolutionStatus | '') => {
        if (createMode) {
            setDraft((x) => ({ ...x, resolutionStatus: status }));
            return;
        }
        syncTicketFromStore(applyServiceTicketResolutionStatus(ticket.slug, status));
    };

    const handleReopenTicket = () => {
        syncTicketFromStore(reopenServiceMaintenanceTicket(ticket.slug));
        setInlineToast({ msg: 'Ticket reopened — resolution pending.', err: false });
    };

    const canReopenTicket =
        !createMode &&
        !ticket.deletedAt &&
        (isServiceTicketResolutionComplete(displayed) ||
            displayed.ticketStatus === 'Resolved' ||
            displayed.ticketStatus === 'Closed');

    const renderTicketSection = () => (
        <ServiceCollapsibleSection
            title="TICKET INFORMATION"
            icon={LuLayoutGrid}
            tone="blue"
            open={sectionsOpen.ticket}
            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, ticket: o }))}
        >
            <div className={fieldGrid}>
                <ServiceFieldRow label="Ticket ID">
                    <span className="font-mono text-sm tracking-tight text-gray-900">{createMode ? `${nextCode} (auto)` : displayed.ticketCode}</span>
                </ServiceFieldRow>
                {linkedResident ? (
                    <ServiceFieldRow label="Linked resident" className="xl:col-span-2">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                            <Link
                                href={residentViewHref(linkedResident.slug)}
                                className="inline-flex items-center gap-1.5 font-semibold text-(--cta-button-bg) hover:text-(--cta-button-hover-bg) hover:underline"
                            >
                                <LuUser size={14} aria-hidden />
                                {linkedResident.fullName}
                            </Link>
                            <span className="text-gray-400">·</span>
                            <span className="font-mono text-xs text-gray-600">{linkedResident.residentCode}</span>
                            <span className="text-gray-400">·</span>
                            <span className="text-gray-700">{linkedResident.propertyUnit}</span>
                        </div>
                    </ServiceFieldRow>
                ) : null}
                <ServiceFieldRow label="Request title" required>
                    <EditableField
                        id={INLINE_IDS.requestTitle}
                        isEditing={canMutateFields}
                        value={d.requestTitle}
                        onChange={(v) => setDraft((x) => ({ ...x, requestTitle: v }))}
                        readValue={displayed.requestTitle || EMPTY_FIELD}
                    />
                </ServiceFieldRow>
                <ServiceFieldRow label="Issue category" required>
                    <EditableSelect
                        isEditing={canMutateFields}
                        value={d.issueCategory}
                        onChange={(v) => setDraft((x) => ({ ...x, issueCategory: v as IssueCategory }))}
                        options={[...ISSUE_CATEGORY_OPTIONS]}
                        readValue={displayed.issueCategory || EMPTY_FIELD}
                    />
                </ServiceFieldRow>
                <ServiceFieldRow label="Priority" required>
                    <EditableSelect
                        isEditing={canMutateFields}
                        value={d.priorityLevel}
                        onChange={(v) => setDraft((x) => ({ ...x, priorityLevel: v as PriorityLevel }))}
                        options={[...PRIORITY_LEVEL_OPTIONS]}
                        readValue={displayed.priorityLevel || EMPTY_FIELD}
                    />
                </ServiceFieldRow>
                <ServiceFieldRow label="Status">
                    <EditableSelect
                        isEditing={canMutateFields && !createMode}
                        value={d.ticketStatus}
                        onChange={(v) => setDraft((x) => ({ ...x, ticketStatus: v as TicketStatus }))}
                        options={[...TICKET_STATUS_OPTIONS]}
                        readValue={displayed.ticketStatus || EMPTY_FIELD}
                    />
                </ServiceFieldRow>
                <ServiceFieldRow label="Source channel" required>
                    <EditableSelect
                        isEditing={canMutateFields}
                        value={d.sourceChannel}
                        onChange={(v) => setDraft((x) => ({ ...x, sourceChannel: v as SourceChannel }))}
                        options={[...SOURCE_CHANNEL_OPTIONS]}
                        readValue={displayed.sourceChannel || EMPTY_FIELD}
                    />
                </ServiceFieldRow>
                <ServiceFieldRow label="Location / unit" required className="xl:col-span-2">
                    <EditableSelect
                        isEditing={canMutateFields}
                        value={d.locationUnit}
                        onChange={(v) => setDraft((x) => ({ ...x, locationUnit: v }))}
                        options={[...SERVICE_LOCATION_UNIT_OPTIONS]}
                        readValue={displayed.locationUnit || EMPTY_FIELD}
                    />
                </ServiceFieldRow>
                <ServiceFieldRow label="Preferred visit" required>
                    <EditableField
                        id={INLINE_IDS.preferredVisitTime}
                        isEditing={canMutateFields}
                        type="text"
                        value={d.preferredVisitTime}
                        onChange={(v) => setDraft((x) => ({ ...x, preferredVisitTime: v }))}
                        readValue={formatIso(displayed.preferredVisitTime)}
                    />
                </ServiceFieldRow>
                <ServiceFieldRow label="Description" required className="xl:col-span-2">
                    <EditableTextarea
                        id={INLINE_IDS.description}
                        isEditing={canMutateFields}
                        value={d.description}
                        onChange={(v) => setDraft((x) => ({ ...x, description: v }))}
                        rows={4}
                        readValue={
                            displayed.description?.trim() ? (
                                <span className="whitespace-pre-wrap text-sm leading-relaxed">{displayed.description}</span>
                            ) : (
                                EMPTY_FIELD
                            )
                        }
                    />
                </ServiceFieldRow>
            </div>
        </ServiceCollapsibleSection>
    );

    const renderSlaSection = () => (
        <ServiceCollapsibleSection
            title="SLA MANAGEMENT"
            icon={LuTimer}
            tone="amber"
            open={sectionsOpen.sla}
            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, sla: o }))}
            headerRight={
                !createMode ? (
                    <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', slaBadge(liveSlaStatus))}>
                        {liveSlaStatus}
                    </span>
                ) : null
            }
        >
            {!createMode ? (
                <div className="space-y-4 border-b border-gray-100 px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900">SLA countdown</p>
                        <span className="text-sm font-medium text-gray-700">{slaRemaining}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all',
                                liveSlaStatus === 'Breached' ? 'bg-rose-500' : liveSlaStatus === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500',
                            )}
                            style={{ width: `${slaProgress}%` }}
                            role="progressbar"
                            aria-valuenow={slaProgress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {liveSlaStatus === 'Breached' ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-900">
                                <LuTriangle size={14} aria-hidden /> SLA breached
                            </span>
                        ) : null}
                        {liveSlaStatus === 'Warning' ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-950">
                                <LuTriangle size={14} aria-hidden /> At risk
                            </span>
                        ) : null}
                        {liveSlaStatus === 'On Track' && displayed.ticketStatus !== 'Closed' && displayed.ticketStatus !== 'Resolved' ? (
                            <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900">On track</span>
                        ) : null}
                    </div>
                </div>
            ) : null}
            <div className={fieldGrid}>
                <ServiceFieldRow label="SLA type" required>
                    <EditableSelect
                        isEditing={canMutateFields}
                        value={d.slaType}
                        onChange={(v) => setDraft((x) => ({ ...x, slaType: v as SlaType }))}
                        options={[...SLA_TYPE_OPTIONS]}
                        readValue={displayed.slaType || EMPTY_FIELD}
                    />
                </ServiceFieldRow>
                <ServiceFieldRow label="Escalation level">
                    <EditableSelect
                        isEditing={canMutateFields}
                        value={d.escalationLevel}
                        onChange={(v) => setDraft((x) => ({ ...x, escalationLevel: v as EscalationLevel }))}
                        options={[...ESCALATION_LEVEL_OPTIONS]}
                        readValue={displayed.escalationLevel || EMPTY_FIELD}
                    />
                </ServiceFieldRow>
                <ServiceFieldRow label="Response (hrs)">
                    <EditableField
                        id={INLINE_IDS.responseHours}
                        isEditing={canMutateFields}
                        value={String(d.responseTimeHours)}
                        onChange={(v) => setDraft((x) => ({ ...x, responseTimeHours: Number(v) || 0 }))}
                        readValue={String(displayed.responseTimeHours)}
                    />
                </ServiceFieldRow>
                <ServiceFieldRow label="Resolution (hrs)">
                    <EditableField
                        id={INLINE_IDS.resolutionHours}
                        isEditing={canMutateFields}
                        value={String(d.resolutionTimeHours)}
                        onChange={(v) => setDraft((x) => ({ ...x, resolutionTimeHours: Number(v) || 0 }))}
                        readValue={String(displayed.resolutionTimeHours)}
                    />
                </ServiceFieldRow>
                <ServiceFieldRow label="SLA due">
                    <EditableField
                        id={INLINE_IDS.slaDueAt}
                        isEditing={canMutateFields}
                        value={d.slaDueAt}
                        onChange={(v) => setDraft((x) => ({ ...x, slaDueAt: v }))}
                        readValue={formatIso(displayed.slaDueAt)}
                    />
                </ServiceFieldRow>
                <ServiceFieldRow label="SLA status">
                    <span className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-bold uppercase', slaBadge(displayed.slaStatus))}>
                        {displayed.slaStatus}
                    </span>
                </ServiceFieldRow>
            </div>
        </ServiceCollapsibleSection>
    );

    const renderVendorSection = () => (
        <ServiceCollapsibleSection
            title="VENDOR ASSIGNMENT"
            icon={LuWrench}
            tone="slate"
            open={sectionsOpen.vendor}
            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, vendor: o }))}
        >
            {!createMode ? (
                <div className="border-b border-gray-100 px-4 py-2.5 text-xs text-slate-600">
                    <span className="font-semibold uppercase tracking-wide text-slate-500">Assigned date</span>
                    <span className="ml-2 tabular-nums text-slate-800">{vendorAssignedDateLabel}</span>
                </div>
            ) : null}
            {!createMode && displayed.assignedVendor !== 'Unassigned' ? (
                <div className="border-b border-gray-100 px-4 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assigned vendor</p>
                            <span className="mt-1 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-900">
                                <LuWrench size={14} className="text-[var(--cta-button-bg)]" aria-hidden />
                                {displayed.assignedVendor}
                            </span>
                        </div>
                        {!ticket.deletedAt ? (
                            <Button type="button" variant="companyOutline" size="sm" onClick={openChangeVendor}>
                                Change vendor
                            </Button>
                        ) : null}
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assignment method</p>
                            <p className="mt-0.5 text-sm font-semibold text-slate-900">
                                {displayed.assignmentMethod === 'Auto'
                                    ? 'Auto Assigned'
                                    : displayed.assignmentMethod === 'Manual'
                                      ? 'Manual'
                                      : EMPTY_FIELD}
                            </p>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Confidence</p>
                            <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
                                {displayed.assignmentConfidence > 0 ? `${displayed.assignmentConfidence}%` : EMPTY_FIELD}
                            </p>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 sm:col-span-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assignment reason</p>
                            <p className="mt-0.5 text-sm font-medium text-slate-800">
                                {displayed.assignmentReason?.trim() || EMPTY_FIELD}
                            </p>
                        </div>
                    </div>
                    {displayed.linkedWorkOrderSlug ? (
                        <p className="mt-3 text-xs text-slate-600">
                            Linked work order:{' '}
                            <Link
                                href={workOrderProfileHref(displayed.linkedWorkOrderSlug)}
                                className="font-semibold text-[var(--cta-button-bg)] hover:underline"
                            >
                                {displayed.linkedWorkOrderId || displayed.linkedWorkOrderSlug}
                            </Link>
                        </p>
                    ) : null}
                    {(displayed.assignmentHistory?.length ?? 0) > 0 ? (
                        <div className="mt-3 rounded-lg border border-slate-100 bg-white px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assignment history</p>
                            <ul className="mt-2 space-y-2">
                                {[...(displayed.assignmentHistory ?? [])].reverse().slice(0, 5).map((h) => (
                                    <li key={h.id} className="text-xs text-slate-700">
                                        <span className="font-semibold text-slate-900">{formatIso(h.at)}</span>
                                        {' · '}
                                        {h.method === 'Auto' ? 'Auto' : 'Manual'} → {h.vendorName}
                                        {h.reason ? <span className="text-slate-500"> — {h.reason}</span> : null}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}
                </div>
            ) : null}
            {!createMode && displayed.assignedVendor === 'Unassigned' ? (
                <div className="border-b border-amber-100 bg-amber-50/60 px-4 py-3">
                    <p className="text-xs text-amber-900">
                        {displayed.autoAssignEnabled
                            ? 'Auto assignment engine is enabled — matching project, tower, category, compliance, and SLA on create.'
                            : 'No vendor assigned yet.'}
                    </p>
                    {!ticket.deletedAt ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {displayed.autoAssignEnabled ? (
                                <Button
                                    type="button"
                                    variant="company"
                                    size="sm"
                                    onClick={() => {
                                        const updated = runAutoAssignmentForServiceTicket(ticket.slug);
                                        if (!updated || updated.assignedVendor === 'Unassigned') {
                                            setInlineToast({ msg: 'No eligible vendor matched auto-assignment rules.', err: true });
                                            return;
                                        }
                                        setOptimistic(updated);
                                        onBump();
                                        setInlineToast({ msg: `Auto-assigned ${updated.assignedVendor}.`, err: false });
                                    }}
                                >
                                    Run auto-assignment
                                </Button>
                            ) : null}
                            <Button type="button" variant="companyOutline" size="sm" onClick={openChangeVendor}>
                                Assign vendor
                            </Button>
                        </div>
                    ) : null}
                </div>
            ) : null}
            <div className={fieldGrid}>
                <ServiceFieldRow label="Assigned vendor">
                    <EditableSelect
                        isEditing={canMutateFields}
                        value={d.assignedVendor}
                        onChange={(v) => setDraft((x) => ({ ...x, assignedVendor: v }))}
                        options={vendorOptions}
                        readValue={displayed.assignedVendor || EMPTY_FIELD}
                    />
                </ServiceFieldRow>
                <ServiceFieldRow label="Assigned date">
                    <span className="text-sm text-gray-900">{vendorAssignedDateLabel === '—' ? EMPTY_FIELD : vendorAssignedDateLabel}</span>
                </ServiceFieldRow>
                <ServiceFieldRow label="Estimated cost">
                    <EditableField
                        id={INLINE_IDS.estimatedCost}
                        isEditing={canMutateFields}
                        value={String(d.estimatedCost)}
                        onChange={(v) => setDraft((x) => ({ ...x, estimatedCost: Number(v) || 0 }))}
                        readValue={displayed.estimatedCost ? `₹${displayed.estimatedCost.toLocaleString()}` : EMPTY_FIELD}
                    />
                </ServiceFieldRow>
                <ServiceFieldRow label="Auto-assign">
                    {canMutateFields ? (
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={d.autoAssignEnabled}
                                onChange={(e) => setDraft((x) => ({ ...x, autoAssignEnabled: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            Enable auto-assign
                        </label>
                    ) : (
                        <span>{displayed.autoAssignEnabled ? 'Yes' : 'No'}</span>
                    )}
                </ServiceFieldRow>
                <ServiceFieldRow label="Vendor notes" className="xl:col-span-2">
                    <EditableTextarea
                        id={INLINE_IDS.vendorNotes}
                        isEditing={canMutateFields}
                        value={d.vendorNotes}
                        onChange={(v) => setDraft((x) => ({ ...x, vendorNotes: v }))}
                        rows={3}
                        readValue={displayed.vendorNotes?.trim() || EMPTY_FIELD}
                    />
                </ServiceFieldRow>
            </div>
        </ServiceCollapsibleSection>
    );

    const renderResolutionSection = () => (
        <ServiceCollapsibleSection
            title="RESOLUTION WORKFLOW"
            icon={LuFileText}
            tone="slate"
            open={sectionsOpen.resolution}
            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, resolution: o }))}
        >
            <div className={fieldGrid}>
                <ServiceFieldRow label="Resolution status">
                    <div className="flex flex-wrap items-center gap-2">
                        <EditableSelect
                            isEditing={canMutateFields}
                            value={d.resolutionStatus}
                            onChange={(v) => handleResolutionStatusChange(v as ResolutionStatus)}
                            options={['', ...RESOLUTION_STATUS_OPTIONS]}
                            placeholder="Select status"
                            readValue={displayed.resolutionStatus || 'Pending'}
                        />
                        {canReopenTicket ? (
                            <Button type="button" variant="companyOutline" size="sm" onClick={handleReopenTicket}>
                                Reopen
                            </Button>
                        ) : null}
                    </div>
                </ServiceFieldRow>
                <ServiceFieldRow label="Resident feedback">
                    <StarRating
                        value={canMutateFields ? d.residentFeedback : displayed.residentFeedback}
                        editing={canMutateFields}
                        onChange={(n) => setDraft((x) => ({ ...x, residentFeedback: n }))}
                    />
                </ServiceFieldRow>
                <ServiceFieldRow label="Closure confirmed">
                    {canMutateFields ? (
                        <label className="inline-flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={d.closureConfirmation}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    if (createMode) {
                                        setDraft((x) => ({ ...x, closureConfirmation: checked }));
                                        return;
                                    }
                                    syncTicketFromStore(
                                        updateServiceMaintenanceTicket(ticket.slug, { closureConfirmation: checked }),
                                    );
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            Ticket closure confirmed
                        </label>
                    ) : (
                        <span>{displayed.closureConfirmation ? 'Yes' : 'No'}</span>
                    )}
                </ServiceFieldRow>
                <ServiceFieldRow label="Closed date">
                    <span className="text-sm text-gray-900">{displayed.closureDate ? formatIso(displayed.closureDate) : EMPTY_FIELD}</span>
                </ServiceFieldRow>
                <ServiceFieldRow label="Resolution notes" className="xl:col-span-2">
                    <EditableTextarea
                        id={INLINE_IDS.resolutionNotes}
                        isEditing={canMutateFields}
                        value={d.resolutionNotes}
                        onChange={(v) => setDraft((x) => ({ ...x, resolutionNotes: v }))}
                        rows={4}
                        readValue={
                            displayed.resolutionNotes?.trim() ? (
                                <span className="whitespace-pre-wrap text-sm">{displayed.resolutionNotes}</span>
                            ) : (
                                EMPTY_FIELD
                            )
                        }
                    />
                </ServiceFieldRow>
            </div>
        </ServiceCollapsibleSection>
    );

    const renderAttachmentsSection = () => (
        <ServiceCollapsibleSection
            title="ATTACHMENTS"
            icon={LuPaperclip}
            tone="slate"
            open={sectionsOpen.attachments}
            onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, attachments: o }))}
        >
            <AttachmentBlock
                label="Ticket attachment (photos, PDFs)"
                attachment={ticketAttachment}
                canMutate={canMutateFields}
                fileInputRef={ticketFileRef}
                onPick={onPickTicketFile}
                onPreview={() => openAttachment(ticketAttachment)}
                onDownload={() => downloadAttachment(ticketAttachment)}
            />
            <AttachmentBlock
                label="Resolution attachment"
                attachment={resolutionAttachment}
                canMutate={canMutateFields}
                fileInputRef={resolutionFileRef}
                onPick={onPickResolutionFile}
                onPreview={() => openAttachment(resolutionAttachment)}
                onDownload={() => downloadAttachment(resolutionAttachment)}
            />
        </ServiceCollapsibleSection>
    );

    const sidebar = (
        <div className="min-w-0 space-y-4 lg:col-span-1 lg:sticky lg:top-44 lg:self-start">
            {linkedResident ? (
                <Card className="border border-gray-200 p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900">Linked resident</h3>
                    <dl className="mt-3 space-y-2 text-sm text-gray-700">
                        <div className="flex justify-between gap-2">
                            <dt className="text-gray-500">Name</dt>
                            <dd className="max-w-[60%] truncate text-right font-medium text-gray-900">
                                <Link href={residentViewHref(linkedResident.slug)} className="hover:text-(--cta-button-bg) hover:underline">
                                    {linkedResident.fullName}
                                </Link>
                            </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-gray-500">Unit</dt>
                            <dd className="max-w-[60%] truncate text-right font-medium text-gray-900">{linkedResident.propertyUnit || '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-gray-500">Phone</dt>
                            <dd className="font-medium text-gray-900">
                                {linkedResident.phoneNumber?.trim() ? (
                                    <a href={`tel:${linkedResident.phoneNumber.replace(/\s/g, '')}`} className="hover:text-(--cta-button-bg) hover:underline">
                                        {linkedResident.phoneNumber}
                                    </a>
                                ) : (
                                    '—'
                                )}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                            <dt className="text-gray-500">Email</dt>
                            <dd className="max-w-[60%] truncate text-right font-medium text-gray-900">
                                {linkedResident.email?.trim() ? (
                                    <a href={`mailto:${linkedResident.email}`} className="hover:text-(--cta-button-bg) hover:underline">
                                        {linkedResident.email}
                                    </a>
                                ) : (
                                    '—'
                                )}
                            </dd>
                        </div>
                    </dl>
                </Card>
            ) : null}
            {createMode ? (
                <div className="opacity-60">
                    <ServiceMaintenanceAIPanel ticket={displayed} disabled />
                </div>
            ) : (
                <ServiceMaintenanceAIPanel ticket={displayed} disabled={isInlineEditing} />
            )}
        </div>
    );

    return (
        <div className="w-full min-w-0 space-y-0">
            <StatusModal open={statusModal.open} type={statusModal.type} title={statusModal.title} onClose={() => setStatusModal((s) => ({ ...s, open: false }))} />
            {inlineToast ? <InlineToast message={inlineToast.msg} variant={inlineToast.err ? 'error' : 'success'} onDismiss={() => setInlineToast(null)} /> : null}

            <ServiceMaintenanceMainTabBar active={tab} onChange={setTabNavigate} />

            {createMode ? (
                <div className={CTA_INFO_BANNER}>
                    You are creating a service ticket
                    {linkedResident ? (
                        <>
                            {' '}
                            for <span className="font-semibold text-gray-900">{linkedResident.fullName}</span>
                        </>
                    ) : null}{' '}
                    <span className={CTA_INFO_BANNER_BADGE}>Draft</span>
                </div>
            ) : null}

            {!createMode ? (
                <div className="mt-3 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                            {!ticket.deletedAt ? (
                                <ServiceMaintenanceDetailMoreMenu
                                    ticket={displayed}
                                    onEdit={() => {
                                        setDraft(buildDraft(optimistic ?? ticket));
                                        setTicketAttachment(ticket.attachment);
                                        setResolutionAttachment(ticket.resolutionAttachment);
                                        setIsInlineEditing(true);
                                    }}
                                    isEditing={isInlineEditing}
                                    isSaving={inlineSaving}
                                    onAssignVendor={() => {
                                        setAssignVendorChoice(displayed.assignedVendor === 'Unassigned' ? vendorOptions[1] ?? 'Unassigned' : displayed.assignedVendor);
                                        setAssignVendorOpen(true);
                                    }}
                                    onCloseTicket={() => {
                                        closeServiceMaintenanceTicket(ticket.slug);
                                        onBump();
                                        setStatusModal({ open: true, type: 'success', title: 'Ticket closed' });
                                    }}
                                    onRequestDelete={() => setPermDelOpen(true)}
                                />
                            ) : (
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Archived ticket</span>
                            )}
                        </div>
                        <WorkspaceUtilityToolbar
                            help={SERVICE_MAINTENANCE_WORKSPACE_HELP}
                            triggerLabel="Service request workspace help"
                            emailHref={ticketMailtoHref}
                            onExport={exportJson}
                            saving={inlineSaving}
                            isInlineEditing={isInlineEditing}
                        />
                    </div>
                </div>
            ) : null}

            {!createMode ? (
                <div className="mt-2 rounded-md bg-white/80 px-4 py-2 text-sm text-gray-700">
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
                        <span className="inline-flex items-center gap-2">
                            <LuCalendar size={14} className="text-gray-500" aria-hidden />
                            <span className="text-gray-600">Created</span>
                            <span className="font-medium text-gray-900">{formatIso(displayed.createdAt)}</span>
                        </span>
                        <span className="hidden h-4 w-px bg-gray-300 sm:inline" aria-hidden />
                        <span className="inline-flex items-center gap-2">
                            <LuClock3 size={14} className="text-gray-500" aria-hidden />
                            <span className="text-gray-600">Updated</span>
                            <span className="font-medium text-gray-900">{formatIso(displayed.updatedAt)}</span>
                        </span>
                       
                    </div>
                </div>
            ) : null}

            <div className="min-h-[min(24rem,70vh)] w-full max-w-full rounded-xl bg-gray-50/50 px-3 py-4 sm:px-4 sm:py-5 lg:px-1 lg:py-5">
                {tab === 'activity' ? (
                    <div className="w-full min-w-0">
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                            <RecordHistoryLogPanel
                                module="service_maintenance"
                                recordId={displayed.slug}
                                recordTitle={displayed.requestTitle}
                                supplementalEntries={historySupplemental}
                            />
                        </div>
                    </div>
                ) : showOverviewContent ? (
                    <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-5">
                        <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:col-span-2">
                            <div
                                className={cn(
                                    'flex min-h-0 min-w-0 flex-col rounded-xl border bg-white shadow-sm',
                                    (isInlineEditing || createMode) && !ticket.deletedAt ? CTA_CARD_EDITING_RING : 'border-gray-200/80',
                                )}
                            >
                                <div className="bg-[#7185a217] px-4 py-4 sm:px-5 sm:py-5">
                                    <div className="flex min-w-0 gap-4 border-b border-gray-200/60 pb-4">
                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-slate-100 to-slate-50 text-lg font-semibold text-slate-700 ring-1 ring-gray-200/80">
                                            <LuMapPin size={28} className="text-slate-500" aria-hidden />
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="truncate text-2xl font-semibold tracking-tight text-gray-900">{headerTitle}</h2>
                                                {isInlineEditing || createMode ? <span className={CTA_EDITING_BADGE}>Editing Mode</span> : null}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide text-slate-700">
                                                    {createMode ? nextCode : displayed.ticketCode}
                                                </span>
                                                {headerCategory ? (
                                                    <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide', categoryBadge(headerCategory))}>
                                                        {headerCategory}
                                                    </span>
                                                ) : null}
                                                {headerPriority ? (
                                                    <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide', priorityBadge(headerPriority))}>
                                                        {headerPriority}
                                                    </span>
                                                ) : null}
                                                {headerStatus ? (
                                                    <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide', statusBadge(headerStatus))}>
                                                        {headerStatus}
                                                    </span>
                                                ) : null}
                                                {!createMode ? (
                                                    <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide', slaBadge(displayed.slaStatus))}>
                                                        SLA {displayed.slaStatus}
                                                    </span>
                                                ) : null}
                                            </div>
                                            {/* <p className="text-sm text-gray-600 line-clamp-2">
                                                {(canMutateFields ? d.description : displayed.description)?.trim() || 'No description yet.'}
                                            </p> */}
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-4">
                                        {renderTicketSection()}
                                        {renderSlaSection()}
                                        {renderVendorSection()}
                                        {renderResolutionSection()}
                                        {renderAttachmentsSection()}
                                    </div>

                                </div>
                            </div>
                        </div>
                        {sidebar}
                    </div>
                ) : null}

                {(createMode || (isInlineEditing && !ticket.deletedAt)) ? (
                    <div className="sticky bottom-0 z-30 mt-4 pb-1">
                        <div className="rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_-6px_rgba(15,23,42,0.10)] backdrop-blur supports-backdrop-filter:bg-white/90 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-5">
                            <p className="text-sm font-semibold text-gray-900">
                                {createMode ? 'Create service ticket' : isDirty ? 'You have unsaved changes' : 'Up to date'}
                            </p>
                            <div className="mt-3 flex flex-col-reverse gap-2 sm:mt-0 sm:flex-row sm:items-center sm:justify-end">
                                <Button
                                    type="button"
                                    variant="companyOutline"
                                    size="cta"
                                    onClick={createMode ? () => router.push(serviceMaintenanceListHref()) : onCancelEdit}
                                    disabled={inlineSaving}
                                >
                                    Cancel
                                </Button>
                                {createMode ? (
                                    <>
                                        <Button
                                            type="button"
                                            variant="companyOutline"
                                            size="cta"
                                            onClick={() => void onCreate({ andNew: true })}
                                            isLoading={inlineSaving}
                                        >
                                            Save &amp; new
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="company"
                                            size="cta"
                                            onClick={() => void onCreate({ andNew: false })}
                                            isLoading={inlineSaving}
                                        >
                                            Save
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            type="button"
                                            variant="companyOutline"
                                            size="cta"
                                            onClick={() => void onSaveEdit({ exitAfter: false })}
                                            disabled={inlineSaving || !isDirty}
                                            isLoading={inlineSaving}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="company"
                                            size="cta"
                                            onClick={() => void onSaveEdit({ exitAfter: true })}
                                            disabled={inlineSaving || !isDirty}
                                            isLoading={inlineSaving}
                                        >
                                            Save &amp; exit
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <Modal
                isOpen={assignVendorOpen}
                onClose={() => setAssignVendorOpen(false)}
                title={displayed.assignedVendor !== 'Unassigned' ? 'Change vendor' : 'Assign vendor'}
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setAssignVendorOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={confirmAssignVendor}>
                            Assign
                        </Button>
                    </>
                }
            >
                <label className="block text-sm font-medium text-slate-700">
                    Vendor
                    <select
                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        value={assignVendorChoice}
                        onChange={(e) => setAssignVendorChoice(e.target.value)}
                    >
                        {vendorOptions.filter((v) => v !== 'Unassigned').map((v) => (
                            <option key={v} value={v}>
                                {v}
                            </option>
                        ))}
                    </select>
                </label>
            </Modal>

            <Modal
                isOpen={permDelOpen}
                onClose={() => setPermDelOpen(false)}
                title="Delete ticket"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setPermDelOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            className="bg-rose-600 hover:bg-rose-700"
                            onClick={() => {
                                deleteServiceMaintenanceTicketPermanent(ticket.slug);
                                setPermDelOpen(false);
                                router.push(serviceMaintenanceListHref());
                            }}
                        >
                            Delete
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Permanently remove <span className="font-semibold text-slate-900">{ticket.requestTitle}</span>? This cannot be undone in the demo store.
                </p>
            </Modal>
        </div>
    );
}
