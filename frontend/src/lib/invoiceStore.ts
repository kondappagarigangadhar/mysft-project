'use client';

import { vendors as mockVendors } from '@/data/mockData';
import { getPurchaseOrdersByPrSlug } from '@/lib/purchaseOrderStore';

/**
 * Invoice & Payment Tracking — client-side mock store.
 *
 * Mirrors the architectural shape of `workOrderStore.ts` and `leadStore.ts`:
 *  - In-memory singleton hydrated from localStorage
 *  - Versioned schema key
 *  - CRUD + archive/restore + duplicate
 *  - Record-local `activityLog` for the History tab
 *  - Sub-collections for payment ledger entries, attachments, notification toggles
 *
 * Stored under `arris-invoices-v1`. Server-shape compatible.
 */

/* -------------------------------------------------------------------------- */
/*  Domain types                                                              */
/* -------------------------------------------------------------------------- */

export type InvoicePartyType = 'Vendor' | 'Supplier';
export type InvoiceCurrency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

export type InvoiceValidationStatus = 'Pending' | 'Approved' | 'Rejected';
export type InvoicePaymentStatus = 'Pending' | 'Partial' | 'Paid';
export type InvoiceExportStatus = 'Not Exported' | 'Queued' | 'Exported' | 'Failed';

export type InvoicePaymentMode = 'Bank Transfer' | 'UPI' | 'Cheque' | 'Cash' | 'Card' | 'Other';

export type InvoiceAttachmentCategory =
    | 'Invoice PDF'
    | 'Supporting Document'
    | 'Compliance'
    | 'Payment Proof'
    | 'Other';

export type InvoiceAttachment = {
    id: string;
    category: InvoiceAttachmentCategory;
    fileName: string;
    sizeLabel: string;
    mimeType: string;
    /** Data URL or remote URL for preview/download. */
    url: string;
    uploadedAt: string; // ISO
    uploadedBy: string;
    /** Version number — increments when a file with the same fileName is replaced. */
    version: number;
};

export type InvoicePaymentEntry = {
    id: string;
    paymentDate: string; // YYYY-MM-DD
    amount: number;
    mode: InvoicePaymentMode;
    transactionRef: string;
    remarks: string;
    recordedBy: string;
    recordedAt: string; // ISO
};

export type InvoiceValidation = {
    status: InvoiceValidationStatus;
    validatedBy: string;
    validatedAt: string; // ISO
    /** General audit remarks captured for every decision (required on save). */
    remarks: string;
    /** Reason for rejection — kept separate so legacy data is still readable when present. */
    rejectionRemarks: string;
};

export type InvoiceNotificationSettings = {
    notifyVendor: boolean;
    paymentReminder: boolean;
    dueReminder: boolean;
    validationAlert: boolean;
    exportAlert: boolean;
    channelEmail: boolean;
    channelSms: boolean;
    channelInApp: boolean;
};

export type InvoiceActivityEntry = {
    id: string;
    at: string; // ISO
    actor: string;
    title: string;
    body?: string;
    actionType?: string;
    severity?: 'info' | 'success' | 'warning' | 'critical';
};

export type Invoice = {
    /** Internal numeric id (also drives `invoiceId` like INV-1001). */
    id: number;
    /** Stable URL slug. */
    slug: string;
    /** Display code (e.g. `INV-1001`). */
    invoiceId: string;
    /** Vendor/Supplier-provided invoice number (their reference). */
    invoiceNumber: string;

    /** Company that received the invoice (i.e. the buying company). */
    companyName: string;
    /** Counterparty kind. */
    partyType: InvoicePartyType;
    /** Vendor or supplier name (counterparty). */
    partyName: string;

    /** Linked project name (matches projectsInventoryStore.project_name). */
    linkedProject: string;
    /** Linked work order id (e.g. WO-1003). Blank when unlinked. */
    linkedWorkOrderId: string;
    /** Linked purchase order number. */
    linkedPurchaseOrder: string;
    /** Purchase request slug when invoice is linked from procurement. */
    linkedPrSlug: string;
    /** Display PR number (e.g. PR-2026-1001). */
    linkedPrNumber: string;
    /** Linked payment id from the ledger. Free-text for now. */
    linkedPaymentId: string;

    invoiceDate: string; // YYYY-MM-DD
    dueDate: string; // YYYY-MM-DD

    currency: InvoiceCurrency;
    invoiceAmount: number;
    taxAmount: number;
    totalAmount: number;

    notes: string;

    paidAmount: number;
    balanceAmount: number;
    paymentStatus: InvoicePaymentStatus;
    primaryPaymentMode: InvoicePaymentMode | '';
    primaryTransactionRef: string;

    validation: InvoiceValidation;

    exportStatus: InvoiceExportStatus;
    lastExportedAt: string | null;

    assignedFinanceUser: string;

    payments: InvoicePaymentEntry[];
    attachments: InvoiceAttachment[];
    notifications: InvoiceNotificationSettings;

    activityLog: InvoiceActivityEntry[];

    createdAt: string; // ISO
    updatedAt: string; // ISO

    /** Soft-archive — ISO timestamp when archived (hidden from default lists). */
    archivedAt: string | null;
};

/* -------------------------------------------------------------------------- */
/*  Constants & options                                                       */
/* -------------------------------------------------------------------------- */

export const INVOICE_CURRENCIES: InvoiceCurrency[] = ['INR', 'USD', 'EUR', 'GBP', 'AED'];
export const INVOICE_VALIDATION_STATUSES: InvoiceValidationStatus[] = ['Pending', 'Approved', 'Rejected'];
export const INVOICE_PAYMENT_STATUSES: InvoicePaymentStatus[] = ['Pending', 'Partial', 'Paid'];
export const INVOICE_EXPORT_STATUSES: InvoiceExportStatus[] = ['Not Exported', 'Queued', 'Exported', 'Failed'];
export const INVOICE_PAYMENT_MODES: InvoicePaymentMode[] = ['Bank Transfer', 'UPI', 'Cheque', 'Cash', 'Card', 'Other'];
export const INVOICE_PARTY_TYPES: InvoicePartyType[] = ['Vendor', 'Supplier'];

const STORAGE_KEY = 'arris-invoices-v1';
const INVOICE_CODE_BASE = 1000;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function nowIso() {
    return new Date().toISOString();
}

const toYmd = (d: Date) => d.toISOString().slice(0, 10);

function safeJsonParse<T>(raw: string | null): T | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

