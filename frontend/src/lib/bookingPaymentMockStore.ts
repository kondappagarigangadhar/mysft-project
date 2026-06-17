/**
 * In-memory mock store for Booking & Payment Tracking (company admin module).
 * Primary identifiers use URL-safe slugs (not numeric ids).
 *
 * Project / unit / pricing alignment: see `demoCatalog.ts` (matches leads + inventory store).
 */

import { getDemoProjectNamesList, getDemoUnitOptionsForProject } from '@/lib/demoCatalog';
import { formatLeadCode, getLeadByLeadCode, getLeads } from '@/lib/leadStore';
import { defaultConfigurationForUnitType, getProjects, getUnits } from '@/lib/projectsInventoryStore';

export type BookingStatus = 'Confirmed' | 'Cancelled' | 'Pending';
export type PaymentMode = 'Cash' | 'Bank' | 'UPI';
export type PaymentRecordStatus = 'Completed' | 'Pending' | 'Failed';
export type PaymentPurpose = 'Booking' | 'Installment';
export type PaymentSource = 'Manual' | 'Payment Link';
export type LinkPaymentStatus = 'Success' | 'Failed' | 'Pending';
export type LinkGatewayMode = 'UPI' | 'Card' | 'Net Banking';
/** Stored on the link row */
export type PaymentLinkLifecycle = 'active' | 'paid' | 'cancelled';
/** UI-facing status (includes time-based Expired) */
export type PaymentLinkDisplayStatus = 'Active' | 'Paid' | 'Expired' | 'Cancelled';
export type InstallmentTrackStatus = 'Completed' | 'Partial' | 'Pending';

export function slugifySegment(input: string): string {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48);
}

function uniqueBookingSlug(projectName: string, unitId: string): string {
    const base = `${slugifySegment(projectName)}-${slugifySegment(unitId)}`;
    let s = base;
    let n = 0;
    while (_bookings.some((b) => b.slug === s)) {
        n += 1;
        s = `${base}-${n}`;
    }
    return s;
}

/** How payments are structured for the buyer portal: milestone schedule vs direct (lump) payments. */
export type DealPaymentMode = 'milestone' | 'direct';

export interface BookingRecord {
    slug: string;
    created_at?: string;
    updated_at?: string;
    leadId: string;
    /** Assignee display name — same pool as Leads “Assigned To”. */
    assignedTo: string;
    customerName: string;
    phone: string;
    projectName: string;
    unitId: string;
    /** e.g. 2 BHK — aligned with inventory `unit.configuration`. */
    unitConfiguration?: string;
    unitPrice: number;
    bookingDate: string;
    status: BookingStatus;
    unitStatus: 'Booked' | 'Available';
    /** Set when the booking is created (company admin); drives buyer payment summary layout. */
    dealPaymentMode?: DealPaymentMode;
    /** Optional office notes (KYC step, compliance). */
    notes?: string;
}

export interface BookingHistoryEntry {
    id: string;
    bookingSlug: string;
    at: string;
    action: string;
    detail: string;
}

export interface BookingDocument {
    bookingSlug: string;
    fileName: string | null;
    uploadedAt: string | null;
}

export type BookingDocumentUploadStatus = 'uploaded' | 'failed';

/** One uploaded file row for a booking (multiple allowed per booking). */
export interface BookingDocumentFile {
    id: string;
    fileName: string;
    uploadedAt: string;
    status: BookingDocumentUploadStatus;
}

/** Per-payment schedule (not global booking plan). */
export type PaymentScheduleType = 'full' | 'installment';

/** Add-payment UI: one-time vs how often installments repeat (maps to PaymentFrequency). */
export type PayCadenceOption = 'one_time' | 'weekly' | 'monthly' | 'bimonthly' | 'half_yearly' | 'yearly';

export function payCadenceToSchedule(payCadence: PayCadenceOption): {
    scheduleType: PaymentScheduleType;
    frequency: PaymentFrequency | null;
} {
    if (payCadence === 'one_time') return { scheduleType: 'full', frequency: null };
    const map: Record<Exclude<PayCadenceOption, 'one_time'>, PaymentFrequency> = {
        weekly: 'weekly',
        monthly: 'monthly',
        bimonthly: 'bimonthly',
        half_yearly: 'half_yearly',
        yearly: 'yearly',
    };
    return { scheduleType: 'installment', frequency: map[payCadence] };
}

/** Suggested number of installments when user picks a cadence (editable in UI). */
export function defaultInstallmentCountForCadence(payCadence: PayCadenceOption): number {
    switch (payCadence) {
        case 'weekly':
            return 12;
        case 'monthly':
            return 12;
        case 'bimonthly':
            return 6;
        case 'half_yearly':
            return 4;
        case 'yearly':
            return 2;
        default:
            return 1;
    }
}

export function formatPayCadenceLabel(payCadence: PayCadenceOption): string {
    const map: Record<PayCadenceOption, string> = {
        one_time: 'One-time (full payment)',
        weekly: 'Weekly',
        monthly: 'Monthly',
        bimonthly: 'Every 2 months',
        half_yearly: 'Every 6 months',
        yearly: 'Yearly',
    };
    return map[payCadence];
}
export type PaymentFrequency =
    | 'weekly'
    | 'monthly'
    | 'bimonthly'
    | 'quarterly'
    | 'half_yearly'
    | 'yearly'
    | 'custom';

export interface PaymentInstallmentLine {
    installmentNo: number;
    dueDate: string;
    expectedAmount: number;
    paidAmount: number;
    pendingAmount: number;
    status: 'Paid' | 'Pending' | 'Overdue';
}

export interface PaymentRecord {
    slug: string;
    bookingSlug: string;
    /** Milestone id from the payment plan for this booking */
    milestoneId: string;
    /** Gateway / ledger transaction id (generated for new payments; receipt # stays separate). */
    transactionId?: string;
    amount: number;
    date: string;
    mode: PaymentMode;
    receiptNumber: string;
    status: PaymentRecordStatus;
    source: PaymentSource;
    /** When source is Payment Link, the originating link slug */
    paymentLinkSlug?: string;
    /** Full = one lump; installment = split into rows below */
    scheduleType?: PaymentScheduleType;
    frequency?: PaymentFrequency | null;
    /** First due date for generated installment rows */
    scheduleStartDate?: string;
    installmentLines?: PaymentInstallmentLine[];
    /** Set when user generates a receipt (draft) from the ledger; completed payments are receipt-ready without this. */
    receiptGeneratedAt?: string;
}

export interface MilestoneRow {
    id: string;
    name: string;
    amount: number;
    dueDate: string;
    /** Share of booking unit price (0–100) */
    percentageOfTotal: number;
}

export interface PaymentPlan {
    planName: string;
    installmentCount: number;
    milestones: MilestoneRow[];
    /** Sum of milestone amounts (= unit price when plan is complete) */
    totalPlanAmount: number;
}

export interface InstallmentTrackRow {
    milestoneId: string;
    milestoneName: string;
    expectedAmount: number;
    paidAmount: number;
    pendingAmount: number;
    dueDate: string;
    overdueDays: number;
    status: InstallmentTrackStatus;
}

/** Ledger row with computed fields for the Payments UI */
export interface PaymentLedgerRow extends PaymentRecord {
    balanceAfter: number;
    milestoneName: string;
    /** Receipt # shown as Payment ID in ledger */
    ledgerPaymentId: string;
    scheduleTypeResolved: PaymentScheduleType;
    frequencyLabel: string;
    scheduleStartDisplay: string;
    installmentLinesDisplay: PaymentInstallmentLine[];
}

/** How the shareable link is delivered to the customer (mock UI). */
export type PaymentLinkSendVia = 'Email' | 'SMS' | 'WhatsApp' | 'Email & SMS' | 'All channels';

export interface PaymentLinkRecord {
    slug: string;
    bookingSlug: string;
    amount: number;
    purpose: PaymentPurpose;
    expiryDate: string;
    url: string;
    createdAt: string;
    linkStatus: PaymentLinkLifecycle;
    /** Target milestone when this link is paid (ledger + tracking) */
    milestoneId: string;
    /** Delivery channel(s) selected when creating the link */
    sendVia?: PaymentLinkSendVia;
    transactionId?: string;
    paymentMode?: LinkGatewayMode;
    /** YYYY-MM-DD when the link was paid */
    paidAt?: string;
}

export interface PaymentCompletionInfo {
    transactionId: string;
    status: LinkPaymentStatus;
    mode: LinkGatewayMode;
}

