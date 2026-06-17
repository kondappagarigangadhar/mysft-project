'use client';

/**
 * Customer & Buyer Portal — converted leads with booking/payment workspace.
 */

import {
    getBookingBySlug,
    getBookingPaymentSummary,
    getBookings,
    getDocumentsForBooking,
    getPaymentsForBooking,
    type BookingStatus,
} from '@/lib/bookingPaymentMockStore';
import { formatLeadCode, getLeadByLeadCode, getLeads, slugify as leadSlugify, type LeadSource } from '@/lib/leadStore';

export type { LeadSource };

export type CustomerBookingStatus = BookingStatus;
export type CustomerPaymentStatus = 'Paid' | 'Partial' | 'Overdue' | 'Pending';
export type CustomerStatus = 'Active' | 'Onboarding' | 'Archived';
export type CustomerDocumentType = 'Agreement' | 'Receipt' | 'Invoice' | 'Legal' | 'Other';

export const CUSTOMER_BOOKING_STATUS_OPTIONS: CustomerBookingStatus[] = ['Confirmed', 'Pending', 'Cancelled'];
export const CUSTOMER_PAYMENT_STATUS_OPTIONS: CustomerPaymentStatus[] = ['Paid', 'Partial', 'Overdue', 'Pending'];
export const CUSTOMER_STATUS_OPTIONS: CustomerStatus[] = ['Active', 'Onboarding', 'Archived'];
export const CUSTOMER_DOCUMENT_TYPE_OPTIONS: CustomerDocumentType[] = ['Agreement', 'Receipt', 'Invoice', 'Legal', 'Other'];

export type CustomerPaymentHistoryRow = {
    id: string;
    date: string;
    amount: number;
    mode: string;
    status: string;
    receiptNumber: string;
};

export type CustomerDocument = {
    id: string;
    name: string;
    type: CustomerDocumentType;
    fileUrl: string;
    uploadedAt: string;
};

export type CustomerProjectUpdate = {
    id: string;
    title: string;
    description: string;
    date: string;
};

export type CustomerJourneyEvent = {
    id: string;
    at: string;
    kind: 'lead' | 'booking' | 'payment' | 'document' | 'activity' | 'project';
    title: string;
    detail: string;
};

export type Customer = {
    id: number;
    slug: string;
    customerCode: string;
    fullName: string;
    phone: string;
    email: string;
    leadId: string;
    leadSlug: string;
    leadSource: LeadSource;
    bookingSlug: string;
    bookingId: string;
    projectName: string;
    unitNumber: string;
    bookingStatus: CustomerBookingStatus;
    assignedExecutive: string;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    paymentStatus: CustomerPaymentStatus;
    customerStatus: CustomerStatus;
    lastPaymentDate: string;
    createdDate: string;
    bookingDate: string;
    paymentLink: string;
    paymentHistory: CustomerPaymentHistoryRow[];
    documents: CustomerDocument[];
    projectUpdates: CustomerProjectUpdate[];
    journeyTimeline: CustomerJourneyEvent[];
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};

let _nextId = 1;

export function slugifyCustomer(input: string): string {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48);
}

export function formatCustomerCode(id: number): string {
    return `CUS-${String(id).padStart(4, '0')}`;
}