function slugify(input: string) {
    return input
        .trim()
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function ensureUniqueSlug(base: string, existing: Invoice[]): string {
    const b = base.trim() || 'invoice';
    if (!existing.some((x) => x.slug === b)) return b;
    let i = 2;
    while (existing.some((x) => x.slug === `${b}-${i}`)) i++;
    return `${b}-${i}`;
}

export function formatInvoiceCode(id: number) {
    const n = Math.max(0, Math.floor(id));
    return `INV-${String(INVOICE_CODE_BASE + n)}`;
}

function toFiniteNumber(v: unknown): number {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : 0;
}

/** Compute paymentStatus from amounts. */
export function deriveInvoicePaymentStatus(
    totalAmount: number,
    paidAmount: number,
): InvoicePaymentStatus {
    const total = Math.max(0, toFiniteNumber(totalAmount));
    const paid = Math.max(0, toFiniteNumber(paidAmount));
    if (total > 0 && paid >= total) return 'Paid';
    if (paid > 0) return 'Partial';
    return 'Pending';
}

/** Compute balance = total − paid (clamped >= 0). */
export function deriveInvoiceBalance(totalAmount: number, paidAmount: number): number {
    const total = Math.max(0, toFiniteNumber(totalAmount));
    const paid = Math.max(0, toFiniteNumber(paidAmount));
    return Math.max(0, total - paid);
}

/** Sum a payment ledger. */
export function sumInvoicePayments(payments: InvoicePaymentEntry[] | undefined | null): number {
    if (!Array.isArray(payments)) return 0;
    return payments.reduce((sum, p) => sum + Math.max(0, toFiniteNumber(p.amount)), 0);
}

export function isInvoiceOverdue(invoice: Pick<Invoice, 'dueDate' | 'paymentStatus'>): boolean {
    if (invoice.paymentStatus === 'Paid') return false;
    const d = invoice.dueDate?.trim();
    if (!d) return false;
    const due = new Date(`${d}T23:59:59.000Z`);
    if (Number.isNaN(due.getTime())) return false;
    return Date.now() > due.getTime();
}

/* -------------------------------------------------------------------------- */
/*  Hydration & persistence                                                   */
/* -------------------------------------------------------------------------- */

function hydrateFromLocalStorage(): Invoice[] {
    if (typeof window === 'undefined') return [];
    const parsed = safeJsonParse<Invoice[]>(window.localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((raw) => normalizeInvoice(raw));
}

function persistToLocalStorage(all: Invoice[]) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        window.dispatchEvent(new Event('arris-invoices-updated'));
    } catch {
        // ignore quota
    }
}

function normalizeInvoice(raw: any): Invoice {
    const total = toFiniteNumber(raw?.totalAmount ?? raw?.invoiceAmount ?? 0);
    const paid = toFiniteNumber(raw?.paidAmount ?? 0);
    return {
        id: toFiniteNumber(raw?.id),
        slug: String(raw?.slug ?? ''),
        invoiceId: String(raw?.invoiceId ?? formatInvoiceCode(toFiniteNumber(raw?.id))),
        invoiceNumber: String(raw?.invoiceNumber ?? ''),
        companyName: String(raw?.companyName ?? ''),
        partyType: (raw?.partyType === 'Supplier' ? 'Supplier' : 'Vendor') as InvoicePartyType,
        partyName: String(raw?.partyName ?? ''),
        linkedProject: String(raw?.linkedProject ?? ''),
        linkedWorkOrderId: String(raw?.linkedWorkOrderId ?? ''),
        linkedPurchaseOrder: String(raw?.linkedPurchaseOrder ?? ''),
        linkedPrSlug: String(raw?.linkedPrSlug ?? ''),
        linkedPrNumber: String(raw?.linkedPrNumber ?? ''),
        linkedPaymentId: String(raw?.linkedPaymentId ?? ''),
        invoiceDate: String(raw?.invoiceDate ?? ''),
        dueDate: String(raw?.dueDate ?? ''),
        currency: (INVOICE_CURRENCIES.includes(raw?.currency) ? raw.currency : 'INR') as InvoiceCurrency,
        invoiceAmount: toFiniteNumber(raw?.invoiceAmount),
        taxAmount: toFiniteNumber(raw?.taxAmount),
        totalAmount: total,
        notes: String(raw?.notes ?? ''),
        paidAmount: paid,
        balanceAmount: toFiniteNumber(raw?.balanceAmount ?? deriveInvoiceBalance(total, paid)),
        paymentStatus: (INVOICE_PAYMENT_STATUSES.includes(raw?.paymentStatus)
            ? raw.paymentStatus
            : deriveInvoicePaymentStatus(total, paid)) as InvoicePaymentStatus,
        primaryPaymentMode: (INVOICE_PAYMENT_MODES.includes(raw?.primaryPaymentMode)
            ? raw.primaryPaymentMode
            : '') as InvoicePaymentMode | '',
        primaryTransactionRef: String(raw?.primaryTransactionRef ?? ''),
        validation: {
            status: (INVOICE_VALIDATION_STATUSES.includes(raw?.validation?.status)
                ? raw.validation.status
                : 'Pending') as InvoiceValidationStatus,
            validatedBy: String(raw?.validation?.validatedBy ?? ''),
            validatedAt: String(raw?.validation?.validatedAt ?? ''),
            remarks: String(raw?.validation?.remarks ?? ''),
            rejectionRemarks: String(raw?.validation?.rejectionRemarks ?? ''),
        },
        exportStatus: (INVOICE_EXPORT_STATUSES.includes(raw?.exportStatus)
            ? raw.exportStatus
            : 'Not Exported') as InvoiceExportStatus,
        lastExportedAt: raw?.lastExportedAt ?? null,
        assignedFinanceUser: String(raw?.assignedFinanceUser ?? ''),
        payments: Array.isArray(raw?.payments)
            ? raw.payments.map((p: any) => ({
                  id: String(p?.id ?? `pmt-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`),
                  paymentDate: String(p?.paymentDate ?? ''),
                  amount: toFiniteNumber(p?.amount),
                  mode: (INVOICE_PAYMENT_MODES.includes(p?.mode) ? p.mode : 'Bank Transfer') as InvoicePaymentMode,
                  transactionRef: String(p?.transactionRef ?? ''),
                  remarks: String(p?.remarks ?? ''),
                  recordedBy: String(p?.recordedBy ?? 'You'),
                  recordedAt: String(p?.recordedAt ?? nowIso()),
              }))
            : [],
        attachments: Array.isArray(raw?.attachments)
            ? raw.attachments.map((a: any) => ({
                  id: String(a?.id ?? `att-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`),
                  category: ((['Invoice PDF', 'Supporting Document', 'Compliance', 'Payment Proof', 'Other'].includes(
                      a?.category,
                  )
                      ? a.category
                      : 'Other') as InvoiceAttachmentCategory),
                  fileName: String(a?.fileName ?? 'attachment'),
                  sizeLabel: String(a?.sizeLabel ?? ''),
                  mimeType: String(a?.mimeType ?? 'application/octet-stream'),
                  url: String(a?.url ?? ''),
                  uploadedAt: String(a?.uploadedAt ?? nowIso()),
                  uploadedBy: String(a?.uploadedBy ?? 'You'),
                  version: toFiniteNumber(a?.version ?? 1),
              }))
            : [],
        notifications: {
            notifyVendor: Boolean(raw?.notifications?.notifyVendor ?? true),
            paymentReminder: Boolean(raw?.notifications?.paymentReminder ?? true),
            dueReminder: Boolean(raw?.notifications?.dueReminder ?? true),
            validationAlert: Boolean(raw?.notifications?.validationAlert ?? true),
            exportAlert: Boolean(raw?.notifications?.exportAlert ?? false),
            channelEmail: Boolean(raw?.notifications?.channelEmail ?? true),
            channelSms: Boolean(raw?.notifications?.channelSms ?? false),
            channelInApp: Boolean(raw?.notifications?.channelInApp ?? true),
        },
        activityLog: Array.isArray(raw?.activityLog) ? raw.activityLog : [],
        createdAt: String(raw?.createdAt ?? nowIso()),
        updatedAt: String(raw?.updatedAt ?? raw?.createdAt ?? nowIso()),
        archivedAt: raw?.archivedAt ?? null,
    };
}

