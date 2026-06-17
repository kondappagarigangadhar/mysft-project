'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { VendorDocument } from '@/lib/vendors/types';

export function VendorDocumentDeleteModal({
    document: doc,
    onClose,
    onConfirm,
}: {
    document: VendorDocument | null;
    onClose: () => void;
    onConfirm: () => void;
}) {
    return (
        <Modal
            isOpen={Boolean(doc)}
            onClose={onClose}
            title="Delete document?"
            maxWidthClassName="max-w-md"
            footer={
                <>
                    <Button type="button" variant="companyOutline" size="cta" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="button" variant="danger" size="cta" onClick={onConfirm}>
                        Delete
                    </Button>
                </>
            }
        >
            <p className="text-sm text-slate-700">
                Delete this document permanently? This action cannot be undone in the demo workspace.
            </p>
            {doc ? (
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900 ring-1 ring-rose-100">
                    {doc.documentName}
                </p>
            ) : null}
        </Modal>
    );
}
