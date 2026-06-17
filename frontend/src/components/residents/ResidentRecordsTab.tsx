'use client';

import React, { useMemo, useState } from 'react';
import { EditableField, EditableSelect } from '@/components/leads/detail/InlineEditableSection';
import { ResidentAIPanel } from '@/components/residents/ResidentAIPanel';
import { EditableTagMultiSelect, EditableToggleInline, formatNoticeDatetime } from '@/components/residents/ResidentInlineFieldExtras';
import { EMPTY_FIELD, ResidentCollapsibleSection, ResidentFieldRow } from '@/components/residents/ResidentOverviewFieldKit';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { CTA_CARD_EDITING_RING, CTA_EDITING_BADGE } from '@/lib/theme/ctaThemeClasses';
import {
    COMMUNITY_OCCUPANCY_STATUS_OPTIONS,
    COMMUNITY_OCCUPANCY_TYPE_OPTIONS,
    getResidents,
    RESIDENT_TAG_PRESETS,
    type CommunityOccupancyStatus,
    type CommunityOccupancyType,
    type Resident,
    type ResidentCommunityRecord,
    type ResidentTimelineLog,
} from '@/lib/residentStore';
import { LuBuilding2, LuClock3, LuSearch, LuTags, LuUsers } from 'react-icons/lu';

function occupancyBadge(status: CommunityOccupancyStatus | '') {
    if (status === 'Occupied') return 'bg-emerald-100 text-emerald-900';
    if (status === 'Vacant') return 'bg-amber-100 text-amber-950';
    return 'bg-slate-100 text-slate-700';
}

type Props = {
    resident: Resident;
    communityRecord: ResidentCommunityRecord;
    onCommunityRecordChange: (next: ResidentCommunityRecord) => void;
    canMutate: boolean;
};

