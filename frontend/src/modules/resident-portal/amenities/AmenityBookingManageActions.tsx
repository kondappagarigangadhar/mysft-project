'use client';

import React from 'react';
import type { AmenityBooking } from './types';
import { LuBan, LuPencil, LuTrash2 } from 'react-icons/lu';

type Props = {
    booking: AmenityBooking;
    mode: 'resident' | 'admin';
    onEdit: () => void;
    onDelete: () => void;
    onCancel?: () => void;
};

export function AmenityBookingManageActions({ booking, mode, onEdit, onDelete, onCancel }: Props) {
    const isCancelled = booking.status === 'Cancelled';
    const canCancel =
        mode === 'admin' && (booking.status === 'Booked' || booking.status === 'Pending') && onCancel;
    const showEdit = mode === 'admin' || !isCancelled;

    return (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
            {showEdit ? (
                <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex items-center gap-1 rounded-full border border-[#e0dfdc] bg-white px-2.5 py-1 text-[11px] font-semibold text-[rgba(0,0,0,0.75)] transition hover:border-[#0a66c2] hover:text-[#0a66c2]"
                >
                    <LuPencil className="h-3 w-3" aria-hidden />
                    Edit
                </button>
            ) : null}
            {canCancel ? (
                <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 transition hover:border-amber-400"
                >
                    <LuBan className="h-3 w-3" aria-hidden />
                    Cancel booking
                </button>
            ) : null}
            <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-800 transition hover:border-rose-400"
            >
                <LuTrash2 className="h-3 w-3" aria-hidden />
                Delete
            </button>
        </div>
    );
}
