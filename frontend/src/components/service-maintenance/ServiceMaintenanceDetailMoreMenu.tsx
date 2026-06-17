'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LuCheck, LuCopy, LuPencil, LuPlus, LuTrash2, LuUserPlus } from 'react-icons/lu';
import { duplicateServiceMaintenanceTicket } from '@/lib/serviceMaintenanceStore';
import type { ServiceMaintenanceTicket } from '@/lib/serviceMaintenanceStore';
import { serviceMaintenanceCreateHref, serviceMaintenanceViewHref } from '@/lib/serviceMaintenanceRoutes';

const actionBtnBase =
    'inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-md px-2.25 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2';

const actionBtn = `${actionBtnBase} focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)]`;
const primaryToolbarBtn = `${actionBtnBase} bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] hover:bg-[var(--cta-button-hover-bg)] hover:text-[var(--cta-button-hover-text)] focus-visible:ring-[var(--cta-button-hover-bg)] disabled:pointer-events-none disabled:opacity-50`;

type Props = {
    ticket: ServiceMaintenanceTicket;
    onEdit: () => void;
    isEditing?: boolean;
    isSaving?: boolean;
    onAssignVendor: () => void;
    onCloseTicket: () => void;
    onRequestDelete: () => void;
};

export function ServiceMaintenanceDetailMoreMenu({
    ticket,
    onEdit,
    isEditing = false,
    isSaving = false,
    onAssignVendor,
    onCloseTicket,
    onRequestDelete,
}: Props) {
    const router = useRouter();

    const onClone = () => {
        const copy = duplicateServiceMaintenanceTicket(ticket.slug);
        if (copy) router.push(serviceMaintenanceViewHref(copy.slug));
    };

    const closed = ticket.ticketStatus === 'Closed';

    return (
        <div className="flex flex-wrap items-center justify-start gap-3" role="toolbar" aria-label="Service ticket actions">
            {!isEditing ? (
                <button type="button" onClick={onEdit} disabled={isSaving || closed} className={primaryToolbarBtn}>
                    <LuPencil size={16} className="shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">Edit</span>
                </button>
            ) : (
                <button type="button" disabled className={`${actionBtn} border border-slate-200 bg-white text-slate-400`}>
                    <LuPencil size={16} className="shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">Editing</span>
                </button>
            )}
            <button
                type="button"
                onClick={onAssignVendor}
                disabled={isSaving || isEditing || closed}
                className={`${actionBtn} border border-slate-200 bg-white text-slate-800 hover:bg-gray-100`}
            >
                <LuUserPlus size={16} className="shrink-0" aria-hidden />
                <span className="whitespace-nowrap">Assign Vendor</span>
            </button>
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
                onClick={onCloseTicket}
                disabled={isSaving || isEditing || closed}
                className={`${actionBtn} border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50`}
            >
                <LuCheck size={16} className="shrink-0" aria-hidden />
                <span className="whitespace-nowrap">Close Ticket</span>
            </button>
            <button
                type="button"
                onClick={onRequestDelete}
                disabled={isSaving || isEditing}
                className={`${actionBtn} border border-rose-300 bg-white text-rose-700 hover:bg-rose-50`}
            >
                <LuTrash2 size={16} className="shrink-0" aria-hidden />
                <span className="whitespace-nowrap">Delete</span>
            </button>
            <button
                type="button"
                onClick={() => router.push(serviceMaintenanceCreateHref())}
                disabled={isSaving || isEditing}
                className={`${actionBtn} border border-slate-200 bg-white text-slate-800 hover:bg-gray-100`}
            >
                <LuPlus size={16} className="shrink-0" aria-hidden />
                <span className="whitespace-nowrap">New</span>
            </button>
        </div>
    );
}
