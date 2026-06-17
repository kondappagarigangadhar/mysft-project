'use client';

import React from 'react';
import type { VisitorRequest } from './types';
import { LuBan, LuPencil, LuTrash2 } from 'react-icons/lu';

type Props = {
    visitor: VisitorRequest;
    mode: 'resident' | 'admin';
    onEdit: () => void;
    onDelete: () => void;
    onRevoke?: () => void;
};

export function VisitorPassManageActions({ visitor, mode, onEdit, onDelete, onRevoke }: Props) {
    const canRevoke = mode === 'admin' && visitor.status === 'Approved' && onRevoke;
    const isRevoked = visitor.status === 'Rejected';
    const showEdit = mode === 'admin' || !isRevoked;

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
            {canRevoke ? (
                <button
                    type="button"
                    onClick={onRevoke}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 transition hover:border-amber-400"
                >
                    <LuBan className="h-3 w-3" aria-hidden />
                    Revoke access
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
