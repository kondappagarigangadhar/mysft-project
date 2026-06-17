import type { AccessLevel } from '@/lib/complianceDocumentsMockStore';
import type { ComplianceDemoRole } from '@/lib/complianceRbac';

export const ARRIS_DOCUMENT_UPLOAD_DRAFT_KEY = 'arris-document-upload-draft-v1';

export type DocumentUploadDraftCardOpen = {
    basic: boolean;
    file: boolean;
    linked: boolean;
    access: boolean;
    compliance: boolean;
    additional: boolean;
};

/** Serializable snapshot (browser File cannot be stored; keep metadata only so user can re-attach the same file). */
export type DocumentUploadDraftV1 = {
    v: 1;
    name: string;
    documentType: string;
    categories: string[];
    projectId: string;
    bookingId: string;
    customerId: string;
    accessLevel: AccessLevel;
    allowedRoles: ComplianceDemoRole[];
    rera: string;
    expiry: string;
    fileMeta: { name: string; size: number; type: string } | null;
    cardOpen: DocumentUploadDraftCardOpen;
    savedAt: string;
};

function isDraftV1(x: unknown): x is DocumentUploadDraftV1 {
    return (
        Boolean(x) &&
        typeof x === 'object' &&
        (x as DocumentUploadDraftV1).v === 1 &&
        typeof (x as DocumentUploadDraftV1).name === 'string'
    );
}

export function loadDocumentUploadDraft(storageKey: string): DocumentUploadDraftV1 | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return null;
        const p = JSON.parse(raw) as unknown;
        if (!isDraftV1(p)) return null;
        return p;
    } catch {
        return null;
    }
}

export function saveDocumentUploadDraftToStorage(
    storageKey: string,
    data: Omit<DocumentUploadDraftV1, 'v' | 'savedAt'>,
): void {
    if (typeof window === 'undefined') return;
    const payload: DocumentUploadDraftV1 = {
        v: 1,
        ...data,
        savedAt: new Date().toISOString(),
    };
    try {
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
        // quota
    }
}

export function clearDocumentUploadDraft(storageKey: string): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(storageKey);
    } catch {
        // ignore
    }
}