export function formatBookingDisplayId(bookingSlug: string): string {
    return `BK-${bookingSlug.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

function derivePaymentStatus(total: number, paid: number, bookingStatus: CustomerBookingStatus): CustomerPaymentStatus {
    if (bookingStatus === 'Cancelled') return 'Pending';
    if (total <= 0) return 'Pending';
    if (paid >= total) return 'Paid';
    if (paid > 0) return 'Partial';
    return 'Overdue';
}

function syncFinancials(c: Customer): Customer {
    const summary = getBookingPaymentSummary(c.bookingSlug);
    const total = summary?.unitPrice ?? c.totalAmount;
    const paid = summary?.paidCompleted ?? c.paidAmount;
    const pending = Math.max(0, total - paid);
    const payments = getPaymentsForBooking(c.bookingSlug);
    const lastPay = payments
        .filter((p) => p.status === 'Completed')
        .map((p) => p.date)
        .sort()
        .pop();
    return {
        ...c,
        totalAmount: total,
        paidAmount: paid,
        pendingAmount: pending,
        paymentStatus: derivePaymentStatus(total, paid, c.bookingStatus),
        lastPaymentDate: lastPay ?? c.lastPaymentDate,
    };
}

function buildPaymentHistory(bookingSlug: string): CustomerPaymentHistoryRow[] {
    return getPaymentsForBooking(bookingSlug).map((p) => ({
        id: p.slug,
        date: p.date,
        amount: p.amount,
        mode: p.mode,
        status: p.status,
        receiptNumber: p.receiptNumber,
    }));
}

function buildDocumentsFromBooking(bookingSlug: string, seed: CustomerDocument[]): CustomerDocument[] {
    const files = getDocumentsForBooking(bookingSlug);
    if (!files.length) return seed;
    const fromBooking: CustomerDocument[] = files.map((f) => ({
        id: f.id,
        name: f.fileName,
        type: 'Agreement' as CustomerDocumentType,
        fileUrl: `#doc-${f.id}`,
        uploadedAt: f.uploadedAt.slice(0, 10),
    }));
    const ids = new Set(fromBooking.map((d) => d.id));
    return [...fromBooking, ...seed.filter((d) => !ids.has(d.id))];
}

function defaultJourney(c: Pick<Customer, 'fullName' | 'leadSource' | 'bookingDate' | 'createdDate'>): CustomerJourneyEvent[] {
    return [
        {
            id: 'j-lead',
            at: `${c.createdDate}T09:00:00.000Z`,
            kind: 'lead',
            title: 'Lead captured',
            detail: `Source: ${c.leadSource}`,
        },
        {
            id: 'j-booking',
            at: `${c.bookingDate}T11:00:00.000Z`,
            kind: 'booking',
            title: 'Booking confirmed',
            detail: 'Unit allocated and booking workspace created',
        },
    ];
}

function customerFromBooking(
    bookingSlug: string,
    overrides?: Partial<Customer>,
): Customer | undefined {
    const b = getBookingBySlug(bookingSlug);
    if (!b) return undefined;
    const lead = getLeadByLeadCode(b.leadId);
    const summary = getBookingPaymentSummary(bookingSlug);
    const total = summary?.unitPrice ?? b.unitPrice;
    const paid = summary?.paidCompleted ?? 0;
    const pending = Math.max(0, total - paid);
    const id = _nextId++;
    const slug = overrides?.slug ?? slugifyCustomer(b.customerName || `customer-${id}`);
    const now = new Date().toISOString();
    const createdDate = b.created_at?.slice(0, 10) ?? b.bookingDate;
    const row: Customer = {
        id,
        slug,
        customerCode: formatCustomerCode(id),
        fullName: b.customerName,
        phone: b.phone,
        email: lead?.email ?? `${slugifyCustomer(b.customerName)}@buyer.demo`,
        leadId: b.leadId,
        leadSlug: lead?.slug ?? leadSlugify(b.customerName),
        leadSource: (lead?.source as LeadSource) ?? 'Website',
        bookingSlug: b.slug,
        bookingId: formatBookingDisplayId(b.slug),
        projectName: b.projectName,
        unitNumber: b.unitId,
        bookingStatus: b.status,
        assignedExecutive: b.assignedTo,
        totalAmount: total,
        paidAmount: paid,
        pendingAmount: pending,
        paymentStatus: derivePaymentStatus(total, paid, b.status),
        customerStatus: b.status === 'Confirmed' ? 'Active' : 'Onboarding',
        lastPaymentDate: '',
        createdDate,
        bookingDate: b.bookingDate,
        paymentLink: `https://pay.mysft.ai/customer/${b.slug}`,
        paymentHistory: buildPaymentHistory(bookingSlug),
        documents: [
            {
                id: `doc-agreement-${b.slug}`,
                name: 'Sale agreement draft.pdf',
                type: 'Agreement',
                fileUrl: `#agreement-${b.slug}`,
                uploadedAt: b.bookingDate,
            },
        ],
        projectUpdates: [
            {
                id: `pu-1-${b.slug}`,
                title: 'Construction milestone update',
                description: `${b.projectName}: structural work progressing as per RERA timeline. Next site visit window opens next month.`,
                date: '2026-04-01',
            },
        ],
        journeyTimeline: defaultJourney({
            fullName: b.customerName,
            leadSource: (lead?.source as LeadSource) ?? 'Website',
            bookingDate: b.bookingDate,
            createdDate,
        }),
        createdAt: b.created_at ?? now,
        updatedAt: b.updated_at ?? now,
        deletedAt: null,
        ...overrides,
    };
    const synced = syncFinancials(row);
    synced.paymentHistory = buildPaymentHistory(bookingSlug);
    synced.documents = buildDocumentsFromBooking(bookingSlug, synced.documents);
    if (synced.paymentHistory.length) {
        synced.journeyTimeline = [
            ...synced.journeyTimeline,
            {
                id: `j-pay-${synced.paymentHistory[0]!.id}`,
                at: `${synced.paymentHistory[0]!.date}T14:00:00.000Z`,
                kind: 'payment',
                title: 'Payment received',
                detail: `₹${synced.paymentHistory[0]!.amount.toLocaleString('en-IN')} · ${synced.paymentHistory[0]!.mode}`,
            },
        ];
    }
    return synced;
}

