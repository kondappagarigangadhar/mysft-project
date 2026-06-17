'use client';

import React from 'react';
import {
    EditableDate,
    EditableField,
    EditableSelect,
    EditableTextarea,
} from '@/components/leads/detail/InlineEditableSection';
import {
    PROJECT_AMENITY_LABELS,
    enrichProjectWithDefaults,
    isImageMediaUrl,
    isPdfMediaRef,
    isVideoMediaUrl,
    type ProjectAmenityKey,
} from '@/lib/projectEnterpriseHelpers';
import { ProjectMediaUploadPanel } from './ProjectMediaUploadPanel';
import type { ProjectMediaGallery } from '@/lib/projectsInventoryStore';
import type { Project } from '@/lib/projectsInventoryStore';
import { cn } from '@/lib/utils';
import {
    LuBuilding2,
    LuCamera,
    LuFileText,
    LuHammer,
    LuSettings2,
    LuShieldCheck,
    LuSparkles,
    LuTrash2,
    LuTrendingUp,
    LuTriangleAlert,
    LuWaves,
} from 'react-icons/lu';
import {
    ProjectRecordCollapsibleSection,
    ProjectRecordFieldRow,
    ToggleSwitch,
    YesNoBadge,
} from './ProjectRecordCollapsibleSection';

const EMPTY = '—';

function mediaLinkLabel(url: string) {
    const u = url.trim();
    if (u.startsWith('data:')) return 'Uploaded file';
    if (u.length > 64) return `${u.slice(0, 48)}…`;
    return u;
}

function projectHasMedia(media: ProjectMediaGallery) {
    return Boolean(
        media.cover_image?.trim() ||
            media.project_banner?.trim() ||
            (media.gallery_images?.length ?? 0) > 0 ||
            media.walkthrough_video?.trim() ||
            media.floor_plan_pdf?.trim() ||
            media.master_plan?.trim(),
    );
}

function removeGalleryImageAt(media: ProjectMediaGallery, index: number): ProjectMediaGallery {
    const gallery = [...(media.gallery_images ?? [])];
    const removed = gallery[index];
    gallery.splice(index, 1);
    let cover = media.cover_image ?? '';
    let banner = media.project_banner ?? '';
    if (removed && cover === removed) cover = gallery[0] ?? '';
    if (removed && banner === removed) banner = gallery[1] ?? gallery[0] ?? '';
    return { ...media, gallery_images: gallery, cover_image: cover, project_banner: banner };
}

function MediaSectionHeader({ label, onDelete }: { label: string; onDelete?: () => void }) {
    return (
        <div className="mb-1.5 flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
            {onDelete ? (
                <button
                    type="button"
                    onClick={onDelete}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                    <LuTrash2 className="h-3 w-3" aria-hidden />
                    Delete
                </button>
            ) : null}
        </div>
    );
}

