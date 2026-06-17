'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
    addProjectDocument,
    deleteProjectDocument,
    getProjectDocuments,
    type Project,
    type ProjectDocument,
    type ProjectDocumentCategory,
    type ProjectDocumentStatus,
} from '@/lib/projectsInventoryStore';
import { getDocumentLifecycleStatus } from '@/lib/projectEnterpriseHelpers';
import { LuDownload, LuEye, LuFileUp, LuHistory, LuRefreshCw, LuTrash2 } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { CTA_INPUT_FOCUS, CTA_SHADOW_SOFT } from '@/lib/theme/ctaThemeClasses';

const CATEGORIES: ProjectDocumentCategory[] = [
    'Legal Documents',
    'RERA Documents',
    'Floor Plans',
    'Brochures',
    'Agreements',
    'Approval Certificates',
    'Marketing Materials',
    'RERA',
    'Legal',
    'Brochure',
    'Price Sheets',
    'NOC',
    'Other',
];

function statusBadgeClass(status: ProjectDocumentStatus) {
    switch (status) {
        case 'Active':
            return 'bg-emerald-50 text-emerald-800 ring-emerald-200';
        case 'Expiring':
            return 'bg-amber-50 text-amber-800 ring-amber-200';
        case 'Expired':
            return 'bg-rose-50 text-rose-800 ring-rose-200';
        case 'Missing':
            return 'bg-gray-100 text-gray-600 ring-gray-200';
        default:
            return 'bg-gray-100 text-gray-600 ring-gray-200';
    }
}

type Props = { project: Project; projectSlug: string; storeVersion: number; onStoreRefresh: () => void };

