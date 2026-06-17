'use client';

import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { AddDocumentModal, type AddDocumentPayload } from '@/components/vendors/shared/VendorCrudModals';
import {
    VendorDocumentEditModal,
    type VendorDocumentEditForm,
} from '@/components/vendors/shared/VendorDocumentEditModal';
import { VendorDocumentDeleteModal } from '@/components/vendors/shared/VendorDocumentDeleteModal';
import { VendorDocumentViewModal } from '@/components/vendors/shared/VendorDocumentViewModal';
import {
    createDocumentVerificationState,
    isPendingVerificationStatus,
    markDocumentRejected,
    markDocumentVerified,
} from '@/lib/vendors/vendorComplianceVerification';
import type { VendorDocument } from '@/lib/vendors/types';
import {
    appendModuleDocument,
    getModuleDocuments,
    removeModuleDocument,
    updateModuleDocument,
} from '@/lib/vendors/vendorModuleStore';

const EMPTY_EDIT_FORM: VendorDocumentEditForm = {
    vendorId: '',
    documentName: '',
    type: 'PAN',
    issueDate: '',
    expiryDate: '',
    notes: '',
    fileLabel: '',
    verificationStatus: 'Pending Verification',
    verifiedBy: '',
    verifiedDate: '',
};

export function useVendorDocumentModals({
    setDocuments,
    vendorNameById,
    lockVendorId,
    onAfterAdd,
    onAfterUpdate,
    onAfterDelete,
    onDownload,
    hideVendorLinkInView = false,
}: {
    setDocuments: Dispatch<SetStateAction<VendorDocument[]>>;
    vendorNameById: Map<string, string>;
    lockVendorId?: string;
    onAfterAdd?: (doc: VendorDocument) => void;
    onAfterUpdate?: (doc: VendorDocument) => void;
    onAfterDelete?: (doc: VendorDocument) => void;
    onDownload?: (doc: VendorDocument) => void;
    hideVendorLinkInView?: boolean;
}) {
    const [addOpen, setAddOpen] = useState(false);
    const [viewingDoc, setViewingDoc] = useState<VendorDocument | null>(null);
    const [editDoc, setEditDoc] = useState<VendorDocument | null>(null);
    const [deleteDoc, setDeleteDoc] = useState<VendorDocument | null>(null);
    const [editForm, setEditForm] = useState<VendorDocumentEditForm>(EMPTY_EDIT_FORM);
    const [submitAttempted, setSubmitAttempted] = useState(false);

    const openCreate = useCallback(() => {
        setSubmitAttempted(false);
        setAddOpen(true);
    }, []);

    const openView = useCallback((doc: VendorDocument) => {
        setViewingDoc(doc);
    }, []);

    const openEdit = useCallback((doc: VendorDocument) => {
        setSubmitAttempted(false);
        setViewingDoc(null);
        setEditDoc(doc);
        setEditForm({
            vendorId: lockVendorId || doc.vendorId,
            documentName: doc.documentName,
            type: doc.type,
            issueDate: doc.issueDate ?? '',
            expiryDate: doc.expiryDate ?? '',
            notes: doc.notes ?? '',
            fileLabel: doc.fileName ?? '',
            verificationStatus: doc.verificationStatus,
            verifiedBy: doc.verifiedBy === '—' ? '' : doc.verifiedBy,
            verifiedDate: doc.verifiedDate ?? '',
        });
    }, [lockVendorId]);

    const handleDownload = useCallback(
        (doc: VendorDocument) => {
            onDownload?.(doc);
        },
        [onDownload],
    );

    const openDelete = useCallback((doc: VendorDocument) => {
        setViewingDoc(null);
        setEditDoc(null);
        setDeleteDoc(doc);
    }, []);

    const confirmDelete = useCallback(() => {
        if (!deleteDoc) return;
        const removed = deleteDoc;
        setDocuments((prev) => prev.filter((x) => x.id !== removed.id));
        if (getModuleDocuments().some((d) => d.id === removed.id)) {
            removeModuleDocument(removed.id);
        }
        onAfterDelete?.(removed);
        setDeleteDoc(null);
    }, [deleteDoc, onAfterDelete, setDocuments]);

    const saveAdd = useCallback(
        (payload: AddDocumentPayload) => {
            const uploaded = new Date().toISOString().slice(0, 10);
            const row: VendorDocument = {
                id: `DOC-${Date.now()}`,
                vendorId: lockVendorId || payload.vendorId,
                documentName: payload.documentName.trim(),
                type: payload.type,
                uploadedDate: uploaded,
                issueDate: payload.issueDate || undefined,
                expiryDate: payload.expiryDate || undefined,
                fileName: payload.fileLabel.trim(),
                notes: payload.notes.trim() || undefined,
                ...createDocumentVerificationState(),
            };
            setDocuments((prev) => [row, ...prev]);
            appendModuleDocument(row);
            onAfterAdd?.(row);
            setAddOpen(false);
            setSubmitAttempted(false);
        },
        [lockVendorId, onAfterAdd, setDocuments],
    );

    const saveEdit = useCallback(() => {
        if (!editDoc) return;
        setSubmitAttempted(true);
        if (!editForm.vendorId || !editForm.documentName.trim()) return;
        const vs = editForm.verificationStatus;

        const base: VendorDocument = {
            ...editDoc,
            vendorId: lockVendorId || editForm.vendorId,
            documentName: editForm.documentName.trim(),
            type: editForm.type,
            issueDate: editForm.issueDate || undefined,
            expiryDate: editForm.expiryDate || undefined,
            notes: editForm.notes.trim() || undefined,
            fileName: editForm.fileLabel.trim() || editDoc.fileName,
        };

        let updated: VendorDocument;
        if (vs === 'Verified') {
            updated = markDocumentVerified(base, {
                verifiedBy: editForm.verifiedBy.trim() || 'Company Admin',
                verifiedDate: editForm.verifiedDate.trim() || new Date().toISOString().slice(0, 10),
                approvalNotes: editForm.notes.trim() || undefined,
            });
        } else if (vs === 'Rejected') {
            updated = markDocumentRejected(base, editForm.notes.trim() || 'Rejected during compliance review.');
        } else {
            updated = {
                ...base,
                verificationStatus: isPendingVerificationStatus(vs) ? 'Pending Verification' : vs,
                verifiedBy: '—',
                verifiedDate: undefined,
                approvalNotes: undefined,
                rejectionReason: undefined,
            };
        }

        setDocuments((prev) => prev.map((x) => (x.id === editDoc.id ? updated : x)));

        if (getModuleDocuments().some((d) => d.id === updated.id)) {
            updateModuleDocument(updated.id, updated);
        }

        onAfterUpdate?.(updated);
        setEditDoc(null);
        setSubmitAttempted(false);
    }, [editDoc, editForm, lockVendorId, onAfterUpdate, setDocuments]);

    const modals = useMemo(
        () => (
            <>
                <VendorDocumentViewModal
                    document={viewingDoc}
                    vendorName={viewingDoc ? (vendorNameById.get(viewingDoc.vendorId) ?? viewingDoc.vendorId) : ''}
                    onClose={() => setViewingDoc(null)}
                    onEdit={openEdit}
                    onDownload={handleDownload}
                    hideVendorLink={hideVendorLinkInView}
                />
                <VendorDocumentEditModal
                    document={editDoc}
                    form={editForm}
                    submitAttempted={submitAttempted}
                    lockVendorId={lockVendorId}
                    onClose={() => setEditDoc(null)}
                    onSave={saveEdit}
                    onFormChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
                />
                <AddDocumentModal
                    isOpen={addOpen}
                    onClose={() => setAddOpen(false)}
                    onSubmit={saveAdd}
                    initialVendorId={lockVendorId}
                    lockVendor={Boolean(lockVendorId)}
                />
                <VendorDocumentDeleteModal
                    document={deleteDoc}
                    onClose={() => setDeleteDoc(null)}
                    onConfirm={confirmDelete}
                />
            </>
        ),
        [
            addOpen,
            confirmDelete,
            deleteDoc,
            editDoc,
            editForm,
            handleDownload,
            hideVendorLinkInView,
            lockVendorId,
            openEdit,
            saveAdd,
            saveEdit,
            submitAttempted,
            vendorNameById,
            viewingDoc,
        ],
    );

    return {
        openCreate,
        openView,
        openEdit,
        openDelete,
        downloadDocument: handleDownload,
        modals,
    };
}