/* -------------------------------------------------------------------------- */
/*  Seed data                                                                 */
/* -------------------------------------------------------------------------- */

function getDemoVendorList(): { name: string; type: InvoicePartyType }[] {
    const out: { name: string; type: InvoicePartyType }[] = [];
    (mockVendors ?? []).forEach((v) => {
        const n = v?.name?.trim();
        if (!n) return;
        out.push({ name: n, type: 'Vendor' });
    });
    // Synthetic suppliers (procurement-side counterparties)
    const suppliers = ['Cement Bazaar Co.', 'Apex Steel Suppliers', 'BluePlumb Imports', 'BrightLite Wholesale'];
    suppliers.forEach((s) => out.push({ name: s, type: 'Supplier' }));
    out.push({ name: 'MetroBuild Materials Pvt Ltd', type: 'Supplier' });
    out.push({ name: 'FinishCraft Traders', type: 'Supplier' });
    out.push({ name: 'AquaFlow Plumbing Co', type: 'Supplier' });
    return out;
}

function parseLinkedPoNumbersFromInvoice(raw: string): string[] {
    return raw
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
}

function buildSeedInvoices(): Invoice[] {
    const seeded: Invoice[] = [];
    const baseNow = new Date();
    const parties = getDemoVendorList();
    const projects = ['Skyline Residency', 'Urban Flux Apartments', 'Summit Woods'];
    const financeUsers = ['Sneha Patil', 'Rohit Bansal', 'Amit Mehra', 'Priya Sharma'];
    const companyName = 'Requanto Realty Pvt Ltd';

    const fixtures: Array<{
        title: string;
        invoiceAmount: number;
        taxAmount: number;
        daysAgo: number;
        dueOffsetDays: number;
        partyIdx: number;
        projectIdx: number;
        workOrderIdx: number;
        validation: InvoiceValidationStatus;
        payments: Array<{ amount: number; mode: InvoicePaymentMode; daysAgo: number; ref: string }>;
        exportStatus: InvoiceExportStatus;
        financeUserIdx: number;
        notes: string;
    }> = [
        {
            title: 'Plumbing materials — Tower A',
            invoiceAmount: 185000,
            taxAmount: 33300,
            daysAgo: 12,
            dueOffsetDays: 30,
            partyIdx: 0,
            projectIdx: 0,
            workOrderIdx: 1,
            validation: 'Approved',
            payments: [
                { amount: 100000, mode: 'Bank Transfer', daysAgo: 6, ref: 'UTR998871' },
                { amount: 50000, mode: 'UPI', daysAgo: 3, ref: 'UPI772341' },
            ],
            exportStatus: 'Exported',
            financeUserIdx: 0,
            notes: 'Bulk pipes + fittings for plumbing remediation work.',
        },
        {
            title: 'Electrical panel inspection — Block C',
            invoiceAmount: 92000,
            taxAmount: 16560,
            daysAgo: 7,
            dueOffsetDays: 21,
            partyIdx: 1,
            projectIdx: 1,
            workOrderIdx: 7,
            validation: 'Pending',
            payments: [],
            exportStatus: 'Not Exported',
            financeUserIdx: 1,
            notes: 'Annual safety audit — to be approved by Ops Lead.',
        },
        {
            title: 'HVAC duct cleaning — Phase 2',
            invoiceAmount: 240500,
            taxAmount: 43290,
            daysAgo: 21,
            dueOffsetDays: 30,
            partyIdx: 2,
            projectIdx: 2,
            workOrderIdx: 4,
            validation: 'Approved',
            payments: [{ amount: 283790, mode: 'Cheque', daysAgo: 10, ref: 'CHQ102301' }],
            exportStatus: 'Exported',
            financeUserIdx: 0,
            notes: 'Full payment cleared. Duct images attached.',
        },
        {
            title: 'Cement consignment — March',
            invoiceAmount: 415000,
            taxAmount: 74700,
            daysAgo: 5,
            dueOffsetDays: 45,
            partyIdx: 5,
            projectIdx: 0,
            workOrderIdx: 2,
            validation: 'Approved',
            payments: [{ amount: 200000, mode: 'Bank Transfer', daysAgo: 2, ref: 'UTR110923' }],
            exportStatus: 'Queued',
            financeUserIdx: 2,
            notes: '500 bags Grade-A cement. Truck #MH04 AB 1102.',
        },
        {
            title: 'Lobby paint touch-up — Tower B',
            invoiceAmount: 68000,
            taxAmount: 12240,
            daysAgo: 32,
            dueOffsetDays: 15,
            partyIdx: 3,
            projectIdx: 1,
            workOrderIdx: 3,
            validation: 'Rejected',
            payments: [],
            exportStatus: 'Failed',
            financeUserIdx: 3,
            notes: 'Rejected: BOQ rate mismatch. Vendor to resubmit revised invoice.',
        },
        {
            title: 'Site debris removal — Q1',
            invoiceAmount: 55000,
            taxAmount: 9900,
            daysAgo: 18,
            dueOffsetDays: 30,
            partyIdx: 4,
            projectIdx: 2,
            workOrderIdx: 9,
            validation: 'Approved',
            payments: [{ amount: 30000, mode: 'UPI', daysAgo: 9, ref: 'UPI881144' }],
            exportStatus: 'Not Exported',
            financeUserIdx: 1,
            notes: 'Partial payment — balance to clear post site walkthrough.',
        },
    ];

    fixtures.forEach((fx, i) => {
        const id = i + 1;
        const createdAt = new Date(baseNow.getTime() - fx.daysAgo * 86400000).toISOString();
        const updatedAt = new Date(new Date(createdAt).getTime() + ((i % 3) * 6 + 2) * 3600000).toISOString();
        const invoiceDate = toYmd(new Date(createdAt));
        const dueDate = toYmd(new Date(new Date(createdAt).getTime() + fx.dueOffsetDays * 86400000));

        const party = parties[fx.partyIdx % parties.length]!;
        const project = projects[fx.projectIdx]!;
        const total = fx.invoiceAmount + fx.taxAmount;

        const payments: InvoicePaymentEntry[] = fx.payments.map((p, idx) => {
            const at = new Date(baseNow.getTime() - p.daysAgo * 86400000).toISOString();
            return {
                id: `pmt-seed-${id}-${idx + 1}`,
                paymentDate: toYmd(new Date(at)),
                amount: p.amount,
                mode: p.mode,
                transactionRef: p.ref,
                remarks: 'Payment posted via bank reconciliation.',
                recordedBy: financeUsers[fx.financeUserIdx % financeUsers.length]!,
                recordedAt: at,
            };
        });

        const paidAmount = sumInvoicePayments(payments);

        const invoice: Invoice = {
            id,
            slug: '',
            invoiceId: formatInvoiceCode(id),
            invoiceNumber: `${party.type === 'Supplier' ? 'SP' : 'VD'}-${String(2000 + id).padStart(4, '0')}`,
            companyName,
            partyType: party.type,
            partyName: party.name,
            linkedProject: project,
            linkedWorkOrderId: `WO-${String(1000 + fx.workOrderIdx).padStart(4, '0')}`,
            linkedPurchaseOrder: `PO-${String(500 + id).padStart(4, '0')}`,
            linkedPrSlug: '',
            linkedPrNumber: '',
            linkedPaymentId: payments[0] ? `RCP-${77800 + id}` : '',
            invoiceDate,
            dueDate,
            currency: 'INR',
            invoiceAmount: fx.invoiceAmount,
            taxAmount: fx.taxAmount,
            totalAmount: total,
            notes: fx.notes,
            paidAmount,
            balanceAmount: deriveInvoiceBalance(total, paidAmount),
            paymentStatus: deriveInvoicePaymentStatus(total, paidAmount),
            primaryPaymentMode: payments[0]?.mode ?? '',
            primaryTransactionRef: payments[0]?.transactionRef ?? '',
            validation: {
                status: fx.validation,
                validatedBy: fx.validation === 'Pending' ? '' : financeUsers[fx.financeUserIdx % financeUsers.length]!,
                validatedAt: fx.validation === 'Pending' ? '' : updatedAt,
                remarks:
                    fx.validation === 'Approved'
                        ? 'Line items match BOQ. Cleared for payment.'
                        : fx.validation === 'Rejected'
                          ? 'BOQ rate mismatch. Resubmit with revised line items.'
                          : '',
                rejectionRemarks: fx.validation === 'Rejected' ? 'BOQ rate mismatch. Resubmit with revised line items.' : '',
            },
            exportStatus: fx.exportStatus,
            lastExportedAt: fx.exportStatus === 'Exported' ? updatedAt : null,
            assignedFinanceUser: financeUsers[fx.financeUserIdx % financeUsers.length]!,
            payments,
            attachments: [],
            notifications: {
                notifyVendor: true,
                paymentReminder: true,
                dueReminder: true,
                validationAlert: true,
                exportAlert: fx.exportStatus !== 'Not Exported',
                channelEmail: true,
                channelSms: false,
                channelInApp: true,
            },
            activityLog: [
                {
                    id: `inv-act-${id}-created`,
                    at: createdAt,
                    actor: financeUsers[fx.financeUserIdx % financeUsers.length]!,
                    title: 'Invoice created',
                    body: `${formatInvoiceCode(id)} · ${fx.title}`,
                    actionType: 'created',
                    severity: 'success',
                },
                ...(fx.validation !== 'Pending'
                    ? [
                          {
                              id: `inv-act-${id}-validation`,
                              at: updatedAt,
                              actor: financeUsers[fx.financeUserIdx % financeUsers.length]!,
                              title: `Validation ${fx.validation.toLowerCase()}`,
                              body:
                                  fx.validation === 'Rejected'
                                      ? 'Rejected — BOQ rate mismatch.'
                                      : 'Validated by finance reviewer.',
                              actionType: 'validation_updated',
                              severity:
                                  fx.validation === 'Approved'
                                      ? 'success'
                                      : ('warning' as InvoiceActivityEntry['severity']),
                          },
                      ]
                    : []),
                ...payments.map((p) => ({
                    id: `inv-act-${id}-pmt-${p.id}`,
                    at: p.recordedAt,
                    actor: p.recordedBy,
                    title: 'Payment recorded',
                    body: `₹ ${p.amount.toLocaleString('en-IN')} · ${p.mode}${p.transactionRef ? ` · ${p.transactionRef}` : ''}`,
                    actionType: 'payment_added',
                    severity: 'info' as InvoiceActivityEntry['severity'],
                })),
            ],
            createdAt,
            updatedAt,
            archivedAt: null,
        };

        invoice.slug = ensureUniqueSlug(slugify(`${invoice.invoiceId}-${fx.title}`) || `invoice-${id}`, seeded);
        seeded.push(invoice);
    });

    seeded.push(...buildProcurementLinkedInvoices(baseNow, financeUsers, companyName, seeded));

    return seeded;
}