export function ProjectDocumentsTab({ project, projectSlug, storeVersion, onStoreRefresh }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [category, setCategory] = useState<ProjectDocumentCategory>('RERA Documents');
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [expiryInput, setExpiryInput] = useState('');

    const docs = useMemo(() => getProjectDocuments(projectSlug), [projectSlug, storeVersion]);

    const docsWithStatus = useMemo(
        () =>
            docs.map((d) => ({
                ...d,
                lifecycle: (d.status ?? getDocumentLifecycleStatus(d)) as ProjectDocumentStatus,
            })),
        [docs],
    );

    const filteredDocs = useMemo(() => {
        if (categoryFilter === 'all') return docsWithStatus;
        return docsWithStatus.filter((d) => d.category === categoryFilter);
    }, [docsWithStatus, categoryFilter]);

    const previewDoc = previewId ? docsWithStatus.find((d) => d.id === previewId) : undefined;

    const statusCounts = useMemo(() => {
        const counts: Record<ProjectDocumentStatus, number> = { Active: 0, Expiring: 0, Expired: 0, Missing: 0 };
        for (const d of docsWithStatus) counts[d.lifecycle] += 1;
        return counts;
    }, [docsWithStatus]);

    const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const base = {
            projectSlug,
            name: f.name,
            category,
            version: 'v1',
            uploadedBy: 'You',
            sizeLabel: `${Math.ceil(f.size / 1024)} KB`,
            expiryDate: expiryInput.trim() || undefined,
            status: (expiryInput.trim() ? getDocumentLifecycleStatus({ expiryDate: expiryInput } as ProjectDocument) : 'Active') as ProjectDocumentStatus,
            versionHistory: [{ version: 'v1', uploadedAt: new Date().toISOString().slice(0, 10), uploadedBy: 'You' }],
        };
        const done = () => {
            onStoreRefresh();
            if (fileRef.current) fileRef.current.value = '';
            setExpiryInput('');
        };
        if (f.type.startsWith('text')) {
            const reader = new FileReader();
            reader.onload = () => {
                const text = typeof reader.result === 'string' ? reader.result.slice(0, 4000) : '';
                addProjectDocument({ ...base, previewText: text });
                done();
            };
            reader.readAsText(f.slice(0, 200_000));
        } else {
            addProjectDocument(base);
            done();
        }
    };

    const replaceDoc = (doc: ProjectDocument) => {
        fileRef.current?.click();
        setCategory(doc.category);
    };

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
                <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 border-b border-[#e5e7eb] pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">Document repository</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Enterprise document center — upload, version history, and expiry tracking.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {(['Active', 'Expiring', 'Expired', 'Missing'] as ProjectDocumentStatus[]).map((s) => (
                                    <span
                                        key={s}
                                        className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1', statusBadgeClass(s))}
                                    >
                                        {s}: {statusCounts[s]}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <select
                                className={cn(
                                    'h-11 rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm text-slate-800',
                                    CTA_INPUT_FOCUS,
                                )}
                                value={category}
                                onChange={(e) => setCategory(e.target.value as ProjectDocumentCategory)}
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="date"
                                value={expiryInput}
                                onChange={(e) => setExpiryInput(e.target.value)}
                                className={cn('h-11 rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm', CTA_INPUT_FOCUS)}
                                aria-label="Expiry date"
                            />
                            <input ref={fileRef} type="file" className="hidden" onChange={onPickFile} />
                            <Button
                                type="button"
                                variant="company"
                                size="cta"
                                className={cn('h-11 gap-2', CTA_SHADOW_SOFT)}
                                onClick={() => fileRef.current?.click()}
                            >
                                <LuFileUp size={18} />
                                Upload
                            </Button>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setCategoryFilter('all')}
                            className={cn(
                                'rounded-full px-3 py-1 text-xs font-semibold',
                                categoryFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600',
                            )}
                        >
                            All categories
                        </button>
                        {['Legal Documents', 'RERA Documents', 'Floor Plans', 'Brochures', 'Agreements', 'Approval Certificates', 'Marketing Materials'].map(
                            (c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCategoryFilter(c)}
                                    className={cn(
                                        'rounded-full px-3 py-1 text-xs font-semibold',
                                        categoryFilter === c ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600',
                                    )}
                                >
                                    {c}
                                </button>
                            ),
                        )}
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        {filteredDocs.length === 0 ? (
                            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e7eb] bg-slate-50/50 py-12 text-center">
                                <p className="text-sm font-medium text-slate-600">No documents yet for {project.project_name}.</p>
                                <p className="mt-1 text-xs text-slate-400">Upload RERA, legal, floor plans, or marketing materials.</p>
                            </div>
                        ) : (
                            <table className="w-full min-w-[720px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[#e5e7eb] text-xs font-bold uppercase tracking-wider text-slate-400">
                                        <th className="py-3 pr-4">Name</th>
                                        <th className="py-3 pr-4">Category</th>
                                        <th className="py-3 pr-4">Status</th>
                                        <th className="py-3 pr-4">Version</th>
                                        <th className="py-3 pr-4">Expiry</th>
                                        <th className="py-3 pr-4">Uploaded</th>
                                        <th className="py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDocs.map((d) => (
                                        <tr key={d.id} className="border-b border-slate-100 last:border-0">
                                            <td className="py-3 pr-4 font-semibold text-slate-900">{d.name}</td>
                                            <td className="py-3 pr-4 text-slate-600">{d.category}</td>
                                            <td className="py-3 pr-4">
                                                <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold ring-1', statusBadgeClass(d.lifecycle))}>
                                                    {d.lifecycle}
                                                </span>
                                            </td>
                                            <td className="py-3 pr-4 font-mono text-xs text-slate-600">{d.version}</td>
                                            <td className="py-3 pr-4 tabular-nums text-slate-500">{d.expiryDate ?? '—'}</td>
                                            <td className="py-3 pr-4 tabular-nums text-slate-500">{d.uploadedAt}</td>
                                            <td className="py-3">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="companyGhost"
                                                        size="sm"
                                                        className="h-9 px-2"
                                                        title="Preview"
                                                        onClick={() => setPreviewId(previewId === d.id ? null : d.id)}
                                                    >
                                                        <LuEye size={16} />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="companyGhost"
                                                        size="sm"
                                                        className="h-9 px-2"
                                                        title="Download"
                                                        onClick={() => {
                                                            const blob = new Blob([d.previewText ?? `Document: ${d.name}`], {
                                                                type: 'text/plain',
                                                            });
                                                            const url = URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = d.name;
                                                            a.click();
                                                            URL.revokeObjectURL(url);
                                                        }}
                                                    >
                                                        <LuDownload size={16} />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="companyGhost"
                                                        size="sm"
                                                        className="h-9 px-2"
                                                        title="Replace"
                                                        onClick={() => replaceDoc(d)}
                                                    >
                                                        <LuRefreshCw size={16} />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="companyGhost"
                                                        size="sm"
                                                        className="h-9 px-2 text-rose-600 hover:bg-rose-50"
                                                        title="Delete"
                                                        onClick={() => {
                                                            if (!window.confirm(`Remove ${d.name}?`)) return;
                                                            deleteProjectDocument(projectSlug, d.id);
                                                            onStoreRefresh();
                                                            if (previewId === d.id) setPreviewId(null);
                                                        }}
                                                    >
                                                        <LuTrash2 size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            </div>

            <aside className="lg:col-span-1">
                <div className={cn('rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm lg:sticky lg:top-44')}>
                    <h3 className="text-sm font-semibold text-slate-900">Preview</h3>
                    {previewDoc ? (
                        <div className="mt-3 space-y-3">
                            <div className="max-h-[320px] overflow-auto rounded-lg border border-[#e5e7eb] bg-slate-50 p-3 text-xs text-slate-700">
                                <p className="font-semibold text-slate-900">{previewDoc.name}</p>
                                <p className="mt-2 whitespace-pre-wrap">{previewDoc.previewText ?? 'Binary or non-text file — use download.'}</p>
                            </div>
                            {(previewDoc.versionHistory?.length ?? 0) > 0 ? (
                                <div>
                                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                                        <LuHistory size={14} aria-hidden />
                                        Version history
                                    </p>
                                    <ul className="mt-2 space-y-1 text-xs text-slate-600">
                                        {previewDoc.versionHistory!.map((v, i) => (
                                            <li key={i} className="rounded bg-slate-50 px-2 py-1">
                                                {v.version} · {v.uploadedBy} · {v.uploadedAt}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <p className="mt-3 text-sm text-slate-500">Select preview on a row to read text extracts and version history.</p>
                    )}
                </div>
            </aside>
        </div>
    );
}