export interface AuditLogEntry {
    slug: string;
    at: string;
    actor: string;
    action: string;
    meta?: string;
}

const seedBookings: BookingRecord[] = [
    {
        slug: 'skyline-residency-101',
        created_at: '2026-03-01T10:00:00.000Z',
        updated_at: '2026-03-01T10:00:00.000Z',
        leadId: 'AR-1',
        assignedTo: 'Amit Sales',
        customerName: 'Ramesh Kumar',
        phone: '9876543210',
        projectName: 'Skyline Residency',
        unitId: '101',
        unitConfiguration: '2 BHK',
        unitPrice: 6200000,
        bookingDate: '2026-03-01',
        status: 'Confirmed',
        unitStatus: 'Booked',
        dealPaymentMode: 'milestone',
    },
    {
        slug: 'urban-flux-apartments-102',
        created_at: '2026-03-18T10:00:00.000Z',
        updated_at: '2026-03-18T10:00:00.000Z',
        leadId: 'AR-2',
        assignedTo: 'Priya Reddy',
        customerName: 'Anita Sharma',
        phone: '9845012345',
        projectName: 'Urban Flux Apartments',
        unitId: '102',
        unitPrice: 6650000,
        bookingDate: '2026-03-18',
        status: 'Pending',
        unitStatus: 'Booked',
        dealPaymentMode: 'direct',
    },
    {
        slug: 'summit-woods-suresh-v7',
        created_at: '2026-03-06T09:00:00.000Z',
        updated_at: '2026-03-20T11:00:00.000Z',
        leadId: 'AR-3',
        assignedTo: 'Vikram Singh',
        customerName: 'Suresh Raina',
        phone: '9122334455',
        projectName: 'Summit Woods',
        unitId: 'V7',
        unitConfiguration: 'Villa',
        unitPrice: 25000000,
        bookingDate: '2026-03-06',
        status: 'Pending',
        unitStatus: 'Booked',
        dealPaymentMode: 'milestone',
    },
    {
        slug: 'phoenix-retail-pallavi-14',
        created_at: '2026-03-11T08:00:00.000Z',
        updated_at: '2026-03-22T14:00:00.000Z',
        leadId: 'AR-6',
        assignedTo: 'Rajesh Kumar',
        customerName: 'Pallavi Joshi',
        phone: '9444556677',
        projectName: 'Phoenix MarketCity Retail',
        unitId: '14',
        unitConfiguration: 'Retail',
        unitPrice: 32000000,
        bookingDate: '2026-03-11',
        status: 'Confirmed',
        unitStatus: 'Booked',
        dealPaymentMode: 'milestone',
    },
    {
        slug: 'skyline-residency-rahul-902',
        created_at: '2026-02-20T10:00:00.000Z',
        updated_at: '2026-03-15T16:00:00.000Z',
        leadId: 'AR-11',
        assignedTo: 'Rajesh Kumar',
        customerName: 'Rahul Desai',
        phone: '9900112233',
        projectName: 'Skyline Residency',
        unitId: '902',
        unitConfiguration: '3 BHK',
        unitPrice: 11200000,
        bookingDate: '2026-02-20',
        status: 'Confirmed',
        unitStatus: 'Booked',
        dealPaymentMode: 'direct',
    },
    {
        slug: 'summit-woods-kavita-v3',
        created_at: '2026-03-07T09:30:00.000Z',
        updated_at: '2026-03-23T10:00:00.000Z',
        leadId: 'AR-10',
        assignedTo: 'Vikram Singh',
        customerName: 'Kavita Menon',
        phone: '9888990011',
        projectName: 'Summit Woods',
        unitId: 'V3',
        unitConfiguration: 'Villa',
        unitPrice: 21000000,
        bookingDate: '2026-03-07',
        status: 'Confirmed',
        unitStatus: 'Booked',
        dealPaymentMode: 'milestone',
    },
    {
        slug: 'green-valley-arjun-1204',
        created_at: '2026-02-28T11:00:00.000Z',
        updated_at: '2026-03-24T09:00:00.000Z',
        leadId: 'AR-7',
        assignedTo: 'Amit Sales',
        customerName: 'Arjun Verma',
        phone: '9555667788',
        projectName: 'Green Valley Phase 2',
        unitId: '1204',
        unitConfiguration: '3 BHK',
        unitPrice: 7200000,
        bookingDate: '2026-02-28',
        status: 'Pending',
        unitStatus: 'Booked',
        dealPaymentMode: 'milestone',
    },
    {
        slug: 'skyline-residency-deepak-508',
        created_at: '2026-03-19T10:00:00.000Z',
        updated_at: '2026-03-22T09:00:00.000Z',
        leadId: 'AR-9',
        assignedTo: 'Sneha Reddy',
        customerName: 'Deepak Nair',
        phone: '9777889900',
        projectName: 'Skyline Residency',
        unitId: '508',
        unitConfiguration: '2 BHK',
        unitPrice: 5500000,
        bookingDate: '2026-03-19',
        status: 'Pending',
        unitStatus: 'Booked',
        dealPaymentMode: 'milestone',
    },
    {
        slug: 'metro-heights-rohit-804',
        created_at: '2026-03-14T11:00:00.000Z',
        updated_at: '2026-03-23T15:00:00.000Z',
        leadId: 'AR-13',
        assignedTo: 'Vikram Singh',
        customerName: 'Rohit Khanna',
        phone: '9122334456',
        projectName: 'Metro Heights',
        unitId: '804',
        unitConfiguration: '3 BHK',
        unitPrice: 7800000,
        bookingDate: '2026-03-14',
        status: 'Pending',
        unitStatus: 'Booked',
        dealPaymentMode: 'milestone',
    },
    {
        slug: 'metro-heights-karan-512',
        created_at: '2026-03-21T09:30:00.000Z',
        updated_at: '2026-03-24T10:00:00.000Z',
        leadId: 'AR-15',
        assignedTo: 'Sneha Reddy',
        customerName: 'Karan Mehta',
        phone: '9344556678',
        projectName: 'Metro Heights',
        unitId: '512',
        unitConfiguration: '2 BHK',
        unitPrice: 4800000,
        bookingDate: '2026-03-21',
        status: 'Pending',
        unitStatus: 'Booked',
        dealPaymentMode: 'direct',
    },
];

let _bookings: BookingRecord[] = [...seedBookings];

const _history: BookingHistoryEntry[] = [
    {
        id: 'h1',
        bookingSlug: 'skyline-residency-101',
        at: new Date().toISOString(),
        action: 'Booking created',
        detail: 'Status: Confirmed',
    },
];

/** Multiple files per booking; history logs each upload separately. */
let _bookingDocumentFiles: Array<{ bookingSlug: string } & BookingDocumentFile> = [
    {
        id: 'df-seed-1',
        bookingSlug: 'skyline-residency-101',
        fileName: 'agreement-draft.pdf',
        uploadedAt: new Date().toISOString(),
        status: 'uploaded',
    },
];

/** Add calendar days to a YYYY-MM-DD string (local date; avoids UTC drift). */
function addCalendarDaysToIso(bookingDateIso: string, days: number): string {
    const [y, m, d] = bookingDateIso.slice(0, 10).split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
}

function addCalendarMonthsToIso(iso: string, months: number): string {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    const dt = new Date(y, m - 1 + months, d);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
}

function splitEqualAmounts(total: number, count: number): number[] {
    if (count < 1) return [];
    const base = Math.floor(total / count);
    const rem = total - base * count;
    return Array.from({ length: count }, (_, i) => base + (i < rem ? 1 : 0));
}

function nthDueDateForFrequency(startDate: string, frequency: PaymentFrequency, index: number): string {
    switch (frequency) {
        case 'weekly':
            return addCalendarDaysToIso(startDate, 7 * index);
        case 'monthly':
        case 'custom':
            return addCalendarMonthsToIso(startDate, index);
        case 'bimonthly':
            return addCalendarMonthsToIso(startDate, 2 * index);
        case 'quarterly':
            return addCalendarMonthsToIso(startDate, 3 * index);
        case 'half_yearly':
            return addCalendarMonthsToIso(startDate, 6 * index);
        case 'yearly':
            return addCalendarMonthsToIso(startDate, 12 * index);
        default:
            return addCalendarMonthsToIso(startDate, index);
    }
}

