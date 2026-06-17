'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cloneVendorRecord, deleteVendorRecord, updateVendorStatus, type VendorRecord } from '@/lib/vendors/vendorStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LuCopy, LuPencil, LuPlus, LuShare2, LuShieldAlert, LuTrash2 } from 'react-icons/lu';

const actionBtn =
    'inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md px-2.25 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)]';

export function VendorDetailMoreMenu({
    vendor,
    onEdit,
    isEditing = false,
    isSaving = false,
}: {
    vendor: VendorRecord;
    onEdit: () => void;
    isEditing?: boolean;
    isSaving?: boolean;
}) {
    const router = useRouter();
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [deleteOpen, setDeleteOpen] = useState(false);

    const onClone = () => {
        const copy = cloneVendorRecord(vendor.id);
        if (!copy) return;
        router.push(`/company-admin/vendors/${encodeURIComponent(copy.id)}`);
    };

    const onShare = async () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        try {
            if (navigator.share) {
                await navigator.share({ title: `${vendor.name} · Vendor`, url });
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
            /* keep modal */
        }
    };

    const onBlacklistToggle = () => {
        const nextStatus = vendor.status === 'Blacklisted' ? 'Active' : 'Blacklisted';
        const label = nextStatus === 'Blacklisted' ? 'blacklist this vendor' : 'remove this vendor from the blacklist';
        if (!window.confirm(`Are you sure you want to ${label}?`)) return;
        const updated = updateVendorStatus(vendor.id, nextStatus);
        if (!updated) return;
    };

    return (
        <>
            <div className="flex flex-wrap items-center justify-start gap-3" role="toolbar" aria-label="Vendor actions">
                {!isEditing ? (
                    <button
                        type="button"
                        onClick={onEdit}
                        disabled={isSaving}
                        className={`${actionBtn} bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] hover:bg-[var(--cta-button-hover-bg)] hover:text-[var(--cta-button-hover-text)] disabled:opacity-50`}
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
                    onClick={onBlacklistToggle}
                    disabled={isSaving || isEditing}
                    className={`${actionBtn} border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 disabled:opacity-50`}
                >
                    <LuShieldAlert size={16} className="shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">{vendor.status === 'Blacklisted' ? 'Unblacklist' : 'Blacklist'}</span>
                </button>
                <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    disabled={isSaving || isEditing}
                    className={`${actionBtn} border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 disabled:opacity-50`}
                >
                    <LuTrash2 size={16} className="shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">Archive</span>
                </button>
                <button
                    type="button"
                    onClick={() => router.push('/company-admin/vendors/new')}
                    disabled={isSaving || isEditing}
                    className={`${actionBtn} border border-slate-200 bg-white text-slate-800 hover:bg-gray-100 disabled:opacity-50`}
                >
                    <LuPlus size={16} className="shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">New</span>
                </button>
            </div>

            <Modal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                title="Share vendor"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setShareModalOpen(false)}>
                            Close
                        </Button>
                        <Button type="button" variant="company" size="cta" onClick={() => void copyShareLink()}>
                            Copy link
                        </Button>
                    </>
                }
            >
                <p className="mb-2 text-sm text-slate-600">Copy this URL to share this vendor profile.</p>
                <input
                    readOnly
                    value={shareUrl}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800"
                    onFocus={(e) => e.target.select()}
                />
            </Modal>

            <Modal
                isOpen={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                title="Delete vendor"
                footer={
                    <>
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            size="cta"
                            onClick={() => {
                                const ok = deleteVendorRecord(vendor.id);
                                if (!ok) return;
                                setDeleteOpen(false);
                                router.push('/company-admin/vendors/list');
                            }}
                        >
                            Delete
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    This will remove <span className="font-semibold text-slate-900">{vendor.name}</span> from your vendor registry.
                </p>
            </Modal>
        </>
    );
}
