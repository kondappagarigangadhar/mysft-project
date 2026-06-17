/**
 * Pure validation helpers for Booking & Payment company-admin forms (inline errors).
 */

export function normalizePhoneDigits(input: string): string {
    return input.replace(/\D/g, '');
}

export type BookingFormField =
    | 'leadId'
    | 'assignedTo'
    | 'customerName'
    | 'phone'
    | 'projectName'
    | 'unitId'
    | 'unitPrice'
    | 'bookingDate'
    | 'advanceAmount';

export function validateBookingForm(input: {
    leadId: string;
    assignedTo: string;
    customerName: string;
    phone: string;
    projectName: string;
    unitId: string;
    unitPrice: string;
    bookingDate: string;
    unitAllowedForProject: boolean;
    /** Optional — advance collected at booking (create flow). Empty = skip. */
    advanceAmount?: string;
}): Partial<Record<BookingFormField, string>> {
    const e: Partial<Record<BookingFormField, string>> = {};

    if (!input.leadId.trim()) {
        e.leadId = 'Select a lead.';
    }

    if (!input.assignedTo.trim()) {
        e.assignedTo = 'Select assignee.';
    }

    const name = input.customerName.trim();
    if (!name) {
        e.customerName = 'Customer name is required.';
    } else if (name.length < 2) {
        e.customerName = 'Enter at least 2 characters.';
    } else if (name.length > 120) {
        e.customerName = 'Use at most 120 characters.';
    }

    const digits = normalizePhoneDigits(input.phone);
    if (digits.length < 10 || digits.length > 15) {
        e.phone = 'Enter a valid phone number (10–15 digits).';
    }

    if (!input.projectName.trim()) {
        e.projectName = 'Select a project.';
    }

    if (!input.unitId.trim()) {
        e.unitId = 'Select an available unit.';
    } else if (!input.unitAllowedForProject) {
        e.unitId = 'This unit is not available for the selected project.';
    }

    const price = Number(input.unitPrice);
    if (!Number.isFinite(price) || price <= 0) {
        e.unitPrice = 'Enter a valid amount greater than zero.';
    } else if (price > 999_999_999_999) {
        e.unitPrice = 'Amount is too large.';
    }

    const advRaw = input.advanceAmount?.trim() ?? '';
    if (advRaw) {
        const adv = Number(advRaw);
        if (!Number.isFinite(adv) || adv <= 0) {
            e.advanceAmount = 'Enter a valid advance amount greater than zero.';
        } else if (!Number.isFinite(price) || price <= 0) {
            /* unit price error already set */
        } else if (adv > price) {
            e.advanceAmount = 'Advance cannot exceed total booking amount.';
        }
    }

    if (!input.bookingDate.trim()) {
        e.bookingDate = 'Select a booking date.';
    } else {
        const d = new Date(`${input.bookingDate.slice(0, 10)}T12:00:00`);
        if (Number.isNaN(d.getTime())) {
            e.bookingDate = 'Invalid date.';
        }
    }

    return e;
}

export type PaymentFormField =
    | 'bookingSlug'
    | 'milestoneId'
    | 'amount'
    | 'payDate'
    | 'receipt'
    | 'plan'
    | 'transactionId'
    | 'payStatus';

const PAYMENT_STATUSES = ['Completed', 'Pending', 'Failed'] as const;