/** Build equal installment lines for a payment amount (per-payment schedule). */
export function generateInstallmentSchedule(params: {
    totalAmount: number;
    installmentCount: number;
    frequency: PaymentFrequency;
    startDate: string;
    paymentStatus: PaymentRecordStatus;
}): PaymentInstallmentLine[] {
    const { totalAmount, installmentCount, frequency, startDate, paymentStatus } = params;
    if (installmentCount < 1 || totalAmount <= 0) return [];
    const amounts = splitEqualAmounts(totalAmount, installmentCount);
    const today = new Date().toISOString().slice(0, 10);
    const isFullyCompleted = paymentStatus === 'Completed';

    return amounts.map((expectedAmount, i) => {
        const dueDate = nthDueDateForFrequency(startDate, frequency, i);
        const paidAmount = isFullyCompleted ? expectedAmount : 0;
        const pendingAmount = Math.max(0, expectedAmount - paidAmount);
        let status: PaymentInstallmentLine['status'];
        if (pendingAmount <= 0) status = 'Paid';
        else if (dueDate < today) status = 'Overdue';
        else status = 'Pending';
        return {
            installmentNo: i + 1,
            dueDate,
            expectedAmount,
            paidAmount,
            pendingAmount,
            status,
        };
    });
}

export function formatFrequencyLabel(frequency: PaymentFrequency | null | undefined): string {
    if (!frequency) return '—';
    const map: Record<PaymentFrequency, string> = {
        weekly: 'Weekly',
        monthly: 'Monthly',
        bimonthly: 'Every 2 months',
        quarterly: 'Quarterly',
        half_yearly: 'Every 6 months',
        yearly: 'Yearly',
        custom: 'Custom',
    };
    return map[frequency] ?? frequency;
}

/** Human-readable spacing between installment due dates (matches `nthDueDateForFrequency`). */
export function frequencyIntervalDescription(frequency: PaymentFrequency | null | undefined): string {
    if (!frequency) return '—';
    const map: Record<PaymentFrequency, string> = {
        weekly: 'Dues every 1 week',
        monthly: 'Dues every 1 month',
        bimonthly: 'Dues every 2 months',
        quarterly: 'Dues every 3 months',
        half_yearly: 'Dues every 6 months',
        yearly: 'Dues every 12 months',
        custom: 'Custom spacing',
    };
    return map[frequency] ?? '—';
}

/** Replace installment lines for a pending installment payment (demo). Recomputes derived fields on read. */
export function updatePaymentInstallmentLines(
    paymentSlug: string,
    nextLines: PaymentInstallmentLine[]
): { ok: true } | { ok: false; error: string } {
    const i = _payments.findIndex((p) => p.slug === paymentSlug);
    if (i < 0) return { ok: false, error: 'Payment not found.' };
    const cur = _payments[i];
    if ((cur.scheduleType ?? 'full') !== 'installment') {
        return { ok: false, error: 'Not an installment payment.' };
    }
    if (!cur.installmentLines?.length) {
        return { ok: false, error: 'No installment lines to update.' };
    }
    if (cur.status === 'Completed') {
        return { ok: false, error: 'This payment is completed; installment lines are locked.' };
    }
    if (nextLines.length !== cur.installmentLines.length) {
        return { ok: false, error: 'Line count must match the existing schedule.' };
    }
    const sumExpected = nextLines.reduce((s, l) => s + l.expectedAmount, 0);
    if (Math.abs(sumExpected - cur.amount) > 2) {
        return { ok: false, error: 'Expected amounts must sum to the payment total.' };
    }
    for (const l of nextLines) {
        if (l.paidAmount < 0 || l.paidAmount > l.expectedAmount) {
            return { ok: false, error: 'Paid amount must be between 0 and expected for each line.' };
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(l.dueDate.slice(0, 10))) {
            return { ok: false, error: 'Each due date must be a valid YYYY-MM-DD.' };
        }
    }
    const normalized = nextLines
        .map((l) => {
            const paidAmount = Math.max(0, Math.min(l.expectedAmount, l.paidAmount));
            const pendingAmount = Math.max(0, l.expectedAmount - paidAmount);
            return { ...l, paidAmount, pendingAmount };
        })
        .sort((a, b) => a.installmentNo - b.installmentNo);
    _payments[i] = { ...cur, installmentLines: normalized };
    pushAudit('admin', 'Installment lines updated', paymentSlug);
    return { ok: true };
}

/** All installment-type payments for a booking with recomputed line status (for dedicated installments view). */
export function getInstallmentPaymentsForBooking(bookingSlug: string): Array<{
    payment: PaymentRecord;
    lines: PaymentInstallmentLine[];
    milestoneName: string;
}> {
    const booking = getBookingBySlug(bookingSlug);
    if (!booking) return [];
    const plan = buildPaymentPlanFromBooking(booking);
    const nameOf = (id: string) => plan.milestones.find((m) => m.id === id)?.name ?? id;

    return getPaymentsForBooking(bookingSlug)
        .filter((p) => (p.scheduleType ?? 'full') === 'installment' && (p.installmentLines?.length ?? 0) > 0)
        .map((p) => ({
            payment: p,
            lines: recomputeInstallmentLinesForPayment(p),
            milestoneName: nameOf(p.milestoneId),
        }))
        .sort((a, b) => a.payment.receiptNumber.localeCompare(b.payment.receiptNumber));
}

/** Refresh derived fields on installment lines for UI (overdue vs pending). */
export function recomputeInstallmentLinesForPayment(p: PaymentRecord): PaymentInstallmentLine[] {
    const lines = p.installmentLines ?? [];
    if (lines.length === 0) return [];
    const today = new Date().toISOString().slice(0, 10);
    if (p.status === 'Completed') {
        return lines.map((line) => ({
            ...line,
            paidAmount: line.expectedAmount,
            pendingAmount: 0,
            status: 'Paid' as const,
        }));
    }
    return lines.map((line) => {
        const paidAmount = line.paidAmount;
        const pendingAmount = Math.max(0, line.expectedAmount - paidAmount);
        let status: PaymentInstallmentLine['status'];
        if (pendingAmount <= 0) status = 'Paid';
        else if (line.dueDate < today) status = 'Overdue';
        else status = 'Pending';
        return { ...line, paidAmount, pendingAmount, status };
    });
}

