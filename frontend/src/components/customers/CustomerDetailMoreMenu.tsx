'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { archiveCustomer, duplicateCustomer } from '@/lib/customersStore';
import type { Customer } from '@/lib/customersStore';
import { customersListHref, customerViewHref } from '@/lib/customerRoutes';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LuArchive, LuCopy, LuPencil, LuShare2, LuTrash2 } from 'react-icons/lu';

const actionBtnBase =
    'inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md px-2.25 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2';

const actionBtn = `${actionBtnBase} focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)]`;

const primaryToolbarBtn = `${actionBtnBase} bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] hover:bg-[var(--cta-button-hover-bg)] hover:text-[var(--cta-button-hover-text)] focus-visible:ring-[var(--cta-button-hover-bg)] disabled:pointer-events-none disabled:opacity-50`;

export function CustomerDetailMoreMenu({
    customer,
    onEdit,
    isEditing = false,
    isSaving = false,
    onRequestPermanentDelete,
}: {
    customer: Customer;
    onEdit: () => void;
    isEditing?: boolean;
    isSaving?: boolean;
    onRequestPermanentDelete: () => void;
}) {
    const router = useRouter();
    const [archiveModalOpen, setArchiveModalOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');

    const onClone = () => {
        const copy = duplicateCustomer(customer.slug);
        if (copy) router.push(customerViewHref(copy.slug));
    };

    const onShare = async () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        try {
            if (navigator.share) {
                await navigator.share({ title: `${customer.fullName} · Customer`, url });
                return;
            }
        } catch {
            /* ignore */
        }
        setShareUrl(url);
        setShareModalOpen(true);
    };

    const confirmArchive = () => {
        setArchiveModalOpen(false);
        if (archiveCustomer(customer.slug)) {
            router.push(customersListHref());
        }
    };

    return (
        <>
            <div className="flex flex-wrap items-center justify-start gap-3" role="toolbar" aria-label="Customer actions">
                {!isEditing ? (
                    <button type="button" onClick={onEdit} disabled={isSaving} className={primaryToolbarBtn}>
                        <LuPencil size={16} className="shrink-0" aria-hidden />
                        <span className="whitespace-nowrap">Edit</span>
                    </button>
                ) : (
                    <button type="button" disabled className={`${actionBtn} border border-slate-200 bg-white text-slate-400`}>
                        <LuPencil size={16} className="shrink-0" aria-hidden />
                        <span className="whitespace-nowrap">Editing</span>
                    </button>
                )}
                <button type="button" onClick={onClone} disabled={isSaving || isEditing} className={`${actionBtn} border border-slate-200 bg-white text-slate-800 hover:bg-gray-100`}>
                    <LuCopy size={16} className="shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">Clone</span>
                </button>
                <button type="button" onClick={onShare} disabled={isSaving || isEditing} className={`${actionBtn} border border-slate-200 bg-white text-slate-800 hover:bg-gray-100`}>
                    <LuShare2 size={16} className="shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">Share</span>
                </button>
                <button
                    type="button"
                    onClick={() => setArchiveModalOpen(true)}
                    disabled={isSaving || isEditing}
                    className={`${actionBtn} border border-slate-200 bg-white text-slate-800 hover:bg-gray-100`}
                >
                    <LuArchive size={16} className="shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">Archive</span>
                </button>
                <button
                    type="button"
                    onClick={onRequestPermanentDelete}
                    disabled={isSaving || isEditing}
                    className={`${actionBtn} border border-rose-200 bg-white text-rose-700 hover:bg-rose-50`}
                >
                    <LuTrash2 size={16} className="shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">Delete</span>
                </button>
            </div>

            <Modal
                isOpen={archiveModalOpen}
                onClose={() => setArchiveModalOpen(false)}
                title="Archive customer?"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setArchiveModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={confirmArchive}>
                            Archive
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">This hides the customer from the main portal list. You can restore from archives later (demo).</p>
            </Modal>

            <Modal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                title="Share customer workspace"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setShareModalOpen(false)}>
                            Close
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            onClick={() => void navigator.clipboard?.writeText(shareUrl).then(() => setShareModalOpen(false))}
                        >
                            Copy link
                        </Button>
                    </>
                }
            >
                <p className="break-all text-sm text-slate-700">{shareUrl}</p>
            </Modal>
        </>
    );
}
