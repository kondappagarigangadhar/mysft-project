'use client';

import React, { useCallback, useRef, useState } from 'react';
import type { ProjectMediaGallery } from '@/lib/projectsInventoryStore';
import { cn } from '@/lib/utils';
import { LuFileText, LuFilm, LuImage, LuUpload } from 'react-icons/lu';

const MAX_BYTES = 12 * 1024 * 1024;

function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

function isImageFile(file: File) {
    return (file.type || '').toLowerCase().startsWith('image/');
}

function isVideoFile(file: File) {
    const t = (file.type || '').toLowerCase();
    return t.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
}

function isPdfFile(file: File) {
    const t = (file.type || '').toLowerCase();
    return t === 'application/pdf' || /\.pdf$/i.test(file.name);
}

type Props = {
    media: ProjectMediaGallery;
    onMediaChange: (next: ProjectMediaGallery) => void;
};

export function ProjectMediaUploadPanel({ media, onMediaChange }: Props) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const apply = useCallback(
        (patch: Partial<ProjectMediaGallery>) => {
            onMediaChange({ ...media, ...patch });
        },
        [media, onMediaChange],
    );

    const ingestFiles = useCallback(
        async (files: File[], preferred?: 'image' | 'video' | 'pdf') => {
            if (!files.length) return;
            setError(null);
            setBusy(true);
            try {
                let gallery = [...(media.gallery_images ?? [])];
                let cover = media.cover_image ?? '';
                let banner = media.project_banner ?? '';
                let walkthrough = media.walkthrough_video ?? '';
                let floorPdf = media.floor_plan_pdf ?? '';
                let master = media.master_plan ?? '';

                for (const file of files) {
                    if (file.size > MAX_BYTES) {
                        setError(`"${file.name}" exceeds ${formatBytes(MAX_BYTES)}.`);
                        continue;
                    }

                    const asImage = preferred === 'image' || (!preferred && isImageFile(file));
                    const asVideo = preferred === 'video' || (!preferred && isVideoFile(file));
                    const asPdf = preferred === 'pdf' || (!preferred && isPdfFile(file));

                    if (asImage && isImageFile(file)) {
                        const url = await readFileAsDataUrl(file);
                        gallery = [...gallery, url];
                        if (!cover.trim()) cover = url;
                        continue;
                    }
                    if (asVideo && isVideoFile(file)) {
                        walkthrough = await readFileAsDataUrl(file);
                        continue;
                    }
                    if (asPdf && isPdfFile(file)) {
                        floorPdf = await readFileAsDataUrl(file);
                        continue;
                    }
                    setError(`"${file.name}" is not a supported image, video, or PDF.`);
                }

                apply({
                    gallery_images: gallery,
                    cover_image: cover,
                    project_banner: banner,
                    walkthrough_video: walkthrough,
                    floor_plan_pdf: floorPdf,
                    master_plan: master,
                });
            } catch {
                setError('Could not read one or more files. Please try again.');
            } finally {
                setBusy(false);
            }
        },
        [apply, media],
    );

    const onPick = async (e: React.ChangeEvent<HTMLInputElement>, kind?: 'image' | 'video' | 'pdf') => {
        const list = Array.from(e.target.files ?? []);
        await ingestFiles(list, kind);
        e.target.value = '';
    };

    const uploadTileClass =
        'flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-3 text-center transition hover:border-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_6%,white)] disabled:opacity-50';

    return (
        <div className="mb-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
                <button
                    type="button"
                    disabled={busy}
                    className={uploadTileClass}
                    onClick={() => imageInputRef.current?.click()}
                >
                    <LuImage className="h-5 w-5 text-[var(--cta-button-bg)]" aria-hidden />
                    <span className="text-xs font-semibold text-gray-800">Images</span>
                    <span className="text-[10px] text-gray-500">JPG, PNG, WebP</span>
                </button>
                <button
                    type="button"
                    disabled={busy}
                    className={uploadTileClass}
                    onClick={() => videoInputRef.current?.click()}
                >
                    <LuFilm className="h-5 w-5 text-[var(--cta-button-bg)]" aria-hidden />
                    <span className="text-xs font-semibold text-gray-800">Video</span>
                    <span className="text-[10px] text-gray-500">MP4, WebM</span>
                </button>
                <button
                    type="button"
                    disabled={busy}
                    className={uploadTileClass}
                    onClick={() => pdfInputRef.current?.click()}
                >
                    <LuFileText className="h-5 w-5 text-[var(--cta-button-bg)]" aria-hidden />
                    <span className="text-xs font-semibold text-gray-800">PDF</span>
                    <span className="text-[10px] text-gray-500">Floor plans</span>
                </button>
            </div>

            <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => void onPick(e, 'image')}
            />
            <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => void onPick(e, 'video')} />
            <input ref={pdfInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => void onPick(e, 'pdf')} />

            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    void ingestFiles(Array.from(e.dataTransfer.files ?? []));
                }}
                className={cn(
                    'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
                    isDragOver
                        ? 'border-[color-mix(in_srgb,var(--cta-button-bg)_45%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]'
                        : 'border-gray-200 bg-slate-50/60 hover:bg-slate-50',
                    busy && 'pointer-events-none opacity-70',
                )}
            >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--cta-button-bg)] ring-1 ring-gray-200">
                    <LuUpload className="h-5 w-5" aria-hidden />
                </span>
                <p className="text-sm font-semibold text-gray-800">Drop files here or use the buttons above</p>
                <p className="max-w-md text-xs text-gray-500">
                    Images are added to the gallery and shown below automatically. Video updates walkthrough; PDF updates floor plan.
                </p>
            </div>

            {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
        </div>
    );
}