export function ResidentRecordsTab({ resident, communityRecord, onCommunityRecordChange, canMutate }: Props) {
    const [sectionsOpen, setSectionsOpen] = useState({
        directory: true,
        timeline: true,
        occupancy: true,
        search: true,
        tags: true,
    });
    const [addingLog, setAddingLog] = useState(false);
    const [logDraft, setLogDraft] = useState<{ at: string; kind: 'move-in' | 'move-out'; note: string }>({
        at: new Date().toISOString().slice(0, 16),
        kind: 'move-in',
        note: '',
    });

    const fieldGrid = 'grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200/80 xl:grid-cols-2';
    const rec = communityRecord;
    const [localSearch, setLocalSearch] = useState(rec.residentSearchQuery);

    React.useEffect(() => {
        if (!canMutate) setLocalSearch(rec.residentSearchQuery);
    }, [rec.residentSearchQuery, canMutate]);

    const searchQuery = canMutate ? rec.residentSearchQuery : localSearch;

    const allResidents = useMemo(() => getResidents(), [resident.updatedAt, searchQuery]);

    const searchMatches = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return allResidents.slice(0, 5);
        return allResidents.filter(
            (r) =>
                r.fullName.toLowerCase().includes(q) ||
                r.communityRecord.unitNumber.toLowerCase().includes(q) ||
                r.propertyUnit.toLowerCase().includes(q),
        );
    }, [allResidents, searchQuery]);

    const patch = (p: Partial<ResidentCommunityRecord>) => onCommunityRecordChange({ ...rec, ...p });

    const saveTimelineLog = () => {
        if (!logDraft.note.trim()) return;
        const entry: ResidentTimelineLog = { ...logDraft, id: `tl-${Date.now()}` };
        patch({ timelineLogs: [...rec.timelineLogs, entry] });
        setAddingLog(false);
        setLogDraft({ at: new Date().toISOString().slice(0, 16), kind: 'move-in', note: '' });
    };

    const tagsRead = (tags: string[]) =>
        tags.length ? (
            <span className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                    <span key={t} className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-950">
                        {t}
                    </span>
                ))}
            </span>
        ) : (
            EMPTY_FIELD
        );

    return (
        <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-5">
            <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:col-span-2">
                <div className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700">
                    <p className="font-medium text-gray-800">
                        Community directory &amp; occupancy
                        {canMutate ? (
                            <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-[var(--cta-button-bg)]">
                                Workspace edit
                            </span>
                        ) : null}
                    </p>
                </div>

                <div className={cn('rounded-xl border bg-white shadow-sm', canMutate ? CTA_CARD_EDITING_RING : 'border-gray-200/80')}>
                    <div className="bg-[#7185a217] px-4 py-4 sm:px-5 sm:py-5">
                        {canMutate ? (
                            <div className="mb-3">
                                <span className={CTA_EDITING_BADGE}>Editing Mode</span>
                            </div>
                        ) : null}

                        <div className="space-y-4">
                            <ResidentCollapsibleSection
                                title="COMMUNITY DIRECTORY"
                                icon={LuUsers}
                                tone="blue"
                                open={sectionsOpen.directory}
                                onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, directory: o }))}
                            >
                                <div className={fieldGrid}>
                                    <ResidentFieldRow label="Resident Name" required>
                                        <EditableField
                                            isEditing={canMutate}
                                            value={rec.directoryResidentName}
                                            onChange={(v) => patch({ directoryResidentName: v })}
                                            readValue={rec.directoryResidentName?.trim() || EMPTY_FIELD}
                                        />
                                    </ResidentFieldRow>
                                    <ResidentFieldRow label="Unit Number" required>
                                        <EditableField
                                            isEditing={canMutate}
                                            value={rec.unitNumber}
                                            onChange={(v) => patch({ unitNumber: v })}
                                            readValue={rec.unitNumber?.trim() || EMPTY_FIELD}
                                        />
                                    </ResidentFieldRow>
                                    <ResidentFieldRow label="Occupancy Type" required>
                                        <EditableSelect
                                            isEditing={canMutate}
                                            value={rec.occupancyType}
                                            onChange={(v) => patch({ occupancyType: v as CommunityOccupancyType })}
                                            options={[...COMMUNITY_OCCUPANCY_TYPE_OPTIONS]}
                                            readValue={
                                                rec.occupancyType ? (
                                                    <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-bold uppercase text-orange-900">
                                                        {rec.occupancyType}
                                                    </span>
                                                ) : (
                                                    EMPTY_FIELD
                                                )
                                            }
                                        />
                                    </ResidentFieldRow>
                                    <ResidentFieldRow label="Contact Visibility">
                                        <EditableToggleInline
                                            isEditing={canMutate}
                                            checked={rec.contactVisibility}
                                            onChange={(v) => patch({ contactVisibility: v })}
                                            readValue={
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2 py-0.5 text-xs font-bold',
                                                        rec.contactVisibility ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-800',
                                                    )}
                                                >
                                                    {rec.contactVisibility ? 'Visible' : 'Hidden'}
                                                </span>
                                            }
                                        />
                                    </ResidentFieldRow>
                                </div>
                            </ResidentCollapsibleSection>

                            <ResidentCollapsibleSection
                                title="RESIDENT TIMELINE"
                                icon={LuClock3}
                                tone="amber"
                                open={sectionsOpen.timeline}
                                onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, timeline: o }))}
                                headerRight={
                                    canMutate ? (
                                        <Button
                                            type="button"
                                            variant="companyOutline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setAddingLog(true);
                                            }}
                                        >
                                            Add log
                                        </Button>
                                    ) : null
                                }
                            >
                                <div className="space-y-3 p-3">
                                    {addingLog && canMutate ? (
                                        <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                                            <p className="text-sm font-semibold text-gray-900">New move-in / move-out log</p>
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <label className="text-xs font-semibold uppercase text-gray-500">
                                                    Date &amp; time
                                                    <input
                                                        type="datetime-local"
                                                        value={logDraft.at}
                                                        onChange={(e) => setLogDraft((d) => ({ ...d, at: e.target.value }))}
                                                        className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                                    />
                                                </label>
                                                <label className="text-xs font-semibold uppercase text-gray-500">
                                                    Type
                                                    <select
                                                        value={logDraft.kind}
                                                        onChange={(e) => setLogDraft((d) => ({ ...d, kind: e.target.value as 'move-in' | 'move-out' }))}
                                                        className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                                    >
                                                        <option value="move-in">Move-in</option>
                                                        <option value="move-out">Move-out</option>
                                                    </select>
                                                </label>
                                            </div>
                                            <textarea
                                                value={logDraft.note}
                                                onChange={(e) => setLogDraft((d) => ({ ...d, note: e.target.value }))}
                                                rows={3}
                                                placeholder="Log details…"
                                                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                            />
                                            <div className="flex gap-2">
                                                <Button type="button" variant="companyOutline" size="sm" onClick={() => setAddingLog(false)}>
                                                    Dismiss
                                                </Button>
                                                <Button type="button" variant="company" size="sm" onClick={saveTimelineLog}>
                                                    Include in save
                                                </Button>
                                            </div>
                                        </div>
                                    ) : null}
                                    <div className="space-y-3">
                                        {[...rec.timelineLogs]
                                            .sort((a, b) => (a.at < b.at ? 1 : -1))
                                            .map((log) => (
                                                <article
                                                    key={log.id}
                                                    className="relative rounded-xl border border-slate-200 bg-slate-50/40 p-4 pl-8 before:absolute before:left-3 before:top-5 before:h-2.5 before:w-2.5 before:rounded-full before:bg-[var(--cta-button-bg)]"
                                                >
                                                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                        <p className="text-sm font-semibold text-slate-900 capitalize">{log.kind.replace('-', ' ')}</p>
                                                        <time className="text-xs font-medium text-slate-500">{formatNoticeDatetime(log.at)}</time>
                                                    </div>
                                                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{log.note}</p>
                                                </article>
                                            ))}
                                        {!rec.timelineLogs.length && !addingLog ? (
                                            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-600">
                                                No timeline entries yet.
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </ResidentCollapsibleSection>

                            <ResidentCollapsibleSection
                                title="OCCUPANCY TRACKING"
                                icon={LuBuilding2}
                                tone="slate"
                                open={sectionsOpen.occupancy}
                                onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, occupancy: o }))}
                            >
                                <div className={fieldGrid}>
                                    <ResidentFieldRow label="Current Occupancy Status" required className="xl:col-span-2">
                                        <EditableSelect
                                            isEditing={canMutate}
                                            value={rec.occupancyStatus}
                                            onChange={(v) => patch({ occupancyStatus: v as CommunityOccupancyStatus })}
                                            options={[...COMMUNITY_OCCUPANCY_STATUS_OPTIONS]}
                                            readValue={
                                                rec.occupancyStatus ? (
                                                    <span className="inline-flex items-center gap-2">
                                                        <span
                                                            className={cn(
                                                                'rounded-md px-2 py-0.5 text-xs font-bold uppercase',
                                                                occupancyBadge(rec.occupancyStatus),
                                                            )}
                                                        >
                                                            {rec.occupancyStatus}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                'h-2 w-2 rounded-full',
                                                                rec.occupancyStatus === 'Occupied' ? 'bg-emerald-500' : 'bg-amber-500',
                                                            )}
                                                            aria-hidden
                                                        />
                                                    </span>
                                                ) : (
                                                    EMPTY_FIELD
                                                )
                                            }
                                        />
                                    </ResidentFieldRow>
                                </div>
                            </ResidentCollapsibleSection>

                            <ResidentCollapsibleSection
                                title="RESIDENT SEARCH"
                                icon={LuSearch}
                                tone="blue"
                                open={sectionsOpen.search}
                                onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, search: o }))}
                            >
                                <div className="space-y-3 p-3">
                                    <ResidentFieldRow label="Search Resident" className="border-0">
                                        <input
                                            type="search"
                                            value={searchQuery}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                if (canMutate) patch({ residentSearchQuery: v });
                                                else setLocalSearch(v);
                                            }}
                                            placeholder="Search by name or unit…"
                                            className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/25"
                                        />
                                    </ResidentFieldRow>
                                    {searchMatches.length > 0 ? (
                                        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                                            {searchMatches.map((r) => (
                                                <li key={r.slug} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                                                    <span className="font-medium text-gray-900">{r.fullName}</span>
                                                    <span className="text-xs text-gray-500">{r.communityRecord.unitNumber}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500">No matching residents.</p>
                                    )}
                                </div>
                            </ResidentCollapsibleSection>

                            <ResidentCollapsibleSection
                                title="RESIDENT TAGS"
                                icon={LuTags}
                                tone="amber"
                                open={sectionsOpen.tags}
                                onOpenChange={(o) => setSectionsOpen((s) => ({ ...s, tags: o }))}
                            >
                                <div className="p-3">
                                    <ResidentFieldRow label="Resident Tags" className="border-0">
                                        <EditableTagMultiSelect
                                            isEditing={canMutate}
                                            value={rec.tags}
                                            onChange={(v) => patch({ tags: v })}
                                            presets={RESIDENT_TAG_PRESETS}
                                            readValue={tagsRead(rec.tags)}
                                        />
                                    </ResidentFieldRow>
                                </div>
                            </ResidentCollapsibleSection>
                        </div>
                    </div>
                </div>
            </div>

            <div className="min-w-0 lg:col-span-1 lg:sticky lg:top-44 lg:self-start">
                <ResidentAIPanel resident={resident} disabled={canMutate} tabContext="records" />
                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <LuBuilding2 size={16} aria-hidden />
                        Occupancy snapshot
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                        Unit <span className="font-semibold text-gray-900">{rec.unitNumber}</span> is{' '}
                        <span className={cn('font-bold uppercase', occupancyBadge(rec.occupancyStatus))}>{rec.occupancyStatus}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