let _payments: PaymentRecord[] = [
    {
        slug: 'payment-bank-500k-rcp77821',
        bookingSlug: 'skyline-residency-101',
        milestoneId: 'm1',
        transactionId: 'TXN-SKY-77821-BANK',
        amount: 500000,
        date: '2026-03-22',
        mode: 'Bank',
        receiptNumber: 'RCP-77821',
        status: 'Completed',
        source: 'Manual',
        scheduleType: 'full',
    },
    {
        slug: 'payment-upi-link-250k-rcp77823',
        bookingSlug: 'skyline-residency-101',
        milestoneId: 'm1',
        transactionId: 'TXN-SKY-77823-UPI',
        amount: 250000,
        date: '2026-03-25',
        mode: 'UPI',
        receiptNumber: 'RCP-77823',
        status: 'Completed',
        source: 'Payment Link',
        paymentLinkSlug: 'link-installment-250k',
        scheduleType: 'full',
    },
    {
        slug: 'payment-installment-demo-10l',
        bookingSlug: 'skyline-residency-101',
        milestoneId: 'm1',
        transactionId: 'TXN-SKY-INST-10L',
        amount: 1000000,
        date: '2026-03-15',
        mode: 'Bank',
        receiptNumber: 'RCP-77899',
        status: 'Pending',
        source: 'Manual',
        scheduleType: 'installment',
        frequency: 'monthly',
        scheduleStartDate: '2026-04-01',
        installmentLines: generateInstallmentSchedule({
            totalAmount: 1000000,
            installmentCount: 6,
            frequency: 'monthly',
            startDate: '2026-04-01',
            paymentStatus: 'Pending',
        }),
    },
    {
        slug: 'payment-upi-200k-rcp77822',
        bookingSlug: 'skyline-residency-101',
        milestoneId: 'm2',
        transactionId: 'TXN-SKY-77822-PEND',
        amount: 200000,
        date: '2026-03-28',
        mode: 'UPI',
        receiptNumber: 'RCP-77822',
        status: 'Pending',
        source: 'Manual',
        scheduleType: 'full',
    },
    {
        slug: 'payment-ufa-anita-bank-800k',
        bookingSlug: 'urban-flux-apartments-102',
        milestoneId: 'm1',
        transactionId: 'TXN-UF-90001-BANK',
        amount: 800000,
        date: '2026-03-24',
        mode: 'Bank',
        receiptNumber: 'RCP-UF-90001',
        status: 'Completed',
        source: 'Manual',
        scheduleType: 'full',
    },
    {
        slug: 'payment-ufa-anita-upi-350k',
        bookingSlug: 'urban-flux-apartments-102',
        milestoneId: 'm2',
        transactionId: 'TXN-UF-90002-UPI',
        amount: 350000,
        date: '2026-03-27',
        mode: 'UPI',
        receiptNumber: 'RCP-UF-90002',
        status: 'Pending',
        source: 'Manual',
        scheduleType: 'full',
    },
    {
        slug: 'payment-suresh-token-15l',
        bookingSlug: 'summit-woods-suresh-v7',
        milestoneId: 'm1',
        transactionId: 'TXN-SW-SURESH-15L',
        amount: 1500000,
        date: '2026-03-18',
        mode: 'Bank',
        receiptNumber: 'RCP-SW-88001',
        status: 'Pending',
        source: 'Manual',
        scheduleType: 'full',
    },
    {
        slug: 'payment-pallavi-bank-320l',
        bookingSlug: 'phoenix-retail-pallavi-14',
        milestoneId: 'm1',
        transactionId: 'TXN-PHX-PAL-320',
        amount: 32000000,
        date: '2026-03-12',
        mode: 'Bank',
        receiptNumber: 'RCP-PHX-90001',
        status: 'Completed',
        source: 'Manual',
        scheduleType: 'full',
    },
    {
        slug: 'payment-pallavi-final-50l',
        bookingSlug: 'phoenix-retail-pallavi-14',
        milestoneId: 'm2',
        transactionId: 'TXN-PHX-PAL-BAL',
        amount: 5000000,
        date: '2026-03-28',
        mode: 'UPI',
        receiptNumber: 'RCP-PHX-90002',
        status: 'Pending',
        source: 'Manual',
        scheduleType: 'full',
    },
    {
        slug: 'payment-rahul-full-112cr',
        bookingSlug: 'skyline-residency-rahul-902',
        milestoneId: 'm1',
        transactionId: 'TXN-SKY-RD-FULL',
        amount: 11200000,
        date: '2026-03-10',
        mode: 'Bank',
        receiptNumber: 'RCP-RD-77001',
        status: 'Completed',
        source: 'Manual',
        scheduleType: 'full',
    },
    {
        slug: 'payment-kavita-token-20pct',
        bookingSlug: 'summit-woods-kavita-v3',
        milestoneId: 'm1',
        transactionId: 'TXN-SW-KM-20',
        amount: 4200000,
        date: '2026-03-10',
        mode: 'Bank',
        receiptNumber: 'RCP-KM-88010',
        status: 'Completed',
        source: 'Manual',
        scheduleType: 'full',
    },
    {
        slug: 'payment-kavita-balance-pending',
        bookingSlug: 'summit-woods-kavita-v3',
        milestoneId: 'm2',
        transactionId: 'TXN-SW-KM-BAL',
        amount: 16800000,
        date: '2026-04-05',
        mode: 'Bank',
        receiptNumber: 'RCP-KM-88011',
        status: 'Pending',
        source: 'Manual',
        scheduleType: 'full',
    },
    {
        slug: 'payment-arjun-token-pending',
        bookingSlug: 'green-valley-arjun-1204',
        milestoneId: 'm1',
        transactionId: 'TXN-GV-ARJ-TKN',
        amount: 500000,
        date: '2026-03-22',
        mode: 'UPI',
        receiptNumber: 'RCP-ARJ-55001',
        status: 'Pending',
        source: 'Payment Link',
        scheduleType: 'full',
    },
    {
        slug: 'payment-deepak-eoi-1l',
        bookingSlug: 'skyline-residency-deepak-508',
        milestoneId: 'm1',
        transactionId: 'TXN-SKY-DN-EOI',
        amount: 100000,
        date: '2026-03-20',
        mode: 'UPI',
        receiptNumber: 'RCP-DN-88001',
        status: 'Completed',
        source: 'Manual',
        scheduleType: 'full',
    },
    {
        slug: 'payment-deepak-token-2l-pending',
        bookingSlug: 'skyline-residency-deepak-508',
        milestoneId: 'm2',
        transactionId: 'TXN-SKY-DN-TKN',
        amount: 200000,
        date: '2026-03-28',
        mode: 'Bank',
        receiptNumber: 'RCP-DN-88002',
        status: 'Pending',
        source: 'Manual',
        scheduleType: 'full',
    },
    {
        slug: 'payment-rohit-token-15l',
        bookingSlug: 'metro-heights-rohit-804',
        milestoneId: 'm1',
        transactionId: 'TXN-MH-RH-15L',
        amount: 1500000,
        date: '2026-03-16',
        mode: 'Bank',
        receiptNumber: 'RCP-RH-77001',
        status: 'Completed',
        source: 'Manual',
        scheduleType: 'full',
    },
    {
        slug: 'payment-rohit-loan-fee-pending',
        bookingSlug: 'metro-heights-rohit-804',
        milestoneId: 'm2',
        transactionId: 'TXN-MH-RH-LOAN',
        amount: 50000,
        date: '2026-04-02',
        mode: 'Bank',
        receiptNumber: 'RCP-RH-77002',
        status: 'Pending',
        source: 'Manual',
        scheduleType: 'full',
    },
    {
        slug: 'payment-karan-token-3l-pending',
        bookingSlug: 'metro-heights-karan-512',
        milestoneId: 'm1',
        transactionId: 'TXN-MH-KM-TKN',
        amount: 300000,
        date: '2026-03-26',
        mode: 'UPI',
        receiptNumber: 'RCP-KM2-55001',
        status: 'Pending',
        source: 'Payment Link',
        scheduleType: 'full',
    },
];

const receiptNumbers = new Set(_payments.map((p) => p.receiptNumber));

/** Plan milestones are derived from booking unit price (20% / 30% / 50%). Due dates anchor to booking date. */
export function buildPaymentPlanFromBooking(b: BookingRecord): PaymentPlan {
    const anchor = b.bookingDate.slice(0, 10);
    const parts = [
        { id: 'm1', name: 'Booking', pct: 20, dueOffset: 0 },
        { id: 'm2', name: 'Slab 1', pct: 30, dueOffset: 30 },
        { id: 'm3', name: 'Slab 2', pct: 50, dueOffset: 90 },
    ];
    const milestones: MilestoneRow[] = parts.map((p) => ({
        id: p.id,
        name: p.name,
        amount: Math.round((b.unitPrice * p.pct) / 100),
        dueDate: addCalendarDaysToIso(anchor, p.dueOffset),
        percentageOfTotal: p.pct,
    }));
    const totalPlanAmount = milestones.reduce((s, m) => s + m.amount, 0);
    return {
        planName: 'Standard construction-linked',
        installmentCount: milestones.length,
        milestones,
        totalPlanAmount,
    };
}

export function getPaymentPlanForBooking(bookingSlug: string): PaymentPlan | null {
    const b = getBookingBySlug(bookingSlug);
    if (!b) return null;
    return buildPaymentPlanFromBooking(b);
}

function startOfDayMs(isoDate: string): number {
    const [y, m, d] = isoDate.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
}

function overdueDaysForMilestone(dueDate: string, status: InstallmentTrackStatus): number {
    if (status === 'Completed') return 0;
    const due = startOfDayMs(dueDate);
    const today = startOfDayMs(new Date().toISOString().slice(0, 10));
    if (today <= due) return 0;
    return Math.round((today - due) / 86400000);
}

function paidForMilestone(bookingSlug: string, milestoneId: string): number {
    return _payments
        .filter((p) => p.bookingSlug === bookingSlug && p.milestoneId === milestoneId && p.status === 'Completed')
        .reduce((s, p) => s + p.amount, 0);
}

export function sumCompletedPaymentsForBooking(bookingSlug: string, excludePaymentSlug?: string): number {
    return _payments
        .filter((p) => p.bookingSlug === bookingSlug && p.status === 'Completed' && p.slug !== excludePaymentSlug)
        .reduce((s, p) => s + p.amount, 0);
}

export function getInstallmentTrackingForBooking(bookingSlug: string): InstallmentTrackRow[] {
    const plan = getPaymentPlanForBooking(bookingSlug);
    if (!plan) return [];
    return plan.milestones.map((m) => {
        const paidAmount = paidForMilestone(bookingSlug, m.id);
        const pendingAmount = Math.max(0, m.amount - paidAmount);
        let status: InstallmentTrackStatus;
        if (paidAmount >= m.amount) status = 'Completed';
        else if (paidAmount > 0) status = 'Partial';
        else status = 'Pending';
        const overdueDays = overdueDaysForMilestone(m.dueDate, status);
        return {
            milestoneId: m.id,
            milestoneName: m.name,
            expectedAmount: m.amount,
            paidAmount,
            pendingAmount,
            dueDate: m.dueDate,
            overdueDays,
            status,
        };
    });
}