function seedCustomers(): Customer[] {
    const fromBookings = getBookings()
        .map((b) => customerFromBooking(b.slug))
        .filter((c): c is Customer => !!c);

    const extra: Customer[] = [
        {
            id: _nextId++,
            slug: 'vikram-patel-summit',
            customerCode: formatCustomerCode(_nextId - 1),
            fullName: 'Vikram Patel',
            phone: '9988776655',
            email: 'vikram.patel@email.com',
            leadId: 'AR-5',
            leadSlug: 'vikram-patel',
            leadSource: 'Referral',
            bookingSlug: 'summit-woods-villa-12',
            bookingId: 'BK-SUMMIT12',
            projectName: 'Summit Woods',
            unitNumber: 'Villa-12',
            bookingStatus: 'Confirmed',
            assignedExecutive: 'Vikram Singh',
            totalAmount: 25000000,
            paidAmount: 5000000,
            pendingAmount: 20000000,
            paymentStatus: 'Partial',
            customerStatus: 'Active',
            lastPaymentDate: '2026-03-10',
            createdDate: '2026-02-20',
            bookingDate: '2026-03-01',
            paymentLink: 'https://pay.mysft.ai/customer/summit-woods-villa-12',
            paymentHistory: [
                {
                    id: 'ph-v1',
                    date: '2026-03-10',
                    amount: 5000000,
                    mode: 'Bank',
                    status: 'Completed',
                    receiptNumber: 'RCP-V12-001',
                },
            ],
            documents: [
                {
                    id: 'doc-v-agree',
                    name: 'Villa booking agreement.pdf',
                    type: 'Agreement',
                    fileUrl: '#agreement-v12',
                    uploadedAt: '2026-03-01',
                },
                {
                    id: 'doc-v-rcpt',
                    name: 'Token receipt.pdf',
                    type: 'Receipt',
                    fileUrl: '#receipt-v12',
                    uploadedAt: '2026-03-10',
                },
            ],
            projectUpdates: [
                {
                    id: 'pu-v1',
                    title: 'Villa cluster handover prep',
                    description: 'Landscaping and internal finishing started for Phase 1 villas.',
                    date: '2026-03-28',
                },
            ],
            journeyTimeline: defaultJourney({
                fullName: 'Vikram Patel',
                leadSource: 'Referral',
                bookingDate: '2026-03-01',
                createdDate: '2026-02-20',
            }),
            createdAt: '2026-02-20T08:00:00.000Z',
            updatedAt: '2026-03-28T10:00:00.000Z',
            deletedAt: null,
        },
    ];

    _nextId = Math.max(_nextId, ...[...fromBookings, ...extra].map((c) => c.id + 1));
    return [...fromBookings, ...extra];
}