export function validatePaymentForm(input: {
    bookingSlug: string;
    milestoneId: string;
    amount: string;
    payDate: string;
    receipt: string;
    hasMilestoneOptions: boolean;
    /** Bank / UPI / cash reference — optional; auto-generated when empty on save. */
    transactionId?: string;
    /** Ledger status — required on add/edit payment. */
    payStatus?: string;
}): Partial<Record<PaymentFormField, string>> {
    const e: Partial<Record<PaymentFormField, string>> = {};

    if (!input.bookingSlug.trim()) {
        e.bookingSlug = 'Select a booking.';
    }

    const st = input.payStatus?.trim() ?? '';
    if (!st || !PAYMENT_STATUSES.includes(st as (typeof PAYMENT_STATUSES)[number])) {
        e.payStatus = 'Select a payment status.';
    }

    if (!input.hasMilestoneOptions) {
        e.plan = 'No payment plan found for this booking.';
    } else if (!input.milestoneId.trim()) {
        e.milestoneId = 'Select a milestone.';
    }

    const amt = Number(input.amount);
    if (!Number.isFinite(amt) || amt <= 0) {
        e.amount = 'Enter an amount greater than zero.';
    } else if (amt > 999_999_999_999) {
        e.amount = 'Amount is too large.';
    }

    if (!input.payDate.trim()) {
        e.payDate = 'Select a payment date.';
    } else {
        const d = new Date(input.payDate);
        if (Number.isNaN(d.getTime())) {
            e.payDate = 'Invalid date.';
        } else if (d > new Date()) {
            e.payDate = 'Payment date cannot be in the future.';
        }
    }

    const r = input.receipt.trim();
    if (!r) {
        e.receipt = 'Receipt number is required.';
    } else if (r.length < 3) {
        e.receipt = 'Use at least 3 characters.';
    } else if (r.length > 64) {
        e.receipt = 'Use at most 64 characters.';
    } else if (!/^[\w./-]+$/.test(r)) {
        e.receipt = 'Use letters, numbers, and . / - _ only.';
    }

    const tx = input.transactionId?.trim() ?? '';
    if (tx) {
        if (tx.length < 3) {
            e.transactionId = 'Use at least 3 characters.';
        } else if (tx.length > 80) {
            e.transactionId = 'Use at most 80 characters.';
        } else if (!/^[\w\s./-]+$/.test(tx)) {
            e.transactionId = 'Use letters, numbers, spaces, and . / - _ only.';
        }
    }

    return e;
}

export type PaymentLinkFormField = 'bookingSlug' | 'amount' | 'expiryDate' | 'milestoneId';

export function validatePaymentLinkForm(input: {
    bookingSlug: string;
    amount: string;
    expiryDate: string;
    milestoneId: string;
    hasMilestoneOptions: boolean;
    /** For new links, expiry must be on or after today */
    requireFutureOrTodayExpiry: boolean;
}): Partial<Record<PaymentLinkFormField, string>> {
    const e: Partial<Record<PaymentLinkFormField, string>> = {};

    if (!input.bookingSlug.trim()) {
        e.bookingSlug = 'Select a booking.';
    }

    const amt = Number(input.amount);
    if (!Number.isFinite(amt) || amt <= 0) {
        e.amount = 'Enter an amount greater than zero.';
    } else if (amt > 999_999_999_999) {
        e.amount = 'Amount is too large.';
    }

    if (!input.expiryDate.trim()) {
        e.expiryDate = 'Select an expiry date.';
    } else {
        const exp = new Date(`${input.expiryDate.slice(0, 10)}T12:00:00`);
        if (Number.isNaN(exp.getTime())) {
            e.expiryDate = 'Invalid date.';
        } else if (input.requireFutureOrTodayExpiry) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const ex = new Date(exp);
            ex.setHours(0, 0, 0, 0);
            if (ex < today) {
                e.expiryDate = 'Expiry must be today or a future date.';
            }
        }
    }

    if (!input.hasMilestoneOptions) {
        e.milestoneId = 'No milestones for this booking.';
    } else if (!input.milestoneId.trim()) {
        e.milestoneId = 'Select a milestone.';
    }

    return e;
}

export type ReportFilterField = 'fromDate' | 'toDate';

export function validateReportDateRange(input: { fromDate: string; toDate: string }): Partial<Record<ReportFilterField, string>> {
    const e: Partial<Record<ReportFilterField, string>> = {};

    if (!input.fromDate.trim()) {
        e.fromDate = 'Select a start date.';
    }
    if (!input.toDate.trim()) {
        e.toDate = 'Select an end date.';
    }

    if (e.fromDate || e.toDate) return e;

    const from = new Date(`${input.fromDate}T12:00:00`);
    const to = new Date(`${input.toDate}T12:00:00`);
    if (Number.isNaN(from.getTime())) {
        e.fromDate = 'Invalid start date.';
    }
    if (Number.isNaN(to.getTime())) {
        e.toDate = 'Invalid end date.';
    }
    if (e.fromDate || e.toDate) return e;

    if (from > to) {
        e.fromDate = 'Start date cannot be after end date.';
        e.toDate = 'End date cannot be before start date.';
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (input.toDate > todayStr) {
        e.toDate = 'End date cannot be in the future.';
    }

    return e;
}
