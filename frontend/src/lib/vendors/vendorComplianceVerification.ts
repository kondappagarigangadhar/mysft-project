'use client';

import type { ComplianceWorkflowStepId, VendorDocument, VerificationStatus } from '@/lib/vendors/types';

export type ComplianceTimelineStepState = 'completed' | 'current' | 'upcoming' | 'rejected';

export type ComplianceTimelineStep = {
    label: string;
    state: ComplianceTimelineStepState;
};

const STANDARD_STEPS: { id: ComplianceWorkflowStepId; label: string }[] = [
    { id: 'document_uploaded', label: 'Document Uploaded' },
    { id: 'waiting_for_approval', label: 'Waiting for Approval' },
    { id: 'compliance_review', label: 'Compliance Review' },
    { id: 'background_verification', label: 'Background Verification' },
    { id: 'final_approval', label: 'Final Approval' },
    { id: 'verified', label: 'Verified' },
];

const REJECTION_STEPS: { id: ComplianceWorkflowStepId; label: string }[] = [
    { id: 'document_uploaded', label: 'Document Uploaded' },
    { id: 'waiting_for_approval', label: 'Waiting for Approval' },
    { id: 'compliance_review', label: 'Compliance Review' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'reupload_required', label: 'Re-upload Required' },
];

export function normalizeVerificationStatus(status: VerificationStatus): VerificationStatus {
    return status === 'Pending' ? 'Pending Verification' : status;
}

export function isPendingVerificationStatus(status: VerificationStatus): boolean {
    return status === 'Pending' || status === 'Pending Verification';
}

export function shouldShowComplianceTimeline(doc: VendorDocument): boolean {
    if (doc.verificationStatus === 'Verified' || doc.verificationWorkflowStep === 'verified') return false;
    if (doc.verificationStatus === 'Expired') return false;
    return isPendingVerificationStatus(doc.verificationStatus) || doc.verificationStatus === 'Rejected';
}

export function hasDocumentsPendingVerification(docs: VendorDocument[]): boolean {
    return docs.some((d) => isPendingVerificationStatus(d.verificationStatus));
}

export function createDocumentVerificationState(): Pick<
    VendorDocument,
    'verificationStatus' | 'verificationWorkflowStep' | 'verifiedBy' | 'verifiedDate' | 'approvalNotes' | 'rejectionReason'
> {
    return {
        verificationStatus: 'Pending Verification',
        verificationWorkflowStep: 'waiting_for_approval',
        verifiedBy: '',
        verifiedDate: undefined,
        approvalNotes: undefined,
        rejectionReason: undefined,
    };
}

export function markDocumentVerified(
    doc: VendorDocument,
    input: { verifiedBy: string; verifiedDate: string; approvalNotes?: string },
): VendorDocument {
    return {
        ...doc,
        verificationStatus: 'Verified',
        verificationWorkflowStep: 'verified',
        verifiedBy: input.verifiedBy,
        verifiedDate: input.verifiedDate,
        approvalNotes: input.approvalNotes?.trim() || doc.approvalNotes,
        rejectionReason: undefined,
    };
}

export function markDocumentRejected(doc: VendorDocument, reason: string): VendorDocument {
    return {
        ...doc,
        verificationStatus: 'Rejected',
        verificationWorkflowStep: 'rejected',
        rejectionReason: reason.trim() || doc.rejectionReason,
        verifiedBy: '',
        verifiedDate: undefined,
        approvalNotes: undefined,
    };
}

function isRejectionPath(doc: VendorDocument): boolean {
    return (
        doc.verificationStatus === 'Rejected' ||
        doc.verificationWorkflowStep === 'rejected' ||
        doc.verificationWorkflowStep === 'reupload_required'
    );
}

export function buildComplianceTimelineSteps(doc: VendorDocument): ComplianceTimelineStep[] {
    if (!shouldShowComplianceTimeline(doc)) return [];

    if (isRejectionPath(doc)) {
        const currentId =
            doc.verificationWorkflowStep === 'reupload_required' ? 'reupload_required' : 'rejected';
        const currentIdx = REJECTION_STEPS.findIndex((s) => s.id === currentId);
        const idx = currentIdx >= 0 ? currentIdx : 3;
        return REJECTION_STEPS.map((step, stepIdx) => {
            if (step.id === 'rejected' && currentId === 'rejected' && stepIdx === idx) {
                return { label: step.label, state: 'rejected' as const };
            }
            if (stepIdx < idx) return { label: step.label, state: 'completed' as const };
            if (stepIdx === idx) return { label: step.label, state: step.id === 'rejected' ? 'rejected' : 'current' };
            return { label: step.label, state: 'upcoming' as const };
        });
    }

    const currentId = doc.verificationWorkflowStep ?? 'waiting_for_approval';
    const currentIdx = STANDARD_STEPS.findIndex((s) => s.id === currentId);
    const idx = currentIdx >= 0 ? currentIdx : 1;

    return STANDARD_STEPS.map((step, stepIdx) => ({
        label: step.label,
        state: stepIdx < idx ? 'completed' : stepIdx === idx ? 'current' : 'upcoming',
    }));
}
