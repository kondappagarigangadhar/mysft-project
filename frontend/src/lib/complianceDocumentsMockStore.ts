/**
 * In-memory mock store for Company Admin — Documents & Compliance.
 * Swap for: S3/Azure signed URLs, eSign provider webhooks, DB, RBAC middleware.
 */

import { DEMO_PROJECT_NAMES } from '@/lib/demoCatalog';
import { getBookings } from '@/lib/bookingPaymentMockStore';
import type { ComplianceDemoRole } from '@/lib/complianceRbac';

const listeners = new Set<() => void>();

function emit() {
    listeners.forEach((l) => l());
}

export function subscribeComplianceStore(cb: () => void): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
}

function bump() {
    emit();
}

function nowIso(): string {
    return new Date().toISOString();
}

function randomId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const DOCUMENT_TYPE_OPTIONS = [
    'Sale Deed',
    'Agreement',
    'RERA Registration',
    'NOC',
    'Tax Receipt',
    'Floor Plan',
    'Other',
] as const;

export const DOCUMENT_CATEGORY_OPTIONS = ['Legal', 'Sales', 'Compliance', 'Finance'] as const;

export type AccessLevel = 'public' | 'private' | 'restricted';

export interface DocumentVersionRow {
    version: number;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: string;
    uploadedBy: string;
    storageUrl: string;
}

export interface ComplianceDocumentRecord {
    id: string;
    name: string;
    documentType: string;
    categories: string[];
    projectId: string;
    bookingId: string;
    customerId: string;
    accessLevel: AccessLevel;
    allowedRoles: ComplianceDemoRole[];
    reraNumber: string;
    expiryDate: string | null;
    versions: DocumentVersionRow[];
    deletedAt: string | null;
    createdAt: string;
}

export type AuditActivityType =
    | 'Upload'
    | 'Edit'
    | 'Delete'
    | 'View'
    | 'Sign'
    | 'Restore'
    | 'Version'
    | 'Download';

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    userName: string;
    userRole: ComplianceDemoRole;
    activityType: AuditActivityType;
    documentId: string;
    ipAddress: string;
    deviceInfo: string;
    remarks: string;
}

export interface ESignRecord {
    id: string;
    documentId: string;
    documentName: string;
    signerName: string;
    aadhaarMasked: string;
    transactionId: string;
    status: 'Pending' | 'Signed' | 'Failed';
    signedAt: string | null;
    signedStorageUrl: string | null;
    signatureXPercent: number;
    signatureYPercent: number;
    /** Page index for placement (1-based). Optional for legacy seed rows. */
    signaturePage?: number;
    createdAt: string;
}

export type NotificationType = 'expiry' | 'upload' | 'version';

export interface ComplianceNotification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    at: string;
    read: boolean;
    documentId?: string;
}

function mockSignedUrl(label: string): string {
    return `https://storage.example.com/signed/${encodeURIComponent(label)}?exp=${Date.now() + 3600_000}`;
}

function maskAadhaar(digits: string): string {
    const d = digits.replace(/\D/g, '').slice(0, 12);
    if (d.length < 12) return 'XXXX-XXXX-XXXX';
    return `XXXX-XXXX-${d.slice(8)}`;
}

function daysAgoIso(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
}

