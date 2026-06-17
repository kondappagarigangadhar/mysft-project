'use client';

/**
 * Rental lease agreements — in-memory store shared by Resident Management (admin)
 * and Resident Portal. DocuSign is mocked via envelope IDs + signing routes.
 */

export const LEASE_AGREEMENT_STATUS_OPTIONS = [
    'Draft',
    'Sent',
    'Pending Signature',
    'Viewed',
    'Signed',
    'Expired',
    'Rejected',
] as const;

export type LeaseAgreementStatus = (typeof LEASE_AGREEMENT_STATUS_OPTIONS)[number];

export type LeaseAgreementFile = {
    id: string;
    fileName: string;
    sizeLabel: string;
    mimeType: string;
    uploadedAt: string;
    blobUrl?: string;
};

export type LeaseActivityEntry = {
    id: string;
    at: string;
    actor: string;
    action: string;
    detail?: string;
};

export type RentalLeaseAgreement = {
    id: string;
    agreementCode: string;
    residentSlug: string;
    residentName: string;
    residentEmail: string;
    propertyUnit: string;
    leaseStartDate: string;
    leaseEndDate: string;
    monthlyRent: number;
    securityDeposit: number;
    status: LeaseAgreementStatus;
    agreementName: string;
    agreementFile: LeaseAgreementFile | null;
    signedFile: LeaseAgreementFile | null;
    sentDate: string | null;
    signedDate: string | null;
    signedBy: string | null;
    docusignEnvelopeId: string | null;
    docusignStatus: string | null;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
    activityLog: LeaseActivityEntry[];
};

export type LeasePortalNotification = {
    id: string;
    at: string;
    channel: 'App' | 'Email' | 'SMS' | 'Push';
    title: string;
    message: string;
    read: boolean;
    residentEmail: string;
    agreementId: string;
    kind: 'Lease';
};

export type SendLeaseChannels = {
    email?: boolean;
    portal?: boolean;
    push?: boolean;
    docusign?: boolean;
};

const listeners = new Set<() => void>();

function bump() {
    for (const l of listeners) l();
}

export function subscribeRentalLeaseStore(cb: () => void): () => void {
    listeners.add(cb);
    return () => listeners.delete(cb);
}

function nowIso() {
    return new Date().toISOString();
}

function formatAgreementCode(n: number) {
    return `LSE-${String(n).padStart(5, '0')}`;
}

function formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function logActivity(
    agreement: RentalLeaseAgreement,
    actor: string,
    action: string,
    detail?: string,
): LeaseActivityEntry {
    const entry: LeaseActivityEntry = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        at: nowIso(),
        actor,
        action,
        detail,
    };
    agreement.activityLog = [entry, ...agreement.activityLog];
    return entry;
}

let _nextCode = 10042;
let _agreements: RentalLeaseAgreement[] = [];
let _notifications: LeasePortalNotification[] = [];

function seedAgreement(partial: Omit<RentalLeaseAgreement, 'activityLog'> & { activityLog?: LeaseActivityEntry[] }): RentalLeaseAgreement {
    return {
        ...partial,
        activityLog: partial.activityLog ?? [],
    };
}

const seedNow = nowIso();