function MediaGalleryDisplay({
    media,
    isInlineEditing = false,
    onMediaChange,
}: {
    media: ProjectMediaGallery;
    isInlineEditing?: boolean;
    onMediaChange?: (next: ProjectMediaGallery) => void;
}) {
    const [lightbox, setLightbox] = React.useState<string | null>(null);
    const gallery = media.gallery_images ?? [];
    const canDelete = isInlineEditing && Boolean(onMediaChange);
    const patch = (next: ProjectMediaGallery) => onMediaChange?.(next);

    const thumb = (src: string, alt: string, className?: string, onDelete?: () => void) => {
        const imageBody = isImageMediaUrl(src) ? (
            <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={alt} className="h-full w-full object-cover transition group-hover:scale-[1.02]" loading="lazy" />
                <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" aria-hidden />
            </>
        ) : (
            <span className="flex h-full min-h-[80px] items-center justify-center px-2 text-xs text-gray-500">{mediaLinkLabel(src)}</span>
        );

        const inner = isImageMediaUrl(src) ? (
            <button type="button" onClick={() => setLightbox(src)} className="group relative block h-full w-full overflow-hidden">
                {imageBody}
            </button>
        ) : (
            <div className="relative h-full w-full overflow-hidden">{imageBody}</div>
        );

        return (
            <div className={cn('relative overflow-hidden rounded-lg ring-1 ring-gray-200/80', className)}>
                {inner}
                {onDelete ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="absolute right-1.5 top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700"
                        aria-label={`Delete ${alt}`}
                    >
                        <LuTrash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                ) : null}
            </div>
        );
    };

    if (!projectHasMedia(media)) {
        return (
            <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center text-sm text-gray-500">
                {isInlineEditing
                    ? 'No media yet. Upload images, video, or a PDF using the options above.'
                    : 'No media has been added to this project yet.'}
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {media.cover_image?.trim() || media.project_banner?.trim() ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {media.cover_image?.trim() ? (
                        <div className="sm:col-span-1">
                            <MediaSectionHeader
                                label="Cover"
                                onDelete={canDelete ? () => patch({ ...media, cover_image: '' }) : undefined}
                            />
                            {thumb(
                                media.cover_image,
                                'Project cover',
                                'aspect-[4/3]',
                                canDelete ? () => patch({ ...media, cover_image: '' }) : undefined,
                            )}
                        </div>
                    ) : null}
                    {media.project_banner?.trim() ? (
                        <div className={media.cover_image?.trim() ? 'sm:col-span-2' : 'sm:col-span-3'}>
                            <MediaSectionHeader
                                label="Banner"
                                onDelete={canDelete ? () => patch({ ...media, project_banner: '' }) : undefined}
                            />
                            {thumb(
                                media.project_banner,
                                'Project banner',
                                'aspect-[21/9] min-h-[120px]',
                                canDelete ? () => patch({ ...media, project_banner: '' }) : undefined,
                            )}
                        </div>
                    ) : null}
                </div>
            ) : null}

            {gallery.length > 0 ? (
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Gallery ({gallery.length} images)</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {gallery.map((src, i) => (
                            <div key={`${src.slice(0, 32)}-${i}`}>
                                {thumb(
                                    src,
                                    `Gallery image ${i + 1}`,
                                    'aspect-video',
                                    canDelete ? () => patch(removeGalleryImageAt(media, i)) : undefined,
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {media.master_plan?.trim() || media.walkthrough_video?.trim() || media.floor_plan_pdf?.trim() ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {media.master_plan?.trim() && isImageMediaUrl(media.master_plan) ? (
                        <div>
                            <MediaSectionHeader
                                label="Master plan"
                                onDelete={canDelete ? () => patch({ ...media, master_plan: '' }) : undefined}
                            />
                            {thumb(
                                media.master_plan,
                                'Master plan',
                                'aspect-video',
                                canDelete ? () => patch({ ...media, master_plan: '' }) : undefined,
                            )}
                        </div>
                    ) : null}
                    {media.walkthrough_video?.trim() ? (
                        <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 sm:col-span-2">
                            <MediaSectionHeader
                                label="Walkthrough"
                                onDelete={canDelete ? () => patch({ ...media, walkthrough_video: '' }) : undefined}
                            />
                            {isVideoMediaUrl(media.walkthrough_video) &&
                            (media.walkthrough_video.startsWith('data:') ||
                                media.walkthrough_video.startsWith('blob:') ||
                                media.walkthrough_video.includes('.mp4') ||
                                media.walkthrough_video.includes('.webm')) ? (
                                <video
                                    src={media.walkthrough_video}
                                    controls
                                    className="max-h-48 w-full rounded-lg bg-black/5"
                                    preload="metadata"
                                />
                            ) : (
                                <a
                                    href={media.walkthrough_video}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block truncate text-sm font-medium text-[var(--cta-button-bg)] hover:underline"
                                >
                                    {mediaLinkLabel(media.walkthrough_video)}
                                </a>
                            )}
                        </div>
                    ) : null}
                    {media.floor_plan_pdf?.trim() ? (
                        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3">
                            <MediaSectionHeader
                                label="Floor plan PDF"
                                onDelete={canDelete ? () => patch({ ...media, floor_plan_pdf: '' }) : undefined}
                            />
                            {isPdfMediaRef(media.floor_plan_pdf) ? (
                                <a
                                    href={media.floor_plan_pdf}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[var(--cta-button-bg)] ring-1 ring-gray-200 hover:bg-gray-50"
                                >
                                    <LuFileText className="h-4 w-4 shrink-0" aria-hidden />
                                    Open PDF
                                </a>
                            ) : (
                                <p className="text-sm font-medium text-gray-800">{mediaLinkLabel(media.floor_plan_pdf)}</p>
                            )}
                        </div>
                    ) : null}
                </div>
            ) : null}

            {lightbox ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Image preview"
                    onClick={() => setLightbox(null)}
                    onKeyDown={(e) => e.key === 'Escape' && setLightbox(null)}
                >
                    <button
                        type="button"
                        className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-gray-900"
                        onClick={() => setLightbox(null)}
                    >
                        Close
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={lightbox}
                        alt="Preview"
                        className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            ) : null}
        </div>
    );
}

export type ProjectEnterpriseDraft = {
    project_category: string;
    development_type: string;
    property_type: string;
    project_phase: string;
    construction_type: string;
    rera_applicable: string;
    launch_status: string;
    possession_status: string;
    project_priority: string;
    rera_number: string;
    approval_authority: string;
    approval_number: string;
    legal_status: string;
    registration_status: string;
    land_ownership_type: string;
    legal_documents_note: string;
    approval_expiry_date: string;
    amenities_json: string;
    construction_json: string;
    media_json: string;
};

export function buildProjectEnterpriseDraft(p: Project): ProjectEnterpriseDraft {
    const e = enrichProjectWithDefaults(p);
    return {
        project_category: e.project_category ?? '',
        development_type: e.development_type ?? '',
        property_type: e.property_type ?? '',
        project_phase: e.project_phase ?? '',
        construction_type: e.construction_type ?? '',
        rera_applicable: e.rera_applicable ? 'Yes' : 'No',
        launch_status: e.launch_status ?? '',
        possession_status: e.possession_status ?? '',
        project_priority: e.project_priority ?? '',
        rera_number: e.rera_number ?? '',
        approval_authority: e.approval_authority ?? '',
        approval_number: e.approval_number ?? '',
        legal_status: e.legal_status ?? '',
        registration_status: e.registration_status ?? '',
        land_ownership_type: e.land_ownership_type ?? '',
        legal_documents_note: e.legal_documents_note ?? '',
        approval_expiry_date: e.approval_expiry_date ?? '',
        amenities_json: JSON.stringify(e.amenities ?? {}),
        construction_json: JSON.stringify(e.construction_status ?? {}),
        media_json: JSON.stringify(e.media_gallery ?? {}),
    };
}

export function projectEnterpriseDraftToPatch(draft: ProjectEnterpriseDraft): Partial<Project> {
    const parseJson = <T,>(raw: string, fallback: T): T => {
        try {
            return JSON.parse(raw) as T;
        } catch {
            return fallback;
        }
    };
    return {
        project_category: draft.project_category.trim() || undefined,
        development_type: draft.development_type.trim() || undefined,
        property_type: draft.property_type.trim() || undefined,
        project_phase: draft.project_phase.trim() || undefined,
        construction_type: draft.construction_type.trim() || undefined,
        rera_applicable: draft.rera_applicable === 'Yes',
        launch_status: draft.launch_status.trim() || undefined,
        possession_status: draft.possession_status.trim() || undefined,
        project_priority: draft.project_priority.trim() || undefined,
        rera_number: draft.rera_number.trim() || undefined,
        approval_authority: draft.approval_authority.trim() || undefined,
        approval_number: draft.approval_number.trim() || undefined,
        legal_status: draft.legal_status.trim() || undefined,
        registration_status: draft.registration_status.trim() || undefined,
        land_ownership_type: draft.land_ownership_type.trim() || undefined,
        legal_documents_note: draft.legal_documents_note.trim() || undefined,
        approval_expiry_date: draft.approval_expiry_date.trim() || undefined,
        amenities: parseJson(draft.amenities_json, {}),
        construction_status: parseJson(draft.construction_json, {}),
        media_gallery: parseJson(draft.media_json, {}),
    };
}

type SectionOpen = {
    config: boolean;
    rera: boolean;
    amenities: boolean;
    construction: boolean;
    media: boolean;
};

type Props = {
    project: Project;
    isInlineEditing: boolean;
    draft: ProjectEnterpriseDraft;
    onDraftChange: <K extends keyof ProjectEnterpriseDraft>(key: K, value: ProjectEnterpriseDraft[K]) => void;
    changedByKey: Partial<Record<keyof ProjectEnterpriseDraft, boolean>>;
    sectionsOpen: SectionOpen;
    onSectionsOpenChange: (next: SectionOpen) => void;
};

function parseAmenities(raw: string) {
    try {
        return JSON.parse(raw) as Record<ProjectAmenityKey, boolean>;
    } catch {
        return {} as Record<ProjectAmenityKey, boolean>;
    }
}

function parseConstruction(raw: string) {
    try {
        return JSON.parse(raw) as {
            excavation_pct?: number;
            structure_pct?: number;
            plumbing_pct?: number;
            electrical_pct?: number;
            finishing_pct?: number;
            completion_pct?: number;
            last_site_update?: string;
        };
    } catch {
        return {};
    }
}

type ConstructionStatusFields = {
    excavation_pct?: number;
    structure_pct?: number;
    plumbing_pct?: number;
    electrical_pct?: number;
    finishing_pct?: number;
    completion_pct?: number;
    last_site_update?: string;
};

type ConstructionPctKey = Exclude<keyof ConstructionStatusFields, 'last_site_update'>;

const CONSTRUCTION_PHASES: { key: Exclude<ConstructionPctKey, 'completion_pct'>; label: string }[] = [
    { key: 'excavation_pct', label: 'Excavation' },
    { key: 'structure_pct', label: 'Structure' },
    { key: 'plumbing_pct', label: 'Plumbing' },
    { key: 'electrical_pct', label: 'Electrical' },
    { key: 'finishing_pct', label: 'Finishing' },
];

function clampPct(value: number) {
    return Math.max(0, Math.min(100, Math.round(value)));
}

function ConstructionProgressTrack({ value, className }: { value: number; className?: string }) {
    const pct = clampPct(value);
    return (
        <div className={cn('h-1.5 overflow-hidden rounded-full bg-gray-200/90', className)}>
            <div
                className="h-full rounded-full bg-[var(--cta-button-bg)] transition-[width] duration-200"
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

function ConstructionStatusPanel({
    construction,
    isInlineEditing,
    onFieldChange,
}: {
    construction: ConstructionStatusFields;
    isInlineEditing: boolean;
    onFieldChange: (key: string, value: string | number) => void;
}) {
    const completion = clampPct(construction.completion_pct ?? 0);

    return (
        <div className="space-y-4 p-4">
            <div className="rounded-xl border border-gray-200/80 bg-gradient-to-br from-slate-50 to-white px-4 py-3.5">
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Overall completion</p>
                        {isInlineEditing ? (
                            <p className="mt-0.5 text-[11px] text-gray-500">Drag to update project progress</p>
                        ) : null}
                    </div>
                    <span className="text-2xl font-bold tabular-nums text-[var(--cta-button-bg)]">{completion}%</span>
                </div>
                <ConstructionProgressTrack value={completion} className="mt-3 h-2" />
                {isInlineEditing ? (
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={completion}
                        onChange={(e) => onFieldChange('completion_pct', Number(e.target.value))}
                        className="mt-3 h-1.5 w-full cursor-pointer accent-[var(--cta-button-bg)]"
                        aria-label="Overall completion"
                    />
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CONSTRUCTION_PHASES.map(({ key, label }) => {
                    const val = clampPct(construction[key] ?? 0);
                    return (
                        <div
                            key={key}
                            className={cn(
                                'rounded-lg border border-gray-100 bg-white px-3 py-2.5',
                                isInlineEditing && 'ring-1 ring-gray-100',
                            )}
                        >
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                                <span className="text-sm font-medium text-gray-800">{label}</span>
                                <span className="text-sm font-bold tabular-nums text-gray-900">{val}%</span>
                            </div>
                            <ConstructionProgressTrack value={val} />
                            {isInlineEditing ? (
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={val}
                                    onChange={(e) => onFieldChange(key, Number(e.target.value))}
                                    className="mt-2 h-1 w-full cursor-pointer accent-[var(--cta-button-bg)]"
                                    aria-label={label}
                                />
                            ) : null}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Last site update</span>
                {isInlineEditing ? (
                    <EditableDate
                        isEditing
                        value={construction.last_site_update ?? ''}
                        onChange={(v) => onFieldChange('last_site_update', v)}
                        readValue={construction.last_site_update ?? EMPTY}
                    />
                ) : (
                    <span className="text-sm font-medium text-gray-800">{construction.last_site_update?.trim() || EMPTY}</span>
                )}
            </div>
        </div>
    );
}

function parseMedia(raw: string) {
    try {
        return JSON.parse(raw) as {
            cover_image?: string;
            project_banner?: string;
            gallery_images?: string[];
            walkthrough_video?: string;
            master_plan?: string;
            floor_plan_pdf?: string;
        };
    } catch {
        return {};
    }
}

export function ProjectOverviewEnterpriseSections({
    project,
    isInlineEditing,
    draft,
    onDraftChange,
    changedByKey,
    sectionsOpen,
    onSectionsOpenChange,
}: Props) {
    const enriched = enrichProjectWithDefaults(project);
    const amenities = isInlineEditing ? parseAmenities(draft.amenities_json) : (enriched.amenities ?? {});
    const construction = isInlineEditing ? parseConstruction(draft.construction_json) : (enriched.construction_status ?? {});
    const media = isInlineEditing ? parseMedia(draft.media_json) : (enriched.media_gallery ?? {});

    const setAmenity = (key: ProjectAmenityKey, value: boolean) => {
        const next = { ...amenities, [key]: value };
        onDraftChange('amenities_json', JSON.stringify(next));
    };

    const setConstructionField = (key: string, value: string | number) => {
        const next = { ...construction, [key]: value };
        onDraftChange('construction_json', JSON.stringify(next));
    };

    const expirySoon =
        enriched.approval_expiry_date &&
        new Date(enriched.approval_expiry_date).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 60;

    return (
        <div className="mt-4 space-y-4">
            <ProjectRecordCollapsibleSection
                title="PROJECT CONFIGURATION"
                icon={LuSettings2}
                tone="blue"
                open={sectionsOpen.config}
                onOpenChange={(o) => onSectionsOpenChange({ ...sectionsOpen, config: o })}
            >
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <ProjectRecordFieldRow label="Project category">
                        <EditableSelect
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.project_category)}
                            value={draft.project_category}
                            onChange={(v) => onDraftChange('project_category', v)}
                            options={['Residential', 'Commercial', 'Mixed Use']}
                            readValue={enriched.project_category ?? EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Development type">
                        <EditableSelect
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.development_type)}
                            value={draft.development_type}
                            onChange={(v) => onDraftChange('development_type', v)}
                            options={['Apartment', 'Villa', 'Plotting']}
                            readValue={enriched.development_type ?? EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Property type">
                        <EditableField
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.property_type)}
                            value={draft.property_type}
                            onChange={(v) => onDraftChange('property_type', v)}
                            readValue={enriched.property_type ?? EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Project phase">
                        <EditableField
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.project_phase)}
                            value={draft.project_phase}
                            onChange={(v) => onDraftChange('project_phase', v)}
                            readValue={enriched.project_phase ?? EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Construction type">
                        <EditableField
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.construction_type)}
                            value={draft.construction_type}
                            onChange={(v) => onDraftChange('construction_type', v)}
                            readValue={enriched.construction_type ?? EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="RERA applicable">
                        <EditableSelect
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.rera_applicable)}
                            value={draft.rera_applicable}
                            onChange={(v) => onDraftChange('rera_applicable', v)}
                            options={['Yes', 'No']}
                            readValue={<YesNoBadge value={Boolean(enriched.rera_applicable)} />}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Launch status">
                        <EditableField
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.launch_status)}
                            value={draft.launch_status}
                            onChange={(v) => onDraftChange('launch_status', v)}
                            readValue={enriched.launch_status ?? EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Possession status">
                        <EditableField
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.possession_status)}
                            value={draft.possession_status}
                            onChange={(v) => onDraftChange('possession_status', v)}
                            readValue={enriched.possession_status ?? EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Project priority">
                        <EditableSelect
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.project_priority)}
                            value={draft.project_priority}
                            onChange={(v) => onDraftChange('project_priority', v)}
                            options={['Low', 'Medium', 'High', 'Critical']}
                            readValue={enriched.project_priority ?? EMPTY}
                        />
                    </ProjectRecordFieldRow>
                </div>
            </ProjectRecordCollapsibleSection>

            <ProjectRecordCollapsibleSection
                title="RERA & LEGAL"
                icon={LuShieldCheck}
                tone="slate"
                open={sectionsOpen.rera}
                onOpenChange={(o) => onSectionsOpenChange({ ...sectionsOpen, rera: o })}
                headerRight={
                    expirySoon ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
                            Expiring
                        </span>
                    ) : enriched.approval_status === 'approved' ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200">
                            Approved
                        </span>
                    ) : null
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <ProjectRecordFieldRow label="RERA number">
                        <EditableField
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.rera_number)}
                            value={draft.rera_number}
                            onChange={(v) => onDraftChange('rera_number', v)}
                            readValue={enriched.rera_number?.trim() ? enriched.rera_number : EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Approval authority">
                        <EditableField
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.approval_authority)}
                            value={draft.approval_authority}
                            onChange={(v) => onDraftChange('approval_authority', v)}
                            readValue={enriched.approval_authority ?? EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Approval number">
                        <EditableField
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.approval_number)}
                            value={draft.approval_number}
                            onChange={(v) => onDraftChange('approval_number', v)}
                            readValue={enriched.approval_number?.trim() ? enriched.approval_number : EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Legal status">
                        <EditableField
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.legal_status)}
                            value={draft.legal_status}
                            onChange={(v) => onDraftChange('legal_status', v)}
                            readValue={enriched.legal_status ?? EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Registration status">
                        <EditableField
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.registration_status)}
                            value={draft.registration_status}
                            onChange={(v) => onDraftChange('registration_status', v)}
                            readValue={enriched.registration_status ?? EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Land ownership">
                        <EditableField
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.land_ownership_type)}
                            value={draft.land_ownership_type}
                            onChange={(v) => onDraftChange('land_ownership_type', v)}
                            readValue={enriched.land_ownership_type ?? EMPTY}
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Approval expiry" className="md:col-span-2">
                        <EditableDate
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.approval_expiry_date)}
                            value={draft.approval_expiry_date}
                            onChange={(v) => onDraftChange('approval_expiry_date', v)}
                            readValue={
                                enriched.approval_expiry_date ? (
                                    <span className={cn(expirySoon && 'font-semibold text-amber-800')}>{enriched.approval_expiry_date}</span>
                                ) : (
                                    EMPTY
                                )
                            }
                        />
                    </ProjectRecordFieldRow>
                    <ProjectRecordFieldRow label="Legal documents" className="md:col-span-2">
                        <EditableTextarea
                            isEditing={isInlineEditing}
                            isChanged={Boolean(changedByKey.legal_documents_note)}
                            value={draft.legal_documents_note}
                            onChange={(v) => onDraftChange('legal_documents_note', v)}
                            rows={2}
                            readValue={enriched.legal_documents_note?.trim() ? enriched.legal_documents_note : 'Upload via Documents tab'}
                        />
                    </ProjectRecordFieldRow>
                </div>
            </ProjectRecordCollapsibleSection>

            <ProjectRecordCollapsibleSection
                title="PROJECT AMENITIES"
                icon={LuWaves}
                tone="amber"
                open={sectionsOpen.amenities}
                onOpenChange={(o) => onSectionsOpenChange({ ...sectionsOpen, amenities: o })}
            >
                <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 md:grid-cols-4">
                    {(Object.keys(PROJECT_AMENITY_LABELS) as ProjectAmenityKey[]).map((key) => {
                        const active = Boolean(amenities[key]);
                        return (
                            <div
                                key={key}
                                className={cn(
                                    'flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center transition',
                                    active ? 'border-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]' : 'border-gray-200 bg-gray-50/50',
                                )}
                            >
                                <span className="text-xs font-semibold text-gray-700">{PROJECT_AMENITY_LABELS[key]}</span>
                                {isInlineEditing ? (
                                    <ToggleSwitch checked={active} onChange={(v) => setAmenity(key, v)} label={PROJECT_AMENITY_LABELS[key]} />
                                ) : (
                                    <YesNoBadge value={active} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </ProjectRecordCollapsibleSection>

            <ProjectRecordCollapsibleSection
                title="CONSTRUCTION STATUS"
                icon={LuHammer}
                tone="slate"
                open={sectionsOpen.construction}
                onOpenChange={(o) => onSectionsOpenChange({ ...sectionsOpen, construction: o })}
            >
                <ConstructionStatusPanel
                    construction={construction}
                    isInlineEditing={isInlineEditing}
                    onFieldChange={setConstructionField}
                />
            </ProjectRecordCollapsibleSection>

            <ProjectRecordCollapsibleSection
                title="MEDIA & GALLERY"
                icon={LuCamera}
                tone="amber"
                open={sectionsOpen.media}
                onOpenChange={(o) => onSectionsOpenChange({ ...sectionsOpen, media: o })}
            >
                <div className="p-4">
                    {isInlineEditing ? (
                        <ProjectMediaUploadPanel
                            media={media}
                            onMediaChange={(next) => onDraftChange('media_json', JSON.stringify(next))}
                        />
                    ) : null}
                    <div className={cn(isInlineEditing && 'mt-4 border-t border-gray-100 pt-4')}>
                        {!isInlineEditing ? (
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Project media</p>
                        ) : null}
                        <MediaGalleryDisplay
                            media={media}
                            isInlineEditing={isInlineEditing}
                            onMediaChange={
                                isInlineEditing
                                    ? (next) => onDraftChange('media_json', JSON.stringify(next))
                                    : undefined
                            }
                        />
                    </div>
                </div>
            </ProjectRecordCollapsibleSection>
        </div>
    );
}

export function ProjectOverviewRightRailEnhancements({
    project,
    demandScore,
    leadDemand,
}: {
    project: Project;
    demandScore: number;
    leadDemand: number;
}) {
    const enriched = enrichProjectWithDefaults(project);
    const construction = enriched.construction_status ?? {};
    const completion = construction.completion_pct ?? 0;
    const delayed = completion < 50 && enriched.possession_status === 'Under Construction';

    return (
        <div className="mt-4 space-y-3">
            {enriched.approval_expiry_date && new Date(enriched.approval_expiry_date).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 60 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-xs text-amber-900">
                    <p className="flex items-center gap-1.5 font-semibold">
                        <LuTriangleAlert size={14} aria-hidden />
                        Expiring approval
                    </p>
                    <p className="mt-1 text-amber-800">RERA / approval expires {enriched.approval_expiry_date}</p>
                </div>
            ) : null}
            {!enriched.rera_number?.trim() ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2.5 text-xs text-rose-900">
                    <p className="flex items-center gap-1.5 font-semibold">
                        <LuFileText size={14} aria-hidden />
                        Missing documents
                    </p>
                    <p className="mt-1">RERA number not configured — add in RERA & Legal section.</p>
                </div>
            ) : null}
            {delayed ? (
                <div className="rounded-lg border border-orange-200 bg-orange-50/70 px-3 py-2.5 text-xs text-orange-900">
                    <p className="flex items-center gap-1.5 font-semibold">
                        <LuBuilding2 size={14} aria-hidden />
                        Construction delay alert
                    </p>
                    <p className="mt-1">Completion at {completion}% — review site timeline.</p>
                </div>
            ) : null}
            <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 px-3 py-2.5 text-xs text-emerald-900">
                <p className="flex items-center gap-1.5 font-semibold">
                    <LuTrendingUp size={14} aria-hidden />
                    Demand trend
                </p>
                <p className="mt-1">
                    Score {demandScore}% · {leadDemand} CRM leads · trending {demandScore >= 50 ? 'up' : 'stable'}
                </p>
            </div>
            {(enriched.sales_insights?.unsold_inventory ?? 0) > (enriched.total_units ?? 0) * 0.6 ? (
                <div className="rounded-lg border border-violet-200 bg-violet-50/60 px-3 py-2.5 text-xs text-violet-900">
                    <p className="flex items-center gap-1.5 font-semibold">
                        <LuSparkles size={14} aria-hidden />
                        Inventory risk
                    </p>
                    <p className="mt-1">High unsold ratio — consider pricing review on Pricing tab.</p>
                </div>
            ) : null}
        </div>
    );
}

export const DEFAULT_ENTERPRISE_SECTIONS_OPEN = {
    config: true,
    rera: true,
    amenities: true,
    construction: true,
    media: true,
};
