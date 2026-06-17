'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export function ImportTenantsModal({
    isOpen,
    onClose,
    onImported,
}: {
    isOpen: boolean;
    onClose: () => void;
    onImported: () => void;
}) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Import tenants"
            footer={
                <>
                    <Button type="button" variant="companyOutline" size="cta" onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        type="button"
                        variant="company"
                        size="cta"
                        onClick={() => {
                            onImported();
                            onClose();
                        }}
                    >
                        Done
                    </Button>
                </>
            }
        >
            <p className="text-sm text-slate-600">
                Bulk tenant import uses the same enterprise CSV pipeline as Leads. Map columns to tenant fields (code, company, plan,
                admin, domain) before upload. Demo mode: use Export to validate your template, then wire your file in a follow-up.
            </p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                <input type="file" accept=".csv,text/csv" className="sr-only" disabled />
                Drop CSV here (disabled in demo)
            </label>
        </Modal>
    );
}
