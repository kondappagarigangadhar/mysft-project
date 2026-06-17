'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditableSelect, EditableTextarea } from '@/components/leads/detail/InlineEditableSection';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { ResidentAIPanel } from '@/components/residents/ResidentAIPanel';
import {
    EditableDatetime,
    EditableEnterpriseTitle,
    EditableMultiSelectChips,
    EditableToggleInline,
    formatFileSize,
    formatNoticeDatetime,
} from '@/components/residents/ResidentInlineFieldExtras';
import { EMPTY_FIELD, ResidentCollapsibleSection, ResidentFieldRow } from '@/components/residents/ResidentOverviewFieldKit';
import { InlineWorkspaceSection } from '@/components/workspace/InlineWorkspaceSection';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { CTA_CARD_EDITING_RING, CTA_EDITING_BADGE, CTA_FOCUS_RING_SOFT } from '@/lib/theme/ctaThemeClasses';
import {
    NOTICE_AUDIENCE_OPTIONS,
    NOTICE_CATEGORY_OPTIONS,
    type NoticeAudienceType,
    type NoticeCategory,
    type Resident,
    type ResidentNotice,
} from '@/lib/residentStore';
import { LuBell, LuDownload, LuFileText, LuPaperclip, LuRadio } from 'react-icons/lu';

export function createEmptyNotice(): ResidentNotice {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const week = new Date(now.getTime() + 7 * 86400000);
    const expiry = `${week.getFullYear()}-${pad(week.getMonth() + 1)}-${pad(week.getDate())}T${pad(week.getHours())}:${pad(week.getMinutes())}`;
    const iso = now.toISOString();
    return {
        id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: '',
        category: 'General',
        description: '',
        attachment: null,
        publishDate: local,
        expiryDate: expiry,
        audienceTypes: ['All'],
        sendPushNotification: false,
        createdAt: iso,
        updatedAt: iso,
    };
}

export function validateNoticeDraft(notice: ResidentNotice): string | null {
    if (!notice.title.trim()) return 'Notice title is required.';
    if (!notice.category) return 'Notice category is required.';
    if (notice.audienceTypes.length === 0) return 'Audience type is required.';
    if (!notice.description.trim()) return 'Notice description is required.';
    if (!notice.publishDate.trim()) return 'Publish date is required.';
    return null;
}

function categoryBadge(cat: NoticeCategory | '') {
    if (cat === 'Emergency') return 'bg-rose-100 text-rose-950';
    if (cat === 'Event') return 'bg-violet-100 text-violet-950';
    if (cat === 'General') return 'bg-slate-100 text-slate-800';
    return 'bg-slate-100 text-slate-700';
}

function audienceRead(types: NoticeAudienceType[]) {
    return types.length ? (
        <span className="flex flex-wrap gap-1.5">
            {types.map((t) => (
                <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">
                    {t}
                </span>
            ))}
        </span>
    ) : (
        EMPTY_FIELD
    );
}

function noticeIsActive(n: ResidentNotice): boolean {
    if (!n.expiryDate?.trim()) return true;
    const exp = Date.parse(n.expiryDate.length <= 10 ? `${n.expiryDate}T23:59` : n.expiryDate);
    return !Number.isNaN(exp) && exp >= Date.now();
}

function sortNoticesNewestFirst(list: ResidentNotice[]): ResidentNotice[] {
    return [...list].sort((a, b) => {
        const ta = Date.parse(a.publishDate) || Date.parse(a.createdAt) || 0;
        const tb = Date.parse(b.publishDate) || Date.parse(b.createdAt) || 0;
        return tb - ta;
    });
}

function FormSectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="border-b border-gray-200/80 bg-gray-50/70 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-600">{children}</p>
        </div>
    );
}

type Props = {
    resident: Resident;
    notices: ResidentNotice[];
    onNoticesChange: (next: ResidentNotice[]) => void;
    canMutate: boolean;
    /** When set, view-mode “Add Notice” enters workspace edit then opens the create form. */
    onRequestEdit?: () => void;
};

