'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

export function ConfirmModal({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" aria-label="Close" onClick={onCancel} />
            <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{message}</p>
                <div className="mt-6 flex justify-end gap-2">
                    <Button type="button" variant="companyOutline" size="cta" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="button" variant="company" size="cta" onClick={onConfirm}>
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
