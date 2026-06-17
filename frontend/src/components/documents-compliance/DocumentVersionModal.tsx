'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useComplianceStoreBump } from '@/hooks/useComplianceStoreBump';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { CTA_FOCUS_VISIBLE_RING } from '@/lib/theme/ctaThemeClasses';
import {
    getCurrentVersion,
    getDocumentById,
    restoreOldVersion,
    uploadNewVersion,
    type ComplianceDocumentRecord,
    type DocumentVersionRow,
} from '@/lib/complianceDocumentsMockStore';
import type { ComplianceDemoRole } from '@/lib/complianceRbac';
import { formatShortDate } from '@/lib/formatDate';
import { LuHistory, LuUpload, LuX } from 'react-icons/lu';

const MAX_BYTES = 100 * 1024 * 1024;
const ACCEPT = 'application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png';

export function DocumentVersionModal({
    open,
    documentId,
    onClose,
    uploadedBy,
    userRole,
}: {
    open: boolean;
    documentId: string | null;
    onClose: () => void;
    uploadedBy: string;
    userRole: ComplianceDemoRole;
}) {
    const bump = useComplianceStoreBump();
    const fileRef = useRef<HTMLInputElement>(null);
    const [tab, setTab] = useState<'history' | 'upload'>('history');
    const [file, setFile] = useState<File | null>(null);
    const [err, setErr] = useState('');

    const doc = useMemo(() => (documentId ? getDocumentById(documentId) : undefined), [documentId, open, bump]);

    const versions = useMemo(() => {
        if (!doc) return [] as DocumentVersionRow[];
        return [...doc.versions].sort((a, b) => b.version - a.version);
    }, [doc, bump]);

    if (!open || !documentId) return null;
    if (!doc) return null;

    const current = getCurrentVersion(doc);

    const onUploadVersion = () => {
        setErr('');
        if (!file) {
            setErr('Select a file.');
            return;
        }
        if (file.size > MAX_BYTES) {
            setErr('Max 100MB.');
            return;
        }
        const n = file.name.toLowerCase();
        if (!n.endsWith('.pdf') && !n.endsWith('.jpg') && !n.endsWith('.jpeg') && !n.endsWith('.png')) {
            setErr('PDF, JPG, or PNG only.');
            return;
        }
        uploadNewVersion(doc.id, { name: file.name, type: file.type, size: file.size }, uploadedBy, userRole);
        setFile(null);
        if (fileRef.current) fileRef.current.value = '';
        onClose();
    };

    const onRestore = (v: number) => {
        restoreOldVersion(doc.id, v, uploadedBy, userRole);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
            <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Version control</h2>
                        <p className="text-xs text-slate-500">{doc.name}</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                        <LuX className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex gap-2 border-b border-slate-100 px-6 pt-2">
                    <button
                        type="button"
                        className={cn(
                            'border-b-2 px-2 pb-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                            CTA_FOCUS_VISIBLE_RING,
                            tab === 'history'
                                ? 'border-[var(--cta-button-bg)] text-[var(--cta-button-bg)]'
                                : 'border-transparent text-slate-500',
                        )}
                        onClick={() => setTab('history')}
                    >
                        <span className="inline-flex items-center gap-1.5">
                            <LuHistory className="h-4 w-4" /> History
                        </span>
                    </button>
                    <button
                        type="button"
                        className={cn(
                            'border-b-2 px-2 pb-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                            CTA_FOCUS_VISIBLE_RING,
                            tab === 'upload'
                                ? 'border-[var(--cta-button-bg)] text-[var(--cta-button-bg)]'
                                : 'border-transparent text-slate-500',
                        )}
                        onClick={() => setTab('upload')}
                    >
                        <span className="inline-flex items-center gap-1.5">
                            <LuUpload className="h-4 w-4" /> New version
                        </span>
                    </button>
                </div>

                {tab === 'history' ? (
                    <div className="max-h-[min(50vh,360px)] space-y-3 overflow-y-auto px-6 py-4">
                        {versions.map((v) => (
                            <div
                                key={v.version}
                                className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-semibold text-slate-900">v{v.version}</span>
                                    {current && v.version === current.version ? (
                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                                            Current
                                        </span>
                                    ) : null}
                                </div>
                                <p className="mt-1 text-xs text-slate-600">{v.fileName}</p>
                                <p className="text-[11px] text-slate-500">
                                    {v.uploadedBy} · {formatShortDate(v.uploadedAt.slice(0, 10))}
                                </p>
                                {current && v.version !== current.version ? (
                                    <Button
                                        type="button"
                                        variant="companyOutline"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => onRestore(v.version)}
                                    >
                                        Restore as new version
                                    </Button>
                                ) : null}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3 px-6 py-4">
                        <p className="text-xs text-slate-600">Uploading creates the next version automatically and keeps history.</p>
                        <input
                            ref={fileRef}
                            type="file"
                            accept={ACCEPT}
                            className="text-sm"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        />
                        {err ? <p className="text-xs text-red-600">{err}</p> : null}
                        <Button type="button" variant="company" size="cta" className="w-full sm:w-auto" onClick={onUploadVersion}>
                            Upload new version
                        </Button>
                    </div>
                )}

                <div className="border-t border-slate-100 px-6 py-3 text-right">
                    <Button type="button" variant="companyGhost" size="cta" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
