'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import type { VisitorRequest } from './types';

type Props = {
    pass: VisitorRequest | null;
    variant: 'delete' | 'revoke';
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export function VisitorPassConfirmModal({ pass, variant, isOpen, onClose, onConfirm }: Props) {
    const isRevoke = variant === 'revoke';
    const title = isRevoke ? 'Revoke gate access?' : 'Delete visitor pass?';
    const body = isRevoke
        ? `Revoke access for ${pass?.name ?? 'this visitor'}? Their QR link will stop working immediately.`
        : `Permanently remove the pass for ${pass?.name ?? 'this visitor'}? This cannot be undone.`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidthClassName="max-w-sm">
            <p className="text-sm text-gray-600">{body}</p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    className={
                        isRevoke
                            ? 'rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700'
                            : 'rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700'
                    }
                >
                    {isRevoke ? 'Revoke access' : 'Delete pass'}
                </button>
            </div>
        </Modal>
    );
}