function NoticeFormFields({
    notice,
    canMutate,
    onChange,
    grouped,
}: {
    notice: ResidentNotice;
    canMutate: boolean;
    onChange: (patch: Partial<ResidentNotice>) => void;
    grouped?: boolean;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fieldGrid = 'grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2';

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        onChange({
            attachment: {
                id: `natt-${Date.now()}`,
                fileName: file.name,
                sizeLabel: formatFileSize(file.size),
                uploadedAt: new Date().toISOString(),
                mimeType: file.type || 'application/octet-stream',
                blobUrl: URL.createObjectURL(file),
            },
        });
        e.target.value = '';
    };

    const basicFields = (
        <>
            <ResidentFieldRow label="Notice Title" required className="xl:col-span-2">
                <EditableEnterpriseTitle
                    isEditing={canMutate}
                    value={notice.title}
                    onChange={(v) => onChange({ title: v })}
                    placeholder="Enter notice headline"
                    readValue={<span className="text-2xl font-semibold tracking-tight text-gray-900">{notice.title}</span>}
                />
            </ResidentFieldRow>
            <ResidentFieldRow label="Notice Category" required>
                <EditableSelect
                    isEditing={canMutate}
                    value={notice.category}
                    onChange={(v) => onChange({ category: v as NoticeCategory })}
                    options={[...NOTICE_CATEGORY_OPTIONS]}
                    readValue={
                        <span className={cn('rounded-md px-2 py-0.5 text-xs font-bold uppercase', categoryBadge(notice.category))}>
                            {notice.category}
                        </span>
                    }
                />
            </ResidentFieldRow>
            <ResidentFieldRow label="Audience Type" required>
                <EditableMultiSelectChips
                    isEditing={canMutate}
                    value={notice.audienceTypes}
                    onChange={(v) => onChange({ audienceTypes: v })}
                    options={NOTICE_AUDIENCE_OPTIONS}
                    readValue={audienceRead(notice.audienceTypes)}
                />
            </ResidentFieldRow>
            <ResidentFieldRow label="Notice Description" required className="xl:col-span-2">
                <EditableTextarea
                    isEditing={canMutate}
                    value={notice.description}
                    onChange={(v) => onChange({ description: v })}
                    rows={6}
                    placeholder="Write the full notice body…"
                    readValue={<p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{notice.description}</p>}
                />
            </ResidentFieldRow>
        </>
    );

    const scheduleFields = (
        <>
            <ResidentFieldRow label="Publish Date" required>
                <EditableDatetime
                    isEditing={canMutate}
                    value={notice.publishDate}
                    onChange={(v) => onChange({ publishDate: v })}
                    readValue={formatNoticeDatetime(notice.publishDate)}
                />
            </ResidentFieldRow>
            <ResidentFieldRow label="Expiry Date">
                <EditableDatetime
                    isEditing={canMutate}
                    value={notice.expiryDate}
                    onChange={(v) => onChange({ expiryDate: v })}
                    readValue={notice.expiryDate?.trim() ? formatNoticeDatetime(notice.expiryDate) : EMPTY_FIELD}
                />
            </ResidentFieldRow>
        </>
    );

    const communicationFields = (
        <ResidentFieldRow label="Send Push Notification">
            <EditableToggleInline
                isEditing={canMutate}
                checked={notice.sendPushNotification}
                onChange={(v) => onChange({ sendPushNotification: v })}
                readValue={
                    <span
                        className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-bold',
                            notice.sendPushNotification ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-800',
                        )}
                    >
                        {notice.sendPushNotification ? 'On' : 'Off'}
                    </span>
                }
            />
        </ResidentFieldRow>
    );

    const attachmentField = (
        <ResidentFieldRow label="Attachment" className="xl:col-span-2">
            <div className="w-full space-y-2">
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={onPickFile} />
                {notice.attachment ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3">
                        <p className="font-semibold text-gray-900">{notice.attachment.fileName}</p>
                        <p className="text-xs text-gray-500">{notice.attachment.sizeLabel}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {notice.attachment.blobUrl ? (
                                <>
                                    <Button
                                        type="button"
                                        variant="companyOutline"
                                        size="sm"
                                        onClick={() => window.open(notice.attachment!.blobUrl!, '_blank')}
                                    >
                                        Preview
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="companyOutline"
                                        size="sm"
                                        onClick={() => {
                                            const a = document.createElement('a');
                                            a.href = notice.attachment!.blobUrl!;
                                            a.download = notice.attachment!.fileName;
                                            a.click();
                                        }}
                                    >
                                        <LuDownload size={14} className="mr-1 inline" aria-hidden />
                                        Download
                                    </Button>
                                </>
                            ) : (
                                <span className="text-sm text-gray-600">{notice.attachment.fileName} on file</span>
                            )}
                            {canMutate ? (
                                <Button type="button" variant="company" size="sm" onClick={() => fileInputRef.current?.click()}>
                                    Replace
                                </Button>
                            ) : null}
                        </div>
                    </div>
                ) : canMutate ? (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            'flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-6 text-sm font-semibold text-gray-600 hover:border-[var(--cta-button-bg)]',
                            CTA_FOCUS_RING_SOFT,
                        )}
                    >
                        <LuFileText aria-hidden />
                        Upload attachment
                    </button>
                ) : (
                    <span className="text-sm text-gray-500">No attachment</span>
                )}
            </div>
        </ResidentFieldRow>
    );

    if (!grouped) {
        return (
            <div className={fieldGrid}>
                {basicFields}
                {scheduleFields}
                {communicationFields}
                {attachmentField}
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200/80">
            <FormSectionLabel>Basic Details</FormSectionLabel>
            <div className={fieldGrid}>{basicFields}</div>
            <FormSectionLabel>Schedule</FormSectionLabel>
            <div className={fieldGrid}>{scheduleFields}</div>
            <FormSectionLabel>Communication</FormSectionLabel>
            <div className={fieldGrid}>{communicationFields}</div>
            <FormSectionLabel>Attachment</FormSectionLabel>
            <div className={fieldGrid}>{attachmentField}</div>
        </div>
    );
}

