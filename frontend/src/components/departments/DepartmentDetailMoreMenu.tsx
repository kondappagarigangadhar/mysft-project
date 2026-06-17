'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Department } from '@/data/mockData';
import { deleteDepartmentById, duplicateDepartment } from '@/lib/departmentStore';
import { departmentProfileHref } from '@/lib/departmentRoutes';
import { LuCopy, LuPencil, LuPlus, LuShare2, LuTrash2 } from 'react-icons/lu';

const actionBtnBase =
    'inline-flex min-h-9 w-full min-w-0 items-center justify-center gap-1.5 rounded-md px-2.25 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 sm:w-auto';

const actionBtn = `${actionBtnBase} focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)]`;

const primaryToolbarBtn = `${actionBtnBase} bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] hover:bg-[var(--cta-button-hover-bg)] hover:text-[var(--cta-button-hover-text)] focus-visible:ring-[var(--cta-button-hover-bg)] disabled:pointer-events-none disabled:opacity-50`;

/** Overview toolbar: Edit, Clone, Share, Archive, New — matches `LeadDetailMoreMenu`. */
export function DepartmentDetailMoreMenu({
    department,
    onEdit,
    isEditing = false,
    isSaving = false,
    onArchived,
}: {
    department: Department;
    onEdit: () => void;
    isEditing?: boolean;
    isSaving?: boolean;
    onArchived?: () => void;
}) {
    const router = useRouter();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');

    const onClone = () => {
        const copy = duplicateDepartment(department.id);
        if (copy) {
            onArchived?.();
            router.push(departmentProfileHref(copy.id));
        }
    };

    const onShare = async () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        try {
            if (navigator.share) {
                await navigator.share({ title: `${department.name} · Department`, url });
                return;
            }
        } catch {
            /* ignore */
        }
        setShareUrl(url);
        setShareModalOpen(true);
    };

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setShareModalOpen(false);
        } catch {
            /* keep modal open for manual copy */
        }
    };

    const confirmArchive = () => {
        setDeleteModalOpen(false);
        if (deleteDepartmentById(department.id)) {
            onArchived?.();
            router.push('/departments');
        }
    };

    return (
        <>
            <div
                className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-start sm:gap-3"
                role="toolbar"
                aria-label="Department actions"
            >
                {!isEditing ? (
                    <button type="button" onClick={onEdit} disabled={isSaving} className={primaryToolbarBtn}>
                        <LuPencil size={16} className="shrink-0" aria-hidden />
                        <span className="whitespace-nowrap">Edit</span>
                    </button>
                ) : (
                    <button
                        type="button"
                        disabled
                        className={`${actionBtn} border border-slate-200 bg-white text-slate-400 hover:bg-slate-50/50`}
                    >
                        <LuPencil size={16} className="shrink-0" aria-hidden />
                        <span className="whitespace-nowrap">Editing</span>
                    </button>
                )}
                <button
                    type="button"
                    onClick={onClone}
                    disabled={isSaving || isEditing}
                    className={`${actionBtn} border border-slate-200 bg-white text-slate-800 hover:bg-gray-100`}
                >
                    <LuCopy size={16} className="shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">Clone</span>
                </button>
                <button
                    type="button"
                    onClick={onShare}
                    disabled={isSaving || isEditing}
                    className={`${actionBtn} border border-slate-200 bg-white text-slate-800 hover:bg-gray-100`}
                >
                    <LuShare2 size={16} className="shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">Share</span>
                </button>
                <button
                    type="button"
                    onClick={() => setDeleteModalOpen(true)}
                    disabled={isSaving || isEditing}
                    className={`${actionBtn} border border-rose-300 bg-white text-rose-700 hover:bg-rose-50`}
                >
                    <LuTrash2 size={16} className="shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">Archive</span>
                </button>
                <button
                    type="button"
                    onClick={() => router.push('/departments/view/new')}
                    disabled={isSaving || isEditing}
                    className={`${actionBtn} col-span-2 border border-slate-200 bg-white text-slate-800 hover:bg-gray-100 sm:col-span-1`}
                >
                    <LuPlus size={16} className="shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">New</span>
                </button>
            </div>

            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Archive department"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            className="bg-rose-600 hover:bg-rose-700"
                            onClick={confirmArchive}
                        >
                            Archive
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Archive <span className="font-semibold text-slate-900">{department.name}</span>? This removes the
                    department from your active list.
                </p>
            </Modal>

            <Modal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                title="Share link"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setShareModalOpen(false)}>
                            Close
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={copyShareLink}>
                            Copy link
                        </Button>
                    </>
                }
            >
                <p className="mb-2 text-sm text-slate-600">Copy this URL to share this department record.</p>
                <input
                    readOnly
                    value={shareUrl}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800"
                    onFocus={(e) => e.target.select()}
                />
            </Modal>
        </>
    );
}