let _customers: Customer[] = seedCustomers();

export function getCustomers(): Customer[] {
    return _customers.filter((c) => !c.deletedAt).map((c) => syncFinancials({ ...c }));
}

export function getArchivedCustomers(): Customer[] {
    return _customers.filter((c) => c.deletedAt).map((c) => syncFinancials({ ...c }));
}

export function getCustomerBySlug(slug: string): Customer | undefined {
    const c = _customers.find((x) => x.slug === slug);
    if (!c) return undefined;
    return syncFinancials({ ...c });
}

export function getCustomerBySlugIncludingArchived(slug: string): Customer | undefined {
    const c = _customers.find((x) => x.slug === slug);
    if (!c) return undefined;
    return syncFinancials({ ...c });
}

/** Create portal workspace when lead is booked / confirmed (idempotent by booking slug). */
export function ensureCustomerFromBooking(bookingSlug: string): Customer | undefined {
    const existing = _customers.find((c) => c.bookingSlug === bookingSlug && !c.deletedAt);
    if (existing) return syncFinancials({ ...existing });
    const created = customerFromBooking(bookingSlug);
    if (!created) return undefined;
    _customers = [created, ..._customers];
    return created;
}

/** Create customer from converted lead + optional booking link. */
export function createCustomerFromLead(params: {
    leadSlug: string;
    bookingSlug?: string;
    fullName: string;
    phone: string;
    email: string;
    projectName: string;
    unitNumber: string;
    assignedExecutive: string;
    leadSource: LeadSource;
}): Customer {
    if (params.bookingSlug) {
        const fromBooking = ensureCustomerFromBooking(params.bookingSlug);
        if (fromBooking) {
            return updateCustomer(fromBooking.slug, {
                fullName: params.fullName,
                phone: params.phone,
                email: params.email,
                projectName: params.projectName,
                unitNumber: params.unitNumber,
                assignedExecutive: params.assignedExecutive,
                leadSlug: params.leadSlug,
                leadSource: params.leadSource,
            })!;
        }
    }
    const lead = getLeads().find((l) => l.slug === params.leadSlug);
    const id = _nextId++;
    const slugBase = slugifyCustomer(params.fullName);
    let slug = slugBase;
    let n = 0;
    while (_customers.some((c) => c.slug === slug)) {
        n += 1;
        slug = `${slugBase}-${n}`;
    }
    const now = new Date().toISOString();
    const ymd = now.slice(0, 10);
    const row: Customer = {
        id,
        slug,
        customerCode: formatCustomerCode(id),
        fullName: params.fullName.trim(),
        phone: params.phone.trim(),
        email: params.email.trim(),
        leadId: lead ? formatLeadCode(lead.id) : 'AR-NEW',
        leadSlug: params.leadSlug,
        leadSource: params.leadSource,
        bookingSlug: params.bookingSlug ?? `pending-${slug}`,
        bookingId: params.bookingSlug ? formatBookingDisplayId(params.bookingSlug) : `BK-PENDING-${id}`,
        projectName: params.projectName,
        unitNumber: params.unitNumber,
        bookingStatus: 'Pending',
        assignedExecutive: params.assignedExecutive,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        paymentStatus: 'Pending',
        customerStatus: 'Onboarding',
        lastPaymentDate: '',
        createdDate: ymd,
        bookingDate: ymd,
        paymentLink: `https://pay.mysft.ai/customer/${slug}`,
        paymentHistory: [],
        documents: [],
        projectUpdates: [],
        journeyTimeline: defaultJourney({
            fullName: params.fullName,
            leadSource: params.leadSource,
            bookingDate: ymd,
            createdDate: ymd,
        }),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
    };
    _customers = [row, ..._customers];
    return row;
}