function NoticeCardMeta({
    notice,
    active,
}: {
    notice: ResidentNotice;
    active: boolean;
}) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-bold uppercase', categoryBadge(notice.category))}>
                {notice.category}
            </span>
            {notice.audienceTypes.map((a) => (
                <span key={a} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-800">
                    {a}
                </span>
            ))}
            <span
                className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-bold uppercase',
                    active ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700',
                )}
            >
                {active ? 'Active' : 'Expired'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                <LuPaperclip size={12} aria-hidden />
                {notice.attachment ? 'Attached' : 'No file'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                <LuRadio size={12} aria-hidden />
                {notice.sendPushNotification ? 'Push on' : 'Push off'}
            </span>
        </div>
    );
}

function NoticeCard({
    notice,
    index,
    open,
    onOpenChange,
    canMutate,
    onChange,
    onRemove,
    isNew,
    viewMode,
}: {
    notice: ResidentNotice;
    index: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    canMutate: boolean;
    onChange: (patch: Partial<ResidentNotice>) => void;
    onRemove?: () => void;
    isNew?: boolean;
    viewMode?: boolean;
}) {
    const active = noticeIsActive(notice);

    return (
        <div
            className={cn(
                'rounded-xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300',
                canMutate && CTA_CARD_EDITING_RING,
                isNew && 'animate-in fade-in slide-in-from-top-2 duration-300',
            )}
        >
            <div className="bg-[#7185a217] px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200/60 pb-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notice {index + 1}</p>
                            {canMutate ? <span className={CTA_EDITING_BADGE}>Editing Mode</span> : null}
                        </div>
                        <h2 className="mt-0.5 text-lg font-semibold text-gray-900">{notice.title.trim() || 'Untitled notice'}</h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Published {formatNoticeDatetime(notice.publishDate)}
                            {notice.expiryDate?.trim() ? ` · Expires ${formatNoticeDatetime(notice.expiryDate)}` : ''}
                        </p>
                        <div className="mt-2">
                            <NoticeCardMeta notice={notice} active={active} />
                        </div>
                    </div>
                    {canMutate && onRemove ? (
                        <button type="button" className="text-xs font-semibold text-rose-700 hover:underline" onClick={onRemove}>
                            Remove
                        </button>
                    ) : null}
                </div>
                <div className="mt-4">
                    <ResidentCollapsibleSection
                        title={viewMode ? 'VIEW NOTICE' : 'NOTICE BOARD'}
                        icon={LuBell}
                        tone="blue"
                        open={open}
                        onOpenChange={onOpenChange}
                    >
                        <NoticeFormFields
                            notice={notice}
                            canMutate={canMutate}
                            grouped={viewMode || !canMutate}
                            onChange={onChange}
                        />
                    </ResidentCollapsibleSection>
                </div>
            </div>
        </div>
    );
}

