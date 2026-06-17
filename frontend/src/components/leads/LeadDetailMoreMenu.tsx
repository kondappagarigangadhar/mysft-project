'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteLead, duplicateLead, type Lead } from '@/lib/leadStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LuCopy, LuPencil, LuPlus, LuShare2, LuTrash2 } from 'react-icons/lu';

const actionBtnBase =
    'inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md px-2.25 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2';

const actionBtn = `${actionBtnBase} focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)]`;

/** Same colors as `Button` variant `company` — driven by `/settings/theme`. */
const primaryToolbarBtn = `${actionBtnBase} bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] hover:bg-[var(--cta-button-hover-bg)] hover:text-[var(--cta-button-hover-text)] focus-visible:ring-[var(--cta-button-hover-bg)] disabled:pointer-events-none disabled:opacity-50`;

/**
 * Overview toolbar: Edit, Clone, Share, Archive — each control shows **icon + label** for clarity.
 */
export function LeadDetailMoreMenu({
    lead,
    onEdit,
    isEditing = false,
    isSaving = false,
}: {
    lead: Lead;
    onEdit: () => void;
    isEditing?: boolean;
    isSaving?: boolean;
}) {
    const router = useRouter();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');

    const onClone = () => {
        const copy = duplicateLead(lead.slug);
        if (copy) {
            try {
                window.localStorage.setItem('activeLeadSlug', copy.slug);
            } catch {
                /* ignore */
            }
            router.push(`/leads/view/${copy.slug}`);
        }
    };

    const onShare = async () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        try {
            if (navigator.share) {
                await navigator.share({ title: `${lead.name} · Lead`, url });
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

    const confirmDeleteLead = () => {
        setDeleteModalOpen(false);
        if (deleteLead(lead.slug)) {
            router.push('/leads');
        }
    };

    return (
        <>
            <div
                className="flex flex-wrap items-center justify-start gap-3"
                role="toolbar"
                aria-label="Lead actions"
            >
               
                {!isEditing ? (
                    <button
                        type="button"
                        onClick={onEdit}
                        disabled={isSaving}
                        className={primaryToolbarBtn}
                    >
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
                    onClick={() => router.push('/leads/view/new')}
                    disabled={isSaving || isEditing}
                    className={`${actionBtn} border border-slate-200 bg-white text-slate-800 hover:bg-gray-100`}
                >
                    <LuPlus size={16} className="shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">New</span>
                </button>
            </div>

            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Archive lead"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" className="bg-rose-600 hover:bg-rose-700" onClick={confirmDeleteLead}>
                            Archive
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    Archive <span className="font-semibold text-slate-900">{lead.name}</span>? This removes the lead from your active list.
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
                <p className="mb-2 text-sm text-slate-600">Copy this URL to share this lead record.</p>
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