function addDaysYmd(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

let _docSeq = 20;

let _documents: ComplianceDocumentRecord[] = [
    {
        id: 'DOC-2026-0001',
        name: 'RERA Project Registration',
        documentType: 'RERA Registration',
        categories: ['Compliance', 'Legal'],
        projectId: DEMO_PROJECT_NAMES[0],
        bookingId: '',
        customerId: '',
        accessLevel: 'public',
        allowedRoles: ['super_admin', 'company_admin', 'staff', 'viewer'],
        reraNumber: 'RERA/TG/2024/008821',
        expiryDate: addDaysYmd(25),
        versions: [
            {
                version: 1,
                fileName: 'rera-skyline.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 1_200_000,
                uploadedAt: daysAgoIso(10),
                uploadedBy: 'Priya Sharma',
                storageUrl: mockSignedUrl('rera-skyline.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(12),
    },
    {
        id: 'DOC-2026-0002',
        name: 'Booking Agreement — Unit 102',
        documentType: 'Agreement',
        categories: ['Sales', 'Legal'],
        projectId: DEMO_PROJECT_NAMES[0],
        bookingId: 'skyline-residency-102',
        customerId: 'CUST-1042',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 2,
                fileName: 'agreement-v2.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 890_000,
                uploadedAt: daysAgoIso(2),
                uploadedBy: 'Company Admin',
                storageUrl: mockSignedUrl('agreement-v2.pdf'),
            },
            {
                version: 1,
                fileName: 'agreement-v1.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 880_000,
                uploadedAt: daysAgoIso(20),
                uploadedBy: 'Ravi K.',
                storageUrl: mockSignedUrl('agreement-v1.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(22),
    },
    {
        id: 'DOC-2026-0003',
        name: 'Tax Receipt — Stamp Duty',
        documentType: 'Tax Receipt',
        categories: ['Finance'],
        projectId: DEMO_PROJECT_NAMES[1],
        bookingId: '',
        customerId: 'CUST-2201',
        accessLevel: 'private',
        allowedRoles: ['super_admin', 'company_admin'],
        reraNumber: '',
        expiryDate: addDaysYmd(-5),
        versions: [
            {
                version: 1,
                fileName: 'stamp-duty.png',
                mimeType: 'image/png',
                sizeBytes: 420_000,
                uploadedAt: daysAgoIso(40),
                uploadedBy: 'Finance Ops',
                storageUrl: mockSignedUrl('stamp-duty.png'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(41),
    },
    {
        id: 'DOC-2026-0004',
        name: 'Sale Deed — Unit 204',
        documentType: 'Sale Deed',
        categories: ['Legal', 'Sales'],
        projectId: DEMO_PROJECT_NAMES[0],
        bookingId: 'skyline-residency-204',
        customerId: 'CUST-2204',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'sale-deed-u204.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 1_050_000,
                uploadedAt: daysAgoIso(8),
                uploadedBy: 'Ananya Iyer',
                storageUrl: mockSignedUrl('sale-deed-u204.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(9),
    },
    {
        id: 'DOC-2026-0005',
        name: 'Fire NOC — Tower B',
        documentType: 'NOC',
        categories: ['Compliance'],
        projectId: DEMO_PROJECT_NAMES[0],
        bookingId: '',
        customerId: '',
        accessLevel: 'public',
        allowedRoles: ['super_admin', 'company_admin', 'staff', 'viewer'],
        reraNumber: '',
        expiryDate: addDaysYmd(90),
        versions: [
            {
                version: 1,
                fileName: 'fire-noc-tower-b.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 640_000,
                uploadedAt: daysAgoIso(15),
                uploadedBy: 'Vikram Singh',
                storageUrl: mockSignedUrl('fire-noc-tower-b.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(16),
    },
    {
        id: 'DOC-2026-0006',
        name: 'Approved Floor Plan — Tower A',
        documentType: 'Floor Plan',
        categories: ['Sales', 'Compliance'],
        projectId: DEMO_PROJECT_NAMES[1],
        bookingId: '',
        customerId: '',
        accessLevel: 'public',
        allowedRoles: ['super_admin', 'company_admin', 'staff', 'viewer'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'floor-plan-tower-a.dwg.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 2_400_000,
                uploadedAt: daysAgoIso(5),
                uploadedBy: 'Neha Kapoor',
                storageUrl: mockSignedUrl('floor-plan-tower-a.dwg.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(6),
    },
    {
        id: 'DOC-2026-0007',
        name: 'Booking Agreement — Unit 305',
        documentType: 'Agreement',
        categories: ['Sales', 'Legal'],
        projectId: DEMO_PROJECT_NAMES[1],
        bookingId: 'urban-flux-305',
        customerId: 'CUST-3305',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'agreement-u305.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 910_000,
                uploadedAt: daysAgoIso(3),
                uploadedBy: 'Karthik Rao',
                storageUrl: mockSignedUrl('agreement-u305.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(4),
    },
    {
        id: 'DOC-2026-0008',
        name: 'RERA Quarterly Compliance — Urban Flux',
        documentType: 'RERA Registration',
        categories: ['Compliance'],
        projectId: DEMO_PROJECT_NAMES[1],
        bookingId: '',
        customerId: '',
        accessLevel: 'private',
        allowedRoles: ['super_admin', 'company_admin'],
        reraNumber: 'RERA/TG/2023/004512',
        expiryDate: addDaysYmd(14),
        versions: [
            {
                version: 1,
                fileName: 'rera-q-compliance.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 780_000,
                uploadedAt: daysAgoIso(11),
                uploadedBy: 'Sunita Desai',
                storageUrl: mockSignedUrl('rera-q-compliance.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(12),
    },
    {
        id: 'DOC-2026-0009',
        name: 'Occupancy Certificate — Phase 1',
        documentType: 'Other',
        categories: ['Compliance', 'Legal'],
        projectId: DEMO_PROJECT_NAMES[2],
        bookingId: '',
        customerId: '',
        accessLevel: 'public',
        allowedRoles: ['super_admin', 'company_admin', 'staff', 'viewer'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'oc-phase1.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 1_100_000,
                uploadedAt: daysAgoIso(30),
                uploadedBy: 'Rajesh Nair',
                storageUrl: mockSignedUrl('oc-phase1.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(31),
    },
    {
        id: 'DOC-2026-0010',
        name: 'Payment Schedule Annex — Summit Woods',
        documentType: 'Agreement',
        categories: ['Finance', 'Sales'],
        projectId: DEMO_PROJECT_NAMES[2],
        bookingId: '',
        customerId: 'CUST-5101',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: addDaysYmd(-2),
        versions: [
            {
                version: 1,
                fileName: 'payment-schedule-annex.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 520_000,
                uploadedAt: daysAgoIso(18),
                uploadedBy: 'Meera Joshi',
                storageUrl: mockSignedUrl('payment-schedule-annex.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(19),
    },
    {
        id: 'DOC-2026-0011',
        name: 'Draft LOI — Retail Block (superseded)',
        documentType: 'Other',
        categories: ['Sales'],
        projectId: DEMO_PROJECT_NAMES[0],
        bookingId: '',
        customerId: '',
        accessLevel: 'private',
        allowedRoles: ['super_admin', 'company_admin'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'loi-retail-draft.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 310_000,
                uploadedAt: daysAgoIso(60),
                uploadedBy: 'Priya Sharma',
                storageUrl: mockSignedUrl('loi-retail-draft.pdf'),
            },
        ],
        deletedAt: daysAgoIso(12),
        createdAt: daysAgoIso(62),
    },
    {
        id: 'DOC-2026-0012',
        name: 'Old Sale Deed Scan — Unit 088',
        documentType: 'Sale Deed',
        categories: ['Legal'],
        projectId: DEMO_PROJECT_NAMES[0],
        bookingId: '',
        customerId: 'CUST-1088',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: addDaysYmd(-120),
        versions: [
            {
                version: 1,
                fileName: 'sale-deed-u088-old.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 980_000,
                uploadedAt: daysAgoIso(400),
                uploadedBy: 'Ravi Kumar',
                storageUrl: mockSignedUrl('sale-deed-u088-old.pdf'),
            },
        ],
        deletedAt: daysAgoIso(45),
        createdAt: daysAgoIso(402),
    },
    {
        id: 'DOC-2026-0013',
        name: 'Marketing Brochure — Legacy PDF',
        documentType: 'Other',
        categories: ['Sales'],
        projectId: DEMO_PROJECT_NAMES[1],
        bookingId: '',
        customerId: '',
        accessLevel: 'public',
        allowedRoles: ['super_admin', 'company_admin', 'staff', 'viewer'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'brochure-2023.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 5_200_000,
                uploadedAt: daysAgoIso(200),
                uploadedBy: 'Neha Kapoor',
                storageUrl: mockSignedUrl('brochure-2023.pdf'),
            },
        ],
        deletedAt: daysAgoIso(8),
        createdAt: daysAgoIso(205),
    },
    {
        id: 'DOC-2026-0014',
        name: 'NOC Template — Duplicate upload',
        documentType: 'NOC',
        categories: ['Compliance'],
        projectId: DEMO_PROJECT_NAMES[2],
        bookingId: '',
        customerId: '',
        accessLevel: 'private',
        allowedRoles: ['super_admin', 'company_admin'],
        reraNumber: '',
        expiryDate: addDaysYmd(30),
        versions: [
            {
                version: 1,
                fileName: 'noc-dup.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 210_000,
                uploadedAt: daysAgoIso(22),
                uploadedBy: 'Vikram Singh',
                storageUrl: mockSignedUrl('noc-dup.pdf'),
            },
        ],
        deletedAt: daysAgoIso(3),
        createdAt: daysAgoIso(24),
    },
    {
        id: 'DOC-2026-0015',
        name: 'Customer KYC Pack — Test upload',
        documentType: 'Other',
        categories: ['Compliance'],
        projectId: DEMO_PROJECT_NAMES[0],
        bookingId: '',
        customerId: 'CUST-9999',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'kyc-test.zip.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 120_000,
                uploadedAt: daysAgoIso(6),
                uploadedBy: 'Ananya Iyer',
                storageUrl: mockSignedUrl('kyc-test.zip.pdf'),
            },
        ],
        deletedAt: daysAgoIso(1),
        createdAt: daysAgoIso(7),
    },
    {
        id: 'DOC-2026-0016',
        name: 'Tax Receipt — Wrong FY (removed)',
        documentType: 'Tax Receipt',
        categories: ['Finance'],
        projectId: DEMO_PROJECT_NAMES[1],
        bookingId: '',
        customerId: 'CUST-4401',
        accessLevel: 'private',
        allowedRoles: ['super_admin', 'company_admin'],
        reraNumber: '',
        expiryDate: addDaysYmd(-10),
        versions: [
            {
                version: 1,
                fileName: 'tax-wrong-fy.png',
                mimeType: 'image/png',
                sizeBytes: 380_000,
                uploadedAt: daysAgoIso(14),
                uploadedBy: 'Karthik Rao',
                storageUrl: mockSignedUrl('tax-wrong-fy.png'),
            },
        ],
        deletedAt: daysAgoIso(5),
        createdAt: daysAgoIso(15),
    },
    {
        id: 'DOC-2026-0017',
        name: 'Floor Plan — Concept only',
        documentType: 'Floor Plan',
        categories: ['Sales'],
        projectId: DEMO_PROJECT_NAMES[2],
        bookingId: '',
        customerId: '',
        accessLevel: 'public',
        allowedRoles: ['super_admin', 'company_admin', 'staff', 'viewer'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'floor-concept.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 1_800_000,
                uploadedAt: daysAgoIso(35),
                uploadedBy: 'Meera Joshi',
                storageUrl: mockSignedUrl('floor-concept.pdf'),
            },
        ],
        deletedAt: daysAgoIso(20),
        createdAt: daysAgoIso(38),
    },
    {
        id: 'DOC-2026-0018',
        name: 'Booking form — Incomplete scan',
        documentType: 'Agreement',
        categories: ['Sales'],
        projectId: DEMO_PROJECT_NAMES[0],
        bookingId: 'skyline-residency-201',
        customerId: 'CUST-1201',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'booking-scan-blur.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 290_000,
                uploadedAt: daysAgoIso(9),
                uploadedBy: 'Sunita Desai',
                storageUrl: mockSignedUrl('booking-scan-blur.pdf'),
            },
        ],
        deletedAt: daysAgoIso(2),
        createdAt: daysAgoIso(10),
    },
    {
        id: 'DOC-2026-0019',
        name: 'RERA filing draft — internal',
        documentType: 'RERA Registration',
        categories: ['Compliance', 'Legal'],
        projectId: DEMO_PROJECT_NAMES[1],
        bookingId: '',
        customerId: '',
        accessLevel: 'private',
        allowedRoles: ['super_admin', 'company_admin'],
        reraNumber: 'RERA/TG/DRAFT/001',
        expiryDate: addDaysYmd(60),
        versions: [
            {
                version: 1,
                fileName: 'rera-draft-internal.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 690_000,
                uploadedAt: daysAgoIso(4),
                uploadedBy: 'Rajesh Nair',
                storageUrl: mockSignedUrl('rera-draft-internal.pdf'),
            },
        ],
        deletedAt: daysAgoIso(4),
        createdAt: daysAgoIso(5),
    },
    {
        id: 'DOC-2026-0020',
        name: 'Allotment letter — superseded by v2',
        documentType: 'Agreement',
        categories: ['Sales', 'Legal'],
        projectId: DEMO_PROJECT_NAMES[2],
        bookingId: '',
        customerId: 'CUST-5502',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'allotment-v1.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 540_000,
                uploadedAt: daysAgoIso(50),
                uploadedBy: 'Amit Verma',
                storageUrl: mockSignedUrl('allotment-v1.pdf'),
            },
        ],
        deletedAt: daysAgoIso(18),
        createdAt: daysAgoIso(52),
    },
    {
        id: 'DOC-LEAD-RK-001',
        name: 'Booking agreement — Unit 101',
        documentType: 'Agreement',
        categories: ['Sales', 'Legal'],
        projectId: DEMO_PROJECT_NAMES[0],
        bookingId: 'skyline-residency-101',
        customerId: 'CUST-RK',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'agreement-ramesh-101.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 920_000,
                uploadedAt: daysAgoIso(8),
                uploadedBy: 'Amit Sales',
                storageUrl: mockSignedUrl('agreement-ramesh-101.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(9),
    },
    {
        id: 'DOC-LEAD-RK-002',
        name: 'KYC pack — Ramesh Kumar',
        documentType: 'Other',
        categories: ['Compliance'],
        projectId: DEMO_PROJECT_NAMES[0],
        bookingId: 'skyline-residency-101',
        customerId: 'CUST-RK',
        accessLevel: 'private',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'kyc-ramesh.zip',
                mimeType: 'application/zip',
                sizeBytes: 2_100_000,
                uploadedAt: daysAgoIso(7),
                uploadedBy: 'Amit Sales',
                storageUrl: mockSignedUrl('kyc-ramesh.zip'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(8),
    },
    {
        id: 'DOC-LEAD-AS-001',
        name: 'Booking agreement — Anita Sharma',
        documentType: 'Agreement',
        categories: ['Sales', 'Legal'],
        projectId: DEMO_PROJECT_NAMES[1],
        bookingId: 'urban-flux-apartments-102',
        customerId: 'CUST-AS',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'agreement-anita-102.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 870_000,
                uploadedAt: daysAgoIso(5),
                uploadedBy: 'Priya Reddy',
                storageUrl: mockSignedUrl('agreement-anita-102.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(6),
    },
    {
        id: 'DOC-LEAD-PJ-001',
        name: 'Retail allotment — Pallavi Joshi',
        documentType: 'Agreement',
        categories: ['Sales'],
        projectId: 'Phoenix MarketCity Retail',
        bookingId: 'phoenix-retail-pallavi-14',
        customerId: 'CUST-PJ',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'allotment-pallavi.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 1_050_000,
                uploadedAt: daysAgoIso(4),
                uploadedBy: 'Rajesh Kumar',
                storageUrl: mockSignedUrl('allotment-pallavi.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(5),
    },
    {
        id: 'DOC-LEAD-PJ-002',
        name: 'Payment receipt — Pallavi token',
        documentType: 'Tax Receipt',
        categories: ['Finance'],
        projectId: 'Phoenix MarketCity Retail',
        bookingId: 'phoenix-retail-pallavi-14',
        customerId: 'CUST-PJ',
        accessLevel: 'private',
        allowedRoles: ['super_admin', 'company_admin'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'receipt-pallavi.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 310_000,
                uploadedAt: daysAgoIso(3),
                uploadedBy: 'Finance Ops',
                storageUrl: mockSignedUrl('receipt-pallavi.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(4),
    },
    {
        id: 'DOC-LEAD-RD-001',
        name: 'Sale deed — Rahul Desai Unit 902',
        documentType: 'Sale Deed',
        categories: ['Legal', 'Sales'],
        projectId: DEMO_PROJECT_NAMES[0],
        bookingId: 'skyline-residency-rahul-902',
        customerId: 'CUST-RD',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'sale-deed-rahul.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 1_400_000,
                uploadedAt: daysAgoIso(12),
                uploadedBy: 'Rajesh Kumar',
                storageUrl: mockSignedUrl('sale-deed-rahul.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(13),
    },
    {
        id: 'DOC-LEAD-RD-002',
        name: 'Full payment acknowledgement',
        documentType: 'Tax Receipt',
        categories: ['Finance'],
        projectId: DEMO_PROJECT_NAMES[0],
        bookingId: 'skyline-residency-rahul-902',
        customerId: 'CUST-RD',
        accessLevel: 'private',
        allowedRoles: ['super_admin', 'company_admin'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'payment-ack-rahul.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 280_000,
                uploadedAt: daysAgoIso(10),
                uploadedBy: 'Finance Ops',
                storageUrl: mockSignedUrl('payment-ack-rahul.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(11),
    },
    {
        id: 'DOC-LEAD-KM-001',
        name: 'Villa agreement — Kavita Menon',
        documentType: 'Agreement',
        categories: ['Sales', 'Legal'],
        projectId: DEMO_PROJECT_NAMES[2],
        bookingId: 'summit-woods-kavita-v3',
        customerId: 'CUST-KM',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'agreement-kavita-v3.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 990_000,
                uploadedAt: daysAgoIso(6),
                uploadedBy: 'Vikram Singh',
                storageUrl: mockSignedUrl('agreement-kavita-v3.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(7),
    },
    {
        id: 'DOC-LEAD-KM-002',
        name: 'Balance payment schedule',
        documentType: 'Other',
        categories: ['Finance'],
        projectId: DEMO_PROJECT_NAMES[2],
        bookingId: 'summit-woods-kavita-v3',
        customerId: 'CUST-KM',
        accessLevel: 'private',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'balance-schedule-kavita.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 420_000,
                uploadedAt: daysAgoIso(2),
                uploadedBy: 'Vikram Singh',
                storageUrl: mockSignedUrl('balance-schedule-kavita.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(3),
    },
    {
        id: 'DOC-LEAD-AV-001',
        name: 'Token agreement draft — Arjun Verma',
        documentType: 'Agreement',
        categories: ['Sales'],
        projectId: 'Green Valley Phase 2',
        bookingId: 'green-valley-arjun-1204',
        customerId: 'CUST-AV',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'token-draft-arjun.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 650_000,
                uploadedAt: daysAgoIso(1),
                uploadedBy: 'Amit Sales',
                storageUrl: mockSignedUrl('token-draft-arjun.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(2),
    },
    {
        id: 'DOC-LEAD-SR-001',
        name: 'Site visit report — Suresh Raina',
        documentType: 'Other',
        categories: ['Sales'],
        projectId: DEMO_PROJECT_NAMES[2],
        bookingId: 'summit-woods-suresh-v7',
        customerId: 'CUST-SR',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'visit-report-suresh.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 540_000,
                uploadedAt: daysAgoIso(4),
                uploadedBy: 'Vikram Singh',
                storageUrl: mockSignedUrl('visit-report-suresh.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(5),
    },
    {
        id: 'DOC-LEAD-DN-001',
        name: 'Expression of interest — Deepak Nair',
        documentType: 'Agreement',
        categories: ['Sales'],
        projectId: DEMO_PROJECT_NAMES[0],
        bookingId: 'skyline-residency-deepak-508',
        customerId: 'CUST-DN',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'eoi-deepak-508.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 480_000,
                uploadedAt: daysAgoIso(3),
                uploadedBy: 'Sneha Reddy',
                storageUrl: mockSignedUrl('eoi-deepak-508.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(4),
    },
    {
        id: 'DOC-LEAD-DN-002',
        name: 'KYC draft — Deepak Nair',
        documentType: 'Other',
        categories: ['Compliance'],
        projectId: DEMO_PROJECT_NAMES[0],
        bookingId: 'skyline-residency-deepak-508',
        customerId: 'CUST-DN',
        accessLevel: 'private',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'kyc-deepak-draft.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 310_000,
                uploadedAt: daysAgoIso(2),
                uploadedBy: 'Sneha Reddy',
                storageUrl: mockSignedUrl('kyc-deepak-draft.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(3),
    },
    {
        id: 'DOC-LEAD-RH-001',
        name: 'Booking agreement — Rohit Khanna',
        documentType: 'Agreement',
        categories: ['Sales', 'Legal'],
        projectId: 'Metro Heights',
        bookingId: 'metro-heights-rohit-804',
        customerId: 'CUST-RH',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'agreement-rohit-804.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 890_000,
                uploadedAt: daysAgoIso(6),
                uploadedBy: 'Vikram Singh',
                storageUrl: mockSignedUrl('agreement-rohit-804.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(7),
    },
    {
        id: 'DOC-LEAD-RH-002',
        name: 'Home loan sanction pack — Rohit Khanna',
        documentType: 'Other',
        categories: ['Compliance', 'Finance'],
        projectId: 'Metro Heights',
        bookingId: 'metro-heights-rohit-804',
        customerId: 'CUST-RH',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'loan-sanction-rohit.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 720_000,
                uploadedAt: daysAgoIso(1),
                uploadedBy: 'Vikram Singh',
                storageUrl: mockSignedUrl('loan-sanction-rohit.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(2),
    },
    {
        id: 'DOC-LEAD-KM2-001',
        name: 'Alternate unit pricing — Karan Mehta',
        documentType: 'Other',
        categories: ['Sales'],
        projectId: 'Metro Heights',
        bookingId: 'metro-heights-karan-512',
        customerId: 'CUST-KM2',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'pricing-karan-512.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 410_000,
                uploadedAt: daysAgoIso(1),
                uploadedBy: 'Sneha Reddy',
                storageUrl: mockSignedUrl('pricing-karan-512.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(2),
    },
    {
        id: 'DOC-LEAD-KM2-002',
        name: 'Token agreement draft — Karan Mehta',
        documentType: 'Agreement',
        categories: ['Sales', 'Legal'],
        projectId: 'Metro Heights',
        bookingId: 'metro-heights-karan-512',
        customerId: 'CUST-KM2',
        accessLevel: 'restricted',
        allowedRoles: ['super_admin', 'company_admin', 'staff'],
        reraNumber: '',
        expiryDate: null,
        versions: [
            {
                version: 1,
                fileName: 'token-draft-karan.pdf',
                mimeType: 'application/pdf',
                sizeBytes: 560_000,
                uploadedAt: daysAgoIso(0),
                uploadedBy: 'Sneha Reddy',
                storageUrl: mockSignedUrl('token-draft-karan.pdf'),
            },
        ],
        deletedAt: null,
        createdAt: daysAgoIso(1),
    },
];

let _audit: AuditLogEntry[] = [];
let _esign: ESignRecord[] = [];
/** eSign IDs that passed OTP verification but are not yet finalized (staged workflow). */
const _esignOtpVerified = new Set<string>();
let _notifications: ComplianceNotification[] = [];

function seedLogs() {
    if (_audit.length > 0) return;
    _audit = [
        {
            id: 'AUD-2026-SEED-001',
            timestamp: daysAgoIso(0),
            userName: 'Company Admin',
            userRole: 'company_admin',
            activityType: 'View',
            documentId: 'DOC-2026-0001',
            ipAddress: '103.21.45.12',
            deviceInfo: 'Chrome 124 / Windows 10',
            remarks: 'Opened document preview',
        },
        {
            id: 'AUD-2026-SEED-002',
            timestamp: daysAgoIso(0),
            userName: 'Priya Sharma',
            userRole: 'staff',
            activityType: 'Upload',
            documentId: 'DOC-2026-0004',
            ipAddress: '49.37.10.2',
            deviceInfo: 'Edge 123 / Windows 11',
            remarks: 'Uploaded sale deed — Unit 204',
        },
        {
            id: 'AUD-2026-SEED-003',
            timestamp: daysAgoIso(1),
            userName: 'Ananya Iyer',
            userRole: 'staff',
            activityType: 'Edit',
            documentId: 'DOC-2026-0007',
            ipAddress: '106.51.22.8',
            deviceInfo: 'Chrome 125 / macOS',
            remarks: 'Updated metadata — booking ref',
        },
        {
            id: 'AUD-2026-SEED-004',
            timestamp: daysAgoIso(1),
            userName: 'Vikram Singh',
            userRole: 'company_admin',
            activityType: 'Delete',
            documentId: 'DOC-2026-0015',
            ipAddress: '157.48.3.101',
            deviceInfo: 'Firefox 124 / Windows 11',
            remarks: 'Soft delete — test KYC upload',
        },
        {
            id: 'AUD-2026-SEED-005',
            timestamp: daysAgoIso(2),
            userName: 'Neha Kapoor',
            userRole: 'staff',
            activityType: 'Version',
            documentId: 'DOC-2026-0002',
            ipAddress: '49.204.11.44',
            deviceInfo: 'Safari 17 / iPadOS',
            remarks: 'Uploaded v2 of agreement',
        },
        {
            id: 'AUD-2026-SEED-006',
            timestamp: daysAgoIso(2),
            userName: 'Karthik Rao',
            userRole: 'staff',
            activityType: 'Download',
            documentId: 'DOC-2026-0006',
            ipAddress: '106.192.1.9',
            deviceInfo: 'Chrome 124 / Android 14',
            remarks: 'Signed URL download',
        },
        {
            id: 'AUD-2026-SEED-007',
            timestamp: daysAgoIso(3),
            userName: 'Sunita Desai',
            userRole: 'company_admin',
            activityType: 'Sign',
            documentId: 'DOC-2026-0004',
            ipAddress: '103.15.88.201',
            deviceInfo: 'Chrome 124 / Windows 10',
            remarks: 'eSign initiated — TXN-AADHAAR-9F2C1',
        },
        {
            id: 'AUD-2026-SEED-008',
            timestamp: daysAgoIso(4),
            userName: 'Rajesh Nair',
            userRole: 'staff',
            activityType: 'View',
            documentId: 'DOC-2026-0009',
            ipAddress: '117.99.12.3',
            deviceInfo: 'Edge 123 / Windows 11',
            remarks: 'Compliance review — OC',
        },
        {
            id: 'AUD-2026-SEED-009',
            timestamp: daysAgoIso(5),
            userName: 'Meera Joshi',
            userRole: 'staff',
            activityType: 'View',
            documentId: 'DOC-2026-0004',
            ipAddress: '49.37.44.55',
            deviceInfo: 'Chrome 124 / Windows 10',
            remarks: 'Previewed sale deed before eSign',
        },
        {
            id: 'AUD-2026-SEED-010',
            timestamp: daysAgoIso(6),
            userName: 'Ravi Kumar',
            userRole: 'viewer',
            activityType: 'View',
            documentId: 'DOC-2026-0008',
            ipAddress: '106.51.2.88',
            deviceInfo: 'Firefox 125 / Ubuntu',
            remarks: 'View only — RERA quarterly',
        },
        {
            id: 'AUD-2026-SEED-011',
            timestamp: daysAgoIso(7),
            userName: 'Amit Verma',
            userRole: 'staff',
            activityType: 'Upload',
            documentId: 'DOC-2026-0005',
            ipAddress: '103.21.90.12',
            deviceInfo: 'Chrome 124 / Windows 10',
            remarks: 'Fire NOC uploaded',
        },
        {
            id: 'AUD-2026-SEED-012',
            timestamp: daysAgoIso(8),
            userName: 'Company Admin',
            userRole: 'company_admin',
            activityType: 'Delete',
            documentId: 'DOC-2026-0013',
            ipAddress: '103.21.45.12',
            deviceInfo: 'Chrome 124 / Windows 10',
            remarks: 'Soft delete — legacy brochure',
        },
        {
            id: 'AUD-2026-SEED-013',
            timestamp: daysAgoIso(10),
            userName: 'Priya Sharma',
            userRole: 'staff',
            activityType: 'Download',
            documentId: 'DOC-2026-0001',
            ipAddress: '49.37.10.2',
            deviceInfo: 'Edge 123 / Windows 11',
            remarks: 'RERA registration PDF export',
        },
        {
            id: 'AUD-2026-SEED-014',
            timestamp: daysAgoIso(12),
            userName: 'Vikram Singh',
            userRole: 'company_admin',
            activityType: 'Edit',
            documentId: 'DOC-2026-0010',
            ipAddress: '157.48.3.101',
            deviceInfo: 'Chrome 124 / Windows 11',
            remarks: 'Expiry date corrected',
        },
    ];
    _esign = [
        {
            id: 'ESIGN-2026-0001',
            documentId: 'DOC-2026-0002',
            documentName: 'Booking Agreement — Unit 102',
            signerName: 'Amit Verma',
            aadhaarMasked: maskAadhaar('123456789012'),
            transactionId: 'TXN-AADHAAR-9F2C1',
            status: 'Pending',
            signedAt: null,
            signedStorageUrl: null,
            signatureXPercent: 62,
            signatureYPercent: 78,
            createdAt: daysAgoIso(0),
        },
        {
            id: 'ESIGN-2026-0002',
            documentId: 'DOC-2026-0004',
            documentName: 'Sale Deed — Unit 204',
            signerName: 'Sneha Reddy',
            aadhaarMasked: maskAadhaar('998877665544'),
            transactionId: 'TXN-AADHAAR-A1B2C3',
            status: 'Signed',
            signedAt: daysAgoIso(1),
            signedStorageUrl: mockSignedUrl('signed-Sale-Deed-204.pdf'),
            signatureXPercent: 55,
            signatureYPercent: 82,
            createdAt: daysAgoIso(2),
        },
        {
            id: 'ESIGN-2026-0003',
            documentId: 'DOC-2026-0007',
            documentName: 'Booking Agreement — Unit 305',
            signerName: 'Mohammed Faizal',
            aadhaarMasked: maskAadhaar('112233445566'),
            transactionId: 'TXN-AADHAAR-D4E5F6',
            status: 'Signed',
            signedAt: daysAgoIso(3),
            signedStorageUrl: mockSignedUrl('signed-Agreement-305.pdf'),
            signatureXPercent: 48,
            signatureYPercent: 71,
            createdAt: daysAgoIso(4),
        },
        {
            id: 'ESIGN-2026-0004',
            documentId: 'DOC-2026-0001',
            documentName: 'RERA Project Registration',
            signerName: 'Deepak Menon',
            aadhaarMasked: maskAadhaar('554433221100'),
            transactionId: 'TXN-AADHAAR-778899',
            status: 'Failed',
            signedAt: null,
            signedStorageUrl: null,
            signatureXPercent: 60,
            signatureYPercent: 75,
            createdAt: daysAgoIso(5),
        },
        {
            id: 'ESIGN-2026-0005',
            documentId: 'DOC-2026-0006',
            documentName: 'Approved Floor Plan — Tower A',
            signerName: 'Lakshmi Prasad',
            aadhaarMasked: maskAadhaar('667788990011'),
            transactionId: 'TXN-AADHAAR-00AA11',
            status: 'Pending',
            signedAt: null,
            signedStorageUrl: null,
            signatureXPercent: 50,
            signatureYPercent: 68,
            createdAt: daysAgoIso(5),
        },
        {
            id: 'ESIGN-2026-0006',
            documentId: 'DOC-2026-0008',
            documentName: 'RERA Quarterly Compliance — Urban Flux',
            signerName: 'Arun Krishnan',
            aadhaarMasked: maskAadhaar('223344556677'),
            transactionId: 'TXN-AADHAAR-BBCCDD',
            status: 'Signed',
            signedAt: daysAgoIso(6),
            signedStorageUrl: mockSignedUrl('signed-RERA-Q.pdf'),
            signatureXPercent: 58,
            signatureYPercent: 80,
            createdAt: daysAgoIso(7),
        },
        {
            id: 'ESIGN-2026-0007',
            documentId: 'DOC-2026-0009',
            documentName: 'Occupancy Certificate — Phase 1',
            signerName: 'Divya S.',
            aadhaarMasked: maskAadhaar('334455667788'),
            transactionId: 'TXN-AADHAAR-EEFF00',
            status: 'Signed',
            signedAt: daysAgoIso(8),
            signedStorageUrl: mockSignedUrl('signed-OC.pdf'),
            signatureXPercent: 64,
            signatureYPercent: 72,
            createdAt: daysAgoIso(9),
        },
        {
            id: 'ESIGN-2026-0008',
            documentId: 'DOC-2026-0010',
            documentName: 'Payment Schedule Annex — Summit Woods',
            signerName: 'Gaurav Malhotra',
            aadhaarMasked: maskAadhaar('889900112233'),
            transactionId: 'TXN-AADHAAR-112233',
            status: 'Failed',
            signedAt: null,
            signedStorageUrl: null,
            signatureXPercent: 52,
            signatureYPercent: 77,
            createdAt: daysAgoIso(10),
        },
        {
            id: 'ESIGN-2026-0009',
            documentId: 'DOC-2026-0005',
            documentName: 'Fire NOC — Tower B',
            signerName: 'Sanjay Patil',
            aadhaarMasked: maskAadhaar('445566778899'),
            transactionId: 'TXN-AADHAAR-445566',
            status: 'Pending',
            signedAt: null,
            signedStorageUrl: null,
            signatureXPercent: 59,
            signatureYPercent: 74,
            createdAt: daysAgoIso(11),
        },
        {
            id: 'ESIGN-2026-0010',
            documentId: 'DOC-2026-0003',
            documentName: 'Tax Receipt — Stamp Duty',
            signerName: 'Kavitha N.',
            aadhaarMasked: maskAadhaar('101010101010'),
            transactionId: 'TXN-AADHAAR-ABCDEF',
            status: 'Signed',
            signedAt: daysAgoIso(12),
            signedStorageUrl: mockSignedUrl('signed-tax.png'),
            signatureXPercent: 45,
            signatureYPercent: 65,
            createdAt: daysAgoIso(13),
        },
        {
            id: 'ESIGN-2026-0011',
            documentId: 'DOC-2026-0002',
            documentName: 'Booking Agreement — Unit 102',
            signerName: 'Rohit Saxena',
            aadhaarMasked: maskAadhaar('121212121212'),
            transactionId: 'TXN-AADHAAR-GHIJKL',
            status: 'Signed',
            signedAt: daysAgoIso(14),
            signedStorageUrl: mockSignedUrl('signed-agreement-102-b.pdf'),
            signatureXPercent: 61,
            signatureYPercent: 79,
            createdAt: daysAgoIso(15),
        },
        {
            id: 'ESIGN-2026-0012',
            documentId: 'DOC-2026-0004',
            documentName: 'Sale Deed — Unit 204',
            signerName: 'Pooja Bhatia',
            aadhaarMasked: maskAadhaar('131313131313'),
            transactionId: 'TXN-AADHAAR-MNOPQR',
            status: 'Pending',
            signedAt: null,
            signedStorageUrl: null,
            signatureXPercent: 57,
            signatureYPercent: 76,
            createdAt: daysAgoIso(16),
        },
    ];
    _notifications = [
        {
            id: randomId('N'),
            type: 'expiry',
            title: 'Document expiring soon',
            message: 'RERA Project Registration expires in 25 days.',
            at: nowIso(),
            read: false,
            documentId: 'DOC-2026-0001',
        },
        {
            id: randomId('N'),
            type: 'version',
            title: 'Version updated',
            message: 'Booking Agreement — Unit 102 is now at v2.',
            at: daysAgoIso(2),
            read: true,
            documentId: 'DOC-2026-0002',
        },
        {
            id: randomId('N'),
            type: 'expiry',
            title: 'Compliance window',
            message: 'RERA Quarterly Compliance — Urban Flux expires in 14 days.',
            at: daysAgoIso(1),
            read: false,
            documentId: 'DOC-2026-0008',
        },
        {
            id: randomId('N'),
            type: 'upload',
            title: 'New document',
            message: 'Fire NOC — Tower B added to the library.',
            at: daysAgoIso(3),
            read: true,
            documentId: 'DOC-2026-0005',
        },
    ];
}

seedLogs();

export function getComplianceStatus(expiryDate: string | null): 'Active' | 'Expired' {
    if (!expiryDate) return 'Active';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ex = new Date(expiryDate + 'T00:00:00');
    return ex < today ? 'Expired' : 'Active';
}

export function getCurrentVersion(doc: ComplianceDocumentRecord): DocumentVersionRow | null {
    if (!doc.versions.length) return null;
    return [...doc.versions].sort((a, b) => b.version - a.version)[0];
}

/** Second-highest version number (for “previous” column); null if only one version exists. */
export function getPreviousVersion(doc: ComplianceDocumentRecord): DocumentVersionRow | null {
    if (doc.versions.length < 2) return null;
    const sorted = [...doc.versions].sort((a, b) => b.version - a.version);
    return sorted[1] ?? null;
}

export function formatComplianceFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Calendar day (YYYY-MM-DD) for the current version upload, else document created date. */
export function getUploadDateYmd(doc: ComplianceDocumentRecord): string {
    const v = getCurrentVersion(doc);
    if (v?.uploadedAt) return v.uploadedAt.slice(0, 10);
    return doc.createdAt.slice(0, 10);
}

export function listActiveDocuments(): ComplianceDocumentRecord[] {
    seedLogs();
    return _documents.filter((d) => !d.deletedAt);
}

export function listDeletedDocuments(): ComplianceDocumentRecord[] {
    seedLogs();
    return _documents.filter((d) => !!d.deletedAt);
}

export function getDocumentById(id: string): ComplianceDocumentRecord | undefined {
    return _documents.find((d) => d.id === id);
}

export function getProjectLookupOptions(): { value: string; label: string }[] {
    return DEMO_PROJECT_NAMES.map((n) => ({ value: n, label: n }));
}

export function getBookingLookupOptions(): { value: string; label: string }[] {
    try {
        const rows = getBookings();
        return rows.map((b) => ({
            value: b.slug,
            label: `${b.customerName} — ${b.projectName} (${b.unitId})`,
        }));
    } catch {
        return [];
    }
}

export function getCustomerLookupOptions(): { value: string; label: string }[] {
    try {
        const rows = getBookings();
        const map = new Map<string, string>();
        for (const b of rows) {
            const id = `CUST-${b.slug.replace(/\D/g, '').slice(0, 4) || '1000'}`;
            if (!map.has(id)) map.set(id, b.customerName);
        }
        return [...map.entries()].map(([value, name]) => ({ value, label: `${name} (${value})` }));
    } catch {
        return [
            { value: 'CUST-1042', label: 'Sample Customer (CUST-1042)' },
            { value: 'CUST-2201', label: 'Sample Customer (CUST-2201)' },
        ];
    }
}

function appendAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }) {
    _audit.unshift({
        id: randomId('AUD'),
        timestamp: entry.timestamp ?? nowIso(),
        userName: entry.userName,
        userRole: entry.userRole,
        activityType: entry.activityType,
        documentId: entry.documentId,
        ipAddress: entry.ipAddress,
        deviceInfo: entry.deviceInfo,
        remarks: entry.remarks,
    });
}

function pushNotification(n: Omit<ComplianceNotification, 'id' | 'at'> & { at?: string }) {
    _notifications.unshift({
        id: randomId('N'),
        at: n.at ?? nowIso(),
        ...n,
    });
}

export function getAuditLogs(): AuditLogEntry[] {
    seedLogs();
    return [..._audit];
}

export function getNotifications(): ComplianceNotification[] {
    seedLogs();
    return [..._notifications];
}

export function markNotificationRead(id: string): void {
    const n = _notifications.find((x) => x.id === id);
    if (n) n.read = true;
    bump();
}

export function markAllNotificationsRead(): void {
    _notifications.forEach((n) => {
        n.read = true;
    });
    bump();
}

export function getESignRecords(): ESignRecord[] {
    seedLogs();
    return [..._esign];
}

export function getESignById(id: string): ESignRecord | undefined {
    return _esign.find((e) => e.id === id);
}

/** Removes an eSign request row from the demo list. */
export function deleteESignRecord(id: string): boolean {
    seedLogs();
    const before = _esign.length;
    _esign = _esign.filter((e) => e.id !== id);
    if (_esign.length < before) {
        _esignOtpVerified.delete(id);
        bump();
        return true;
    }
    return false;
}

/** Demo client “IP” / device — browser only. */
function clientContext(): { ip: string; device: string } {
    if (typeof navigator === 'undefined') {
        return { ip: '127.0.0.1', device: 'Server' };
    }
    return {
        ip: '103.xx.xx.xx',
        device: `${navigator.userAgent.slice(0, 80)}`,
    };
}

export interface AddDocumentInput {
    name: string;
    documentType: string;
    categories: string[];
    file: { name: string; type: string; size: number };
    projectId: string;
    bookingId: string;
    customerId: string;
    accessLevel: AccessLevel;
    allowedRoles: ComplianceDemoRole[];
    reraNumber: string;
    expiryDate: string | null;
    uploadedBy: string;
    userRole: ComplianceDemoRole;
}

export function addDocument(input: AddDocumentInput): ComplianceDocumentRecord {
    seedLogs();
    _docSeq += 1;
    const id = `DOC-2026-${String(_docSeq).padStart(4, '0')}`;
    const v: DocumentVersionRow = {
        version: 1,
        fileName: input.file.name,
        mimeType: input.file.type || 'application/octet-stream',
        sizeBytes: input.file.size,
        uploadedAt: nowIso(),
        uploadedBy: input.uploadedBy,
        storageUrl: mockSignedUrl(input.file.name),
    };
    const row: ComplianceDocumentRecord = {
        id,
        name: input.name.trim(),
        documentType: input.documentType,
        categories: input.categories,
        projectId: input.projectId,
        bookingId: input.bookingId,
        customerId: input.customerId,
        accessLevel: input.accessLevel,
        allowedRoles: input.allowedRoles.length ? input.allowedRoles : ['super_admin', 'company_admin'],
        reraNumber: input.reraNumber.trim(),
        expiryDate: input.expiryDate,
        versions: [v],
        deletedAt: null,
        createdAt: nowIso(),
    };
    _documents = [row, ..._documents];
    const ctx = clientContext();
    appendAudit({
        userName: input.uploadedBy,
        userRole: input.userRole,
        activityType: 'Upload',
        documentId: id,
        ipAddress: ctx.ip,
        deviceInfo: ctx.device,
        remarks: `Uploaded ${input.file.name} (v1)`,
    });
    pushNotification({
        type: 'upload',
        title: 'New document uploaded',
        message: `${row.name} (${id})`,
        read: false,
        documentId: id,
    });
    bump();
    return row;
}

export function updateDocumentMeta(
    id: string,
    patch: Partial<
        Pick<
            ComplianceDocumentRecord,
            | 'name'
            | 'documentType'
            | 'categories'
            | 'projectId'
            | 'bookingId'
            | 'customerId'
            | 'accessLevel'
            | 'allowedRoles'
            | 'reraNumber'
            | 'expiryDate'
        >
    >,
    actor: { name: string; role: ComplianceDemoRole }
): void {
    const d = _documents.find((x) => x.id === id);
    if (!d || d.deletedAt) return;
    Object.assign(d, patch);
    const ctx = clientContext();
    appendAudit({
        userName: actor.name,
        userRole: actor.role,
        activityType: 'Edit',
        documentId: id,
        ipAddress: ctx.ip,
        deviceInfo: ctx.device,
        remarks: 'Metadata updated',
    });
    bump();
}

export function uploadNewVersion(
    id: string,
    file: { name: string; type: string; size: number },
    uploadedBy: string,
    userRole: ComplianceDemoRole
): void {
    const d = _documents.find((x) => x.id === id);
    if (!d || d.deletedAt) return;
    const maxV = Math.max(0, ...d.versions.map((v) => v.version));
    const next: DocumentVersionRow = {
        version: maxV + 1,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        uploadedAt: nowIso(),
        uploadedBy,
        storageUrl: mockSignedUrl(file.name),
    };
    d.versions = [next, ...d.versions];
    const ctx = clientContext();
    appendAudit({
        userName: uploadedBy,
        userRole: userRole,
        activityType: 'Version',
        documentId: id,
        ipAddress: ctx.ip,
        deviceInfo: ctx.device,
        remarks: `Uploaded v${next.version}`,
    });
    pushNotification({
        type: 'version',
        title: 'Version updated',
        message: `${d.name} is now at v${next.version}.`,
        read: false,
        documentId: id,
    });
    bump();
}

export function softDeleteDocument(id: string, actor: { name: string; role: ComplianceDemoRole }): void {
    const d = _documents.find((x) => x.id === id);
    if (!d || d.deletedAt) return;
    d.deletedAt = nowIso();
    const ctx = clientContext();
    appendAudit({
        userName: actor.name,
        userRole: actor.role,
        activityType: 'Delete',
        documentId: id,
        ipAddress: ctx.ip,
        deviceInfo: ctx.device,
        remarks: 'Soft delete',
    });
    bump();
}

export function restoreDocument(id: string, actor: { name: string; role: ComplianceDemoRole }): void {
    const d = _documents.find((x) => x.id === id);
    if (!d || !d.deletedAt) return;
    d.deletedAt = null;
    const ctx = clientContext();
    appendAudit({
        userName: actor.name,
        userRole: actor.role,
        activityType: 'Restore',
        documentId: id,
        ipAddress: ctx.ip,
        deviceInfo: ctx.device,
        remarks: 'Restored from deleted records',
    });
    bump();
}

export function restoreOldVersion(
    id: string,
    versionNumber: number,
    uploadedBy: string,
    userRole: ComplianceDemoRole
): void {
    const d = _documents.find((x) => x.id === id);
    if (!d || d.deletedAt) return;
    const src = d.versions.find((v) => v.version === versionNumber);
    if (!src) return;
    const maxV = Math.max(0, ...d.versions.map((v) => v.version));
    const next: DocumentVersionRow = {
        ...src,
        version: maxV + 1,
        uploadedAt: nowIso(),
        uploadedBy,
        storageUrl: mockSignedUrl(`restore-${src.fileName}`),
    };
    d.versions = [next, ...d.versions];
    const ctx = clientContext();
    appendAudit({
        userName: uploadedBy,
        userRole: userRole,
        activityType: 'Version',
        documentId: id,
        ipAddress: ctx.ip,
        deviceInfo: ctx.device,
        remarks: `Restored content from v${versionNumber} as v${next.version}`,
    });
    bump();
}

export function logView(id: string, actor: { name: string; role: ComplianceDemoRole }): void {
    const ctx = clientContext();
    appendAudit({
        userName: actor.name,
        userRole: actor.role,
        activityType: 'View',
        documentId: id,
        ipAddress: ctx.ip,
        deviceInfo: ctx.device,
        remarks: 'View / preview',
    });
    bump();
}

export function logDownload(id: string, actor: { name: string; role: ComplianceDemoRole }): void {
    const ctx = clientContext();
    appendAudit({
        userName: actor.name,
        userRole: actor.role,
        activityType: 'Download',
        documentId: id,
        ipAddress: ctx.ip,
        deviceInfo: ctx.device,
        remarks: 'Signed URL download',
    });
    bump();
}

export interface StartESignInput {
    documentId: string;
    signerName: string;
    aadhaar12: string;
    signatureXPercent: number;
    signatureYPercent: number;
}

/** Simulated OTP session (in-memory). */
const _otpSessions = new Map<string, { code: string; expires: number }>();

/** Fixed demo OTP for mock eSign (documented in UI). */
export const DEMO_ESIGN_OTP = '123456';

export function requestOtpForESign(esignId: string): { ok: boolean; message: string } {
    _otpSessions.set(esignId, { code: DEMO_ESIGN_OTP, expires: Date.now() + 120_000 });
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.info(`[demo eSign OTP for ${esignId}]`, DEMO_ESIGN_OTP);
    }
    return { ok: true, message: 'OTP sent to Aadhaar-linked mobile.' };
}

export function verifyOtp(esignId: string, otp: string): boolean {
    const s = _otpSessions.get(esignId);
    if (!s || Date.now() > s.expires) return false;
    return s.code === otp.trim();
}

/**
 * Validates OTP and marks the request as OTP-verified (does not finalize signing).
 * Use {@link finalizeESignAfterReview} after signature placement / review.
 */
export function verifyEsignOtpOnly(
    esignId: string,
    otp: string,
    actor: { name: string; role: ComplianceDemoRole },
): { ok: boolean; error?: string } {
    seedLogs();
    if (!verifyOtp(esignId, otp)) {
        return { ok: false, error: 'Invalid or expired OTP.' };
    }
    const r = _esign.find((e) => e.id === esignId);
    if (!r) return { ok: false, error: 'Request not found.' };
    _esignOtpVerified.add(esignId);
    const ctx = clientContext();
    appendAudit({
        userName: actor.name,
        userRole: actor.role,
        activityType: 'Sign',
        documentId: r.documentId,
        ipAddress: ctx.ip,
        deviceInfo: ctx.device,
        remarks: `eSign OTP verified (${r.transactionId})`,
    });
    bump();
    return { ok: true };
}

export function createESignRequest(
    input: StartESignInput,
    actor: { name: string; role: ComplianceDemoRole }
): ESignRecord {
    seedLogs();
    const doc = getDocumentById(input.documentId);
    const id = `ESIGN-2026-${String(_esign.length + 1).padStart(4, '0')}`;
    const row: ESignRecord = {
        id,
        documentId: input.documentId,
        documentName: doc?.name ?? 'Document',
        signerName: input.signerName.trim(),
        aadhaarMasked: maskAadhaar(input.aadhaar12),
        transactionId: `TXN-AADHAAR-${randomId('txn').slice(-6).toUpperCase()}`,
        status: 'Pending',
        signedAt: null,
        signedStorageUrl: null,
        signatureXPercent: input.signatureXPercent,
        signatureYPercent: input.signatureYPercent,
        signaturePage: 1,
        createdAt: nowIso(),
    };
    _esign = [row, ..._esign];
    requestOtpForESign(id);
    const ctx = clientContext();
    appendAudit({
        userName: actor.name,
        userRole: actor.role,
        activityType: 'Sign',
        documentId: input.documentId,
        ipAddress: ctx.ip,
        deviceInfo: ctx.device,
        remarks: `eSign initiated — ${row.transactionId}`,
    });
    bump();

    return row;
}

/** Update document / signer for a pending eSign (demo: Aadhaar cannot be changed once set — masked in UI). */
export function updateESignRequestMeta(
    esignId: string,
    input: { documentId: string; signerName: string },
    actor: { name: string; role: ComplianceDemoRole },
): { ok: boolean; error?: string; record?: ESignRecord } {
    seedLogs();
    const r = _esign.find((e) => e.id === esignId);
    if (!r) return { ok: false, error: 'Request not found.' };
    if (r.status !== 'Pending') {
        return { ok: false, error: 'Only pending requests can be edited.' };
    }
    const doc = getDocumentById(input.documentId);
    r.documentId = input.documentId;
    r.documentName = doc?.name ?? 'Document';
    r.signerName = input.signerName.trim();
    const ctx = clientContext();
    appendAudit({
        userName: actor.name,
        userRole: actor.role,
        activityType: 'Sign',
        documentId: r.documentId,
        ipAddress: ctx.ip,
        deviceInfo: ctx.device,
        remarks: `eSign request updated — ${r.transactionId}`,
    });
    bump();
    return { ok: true, record: { ...r } };
}

/** Persists signature coordinates after OTP verification (staged workflow). */
export function updateESignSignaturePlacement(
    esignId: string,
    signatureXPercent: number,
    signatureYPercent: number,
    signaturePage: number,
    actor: { name: string; role: ComplianceDemoRole },
): { ok: boolean; error?: string } {
    seedLogs();
    const r = _esign.find((e) => e.id === esignId);
    if (!r) return { ok: false, error: 'Request not found.' };
    if (r.status !== 'Pending') return { ok: false, error: 'Request is not pending.' };
    r.signatureXPercent = signatureXPercent;
    r.signatureYPercent = signatureYPercent;
    r.signaturePage = signaturePage;
    const ctx = clientContext();
    appendAudit({
        userName: actor.name,
        userRole: actor.role,
        activityType: 'Sign',
        documentId: r.documentId,
        ipAddress: ctx.ip,
        deviceInfo: ctx.device,
        remarks: `Signature placed — page ${signaturePage} (${r.transactionId})`,
    });
    bump();
    return { ok: true };
}

/**
 * Finalizes a pending eSign after OTP was verified with {@link verifyEsignOtpOnly}
 * and signature coordinates were saved.
 */
export function finalizeESignAfterReview(
    esignId: string,
    actor: { name: string; role: ComplianceDemoRole },
): { ok: boolean; error?: string; record?: ESignRecord } {
    seedLogs();
    if (!_esignOtpVerified.has(esignId)) {
        return { ok: false, error: 'Verify the OTP before confirming.' };
    }
    const r = _esign.find((e) => e.id === esignId);
    if (!r) return { ok: false, error: 'Request not found.' };
    if (r.status !== 'Pending') {
        _esignOtpVerified.delete(esignId);
        return { ok: false, error: 'Request is not in a pending state.' };
    }
    r.status = 'Signed';
    r.signedAt = nowIso();
    r.signedStorageUrl = mockSignedUrl(`signed-${r.documentName}.pdf`);
    _esignOtpVerified.delete(esignId);
    const ctx = clientContext();
    appendAudit({
        userName: actor.name,
        userRole: actor.role,
        activityType: 'Sign',
        documentId: r.documentId,
        ipAddress: ctx.ip,
        deviceInfo: ctx.device,
        remarks: `eSign finalized — document locked (${r.transactionId})`,
    });
    bump();
    return { ok: true, record: { ...r } };
}

/** Single-step verify + finalize (legacy / simple flows). */
export function completeESignAfterOtp(
    esignId: string,
    otp: string,
    actor: { name: string; role: ComplianceDemoRole },
): { ok: boolean; error?: string; record?: ESignRecord } {
    const v = verifyEsignOtpOnly(esignId, otp, actor);
    if (!v.ok) return v;
    return finalizeESignAfterReview(esignId, actor);
}

export function exportAuditCsv(rows: AuditLogEntry[]): string {
    const header = [
        'Timestamp',
        'User',
        'Role',
        'Activity',
        'Document ID',
        'IP',
        'Device',
        'Remarks',
    ];
    const lines = rows.map((r) =>
        [
            r.timestamp,
            r.userName,
            r.userRole,
            r.activityType,
            r.documentId,
            r.ipAddress,
            `"${r.deviceInfo.replace(/"/g, '""')}"`,
            `"${r.remarks.replace(/"/g, '""')}"`,
        ].join(',')
    );
    return [header.join(','), ...lines].join('\n');
}

/** Poll helper for “real-time” UI — call from useEffect. Only bumps when a new alert is added (avoids bump ↔ effect loops). */
export function runExpiryScan(): void {
    seedLogs();
    let added = false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const d of _documents) {
        if (!d.expiryDate || d.deletedAt) continue;
        const ex = new Date(d.expiryDate + 'T00:00:00');
        const days = Math.ceil((ex.getTime() - today.getTime()) / 86400000);
        if (days >= 0 && days <= 30) {
            const exists = _notifications.some(
                (n) => n.documentId === d.id && n.type === 'expiry' && !n.read
            );
            if (!exists) {
                pushNotification({
                    type: 'expiry',
                    title: 'Document expiry alert',
                    message: `${d.name} expires in ${days} day(s).`,
                    read: false,
                    documentId: d.id,
                });
                added = true;
            }
        }
    }
    if (added) bump();
}