function InlineCreateNoticeForm({
    draft,
    onDraftChange,
    onSave,
    onCancel,
    saving,
}: {
    draft: ResidentNotice;
    onDraftChange: (patch: Partial<ResidentNotice>) => void;
    onSave: () => void;
    onCancel: () => void;
    saving: boolean;
}) {
    const [sectionOpen, setSectionOpen] = useState(true);

    return (
        <div className={cn('rounded-xl border bg-white shadow-sm', CTA_CARD_EDITING_RING)}>
            <div className="bg-[#7185a217] px-4 py-4 sm:px-5">
                <ResidentCollapsibleSection
                    title="NEW NOTICE"
                    icon={LuBell}
                    tone="blue"
                    open={sectionOpen}
                    onOpenChange={setSectionOpen}
                >
                    <NoticeFormFields notice={draft} canMutate grouped onChange={onDraftChange} />
                    <div className="flex flex-col-reverse gap-2 border-t border-gray-200/80 px-3 py-3 sm:flex-row sm:justify-end">
                        <Button type="button" variant="companyOutline" size="sm" onClick={onCancel} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="sm" onClick={onSave} isLoading={saving}>
                            Save Notice
                        </Button>
                    </div>
                </ResidentCollapsibleSection>
            </div>
        </div>
    );
}