function buildProcurementLinkedInvoices(
    baseNow: Date,
    financeUsers: string[],
    companyName: string,
    existing: Invoice[],
): Invoice[] {
    const y = baseNow.getFullYear();
    const po = (n: number) => `PO-${y}-${1000 + n}`;
    const pr = (n: number) => `PR-${y}-${1000 + n}`;
    const rows: Array<{
        id: number;
        slugKey: string;
        prSlug: string;
        prNumber: string;
        poNumber: string;
        project: string;
        supplier: string;
        materialNote: string;
        invoiceAmount: number;
        taxAmount: number;
        daysAgo: number;
        validation: InvoiceValidationStatus;
        paymentStatus: InvoicePaymentStatus;
        payments: Array<{ amount: number; mode: InvoicePaymentMode; daysAgo: number; ref: string }>;
    }> = [
        {
            id: 7,
            slugKey: 'cement-po1',
            prSlug: 'pr-demo-1',
            prNumber: pr(1),
            poNumber: po(1),
            project: 'Skyline Residency',
            supplier: 'MetroBuild Materials Pvt Ltd',
            materialNote: 'OPC 53 Grade cement — Tower A',
            invoiceAmount: 50400,
            taxAmount: 9072,
            daysAgo: 4,
            validation: 'Approved',
            paymentStatus: 'Partial',
            payments: [{ amount: 30000, mode: 'Bank Transfer', daysAgo: 2, ref: 'UTR-PR1-PO1' }],
        },
        {
            id: 8,
            slugKey: 'cement-po7',
            prSlug: 'pr-demo-1',
            prNumber: pr(1),
            poNumber: po(7),
            project: 'Skyline Residency',
            supplier: 'MetroBuild Materials Pvt Ltd',
            materialNote: 'OPC follow-on delivery — PO-7',
            invoiceAmount: 25200,
            taxAmount: 4536,
            daysAgo: 3,
            validation: 'Approved',
            paymentStatus: 'Pending',
            payments: [],
        },
        {
            id: 9,
            slugKey: 'steel-po2',
            prSlug: 'pr-demo-2',
            prNumber: pr(2),
            poNumber: po(2),
            project: 'Urban Flux Apartments',
            supplier: 'MetroBuild Materials Pvt Ltd',
            materialNote: 'TMT 500D bars — podium',
            invoiceAmount: 2632500,
            taxAmount: 473850,
            daysAgo: 6,
            validation: 'Approved',
            paymentStatus: 'Partial',
            payments: [{ amount: 1500000, mode: 'Bank Transfer', daysAgo: 4, ref: 'UTR-PR2-PO2' }],
        },
        {
            id: 10,
            slugKey: 'rmc-po3',
            prSlug: 'pr-demo-3',
            prNumber: pr(3),
            poNumber: po(3),
            project: 'Summit Woods',
            supplier: 'MetroBuild Materials Pvt Ltd',
            materialNote: 'Ready-mix concrete M30 — Block C',
            invoiceAmount: 416000,
            taxAmount: 74880,
            daysAgo: 5,
            validation: 'Pending',
            paymentStatus: 'Pending',
            payments: [],
        },
        {
            id: 11,
            slugKey: 'rmc-po8',
            prSlug: 'pr-demo-3',
            prNumber: pr(3),
            poNumber: po(8),
            project: 'Summit Woods',
            supplier: 'MetroBuild Materials Pvt Ltd',
            materialNote: 'RMC top-up pour',
            invoiceAmount: 208000,
            taxAmount: 37440,
            daysAgo: 2,
            validation: 'Approved',
            paymentStatus: 'Paid',
            payments: [{ amount: 245440, mode: 'Bank Transfer', daysAgo: 1, ref: 'UTR-PR3-PO8' }],
        },
        {
            id: 12,
            slugKey: 'steel-po6',
            prSlug: 'pr-demo-6',
            prNumber: pr(6),
            poNumber: po(6),
            project: 'Summit Woods',
            supplier: 'FinishCraft Traders',
            materialNote: 'Structural steel — Block B',
            invoiceAmount: 1952000,
            taxAmount: 351360,
            daysAgo: 7,
            validation: 'Approved',
            paymentStatus: 'Partial',
            payments: [{ amount: 1000000, mode: 'Cheque', daysAgo: 5, ref: 'CHQ-PR6-PO6' }],
        },
    ];

    const out: Invoice[] = [];
    for (const row of rows) {
        const createdAt = new Date(baseNow.getTime() - row.daysAgo * 86400000).toISOString();
        const updatedAt = new Date(new Date(createdAt).getTime() + 4 * 3600000).toISOString();
        const invoiceDate = toYmd(new Date(createdAt));
        const dueDate = toYmd(new Date(new Date(createdAt).getTime() + 30 * 86400000));
        const total = row.invoiceAmount + row.taxAmount;
        const payments: InvoicePaymentEntry[] = row.payments.map((p, idx) => {
            const at = new Date(baseNow.getTime() - p.daysAgo * 86400000).toISOString();
            return {
                id: `pmt-proc-${row.id}-${idx + 1}`,
                paymentDate: toYmd(new Date(at)),
                amount: p.amount,
                mode: p.mode,
                transactionRef: p.ref,
                remarks: `Payment against ${row.poNumber} · ${row.prNumber}`,
                recordedBy: financeUsers[0]!,
                recordedAt: at,
            };
        });
        const paidAmount = sumInvoicePayments(payments);
        const inv: Invoice = {
            id: row.id,
            slug: '',
            invoiceId: formatInvoiceCode(row.id),
            invoiceNumber: `SP-PROC-${row.id}`,
            companyName,
            partyType: 'Supplier',
            partyName: row.supplier,
            linkedProject: row.project,
            linkedWorkOrderId: '',
            linkedPurchaseOrder: row.poNumber,
            linkedPrSlug: row.prSlug,
            linkedPrNumber: row.prNumber,
            linkedPaymentId: payments[0] ? `RCP-${8800 + row.id}` : '',
            invoiceDate,
            dueDate,
            currency: 'INR',
            invoiceAmount: row.invoiceAmount,
            taxAmount: row.taxAmount,
            totalAmount: total,
            notes: `${row.materialNote}. Linked to ${row.prNumber} / ${row.poNumber}.`,
            paidAmount,
            balanceAmount: deriveInvoiceBalance(total, paidAmount),
            paymentStatus: payments.length ? deriveInvoicePaymentStatus(total, paidAmount) : row.paymentStatus,
            primaryPaymentMode: payments[0]?.mode ?? '',
            primaryTransactionRef: payments[0]?.transactionRef ?? '',
            validation: {
                status: row.validation,
                validatedBy: row.validation === 'Pending' ? '' : financeUsers[0]!,
                validatedAt: row.validation === 'Pending' ? '' : updatedAt,
                remarks: row.validation === 'Approved' ? 'Matched to PO line items and GRN.' : '',
                rejectionRemarks: '',
            },
            exportStatus: 'Not Exported',
            lastExportedAt: null,
            assignedFinanceUser: financeUsers[0]!,
            payments,
            attachments: [],
            notifications: {
                notifyVendor: true,
                paymentReminder: true,
                dueReminder: true,
                validationAlert: true,
                exportAlert: false,
                channelEmail: true,
                channelSms: false,
                channelInApp: true,
            },
            activityLog: [
                {
                    id: `inv-act-proc-${row.id}`,
                    at: createdAt,
                    actor: financeUsers[0]!,
                    title: 'Procurement invoice created',
                    body: `${formatInvoiceCode(row.id)} · ${row.poNumber} · ${row.prNumber}`,
                    actionType: 'created',
                    severity: 'success',
                },
            ],
            createdAt,
            updatedAt,
            archivedAt: null,
        };
        inv.slug = ensureUniqueSlug(`inv-proc-${row.slugKey}`, [...existing, ...out]);
        out.push(inv);
    }
    return out;
}