_agreements = [
    seedAgreement({
        id: 'lease-ramesh',
        agreementCode: formatAgreementCode(10043),
        residentSlug: 'ramesh-kumar',
        residentName: 'Ramesh Kumar',
        residentEmail: 'ramesh.kumar@example.com',
        propertyUnit: 'Skyline Residency — Unit 101',
        agreementName: 'Residential Lease — Skyline Residency Unit 101',
        leaseStartDate: '2024-06-15',
        leaseEndDate: '2025-06-14',
        monthlyRent: 42000,
        securityDeposit: 84000,
        status: 'Pending Signature',
        agreementFile: {
            id: 'lf-ramesh',
            fileName: 'lease-ramesh-kumar-2024.pdf',
            sizeLabel: '256 KB',
            mimeType: 'application/pdf',
            uploadedAt: seedNow,
        },
        signedFile: null,
        sentDate: '2026-05-22T10:00:00.000Z',
        signedDate: null,
        signedBy: null,
        docusignEnvelopeId: 'DS-ENV-99102',
        docusignStatus: 'sent',
        expiresAt: '2026-06-22T23:59:59.000Z',
        createdAt: '2026-05-20T11:00:00.000Z',
        updatedAt: '2026-05-22T10:00:00.000Z',
        activityLog: [
            {
                id: 'act-ramesh-1',
                at: '2026-05-22T10:00:00.000Z',
                actor: 'Community Manager',
                action: 'Agreement sent',
                detail: 'Email, portal notification, and DocuSign envelope dispatched',
            },
        ],
    }),
    seedAgreement({
        id: 'lease-1',
        agreementCode: formatAgreementCode(10042),
        residentSlug: 'james-nguyen',
        residentName: 'James Nguyen',
        residentEmail: 'james.nguyen@example.com',
        propertyUnit: 'Skyline Courts — Apt 902',
        agreementName: 'Residential Lease — Skyline Courts Apt 902',
        leaseStartDate: '2025-12-01',
        leaseEndDate: '2026-11-30',
        monthlyRent: 28500,
        securityDeposit: 57000,
        status: 'Pending Signature',
        agreementFile: {
            id: 'lf-1',
            fileName: 'lease-james-nguyen-2025.pdf',
            sizeLabel: '248 KB',
            mimeType: 'application/pdf',
            uploadedAt: seedNow,
        },
        signedFile: null,
        sentDate: '2026-05-20T09:15:00.000Z',
        signedDate: null,
        signedBy: null,
        docusignEnvelopeId: 'DS-ENV-88421',
        docusignStatus: 'sent',
        expiresAt: '2026-06-20T23:59:59.000Z',
        createdAt: '2026-05-18T10:00:00.000Z',
        updatedAt: '2026-05-20T09:15:00.000Z',
        activityLog: [
            {
                id: 'act-seed-1',
                at: '2026-05-20T09:15:00.000Z',
                actor: 'Community Manager',
                action: 'Agreement sent',
                detail: 'Email, portal notification, and DocuSign envelope dispatched',
            },
            {
                id: 'act-seed-2',
                at: '2026-05-18T10:00:00.000Z',
                actor: 'Community Manager',
                action: 'Agreement created',
                detail: 'Draft lease prepared for Skyline Courts — Apt 902',
            },
        ],
    }),
    seedAgreement({
        id: 'lease-2',
        agreementCode: formatAgreementCode(10041),
        residentSlug: 'priya-mehta',
        residentName: 'Priya Mehta',
        residentEmail: 'priya.mehta@example.com',
        propertyUnit: 'Riverfront Tower — Unit 1204',
        agreementName: 'Owner Occupancy Agreement — Unit 1204',
        leaseStartDate: '2024-02-01',
        leaseEndDate: '2027-01-31',
        monthlyRent: 0,
        securityDeposit: 0,
        status: 'Signed',
        agreementFile: {
            id: 'lf-2',
            fileName: 'owner-agreement-priya-mehta.pdf',
            sizeLabel: '312 KB',
            mimeType: 'application/pdf',
            uploadedAt: '2025-01-10T08:00:00.000Z',
        },
        signedFile: {
            id: 'lf-2-signed',
            fileName: 'owner-agreement-priya-mehta-signed.pdf',
            sizeLabel: '318 KB',
            mimeType: 'application/pdf',
            uploadedAt: '2025-01-12T14:22:00.000Z',
        },
        sentDate: '2025-01-10T08:00:00.000Z',
        signedDate: '2025-01-12T14:22:00.000Z',
        signedBy: 'Priya Mehta',
        docusignEnvelopeId: 'DS-ENV-77210',
        docusignStatus: 'completed',
        expiresAt: null,
        createdAt: '2025-01-08T11:00:00.000Z',
        updatedAt: '2025-01-12T14:22:00.000Z',
        activityLog: [
            {
                id: 'act-seed-3',
                at: '2025-01-12T14:22:00.000Z',
                actor: 'Priya Mehta',
                action: 'Agreement signed',
                detail: 'DocuSign envelope completed; signed PDF archived',
            },
            {
                id: 'act-seed-4',
                at: '2025-01-10T08:00:00.000Z',
                actor: 'Community Manager',
                action: 'Agreement sent',
                detail: 'Delivered via email and resident portal',
            },
        ],
    }),
    seedAgreement({
        id: 'lease-ananya',
        agreementCode: formatAgreementCode(10040),
        residentSlug: 'ananya-iyer',
        residentName: 'Ananya Iyer',
        residentEmail: 'ananya.iyer@example.com',
        propertyUnit: 'Garden Plaza — Villa 07',
        agreementName: 'Residential Lease — Garden Plaza Villa 07',
        leaseStartDate: '2023-08-10',
        leaseEndDate: '2024-08-09',
        monthlyRent: 32000,
        securityDeposit: 64000,
        status: 'Draft',
        agreementFile: {
            id: 'lf-ananya',
            fileName: 'lease-ananya-iyer-draft.pdf',
            sizeLabel: '198 KB',
            mimeType: 'application/pdf',
            uploadedAt: seedNow,
        },
        signedFile: null,
        sentDate: null,
        signedDate: null,
        signedBy: null,
        docusignEnvelopeId: null,
        docusignStatus: null,
        expiresAt: null,
        createdAt: '2026-04-01T09:00:00.000Z',
        updatedAt: '2026-04-01T09:00:00.000Z',
        activityLog: [
            {
                id: 'act-ananya-1',
                at: '2026-04-01T09:00:00.000Z',
                actor: 'Community Manager',
                action: 'Agreement created',
                detail: 'Draft lease prepared for Garden Plaza — Villa 07',
            },
        ],
    }),
    seedAgreement({
        id: 'lease-oliver',
        agreementCode: formatAgreementCode(10039),
        residentSlug: 'oliver-schmidt',
        residentName: 'Oliver Schmidt',
        residentEmail: 'oliver.schmidt@example.com',
        propertyUnit: 'Marina Views — Penthouse B',
        agreementName: 'Residential Lease — Marina Views Penthouse B',
        leaseStartDate: '2022-05-21',
        leaseEndDate: '2025-02-28',
        monthlyRent: 95000,
        securityDeposit: 190000,
        status: 'Expired',
        agreementFile: {
            id: 'lf-oliver',
            fileName: 'lease-oliver-schmidt-2022.pdf',
            sizeLabel: '274 KB',
            mimeType: 'application/pdf',
            uploadedAt: '2022-05-20T10:00:00.000Z',
        },
        signedFile: {
            id: 'lf-oliver-signed',
            fileName: 'lease-oliver-schmidt-2022-signed.pdf',
            sizeLabel: '281 KB',
            mimeType: 'application/pdf',
            uploadedAt: '2022-05-25T14:00:00.000Z',
        },
        sentDate: '2022-05-20T10:00:00.000Z',
        signedDate: '2022-05-25T14:00:00.000Z',
        signedBy: 'Oliver Schmidt',
        docusignEnvelopeId: 'DS-ENV-55102',
        docusignStatus: 'completed',
        expiresAt: null,
        createdAt: '2022-05-18T11:00:00.000Z',
        updatedAt: '2025-03-01T08:00:00.000Z',
        activityLog: [
            {
                id: 'act-oliver-1',
                at: '2025-02-28T16:00:00.000Z',
                actor: 'Community Manager',
                action: 'Lease expired',
                detail: 'Resident vacated; agreement marked expired',
            },
            {
                id: 'act-oliver-2',
                at: '2022-05-25T14:00:00.000Z',
                actor: 'Oliver Schmidt',
                action: 'Agreement signed',
                detail: 'DocuSign envelope completed',
            },
        ],
    }),
    seedAgreement({
        id: 'lease-maria',
        agreementCode: formatAgreementCode(10038),
        residentSlug: 'maria-lopez',
        residentName: 'Maria Lopez',
        residentEmail: 'maria.lopez@example.com',
        propertyUnit: 'Central Annex — Suite 310',
        agreementName: 'Residential Lease — Central Annex Suite 310',
        leaseStartDate: '2026-01-05',
        leaseEndDate: '2027-01-04',
        monthlyRent: 28500,
        securityDeposit: 57000,
        status: 'Pending Signature',
        agreementFile: {
            id: 'lf-maria',
            fileName: 'lease-maria-lopez-2026.pdf',
            sizeLabel: '241 KB',
            mimeType: 'application/pdf',
            uploadedAt: seedNow,
        },
        signedFile: null,
        sentDate: '2026-05-18T11:30:00.000Z',
        signedDate: null,
        signedBy: null,
        docusignEnvelopeId: 'DS-ENV-90231',
        docusignStatus: 'sent',
        expiresAt: '2026-06-18T23:59:59.000Z',
        createdAt: '2026-05-15T10:00:00.000Z',
        updatedAt: '2026-05-18T11:30:00.000Z',
        activityLog: [
            {
                id: 'act-maria-1',
                at: '2026-05-18T11:30:00.000Z',
                actor: 'Community Manager',
                action: 'Agreement sent',
                detail: 'Email, portal notification, and DocuSign envelope dispatched',
            },
            {
                id: 'act-maria-2',
                at: '2026-05-15T10:00:00.000Z',
                actor: 'Community Manager',
                action: 'Agreement created',
                detail: 'Draft lease prepared for Central Annex — Suite 310',
            },
        ],
    }),
];