export function ResidentNoticesTab({ resident, notices, onNoticesChange, canMutate, onRequestEdit }: Props) {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
    const [createFormOpen, setCreateFormOpen] = useState(false);
    const [createDraft, setCreateDraft] = useState<ResidentNotice>(() => createEmptyNotice());
    const [createSaving, setCreateSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);
    const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
    const [pendingCreateAfterEdit, setPendingCreateAfterEdit] = useState(false);

    const viewMode = !canMutate;
    const canAddNotice = canMutate || Boolean(onRequestEdit);

    const sortedNotices = useMemo(() => sortNoticesNewestFirst(notices), [notices]);

    const stats = useMemo(() => {
        const active = sortedNotices.filter(noticeIsActive).length;
        const emergency = sortedNotices.filter((n) => n.category === 'Emergency').length;
        const events = sortedNotices.filter((n) => n.category === 'Event').length;
        return { total: sortedNotices.length, active, emergency, events };
    }, [sortedNotices]);

    useEffect(() => {
        setOpenSections((prev) => {
            const next = { ...prev };
            for (const n of sortedNotices) {
                if (next[n.id] === undefined) {
                    // View: collapsed until user expands; edit: open for quick editing
                    next[n.id] = canMutate;
                }
            }
            return next;
        });
    }, [sortedNotices, canMutate]);

    useEffect(() => {
        if (!canMutate) {
            setCreateFormOpen(false);
        }
    }, [canMutate]);

    useEffect(() => {
        if (canMutate && pendingCreateAfterEdit) {
            setPendingCreateAfterEdit(false);
            setCreateDraft(createEmptyNotice());
            setCreateFormOpen(true);
        }
    }, [canMutate, pendingCreateAfterEdit]);

    useEffect(() => {
        if (!recentlyAddedId) return;
        const t = setTimeout(() => setRecentlyAddedId(null), 600);
        return () => clearTimeout(t);
    }, [recentlyAddedId]);

    const updateNotice = useCallback(
        (id: string, patch: Partial<ResidentNotice>) => {
            onNoticesChange(
                sortNoticesNewestFirst(
                    notices.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)),
                ),
            );
        },
        [notices, onNoticesChange],
    );

    const removeNotice = useCallback(
        (id: string) => {
            onNoticesChange(notices.filter((n) => n.id !== id));
        },
        [notices, onNoticesChange],
    );

    const openCreateForm = useCallback(() => {
        setCreateDraft(createEmptyNotice());
        setCreateFormOpen(true);
    }, []);

    const handleAddNotice = useCallback(() => {
        if (canMutate) {
            openCreateForm();
            return;
        }
        if (onRequestEdit) {
            setPendingCreateAfterEdit(true);
            onRequestEdit();
        }
    }, [canMutate, onRequestEdit, openCreateForm]);

    const cancelCreateForm = useCallback(() => {
        setCreateFormOpen(false);
        setCreateDraft(createEmptyNotice());
    }, []);

    const saveCreateForm = useCallback(() => {
        const err = validateNoticeDraft(createDraft);
        if (err) {
            setToast({ message: err, variant: 'error' });
            return;
        }
        setCreateSaving(true);
        const now = new Date().toISOString();
        const saved: ResidentNotice = {
            ...createDraft,
            id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: createDraft.title.trim(),
            description: createDraft.description.trim(),
            createdAt: now,
            updatedAt: now,
        };
        onNoticesChange(sortNoticesNewestFirst([saved, ...notices]));
        setRecentlyAddedId(saved.id);
        setOpenSections((s) => ({ ...s, [saved.id]: true }));
        setCreateFormOpen(false);
        setCreateDraft(createEmptyNotice());
        setCreateSaving(false);
        setToast({ message: 'Notice saved successfully.', variant: 'success' });
    }, [createDraft, notices, onNoticesChange]);

    const summaryBadges = (
        <>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-900">{stats.active} active</span>
            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-950">{stats.emergency} emergency</span>
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-950">{stats.events} events</span>
        </>
    );

    const emptyState = (
        <div className="rounded-xl border border-gray-200/80 bg-white px-4 py-10 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-700">No notices added yet.</p>
            {canMutate ? (
                <p className="mt-1 text-sm text-gray-500">Click Add Notice to create one.</p>
            ) : canAddNotice ? (
                <p className="mt-1 text-sm text-gray-500">Click Add Notice to create one, or expand a notice below to view details.</p>
            ) : (
                <p className="mt-1 text-sm text-gray-500">No notices published for this resident.</p>
            )}
        </div>
    );

    return (
        <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-5">
            <InlineWorkspaceSection
                className="lg:col-span-2"
                summaryLabel={`${stats.total} notice${stats.total === 1 ? '' : 's'} · resident communications`}
                summaryBadges={summaryBadges}
                editingHint={
                    canMutate ? (
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--cta-button-bg)]">Workspace edit</p>
                    ) : null
                }
                canAdd={canAddNotice}
                addButtonLabel="Add Notice"
                onAdd={handleAddNotice}
                createFormOpen={createFormOpen && canMutate}
                createForm={
                    <InlineCreateNoticeForm
                        draft={createDraft}
                        onDraftChange={(patch) => setCreateDraft((d) => ({ ...d, ...patch }))}
                        onSave={saveCreateForm}
                        onCancel={cancelCreateForm}
                        saving={createSaving}
                    />
                }
                isEmpty={sortedNotices.length === 0}
                emptyState={emptyState}
            >
                {sortedNotices.map((notice, idx) => (
                    <NoticeCard
                        key={notice.id}
                        notice={notice}
                        index={idx}
                        open={openSections[notice.id] ?? canMutate}
                        onOpenChange={(o) => setOpenSections((s) => ({ ...s, [notice.id]: o }))}
                        canMutate={canMutate}
                        viewMode={viewMode}
                        onChange={(patch) => updateNotice(notice.id, patch)}
                        onRemove={canMutate ? () => removeNotice(notice.id) : undefined}
                        isNew={notice.id === recentlyAddedId}
                    />
                ))}
            </InlineWorkspaceSection>

            <div className="min-w-0 lg:col-span-1 lg:sticky lg:top-44 lg:self-start">
                <ResidentAIPanel resident={resident} disabled={canMutate} tabContext="notices" />
            </div>

            {toast ? (
                <InlineToast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
            ) : null}
        </div>
    );
}