export function addCustomer(core: {
    fullName: string;
    phone: string;
    email: string;
    projectName: string;
    unitNumber: string;
    assignedExecutive: string;
    leadSource: LeadSource;
    leadSlug?: string;
    bookingSlug?: string;
}): Customer {
    const lead = core.leadSlug ? getLeads().find((l) => l.slug === core.leadSlug) : undefined;
    return createCustomerFromLead({
        leadSlug: core.leadSlug ?? slugifyCustomer(core.fullName),
        bookingSlug: core.bookingSlug,
        fullName: core.fullName,
        phone: core.phone,
        email: core.email,
        projectName: core.projectName,
        unitNumber: core.unitNumber,
        assignedExecutive: core.assignedExecutive,
        leadSource: core.leadSource,
    });
}

export function updateCustomer(slug: string, patch: Partial<Customer>): Customer | undefined {
    const i = _customers.findIndex((c) => c.slug === slug);
    if (i < 0) return undefined;
    const now = new Date().toISOString();
    _customers[i] = syncFinancials({ ..._customers[i]!, ...patch, updatedAt: now });
    return _customers[i];
}

export function archiveCustomer(slug: string): boolean {
    const c = updateCustomer(slug, { customerStatus: 'Archived', deletedAt: new Date().toISOString() });
    return !!c;
}

export function restoreCustomer(slug: string): boolean {
    const i = _customers.findIndex((c) => c.slug === slug);
    if (i < 0) return false;
    _customers[i] = { ..._customers[i]!, deletedAt: null, customerStatus: 'Active', updatedAt: new Date().toISOString() };
    return true;
}

export function deleteCustomerPermanent(slug: string): boolean {
    const before = _customers.length;
    _customers = _customers.filter((c) => c.slug !== slug);
    return _customers.length < before;
}

export function duplicateCustomer(slug: string): Customer | undefined {
    const src = getCustomerBySlugIncludingArchived(slug);
    if (!src) return undefined;
    const id = _nextId++;
    let newSlug = `${src.slug}-copy`;
    let n = 0;
    while (_customers.some((c) => c.slug === newSlug)) {
        n += 1;
        newSlug = `${src.slug}-copy-${n}`;
    }
    const now = new Date().toISOString();
    const copy: Customer = {
        ...JSON.parse(JSON.stringify(src)) as Customer,
        id,
        slug: newSlug,
        customerCode: formatCustomerCode(id),
        bookingId: `${src.bookingId}-COPY`,
        fullName: `${src.fullName} (Copy)`,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        customerStatus: 'Onboarding',
    };
    _customers = [copy, ..._customers];
    return copy;
}

export function bulkArchiveCustomers(slugs: string[]): number {
    let n = 0;
    for (const s of slugs) {
        if (archiveCustomer(s)) n += 1;
    }
    return n;
}

export function bulkDeleteCustomersPermanent(slugs: string[]): number {
    let n = 0;
    for (const s of slugs) {
        if (deleteCustomerPermanent(s)) n += 1;
    }
    return n;
}

export function bulkAssignExecutive(slugs: string[], executive: string): number {
    let n = 0;
    for (const s of slugs) {
        if (updateCustomer(s, { assignedExecutive: executive })) n += 1;
    }
    return n;
}

export function getCustomerExecutiveOptions(): string[] {
    const set = new Set<string>();
    for (const c of _customers) {
        if (c.assignedExecutive?.trim()) set.add(c.assignedExecutive.trim());
    }
    for (const l of getLeads()) {
        if (l.assignedTo?.trim()) set.add(l.assignedTo.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
}

export function getCustomerProjectOptions(): string[] {
    const set = new Set<string>();
    for (const c of _customers) {
        if (c.projectName?.trim()) set.add(c.projectName.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
}

export function normalizeCustomerPhoneDigits(phone: string): string {
    return phone.replace(/\D/g, '');
}

export function peekNextCustomerCode(): string {
    return formatCustomerCode(_nextId);
}