export function getPaymentLedgerRows(bookingSlug: string): PaymentLedgerRow[] {
    const booking = getBookingBySlug(bookingSlug);
    if (!booking) return [];
    const plan = buildPaymentPlanFromBooking(booking);
    const nameOf = (id: string) => plan.milestones.find((m) => m.id === id)?.name ?? id;

    const list = _payments.filter((p) => p.bookingSlug === bookingSlug);
    const sortedAsc = [...list].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.slug.localeCompare(b.slug);
    });

    let remaining = booking.unitPrice;
    const balanceAfter = new Map<string, number>();
    for (const p of sortedAsc) {
        if (p.status === 'Completed') {
            remaining -= p.amount;
        }
        balanceAfter.set(p.slug, remaining);
    }

    return sortedAsc
        .map((p) => {
            const scheduleTypeResolved: PaymentScheduleType = p.scheduleType ?? 'full';
            const installmentLinesDisplay =
                scheduleTypeResolved === 'installment' && (p.installmentLines?.length ?? 0) > 0
                    ? recomputeInstallmentLinesForPayment(p)
                    : [];
            return {
                ...p,
                balanceAfter: balanceAfter.get(p.slug) ?? remaining,
                milestoneName: nameOf(p.milestoneId),
                ledgerPaymentId: p.receiptNumber,
                scheduleTypeResolved,
                frequencyLabel: formatFrequencyLabel(p.frequency ?? undefined),
                scheduleStartDisplay: p.scheduleStartDate ?? p.date,
                installmentLinesDisplay,
            };
        })
        .reverse();
}

export interface BookingPaymentSummary {
    unitPrice: number;
    paidCompleted: number;
    outstanding: number;
    progressPct: number;
}

export function getBookingPaymentSummary(bookingSlug: string): BookingPaymentSummary | null {
    const b = getBookingBySlug(bookingSlug);
    if (!b) return null;
    const paidCompleted = sumCompletedPaymentsForBooking(bookingSlug);
    const outstanding = Math.max(0, b.unitPrice - paidCompleted);
    const progressPct = b.unitPrice > 0 ? Math.min(100, Math.round((paidCompleted / b.unitPrice) * 1000) / 10) : 0;
    return { unitPrice: b.unitPrice, paidCompleted, outstanding, progressPct };
}

let _paymentLinks: PaymentLinkRecord[] = [
    {
        slug: 'link-installment-250k',
        bookingSlug: 'skyline-residency-101',
        amount: 250000,
        purpose: 'Installment',
        expiryDate: '2026-04-06',
        url: 'https://pay.mysft.ai/link/pl_7x9k2m',
        createdAt: '2026-03-24T10:00:00.000Z',
        linkStatus: 'paid',
        milestoneId: 'm1',
        transactionId: 'TXN-9F3A2C',
        paymentMode: 'UPI',
        paidAt: '2026-03-25',
        sendVia: 'Email & SMS',
    },
    {
        slug: 'link-ufa-booking-150k',
        bookingSlug: 'urban-flux-apartments-102',
        amount: 150000,
        purpose: 'Booking',
        expiryDate: '2026-12-31',
        url: 'https://pay.mysft.ai/link/ufa_bk_demo',
        createdAt: '2026-03-20T09:00:00.000Z',
        linkStatus: 'active',
        milestoneId: 'm1',
        sendVia: 'WhatsApp',
    },
];

let _linkCompletion: PaymentCompletionInfo = {
    transactionId: 'TXN-9F3A2C',
    status: 'Success',
    mode: 'UPI',
};

let _reminderEnabled = true;
let _userConsent = false;

const _audit: AuditLogEntry[] = [
    { slug: 'audit-module-loaded', at: new Date().toISOString(), actor: 'system', action: 'Module loaded', meta: 'Booking & Payment' },
    { slug: 'audit-viewed-payments', at: new Date().toISOString(), actor: 'admin@mysft.ai', action: 'Viewed payments', meta: '' },
];