/* -------------------------------------------------------------------------- */
/*  Singleton state                                                           */
/* -------------------------------------------------------------------------- */

let _invoices: Invoice[] = hydrateFromLocalStorage();
if (typeof window !== 'undefined') {
    if (_invoices.length === 0) {
        _invoices = buildSeedInvoices();
        persistToLocalStorage(_invoices);
    } else if (!_invoices.some((i) => i.slug.startsWith('inv-proc-'))) {
        const financeUsers = ['Sneha Patil', 'Rohit Bansal', 'Amit Mehra', 'Priya Sharma'];
        const proc = buildProcurementLinkedInvoices(new Date(), financeUsers, 'Requanto Realty Pvt Ltd', _invoices);
        _invoices = [...proc, ..._invoices].sort((a, b) => b.id - a.id);
        persistToLocalStorage(_invoices);
    }
}
let _nextId = (_invoices.reduce((m, w) => Math.max(m, w.id), 0) || 0) + 1;

/* -------------------------------------------------------------------------- */
/*  Reads                                                                     */
/* -------------------------------------------------------------------------- */

export function getNextInvoiceCode() {
    return formatInvoiceCode(_nextId);
}

export function getInvoices(): Invoice[] {
    return _invoices
        .filter((w) => !w.archivedAt)
        .slice()
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getArchivedInvoices(): Invoice[] {
    return _invoices
        .filter((w) => Boolean(w.archivedAt))
        .slice()
        .sort((a, b) => (a.archivedAt! < b.archivedAt! ? 1 : -1));
}

export function getInvoiceBySlug(slug: string): Invoice | undefined {
    const s = slug.trim();
    if (!s) return undefined;
    return _invoices.find((w) => w.slug === s && !w.archivedAt);
}

export function getInvoiceBySlugIncludingArchived(slug: string): Invoice | undefined {
    const s = slug.trim();
    if (!s) return undefined;
    return _invoices.find((w) => w.slug === s);
}

/** Active invoices linked to a purchase request (by PR slug or linked PO number). */
export function getInvoicesByPrSlug(prSlug: string): Invoice[] {
    const slug = prSlug.trim();
    if (!slug) return [];
    const poNumbers = new Set(
        getPurchaseOrdersByPrSlug(slug)
            .map((o) => o.poNumber.trim())
            .filter(Boolean),
    );
    return getInvoices()
        .filter((inv) => {
            if (inv.linkedPrSlug.trim() === slug) return true;
            if (!poNumbers.size) return false;
            return parseLinkedPoNumbersFromInvoice(inv.linkedPurchaseOrder).some((n) => poNumbers.has(n));
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Invoices not already linked to this PR (for link-existing flow). */
export function getLinkableInvoicesForPr(prSlug: string): Invoice[] {
    const slug = prSlug.trim();
    if (!slug) return [];
    return getInvoices()
        .filter((inv) => inv.linkedPrSlug.trim() !== slug)
        .sort((a, b) => b.invoiceId.localeCompare(a.invoiceId));
}

export function getInvoiceActivities(slug: string): InvoiceActivityEntry[] {
    const inv = getInvoiceBySlugIncludingArchived(slug);
    return Array.isArray(inv?.activityLog) ? [...inv!.activityLog] : [];
}

/* -------------------------------------------------------------------------- */
/*  Demo catalogs (counterparties, finance users, projects)                   */
/* -------------------------------------------------------------------------- */

export function getDemoCounterpartyOptions(): { name: string; type: InvoicePartyType }[] {
    const dedup = new Map<string, InvoicePartyType>();
    getDemoVendorList().forEach((p) => {
        if (!dedup.has(p.name)) dedup.set(p.name, p.type);
    });
    return Array.from(dedup.entries()).map(([name, type]) => ({ name, type }));
}

export function getDemoFinanceUsersList(): string[] {
    return ['Sneha Patil', 'Rohit Bansal', 'Amit Mehra', 'Priya Sharma', 'Company Admin'];
}

/* -------------------------------------------------------------------------- */
/*  Writes — archive / restore / duplicate                                    */
/* -------------------------------------------------------------------------- */

export function archiveInvoice(slug: string): boolean {
    const inv = _invoices.find((w) => w.slug === slug && !w.archivedAt);
    if (!inv) return false;
    const ts = nowIso();
    const entry: InvoiceActivityEntry = {
        id: `inv-act-${Date.now()}-arch`,
        at: ts,
        actor: 'You',
        title: 'Invoice archived',
        body: `${inv.invoiceId} archived. Restore from the archived list.`,
        actionType: 'archived',
        severity: 'warning',
    };
    _invoices = _invoices.map((w) =>
        w.slug === slug
            ? { ...w, archivedAt: ts, updatedAt: ts, activityLog: [...(w.activityLog ?? []), entry] }
            : w,
    );
    persistToLocalStorage(_invoices);
    return true;
}

export function restoreInvoice(slug: string): boolean {
    const inv = _invoices.find((w) => w.slug === slug && w.archivedAt);
    if (!inv) return false;
    const ts = nowIso();
    const entry: InvoiceActivityEntry = {
        id: `inv-act-${Date.now()}-rest`,
        at: ts,
        actor: 'You',
        title: 'Invoice restored',
        body: `${inv.invoiceId} restored from archive.`,
        actionType: 'restored',
        severity: 'success',
    };
    _invoices = _invoices.map((w) =>
        w.slug === slug
            ? { ...w, archivedAt: null, updatedAt: ts, activityLog: [...(w.activityLog ?? []), entry] }
            : w,
    );
    persistToLocalStorage(_invoices);
    return true;
}

export function duplicateInvoice(slug: string): Invoice | undefined {
    const src = _invoices.find((w) => w.slug === slug && !w.archivedAt);
    if (!src) return undefined;
    const id = _nextId++;
    const now = nowIso();
    const baseTitle = `${src.invoiceNumber || src.invoiceId} (Copy)`;
    const newSlug = ensureUniqueSlug(slugify(`${formatInvoiceCode(id)}-${baseTitle}`) || `invoice-${id}`, _invoices);
    const copy: Invoice = {
        ...src,
        id,
        slug: newSlug,
        invoiceId: formatInvoiceCode(id),
        invoiceNumber: baseTitle,
        payments: [],
        paidAmount: 0,
        balanceAmount: src.totalAmount,
        paymentStatus: 'Pending',
        primaryPaymentMode: '',
        primaryTransactionRef: '',
        validation: { status: 'Pending', validatedBy: '', validatedAt: '', remarks: '', rejectionRemarks: '' },
        exportStatus: 'Not Exported',
        lastExportedAt: null,
        attachments: [],
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
        activityLog: [
            {
                id: `inv-act-dup-${Date.now()}`,
                at: now,
                actor: 'You',
                title: 'Invoice cloned',
                body: `Duplicated from ${src.invoiceId}.`,
                actionType: 'duplicated',
                severity: 'info',
            },
        ],
    };
    _invoices = [..._invoices, copy];
    persistToLocalStorage(_invoices);
    return copy;
}

/* -------------------------------------------------------------------------- */
/*  Writes — create / update                                                  */
/* -------------------------------------------------------------------------- */

export type AddInvoiceInput = {
    invoiceNumber: string;
    companyName: string;
    partyType: InvoicePartyType;
    partyName: string;

    linkedProject: string;
    linkedWorkOrderId: string;
    linkedPurchaseOrder: string;
    linkedPrSlug: string;
    linkedPrNumber: string;

    invoiceDate: string;
    dueDate: string;
    currency: InvoiceCurrency;

    invoiceAmount: number;
    taxAmount: number;
    totalAmount: number;
    notes: string;

    paymentStatus: InvoicePaymentStatus;
    primaryPaymentMode: InvoicePaymentMode | '';
    primaryTransactionRef: string;
    paidAmount: number;

    assignedFinanceUser: string;
};

export function addInvoiceFromCoreFields(input: AddInvoiceInput): Invoice {
    const id = _nextId++;
    const now = nowIso();
    const invoiceId = formatInvoiceCode(id);
    const slug = ensureUniqueSlug(
        slugify(`${invoiceId}-${input.invoiceNumber}-${input.partyName}`) || `invoice-${id}`,
        _invoices,
    );
    const total = Math.max(0, toFiniteNumber(input.totalAmount));
    const paid = Math.max(0, toFiniteNumber(input.paidAmount));

    const created: Invoice = {
        id,
        slug,
        invoiceId,
        invoiceNumber: input.invoiceNumber.trim(),
        companyName: input.companyName.trim(),
        partyType: input.partyType,
        partyName: input.partyName.trim(),
        linkedProject: input.linkedProject.trim(),
        linkedWorkOrderId: input.linkedWorkOrderId.trim(),
        linkedPurchaseOrder: input.linkedPurchaseOrder.trim(),
        linkedPrSlug: input.linkedPrSlug.trim(),
        linkedPrNumber: input.linkedPrNumber.trim(),
        linkedPaymentId: '',
        invoiceDate: input.invoiceDate.trim(),
        dueDate: input.dueDate.trim(),
        currency: input.currency,
        invoiceAmount: Math.max(0, toFiniteNumber(input.invoiceAmount)),
        taxAmount: Math.max(0, toFiniteNumber(input.taxAmount)),
        totalAmount: total,
        notes: input.notes.trim(),
        paidAmount: paid,
        balanceAmount: deriveInvoiceBalance(total, paid),
        paymentStatus: paid > 0 ? deriveInvoicePaymentStatus(total, paid) : input.paymentStatus,
        primaryPaymentMode: input.primaryPaymentMode,
        primaryTransactionRef: input.primaryTransactionRef.trim(),
        validation: { status: 'Pending', validatedBy: '', validatedAt: '', remarks: '', rejectionRemarks: '' },
        exportStatus: 'Not Exported',
        lastExportedAt: null,
        assignedFinanceUser: input.assignedFinanceUser.trim() || 'You',
        payments: [],
        attachments: [],
        notifications: {
            notifyVendor: true,
            paymentReminder: true,
            dueReminder: true,
            validationAlert: true,
            exportAlert: false,
            channelEmail: true,
            channelSms: false,
            channelInApp: true,
        },
        activityLog: [
            {
                id: `inv-act-${id}-created`,
                at: now,
                actor: input.assignedFinanceUser.trim() || 'You',
                title: 'Invoice created',
                body: `${invoiceId} · ${input.invoiceNumber}`,
                actionType: 'created',
                severity: 'success',
            },
        ],
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
    };

    _invoices = [..._invoices, created];
    persistToLocalStorage(_invoices);
    return created;
}

export function updateInvoice(
    slug: string,
    updates: Partial<Omit<Invoice, 'id' | 'slug' | 'invoiceId' | 'createdAt'>>,
    activity?: Omit<InvoiceActivityEntry, 'id' | 'at'> & { at?: string },
): Invoice | undefined {
    const raw = getInvoiceBySlugIncludingArchived(slug);
    if (!raw) return undefined;
    const now = nowIso();
    const merged: Invoice = {
        ...raw,
        ...updates,
        updatedAt: now,
        createdAt: raw.createdAt,
        invoiceId: raw.invoiceId,
    };

    // Auto-recalc derived numeric fields if amounts changed
    const total = Math.max(0, toFiniteNumber(merged.totalAmount));
    const paid = Math.max(0, toFiniteNumber(merged.paidAmount));
    merged.totalAmount = total;
    merged.paidAmount = paid;
    merged.balanceAmount = deriveInvoiceBalance(total, paid);
    if (updates.paymentStatus == null) {
        merged.paymentStatus = deriveInvoicePaymentStatus(total, paid);
    }

    if (activity) {
        const entry: InvoiceActivityEntry = {
            id: `inv-act-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            at: activity.at?.trim() || now,
            actor: activity.actor.trim() || 'You',
            title: activity.title.trim(),
            body: activity.body,
            actionType: activity.actionType,
            severity: activity.severity,
        };
        merged.activityLog = [...(raw.activityLog ?? []), entry];
    }
    _invoices = _invoices.map((w) => (w.slug === slug ? merged : w));
    persistToLocalStorage(_invoices);
    return merged;
}

export function linkInvoiceToPr(
    invoiceSlug: string,
    prSlug: string,
    prNumber: string,
    ctx?: { linkedProject?: string; linkedPurchaseOrder?: string },
): Invoice | undefined {
    const invSlug = invoiceSlug.trim();
    const slug = prSlug.trim();
    if (!invSlug || !slug) return undefined;
    const inv = getInvoiceBySlugIncludingArchived(invSlug);
    if (!inv) return undefined;
    const updates: Partial<Invoice> = {
        linkedPrSlug: slug,
        linkedPrNumber: prNumber.trim(),
    };
    if (ctx?.linkedProject?.trim() && !inv.linkedProject.trim()) {
        updates.linkedProject = ctx.linkedProject.trim();
    }
    if (ctx?.linkedPurchaseOrder?.trim() && !inv.linkedPurchaseOrder.trim()) {
        updates.linkedPurchaseOrder = ctx.linkedPurchaseOrder.trim();
    }
    return updateInvoice(invSlug, updates, {
        actor: 'You',
        title: 'Linked to purchase request',
        body: `Attached to ${prNumber.trim() || slug}${ctx?.linkedPurchaseOrder ? ` · ${ctx.linkedPurchaseOrder}` : ''}.`,
        actionType: 'linked',
        severity: 'info',
    });
}

/** Removes PR link and strips this PR's PO numbers from the invoice (stays in Invoice & Payments). */
export function unlinkInvoiceFromPurchaseRequest(invoiceSlug: string, prSlug: string): Invoice | undefined {
    const invSlug = invoiceSlug.trim();
    const slug = prSlug.trim();
    if (!invSlug || !slug) return undefined;
    const inv = getInvoiceBySlugIncludingArchived(invSlug);
    if (!inv) return undefined;

    const prPoNumbers = new Set(
        getPurchaseOrdersByPrSlug(slug)
            .map((o) => o.poNumber.trim())
            .filter(Boolean),
    );
    const remainingPos = parseLinkedPoNumbersFromInvoice(inv.linkedPurchaseOrder).filter((n) => !prPoNumbers.has(n));
    const linkedPurchaseOrder = remainingPos.join(', ');

    return updateInvoice(
        invSlug,
        {
            linkedPrSlug: '',
            linkedPrNumber: '',
            linkedPurchaseOrder,
        },
        {
            actor: 'You',
            title: 'Unlinked from purchase request',
            body: `Removed from purchase request${prPoNumbers.size ? ' (PR purchase order references cleared)' : ''}.`,
            actionType: 'unlinked',
            severity: 'warning',
        },
    );
}

/* -------------------------------------------------------------------------- */
/*  Writes — payments ledger                                                  */
/* -------------------------------------------------------------------------- */

export function addInvoicePayment(
    slug: string,
    input: { paymentDate: string; amount: number; mode: InvoicePaymentMode; transactionRef: string; remarks: string; recordedBy?: string },
): Invoice | undefined {
    const inv = getInvoiceBySlug(slug);
    if (!inv) return undefined;
    const now = nowIso();
    const entry: InvoicePaymentEntry = {
        id: `pmt-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        paymentDate: input.paymentDate.trim(),
        amount: Math.max(0, toFiniteNumber(input.amount)),
        mode: input.mode,
        transactionRef: input.transactionRef.trim(),
        remarks: input.remarks.trim(),
        recordedBy: input.recordedBy?.trim() || 'You',
        recordedAt: now,
    };
    const nextPayments = [...inv.payments, entry];
    const paidAmount = sumInvoicePayments(nextPayments);
    return updateInvoice(
        slug,
        {
            payments: nextPayments,
            paidAmount,
            balanceAmount: deriveInvoiceBalance(inv.totalAmount, paidAmount),
            paymentStatus: deriveInvoicePaymentStatus(inv.totalAmount, paidAmount),
            primaryPaymentMode: entry.mode,
            primaryTransactionRef: entry.transactionRef,
        },
        {
            actor: entry.recordedBy,
            title: 'Payment recorded',
            body: `${formatINR(entry.amount)} · ${entry.mode}${entry.transactionRef ? ` · ${entry.transactionRef}` : ''}`,
            actionType: 'payment_added',
            severity: 'info',
        },
    );
}

export function removeInvoicePayment(slug: string, paymentId: string): Invoice | undefined {
    const inv = getInvoiceBySlug(slug);
    if (!inv) return undefined;
    const next = inv.payments.filter((p) => p.id !== paymentId);
    if (next.length === inv.payments.length) return undefined;
    const removed = inv.payments.find((p) => p.id === paymentId);
    const paidAmount = sumInvoicePayments(next);
    return updateInvoice(
        slug,
        {
            payments: next,
            paidAmount,
            balanceAmount: deriveInvoiceBalance(inv.totalAmount, paidAmount),
            paymentStatus: deriveInvoicePaymentStatus(inv.totalAmount, paidAmount),
        },
        {
            actor: 'You',
            title: 'Payment removed',
            body: removed ? `Removed ${formatINR(removed.amount)} · ${removed.mode}` : paymentId,
            actionType: 'payment_removed',
            severity: 'warning',
        },
    );
}

/* -------------------------------------------------------------------------- */
/*  Writes — validation                                                       */
/* -------------------------------------------------------------------------- */

export function updateInvoiceValidation(
    slug: string,
    input: {
        status: InvoiceValidationStatus;
        validatedBy: string;
        /** Required general audit remark — captured for every decision. */
        remarks: string;
        /** Optional explicit rejection reason. When omitted, falls back to `remarks` for Rejected. */
        rejectionRemarks?: string;
    },
): Invoice | undefined {
    const inv = getInvoiceBySlug(slug);
    if (!inv) return undefined;
    const now = nowIso();
    const remarks = input.remarks.trim();
    const rejectionRemarks =
        input.status === 'Rejected' ? (input.rejectionRemarks?.trim() || remarks) : '';
    const nextValidation: InvoiceValidation = {
        status: input.status,
        validatedBy: input.validatedBy.trim() || inv.validation.validatedBy,
        validatedAt: input.status === 'Pending' ? '' : now,
        remarks,
        rejectionRemarks,
    };
    const severity: InvoiceActivityEntry['severity'] =
        input.status === 'Approved' ? 'success' : input.status === 'Rejected' ? 'warning' : 'info';
    return updateInvoice(
        slug,
        { validation: nextValidation },
        {
            actor: nextValidation.validatedBy || 'You',
            title: `Validation ${input.status.toLowerCase()}`,
            body: remarks || `Validation set to ${input.status}.`,
            actionType: 'validation_updated',
            severity,
        },
    );
}

/* -------------------------------------------------------------------------- */
/*  Writes — attachments                                                      */
/* -------------------------------------------------------------------------- */

export function addInvoiceAttachment(
    slug: string,
    input: Omit<InvoiceAttachment, 'id' | 'uploadedAt' | 'version' | 'uploadedBy'> & {
        uploadedAt?: string;
        uploadedBy?: string;
    },
): Invoice | undefined {
    const inv = getInvoiceBySlug(slug);
    if (!inv) return undefined;
    const now = nowIso();
    const existingVersions = inv.attachments
        .filter((a) => a.fileName.toLowerCase() === input.fileName.toLowerCase())
        .reduce((max, a) => Math.max(max, a.version), 0);
    const att: InvoiceAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        category: input.category,
        fileName: input.fileName.trim() || 'attachment',
        sizeLabel: input.sizeLabel.trim() || '—',
        mimeType: input.mimeType?.trim() || 'application/octet-stream',
        url: input.url,
        uploadedAt: input.uploadedAt?.trim() || now,
        uploadedBy: input.uploadedBy?.trim() || 'You',
        version: existingVersions + 1,
    };
    return updateInvoice(
        slug,
        { attachments: [...inv.attachments, att] },
        {
            actor: att.uploadedBy,
            title: 'Document uploaded',
            body: `${att.category} · ${att.fileName}${att.version > 1 ? ` (v${att.version})` : ''}`,
            actionType: 'document_uploaded',
            severity: 'info',
        },
    );
}

export function removeInvoiceAttachment(slug: string, attachmentId: string): Invoice | undefined {
    const inv = getInvoiceBySlug(slug);
    if (!inv) return undefined;
    const removed = inv.attachments.find((a) => a.id === attachmentId);
    const next = inv.attachments.filter((a) => a.id !== attachmentId);
    if (next.length === inv.attachments.length) return undefined;
    return updateInvoice(
        slug,
        { attachments: next },
        {
            actor: 'You',
            title: 'Document removed',
            body: removed ? `${removed.category} · ${removed.fileName}` : attachmentId,
            actionType: 'document_deleted',
            severity: 'warning',
        },
    );
}

/* -------------------------------------------------------------------------- */
/*  Writes — export                                                           */
/* -------------------------------------------------------------------------- */

export function markInvoiceExported(slug: string, by = 'You'): Invoice | undefined {
    const inv = getInvoiceBySlug(slug);
    if (!inv) return undefined;
    const now = nowIso();
    return updateInvoice(
        slug,
        { exportStatus: 'Exported', lastExportedAt: now },
        { actor: by, title: 'Invoice exported', body: 'Invoice marked as exported.', actionType: 'exported', severity: 'info' },
    );
}

/* -------------------------------------------------------------------------- */
/*  Writes — notifications                                                    */
/* -------------------------------------------------------------------------- */

export function updateInvoiceNotifications(
    slug: string,
    next: Partial<InvoiceNotificationSettings>,
): Invoice | undefined {
    const inv = getInvoiceBySlug(slug);
    if (!inv) return undefined;
    return updateInvoice(
        slug,
        { notifications: { ...inv.notifications, ...next } },
        {
            actor: 'You',
            title: 'Notification settings updated',
            body: 'Channel or alert toggles changed.',
            actionType: 'notifications_updated',
            severity: 'info',
        },
    );
}

/* -------------------------------------------------------------------------- */
/*  Empty-draft builder for create mode                                       */
/* -------------------------------------------------------------------------- */

export function buildEmptyInvoiceDraft(): Invoice {
    const now = nowIso();
    const ymd = toYmd(new Date());
    const dueYmd = toYmd(new Date(Date.now() + 30 * 86400000));
    const id = 0;
    return {
        id,
        slug: 'new',
        invoiceId: getNextInvoiceCode(),
        invoiceNumber: '',
        companyName: 'Requanto Realty Pvt Ltd',
        partyType: 'Vendor',
        partyName: '',
        linkedProject: '',
        linkedWorkOrderId: '',
        linkedPurchaseOrder: '',
        linkedPrSlug: '',
        linkedPrNumber: '',
        linkedPaymentId: '',
        invoiceDate: ymd,
        dueDate: dueYmd,
        currency: 'INR',
        invoiceAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
        notes: '',
        paidAmount: 0,
        balanceAmount: 0,
        paymentStatus: 'Pending',
        primaryPaymentMode: '',
        primaryTransactionRef: '',
        validation: { status: 'Pending', validatedBy: '', validatedAt: '', remarks: '', rejectionRemarks: '' },
        exportStatus: 'Not Exported',
        lastExportedAt: null,
        assignedFinanceUser: 'You',
        payments: [],
        attachments: [],
        notifications: {
            notifyVendor: true,
            paymentReminder: true,
            dueReminder: true,
            validationAlert: true,
            exportAlert: false,
            channelEmail: true,
            channelSms: false,
            channelInApp: true,
        },
        activityLog: [],
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
    };
}

/* -------------------------------------------------------------------------- */
/*  Money formatter (reused by activity bodies)                               */
/* -------------------------------------------------------------------------- */

export function formatINR(amount: number | null | undefined): string {
    const n = Math.max(0, toFiniteNumber(amount));
    try {
        return `₹ ${Math.round(n).toLocaleString('en-IN')}`;
    } catch {
        return `₹ ${Math.round(n)}`;
    }
}

export function formatMoney(amount: number | null | undefined, currency: InvoiceCurrency = 'INR'): string {
    if (currency === 'INR') return formatINR(amount);
    const n = Math.max(0, toFiniteNumber(amount));
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
    } catch {
        return `${currency} ${Math.round(n)}`;
    }
}
