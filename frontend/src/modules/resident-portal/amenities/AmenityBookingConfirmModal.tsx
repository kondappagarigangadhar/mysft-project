'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import type { AmenityBooking } from './types';

type Props = {
    booking: AmenityBooking | null;
    variant: 'delete' | 'cancel';
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export function AmenityBookingConfirmModal({ booking, variant, isOpen, onClose, onConfirm }: Props) {
    const isCancel = variant === 'cancel';
    const title = isCancel ? 'Cancel booking?' : 'Delete booking?';
    const body = isCancel
        ? `Cancel the ${booking?.amenity ?? 'amenity'} booking on ${booking?.bookingDate ?? 'this date'}? The slot will be released.`
        : `Permanently remove the ${booking?.amenity ?? 'amenity'} booking? This cannot be undone.`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidthClassName="max-w-sm">
            <p className="text-sm text-gray-600">{body}</p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    className={
                        isCancel
                            ? 'rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700'
                            : 'rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700'
                    }
                >
                    {isCancel ? 'Cancel booking' : 'Delete'}
                </button>
            </div>
        </Modal>
    );
}