_notifications = [
    {
        id: 'ln-ramesh',
        at: '2026-05-22T10:00:00.000Z',
        channel: 'App',
        title: 'Lease agreement ready to sign',
        message: 'Residential Lease — Skyline Residency Unit 101 is awaiting your signature.',
        read: false,
        residentEmail: 'ramesh.kumar@example.com',
        agreementId: 'lease-ramesh',
        kind: 'Lease',
    },
    {
        id: 'ln-1',
        at: '2026-05-20T09:15:00.000Z',
        channel: 'App',
        title: 'Lease agreement ready to sign',
        message: 'Residential Lease — Skyline Courts Apt 902 is awaiting your signature.',
        read: false,
        residentEmail: 'james.nguyen@example.com',
        agreementId: 'lease-1',
        kind: 'Lease',
    },
    {
        id: 'ln-2',
        at: '2026-05-20T09:15:05.000Z',
        channel: 'Email',
        title: 'DocuSign: Please sign your lease',
        message: 'You have been sent a DocuSign signing request for your rental lease.',
        read: true,
        residentEmail: 'james.nguyen@example.com',
        agreementId: 'lease-1',
        kind: 'Lease',
    },
];

export function getLeaseAgreementsForResident(residentSlug: string): RentalLeaseAgreement[] {
    return _agreements
        .filter((a) => a.residentSlug === residentSlug)
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function getLeaseAgreementById(id: string): RentalLeaseAgreement | undefined {
    return _agreements.find((a) => a.id === id);
}

export function isLeaseVisibleInPortal(status: LeaseAgreementStatus): boolean {
    return status !== 'Draft';
}

export function getLeaseAgreementsForPortalEmail(email: string): RentalLeaseAgreement[] {
    return getLeaseAgreementsForPortal({ email });
}

/** Portal list — matches admin resident by email or linked slug; hides drafts. */
export function getLeaseAgreementsForPortal(opts: { email: string; residentSlug?: string }): RentalLeaseAgreement[] {
    const normalized = opts.email.trim().toLowerCase();
    const slug = opts.residentSlug?.trim();
    return _agreements
        .filter((a) => {
            if (!isLeaseVisibleInPortal(a.status)) return false;
            const emailMatch = a.residentEmail.toLowerCase() === normalized;
            const slugMatch = slug ? a.residentSlug === slug : false;
            return emailMatch || slugMatch;
        })
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function residentCanAccessLease(
    agreement: RentalLeaseAgreement,
    opts: { email: string; residentSlug?: string },
): boolean {
    const emailMatch = agreement.residentEmail.toLowerCase() === opts.email.trim().toLowerCase();
    const slugMatch = opts.residentSlug ? agreement.residentSlug === opts.residentSlug : false;
    return emailMatch || slugMatch;
}

export function getLeasePortalNotifications(email: string): LeasePortalNotification[] {
    const normalized = email.trim().toLowerCase();
    return _notifications
        .filter((n) => n.residentEmail.toLowerCase() === normalized)
        .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

export function getUnreadLeaseNotificationCount(email: string): number {
    return getLeasePortalNotifications(email).filter((n) => !n.read).length;
}

export function markLeaseNotificationRead(id: string): void {
    const row = _notifications.find((n) => n.id === id);
    if (row) row.read = true;
    bump();
}

export function markAllLeaseNotificationsRead(email: string): void {
    const normalized = email.trim().toLowerCase();
    for (const n of _notifications) {
        if (n.residentEmail.toLowerCase() === normalized) n.read = true;
    }
    bump();
}

function pushPortalNotification(opts: {
    residentEmail: string;
    agreementId: string;
    title: string;
    message: string;
    channel?: LeasePortalNotification['channel'];
}): void {
    _notifications.unshift({
        id: `ln-${Date.now()}`,
        at: nowIso(),
        channel: opts.channel ?? 'App',
        title: opts.title,
        message: opts.message,
        read: false,
        residentEmail: opts.residentEmail,
        agreementId: opts.agreementId,
        kind: 'Lease',
    });
}

export type CreateLeaseAgreementInput = {
    residentSlug: string;
    residentName: string;
    residentEmail: string;
    propertyUnit: string;
    agreementName: string;
    leaseStartDate: string;
    leaseEndDate: string;
    monthlyRent: number;
    securityDeposit: number;
};

export type UpdateLeaseAgreementInput = Partial<
    Pick<RentalLeaseAgreement, 'agreementName' | 'leaseStartDate' | 'leaseEndDate' | 'monthlyRent' | 'securityDeposit' | 'propertyUnit'>
>;

/** Strict edit — delete/replace file on draft-only workflows. */
export function canEditLeaseAgreement(agreement: RentalLeaseAgreement): boolean {
    return agreement.status === 'Draft' || agreement.status === 'Rejected';
}

/** Workspace inline edit — lease terms while agreement is not executed or expired. */
export function canEditLeaseTerms(agreement: RentalLeaseAgreement): boolean {
    return agreement.status !== 'Signed' && agreement.status !== 'Expired';
}

export function createLeaseAgreement(input: CreateLeaseAgreementInput): RentalLeaseAgreement {
    const code = formatAgreementCode(_nextCode++);
    const iso = nowIso();
    const row: RentalLeaseAgreement = {
        id: `lease-${Date.now()}`,
        agreementCode: code,
        residentSlug: input.residentSlug,
        residentName: input.residentName,
        residentEmail: input.residentEmail,
        propertyUnit: input.propertyUnit,
        agreementName: input.agreementName,
        leaseStartDate: input.leaseStartDate,
        leaseEndDate: input.leaseEndDate,
        monthlyRent: input.monthlyRent,
        securityDeposit: input.securityDeposit,
        status: 'Draft',
        agreementFile: null,
        signedFile: null,
        sentDate: null,
        signedDate: null,
        signedBy: null,
        docusignEnvelopeId: null,
        docusignStatus: null,
        expiresAt: null,
        createdAt: iso,
        updatedAt: iso,
        activityLog: [],
    };
    logActivity(row, 'Community Manager', 'Agreement created', `Draft ${code} created`);
    _agreements.unshift(row);
    bump();
    return row;
}

export function updateLeaseAgreement(
    agreementId: string,
    patch: UpdateLeaseAgreementInput,
): { ok: boolean; error?: string; agreement?: RentalLeaseAgreement } {
    const row = getLeaseAgreementById(agreementId);
    if (!row) return { ok: false, error: 'Agreement not found' };
    if (!canEditLeaseTerms(row)) {
        return { ok: false, error: `Cannot edit agreement in ${row.status} status` };
    }

    if (patch.agreementName !== undefined) row.agreementName = patch.agreementName.trim() || row.agreementName;
    if (patch.propertyUnit !== undefined) row.propertyUnit = patch.propertyUnit;
    if (patch.leaseStartDate !== undefined) row.leaseStartDate = patch.leaseStartDate;
    if (patch.leaseEndDate !== undefined) row.leaseEndDate = patch.leaseEndDate;
    if (patch.monthlyRent !== undefined) row.monthlyRent = patch.monthlyRent;
    if (patch.securityDeposit !== undefined) row.securityDeposit = patch.securityDeposit;
    row.updatedAt = nowIso();
    logActivity(row, 'Community Manager', 'Agreement updated', 'Lease terms revised');
    bump();
    return { ok: true, agreement: row };
}

export function uploadLeaseAgreementFile(
    agreementId: string,
    file: File,
): { ok: boolean; error?: string; agreement?: RentalLeaseAgreement } {
    const row = getLeaseAgreementById(agreementId);
    if (!row) return { ok: false, error: 'Agreement not found' };
    if (row.status === 'Signed') return { ok: false, error: 'Cannot replace file on a signed agreement' };

    row.agreementFile = {
        id: `lf-${Date.now()}`,
        fileName: file.name,
        sizeLabel: formatFileSize(file.size),
        mimeType: file.type || 'application/pdf',
        uploadedAt: nowIso(),
        blobUrl: URL.createObjectURL(file),
    };
    row.updatedAt = nowIso();
    logActivity(row, 'Community Manager', 'Agreement file uploaded', file.name);
    bump();
    return { ok: true, agreement: row };
}

export function attachLeaseGeneratedPdf(agreementId: string): { ok: boolean; agreement?: RentalLeaseAgreement } {
    const row = getLeaseAgreementById(agreementId);
    if (!row) return { ok: false };
    row.agreementFile = {
        id: `lf-gen-${Date.now()}`,
        fileName: `${row.agreementCode}-lease-draft.pdf`,
        sizeLabel: '186 KB',
        mimeType: 'application/pdf',
        uploadedAt: nowIso(),
    };
    ensureLeaseDocumentBlob(agreementId, false);
    row.updatedAt = nowIso();
    logActivity(row, 'System', 'Lease PDF generated', 'Auto-generated from lease terms');
    bump();
    return { ok: true, agreement: row };
}

/** Ensures agreement/signed file has a blob URL for open/preview in the portal. */
export function ensureLeaseDocumentBlob(agreementId: string, signed = false): string | null {
    const row = getLeaseAgreementById(agreementId);
    if (!row) return null;
    const file = signed ? row.signedFile : row.agreementFile;
    if (!file) return null;
    if (file.blobUrl) return file.blobUrl;
    const content = downloadLeasePdfContent(row, signed);
    file.blobUrl = URL.createObjectURL(new Blob([content], { type: file.mimeType || 'application/pdf' }));
    bump();
    return file.blobUrl;
}

export function sendLeaseAgreement(
    agreementId: string,
    channels: SendLeaseChannels = { email: true, portal: true, push: false, docusign: true },
): { ok: boolean; error?: string; agreement?: RentalLeaseAgreement } {
    const row = getLeaseAgreementById(agreementId);
    if (!row) return { ok: false, error: 'Agreement not found' };
    if (!row.agreementFile) return { ok: false, error: 'Upload or generate an agreement file before sending' };
    ensureLeaseDocumentBlob(agreementId, false);

    const sent = nowIso();
    const isResend = Boolean(row.sentDate);
    const expiry = new Date(Date.now() + 30 * 86400000).toISOString();
    row.sentDate = sent;
    row.expiresAt = expiry;
    row.status = channels.docusign !== false ? 'Pending Signature' : 'Sent';
    row.docusignEnvelopeId = `DS-ENV-${Math.floor(10000 + Math.random() * 89999)}`;
    row.docusignStatus = 'sent';
    row.updatedAt = sent;

    const channelNotes: string[] = [];
    if (channels.email !== false) channelNotes.push('email');
    if (channels.portal !== false) channelNotes.push('resident portal');
    if (channels.push) channelNotes.push('push');
    if (channels.docusign !== false) channelNotes.push('DocuSign');

    logActivity(
        row,
        'Community Manager',
        isResend ? 'Agreement resent' : 'Agreement sent',
        `Delivered via ${channelNotes.join(', ')}`,
    );

    if (channels.portal !== false) {
        pushPortalNotification({
            residentEmail: row.residentEmail,
            agreementId: row.id,
            title: 'New lease agreement to review',
            message: `${row.agreementName} has been sent for your review and signature.`,
            channel: 'App',
        });
    }
    if (channels.email !== false) {
        pushPortalNotification({
            residentEmail: row.residentEmail,
            agreementId: row.id,
            title: 'Lease agreement email sent',
            message: `A copy of ${row.agreementName} was emailed to ${row.residentEmail}.`,
            channel: 'Email',
        });
    }
    if (channels.docusign !== false) {
        pushPortalNotification({
            residentEmail: row.residentEmail,
            agreementId: row.id,
            title: 'DocuSign: Please sign your lease',
            message: 'Open Review & Sign to complete your digital signature via DocuSign.',
            channel: 'Email',
        });
    }
    if (channels.push) {
        pushPortalNotification({
            residentEmail: row.residentEmail,
            agreementId: row.id,
            title: 'Lease signature reminder',
            message: 'Your rental lease is pending signature.',
            channel: 'Push',
        });
    }

    bump();
    return { ok: true, agreement: row };
}

export function resendLeaseAgreement(agreementId: string): ReturnType<typeof sendLeaseAgreement> {
    return sendLeaseAgreement(agreementId, { email: true, portal: true, push: true, docusign: true });
}

export function markLeaseAgreementViewed(agreementId: string, viewedBy: string): RentalLeaseAgreement | undefined {
    const row = getLeaseAgreementById(agreementId);
    if (!row) return undefined;
    if (row.status === 'Signed' || row.status === 'Expired' || row.status === 'Rejected') return row;

    if (row.status === 'Pending Signature' || row.status === 'Sent') {
        row.status = 'Viewed';
        row.docusignStatus = 'delivered';
        row.updatedAt = nowIso();
        logActivity(row, viewedBy, 'Agreement viewed', 'Tenant opened the lease in resident portal');
        bump();
    }
    return row;
}

export function rejectLeaseAgreement(agreementId: string, reason?: string): RentalLeaseAgreement | undefined {
    const row = getLeaseAgreementById(agreementId);
    if (!row) return undefined;
    row.status = 'Rejected';
    row.docusignStatus = 'declined';
    row.updatedAt = nowIso();
    logActivity(row, row.residentName, 'Agreement rejected', reason ?? 'Tenant declined to sign');
    bump();
    return row;
}

/** Simulates DocuSign webhook / tenant completing signature. */
export function completeLeaseSigning(
    agreementId: string,
    signedBy: string,
): { ok: boolean; error?: string; agreement?: RentalLeaseAgreement } {
    const row = getLeaseAgreementById(agreementId);
    if (!row) return { ok: false, error: 'Agreement not found' };
    if (row.status === 'Signed') return { ok: true, agreement: row };
    if (row.status === 'Expired' || row.status === 'Rejected') {
        return { ok: false, error: `Cannot sign agreement in ${row.status} status` };
    }

    const signed = nowIso();
    row.status = 'Signed';
    row.signedDate = signed;
    row.signedBy = signedBy;
    row.docusignStatus = 'completed';
    row.updatedAt = signed;
    row.signedFile = {
        id: `lf-signed-${Date.now()}`,
        fileName: (row.agreementFile?.fileName.replace(/\.pdf$/i, '') ?? row.agreementCode) + '-signed.pdf',
        sizeLabel: row.agreementFile?.sizeLabel ?? '200 KB',
        mimeType: 'application/pdf',
        uploadedAt: signed,
    };
    ensureLeaseDocumentBlob(agreementId, true);

    logActivity(row, signedBy, 'Agreement signed', 'DocuSign envelope completed; signed PDF archived');

    pushPortalNotification({
        residentEmail: row.residentEmail,
        agreementId: row.id,
        title: 'Lease signed successfully',
        message: `${row.agreementName} is fully executed. Your signed copy is available in Documents.`,
        channel: 'App',
    });

    bump();
    return { ok: true, agreement: row };
}

export function getLeaseAgreementViewUrl(agreementId: string): string {
    return `/resident/documents/lease/${encodeURIComponent(agreementId)}`;
}

/** DocuSign signing URL — opens portal lease page in sign mode. */
export function getDocuSignSigningUrl(agreementId: string): string {
    return `${getLeaseAgreementViewUrl(agreementId)}?mode=sign`;
}

export function createAndSendLeaseAgreement(
    input: CreateLeaseAgreementInput,
    channels?: SendLeaseChannels,
): { ok: boolean; error?: string; agreement?: RentalLeaseAgreement } {
    const row = createLeaseAgreement(input);
    attachLeaseGeneratedPdf(row.id);
    return sendLeaseAgreement(row.id, channels);
}

export function simulateDocuSignWebhook(agreementId: string, event: 'viewed' | 'signed' | 'declined'): RentalLeaseAgreement | undefined {
    const row = getLeaseAgreementById(agreementId);
    if (!row) return undefined;

    if (event === 'viewed') {
        markLeaseAgreementViewed(agreementId, row.residentName);
        return getLeaseAgreementById(agreementId);
    }
    if (event === 'declined') {
        return rejectLeaseAgreement(agreementId, 'Declined via DocuSign');
    }
    completeLeaseSigning(agreementId, row.residentName);
    return getLeaseAgreementById(agreementId);
}

export function leaseStatusBadgeClass(status: LeaseAgreementStatus): string {
    switch (status) {
        case 'Draft':
            return 'bg-slate-100 text-slate-800';
        case 'Sent':
            return 'bg-sky-100 text-sky-950';
        case 'Pending Signature':
            return 'bg-amber-100 text-amber-950';
        case 'Viewed':
            return 'bg-violet-100 text-violet-950';
        case 'Signed':
            return 'bg-emerald-100 text-emerald-950';
        case 'Expired':
            return 'bg-rose-100 text-rose-950';
        case 'Rejected':
            return 'bg-red-100 text-red-900';
        default:
            return 'bg-slate-100 text-slate-800';
    }
}

export function isLeaseExpiringSoon(agreement: RentalLeaseAgreement): boolean {
    if (!agreement.expiresAt || agreement.status === 'Signed') return false;
    const exp = Date.parse(agreement.expiresAt);
    if (Number.isNaN(exp)) return false;
    const days = (exp - Date.now()) / 86400000;
    return days >= 0 && days <= 7;
}

export function formatLeaseCurrency(amount: number): string {
    if (amount <= 0) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function formatLeasePeriod(start: string, end: string): string {
    try {
        const s = new Date(start);
        const e = new Date(end);
        const fmt = (d: Date) =>
            d.toLocaleDateString(undefined, { month: 'short', year: 'numeric', day: 'numeric' });
        return `${fmt(s)} – ${fmt(e)}`;
    } catch {
        return `${start} – ${end}`;
    }
}

export function downloadLeasePdfContent(agreement: RentalLeaseAgreement, signed = false): string {
    const label = signed ? 'SIGNED COPY' : 'DRAFT';
    return [
        `Rental Lease Agreement — ${label}`,
        `Agreement ID: ${agreement.agreementCode}`,
        `Resident: ${agreement.residentName}`,
        `Property: ${agreement.propertyUnit}`,
        `Lease period: ${agreement.leaseStartDate} to ${agreement.leaseEndDate}`,
        `Monthly rent: ${formatLeaseCurrency(agreement.monthlyRent)}`,
        `Security deposit: ${formatLeaseCurrency(agreement.securityDeposit)}`,
        `Status: ${agreement.status}`,
        signed && agreement.signedDate ? `Signed: ${agreement.signedDate} by ${agreement.signedBy}` : '',
        '',
        '— Demo PDF content generated by mySFT —',
    ]
        .filter(Boolean)
        .join('\n');
}

export function buildLeasePreviewHtml(agreement: RentalLeaseAgreement, signed = false): string {
    const stamp = signed
        ? `<div style="margin-top:24px;padding:12px 16px;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;color:#065f46;font-weight:600;">Digitally signed by ${agreement.signedBy ?? 'Tenant'} · ${agreement.signedDate ? new Date(agreement.signedDate).toLocaleString() : ''}</div>`
        : '';
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
      body{font-family:Georgia,serif;color:#0f172a;line-height:1.55;margin:0;padding:32px;background:#fff}
      h1{font-size:22px;margin:0 0 8px} .meta{font-size:13px;color:#64748b;margin-bottom:24px}
      .section{margin-bottom:20px} .label{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8}
      .value{font-size:15px;font-weight:600;margin-top:4px} table{width:100%;border-collapse:collapse;margin-top:16px}
      td,th{border:1px solid #e2e8f0;padding:10px 12px;text-align:left;font-size:13px}
      th{background:#f8fafc;font-weight:600}
    </style></head><body>
      <h1>${agreement.agreementName}</h1>
      <p class="meta">${agreement.agreementCode} · ${signed ? 'Executed copy' : 'Pending signature'}</p>
      <div class="section"><div class="label">Resident</div><div class="value">${agreement.residentName}</div></div>
      <div class="section"><div class="label">Property / Unit</div><div class="value">${agreement.propertyUnit}</div></div>
      <table><tr><th>Lease start</th><th>Lease end</th><th>Monthly rent</th><th>Security deposit</th></tr>
      <tr><td>${agreement.leaseStartDate}</td><td>${agreement.leaseEndDate}</td><td>${formatLeaseCurrency(agreement.monthlyRent)}</td><td>${formatLeaseCurrency(agreement.securityDeposit)}</td></tr></table>
      <p style="margin-top:28px;font-size:13px;color:#475569">This rental lease agreement is issued by the community management. The tenant agrees to comply with community bylaws, payment schedules, and occupancy rules for the stated lease period.</p>
      ${stamp}
    </body></html>`;
}

export function triggerLeasePdfDownload(agreement: RentalLeaseAgreement, signed = false): void {
    const content = downloadLeasePdfContent(agreement, signed);
    const blob = new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = signed
        ? agreement.signedFile?.fileName ?? `${agreement.agreementCode}-signed.pdf`
        : agreement.agreementFile?.fileName ?? `${agreement.agreementCode}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
}
