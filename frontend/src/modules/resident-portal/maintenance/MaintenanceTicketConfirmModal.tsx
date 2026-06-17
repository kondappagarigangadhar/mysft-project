'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import type { MaintenanceTicket } from '@/modules/resident-portal/utils/types';

type Props = {
    ticket: MaintenanceTicket | null;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export function MaintenanceTicketConfirmModal({ ticket, isOpen, onClose, onConfirm }: Props) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Delete request?" maxWidthClassName="max-w-sm">
            <p className="text-sm text-gray-600">
                Permanently remove request <strong>{ticket?.id ?? ''}</strong>
                {ticket?.category ? ` (${ticket.category})` : ''}? This cannot be undone.
            </p>
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
                    className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                >
                    Delete request
                </button>
            </div>
        </Modal>
    );
}
