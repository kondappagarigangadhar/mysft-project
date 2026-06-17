import type { VendorDocument, VerificationStatus } from '@/lib/vendors/types';

export const VENDOR_DOC_TYPES = ['PAN', 'GST', 'License', 'Agreement', 'Insurance', 'Trade License', 'Other'] as const;

export const VENDOR_DOC_VERIFICATION_OPTIONS: VerificationStatus[] = [
    'Pending Verification',
    'Verified',
    'Expired',
    'Rejected',
];

export const VENDOR_DOC_COLUMN_LABEL = {
    vendor: 'Vendor',
    type: 'Document Type',
    documentFile: 'Document File',
    documentName: 'Document Name',
    uploadedDate: 'Upload Date',
    expiryDate: 'Expiry Date',
    status: 'Verification Status',
    verifiedBy: 'Verified By',
    verifiedDate: 'Verified Date',
} as const;

function parseIsoDate(d: string | undefined): Date | null {
    if (!d?.trim()) return null;
    const x = new Date(`${d.trim()}T12:00:00`);
    return Number.isNaN(x.getTime()) ? null : x;
}

export function fmtVendorDocumentDate(d: string | undefined) {
    if (!d?.trim()) return '—';
    const p = parseIsoDate(d);
    if (!p) return d;
    return p.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getVendorDocumentVerifiedByDisplay(d: VendorDocument) {
    if (d.verificationStatus === 'Verified') {
        return d.verifiedBy && d.verifiedBy !== '—' ? d.verifiedBy : 'Admin';
    }
    return d.verifiedBy || '—';
}