/** Select options for booking “Lead ID” — all active CRM leads (sortable by code). */
export function getLeadOptions(): { id: string; label: string }[] {
    return getLeads()
        .map((l) => {
            const code = formatLeadCode(l.id);
            const name = l.name?.trim() || 'Lead';
            const project = l.project?.trim() || '—';
            return { id: code, label: `${code} — ${name} · ${project}` };
        })
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

export function getProjectOptions(): string[] {
    return getDemoProjectNamesList();
}

export function getAvailableUnitOptions(projectName: string): { id: string; price: number; configuration: string }[] {
    const projects = getProjects();
    const p = projects.find((x) => x.project_name === projectName);
    if (!p) {
        return getDemoUnitOptionsForProject(projectName);
    }
    const units = getUnits().filter((u) => u.projectSlug === p.slug && u.availability_status === 'available');
    if (units.length === 0) {
        return getDemoUnitOptionsForProject(projectName);
    }
    return units.map((u) => ({
        id: u.unit_number,
        price: u.offer_price ?? u.price,
        configuration: (u.configuration && u.configuration.trim()) || defaultConfigurationForUnitType(u.unit_type),
    }));
}

/** Unique “Assigned To” names from Leads (same as create/edit lead forms). */
export function getBookingAssigneeOptions(): string[] {
    const set = new Set<string>();
    for (const l of getLeads()) {
        const a = l.assignedTo?.trim();
        if (a) set.add(a);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function getBookings(): BookingRecord[] {
    return [..._bookings];
}

export function getBookingBySlug(slug: string): BookingRecord | undefined {
    return _bookings.find((b) => b.slug === slug);
}

/**
 * Customer + CRM lead line for payment link list / detail / exports (matches create form booking labels).
 */
export function getPaymentLinkBookingParty(bookingSlug: string): {
    customerName: string;
    /** e.g. `AR-1 · Ramesh Kumar`, or the raw lead id when the CRM row is missing. */
    leadSummary: string;
} {
    const b = getBookingBySlug(bookingSlug);
    if (!b) return { customerName: '—', leadSummary: '—' };
    const customerName = b.customerName?.trim() || '—';
    const lead = getLeadByLeadCode(b.leadId);
    const leadSummary = lead ? `${b.leadId} · ${lead.name}`.trim() : (b.leadId?.trim() || '—');
    return { customerName, leadSummary };
}

export function getDealPaymentMode(bookingSlug: string): DealPaymentMode {
    const b = getBookingBySlug(bookingSlug);
    return b?.dealPaymentMode ?? 'milestone';
}

export function createBooking(
    input: Omit<BookingRecord, 'slug' | 'bookingDate' | 'unitStatus'> & { bookingDate?: string }
): BookingRecord {
    const slug = uniqueBookingSlug(input.projectName, input.unitId);
    const bookingDate = input.bookingDate ?? new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();
    const row: BookingRecord = {
        ...input,
        dealPaymentMode: input.dealPaymentMode ?? 'milestone',
        slug,
        bookingDate,
        unitStatus: 'Booked',
        created_at: nowIso,
        updated_at: nowIso,
    };
    _bookings = [row, ..._bookings];
    _history.unshift({
        id: `h-${Date.now()}`,
        bookingSlug: slug,
        at: new Date().toISOString(),
        action: 'Booking created',
        detail: `Customer ${input.customerName} — ${input.status}`,
    });
    pushAudit('admin', 'Booking created', slug);
    if (row.status !== 'Cancelled' && typeof window !== 'undefined') {
        void import('@/lib/customersStore').then(({ ensureCustomerFromBooking }) => ensureCustomerFromBooking(slug));
    }
    return row;
}

/**
 * Records a completed advance against the booking’s first milestone (Booking / m1).
 * Triggers Pending → Confirmed when amount &gt; 0 (see `maybeConfirmBookingAfterAdvancePayment`).
 */
export function recordAdvancePaymentAtBooking(
    bookingSlug: string,
    amount: number,
    paymentDate: string
): { ok: true } | { ok: false; error: string } {
    if (!bookingSlug.trim()) return { ok: false, error: 'Booking is required.' };
    if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Enter a valid advance amount.' };
    const booking = getBookingBySlug(bookingSlug);
    if (!booking) return { ok: false, error: 'Booking not found.' };
    if (amount > booking.unitPrice) return { ok: false, error: 'Advance cannot exceed total booking amount.' };
    const plan = buildPaymentPlanFromBooking(booking);
    const m1 = plan.milestones[0];
    if (!m1) return { ok: false, error: 'No payment milestone for this booking.' };
    const receiptNumber = suggestNextReceiptNumber(bookingSlug);
    const res = addPayment({
        bookingSlug,
        milestoneId: m1.id,
        amount,
        date: paymentDate.slice(0, 10),
        mode: 'Bank',
        receiptNumber,
        status: 'Completed',
        source: 'Manual',
        scheduleType: 'full',
    });
    return res.ok ? { ok: true } : { ok: false, error: res.error };
}

export function updateBooking(slug: string, updates: Partial<Omit<BookingRecord, 'slug'>>): BookingRecord | undefined {
    const i = _bookings.findIndex((b) => b.slug === slug);
    if (i < 0) return undefined;
    _bookings[i] = { ..._bookings[i], ...updates, updated_at: new Date().toISOString() };
    _history.unshift({
        id: `h-${Date.now()}`,
        bookingSlug: slug,
        at: new Date().toISOString(),
        action: 'Booking updated',
        detail: JSON.stringify(updates),
    });
    pushAudit('admin', 'Booking updated', slug);
    return _bookings[i];
}

/**
 * When a payment is recorded against a booking with a positive amount, move the booking from Pending → Confirmed.
 * Failed payments are ignored; Pending/Completed both count as an advance line item with amount > 0.
 */
function maybeConfirmBookingAfterAdvancePayment(
    bookingSlug: string,
    paymentAmount: number,
    paymentStatus: PaymentRecordStatus
): void {
    if (!bookingSlug.trim() || paymentAmount <= 0) return;
    if (paymentStatus === 'Failed') return;
    const booking = getBookingBySlug(bookingSlug);
    if (!booking || booking.status !== 'Pending') return;
    updateBooking(bookingSlug, { status: 'Confirmed' });
}

/** Removes booking, its payments, uploaded booking documents, and payment links tied to this booking (mock store). */
export function deleteBooking(slug: string): { ok: true } | { ok: false; error: string } {
    const b = getBookingBySlug(slug);
    if (!b) return { ok: false, error: 'Booking not found.' };
    for (const p of _payments.filter((x) => x.bookingSlug === slug)) {
        receiptNumbers.delete(p.receiptNumber);
    }
    _payments = _payments.filter((p) => p.bookingSlug !== slug);
    _bookingDocumentFiles = _bookingDocumentFiles.filter((d) => d.bookingSlug !== slug);
    _paymentLinks = _paymentLinks.filter((l) => l.bookingSlug !== slug);
    _bookings = _bookings.filter((x) => x.slug !== slug);
    const at = new Date().toISOString();
    _history.unshift({
        id: `h-${Date.now()}`,
        bookingSlug: slug,
        at,
        action: 'Booking deleted',
        detail: b.customerName,
    });
    pushAudit('admin', 'Booking deleted', slug);
    return { ok: true };
}

export function getHistoryForBooking(bookingSlug: string): BookingHistoryEntry[] {
    return _history
        .filter((h) => h.bookingSlug === bookingSlug)
        .sort((a, b) => b.at.localeCompare(a.at));
}

export function getDocumentsForBooking(bookingSlug: string): BookingDocumentFile[] {
    return _bookingDocumentFiles
        .filter((d) => d.bookingSlug === bookingSlug)
        .map(({ id, fileName, uploadedAt, status }) => ({
            id,
            fileName,
            uploadedAt,
            status: status ?? 'uploaded',
        }))
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

/** Latest agreement-style row for legacy UIs (customer portal). */
export function getDocumentForBooking(bookingSlug: string): BookingDocument | undefined {
    const files = getDocumentsForBooking(bookingSlug);
    if (files.length === 0) return undefined;
    const latest = files[0];
    return {
        bookingSlug,
        fileName: latest.fileName,
        uploadedAt: latest.uploadedAt,
    };
}

export function addBookingDocument(
    bookingSlug: string,
    fileName: string,
    status: BookingDocumentUploadStatus = 'uploaded'
): BookingDocumentFile {
    const id = `df-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const uploadedAt = new Date().toISOString();
    _bookingDocumentFiles.push({ bookingSlug, id, fileName, uploadedAt, status });
    _history.unshift({
        id: `h-${Date.now()}`,
        bookingSlug,
        at: uploadedAt,
        action: status === 'uploaded' ? 'Document uploaded' : 'Document upload failed',
        detail: fileName,
    });
    pushAudit(
        'admin',
        status === 'uploaded' ? 'Document uploaded' : 'Document upload failed',
        `${bookingSlug}: ${fileName}`
    );
    return { id, fileName, uploadedAt, status };
}

export function replaceBookingDocument(
    bookingSlug: string,
    fileId: string,
    fileName: string,
    status: BookingDocumentUploadStatus = 'uploaded'
): BookingDocumentFile | undefined {
    const i = _bookingDocumentFiles.findIndex((d) => d.bookingSlug === bookingSlug && d.id === fileId);
    if (i < 0) return undefined;
    const prev = _bookingDocumentFiles[i].fileName;
    const uploadedAt = new Date().toISOString();
    _bookingDocumentFiles[i] = { ..._bookingDocumentFiles[i], fileName, uploadedAt, status };
    _history.unshift({
        id: `h-${Date.now()}`,
        bookingSlug,
        at: uploadedAt,
        action: status === 'uploaded' ? 'Document replaced' : 'Document replace failed',
        detail: status === 'uploaded' ? `${prev} → ${fileName}` : fileName,
    });
    pushAudit(
        'admin',
        status === 'uploaded' ? 'Document replaced' : 'Document replace failed',
        `${bookingSlug}: ${prev} → ${fileName}`
    );
    return { id: fileId, fileName, uploadedAt, status };
}

export function deleteBookingDocument(bookingSlug: string, fileId: string): boolean {
    const i = _bookingDocumentFiles.findIndex((d) => d.bookingSlug === bookingSlug && d.id === fileId);
    if (i < 0) return false;
    const removed = _bookingDocumentFiles[i];
    _bookingDocumentFiles.splice(i, 1);
    const at = new Date().toISOString();
    _history.unshift({
        id: `h-${Date.now()}`,
        bookingSlug,
        at,
        action: 'Document deleted',
        detail: removed.fileName,
    });
    pushAudit('admin', 'Document deleted', `${bookingSlug}: ${removed.fileName}`);
    return true;
}

/** @deprecated Prefer addBookingDocument — kept for compatibility; appends a file instead of replacing. */
export function setBookingDocument(bookingSlug: string, fileName: string): void {
    addBookingDocument(bookingSlug, fileName);
}

export function getPayments(): PaymentRecord[] {
    return [..._payments];
}

export function getPaymentsForBooking(bookingSlug: string): PaymentRecord[] {
    return _payments.filter((p) => p.bookingSlug === bookingSlug);
}

export function getPaymentBySlug(slug: string): PaymentRecord | undefined {
    return _payments.find((p) => p.slug === slug);
}

function generatePaymentSlug(): string {
    return `payment-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function generateTransactionId(): string {
    return `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/** Stable id for receipts / UI when older seed rows have no `transactionId`. */
export function getPaymentTransactionId(p: PaymentRecord): string {
    const t = p.transactionId?.trim();
    if (t) return t;
    const fromSlug = p.slug.replace(/[^a-z0-9]/gi, '').slice(-18);
    return fromSlug ? `TXN-${fromSlug.toUpperCase()}` : `TXN-${p.receiptNumber.replace(/\s/g, '')}`;
}

/** Completed payments always show a receipt; pending/failed can after “Generate receipt”. */
export function isPaymentReceiptReady(p: PaymentRecord): boolean {
    return p.status === 'Completed' || Boolean(p.receiptGeneratedAt?.trim());
}

export function markPaymentReceiptGenerated(slug: string): { ok: true; row: PaymentRecord } | { ok: false; error: string } {
    const i = _payments.findIndex((p) => p.slug === slug);
    if (i < 0) return { ok: false, error: 'Payment not found.' };
    const cur = _payments[i];
    const at = new Date().toISOString();
    _payments[i] = { ...cur, receiptGeneratedAt: cur.receiptGeneratedAt ?? at };
    pushAudit('admin', 'Receipt generated', slug);
    return { ok: true, row: _payments[i] };
}

export function addPayment(
    input: Omit<PaymentRecord, 'slug'> & { slug?: string }
): { ok: true; row: PaymentRecord } | { ok: false; error: string } {
    if (!input.milestoneId?.trim()) {
        return { ok: false, error: 'Milestone is required.' };
    }
    if (receiptNumbers.has(input.receiptNumber)) {
        return { ok: false, error: 'Receipt number must be unique.' };
    }
    const booking = getBookingBySlug(input.bookingSlug);
    if (!booking) {
        return { ok: false, error: 'Booking slug does not exist.' };
    }
    const plan = buildPaymentPlanFromBooking(booking);
    if (!plan.milestones.some((m) => m.id === input.milestoneId)) {
        return { ok: false, error: 'Milestone is not part of this booking plan.' };
    }
    if (input.status === 'Completed') {
        const sum = sumCompletedPaymentsForBooking(input.bookingSlug);
        if (sum + input.amount > booking.unitPrice) {
            return { ok: false, error: 'Completed payments cannot exceed total booking amount.' };
        }
    }
    const scheduleType: PaymentScheduleType = input.scheduleType ?? 'full';
    if (scheduleType === 'installment') {
        if (!input.frequency || !input.scheduleStartDate?.trim()) {
            return { ok: false, error: 'Installment payments require frequency and start date.' };
        }
        if (!input.installmentLines?.length) {
            return { ok: false, error: 'Installment schedule lines are required.' };
        }
        const sumLines = input.installmentLines.reduce((s, l) => s + l.expectedAmount, 0);
        if (Math.abs(sumLines - input.amount) > 2) {
            return { ok: false, error: 'Installment amounts must sum to the payment total.' };
        }
    }
    const slug = input.slug ?? generatePaymentSlug();
    receiptNumbers.add(input.receiptNumber);
    const row: PaymentRecord = {
        ...input,
        transactionId: input.transactionId ?? generateTransactionId(),
        source: input.source ?? 'Manual',
        slug,
        scheduleType,
        frequency: scheduleType === 'installment' ? input.frequency ?? null : null,
        scheduleStartDate: scheduleType === 'installment' ? input.scheduleStartDate : undefined,
        installmentLines: scheduleType === 'installment' ? input.installmentLines : undefined,
    };
    _payments = [row, ..._payments];
    pushAudit('admin', 'Payment recorded', slug);
    maybeConfirmBookingAfterAdvancePayment(row.bookingSlug, row.amount, row.status);
    return { ok: true, row };
}

export type PaymentImportRowInput = {
    /** Original file line (for error reporting). */
    lineNumber?: number;
    bookingSlug: string;
    milestoneId: string;
    amount: number;
    date: string;
    mode: PaymentMode;
    receiptNumber: string;
    status: PaymentRecordStatus;
};

/** Bulk import validated rows (e.g. from CSV). Each row uses `addPayment` rules. */
export function importPaymentRecordsBatch(
    rows: PaymentImportRowInput[]
): { imported: number; failures: { line?: number; receiptNumber: string; error: string }[] } {
    const failures: { line?: number; receiptNumber: string; error: string }[] = [];
    let imported = 0;
    for (const row of rows) {
        const res = addPayment({
            bookingSlug: row.bookingSlug,
            milestoneId: row.milestoneId,
            amount: row.amount,
            date: row.date,
            mode: row.mode,
            receiptNumber: row.receiptNumber,
            status: row.status,
            source: 'Manual',
            scheduleType: 'full',
        });
        if (!res.ok) {
            failures.push({ line: row.lineNumber, receiptNumber: row.receiptNumber, error: res.error });
        } else {
            imported++;
        }
    }
    return { imported, failures };
}

export function updatePayment(
    slug: string,
    updates: Partial<Omit<PaymentRecord, 'slug'>>
): { ok: true; row: PaymentRecord } | { ok: false; error: string } {
    const i = _payments.findIndex((p) => p.slug === slug);
    if (i < 0) return { ok: false, error: 'Payment not found.' };
    const current = _payments[i];
    const next: PaymentRecord = { ...current, ...updates };

    const booking = getBookingBySlug(next.bookingSlug);
    if (!booking) return { ok: false, error: 'Booking not found.' };

    if (!next.milestoneId?.trim()) {
        return { ok: false, error: 'Milestone is required.' };
    }
    const plan = buildPaymentPlanFromBooking(booking);
    if (!plan.milestones.some((m) => m.id === next.milestoneId)) {
        return { ok: false, error: 'Milestone is not part of this booking plan.' };
    }

    if (updates.receiptNumber !== undefined && updates.receiptNumber !== current.receiptNumber) {
        if (receiptNumbers.has(updates.receiptNumber)) {
            return { ok: false, error: 'Receipt number must be unique.' };
        }
    }

    if (next.status === 'Completed') {
        const sum = sumCompletedPaymentsForBooking(next.bookingSlug, slug);
        if (sum + next.amount > booking.unitPrice) {
            return { ok: false, error: 'Completed payments cannot exceed total booking amount.' };
        }
    }

    if (next.status === 'Completed' && (next.scheduleType ?? 'full') === 'installment' && next.installmentLines?.length) {
        next.installmentLines = next.installmentLines.map((line) => ({
            ...line,
            paidAmount: line.expectedAmount,
            pendingAmount: 0,
            status: 'Paid' as const,
        }));
    }

    if (updates.receiptNumber !== undefined && updates.receiptNumber !== current.receiptNumber) {
        receiptNumbers.delete(current.receiptNumber);
        receiptNumbers.add(updates.receiptNumber);
    }

    _payments[i] = next;
    pushAudit('admin', 'Payment updated', slug);
    maybeConfirmBookingAfterAdvancePayment(next.bookingSlug, next.amount, next.status);
    return { ok: true, row: _payments[i] };
}

/** Removes a payment row from the ledger (demo). Receipt number is freed for reuse. */
export function deletePayment(slug: string): { ok: true } | { ok: false; error: string } {
    const i = _payments.findIndex((p) => p.slug === slug);
    if (i < 0) return { ok: false, error: 'Payment not found.' };
    const cur = _payments[i];
    receiptNumbers.delete(cur.receiptNumber);
    _payments = _payments.filter((p) => p.slug !== slug);
    pushAudit('admin', 'Payment deleted', slug);
    return { ok: true };
}

export function receiptExists(receipt: string): boolean {
    return receiptNumbers.has(receipt);
}

/** Short uppercase tag from project name for receipt series (e.g. "Skyline Residency" → "SR"). */
function projectReceiptTag(projectName: string): string {
    const words = projectName.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
        const initials = words
            .map((w) => w[0] ?? '')
            .join('')
            .toUpperCase()
            .replace(/[^A-Z]/g, '');
        return (initials.slice(0, 8) || 'PRJ').slice(0, 8);
    }
    const s = slugifySegment(projectName).replace(/-/g, '');
    return (s.slice(0, 8).toUpperCase() || 'PRJ').slice(0, 8);
}

/**
 * Next receipt number for a booking’s project: `RCP-{PROJECT_TAG}-{#####}`.
 * Increments using existing payments for the same project that already use this format; avoids collisions with `receiptNumbers`.
 */
export function suggestNextReceiptNumber(bookingSlug: string): string {
    const booking = getBookingBySlug(bookingSlug);
    if (!booking) {
        return `RCP-GEN-${Date.now().toString(36).slice(-8).toUpperCase()}`;
    }
    const tag = projectReceiptTag(booking.projectName);
    const prefix = `RCP-${tag}-`;
    let maxSeq = 0;
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const seqRe = new RegExp(`^${escaped}(\\d+)$`);
    for (const p of _payments) {
        const b = getBookingBySlug(p.bookingSlug);
        if (!b || b.projectName !== booking.projectName) continue;
        const m = p.receiptNumber.match(seqRe);
        if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
    }
    let n = maxSeq + 1;
    let candidate = `${prefix}${String(n).padStart(5, '0')}`;
    while (receiptNumbers.has(candidate)) {
        n += 1;
        candidate = `${prefix}${String(n).padStart(5, '0')}`;
    }
    return candidate;
}

export function getPaymentLinks(): PaymentLinkRecord[] {
    return [..._paymentLinks];
}

export function getPaymentLinkBySlug(slug: string): PaymentLinkRecord | undefined {
    return _paymentLinks.find((l) => l.slug === slug);
}

function generateLinkSlug(): string {
    return `payment-link-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

export function generatePaymentLinkUrl(slug: string): string {
    const key = slugifySegment(slug).slice(0, 24) || 'link';
    return `https://pay.mysft.ai/link/${key}_${Math.random().toString(36).slice(2, 8)}`;
}

export function addPaymentLink(
    input: Omit<PaymentLinkRecord, 'slug' | 'url' | 'createdAt' | 'linkStatus' | 'milestoneId'> &
        Partial<Pick<PaymentLinkRecord, 'linkStatus' | 'milestoneId'>>
): PaymentLinkRecord {
    const slug = generateLinkSlug();
    const url = generatePaymentLinkUrl(slug);
    const row: PaymentLinkRecord = {
        ...input,
        linkStatus: input.linkStatus ?? 'active',
        milestoneId: input.milestoneId ?? 'm1',
        sendVia: input.sendVia ?? 'Email & SMS',
        slug,
        url,
        createdAt: new Date().toISOString(),
    };
    _paymentLinks = [row, ..._paymentLinks];
    pushAudit('admin', 'Payment link generated', slug);
    return row;
}

export function updatePaymentLink(slug: string, updates: Partial<Omit<PaymentLinkRecord, 'slug' | 'url' | 'createdAt'>>): PaymentLinkRecord | undefined {
    const i = _paymentLinks.findIndex((l) => l.slug === slug);
    if (i < 0) return undefined;
    _paymentLinks[i] = { ..._paymentLinks[i], ...updates };
    pushAudit('admin', 'Payment link updated', slug);
    return _paymentLinks[i];
}

function dayStartMs(isoYmd: string): number {
    const [y, m, d] = isoYmd.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
}

/** Active / Paid / Cancelled from row; Expired when still `active` but past expiry date (local day). */
export function getEffectivePaymentLinkDisplayStatus(l: PaymentLinkRecord): PaymentLinkDisplayStatus {
    if (l.linkStatus === 'cancelled') return 'Cancelled';
    if (l.linkStatus === 'paid') return 'Paid';
    const today = dayStartMs(new Date().toISOString().slice(0, 10));
    const exp = dayStartMs(l.expiryDate);
    if (today > exp) return 'Expired';
    return 'Active';
}

/** Hours until end of expiry day; negative if past. */
export function getHoursToExpiryEnd(expiryDate: string): number {
    const end = new Date(`${expiryDate.slice(0, 10)}T23:59:59`).getTime();
    return (end - Date.now()) / 3600000;
}

/** Read-only snapshot for the “webhook” panel (latest paid link with txn). */
export function getLatestLinkWebhookSnapshot(): {
    transactionId: string;
    linkStatus: LinkPaymentStatus;
    mode: LinkGatewayMode;
    linkSlug: string;
    bookingSlug: string;
    paidAt: string;
} | null {
    const paid = _paymentLinks.filter((l) => l.linkStatus === 'paid' && l.transactionId);
    if (paid.length === 0) return null;
    paid.sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? '') || b.createdAt.localeCompare(a.createdAt));
    const l = paid[0];
    return {
        transactionId: l.transactionId!,
        linkStatus: 'Success',
        mode: l.paymentMode ?? 'UPI',
        linkSlug: l.slug,
        bookingSlug: l.bookingSlug,
        paidAt: l.paidAt ?? l.expiryDate,
    };
}

/** Completes payment: ledger row + link row + global webhook snapshot (demo). */
export function recordPaymentLinkPaid(
    slug: string,
    input: { transactionId: string; mode: LinkGatewayMode; paidAt?: string }
): { ok: true } | { ok: false; error: string } {
    const link = getPaymentLinkBySlug(slug);
    if (!link) return { ok: false, error: 'Link not found.' };
    if (link.linkStatus !== 'active') return { ok: false, error: 'Only active links can be marked paid.' };
    if (getEffectivePaymentLinkDisplayStatus(link) === 'Expired') return { ok: false, error: 'This link has expired.' };

    const paidDate = input.paidAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
    const payMode: PaymentMode = input.mode === 'UPI' ? 'UPI' : 'Bank';
    const receipt = `RCP-LK-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`.slice(0, 32);
    const res = addPayment({
        bookingSlug: link.bookingSlug,
        milestoneId: link.milestoneId,
        amount: link.amount,
        date: paidDate,
        mode: payMode,
        receiptNumber: receipt,
        status: 'Completed',
        source: 'Payment Link',
        paymentLinkSlug: link.slug,
        transactionId: input.transactionId.trim(),
    });
    if (!res.ok) return { ok: false, error: res.error };

    updatePaymentLink(slug, {
        linkStatus: 'paid',
        transactionId: input.transactionId.trim(),
        paymentMode: input.mode,
        paidAt: paidDate,
    });
    setLinkCompletion({
        transactionId: input.transactionId.trim(),
        status: 'Success',
        mode: input.mode,
    });
    pushAudit('admin', 'Payment link settled', slug);
    return { ok: true };
}

export function cancelPaymentLink(slug: string): { ok: true } | { ok: false; error: string } {
    const link = getPaymentLinkBySlug(slug);
    if (!link) return { ok: false, error: 'Link not found.' };
    if (link.linkStatus === 'paid') return { ok: false, error: 'Paid links cannot be cancelled.' };
    if (link.linkStatus === 'cancelled') return { ok: false, error: 'Link is already cancelled.' };
    updatePaymentLink(slug, { linkStatus: 'cancelled' });
    pushAudit('admin', 'Payment link cancelled', slug);
    return { ok: true };
}

/** Removes the row from the in-memory list. Paid links are kept for audit (cannot delete). */
export function deletePaymentLink(slug: string): { ok: true } | { ok: false; error: string } {
    const i = _paymentLinks.findIndex((l) => l.slug === slug);
    if (i < 0) return { ok: false, error: 'Link not found.' };
    if (_paymentLinks[i].linkStatus === 'paid') {
        return { ok: false, error: 'Paid links cannot be deleted.' };
    }
    _paymentLinks = _paymentLinks.filter((l) => l.slug !== slug);
    pushAudit('admin', 'Payment link deleted', slug);
    return { ok: true };
}

export function bulkDeletePaymentLinks(slugs: string[]): { deleted: number; skipped: { slug: string; error: string }[] } {
    const skipped: { slug: string; error: string }[] = [];
    let deleted = 0;
    for (const slug of [...new Set(slugs.filter(Boolean))]) {
        const res = deletePaymentLink(slug);
        if (res.ok) deleted++;
        else skipped.push({ slug, error: res.error });
    }
    return { deleted, skipped };
}

export function getLinkCompletion(): PaymentCompletionInfo {
    return { ..._linkCompletion };
}

export function setLinkCompletion(info: PaymentCompletionInfo): void {
    _linkCompletion = { ...info };
    pushAudit('admin', 'Payment completion updated', info.transactionId);
}

export function getReportsSummary(): { totalRevenue: number; collectionEfficiency: number; paidTotal: number; pendingTotal: number } {
    const paidTotal = _payments.filter((p) => p.status === 'Completed').reduce((s, p) => s + p.amount, 0);
    const pendingTotal = _payments.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
    const bookedValue = _bookings.reduce((s, b) => s + b.unitPrice, 0);
    const totalRevenue = paidTotal;
    const collectionEfficiency = bookedValue > 0 ? Math.round((paidTotal / bookedValue) * 1000) / 10 : 0;
    return { totalRevenue, collectionEfficiency, paidTotal, pendingTotal };
}

export function getReminderEnabled(): boolean {
    return _reminderEnabled;
}

export function setReminderEnabled(v: boolean): void {
    _reminderEnabled = v;
    pushAudit('admin', `Reminders ${v ? 'ON' : 'OFF'}`, '');
}

export function getPaymentTokenDisplay(): string {
    return 'pk_live_••••••••••••8f2a';
}

export function getMaskedRefs(): { last4: string; upiRef: string } {
    return { last4: '4242', upiRef: 'user@okaxis' };
}

export function getAuditLog(): AuditLogEntry[] {
    return [..._audit].reverse();
}

export function getAuditBySlug(slug: string): AuditLogEntry | undefined {
    return _audit.find((a) => a.slug === slug);
}

export function pushAudit(actor: string, action: string, meta?: string): void {
    const slug = `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    _audit.push({
        slug,
        at: new Date().toISOString(),
        actor,
        action,
        meta,
    });
}

export function getUserConsent(): boolean {
    return _userConsent;
}

export function setUserConsent(v: boolean): void {
    _userConsent = v;
    if (v) pushAudit('user', 'Consent recorded', 'Terms acknowledged');
}
